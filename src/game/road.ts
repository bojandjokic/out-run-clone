/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Segment, SceneryTheme, CarNPC, NPCType, RoadsideSpriteItem } from '../types';
import {
  ROAD_WIDTH,
  SEGMENT_LENGTH,
  RUMBLE_LENGTH,
  LANES,
  STAGE_SEGMENTS,
  FORK_SEGMENT_OFFSET,
  THEME_PALETTES,
  ROUTE_NODES,
} from './constants';

export class RoadManager {
  public segments: Segment[] = [];
  public trackLength: number = 0;
  public currentStageIndex: number = 1;
  public currentStageKey: string = 'stage1_beach';
  public allCars: CarNPC[] = [];

  constructor() {
    this.buildFullWorld();
  }

  public reset(startStageKey: string = 'stage1_beach') {
    this.currentStageKey = startStageKey;
    this.currentStageIndex = ROUTE_NODES[startStageKey]?.stage || 1;
    this.buildFullWorld();
  }

  public findSegment(z: number): Segment {
    const wrappedZ = (z % this.trackLength + this.trackLength) % this.trackLength;
    const index = Math.floor(wrappedZ / SEGMENT_LENGTH) % this.segments.length;
    return this.segments[index];
  }

  public getStageProgress(z: number): { stageNumber: number; stageName: string; theme: SceneryTheme; percent: number } {
    const node = ROUTE_NODES[this.currentStageKey] || ROUTE_NODES['stage1_beach'];
    const stageLen = STAGE_SEGMENTS * SEGMENT_LENGTH;
    const currentZInStage = (z % stageLen + stageLen) % stageLen;
    const pct = Math.min(1, Math.max(0, currentZInStage / stageLen));

    return {
      stageNumber: node.stage,
      stageName: node.name,
      theme: node.theme,
      percent: pct,
    };
  }

  public selectNextRoute(choice: 'left' | 'right') {
    const currentNode = ROUTE_NODES[this.currentStageKey];
    if (!currentNode) return;

    const nextKey = choice === 'left' ? currentNode.leftChoice : currentNode.rightChoice;
    if (nextKey && ROUTE_NODES[nextKey]) {
      this.currentStageKey = nextKey;
      this.currentStageIndex = ROUTE_NODES[nextKey].stage;
      // Regenerate the world seamlessly from current stage onward
      this.buildFullWorld();
    }
  }

  public relocatePoliceAfterCheckpoint(playerZ: number) {
    // Locate the stage checkpoint arch segment
    const checkpointSegment = this.segments.find(s => s.isCheckpoint);
    let targetZ: number;
    if (checkpointSegment) {
      // Station police past the checkpoint arch on the upcoming road section
      targetZ = checkpointSegment.p1.world.z + 1800;
    } else {
      const stageLen = STAGE_SEGMENTS * SEGMENT_LENGTH;
      targetZ = playerZ + stageLen;
    }
    targetZ = (targetZ % this.trackLength + this.trackLength) % this.trackLength;

    let relocatedCount = 0;
    for (let car of this.allCars) {
      if (car.isPolice || car.type === 'police') {
        const spawnZ = (targetZ + relocatedCount * 1800) % this.trackLength;
        car.z = spawnZ;
        car.speed = 0;
        car.pursuitMode = 'parked';
        const side = (relocatedCount % 2 === 0) ? 1 : -1;
        car.parkedSide = side === 1 ? 'right' : 'left';
        car.offset = side * 1.18;
        car.targetOffset = car.offset;
        car.peelOutTimer = 0;
        relocatedCount++;
      }
    }
  }

  private buildFullWorld() {
    this.segments = [];
    const currentNode = ROUTE_NODES[this.currentStageKey] || ROUTE_NODES['stage1_beach'];
    const theme = currentNode.theme;

    // Build the primary stage with hills, curves, scenery, and fork checkpoint at the end
    this.buildStageTrack(theme, this.currentStageIndex, currentNode);

    this.trackLength = this.segments.length * SEGMENT_LENGTH;
    this.populateTraffic();
  }

