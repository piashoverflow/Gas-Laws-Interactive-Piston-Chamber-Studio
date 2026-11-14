import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Lock, MoveVertical } from 'lucide-react';
import { RELIEF_VALVE_ATM, type Language, type ModuleId } from '../types';
import { TRANSLATIONS } from '../i18n';
import {
  clamp,
  getCylinderMaxVolume,
  getRmsSpeedPx,
  getTemperatureParticleColor,
} from '../physics/gasPhysics';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

interface CollisionFlash {
  x: number;
  y: number;
  life: number; // 1.0 -> 0.0
  nx: number;
  ny: number;
}

interface SteamPuff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  r: number;
}

interface PistonChamberCanvasProps {
  lang: Language;
  moduleId: ModuleId;
  P: number;
  V: number;
  T: number;
  n: number;
  weightCount: number;
  isPlaying: boolean;
  slowMo: boolean;
  stepTrigger: number;
  isSandboxUnlocked: boolean;
  onDragVolume: (newV: number) => void;
  onCollisionRateUpdate: (rate: number) => void;
}

export const PistonChamberCanvas: React.FC<PistonChamberCanvasProps> = ({
  lang,
  moduleId,
  P,
  V,
  T,
  n,
  weightCount,
  isPlaying,
  slowMo,
  stepTrigger,
  isSandboxUnlocked,
  onDragVolume,
  onCollisionRateUpdate,
}) => {
  const t = TRANSLATIONS[lang];
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Physics state stored in refs for 60 FPS lock-free animation loop
  const particlesRef = useRef<Particle[]>([]);
  const flashesRef = useRef<CollisionFlash[]>([]);
  const steamRef = useRef<SteamPuff[]>([]);
  const collisionRateRef = useRef<number>(0);
  const collisionAccumulatorRef = useRef<number>(0);
  const lastRateReportRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const [isHoveringPiston, setIsHoveringPiston] = useState(false);
  const [isDraggingUI, setIsDraggingUI] = useState(false);

  // Latest props in ref so animation frame reads current values without tearing down loop
  const stateRef = useRef({
    moduleId,
    P,
    V,
    T,
    n,
    weightCount,
    isPlaying,
    slowMo,
    isSandboxUnlocked,
    lang,
  });

  useEffect(() => {
    stateRef.current = {
      moduleId,
      P,
      V,
      T,
      n,
      weightCount,
      isPlaying,
      slowMo,
      isSandboxUnlocked,
      lang,
    };
  }, [moduleId, P, V, T, n, weightCount, isPlaying, slowMo, isSandboxUnlocked, lang]);

  const canDragPiston =
    moduleId === 'boyle' || (moduleId === 'gaylussac' && isSandboxUnlocked);
  const isLocked = moduleId === 'gaylussac' && !isSandboxUnlocked;
  const maxV = getCylinderMaxVolume(V, moduleId);

  // Compute cylinder geometry given canvas logical CSS width & height
  const getGeometry = (width: number, height: number) => {
    const cylW = Math.min(280, Math.max(190, width * 0.44));
    const cylX = (width - cylW) / 2;
    const cylTop = 74;
    const cylBottom = height - 96;
    const cylH = Math.max(220, cylBottom - cylTop);
    return { cylX, cylW, cylTop, cylBottom, cylH };
  };

  // Sync particle count and speed whenever n or T changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { cylX, cylW, cylBottom, cylH } = getGeometry(rect.width || 500, rect.height || 540);
    const curMaxV = getCylinderMaxVolume(V, moduleId);
    const frac = clamp(V / curMaxV, 0.05, 0.96);
    const pistonY = cylBottom - frac * cylH;

    const targetCount = Math.max(18, Math.round(n * 42));
    const rms = getRmsSpeedPx(T);
    const list = particlesRef.current;

    // Add missing particles
    while (list.length < targetCount) {
      const angle = Math.random() * Math.PI * 2;
      const speed = rms * (0.65 + Math.random() * 0.7);
      const r = 4.2;
      list.push({
        x: cylX + r + 8 + Math.random() * Math.max(20, cylW - 2 * r - 16),
        y: pistonY + r + 8 + Math.random() * Math.max(20, cylBottom - pistonY - 2 * r - 16),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r,
      });
    }
    // Remove excess particles
    if (list.length > targetCount) {
      list.length = targetCount;
    }

    // Rescale velocities smoothly so RMS speed matches sqrt(T)
    if (list.length > 0) {
      let sumSq = 0;
      for (const p of list) sumSq += p.vx * p.vx + p.vy * p.vy;
      const currentRms = Math.sqrt(sumSq / list.length);
      if (currentRms > 1) {
        const scale = rms / currentRms;
        for (const p of list) {
          p.vx *= scale;
          p.vy *= scale;
        }
      }
    }
  }, [n, T, moduleId, V]);

  // Physics step helper (used both in rAF loop and single-step button)
  const advancePhysics = (dt: number, width: number, height: number) => {
    const st = stateRef.current;
    const { cylX, cylW, cylBottom, cylH } = getGeometry(width, height);
    const curMaxV = getCylinderMaxVolume(st.V, st.moduleId);
    const frac = clamp(st.V / curMaxV, 0.05, 0.96);
    const pistonY = cylBottom - frac * cylH;

    const minX = cylX + 6;
    const maxX = cylX + cylW - 6;
    const minY = pistonY + 6;
    const maxY = cylBottom - 6;

    const particles = particlesRef.current;
    const flashes = flashesRef.current;

    // Sub-step to guarantee zero tunneling at high speeds or tiny volumes
    const subSteps = 3;
    const subDt = dt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx * subDt;
        p.y += p.vy * subDt;

        // Left / Right elastic wall collisions
        if (p.x - p.r < minX) {
          p.x = minX + p.r;
          p.vx = Math.abs(p.vx);
          collisionAccumulatorRef.current += 1;
          if (flashes.length < 40) flashes.push({ x: minX, y: p.y, life: 1, nx: 1, ny: 0 });
        } else if (p.x + p.r > maxX) {
          p.x = maxX - p.r;
          p.vx = -Math.abs(p.vx);
          collisionAccumulatorRef.current += 1;
          if (flashes.length < 40) flashes.push({ x: maxX, y: p.y, life: 1, nx: -1, ny: 0 });
        }

        // Top (Piston underside) / Bottom elastic wall collisions
        if (p.y - p.r < minY) {
          p.y = minY + p.r;
          p.vy = Math.abs(p.vy);
          collisionAccumulatorRef.current += 1;
          if (flashes.length < 40) flashes.push({ x: p.x, y: minY, life: 1, nx: 0, ny: 1 });
        } else if (p.y + p.r > maxY) {
          p.y = maxY - p.r;
          p.vy = -Math.abs(p.vy);
          collisionAccumulatorRef.current += 1;
          if (flashes.length < 40) flashes.push({ x: p.x, y: maxY, life: 1, nx: 0, ny: -1 });
        }
      }

      // Elastic particle-particle collisions (equal mass)
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const minDist = a.r + b.r;
          const distSq = dx * dx + dy * dy;
          if (distSq > 0.0001 && distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq);
            const nx = dx / dist;
            const ny = dy / dist;
            // Separate overlap
            const overlap = 0.5 * (minDist - dist);
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            b.x += nx * overlap;
            b.y += ny * overlap;

            // Relative velocity along normal
            const rvx = b.vx - a.vx;
            const rvy = b.vy - a.vy;
            const velAlongNormal = rvx * nx + rvy * ny;
            if (velAlongNormal < 0) {
              const jImpulse = -velAlongNormal;
              a.vx -= jImpulse * nx;
              a.vy -= jImpulse * ny;
              b.vx += jImpulse * nx;
              b.vy += jImpulse * ny;
            }
          }
        }
      }
    }

    // Decay collision flashes
    for (let i = flashes.length - 1; i >= 0; i--) {
      flashes[i].life -= dt * 4.2;
      if (flashes[i].life <= 0) flashes.splice(i, 1);
    }

    // Safety relief valve steam puffs when P > 12 atm in Module 3
    const steam = steamRef.current;
    if (st.moduleId === 'gaylussac' && st.P > RELIEF_VALVE_ATM && Math.random() < 0.45) {
      steam.push({
        x: cylX + cylW + 24,
        y: pistonY - 6,
        vx: 38 + Math.random() * 35,
        vy: -25 - Math.random() * 30,
        life: 1,
        r: 4 + Math.random() * 4,
      });
    }
    for (let i = steam.length - 1; i >= 0; i--) {
      steam[i].x += steam[i].vx * dt;
      steam[i].y += steam[i].vy * dt;
      steam[i].r += dt * 10;
      steam[i].life -= dt * 1.6;
      if (steam[i].life <= 0) steam.splice(i, 1);
    }
  };

  // Single-step trigger when paused
  useEffect(() => {
    if (stepTrigger === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    advancePhysics(0.025, rect.width, rect.height);
  }, [stepTrigger]);

  // Main 60 FPS requestAnimationFrame render loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const renderFrame = (now: number) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) {
        rafId = requestAnimationFrame(renderFrame);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      const width = Math.max(300, Math.floor(rect.width));
      const height = Math.max(460, Math.floor(rect.height));

      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafId = requestAnimationFrame(renderFrame);
        return;
      }

      const rawDt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;

      const st = stateRef.current;
      const simDt = st.isPlaying ? rawDt * (st.slowMo ? 0.35 : 1.0) : 0;

      if (simDt > 0) {
        advancePhysics(simDt, width, height);
      }

      // Report smoothed wall-collision frequency every ~220ms
      if (now - lastRateReportRef.current > 220) {
        const elapsedSec = (now - lastRateReportRef.current) / 1000;
        const instantRate =
          st.isPlaying && elapsedSec > 0
            ? collisionAccumulatorRef.current / (elapsedSec * (st.slowMo ? 0.35 : 1.0))
            : collisionRateRef.current;
        collisionRateRef.current = collisionRateRef.current * 0.55 + instantRate * 0.45;
        collisionAccumulatorRef.current = 0;
        lastRateReportRef.current = now;
        onCollisionRateUpdate(collisionRateRef.current);
      }

      // --- DRAW SCENE ---
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Subtle blueprint coordinate grid background
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.08)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < width; gx += 28) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = 0; gy < height; gy += 28) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      const { cylX, cylW, cylTop, cylBottom, cylH } = getGeometry(width, height);
      const curMaxV = getCylinderMaxVolume(st.V, st.moduleId);
      const frac = clamp(st.V / curMaxV, 0.05, 0.96);
      const pistonY = cylBottom - frac * cylH;

      // 1. THERMAL SOURCE BELOW CYLINDER
      const baseTop = cylBottom + 6;
      const baseH = 16;

      // Thermal condition rendering
      if (st.moduleId === 'boyle') {
        // Constant-temperature circulating water bath collar around lower base
        ctx.fillStyle = 'rgba(14, 165, 233, 0.16)';
        ctx.strokeStyle = 'rgba(2, 132, 199, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(cylX - 18, baseTop + 4, cylW + 36, 38, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0369a1';
        ctx.font = '600 11px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${TRANSLATIONS[st.lang].canvas.isothermalBath} (${st.T.toFixed(0)} K)`,
          cylX + cylW / 2,
          baseTop + 27
        );
      } else {
        // Burner or Ice Bath based on temperature
        if (st.T > 315) {
          // Animated flames
          const intensity = clamp((st.T - 315) / 350, 0.2, 1.0);
          const flameCount = 5;
          for (let f = 0; f < flameCount; f++) {
            const fx = cylX + 26 + (f * (cylW - 52)) / (flameCount - 1);
            const flicker = Math.sin(now * 0.015 + f * 1.7) * 4;
            const fh = 18 + intensity * 22 + flicker;

            const grad = ctx.createRadialGradient(fx, baseTop + 38, 2, fx, baseTop + 26, fh);
            grad.addColorStop(0, '#fef08a');
            grad.addColorStop(0.45, '#f97316');
            grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(fx, baseTop + 34 - fh * 0.35, 13, fh * 0.55, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#c2410c';
          ctx.font = '600 11px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(
            TRANSLATIONS[st.lang].canvas.burnerActive,
            cylX + cylW / 2,
            baseTop + 62
          );
        } else if (st.T < 273.15) {
          // Cryogenic Ice Blocks
          const iceCold = clamp((273.15 - st.T) / 250, 0.25, 1.0);
          ctx.fillStyle = `rgba(186, 230, 253, ${0.4 + iceCold * 0.45})`;
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 1.2;
          for (let b = 0; b < 5; b++) {
            const bx = cylX + 12 + b * ((cylW - 24) / 5);
            ctx.beginPath();
            ctx.roundRect(bx + 2, baseTop + 18, (cylW - 34) / 5, 22, 5);
            ctx.fill();
            ctx.stroke();
          }
          ctx.fillStyle = '#0369a1';
          ctx.font = '600 11px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(
            TRANSLATIONS[st.lang].canvas.iceBathActive,
            cylX + cylW / 2,
            baseTop + 60
          );
        } else {
          ctx.fillStyle = '#475569';
          ctx.font = '500 11px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(
            TRANSLATIONS[st.lang].canvas.ambientBase,
            cylX + cylW / 2,
            baseTop + 36
          );
        }
      }

      // Metallic Cylinder Base Plate
      const baseGrad = ctx.createLinearGradient(cylX - 10, baseTop, cylX + cylW + 10, baseTop);
      baseGrad.addColorStop(0, '#475569');
      baseGrad.addColorStop(0.5, '#94a3b8');
      baseGrad.addColorStop(1, '#475569');
      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.roundRect(cylX - 12, cylBottom, cylW + 24, baseH, 5);
      ctx.fill();

      // 2. CHAMBER INTERIOR WASH (subtle thermal tint)
      const pColor = getTemperatureParticleColor(st.T);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(cylX, cylTop, cylW, cylH);

      // Gas region subtle tint below piston
      const gasGrad = ctx.createLinearGradient(cylX, pistonY, cylX, cylBottom);
      gasGrad.addColorStop(0, 'rgba(224, 242, 254, 0.35)');
      gasGrad.addColorStop(1, pColor.glow.replace(/0\.\d+\)$/, '0.12)'));
      ctx.fillStyle = gasGrad;
      ctx.fillRect(cylX + 3, pistonY, cylW - 6, cylBottom - pistonY);

      // 3. ELASTIC MOLECULES
      for (const p of particlesRef.current) {
        // Clip safely inside chamber
        const px = clamp(p.x, cylX + p.r + 4, cylX + cylW - p.r - 4);
        const py = clamp(p.y, pistonY + p.r + 3, cylBottom - p.r - 3);

        // Glow
        ctx.fillStyle = pColor.glow;
        ctx.beginPath();
        ctx.arc(px, py, p.r * 1.75, 0, Math.PI * 2);
        ctx.fill();

        // Main sphere
        ctx.fillStyle = pColor.fill;
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fill();

        // Specular highlight
        ctx.fillStyle = pColor.core;
        ctx.beginPath();
        ctx.arc(px - p.r * 0.3, py - p.r * 0.3, p.r * 0.32, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. WALL COLLISION FLASHES
      for (const fl of flashesRef.current) {
        ctx.fillStyle = `rgba(16, 185, 129, ${fl.life * 0.85})`;
        ctx.beginPath();
        ctx.arc(fl.x, fl.y, 3 + (1 - fl.life) * 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. GRADUATED GLASS WALLS & VOLUME SCALE TICKS
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cylX, cylTop);
      ctx.lineTo(cylX, cylBottom);
      ctx.moveTo(cylX + cylW, cylTop);
      ctx.lineTo(cylX + cylW, cylBottom);
      ctx.stroke();

      // Glass sheen reflection
      const glassSheen = ctx.createLinearGradient(cylX, 0, cylX + 26, 0);
      glassSheen.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
      glassSheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glassSheen;
      ctx.fillRect(cylX + 4, cylTop, 22, cylH);

      // Volume Graduation Ruler Marks (Right side of cylinder)
      const majorStep = curMaxV <= 12 ? 2 : curMaxV <= 24 ? 4 : 8;
      const minorStep = majorStep / 2;
      ctx.font = '600 10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';

      for (let volTick = 0; volTick <= curMaxV; volTick += minorStep) {
        const ty = cylBottom - (volTick / curMaxV) * cylH;
        const isMajor = Math.abs(volTick % majorStep) < 0.01;
        ctx.strokeStyle = isMajor ? '#0f172a' : '#64748b';
        ctx.lineWidth = isMajor ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(cylX + cylW - (isMajor ? 14 : 8), ty);
        ctx.lineTo(cylX + cylW, ty);
        ctx.stroke();

        if (isMajor && volTick > 0) {
          ctx.fillStyle = '#0f172a';
          ctx.fillText(`${volTick} L`, cylX + cylW + 8, ty + 3.5);
        }
      }

      // 6. FRICTIONLESS METALLIC PISTON HEAD + ROD + INTERACTIVE HANDLE
      const pistonH = 22;
      const pistonTop = pistonY - pistonH;

      // Piston rod going up
      const rodGrad = ctx.createLinearGradient(
        cylX + cylW / 2 - 7,
        0,
        cylX + cylW / 2 + 7,
        0
      );
      rodGrad.addColorStop(0, '#64748b');
      rodGrad.addColorStop(0.5, '#e2e8f0');
      rodGrad.addColorStop(1, '#475569');
      ctx.fillStyle = rodGrad;
      ctx.fillRect(cylX + cylW / 2 - 6, Math.max(20, pistonTop - 52), 12, 52);

      // Top Handle / Weight Platform
      const platW = 104;
      const platX = cylX + cylW / 2 - platW / 2;
      const platY = Math.max(16, pistonTop - 56);
      ctx.fillStyle = isHoveringPiston || isDraggingUI ? '#059669' : '#334155';
      ctx.beginPath();
      ctx.roundRect(platX, platY, platW, 10, 4);
      ctx.fill();

      // Slotted Brass Weights stacked visibly in Module 1
      if (st.moduleId === 'boyle' && st.weightCount > 0) {
        const visibleWeights = Math.min(st.weightCount, 8);
        for (let w = 0; w < visibleWeights; w++) {
          const wy = platY - (w + 1) * 9;
          const wGrad = ctx.createLinearGradient(platX + 12, wy, platX + platW - 12, wy);
          wGrad.addColorStop(0, '#b45309');
          wGrad.addColorStop(0.5, '#fbbf24');
          wGrad.addColorStop(1, '#92400e');
          ctx.fillStyle = wGrad;
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(platX + 14, wy, platW - 28, 8, 2);
          ctx.fill();
          ctx.stroke();
        }
      }

      // Main Piston Head Body
      const headGrad = ctx.createLinearGradient(cylX + 2, pistonTop, cylX + cylW - 2, pistonTop);
      headGrad.addColorStop(0, '#475569');
      headGrad.addColorStop(0.35, '#cbd5e1');
      headGrad.addColorStop(0.65, '#f1f5f9');
      headGrad.addColorStop(1, '#334155');
      ctx.fillStyle = headGrad;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cylX + 3, pistonTop, cylW - 6, pistonH, 3);
      ctx.fill();
      ctx.stroke();

      // Dual O-Ring Seals
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cylX + 2, pistonTop + 5, 4, 4);
      ctx.fillRect(cylX + cylW - 6, pistonTop + 5, 4, 4);
      ctx.fillRect(cylX + 2, pistonTop + 13, 4, 4);
      ctx.fillRect(cylX + cylW - 6, pistonTop + 13, 4, 4);

      // Live Volume label inside piston head
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 11px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`V = ${st.V.toFixed(2)} L`, cylX + cylW / 2, pistonTop + 15);

      // 7. MODULE 3: MECHANICAL LOCKING PINS & SAFETY RELIEF VALVE
      if (st.moduleId === 'gaylussac') {
        if (!st.isSandboxUnlocked) {
          // Draw heavy steel locking pins clamping piston head
          ctx.fillStyle = '#dc2626';
          ctx.strokeStyle = '#7f1d1d';
          ctx.lineWidth = 1.5;
          // Left pin
          ctx.beginPath();
          ctx.roundRect(cylX - 18, pistonTop + 6, 26, 9, 3);
          ctx.fill();
          ctx.stroke();
          // Right pin
          ctx.beginPath();
          ctx.roundRect(cylX + cylW - 8, pistonTop + 6, 26, 9, 3);
          ctx.fill();
          ctx.stroke();
        }

        // Relief Valve Manifold on right side of piston/chamber
        const isOver = st.P > RELIEF_VALVE_ATM;
        ctx.fillStyle = isOver ? '#e11d48' : '#475569';
        ctx.beginPath();
        ctx.roundRect(cylX + cylW + 2, pistonY - 12, 18, 12, 3);
        ctx.fill();
        if (isOver) {
          // Animated valve poppet open
          ctx.fillStyle = '#fda4af';
          ctx.fillRect(cylX + cylW + 20, pistonY - 10, 6, 8);
        }
      }

      // 8. STEAM PUFFS (if relief valve open)
      for (const sp of steamRef.current) {
        ctx.fillStyle = `rgba(226, 232, 240, ${sp.life * 0.75})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [onCollisionRateUpdate, isHoveringPiston, isDraggingUI]);

  // Pointer dragging on piston
  const updateVolumeFromPointerY = (clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const y = clientY - rect.top;
    const { cylBottom, cylH } = getGeometry(rect.width, rect.height);
    const frac = clamp((cylBottom - y) / cylH, 0.08, 0.92);
    const rawV = frac * maxV;
    const clampedV =
      moduleId === 'boyle' ? clamp(rawV, 1.0, 10.0) : clamp(rawV, 1.5, 10.0);
    onDragVolume(Math.round(clampedV * 10) / 10);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canDragPiston) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const x = e.clientX - rect.left;
    const { cylX, cylW, cylBottom, cylH } = getGeometry(rect.width, rect.height);
    const frac = clamp(V / maxV, 0.05, 0.96);
    const pistonY = cylBottom - frac * cylH;

    // Hit test near piston head, rod, or platform
    if (
      x >= cylX - 15 &&
      x <= cylX + cylW + 15 &&
      y >= pistonY - 90 &&
      y <= pistonY + 24
    ) {
      isDraggingRef.current = true;
      setIsDraggingUI(true);
      canvas.setPointerCapture(e.pointerId);
      updateVolumeFromPointerY(e.clientY);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (isDraggingRef.current) {
      updateVolumeFromPointerY(e.clientY);
      return;
    }
    if (!canDragPiston) {
      if (isHoveringPiston) setIsHoveringPiston(false);
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const x = e.clientX - rect.left;
    const { cylX, cylW, cylBottom, cylH } = getGeometry(rect.width, rect.height);
    const frac = clamp(V / maxV, 0.05, 0.96);
    const pistonY = cylBottom - frac * cylH;

    const over =
      x >= cylX - 15 &&
      x <= cylX + cylW + 15 &&
      y >= pistonY - 90 &&
      y <= pistonY + 24;
    if (over !== isHoveringPiston) setIsHoveringPiston(over);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDraggingUI(false);
      try {
        canvasRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        // ignore if already released
      }
    }
  };

  const isOverPressure = moduleId === 'gaylussac' && P > RELIEF_VALVE_ATM;
  const particleCount = Math.max(18, Math.round(n * 42));

  return (
    <div className="flex-1 min-w-0 bg-white border border-sky-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
      {/* Stage Top Strip */}
      <div className="px-4 py-2.5 border-b border-sky-100 flex flex-wrap items-center justify-between gap-2 bg-sky-50/50">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
          {isLocked ? (
            <Lock className="w-4 h-4 text-rose-600" />
          ) : canDragPiston ? (
            <MoveVertical className="w-4 h-4 text-emerald-700" />
          ) : null}
          <span>{t.canvas.cylinderLabel}</span>
          <span className="text-slate-400">·</span>
          <span className="font-medium text-slate-600">
            {isLocked
              ? t.canvas.pistonLocked
              : canDragPiston
              ? t.canvas.pistonDraggable
              : t.canvas.pistonFloating}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-slate-700">
          <span>
            {t.canvas.moleculesCount}: <strong className="text-slate-950">{particleCount}</strong>
          </span>
          {moduleId === 'boyle' && (
            <>
              <span className="text-slate-300">|</span>
              <span>
                {t.canvas.weightsLabel}: <strong className="text-amber-700">+{weightCount} atm</strong>
              </span>
            </>
          )}
        </div>
      </div>

      {/* High-Pressure Relief Valve Alert Strip (Module 3) */}
      {moduleId === 'gaylussac' && (
        <div
          className={`px-4 py-1.5 border-b text-xs font-semibold flex items-center justify-between gap-2 ${
            isOverPressure
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50/70 border-emerald-100 text-emerald-800'
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            {isOverPressure ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            )}
            <span>
              {isOverPressure ? t.canvas.reliefValveWarning : t.canvas.reliefValveNominal}
            </span>
          </span>
          <span className="font-mono tabular-nums">P = {P.toFixed(2)} atm</span>
        </div>
      )}

      {/* High-DPI Retina Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[480px] lg:min-h-[560px] w-full select-none touch-none"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`block w-full h-full ${
            isDraggingUI
              ? 'cursor-grabbing'
              : isHoveringPiston && canDragPiston
              ? 'cursor-ns-resize'
              : 'cursor-default'
          }`}
        />
      </div>
    </div>
  );
};
