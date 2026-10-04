import type { Vector2 } from '../models/types';
import { VFX_DATA, type EmitterType } from '../constants/vfxData';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  lifeTime: number;
  maxLifeTime: number;
  sizeStart: number;
  sizeEnd: number;
  colorStart: [number, number, number, number]; // RGBA
  colorEnd: [number, number, number, number];
  gravity: number;
}

const parseColor = (colorStr: string): [number, number, number, number] => {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (match) {
    return [
      parseInt(match[1]),
      parseInt(match[2]),
      parseInt(match[3]),
      match[4] ? parseFloat(match[4]) : 1.0
    ];
  }
  return [255, 255, 255, 1];
};

class ParticleEngine {
  public particles: Particle[] = [];

  // Typed array fallback could be used here for memory, but objects are fine for 10k mostly if memory allows and we don't GC thrash too much.
  // We can preallocate a pool if needed.
  private particlePool: Particle[] = [];

  constructor() {
    for (let i = 0; i < 15000; i++) {
      this.particlePool.push({
        x: 0, y: 0, vx: 0, vy: 0,
        lifeTime: 0, maxLifeTime: 0,
        sizeStart: 0, sizeEnd: 0,
        colorStart: [0, 0, 0, 0], colorEnd: [0, 0, 0, 0],
        gravity: 0
      });
    }
  }

  public spawnEmitter(type: EmitterType, position: Vector2, direction?: Vector2) {
    const def = VFX_DATA[type];
    if (!def) return;

    let baseAngle = 0;
    if (direction) {
      baseAngle = Math.atan2(direction.y, direction.x);
    }

    const cStart = parseColor(def.particleDef.colorStart);
    const cEnd = parseColor(def.particleDef.colorEnd);

    for (let i = 0; i < def.particleCount; i++) {
      let p: Particle;
      if (this.particlePool.length > 0) {
        p = this.particlePool.pop()!;
      } else {
        // Pool exhausted, fallback to new object
        p = {
          x: 0, y: 0, vx: 0, vy: 0,
          lifeTime: 0, maxLifeTime: 0,
          sizeStart: 0, sizeEnd: 0,
          colorStart: [0, 0, 0, 0], colorEnd: [0, 0, 0, 0],
          gravity: 0
        };
      }

      const angle = baseAngle + (Math.random() - 0.5) * def.spread;
      const speed = def.particleDef.speed * (0.5 + Math.random() * 0.5);

      p.x = position.x;
      p.y = position.y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.lifeTime = def.particleDef.lifeTime * (0.8 + Math.random() * 0.4);
      p.maxLifeTime = p.lifeTime;
      p.sizeStart = def.particleDef.sizeStart;
      p.sizeEnd = def.particleDef.sizeEnd;
      p.colorStart[0] = cStart[0]; p.colorStart[1] = cStart[1]; p.colorStart[2] = cStart[2]; p.colorStart[3] = cStart[3];
      p.colorEnd[0] = cEnd[0]; p.colorEnd[1] = cEnd[1]; p.colorEnd[2] = cEnd[2]; p.colorEnd[3] = cEnd[3];
      p.gravity = def.particleDef.gravity;

      this.particles.push(p);
    }
  }

  public update(dt: number) {
    const dtSeconds = dt / 1000;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.lifeTime -= dtSeconds;

      if (p.lifeTime <= 0) {
        // Return to pool
        this.particlePool.push(p);
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
        continue;
      }

      p.vy += p.gravity * dtSeconds;
      p.x += p.vx * dtSeconds;
      p.y += p.vy * dtSeconds;
    }
  }

  public getParticles() {
    return this.particles;
  }
}

export const particleSystem = new ParticleEngine();
