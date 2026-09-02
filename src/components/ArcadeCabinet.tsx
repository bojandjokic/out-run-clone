/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RadioTrack, SceneryTheme, HighScoreEntry } from '../types';
import { Volume2, VolumeX, Radio as RadioIcon, Tv, Play, RotateCcw, Award, Disc3, ShieldAlert, Wrench } from 'lucide-react';
import { RADIO_STATIONS } from '../game/constants';

interface ArcadeCabinetProps {
  gameState: 'TITLE' | 'RACING' | 'GAME_OVER' | 'VICTORY' | 'PAUSED';
  score: number;
  stage: number;
  theme: SceneryTheme;
  carsOvertaken: number;
  routeHistory: SceneryTheme[];
  radioTrack: RadioTrack;
  isMuted: boolean;
  scanlinesEnabled: boolean;
  highScores: HighScoreEntry[];
  wantedLevel?: number;
  collisionsWithNPC?: number;
  onStartGame: () => void;
  onRestartGame: () => void;
  onToggleMute: () => void;
  onCycleRadio: () => void;
  onToggleScanlines: () => void;
  // Touch inputs
  onTouchSteer: (dir: -1 | 0 | 1) => void;
  onTouchGas: (active: boolean) => void;
  onTouchBrake: (active: boolean) => void;
}

