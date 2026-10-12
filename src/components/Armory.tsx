import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { WEAPONS, WEAPON_SKINS } from '../data/gameData';
import { WeaponDef, WeaponSkinDef } from '../types/game';
import { WeaponModelFactory } from '../game/three/WeaponModels';
import { SoundEngine } from '../audio/SoundEngine';
import { Shield, Sparkles, Check, ChevronRight } from 'lucide-react';

interface ArmoryProps {
  currentWeapon: WeaponDef;
  currentSkin: WeaponSkinDef;
  onEquip: (weapon: WeaponDef, skin: WeaponSkinDef) => void;
  onBack: () => void;
}

export const Armory: React.FC<ArmoryProps> = ({
  currentWeapon,
  currentSkin,
  onEquip,
  onBack,
}) => {
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponDef>(currentWeapon);
  const [selectedSkin, setSelectedSkin] = useState<WeaponSkinDef>(currentSkin);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    weaponGroup: THREE.Group | null;
    rotY: number;
    isDragging: boolean;
    lastMouseX: number;
  } | null>(null);

  // Setup 3D Weapon Preview Scene
  useEffect(() => {
    if (!previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const width = canvas.parentElement?.clientWidth || 500;
    const height = canvas.parentElement?.clientHeight || 400;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 0.2, 1.3);

    // Cinematic Armory Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x333333, 1.2);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff0dd, 2.5);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 3.0);
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      weaponGroup: null,
      rotY: 0.5,
      isDragging: false,
      lastMouseX: 0,
    };

    let animId = 0;
    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      if (sceneRef.current) {
        if (!sceneRef.current.isDragging && sceneRef.current.weaponGroup) {
          sceneRef.current.rotY += 0.005;
          sceneRef.current.weaponGroup.rotation.y = sceneRef.current.rotY;
        }
        sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
      }
    };
    renderLoop();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, []);

  // Update 3D preview model when selected weapon or skin changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const { scene } = sceneRef.current;

    if (sceneRef.current.weaponGroup) {
      scene.remove(sceneRef.current.weaponGroup);
    }

    const { group } = WeaponModelFactory.createWeaponMesh(selectedWeapon, selectedSkin);
    group.scale.set(1.4, 1.4, 1.4);
    group.rotation.y = sceneRef.current.rotY;
    scene.add(group);
    sceneRef.current.weaponGroup = group;
  }, [selectedWeapon, selectedSkin]);

  // Drag to rotate weapon 3D view
  const handleMouseDown = (e: React.MouseEvent) => {
    if (sceneRef.current) {
      sceneRef.current.isDragging = true;
      sceneRef.current.lastMouseX = e.clientX;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (sceneRef.current && sceneRef.current.isDragging && sceneRef.current.weaponGroup) {
      const dx = e.clientX - sceneRef.current.lastMouseX;
      sceneRef.current.rotY += dx * 0.01;
      sceneRef.current.weaponGroup.rotation.y = sceneRef.current.rotY;
      sceneRef.current.lastMouseX = e.clientX;
    }
  };

  const handleMouseUp = () => {
    if (sceneRef.current) sceneRef.current.isDragging = false;
  };

  const categories = [
    { id: 'all', label: 'All Classes' },
    { id: 'rifle', label: 'Assault Rifles' },
    { id: 'smg', label: 'Submachine Guns' },
    { id: 'sniper', label: 'Sniper Rifles' },
    { id: 'shotgun', label: 'Shotguns' },
    { id: 'pistol', label: 'Pistols' },
    { id: 'lmg', label: 'Light Machine Guns' },
  ];

  const filteredWeapons =
    categoryFilter === 'all' ? WEAPONS : WEAPONS.filter((w) => w.category === categoryFilter);

  const isEquipped = currentWeapon.id === selectedWeapon.id && currentSkin.id === selectedSkin.id;

  return (
    <div className="absolute inset-0 bg-neutral-950/95 backdrop-blur-xl z-30 flex flex-col p-6 overflow-hidden">
      {/* Top Header */}
      <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
        <div>
          <h2 className="font-heading text-2xl font-bold text-white tracking-wider flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400" /> TACTICAL ARMORY & 3D WEAPON LAB
          </h2>
          <p className="text-neutral-400 text-xs">Customize ballistic firearms, inspect 3D geometry and apply combat finishes</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-xs font-heading font-semibold text-neutral-300 transition-colors cursor-pointer"
          >
            BACK
          </button>
          <button
            onClick={() => {
              onEquip(selectedWeapon, selectedSkin);
              SoundEngine.playUiClick();
            }}
            disabled={isEquipped}
            className={`px-6 py-2 rounded font-heading font-bold text-sm tracking-wider shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-2 ${
              isEquipped
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
            }`}
          >
            {isEquipped ? <Check className="w-4 h-4" /> : null}
            {isEquipped ? 'EQUIPPED IN LOADOUT' : 'EQUIP WEAPON & FINISH'}
          </button>
        </div>
      </div>

      {/* Main Content: Left 3D View & Stats, Right Weapons & 20+ Skins list */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 my-4 overflow-hidden">
        {/* Left Column (5 cols): 3D Viewport & Weapon Specs */}
        <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto">
          {/* 3D Weapon Preview Canvas */}
          <div
            className="h-64 sm:h-72 w-full bg-neutral-900/60 rounded-xl border border-neutral-800 relative cursor-grab active:cursor-grabbing overflow-hidden shadow-2xl flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <canvas ref={previewCanvasRef} className="w-full h-full" />
            <div className="absolute top-3 left-3 bg-neutral-950/80 px-2.5 py-1 rounded text-[11px] font-mono text-neutral-300 border border-neutral-800">
              DRAG TO ROTATE 360°
            </div>
            <div className="absolute bottom-3 right-3 bg-neutral-950/80 px-2.5 py-1 rounded text-[11px] font-mono text-amber-400 border border-neutral-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> {selectedSkin.name}
            </div>
          </div>

          {/* Weapon Combat Stats Breakdown */}
          <div className="bg-neutral-900/50 border border-neutral-800/80 p-4 rounded-xl flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-heading text-xl font-bold text-white">{selectedWeapon.name}</h3>
                <span className="text-[11px] font-mono uppercase text-amber-400 tracking-wider">
                  {selectedWeapon.category} // {selectedWeapon.magazineSize} ROUND MAG
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-neutral-400 uppercase font-mono">RELOAD SPEED</span>
                <p className="font-heading font-bold text-sm text-neutral-200">{selectedWeapon.reloadTime}s</p>
              </div>
            </div>

            <p className="text-neutral-400 text-xs leading-relaxed">{selectedWeapon.description}</p>

            {/* Stat Bars */}
            <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800">
              <div>
                <div className="flex justify-between text-[11px] font-mono text-neutral-400 mb-1">
                  <span>DAMAGE POTENTIAL</span>
                  <span className="text-white font-bold">{selectedWeapon.damage} PTS</span>
                </div>
                <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${Math.min(100, (selectedWeapon.damage / 110) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-neutral-400 mb-1">
                  <span>RATE OF FIRE</span>
                  <span className="text-white font-bold">{selectedWeapon.fireRate * 60} RPM</span>
                </div>
                <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${(selectedWeapon.fireRate / 16) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-neutral-400 mb-1">
                  <span>EFFECTIVE RANGE</span>
                  <span className="text-white font-bold">{selectedWeapon.range}M</span>
                </div>
                <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${(selectedWeapon.range / 300) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-neutral-400 mb-1">
                  <span>ACCURACY & CONTROL</span>
                  <span className="text-white font-bold">{Math.round(selectedWeapon.accuracy * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${selectedWeapon.accuracy * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Weapon Selection and 20+ Skins Matrix */}
        <div className="lg:col-span-7 flex flex-col gap-4 overflow-hidden">
          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-neutral-800/80">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-amber-500 text-neutral-950 shadow'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Weapon Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {filteredWeapons.map((w) => {
              const isSelected = selectedWeapon.id === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => {
                    setSelectedWeapon(w);
                    SoundEngine.playUiClick();
                  }}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 border-amber-500 ring-1 ring-amber-500 shadow-md'
                      : 'bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-heading font-bold text-sm text-white">{w.name}</span>
                    <span className="text-[10px] font-mono uppercase text-neutral-400">{w.category}</span>
                  </div>
                  <p className="text-[11px] font-mono text-amber-400 mt-1">{w.damage} DMG • {w.magazineSize} RDS</p>
                </button>
              );
            })}
          </div>

          {/* 20+ Weapon Skins Grid */}
          <div className="flex-1 flex flex-col min-h-0 pt-2 border-t border-neutral-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs uppercase font-mono tracking-wider text-neutral-400 font-bold">
                WEAPON SKINS ({WEAPON_SKINS.length} CAMOS & FINISHES)
              </span>
              <span className="text-xs font-mono text-amber-400">EQUIPPED: {selectedSkin.name}</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pb-4">
              {WEAPON_SKINS.map((skin) => {
                const isSelected = selectedSkin.id === skin.id;
                const rarityColor =
                  skin.rarity === 'Legendary'
                    ? 'text-amber-400 border-amber-500/50'
                    : skin.rarity === 'Epic'
                    ? 'text-purple-400 border-purple-500/50'
                    : skin.rarity === 'Rare'
                    ? 'text-blue-400 border-blue-500/50'
                    : 'text-neutral-400 border-neutral-700';

                return (
                  <button
                    key={skin.id}
                    onClick={() => {
                      setSelectedSkin(skin);
                      SoundEngine.playUiClick();
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-neutral-800 border-amber-500 ring-1 ring-amber-500 shadow-md'
                        : 'bg-neutral-900/50 border-neutral-800/80 hover:border-neutral-700'
                    }`}
                  >
                    {/* Skin Swatch */}
                    <div
                      className="w-full h-8 rounded mb-2 border border-white/10 shadow-inner flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${skin.baseColor} 0%, ${skin.accentColor} 100%)`,
                      }}
                    >
                      {skin.emissive && <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_6px_#67e8f9]" />}
                    </div>

                    <span className="text-xs font-heading font-semibold text-white truncate">{skin.name}</span>
                    <span className={`text-[10px] font-mono uppercase mt-0.5 ${rarityColor}`}>{skin.rarity}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
