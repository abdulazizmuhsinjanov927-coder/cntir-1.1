import React from 'react';
import { SoundEngine } from '../audio/SoundEngine';
import { Settings as SettingsIcon, Volume2, VolumeX, Eye, MousePointer, Smartphone, X } from 'lucide-react';

export interface GameSettings {
  mouseSensitivity: number;
  volume: number;
  isMuted: boolean;
  fov: number;
  crosshairColor: string;
  showMobileControls: boolean;
}

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-50">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
          <h3 className="font-heading text-xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-amber-400" /> TACTICAL SETTINGS & CONTROLS
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-2">
          {/* Mouse Sensitivity */}
          <div className="bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800/80">
            <div className="flex justify-between items-center mb-2">
              <span className="font-heading text-xs font-bold text-white flex items-center gap-2">
                <MousePointer className="w-4 h-4 text-amber-400" /> MOUSE AIM SENSITIVITY
              </span>
              <span className="text-xs font-mono text-amber-400">
                {(settings.mouseSensitivity * 1000).toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0.001"
              max="0.006"
              step="0.0002"
              value={settings.mouseSensitivity}
              onChange={(e) => onUpdateSettings({ mouseSensitivity: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Audio Master Volume */}
          <div className="bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800/80">
            <div className="flex justify-between items-center mb-2">
              <span className="font-heading text-xs font-bold text-white flex items-center gap-2">
                {settings.isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
                MASTER AUDIO VOLUME
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const next = !settings.isMuted;
                    onUpdateSettings({ isMuted: next });
                    SoundEngine.setMuted(next);
                  }}
                  className="text-[10px] font-mono px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded cursor-pointer"
                >
                  {settings.isMuted ? 'UNMUTE' : 'MUTE'}
                </button>
                <span className="text-xs font-mono text-amber-400">{Math.round(settings.volume * 100)}%</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                onUpdateSettings({ volume: vol });
                SoundEngine.setVolume(vol);
              }}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Field of View (FOV) */}
          <div className="bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800/80">
            <div className="flex justify-between items-center mb-2">
              <span className="font-heading text-xs font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" /> FIELD OF VIEW (FOV)
              </span>
              <span className="text-xs font-mono text-amber-400">{settings.fov}°</span>
            </div>
            <input
              type="range"
              min="65"
              max="95"
              step="1"
              value={settings.fov}
              onChange={(e) => onUpdateSettings({ fov: parseInt(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Touch Controls Toggle */}
          <div className="bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800/80 flex items-center justify-between">
            <span className="font-heading text-xs font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400" /> TOUCH SCREEN VIRTUAL CONTROLS
            </span>
            <input
              type="checkbox"
              checked={settings.showMobileControls}
              onChange={(e) => onUpdateSettings({ showMobileControls: e.target.checked })}
              className="accent-amber-500 w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Controls Cheat-Sheet */}
          <div className="bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-800 text-xs font-mono text-neutral-400">
            <span className="text-white font-bold block mb-2 font-heading">TACTICAL CONTROLS QUICK REFERENCE:</span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div><strong className="text-neutral-200">W, A, S, D</strong> : Move</div>
              <div><strong className="text-neutral-200">Mouse</strong> : Look Around</div>
              <div><strong className="text-neutral-200">Left Click</strong> : Shoot</div>
              <div><strong className="text-neutral-200">Right Click</strong> : Aim Down Sights</div>
              <div><strong className="text-neutral-200">R</strong> : Reload</div>
              <div><strong className="text-neutral-200">Space</strong> : Jump</div>
              <div><strong className="text-neutral-200">Shift</strong> : Sprint</div>
              <div><strong className="text-neutral-200">C</strong> : Crouch</div>
              <div><strong className="text-neutral-200">1 - 6</strong> : Switch Weapon</div>
              <div><strong className="text-neutral-200">Escape</strong> : Menu / Pause</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg font-heading font-bold text-xs tracking-wider cursor-pointer"
          >
            CONFIRM & RETURN
          </button>
        </div>
      </div>
    </div>
  );
};
