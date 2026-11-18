/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharacterDef, CharacterType } from '../types/game';

export const MAP_CONFIG = {
  width: 26, // X dimension (-13 to +13)
  length: 36, // Z dimension (-18 to +18)
  centerZ: 0,
  blueZoneMinZ: -18,
  blueZoneMaxZ: 0,
  redZoneMinZ: 0,
  redZoneMaxZ: 18,
  blueBaseZ: -14,
  redBaseZ: 14,
};

export const CHARACTERS: Record<CharacterType, CharacterDef> = {
  bobby: {
    id: 'bobby',
    name: 'Bobby',
    role: 'Escudeiro (Defesa)',
    roleDescription: 'Escudeiro resistente da equipe. Especialista em proteger o território e romper marcações com imunidade a toque.',
    abilityName: 'Escudo Imune (6s)',
    abilityDescription: 'Fica imune a ser congelado por toque durante 6 segundos, podendo invadir ou defender sem risco.',
    cooldownSeconds: 9,
    speed: 4.8,
    primaryColor: '#3B82F6',
    secondaryColor: '#F59E0B',
    avatarIcon: '🛡️',
  },
  silver: {
    id: 'silver',
    name: 'Silver',
    role: 'Velocista (Ataque)',
    roleDescription: 'Corredor ágil do time. Especialista em invadir o campo adversário e escapar rapidamente com a bandeira.',
    abilityName: 'Dash 5 Metros',
    abilityDescription: 'Executa um dash rápido de 5 metros para frente para atravessar defensores e retornar à base.',
    cooldownSeconds: 7,
    speed: 5.6,
    primaryColor: '#10B981',
    secondaryColor: '#06B6D4',
    avatarIcon: '⚡',
  },
  luppy: {
    id: 'luppy',
    name: 'Luppy',
    role: 'Suporte (Resgate)',
    roleDescription: 'Suporte tático de resgate. Lança granadas descongelantes de longo alcance para libertar aliados.',
    abilityName: 'Granada Descongelante (4m)',
    abilityDescription: 'Lança granada descongelante (área de 4m). Atenção: se mal posicionada, pode descongelar inimigos também!',
    cooldownSeconds: 8,
    speed: 5.0,
    primaryColor: '#8B5CF6',
    secondaryColor: '#38BDF8',
    avatarIcon: '❄️',
  },
};

export const INITIAL_FLAGS_CONFIG = [
  // Blue flags (owned by Blue, stationed in Blue territory)
  { id: 'flag_blue_1', team: 'blue' as const, basePosition: { x: -6, y: 0, z: -14 } },
  { id: 'flag_blue_2', team: 'blue' as const, basePosition: { x: 0, y: 0, z: -15 } },
  { id: 'flag_blue_3', team: 'blue' as const, basePosition: { x: 6, y: 0, z: -14 } },

  // Red flags (owned by Red, stationed in Red territory)
  { id: 'flag_red_1', team: 'red' as const, basePosition: { x: -6, y: 0, z: 14 } },
  { id: 'flag_red_2', team: 'red' as const, basePosition: { x: 0, y: 0, z: 15 } },
  { id: 'flag_red_3', team: 'red' as const, basePosition: { x: 6, y: 0, z: 14 } },
];

export const INITIAL_SPAWNS = {
  blue: [
    { x: -5, y: 0, z: -8, character: 'bobby' as CharacterType },
    { x: 0, y: 0, z: -7, character: 'silver' as CharacterType },
    { x: 5, y: 0, z: -8, character: 'luppy' as CharacterType },
  ],
  red: [
    { x: -5, y: 0, z: 8, character: 'bobby' as CharacterType },
    { x: 0, y: 0, z: 7, character: 'silver' as CharacterType },
    { x: 5, y: 0, z: 8, character: 'luppy' as CharacterType },
  ],
};

export const PLAYER_RADIUS = 0.45;

export interface ObstacleDef {
  id: string;
  x: number;
  z: number;
  type: 'crate' | 'stone';
  size: number;
  halfSize?: number;
}

export const ARENA_OBSTACLES: ObstacleDef[] = [
  // Center lane obstacles
  { id: 'obs_1', x: -5, z: -3, type: 'crate', size: 1.6, halfSize: 0.8 },
  { id: 'obs_2', x: 5, z: 3, type: 'crate', size: 1.6, halfSize: 0.8 },
  { id: 'obs_3', x: -7, z: 2, type: 'stone', size: 1.0 },
  { id: 'obs_4', x: 7, z: -2, type: 'stone', size: 1.0 },

  // Blue defense obstacles
  { id: 'obs_5', x: -3, z: -10, type: 'stone', size: 1.0 },
  { id: 'obs_6', x: 3, z: -10, type: 'crate', size: 1.6, halfSize: 0.8 },
  { id: 'obs_7', x: -8, z: -8, type: 'crate', size: 1.6, halfSize: 0.8 },
  { id: 'obs_8', x: 8, z: -8, type: 'stone', size: 1.0 },

  // Red defense obstacles
  { id: 'obs_9', x: -3, z: 10, type: 'crate', size: 1.6, halfSize: 0.8 },
  { id: 'obs_10', x: 3, z: 10, type: 'stone', size: 1.0 },
  { id: 'obs_11', x: -8, z: 8, type: 'stone', size: 1.0 },
  { id: 'obs_12', x: 8, z: 8, type: 'crate', size: 1.6, halfSize: 0.8 },
];

export const GAME_RULES = {
  tagDistance: 1.25,
  flagPickupDistance: 1.3,
  flagDeliveryDistanceToCenter: 0.5,
  targetFlagsToWin: 3,
  matchTimeSeconds: 180,
  dashDistance: 5.0, // Silver: 5 meters forward per README
  dashDuration: 0.45,
  grenadeMaxRange: 6.5, // Throw range
  grenadeRadius: 4.0, // Luppy: 4m defrosting area per README
  grenadeFlightTime: 0.55,
  shieldDuration: 6.0, // Bobby: 6 seconds touch immunity per README
};
