import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { particleSystem } from '../../systems/particles';

const ParticleRenderer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = 0;

    const render = (time: number) => {
      if (lastTime === 0) lastTime = time;
      const dt = time - lastTime;
      lastTime = time;

      const viewport = useGameStore.getState().viewport;

      // Update particles physics directly in the renderer loop
      // to detach them from Zustand's fixed game tick update which might be 30fps
      // Particles look better smooth at 60fps
      particleSystem.update(dt);

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(viewport.scale, viewport.scale);
      ctx.translate(-viewport.x, -viewport.y);

      const particles = particleSystem.getParticles();

      // Since global alpha + composite operations can be slow for 10k particles,
      // we optimize by avoiding them or only using where necessary.

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Skip rendering if outside viewport (Frustum culling for particles)
        // Adding a bit of padding for large particles
        const halfW = (canvas.width / 2) / viewport.scale;
        const halfH = (canvas.height / 2) / viewport.scale;

        if (p.x < viewport.x - halfW - 20 || p.x > viewport.x + halfW + 20 ||
            p.y < viewport.y - halfH - 20 || p.y > viewport.y + halfH + 20) {
            continue;
        }

        const t = 1.0 - (p.lifeTime / p.maxLifeTime); // 0 to 1

        const size = p.sizeStart + (p.sizeEnd - p.sizeStart) * t;
        const r = Math.floor(p.colorStart[0] + (p.colorEnd[0] - p.colorStart[0]) * t);
        const g = Math.floor(p.colorStart[1] + (p.colorEnd[1] - p.colorStart[1]) * t);
        const b = Math.floor(p.colorStart[2] + (p.colorEnd[2] - p.colorStart[2]) * t);
        const a = p.colorStart[3] + (p.colorEnd[3] - p.colorStart[3]) * t;

        ctx.fillStyle = `rgba(${r},${g},${b},${a})`;

        // Avoid ctx.beginPath() + arc() for simple particles as it's slow. Use fillRect.
        // We simulate a circle by just drawing a square for performance, or we can use arc if needed.
        // Let's use squares for small particles, arc for large ones.
        if (size > 4) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(p.x - size/2, p.y - size/2, size, size);
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ display: 'block', position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 5 }} />;
};

export default ParticleRenderer;