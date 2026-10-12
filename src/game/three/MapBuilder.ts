import * as THREE from 'three';
import { MapDef } from '../../types/game';
import { TextureGenerator } from './TextureGenerator';

export interface BuiltMap {
  group: THREE.Group;
  collisionBoxes: THREE.Box3[];
  redSpawns: THREE.Vector3[];
  blueSpawns: THREE.Vector3[];
  ffaSpawns: THREE.Vector3[];
  capturePointMesh: THREE.Mesh | null;
  capturePointPos: THREE.Vector3;
}

export class MapBuilder {
  public static buildMap(mapDef: MapDef): BuiltMap {
    const group = new THREE.Group();
    group.name = `map_${mapDef.id}`;
    const collisionBoxes: THREE.Box3[] = [];

    // Helper to add collidable box
    const addCollider = (mesh: THREE.Object3D) => {
      mesh.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(mesh);
      collisionBoxes.push(box);
    };

    // 1. Ground Mesh
    let surfaceType: 'concrete' | 'sand' | 'grass' | 'snow' | 'metal' | 'grid' | 'rock' = 'concrete';
    if (mapDef.id.includes('desert') || mapDef.id.includes('canyon')) surfaceType = 'sand';
    else if (mapDef.id.includes('forest')) surfaceType = 'grass';
    else if (mapDef.id.includes('snow')) surfaceType = 'snow';
    else if (mapDef.id.includes('factory') || mapDef.id.includes('underground')) surfaceType = 'metal';
    else if (mapDef.id.includes('arena') || mapDef.id.includes('night')) surfaceType = 'grid';
    else if (mapDef.id.includes('fortress')) surfaceType = 'rock';

    const groundTex = TextureGenerator.getSurfaceTexture(surfaceType);
    groundTex.repeat.set(24, 24);

    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.8,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    group.add(ground);

    // 2. Perimeter Boundary Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.9,
    });
    const half = 78;
    const wallH = 12;

    const northWall = new THREE.Mesh(new THREE.BoxGeometry(160, wallH, 4), wallMat);
    northWall.position.set(0, wallH / 2, -half);
    group.add(northWall);
    addCollider(northWall);

    const southWall = new THREE.Mesh(new THREE.BoxGeometry(160, wallH, 4), wallMat);
    southWall.position.set(0, wallH / 2, half);
    group.add(southWall);
    addCollider(southWall);

    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(4, wallH, 160), wallMat);
    eastWall.position.set(half, wallH / 2, 0);
    group.add(eastWall);
    addCollider(eastWall);

    const westWall = new THREE.Mesh(new THREE.BoxGeometry(4, wallH, 160), wallMat);
    westWall.position.set(-half, wallH / 2, 0);
    group.add(westWall);
    addCollider(westWall);

    // 3. Central Capture Point
    const capturePointPos = new THREE.Vector3(mapDef.capturePointPos[0], mapDef.capturePointPos[1], mapDef.capturePointPos[2]);
    const capPodium = new THREE.Mesh(
      new THREE.CylinderGeometry(5.5, 6, 0.4, 24),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.6 })
    );
    capPodium.position.copy(capturePointPos).setY(0.2);
    group.add(capPodium);

    const capturePointBeacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 14, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 })
    );
    capturePointBeacon.position.copy(capturePointPos).setY(7);
    group.add(capturePointBeacon);

    // 4. Map-Specific Unique Architecture & Structures
    this.populateMapTheme(mapDef.id, group, addCollider);

    // 5. Team Spawns & FFA Spawns
    const redSpawns: THREE.Vector3[] = [
      new THREE.Vector3(-45, 1, -45),
      new THREE.Vector3(-35, 1, -55),
      new THREE.Vector3(-55, 1, -35),
      new THREE.Vector3(-25, 1, -50),
    ];

    const blueSpawns: THREE.Vector3[] = [
      new THREE.Vector3(45, 1, 45),
      new THREE.Vector3(35, 1, 55),
      new THREE.Vector3(55, 1, 35),
      new THREE.Vector3(25, 1, 50),
    ];

    const ffaSpawns: THREE.Vector3[] = [
      ...redSpawns,
      ...blueSpawns,
      new THREE.Vector3(0, 1, -50),
      new THREE.Vector3(0, 1, 50),
      new THREE.Vector3(-50, 1, 0),
      new THREE.Vector3(50, 1, 0),
    ];

    return {
      group,
      collisionBoxes,
      redSpawns,
      blueSpawns,
      ffaSpawns,
      capturePointMesh: capturePointBeacon,
      capturePointPos,
    };
  }

  // Populate thematic props for all 15 maps
  private static populateMapTheme(
    mapId: string,
    group: THREE.Group,
    addCollider: (obj: THREE.Object3D) => void
  ) {
    // Shared container builder for reuse
    const createContainer = (x: number, z: number, rotY: number, colorHex: number) => {
      const mat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.5, roughness: 0.5 });
      const container = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 9), mat);
      container.position.set(x, 1.6, z);
      container.rotation.y = rotY;
      group.add(container);
      addCollider(container);
    };

    // Shared building block builder
    const createBuilding = (x: number, z: number, w: number, h: number, d: number, colorHex: number) => {
      const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.75, metalness: 0.2 });
      const bldg = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      bldg.position.set(x, h / 2, z);
      group.add(bldg);
      addCollider(bldg);
    };

    // Shared concrete tactical barrier
    const createBarrier = (x: number, z: number, rotY: number) => {
      const mat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
      const barrier = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, 0.8), mat);
      barrier.position.set(x, 0.6, z);
      barrier.rotation.y = rotY;
      group.add(barrier);
      addCollider(barrier);
    };

    // Shared tree generator for forests & islands
    const createTree = (x: number, z: number, isPalm: boolean = false) => {
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 6, 8), trunkMat);
      trunk.position.set(x, 3, z);
      group.add(trunk);
      addCollider(trunk);

      if (isPalm) {
        const frondMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
        for (let i = 0; i < 5; i++) {
          const frond = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.1, 0.8), frondMat);
          frond.position.set(x, 6, z);
          frond.rotation.y = (i * Math.PI) / 2.5;
          frond.rotation.z = 0.2;
          group.add(frond);
        }
      } else {
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8 });
        for (let layer = 0; layer < 3; layer++) {
          const cone = new THREE.Mesh(new THREE.ConeGeometry(3 - layer * 0.7, 3, 8), leafMat);
          cone.position.set(x, 5 + layer * 2, z);
          group.add(cone);
        }
      }
    };

    if (mapId === 'map_modern_city') {
      // Skyscraper blocks and urban alleys
      createBuilding(-28, -25, 18, 26, 18, 0x1e293b);
      createBuilding(28, -25, 18, 22, 18, 0x334155);
      createBuilding(-28, 25, 18, 24, 18, 0x1e293b);
      createBuilding(28, 25, 18, 30, 18, 0x0f172a);
      // Street barriers & cover
      createBarrier(-12, 0, 0);
      createBarrier(12, 0, 0);
      createBarrier(0, -12, Math.PI / 2);
      createBarrier(0, 12, Math.PI / 2);
      createContainer(-8, -18, 0.4, 0x3b82f6);
      createContainer(12, 16, -0.3, 0xef4444);

    } else if (mapId === 'map_desert_base') {
      // Military bunkers and sandbag fortifications
      createBuilding(-30, 0, 20, 7, 14, 0xca8a04);
      createBuilding(30, 0, 20, 7, 14, 0xa16207);
      // Watchtowers
      createBuilding(-40, -40, 6, 14, 6, 0x78350f);
      createBuilding(40, 40, 6, 14, 6, 0x78350f);
      // Tactical sandbags & crates
      createBarrier(-15, -10, 0.2);
      createBarrier(15, 10, -0.4);
      createContainer(-15, 20, 0.8, 0xb45309);
      createContainer(20, -15, -0.5, 0x92400e);

    } else if (mapId === 'map_dense_forest') {
      // Tree canopy and boulder formations
      const forestSpots = [
        [-35, -35], [-20, -40], [-40, -15], [-15, -20],
        [35, 35], [20, 40], [40, 15], [15, 20],
        [-30, 25], [-20, 15], [25, -30], [20, -15],
        [-10, 35], [10, -35], [35, -10], [-35, 10]
      ];
      forestSpots.forEach(([x, z]) => createTree(x, z, false));
      // Wooden cabins
      createBuilding(-25, 0, 12, 6, 10, 0x451a03);
      createBuilding(25, 0, 12, 6, 10, 0x451a03);
      createBarrier(-12, -8, 0.6);
      createBarrier(12, 8, -0.6);

    } else if (mapId === 'map_snow_mountain') {
      // Ice crags, snowy crates and radar domes
      createBuilding(-30, -30, 16, 10, 16, 0x94a3b8);
      createBuilding(30, 30, 16, 10, 16, 0x94a3b8);
      // Radar dome
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(6, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 })
      );
      dome.position.set(0, 5, -28);
      group.add(dome);
      addCollider(dome);
      createContainer(-12, 12, 0.5, 0x38bdf8);
      createContainer(12, -12, -0.5, 0x0284c7);
      createBarrier(-14, -6, 0.3);
      createBarrier(14, 6, -0.3);

    } else if (mapId === 'map_industrial_factory') {
      // Warehouses, metal silos, heavy pipes
      createBuilding(-32, 0, 24, 12, 18, 0x475569);
      createBuilding(32, 0, 24, 12, 18, 0x334155);
      // Chemical silos
      for (let i = -1; i <= 1; i += 2) {
        const silo = new THREE.Mesh(
          new THREE.CylinderGeometry(4, 4, 14, 12),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 })
        );
        silo.position.set(i * 18, 7, -25);
        group.add(silo);
        addCollider(silo);
      }
      createContainer(-10, 18, 0.1, 0xf97316);
      createContainer(10, -18, -0.2, 0xeab308);
      createBarrier(-8, 5, 0.4);
      createBarrier(8, -5, -0.4);

    } else if (mapId === 'map_abandoned_town') {
      // Decaying broken walls, rubble blocks
      createBuilding(-26, -20, 14, 8, 12, 0x57534e);
      createBuilding(26, 20, 14, 8, 12, 0x44403c);
      createBuilding(-20, 26, 12, 6, 14, 0x57534e);
      createBuilding(20, -26, 12, 6, 14, 0x44403c);
      createBarrier(-10, -10, 0.7);
      createBarrier(10, 10, -0.7);
      createBarrier(0, -18, 0);
      createBarrier(0, 18, 0);

    } else if (mapId === 'map_tropical_island') {
      // Palm groves, wooden beach huts
      const palmSpots = [
        [-30, -30], [-20, -35], [-35, -15],
        [30, 30], [20, 35], [35, 15],
        [-25, 20], [25, -20], [-15, 30], [15, -30]
      ];
      palmSpots.forEach(([x, z]) => createTree(x, z, true));
      createBuilding(-22, 0, 12, 5, 12, 0x78350f);
      createBuilding(22, 0, 12, 5, 12, 0x78350f);
      createContainer(-10, -12, 0.4, 0x06b6d4);
      createContainer(10, 12, -0.4, 0x10b981);

    } else if (mapId === 'map_military_training') {
      // Shooting gallery hurdles and tactical obstacles
      for (let i = -2; i <= 2; i++) {
        createBarrier(i * 12, -18, 0);
        createBarrier(i * 12, 18, 0);
      }
      createBuilding(-30, 0, 10, 5, 18, 0x52525b);
      createBuilding(30, 0, 10, 5, 18, 0x52525b);
      createContainer(-15, 0, 0.3, 0x84cc16);
      createContainer(15, 0, -0.3, 0x84cc16);

    } else if (mapId === 'map_night_city') {
      // Towering black monoliths with vibrant neon trims
      createBuilding(-26, -26, 18, 28, 18, 0x09090b);
      createBuilding(26, -26, 18, 24, 18, 0x09090b);
      createBuilding(-26, 26, 18, 26, 18, 0x09090b);
      createBuilding(26, 26, 18, 32, 18, 0x09090b);
      // Neon billboard signs
      const signMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const signMatPink = new THREE.MeshBasicMaterial({ color: 0xff007f });
      const sign1 = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 0.4), signMatCyan);
      sign1.position.set(-26, 14, -16.5);
      group.add(sign1);

      const sign2 = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 0.4), signMatPink);
      sign2.position.set(26, 14, 16.5);
      group.add(sign2);
      createBarrier(-12, 0, 0);
      createBarrier(12, 0, 0);
      createContainer(-8, -14, 0.5, 0xa855f7);
      createContainer(8, 14, -0.5, 0xec4899);

    } else if (mapId === 'map_airport_terminal') {
      // Terminal hangar and cargo pallets
      createBuilding(0, -35, 48, 14, 16, 0x1e293b);
      createBuilding(0, 35, 48, 14, 16, 0x1e293b);
      createContainer(-20, 0, 0.2, 0x0284c7);
      createContainer(-12, 5, 0.2, 0x38bdf8);
      createContainer(20, 0, -0.2, 0x0284c7);
      createContainer(12, -5, -0.2, 0x38bdf8);
      createBarrier(-5, -12, 0);
      createBarrier(5, 12, 0);

    } else if (mapId === 'map_underground_facility') {
      // Bunker corridors, laboratory server partitions
      createBuilding(-24, -18, 16, 6, 8, 0x1f2937);
      createBuilding(24, 18, 16, 6, 8, 0x1f2937);
      createBuilding(-18, 24, 8, 6, 16, 0x1f2937);
      createBuilding(18, -24, 8, 6, 16, 0x1f2937);
      // Glowing server columns
      for (let i = -1; i <= 1; i += 2) {
        const server = new THREE.Mesh(
          new THREE.BoxGeometry(2.5, 5, 6),
          new THREE.MeshStandardMaterial({ color: 0x111827, emissive: 0x10b981, emissiveIntensity: 0.25 })
        );
        server.position.set(i * 12, 2.5, 0);
        group.add(server);
        addCollider(server);
      }
      createBarrier(-8, -8, 0.5);
      createBarrier(8, 8, -0.5);

    } else if (mapId === 'map_ancient_fortress') {
      // Ramparts and courtyard ramparts
      createBuilding(-32, 0, 10, 10, 36, 0x57534e);
      createBuilding(32, 0, 10, 10, 36, 0x57534e);
      // Fortress corner towers
      createBuilding(-35, -35, 10, 16, 10, 0x44403c);
      createBuilding(35, 35, 10, 16, 10, 0x44403c);
      createBuilding(-35, 35, 10, 16, 10, 0x44403c);
      createBuilding(35, -35, 10, 16, 10, 0x44403c);
      createBarrier(-14, 0, Math.PI / 2);
      createBarrier(14, 0, Math.PI / 2);
      createBarrier(0, -14, 0);
      createBarrier(0, 14, 0);

    } else if (mapId === 'map_port_docks') {
      // Shipping containers stacks
      const colors = [0x2563eb, 0xdc2626, 0x16a34a, 0xf59e0b];
      for (let i = 0; i < 6; i++) {
        createContainer(-25 + (i % 2) * 12, -25 + Math.floor(i / 2) * 16, 0.1, colors[i % colors.length]);
        createContainer(25 - (i % 2) * 12, 25 - Math.floor(i / 2) * 16, -0.1, colors[(i + 1) % colors.length]);
      }
      // Gantry crane leg
      createBuilding(0, -32, 6, 20, 6, 0xeab308);
      createBuilding(0, 32, 6, 20, 6, 0xeab308);
      createBarrier(-10, 0, 0.3);
      createBarrier(10, 0, -0.3);

    } else if (mapId === 'map_canyon_outpost') {
      // Mesa walls and canyon choke points
      createBuilding(-36, -10, 18, 14, 40, 0x9a3412);
      createBuilding(36, 10, 18, 14, 40, 0x9a3412);
      // Central suspension bridge structure
      const bridge = new THREE.Mesh(
        new THREE.BoxGeometry(22, 0.6, 6),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
      );
      bridge.position.set(0, 4, 0);
      group.add(bridge);
      addCollider(bridge);
      createBarrier(-8, -14, 0.4);
      createBarrier(8, 14, -0.4);

    } else {
      // map_futuristic_arena
      // Holographic pylons, symmetry coliseum
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2;
        const dist = 24;
        const pylon = new THREE.Mesh(
          new THREE.CylinderGeometry(1.5, 2.5, 12, 6),
          new THREE.MeshStandardMaterial({
            color: 0x18181b,
            emissive: 0xc084fc,
            emissiveIntensity: 0.8,
            metalness: 0.8,
            roughness: 0.2
          })
        );
        pylon.position.set(Math.cos(ang) * dist, 6, Math.sin(ang) * dist);
        group.add(pylon);
        addCollider(pylon);
      }
      createBarrier(-12, -12, Math.PI / 4);
      createBarrier(12, 12, Math.PI / 4);
      createBarrier(-12, 12, -Math.PI / 4);
      createBarrier(12, -12, -Math.PI / 4);
      createBuilding(-30, 0, 8, 8, 20, 0x0f172a);
      createBuilding(30, 0, 8, 8, 20, 0x0f172a);
    }
  }
}
