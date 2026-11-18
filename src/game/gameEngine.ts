/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { sounds } from '../audio/soundSystem';
import {
  CharacterType,
  ExplosionEffect,
  FlagState,
  FloatingNotification,
  GrenadeProjectile,
  MatchStats,
  PlayerState,
  Team,
} from '../types/game';
import { updateBotAI } from './botAI';
import {
  ARENA_OBSTACLES,
  CHARACTERS,
  GAME_RULES,
  INITIAL_FLAGS_CONFIG,
  INITIAL_SPAWNS,
  MAP_CONFIG,
  PLAYER_RADIUS,
} from './constants';

export class GameEngine {
  public players: PlayerState[] = [];
  public flags: FlagState[] = [];
  public projectiles: GrenadeProjectile[] = [];
  public explosions: ExplosionEffect[] = [];
  public notifications: FloatingNotification[] = [];
  public matchTimeRemaining: number = GAME_RULES.matchTimeSeconds;
  public isMatchActive: boolean = false;
  public matchWinner: Team | 'draw' | null = null;
  public humanPlayerId: string = 'player_human';
  public userSelectedTeam: Team = 'blue';
  public userSelectedCharacter: CharacterType = 'silver';

  constructor(userTeam: Team = 'blue', userChar: CharacterType = 'silver') {
    this.userSelectedTeam = userTeam;
    this.userSelectedCharacter = userChar;
    this.initMatch();
  }

  public initMatch() {
    this.matchTimeRemaining = GAME_RULES.matchTimeSeconds;
    this.isMatchActive = true;
    this.matchWinner = null;
    this.projectiles = [];
    this.explosions = [];
    this.notifications = [];

    // Initialize Flags
    this.flags = INITIAL_FLAGS_CONFIG.map((f) => ({
      ...f,
      currentPosition: { ...f.basePosition },
      isCarried: false,
      carrierId: null,
      isCaptured: false,
    }));

    // Initialize 6 Players (3 Blue, 3 Red)
    this.players = [];

    const charTypes: CharacterType[] = ['bobby', 'silver', 'luppy'];

    // Blue Team
    charTypes.forEach((char, index) => {
      const isHuman = this.userSelectedTeam === 'blue' && this.userSelectedCharacter === char;
      const spawn = INITIAL_SPAWNS.blue[index];
      this.players.push({
        id: isHuman ? this.humanPlayerId : `bot_blue_${char}`,
        name: isHuman ? `Você (${CHARACTERS[char].name})` : `Azul ${CHARACTERS[char].name}`,
        team: 'blue',
        character: char,
        isHuman,
        position: { x: spawn.x, y: 0, z: spawn.z },
        velocity: { x: 0, y: 0, z: 0 },
        rotation: 0,
        isFrozen: false,
        frozenTimer: 0,
        isShieldActive: false,
        shieldTimer: 0,
        isDashing: false,
        dashTimer: 0,
        abilityCooldown: 0,
        carryingFlagId: null,
        flagsCaptured: 0,
        playersFrozen: 0,
        alliesRescued: 0,
        enemiesUnfrozenByMistake: 0,
        abilitiesUsed: 0,
      });
    });

    // Red Team
    charTypes.forEach((char, index) => {
      const isHuman = this.userSelectedTeam === 'red' && this.userSelectedCharacter === char;
      const spawn = INITIAL_SPAWNS.red[index];
      this.players.push({
        id: isHuman ? this.humanPlayerId : `bot_red_${char}`,
        name: isHuman ? `Você (${CHARACTERS[char].name})` : `Vermelho ${CHARACTERS[char].name}`,
        team: 'red',
        character: char,
        isHuman,
        position: { x: spawn.x, y: 0, z: spawn.z },
        velocity: { x: 0, y: 0, z: 0 },
        rotation: Math.PI,
        isFrozen: false,
        frozenTimer: 0,
        isShieldActive: false,
        shieldTimer: 0,
        isDashing: false,
        dashTimer: 0,
        abilityCooldown: 0,
        carryingFlagId: null,
        flagsCaptured: 0,
        playersFrozen: 0,
        alliesRescued: 0,
        enemiesUnfrozenByMistake: 0,
        abilitiesUsed: 0,
      });
    });

    sounds.playWhistle();
    this.addNotification('PARTIDA INICIADA!', { x: 0, y: 2.5, z: 0 }, '#FBBF24');
  }

