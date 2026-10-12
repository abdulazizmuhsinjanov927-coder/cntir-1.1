import React from 'react';
import { WeaponDef, WeaponSkinDef, CharacterSkinDef, MapDef } from '../types/game';
import { SoundEngine } from '../audio/SoundEngine';
import { Play, Globe, Compass, Shield, UserCheck, Settings, User, Sparkles, Volume2, VolumeX } from 'lucide-react';

interface MainMenuProps {
  playerName: string;
  currentWeapon: WeaponDef;
  currentSkin: WeaponSkinDef;
  currentCharSkin: CharacterSkinDef;
  currentMap: MapDef;
  isMuted: boolean;
  onToggleMute: () => void;
  onPlay: () => void;
  onOpenMultiplayer: () => void;
  onOpenMaps: () => void;
  onOpenArmory: () => void;
  onOpenCharacters: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  playerName,
  currentWeapon,
  currentSkin,
  currentCharSkin,
  currentMap,
  isMuted,
  onToggleMute,
  onPlay,
  onOpenMultiplayer,
  onOpenMaps,
  onOpenArmory,
  onOpenCharacters,
  onOpenProfile,
  onOpenSettings,
}) => {
  return (
    <div className="absolute inset-0 bg-neutral-950 flex flex-col justify-between p-8 z-30 select-none overflow-hidden scanline">
      {/* Background Cinematic Gradient & Ambient Grid */}
      <div className="absolute inset-0 bg-gradient-to-tr from-neutral-950 via-neutral-900/60 to-neutral-950 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Bar */}
      <div className="relative z-10 flex justify-between items-center">
        {/* Game Title & Branding */}
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse" />
            <span className="text-[11px] font-mono uppercase text-amber-400 tracking-widest font-bold">
              TACTICAL ONLINE COMBAT // BUILD v1.0
            </span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-white tracking-wider drop-shadow-lg mt-1">
            ULTIMATE STRIKE <span className="text-amber-500 font-normal">: ONLINE</span>
          </h1>
        </div>

        {/* Top Right: Player Badge, Audio & Settings */}
        <div className="flex items-center gap-3">
          {/* Audio toggle */}
          <button
            onClick={onToggleMute}
            className="p-2.5 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-300 transition-colors cursor-pointer"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Settings button */}
          <button
            onClick={() => {
              SoundEngine.playUiClick();
              onOpenSettings();
            }}
            className="p-2.5 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-300 transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Profile Card */}
          <button
            onClick={() => {
              SoundEngine.playUiClick();
              onOpenProfile();
            }}
            className="flex items-center gap-3 bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800/80 px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="font-heading font-bold text-sm text-white block">{playerName}</span>
              <span className="text-[10px] font-mono text-neutral-400">LVL 24 • COMMANDER</span>
            </div>
          </button>
        </div>
      </div>

      {/* Center Tactical Loadout Preview Badge */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 my-auto">
        {/* Left Side: Main Deployment Navigation Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {/* Primary Quick Deploy Button */}
          <button
            onClick={() => {
              SoundEngine.playUiClick();
              onPlay();
            }}
            className="group relative overflow-hidden bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 p-4 rounded-2xl font-heading font-bold text-lg tracking-wider shadow-2xl transition-all duration-150 active:scale-98 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-950 text-amber-400 flex items-center justify-center shadow">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <div className="text-left">
                <span className="block leading-none">DEPLOY TO MATCH</span>
                <span className="text-[11px] font-mono font-medium opacity-80">Instant combat action</span>
              </div>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 bg-neutral-950/15 rounded">QUICK PLAY</span>
          </button>

          {/* Multiplayer & Friends Hub */}
          <button
            onClick={() => {
              SoundEngine.playUiClick();
              onOpenMultiplayer();
            }}
            className="bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 p-3.5 rounded-xl text-white font-heading font-semibold text-sm tracking-wide transition-all hover:border-neutral-700 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <span>MULTIPLAYER & FRIENDS</span>
                <span className="text-[10px] text-neutral-400 font-mono block">Room codes, private matches & server browser</span>
              </div>
            </div>
          </button>

          {/* 15 Maps Theater */}
          <button
            onClick={() => {
              SoundEngine.playUiClick();
              onOpenMaps();
            }}
            className="bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 p-3.5 rounded-xl text-white font-heading font-semibold text-sm tracking-wide transition-all hover:border-neutral-700 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Compass className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <span>MAP THEATER (15 MAPS)</span>
                <span className="text-[10px] text-neutral-400 font-mono block">Selected: {currentMap.name}</span>
              </div>
            </div>
          </button>

          {/* Armory & 20+ Skins */}
          <button
            onClick={() => {
              SoundEngine.playUiClick();
              onOpenArmory();
            }}
            className="bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 p-3.5 rounded-xl text-white font-heading font-semibold text-sm tracking-wide transition-all hover:border-neutral-700 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <span>TACTICAL ARMORY & 3D SKINS</span>
                <span className="text-[10px] text-neutral-400 font-mono block">
                  {currentWeapon.name} [{currentSkin.name}]
                </span>
              </div>
            </div>
          </button>

          {/* Character Customization */}
          <button
            onClick={() => {
              SoundEngine.playUiClick();
              onOpenCharacters();
            }}
            className="bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 p-3.5 rounded-xl text-white font-heading font-semibold text-sm tracking-wide transition-all hover:border-neutral-700 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-amber-400" />
              <div className="text-left">
                <span>OPERATOR ROSTER (12 SKINS)</span>
                <span className="text-[10px] text-neutral-400 font-mono block">Selected: {currentCharSkin.name}</span>
              </div>
            </div>
          </button>
        </div>

        {/* Right Side: Active Loadout Showcase Card */}
        <div className="w-full max-w-md bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-5 flex flex-col gap-4 shadow-2xl backdrop-blur-md">
          <div className="flex justify-between items-center pb-3 border-b border-neutral-800/80">
            <span className="text-xs font-mono uppercase font-bold text-neutral-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> ACTIVE LOADOUT INTEL
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-neutral-800 rounded text-neutral-300">
              READY FOR COMBAT
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl border border-white/10 flex items-center justify-center shadow-inner"
              style={{
                background: `linear-gradient(135deg, ${currentSkin.baseColor} 0%, ${currentSkin.accentColor} 100%)`,
              }}
            >
              <Shield className="w-7 h-7 text-white/90" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-white">{currentWeapon.name}</h3>
              <p className="text-xs font-mono text-amber-400">FINISH: {currentSkin.name}</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">{currentWeapon.description}</p>
            </div>
          </div>

          <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/60 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-neutral-500 uppercase text-[10px] block">OPERATOR</span>
              <span className="text-neutral-200 font-bold">{currentCharSkin.name}</span>
            </div>
            <div className="text-right">
              <span className="text-neutral-500 uppercase text-[10px] block">THEATER</span>
              <span className="text-amber-400 font-bold">{currentMap.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Information */}
      <div className="relative z-10 flex justify-between items-center text-xs font-mono text-neutral-500 border-t border-neutral-800/80 pt-4">
        <span>ULTIMATE STRIKE: ONLINE © 2026 // ALL RIGHTS RESERVED</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" /> NETWORK: ONLINE
          </span>
          <span>15 MAPS LOADED</span>
          <span>WEBSOCKET 20HZ</span>
        </div>
      </div>
    </div>
  );
};
