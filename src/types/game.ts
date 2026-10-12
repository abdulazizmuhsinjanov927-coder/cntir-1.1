export type WeaponCategory = 'rifle' | 'smg' | 'sniper' | 'shotgun' | 'pistol' | 'lmg';

export interface WeaponDef {
  id: string;
  name: string;
  category: WeaponCategory;
  damage: number;
  fireRate: number; // rounds per second
  magazineSize: number;
  maxReserveAmmo: number;
  reloadTime: number; // seconds
  range: number;
  recoil: number;
  accuracy: number;
  bulletSpeed: number; // hitscan speed factor
  zoomFOV: number; // degrees for ADS
  pellets?: number; // for shotgun
  description: string;
}

export interface WeaponSkinDef {
  id: string;
  name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  baseColor: string;
  accentColor: string;
  metalness: number;
  roughness: number;
  emissive?: string;
  patternType: 'tactical' | 'camo' | 'gold' | 'carbon' | 'cyber' | 'digital' | 'crimson' | 'emerald' | 'damascus' | 'lava' | 'anodized' | 'void';
}

export interface CharacterSkinDef {
  id: string;
  name: string;
  role: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  visorGlow?: string;
  modelStyle: 'tactical' | 'desert' | 'arctic' | 'woodland' | 'urban' | 'cyber' | 'stealth' | 'medic' | 'heavy' | 'nomad' | 'infiltrator';
}

export type GameMode = 'tdm' | 'ffa' | 'point' | 'practice';

export interface MapDef {
  id: string;
  name: string;
  tagline: string;
  theme: string;
  description: string;
  ambientLight: number;
  sunColor: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  skyColor: string;
  groundColor: string;
  obstacleCount: number;
  accentColor: string;
  capturePointPos: [number, number, number];
}

export interface PlayerStats {
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  headshots: number;
}

export interface PlayerState {
  id: string;
  name: string;
  team: 'red' | 'blue' | 'ffa';
  characterSkinId: string;
  weaponId: string;
  weaponSkinId: string;
  position: [number, number, number];
  rotation: [number, number, number]; // [pitch, yaw, roll]
  health: number;
  maxHealth: number;
  armor: number;
  isAlive: boolean;
  isShooting: boolean;
  isReloading: boolean;
  isSprinting: boolean;
  isCrouching: boolean;
  isAiming: boolean;
  stats: PlayerStats;
  ping: number;
  isBot?: boolean;
}

export interface RoomInfo {
  id: string;
  name: string;
  mapId: string;
  mode: GameMode;
  maxPlayers: number;
  currentPlayers: number;
  isPrivate: boolean;
  hostId: string;
  state: 'waiting' | 'in_progress' | 'ended';
  matchTimeRemaining: number;
  redScore: number;
  blueScore: number;
  pointOwner: 'neutral' | 'red' | 'blue';
  pointProgress: number; // 0 to 100
}

export interface KillfeedEntry {
  id: string;
  killerName: string;
  killerTeam: 'red' | 'blue' | 'ffa';
  victimName: string;
  victimTeam: 'red' | 'blue' | 'ffa';
  weaponName: string;
  isHeadshot: boolean;
  timestamp: number;
}

export interface HitEffectData {
  position: [number, number, number];
  normal: [number, number, number];
  isFlesh: boolean;
  isHeadshot: boolean;
  damage: number;
}
