/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlayerState, SceneryTheme, RadioTrack } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, ROUTE_NODES, RADIO_STATIONS } from './constants';

export class DashboardRenderer {
  private width: number = CANVAS_WIDTH;
  private height: number = CANVAS_HEIGHT;

  public render(
    ctx: CanvasRenderingContext2D,
    player: PlayerState,
    theme: SceneryTheme,
    bannerText: string | null,
    bannerSubtext: string | null,
    bannerTimer: number,
    radioTrack: RadioTrack
  ) {
    ctx.save();

    // 1. Top Arcade HUD
    this.renderTopHUD(ctx, player, theme);

    // 2. Center Animated Checkpoint / Fork / Game Over Banners
    if (bannerText && bannerTimer > 0) {
      this.renderBanner(ctx, bannerText, bannerSubtext, bannerTimer);
    }

    // 3. Bottom Dashboard Silhouette & Analog Gauges
    this.renderBottomDashboard(ctx, player, radioTrack);

    ctx.restore();
  }

  private renderTopHUD(ctx: CanvasRenderingContext2D, player: PlayerState, theme: SceneryTheme) {
    const kmh = Math.floor((player.speed / player.maxSpeed) * 293);
    const scoreStr = player.score.toString().padStart(7, '0');
    const timeCeil = Math.max(0, Math.ceil(player.timeRemaining));
    const isCriticalTime = timeCeil <= 10;
    const timeFlash = isCriticalTime && Math.floor(Date.now() / 250) % 2 === 0;

    // Top Bar Background gradient
    const hudGrad = ctx.createLinearGradient(0, 0, 0, 52);
    hudGrad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
    hudGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = hudGrad;
    ctx.fillRect(0, 0, this.width, 52);

    ctx.save();
    // Drop shadow for sleek high-contrast HUD text
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    // 1. LEFT: SCORE
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '900 10px "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', 20, 18);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 900 22px "Chakra Petch", sans-serif';
    ctx.fillText(scoreStr, 20, 40);

    // 2. CENTER: FROSTED GLASS TIME PILL
    const pillW = 84;
    const pillH = 40;
    const pillX = (this.width - pillW) / 2;
    const pillY = 6;