  private addSegment(curve: number, y: number, theme: SceneryTheme) {
    const n = this.segments.length;
    const palette = THEME_PALETTES[theme];
    const isEvenRumble = Math.floor(n / RUMBLE_LENGTH) % 2 === 0;

    const segment: Segment = {
      index: n,
      p1: {
        world: { x: 0, y: this.lastY(), z: n * SEGMENT_LENGTH },
        camera: { x: 0, y: 0, z: 0 },
        screen: { x: 0, y: 0, w: 0, scale: 0 },
      },
      p2: {
        world: { x: 0, y: y, z: (n + 1) * SEGMENT_LENGTH },
        camera: { x: 0, y: 0, z: 0 },
        screen: { x: 0, y: 0, w: 0, scale: 0 },
      },
      curve,
      hill: y,
      clip: 0,
      theme,
      colors: {
        grass: isEvenRumble ? palette.grassDark : palette.grassLight,
        rumble: isEvenRumble ? palette.rumbleDark : palette.rumbleLight,
        road: isEvenRumble ? palette.roadDark : palette.roadLight,
        lane: isEvenRumble ? palette.laneColor : undefined,
      },
      sprites: [],
      cars: [],
      skidmarks: [],
    };

    // Add occasional water puddles on road (approx every 30-40 segments in wet themes, or occasionally in desert)
    if (n > 40 && (theme === 'beach' || theme === 'city' || theme === 'forest')) {
      if (Math.sin(n * 0.28) > 0.92) {
        const puddleOffset = (Math.sin(n * 0.73) * 0.45);
        const puddleWidth = 0.38 + (Math.sin(n * 1.1) * 0.12);
        segment.waterPuddles = [{ offset: puddleOffset, width: puddleWidth }];
      }
    }

    this.segments.push(segment);
  }

  public addSkidmark(segmentIndex: number, leftOffset: number, rightOffset: number, alpha: number = 0.85) {
    const wrappedIdx = (segmentIndex % this.segments.length + this.segments.length) % this.segments.length;
    const seg = this.segments[wrappedIdx];
    if (!seg) return;
    if (!seg.skidmarks) seg.skidmarks = [];

    // Limit max skidmarks per segment to prevent memory build-up
    if (seg.skidmarks.length < 3) {
      seg.skidmarks.push({ leftOffset, rightOffset, alpha: Math.min(1.0, alpha) });
    }
  }

