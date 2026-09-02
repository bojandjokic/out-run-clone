/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Segment, PlayerState, Particle, SceneryTheme } from '../types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  ROAD_WIDTH,
  CAMERA_HEIGHT,
  CAMERA_DEPTH,
  DRAW_DISTANCE,
  THEME_PALETTES,
} from './constants';
import { spriteRenderer } from './sprites';

export class GameRenderer {
  private width: number = CANVAS_WIDTH;
  private height: number = CANVAS_HEIGHT;
  private bgSkyOffset: number = 0;
  private bgMountainOffset: number = 0;
  private bgMidgroundOffset: number = 0;

  constructor() {}

  public render(
    ctx: CanvasRenderingContext2D,
    player: PlayerState,
    segments: Segment[],
    trackLength: number,
    particles: Particle[],
    theme: SceneryTheme
  ) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Apply Screen Shake on crash/bump
    if (player.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * player.screenShake * 12;
      const shakeY = (Math.random() - 0.5) * player.screenShake * 12;
      ctx.translate(shakeX, shakeY);
    }

    const cameraOffsetZ = CAMERA_HEIGHT * CAMERA_DEPTH;
    const cameraZ = player.z - cameraOffsetZ;
    const baseSegment = this.findSegment(segments, trackLength, cameraZ);
    const basePercent = ((cameraZ % 200) + 200) % 200 / 200;
    const playerSegment = this.findSegment(segments, trackLength, player.z);
    const playerPercent = ((player.z % 200) + 200) % 200 / 200;
    const playerY = this.interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);

    let x = 0;
    let dx = -(baseSegment.curve * basePercent);

    // 1. Render Parallax Sky & Backgrounds
    this.updateBackgroundParallax(player, baseSegment.curve);
    this.renderBackground(ctx, theme);

    // 2. Project Road Segments
    let maxY = this.height;

    for (let n = 0; n < DRAW_DISTANCE; n++) {
      const segment = segments[(baseSegment.index + n) % segments.length];
      const looped = segment.index < baseSegment.index;
      const projCameraZ = cameraZ - (looped ? trackLength : 0);

      this.project(
        segment.p1,
        player.x * ROAD_WIDTH - x,
        playerY + CAMERA_HEIGHT,
        projCameraZ,
        CAMERA_DEPTH,
        this.width,
        this.height,
        ROAD_WIDTH
      );

      this.project(
        segment.p2,
        player.x * ROAD_WIDTH - x - dx,
        playerY + CAMERA_HEIGHT,
        projCameraZ,
        CAMERA_DEPTH,
        this.width,
        this.height,
        ROAD_WIDTH
      );

      x += dx;
      dx += segment.curve;

      segment.clip = maxY;

      // Ignore segments behind camera or beyond hill crest
      if (
        segment.p1.camera.z <= CAMERA_DEPTH ||
        segment.p2.screen.y >= segment.p1.screen.y ||
        segment.p2.screen.y >= maxY
      ) {
        continue;
      }

      // Render Road Segment Polygons
      this.renderSegment(ctx, segment);
      maxY = segment.p1.screen.y;
    }

    // 3. Render Heat Haze Shimmer near horizon
    this.renderHeatHaze(ctx, maxY);

    // 4. Render Sprites and NPC Cars (Back to Front)
    for (let n = DRAW_DISTANCE - 1; n >= 0; n--) {
      const segment = segments[(baseSegment.index + n) % segments.length];

      // Draw Roadside Sprites
      for (let i = 0; i < segment.sprites.length; i++) {
        const spriteItem = segment.sprites[i];
        const spriteScale = segment.p1.screen.scale;
        if (segment.p1.camera.z <= CAMERA_DEPTH || spriteScale <= 0) continue;
        const spriteX = segment.p1.screen.x + (spriteScale * spriteItem.offset * ROAD_WIDTH * this.width / 2);
        const spriteY = segment.p1.screen.y;

        spriteRenderer.drawRoadsideObject(
          ctx,
          spriteItem,
          spriteX,
          spriteY,
          spriteScale * 1100,
          segment.clip
        );
      }

      // Draw NPC Traffic Cars
      for (let i = 0; i < segment.cars.length; i++) {
        const car = segment.cars[i];
        const carPercent = ((car.z % 200) + 200) % 200 / 200;
        const scale = this.interpolate(segment.p1.screen.scale, segment.p2.screen.scale, carPercent);
        if (scale <= 0) continue;
        const carX = this.interpolate(segment.p1.screen.x, segment.p2.screen.x, carPercent) +
          (scale * car.offset * ROAD_WIDTH * this.width / 2);
        const carY = this.interpolate(segment.p1.screen.y, segment.p2.screen.y, carPercent);

        spriteRenderer.drawNPC(
          ctx,
          carX,
          carY,
          scale * 950,
          car.type,
          segment.clip,
          car.sirenPhase || 0,
          car.pursuitMode,
          car.speed,
          car.z
        );
      }
    }

    // 4b. Render Police Pursuit Emergency Siren Ambient Lighting
    if (player.policeProximity > 0.1 || (player.wantedLevel > 0 && player.isNearPolice)) {
      this.renderPolicePursuitLighting(ctx, player.policeProximity);
    }

    // 5. Render Speed Lines at high velocity
    if (player.speed > 8000) {
      this.renderSpeedLines(ctx, player.speed / player.maxSpeed);
    }

    // 6. Render Particles (Off-road dust, crash sparks, smoke)
    this.renderParticles(ctx, particles);

    // 7. Render Player Car (Always positioned in lower center foreground)
    this.renderPlayer(ctx, player);

    ctx.restore();
  }

  private findSegment(segments: Segment[], trackLength: number, z: number): Segment {
    const wrappedZ = (z % trackLength + trackLength) % trackLength;
    const index = Math.floor(wrappedZ / 200) % segments.length;
    return segments[index];
  }

  private interpolate(a: number, b: number, percent: number): number {
    return a + (b - a) * percent;
  }

  private project(
    p: { world: { x: number; y: number; z: number }; screen: { x: number; y: number; w: number; scale: number }; camera: { x: number; y: number; z: number } },
    cameraX: number,
    cameraY: number,
    cameraZ: number,
    cameraDepth: number,
    width: number,
    height: number,
    roadWidth: number
  ) {
    p.camera.x = (p.world.x || 0) - cameraX;
    p.camera.y = (p.world.y || 0) - cameraY;
    p.camera.z = (p.world.z || 0) - cameraZ;

    if (p.camera.z <= CAMERA_DEPTH) {
      p.screen.scale = 0;
      p.screen.x = 0;
      p.screen.y = height + 100;
      p.screen.w = 0;
      return;
    }

    p.screen.scale = cameraDepth / p.camera.z;
    p.screen.x = Math.round((width / 2) + (p.screen.scale * p.camera.x * width / 2));
    p.screen.y = Math.round((height / 2) - (p.screen.scale * p.camera.y * height / 2));
    p.screen.w = Math.round(p.screen.scale * roadWidth * width / 2);
  }

  private updateBackgroundParallax(player: PlayerState, curve: number) {
    const speedRatio = player.speed / player.maxSpeed;
    const steerDir = player.steerAngle;

    this.bgSkyOffset += curve * speedRatio * 0.0008 + steerDir * speedRatio * 0.001;
    this.bgMountainOffset += curve * speedRatio * 0.0025 + steerDir * speedRatio * 0.003;
    this.bgMidgroundOffset += curve * speedRatio * 0.006 + steerDir * speedRatio * 0.008;
  }

  private renderBackground(ctx: CanvasRenderingContext2D, theme: SceneryTheme) {
    const palette = THEME_PALETTES[theme];

    // 1. Sunset Sky Gradient with smooth multi-stop synthwave colors
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height * 0.58);
    if (palette.skyStops && palette.skyStops.length > 0) {
      palette.skyStops.forEach(([stop, col]) => skyGrad.addColorStop(stop, col));
    } else {
      skyGrad.addColorStop(0, palette.skyTop);
      skyGrad.addColorStop(0.5, palette.skyMid);
      skyGrad.addColorStop(1, palette.skyBot);
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height * 0.58);

    // 2. Setting Retro Sun with glowing gradient & scanline cutouts
    const sunX = this.width / 2;
    const sunY = this.height * 0.33;
    const sunR = 50;

    // Radiant outer ambient bloom
    const sunBloom = ctx.createRadialGradient(sunX, sunY, sunR * 0.4, sunX, sunY, sunR * 2.0);
    sunBloom.addColorStop(0, palette.sunHalo);
    sunBloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sunBloom;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR * 2.0, 0, Math.PI * 2);
    ctx.fill();

    // OutRun Blazing Sun Gradient
    const sunGrad = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY + sunR);
    sunGrad.addColorStop(0, palette.sunColor);
    sunGrad.addColorStop(1, palette.sunGradBot || palette.skyBot);
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();

    // Sleek Sun Horizontal Cutouts
    ctx.fillStyle = palette.skyMid;
    for (let y = sunY + 2; y < sunY + sunR; y += 6) {
      const sliceH = (y - sunY) / 8 + 1.8;
      ctx.fillRect(sunX - sunR - 4, y, (sunR + 4) * 2, sliceH);
    }

    // 3. Parallax Mountain Ridges with sleek deep silhouettes
    this.renderMountainLayer(ctx, palette.mountainDark, this.bgSkyOffset, 0.42, 60);
    this.renderMountainLayer(ctx, palette.mountainLight, this.bgMountainOffset, 0.48, 45);

    // 4. Ocean Horizon / Desert Flatland
    if (theme === 'beach') {
      const oceanGrad = ctx.createLinearGradient(0, this.height * 0.48, 0, this.height * 0.58);
      oceanGrad.addColorStop(0, '#0284c7');
      oceanGrad.addColorStop(0.5, '#38bdf8');
      oceanGrad.addColorStop(1, '#fef08a');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, this.height * 0.48, this.width, this.height * 0.1);

      // Ocean sun shimmer
      ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
      ctx.beginPath();
      ctx.moveTo(sunX - 15, this.height * 0.48);
      ctx.lineTo(sunX + 15, this.height * 0.48);
      ctx.lineTo(sunX + 60, this.height * 0.58);
      ctx.lineTo(sunX - 60, this.height * 0.58);
      ctx.closePath();
      ctx.fill();
    }
  }

  private renderMountainLayer(
    ctx: CanvasRenderingContext2D,
    color: string,
    offset: number,
    baseYRatio: number,
    peakHeight: number
  ) {
    ctx.fillStyle = color;
    ctx.beginPath();

    const baseY = this.height * baseYRatio;
    ctx.moveTo(0, this.height * 0.58);
    ctx.lineTo(0, baseY);

    const step = 40;
    const totalPoints = Math.ceil(this.width / step) + 2;
    const wrapOffset = (offset * this.width) % (step * 8);

    for (let i = 0; i <= totalPoints; i++) {
      const px = i * step - wrapOffset;
      const py = baseY - Math.sin((i + offset * 5) * 0.8) * peakHeight * 0.5 - Math.cos(i * 1.5) * peakHeight * 0.5;
      ctx.lineTo(px, py);
    }

    ctx.lineTo(this.width, this.height * 0.58);
    ctx.closePath();
    ctx.fill();
  }

  private renderSegment(ctx: CanvasRenderingContext2D, segment: Segment) {
    const p1 = segment.p1.screen;
    const p2 = segment.p2.screen;

    // Grass Shoulder
    ctx.fillStyle = segment.colors.grass;
    ctx.fillRect(0, p2.y, this.width, p1.y - p2.y);

    if (segment.isFork) {
      // Split Road at Checkpoint: Two parallel roads with central median strip
      const roadW1 = p1.w * 0.65;
      const roadW2 = p2.w * 0.65;
      const forkGap1 = p1.w * 0.35;
      const forkGap2 = p2.w * 0.35;

      // Left Path Rumble & Road
      this.renderPolygon(
        ctx,
        p1.x - forkGap1 - roadW1 * 1.12, p1.y,
        p1.x - forkGap1 + roadW1 * 0.12, p1.y,
        p2.x - forkGap2 + roadW2 * 0.12, p2.y,
        p2.x - forkGap2 - roadW2 * 1.12, p2.y,
        segment.colors.rumble
      );
      this.renderPolygon(
        ctx,
        p1.x - forkGap1 - roadW1, p1.y,
        p1.x - forkGap1, p1.y,
        p2.x - forkGap2, p2.y,
        p2.x - forkGap2 - roadW2, p2.y,
        segment.colors.road
      );

      // Right Path Rumble & Road
      this.renderPolygon(
        ctx,
        p1.x + forkGap1 - roadW1 * 0.12, p1.y,
        p1.x + forkGap1 + roadW1 * 1.12, p1.y,
        p2.x + forkGap2 + roadW2 * 1.12, p2.y,
        p2.x + forkGap2 - roadW2 * 0.12, p2.y,
        segment.colors.rumble
      );
      this.renderPolygon(
        ctx,
        p1.x + forkGap1, p1.y,
        p1.x + forkGap1 + roadW1, p1.y,
        p2.x + forkGap2 + roadW2, p2.y,
        p2.x + forkGap2, p2.y,
        segment.colors.road
      );

      // Central divider rumble
      this.renderPolygon(
        ctx,
        p1.x - forkGap1, p1.y,
        p1.x + forkGap1, p1.y,
        p2.x + forkGap2, p2.y,
        p2.x - forkGap2, p2.y,
        '#0f172a'
      );
    } else {
      // Standard Single Highway Road
      const rumbleW1 = p1.w * 1.14;
      const rumbleW2 = p2.w * 1.14;

      // Red/White Rumble Strips
      this.renderPolygon(
        ctx,
        p1.x - rumbleW1, p1.y,
        p1.x + rumbleW1, p1.y,
        p2.x + rumbleW2, p2.y,
        p2.x - rumbleW2, p2.y,
        segment.colors.rumble
      );

      // Main Asphalt Road
      this.renderPolygon(
        ctx,
        p1.x - p1.w, p1.y,
        p1.x + p1.w, p1.y,
        p2.x + p2.w, p2.y,
        p2.x - p2.w, p2.y,
        segment.colors.road
      );

      // Dashed White/Yellow Lane Markers
      if (segment.colors.lane) {
        const laneW1 = p1.w * 0.03;
        const laneW2 = p2.w * 0.03;

        // Left lane marker
        this.renderPolygon(
          ctx,
          p1.x - p1.w * 0.33 - laneW1, p1.y,
          p1.x - p1.w * 0.33 + laneW1, p1.y,
          p2.x - p2.w * 0.33 + laneW2, p2.y,
          p2.x - p2.w * 0.33 - laneW2, p2.y,
          segment.colors.lane
        );

        // Right lane marker
        this.renderPolygon(
          ctx,
          p1.x + p1.w * 0.33 - laneW1, p1.y,
          p1.x + p1.w * 0.33 + laneW1, p1.y,
          p2.x + p2.w * 0.33 + laneW2, p2.y,
          p2.x + p2.w * 0.33 - laneW2, p2.y,
          segment.colors.lane
        );
      }
    }

    // --- WATER ON THE ROAD (REFLECTIVE PUDDLES) ---
    if (segment.waterPuddles && segment.waterPuddles.length > 0) {
      for (let i = 0; i < segment.waterPuddles.length; i++) {
        const puddle = segment.waterPuddles[i];
        const px1 = p1.x + (puddle.offset * p1.w);
        const px2 = p2.x + (puddle.offset * p2.w);
        const pw1 = puddle.width * p1.w * 0.5;
        const pw2 = puddle.width * p2.w * 0.5;

        // Glassy wet road reflection
        this.renderPolygon(
          ctx,
          px1 - pw1, p1.y,
          px1 + pw1, p1.y,
          px2 + pw2, p2.y,
          px2 - pw2, p2.y,
          'rgba(56, 189, 248, 0.45)'
        );

        // Central specular highlight
        this.renderPolygon(
          ctx,
          px1 - pw1 * 0.4, p1.y,
          px1 + pw1 * 0.4, p1.y,
          px2 + pw2 * 0.4, p2.y,
          px2 - pw2 * 0.4, p2.y,
          'rgba(255, 255, 255, 0.65)'
        );
      }
    }

    // --- SKIDMARKS ON THE ROAD ---
    if (segment.skidmarks && segment.skidmarks.length > 0) {
      for (let i = 0; i < segment.skidmarks.length; i++) {
        const sm = segment.skidmarks[i];
        const trackW1 = Math.max(2.5, p1.w * 0.055);
        const trackW2 = Math.max(2.5, p2.w * 0.055);
        const color = `rgba(15, 23, 42, ${Math.min(0.85, sm.alpha)})`;

        // Left wheel skidmark
        const lx1 = p1.x + (sm.leftOffset * p1.w);
        const lx2 = p2.x + (sm.leftOffset * p2.w);
        this.renderPolygon(
          ctx,
          lx1 - trackW1, p1.y,
          lx1 + trackW1, p1.y,
          lx2 + trackW2, p2.y,
          lx2 - trackW2, p2.y,
          color
        );

        // Right wheel skidmark
        const rx1 = p1.x + (sm.rightOffset * p1.w);
        const rx2 = p2.x + (sm.rightOffset * p2.w);
        this.renderPolygon(
          ctx,
          rx1 - trackW1, p1.y,
          rx1 + trackW1, p1.y,
          rx2 + trackW2, p2.y,
          rx2 - trackW2, p2.y,
          color
        );
      }
    }
  }

  private renderPolygon(
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number,
    x2: number, y2: number,
    x3: number, y3: number,
    x4: number, y4: number,
    color: string
  ) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
  }

  private renderHeatHaze(ctx: CanvasRenderingContext2D, horizonY: number) {
    const shimmerH = 20;
    if (horizonY < this.height * 0.45 || horizonY > this.height * 0.65) return;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let y = horizonY - 10; y < horizonY + shimmerH; y += 3) {
      const offsetX = Math.sin(Date.now() * 0.01 + y * 2) * 4;
      ctx.fillRect(offsetX, y, this.width, 2);
    }
  }

  private renderSpeedLines(ctx: CanvasRenderingContext2D, intensity: number) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.35})`;
    ctx.lineWidth = 2;
    const count = Math.floor(intensity * 16);

    for (let i = 0; i < count; i++) {
      const x = (Math.random() > 0.5) ? Math.random() * 80 : this.width - Math.random() * 80;
      const y = Math.random() * this.height;
      const len = 40 + Math.random() * 80;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (x < this.width / 2 ? -20 : 20), y + len);
      ctx.stroke();
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

      if (p.type === 'debris') {
        ctx.translate(p.x, p.y);
        if (p.rotation !== undefined) ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else if (p.type === 'water_splash') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size * 0.7, p.size * 1.3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Inner white shine
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x - p.size * 0.2, p.y - p.size * 0.3, p.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'brake_smoke' || p.type === 'dust') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'nitro_flame') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        // Spark core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D, player: PlayerState) {
    const destX = this.width / 2;
    const destY = this.height - 24;
    const scale = 1.05;

    // Bounce car slightly based on speed and road rumble
    const bounce = (player.speed > 0) ? Math.sin(Date.now() * 0.02) * (player.speed / player.maxSpeed) * 2 : 0;

    spriteRenderer.drawPlayer(
      ctx,
      destX,
      destY + bounce,
      scale,
      player.steerAngle,
      player.isBraking,
      player.crashed ? player.crashSpinAngle : 0,
      player.speed,
      player.z
    );
  }

  private renderPolicePursuitLighting(ctx: CanvasRenderingContext2D, proximity: number) {
    const flashPhase = Math.floor(Date.now() / 120) % 4;
    const intensity = Math.min(0.35, proximity * 0.4);
    if (intensity <= 0.02) return;

    ctx.save();
    if (flashPhase === 0 || flashPhase === 1) {
      // Red strobe left / blue right
      const redGrad = ctx.createLinearGradient(0, 0, this.width * 0.4, 0);
      redGrad.addColorStop(0, `rgba(239, 68, 68, ${intensity})`);
      redGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = redGrad;
      ctx.fillRect(0, 0, this.width * 0.4, this.height);

      const blueGrad = ctx.createLinearGradient(this.width, 0, this.width * 0.6, 0);
      blueGrad.addColorStop(0, `rgba(6, 182, 212, ${intensity})`);
      blueGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = blueGrad;
      ctx.fillRect(this.width * 0.6, 0, this.width * 0.4, this.height);
    } else {
      // Blue strobe left / red right
      const blueGrad = ctx.createLinearGradient(0, 0, this.width * 0.4, 0);
      blueGrad.addColorStop(0, `rgba(6, 182, 212, ${intensity})`);
      blueGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = blueGrad;
      ctx.fillRect(0, 0, this.width * 0.4, this.height);

      const redGrad = ctx.createLinearGradient(this.width, 0, this.width * 0.6, 0);
      redGrad.addColorStop(0, `rgba(239, 68, 68, ${intensity})`);
      redGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = redGrad;
      ctx.fillRect(this.width * 0.6, 0, this.width * 0.4, this.height);
    }
    ctx.restore();
  }
}

export const gameRenderer = new GameRenderer();
