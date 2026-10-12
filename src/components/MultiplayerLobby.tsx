import React, { useEffect, useState } from 'react';
import { RoomInfo, GameMode, MapDef } from '../types/game';
import { MAPS } from '../data/gameData';
import { multiplayerClient } from '../network/MultiplayerClient';
import { SoundEngine } from '../audio/SoundEngine';
import { Users, Globe, Lock, Plus, Play, RefreshCw, Copy, Check, Shield } from 'lucide-react';

interface MultiplayerLobbyProps {
  playerName: string;
  onSetPlayerName: (name: string) => void;
  onRoomJoined: (room: RoomInfo) => void;
  onBack: () => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  playerName,
  onSetPlayerName,
  onRoomJoined,
  onBack,
}) => {
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [joinCode, setJoinCode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Room Creation Form State
  const [newRoomName, setNewRoomName] = useState<string>(`${playerName}'s Match`);
  const [selectedMapId, setSelectedMapId] = useState<string>(MAPS[0].id);
  const [selectedMode, setSelectedMode] = useState<GameMode>('tdm');
  const [maxPlayers, setMaxPlayers] = useState<number>(10);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [withBots, setWithBots] = useState<boolean>(true);
  const [team, setTeam] = useState<'red' | 'blue' | 'ffa'>('blue');

  const fetchRooms = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const list = await multiplayerClient.getRooms();
      setRooms(list);
    } catch {
      setErrorMsg('Failed to query online rooms.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  // Quick Play Matchmaking: finds first open room or spins up a fresh one
  const handleQuickPlay = async () => {
    setIsLoading(true);
    setErrorMsg('');
    SoundEngine.playUiClick();

    const available = rooms.find((r) => r.currentPlayers < r.maxPlayers);
    if (available) {
      const res = await multiplayerClient.joinRoom({
        roomId: available.id,
        playerName,
      });
      if (res.success && res.room) {
        onRoomJoined(res.room);
        return;
      }
    }

    // Otherwise create public match
    const res = await multiplayerClient.createRoom({
      name: `Strike Match #${Math.floor(100 + Math.random() * 900)}`,
      mapId: MAPS[Math.floor(Math.random() * MAPS.length)].id,
      mode: 'tdm',
      maxPlayers: 10,
      isPrivate: false,
      playerName,
      team: 'blue',
      withBots: true,
    });

    if (res.success && res.room) {
      onRoomJoined(res.room);
    } else {
      setErrorMsg(res.error || 'Failed to initialize match.');
      setIsLoading(false);
    }
  };

  // Join by direct Room Code
  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    setIsLoading(true);
    setErrorMsg('');
    SoundEngine.playUiClick();

    const formatted = joinCode.trim().toUpperCase();
    const res = await multiplayerClient.joinRoom({
      roomId: formatted,
      playerName,
    });

    if (res.success && res.room) {
      onRoomJoined(res.room);
    } else {
      setErrorMsg(res.error || 'Invalid Room Code. Ensure format matches STRIKE-XXXX.');
      setIsLoading(false);
    }
  };

  // Create Custom Room
  const handleCreateRoom = async () => {
    setIsLoading(true);
    setErrorMsg('');
    SoundEngine.playUiClick();

    const res = await multiplayerClient.createRoom({
      name: newRoomName || `${playerName}'s Match`,
      mapId: selectedMapId,
      mode: selectedMode,
      maxPlayers,
      isPrivate,
      playerName,
      team,
      withBots,
    });

    if (res.success && res.room) {
      onRoomJoined(res.room);
    } else {
      setErrorMsg(res.error || 'Could not provision room.');
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-neutral-950/95 backdrop-blur-xl z-30 flex flex-col p-6 overflow-hidden">
      {/* Top Header */}
      <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
        <div>
          <h2 className="font-heading text-2xl font-bold text-white tracking-wider flex items-center gap-2">
            <Globe className="w-6 h-6 text-amber-400" /> MULTIPLAYER HQ & LIVE SERVER BROWSER
          </h2>
          <p className="text-neutral-400 text-xs">Join public matchmaking, enter friend room codes, or host custom tactical ops</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Operator Call-Sign Input */}
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg">
            <span className="text-[10px] text-neutral-400 font-mono uppercase">OPERATOR:</span>
            <input
              type="text"
              value={playerName}
              onChange={(e) => onSetPlayerName(e.target.value)}
              maxLength={16}
              className="bg-transparent text-sm font-heading font-bold text-amber-400 focus:outline-none w-28"
            />
          </div>

          <button
            onClick={onBack}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-xs font-heading font-semibold text-neutral-300 transition-colors cursor-pointer"
          >
            BACK
          </button>
        </div>
      </div>

      {/* Action Bar: Quick Match, Create Match, Join with Code */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
        {/* Quick Play Banner */}
        <button
          onClick={handleQuickPlay}
          disabled={isLoading}
          className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 p-4 rounded-xl flex items-center justify-between text-neutral-950 font-heading font-bold shadow-lg transition-transform active:scale-98 cursor-pointer"
        >
          <div className="flex items-center gap-3 text-left">
            <Play className="w-8 h-8 fill-current" />
            <div>
              <span className="text-lg block tracking-wide">QUICK MATCH</span>
              <span className="text-xs font-mono font-medium opacity-90">Auto-matchmaking into lowest latency server</span>
            </div>
          </div>
        </button>

        {/* Create Room Button */}
        <button
          onClick={() => {
            setShowCreateModal(true);
            SoundEngine.playUiClick();
          }}
          className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 p-4 rounded-xl flex items-center justify-between text-white font-heading font-bold transition-colors cursor-pointer shadow-md"
        >
          <div className="flex items-center gap-3 text-left">
            <Plus className="w-8 h-8 text-amber-400" />
            <div>
              <span className="text-lg block tracking-wide">CREATE MATCH</span>
              <span className="text-xs font-mono text-neutral-400 font-normal">Pick map, mode, player count & bot fills</span>
            </div>
          </div>
        </button>

        {/* Join With Code */}
        <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl flex items-center gap-2">
          <input
            type="text"
            placeholder="STRIKE-XXXX"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            className="flex-1 bg-neutral-950 border border-neutral-800 px-3 py-2 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={handleJoinByCode}
            disabled={!joinCode.trim() || isLoading}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-heading font-bold text-xs rounded-lg transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
          >
            JOIN CODE
          </button>
        </div>
      </div>

      {/* Network Alert Messages */}
      {errorMsg && (
        <div className="mb-3 p-3 bg-red-950/80 border border-red-800 rounded-lg text-xs font-mono text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Server Browser List */}
      <div className="flex-1 bg-neutral-900/40 border border-neutral-800/80 rounded-xl flex flex-col overflow-hidden">
        <div className="p-3 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/60">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" /> ACTIVE DEPLOYMENT HUBS ({rooms.length})
          </span>
          <button
            onClick={fetchRooms}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> REFRESH
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60 p-2">
          {rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-neutral-500">
              <Globe className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs font-mono">No open lobbies discovered. Create a match to deploy!</p>
            </div>
          ) : (
            rooms.map((room) => {
              const mapDef = MAPS.find((m) => m.id === room.mapId) || MAPS[0];
              const isFull = room.currentPlayers >= room.maxPlayers;

              return (
                <div
                  key={room.id}
                  className="p-3.5 hover:bg-neutral-850/50 rounded-lg flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-neutral-950 px-2.5 py-1 rounded border border-neutral-800">
                      {room.id}
                    </span>
                    <div>
                      <h4 className="font-heading font-bold text-sm text-white flex items-center gap-2">
                        {room.name} {room.isPrivate && <Lock className="w-3.5 h-3.5 text-neutral-400" />}
                      </h4>
                      <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                        MAP: <span className="text-neutral-200">{mapDef.name}</span> • MODE: <span className="uppercase text-amber-400">{room.mode}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-neutral-300">
                      {room.currentPlayers} / {room.maxPlayers} PLAYERS
                    </span>
                    <button
                      onClick={async () => {
                        setIsLoading(true);
                        const res = await multiplayerClient.joinRoom({ roomId: room.id, playerName });
                        if (res.success && res.room) {
                          onRoomJoined(res.room);
                        } else {
                          setErrorMsg(res.error || 'Failed to join match.');
                          setIsLoading(false);
                        }
                      }}
                      disabled={isFull || isLoading}
                      className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-white font-heading font-bold text-xs rounded transition-colors cursor-pointer border border-neutral-700"
                    >
                      {isFull ? 'FULL' : 'DEPLOY'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Custom Match Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl max-w-lg w-full flex flex-col gap-4 shadow-2xl">
            <h3 className="font-heading text-xl font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" /> CREATE CUSTOM MULTIPLAYER MATCH
            </h3>

            {/* Room Name */}
            <div>
              <label className="text-xs font-mono text-neutral-400 uppercase block mb-1">Match Name</label>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 font-heading"
              />
            </div>

            {/* Map Selection */}
            <div>
              <label className="text-xs font-mono text-neutral-400 uppercase block mb-1">Map Theater (15 Maps)</label>
              <select
                value={selectedMapId}
                onChange={(e) => setSelectedMapId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
              >
                {MAPS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.theme}
                  </option>
                ))}
              </select>
            </div>

            {/* Game Mode */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'tdm', label: 'TDM' },
                { id: 'ffa', label: 'FFA' },
                { id: 'point', label: 'Capture Point' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMode(m.id as GameMode)}
                  className={`py-2 rounded-lg text-xs font-heading font-bold cursor-pointer border ${
                    selectedMode === m.id
                      ? 'bg-amber-500 text-neutral-950 border-amber-500'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Team Pick & Player Limit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-neutral-400 uppercase block mb-1">Squad Assignment</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTeam('blue')}
                    className={`py-1.5 rounded text-xs font-heading font-bold cursor-pointer border ${
                      team === 'blue'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    BLUE SQUAD
                  </button>
                  <button
                    onClick={() => setTeam('red')}
                    className={`py-1.5 rounded text-xs font-heading font-bold cursor-pointer border ${
                      team === 'red'
                        ? 'bg-red-600 text-white border-red-500'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    RED SQUAD
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-neutral-400 uppercase block mb-1">Max Operators</label>
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 10)}
                  className="w-full bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-lg text-sm text-white font-mono"
                />
              </div>
            </div>

            {/* Checkboxes: Private & Bots */}
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs font-mono text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={withBots}
                  onChange={(e) => setWithBots(e.target.checked)}
                  className="accent-amber-500"
                />
                Fill with AI Target Bots
              </label>
              <label className="flex items-center gap-2 text-xs font-mono text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="accent-amber-500"
                />
                Private Match (Friends Only)
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs font-heading font-semibold cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleCreateRoom}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded text-xs font-heading font-bold tracking-wider shadow-lg cursor-pointer"
              >
                DEPLOY SERVER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
