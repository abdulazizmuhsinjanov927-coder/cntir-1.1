import { io, Socket } from 'socket.io-client';
import { PlayerState, RoomInfo, GameMode, KillfeedEntry } from '../types/game';

export interface RoomSyncPayload {
  players: PlayerState[];
  timeRemaining: number;
  redScore: number;
  blueScore: number;
  pointOwner: 'neutral' | 'red' | 'blue';
  pointProgress: number;
}

export class MultiplayerClient {
  private socket: Socket | null = null;
  public isConnected: boolean = false;
  public playerId: string = '';
  public ping: number = 20;

  // Event Callbacks
  public onSync: (data: RoomSyncPayload) => void = () => {};
  public onRemoteShoot: (data: { playerId: string; origin: [number, number, number]; direction: [number, number, number]; weaponId: string }) => void = () => {};
  public onDamageTaken: (data: { attackerId: string; damage: number; currentHealth: number }) => void = () => {};
  public onPlayerKilled: (data: { killerId: string; victimId: string; killfeedEntry: KillfeedEntry; roomScores: { red: number; blue: number } }) => void = () => {};
  public onPlayerRespawned: (data: { playerId: string; position: [number, number, number] }) => void = () => {};
  public onConnectionChange: (connected: boolean) => void = () => {};

  constructor() {
    this.connect();
  }

  public connect() {
    if (this.socket) return;

    // Connect to current origin
    this.socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.playerId = this.socket?.id || '';
      this.onConnectionChange(true);
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.onConnectionChange(false);
    });

    this.socket.on('room_sync', (data: RoomSyncPayload) => {
      this.onSync(data);
    });

    this.socket.on('remote_shoot', (data) => {
      this.onRemoteShoot(data);
    });

    this.socket.on('damage_taken', (data) => {
      this.onDamageTaken(data);
    });

    this.socket.on('player_killed', (data) => {
      this.onPlayerKilled(data);
    });

    this.socket.on('player_respawned', (data) => {
      this.onPlayerRespawned(data);
    });

    // Ping check
    setInterval(() => {
      if (this.socket && this.isConnected) {
        const start = performance.now();
        this.socket.emit('ping', () => {
          this.ping = Math.round(performance.now() - start);
        });
      }
    }, 3000);
  }

  public getRooms(): Promise<RoomInfo[]> {
    return new Promise((resolve) => {
      if (!this.socket) return resolve([]);
      this.socket.emit('get_rooms', (rooms: RoomInfo[]) => {
        resolve(rooms || []);
      });
    });
  }

  public createRoom(params: {
    name: string;
    mapId: string;
    mode: GameMode;
    maxPlayers: number;
    isPrivate: boolean;
    playerName: string;
    team: 'red' | 'blue' | 'ffa';
    withBots?: boolean;
  }): Promise<{ success: boolean; roomId?: string; room?: RoomInfo; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) return resolve({ success: false, error: 'Socket not connected' });
      this.socket.emit('create_room', params, (res: { success: boolean; roomId?: string; room?: RoomInfo; error?: string }) => {
        resolve(res);
      });
    });
  }

  public joinRoom(params: {
    roomId: string;
    playerName: string;
    team?: 'red' | 'blue' | 'ffa';
  }): Promise<{ success: boolean; room?: RoomInfo; players?: PlayerState[]; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) return resolve({ success: false, error: 'Socket not connected' });
      this.socket.emit('join_room', params, (res: { success: boolean; room?: RoomInfo; players?: PlayerState[]; error?: string }) => {
        resolve(res);
      });
    });
  }

  public sendPlayerUpdate(state: Partial<PlayerState>) {
    if (this.socket && this.isConnected) {
      this.socket.emit('player_update', state);
    }
  }

  public sendShoot(origin: [number, number, number], direction: [number, number, number], weaponId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('player_shoot', { origin, direction, weaponId });
    }
  }

  public sendHit(victimId: string, damage: number, isHeadshot: boolean, weaponName: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('player_hit', { victimId, damage, isHeadshot, weaponName });
    }
  }

  public leaveRoom() {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_room');
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const multiplayerClient = new MultiplayerClient();
