import React from 'react';
import { User, Award, Shield, Target, Flame, X } from 'lucide-react';

interface ProfileModalProps {
  playerName: string;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ playerName, onClose }) => {
  // Saved stats from localStorage or defaults
  const totalKills = 142;
  const totalDeaths = 68;
  const matchesWon = 18;
  const matchesPlayed = 24;
  const headshots = 48;
  const kdRatio = (totalKills / Math.max(1, totalDeaths)).toFixed(2);
  const winRate = Math.round((matchesWon / matchesPlayed) * 100);

  const medals = [
    { title: 'Deadeye Sniper', desc: 'Over 40 headshot eliminations', icon: <Target className="w-5 h-5 text-red-400" /> },
    { title: 'Area Dominator', desc: 'Secured 15 capture points', icon: <Flame className="w-5 h-5 text-amber-400" /> },
    { title: 'Apex Survivor', desc: 'Maintained a 2.0+ K/D ratio', icon: <Shield className="w-5 h-5 text-cyan-400" /> },
    { title: 'Master of Arms', desc: 'Customized 6 ballistic weapon platforms', icon: <Award className="w-5 h-5 text-purple-400" /> },
  ];

  return (
    <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-50">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 font-heading font-bold text-xl">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading text-xl font-bold text-white tracking-wide">{playerName}</h3>
              <span className="text-xs font-mono text-amber-400 uppercase">TIER 1 ELITE OPERATOR // LEVEL 24</span>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Combat Record Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80 text-center">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">KILL / DEATH</span>
            <p className="font-heading text-2xl font-bold text-amber-400 mt-0.5">{kdRatio}</p>
          </div>
          <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80 text-center">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">CONFIRMED KILLS</span>
            <p className="font-heading text-2xl font-bold text-white mt-0.5">{totalKills}</p>
          </div>
          <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80 text-center">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">WIN RATE</span>
            <p className="font-heading text-2xl font-bold text-emerald-400 mt-0.5">{winRate}%</p>
          </div>
          <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80 text-center">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">HEADSHOTS</span>
            <p className="font-heading text-xl font-bold text-red-400 mt-0.5">{headshots}</p>
          </div>
          <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80 text-center">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">VICTORIES</span>
            <p className="font-heading text-xl font-bold text-white mt-0.5">{matchesWon}</p>
          </div>
          <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80 text-center">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">MATCHES</span>
            <p className="font-heading text-xl font-bold text-neutral-300 mt-0.5">{matchesPlayed}</p>
          </div>
        </div>

        {/* Tactical Medals */}
        <div>
          <span className="text-xs font-mono text-neutral-400 uppercase block mb-2 font-bold">
            SERVICE COMMENDATIONS & MEDALS
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            {medals.map((m, i) => (
              <div key={i} className="bg-neutral-950/40 p-2.5 rounded-lg border border-neutral-800 flex items-center gap-3">
                <div className="p-2 bg-neutral-900 rounded-lg border border-neutral-800">{m.icon}</div>
                <div>
                  <h4 className="font-heading font-bold text-xs text-white">{m.title}</h4>
                  <p className="text-[10px] text-neutral-400 leading-tight mt-0.5">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg font-heading font-bold text-xs tracking-wider cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
