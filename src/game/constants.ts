/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SceneryTheme, RouteNode, RadioTrack, RadioStationInfo } from '../types';

export const CANVAS_WIDTH = 640;
export const CANVAS_HEIGHT = 480;

export const ROAD_WIDTH = 2000;
export const SEGMENT_LENGTH = 200;
export const RUMBLE_LENGTH = 3;
export const LANES = 3;

export const FIELD_OF_VIEW = 100;
export const CAMERA_HEIGHT = 1000;
export const CAMERA_DEPTH = 1 / Math.tan((FIELD_OF_VIEW / 2) * Math.PI / 180);
export const DRAW_DISTANCE = 300;

export const MAX_SPEED = 12000; // ~300 km/h
export const ACCELERATION = MAX_SPEED / 5;
export const BRAKING = -MAX_SPEED * 1.2;
export const NATURAL_DECEL = -MAX_SPEED / 6;
export const OFFROAD_DECEL = -MAX_SPEED * 0.8;
export const OFFROAD_LIMIT = MAX_SPEED / 4;
export const CENTRIFUGAL_FORCE = 0.35;

export const STAGE_SEGMENTS = 600; // Segments per stage
export const FORK_SEGMENT_OFFSET = 80; // Starts 80 segments before stage end
export const TOTAL_STAGES = 5;

export const INITIAL_TIME = 75; // seconds
export const CHECKPOINT_TIME_BONUS = 45; // seconds added per checkpoint

// OutRun Route Tree: 5 Stages with 2 choices per checkpoint (1 -> 2 -> 3 -> 4 -> 5 endpoints)
export const ROUTE_NODES: Record<string, RouteNode> = {
  stage1_beach: {
    stage: 1,
    id: 'stage1_beach',
    name: 'COCONUT BEACH',
    theme: 'beach',
    leftChoice: 'stage2_desert',
    rightChoice: 'stage2_city',
    description: 'Golden sands, azure ocean waves & sunset palm breeze',
  },
  stage2_desert: {
    stage: 2,
    id: 'stage2_desert',
    name: 'DESERT CANYON',
    theme: 'desert',
    leftChoice: 'stage3_forest',
    rightChoice: 'stage3_city',
    description: 'Towering red rock mesas & giant saguaro cacti',
  },
  stage2_city: {
    stage: 2,
    id: 'stage2_city',
    name: 'NEON METROPOLIS',
    theme: 'city',
    leftChoice: 'stage3_city',
    rightChoice: 'stage3_beach',
    description: 'Gleaming skyscrapers, retro billboard signs & night lights',
  },
  stage3_forest: {
    stage: 3,
    id: 'stage3_forest',
    name: 'PINE MOUNTAINS',
    theme: 'forest',
    leftChoice: 'stage4_desert',
    rightChoice: 'stage4_city',
    description: 'Lush evergreen pines, mountain passes & cool misty air',
  },
  stage3_city: {
    stage: 3,
    id: 'stage3_city',
    name: 'BAY VIEW FREEWAY',
    theme: 'city',
    leftChoice: 'stage4_city',
    rightChoice: 'stage4_beach',
    description: 'Coastal expressway flanked by high-rises and neon lights',
  },
  stage3_beach: {
    stage: 3,
    id: 'stage3_beach',
    name: 'PACIFIC COASTWAY',
    theme: 'beach',
    leftChoice: 'stage4_beach',
    rightChoice: 'stage4_forest',
    description: 'Dramatic ocean cliffs, sunset reflections & beach resorts',
  },
  stage4_desert: {
    stage: 4,
    id: 'stage4_desert',
    name: 'DEATH VALLEY SUNSET',
    theme: 'desert',
    leftChoice: 'stage5_final_a',
    rightChoice: 'stage5_final_b',
    description: 'Blazing orange sands with heat shimmer on the horizon',
  },
  stage4_city: {
    stage: 4,
    id: 'stage4_city',
    name: 'MIDNIGHT DOWNTOWN',
    theme: 'city',
    leftChoice: 'stage5_final_b',
    rightChoice: 'stage5_final_c',
    description: 'Urban canyons with pulsing electronic synthwave billboards',
  },
  stage4_beach: {
    stage: 4,
    id: 'stage4_beach',
    name: 'PALM SHORE EXPRESS',
    theme: 'beach',
    leftChoice: 'stage5_final_c',
    rightChoice: 'stage5_final_d',
    description: 'Long sweeping turns under glowing evening clouds',
  },
  stage4_forest: {
    stage: 4,
    id: 'stage4_forest',
    name: 'ALPINE SUMMIT',
    theme: 'forest',
    leftChoice: 'stage5_final_d',
    rightChoice: 'stage5_final_e',
    description: 'High altitude mountain pine road with hairpin curves',
  },
  stage5_final_a: {
    stage: 5,
    id: 'stage5_final_a',
    name: 'GOAL A: TROPICAL PARADISE',
    theme: 'beach',
    description: 'Grand finish overlooking a golden ocean sunset!',
  },
  stage5_final_b: {
    stage: 5,
    id: 'stage5_final_b',
    name: 'GOAL B: CASINO BOULEVARD',
    theme: 'city',
    description: 'Grand finish amidst glittering neon lights and fireworks!',
  },
  stage5_final_c: {
    stage: 5,
    id: 'stage5_final_c',
    name: 'GOAL C: OASIS VALLEY',
    theme: 'desert',
    description: 'Grand finish by a crystal desert spring oasis!',
  },
  stage5_final_d: {
    stage: 5,
    id: 'stage5_final_d',
    name: 'GOAL D: CRYSTAL PEAKS',
    theme: 'forest',
    description: 'Grand finish at the summit overlooking the mountain sea!',
  },
  stage5_final_e: {
    stage: 5,
    id: 'stage5_final_e',
    name: 'GOAL E: SUNSET HORIZON',
    theme: 'beach',
    description: 'Legendary OutRun ending with endless golden shores!',
  },
};

