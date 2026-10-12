import * as THREE from 'three';
import { CharacterSkinDef, WeaponDef, WeaponSkinDef } from '../../types/game';
import { WeaponModelFactory } from './WeaponModels';

export class CharacterModelFactory {
  public static createCharacter(
    skin: CharacterSkinDef,
    team: 'red' | 'blue' | 'ffa',
    weapon: WeaponDef,
    weaponSkin: WeaponSkinDef,
    playerName: string
  ): {
    root: THREE.Group;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    head: THREE.Group;
    updateNameTag: (health: number) => void;
  } {
    const root = new THREE.Group();
    root.name = `player_char_${skin.id}`;

    // Team indicator color
    const teamColorHex = team === 'red' ? 0xef4444 : team === 'blue' ? 0x3b82f6 : 0x10b981;

    // Uniform materials
    const suitMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(skin.primaryColor),
      roughness: 0.75,
      metalness: 0.2,
    });

    const vestMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(skin.secondaryColor),
      roughness: 0.85,
      metalness: 0.1,
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(skin.accentColor),
      roughness: 0.4,
      metalness: 0.6,
    });

    const teamMat = new THREE.MeshStandardMaterial({
      color: teamColorHex,
      emissive: teamColorHex,
      emissiveIntensity: 0.35,
      roughness: 0.3,
    });

    // 1. Torso
    const torso = new THREE.Group();
    torso.position.y = 1.05;

    const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.52, 0.28), suitMat);
    torso.add(chestMesh);

    // Kevlar Armor Plate Vest
    const vestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.51, 0.44, 0.31), vestMat);
    torso.add(vestMesh);

    // Tactical ammo pouches on front
    for (let i = -1; i <= 1; i++) {
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.06), accentMat);
      pouch.position.set(i * 0.13, -0.12, 0.17);
      torso.add(pouch);
    }

    // Team armbands / shoulder pads
    const leftPad = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.14), teamMat);
    leftPad.position.set(-0.29, 0.18, 0);
    torso.add(leftPad);

    const rightPad = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.14), teamMat);
    rightPad.position.set(0.29, 0.18, 0);
    torso.add(rightPad);

    root.add(torso);

    // 2. Head & Helmet
    const head = new THREE.Group();
    head.position.set(0, 1.48, 0);

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.24), suitMat);
    head.add(headMesh);

    // Tactical helmet
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), vestMat);
    helmet.scale.set(1.0, 0.85, 1.15);
    helmet.position.set(0, 0.08, 0);
    head.add(helmet);

    // Goggles / Glowing Visor
    const visorMat = new THREE.MeshStandardMaterial({
      color: skin.visorGlow ? new THREE.Color(skin.visorGlow) : 0x06b6d4,
      emissive: skin.visorGlow ? new THREE.Color(skin.visorGlow) : 0x06b6d4,
      emissiveIntensity: 0.9,
    });
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.08), visorMat);
    visor.position.set(0, 0.04, 0.12);
    head.add(visor);

    root.add(head);

    // 3. Legs
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.14, 0.78, 0);
    const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.74, 0.2), suitMat);
    leftLegMesh.position.y = -0.37;
    leftLeg.add(leftLegMesh);

    // Knee pad
    const leftKnee = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.06), accentMat);
    leftKnee.position.set(0, -0.36, 0.11);
    leftLeg.add(leftKnee);
    root.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.14, 0.78, 0);
    const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.74, 0.2), suitMat);
    rightLegMesh.position.y = -0.37;
    rightLeg.add(rightLegMesh);

    const rightKnee = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.06), accentMat);
    rightKnee.position.set(0, -0.36, 0.11);
    rightLeg.add(rightKnee);
    root.add(rightLeg);

    // 4. Arms & Weapon in hands
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.3, 1.25, 0);
    const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.52, 0.15), suitMat);
    leftArmMesh.position.set(0, -0.22, 0);
    leftArm.add(leftArmMesh);
    root.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.3, 1.25, 0);
    const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.52, 0.15), suitMat);
    rightArmMesh.position.set(0, -0.22, 0);
    rightArm.add(rightArmMesh);

    // Attached weapon in hands
    const { group: weaponMesh } = WeaponModelFactory.createWeaponMesh(weapon, weaponSkin);
    weaponMesh.scale.set(0.85, 0.85, 0.85);
    weaponMesh.position.set(-0.15, -0.2, 0.35);
    weaponMesh.rotation.y = 0.1;
    rightArm.add(weaponMesh);

    // Orient arms forward toward weapon
    rightArm.rotation.x = -Math.PI / 4;
    leftArm.rotation.x = -Math.PI / 3.8;
    leftArm.rotation.y = 0.35;
    root.add(rightArm);

    // 5. Overhead Name Tag Canvas Sprite
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const nameTexture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: nameTexture, transparent: true });
    const nameSprite = new THREE.Sprite(spriteMat);
    nameSprite.position.set(0, 1.95, 0);
    nameSprite.scale.set(1.4, 0.35, 1);
    root.add(nameSprite);

    const updateNameTag = (health: number) => {
      ctx.clearRect(0, 0, 256, 64);
      // Background tag pill
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(10, 4, 236, 56, 8);
      ctx.fill();

      // Team accent border
      ctx.strokeStyle = team === 'red' ? '#ef4444' : team === 'blue' ? '#3b82f6' : '#10b981';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Name text
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 22px "Rajdhani", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(playerName, 128, 28);

      // Mini Health bar
      const barW = 180;
      const barH = 6;
      ctx.fillStyle = '#334155';
      ctx.fillRect(38, 42, barW, barH);

      const healthRatio = Math.max(0, Math.min(1, health / 100));
      ctx.fillStyle = healthRatio > 0.5 ? '#22c55e' : healthRatio > 0.25 ? '#eab308' : '#ef4444';
      ctx.fillRect(38, 42, barW * healthRatio, barH);

      nameTexture.needsUpdate = true;
    };

    updateNameTag(100);

    return {
      root,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      head,
      updateNameTag,
    };
  }
}
