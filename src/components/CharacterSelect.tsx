import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CHARACTER_SKINS, WEAPONS, WEAPON_SKINS } from '../data/gameData';
import { CharacterSkinDef } from '../types/game';
import { CharacterModelFactory } from '../game/three/CharacterModel';
import { SoundEngine } from '../audio/SoundEngine';
import { UserCheck, Sparkles, Check, Shield } from 'lucide-react';

interface CharacterSelectProps {
  currentSkin: CharacterSkinDef;
  onEquip: (skin: CharacterSkinDef) => void;
  onBack: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  currentSkin,
  onEquip,
  onBack,
}) => {
  const [selectedSkin, setSelectedSkin] = useState<CharacterSkinDef>(currentSkin);
  const [previewTeam, setPreviewTeam] = useState<'blue' | 'red'>('blue');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    charModel: THREE.Group | null;
    rotY: number;
    isDragging: boolean;
    lastMouseX: number;
  } | null>(null);

  // 3D Character Viewport
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const width = canvas.parentElement?.clientWidth || 500;
    const height = canvas.parentElement?.clientHeight || 450;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 1.2, 3.2);

    // Studio Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222222, 1.1);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(2, 4, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 3.2);
    rimLight.position.set(-2, 2, -2);
    scene.add(rimLight);

    // Subtle reflective pedestal
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.3, 0.1, 32),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3, metalness: 0.7 })
    );
    pedestal.position.y = -0.05;
    scene.add(pedestal);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      charModel: null,
      rotY: 0,
      isDragging: false,
      lastMouseX: 0,
    };

    let animId = 0;
    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      if (sceneRef.current) {
        if (!sceneRef.current.isDragging && sceneRef.current.charModel) {
          sceneRef.current.rotY += 0.006;
          sceneRef.current.charModel.rotation.y = sceneRef.current.rotY;
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

  // Update 3D Character model
  useEffect(() => {
    if (!sceneRef.current) return;
    const { scene } = sceneRef.current;

    if (sceneRef.current.charModel) {
      scene.remove(sceneRef.current.charModel);
    }

    const { root } = CharacterModelFactory.createCharacter(
      selectedSkin,
      previewTeam,
      WEAPONS[0],
      WEAPON_SKINS[0],
      'OPERATOR'
    );
    root.rotation.y = sceneRef.current.rotY;
    scene.add(root);
    sceneRef.current.charModel = root;
  }, [selectedSkin, previewTeam]);

  // Drag rotate
  const handleMouseDown = (e: React.MouseEvent) => {
    if (sceneRef.current) {
      sceneRef.current.isDragging = true;
      sceneRef.current.lastMouseX = e.clientX;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (sceneRef.current && sceneRef.current.isDragging && sceneRef.current.charModel) {
      const dx = e.clientX - sceneRef.current.lastMouseX;
      sceneRef.current.rotY += dx * 0.01;
      sceneRef.current.charModel.rotation.y = sceneRef.current.rotY;
      sceneRef.current.lastMouseX = e.clientX;
    }
  };

  const handleMouseUp = () => {
    if (sceneRef.current) sceneRef.current.isDragging = false;
  };

  const isEquipped = currentSkin.id === selectedSkin.id;

  return (
    <div className="absolute inset-0 bg-neutral-950/95 backdrop-blur-xl z-30 flex flex-col p-6 overflow-hidden">
      {/* Top Header */}
      <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
        <div>
          <h2 className="font-heading text-2xl font-bold text-white tracking-wider flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-amber-400" /> OPERATOR ROSTER (12 TACTICAL SKINS)
          </h2>
          <p className="text-neutral-400 text-xs">Choose your combat specialist and inspect high-threat tactical gear</p>
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
              onEquip(selectedSkin);
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
            {isEquipped ? 'OPERATOR ACTIVE' : 'SELECT OPERATOR'}
          </button>
        </div>
      </div>

      {/* Main Grid: Left 3D Character View, Right 12 Operators */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 my-4 overflow-hidden">
        {/* Left Column (5 cols): 3D Viewport & Operator Intel */}
        <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto">
          {/* 3D Character Preview Canvas */}
          <div
            className="h-72 sm:h-80 w-full bg-neutral-900/60 rounded-xl border border-neutral-800 relative cursor-grab active:cursor-grabbing overflow-hidden shadow-2xl flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <canvas ref={canvasRef} className="w-full h-full" />
            <div className="absolute top-3 left-3 bg-neutral-950/80 px-2.5 py-1 rounded text-[11px] font-mono text-neutral-300 border border-neutral-800">
              DRAG TO ROTATE 360°
            </div>

            {/* Team preview switch */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-neutral-950/80 p-1 rounded border border-neutral-800">
              <button
                onClick={() => setPreviewTeam('blue')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  previewTeam === 'blue' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                BLUE
              </button>
              <button
                onClick={() => setPreviewTeam('red')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  previewTeam === 'red' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                RED
              </button>
            </div>

            <div className="absolute bottom-3 right-3 bg-neutral-950/80 px-2.5 py-1 rounded text-[11px] font-mono text-amber-400 border border-neutral-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> {selectedSkin.role}
            </div>
          </div>

          {/* Operator Intel Card */}
          <div className="bg-neutral-900/50 border border-neutral-800/80 p-4 rounded-xl flex flex-col gap-2.5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-heading text-xl font-bold text-white">{selectedSkin.name}</h3>
                <span className="text-[11px] font-mono uppercase text-amber-400 tracking-wider">
                  ROLE: {selectedSkin.role}
                </span>
              </div>
              <span className="px-2.5 py-1 bg-neutral-800 border border-neutral-700 rounded text-[11px] font-mono text-neutral-300 uppercase">
                {selectedSkin.modelStyle}
              </span>
            </div>

            <p className="text-neutral-400 text-xs leading-relaxed">{selectedSkin.description}</p>
          </div>
        </div>

        {/* Right Column (7 cols): 12 Character Cards */}
        <div className="lg:col-span-7 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pb-6">
            {CHARACTER_SKINS.map((skin) => {
              const isSelected = selectedSkin.id === skin.id;
              return (
                <button
                  key={skin.id}
                  onClick={() => {
                    setSelectedSkin(skin);
                    SoundEngine.playUiClick();
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-neutral-900 border-amber-500 ring-1 ring-amber-500 shadow-xl'
                      : 'bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/70'
                  }`}
                >
                  <div>
                    {/* Color Swatch Bar */}
                    <div className="flex gap-1.5 mb-2.5">
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: skin.primaryColor }} />
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: skin.secondaryColor }} />
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: skin.accentColor }} />
                      {skin.visorGlow && (
                        <span
                          className="w-4 h-4 rounded shadow-[0_0_8px_currentColor]"
                          style={{ backgroundColor: skin.visorGlow }}
                        />
                      )}
                    </div>

                    <h4 className="font-heading font-bold text-sm text-white">{skin.name}</h4>
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block mt-0.5">
                      {skin.role}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-400 line-clamp-2 mt-2 leading-relaxed">
                    {skin.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