  public getHumanPlayer(): PlayerState | undefined {
    return this.players.find((p) => p.isHuman);
  }

  public addNotification(text: string, pos: { x: number; y: number; z: number }, color: string = '#FFFFFF') {
    this.notifications.push({
      id: Math.random().toString(36).substring(2, 9),
      text,
      position: { ...pos },
      color,
      life: 0,
      maxLife: 1.5,
    });
  }

  public triggerPlayerAbility(playerId: string, targetPos?: { x: number; z: number }) {
    const player = this.players.find((p) => p.id === playerId);
    if (!player || player.isFrozen || player.abilityCooldown > 0) return;

    player.abilitiesUsed++;

    switch (player.character) {
      case 'bobby': {
        // Bobby (Escudeiro): Immune to touch freeze for 6 seconds
        player.isShieldActive = true;
        player.shieldTimer = GAME_RULES.shieldDuration;
        player.abilityCooldown = CHARACTERS.bobby.cooldownSeconds;
        sounds.playShieldActivate();
        this.addNotification('ESCUDO IMUNE (6s)!', player.position, '#F59E0B');
        break;
      }

      case 'silver': {
        // Silver (Velocista): Fast dash of 5 meters forward
        player.isDashing = true;
        player.dashTimer = GAME_RULES.dashDuration;
        player.abilityCooldown = CHARACTERS.silver.cooldownSeconds;
        sounds.playDash();
        this.addNotification('DASH 5m!', player.position, '#06B6D4');

        const dashSpeed = GAME_RULES.dashDistance / GAME_RULES.dashDuration;
        const forwardX = Math.sin(player.rotation);
        const forwardZ = Math.cos(player.rotation);
        player.velocity.x = forwardX * dashSpeed;
        player.velocity.z = forwardZ * dashSpeed;
        break;
      }

      case 'luppy': {
        // Luppy (Suporte): Defrost grenade (4m blast radius)
        player.abilityCooldown = CHARACTERS.luppy.cooldownSeconds;
        sounds.playGrenadeThrow();
        this.addNotification('GRANADA DESCONGELANTE!', player.position, '#38BDF8');

        let destX: number;
        let destZ: number;

        if (targetPos) {
          const dx = targetPos.x - player.position.x;
          const dz = targetPos.z - player.position.z;
          const d = Math.hypot(dx, dz);
          const clampedDist = Math.min(d, GAME_RULES.grenadeMaxRange);
          destX = player.position.x + (dx / (d || 1)) * clampedDist;
          destZ = player.position.z + (dz / (d || 1)) * clampedDist;
        } else {
          const forwardX = Math.sin(player.rotation);
          const forwardZ = Math.cos(player.rotation);
          destX = player.position.x + forwardX * 4.5;
          destZ = player.position.z + forwardZ * 4.5;
        }

        const flightTime = GAME_RULES.grenadeFlightTime;
        const vx = (destX - player.position.x) / flightTime;
        const vz = (destZ - player.position.z) / flightTime;

        this.projectiles.push({
          id: Math.random().toString(36).substring(2, 9),
          team: player.team,
          shooterId: player.id,
          position: { x: player.position.x, y: 1.2, z: player.position.z },
          velocity: { x: vx, y: 4.5, z: vz },
          targetPos: { x: destX, y: 0, z: destZ },
          timeAlive: 0,
          duration: flightTime,
          radius: GAME_RULES.grenadeRadius, // 4.0 meters
        });
        break;
      }
    }
  }

