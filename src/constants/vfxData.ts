export type EmitterType = 'muzzleFlash' | 'explosion' | 'smoke' | 'debris';

export interface ParticleDef {
  lifeTime: number;
  speed: number;
  sizeStart: number;
  sizeEnd: number;
  colorStart: string;
  colorEnd: string;
  gravity: number; // 0 for no gravity
}

export interface EmitterDef {
  particleCount: number;
  particleDef: ParticleDef;
  spread: number; // in radians, 2*PI for burst
}

export const VFX_DATA: Record<EmitterType, EmitterDef> = {
  muzzleFlash: {
    particleCount: 15,
    spread: Math.PI / 4, // Cone
    particleDef: {
      lifeTime: 0.2, // seconds
      speed: 150,
      sizeStart: 4,
      sizeEnd: 1,
      colorStart: 'rgba(255, 255, 0, 1)',
      colorEnd: 'rgba(255, 0, 0, 0)',
      gravity: 0,
    }
  },
  explosion: {
    particleCount: 50,
    spread: Math.PI * 2, // Burst
    particleDef: {
      lifeTime: 0.5,
      speed: 200,
      sizeStart: 10,
      sizeEnd: 2,
      colorStart: 'rgba(255, 100, 0, 1)',
      colorEnd: 'rgba(50, 50, 50, 0)',
      gravity: 0,
    }
  },
  smoke: {
    particleCount: 10,
    spread: Math.PI / 2,
    particleDef: {
      lifeTime: 1.0,
      speed: 50,
      sizeStart: 5,
      sizeEnd: 15,
      colorStart: 'rgba(100, 100, 100, 0.8)',
      colorEnd: 'rgba(150, 150, 150, 0)',
      gravity: -20, // Negative gravity (floats up)
    }
  },
  debris: {
    particleCount: 30,
    spread: Math.PI * 2,
    particleDef: {
      lifeTime: 1.5,
      speed: 250,
      sizeStart: 4,
      sizeEnd: 4,
      colorStart: 'rgba(150, 75, 0, 1)',
      colorEnd: 'rgba(150, 75, 0, 1)',
      gravity: 300, // Heavy debris
    }
  }
};
