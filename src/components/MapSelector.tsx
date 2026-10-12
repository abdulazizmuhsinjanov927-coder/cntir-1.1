import React, { useState } from 'react';
import { MAPS } from '../data/gameData';
import { MapDef, GameMode } from '../types/game';
import { Compass, Users, Flag, Target, Shield, Check } from 'lucide-react';

interface MapSelectorProps {
  selectedMap: MapDef;
  selectedMode: GameMode;
  onSelectMap: (map: MapDef) => void;
  onSelectMode: (mode: GameMode) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export const MapSelector: React.FC<MapSelectorProps> = ({
  selectedMap,
  selectedMode,
  onSelectMap,
  onSelectMode,
  onConfirm,
  onBack,
}) => {
  const [filterTheme, setFilterTheme] = useState<string>('all');

  const modes: { id: GameMode; name: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'tdm', name: 'Team Deathmatch', icon: <Users className="w-4 h-4" />, desc: 'Red vs Blue combat to 30 kills' },
    { id: 'ffa', name: 'Free-For-All', icon: <Target className="w-4 h-4" />, desc: 'Solo deathmatch, every operator for themselves' },
    { id: 'point', name: 'Capture the Point', icon: <Flag className="w-4 h-4" />, desc: 'Hold the central beacon for territory points' },
    { id: 'practice', name: 'Practice Range', icon: <Shield className="w-4 h-4" />, desc: 'Solo combat against armed AI target dummies' },
  ];

  return (
    <div className="absolute inset-0 bg-neutral-950/95 backdrop-blur-xl z-30 flex flex-col p-6 overflow-hidden">
      {/* Top Header */}
      <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
        <div>
          <h2 className="font-heading text-2xl font-bold text-white tracking-wider flex items-center gap-2">
            <Compass className="w-6 h-6 text-amber-400" /> MISSION THEATERS (15 MAPS)
          </h2>
          <p className="text-neutral-400 text-xs">Select your operational battleground and match rule set</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-xs font-heading font-semibold text-neutral-300 transition-colors cursor-pointer"
          >
            BACK
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-heading font-bold text-sm tracking-wider rounded shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            DEPLOY TO THEATER
          </button>
        </div>
      </div>

      {/* Mode Selector Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
        {modes.map((m) => {
          const isSelected = selectedMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelectMode(m.id)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-heading font-bold text-sm flex items-center gap-2 text-white">
                  {m.icon} {m.name}
                </span>
                {isSelected && <Check className="w-4 h-4 text-amber-400" />}
              </div>
              <p className="text-[11px] text-neutral-400 leading-tight">{m.desc}</p>
            </button>
          );
        })}
      </div>

      {/* 15 Maps Grid */}
      <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 pb-6">
        {MAPS.map((map) => {
          const isSelected = selectedMap.id === map.id;
          return (
            <div
              key={map.id}
              onClick={() => onSelectMap(map)}
              className={`relative rounded-xl border p-3.5 cursor-pointer transition-all flex flex-col justify-between group overflow-hidden ${
                isSelected
                  ? 'bg-neutral-900 border-amber-500 ring-1 ring-amber-500 shadow-xl'
                  : 'bg-neutral-900/50 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/80'
              }`}
            >
              {/* Atmospheric Header Card */}
              <div
                className="h-20 w-full rounded-lg mb-2.5 relative overflow-hidden flex items-end p-2 border border-white/5"
                style={{
                  background: `linear-gradient(135deg, ${map.groundColor} 0%, ${map.skyColor} 100%)`,
                }}
              >
                <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[2px]" />
                <span className="relative z-10 text-[10px] font-mono uppercase bg-neutral-950/80 px-2 py-0.5 rounded text-amber-400 font-bold border border-neutral-800">
                  {map.theme}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-base text-white group-hover:text-amber-400 transition-colors">
                    {map.name}
                  </h3>
                  {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />}
                </div>
                <p className="text-amber-400/90 text-[11px] font-mono tracking-wide mt-0.5">{map.tagline}</p>
                <p className="text-neutral-400 text-xs mt-2 line-clamp-2 leading-relaxed">{map.description}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                <span>COVER: {map.obstacleCount} OBJECTS</span>
                <span className="text-neutral-400">ATMOS: {map.ambientLight > 0.6 ? 'SUNLIT' : 'TACTICAL DARK'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