  public update(delta: number, humanInput?: { moveX: number; moveZ: number; useAbility: boolean; mouseWorldTarget?: { x: number; z: number } }) {
    if (!this.isMatchActive) return;

    // 1. Update Match Timer
    this.matchTimeRemaining = Math.max(0, this.matchTimeRemaining - delta);
    if (this.matchTimeRemaining <= 0) {
      this.checkWinCondition(true);
      return;
    }

    // 2. Update Players (Human + Bots)
    for (const player of this.players) {
      if (player.abilityCooldown > 0) {
        player.abilityCooldown = Math.max(0, player.abilityCooldown - delta);
      }

      if (player.isShieldActive) {
        player.shieldTimer -= delta;
        if (player.shieldTimer <= 0) {
          player.isShieldActive = false;
        }
      }

      if (player.isDashing) {
        player.dashTimer -= delta;
        if (player.dashTimer <= 0) {
          player.isDashing = false;
        }
      }

      if (player.isHuman && humanInput) {
        if (!player.isFrozen) {
          const baseSpeed = CHARACTERS[player.character].speed;
          const currentSpeed = player.isDashing ? baseSpeed * 2.5 : baseSpeed;

          if (!player.isDashing) {
            const moveMag = Math.hypot(humanInput.moveX, humanInput.moveZ);
            if (moveMag > 0.05) {
              const normX = humanInput.moveX / moveMag;
              const normZ = humanInput.moveZ / moveMag;
              player.velocity.x = normX * currentSpeed;
              player.velocity.z = normZ * currentSpeed;
              player.rotation = Math.atan2(normX, normZ);
            } else {
              player.velocity.x = 0;
              player.velocity.z = 0;
            }
          }

          if (humanInput.useAbility) {
            const targetPos = humanInput.mouseWorldTarget
              ? { x: humanInput.mouseWorldTarget.x, z: humanInput.mouseWorldTarget.z }
              : undefined;
            this.triggerPlayerAbility(player.id, targetPos);
          }
        } else {
          player.velocity.x = 0;
          player.velocity.z = 0;
        }
      } else if (!player.isHuman) {
        const decision = updateBotAI(player, this.players, this.flags);
        if (!player.isFrozen) {
          const baseSpeed = CHARACTERS[player.character].speed;

          if (!player.isDashing) {
            player.velocity.x = decision.moveDir.x * baseSpeed;
            player.velocity.z = decision.moveDir.z * baseSpeed;

            if (Math.hypot(player.velocity.x, player.velocity.z) > 0.1) {
              player.rotation = Math.atan2(decision.moveDir.x, decision.moveDir.z);
            }
          }

          if (decision.useAbility) {
            this.triggerPlayerAbility(player.id, decision.targetPos);
          }
        } else {
          player.velocity.x = 0;
          player.velocity.z = 0;
        }
      }

      // Apply movement
      player.position.x += player.velocity.x * delta;
      player.position.z += player.velocity.z * delta;

      // Solid obstacle collisions
      this.resolveObstacleCollisions(player);

      // Map boundaries
      const halfW = MAP_CONFIG.width / 2 - 0.7;
      const halfL = MAP_CONFIG.length / 2 - 0.7;
      player.position.x = Math.max(-halfW, Math.min(halfW, player.position.x));
      player.position.z = Math.max(-halfL, Math.min(halfL, player.position.z));
    }

    // Resolve player-player separation
    this.resolvePlayerCollisions();

    // 3. Update Projectiles (Luppy's 4m Defrost Grenade)
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.timeAlive += delta;
      proj.position.x += proj.velocity.x * delta;
      proj.position.z += proj.velocity.z * delta;
      proj.position.y += proj.velocity.y * delta;
      proj.velocity.y -= 15.0 * delta;

      if (proj.timeAlive >= proj.duration || proj.position.y <= 0.2) {
        sounds.playGrenadeExplosion();

        const blastPos = { x: proj.targetPos.x, y: 0.05, z: proj.targetPos.z };
        this.explosions.push({
          id: Math.random().toString(36).substring(2, 9),
          position: blastPos,
          radius: proj.radius,
          life: 0,
          maxLife: 0.5,
          color: '#34D399',
        });

        let alliesFreed = 0;
        let enemiesFreed = 0;
        const shooter = this.players.find((s) => s.id === proj.shooterId);

        // README Rule: Luppy's defrost grenade (4m area) unfreezes ANY frozen player in range — both allies and enemies!
        for (const p of this.players) {
          const dist = Math.hypot(p.position.x - blastPos.x, p.position.z - blastPos.z);
          if (dist <= proj.radius && p.isFrozen) {
            p.isFrozen = false;
            if (p.team === proj.team) {
              alliesFreed++;
              if (shooter) shooter.alliesRescued++;
              sounds.playSalvo();
              this.addNotification('SALVO PELA LUPPY!', p.position, '#10B981');
            } else {
              enemiesFreed++;
              if (shooter) shooter.enemiesUnfrozenByMistake++;
              sounds.playShieldDeflect();
              this.addNotification('OPS! INIMIGO DESCONGELADO!', p.position, '#F59E0B');
            }
          }
        }

        if (alliesFreed === 0 && enemiesFreed === 0) {
          this.addNotification('ÁREA DESCONGELANTE (4m)', blastPos, '#38BDF8');
        }

        this.projectiles.splice(i, 1);
      }
    }

