/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SceneryTheme = 'beach' | 'desert' | 'city' | 'forest';

export type GameState = 
  | 'TITLE'
  | 'COUNTDOWN'
  | 'RACING'
  | 'FORK_CHOICE'
  | 'CRASHED'
  | 'GAME_OVER'
  | 'VICTORY'
  | 'PAUSED';

export type RadioTrack = 
  | 'MAGICAL_SHOWER'
  | 'PASSING_BREEZE'
  | 'SPLASH_WAVE'
  | 'OFF';

export interface RadioStationInfo {
  id: RadioTrack;
  name: string;
  frequency: string;
  genre: string;
  bpm: number;
  description: string;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
  w: number;
  scale: number;
}

export interface RoadColors {
  sky: string;
  horizon: string;
  fog: string;
  grass: string;
  rumble: string;
  road: string;
  lane: string;
}

export interface RoadsideSpriteItem {
  id: string;
  type: 
    | 'palm_tree'
    | 'palm_cluster'
    | 'cactus'
    | 'red_rock'
    | 'desert_bush'
    | 'skyscraper_small'
    | 'skyscraper_tall'
    | 'neon_sign_outrun'
    | 'neon_sign_sega'
    | 'street_lamp'
    | 'pine_tree'
    | 'pine_tall'
    | 'forest_rock'
    | 'sign_curve_left'
    | 'sign_curve_right'
    | 'checkpoint_arch'
    | 'fork_sign_beach_desert'
    | 'fork_sign_city_forest'
    | 'fork_sign_final'
    | 'fork_divider'
    | 'billboard_outrun'
    | 'billboard_synth'
    | 'billboard_motel'
    | 'billboard_nitro'
    | 'billboard_ferrari'
    | 'roadhouse_diner'
    | 'roadhouse_motel'
    | 'mechanic_shop';
  offset: number; // -1 to 1 is on road, < -1 is left shoulder, > 1 is right shoulder
  scaleMultiplier?: number;
}

export type PowerUpType = 'nitro' | 'time_bonus' | 'radar_clear' | 'super_grip';

export interface MechanicShopItem {
  id: string;
  type: PowerUpType;
  name: string;
  side: 'left' | 'right';
  offset: number;
  collected: boolean;
}

export type NPCType = 'sports_blue' | 'sports_yellow' | 'sports_red' | 'truck' | 'van' | 'coupe_purple' | 'police';

export interface CarNPC {
  id: string;
  type: NPCType;
  offset: number; // horizontal position on road (-0.8 to 0.8)
  z: number;      // absolute world position in distance
  speed: number;  // current speed in world units/sec
  targetOffset?: number; // for lane changing
  width: number;
  height: number;
  isPolice?: boolean;
  sirenPhase?: number;
  pursuitMode?: 'parked' | 'patrol' | 'chase' | 'cooldown';
  alertTimer?: number;
  peelOutTimer?: number;
  parkedSide?: 'left' | 'right';
}

export interface Segment {
  index: number;
  p1: { world: Point3D; screen: ScreenPoint; camera: Point3D };
  p2: { world: Point3D; screen: ScreenPoint; camera: Point3D };
  curve: number;
  hill: number;
  clip: number; // horizon clip line for hill occlusion
  theme: SceneryTheme;
  colors: {
    grass: string;
    rumble: string;
    road: string;
    lane?: string;
  };
  sprites: RoadsideSpriteItem[];
  cars: CarNPC[];
  isCheckpoint?: boolean;
  checkpointStage?: number;
  isFork?: boolean;
  forkChoiceActive?: boolean;
  forkLeftTheme?: SceneryTheme;
  forkRightTheme?: SceneryTheme;
  waterPuddles?: { offset: number; width: number }[];
  skidmarks?: { leftOffset: number; rightOffset: number; alpha: number }[];
  mechanicShop?: MechanicShopItem;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'dust' | 'spark' | 'smoke' | 'speedline' | 'water_splash' | 'debris' | 'brake_smoke' | 'fire' | 'nitro_flame';
  rotation?: number;
  vrot?: number;
}

export interface PlayerState {
  x: number;          // lateral road position (-1 to 1 is road, offroad is < -1 or > 1)
  z: number;          // distance traveled along current road
  speed: number;      // current speed (0 to maxSpeed)
  maxSpeed: number;   // e.g. 12000 (roughly 300 km/h)
  accel: number;
  braking: number;
  decel: number;
  offRoadDecel: number;
  steerAngle: -1 | 0 | 1; // -1 left, 0 center, 1 right
  isBraking: boolean;
  gear: number;       // 1, 2, 3, 4
  rpm: number;        // 0 to 1
  score: number;
  timeRemaining: number; // in seconds
  carsOvertaken: number;
  stage: number;
  theme: SceneryTheme;
  routeHistory: SceneryTheme[];
  crashed: boolean;
  crashTimer: number;
  crashSpinAngle: number;
  screenShake: number;
  wantedLevel: number;        // 0 to 5 stars
  wantedFlashTimer: number;
  cooldownTimer: number;      // timer for reducing wanted level at low speed
  policeProximity: number;    // 0 to 1 proximity (1 is right on player)
  isNearPolice: boolean;
  isPoliceChasing?: boolean;
  collisionsWithNPC: number;
  bustedTimer: number;
  maxWantedReached: number;
  pursuitEvasionTimer: number; // Seconds spent avoiding active police pursuit (7s triggers full evasion)
  evasionSuccessTimer?: number;
  nitroTimer: number;
  superGripTimer: number;
  radarJammerTimer: number;
  activePowerUpName?: string;
  activePowerUpTimer?: number;
}

export interface RouteNode {
  stage: number;
  id: string;
  name: string;
  theme: SceneryTheme;
  leftChoice?: string;
  rightChoice?: string;
  description: string;
}

export interface HighScoreEntry {
  rank: number;
  name: string;
  score: number;
  stage: number;
  route: string;
  date: string;
}
