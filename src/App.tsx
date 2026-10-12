import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { WEAPONS, WEAPON_SKINS, CHARACTER_SKINS, MAPS } from './data/gameData';
import { WeaponDef, WeaponSkinDef, CharacterSkinDef, MapDef, GameMode, RoomInfo, PlayerState, KillfeedEntry } from './types/game';
import { multiplayerClient } from './network/MultiplayerClient';
import { SoundEngine } from './audio/SoundEngine';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { MapSelector } from './components/MapSelector';
import { Armory } from './components/Armory';
import { CharacterSelect } from './components/CharacterSelect';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { Scoreboard } from './components/Scoreboard';
import { SettingsModal, GameSettings } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import { Play, Home, Settings, RotateCcw } from 'lucide-react';

type ScreenType =
  | 'menu'
  | 'playing'
  | 'multiplayer'
  | 'maps'
  | 'armory'
  | 'characters'
  | 'profile'
  | 'settings'
  | 'paused';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Loadout & Settings State
  const [currentWeapon, setCurrentWeapon] = useState<WeaponDef>(WEAPONS[0]);
  const [currentSkin, setCurrentSkin] = useState<WeaponSkinDef>(WEAPON_SKINS[0]);
  const [currentCharSkin, setCurrentCharSkin] = useState<CharacterSkinDef>(CHARACTER_SKINS[0]);
  const [currentMap, setCurrentMap] = useState<MapDef>(MAPS[0]);
  const [selectedMode, setSelectedMode] = useState<GameMode>('tdm');
  const [playerName, setPlayerName] = useState<string>(
    () => `Operator_${Math.floor(100 + Math.random() * 900)}`
  );

  const [settings, setSettings] = useState<GameSettings>({
    mouseSensitivity: 0.0022,
    volume: 0.8,
    isMuted: false,
    fov: 75,
    crosshairColor: '#34d399',
    showMobileControls: window.innerWidth < 1024,
  });

  // UI Flow State
  const [activeScreen, setActiveScreen] = useState<ScreenType>('menu');
  const [showScoreboard, setShowScoreboard] = useState<boolean>(false);
  const [isMatchOver, setIsMatchOver] = useState<boolean>(false);

  // Combat HUD State
  const [ammo, setAmmo] = useState<number>(WEAPONS[0].magazineSize);
  const [reserveAmmo, setReserveAmmo] = useState<number>(WEAPONS[0].maxReserveAmmo);
  const [health, setHealth] = useState<number>(100);
  const [armor, setArmor] = useState<number>(50);
  const [isAiming, setIsAiming] = useState<boolean>(false);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [hitmarker, setHitmarker] = useState<{ active: boolean; isHeadshot: boolean }>({
    active: false,
    isHeadshot: false,
  });
  const [damageTaken, setDamageTaken] = useState<boolean>(false);

  // Multiplayer State
  const [currentRoom, setCurrentRoom] = useState<RoomInfo | null>(null);
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [killfeed, setKillfeed] = useState<KillfeedEntry[]>([]);

  // Initialize GameEngine
  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new GameEngine(canvasRef.current, currentMap);
    engineRef.current = engine;

    // Callbacks
    engine.onAmmoChange = (curr, res) => {
      setAmmo(curr);
      setReserveAmmo(res);
    };

    engine.onHealthChange = (hp, arm) => {
      setHealth(hp);
      setArmor(arm);
    };

    engine.onHit = (hitData) => {
      setHitmarker({ active: true, isHeadshot: hitData.isHeadshot });
      setTimeout(() => setHitmarker({ active: false, isHeadshot: false }), 220);

      // If in multiplayer room, inform server about damage
      if (currentRoom) {
        // Find closest enemy or target
        const targetPlayer = players.find((p) => p.isAlive && p.id !== multiplayerClient.playerId);
        if (targetPlayer) {
          multiplayerClient.sendHit(targetPlayer.id, hitData.damage, hitData.isHeadshot, currentWeapon.name);
        }
      }
    };

    engine.onShoot = (origin, dir) => {
      if (currentRoom) {
        multiplayerClient.sendShoot(origin, dir, currentWeapon.id);
      }
    };

    engine.onPlayerDeath = () => {
      SoundEngine.playDamage();
      setTimeout(() => {
        engine.respawn();
      }, 3000);
    };

    engine.start();

    return () => {
      engine.destroy();
    };
  }, []);

  // Update GameEngine whenever loadout changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.equipLoadout(currentWeapon, currentSkin, currentCharSkin);
      engineRef.current.playerController.mouseSensitivity = settings.mouseSensitivity;
    }
  }, [currentWeapon, currentSkin, currentCharSkin, settings.mouseSensitivity]);

  // Update map in GameEngine
  useEffect(() => {
    if (engineRef.current && engineRef.current.currentMapDef.id !== currentMap.id) {
      engineRef.current.loadMap(currentMap);
    }
  }, [currentMap]);

  // Pointer lock state listener
  useEffect(() => {
    const handlePointerLockChange = () => {
      if (!document.pointerLockElement) {
        if (activeScreen === 'playing') {
          setActiveScreen('paused');
        }
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [activeScreen]);

  // Tab key for scoreboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setShowScoreboard(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        setShowScoreboard(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Sync multiplayer network updates
  useEffect(() => {
    multiplayerClient.onSync = (data) => {
      setPlayers(data.players);
      if (currentRoom) {
        setCurrentRoom((prev) =>
          prev
            ? {
                ...prev,
                matchTimeRemaining: data.timeRemaining,
                redScore: data.redScore,
                blueScore: data.blueScore,
                pointOwner: data.pointOwner,
                pointProgress: data.pointProgress,
              }
            : null
        );

        if (data.timeRemaining <= 0) {
          setIsMatchOver(true);
        }
      }

      if (engineRef.current) {
        engineRef.current.updateRemotePlayers(data.players, multiplayerClient.playerId);
      }
    };

    multiplayerClient.onDamageTaken = (data) => {
      if (engineRef.current) {
        engineRef.current.takeDamage(data.damage);
      }
      setDamageTaken(true);
      setTimeout(() => setDamageTaken(false), 300);
    };

    multiplayerClient.onPlayerKilled = (data) => {
      setKillfeed((prev) => [data.killfeedEntry, ...prev.slice(0, 8)]);
      if (data.killerId === multiplayerClient.playerId) {
        SoundEngine.playKillSound();
      }
    };

    multiplayerClient.onPlayerRespawned = (data) => {
      if (data.playerId === multiplayerClient.playerId && engineRef.current) {
        engineRef.current.respawn();
      }
    };
  }, [currentRoom]);

  // 20Hz Client State Broadcast
  useEffect(() => {
    if (activeScreen !== 'playing') return;

    const interval = setInterval(() => {
      if (engineRef.current && currentRoom) {
        const ctrl = engineRef.current.playerController;
        multiplayerClient.sendPlayerUpdate({
          position: [ctrl.position.x, ctrl.position.y, ctrl.position.z],
          rotation: [ctrl.pitch, ctrl.yaw, 0],
          characterSkinId: currentCharSkin.id,
          weaponId: currentWeapon.id,
          weaponSkinId: currentSkin.id,
          isAiming: ctrl.isAiming,
          isSprinting: ctrl.isSprinting,
          isReloading: ctrl.isReloading,
          ping: multiplayerClient.ping,
        });

        setIsAiming(ctrl.isAiming);
        setIsReloading(ctrl.isReloading);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [activeScreen, currentRoom, currentWeapon, currentSkin, currentCharSkin]);

  // Request pointer lock to enter combat
  const resumeCombat = () => {
    setActiveScreen('playing');
    if (canvasRef.current) {
      canvasRef.current.requestPointerLock();
    }
  };

  // Launch Match from Main Menu
  const handleStartPlay = () => {
    // If not already in room, join quick public room or offline training
    if (!currentRoom) {
      multiplayerClient
        .createRoom({
          name: `${playerName}'s Strike Op`,
          mapId: currentMap.id,
          mode: selectedMode,
          maxPlayers: 10,
          isPrivate: false,
          playerName,
          team: 'blue',
          withBots: true,
        })
        .then((res) => {
          if (res.success && res.room) {
            setCurrentRoom(res.room);
          }
          resumeCombat();
        });
    } else {
      resumeCombat();
    }
  };

  const handleRoomJoined = (room: RoomInfo) => {
    setCurrentRoom(room);
    const targetMap = MAPS.find((m) => m.id === room.mapId) || MAPS[0];
    setCurrentMap(targetMap);
    setSelectedMode(room.mode);
    resumeCombat();
  };

  const handleLeaveMatch = () => {
    multiplayerClient.leaveRoom();
    setCurrentRoom(null);
    setIsMatchOver(false);
    setActiveScreen('menu');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-tactical">
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onClick={() => {
          if (activeScreen === 'playing') {
            canvasRef.current?.requestPointerLock();
          }
        }}
        className="w-full h-full block cursor-crosshair"
      />

      {/* In-Game HUD (Visible during gameplay or pause) */}
      {(activeScreen === 'playing' || activeScreen === 'paused') && (
        <HUD
          weapon={currentWeapon}
          ammo={ammo}
          reserveAmmo={reserveAmmo}
          health={health}
          armor={armor}
          isAiming={isAiming}
          isReloading={isReloading}
          killfeed={killfeed}
          roomInfo={currentRoom}
          hitmarker={hitmarker}
          damageTaken={damageTaken}
          onMobileInput={(inputs) => {
            if (engineRef.current) {
              Object.assign(engineRef.current.playerController.mobileInputs, inputs);
              if (inputs.isShooting) engineRef.current.triggerShoot();
              if (inputs.isReloading) engineRef.current.reload();
            }
          }}
          onPause={() => {
            document.exitPointerLock?.();
            setActiveScreen('paused');
          }}
          showMobileControls={settings.showMobileControls}
        />
      )}

      {/* Main Menu */}
      {activeScreen === 'menu' && (
        <MainMenu
          playerName={playerName}
          currentWeapon={currentWeapon}
          currentSkin={currentSkin}
          currentCharSkin={currentCharSkin}
          currentMap={currentMap}
          isMuted={settings.isMuted}
          onToggleMute={() => {
            const next = !settings.isMuted;
            setSettings((s) => ({ ...s, isMuted: next }));
            SoundEngine.setMuted(next);
          }}
          onPlay={handleStartPlay}
          onOpenMultiplayer={() => setActiveScreen('multiplayer')}
          onOpenMaps={() => setActiveScreen('maps')}
          onOpenArmory={() => setActiveScreen('armory')}
          onOpenCharacters={() => setActiveScreen('characters')}
          onOpenProfile={() => setActiveScreen('profile')}
          onOpenSettings={() => setActiveScreen('settings')}
        />
      )}

      {/* 15 Maps Selector */}
      {activeScreen === 'maps' && (
        <MapSelector
          selectedMap={currentMap}
          selectedMode={selectedMode}
          onSelectMap={(map) => setCurrentMap(map)}
          onSelectMode={(mode) => setSelectedMode(mode)}
          onConfirm={() => {
            setActiveScreen('menu');
            handleStartPlay();
          }}
          onBack={() => setActiveScreen('menu')}
        />
      )}

      {/* Armory & 20+ Skins */}
      {activeScreen === 'armory' && (
        <Armory
          currentWeapon={currentWeapon}
          currentSkin={currentSkin}
          onEquip={(w, s) => {
            setCurrentWeapon(w);
            setCurrentSkin(s);
          }}
          onBack={() => setActiveScreen('menu')}
        />
      )}

      {/* Operator Roster (12 Skins) */}
      {activeScreen === 'characters' && (
        <CharacterSelect
          currentSkin={currentCharSkin}
          onEquip={(skin) => setCurrentCharSkin(skin)}
          onBack={() => setActiveScreen('menu')}
        />
      )}

      {/* Multiplayer & Friends Hub */}
      {activeScreen === 'multiplayer' && (
        <MultiplayerLobby
          playerName={playerName}
          onSetPlayerName={setPlayerName}
          onRoomJoined={handleRoomJoined}
          onBack={() => setActiveScreen('menu')}
        />
      )}

      {/* Tactical Settings Modal */}
      {activeScreen === 'settings' && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings((s) => ({ ...s, ...newSettings }))}
          onClose={() => setActiveScreen('menu')}
        />
      )}

      {/* Operator Profile Modal */}
      {activeScreen === 'profile' && (
        <ProfileModal playerName={playerName} onClose={() => setActiveScreen('menu')} />
      )}

      {/* Pause Menu Modal (when user presses Escape during match) */}
      {activeScreen === 'paused' && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-3 text-center">
            <h3 className="font-heading text-2xl font-bold text-white tracking-wider mb-2">
              TACTICAL PAUSE
            </h3>

            <button
              onClick={resumeCombat}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-heading font-bold text-sm tracking-wider rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" /> RESUME COMBAT
            </button>

            <button
              onClick={() => setShowScoreboard(true)}
              className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-heading font-bold text-xs tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              MISSION SCOREBOARD
            </button>

            <button
              onClick={() => setActiveScreen('settings')}
              className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-heading font-bold text-xs tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" /> SETTINGS & SENSITIVITY
            </button>

            <button
              onClick={handleLeaveMatch}
              className="w-full py-2.5 bg-red-950/60 hover:bg-red-900/60 border border-red-800/60 text-red-300 font-heading font-bold text-xs tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <Home className="w-4 h-4" /> ABORT TO MAIN LOBBY
            </button>
          </div>
        </div>
      )}

      {/* Live Tab Scoreboard or End Match Screen */}
      {(showScoreboard || isMatchOver) && (
        <Scoreboard
          players={players}
          roomInfo={currentRoom}
          localPlayerId={multiplayerClient.playerId}
          isMatchOver={isMatchOver}
          onClose={() => setShowScoreboard(false)}
          onRematch={() => {
            setIsMatchOver(false);
            if (engineRef.current) engineRef.current.respawn();
            resumeCombat();
          }}
          onLeaveMatch={handleLeaveMatch}
        />
      )}
    </div>
  );
}
