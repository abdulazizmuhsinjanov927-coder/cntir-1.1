import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { GameMode, PlayerState, RoomInfo, KillfeedEntry } from './src/types/game.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ServerRoom {
  info: RoomInfo;
  players: Map<string, PlayerState>;
  killfeed: KillfeedEntry[];
}

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
  pingTimeout: 10000,
  pingInterval: 5000,
});

const rooms = new Map<string, ServerRoom>();

// Generate short room code like 'STRIKE-8492'
function generateRoomCode(): string {
  const code = Math.floor(1000 + Math.random() * 9000);
  return `STRIKE-${code}`;
}

// Default initial rooms for instant public quick-play
function createDefaultRooms() {
  const defaultMaps = ['map_modern_city', 'map_desert_base', 'map_night_city', 'map_snow_mountain'];
  defaultMaps.forEach((mapId, idx) => {
    const roomId = `STRIKE-${1000 + idx * 111}`;
    const room: ServerRoom = {
      info: {
        id: roomId,
        name: `Public Alpha #${idx + 1}`,
        mapId,
        mode: idx % 2 === 0 ? 'tdm' : 'ffa',
        maxPlayers: 10,
        currentPlayers: 0,
        isPrivate: false,
        hostId: 'system',
        state: 'in_progress',
        matchTimeRemaining: 600,
        redScore: 0,
        blueScore: 0,
        pointOwner: 'neutral',
        pointProgress: 0,
      },
      players: new Map(),
      killfeed: [],
    };
    rooms.set(roomId, room);
  });
}
createDefaultRooms();

