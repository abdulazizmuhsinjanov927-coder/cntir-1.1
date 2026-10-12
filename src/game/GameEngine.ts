import * as THREE from 'three';
import { WeaponDef, WeaponSkinDef, CharacterSkinDef, MapDef, PlayerState, HitEffectData } from '../types/game';
import { PlayerController } from './PlayerController';
import { MapBuilder, BuiltMap } from './three/MapBuilder';
import { CharacterModelFactory } from './three/CharacterModel';
import { SoundEngine } from '../audio/SoundEngine';
import { WEAPONS, WEAPON_SKINS, CHARACTER_SKINS } from '../data/gameData';

export interface RemotePlayerInstance {
  state: PlayerState;
  model: ReturnType<typeof CharacterModelFactory.createCharacter>;
  targetPosition: THREE.Vector3;
  targetRotation: THREE.Euler;
  currentPosition: THREE.Vector3;
  legCycle: number;
}

export interface FloatingDamageNumber {
  sprite: THREE.Sprite;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class GameEngine {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public playerController: PlayerController;

  // Active Map
  public currentMapDef: MapDef;
  public builtMap: BuiltMap | null = null;
  public dirLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;

  // Remote Players
  public remotePlayers: Map<string, RemotePlayerInstance> = new Map();

  // Weapons & Loadout
  public currentWeapon: WeaponDef = WEAPONS[0];
  public currentWeaponSkin: WeaponSkinDef = WEAPON_SKINS[0];
  public currentCharacterSkin: CharacterSkinDef = CHARACTER_SKINS[0];

  // Ammo & Combat State
  public currentAmmo: number = 30;
  public reserveAmmo: number = 120;
  public playerHealth: number = 100;
  public playerArmor: number = 50;
  public isPlayerAlive: boolean = true;
  private lastShootTime: number = 0;

  // Visual Effects
  private tracers: { line: THREE.Line; velocity: THREE.Vector3; life: number }[] = [];
  private particles: { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number; color: THREE.Color }[] = [];
  private damageNumbers: FloatingDamageNumber[] = [];

  // Callbacks
  public onHit: (hit: HitEffectData) => void = () => {};
  public onShoot: (origin: [number, number, number], dir: [number, number, number]) => void = () => {};
  public onPlayerDeath: () => void = () => {};
  public onAmmoChange: (curr: number, reserve: number) => void = () => {};
  public onHealthChange: (hp: number, armor: number) => void = () => {};

  private animFrameId: number = 0;
  private clock: THREE.Clock = new THREE.Clock();
  public isRunning: boolean = false;

  constructor(canvas: HTMLCanvasElement, initialMap: MapDef) {
    this.currentMapDef = initialMap;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 400);
    this.scene.add(this.camera);

    // Controller
    this.playerController = new PlayerController(this.camera);

    // Lighting
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.dirLight.position.set(50, 80, 40);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 200;
    this.dirLight.shadow.camera.left = -60;
    this.dirLight.shadow.camera.right = 60;
    this.dirLight.shadow.camera.top = 60;
    this.dirLight.shadow.camera.bottom = -60;
    this.scene.add(this.dirLight);

    // Load initial map
    this.loadMap(initialMap);

    // Equip default weapon
    this.equipLoadout(this.currentWeapon, this.currentWeaponSkin, this.currentCharacterSkin);

    // Window resize
    window.addEventListener('resize', this.handleResize);

    // Input Shoot listener
    window.addEventListener('mousedown', (e) => {
      if (document.pointerLockElement && e.button === 0) {
        this.triggerShoot();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyR') {
        this.reload();
      }
      // Weapon switch keys 1-6
      if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'].includes(e.code)) {
        const idx = parseInt(e.code.replace('Digit', '')) - 1;
        if (WEAPONS[idx]) {
          this.switchWeapon(WEAPONS[idx]);
        }
      }
    });
  }

  private handleResize = () => {
    if (!this.renderer || !this.camera) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  // Switch to one of the 15 maps seamlessly
  public loadMap(mapDef: MapDef) {
    if (this.builtMap) {
      this.scene.remove(this.builtMap.group);
    }
    this.currentMapDef = mapDef;
    this.builtMap = MapBuilder.buildMap(mapDef);
    this.scene.add(this.builtMap.group);

    // Fog & Environment
    this.scene.fog = new THREE.Fog(mapDef.fogColor, mapDef.fogNear, mapDef.fogFar);
    this.scene.background = new THREE.Color(mapDef.skyColor);

    this.hemiLight.color.set(mapDef.sunColor);
    this.hemiLight.intensity = mapDef.ambientLight;
    this.dirLight.color.set(mapDef.sunColor);

    // Spawn player at valid spawn point
    const spawnPoint = this.builtMap.redSpawns[0] || new THREE.Vector3(0, 1.7, 0);
    this.playerController.teleport(spawnPoint);
  }

  // Equip weapon and skins
  public equipLoadout(weapon: WeaponDef, weaponSkin: WeaponSkinDef, charSkin: CharacterSkinDef) {
    this.currentWeapon = weapon;
    this.currentWeaponSkin = weaponSkin;
    this.currentCharacterSkin = charSkin;

    this.currentAmmo = weapon.magazineSize;
    this.reserveAmmo = weapon.maxReserveAmmo;

    this.playerController.equipWeapon(weapon, weaponSkin);
    this.onAmmoChange(this.currentAmmo, this.reserveAmmo);
  }

  public switchWeapon(weapon: WeaponDef) {
    this.currentWeapon = weapon;
    this.currentAmmo = weapon.magazineSize;
    this.reserveAmmo = weapon.maxReserveAmmo;
    this.playerController.equipWeapon(weapon, this.currentWeaponSkin);
    this.onAmmoChange(this.currentAmmo, this.reserveAmmo);
    SoundEngine.playUiClick();
  }

  // Shooting mechanics
  public triggerShoot() {
    if (!this.isPlayerAlive || this.playerController.isReloading) return;

    const now = performance.now();
    const interval = 1000 / this.currentWeapon.fireRate;
    if (now - this.lastShootTime < interval) return;

    if (this.currentAmmo <= 0) {
      this.reload();
      return;
    }

    this.lastShootTime = now;
    this.currentAmmo--;
    this.onAmmoChange(this.currentAmmo, this.reserveAmmo);

    // Audio
    SoundEngine.playGunshot(this.currentWeapon.category);

    // Recoil
    this.playerController.applyRecoil(this.currentWeapon.recoil);

    // Raycast hit detection
    const shootRay = this.playerController.getShootRay();
    this.onShoot(
      [shootRay.origin.x, shootRay.origin.y, shootRay.origin.z],
      [shootRay.direction.x, shootRay.direction.y, shootRay.direction.z]
    );

    // Pellet count (1 for rifles/snipers, 8 for shotgun)
    const pellets = this.currentWeapon.pellets || 1;
    for (let p = 0; p < pellets; p++) {
      const spreadRay = shootRay.clone();
      if (pellets > 1 || !this.playerController.isAiming) {
        const spreadAmount = (1 - this.currentWeapon.accuracy) * 0.08;
        spreadRay.direction.x += (Math.random() - 0.5) * spreadAmount;
        spreadRay.direction.y += (Math.random() - 0.5) * spreadAmount;
        spreadRay.direction.z += (Math.random() - 0.5) * spreadAmount;
        spreadRay.direction.normalize();
      }

      this.processBulletImpact(spreadRay);
    }
  }

  // Trace bullet ray against remote players and map colliders
  private processBulletImpact(ray: THREE.Ray) {
    let closestDistance = 150;
    let hitPoint: THREE.Vector3 | null = null;
    let hitNormal = new THREE.Vector3(0, 1, 0);
    let hitPlayerId: string | null = null;
    let isHeadshot = false;

    // Check remote player hitboxes
    this.remotePlayers.forEach((remote, id) => {
      if (!remote.state.isAlive) return;

      const playerPos = remote.currentPosition;
      // Body bounding box (approximate 0.6 x 1.8 x 0.6)
      const bodyBox = new THREE.Box3(
        new THREE.Vector3(playerPos.x - 0.35, playerPos.y, playerPos.z - 0.35),
        new THREE.Vector3(playerPos.x + 0.35, playerPos.y + 1.45, playerPos.z + 0.35)
      );

      // Head bounding box (approximate 0.3 x 0.35 x 0.3)
      const headBox = new THREE.Box3(
        new THREE.Vector3(playerPos.x - 0.2, playerPos.y + 1.45, playerPos.z - 0.2),
        new THREE.Vector3(playerPos.x + 0.2, playerPos.y + 1.85, playerPos.z + 0.2)
      );

      const hitHead = ray.intersectBox(headBox, new THREE.Vector3());
      const hitBody = ray.intersectBox(bodyBox, new THREE.Vector3());

      if (hitHead && ray.origin.distanceTo(hitHead) < closestDistance) {
        closestDistance = ray.origin.distanceTo(hitHead);
        hitPoint = hitHead;
        hitPlayerId = id;
        isHeadshot = true;
      } else if (hitBody && ray.origin.distanceTo(hitBody) < closestDistance) {
        closestDistance = ray.origin.distanceTo(hitBody);
        hitPoint = hitBody;
        hitPlayerId = id;
        isHeadshot = false;
      }
    });

    // Check map collision boxes if no closer player hit
    if (this.builtMap) {
      for (const box of this.builtMap.collisionBoxes) {
        const point = ray.intersectBox(box, new THREE.Vector3());
        if (point && ray.origin.distanceTo(point) < closestDistance) {
          closestDistance = ray.origin.distanceTo(point);
          hitPoint = point;
          hitPlayerId = null;
          isHeadshot = false;
        }
      }
    }

    // Default tracer end point if bullet hits sky
    if (!hitPoint) {
      hitPoint = ray.origin.clone().addScaledVector(ray.direction, closestDistance);
    }

    // Spawn tracer visual line
    this.spawnTracer(this.camera.position.clone().add(new THREE.Vector3(0.15, -0.15, -0.4)), hitPoint);

    // If enemy hit
    if (hitPlayerId && hitPoint) {
      const dmg = Math.round(this.currentWeapon.damage * (isHeadshot ? 2.2 : 1.0));
      SoundEngine.playHitmarker(isHeadshot);

      this.spawnDamageNumber(hitPoint, dmg, isHeadshot);
      this.spawnBloodSparks(hitPoint);

      this.onHit({
        position: [hitPoint.x, hitPoint.y, hitPoint.z],
        normal: [hitNormal.x, hitNormal.y, hitNormal.z],
        isFlesh: true,
        isHeadshot,
        damage: dmg,
      });
    } else if (hitPoint) {
      // Wall impact spark
      this.spawnWallSparks(hitPoint);
    }
  }

  // Reload mechanics
  public reload() {
    if (this.playerController.isReloading || this.currentAmmo >= this.currentWeapon.magazineSize || this.reserveAmmo <= 0) return;

    this.playerController.startReload();

    setTimeout(() => {
      const needed = this.currentWeapon.magazineSize - this.currentAmmo;
      const amount = Math.min(needed, this.reserveAmmo);
      this.currentAmmo += amount;
      this.reserveAmmo -= amount;
      this.onAmmoChange(this.currentAmmo, this.reserveAmmo);
    }, this.currentWeapon.reloadTime * 1000);
  }

  // Damage applied to local player
  public takeDamage(amount: number) {
    if (!this.isPlayerAlive) return;

    SoundEngine.playDamage();

    if (this.playerArmor > 0) {
      const absorbed = Math.min(this.playerArmor, amount * 0.5);
      this.playerArmor -= absorbed;
      amount -= absorbed;
    }

    this.playerHealth = Math.max(0, this.playerHealth - amount);
    this.onHealthChange(this.playerHealth, this.playerArmor);

    if (this.playerHealth <= 0) {
      this.isPlayerAlive = false;
      this.onPlayerDeath();
    }
  }

  public respawn(spawnPoint?: THREE.Vector3) {
    this.playerHealth = 100;
    this.playerArmor = 50;
    this.isPlayerAlive = true;
    this.currentAmmo = this.currentWeapon.magazineSize;
    this.reserveAmmo = this.currentWeapon.maxReserveAmmo;

    const pt = spawnPoint || (this.builtMap?.redSpawns[0] ?? new THREE.Vector3(0, 1.7, 0));
    this.playerController.teleport(pt);
    this.onHealthChange(this.playerHealth, this.playerArmor);
    this.onAmmoChange(this.currentAmmo, this.reserveAmmo);
  }

  // Bullet tracer lines
  private spawnTracer(from: THREE.Vector3, to: THREE.Vector3) {
    const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
    const mat = new THREE.LineBasicMaterial({
      color: 0xffe066,
      transparent: true,
      opacity: 0.85,
      linewidth: 2,
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.tracers.push({ line, velocity: new THREE.Vector3(), life: 0.08 });
  }

  // 3D Floating damage numbers
  private spawnDamageNumber(pos: THREE.Vector3, damage: number, isHeadshot: boolean) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = isHeadshot ? '#ef4444' : '#facc15';
    ctx.font = 'bold 32px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 8;
    ctx.fillText(`${damage}${isHeadshot ? ' CRIT' : ''}`, 64, 42);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.copy(pos).add(new THREE.Vector3(0, 0.4, 0));
    sprite.scale.set(0.9, 0.45, 1);
    this.scene.add(sprite);

    this.damageNumbers.push({
      sprite,
      position: sprite.position,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 0.4, 1.2, (Math.random() - 0.5) * 0.4),
      life: 0.8,
      maxLife: 0.8,
    });
  }

  // Particle sparks on wall hit
  private spawnWallSparks(pos: THREE.Vector3) {
    for (let i = 0; i < 6; i++) {
      const geo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffa500 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 4
      );
      this.particles.push({ mesh, velocity: vel, life: 0.25, color: new THREE.Color(0xffa500) });
    }
  }

  // Blood sparks on player hit
  private spawnBloodSparks(pos: THREE.Vector3) {
    for (let i = 0; i < 8; i++) {
      const geo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
      const mat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 2,
        (Math.random() - 0.5) * 3
      );
      this.particles.push({ mesh, velocity: vel, life: 0.35, color: new THREE.Color(0xdc2626) });
    }
  }

  // Remote Players management
  public updateRemotePlayers(players: PlayerState[], localPlayerId: string) {
    const activeIds = new Set<string>();

    for (const p of players) {
      if (p.id === localPlayerId) continue;
      activeIds.add(p.id);

      let inst = this.remotePlayers.get(p.id);
      if (!inst) {
        // Instantiate new 3D remote character
        const charSkin = CHARACTER_SKINS.find((s) => s.id === p.characterSkinId) || CHARACTER_SKINS[0];
        const weaponDef = WEAPONS.find((w) => w.id === p.weaponId) || WEAPONS[0];
        const weaponSkin = WEAPON_SKINS.find((ws) => ws.id === p.weaponSkinId) || WEAPON_SKINS[0];

        const charModel = CharacterModelFactory.createCharacter(
          charSkin,
          p.team,
          weaponDef,
          weaponSkin,
          p.name
        );
        this.scene.add(charModel.root);

        inst = {
          state: p,
          model: charModel,
          targetPosition: new THREE.Vector3(...p.position),
          targetRotation: new THREE.Euler(...p.rotation),
          currentPosition: new THREE.Vector3(...p.position),
          legCycle: 0,
        };
        this.remotePlayers.set(p.id, inst);
      } else {
        inst.state = p;
        inst.targetPosition.set(...p.position);
        inst.targetRotation.set(...p.rotation);
        inst.model.updateNameTag(p.health);
        inst.model.root.visible = p.isAlive;
      }
    }

    // Remove disconnected players
    this.remotePlayers.forEach((inst, id) => {
      if (!activeIds.has(id)) {
        this.scene.remove(inst.model.root);
        this.remotePlayers.delete(id);
      }
    });
  }

  // Main Render Loop
  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();

    const loop = () => {
      if (!this.isRunning) return;
      this.animFrameId = requestAnimationFrame(loop);

      const dt = Math.min(this.clock.getDelta(), 0.1);

      // 1. Update local player physics & controls
      if (this.builtMap && this.isPlayerAlive) {
        this.playerController.update(dt, this.builtMap.collisionBoxes, this.currentWeapon.zoomFOV);
      }

      // 2. Interpolate remote player models & animate run cycle
      this.remotePlayers.forEach((remote) => {
        const prevPos = remote.currentPosition.clone();
        remote.currentPosition.lerp(remote.targetPosition, dt * 14);
        remote.model.root.position.copy(remote.currentPosition);
        remote.model.root.rotation.y = remote.targetRotation.y;

        // Animate legs when moving
        const movedDist = remote.currentPosition.distanceTo(prevPos);
        if (movedDist > 0.01) {
          remote.legCycle += dt * 10;
          remote.model.leftLeg.rotation.x = Math.sin(remote.legCycle) * 0.55;
          remote.model.rightLeg.rotation.x = -Math.sin(remote.legCycle) * 0.55;
        } else {
          remote.model.leftLeg.rotation.x = THREE.MathUtils.lerp(remote.model.leftLeg.rotation.x, 0, dt * 8);
          remote.model.rightLeg.rotation.x = THREE.MathUtils.lerp(remote.model.rightLeg.rotation.x, 0, dt * 8);
        }
      });

      // 3. Update Visual Effects (Tracers, Sparks, Floating Damage)
      for (let i = this.tracers.length - 1; i >= 0; i--) {
        const tr = this.tracers[i];
        tr.life -= dt;
        if (tr.life <= 0) {
          this.scene.remove(tr.line);
          this.tracers.splice(i, 1);
        }
      }

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.life -= dt;
        pt.mesh.position.addScaledVector(pt.velocity, dt);
        pt.velocity.y -= 12 * dt;
        pt.mesh.scale.multiplyScalar(0.92);
        if (pt.life <= 0) {
          this.scene.remove(pt.mesh);
          this.particles.splice(i, 1);
        }
      }

      for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
        const dn = this.damageNumbers[i];
        dn.life -= dt;
        dn.position.addScaledVector(dn.velocity, dt);
        dn.sprite.material.opacity = dn.life / dn.maxLife;
        if (dn.life <= 0) {
          this.scene.remove(dn.sprite);
          this.damageNumbers.splice(i, 1);
        }
      }

      // 4. Capture Point Beacon pulse
      if (this.builtMap?.capturePointMesh) {
        this.builtMap.capturePointMesh.rotation.y += dt * 0.5;
      }

      // 5. Render Three.js Scene
      this.renderer.render(this.scene, this.camera);
    };

    loop();
  }

  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animFrameId);
  }

  public destroy() {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
  }
}
