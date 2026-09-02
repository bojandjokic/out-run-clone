/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NPCType, RoadsideSpriteItem } from '../types';

export class SpriteRenderer {
  // Pre-cached procedural canvas sprites for fast 60fps blitting
  private spriteCache: Map<string, HTMLCanvasElement> = new Map();

  constructor() {
    this.generateAllSprites();
  }

  private generateAllSprites() {
    // Generate 4 animated wheel rotation frames for player and all NPC cars
    for (let f = 0; f < 4; f++) {
      this.createPlayerSprite('straight', false, f);
      this.createPlayerSprite('straight', true, f);
      this.createPlayerSprite('left', false, f);
      this.createPlayerSprite('left', true, f);
      this.createPlayerSprite('right', false, f);
      this.createPlayerSprite('right', true, f);

      // Generate NPC cars with rotating wheels
      this.createNPCSprite('sports_blue', f);
      this.createNPCSprite('sports_yellow', f);
      this.createNPCSprite('sports_red', f);
      this.createNPCSprite('truck', f);
      this.createNPCSprite('van', f);
      this.createNPCSprite('coupe_purple', f);
      this.createPoliceSprite('parked', f);
      this.createPoliceSprite('chase_1', f);
      this.createPoliceSprite('chase_2', f);
    }

    // Generate roadside objects
    this.createPalmTreeSprite();
    this.createPalmClusterSprite();
    this.createCactusSprite();
    this.createRedRockSprite();
    this.createDesertBushSprite();
    this.createSkyscraperSprite(80, 200, '#0f172a', '#38bdf8');
    this.createSkyscraperSprite(110, 260, '#1e1b4b', '#f43f5e');
    this.createNeonSignSprite('OUTRUN', '#ec4899');
    this.createNeonSignSprite('SEGA', '#06b6d4');
    this.createStreetLampSprite();
    this.createPineTreeSprite();
    this.createPineTallSprite();
    this.createForestRockSprite();
    this.createCheckpointArchSprite();
    this.createForkSignSprite('DESERT', 'CITY');
    this.createForkSignSprite('CITY', 'BEACH');
    this.createForkSignSprite('GOAL A', 'GOAL B');
    this.createForkDividerSprite();

    // Roadside Billboards
    this.createBillboardSprite('billboard_outrun', 'OUTRUN 1986', 'LIVE YOUR DREAMS', 'outrun');
    this.createBillboardSprite('billboard_synth', 'SYNTHWAVE MOTEL', 'VACANCY & POOL', 'synth');
    this.createBillboardSprite('billboard_motel', 'ROUTE 66 MOTEL', 'COLOR TV & AC', 'motel');
    this.createBillboardSprite('billboard_nitro', 'NITRO FUEL 104+', 'MAXIMUM OCTANE', 'nitro');
    this.createBillboardSprite('billboard_ferrari', 'TESTAROSSA V12', 'MARANELLO MOTORS', 'ferrari');

    // Roadhouses & Diners
    this.createRoadhouseSprite('roadhouse_diner');
    this.createRoadhouseSprite('roadhouse_motel');

    // Mechanic Shop (Power-Up Station)
    this.createMechanicShopSprite();
  }

