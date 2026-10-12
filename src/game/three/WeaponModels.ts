import * as THREE from 'three';
import { WeaponDef, WeaponSkinDef } from '../../types/game';
import { TextureGenerator } from './TextureGenerator';

export class WeaponModelFactory {
  // Build a complete 3D weapon group with materials and detachable magazine for reload animation
  public static createWeaponMesh(weapon: WeaponDef, skin: WeaponSkinDef): { group: THREE.Group; magMesh: THREE.Mesh | null; muzzlePoint: THREE.Vector3 } {
    const group = new THREE.Group();
    group.name = `weapon_${weapon.id}`;

    const skinTexture = TextureGenerator.getSkinTexture(skin);

    // Primary material with skin texture
    const mainMaterial = new THREE.MeshStandardMaterial({
      map: skinTexture,
      metalness: skin.metalness,
      roughness: skin.roughness,
      emissive: skin.emissive ? new THREE.Color(skin.emissive) : new THREE.Color(0x000000),
      emissiveIntensity: skin.emissive ? 0.8 : 0.0,
    });

    // Dark tactical polymer/metal for grips and internals
    const polymerMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.2,
      roughness: 0.8,
    });

    // Metallic hardware / chrome parts
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.9,
      roughness: 0.2,
    });

    let magMesh: THREE.Mesh | null = null;
    let muzzlePoint = new THREE.Vector3(0, 0.05, -0.65);

    if (weapon.category === 'rifle') {
      // --- AK-47 / Assault Rifle ---
      // Receiver
      const receiverGeo = new THREE.BoxGeometry(0.06, 0.09, 0.42);
      const receiver = new THREE.Mesh(receiverGeo, mainMaterial);
      receiver.position.set(0, 0, 0);
      group.add(receiver);

      // Dust cover top
      const topCoverGeo = new THREE.CylinderGeometry(0.028, 0.03, 0.35, 8);
      const topCover = new THREE.Mesh(topCoverGeo, mainMaterial);
      topCover.rotation.x = Math.PI / 2;
      topCover.position.set(0, 0.05, -0.02);
      group.add(topCover);

      // Barrel
      const barrelGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.48, 8);
      const barrel = new THREE.Mesh(barrelGeo, metalMaterial);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.035, -0.42);
      group.add(barrel);

      // Gas tube
      const gasTubeGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.3, 8);
      const gasTube = new THREE.Mesh(gasTubeGeo, metalMaterial);
      gasTube.rotation.x = Math.PI / 2;
      gasTube.position.set(0, 0.058, -0.32);
      group.add(gasTube);

      // Wooden / Polymer Handguard
      const handguardGeo = new THREE.BoxGeometry(0.055, 0.07, 0.22);
      const handguard = new THREE.Mesh(handguardGeo, polymerMaterial);
      handguard.position.set(0, 0.03, -0.28);
      group.add(handguard);

      // Muzzle Brake
      const muzzleGeo = new THREE.CylinderGeometry(0.018, 0.016, 0.06, 8);
      const muzzle = new THREE.Mesh(muzzleGeo, polymerMaterial);
      muzzle.rotation.x = Math.PI / 2;
      muzzle.position.set(0, 0.035, -0.68);
      group.add(muzzle);
      muzzlePoint = new THREE.Vector3(0, 0.035, -0.72);

      // Stock
      const stockGeo = new THREE.BoxGeometry(0.045, 0.09, 0.32);
      const stock = new THREE.Mesh(stockGeo, polymerMaterial);
      stock.position.set(0, -0.01, 0.32);
      group.add(stock);

      // Pistol grip
      const gripGeo = new THREE.BoxGeometry(0.04, 0.14, 0.06);
      const grip = new THREE.Mesh(gripGeo, polymerMaterial);
      grip.position.set(0, -0.1, 0.1);
      grip.rotation.x = 0.35;
      group.add(grip);

      // Curved Banana Magazine
      const magGeo = new THREE.BoxGeometry(0.038, 0.22, 0.08);
      magMesh = new THREE.Mesh(magGeo, mainMaterial);
      magMesh.position.set(0, -0.13, -0.04);
      magMesh.rotation.x = -0.22;
      group.add(magMesh);

      // Sights (front and rear)
      const frontSightGeo = new THREE.BoxGeometry(0.01, 0.04, 0.02);
      const frontSight = new THREE.Mesh(frontSightGeo, metalMaterial);
      frontSight.position.set(0, 0.07, -0.62);
      group.add(frontSight);

      const rearSightGeo = new THREE.BoxGeometry(0.025, 0.02, 0.04);
      const rearSight = new THREE.Mesh(rearSightGeo, metalMaterial);
      rearSight.position.set(0, 0.07, -0.15);
      group.add(rearSight);

    } else if (weapon.category === 'smg') {
      // --- MP5 / SMG ---
      const receiverGeo = new THREE.BoxGeometry(0.05, 0.08, 0.34);
      const receiver = new THREE.Mesh(receiverGeo, mainMaterial);
      group.add(receiver);

      const barrelGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.22, 8);
      const barrel = new THREE.Mesh(barrelGeo, metalMaterial);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.02, -0.26);
      group.add(barrel);

      const gripGeo = new THREE.BoxGeometry(0.038, 0.12, 0.055);
      const grip = new THREE.Mesh(gripGeo, polymerMaterial);
      grip.position.set(0, -0.09, 0.08);
      grip.rotation.x = 0.3;
      group.add(grip);

      // Foregrip
      const foregripGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.1, 8);
      const foregrip = new THREE.Mesh(foregripGeo, polymerMaterial);
      foregrip.position.set(0, -0.07, -0.18);
      group.add(foregrip);

      // Collapsible stock rods
      const stockGeo = new THREE.BoxGeometry(0.035, 0.06, 0.22);
      const stock = new THREE.Mesh(stockGeo, polymerMaterial);
      stock.position.set(0, 0.01, 0.26);
      group.add(stock);

      // Curved stick magazine
      const magGeo = new THREE.BoxGeometry(0.03, 0.2, 0.04);
      magMesh = new THREE.Mesh(magGeo, mainMaterial);
      magMesh.position.set(0, -0.11, -0.06);
      magMesh.rotation.x = -0.15;
      group.add(magMesh);

      // Reflex Red Dot Sight
      const sightBase = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.015, 0.08), metalMaterial);
      sightBase.position.set(0, 0.05, -0.02);
      group.add(sightBase);

      const sightRing = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 6, 12), metalMaterial);
      sightRing.position.set(0, 0.075, -0.02);
      group.add(sightRing);

      muzzlePoint = new THREE.Vector3(0, 0.02, -0.38);

    } else if (weapon.category === 'sniper') {
      // --- AWP / Sniper Rifle ---
      const stockBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.72), polymerMaterial);
      stockBody.position.set(0, -0.02, 0.12);
      group.add(stockBody);

      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.08, 0.38), mainMaterial);
      receiver.position.set(0, 0.04, -0.12);
      group.add(receiver);

      // Long heavy barrel
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.016, 0.82, 8), metalMaterial);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.05, -0.68);
      group.add(barrel);

      // Large muzzle brake
      const brake = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.09), metalMaterial);
      brake.position.set(0, 0.05, -1.1);
      group.add(brake);
      muzzlePoint = new THREE.Vector3(0, 0.05, -1.15);

      // Large High-Magnification Scope
      const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.32, 12), mainMaterial);
      scopeTube.rotation.x = Math.PI / 2;
      scopeTube.position.set(0, 0.13, -0.12);
      group.add(scopeTube);

      // Scope lens front and back
      const lensFront = new THREE.Mesh(new THREE.CircleGeometry(0.026, 12), new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
      lensFront.position.set(0, 0.13, -0.28);
      lensFront.rotation.y = Math.PI;
      group.add(lensFront);

      // Scope Mounts
      const mount1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.025), metalMaterial);
      mount1.position.set(0, 0.09, -0.04);
      group.add(mount1);

      const mount2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.025), metalMaterial);
      mount2.position.set(0, 0.09, -0.2);
      group.add(mount2);

      // Bolt Handle
      const boltHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 6), metalMaterial);
      boltHandle.position.set(0.05, 0.05, -0.05);
      boltHandle.rotation.z = Math.PI / 3;
      group.add(boltHandle);

      // Box Mag
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.08), mainMaterial);
      mag.position.set(0, -0.08, -0.12);
      group.add(mag);
      magMesh = mag;

      // Bipod legs folded
      const bipodL = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.22, 6), metalMaterial);
      bipodL.position.set(-0.035, 0.02, -0.45);
      bipodL.rotation.x = 0.2;
      group.add(bipodL);

      const bipodR = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.22, 6), metalMaterial);
      bipodR.position.set(0.035, 0.02, -0.45);
      bipodR.rotation.x = 0.2;
      group.add(bipodR);

    } else if (weapon.category === 'shotgun') {
      // --- SPAS-12 Combat Shotgun ---
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.44), mainMaterial);
      receiver.position.set(0, 0, 0);
      group.add(receiver);

      // Twin barrels (main barrel + tubular magazine under it)
      const mainBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.52, 8), metalMaterial);
      mainBarrel.rotation.x = Math.PI / 2;
      mainBarrel.position.set(0, 0.03, -0.46);
      group.add(mainBarrel);

      const tubeMag = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.48, 8), metalMaterial);
      tubeMag.rotation.x = Math.PI / 2;
      tubeMag.position.set(0, -0.015, -0.44);
      group.add(tubeMag);

      // Ribbed pump grip
      const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.18, 10), polymerMaterial);
      pump.rotation.x = Math.PI / 2;
      pump.position.set(0, -0.015, -0.38);
      group.add(pump);

      // Metal folding stock
      const foldStock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.05, 0.35), metalMaterial);
      foldStock.position.set(0, 0.05, 0.18);
      group.add(foldStock);

      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.13, 0.06), polymerMaterial);
      grip.position.set(0, -0.09, 0.12);
      grip.rotation.x = 0.35;
      group.add(grip);

      muzzlePoint = new THREE.Vector3(0, 0.03, -0.73);

    } else if (weapon.category === 'pistol') {
      // --- Desert Eagle .50 ---
      const slide = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.055, 0.28), mainMaterial);
      slide.position.set(0, 0.035, -0.04);
      group.add(slide);

      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.045, 0.24), metalMaterial);
      frame.position.set(0, 0.0, -0.04);
      group.add(frame);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.15, 8), metalMaterial);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.035, -0.22);
      group.add(barrel);

      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.13, 0.075), polymerMaterial);
      grip.position.set(0, -0.07, 0.03);
      grip.rotation.x = 0.28;
      group.add(grip);

      // Pistol Mag
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.14, 0.05), metalMaterial);
      mag.position.set(0, -0.09, 0.03);
      mag.rotation.x = 0.28;
      group.add(mag);
      magMesh = mag;

      const ironSight = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.012, 0.012), metalMaterial);
      ironSight.position.set(0, 0.065, -0.28);
      group.add(ironSight);

      muzzlePoint = new THREE.Vector3(0, 0.035, -0.3);

    } else {
      // --- M249 LMG ---
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 0.52), mainMaterial);
      receiver.position.set(0, 0, 0);
      group.add(receiver);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 8), metalMaterial);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.02, -0.52);
      group.add(barrel);

      // Heat shield with vent holes
      const heatShield = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.28), polymerMaterial);
      heatShield.position.set(0, 0.035, -0.38);
      group.add(heatShield);

      // Heavy ammo drum / box
      const ammoBox = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.16), polymerMaterial);
      ammoBox.position.set(0.01, -0.12, -0.02);
      group.add(ammoBox);
      magMesh = ammoBox;

      // Heavy club stock
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.11, 0.28), polymerMaterial);
      stock.position.set(0, -0.01, 0.38);
      group.add(stock);

      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.13, 0.06), polymerMaterial);
      grip.position.set(0, -0.11, 0.12);
      grip.rotation.x = 0.32;
      group.add(grip);

      muzzlePoint = new THREE.Vector3(0, 0.02, -0.8);
    }

    return { group, magMesh, muzzlePoint };
  }

  // Tactical first person arms holding the weapon rig
  public static createFPArms(): THREE.Group {
    const armsGroup = new THREE.Group();
    armsGroup.name = 'fp_arms';

    const gloveMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.8,
      metalness: 0.1,
    });

    const sleeveMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.9,
    });

    // Right arm (trigger arm)
    const rightArm = new THREE.Group();
    const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.35, 8), sleeveMaterial);
    rightForearm.rotation.x = Math.PI / 3;
    rightForearm.position.set(0.18, -0.15, 0.22);
    rightArm.add(rightForearm);

    const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.08), gloveMaterial);
    rightHand.position.set(0.08, -0.07, 0.08);
    rightArm.add(rightHand);
    armsGroup.add(rightArm);

    // Left arm (support handguard arm)
    const leftArm = new THREE.Group();
    const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.048, 0.42, 8), sleeveMaterial);
    leftForearm.rotation.z = -Math.PI / 4;
    leftForearm.rotation.x = Math.PI / 4;
    leftForearm.position.set(-0.2, -0.18, 0.05);
    leftArm.add(leftForearm);

    const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.07), gloveMaterial);
    leftHand.position.set(-0.06, -0.02, -0.22);
    leftArm.add(leftHand);
    armsGroup.add(leftArm);

    return armsGroup;
  }
}
