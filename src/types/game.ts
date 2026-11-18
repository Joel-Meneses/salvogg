/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Team = 'blue' | 'red';

export type CharacterType = 'bobby' | 'silver' | 'luppy';

export interface CharacterDef {
  id: CharacterType;
  name: string;
  role: string;
  roleDescription: string;
  abilityName: string;
  abilityDescription: string;
  cooldownSeconds: number;
  speed: number;
  primaryColor: string;
  secondaryColor: string;
  avatarIcon: string;
}

export interface PlayerState {
  id: string;
  name: string;
  team: Team;
  character: CharacterType;
  isHuman: boolean;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  rotation: number;
  isFrozen: boolean;
  frozenTimer: number;
  isShieldActive: boolean;
  shieldTimer: number;
  isDashing: boolean;
  dashTimer: number;
  abilityCooldown: number;
  carryingFlagId: string | null;
  // Stats
  flagsCaptured: number;
  playersFrozen: number;
  alliesRescued: number;
  enemiesUnfrozenByMistake: number;
  abilitiesUsed: number;
}

export interface FlagState {
  id: string;
  team: Team; // which team owns this flag
  basePosition: { x: number; y: number; z: number };
  currentPosition: { x: number; y: number; z: number };
  isCarried: boolean;
  carrierId: string | null;
  isCaptured: boolean;
}

export interface GrenadeProjectile {
  id: string;
  team: Team;
  shooterId: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  targetPos: { x: number; y: number; z: number };
  timeAlive: number;
  duration: number;
  radius: number;
}

export interface ExplosionEffect {
  id: string;
  position: { x: number; y: number; z: number };
  radius: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface FloatingNotification {
  id: string;
  text: string;
  position: { x: number; y: number; z: number };
  color: string;
  life: number;
  maxLife: number;
}

export type GameState = 'menu' | 'character_select' | 'playing' | 'paused' | 'game_over';

export interface MatchStats {
  winner: Team | 'draw';
  blueFlagsCaptured: number;
  redFlagsCaptured: number;
  matchDurationSeconds: number;
  mvpPlayerId: string;
  players: PlayerState[];
}
