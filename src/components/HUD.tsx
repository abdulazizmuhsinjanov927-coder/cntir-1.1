import React, { useEffect, useState } from 'react';
import { WeaponDef, RoomInfo, KillfeedEntry, GameMode } from '../types/game';
import { MobileInputs } from '../game/PlayerController';
import { Shield, Crosshair as CrosshairIcon, Volume2, RotateCcw, Zap } from 'lucide-react';

interface HUDProps {
  weapon: WeaponDef;
  ammo: number;
  reserveAmmo: number;
  health: number;
  armor: number;
  isAiming: boolean;
  isReloading: boolean;
  killfeed: KillfeedEntry[];
  roomInfo: RoomInfo | null;
  hitmarker: { active: boolean; isHeadshot: boolean };
  damageTaken: boolean;
  onMobileInput: (inputs: Partial<MobileInputs>) => void;
  onPause: () => void;
  showMobileControls?: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  weapon,
  ammo,
  reserveAmmo,
  health,
  armor,
  isAiming,
  isReloading,
  killfeed,
  roomInfo,
  hitmarker,
  damageTaken,
  onMobileInput,
  onPause,
  showMobileControls = false,
}) => {
  const [touchStickActive, setTouchStickActive] = useState(false);
  const [stickCenter, setStickCenter] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [stickOffset, setStickOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Joystick touch handlers
  const handleStickStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setStickCenter({ x: cx, y: cy });
    setTouchStickActive(true);
  };

  const handleStickMove = (e: React.TouchEvent) => {
    if (!touchStickActive) return;
    const touch = e.touches[0];
    const dx = touch.clientX - stickCenter.x;
    const dy = touch.clientY - stickCenter.y;
    const dist = Math.hypot(dx, dy);
    const maxR = 45;
    const clampedR = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);
    const ox = Math.cos(angle) * clampedR;
    const oy = Math.sin(angle) * clampedR;
    setStickOffset({ x: ox, y: oy });

    onMobileInput({
      moveX: ox / maxR,
      moveY: oy / maxR,
    });
  };

  const handleStickEnd = () => {
    setTouchStickActive(false);
    setStickOffset({ x: 0, y: 0 });
    onMobileInput({ moveX: 0, moveY: 0 });
  };

  // Format seconds mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isLowHealth = health <= 30;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20">
      {/* Red damage vignette flash */}
      {damageTaken && (
        <div className="absolute inset-0 bg-red-600/35 animate-damage pointer-events-none transition-opacity" />
      )}

      {/* Critical low health heartbeat pulse vignette */}
      {isLowHealth && (
        <div className="absolute inset-0 ring-[12px] ring-inset ring-red-600/50 animate-pulse pointer-events-none" />
      )}

      {/* Top Header: Match Info, Scores, and Timer */}
      <div className="absolute top-4 left-0 right-0 flex justify-center items-start px-6">
        <div className="flex items-center gap-4 bg-neutral-950/80 backdrop-blur-md border border-neutral-800/80 px-6 py-2.5 rounded-lg shadow-2xl">
          {/* Red Team Score */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
            <span className="font-heading text-red-400 text-xs uppercase font-bold tracking-wider">RED</span>
            <span className="font-heading text-xl font-bold text-white px-2 py-0.5 bg-red-950/60 rounded">
              {roomInfo?.redScore ?? 0}
            </span>
          </div>

          {/* Match Timer */}
          <div className="flex flex-col items-center px-4 border-x border-neutral-800">
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono">TIME LEFT</span>
            <span className="font-heading text-lg font-bold text-amber-400">
              {formatTime(roomInfo?.matchTimeRemaining ?? 600)}
            </span>
          </div>

          {/* Blue Team Score */}
          <div className="flex items-center gap-2">
            <span className="font-heading text-xl font-bold text-white px-2 py-0.5 bg-blue-950/60 rounded">
              {roomInfo?.blueScore ?? 0}
            </span>
            <span className="font-heading text-blue-400 text-xs uppercase font-bold tracking-wider">BLUE</span>
            <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
          </div>
        </div>
      </div>

      {/* Capture the Point Control Meter */}
      {roomInfo?.mode === 'point' && (
        <div className="absolute top-16 left-0 right-0 flex justify-center items-center">
          <div className="bg-neutral-950/85 border border-neutral-800 px-4 py-1.5 rounded-full flex items-center gap-3">
            <span className="text-xs uppercase font-bold text-neutral-300">POINT [A]</span>
            <div className="w-40 h-2.5 bg-neutral-800 rounded-full overflow-hidden relative">
              <div
                className={`h-full transition-all duration-300 ${
                  roomInfo.pointOwner === 'red'
                    ? 'bg-red-500'
                    : roomInfo.pointOwner === 'blue'
                    ? 'bg-blue-500'
                    : 'bg-amber-400'
                }`}
                style={{ width: `${roomInfo.pointProgress}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-neutral-400">{roomInfo.pointProgress}%</span>
          </div>
        </div>
      )}

      {/* Top Right: Killfeed */}
      <div className="absolute top-4 right-6 flex flex-col gap-1.5 max-w-sm">
        {killfeed.slice(0, 5).map((kf) => (
          <div
            key={kf.id}
            className="flex items-center gap-2 bg-neutral-950/80 border border-neutral-800/60 px-3 py-1 rounded text-xs backdrop-blur-sm animate-fade-in"
          >
            <span className={kf.killerTeam === 'red' ? 'text-red-400 font-bold' : 'text-blue-400 font-bold'}>
              {kf.killerName}
            </span>
            <span className="text-neutral-500 font-mono text-[10px]">[{kf.weaponName}]</span>
            {kf.isHeadshot && <span className="text-red-500 font-bold text-[10px]">⚡HS</span>}
            <span className="text-neutral-400">➔</span>
            <span className={kf.victimTeam === 'red' ? 'text-red-400 font-bold' : 'text-blue-400 font-bold'}>
              {kf.victimName}
            </span>
          </div>
        ))}
      </div>

      {/* Top Left: Room Code & Quick Exit */}
      <div className="absolute top-4 left-6 flex items-center gap-3">
        <button
          onClick={onPause}
          className="pointer-events-auto bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 px-3 py-1.5 rounded text-xs font-heading font-semibold text-neutral-200 transition-colors shadow-lg cursor-pointer"
        >
          ESC / MENU
        </button>
        {roomInfo && (
          <div className="bg-neutral-950/80 border border-neutral-800 px-3 py-1 rounded text-xs font-mono text-neutral-400">
            ROOM: <span className="text-amber-400 font-bold">{roomInfo.id}</span>
          </div>
        )}
      </div>

      {/* Center Screen: Dynamic Reticle or Sniper Scope Overlay */}
      {weapon.category === 'sniper' && isAiming ? (
        // Sniper Scope Overlay
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[520px] h-[520px] rounded-full border-2 border-neutral-900 shadow-[0_0_0_9999px_rgba(0,0,0,0.92)] relative overflow-hidden flex items-center justify-center">
            {/* Scope Crosshair Lines */}
            <div className="absolute w-full h-[1.5px] bg-red-500/80" />
            <div className="absolute h-full w-[1.5px] bg-red-500/80" />
            {/* Range ticks */}
            <div className="absolute w-6 h-[1px] bg-neutral-400/80 top-1/2 -translate-y-8" />
            <div className="absolute w-10 h-[1px] bg-neutral-400/80 top-1/2 translate-y-8" />
            <div className="absolute w-14 h-[1px] bg-neutral-400/80 top-1/2 translate-y-16" />
            {/* Subtle center red dot */}
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
          </div>
        </div>
      ) : (
        // Tactical Crosshair (Tightens on ADS)
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`relative transition-all duration-100 ${isAiming ? 'scale-75 opacity-90' : 'scale-100'}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
            {/* Top tick */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-emerald-400/80" />
            {/* Bottom tick */}
            <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-emerald-400/80" />
            {/* Left tick */}
            <div className="absolute top-1/2 -left-3.5 -translate-y-1/2 w-2 h-0.5 bg-emerald-400/80" />
            {/* Right tick */}
            <div className="absolute top-1/2 -right-3.5 -translate-y-1/2 w-2 h-0.5 bg-emerald-400/80" />
          </div>
        </div>
      )}

      {/* Hitmarker Confirmation */}
      {hitmarker.active && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`relative animate-hitmarker ${hitmarker.isHeadshot ? 'text-red-500' : 'text-amber-300'}`}>
            <div className="w-6 h-6 border-2 border-current rotate-45" />
          </div>
        </div>
      )}

      {/* Bottom Left: Health, Armor & Tactical Vitals */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 pointer-events-none">
        {/* Health Bar */}
        <div className="bg-neutral-950/85 backdrop-blur-md border border-neutral-800 p-3 rounded-lg shadow-xl w-64">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400">VITALITY</span>
            <span className={`font-heading font-bold text-base ${isLowHealth ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
              {health} / 100
            </span>
          </div>
          <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-150 ${
                isLowHealth ? 'bg-red-500' : health < 60 ? 'bg-amber-400' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(0, health)}%` }}
            />
          </div>

          {/* Armor Bar */}
          <div className="flex justify-between items-center mt-2.5 mb-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 flex items-center gap-1">
              <Shield className="w-3 h-3 text-cyan-400" /> ARMOR
            </span>
            <span className="font-heading font-bold text-xs text-cyan-400">{armor} / 50</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400 transition-all duration-150" style={{ width: `${(armor / 50) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Bottom Right: Ammo Counter, Weapon Name, and Reload Notification */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2 pointer-events-none">
        {/* Reloading Banner */}
        {isReloading && (
          <div className="bg-amber-500/90 text-neutral-950 px-4 py-1 rounded font-heading font-bold text-xs tracking-wider animate-pulse uppercase">
            RELOADING...
          </div>
        )}

        <div className="bg-neutral-950/85 backdrop-blur-md border border-neutral-800 p-3.5 rounded-lg shadow-xl flex items-center gap-6 min-w-[200px] justify-between">
          <div className="flex flex-col">
            <span className="font-heading text-sm font-bold text-white tracking-wide">{weapon.name}</span>
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono">{weapon.category}</span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className={`font-heading text-3xl font-bold ${ammo <= 5 ? 'text-red-500' : 'text-amber-400'}`}>
              {ammo}
            </span>
            <span className="text-neutral-500 font-mono text-sm">/ {reserveAmmo}</span>
          </div>
        </div>
      </div>

      {/* Mobile Touch Controls (Visible if enabled or on mobile screens) */}
      {showMobileControls && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Virtual Movement Joystick (Bottom Left) */}
          <div
            className="absolute bottom-24 left-8 w-28 h-28 rounded-full border-2 border-white/20 bg-neutral-900/30 backdrop-blur-sm pointer-events-auto flex items-center justify-center touch-none"
            onTouchStart={handleStickStart}
            onTouchMove={handleStickMove}
            onTouchEnd={handleStickEnd}
          >
            <div
              className="w-12 h-12 rounded-full bg-white/40 shadow-lg pointer-events-none transition-transform"
              style={{
                transform: `translate(${stickOffset.x}px, ${stickOffset.y}px)`,
              }}
            />
          </div>

          {/* Action Buttons (Bottom Right) */}
          <div className="absolute bottom-24 right-8 flex flex-col gap-3 items-end pointer-events-auto">
            <div className="flex gap-3">
              {/* Aim (ADS) Button */}
              <button
                onTouchStart={() => onMobileInput({ isAiming: true })}
                onTouchEnd={() => onMobileInput({ isAiming: false })}
                className="w-14 h-14 rounded-full bg-cyan-600/80 border border-cyan-400/60 text-white font-bold text-xs flex items-center justify-center active:bg-cyan-500"
              >
                ADS
              </button>
              {/* Reload Button */}
              <button
                onClick={() => onMobileInput({ isReloading: true })}
                className="w-14 h-14 rounded-full bg-neutral-800/80 border border-neutral-600/60 text-white font-bold text-xs flex items-center justify-center active:bg-neutral-700"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-3">
              {/* Jump Button */}
              <button
                onTouchStart={() => onMobileInput({ isJumping: true })}
                onTouchEnd={() => onMobileInput({ isJumping: false })}
                className="w-14 h-14 rounded-full bg-neutral-800/80 border border-neutral-600/60 text-white font-bold text-xs flex items-center justify-center active:bg-neutral-700"
              >
                JUMP
              </button>
              {/* Primary Fire Button */}
              <button
                onTouchStart={() => onMobileInput({ isShooting: true })}
                onTouchEnd={() => onMobileInput({ isShooting: false })}
                className="w-18 h-18 rounded-full bg-red-600 border-2 border-red-400 text-white font-heading font-bold text-base flex items-center justify-center active:bg-red-500 shadow-xl"
              >
                FIRE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
