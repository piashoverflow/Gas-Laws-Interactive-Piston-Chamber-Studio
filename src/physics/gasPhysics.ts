import { KELVIN_OFFSET, R_ATM } from '../types';

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function celsiusToKelvin(c: number): number {
  return c + KELVIN_OFFSET;
}

export function kelvinToCelsius(k: number): number {
  return k - KELVIN_OFFSET;
}

export function computePressureAtm(n: number, T: number, V: number): number {
  const safeV = Math.max(0.2, V);
  return (n * R_ATM * T) / safeV;
}

export function computeVolumeL(n: number, T: number, P: number): number {
  const safeP = Math.max(0.2, P);
  return (n * R_ATM * T) / safeP;
}

export function computeTempK(P: number, V: number, n: number): number {
  const safeN = Math.max(0.1, n);
  return (P * V) / (safeN * R_ATM);
}

/**
 * Returns a clean, crisp graduated cylinder maximum scale in Liters
 * so the piston never exceeds the chamber top.
 */
export function getCylinderMaxVolume(currentV: number, moduleId: string): number {
  if (moduleId === 'boyle') return 12.0;
  if (currentV <= 11.0) return 12.0;
  if (currentV <= 22.0) return 24.0;
  if (currentV <= 44.0) return 48.0;
  return 60.0;
}

/**
 * Interpolates particle color smoothly from cryogenic cyan-blue (low T)
 * through vibrant cobalt/azure (room T) to thermal amber and crimson (high T).
 */
export function getTemperatureParticleColor(T: number): {
  fill: string;
  glow: string;
  core: string;
} {
  // Normalized temperature from 23 K to 700 K
  const tNorm = clamp((T - 50) / 600, 0, 1);

  if (tNorm < 0.35) {
    // Cryogenic cyan -> sky blue
    const u = tNorm / 0.35;
    const r = Math.round(6 + u * 20);
    const g = Math.round(182 - u * 45);
    const b = Math.round(212 + u * 35);
    return {
      fill: `rgb(${r}, ${g}, ${b})`,
      glow: `rgba(${r}, ${g}, ${b}, 0.35)`,
      core: '#e0f2fe',
    };
  }
  if (tNorm < 0.65) {
    // Sky/cobalt -> warm amber
    const u = (tNorm - 0.35) / 0.3;
    const r = Math.round(26 + u * 219);
    const g = Math.round(137 + u * 21);
    const b = Math.round(247 - u * 236);
    return {
      fill: `rgb(${r}, ${g}, ${b})`,
      glow: `rgba(${r}, ${g}, ${b}, 0.35)`,
      core: '#fef3c7',
    };
  }
  // Amber -> crimson red
  const u = (tNorm - 0.65) / 0.35;
  const r = Math.round(245 - u * 20);
  const g = Math.round(158 - u * 115);
  const b = Math.round(11 + u * 35);
  return {
    fill: `rgb(${r}, ${g}, ${b})`,
    glow: `rgba(${r}, ${g}, ${b}, 0.4)`,
    core: '#fee2e2',
  };
}

/**
 * Relative RMS speed in px/sec for canvas molecular simulation.
 * Scales physically with sqrt(T).
 */
export function getRmsSpeedPx(T: number): number {
  const safeT = Math.max(10, T);
  return 115 * Math.sqrt(safeT / 300);
}