// Socket.IO event handling
io.on('connection', (socket: Socket) => {
  let currentRoomId: string | null = null;
  let playerId: string = socket.id;

  // 1. Get Room List
  socket.on('get_rooms', (callback: (roomList: RoomInfo[]) => void) => {
    const list: RoomInfo[] = [];
    rooms.forEach((r) => {
      if (!r.info.isPrivate) {
        list.push({ ...r.info, currentPlayers: r.players.size });
      }
    });
    if (typeof callback === 'function') {
      callback(list);
    }
  });

  // 2. Create Room
  socket.on(
    'create_room',
    (
      payload: {
        name: string;
        mapId: string;
        mode: GameMode;
        maxPlayers: number;
        isPrivate: boolean;
        playerName: string;
        team: 'red' | 'blue' | 'ffa';
        withBots?: boolean;
      },
      callback: (res: { success: boolean; roomId?: string; room?: RoomInfo; error?: string }) => void
    ) => {
      const roomId = generateRoomCode();
      const newRoom: ServerRoom = {
        info: {
          id: roomId,
          name: payload.name || `Room ${roomId}`,
          mapId: payload.mapId || 'map_modern_city',
          mode: payload.mode || 'tdm',
          maxPlayers: payload.maxPlayers || 10,
          currentPlayers: 1,
          isPrivate: payload.isPrivate || false,
          hostId: playerId,
          state: 'in_progress',
          matchTimeRemaining: 600,
          redScore: 0,
          blueScore: 0,
          pointOwner: 'neutral',
          pointProgress: 0,
        },
        players: new Map(),
        killfeed: [],
      };

      // Add Host Player
      const hostPlayer: PlayerState = {
        id: playerId,
        name: payload.playerName || 'Operator',
        team: payload.team || (payload.mode === 'ffa' ? 'ffa' : 'blue'),
        characterSkinId: 'soldier_tactical',
        weaponId: 'ak47',
        weaponSkinId: 'matte_black',
        position: [-40, 1.7, -40],
        rotation: [0, 0, 0],
        health: 100,
        maxHealth: 100,
        armor: 50,
        isAlive: true,
        isShooting: false,
        isReloading: false,
        isSprinting: false,
        isCrouching: false,
        isAiming: false,
        stats: { kills: 0, deaths: 0, assists: 0, score: 0, headshots: 0 },
        ping: 25,
      };

      newRoom.players.set(playerId, hostPlayer);

      // Add 3 AI Practice Bots if requested or practice mode
      if (payload.withBots || payload.mode === 'practice') {
        const botNames = ['Ghost_Viper', 'Shadow_Recon', 'Iron_Vanguard'];
        botNames.forEach((bName, bIdx) => {
          const botId = `bot_${roomId}_${bIdx}`;
          const botPlayer: PlayerState = {
            id: botId,
            name: `[BOT] ${bName}`,
            team: payload.team === 'blue' ? 'red' : 'blue',
            characterSkinId: 'urban_specops',
            weaponId: bIdx === 0 ? 'ak47' : bIdx === 1 ? 'mp5' : 'spas12',
            weaponSkinId: 'red_black',
            position: [25 + bIdx * 8, 1.7, 25 - bIdx * 8],
            rotation: [0, Math.PI, 0],
            health: 100,
            maxHealth: 100,
            armor: 50,
            isAlive: true,
            isShooting: false,
            isReloading: false,
            isSprinting: false,
            isCrouching: false,
            isAiming: false,
            stats: { kills: 0, deaths: 0, assists: 0, score: 0, headshots: 0 },
            ping: 5,
            isBot: true,
          };
          newRoom.players.set(botId, botPlayer);
        });
      }

      rooms.set(roomId, newRoom);
      currentRoomId = roomId;
      socket.join(roomId);

      if (typeof callback === 'function') {
        callback({ success: true, roomId, room: newRoom.info });
      }
    }
  );

  // 3. Join Room
  socket.on(
    'join_room',
    (
      payload: { roomId: string; playerName: string; team?: 'red' | 'blue' | 'ffa' },
      callback: (res: { success: boolean; room?: RoomInfo; players?: PlayerState[]; error?: string }) => void
    ) => {
      const room = rooms.get(payload.roomId);
      if (!room) {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Room not found. Check code.' });
        }
        return;
      }

      if (room.players.size >= room.info.maxPlayers) {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Room is full.' });
        }
        return;
      }

      currentRoomId = payload.roomId;
      socket.join(payload.roomId);

      const assignedTeam = payload.team || (room.info.mode === 'ffa' ? 'ffa' : room.players.size % 2 === 0 ? 'blue' : 'red');
      const newPlayer: PlayerState = {
        id: playerId,
        name: payload.playerName || `Player_${playerId.slice(0, 4)}`,
        team: assignedTeam,
        characterSkinId: 'soldier_tactical',
        weaponId: 'ak47',
        weaponSkinId: 'matte_black',
        position: assignedTeam === 'blue' ? [40, 1.7, 40] : [-40, 1.7, -40],
        rotation: [0, 0, 0],
        health: 100,
        maxHealth: 100,
        armor: 50,
        isAlive: true,
        isShooting: false,
        isReloading: false,
        isSprinting: false,
        isCrouching: false,
        isAiming: false,
        stats: { kills: 0, deaths: 0, assists: 0, score: 0, headshots: 0 },
        ping: 30,
      };

      room.players.set(playerId, newPlayer);
      room.info.currentPlayers = room.players.size;

      // Broadcast to room that new player joined
      io.to(payload.roomId).emit('player_joined', newPlayer);

      if (typeof callback === 'function') {
        callback({
          success: true,
          room: room.info,
          players: Array.from(room.players.values()),
        });
      }
    }
  );

  // 4. Player Update (Position, Rotation, State)
  socket.on('player_update', (update: Partial<PlayerState>) => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const p = room.players.get(playerId);
    if (p) {
      if (update.position) p.position = update.position;
      if (update.rotation) p.rotation = update.rotation;
      if (update.characterSkinId) p.characterSkinId = update.characterSkinId;
      if (update.weaponId) p.weaponId = update.weaponId;
      if (update.weaponSkinId) p.weaponSkinId = update.weaponSkinId;
      if (update.isShooting !== undefined) p.isShooting = update.isShooting;
      if (update.isReloading !== undefined) p.isReloading = update.isReloading;
      if (update.isSprinting !== undefined) p.isSprinting = update.isSprinting;
      if (update.isAiming !== undefined) p.isAiming = update.isAiming;
      if (update.ping !== undefined) p.ping = update.ping;
    }
  });

  // 5. Player Shoot Event (broadcast tracer origin & direction)
  socket.on(
    'player_shoot',
    (payload: { origin: [number, number, number]; direction: [number, number, number]; weaponId: string }) => {
      if (!currentRoomId) return;
      socket.to(currentRoomId).emit('remote_shoot', {
        playerId,
        origin: payload.origin,
        direction: payload.direction,
        weaponId: payload.weaponId,
      });
    }
  );

  // 6. Player Hit Event (authoritative health deduction and kill scoring)
  socket.on(
    'player_hit',
    (payload: { victimId: string; damage: number; isHeadshot: boolean; weaponName: string }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const attacker = room.players.get(playerId);
      const victim = room.players.get(payload.victimId);
      if (!attacker || !victim || !victim.isAlive) return;

      victim.health = Math.max(0, victim.health - payload.damage);

      // Notify victim about incoming damage
      io.to(victim.id).emit('damage_taken', {
        attackerId: playerId,
        damage: payload.damage,
        currentHealth: victim.health,
      });

      // If victim was killed
      if (victim.health <= 0) {
        victim.isAlive = false;
        attacker.stats.kills += 1;
        attacker.stats.score += payload.isHeadshot ? 150 : 100;
        if (payload.isHeadshot) attacker.stats.headshots += 1;
        victim.stats.deaths += 1;

        if (attacker.team === 'red') room.info.redScore += 1;
        else if (attacker.team === 'blue') room.info.blueScore += 1;

        const killEntry: KillfeedEntry = {
          id: `kf_${Date.now()}_${Math.random()}`,
          killerName: attacker.name,
          killerTeam: attacker.team,
          victimName: victim.name,
          victimTeam: victim.team,
          weaponName: payload.weaponName || 'Weapon',
          isHeadshot: payload.isHeadshot,
          timestamp: Date.now(),
        };

        room.killfeed.unshift(killEntry);
        if (room.killfeed.length > 8) room.killfeed.pop();

        io.to(currentRoomId).emit('player_killed', {
          killerId: playerId,
          victimId: victim.id,
          killfeedEntry: killEntry,
          roomScores: { red: room.info.redScore, blue: room.info.blueScore },
        });

        // Auto respawn after 3 seconds
        setTimeout(() => {
          if (room.players.has(victim.id)) {
            victim.health = 100;
            victim.armor = 50;
            victim.isAlive = true;
            const respawnPos: [number, number, number] =
              victim.team === 'blue' ? [40, 1.7, 40] : [-40, 1.7, -40];
            victim.position = respawnPos;
            io.to(currentRoomId!).emit('player_respawned', {
              playerId: victim.id,
              position: respawnPos,
            });
          }
        }, 3000);
      }
    }
  );

  // 7. Leave / Disconnect
  const handleLeave = () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (room) {
      room.players.delete(playerId);
      room.info.currentPlayers = room.players.size;
      io.to(currentRoomId).emit('player_left', { playerId });

      // Clean up empty non-default rooms
      if (room.players.size === 0 && !currentRoomId.startsWith('STRIKE-1')) {
        rooms.delete(currentRoomId);
      }
    }
    currentRoomId = null;
  };

  socket.on('leave_room', handleLeave);
  socket.on('disconnect', handleLeave);
});