export const THEME_PALETTES: Record<SceneryTheme, {
  skyStops: [number, string][];
  skyTop: string;
  skyMid: string;
  skyBot: string;
  sunColor: string;
  sunGradBot: string;
  sunHalo: string;
  mountainDark: string;
  mountainLight: string;
  mountainAccent: string;
  roadDark: string;
  roadLight: string;
  rumbleDark: string;
  rumbleLight: string;
  grassDark: string;
  grassLight: string;
  laneColor: string;
  fogColor: string;
  horizonColor: string;
}> = {
  beach: {
    skyStops: [
      [0, '#000033'],
      [0.3, '#483D8B'],
      [0.6, '#FF69B4'],
      [0.9, '#FF8C00'],
      [1.0, '#FFD700'],
    ],
    skyTop: '#000033',
    skyMid: '#FF69B4',
    skyBot: '#FFD700',
    sunColor: '#FFD700',
    sunGradBot: '#FF8C00',
    sunHalo: 'rgba(255, 140, 0, 0.65)',
    mountainDark: '#1a0033',
    mountainLight: '#0d001a',
    mountainAccent: '#6b21a8',
    roadDark: '#333333',
    roadLight: '#444444',
    rumbleDark: '#ff0000',
    rumbleLight: '#ffffff',
    grassDark: '#004d00',
    grassLight: '#006400',
    laneColor: '#ffffff',
    fogColor: '#FF8C00',
    horizonColor: '#38bdf8',
  },
  desert: {
    skyStops: [
      [0, '#1c0522'],
      [0.35, '#581c87'],
      [0.65, '#dc2626'],
      [0.9, '#ea580c'],
      [1.0, '#fde047'],
    ],
    skyTop: '#1c0522',
    skyMid: '#dc2626',
    skyBot: '#fde047',
    sunColor: '#fef08a',
    sunGradBot: '#f97316',
    sunHalo: 'rgba(249, 115, 22, 0.55)',
    mountainDark: '#2e1065',
    mountainLight: '#431407',
    mountainAccent: '#b45309',
    roadDark: '#27272a',
    roadLight: '#3f3f46',
    rumbleDark: '#ea580c',
    rumbleLight: '#fef08a',
    grassDark: '#78350f',
    grassLight: '#92400e',
    laneColor: '#ffffff',
    fogColor: '#ea580c',
    horizonColor: '#f59e0b',
  },
  city: {
    skyStops: [
      [0, '#030712'],
      [0.35, '#0f172a'],
      [0.65, '#3b0764'],
      [0.9, '#701a75'],
      [1.0, '#06b6d4'],
    ],
    skyTop: '#030712',
    skyMid: '#3b0764',
    skyBot: '#06b6d4',
    sunColor: '#ec4899',
    sunGradBot: '#a855f7',
    sunHalo: 'rgba(236, 72, 153, 0.5)',
    mountainDark: '#090d16',
    mountainLight: '#0f172a',
    mountainAccent: '#06b6d4',
    roadDark: '#18181b',
    roadLight: '#27272a',
    rumbleDark: '#ec4899',
    rumbleLight: '#06b6d4',
    grassDark: '#090d16',
    grassLight: '#111827',
    laneColor: '#38bdf8',
    fogColor: '#db2777',
    horizonColor: '#6366f1',
  },
  forest: {
    skyStops: [
      [0, '#022c22'],
      [0.35, '#064e3b'],
      [0.65, '#0f766e'],
      [0.9, '#f97316'],
      [1.0, '#fef08a'],
    ],
    skyTop: '#022c22',
    skyMid: '#0f766e',
    skyBot: '#fef08a',
    sunColor: '#fef08a',
    sunGradBot: '#ea580c',
    sunHalo: 'rgba(249, 115, 22, 0.5)',
    mountainDark: '#022c22',
    mountainLight: '#064e3b',
    mountainAccent: '#10b981',
    roadDark: '#262626',
    roadLight: '#404040',
    rumbleDark: '#dc2626',
    rumbleLight: '#ffffff',
    grassDark: '#052e16',
    grassLight: '#14532d',
    laneColor: '#ffffff',
    fogColor: '#14b8a6',
    horizonColor: '#0f766e',
  },
};

export const RADIO_STATIONS: Record<RadioTrack, RadioStationInfo> = {
  MAGICAL_SHOWER: {
    id: 'MAGICAL_SHOWER',
    name: 'MAGICAL SHOWER',
    frequency: '104.2 FM',
    genre: 'SYNTHWAVE FUNK',
    bpm: 132,
    description: 'Breezy coastal slap bass and upbeat Latin synth rhythm',
  },
  PASSING_BREEZE: {
    id: 'PASSING_BREEZE',
    name: 'PASSING BREEZE',
    frequency: '98.5 FM',
    genre: 'COASTAL FUSION JAZZ',
    bpm: 124,
    description: 'Smooth 80s Rhodes chords and chilled tropical melody',
  },
  SPLASH_WAVE: {
    id: 'SPLASH_WAVE',
    name: 'SPLASH WAVE',
    frequency: '107.9 FM',
    genre: 'TURBO CHIPTUNE',
    bpm: 140,
    description: 'Fast-paced arcade eurobeat arpeggios and high-octane drive',
  },
  OFF: {
    id: 'OFF',
    name: 'RADIO OFF / MUTE',
    frequency: '---.- FM',
    genre: 'STANDBY',
    bpm: 0,
    description: 'Radio muted (Pure engine soundtrack)',
  },
};

