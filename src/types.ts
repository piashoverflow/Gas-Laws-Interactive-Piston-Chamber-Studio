export type Language = 'bn' | 'en';

export type ModuleId = 'boyle' | 'charles' | 'gaylussac';

export type BoyleGraphMode = 'pv' | 'p_inv_v' | 'pv_vs_p';

export type TempUnit = 'C' | 'K';

export type RUnit = 'atm' | 'si';

export type SandboxSolveTarget = 'P' | 'V' | 'T';

export interface GasState {
  /** Pressure in atm */
  P: number;
  /** Volume in Liters (L) */
  V: number;
  /** Absolute Temperature in Kelvin (K) */
  T: number;
  /** Amount of substance in moles (mol) */
  n: number;
}

export interface SnapshotState {
  P: number;
  V: number;
  T: number;
  n: number;
}

export const R_ATM = 0.0821; // L·atm·mol⁻¹·K⁻¹
export const R_SI = 8.314; // J·mol⁻¹·K⁻¹ (equivalent to kPa·L·mol⁻¹·K⁻¹)
export const ATM_TO_KPA = 101.325;
export const KELVIN_OFFSET = 273.15;
export const RELIEF_VALVE_ATM = 12.0;