    // 4. Update Explosion Shockwave Rings
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      exp.life += delta;
      if (exp.life >= exp.maxLife) {
        this.explosions.splice(i, 1);
      }
    }

    // 5. Barra-Bandeira Tag & Rescue Mechanics
    this.handlePlayerInteractions();

    // 6. Flag Pickup, Carrying, and Delivery Mechanics
    this.handleFlagMechanics();

    // 7. Update Floating Notifications
    for (let i = this.notifications.length - 1; i >= 0; i--) {
      const notif = this.notifications[i];
      notif.life += delta;
      notif.position.y += delta * 1.2;
      if (notif.life >= notif.maxLife) {
        this.notifications.splice(i, 1);
      }
    }

    // 8. Check Victory condition
    this.checkWinCondition(false);
  }

  private resolveObstacleCollisions(player: PlayerState) {
    const radius = PLAYER_RADIUS;
    for (const obs of ARENA_OBSTACLES) {
      if (obs.type === 'stone') {
        const dx = player.position.x - obs.x;
        const dz = player.position.z - obs.z;
        const dist = Math.hypot(dx, dz);
        const minDist = obs.size + radius;
        if (dist < minDist && dist > 0.0001) {
          const overlap = minDist - dist;
          player.position.x += (dx / dist) * overlap;
          player.position.z += (dz / dist) * overlap;
        }
      } else if (obs.type === 'crate') {
        const halfSize = obs.halfSize || obs.size / 2;
        const closestX = Math.max(obs.x - halfSize, Math.min(obs.x + halfSize, player.position.x));
        const closestZ = Math.max(obs.z - halfSize, Math.min(obs.z + halfSize, player.position.z));

        const dx = player.position.x - closestX;
        const dz = player.position.z - closestZ;
        const dist = Math.hypot(dx, dz);

        if (dist < radius) {
          if (dist > 0.0001) {
            const overlap = radius - dist;
            player.position.x += (dx / dist) * overlap;
            player.position.z += (dz / dist) * overlap;
          } else {
            const left = Math.abs(player.position.x - (obs.x - halfSize));
            const right = Math.abs((obs.x + halfSize) - player.position.x);
            const top = Math.abs(player.position.z - (obs.z - halfSize));
            const bottom = Math.abs((obs.z + halfSize) - player.position.z);
            const min = Math.min(left, right, top, bottom);
            if (min === left) player.position.x = obs.x - halfSize - radius;
            else if (min === right) player.position.x = obs.x + halfSize + radius;
            else if (min === top) player.position.z = obs.z - halfSize - radius;
            else player.position.z = obs.z + halfSize + radius;
          }
        }
      }
    }
  }

  private resolvePlayerCollisions() {
    for (let i = 0; i < this.players.length; i++) {
      for (let j = i + 1; j < this.players.length; j++) {
        const p1 = this.players[i];
        const p2 = this.players[j];
        const dx = p1.position.x - p2.position.x;
        const dz = p1.position.z - p2.position.z;
        const dist = Math.hypot(dx, dz);
        const minDist = PLAYER_RADIUS * 1.8;
        if (dist < minDist && dist > 0.001) {
          const overlap = (minDist - dist) * 0.5;
          const nx = dx / dist;
          const nz = dz / dist;
          p1.position.x += nx * overlap;
          p1.position.z += nz * overlap;
          p2.position.x -= nx * overlap;
          p2.position.z -= nz * overlap;
        }
      }
    }
  }

  private handlePlayerInteractions() {
    for (let i = 0; i < this.players.length; i++) {
      for (let j = i + 1; j < this.players.length; j++) {
        const p1 = this.players[i];
        const p2 = this.players[j];

        const dist = Math.hypot(p1.position.x - p2.position.x, p1.position.z - p2.position.z);
        if (dist > GAME_RULES.tagDistance) continue;

        // SAME TEAM: Rescue Check ("SALVO!")
        if (p1.team === p2.team) {
          if (p1.isFrozen && !p2.isFrozen) {
            p1.isFrozen = false;
            p2.alliesRescued++;
            sounds.playSalvo();
            this.addNotification('SALVO!', p1.position, '#10B981');
          } else if (!p1.isFrozen && p2.isFrozen) {
            p2.isFrozen = false;
            p1.alliesRescued++;
            sounds.playSalvo();
            this.addNotification('SALVO!', p2.position, '#10B981');
          }
          continue;
        }

        // OPPOSING TEAMS: Freeze Tag Check
        if (p1.team !== p2.team) {
          if (p1.isFrozen || p2.isFrozen) continue;

          const avgZ = (p1.position.z + p2.position.z) / 2;
          const isBlueTerritory = avgZ < 0;

          let defender: PlayerState | null = null;
          let invader: PlayerState | null = null;

          if (isBlueTerritory) {
            if (p1.team === 'blue' && p2.team === 'red') {
              defender = p1;
              invader = p2;
            } else if (p2.team === 'blue' && p1.team === 'red') {
              defender = p2;
              invader = p1;
            }
          } else {
            if (p1.team === 'red' && p2.team === 'blue') {
              defender = p1;
              invader = p2;
            } else if (p2.team === 'red' && p1.team === 'blue') {
              defender = p2;
              invader = p1;
            }
          }

          if (defender && invader) {
            // Bobby's 6-second shield gives continuous touch immunity during its duration!
            if (invader.isShieldActive) {
              sounds.playShieldDeflect();
              this.addNotification('IMUNE (ESCUDO)!', invader.position, '#F59E0B');
            } else {
              invader.isFrozen = true;
              defender.playersFrozen++;
              sounds.playFreeze();
              this.addNotification('CONGELADO!', invader.position, '#38BDF8');
              this.dropCarriedFlag(invader);
            }
          }
        }
      }
    }
  }

  private dropCarriedFlag(player: PlayerState) {
    if (!player.carryingFlagId) return;
    const flag = this.flags.find((f) => f.id === player.carryingFlagId);
    if (flag) {
      flag.isCarried = false;
      flag.carrierId = null;
      flag.currentPosition.x = player.position.x;
      flag.currentPosition.z = player.position.z;
      this.addNotification('BANDEIRA DERRUBADA!', flag.currentPosition, '#EF4444');
    }
    player.carryingFlagId = null;
  }

  private handleFlagMechanics() {
    for (const flag of this.flags) {
      if (flag.isCaptured) continue;

      if (flag.isCarried && flag.carrierId) {
        const carrier = this.players.find((p) => p.id === flag.carrierId);
        if (carrier && !carrier.isFrozen) {
          flag.currentPosition.x = carrier.position.x;
          flag.currentPosition.y = 1.1;
          flag.currentPosition.z = carrier.position.z;

          const reachedHome = carrier.team === 'blue' ? carrier.position.z <= 0 : carrier.position.z >= 0;

          if (reachedHome) {
            flag.isCaptured = true;
            flag.isCarried = false;
            flag.carrierId = null;
            carrier.carryingFlagId = null;
            carrier.flagsCaptured++;

            sounds.playFlagScored();
            const teamName = carrier.team === 'blue' ? 'TIME AZUL' : 'TIME VERMELHO';
            const teamColor = carrier.team === 'blue' ? '#3B82F6' : '#EF4444';
            this.addNotification(`PONTO PARA O ${teamName}!`, { x: 0, y: 3, z: 0 }, teamColor);
          }
        } else if (carrier && carrier.isFrozen) {
          this.dropCarriedFlag(carrier);
        }
      } else {
        for (const player of this.players) {
          if (player.isFrozen || player.carryingFlagId) continue;

          if (player.team !== flag.team) {
            const dist = Math.hypot(
              player.position.x - flag.currentPosition.x,
              player.position.z - flag.currentPosition.z
            );

            if (dist <= GAME_RULES.flagPickupDistance) {
              flag.isCarried = true;
              flag.carrierId = player.id;
              player.carryingFlagId = flag.id;

              sounds.playFlagGrab();
              this.addNotification('PEGOU A BANDEIRA!', player.position, '#FBBF24');
              break;
            }
          } else {
            const distToBase = Math.hypot(
              flag.currentPosition.x - flag.basePosition.x,
              flag.currentPosition.z - flag.basePosition.z
            );
            if (distToBase > 1.5) {
              const distToPlayer = Math.hypot(
                player.position.x - flag.currentPosition.x,
                player.position.z - flag.currentPosition.z
              );
              if (distToPlayer <= GAME_RULES.flagPickupDistance) {
                flag.currentPosition = { ...flag.basePosition };
                sounds.playFlagGrab();
                this.addNotification('BANDEIRA RECUPERADA!', flag.basePosition, '#10B981');
              }
            }
          }
        }
      }
    }
  }

  private checkWinCondition(isTimeUp: boolean) {
    const blueCaptured = this.flags.filter((f) => f.team === 'red' && f.isCaptured).length;
    const redCaptured = this.flags.filter((f) => f.team === 'blue' && f.isCaptured).length;

    if (blueCaptured >= GAME_RULES.targetFlagsToWin) {
      this.finishMatch('blue');
    } else if (redCaptured >= GAME_RULES.targetFlagsToWin) {
      this.finishMatch('red');
    } else if (isTimeUp) {
      if (blueCaptured > redCaptured) {
        this.finishMatch('blue');
      } else if (redCaptured > blueCaptured) {
        this.finishMatch('red');
      } else {
        this.finishMatch('draw');
      }
    }
  }

  private finishMatch(winner: Team | 'draw') {
    this.isMatchActive = false;
    this.matchWinner = winner;
    sounds.playWhistle();
    sounds.playFlagScored();
  }

  public getMatchStats(): MatchStats {
    const blueCaptured = this.flags.filter((f) => f.team === 'red' && f.isCaptured).length;
    const redCaptured = this.flags.filter((f) => f.team === 'blue' && f.isCaptured).length;

    let mvp = this.players[0];
    let maxScore = -1;
    for (const p of this.players) {
      const score = p.flagsCaptured * 100 + p.alliesRescued * 40 + p.playersFrozen * 30 + p.abilitiesUsed * 5;
      if (score > maxScore) {
        maxScore = score;
        mvp = p;
      }
    }

    return {
      winner: this.matchWinner || 'draw',
      blueFlagsCaptured: blueCaptured,
      redFlagsCaptured: redCaptured,
      matchDurationSeconds: GAME_RULES.matchTimeSeconds - this.matchTimeRemaining,
      mvpPlayerId: mvp ? mvp.id : '',
      players: this.players,
    };
  }
}
