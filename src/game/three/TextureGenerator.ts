import * as THREE from 'three';
import { WeaponSkinDef } from '../../types/game';

const textureCache = new Map<string, THREE.CanvasTexture>();

export class TextureGenerator {
  // Generate skin texture for weapons
  public static getSkinTexture(skin: WeaponSkinDef): THREE.CanvasTexture {
    const cacheKey = `skin_${skin.id}`;
    if (textureCache.has(cacheKey)) {
      return textureCache.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base coat
    ctx.fillStyle = skin.baseColor;
    ctx.fillRect(0, 0, 512, 512);

    if (skin.patternType === 'camo') {
      // Procedural camouflage blobs
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = i % 2 === 0 ? skin.accentColor : '#1f2421';
        ctx.beginPath();
        const cx = Math.random() * 512;
        const cy = Math.random() * 512;
        const r = 25 + Math.random() * 50;
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Secondary blobs
        ctx.beginPath();
        ctx.arc(cx + Math.random() * 30 - 15, cy + Math.random() * 30 - 15, r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (skin.patternType === 'carbon') {
      // Carbon fiber weave pattern
      ctx.strokeStyle = skin.accentColor;
      ctx.lineWidth = 3;
      for (let i = -512; i < 1024; i += 12) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 512, 512);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(i, 512);
        ctx.lineTo(i + 512, 0);
        ctx.stroke();
      }
    } else if (skin.patternType === 'cyber') {
      // Cyberpunk circuit lines
      ctx.strokeStyle = skin.accentColor;
      ctx.lineWidth = 4;
      ctx.shadowColor = skin.accentColor;
      ctx.shadowBlur = 10;
      for (let i = 0; i < 15; i++) {
        ctx.beginPath();
        let x = Math.random() * 512;
        let y = Math.random() * 512;
        ctx.moveTo(x, y);
        for (let s = 0; s < 4; s++) {
          if (Math.random() > 0.5) {
            x += (Math.random() > 0.5 ? 60 : -60);
          } else {
            y += (Math.random() > 0.5 ? 60 : -60);
          }
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else if (skin.patternType === 'digital') {
      // Digital pixels
      ctx.fillStyle = skin.accentColor;
      const size = 16;
      for (let x = 0; x < 512; x += size) {
        for (let y = 0; y < 512; y += size) {
          if (Math.random() > 0.65) {
            ctx.fillRect(x, y, size, size);
          }
        }
      }
    } else if (skin.patternType === 'lava') {
      // Molten cracks
      ctx.strokeStyle = skin.accentColor;
      ctx.lineWidth = 6;
      ctx.shadowColor = '#ff4500';
      ctx.shadowBlur = 14;
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        let x = Math.random() * 512;
        let y = Math.random() * 512;
        ctx.moveTo(x, y);
        for (let j = 0; j < 5; j++) {
          x += (Math.random() - 0.5) * 120;
          y += (Math.random() - 0.5) * 120;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else if (skin.patternType === 'damascus') {
      // Damascus steel waves
      ctx.strokeStyle = skin.accentColor;
      ctx.lineWidth = 2.5;
      for (let y = 0; y < 512; y += 8) {
        ctx.beginPath();
        for (let x = 0; x < 512; x += 10) {
          const cy = y + Math.sin(x * 0.05 + y * 0.02) * 8 + Math.cos(x * 0.02) * 5;
          if (x === 0) ctx.moveTo(x, cy);
          else ctx.lineTo(x, cy);
        }
        ctx.stroke();
      }
    } else if (skin.patternType === 'crimson') {
      // Aggressive racing stripes
      ctx.fillStyle = skin.accentColor;
      ctx.beginPath();
      ctx.moveTo(0, 100);
      ctx.lineTo(512, 350);
      ctx.lineTo(512, 420);
      ctx.lineTo(0, 170);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, 200);
      ctx.lineTo(512, 450);
      ctx.lineTo(512, 480);
      ctx.lineTo(0, 230);
      ctx.fill();
    } else if (skin.patternType === 'anodized') {
      // Gradient sheen
      const grad = ctx.createLinearGradient(0, 0, 512, 512);
      grad.addColorStop(0, skin.baseColor);
      grad.addColorStop(0.5, skin.accentColor);
      grad.addColorStop(1, '#38bdf8');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    textureCache.set(cacheKey, texture);
    return texture;
  }

  // Ground and surface textures for maps
  public static getSurfaceTexture(type: 'concrete' | 'sand' | 'grass' | 'snow' | 'metal' | 'grid' | 'rock'): THREE.CanvasTexture {
    const cacheKey = `surf_${type}`;
    if (textureCache.has(cacheKey)) {
      return textureCache.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    if (type === 'concrete') {
      ctx.fillStyle = '#374151';
      ctx.fillRect(0, 0, 256, 256);
      // Noise speckles
      for (let i = 0; i < 4000; i++) {
        const v = Math.floor(40 + Math.random() * 30);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
      }
    } else if (type === 'sand') {
      ctx.fillStyle = '#d4b483';
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 3000; i++) {
        const r = Math.floor(190 + Math.random() * 40);
        const g = Math.floor(160 + Math.random() * 35);
        const b = Math.floor(110 + Math.random() * 30);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
      }
    } else if (type === 'grass') {
      ctx.fillStyle = '#1c3d18';
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 2500; i++) {
        const g = Math.floor(45 + Math.random() * 50);
        ctx.fillStyle = `rgb(20,${g},18)`;
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 3);
      }
    } else if (type === 'snow') {
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 1500; i++) {
        const v = Math.floor(220 + Math.random() * 30);
        ctx.fillStyle = `rgb(${v},${v + 5},255)`;
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
      }
    } else if (type === 'metal') {
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, 256, 256);
      // Container stripes
      ctx.fillStyle = '#111827';
      for (let x = 0; x < 256; x += 32) {
        ctx.fillRect(x, 0, 10, 256);
      }
    } else if (type === 'grid') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 256, 256);
      ctx.strokeRect(32, 32, 192, 192);
    } else {
      ctx.fillStyle = '#78716c';
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 2000; i++) {
        const v = Math.floor(80 + Math.random() * 60);
        ctx.fillStyle = `rgb(${v},${v - 10},${v - 20})`;
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    textureCache.set(cacheKey, texture);
    return texture;
  }
}
