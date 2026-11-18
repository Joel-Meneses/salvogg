/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FlagState, PlayerState, Team } from '../types/game';
import { ARENA_OBSTACLES, GAME_RULES, MAP_CONFIG } from './constants';

export interface BotDecision {
  moveDir: { x: number; z: number };
  useAbility: boolean;
  targetPos?: { x: number; z: number };
}

/**
 * Checks if throwing Luppy's 4m defrost grenade at (tx, tz) would accidentally unfreeze an enemy.
 */
function wouldUnfreezeEnemy(tx: number, tz: number, enemies: PlayerState[], radius: number): boolean {
  return enemies.some(
    (e) => e.isFrozen && Math.hypot(e.position.x - tx, e.position.z - tz) <= radius
  );
}

export function updateBotAI(
  bot: PlayerState,
  allPlayers: PlayerState[],
  flags: FlagState[]
): BotDecision {
  if (bot.isFrozen) {
    return { moveDir: { x: 0, z: 0 }, useAbility: false };
  }

  const isBlue = bot.team === 'blue';
  const ownTerritoryMinZ = isBlue ? MAP_CONFIG.blueZoneMinZ : MAP_CONFIG.centerZ;
  const ownTerritoryMaxZ = isBlue ? MAP_CONFIG.centerZ : MAP_CONFIG.redZoneMaxZ;
  const inOwnTerritory = bot.position.z >= ownTerritoryMinZ && bot.position.z <= ownTerritoryMaxZ;

  const enemyTeam: Team = isBlue ? 'red' : 'blue';
  const teammates = allPlayers.filter((p) => p.team === bot.team && p.id !== bot.id);
  const enemies = allPlayers.filter((p) => p.team === enemyTeam);

  const frozenTeammates = teammates.filter((p) => p.isFrozen);
  const targetEnemyFlags = flags.filter((f) => f.team === enemyTeam && !f.isCaptured);

  let targetX = bot.position.x;
  let targetZ = bot.position.z;
  let shouldTriggerAbility = false;
  let abilityTargetPos: { x: number; z: number } | undefined = undefined;

  // 1. If currently carrying a flag, run back to own territory
  if (bot.carryingFlagId) {
    targetZ = isBlue ? -2 : 2;
    targetX = bot.position.x * 0.7;

    if (bot.character === 'silver' && bot.abilityCooldown <= 0) {
      shouldTriggerAbility = true;
    }
    if (bot.character === 'bobby' && bot.abilityCooldown <= 0) {
      const nearThreat = enemies.some(
        (e) => !e.isFrozen && Math.hypot(e.position.x - bot.position.x, e.position.z - bot.position.z) < 3.2
      );
      if (nearThreat) shouldTriggerAbility = true;
    }
  }
  // 2. High Priority: Rescue frozen teammates ("SALVO!")
  else if (frozenTeammates.length > 0) {
    let nearestAlly = frozenTeammates[0];
    let minDist = Infinity;
    for (const ally of frozenTeammates) {
      const d = Math.hypot(ally.position.x - bot.position.x, ally.position.z - bot.position.z);
      if (d < minDist) {
        minDist = d;
        nearestAlly = ally;
      }
    }

    // If Luppy: throw 4m defrost grenade if within throw range,
    // carefully offsetting away from any frozen enemy so we don't accidentally defrost them!
    if (bot.character === 'luppy' && bot.abilityCooldown <= 0 && minDist <= GAME_RULES.grenadeMaxRange + 2.0 && minDist > 1.3) {
      const blastR = GAME_RULES.grenadeRadius;
      let throwX = nearestAlly.position.x;
      let throwZ = nearestAlly.position.z;

      if (wouldUnfreezeEnemy(throwX, throwZ, enemies, blastR)) {
        // Try offsetting throw center away from nearest frozen enemy while keeping ally inside 4m radius
        const frozenEnemy = enemies.find(
          (e) => e.isFrozen && Math.hypot(e.position.x - throwX, e.position.z - throwZ) <= blastR
        );
        if (frozenEnemy) {
          const awayX = throwX - frozenEnemy.position.x;
          const awayZ = throwZ - frozenEnemy.position.z;
          const awayLen = Math.hypot(awayX, awayZ) || 1;
          const safeX = throwX + (awayX / awayLen) * 2.8;
          const safeZ = throwZ + (awayZ / awayLen) * 2.8;
          if (!wouldUnfreezeEnemy(safeX, safeZ, enemies, blastR)) {
            throwX = safeX;
            throwZ = safeZ;
          } else {
            // Too risky to throw grenade here — walk to touch-rescue instead
            throwX = NaN;
          }
        }
      }

      if (!Number.isNaN(throwX)) {
        shouldTriggerAbility = true;
        abilityTargetPos = { x: throwX, z: throwZ };
      }
    }

    // Head towards ally to rescue by touch
    targetX = nearestAlly.position.x;
    targetZ = nearestAlly.position.z;
  }
  // 3. Role-specific behavior
  else {
    switch (bot.character) {
      case 'bobby': {
        // Bobby (Escudeiro): Defends own territory and intercepts invaders; uses 6s immunity shield
        const invaders = enemies.filter(
          (e) => !e.isFrozen && (isBlue ? e.position.z < 0 : e.position.z > 0)
        );

        if (invaders.length > 0) {
          const priorityInvader = invaders.find((inv) => inv.carryingFlagId) || invaders[0];
          targetX = priorityInvader.position.x;
          targetZ = priorityInvader.position.z;

          const distToInvader = Math.hypot(targetX - bot.position.x, targetZ - bot.position.z);
          if (distToInvader < 3.0 && bot.abilityCooldown <= 0) {
            shouldTriggerAbility = true;
          }
        } else {
          // Occasional offensive push with shield if ready and defending is quiet
          if (bot.abilityCooldown <= 0 && targetEnemyFlags.length > 0 && Math.abs(bot.position.z) < 4) {
            shouldTriggerAbility = true;
          }
          targetZ = isBlue ? -9 : 9;
          targetX = Math.sin(Date.now() * 0.0008 + (bot.team === 'blue' ? 0 : Math.PI)) * 5;
        }
        break;
      }

      case 'silver': {
        // Silver (Velocista): Invades enemy field to capture flags with 5m dash
        if (targetEnemyFlags.length > 0) {
          const availableFlags = targetEnemyFlags.filter((f) => !f.isCarried);
          const targetFlag = availableFlags[0] || targetEnemyFlags[0];

          targetX = targetFlag.currentPosition.x;
          targetZ = targetFlag.currentPosition.z;

          if (!inOwnTerritory && bot.abilityCooldown <= 0) {
            const threateningDefender = enemies.some(
              (e) => !e.isFrozen && Math.hypot(e.position.x - bot.position.x, e.position.z - bot.position.z) < 4.5
            );
            if (threateningDefender) {
              shouldTriggerAbility = true;
            }
          }
        } else {
          targetZ = isBlue ? 5 : -5;
        }
        break;
      }

      case 'luppy': {
        // Luppy (Suporte): Patrols midfield ready to rescue allies & escort flag carriers
        const friendlyCarrier = teammates.find((t) => t.carryingFlagId && !t.isFrozen);
        if (friendlyCarrier) {
          // Escort carrier near midfield
          targetX = friendlyCarrier.position.x * 0.8;
          targetZ = isBlue ? -2 : 2;
        } else if (targetEnemyFlags.length > 0) {
          // Support midfield / flank
          const targetFlag = targetEnemyFlags[0];
          targetX = targetFlag.currentPosition.x * 0.6 + Math.cos(Date.now() * 0.0008) * 4;
          targetZ = isBlue ? -2.5 : 2.5;
        } else {
          targetZ = isBlue ? -3 : 3;
          targetX = Math.cos(Date.now() * 0.0008) * 6;
        }
        break;
      }
    }
  }

  // Calculate normalized movement vector with smooth arrival
  const dx = targetX - bot.position.x;
  const dz = targetZ - bot.position.z;
  const dist = Math.hypot(dx, dz);

  let moveDir = { x: 0, z: 0 };
  if (dist > 0.2) {
    const arrivalScale = Math.min(1.0, dist / 0.8);
    moveDir = {
      x: (dx / dist) * arrivalScale,
      z: (dz / dist) * arrivalScale,
    };

    // Steer smoothly away from obstacles
    for (const obs of ARENA_OBSTACLES) {
      const obsDx = bot.position.x - obs.x;
      const obsDz = bot.position.z - obs.z;
      const obsDist = Math.hypot(obsDx, obsDz);
      const avoidDist = (obs.halfSize || obs.size) + 0.9;
      if (obsDist < avoidDist && obsDist > 0.01) {
        const factor = (avoidDist - obsDist) / avoidDist;
        moveDir.x += (obsDx / obsDist) * factor * 1.4;
        moveDir.z += (obsDz / obsDist) * factor * 1.4;
      }
    }

    const finalMag = Math.hypot(moveDir.x, moveDir.z);
    if (finalMag > 1.0) {
      moveDir.x /= finalMag;
      moveDir.z /= finalMag;
    }
  }

  return {
    moveDir,
    useAbility: shouldTriggerAbility,
    targetPos: abilityTargetPos,
  };
}
