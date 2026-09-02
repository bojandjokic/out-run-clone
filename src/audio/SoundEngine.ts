/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RadioTrack } from '../types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.7;

  // Engine Audio Nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  // Screech Audio Nodes
  private screechSource: AudioBufferSourceNode | null = null;
  private screechGain: GainNode | null = null;
  private screechFilter: BiquadFilterNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // Police Siren Audio Nodes
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenLFO: OscillatorNode | null = null;
  private sirenLFOGain: GainNode | null = null;
  private isSirenPlaying: boolean = false;

  // Music System
  private currentTrack: RadioTrack = 'MAGICAL_SHOWER';
  private musicIntervalId: number | null = null;
  private musicStep: number = 0;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private isStarted: boolean = false;

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master Gains
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.sfxGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.volume * 0.45, this.ctx.currentTime);
      this.musicGain.connect(this.ctx.destination);

      this.createNoiseBuffer();
      this.setupEngineSound();
      this.setupScreechSound();
      this.isStarted = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  private setupEngineSound() {
    if (!this.ctx || !this.sfxGain) return;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(250, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3, this.ctx.currentTime);

    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime);

    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(90, this.ctx.currentTime);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
  }

  private setupScreechSound() {
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;

    this.screechGain = this.ctx.createGain();
    this.screechGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    this.screechFilter = this.ctx.createBiquadFilter();
    this.screechFilter.type = 'bandpass';
    this.screechFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    this.screechFilter.Q.setValueAtTime(8, this.ctx.currentTime);

    this.screechGain.connect(this.sfxGain);
  }

  public updateEngine(speedRatio: number, gear: number, rpm: number, isAccelerating: boolean, offroad: boolean) {
    if (!this.ctx || !this.engineGain || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter) return;
    if (this.isMuted) {
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
      return;
    }

    const t = this.ctx.currentTime;
    const baseFreq = 40 + gear * 18 + rpm * 110 + (isAccelerating ? 15 : 0);
    const filterCutoff = 200 + rpm * 1400 + (offroad ? 200 : 0);
    const targetGain = Math.min(0.25, 0.05 + speedRatio * 0.15 + (isAccelerating ? 0.08 : 0));

    this.engineOsc1.frequency.setTargetAtTime(baseFreq, t, 0.05);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, t, 0.05);
    this.engineFilter.frequency.setTargetAtTime(filterCutoff, t, 0.05);
    this.engineGain.gain.setTargetAtTime(targetGain, t, 0.05);
  }

  public updateScreech(intensity: number) {
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;
    if (this.isMuted || intensity <= 0.05) {
      if (this.screechGain) {
        this.screechGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
      }
      return;
    }

    if (!this.screechSource) {
      this.screechSource = this.ctx.createBufferSource();
      this.screechSource.buffer = this.noiseBuffer;
      this.screechSource.loop = true;

      this.screechFilter = this.ctx.createBiquadFilter();
      this.screechFilter.type = 'bandpass';
      this.screechFilter.frequency.setValueAtTime(1800, this.ctx.currentTime);
      this.screechFilter.Q.setValueAtTime(6, this.ctx.currentTime);

      this.screechGain = this.ctx.createGain();
      this.screechGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

      this.screechSource.connect(this.screechFilter);
      this.screechFilter.connect(this.screechGain);
      this.screechGain.connect(this.sfxGain);

      this.screechSource.start();
    }

    const t = this.ctx.currentTime;
    const gainVal = Math.min(0.2, intensity * 0.22);
    const freqVal = 1400 + intensity * 800;

    this.screechGain?.gain.setTargetAtTime(gainVal, t, 0.04);
    this.screechFilter?.frequency.setTargetAtTime(freqVal, t, 0.04);
  }

  public stopScreech() {
    if (this.screechGain && this.ctx) {
      this.screechGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
    }
  }

  public playCrash() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Sub bass impact
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(160, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + 0.4);
    subGain.gain.setValueAtTime(0.5, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t);
    subOsc.stop(t + 0.5);

    // Metal crash burst
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, t);
      filter.frequency.exponentialRampToValueAtTime(400, t + 0.6);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.6, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);
      noise.start(t);
      noise.stop(t + 0.6);
    }
  }

  public playCheckpoint() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0, t + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.3, t + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.4);
    });
  }

  public playWhoosh() {
    if (!this.ctx || !this.sfxGain || this.isMuted || !this.noiseBuffer) return;
    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.linearRampToValueAtTime(1800, t + 0.15);
    filter.frequency.linearRampToValueAtTime(400, t + 0.35);
    filter.Q.setValueAtTime(3, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.35);
  }

  public playTimeWarning() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.setValueAtTime(1760, t + 0.06);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // --- POLICE & WANTED AUDIO SYSTEM ---
  public updatePoliceSiren(proximity: number, inPursuit: boolean) {
    if (!this.ctx || !this.sfxGain) return;
    if (this.isMuted || proximity <= 0.05) {
      this.stopPoliceSiren();
      return;
    }

    if (!this.isSirenPlaying) {
      try {
        this.sirenGain = this.ctx.createGain();
        this.sirenGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

        this.sirenOsc = this.ctx.createOscillator();
        this.sirenOsc.type = 'sawtooth';
        this.sirenOsc.frequency.setValueAtTime(800, this.ctx.currentTime);

        this.sirenLFO = this.ctx.createOscillator();
        this.sirenLFO.type = 'triangle';
        this.sirenLFO.frequency.setValueAtTime(inPursuit ? 2.5 : 1.2, this.ctx.currentTime); // Fast wail when pursuing

        this.sirenLFOGain = this.ctx.createGain();
        this.sirenLFOGain.gain.setValueAtTime(350, this.ctx.currentTime);

        this.sirenLFO.connect(this.sirenLFOGain);
        this.sirenLFOGain.connect(this.sirenOsc.frequency);

        this.sirenOsc.connect(this.sirenGain);
        this.sirenGain.connect(this.sfxGain);

        this.sirenOsc.start();
        this.sirenLFO.start();
        this.isSirenPlaying = true;
      } catch (e) {
        console.warn('Failed to start siren audio:', e);
      }
    }

    if (this.sirenGain && this.sirenLFO) {
      const t = this.ctx.currentTime;
      const targetGain = Math.min(0.28, proximity * 0.32);
      this.sirenGain.gain.setTargetAtTime(targetGain, t, 0.08);
      this.sirenLFO.frequency.setTargetAtTime(inPursuit ? 2.8 : 1.2, t, 0.1);
    }
  }

  public stopPoliceSiren() {
    if (this.isSirenPlaying && this.sirenGain && this.ctx) {
      this.sirenGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.1);
      setTimeout(() => {
        if (!this.isSirenPlaying) return;
        try {
          this.sirenOsc?.stop();
          this.sirenLFO?.stop();
          this.sirenOsc?.disconnect();
          this.sirenLFO?.disconnect();
        } catch {}
        this.sirenOsc = null;
        this.sirenLFO = null;
        this.isSirenPlaying = false;
      }, 150);
    }
  }

  public playWantedLevelUp() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Dramatic arcade brass alarm stingers (F4 -> Ab4 -> C5 -> Eb5)
    const freqs = [349.23, 415.30, 523.25, 622.25];
    freqs.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + i * 0.06);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, t + i * 0.06);

      gain.gain.setValueAtTime(0.001, t + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.25, t + i * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.45);
    });

    // Radio chirps
    this.playPoliceRadio();
  }

  public playWaterSplash() {
    if (!this.ctx || !this.sfxGain || this.isMuted || !this.noiseBuffer) return;
    const t = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.35);
  }

  public playWantedCooldown() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C major upbeat resolution

    freqs.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.05);

      gain.gain.setValueAtTime(0.001, t + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.18, t + i * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.35);
    });
  }

  public playPowerUp() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    // Bright ascending 5-note synth arpeggio (C5 -> E5 -> G5 -> B5 -> C6)
    const freqs = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51];

    freqs.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.06);

      gain.gain.setValueAtTime(0.001, t + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.25, t + i * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.4);
    });
  }

  public playNitro() {
    if (!this.ctx || !this.sfxGain || this.isMuted || !this.noiseBuffer) return;
    const t = this.ctx.currentTime;

    // 1. High-pressure turbo spool and roar
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.6);

    oscGain.gain.setValueAtTime(0.22, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.7);

    // 2. Fiery thrust noise hiss
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(3200, t + 0.6);
    filter.Q.setValueAtTime(4, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.7);
  }

  public playPoliceRadio() {
    if (!this.ctx || !this.sfxGain || this.isMuted || !this.noiseBuffer) return;
    const t = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, t);
    filter.Q.setValueAtTime(8, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.25);
  }

  public playBustedSound() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Heavy low warning chord
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.8);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.9);
  }

  public playSplash() {
    if (!this.ctx || !this.sfxGain || this.isMuted || !this.noiseBuffer) return;
    const t = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.35);
  }

  public playPoliceAlert() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Dual-tone high-pitch siren chirp / radar lock
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.setValueAtTime(1800, t + 0.07);
    osc.frequency.setValueAtTime(2400, t + 0.14);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  public playRadioTuned() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.08);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  // Synthwave procedural music sequencer
  public setRadioTrack(track: RadioTrack) {
    this.currentTrack = track;
    this.stopMusic();
    if (track !== 'OFF' && !this.isMuted) {
      this.startMusic();
    }
  }

  public getRadioTrack(): RadioTrack {
    return this.currentTrack;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopMusic();
      if (this.engineGain && this.ctx) this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
      if (this.screechGain && this.ctx) this.screechGain.gain.setValueAtTime(0, this.ctx.currentTime);
    } else {
      if (this.currentTrack !== 'OFF') {
        this.startMusic();
      }
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  private startMusic() {
    if (!this.ctx || this.isMuted || this.currentTrack === 'OFF') return;
    if (this.musicIntervalId !== null) return;

    this.musicStep = 0;
    const bpm = this.currentTrack === 'SPLASH_WAVE' ? 140 : this.currentTrack === 'MAGICAL_SHOWER' ? 132 : 124;
    const stepTimeMs = (60 / bpm / 4) * 1000; // 16th notes

    this.musicIntervalId = window.setInterval(() => {
      this.playMusicStep();
      this.musicStep = (this.musicStep + 1) % 64;
    }, stepTimeMs);
  }

  private stopMusic() {
    if (this.musicIntervalId !== null) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }

  private playMusicStep() {
    if (!this.ctx || !this.musicGain || this.isMuted || this.currentTrack === 'OFF') return;
    const t = this.ctx.currentTime;
    const step = this.musicStep;

    // Drum track (Kick, Snare, Hi-Hat)
    const isKick = step % 8 === 0 || (step % 16 === 10 && this.currentTrack === 'MAGICAL_SHOWER');
    const isSnare = step % 8 === 4;
    const isHiHat = step % 2 === 0;

    if (isKick) this.playDrumKick(t);
    if (isSnare) this.playDrumSnare(t);
    if (isHiHat) this.playDrumHiHat(t, step % 4 === 2 ? 0.06 : 0.03);

    // Bassline patterns
    let bassFreq = 0;
    if (this.currentTrack === 'MAGICAL_SHOWER') {
      // Latin funk progression in Dm - G - Bb - C
      const d = 73.42, g = 98.0, bb = 116.54, c = 65.41;
      const bar = Math.floor(step / 16);
      const root = bar === 0 ? d : bar === 1 ? g : bar === 2 ? bb : c;
      if (step % 4 === 0 || step % 4 === 2) {
        bassFreq = root * (step % 8 === 6 ? 1.5 : 1);
      }
    } else if (this.currentTrack === 'PASSING_BREEZE') {
      // Smooth jazz progression: Fmaj7 - Em7 - Dm7 - Cmaj7
      const f = 87.31, e = 82.41, d = 73.42, c = 65.41;
      const bar = Math.floor(step / 16);
      const root = bar === 0 ? f : bar === 1 ? e : bar === 2 ? d : c;
      if (step % 4 === 0 || step % 8 === 3) {
        bassFreq = root;
      }
    } else if (this.currentTrack === 'SPLASH_WAVE') {
      // Energetic chiptune bass in Am - F - C - G
      const a = 110.0, f = 87.31, c = 130.81, g = 98.0;
      const bar = Math.floor(step / 16);
      const root = bar === 0 ? a : bar === 1 ? f : bar === 2 ? c : g;
      bassFreq = (step % 2 === 0) ? root : root * (step % 8 === 7 ? 1.5 : 2);
    }

    if (bassFreq > 0) {
      this.playSynthBass(t, bassFreq);
    }

    // Lead melody
    let leadFreq = 0;
    if (this.currentTrack === 'MAGICAL_SHOWER') {
      const scale = [587.33, 659.25, 698.46, 783.99, 880.0, 1046.5, 1174.66]; // D minor
      const melodyPattern = [0, -1, 2, 3, 4, -1, 3, 2, 1, -1, 0, 2, 4, 5, 4, -1];
      const noteIdx = melodyPattern[step % 16];
      if (noteIdx >= 0) leadFreq = scale[noteIdx % scale.length];
    } else if (this.currentTrack === 'PASSING_BREEZE') {
      const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77]; // C major
      const melodyPattern = [4, -1, -1, 2, 3, -1, 1, -1, 0, -1, 2, -1, 4, 3, 2, -1];
      const noteIdx = melodyPattern[step % 16];
      if (noteIdx >= 0 && step % 2 === 0) leadFreq = scale[noteIdx % scale.length];
    } else if (this.currentTrack === 'SPLASH_WAVE') {
      const scale = [440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // A minor
      const melodyPattern = [0, 1, 2, 3, 4, 3, 2, 1, 3, 4, 5, 4, 3, 2, 1, 0];
      const noteIdx = melodyPattern[step % 16];
      if (noteIdx >= 0) leadFreq = scale[noteIdx % scale.length];
    }

    if (leadFreq > 0) {
      this.playSynthLead(t, leadFreq);
    }
  }

  private playDrumKick(t: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  private playDrumSnare(t: number) {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, t);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    noise.start(t);
    noise.stop(t + 0.18);
  }

  private playDrumHiHat(t: number, vol: number) {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, t);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    noise.start(t);
    noise.stop(t + 0.05);
  }

  private playSynthBass(t: number, freq: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(180, t + 0.18);
    filter.Q.setValueAtTime(4, t);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  private playSynthLead(t: number, freq: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = this.currentTrack === 'SPLASH_WAVE' ? 'square' : 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }
}

export const soundEngine = new SoundEngine();
