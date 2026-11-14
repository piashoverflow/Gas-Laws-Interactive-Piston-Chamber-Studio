import React from 'react';
import { BookmarkPlus, Check } from 'lucide-react';
import {
  ATM_TO_KPA,
  KELVIN_OFFSET,
  R_ATM,
  R_SI,
  type Language,
  type ModuleId,
  type RUnit,
  type SnapshotState,
} from '../types';
import { TRANSLATIONS } from '../i18n';
import { kelvinToCelsius } from '../physics/gasPhysics';

interface FormulaCardProps {
  lang: Language;
  moduleId: ModuleId;
  P: number;
  V: number;
  T: number;
  n: number;
  snapshot: SnapshotState | null;
  onCaptureSnapshot: () => void;
  rUnit: RUnit;
  onChangeRUnit: (unit: RUnit) => void;
  isSandboxUnlocked: boolean;
}

export const FormulaCard: React.FC<FormulaCardProps> = ({
  lang,
  moduleId,
  P,
  V,
  T,
  n,
  snapshot,
  onCaptureSnapshot,
  rUnit,
  onChangeRUnit,
  isSandboxUnlocked,
}) => {
  const t = TRANSLATIONS[lang];

  const s1 = snapshot ?? { P, V, T, n };
  const pvCurrent = P * V;
  const pvSnap = s1.P * s1.V;

  // For Charles's Law: V0 at 0°C (273.15 K)
  const thetaC = kelvinToCelsius(T);
  const v0AtZeroC = (n * R_ATM * KELVIN_OFFSET) / P;

  // Ideal Gas Verifier values
  const lhs = rUnit === 'atm' ? P * V : P * ATM_TO_KPA * V;
  const rVal = rUnit === 'atm' ? R_ATM : R_SI;
  const rhs = n * rVal * T;
  const energyUnit = rUnit === 'atm' ? 'L·atm' : 'J (kPa·L)';

  return (
    <div className="bg-white border border-sky-200 rounded-2xl shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-slate-700">{t.telemetry.formulaCardHeading}</h3>
        <button
          type="button"
          onClick={onCaptureSnapshot}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-[11px] font-semibold transition-colors cursor-pointer"
        >
          <BookmarkPlus className="w-3.5 h-3.5" />
          <span>{t.telemetry.captureState1}</span>
        </button>
      </div>

      {/* Module 1: Boyle's Law */}
      {moduleId === 'boyle' && (
        <div className="space-y-2.5">
          <div className="bg-sky-50/80 border border-sky-100 rounded-xl p-2.5 text-center">
            <div className="font-mono text-xs font-bold text-slate-900">
              P₁V₁ = P₂V₂ = nRT
            </div>
            <div className="mt-1 font-mono tabular-nums text-[11px] text-slate-700">
              ({s1.P.toFixed(2)} × {s1.V.toFixed(2)}) = ({P.toFixed(2)} × {V.toFixed(2)})
            </div>
            <div className="mt-1 font-mono tabular-nums text-xs font-bold text-emerald-700">
              {pvSnap.toFixed(2)} ≈ {pvCurrent.toFixed(2)} L·atm ({t.telemetry.constantK})
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono tabular-nums">
            <div className="bg-amber-50/70 border border-amber-200/70 rounded-lg p-2">
              <div className="font-sans text-[10px] font-semibold text-amber-800">
                {t.telemetry.state1Label}
              </div>
              <div className="text-slate-900 mt-0.5">P₁ = {s1.P.toFixed(2)} atm</div>
              <div className="text-slate-900">V₁ = {s1.V.toFixed(2)} L</div>
            </div>
            <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-lg p-2">
              <div className="font-sans text-[10px] font-semibold text-emerald-800">
                {t.telemetry.state2Label}
              </div>
              <div className="text-slate-900 mt-0.5">P₂ = {P.toFixed(2)} atm</div>
              <div className="text-slate-900">V₂ = {V.toFixed(2)} L</div>
            </div>
          </div>
        </div>
      )}

      {/* Module 2: Charles's Law */}
      {moduleId === 'charles' && (
        <div className="space-y-2.5">
          <div className="bg-sky-50/80 border border-sky-100 rounded-xl p-2.5 space-y-1.5">
            <div className="font-mono text-xs font-bold text-slate-900 text-center">
              V₁ / T₁ = V₂ / T₂ = k
            </div>
            <div className="font-mono tabular-nums text-[11px] text-slate-700 text-center">
              {s1.V.toFixed(2)} / {s1.T.toFixed(1)} = {V.toFixed(2)} / {T.toFixed(1)}
            </div>
            <div className="font-mono tabular-nums text-xs font-bold text-emerald-700 text-center">
              {(V / T).toFixed(4)} L/K ({t.telemetry.constantK})
            </div>
          </div>

          <div className="bg-rose-50/60 border border-rose-200/70 rounded-xl p-2.5 space-y-1">
            <div className="font-mono text-[11px] font-bold text-slate-900 text-center">
              V_θ = V₀ (1 + θ / 273.15)
            </div>
            <div className="font-mono tabular-nums text-[11px] text-slate-700 text-center">
              {v0AtZeroC.toFixed(2)} × (1 + ({thetaC.toFixed(1)} / 273.15)) ={' '}
              <span className="font-bold text-rose-700">{V.toFixed(2)} L</span>
            </div>
          </div>
        </div>
      )}

      {/* Module 3: Gay-Lussac & Universal PV = nRT Verifier */}
      {moduleId === 'gaylussac' && (
        <div className="space-y-2.5">
          <div className="bg-sky-50/80 border border-sky-100 rounded-xl p-2.5 text-center space-y-1">
            <div className="font-mono text-xs font-bold text-slate-900">
              {isSandboxUnlocked ? 'P₁V₁ / T₁ = P₂V₂ / T₂' : 'P₁ / T₁ = P₂ / T₂'}
            </div>
            <div className="font-mono tabular-nums text-[11px] text-slate-700">
              {isSandboxUnlocked
                ? `${((s1.P * s1.V) / s1.T).toFixed(3)} = ${((P * V) / T).toFixed(3)} L·atm/K`
                : `${(s1.P / s1.T).toFixed(4)} = ${(P / T).toFixed(4)} atm/K`}
            </div>
          </div>

          {/* Ideal Gas Verifier Card */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-emerald-900">
                {t.telemetry.idealGasVerifier}
              </span>
              <div className="flex items-center gap-1 bg-white border border-emerald-200 rounded-md p-0.5">
                <button
                  type="button"
                  onClick={() => onChangeRUnit('atm')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                    rUnit === 'atm'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  0.0821
                </button>
                <button
                  type="button"
                  onClick={() => onChangeRUnit('si')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                    rUnit === 'si'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  8.314
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono tabular-nums text-xs">
              <div className="bg-white rounded-lg p-2 border border-emerald-100">
                <div className="font-sans text-[10px] text-slate-500">{t.telemetry.leftSide}</div>
                <div className="font-bold text-slate-950 mt-0.5">
                  {lhs.toFixed(2)} <span className="text-[10px] font-normal">{energyUnit}</span>
                </div>
              </div>
              <div className="bg-white rounded-lg p-2 border border-emerald-100">
                <div className="font-sans text-[10px] text-slate-500">{t.telemetry.rightSide}</div>
                <div className="font-bold text-slate-950 mt-0.5">
                  {rhs.toFixed(2)} <span className="text-[10px] font-normal">{energyUnit}</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-slate-600 text-center">
              {rUnit === 'atm'
                ? `${P.toFixed(2)} atm × ${V.toFixed(2)} L = ${n.toFixed(2)} × 0.0821 × ${T.toFixed(1)} K`
                : `${(P * ATM_TO_KPA).toFixed(1)} kPa × ${V.toFixed(2)} L = ${n.toFixed(2)} × 8.314 × ${T.toFixed(1)} K`}
            </div>

            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-800">
              <Check className="w-3.5 h-3.5" />
              <span>{t.telemetry.verifiedMatch}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
