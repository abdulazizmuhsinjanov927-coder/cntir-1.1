import * as THREE from 'three';
import { WeaponDef, WeaponSkinDef } from '../types/game';
import { WeaponModelFactory } from './three/WeaponModels';
import { SoundEngine } from '../audio/SoundEngine';

export interface MobileInputs {
  moveX: number; // -1 to 1
  moveY: number; // -1 to 1
  lookDeltaX: number;
  lookDeltaY: number;
  isShooting: boolean;
  isAiming: boolean;
  isJumping: boolean;
  isCrouching: boolean;
  isSprinting: boolean;
  isReloading: boolean;
}

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public weaponRig: THREE.Group;
  public currentWeaponMesh: THREE.Group | null = null;
  public currentMagMesh: THREE.Mesh | null = null;
  public muzzlePoint: THREE.Vector3 = new THREE.Vector3(0, 0, -0.6);
  public muzzleFlashLight: THREE.PointLight;

  // Position & Velocity
  public position: THREE.Vector3 = new THREE.Vector3(0, 1.7, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public pitch: number = 0;
  public yaw: number = 0;
  public isGrounded: boolean = true;
  public isCrouched: boolean = false;
  public isSprinting: boolean = false;
  public isAiming: boolean = false;
  public isReloading: boolean = false;

  // Weapon recoil & sway
  public recoilPitch: number = 0;
  public recoilYaw: number = 0;
  private swayX: number = 0;
  private swayY: number = 0;
  private bobCycle: number = 0;
  private reloadTimer: number = 0;
  private reloadDuration: number = 2.0;

  // Inputs
  private keys: Record<string, boolean> = {};
  public mouseSensitivity: number = 0.0022;
  public mobileInputs: MobileInputs = {
    moveX: 0,
    moveY: 0,
    lookDeltaX: 0,
    lookDeltaY: 0,
    isShooting: false,
    isAiming: false,
    isJumping: false,
    isCrouching: false,
    isSprinting: false,
    isReloading: false,
  };

  // Base Speeds
  private walkSpeed = 7.5;
  private sprintSpeed = 11.5;
  private crouchSpeed = 4.0;
  private jumpForce = 8.5;
  private gravity = 22.0;
  private playerRadius = 0.55;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.weaponRig = new THREE.Group();
    this.camera.add(this.weaponRig);

    // Muzzle flash light attached to weapon rig
    this.muzzleFlashLight = new THREE.PointLight(0xffaa33, 0, 15);
    this.weaponRig.add(this.muzzleFlashLight);

    // Setup input listeners
    this.setupListeners();
  }

  private setupListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyC') {
        this.isCrouched = !this.isCrouched;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement) {
        this.handleMouseLook(e.movementX, e.movementY);
      }
    });

    window.addEventListener('mousedown', (e) => {
      if (document.pointerLockElement) {
        if (e.button === 2) {
          this.isAiming = true;
        }
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        this.isAiming = false;
      }
    });

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  public handleMouseLook(deltaX: number, deltaY: number) {
    this.yaw -= deltaX * this.mouseSensitivity;
    this.pitch -= deltaY * this.mouseSensitivity;

    // Clamp pitch between -85 and +85 degrees
    const maxPitch = (Math.PI / 2) - 0.05;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

    // Weapon sway lag
    this.swayX = Math.max(-0.04, Math.min(0.04, this.swayX - deltaX * 0.0004));
    this.swayY = Math.max(-0.04, Math.min(0.04, this.swayY - deltaY * 0.0004));
  }

  // Equip weapon model on the first-person rig
  public equipWeapon(weapon: WeaponDef, skin: WeaponSkinDef) {
    // Clear previous weapon
    while (this.weaponRig.children.length > 1) { // keep muzzle light
      const child = this.weaponRig.children[this.weaponRig.children.length - 1];
      if (child !== this.muzzleFlashLight) {
        this.weaponRig.remove(child);
      }
    }

    const { group, magMesh, muzzlePoint } = WeaponModelFactory.createWeaponMesh(weapon, skin);
    const arms = WeaponModelFactory.createFPArms();

    this.currentWeaponMesh = group;
    this.currentMagMesh = magMesh;
    this.muzzlePoint = muzzlePoint;

    // Default resting hip-fire position
    this.currentWeaponMesh.position.set(0.18, -0.18, -0.42);
    this.muzzleFlashLight.position.copy(muzzlePoint);

    this.weaponRig.add(this.currentWeaponMesh);
    this.weaponRig.add(arms);

    this.reloadDuration = weapon.reloadTime;
    this.isReloading = false;
    this.reloadTimer = 0;
  }

  // Trigger fire recoil
  public applyRecoil(recoilAmount: number) {
    this.recoilPitch += recoilAmount;
    this.recoilYaw += (Math.random() - 0.5) * recoilAmount * 0.4;

    // Flash light
    this.muzzleFlashLight.intensity = 4.0;
    setTimeout(() => {
      this.muzzleFlashLight.intensity = 0;
    }, 45);

    // Weapon kickback
    if (this.currentWeaponMesh) {
      this.currentWeaponMesh.position.z += 0.04;
      this.currentWeaponMesh.rotation.x += recoilAmount * 0.8;
    }
  }

  public startReload() {
    if (this.isReloading) return;
    this.isReloading = true;
    this.reloadTimer = this.reloadDuration;
    SoundEngine.playReload('mag_out');
    setTimeout(() => {
      SoundEngine.playReload('mag_in');
    }, (this.reloadDuration * 0.5) * 1000);
    setTimeout(() => {
      SoundEngine.playReload('bolt');
    }, (this.reloadDuration * 0.8) * 1000);
  }

  // Update physics and animation each frame
  public update(dt: number, collisionBoxes: THREE.Box3[], zoomFOV: number) {
    // 1. Mobile touch look delta
    if (this.mobileInputs.lookDeltaX !== 0 || this.mobileInputs.lookDeltaY !== 0) {
      this.handleMouseLook(this.mobileInputs.lookDeltaX, this.mobileInputs.lookDeltaY);
      this.mobileInputs.lookDeltaX = 0;
      this.mobileInputs.lookDeltaY = 0;
    }

    // 2. Camera Orientation with Recoil Recovery
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw + this.recoilYaw;
    this.camera.rotation.x = this.pitch + this.recoilPitch;

    // Smoothly decay recoil back to center
    this.recoilPitch = THREE.MathUtils.lerp(this.recoilPitch, 0, dt * 10);
    this.recoilYaw = THREE.MathUtils.lerp(this.recoilYaw, 0, dt * 10);
    this.swayX = THREE.MathUtils.lerp(this.swayX, 0, dt * 8);
    this.swayY = THREE.MathUtils.lerp(this.swayY, 0, dt * 8);

    // 3. Movement Direction
    let forward = 0;
    let right = 0;

    if (this.keys['KeyW']) forward += 1;
    if (this.keys['KeyS']) forward -= 1;
    if (this.keys['KeyD']) right += 1;
    if (this.keys['KeyA']) right -= 1;

    // Mobile joystick overrides
    if (this.mobileInputs.moveY !== 0) forward -= this.mobileInputs.moveY;
    if (this.mobileInputs.moveX !== 0) right += this.mobileInputs.moveX;

    const isMoving = forward !== 0 || right !== 0;
    this.isSprinting = (this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.mobileInputs.isSprinting) && forward > 0 && !this.isAiming;

    // Movement speed
    let targetSpeed = this.walkSpeed;
    if (this.isCrouched) targetSpeed = this.crouchSpeed;
    else if (this.isSprinting) targetSpeed = this.sprintSpeed;
    else if (this.isAiming) targetSpeed = this.walkSpeed * 0.6;

    const moveDir = new THREE.Vector3(right, 0, -forward);
    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    }

    // Acceleration & Friction
    const accel = this.isGrounded ? 18.0 : 4.0;
    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, moveDir.x * targetSpeed, dt * accel);
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, moveDir.z * targetSpeed, dt * accel);

    // Jump
    const jumpReq = this.keys['Space'] || this.mobileInputs.isJumping;
    if (jumpReq && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      this.mobileInputs.isJumping = false;
      SoundEngine.playFootstep();
    }

    // Gravity
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * dt;
    }

    // 4. Resolve Collision Against Map Bounding Boxes
    const nextPos = this.position.clone().addScaledVector(this.velocity, dt);

    // Check floor
    const targetStandingHeight = this.isCrouched ? 1.1 : 1.7;
    if (nextPos.y <= targetStandingHeight) {
      nextPos.y = targetStandingHeight;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // Horizontal AABB collision with sliding
    const playerBox = new THREE.Box3();
    const halfR = this.playerRadius;

    // Test X motion
    playerBox.min.set(nextPos.x - halfR, this.position.y - 0.5, this.position.z - halfR);
    playerBox.max.set(nextPos.x + halfR, this.position.y + 0.5, this.position.z + halfR);
    let collideX = false;
    for (const box of collisionBoxes) {
      if (playerBox.intersectsBox(box)) {
        collideX = true;
        break;
      }
    }
    if (!collideX) {
      this.position.x = nextPos.x;
    } else {
      this.velocity.x = 0;
    }

    // Test Z motion
    playerBox.min.set(this.position.x - halfR, this.position.y - 0.5, nextPos.z - halfR);
    playerBox.max.set(this.position.x + halfR, this.position.y + 0.5, nextPos.z + halfR);
    let collideZ = false;
    for (const box of collisionBoxes) {
      if (playerBox.intersectsBox(box)) {
        collideZ = true;
        break;
      }
    }
    if (!collideZ) {
      this.position.z = nextPos.z;
    } else {
      this.velocity.z = 0;
    }

    this.position.y = nextPos.y;
    this.camera.position.copy(this.position);

    // 5. Head Bobbing & Footsteps
    if (isMoving && this.isGrounded) {
      const stepFreq = this.isSprinting ? 14 : 9;
      this.bobCycle += dt * stepFreq;
      const bobAmount = this.isSprinting ? 0.05 : 0.025;
      this.camera.position.y += Math.sin(this.bobCycle) * bobAmount;

      // Footstep sound timing on bottom of wave
      if (Math.sin(this.bobCycle) < -0.92 && Math.abs(this.velocity.length()) > 2.0) {
        SoundEngine.playFootstep();
      }
    }

    // 6. Reload Animation State
    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.currentWeaponMesh) {
        // Tilt weapon down and eject mag
        this.currentWeaponMesh.rotation.z = Math.sin((this.reloadTimer / this.reloadDuration) * Math.PI) * 0.45;
        this.currentWeaponMesh.position.y = -0.25 + Math.sin((this.reloadTimer / this.reloadDuration) * Math.PI) * -0.08;
      }
      if (this.currentMagMesh) {
        // Animate mag drop and return
        const magProgress = this.reloadTimer / this.reloadDuration;
        this.currentMagMesh.position.y = -0.13 - Math.sin(magProgress * Math.PI) * 0.25;
      }
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        if (this.currentMagMesh) this.currentMagMesh.position.y = -0.13;
      }
    }

    // 7. Weapon Positioning: Hip Fire vs ADS (Aim Down Sights)
    if (this.currentWeaponMesh && !this.isReloading) {
      let targetX = 0.18 + this.swayX;
      let targetY = -0.18 + this.swayY;
      let targetZ = -0.42;
      let targetRotX = 0;
      let targetRotY = 0;
      let targetRotZ = 0;

      if (this.isAiming || this.mobileInputs.isAiming) {
        // ADS: Center weapon right in front of camera lens for iron sight/scope
        targetX = 0.0;
        targetY = -0.11;
        targetZ = -0.32;
        // Smoothly zoom camera FOV
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, zoomFOV, dt * 14);
      } else {
        // Hip Fire FOV
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 75, dt * 12);

        if (this.isSprinting) {
          // Tilt weapon down when sprinting
          targetX = 0.22;
          targetY = -0.24;
          targetRotX = -0.45;
          targetRotZ = 0.25;
        } else if (isMoving) {
          // Weapon sway while walking
          targetX += Math.cos(this.bobCycle * 0.5) * 0.015;
          targetY += Math.sin(this.bobCycle) * 0.015;
        }
      }

      this.camera.updateProjectionMatrix();

      // Smooth interpolation to target weapon pose
      this.currentWeaponMesh.position.x = THREE.MathUtils.lerp(this.currentWeaponMesh.position.x, targetX, dt * 15);
      this.currentWeaponMesh.position.y = THREE.MathUtils.lerp(this.currentWeaponMesh.position.y, targetY, dt * 15);
      this.currentWeaponMesh.position.z = THREE.MathUtils.lerp(this.currentWeaponMesh.position.z, targetZ, dt * 15);
      this.currentWeaponMesh.rotation.x = THREE.MathUtils.lerp(this.currentWeaponMesh.rotation.x, targetRotX, dt * 15);
      this.currentWeaponMesh.rotation.y = THREE.MathUtils.lerp(this.currentWeaponMesh.rotation.y, targetRotY, dt * 15);
      this.currentWeaponMesh.rotation.z = THREE.MathUtils.lerp(this.currentWeaponMesh.rotation.z, targetRotZ, dt * 15);
    }
  }

  // Get current camera forward ray for shooting
  public getShootRay(): THREE.Ray {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(this.camera.quaternion);
    return new THREE.Ray(this.camera.position.clone(), dir.normalize());
  }

  public teleport(pos: THREE.Vector3, yawAngle: number = 0) {
    this.position.copy(pos);
    this.velocity.set(0, 0, 0);
    this.yaw = yawAngle;
    this.pitch = 0;
    this.camera.position.copy(this.position);
  }
}