  // --- PLAYER CAR (Ferrari Testarossa Convertible) ---
  private createPlayerSprite(direction: 'straight' | 'left' | 'right', braking: boolean, wheelFrame: number = 0) {
    const w = 164;
    const h = 94;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    // Responsive chassis roll for steering
    const tilt = direction === 'left' ? -0.065 : direction === 'right' ? 0.065 : 0;
    const offsetX = direction === 'left' ? -5 : direction === 'right' ? 5 : 0;
    ctx.translate(w / 2, h / 2);
    ctx.rotate(tilt);
    ctx.translate(-w / 2 + offsetX, -h / 2);

    // 1. Soft Asphalt Ambient Shadow
    const shadowGrad = ctx.createRadialGradient(w / 2, h - 8, 20, w / 2, h - 8, 72);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    shadowGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.35)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(w / 2, h - 8, 72, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Wide Pirelli P-Zero Racing Tires with obvious spinning animation
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.roundRect(12, 48, 28, 38, 4);
    ctx.roundRect(w - 40, 48, 28, 38, 4);
    ctx.fill();

    // Animated tire tread marks cycling down the tyre sidewalls
    ctx.fillStyle = '#3f3f46';
    for (let t = 0; t < 3; t++) {
      const treadY = 50 + ((wheelFrame * 9 + t * 11) % 32);
      ctx.fillRect(12, treadY, 4, 3);
      ctx.fillRect(w - 16, treadY, 4, 3);
    }

    // Chrome Rim Outer Circle & Dark Brake Rotor Hub
    const wheelCenters = [26, w - 26];
    const wheelY = 67;
    const wheelR = 12;
    const spokeAngleOffset = (wheelFrame * (Math.PI / 2)); // 90 degree rotation per frame

    wheelCenters.forEach((cx, idx) => {
      // Chrome outer rim lip
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(cx, wheelY, wheelR, 0, Math.PI * 2);
      ctx.fill();

      // Dark slotted brake disc rotor
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(cx, wheelY, wheelR - 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Red Brembo Brake Caliper (static behind spokes)
      ctx.fillStyle = '#ef4444';
      if (idx === 0) {
        ctx.fillRect(cx - 10, wheelY - 6, 4, 11);
      } else {
        ctx.fillRect(cx + 6, wheelY - 6, 4, 11);
      }

      // 5-Spoke Star Chrome Rim (Rotating dynamically with wheelFrame)
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let s = 0; s < 5; s++) {
        const sAngle = spokeAngleOffset + s * ((Math.PI * 2) / 5);
        const spokeEndX = cx + Math.cos(sAngle) * (wheelR - 1.5);
        const spokeEndY = wheelY + Math.sin(sAngle) * (wheelR - 1.5);

        // Dark spoke edge shadow
        ctx.strokeStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(cx, wheelY);
        ctx.lineTo(spokeEndX + 0.6, spokeEndY + 0.6);
        ctx.stroke();

        // Bright polished silver-chrome spoke face
        ctx.strokeStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(cx, wheelY);
        ctx.lineTo(spokeEndX, spokeEndY);
        ctx.stroke();
      }

      // Chrome Center Hubcap
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(cx, wheelY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Yellow Ferrari Prancing Horse center emblem dot
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(cx, wheelY, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Testarossa Sculpted Body (Gloss Metallic Scarlet)
    const bodyGrad = ctx.createLinearGradient(0, 30, 0, 82);
    bodyGrad.addColorStop(0, '#f43f5e');
    bodyGrad.addColorStop(0.3, '#e11d48');
    bodyGrad.addColorStop(0.7, '#be123c');
    bodyGrad.addColorStop(1, '#881337');
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.moveTo(18, 80);
    ctx.lineTo(w - 18, 80);
    ctx.lineTo(w - 12, 46);
    ctx.lineTo(w - 26, 32);
    ctx.lineTo(26, 32);
    ctx.lineTo(12, 46);
    ctx.closePath();
    ctx.fill();

    // Specular Sun Glint along Rear Deck
    ctx.fillStyle = '#fda4af';
    ctx.fillRect(32, 32, w - 64, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(w / 2 - 20, 32, 40, 2);

    // Testarossa Iconic Side Strakes (Air intake slats)
    ctx.fillStyle = '#4c0519';
    for (let y = 50; y <= 72; y += 4.5) {
      ctx.fillRect(20, y, 22, 2);
      ctx.fillRect(w - 42, y, 22, 2);
    }

    // 4. Cockpit & Passengers (Classic OutRun Duo)
    // Dark Tan Leather Cockpit Tub
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(36, 18, w - 72, 22);

    // Tan Leather Bucket Seat Headrests
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(46, 14, 20, 16, 4);
    ctx.roundRect(w - 66, 14, 20, 16, 4);
    ctx.fill();

    // Driver (Left side): Blue polo shirt, pilot sunglasses, brown hair
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(47, 22, 20, 12);
    // Driver Head & Sunglasses
    ctx.fillStyle = '#78350f';
    ctx.fillRect(51, 10, 13, 11);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(53, 14, 11, 4); // Aviator shades
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(52, 20, 10, 4); // Collar

    // Passenger (Right side): Chic lady with flowing windblown golden blonde hair & sunglasses
    ctx.fillStyle = '#ec4899'; // Hot pink top
    ctx.fillRect(w - 67, 22, 20, 12);
    // Golden hair blowing dynamically in the wind
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(w - 57, 15, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(w - 56, 10, 16, 12); // Flying hair strands to the right
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(w - 53, 8, 14, 6);
    // Face & Chic Shades
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(w - 62, 14, 10, 8);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(w - 61, 15, 8, 3);

    // Chrome Center Rearview Mirror with sky reflection
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(w / 2 - 8, 18, 16, 5);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(w / 2 - 6, 19, 12, 3);

    // 5. Rear Black Grille & Taillight Cluster
    ctx.fillStyle = '#09090b';
    ctx.fillRect(28, 48, w - 56, 26);

    // Testarossa Black Horizontal Slats
    ctx.fillStyle = '#18181b';
    for (let y = 50; y <= 72; y += 4) {
      ctx.fillRect(28, y, w - 56, 2);
    }

    // Taillights & Brake Lamps
    if (braking) {
      // Intense incandescent red-hot brake lighting + amber corners + center high-mount brake light
      // Left Brake Cluster
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(32, 50, 30, 20);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(36, 54, 22, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(40, 57, 14, 6);

      // Right Brake Cluster
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(w - 62, 50, 30, 20);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(w - 58, 54, 22, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(w - 54, 57, 14, 6);

      // Third Center Brake Light
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(w / 2 - 16, 44, 32, 4);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(w / 2 - 10, 44, 20, 3);
    } else {
      // Sleek running taillights
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(34, 54, 24, 14);
      ctx.fillRect(w - 58, 54, 24, 14);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(38, 57, 16, 8);
      ctx.fillRect(w - 54, 57, 16, 8);
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(42, 59, 8, 4);
      ctx.fillRect(w - 50, 59, 8, 4);
    }

    // Classic Yellow California OutRun License Plate
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(w / 2 - 16, 56, 32, 13);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('OUTRUN', w / 2, 65);

    // Quad Polished Chrome Exhaust Pipes
    const pipes = [36, 48, w - 58, w - 46];
    pipes.forEach(px => {
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.roundRect(px, 78, 10, 7, 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(px + 5, 81, 3.5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();

    const key = `player_${direction}_${braking ? 'brake' : 'normal'}_f${wheelFrame}`;
    this.spriteCache.set(key, canvas);
    if (wheelFrame === 0) {
      this.spriteCache.set(`player_${direction}_${braking ? 'brake' : 'normal'}`, canvas);
    }
  }

  // --- NPC CARS ---
  private createNPCSprite(type: NPCType, wheelFrame: number = 0) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (type === 'truck') {
      canvas.width = 168;
      canvas.height = 146;
      const w = 168;
      const h = 146;

      // Heavy 18-Wheeler Semi Rig
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(16, 126, w - 32, 18);

      // Huge Dual Rear Tires with rotating tread and lug caps
      ctx.fillStyle = '#09090b';
      ctx.fillRect(12, 84, 26, 52);
      ctx.fillRect(w - 38, 84, 26, 52);

      // Rotating heavy tire tread notches
      ctx.fillStyle = '#3f3f46';
      for (let t = 0; t < 4; t++) {
        const trY = 86 + ((wheelFrame * 12 + t * 13) % 46);
        ctx.fillRect(12, trY, 4, 4);
        ctx.fillRect(w - 16, trY, 4, 4);
      }

      // Heavy Steel Wheel Hubs
      const truckWheelY = 110;
      const truckCenters = [25, w - 25];
      truckCenters.forEach(tcx => {
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(tcx, truckWheelY, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(tcx, truckWheelY, 9, 0, Math.PI * 2);
        ctx.fill();

        // 6 rotating chrome wheel lugs
        const lugOffset = wheelFrame * (Math.PI / 3);
        for (let l = 0; l < 6; l++) {
          const lAng = lugOffset + l * (Math.PI / 3);
          const lx = tcx + Math.cos(lAng) * 6;
          const ly = truckWheelY + Math.sin(lAng) * 6;
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.arc(lx, ly, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Chrome Center Cap
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(tcx, truckWheelY, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Chrome Vertical Exhaust Smoke Stacks
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(20, 8, 8, 80);
      ctx.fillRect(w - 28, 8, 8, 80);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(18, 20, 12, 40); // Heat shields
      ctx.fillRect(w - 30, 20, 12, 40);

      // Big Rig Chrome / Yellow Cabin & Cargo Box
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(28, 16, w - 56, 106);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(32, 18, w - 64, 102);

      // Rear Cargo Doors & OutRun Freight Decal
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(40, 24, w - 80, 82);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.strokeRect(44, 28, w - 88, 74);

      ctx.fillStyle = '#0284c7';
      ctx.font = '900 10px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SEGA', w / 2, 58);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 7px sans-serif';
      ctx.fillText('EXPRESS FREIGHT', w / 2, 72);

      // Top Amber Marker Lights
      ctx.fillStyle = '#f59e0b';
      for (let x = 40; x <= w - 40; x += 18) {
        ctx.fillRect(x, 14, 8, 4);
      }

      // Heavy Steel Bumper & Mudflaps
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(22, 116, w - 44, 14);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(26, 118, 20, 8);
      ctx.fillRect(w - 46, 118, 20, 8);
    } else if (type === 'van') {
      canvas.width = 136;
      canvas.height = 106;
      const w = 136;
      const h = 106;

      // Vintage Surfer VW Camper Van
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(12, 88, w - 24, 14);

      // Wheels with spinning chrome dish & whitewalls
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(12, 64, 22, 34);
      ctx.fillRect(w - 34, 64, 22, 34);

      // Whitewall & rotating tread ticks
      ctx.fillStyle = '#cbd5e1';
      for (let t = 0; t < 3; t++) {
        const trY = 66 + ((wheelFrame * 8 + t * 10) % 28);
        ctx.fillRect(12, trY, 3, 3);
        ctx.fillRect(w - 15, trY, 3, 3);
      }

      const vanCenters = [23, w - 23];
      const vanWheelY = 81;
      vanCenters.forEach(vcx => {
        // Chrome Dish
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(vcx, vanWheelY, 8.5, 0, Math.PI * 2);
        ctx.fill();

        // 4 Rotating slots in vintage hubcap
        const slotAngle = wheelFrame * (Math.PI / 2);
        ctx.fillStyle = '#1e293b';
        for (let s = 0; s < 4; s++) {
          const sAng = slotAngle + s * (Math.PI / 2);
          const sx = vcx + Math.cos(sAng) * 5;
          const sy = vanWheelY + Math.sin(sAng) * 5;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(vcx, vanWheelY, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Two-Tone Seafoam Green & Cream Body
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.roundRect(20, 36, w - 40, 52, 8);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.roundRect(24, 18, w - 48, 24, 6);
      ctx.fill();

      // Roof Rack with Surfboards
      ctx.fillStyle = '#64748b';
      ctx.fillRect(26, 14, w - 52, 4);
      ctx.fillStyle = '#06b6d4'; // Cyan surfboard
      ctx.beginPath();
      ctx.ellipse(w / 2 - 12, 10, 24, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f43f5e'; // Pink surfboard
      ctx.beginPath();
      ctx.ellipse(w / 2 + 12, 8, 24, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rear Windows
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(32, 24, w - 64, 20);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(36, 26, 28, 16);
      ctx.fillRect(72, 26, 28, 16);

      // Spare Tire on Rear
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(w / 2, 62, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(w / 2, 62, 9, 0, Math.PI * 2);
      ctx.fill();

      // Bumper & Lights
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(20, 80, w - 40, 10);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(22, 82, 12, 6);
      ctx.fillRect(w - 34, 82, 12, 6);
    } else {
      // Supercars & Sports Coupes
      canvas.width = 146;
      canvas.height = 80;
      const w = 146;
      const h = 80;

      let mainColor = '#0284c7';
      let darkColor = '#0369a1';
      let spoilerColor = '#0f172a';

      if (type === 'sports_red') {
        mainColor = '#dc2626';
        darkColor = '#991b1b';
        spoilerColor = '#7f1d1d';
      } else if (type === 'sports_yellow') {
        mainColor = '#eab308';
        darkColor = '#a16207';
        spoilerColor = '#713f12';
      } else if (type === 'coupe_purple') {
        mainColor = '#9333ea';
        darkColor = '#6b21a8';
        spoilerColor = '#3b0764';
      }

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath();
      ctx.ellipse(w / 2, h - 8, 56, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wheels with obvious spinning rims
      ctx.fillStyle = '#09090b';
      ctx.fillRect(14, 40, 22, 32);
      ctx.fillRect(w - 36, 40, 22, 32);

      // Tread notches
      ctx.fillStyle = '#3f3f46';
      for (let t = 0; t < 3; t++) {
        const trY = 42 + ((wheelFrame * 8 + t * 9) % 26);
        ctx.fillRect(14, trY, 3, 3);
        ctx.fillRect(w - 17, trY, 3, 3);
      }

      const scCenters = [25, w - 25];
      const scWheelY = 56;
      const scR = 10;
      const scSpokeOffset = wheelFrame * (Math.PI / 2);

      scCenters.forEach(cx => {
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(cx, scWheelY, scR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.arc(cx, scWheelY, scR - 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 5 rotating silver alloy spokes
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        for (let s = 0; s < 5; s++) {
          const sAngle = scSpokeOffset + s * ((Math.PI * 2) / 5);
          const endX = cx + Math.cos(sAngle) * (scR - 1.5);
          const endY = scWheelY + Math.sin(sAngle) * (scR - 1.5);

          ctx.strokeStyle = '#f8fafc';
          ctx.beginPath();
          ctx.moveTo(cx, scWheelY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }

        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(cx, scWheelY, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Sleek Aerodynamic Body
      const bodyGrad = ctx.createLinearGradient(0, 20, 0, 68);
      bodyGrad.addColorStop(0, mainColor);
      bodyGrad.addColorStop(1, darkColor);
      ctx.fillStyle = bodyGrad;

      ctx.beginPath();
      ctx.moveTo(16, 68);
      ctx.lineTo(w - 16, 68);
      ctx.lineTo(w - 12, 34);
      ctx.lineTo(w - 28, 20);
      ctx.lineTo(28, 20);
      ctx.lineTo(12, 34);
      ctx.closePath();
      ctx.fill();

      // High Rear Spoiler Wing (F40 / Porsche style)
      ctx.fillStyle = spoilerColor;
      ctx.fillRect(20, 16, w - 40, 6);
      ctx.fillRect(24, 20, 8, 14);
      ctx.fillRect(w - 32, 20, 8, 14);

      // Tinted Rear Glass Windshield
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(38, 24, w - 76, 18);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(42, 26, w - 84, 14);

      // Tail panel & Quad Lights
      ctx.fillStyle = '#09090b';
      ctx.fillRect(24, 46, w - 48, 20);

      // Quad Circular Taillights
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(36, 56, 6, 0, Math.PI * 2);
      ctx.arc(50, 56, 6, 0, Math.PI * 2);
      ctx.arc(w - 50, 56, 6, 0, Math.PI * 2);
      ctx.arc(w - 36, 56, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(36, 56, 2.5, 0, Math.PI * 2);
      ctx.arc(w - 36, 56, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Dual Chrome Exhausts
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(58, 66, 8, 5);
      ctx.fillRect(w - 66, 66, 8, 5);
    }

    this.spriteCache.set(`npc_${type}_f${wheelFrame}`, canvas);
    if (wheelFrame === 0) {
      this.spriteCache.set(`npc_${type}`, canvas);
    }
  }

  // Police Interceptor Cruiser Sprite (Parked / Chase 1 / Chase 2)
  private createPoliceSprite(mode: 'parked' | 'chase_1' | 'chase_2', wheelFrame: number = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 152;
    canvas.height = 88;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 152;
    const h = 88;
    const isChasing = mode === 'chase_1' || mode === 'chase_2';
    const altSiren = mode === 'chase_2';

    // 1. Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h - 8, 64, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Wide Pursuit Tires & Chrome Center Caps with spinning rotation
    ctx.fillStyle = '#09090b';
    ctx.fillRect(12, 46, 26, 36);
    ctx.fillRect(w - 38, 46, 26, 36);

    // Tread notches
    ctx.fillStyle = '#3f3f46';
    for (let t = 0; t < 3; t++) {
      const trY = 48 + ((wheelFrame * 9 + t * 10) % 30);
      ctx.fillRect(12, trY, 3, 3);
      ctx.fillRect(w - 15, trY, 3, 3);
    }

    const copCenters = [25, w - 25];
    const copWheelY = 64;
    const copR = 11;
    const copOffset = wheelFrame * (Math.PI / 2);

    copCenters.forEach(cx => {
      // Steel pursuit rim
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(cx, copWheelY, copR, 0, Math.PI * 2);
      ctx.fill();

      // 5 rotating vent slots in police steel rim
      ctx.fillStyle = '#0f172a';
      for (let s = 0; s < 5; s++) {
        const sAng = copOffset + s * ((Math.PI * 2) / 5);
        const sx = cx + Math.cos(sAng) * 7;
        const sy = copWheelY + Math.sin(sAng) * 7;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Chrome "dog-dish" center hubcap
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(cx, copWheelY, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(cx, copWheelY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillRect(20, 60, 10, 8);
    ctx.fillRect(w - 30, 60, 10, 8);

    // 3. Black Main Chassis (Highway Patrol High-Gloss Black)
    const blackGrad = ctx.createLinearGradient(0, 24, 0, 72);
    blackGrad.addColorStop(0, '#1e293b');
    blackGrad.addColorStop(0.4, '#0f172a');
    blackGrad.addColorStop(1, '#020617');
    ctx.fillStyle = blackGrad;

    ctx.beginPath();
    ctx.moveTo(16, 72);
    ctx.lineTo(w - 16, 72);
    ctx.lineTo(w - 12, 38);
    ctx.lineTo(w - 28, 24);
    ctx.lineTo(28, 24);
    ctx.lineTo(12, 38);
    ctx.closePath();
    ctx.fill();

    // 4. Arctic White Roof & Trunk Livery
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(34, 30, w - 68, 22);

    // Tinted Rear Window Glass with Police Antenna
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(38, 22, w - 76, 16);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(42, 24, w - 84, 12);

    // Roof Antenna
    ctx.fillStyle = '#64748b';
    ctx.fillRect(w / 2 - 1, 6, 2, 14);

    // 5. Gold Highway Patrol Star Shield & Badge
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(w / 2, 54, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(w / 2, 54, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 9px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIGHWAY PATROL', w / 2, 44);

    // 6. Rear Tail Lights & Strobe Flashers
    ctx.fillStyle = '#09090b';
    ctx.fillRect(22, 50, w - 44, 18);

    // Taillights
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(24, 52, 20, 14);
    ctx.fillRect(w - 44, 52, 20, 14);

    // Bumper Strobes (Flashing during chase, stealth when parked)
    if (isChasing) {
      ctx.fillStyle = altSiren ? '#38bdf8' : '#ef4444';
      ctx.fillRect(28, 56, 12, 6);
      ctx.fillStyle = altSiren ? '#ef4444' : '#38bdf8';
      ctx.fillRect(w - 40, 56, 12, 6);
    } else {
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(28, 56, 12, 6);
      ctx.fillRect(w - 40, 56, 12, 6);
    }

    // License Plate
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(w / 2 - 14, 60, 28, 9);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('SHERIFF', w / 2, 67);

    // Heavy Steel Push Bumper (Bull Bar)
    ctx.fillStyle = '#18181b';
    ctx.fillRect(18, 68, w - 36, 7);
    ctx.fillStyle = '#52525b';
    ctx.fillRect(36, 64, 6, 11);
    ctx.fillRect(w - 42, 64, 6, 11);

    // 7. Roof Emergency Lightbar (Stealth when parked, Blazing when chasing)
    // Mounting Bracket
    ctx.fillStyle = '#334155';
    ctx.fillRect(40, 16, w - 80, 4);

    if (isChasing) {
      // Dual-Color Blazing Laser Strobes with Radiant Glow Bloomer
      const leftCol = altSiren ? '#06b6d4' : '#ef4444';
      const rightCol = altSiren ? '#ef4444' : '#06b6d4';

      // Left Strobe
      ctx.fillStyle = leftCol;
      ctx.fillRect(42, 10, 24, 9);
      // Right Strobe
      ctx.fillStyle = rightCol;
      ctx.fillRect(w - 66, 10, 24, 9);

      // Center High-Intensity White Strobe
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(w / 2 - 6, 11, 12, 7);

      // Radiant Optical Blooms around active flashers
      ctx.fillStyle = altSiren ? 'rgba(6, 182, 212, 0.55)' : 'rgba(239, 68, 68, 0.55)';
      ctx.beginPath();
      ctx.arc(54, 14, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = altSiren ? 'rgba(239, 68, 68, 0.55)' : 'rgba(6, 182, 212, 0.55)';
      ctx.beginPath();
      ctx.arc(w - 54, 14, 16, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Parked / Stealth Mode: Clear aerodynamic acrylic lightbar lenses (Off / Standby)
      ctx.fillStyle = 'rgba(71, 85, 105, 0.6)';
      ctx.fillRect(42, 10, w - 84, 8);
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(44, 11, 20, 6);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(w - 64, 11, 20, 6);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(w / 2 - 4, 12, 8, 4);
    }

    const baseKey = mode === 'parked' ? 'npc_police_parked' : mode === 'chase_2' ? 'npc_police_alt' : 'npc_police';
    this.spriteCache.set(`${baseKey}_f${wheelFrame}`, canvas);
    if (wheelFrame === 0) {
      this.spriteCache.set(baseKey, canvas);
    }
  }

  // --- ROADSIDE OBJECTS ---
  private createPalmTreeSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Curved Trunk
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(80, 235);
    ctx.quadraticCurveTo(60, 140, 85, 50);
    ctx.stroke();

    // Trunk rings
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 10;
    ctx.stroke();

    // Coconuts
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(80, 52, 6, 0, Math.PI * 2);
    ctx.arc(88, 54, 5, 0, Math.PI * 2);
    ctx.fill();

    // Palm Fronds (Lush 80s arcade tropical leaves)
    const fronds = [
      { ex: 10, ey: 30, cx: 30, cy: 0 },
      { ex: 150, ey: 30, cx: 130, cy: 0 },
      { ex: 5, ey: 70, cx: 35, cy: 30 },
      { ex: 155, ey: 70, cx: 125, cy: 30 },
      { ex: 40, ey: 10, cx: 60, cy: -15 },
      { ex: 120, ey: 10, cx: 100, cy: -15 },
    ];

    fronds.forEach(f => {
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.moveTo(85, 48);
      ctx.quadraticCurveTo(f.cx, f.cy, f.ex, f.ey);
      ctx.quadraticCurveTo(f.cx + 5, f.cy + 25, 85, 54);
      ctx.fill();

      // Frond highlight
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.moveTo(85, 48);
      ctx.quadraticCurveTo(f.cx, f.cy + 5, f.ex, f.ey);
      ctx.quadraticCurveTo(f.cx + 2, f.cy + 15, 85, 52);
      ctx.fill();
    });

    this.spriteCache.set('palm_tree', canvas);
  }

  private createPalmClusterSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 250;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw two overlapping palm trees
    const palm = this.spriteCache.get('palm_tree');
    if (palm) {
      ctx.drawImage(palm, 0, 10, 140, 230);
      ctx.drawImage(palm, 90, 0, 150, 250);
    }

    this.spriteCache.set('palm_cluster', canvas);
  }

  private createCactusSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Main Trunk
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.roundRect(46, 20, 28, 170, 14);
    ctx.fill();

    // Left Arm
    ctx.beginPath();
    ctx.roundRect(14, 60, 20, 44, 10);
    ctx.roundRect(14, 90, 40, 18, 8);
    ctx.fill();

    // Right Arm (Higher)
    ctx.beginPath();
    ctx.roundRect(86, 40, 20, 50, 10);
    ctx.roundRect(66, 76, 40, 18, 8);
    ctx.fill();

    // Rib highlights
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(54, 30);
    ctx.lineTo(54, 180);
    ctx.moveTo(66, 30);
    ctx.lineTo(66, 180);
    ctx.stroke();

    this.spriteCache.set('cactus', canvas);
  }

  private createRedRockSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Desert Mesa Formation
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(10, 135);
    ctx.lineTo(40, 30);
    ctx.lineTo(140, 25);
    ctx.lineTo(170, 135);
    ctx.closePath();
    ctx.fill();

    // Horizontal sandstone layers
    const layers = [
      { y: 35, h: 14, col: '#b45309' },
      { y: 55, h: 18, col: '#d97706' },
      { y: 78, h: 22, col: '#92400e' },
      { y: 105, h: 25, col: '#78350f' },
    ];

    layers.forEach(l => {
      ctx.fillStyle = l.col;
      ctx.fillRect(20, l.y, 140, l.h);
    });

    this.spriteCache.set('red_rock', canvas);
  }

  private createDesertBushSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#a16207';
    ctx.beginPath();
    ctx.arc(40, 38, 20, 0, Math.PI * 2);
    ctx.arc(26, 42, 14, 0, Math.PI * 2);
    ctx.arc(54, 40, 15, 0, Math.PI * 2);
    ctx.fill();

    this.spriteCache.set('desert_bush', canvas);
  }

  private createSkyscraperSprite(w: number, h: number, bodyCol: string, glowCol: string) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = bodyCol;
    ctx.fillRect(0, 0, w, h);

    // Grid of illuminated windows
    ctx.fillStyle = glowCol;
    for (let y = 14; y < h - 20; y += 16) {
      for (let x = 8; x < w - 12; x += 12) {
        if (Math.sin(x * 12 + y * 7) > -0.2) {
          ctx.fillRect(x, y, 6, 8);
        }
      }
    }

    // Antenna & beacon
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(w / 2 - 2, 0, 4, 10);
    ctx.beginPath();
    ctx.arc(w / 2, 2, 3, 0, Math.PI * 2);
    ctx.fill();

    const key = w > 90 ? 'skyscraper_tall' : 'skyscraper_small';
    this.spriteCache.set(key, canvas);
  }

  private createNeonSignSprite(text: string, color: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Poles
    ctx.fillStyle = '#334155';
    ctx.fillRect(40, 50, 8, 50);
    ctx.fillRect(132, 50, 8, 50);

    // Sign Box
    ctx.fillStyle = '#09090b';
    ctx.fillRect(10, 10, 160, 45);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 160, 45);

    // Neon Text
    ctx.fillStyle = color;
    ctx.font = 'bold 20px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 90, 32);

    const key = text === 'OUTRUN' ? 'neon_sign_outrun' : 'neon_sign_sega';
    this.spriteCache.set(key, canvas);
  }

  private createStreetLampSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(20, 200);
    ctx.lineTo(20, 30);
    ctx.quadraticCurveTo(20, 10, 50, 10);
    ctx.stroke();

    // Glowing Sodium Lamp
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(44, 8, 20, 10);
    ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
    ctx.beginPath();
    ctx.arc(54, 18, 16, 0, Math.PI * 2);
    ctx.fill();

    this.spriteCache.set('street_lamp', canvas);
  }

  private createPineTreeSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Trunk
    ctx.fillStyle = '#451a03';
    ctx.fillRect(52, 140, 16, 55);

    // 3 Foliage Triangles
    const tiers = [
      { y: 150, h: 50, w: 90, col: '#064e3b' },
      { y: 110, h: 55, w: 75, col: '#047857' },
      { y: 65, h: 60, w: 55, col: '#10b981' },
    ];

    tiers.forEach(t => {
      ctx.fillStyle = t.col;
      ctx.beginPath();
      ctx.moveTo(60 - t.w / 2, t.y);
      ctx.lineTo(60 + t.w / 2, t.y);
      ctx.lineTo(60, t.y - t.h);
      ctx.closePath();
      ctx.fill();
    });

    this.spriteCache.set('pine_tree', canvas);
  }

  private createPineTallSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 140;
    canvas.height = 260;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pine = this.spriteCache.get('pine_tree');
    if (pine) {
      ctx.drawImage(pine, 0, 0, 140, 260);
    }
    this.spriteCache.set('pine_tall', canvas);
  }

  private createForestRockSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 70;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.ellipse(50, 45, 40, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    // Moss patch
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.ellipse(45, 36, 25, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    this.spriteCache.set('forest_rock', canvas);
  }

  private createCheckpointArchSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 260;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Checkered Overhead Bridge Arch
    // Left Support Truss
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(40, 40, 36, 220);
    // Right Support Truss
    ctx.fillRect(524, 40, 36, 220);

    // Cross-trusses
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    for (let y = 60; y < 240; y += 40) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(76, y + 40);
      ctx.moveTo(524, y);
      ctx.lineTo(560, y + 40);
      ctx.stroke();
    }

    // Overhead Header Sign
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(30, 20, 540, 70);

    // Checkered Board Borders
    const sqSize = 14;
    for (let x = 30; x < 570; x += sqSize) {
      ctx.fillStyle = (Math.floor((x - 30) / sqSize) % 2 === 0) ? '#ffffff' : '#000000';
      ctx.fillRect(x, 20, sqSize, 12);
      ctx.fillRect(x, 78, sqSize, 12);
    }

    // Glowing Neon CHECKPOINT Text
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 28px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CHECKPOINT', 300, 54);

    this.spriteCache.set('checkpoint_arch', canvas);
  }

  private createForkSignSprite(leftName: string, rightName: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Metal Truss Pillars
    ctx.fillStyle = '#475569';
    ctx.fillRect(40, 40, 30, 200);
    ctx.fillRect(530, 40, 30, 200);

    // Main Overhead Direction Board
    ctx.fillStyle = '#065f46'; // Green Highway Sign
    ctx.fillRect(50, 20, 500, 80);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(52, 22, 496, 76);

    // Divider Line
    ctx.beginPath();
    ctx.moveTo(300, 20);
    ctx.lineTo(300, 100);
    ctx.stroke();

    // Left Choice Text & Arrow
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`◀ ${leftName}`, 175, 62);

    // Right Choice Text & Arrow
    ctx.fillText(`${rightName} ▶`, 425, 62);

    const key = `fork_sign_${leftName.toLowerCase()}_${rightName.toLowerCase()}`;
    this.spriteCache.set(key, canvas);
  }

  private createForkDividerSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Yellow-Black Striped Crash Cushion Barrel
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.roundRect(10, 10, 60, 85, 12);
    ctx.fill();

    // Black Hazard Chevrons
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(10, 30);
    ctx.lineTo(40, 45);
    ctx.lineTo(70, 30);
    ctx.lineTo(70, 45);
    ctx.lineTo(40, 60);
    ctx.lineTo(10, 45);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(10, 60);
    ctx.lineTo(40, 75);
    ctx.lineTo(70, 60);
    ctx.lineTo(70, 75);
    ctx.lineTo(40, 90);
    ctx.lineTo(10, 75);
    ctx.closePath();
    ctx.fill();

    this.spriteCache.set('fork_divider', canvas);
  }

  // --- 16-BIT RETRO ROADSIDE BILLBOARDS ---
  private createBillboardSprite(
    key: string,
    title: string,
    subtitle: string,
    theme: 'outrun' | 'synth' | 'motel' | 'nitro' | 'ferrari'
  ) {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Heavy Industrial Steel Post Supports
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(45, 75, 12, 65);
    ctx.fillRect(183, 75, 12, 65);

    // Cross brace struts
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(45, 80);
    ctx.lineTo(195, 130);
    ctx.moveTo(195, 80);
    ctx.lineTo(45, 130);
    ctx.stroke();

    // Main Billboard Face Frame
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(10, 8, 220, 72);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 8, 220, 72);

    // Top Floodlights
    ctx.fillStyle = '#64748b';
    ctx.fillRect(35, 2, 8, 6);
    ctx.fillRect(116, 2, 8, 6);
    ctx.fillRect(197, 2, 8, 6);

    // Poster Background depending on theme
    if (theme === 'outrun') {
      const grad = ctx.createLinearGradient(12, 10, 12, 78);
      grad.addColorStop(0, '#f43f5e');
      grad.addColorStop(0.5, '#fb923c');
      grad.addColorStop(1, '#6366f1');
      ctx.fillStyle = grad;
      ctx.fillRect(13, 11, 214, 66);

      // Retro Wireframe Sun & Grid
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(42, 38, 16, 0, Math.PI * 2);
      ctx.fill();

      // Bold Typography
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 13px "Chakra Petch", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, 64, 34);

      ctx.fillStyle = '#fef08a';
      ctx.font = '700 8px "Chakra Petch", sans-serif';
      ctx.fillText(subtitle, 64, 52);
    } else if (theme === 'synth') {
      const grad = ctx.createLinearGradient(12, 10, 12, 78);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#581c87');
      ctx.fillStyle = grad;
      ctx.fillRect(13, 11, 214, 66);

      // Neon Palm Silhouette
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(38, 42, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(35, 30, 6, 26);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '900 12px "Chakra Petch", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, 60, 34);

      ctx.fillStyle = '#f472b6';
      ctx.font = '700 8px "Chakra Petch", sans-serif';
      ctx.fillText(subtitle, 60, 52);
    } else if (theme === 'nitro') {
      const grad = ctx.createLinearGradient(12, 10, 12, 78);
      grad.addColorStop(0, '#7f1d1d');
      grad.addColorStop(0.5, '#ea580c');
      grad.addColorStop(1, '#facc15');
      ctx.fillStyle = grad;
      ctx.fillRect(13, 11, 214, 66);

      // Fiery Nitro canister icon
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(24, 24, 18, 36);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NOS', 33, 44);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 13px "Chakra Petch", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, 52, 34);

      ctx.fillStyle = '#09090b';
      ctx.font = '900 8px "Chakra Petch", sans-serif';
      ctx.fillText(subtitle, 52, 52);
    } else if (theme === 'ferrari') {
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(13, 11, 214, 66);

      // Yellow shield badge
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(24, 22);
      ctx.lineTo(44, 22);
      ctx.lineTo(44, 44);
      ctx.lineTo(34, 54);
      ctx.lineTo(24, 44);
      ctx.closePath();
      ctx.fill();

      // Italian Tricolore stripe
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(26, 24, 5, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(31, 24, 6, 4);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(37, 24, 5, 4);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 13px "Chakra Petch", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, 54, 34);

      ctx.fillStyle = '#fef08a';
      ctx.font = '700 8px "Chakra Petch", sans-serif';
      ctx.fillText(subtitle, 54, 52);
    } else {
      // Motel retro
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(13, 11, 214, 66);

      ctx.fillStyle = '#facc15';
      ctx.font = '900 13px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, 120, 34);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 9px "Chakra Petch", sans-serif';
      ctx.fillText(`★ ${subtitle} ★`, 120, 52);
    }

    this.spriteCache.set(key, canvas);
  }

  // --- 16-BIT ROADSIDE ROADHOUSE / DINER ---
  private createRoadhouseSprite(type: 'roadhouse_diner' | 'roadhouse_motel') {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 300;
    const h = 180;

    // 1. Ground asphalt shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(10, 160, 280, 18);

    // 2. Main Building Structure (Retro Brick / Chrome Streamline Moderne)
    const isDiner = type === 'roadhouse_diner';
    ctx.fillStyle = isDiner ? '#475569' : '#334155';
    ctx.fillRect(30, 60, 240, 100);

    // Facade upper panel
    ctx.fillStyle = isDiner ? '#dc2626' : '#1e3a8a';
    ctx.fillRect(25, 50, 250, 24);

    // Striped Awning Canopy
    const awningY = 74;
    const stripeW = 12;
    for (let x = 30; x < 270; x += stripeW) {
      ctx.fillStyle = ((x / stripeW) % 2 === 0) ? '#ffffff' : (isDiner ? '#dc2626' : '#0284c7');
      ctx.fillRect(x, awningY, stripeW, 14);
    }

    // Windows with Warm Interior Glow & Silhouettes
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(45, 96, 70, 48);
    ctx.fillRect(185, 96, 70, 48);

    // Window Mullions
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.strokeRect(45, 96, 70, 48);
    ctx.strokeRect(185, 96, 70, 48);

    // Silhouettes in diner
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(70, 120, 8, 0, Math.PI * 2);
    ctx.arc(210, 120, 8, 0, Math.PI * 2);
    ctx.fill();

    // Central Glass Entrance Door
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(130, 92, 40, 68);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2;
    ctx.strokeRect(130, 92, 40, 68);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(162, 124, 4, 8); // Gold handle

    // Rooftop Glowing Neon Signboard
    ctx.fillStyle = '#09090b';
    ctx.fillRect(60, 16, 180, 36);
    ctx.strokeStyle = isDiner ? '#ec4899' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(60, 16, 180, 36);

    ctx.fillStyle = isDiner ? '#f43f5e' : '#38bdf8';
    ctx.font = 'bold 13px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(isDiner ? 'ROADHOUSE' : 'MOTEL 66', 150, 38);

    // Roadside Neon Pole Sign
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(272, 30, 6, 130);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(275, 24, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#09090b';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('OPEN', 275, 27);

    this.spriteCache.set(type, canvas);
  }

  // --- 16-BIT MECHANIC SHOP (POWER-UP STATION) ---
  private createMechanicShopSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 190;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Service Apron / Drive-Thru Shoulder Pit Area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(10, 168, 300, 20);

    // Yellow/Black Hazard Stripes on Driveway Apron
    const stripeW = 16;
    for (let x = 15; x < 305; x += stripeW) {
      ctx.fillStyle = ((x / stripeW) % 2 === 0) ? '#eab308' : '#0f172a';
      ctx.fillRect(x, 172, stripeW, 8);
    }

    // 2. Main Garage Building (High Tech Speed Tuning Pit)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(20, 50, 280, 118);

    // Steel roll-up door Bay 1 (Active Tuning Bay)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(36, 75, 95, 93);
    // Interior Tool Rack & Neon Glow inside Bay 1
    ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.fillRect(38, 77, 91, 91);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(50, 100, 40, 24); // Tool bench

    // Bay 2 (Hydraulic Car Lift)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(150, 75, 95, 93);
    ctx.fillStyle = 'rgba(234, 179, 8, 0.25)';
    ctx.fillRect(152, 77, 91, 91);
    // Hydraulic Lift Posts
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(160, 90, 8, 75);
    ctx.fillRect(225, 90, 8, 75);

    // Right Office Door
    ctx.fillStyle = '#334155';
    ctx.fillRect(258, 85, 32, 83);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(264, 95, 20, 28); // Lit window

    // 3. High-Voltage Rooftop Marquee Neon Sign
    ctx.fillStyle = '#09090b';
    ctx.fillRect(30, 12, 260, 40);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 12, 260, 40);

    // Glowing Power-up Wrench / Lightning Icon
    ctx.fillStyle = '#facc15';
    ctx.font = '900 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡', 52, 38);
    ctx.fillText('⚡', 268, 38);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px "Press Start 2P", monospace';
    ctx.fillText('PIT STOP POWER-UP', 160, 36);

    // Stacked Racing Tires in front
    ctx.fillStyle = '#09090b';
    ctx.fillRect(246, 142, 14, 12);
    ctx.fillRect(246, 154, 14, 12);
    ctx.fillRect(258, 148, 14, 18);

    // Red High-Octane Gas Pump
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(285, 125, 16, 42);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(287, 132, 12, 10);

    this.spriteCache.set('mechanic_shop', canvas);
  }

  public getSprite(name: string): HTMLCanvasElement | undefined {
    return this.spriteCache.get(name);
  }

  public drawPlayer(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    steerAngle: -1 | 0 | 1,
    braking: boolean,
    spinAngle: number = 0,
    speed: number = 0,
    z: number = 0
  ) {
    const dir = steerAngle === -1 ? 'left' : steerAngle === 1 ? 'right' : 'straight';
    const wheelFrame = Math.abs(speed) > 30 ? Math.abs(Math.floor(z / 35)) % 4 : 0;
    const key = `player_${dir}_${braking ? 'brake' : 'normal'}_f${wheelFrame}`;
    const sprite =
      this.spriteCache.get(key) ||
      this.spriteCache.get(`player_${dir}_${braking ? 'brake' : 'normal'}_f0`) ||
      this.spriteCache.get(`player_${dir}_${braking ? 'brake' : 'normal'}`);
    if (!sprite) return;

    const w = sprite.width * scale;
    const h = sprite.height * scale;

    ctx.save();
    ctx.translate(x, y);
    if (spinAngle !== 0) {
      ctx.rotate(spinAngle);
    }
    ctx.drawImage(sprite, -w / 2, -h, w, h);
    ctx.restore();
  }

  public drawNPC(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    type: NPCType,
    clipY: number = 0,
    sirenPhase: number = 0,
    pursuitMode?: 'parked' | 'patrol' | 'chase' | 'cooldown',
    speed: number = 0,
    z: number = 0
  ) {
    const isMoving = pursuitMode !== 'parked' && Math.abs(speed) > 20;
    const wheelFrame = isMoving ? Math.abs(Math.floor(z / 35)) % 4 : 0;
    let key = `npc_${type}_f${wheelFrame}`;
    if (type === 'police') {
      if (pursuitMode === 'parked') {
        key = 'npc_police_parked_f0';
      } else if (pursuitMode === 'chase') {
        const isAlt = Math.floor(sirenPhase * 8) % 2 === 1;
        key = isAlt ? `npc_police_alt_f${wheelFrame}` : `npc_police_f${wheelFrame}`;
      } else {
        key = `npc_police_f${wheelFrame}`;
      }
    }

    const sprite =
      this.spriteCache.get(key) ||
      this.spriteCache.get(`npc_${type}_f0`) ||
      this.spriteCache.get(`npc_${type}`);
    if (!sprite) return;

    const w = sprite.width * scale;
    const h = sprite.height * scale;
    const destY = y - h;

    // Hill crest occlusion: only clip if an actual hill crest in foreground is occluding
    if (clipY > 0 && clipY < 475) {
      if (destY >= clipY) return; // Completely behind hill crest
      if (destY + h > clipY) {
        const visibleHeight = clipY - destY;
        if (visibleHeight <= 0) return;
        const sourceH = sprite.height * (visibleHeight / h);
        ctx.drawImage(
          sprite,
          0, 0, sprite.width, sourceH,
          x - w / 2, destY, w, visibleHeight
        );
        return;
      }
    }

    ctx.drawImage(sprite, x - w / 2, destY, w, h);
  }

  public drawRoadsideObject(
    ctx: CanvasRenderingContext2D,
    spriteItem: RoadsideSpriteItem,
    x: number,
    y: number,
    scale: number,
    clipY: number = 0
  ) {
    let key: string = spriteItem.type;
    if (spriteItem.type === 'fork_sign_beach_desert') key = 'fork_sign_desert_city';
    else if (spriteItem.type === 'fork_sign_city_forest') key = 'fork_sign_city_beach';
    else if (spriteItem.type === 'fork_sign_final') key = 'fork_sign_goal a_goal b';

    const sprite = this.spriteCache.get(key) || this.spriteCache.get('palm_tree');
    if (!sprite) return;

    const customMult = spriteItem.scaleMultiplier || 1.0;
    const w = sprite.width * scale * customMult;
    const h = sprite.height * scale * customMult;
    const destY = y - h;

    // Hill crest occlusion: only clip if an actual hill crest in foreground is occluding
    if (clipY > 0 && clipY < 475) {
      if (destY >= clipY) return; // Completely behind hill crest
      if (destY + h > clipY) {
        const visibleHeight = clipY - destY;
        if (visibleHeight <= 0) return;
        const sourceH = sprite.height * (visibleHeight / h);
        ctx.drawImage(
          sprite,
          0, 0, sprite.width, sourceH,
          x - w / 2, destY, w, visibleHeight
        );
        return;
      }
    }

    ctx.drawImage(sprite, x - w / 2, destY, w, h);
  }
}

export const spriteRenderer = new SpriteRenderer();