  public updateSkidmarks(dt: number) {
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      if (seg.skidmarks && seg.skidmarks.length > 0) {
        for (let k = seg.skidmarks.length - 1; k >= 0; k--) {
          seg.skidmarks[k].alpha -= dt * 0.04; // Gentle fade out
          if (seg.skidmarks[k].alpha <= 0.02) {
            seg.skidmarks.splice(k, 1);
          }
        }
      }
    }
  }

  private lastY(): number {
    return this.segments.length === 0 ? 0 : this.segments[this.segments.length - 1].p2.world.y;
  }

  private addRoad(enter: number, hold: number, leave: number, curve: number, y: number, theme: SceneryTheme) {
    const startY = this.lastY();
    const endY = startY + (y * SEGMENT_LENGTH);
    const total = enter + hold + leave;

    for (let n = 0; n < enter; n++) {
      const easeCurve = this.easeIn(0, curve, n / enter);
      const easeY = this.easeInOut(startY, endY, n / total);
      this.addSegment(easeCurve, easeY, theme);
    }
    for (let n = 0; n < hold; n++) {
      const easeY = this.easeInOut(startY, endY, (enter + n) / total);
      this.addSegment(curve, easeY, theme);
    }
    for (let n = 0; n < leave; n++) {
      const easeCurve = this.easeInOut(curve, 0, n / leave);
      const easeY = this.easeInOut(startY, endY, (enter + hold + n) / total);
      this.addSegment(easeCurve, easeY, theme);
    }
  }

  private addStraight(num: number, theme: SceneryTheme) {
    this.addRoad(num, num, num, 0, 0, theme);
  }

  private addCurve(num: number, curve: number, theme: SceneryTheme) {
    this.addRoad(num, num, num, curve, 0, theme);
  }

  private addHill(num: number, height: number, theme: SceneryTheme) {
    this.addRoad(num, num, num, 0, height, theme);
  }

  private addSCurves(theme: SceneryTheme) {
    this.addRoad(20, 20, 20, -2, 10, theme);
    this.addRoad(20, 20, 20, 3, -15, theme);
    this.addRoad(20, 20, 20, 2, 20, theme);
    this.addRoad(20, 20, 20, -3, -15, theme);
  }

  private easeIn(a: number, b: number, percent: number): number {
    return a + (b - a) * Math.pow(percent, 2);
  }

  private easeInOut(a: number, b: number, percent: number): number {
    return a + (b - a) * ((-Math.cos(percent * Math.PI) / 2) + 0.5);
  }

  private buildStageTrack(theme: SceneryTheme, stageNum: number, node: typeof ROUTE_NODES[string]) {
    // 1. Starting straightway with scenic roadside banners
    this.addStraight(25, theme);

    // 2. Sweeping gentle curves and rolling hills
    this.addHill(20, 25, theme);
    this.addCurve(25, 2.5, theme);
    this.addHill(25, -20, theme);
    this.addCurve(30, -3, theme);
    this.addStraight(20, theme);

    // 3. Challenging S-curves
    this.addSCurves(theme);

    // 4. Dramatic Crest / Valley
    this.addHill(30, 40, theme);
    this.addCurve(25, -2, theme);
    this.addHill(30, -40, theme);
    this.addCurve(25, 3.5, theme);
    this.addStraight(30, theme);

    // 5. High speed section with moderate curves
    this.addCurve(35, -2.5, theme);
    this.addHill(20, 15, theme);
    this.addCurve(35, 2.5, theme);
    this.addHill(20, -15, theme);
    this.addStraight(25, theme);

    // 6. Checkpoint & Fork Approach Section
    const remainingToFork = STAGE_SEGMENTS - this.segments.length - FORK_SEGMENT_OFFSET;
    if (remainingToFork > 0) {
      this.addStraight(Math.floor(remainingToFork / 3), theme);
    }

    // Overhead Checkpoint Arch placed right at stage climax
    const checkpointSegmentIndex = this.segments.length + 20;

    // Build the Fork Bifurcation
    this.buildForkSection(theme, node);

    // Mark the checkpoint segment
    if (this.segments[checkpointSegmentIndex]) {
      this.segments[checkpointSegmentIndex].isCheckpoint = true;
      this.segments[checkpointSegmentIndex].checkpointStage = stageNum;
      this.segments[checkpointSegmentIndex].sprites.push({
        id: `cp_arch_${stageNum}`,
        type: 'checkpoint_arch',
        offset: 0,
        scaleMultiplier: 1.0,
      });
    }

    // Populate roadside props according to theme
    this.populateRoadsideProps(theme);
  }

  private buildForkSection(theme: SceneryTheme, node: typeof ROUTE_NODES[string]) {
    const forkLen = FORK_SEGMENT_OFFSET;
    const startIndex = this.segments.length;

    // Overhead Route Fork Sign
    const signType: RoadsideSpriteItem['type'] = 
      node.stage >= 4 ? 'fork_sign_final' :
      theme === 'beach' ? 'fork_sign_beach_desert' :
      theme === 'desert' ? 'fork_sign_city_forest' :
      'fork_sign_beach_desert';

    for (let i = 0; i < forkLen; i++) {
      const pct = i / forkLen;
      const isForkActive = pct > 0.3;
      
      // Road gently straightens for split
      this.addSegment(0, 0, theme);

      const curSeg = this.segments[this.segments.length - 1];
      curSeg.isFork = isForkActive;
      curSeg.forkChoiceActive = isForkActive;

      // Add Overhead sign at beginning of fork approach
      if (i === 10) {
        curSeg.sprites.push({
          id: `fork_sign_${node.id}`,
          type: signType,
          offset: 0,
          scaleMultiplier: 1.1,
        });
      }

      // Add crash divider barrels down the center when road splits
      if (isForkActive && i % 4 === 0) {
        curSeg.sprites.push({
          id: `fork_div_${i}`,
          type: 'fork_divider',
          offset: 0,
          scaleMultiplier: 0.85,
        });
      }
    }
  }

  private populateRoadsideProps(theme: SceneryTheme) {
    const total = this.segments.length;
    const billboardTypes: RoadsideSpriteItem['type'][] = [
      'billboard_outrun',
      'billboard_synth',
      'billboard_motel',
      'billboard_nitro',
      'billboard_ferrari',
    ];
    const powerUpTypes: { type: 'nitro' | 'time_bonus' | 'radar_clear' | 'super_grip'; name: string }[] = [
      { type: 'nitro', name: 'Nitro Boost' },
      { type: 'super_grip', name: 'Super Grip' },
      { type: 'radar_clear', name: 'Radar Jammer' },
      { type: 'time_bonus', name: 'Time Bonus +5s' },
    ];
    let powerUpIndex = 0;
    let billboardIndex = 0;

    for (let i = 10; i < total; i += 3) {
      const seg = this.segments[i];
      if (seg.isFork) continue;

      const side = (i % 2 === 0) ? -1 : 1;
      const distanceOffset = 1.35 + (Math.sin(i * 13) * 0.35);

      // 1. Mechanic Shop Pit Stops (Interactive Power-Ups placed every ~130 segments)
      if (i > 30 && i < total - 40 && i % 130 === 0) {
        const pUp = powerUpTypes[powerUpIndex % powerUpTypes.length];
        powerUpIndex++;
        const shopSide = side > 0 ? 'right' : 'left';
        const shopOffset = side * 1.55;

        seg.sprites.push({
          id: `mechanic_shop_${i}`,
          type: 'mechanic_shop',
          offset: shopOffset,
          scaleMultiplier: 1.6,
        });

        seg.mechanicShop = {
          id: `shop_${i}`,
          type: pUp.type,
          name: pUp.name,
          side: shopSide,
          offset: shopOffset,
          collected: false,
        };
        continue;
      }

      // 2. Roadside Roadhouses & Diners (placed every ~80 segments)
      if (i > 20 && i < total - 30 && i % 80 === 40) {
        const roadhouseType = (i % 160 === 40) ? 'roadhouse_diner' : 'roadhouse_motel';
        seg.sprites.push({
          id: `roadhouse_${i}`,
          type: roadhouseType,
          offset: side * 1.6,
          scaleMultiplier: 1.5,
        });
        continue;
      }

      // 3. Roadside Billboards (placed every ~45 segments on straights and gentle turns)
      if (i > 15 && i < total - 25 && i % 45 === 0) {
        const bType = billboardTypes[billboardIndex % billboardTypes.length];
        billboardIndex++;
        seg.sprites.push({
          id: `billboard_${i}`,
          type: bType,
          offset: side * 1.45,
          scaleMultiplier: 1.35,
        });
        continue;
      }

      // 4. Scenery props according to current route biome
      if (theme === 'beach') {
        if (i % 6 === 0) {
          seg.sprites.push({
            id: `palm_${i}`,
            type: (i % 12 === 0) ? 'palm_cluster' : 'palm_tree',
            offset: side * distanceOffset,
            scaleMultiplier: 1.0,
          });
        }
      } else if (theme === 'desert') {
        if (i % 5 === 0) {
          const isRock = (i % 15 === 0);
          seg.sprites.push({
            id: `desert_prop_${i}`,
            type: isRock ? 'red_rock' : (i % 10 === 0) ? 'desert_bush' : 'cactus',
            offset: side * (isRock ? 1.6 : distanceOffset),
            scaleMultiplier: isRock ? 1.4 : 1.0,
          });
        }
      } else if (theme === 'city') {
        if (i % 8 === 0) {
          const isSkyscraper = (i % 16 === 0);
          const isNeon = (i % 24 === 0);
          seg.sprites.push({
            id: `city_prop_${i}`,
            type: isNeon ? (i % 48 === 0 ? 'neon_sign_sega' : 'neon_sign_outrun') :
                  isSkyscraper ? (i % 32 === 0 ? 'skyscraper_tall' : 'skyscraper_small') :
                  'street_lamp',
            offset: side * (isSkyscraper ? 1.8 : 1.25),
            scaleMultiplier: 1.0,
          });
        }
      } else if (theme === 'forest') {
        if (i % 5 === 0) {
          const isRock = (i % 20 === 0);
          seg.sprites.push({
            id: `forest_prop_${i}`,
            type: isRock ? 'forest_rock' : (i % 10 === 0) ? 'pine_tall' : 'pine_tree',
            offset: side * distanceOffset,
            scaleMultiplier: 1.0,
          });
        }
      }
    }
  }

  private populateTraffic() {
    this.allCars = [];
    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i].cars = [];
    }

    const civilianTypes: NPCType[] = ['sports_blue', 'sports_yellow', 'sports_red', 'truck', 'van', 'coupe_purple'];
    const totalCivilians = 36;

    // 1. Regular civilian traffic evenly spaced along the course
    for (let i = 0; i < totalCivilians; i++) {
      const z = (i + 1) * (this.trackLength / (totalCivilians + 2)) + (Math.random() * 600 - 300);
      const seg = this.findSegment(z);
      const lane = (i % LANES) - 1; // -1, 0, 1
      const offset = (lane * 0.55) + ((Math.random() - 0.5) * 0.15);
      const type = civilianTypes[i % civilianTypes.length];

      const speed = type === 'truck' ? 3800 + Math.random() * 800 :
                    type === 'van' ? 4400 + Math.random() * 1000 :
                    5200 + Math.random() * 2200;

      const car: CarNPC = {
        id: `npc_civilian_${i}`,
        type,
        offset,
        z,
        speed,
        targetOffset: offset,
        width: type === 'truck' ? 140 : 120,
        height: type === 'truck' ? 120 : 70,
        isPolice: false,
      };

      this.allCars.push(car);
      seg.cars.push(car);
    }

    // 2. Parked Highway Patrol Speed-Trap Police Cars (Only 3-4 parked by the side of the road)
    const numPolice = 3;
    for (let i = 0; i < numPolice; i++) {
      // Stationed at strategic roadside speed-trap locations
      const z = ((i + 1) * (this.trackLength / (numPolice + 1))) + 800;
      const seg = this.findSegment(z);
      const side = (i % 2 === 0) ? 1 : -1;
      const offset = side * 1.18; // Parked safely on the roadside shoulder

      const car: CarNPC = {
        id: `police_trap_${i}`,
        type: 'police',
        offset,
        z,
        speed: 0, // Starts standing still
        targetOffset: offset,
        width: 135,
        height: 75,
        isPolice: true,
        sirenPhase: Math.random() * 5,
        pursuitMode: 'parked',
        parkedSide: side === 1 ? 'right' : 'left',
        peelOutTimer: 0,
      };

      this.allCars.push(car);
      seg.cars.push(car);
    }
  }

  public updateTraffic(
    dt: number,
    playerX: number,
    playerZ: number,
    playerSpeed: number,
    wantedLevel: number = 0
  ): {
    overtakenCount: number;
    policeProximity: number;
    isNearPolice: boolean;
    isPoliceChasing: boolean;
    closestPolice: CarNPC | null;
    newlyTriggeredPolice: boolean;
  } {
    let overtakenCount = 0;
    let closestPoliceDist = Infinity;
    let closestPolice: CarNPC | null = null;
    let isPoliceChasing = false;
    let newlyTriggeredPolice = false;

    // Clear car references from segments
    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i].cars = [];
    }

    // No rear spawning: police cars are strictly stationed roadside speed-traps

    // Update each car
    for (let i = this.allCars.length - 1; i >= 0; i--) {
      const car = this.allCars[i];
      const oldZ = car.z;

      car.sirenPhase = (car.sirenPhase || 0) + dt;

      // Distance calculation relative to player (wrapped around track)
      let relZ = car.z - playerZ;
      while (relZ > this.trackLength / 2) relZ -= this.trackLength;
      while (relZ < -this.trackLength / 2) relZ += this.trackLength;
      const absDist = Math.abs(relZ);

      if (car.isPolice || car.type === 'police') {
        if (absDist < closestPoliceDist) {
          closestPoliceDist = absDist;
          closestPolice = car;
        }

        // 1. PARKED STATE (Speed Trap by roadside)
        if (car.pursuitMode === 'parked') {
          car.speed = 0; // Remains stationary on roadside shoulder

          // Check speed infraction or existing wanted level
          // Triggers when player is approaching within detection radius
          const isApproaching = (relZ > -2500 && relZ < 100);
          const isSpeeding = playerSpeed > 7200; // Speed limit trigger
          const isWanted = wantedLevel >= 2 || (wantedLevel >= 1 && absDist < 1800);

          if (isApproaching && (isSpeeding || isWanted)) {
            // Speed trap activates!
            car.pursuitMode = 'chase';
            car.peelOutTimer = 1.2;
            car.speed = 2200; // Initial burnout jump
            car.targetOffset = playerX; // Merges onto roadway to chase player
            newlyTriggeredPolice = true;
          }
        } 
        // 2. ACTIVE CHASE STATE
        else if (car.pursuitMode === 'chase') {
          isPoliceChasing = true;
          if (car.peelOutTimer && car.peelOutTimer > 0) {
            car.peelOutTimer -= dt;
          }

          // EVASION / LOW SPEED STANDDOWN:
          // If player slows down below 3800 and wanted level <= 1, police stands down
          if (playerSpeed <= 3800 && wantedLevel <= 1) {
            car.pursuitMode = 'cooldown';
            car.speed = 5200; // Normal cruising pace
            car.targetOffset = playerX > 0 ? -0.55 : 0.55; // Move to opposite lane
          } else {
            // Aggressive pursuit: match/exceed player speed
            const targetSpeed = (relZ < 0) 
              ? Math.min(13200, Math.max(8800, playerSpeed + 550 + wantedLevel * 150))
              : Math.max(4500, playerSpeed * 0.9);

            car.speed += (targetSpeed - car.speed) * dt * 2.5;

            // Steer aggressively towards player's lane to intercept
            car.targetOffset = playerX;
            car.offset += (car.targetOffset - car.offset) * dt * 2.2;
          }
        } 
        // 3. COOLDOWN STATE (Police standing down / cruising past)
        else if (car.pursuitMode === 'cooldown') {
          car.speed = 5200;
          if (car.targetOffset === undefined || Math.abs(car.targetOffset - playerX) < 0.3) {
            car.targetOffset = playerX > 0 ? -0.55 : 0.55;
          }
          car.offset += (car.targetOffset - car.offset) * dt * 1.5;

          // If player speeds away again, resume chase!
          if (playerSpeed > 7500 || wantedLevel >= 2) {
            car.pursuitMode = 'chase';
          }
        } 
        // 4. PATROL STATE
        else {
          car.pursuitMode = 'patrol';
          car.speed = 5400;
          if (Math.random() < 0.005) {
            const lanes = [-0.55, 0, 0.55];
            car.targetOffset = lanes[Math.floor(Math.random() * lanes.length)];
          }
          if (car.targetOffset !== undefined) {
            car.offset += (car.targetOffset - car.offset) * dt * 1.2;
          }
        }
      } else {
        // --- CIVILIAN TRAFFIC ---
        if (Math.random() < 0.004) {
          const lanes = [-0.55, 0, 0.55];
          car.targetOffset = lanes[Math.floor(Math.random() * lanes.length)];
        }
        if (car.targetOffset !== undefined) {
          car.offset += (car.targetOffset - car.offset) * dt * 1.4;
        }
      }

      // Move car forward along track (only if speed > 0)
      if (car.speed > 0) {
        car.z += car.speed * dt;

        // Wrap around track
        if (car.z >= this.trackLength) {
          car.z -= this.trackLength;
        } else if (car.z < 0) {
          car.z += this.trackLength;
        }
      }

      // Check overtake
      if (oldZ < playerZ && car.z >= playerZ - 200 && playerSpeed > car.speed && car.speed > 0) {
        overtakenCount++;
      }

      // Put car in segment
      const seg = this.findSegment(car.z);
      seg.cars.push(car);
    }

    // Police proximity metric
    const isNearPolice = closestPoliceDist < 2600;
    const policeProximity = isNearPolice ? Math.max(0, 1.0 - closestPoliceDist / 2600) : 0;

    return {
      overtakenCount,
      policeProximity,
      isNearPolice,
      isPoliceChasing,
      closestPolice,
      newlyTriggeredPolice,
    };
  }
}