export const ArcadeCabinet: React.FC<ArcadeCabinetProps> = ({
  gameState,
  score,
  stage,
  theme,
  carsOvertaken,
  routeHistory,
  radioTrack,
  isMuted,
  scanlinesEnabled,
  highScores,
  wantedLevel = 0,
  collisionsWithNPC = 0,
  onStartGame,
  onRestartGame,
  onToggleMute,
  onCycleRadio,
  onToggleScanlines,
  onTouchSteer,
  onTouchGas,
  onTouchBrake,
}) => {
  const [activeTab, setActiveTab] = useState<'game' | 'leaderboard'>('game');

  return (
    <div id="arcade-cabinet-container" className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden bg-black font-sans">
      
      {/* Top Header Controls Bar (Sleek Glassmorphic Header) */}
      <header id="arcade-top-bar" className="absolute top-3 left-0 right-0 z-30 px-5 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2.5">
          <span className="font-black italic tracking-tighter text-sm bg-gradient-to-r from-amber-400 via-rose-500 to-purple-500 bg-clip-text text-transparent">
            OUTRUN
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-white/10 text-white/80 border border-white/15 rounded-md backdrop-blur-md">
            1986 ARCADE
          </span>
        </div>

        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-lg">
          <button
            id="radio-toggle-btn"
            onClick={onCycleRadio}
            title="Press [R] or click to Change Radio Station"
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors px-2.5 py-1 bg-white/10 hover:bg-white/15 rounded-lg border border-white/10 cursor-pointer"
          >
            <RadioIcon size={13} className="text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-emerald-300">
              {RADIO_STATIONS[radioTrack]?.frequency ? `FM ${RADIO_STATIONS[radioTrack].frequency}` : 'OFF'}
            </span>
            <span className="hidden md:inline uppercase text-[10px] tracking-wider text-white/90">
              • {RADIO_STATIONS[radioTrack]?.name || 'OFF'}
            </span>
            <span className="px-1 text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded font-mono">
              [R]
            </span>
          </button>

          <button
            id="mute-toggle-btn"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-1.5 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/15 rounded-lg border border-white/10 cursor-pointer"
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} className="text-amber-400" />}
          </button>

          <button
            id="scanline-toggle-btn"
            onClick={onToggleScanlines}
            title="Toggle CRT Scanlines"
            className={`p-1.5 transition-colors rounded-lg border cursor-pointer ${scanlinesEnabled ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40' : 'bg-white/10 text-white/50 border-white/10 hover:text-white'}`}
          >
            <Tv size={14} />
          </button>
        </div>
      </header>

      {/* TITLE SCREEN OVERLAY (Sleek Glassmorphic Card) */}
      {gameState === 'TITLE' && (
        <div id="title-screen-overlay" className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 text-center overflow-y-auto">
          {/* OutRun Sleek Marquee Logo */}
          <div className="mb-3 sm:mb-4 transform hover:scale-[1.02] transition-transform">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black italic tracking-tighter bg-gradient-to-b from-yellow-300 via-rose-500 to-purple-600 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(255,105,180,0.5)]">
              OUTRUN
            </h1>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-cyan-400/90 mt-0.5">
              HIGH-SPEED HORIZON HIGHWAY
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex gap-2.5 mb-3 bg-black/50 p-1 rounded-xl border border-white/15 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('game')}
              className={`text-xs font-bold px-4 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'game' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40' : 'text-white/60 hover:text-white'}`}
            >
              RACE NOW
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'leaderboard' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/40' : 'text-white/60 hover:text-white'}`}
            >
              <Award size={14} />
              HI-SCORES
            </button>
          </div>

          {activeTab === 'game' ? (
            <div className="max-w-md w-full bg-black/75 backdrop-blur-xl border border-white/20 p-4 sm:p-5 rounded-2xl shadow-2xl flex flex-col items-center max-h-[75vh] overflow-y-auto">
              {/* Start Button */}
              <button
                id="btn-start-game"
                onClick={onStartGame}
                className="w-full py-3.5 bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black italic tracking-wide text-sm sm:text-base rounded-xl shadow-xl shadow-rose-600/30 hover:shadow-rose-500/50 transform active:scale-98 transition-all flex items-center justify-center gap-2 mb-3 cursor-pointer border border-white/20"
              >
                <Play size={18} fill="currentColor" />
                START ENGINE (ENTER)
              </button>

              {/* Radio Station Selector Widget */}
              <div className="w-full bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 mb-3 text-left">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                    <RadioIcon size={12} className="animate-spin-slow" />
                    <span>FM STEREO CASSETTE DECK</span>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-300/70">PRESS [R] TO CYCLE</span>
                </div>
                
                <div className="grid grid-cols-2 gap-1.5">
                  {(['MAGICAL_SHOWER', 'PASSING_BREEZE', 'SPLASH_WAVE', 'OFF'] as RadioTrack[]).map((trackKey) => {
                    const st = RADIO_STATIONS[trackKey];
                    const isSelected = radioTrack === trackKey;
                    return (
                      <button
                        key={trackKey}
                        onClick={onCycleRadio}
                        className={`text-left p-2 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-md shadow-emerald-500/20'
                            : 'bg-black/40 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`font-mono text-[10px] font-bold ${isSelected ? 'text-emerald-300' : 'text-white/50'}`}>
                            {trackKey === 'OFF' ? '---.- FM' : `FM ${st.frequency}`}
                          </span>
                          {isSelected && <span className="text-[8px] font-bold text-emerald-400">● ACTIVE</span>}
                        </div>
                        <span className="text-[11px] font-bold truncate mt-0.5">
                          {trackKey === 'OFF' ? 'RADIO MUTED' : st.name}
                        </span>
                        <span className="text-[8px] text-white/40 truncate">
                          {trackKey === 'OFF' ? 'Engine sound only' : st.genre}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Controls & Rules Guidance */}
              <div className="w-full text-left bg-black/50 p-3 sm:p-3.5 rounded-xl border border-white/10 font-sans text-xs text-white/80 space-y-1.5">
                <div className="text-cyan-400 font-bold uppercase tracking-wider text-[10px] mb-1 flex items-center justify-between">
                  <span>KEYBOARD CONTROLS</span>
                  <span className="text-white/40 text-[9px]">READY FOR ACTION</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-white/5 text-[11px]">
                  <span className="text-white/60">ACCELERATE / GAS:</span>
                  <span className="text-yellow-400 font-black tracking-wide">UP / W</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-white/5 text-[11px]">
                  <span className="text-white/60">BRAKE / DECEL:</span>
                  <span className="text-yellow-400 font-black tracking-wide">DOWN / S</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-white/5 text-[11px]">
                  <span className="text-white/60">STEER LEFT / RIGHT:</span>
                  <span className="text-yellow-400 font-black tracking-wide">LEFT / RIGHT / A / D</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-white/5 text-[11px]">
                  <span className="text-white/60">TUNE RADIO TRACK:</span>
                  <span className="text-emerald-400 font-black tracking-wide font-mono">R KEY (or M)</span>
                </div>

                {/* Police & Wanted System Guidance */}
                <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                  <div className="text-rose-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <ShieldAlert size={12} />
                    <span>POLICE PURSUIT & 7-SECOND EVASION</span>
                  </div>
                  <p className="text-[10px] text-white/70 leading-relaxed">
                    • Crashing raises your <strong className="text-yellow-400">Wanted Level (★1 to ★5)</strong>.
                  </p>
                  <p className="text-[10px] text-emerald-300/90 leading-relaxed">
                    • <strong className="text-emerald-400">7-SEC EVASION:</strong> Avoid pursuit for 7 seconds to lose all wanted stars and clear police cruisers!
                  </p>
                  <p className="text-[10px] text-cyan-300/90 leading-relaxed flex items-center gap-1">
                    <Wrench size={10} className="text-amber-400 inline" />
                    <span>Drive near <strong className="text-amber-300">Mechanic Shops</strong> for Nitro & Super Grip power-ups!</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Leaderboard Table */
            <div className="max-w-md w-full bg-black/65 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-2xl">
              <h3 className="text-sm font-black uppercase tracking-wider text-yellow-400 mb-4 text-center">HALL OF FAME</h3>
              <div className="space-y-2 text-sm">
                {highScores.map((entry, i) => (
                  <div key={i} className="flex justify-between items-center py-2 px-3 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-rose-400 font-black text-xs">#{entry.rank}</span>
                    <span className="text-white font-bold">{entry.name}</span>
                    <span className="text-cyan-400 text-xs font-bold">ST.{entry.stage}</span>
                    <span className="text-yellow-400 font-black italic">{entry.score.toString().padStart(7, '0')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
            © 1986 SEGA / RE-ENGINEERED IN PURE CANVAS 2D
          </div>
        </div>
      )}

      {/* GAME OVER / VICTORY OVERLAY (Sleek Glassmorphic Modal) */}
      {(gameState === 'GAME_OVER' || gameState === 'VICTORY') && (
        <div id="game-over-overlay" className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-4 text-center animate-fade-in">
          <div className="max-w-lg w-full bg-black/75 backdrop-blur-xl border border-white/20 p-7 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)]">
            <h2 className={`text-3xl sm:text-4xl mb-2 font-black italic tracking-tighter ${gameState === 'VICTORY' ? 'text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]' : 'text-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.5)]'}`}>
              {gameState === 'VICTORY' ? '🏆 COURSE COMPLETED!' : 'TIME OVER'}
            </h2>
            <p className="text-xs font-bold uppercase tracking-wide text-white/60 mb-6">
              {gameState === 'VICTORY' ? 'CONGRATULATIONS! YOU REACHED THE GRAND SUNSET GOAL!' : 'GREAT EFFORT! REACH THE CHECKPOINTS FASTER TO EXTEND TIME'}
            </p>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6 text-left">
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-[10px] uppercase font-bold tracking-wider text-white/50">FINAL SCORE</div>
                <div className="text-xl text-yellow-400 font-black italic">{score.toString().padStart(7, '0')}</div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-[10px] uppercase font-bold tracking-wider text-white/50">STAGE REACHED</div>
                <div className="text-xl text-cyan-400 font-black italic">STAGE {stage} / 5</div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-[10px] uppercase font-bold tracking-wider text-white/50">OVERTAKEN</div>
                <div className="text-xl text-emerald-400 font-black italic">{carsOvertaken} CARS</div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-[10px] uppercase font-bold tracking-wider text-white/50">NPC CRASHES</div>
                <div className="text-xl text-rose-400 font-black italic">{collisionsWithNPC} HITS</div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-[10px] uppercase font-bold tracking-wider text-white/50">WANTED LEVEL</div>
                <div className="text-xl text-amber-400 font-black italic">{wantedLevel > 0 ? `★${wantedLevel}` : 'CLEAR'}</div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-[10px] uppercase font-bold tracking-wider text-white/50">ROUTE THEME</div>
                <div className="text-xl text-purple-400 font-black italic uppercase">{theme}</div>
              </div>
            </div>

            {/* Restart Button */}
            <button
              id="btn-restart-game"
              onClick={onRestartGame}
              className="w-full py-4 bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black italic tracking-wide text-sm rounded-xl shadow-xl shadow-rose-600/40 transform active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20"
            >
              <RotateCcw size={18} />
              DRIVE AGAIN (ENTER)
            </button>
          </div>
        </div>
      )}

      {/* ON-SCREEN MOBILE TOUCH CONTROLS (Sleek Glassmorphic Floating Buttons) */}
      {gameState === 'RACING' && (
        <div id="touch-controls-container" className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 sm:hidden">
          {/* Top touch zone hint */}
          <div className="w-full flex justify-between pt-14 opacity-60">
            <span className="text-[9px] font-bold text-cyan-400 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md border border-cyan-500/20">STEER LEFT / RIGHT</span>
            <span className="text-[9px] font-bold text-amber-400 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md border border-amber-500/20">HOLD PEDAL TO DRIVE</span>
          </div>

          {/* Bottom Steering & Pedal buttons */}
          <div className="w-full flex items-end justify-between pb-4 pointer-events-auto">
            {/* Steering Buttons */}
            <div className="flex gap-2.5">
              <button
                id="touch-btn-left"
                onTouchStart={() => onTouchSteer(-1)}
                onTouchEnd={() => onTouchSteer(0)}
                onMouseDown={() => onTouchSteer(-1)}
                onMouseUp={() => onTouchSteer(0)}
                className="w-16 h-16 bg-black/60 active:bg-cyan-600/80 backdrop-blur-md border-2 border-cyan-400/40 active:border-cyan-300 text-cyan-300 font-black text-xl rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                ◀
              </button>
              <button
                id="touch-btn-right"
                onTouchStart={() => onTouchSteer(1)}
                onTouchEnd={() => onTouchSteer(0)}
                onMouseDown={() => onTouchSteer(1)}
                onMouseUp={() => onTouchSteer(0)}
                className="w-16 h-16 bg-black/60 active:bg-cyan-600/80 backdrop-blur-md border-2 border-cyan-400/40 active:border-cyan-300 text-cyan-300 font-black text-xl rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                ▶
              </button>
            </div>

            {/* Pedals (Brake & Gas) */}
            <div className="flex gap-2.5">
              <button
                id="touch-btn-brake"
                onTouchStart={() => onTouchBrake(true)}
                onTouchEnd={() => onTouchBrake(false)}
                onMouseDown={() => onTouchBrake(true)}
                onMouseUp={() => onTouchBrake(false)}
                className="w-14 h-16 bg-black/60 active:bg-rose-700/80 backdrop-blur-md border-2 border-rose-500/40 active:border-rose-300 text-rose-300 font-black text-[10px] rounded-2xl flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <span>BRAKE</span>
              </button>
              <button
                id="touch-btn-gas"
                onTouchStart={() => onTouchGas(true)}
                onTouchEnd={() => onTouchGas(false)}
                onMouseDown={() => onTouchGas(true)}
                onMouseUp={() => onTouchGas(false)}
                className="w-16 h-20 bg-gradient-to-t from-emerald-600 to-emerald-400 active:from-emerald-500 active:to-emerald-300 border-2 border-emerald-300 text-white font-black text-xs rounded-2xl flex flex-col items-center justify-center shadow-xl active:scale-95 transition-transform"
              >
                <span>GAS</span>
                <span className="text-[10px] opacity-90">▲</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