    // Pill Glass Background
    ctx.save();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, pillX, pillY, pillW, pillH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '900 9px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TIME', this.width / 2, pillY + 13);

    ctx.fillStyle = timeFlash ? '#ffffff' : isCriticalTime ? '#ef4444' : '#00ff00';
    ctx.font = 'italic 900 22px "Chakra Petch", sans-serif';
    ctx.fillText(timeCeil.toString().padStart(2, '0'), this.width / 2, pillY + 33);

    // 3. RIGHT: SPEED
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '900 10px "Chakra Petch", sans-serif';
    ctx.fillText('SPEED', this.width - 20, 18);

    // Speed value
    ctx.fillStyle = kmh > 240 ? '#f43f5e' : '#ffffff';
    ctx.font = 'italic 900 22px "Chakra Petch", sans-serif';
    ctx.fillText(`${kmh}`, this.width - 64, 40);

    // KM/H unit
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '700 11px "Chakra Petch", sans-serif';
    ctx.fillText('KM/H', this.width - 20, 40);

    // 4. WANTED LEVEL STARS & POLICE RADAR
    this.renderWantedAndPoliceHUD(ctx, player);

    // 5. ACTIVE POWER-UP HUD BADGE
    this.renderPowerUpHUD(ctx, player);

    ctx.restore();
  }

  private renderPowerUpHUD(ctx: CanvasRenderingContext2D, player: PlayerState) {
    let powerUpLabel = '';
    let powerUpColor = '#38bdf8';
    let remainingTime = 0;

    if (player.nitroTimer > 0) {
      powerUpLabel = '⚡ NITRO BOOST ACTIVE';
      powerUpColor = '#38bdf8';
      remainingTime = player.nitroTimer;
    } else if (player.superGripTimer > 0) {
      powerUpLabel = '🛠️ SUPER GRIP ACTIVE';
      powerUpColor = '#facc15';
      remainingTime = player.superGripTimer;
    } else if (player.radarJammerTimer > 0) {
      powerUpLabel = '📡 RADAR JAMMER ACTIVE';
      powerUpColor = '#a855f7';
      remainingTime = player.radarJammerTimer;
    } else if (player.activePowerUpTimer && player.activePowerUpTimer > 0 && player.activePowerUpName) {
      powerUpLabel = `✨ ${player.activePowerUpName}`;
      powerUpColor = '#34d399';
      remainingTime = player.activePowerUpTimer;
    }

    if (!powerUpLabel) return;

    ctx.save();
    const pW = 200;
    const pH = 22;
    const pX = 20;
    const pY = 56;

    const pulse = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = powerUpColor;
    ctx.lineWidth = 2;
    this.roundRect(ctx, pX, pY, pW, pH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = powerUpColor;
    ctx.font = '900 10px "Chakra Petch", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${powerUpLabel} (${remainingTime.toFixed(1)}s)`, pX + 10, pY + 15);

    ctx.restore();
  }

  private renderWantedAndPoliceHUD(ctx: CanvasRenderingContext2D, player: PlayerState) {
    const wanted = Math.max(0, Math.min(5, player.wantedLevel || 0));
    const starW = 10;
    const totalStarsW = 5 * (starW + 4);
    const starStartX = (this.width - totalStarsW) / 2;
    const starY = 54;

    // Wanted Star Icons
    ctx.save();
    ctx.shadowColor = 'transparent';

    const isWantedFlashing = (player.wantedFlashTimer > 0) && (Math.floor(Date.now() / 120) % 2 === 0);

    for (let s = 0; s < 5; s++) {
      const isFilled = s < wanted;
      const x = starStartX + s * (starW + 4);

      if (isFilled) {
        ctx.fillStyle = isWantedFlashing ? '#ffffff' : (wanted >= 4 ? '#ef4444' : '#facc15');
        ctx.font = '900 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★', x + starW / 2, starY + 2);
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = '900 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('☆', x + starW / 2, starY + 2);
      }
    }

    // Wanted Label or Alert
    if (wanted > 0) {
      ctx.fillStyle = wanted >= 4 ? '#ef4444' : '#facc15';
      ctx.font = 'italic 900 9px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`WANTED ★${wanted}`, this.width / 2, starY + 12);
    }

    // 5. POLICE PROXIMITY & AVOIDANCE RADAR BADGE
    if (player.evasionSuccessTimer && player.evasionSuccessTimer > 0) {
      const badgeW = 240;
      const badgeH = 20;
      const badgeX = (this.width - badgeW) / 2;
      const badgeY = starY + 16;

      ctx.fillStyle = 'rgba(6, 78, 59, 0.92)';
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#4ade80';
      ctx.font = '900 9px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✓ PURSUIT EVADED • ALL STARS CLEARED', this.width / 2, badgeY + 14);
    } else if (player.isNearPolice || player.policeProximity > 0.05 || (player.pursuitEvasionTimer && player.pursuitEvasionTimer > 0)) {
      const isSpeedLow = player.speed <= 3800;
      const badgeW = 240;
      const badgeH = 22;
      const badgeX = (this.width - badgeW) / 2;
      const badgeY = wanted > 0 ? starY + 16 : starY + 4;

      const flash = Math.floor(Date.now() / 150) % 2 === 0;
      const remainingSeconds = Math.max(0, 7.0 - (player.pursuitEvasionTimer || 0));

      // Badge Container Glass
      ctx.fillStyle = isSpeedLow ? 'rgba(6, 78, 59, 0.88)' : 'rgba(127, 29, 29, 0.90)';
      ctx.strokeStyle = isSpeedLow ? (flash ? '#4ade80' : '#10b981') : (flash ? '#ef4444' : '#f87171');
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 6);
      ctx.fill();
      ctx.stroke();

      // Progress bar at bottom of badge showing 0 to 7s progress
      if (player.pursuitEvasionTimer && player.pursuitEvasionTimer > 0) {
        const progress = Math.min(1.0, player.pursuitEvasionTimer / 7.0);
        ctx.fillStyle = isSpeedLow ? '#34d399' : '#facc15';
        ctx.fillRect(badgeX + 3, badgeY + badgeH - 3, (badgeW - 6) * progress, 2);
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 9px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';

      if (isSpeedLow) {
        ctx.fillText(`🛡️ SPEED LOW • EVADING PURSUIT (${remainingSeconds.toFixed(1)}s)`, this.width / 2, badgeY + 14);
      } else {
        ctx.fillText(`🚨 EVADING PURSUIT... (${remainingSeconds.toFixed(1)}s)`, this.width / 2, badgeY + 14);
      }
    }

    // BUSTED Banner Notification
    if (player.bustedTimer && player.bustedTimer > 0) {
      const bW = 280;
      const bH = 36;
      const bX = (this.width - bW) / 2;
      const bY = this.height * 0.45;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      this.roundRect(ctx, bX, bY, bW, bH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.font = 'italic 900 16px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BUSTED! -5 SECONDS PENALTY', this.width / 2, bY + 23);
    }

    ctx.restore();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private renderBanner(ctx: CanvasRenderingContext2D, text: string, subtext: string | null, timer: number) {
    const y = this.height * 0.36;
    const isFlashing = Math.floor(Date.now() / 150) % 2 === 0;

    // Sleek frosted glass banner
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
    ctx.fillRect(0, y - 36, this.width, subtext ? 78 : 52);

    ctx.strokeStyle = isFlashing ? 'rgba(250, 204, 21, 0.9)' : 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, y - 36, this.width, subtext ? 78 : 52);

    // Main Banner Text
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = isFlashing ? '#fef08a' : '#ffffff';
    ctx.font = 'italic 900 24px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, this.width / 2, y);

    // Secondary Subtext
    if (subtext) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 12px "Chakra Petch", sans-serif';
      ctx.fillText(subtext, this.width / 2, y + 26);
    }
    ctx.restore();
  }

  private renderBottomDashboard(ctx: CanvasRenderingContext2D, player: PlayerState, radioTrack: RadioTrack) {
    const dashH = 46;
    const dashY = this.height - dashH;

    // Sleek bottom gradient from black to transparent
    const dashGrad = ctx.createLinearGradient(0, dashY - 10, 0, this.height);
    dashGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    dashGrad.addColorStop(0.3, 'rgba(0, 0, 0, 0.85)');
    dashGrad.addColorStop(1, '#000000');
    ctx.fillStyle = dashGrad;
    ctx.fillRect(0, dashY - 10, this.width, dashH + 10);

    ctx.save();

    // 1. LEFT: Sleek Circular Tachometer Gauge
    const tachoCx = 32;
    const tachoCy = dashY + 22;
    const tachoR = 14;

    // Dial background & border
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.arc(tachoCx, tachoCy, tachoR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Redline arc (top right)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(tachoCx, tachoCy, tachoR - 1, -Math.PI * 0.2, Math.PI * 0.3);
    ctx.stroke();

    // Needle based on RPM (starts at -135 deg to +45 deg)
    const needleAngle = -Math.PI * 0.75 + player.rpm * Math.PI * 1.1;
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tachoCx, tachoCy);
    ctx.lineTo(
      tachoCx + Math.cos(needleAngle) * (tachoR - 3),
      tachoCy + Math.sin(needleAngle) * (tachoR - 3)
    );
    ctx.stroke();

    // Center pin
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(tachoCx, tachoCy, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Tacho label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '700 8px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TACHO', tachoCx, dashY + 42);

    // 2. GEAR & TRANSMISSION STATUS
    const gearX = 64;
    // Pulsing green dot
    const pulseAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 200);
    ctx.fillStyle = `rgba(34, 197, 94, ${pulseAlpha})`;
    ctx.beginPath();
    ctx.arc(gearX, dashY + 18, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 11px "Chakra Petch", sans-serif';
    const gearName = player.gear === 1 ? 'GEAR 1' : player.gear === 2 ? 'GEAR 2' : player.gear === 3 ? 'GEAR 3' : 'GEAR 4';
    ctx.fillText(gearName, gearX + 8, dashY + 22);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '700 8px "Chakra Petch", sans-serif';
    ctx.fillText('TRANSMISSION: OK', gearX + 8, dashY + 34);

    // 3. CENTER: DELCO-BOSE 1986 DIGITAL FM STEREO RADIO DECK
    this.renderRadioDeck(ctx, radioTrack, player, dashY);

    // 4. RIGHT: STAGE TRACK PROGRESS BAR
    const stageLen = 200 * 1600; // Track segment length approximation
    const stageProgress = Math.min(1.0, (player.z % stageLen) / stageLen);
    const stageNode = ROUTE_NODES[player.routeHistory[player.routeHistory.length - 1] ? `stage${player.stage}_${player.theme}` : 'stage1_beach'] || { name: `SUNSET COAST` };

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '700 9px "Chakra Petch", monospace';
    ctx.fillText(`STAGE 0${player.stage}: ${stageNode.name.toUpperCase()}`, this.width - 20, dashY + 20);

    // Progress Bar Track
    const trackBarW = 140;
    const trackBarH = 3;
    const trackBarX = this.width - 20 - trackBarW;
    const trackBarY = dashY + 26;

    // Track Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(trackBarX, trackBarY, trackBarW, trackBarH);

    // Track Active Fill
    ctx.fillStyle = '#facc15';
    ctx.fillRect(trackBarX, trackBarY, Math.max(4, trackBarW * stageProgress), trackBarH);

    // Overtaken count
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '700 8px "Chakra Petch", sans-serif';
    ctx.fillText(`OVERTAKEN: ${player.carsOvertaken} VEHICLES`, this.width - 20, dashY + 38);

    ctx.restore();
  }

  // --- 1980s Retro Digital FM Stereo Car Radio Visual Unit ---
  private renderRadioDeck(
    ctx: CanvasRenderingContext2D,
    radioTrack: RadioTrack,
    player: PlayerState,
    dashY: number
  ) {
    const station = RADIO_STATIONS[radioTrack] || RADIO_STATIONS.MAGICAL_SHOWER;
    const isMuted = radioTrack === 'OFF';

    const deckW = 236;
    const deckH = 40;
    const deckX = (this.width - deckW) / 2;
    const deckY = dashY + 3;

    // 1. Brushed Aluminum Radio Chassis Frame
    ctx.save();
    ctx.fillStyle = '#090d16';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, deckX, deckY, deckW, deckH, 4);
    ctx.fill();
    ctx.stroke();

    // Corner Screws
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(deckX + 5, deckY + 5, 1.5, 0, Math.PI * 2);
    ctx.arc(deckX + deckW - 5, deckY + 5, 1.5, 0, Math.PI * 2);
    ctx.arc(deckX + 5, deckY + deckH - 5, 1.5, 0, Math.PI * 2);
    ctx.arc(deckX + deckW - 5, deckY + deckH - 5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 2. Left Volume / Power Knob
    const lKnobX = deckX + 16;
    const lKnobY = deckY + deckH / 2;
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(lKnobX, lKnobY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Knob tick
    ctx.fillStyle = isMuted ? '#64748b' : '#34d399';
    ctx.beginPath();
    ctx.arc(lKnobX, lKnobY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '700 6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VOL', lKnobX, deckY + deckH - 2);

    // 3. Right Tuning Knob with "[R]" Shortcut Badge
    const rKnobX = deckX + deckW - 16;
    const rKnobY = deckY + deckH / 2;
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(rKnobX, rKnobY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('R', rKnobX, rKnobY + 3);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '700 6px monospace';
    ctx.fillText('TUNE', rKnobX, deckY + deckH - 2);

    // 4. Center VFD Digital Glow Screen
    const scrX = deckX + 30;
    const scrY = deckY + 4;
    const scrW = deckW - 60;
    const scrH = deckH - 8;

    ctx.fillStyle = isMuted ? '#020617' : '#022c22';
    ctx.strokeStyle = isMuted ? '#1e293b' : 'rgba(16, 185, 129, 0.5)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, scrX, scrY, scrW, scrH, 3);
    ctx.fill();
    ctx.stroke();

    // VFD Scanline Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (let sy = scrY; sy < scrY + scrH; sy += 2) {
      ctx.fillRect(scrX, sy, scrW, 1);
    }

    // A. Radio Frequency readout (Top Left)
    ctx.textAlign = 'left';
    ctx.fillStyle = isMuted ? '#64748b' : '#34d399';
    ctx.font = '900 11px monospace';
    ctx.fillText(`FM ${station.frequency}`, scrX + 6, scrY + 12);

    // B. Stereo Lamp (Top Right)
    ctx.textAlign = 'right';
    if (!isMuted) {
      const stGlow = Math.floor(Date.now() / 400) % 2 === 0;
      ctx.fillStyle = stGlow ? '#38bdf8' : '#22d3ee';
      ctx.font = '900 7px monospace';
      ctx.fillText('● STEREO', scrX + scrW - 24, scrY + 11);
    } else {
      ctx.fillStyle = '#f59e0b';
      ctx.font = '900 7px monospace';
      ctx.fillText('● MUTE', scrX + scrW - 24, scrY + 11);
    }

    // C. Radio Station Name (Bottom Left / Marquee)
    ctx.textAlign = 'left';
    ctx.fillStyle = isMuted ? '#94a3b8' : '#fef08a';
    ctx.font = '900 9px "Chakra Petch", sans-serif';
    ctx.fillText(station.name, scrX + 6, scrY + 24);

    // D. Animated Real-time 6-Band VU Equalizer (Far Right of Screen)
    const vuBaseX = scrX + scrW - 20;
    const vuBaseY = scrY + scrH - 4;
    const now = Date.now() / 150;
    const speedFactor = (player.speed / player.maxSpeed);

    for (let b = 0; b < 5; b++) {
      let vuH = 0;
      if (!isMuted) {
        // Procedural rhythmic wave heights
        vuH = Math.max(2, Math.floor(3 + Math.sin(now + b * 1.3) * 4 + speedFactor * 4));
      } else {
        vuH = 1;
      }
      const barX = vuBaseX + b * 3.5;
      ctx.fillStyle = isMuted ? '#334155' : b > 3 ? '#ef4444' : b > 2 ? '#facc15' : '#34d399';
      ctx.fillRect(barX, vuBaseY - vuH, 2.5, vuH);
    }

    // E. Mini Frequency Tuning Needle Indicator (Bottom Line of Screen)
    const scaleLineX = scrX + 6;
    const scaleLineY = scrY + scrH - 2;
    const scaleLineW = scrW - 32;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(scaleLineX, scaleLineY, scaleLineW, 1);

    // Target needle percent (88MHz to 108MHz range)
    let freqPct = 0.5;
    if (radioTrack === 'PASSING_BREEZE') freqPct = 0.45; // 98.5 FM
    else if (radioTrack === 'MAGICAL_SHOWER') freqPct = 0.75; // 104.2 FM
    else if (radioTrack === 'SPLASH_WAVE') freqPct = 0.95; // 107.9 FM
    else freqPct = 0.1;

    const needleX = scaleLineX + scaleLineW * freqPct;
    ctx.fillStyle = isMuted ? '#64748b' : '#f43f5e';
    ctx.fillRect(needleX - 1, scaleLineY - 2, 2.5, 4);

    ctx.restore();
  }
}

export const dashboardRenderer = new DashboardRenderer();