// Periodic 20Hz Room State Broadcast & Bot AI logic
setInterval(() => {
  rooms.forEach((room, roomId) => {
    // 1. Bot AI updates (patrol, aim, and simulate)
    room.players.forEach((p) => {
      if (p.isBot && p.isAlive) {
        // Move towards center or random patrol
        const time = Date.now() * 0.001;
        const radius = 15;
        p.position[0] = Math.sin(time * 0.5 + parseFloat(p.id.slice(-1))) * radius;
        p.position[2] = Math.cos(time * 0.5 + parseFloat(p.id.slice(-1))) * radius;
        p.rotation[1] = Math.atan2(-p.position[0], -p.position[2]);
      }
    });

    // 2. Broadcast players snapshot to everyone in this room
    if (room.players.size > 0) {
      io.to(roomId).emit('room_sync', {
        players: Array.from(room.players.values()),
        timeRemaining: room.info.matchTimeRemaining,
        redScore: room.info.redScore,
        blueScore: room.info.blueScore,
        pointOwner: room.info.pointOwner,
        pointProgress: room.info.pointProgress,
      });
    }
  });
}, 50); // 20 times per second

// 1-Second Match Timer & Capture Point logic
setInterval(() => {
  rooms.forEach((room) => {
    if (room.info.state === 'in_progress' && room.players.size > 0) {
      if (room.info.matchTimeRemaining > 0) {
        room.info.matchTimeRemaining--;
      }

      // Capture the Point logic
      if (room.info.mode === 'point') {
        let redInPoint = 0;
        let blueInPoint = 0;

        room.players.forEach((p) => {
          if (p.isAlive) {
            const dist = Math.hypot(p.position[0], p.position[2]);
            if (dist <= 6) {
              if (p.team === 'red') redInPoint++;
              if (p.team === 'blue') blueInPoint++;
            }
          }
        });

        if (redInPoint > blueInPoint) {
          if (room.info.pointOwner !== 'red') {
            room.info.pointProgress = Math.min(100, room.info.pointProgress + 10);
            if (room.info.pointProgress >= 100) {
              room.info.pointOwner = 'red';
              room.info.redScore += 1;
            }
          } else {
            room.info.redScore += 1;
          }
        } else if (blueInPoint > redInPoint) {
          if (room.info.pointOwner !== 'blue') {
            room.info.pointProgress = Math.min(100, room.info.pointProgress + 10);
            if (room.info.pointProgress >= 100) {
              room.info.pointOwner = 'blue';
              room.info.blueScore += 1;
            }
          } else {
            room.info.blueScore += 1;
          }
        }
      }
    }
  });
}, 1000);

// Setup Express + Vite in Dev or Static in Production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`ULTIMATE STRIKE: ONLINE server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
