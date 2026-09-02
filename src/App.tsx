/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PlayerState, GameState, Particle, RadioTrack, HighScoreEntry, SceneryTheme } from './types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MAX_SPEED,
  ACCELERATION,
  BRAKING,
  NATURAL_DECEL,
  OFFROAD_DECEL,
  OFFROAD_LIMIT,
  CENTRIFUGAL_FORCE,
  INITIAL_TIME,
  CHECKPOINT_TIME_BONUS,
  TOTAL_STAGES,
  STAGE_SEGMENTS,
  SEGMENT_LENGTH,
  ROUTE_NODES,
  RADIO_STATIONS,
} from './game/constants';
import { RoadManager } from './game/road';
import { gameRenderer } from './game/renderer';
import { dashboardRenderer } from './game/dashboard';
import { soundEngine } from './audio/SoundEngine';
import { ArcadeCabinet } from './components/ArcadeCabinet';

const INITIAL_HIGH_SCORES: HighScoreEntry[] = [
  { rank: 1, name: 'ACE', score: 1485000, stage: 5, route: 'A', date: '1986' },
  { rank: 2, name: 'SEGA', score: 1120000, stage: 4, route: 'B', date: '1986' },
  { rank: 3, name: 'MAX', score: 895000, stage: 3, route: 'C', date: '1986' },
  { rank: 4, name: 'VIP', score: 620000, stage: 2, route: 'D', date: '1986' },
  { rank: 5, name: 'NEO', score: 380000, stage: 1, route: 'A', date: '1986' },
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const roadManagerRef = useRef<RoadManager>(new RoadManager());

  // Input states
  const keysRef = useRef<{ up: boolean; down: boolean; left: boolean; right: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  const touchSteerRef = useRef<-1 | 0 | 1>(0);
  const touchGasRef = useRef<boolean>(false);
  const touchBrakeRef = useRef<boolean>(false);

  // High Scores
  const [highScores, setHighScores] = useState<HighScoreEntry[]>(() => {
    try {
      const saved = localStorage.getItem('outrun_high_scores');
      return saved ? JSON.parse(saved) : INITIAL_HIGH_SCORES;
    } catch {
      return INITIAL_HIGH_SCORES;
    }
  });

  // UI state
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [radioTrack, setRadioTrack] = useState<RadioTrack>('MAGICAL_SHOWER');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [scanlinesEnabled, setScanlinesEnabled] = useState<boolean>(true);

  // Player & Game State Refs for high-speed 60fps loop
  const playerRef = useRef<PlayerState>({
    x: 0,
    z: 0,
    speed: 0,
    maxSpeed: MAX_SPEED,
    accel: ACCELERATION,
    braking: BRAKING,
    decel: NATURAL_DECEL,
    offRoadDecel: OFFROAD_DECEL,
    steerAngle: 0,
    isBraking: false,
    gear: 1,
    rpm: 0,
    score: 0,
    timeRemaining: INITIAL_TIME,
    carsOvertaken: 0,
    stage: 1,
    theme: 'beach',
    routeHistory: ['beach'],
    crashed: false,
    crashTimer: 0,
    crashSpinAngle: 0,
    screenShake: 0,
    wantedLevel: 0,
    maxWantedReached: 0,
    policeProximity: 0,
    isNearPolice: false,
    isPoliceChasing: false,
    cooldownTimer: 0,
    wantedFlashTimer: 0,
    collisionsWithNPC: 0,
    bustedTimer: 0,
  });

  const particlesRef = useRef<Particle[]>([]);
  const bannerRef = useRef<{ text: string | null; subtext: string | null; timer: number }>({
    text: null,
    subtext: null,
    timer: 0,
  });

  const lastTimeRef = useRef<number>(performance.now());
  const animationFrameRef = useRef<number | null>(null);
  const timeWarningTimerRef = useRef<number>(0);
  const checkpointCrossedRef = useRef<boolean>(false);

  // Start / Restart Game Handlers
  const handleStartGame = useCallback(() => {
    soundEngine.init();
    soundEngine.resume();
    soundEngine.setRadioTrack(radioTrack);

    const road = roadManagerRef.current;
    road.reset('stage1_beach');

    playerRef.current = {
      x: 0,
      z: 0,
      speed: 0,
      maxSpeed: MAX_SPEED,
      accel: ACCELERATION,
      braking: BRAKING,
      decel: NATURAL_DECEL,
      offRoadDecel: OFFROAD_DECEL,
      steerAngle: 0,
      isBraking: false,
      gear: 1,
      rpm: 0,
      score: 0,
      timeRemaining: INITIAL_TIME,
      carsOvertaken: 0,
      stage: 1,
      theme: 'beach',
      routeHistory: ['beach'],
      crashed: false,
      crashTimer: 0,
      crashSpinAngle: 0,
      screenShake: 0,
      wantedLevel: 0,
      maxWantedReached: 0,
      policeProximity: 0,
      isNearPolice: false,
      isPoliceChasing: false,
      cooldownTimer: 0,
      pursuitEvasionTimer: 0,
      evasionSuccessTimer: 0,
      wantedFlashTimer: 0,
      collisionsWithNPC: 0,
      bustedTimer: 0,
      nitroTimer: 0,
      superGripTimer: 0,
      radarJammerTimer: 0,
      activePowerUpTimer: 0,
      activePowerUpName: undefined,
    };

    particlesRef.current = [];
    checkpointCrossedRef.current = false;
    bannerRef.current = { text: 'STAGE 1', subtext: 'COCONUT BEACH - GET READY!', timer: 2.5 };
    setGameState('RACING');
  }, [radioTrack]);

  const handleRestartGame = useCallback(() => {
    handleStartGame();
  }, [handleStartGame]);

  const handleToggleMute = useCallback(() => {
    soundEngine.init();
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleCycleRadio = useCallback(() => {
    soundEngine.init();
    const tracks: RadioTrack[] = ['MAGICAL_SHOWER', 'PASSING_BREEZE', 'SPLASH_WAVE', 'OFF'];
    const curIdx = tracks.indexOf(radioTrack);
    const nextTrack = tracks[(curIdx + 1) % tracks.length];
    setRadioTrack(nextTrack);
    soundEngine.setRadioTrack(nextTrack);
    soundEngine.playRadioTuned();

    const station = RADIO_STATIONS[nextTrack];
    if (gameState === 'RACING') {
      bannerRef.current = {
        text: nextTrack === 'OFF' ? '📻 RADIO: MUTED' : `📻 FM ${station.frequency} - ${station.name}`,
        subtext: nextTrack === 'OFF' ? 'PRESS [R] TO RETUNE' : `${station.genre.toUpperCase()} • ${station.description}`,
        timer: 2.2,
      };
    }
  }, [radioTrack, gameState]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling on arrow keys & space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = true;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;

      if (e.key === 'Enter') {
        if (gameState === 'TITLE' || gameState === 'GAME_OVER' || gameState === 'VICTORY') {
          handleStartGame();
        }
      }

      if (e.key === 'r' || e.key === 'R' || e.key === 'm' || e.key === 'M') {
        handleCycleRadio();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = false;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, handleStartGame, handleCycleRadio]);

  // Touch handlers
  const handleTouchSteer = useCallback((dir: -1 | 0 | 1) => {
    touchSteerRef.current = dir;
  }, []);

  const handleTouchGas = useCallback((active: boolean) => {
    touchGasRef.current = active;
  }, []);

  const handleTouchBrake = useCallback((active: boolean) => {
    touchBrakeRef.current = active;
  }, []);

  // Save High Score on game completion
  const recordHighScore = useCallback((finalScore: number, finalStage: number) => {
    setHighScores(prev => {
      const newEntry: HighScoreEntry = {
        rank: 0,
        name: 'YOU',
        score: finalScore,
        stage: finalStage,
        route: 'A',
        date: '1986',
      };
      const updated = [...prev, newEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
      try {
        localStorage.setItem('outrun_high_scores', JSON.stringify(updated));
      } catch {
        // storage quota fallback
      }
      return updated;
    });
  }, []);

  // Main 60 FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const gameLoop = (currentTime: number) => {
      if (!isRunning) return;

      const dt = Math.min(1 / 30, (currentTime - lastTimeRef.current) / 1000);
      lastTimeRef.current = currentTime;

      const player = playerRef.current;
      const road = roadManagerRef.current;

      // --- GAME STATE UPDATE ---
      if (gameState === 'RACING') {
        // 1. Controls processing (combines Keyboard + Touch)
        const isUp = keysRef.current.up || touchGasRef.current;
        const isDown = keysRef.current.down || touchBrakeRef.current;
        const isLeft = keysRef.current.left || touchSteerRef.current === -1;
        const isRight = keysRef.current.right || touchSteerRef.current === 1;

        player.isBraking = isDown;
        player.steerAngle = isLeft ? -1 : isRight ? 1 : 0;

        // 2. Countdown Timer
        if (!player.crashed) {
          player.timeRemaining -= dt;
          if (player.timeRemaining <= 10 && player.timeRemaining > 0) {
            timeWarningTimerRef.current += dt;
            if (timeWarningTimerRef.current > 1.0) {
              soundEngine.playTimeWarning();
              timeWarningTimerRef.current = 0;
            }
          }

          if (player.timeRemaining <= 0) {
            player.timeRemaining = 0;
            setGameState('GAME_OVER');
            recordHighScore(player.score, player.stage);
          }
        }

        // 3. Crash Recovery Handling
        if (player.crashed) {
          player.crashTimer -= dt;
          player.crashSpinAngle += dt * 12;
          player.speed = Math.max(0, player.speed - player.braking * dt * 2);
          if (player.crashTimer <= 0) {
            player.crashed = false;
            player.crashSpinAngle = 0;
            player.x = 0; // Return to center lane
          }
        } else {
          // 4. Physics: Acceleration, Braking, Coasting
          const offRoad = Math.abs(player.x) > 1.0;
          const hasSuperGrip = player.superGripTimer > 0;
          const isOffRoadPenalized = offRoad && !hasSuperGrip;
          const isNitroActive = player.nitroTimer > 0;

          // Effective max speed taking into account Nitro
          const effectiveMaxSpeed = isNitroActive ? MAX_SPEED * 1.25 : MAX_SPEED;

          if (isOffRoadPenalized) {
            // OFF-ROAD BEHAVIOR (OutRun Arcade style):
            // 1. If speed exceeds OFFROAD_LIMIT (~4200 units/s = ~105 km/h), smoothly decelerate down towards OFFROAD_LIMIT
            if (player.speed > OFFROAD_LIMIT) {
              player.speed = Math.max(OFFROAD_LIMIT, player.speed + player.offRoadDecel * dt);
            }

            // 2. If pressing Gas (isUp), allow continuous acceleration up to OFFROAD_LIMIT so player maintains momentum!
            if (isUp) {
              if (player.speed < OFFROAD_LIMIT) {
                player.speed = Math.min(OFFROAD_LIMIT, player.speed + player.accel * 0.75 * dt);
              }
            } else if (isDown) {
              player.speed = Math.max(0, player.speed + player.braking * dt);
            } else {
              // Coasting off-road gently slows down
              player.speed = Math.max(0, player.speed + player.decel * 1.3 * dt);
            }

            // Spawn off-road dust particles
            if (player.speed > 300 && Math.random() < 0.6) {
              particlesRef.current.push({
                x: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 60,
                y: CANVAS_HEIGHT - 20,
                vx: (Math.random() - 0.5) * 60,
                vy: -Math.random() * 40 - 20,
                size: Math.random() * 5 + 3,
                color: player.theme === 'desert' ? '#f59e0b' : player.theme === 'beach' ? '#fef08a' : '#94a3b8',
                alpha: 0.8,
                life: 0,
                maxLife: 0.4,
                type: 'dust',
              });
            }
          } else {
            // On-road (or with Super-Grip powerup active)
            const accelMult = isNitroActive ? 1.6 : 1.0;
            if (isUp) {
              player.speed = Math.min(effectiveMaxSpeed, player.speed + player.accel * accelMult * dt);
            } else if (isDown) {
              player.speed = Math.max(0, player.speed + player.braking * dt);
            } else {
              player.speed = Math.max(0, player.speed + player.decel * dt);
            }
          }

          // Twin Nitro Exhaust Flame particles
          if (isNitroActive && player.speed > 2000) {
            for (let side of [-22, 22]) {
              particlesRef.current.push({
                x: CANVAS_WIDTH / 2 + side + (Math.random() - 0.5) * 4,
                y: CANVAS_HEIGHT - 12,
                vx: (Math.random() - 0.5) * 16,
                vy: Math.random() * 40 + 50,
                size: Math.random() * 7 + 5,
                color: ['#06b6d4', '#38bdf8', '#67e8f9', '#ffffff'][Math.floor(Math.random() * 4)],
                alpha: 0.95,
                life: 0,
                maxLife: 0.22,
                type: 'nitro_flame',
              });
            }
          }

          // Clamp speed
          player.speed = Math.max(0, Math.min(player.speed, effectiveMaxSpeed));

          // 5. Gear & RPM Calculation (4-Speed Automatic Gearbox)
          const speedRatio = player.speed / player.maxSpeed;
          if (speedRatio < 0.25) {
            player.gear = 1;
            player.rpm = speedRatio / 0.25;
          } else if (speedRatio < 0.52) {
            player.gear = 2;
            player.rpm = (speedRatio - 0.25) / 0.27;
          } else if (speedRatio < 0.80) {
            player.gear = 3;
            player.rpm = (speedRatio - 0.52) / 0.28;
          } else {
            player.gear = 4;
            player.rpm = (speedRatio - 0.80) / 0.20;
          }

          // 6. Steering & Centrifugal Drift
          const playerSegment = road.findSegment(player.z);
          // Always maintain responsive steering authority even at low speed so player can easily steer back onto asphalt
          const steerSpeedRatio = Math.max(0.35, player.speed / player.maxSpeed);
          const dx = dt * 2 * steerSpeedRatio * (hasSuperGrip ? 1.25 : 1.0);

          // Counter centrifugal force
          player.x = player.x - (dx * speedRatio * playerSegment.curve * CENTRIFUGAL_FORCE);

          if (isLeft) {
            player.x -= dx * 0.95;
          } else if (isRight) {
            player.x += dx * 0.95;
          }

          // Screech audio calculation & Skidmark generation
          const isHardSteer = (isLeft || isRight) && speedRatio > 0.6;
          const isHeavyBraking = isDown && speedRatio > 0.25;

          if (isHardSteer || isHeavyBraking || (offRoad && speedRatio > 0.35)) {
            soundEngine.updateScreech(Math.max(0.4, speedRatio));

            // Lay rubber skidmarks on asphalt
            if (!offRoad) {
              road.addSkidmark(playerSegment.index, player.x - 0.16, player.x + 0.16, 0.85);
            }

            // Spawn brake smoke / tire burnout particles
            if (Math.random() < 0.65) {
              const smokeColor = offRoad
                ? (player.theme === 'desert' ? '#f59e0b' : player.theme === 'beach' ? '#fef08a' : '#94a3b8')
                : '#e2e8f0';
              const pType = offRoad ? 'dust' : 'brake_smoke';

              particlesRef.current.push({
                x: CANVAS_WIDTH / 2 - 24 + (Math.random() - 0.5) * 8,
                y: CANVAS_HEIGHT - 12,
                vx: (Math.random() - 0.5) * 40 - 15,
                vy: -Math.random() * 35 - 15,
                size: Math.random() * 6 + 4,
                color: smokeColor,
                alpha: 0.8,
                life: 0,
                maxLife: 0.45,
                type: pType,
              });

              particlesRef.current.push({
                x: CANVAS_WIDTH / 2 + 24 + (Math.random() - 0.5) * 8,
                y: CANVAS_HEIGHT - 12,
                vx: (Math.random() - 0.5) * 40 + 15,
                vy: -Math.random() * 35 - 15,
                size: Math.random() * 6 + 4,
                color: smokeColor,
                alpha: 0.8,
                life: 0,
                maxLife: 0.45,
                type: pType,
              });
            }
          } else {
            soundEngine.stopScreech();
          }

          // --- WATER PUDDLE INTERACTION ---
          if (playerSegment.waterPuddles && playerSegment.waterPuddles.length > 0 && player.speed > 1200) {
            for (let i = 0; i < playerSegment.waterPuddles.length; i++) {
              const puddle = playerSegment.waterPuddles[i];
              if (Math.abs(player.x - puddle.offset) < (puddle.width * 0.5 + 0.15)) {
                // Splash sound
                if (Math.random() < 0.3) {
                  soundEngine.playWaterSplash();
                }

                // Dynamic water spray droplets
                for (let k = 0; k < 4; k++) {
                  particlesRef.current.push({
                    x: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 60,
                    y: CANVAS_HEIGHT - 15,
                    vx: (Math.random() - 0.5) * 140,
                    vy: -Math.random() * 90 - 40,
                    size: Math.random() * 4 + 3,
                    color: '#38bdf8',
                    alpha: 0.9,
                    life: 0,
                    maxLife: 0.4,
                    type: 'water_splash',
                  });
                }
              }
            }
          }

          // 7. Distance & Score Advancement
          player.z += player.speed * dt;
          player.score += Math.floor(player.speed * dt * 0.1);

          // 8. NPC Traffic Movement & Police Pursuit AI
          const trafficUpdate = road.updateTraffic(dt, player.x, player.z, player.speed, player.wantedLevel);
          if (trafficUpdate.overtakenCount > 0) {
            player.carsOvertaken += trafficUpdate.overtakenCount;
            player.score += trafficUpdate.overtakenCount * 500;
            soundEngine.playWhoosh();
          }

          // Newly triggered parked police speed-trap
          if (trafficUpdate.newlyTriggeredPolice) {
            player.wantedLevel = Math.max(1, player.wantedLevel);
            player.wantedFlashTimer = 2.5;
            soundEngine.playWantedLevelUp();
            bannerRef.current = {
              text: 'SPEED TRAP TRIGGERED!',
              subtext: 'HIGHWAY PATROL IN PURSUIT - DROP SPEED TO EVADE',
              timer: 2.5,
            };
          }

          player.policeProximity = trafficUpdate.policeProximity;
          player.isNearPolice = trafficUpdate.isNearPolice;
          player.isPoliceChasing = trafficUpdate.isPoliceChasing;

          // 8b. Police Pursuit & 7-Second Avoidance Evasion Mechanics
          const isPursuitActive = player.isPoliceChasing || (player.wantedLevel > 0 && player.isNearPolice);

          if (isPursuitActive) {
            // Player is actively being pursued by police
            player.pursuitEvasionTimer = (player.pursuitEvasionTimer || 0) + dt;

            // IF PLAYER AVOIDS PURSUIT FOR 7 SECONDS:
            // Police car stops chasing player and spawns on another location (somewhere after checkpoint).
            // Player loses all WANTED level stars!
            if (player.pursuitEvasionTimer >= 7.0) {
              // 1. Relocate chasing police to past the checkpoint as a parked roadside speed-trap
              road.relocatePoliceAfterCheckpoint(player.z);

              // 2. Clear all wanted stars & reset evasion timers
              player.wantedLevel = 0;
              player.cooldownTimer = 0;
              player.pursuitEvasionTimer = 0;
              player.isPoliceChasing = false;
              player.isNearPolice = false;
              player.policeProximity = 0;
              player.evasionSuccessTimer = 3.0;

              soundEngine.playWantedCooldown();
              bannerRef.current = {
                text: 'PURSUIT EVADED!',
                subtext: 'POLICE LOST SIGHT • ALL WANTED STARS CLEARED (7s)',
                timer: 3.2,
              };
            }
          } else {
            // Passive cooldown when far from any police or no active pursuit
            if (player.wantedLevel > 0) {
              player.cooldownTimer += dt;
              if (player.cooldownTimer >= 5.0) {
                player.wantedLevel = Math.max(0, player.wantedLevel - 1);
                player.cooldownTimer = 0;
                soundEngine.playWantedCooldown();
              }
            } else {
              player.pursuitEvasionTimer = 0;
            }
          }

          // 9. Collision Detection with Traffic Cars & Police
          const trackLen = road.trackLength;
          for (let i = 0; i < road.allCars.length; i++) {
            const car = road.allCars[i];
            let relZ = car.z - player.z;
            while (relZ > trackLen / 2) relZ -= trackLen;
            while (relZ < -trackLen / 2) relZ += trackLen;

            if (Math.abs(relZ) < 130 && Math.abs(player.x - car.offset) < 0.52) {
              // Dramatic slowdown & collision bounce
              player.speed *= 0.35;
              player.screenShake = 0.85;
              soundEngine.playCrash();

              // Ramming police or hitting cars resets pursuit evasion timer
              player.pursuitEvasionTimer = 0;

              // Wanted System: Every collision with NPC increases wanted level!
              player.collisionsWithNPC++;
              const isHitPolice = car.isPolice || car.type === 'police';
              const wantedGain = isHitPolice ? 2 : 1;
              player.wantedLevel = Math.min(5, player.wantedLevel + wantedGain);
              player.maxWantedReached = Math.max(player.maxWantedReached, player.wantedLevel);
              player.wantedFlashTimer = 2.2;
              player.cooldownTimer = 0;
              soundEngine.playWantedLevelUp();

              bannerRef.current = {
                text: `WANTED ★${player.wantedLevel}`,
                subtext: isHitPolice ? 'POLICE INTERCEPTOR RAMMED!' : 'HIT & RUN! POLICE ALERTED - EVADE PURSUIT FOR 7s',
                timer: 2.2,
              };

              // Spawn collision spark particles & breaking debris shards
              const debrisColors = isHitPolice
                ? ['#38bdf8', '#ffffff', '#1e293b', '#ef4444', '#93c5fd']
                : ['#ef4444', '#ffffff', '#334155', '#f59e0b', '#38bdf8'];

              // Metal debris breaking particles
              for (let p = 0; p < 8; p++) {
                particlesRef.current.push({
                  x: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 40,
                  y: CANVAS_HEIGHT - 28,
                  vx: (Math.random() - 0.5) * 220,
                  vy: -Math.random() * 140 - 50,
                  size: Math.random() * 6 + 4,
                  color: debrisColors[p % debrisColors.length],
                  alpha: 1.0,
                  life: 0,
                  maxLife: 0.65,
                  type: 'debris',
                  rotation: Math.random() * Math.PI * 2,
                  vrot: (Math.random() - 0.5) * 16,
                });
              }

              // Bright collision sparks
              for (let p = 0; p < 12; p++) {
                particlesRef.current.push({
                  x: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 40,
                  y: CANVAS_HEIGHT - 30,
                  vx: (Math.random() - 0.5) * 180,
                  vy: -Math.random() * 110 - 40,
                  size: Math.random() * 4 + 2,
                  color: isHitPolice ? '#38bdf8' : '#facc15',
                  alpha: 1.0,
                  life: 0,
                  maxLife: 0.35,
                  type: 'spark',
                });
              }
              break;
            }
          }

          // Check if Busted by Police (Cornered/stopped while wanted)
          if (
            player.wantedLevel >= 1 &&
            (player.crashed || player.speed < 500) &&
            player.isNearPolice &&
            trafficUpdate.closestPolice &&
            Math.abs(trafficUpdate.closestPolice.z - player.z) < 180 &&
            Math.abs(player.x - trafficUpdate.closestPolice.offset) < 0.65
          ) {
            player.bustedTimer = 2.0;
            player.wantedLevel = 0;
            player.pursuitEvasionTimer = 0;
            player.timeRemaining = Math.max(1, player.timeRemaining - 5);
            soundEngine.playBustedSound();
            bannerRef.current = {
              text: 'BUSTED BY POLICE!',
              subtext: '-5 SECONDS TIME PENALTY',
              timer: 2.2,
            };
          }

          // 10. Mechanic Shop Pit Stop Power-Up Interaction
          if (playerSegment.mechanicShop && !playerSegment.mechanicShop.collected) {
            const shop = playerSegment.mechanicShop;
            // Drive into or near roadside shoulder service zone to collect power-up
            if (Math.abs(player.x - shop.offset) < 1.35) {
              shop.collected = true;
              soundEngine.playPowerUp();

              if (shop.type === 'nitro') {
                player.nitroTimer = 6.0;
                player.activePowerUpName = 'NITRO BOOST';
                player.activePowerUpTimer = 6.0;
                player.speed = Math.min(MAX_SPEED * 1.25, player.speed + 3800);
                soundEngine.playNitro();
                bannerRef.current = {
                  text: 'PIT STOP TUNE-UP!',
                  subtext: 'NITRO BOOST ACTIVATED • HYPER ACCELERATION',
                  timer: 2.8,
                };
              } else if (shop.type === 'super_grip') {
                player.superGripTimer = 8.0;
                player.activePowerUpName = 'SUPER GRIP';
                player.activePowerUpTimer = 8.0;
                bannerRef.current = {
                  text: 'PIT STOP TUNE-UP!',
                  subtext: 'SUPER GRIP ACTIVATED • NO OFF-ROAD DRAG',
                  timer: 2.8,
                };
              } else if (shop.type === 'radar_clear') {
                player.radarJammerTimer = 10.0;
                player.wantedLevel = 0;
                player.cooldownTimer = 0;
                player.activePowerUpName = 'RADAR JAMMER';
                player.activePowerUpTimer = 10.0;
                soundEngine.playWantedCooldown();
                bannerRef.current = {
                  text: 'PIT STOP TUNE-UP!',
                  subtext: 'RADAR JAMMER ACTIVATED • POLICE CALLED OFF',
                  timer: 2.8,
                };
              } else {
                player.timeRemaining += 5.0;
                player.activePowerUpName = '+5s TIME BONUS';
                player.activePowerUpTimer = 3.0;
                bannerRef.current = {
                  text: 'PIT STOP TUNE-UP!',
                  subtext: '+5 SECONDS EXTENDED RACING TIME',
                  timer: 2.8,
                };
              }

              // Power-up golden sparkles
              for (let p = 0; p < 16; p++) {
                particlesRef.current.push({
                  x: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 60,
                  y: CANVAS_HEIGHT - 35,
                  vx: (Math.random() - 0.5) * 160,
                  vy: -Math.random() * 120 - 40,
                  size: Math.random() * 6 + 3,
                  color: ['#facc15', '#38bdf8', '#ffffff', '#a855f7'][p % 4],
                  alpha: 1.0,
                  life: 0,
                  maxLife: 0.5,
                  type: 'spark',
                });
              }
            }
          }

          // 10b. Collision with Roadside Obstacles (Trees, Cacti, Rocks, Fork Divider)
          if (offRoad || playerSegment.isFork) {
            for (let i = 0; i < playerSegment.sprites.length; i++) {
              const spriteItem = playerSegment.sprites[i];
              // Safe props and service pit stops do not cause crash stops
              if (
                spriteItem.type === 'checkpoint_arch' ||
                spriteItem.type === 'mechanic_shop' ||
                spriteItem.type.startsWith('billboard_') ||
                spriteItem.type.startsWith('roadhouse_')
              ) {
                continue;
              }

              const isDivider = spriteItem.type === 'fork_divider';
              const hitCondition = isDivider
                ? Math.abs(player.x) < 0.25 // Crashed right into center fork median
                : Math.abs(player.x - spriteItem.offset) < 0.35; // Direct impact with roadside obstacle

              if (hitCondition) {
                // Full stop crash with spin animation
                player.crashed = true;
                player.crashTimer = 1.4;
                player.speed = 0;
                player.screenShake = 1.2;
                soundEngine.playCrash();

                // Breaking debris shards from impact
                for (let p = 0; p < 10; p++) {
                  particlesRef.current.push({
                    x: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 50,
                    y: CANVAS_HEIGHT - 30,
                    vx: (Math.random() - 0.5) * 240,
                    vy: -Math.random() * 160 - 60,
                    size: Math.random() * 7 + 4,
                    color: ['#ef4444', '#ffffff', '#e2e8f0', '#78350f', '#f59e0b'][p % 5],
                    alpha: 1.0,
                    life: 0,
                    maxLife: 0.75,
                    type: 'debris',
                    rotation: Math.random() * Math.PI * 2,
                    vrot: (Math.random() - 0.5) * 18,
                  });
                }

                // Crash sparks and smoke
                for (let p = 0; p < 15; p++) {
                  particlesRef.current.push({
                    x: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 50,
                    y: CANVAS_HEIGHT - 30,
                    vx: (Math.random() - 0.5) * 180,
                    vy: -Math.random() * 120 - 40,
                    size: Math.random() * 5 + 3,
                    color: '#facc15',
                    alpha: 1.0,
                    life: 0,
                    maxLife: 0.45,
                    type: 'spark',
                  });
                }
                break;
              }
            }
          }

          // 11. Checkpoint & Fork Route Branch Logic
          const stageLen = STAGE_SEGMENTS * SEGMENT_LENGTH;
          const currentStageZ = player.z % stageLen;

          if (currentStageZ > stageLen - 150 && !checkpointCrossedRef.current) {
            checkpointCrossedRef.current = true;
            soundEngine.playCheckpoint();

            if (player.stage >= TOTAL_STAGES) {
              // Victory Goal Reached!
              setGameState('VICTORY');
              player.score += 50000;
              recordHighScore(player.score, player.stage);
            } else {
              // Checkpoint passed: route left or right based on player horizontal position
              const choice = player.x < 0 ? 'left' : 'right';
              road.selectNextRoute(choice);

              const nextNode = ROUTE_NODES[road.currentStageKey];
              player.stage += 1;
              player.theme = nextNode.theme;
              player.routeHistory.push(nextNode.theme);
              player.timeRemaining += CHECKPOINT_TIME_BONUS;
              player.score += 15000;

              bannerRef.current = {
                text: 'CHECKPOINT!',
                subtext: `EXTEND TIME +${CHECKPOINT_TIME_BONUS}s | STAGE ${player.stage}: ${nextNode.name}`,
                timer: 3.5,
              };
            }
          }

          if (currentStageZ < stageLen - 500) {
            checkpointCrossedRef.current = false;
          }
        }

        // 12. Audio Engine Updates
        soundEngine.updateEngine(
          player.speed / player.maxSpeed,
          player.gear,
          player.rpm,
          isUp,
          Math.abs(player.x) > 1.0
        );

        // Police siren dynamic audio
        soundEngine.updatePoliceSiren(player.policeProximity, player.isPoliceChasing);

        // 13. Timers and Screen Shake decay
        if (player.screenShake > 0) {
          player.screenShake = Math.max(0, player.screenShake - dt * 3.5);
        }
        if (player.wantedFlashTimer > 0) {
          player.wantedFlashTimer -= dt;
        }
        if (player.bustedTimer && player.bustedTimer > 0) {
          player.bustedTimer -= dt;
        }
        if (player.evasionSuccessTimer && player.evasionSuccessTimer > 0) {
          player.evasionSuccessTimer = Math.max(0, player.evasionSuccessTimer - dt);
        }
        if (player.nitroTimer > 0) {
          player.nitroTimer = Math.max(0, player.nitroTimer - dt);
        }
        if (player.superGripTimer > 0) {
          player.superGripTimer = Math.max(0, player.superGripTimer - dt);
        }
        if (player.radarJammerTimer > 0) {
          player.radarJammerTimer = Math.max(0, player.radarJammerTimer - dt);
        }
        if (player.activePowerUpTimer && player.activePowerUpTimer > 0) {
          player.activePowerUpTimer = Math.max(0, player.activePowerUpTimer - dt);
        }

        // 14. Banner timer countdown
        if (bannerRef.current.timer > 0) {
          bannerRef.current.timer -= dt;
        }

        // 15. Update Particle Lifetimes & Physics
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          // Apply gravity to debris, water droplets, and sparks
          if (p.type === 'debris' || p.type === 'water_splash' || p.type === 'spark') {
            p.vy += 220 * dt;
          }
          if (p.vrot !== undefined) {
            p.rotation = (p.rotation || 0) + p.vrot * dt;
          }
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life += dt;
          p.alpha = Math.max(0, 1 - p.life / p.maxLife);
          if (p.life >= p.maxLife) {
            particlesRef.current.splice(i, 1);
          }
        }

        // 16. Fade and Update Road Skidmarks
        road.updateSkidmarks(dt);
      } else {
        // Idle demo mode on Title / Game Over Screen: Gentle ambient motion
        soundEngine.updateEngine(0, 1, 0.1, false, false);
        soundEngine.stopScreech();
      }

      // --- RENDER PASS (Canvas 2D 640x480) ---
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      gameRenderer.render(
        ctx,
        player,
        road.segments,
        road.trackLength,
        particlesRef.current,
        player.theme
      );

      // Render HUD and Dashboard
      dashboardRenderer.render(
        ctx,
        player,
        player.theme,
        bannerRef.current.text,
        bannerRef.current.subtext,
        bannerRef.current.timer,
        radioTrack
      );

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      isRunning = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, radioTrack, recordHighScore]);

  return (
    <main className="w-screen h-screen flex flex-col items-center justify-center bg-[#070709] p-0 sm:p-4 select-none overflow-hidden font-sans">
      {/* 4:3 Aspect Ratio Arcade Cabinet Screen */}
      <div className="relative w-full max-w-[850px] aspect-[4/3] max-h-screen bg-black rounded-none sm:rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)] border-0 sm:border sm:border-white/15 flex items-center justify-center">
        
        {/* Game Canvas (Pixelated 640x480 scaled) */}
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full object-contain pixel-canvas bg-black"
        />

        {/* Optional Retro CRT Scanlines Overlay */}
        {scanlinesEnabled && (
          <div className="absolute inset-0 scanlines pointer-events-none z-15 opacity-60" />
        )}

        {/* Arcade UI Overlay Component */}
        <ArcadeCabinet
          gameState={gameState}
          score={playerRef.current.score}
          stage={playerRef.current.stage}
          theme={playerRef.current.theme}
          carsOvertaken={playerRef.current.carsOvertaken}
          routeHistory={playerRef.current.routeHistory}
          radioTrack={radioTrack}
          isMuted={isMuted}
          scanlinesEnabled={scanlinesEnabled}
          highScores={highScores}
          wantedLevel={playerRef.current.wantedLevel}
          collisionsWithNPC={playerRef.current.collisionsWithNPC}
          onStartGame={handleStartGame}
          onRestartGame={handleRestartGame}
          onToggleMute={handleToggleMute}
          onCycleRadio={handleCycleRadio}
          onToggleScanlines={() => setScanlinesEnabled(prev => !prev)}
          onTouchSteer={handleTouchSteer}
          onTouchGas={handleTouchGas}
          onTouchBrake={handleTouchBrake}
        />
      </div>
    </main>
  );
}
