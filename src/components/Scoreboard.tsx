import React from 'react';
import { PlayerState, RoomInfo } from '../types/game';
import { Trophy, Award, RotateCcw, Home, Crosshair } from 'lucide-react';

interface ScoreboardProps {
  players: PlayerState[];
  roomInfo: RoomInfo | null;
  localPlayerId: string;
  isMatchOver: boolean;
  onRematch?: () => void;
  onLeaveMatch?: () => void;
  onClose?: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  players,
  roomInfo,
  localPlayerId,
  isMatchOver,
  onRematch,
  onLeaveMatch,
  onClose,
}) => {
  const redPlayers = players.filter((p) => p.team === 'red');
  const bluePlayers = players.filter((p) => p.team === 'blue');
  const ffaPlayers = [...players].sort((a, b) => b.stats.score - a.stats.score);

  const localPlayer = players.find((p) => p.id === localPlayerId);
  const redWon = (roomInfo?.redScore ?? 0) > (roomInfo?.blueScore ?? 0);
  const isWinner = localPlayer?.team === (redWon ? 'red' : 'blue');

  // Find Match MVP
  const mvpPlayer = ffaPlayers[0];

  return (
    <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-40">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl flex flex-col gap-6">
        {/* Header / Match End Banner */}
        {isMatchOver ? (
          <div className="flex flex-col items-center justify-center text-center pb-4 border-b border-neutral-800">
            <Trophy className={`w-12 h-12 mb-2 ${isWinner ? 'text-amber-400' : 'text-neutral-500'}`} />
            <h2
              className={`font-heading text-4xl font-bold tracking-wider ${
                isWinner ? 'text-amber-400' : 'text-neutral-300'
              }`}
            >
              {isWinner ? 'VICTORY SECURED' : 'DEFEAT'}
            </h2>
            <p className="text-neutral-400 font-mono text-xs mt-1">
              FINAL SCORE: RED {roomInfo?.redScore ?? 0} — BLUE {roomInfo?.blueScore ?? 0}
            </p>
            {mvpPlayer && (
              <div className="mt-3 flex items-center gap-2 bg-neutral-950/80 border border-amber-500/40 px-4 py-1.5 rounded-full text-xs font-mono text-amber-300">
                <Award className="w-4 h-4 text-amber-400" /> MATCH MVP: {mvpPlayer.name} ({mvpPlayer.stats.kills} KILLS / {mvpPlayer.stats.score} PTS)
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
            <div>
              <h3 className="font-heading text-xl font-bold text-white tracking-wide">COMBAT ENGAGEMENT REPORT</h3>
              <p className="text-neutral-400 text-xs font-mono">
                ROOM: {roomInfo?.id} • MAP: {roomInfo?.mapId.replace('map_', '').replace('_', ' ').toUpperCase()}
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs font-heading font-semibold text-neutral-300 rounded cursor-pointer"
              >
                CLOSE [TAB]
              </button>
            )}
          </div>
        )}

        {/* Score Tables */}
        {roomInfo?.mode === 'ffa' ? (
          /* Single FFA Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-950/60 text-neutral-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-2.5">OPERATOR</th>
                  <th className="p-2.5">KILLS</th>
                  <th className="p-2.5">DEATHS</th>
                  <th className="p-2.5">K/D</th>
                  <th className="p-2.5">HEADSHOTS</th>
                  <th className="p-2.5">SCORE</th>
                  <th className="p-2.5">PING</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {ffaPlayers.map((p) => {
                  const isMe = p.id === localPlayerId;
                  const kd = (p.stats.kills / Math.max(1, p.stats.deaths)).toFixed(2);
                  return (
                    <tr key={p.id} className={isMe ? 'bg-amber-500/10 text-white font-bold' : 'text-neutral-300'}>
                      <td className="p-2.5 flex items-center gap-2">
                        {p.name} {isMe && <span className="text-[10px] text-amber-400 font-mono">(YOU)</span>}
                      </td>
                      <td className="p-2.5 text-amber-400 font-bold">{p.stats.kills}</td>
                      <td className="p-2.5 text-neutral-400">{p.stats.deaths}</td>
                      <td className="p-2.5">{kd}</td>
                      <td className="p-2.5 text-red-400">{p.stats.headshots}</td>
                      <td className="p-2.5 font-bold text-white">{p.stats.score}</td>
                      <td className="p-2.5 text-neutral-500">{p.ping}ms</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Red Team vs Blue Team Dual Columns */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Blue Squad */}
            <div className="bg-neutral-950/40 border border-blue-900/40 rounded-xl overflow-hidden">
              <div className="p-2.5 bg-blue-950/60 border-b border-blue-900/60 flex justify-between items-center">
                <span className="font-heading font-bold text-xs text-blue-400 uppercase tracking-wider">
                  BLUE SQUAD ({roomInfo?.blueScore ?? 0} PTS)
                </span>
                <span className="text-[10px] font-mono text-neutral-400">{bluePlayers.length} OPERATORS</span>
              </div>
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-neutral-500 text-[10px]">
                  <tr>
                    <th className="p-2">OPERATOR</th>
                    <th className="p-2">K</th>
                    <th className="p-2">D</th>
                    <th className="p-2">SCORE</th>
                    <th className="p-2">PING</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/40">
                  {bluePlayers.map((p) => (
                    <tr
                      key={p.id}
                      className={p.id === localPlayerId ? 'bg-blue-600/20 text-white font-bold' : 'text-neutral-300'}
                    >
                      <td className="p-2 truncate max-w-[120px]">{p.name}</td>
                      <td className="p-2 text-blue-400 font-bold">{p.stats.kills}</td>
                      <td className="p-2 text-neutral-400">{p.stats.deaths}</td>
                      <td className="p-2 font-bold">{p.stats.score}</td>
                      <td className="p-2 text-neutral-500">{p.ping}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Red Squad */}
            <div className="bg-neutral-950/40 border border-red-900/40 rounded-xl overflow-hidden">
              <div className="p-2.5 bg-red-950/60 border-b border-red-900/60 flex justify-between items-center">
                <span className="font-heading font-bold text-xs text-red-400 uppercase tracking-wider">
                  RED SQUAD ({roomInfo?.redScore ?? 0} PTS)
                </span>
                <span className="text-[10px] font-mono text-neutral-400">{redPlayers.length} OPERATORS</span>
              </div>
              <table className="w-full text-left text-xs font-mono">
                <thead className="text-neutral-500 text-[10px]">
                  <tr>
                    <th className="p-2">OPERATOR</th>
                    <th className="p-2">K</th>
                    <th className="p-2">D</th>
                    <th className="p-2">SCORE</th>
                    <th className="p-2">PING</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/40">
                  {redPlayers.map((p) => (
                    <tr
                      key={p.id}
                      className={p.id === localPlayerId ? 'bg-red-600/20 text-white font-bold' : 'text-neutral-300'}
                    >
                      <td className="p-2 truncate max-w-[120px]">{p.name}</td>
                      <td className="p-2 text-red-400 font-bold">{p.stats.kills}</td>
                      <td className="p-2 text-neutral-400">{p.stats.deaths}</td>
                      <td className="p-2 font-bold">{p.stats.score}</td>
                      <td className="p-2 text-neutral-500">{p.ping}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Actions (If match ended or pause menu) */}
        {isMatchOver && (
          <div className="flex justify-center items-center gap-4 pt-2 border-t border-neutral-800">
            {onLeaveMatch && (
              <button
                onClick={onLeaveMatch}
                className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg font-heading font-bold text-xs tracking-wider flex items-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" /> MAIN LOBBY
              </button>
            )}
            {onRematch && (
              <button
                onClick={onRematch}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg font-heading font-bold text-xs tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> PLAY AGAIN / REMATCH
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
