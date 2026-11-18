/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Volume2, VolumeX, Shield, Zap, Snowflake, Flag, RefreshCw } from 'lucide-react';
import { CHARACTERS } from '../game/constants';
import { GameEngine } from '../game/gameEngine';
import { CharacterType } from '../types/game';
import { sounds } from '../audio/soundSystem';

interface HUDProps {
  engine: GameEngine;
  cameraMode: 'follow' | 'tactical';
  onToggleCamera: () => void;
  onOpenMenu: () => void;
  onRestartMatch: () => void;
  onTouchMove: (input: { moveX: number; moveZ: number }) => void;
  onTouchAbility: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  engine,
  cameraMode,
  onToggleCamera,
  onOpenMenu,
  onRestartMatch,
  onTouchMove,
  onTouchAbility,
}) => {
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isDraggingJoystick, setIsDraggingJoystick] = useState(false);
  const [, setHudTick] = useState(0);
  const joystickBaseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setHudTick((t) => (t + 1) % 10000);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const human = engine.getHumanPlayer();
  const charDef = human ? CHARACTERS[human.character] : CHARACTERS.silver;

  const blueFlags = engine.flags.filter((f) => f.team === 'red' && f.isCaptured).length;
  const redFlags = engine.flags.filter((f) => f.team === 'blue' && f.isCaptured).length;

  const minutes = Math.floor(engine.matchTimeRemaining / 60);
  const seconds = Math.floor(engine.matchTimeRemaining % 60);
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDraggingJoystick(true);
    updateJoystickPos(e);
  };

  const updateJoystickPos = (e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const maxRadius = 45;
    const dist = Math.hypot(dx, dy);

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const stickX = Math.cos(angle) * clampedDist;
    const stickY = Math.sin(angle) * clampedDist;

    setJoystickPos({ x: stickX, y: stickY });
    onTouchMove({
      moveX: stickX / maxRadius,
      moveZ: stickY / maxRadius,
    });
  };

  const handleTouchEnd = () => {
    setIsDraggingJoystick(false);
    setJoystickPos({ x: 0, y: 0 });
    onTouchMove({ moveX: 0, moveZ: 0 });
  };

  const getAbilityIcon = (char: CharacterType) => {
    switch (char) {
      case 'bobby':
        return <Shield className="w-6 h-6 text-amber-400" />;
      case 'silver':
        return <Zap className="w-6 h-6 text-emerald-400" />;
      case 'luppy':
        return <Snowflake className="w-6 h-6 text-cyan-400" />;
    }
  };

  const cooldownPercent = human ? Math.min(100, (human.abilityCooldown / charDef.cooldownSeconds) * 100) : 0;
  const isAbilityReady = human && human.abilityCooldown <= 0 && !human.isFrozen;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 overflow-hidden select-none">
      {/* 1. TOP BAR: Match Header & Flag Scoreboard */}
      <header className="flex items-center justify-between gap-4 w-full max-w-4xl mx-auto">
        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 bg-slate-900/90 rounded-2xl border border-blue-500/40 shadow-lg shadow-blue-500/10">
          <div className="w-3.5 h-3.5 rounded-full bg-blue-500 ring-2 ring-blue-400/50" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Time Azul</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                    i < blueFlags ? 'bg-blue-600 text-white shadow-md shadow-blue-600/50 scale-105' : 'bg-slate-800/80 text-slate-500'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex flex-col items-center px-5 py-2 bg-slate-900/95 rounded-2xl border border-slate-700/60 shadow-xl">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider">BARRA BANDEIRA</span>
          <span className="text-2xl font-black font-mono-nums text-white tracking-wider">
            {formattedTime}
          </span>
          <span className="text-[10px] text-amber-400 font-bold uppercase mt-0.5">
            {blueFlags === 2 || redFlags === 2 ? 'PONTO DA VITÓRIA!' : 'CAPTURE AS 3 BANDEIRAS'}
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 bg-slate-900/90 rounded-2xl border border-red-500/40 shadow-lg shadow-red-500/10">
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Time Vermelho</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                    i < redFlags ? 'bg-red-600 text-white shadow-md shadow-red-600/50 scale-105' : 'bg-slate-800/80 text-slate-500'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                </div>
              ))}
            </div>
          </div>
          <div className="w-3.5 h-3.5 rounded-full bg-red-500 ring-2 ring-red-400/50" />
        </div>
      </header>

      {/* 2. Top-Right Utility Actions */}
      <div className="absolute top-4 right-4 pointer-events-auto flex items-center gap-2">
        <button
          onClick={onToggleCamera}
          title={cameraMode === 'follow' ? 'Câmera Tática Aérea' : 'Acompanhar Jogador'}
          className="p-2.5 bg-slate-900/85 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-700/60 shadow-md transition-transform active:scale-95 cursor-pointer"
        >
          <Camera className="w-4 h-4" />
        </button>
        <button
          onClick={toggleSound}
          title={isMuted ? 'Ativar Som' : 'Desativar Som'}
          className="p-2.5 bg-slate-900/85 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-700/60 shadow-md transition-transform active:scale-95 cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>
        <button
          onClick={onRestartMatch}
          title="Reiniciar Partida"
          className="p-2.5 bg-slate-900/85 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-700/60 shadow-md transition-transform active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={onOpenMenu}
          title="Menu Principal"
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
        >
          Menu
        </button>
      </div>

      {/* 3. Center Screen Alerts */}
      {human?.isFrozen && (
        <div className="pointer-events-none mx-auto my-auto flex flex-col items-center bg-cyan-950/90 px-6 py-4 rounded-3xl border-2 border-cyan-400/80 shadow-2xl shadow-cyan-500/30">
          <div className="flex items-center gap-2 text-cyan-300 font-extrabold text-xl">
            <Snowflake className="w-6 h-6" />
            <span>VOCÊ FOI CONGELADO!</span>
          </div>
          <span className="text-xs text-cyan-100 font-medium mt-1">
            Aguarde a granada da <strong className="text-purple-300">Luppy</strong> ou o toque de um aliado (<strong className="text-amber-300">"SALVO!"</strong>)
          </span>
        </div>
      )}

      {/* 4. BOTTOM INTERFACE DOCK */}
      <footer className="w-full max-w-3xl mx-auto flex items-end justify-between gap-4 pointer-events-none pb-2">
        {/* Virtual Joystick */}
        <div className="pointer-events-auto flex flex-col items-center">
          <div
            ref={joystickBaseRef}
            onTouchStart={handleTouchStart}
            onTouchMove={updateJoystickPos}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseMove={isDraggingJoystick ? updateJoystickPos : undefined}
            onMouseUp={handleTouchEnd}
            className="w-28 h-28 rounded-full bg-slate-900/70 border-2 border-slate-600/60 relative flex items-center justify-center touch-none cursor-grab active:cursor-grabbing shadow-inner"
          >
            <div
              style={{
                transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
              }}
              className="w-12 h-12 rounded-full bg-indigo-600/90 border-2 border-indigo-400 shadow-md shadow-indigo-500/40 pointer-events-none transition-transform duration-75"
            />
          </div>
          <span className="text-[10px] text-slate-300 font-semibold mt-1">WASD / Analógico</span>
        </div>

        {/* Character Info Card */}
        {human && (
          <div className="pointer-events-auto flex items-center gap-3.5 px-5 py-3 bg-slate-900/95 rounded-2xl border border-slate-700/60 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-600/80 flex items-center justify-center text-2xl shadow-inner">
              {charDef.avatarIcon}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-white">{charDef.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  human.team === 'blue' ? 'bg-blue-900/60 text-blue-300 border border-blue-500/30' : 'bg-red-900/60 text-red-300 border border-red-500/30'
                }`}>
                  {human.team === 'blue' ? 'Azul' : 'Vermelho'}
                </span>
              </div>
              <span className="text-xs text-slate-400">{charDef.role}</span>
              {human.isShieldActive && (
                <span className="text-[11px] font-bold text-amber-300 font-mono-nums mt-0.5">
                  Escudo imune ativo: {human.shieldTimer.toFixed(1)}s
                </span>
              )}
              {human.carryingFlagId && (
                <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1 mt-0.5">
                  <Flag className="w-3 h-3" /> CARREGANDO BANDEIRA INIMIGA!
                </span>
              )}
            </div>
          </div>
        )}

        {/* Special Ability Button */}
        <div className="pointer-events-auto flex flex-col items-center">
          <button
            onClick={() => {
              if (isAbilityReady) {
                onTouchAbility();
                sounds.playClick();
              }
            }}
            disabled={!isAbilityReady}
            className={`relative w-24 h-20 px-2 rounded-2xl flex flex-col items-center justify-center border-2 transition-all shadow-xl active:scale-95 ${
              isAbilityReady
                ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400 text-amber-300 shadow-amber-500/20 hover:shadow-amber-500/40 cursor-pointer scale-105'
                : 'bg-slate-900/85 border-slate-700 text-slate-500 cursor-not-allowed opacity-85'
            }`}
          >
            {human && human.abilityCooldown > 0 && (
              <div
                className="absolute inset-0 rounded-2xl bg-slate-950/80 flex items-center justify-center"
                style={{
                  clipPath: `polygon(50% 50%, 50% 0%, ${cooldownPercent < 25 ? '100% 0%' : '100% 100%'}, ${cooldownPercent < 50 ? '0% 100%' : '0% 0%'})`,
                }}
              >
                <span className="text-lg font-black font-mono-nums text-white">
                  {human.abilityCooldown.toFixed(1)}s
                </span>
              </div>
            )}

            {human && getAbilityIcon(human.character)}
            <span className="text-[10px] font-bold mt-1 text-center leading-tight line-clamp-2">
              {charDef.abilityName}
            </span>
          </button>
          <span className="text-[10px] text-slate-300 font-semibold mt-1">Espaço / Toque</span>
        </div>
      </footer>
    </div>
  );
};
