import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  Flame,
  Snowflake,
  Thermometer,
  Lock,
  Unlock,
  Plus,
  Minus,
  Trash2,
  Gauge,
} from 'lucide-react';
import type {
  Language,
  ModuleId,
  SandboxSolveTarget,
  TempUnit,
} from '../types';
import { TRANSLATIONS } from '../i18n';
import { EmeraldSlider } from './EmeraldSlider';
import { celsiusToKelvin, kelvinToCelsius } from '../physics/gasPhysics';

interface ControlSidebarProps {
  lang: Language;
  moduleId: ModuleId;
  P: number;
  V: number;
  T: number;
  n: number;
  // Module 1 specifics
  boyleInputMode: 'V' | 'P';
  onChangeBoyleInputMode: (m: 'V' | 'P') => void;
  weightCount: number;
  onAddWeight: () => void;
  onRemoveWeight: () => void;
  onClearWeights: () => void;
  // Module 2 specifics
  tempUnit: TempUnit;
  onChangeTempUnit: (u: TempUnit) => void;
  extrapolateAbsZero: boolean;
  onToggleExtrapolate: () => void;
  // Module 3 specifics
  isSandboxUnlocked: boolean;
  onToggleSandbox: () => void;
  solveTarget: SandboxSolveTarget;
  onChangeSolveTarget: (target: SandboxSolveTarget) => void;
  // Shared parameter handlers
  onChangeV: (v: number) => void;
  onChangeP: (p: number) => void;
  onChangeT: (t: number) => void;
  onChangeN: (n: number) => void;
  // Playback
  isPlaying: boolean;
  onTogglePlay: () => void;
  slowMo: boolean;
  onToggleSlowMo: () => void;
  onStep: () => void;
}

export const ControlSidebar: React.FC<ControlSidebarProps> = ({
  lang,
  moduleId,
  P,
  V,
  T,
  n,
  boyleInputMode,
  onChangeBoyleInputMode,
  weightCount,
  onAddWeight,
  onRemoveWeight,
  onClearWeights,
  tempUnit,
  onChangeTempUnit,
  extrapolateAbsZero,
  onToggleExtrapolate,
  isSandboxUnlocked,
  onToggleSandbox,
  solveTarget,
  onChangeSolveTarget,
  onChangeV,
  onChangeP,
  onChangeT,
  onChangeN,
  isPlaying,
  onTogglePlay,
  slowMo,
  onToggleSlowMo,
  onStep,
}) => {
  const t = TRANSLATIONS[lang];
  const modMeta = t.modules[moduleId];
  const tempC = kelvinToCelsius(T);

  return (
    <aside className="w-full lg:w-[340px] shrink-0 flex flex-col gap-3">
      {/* Module Identity Header Card */}
      <section className="bg-white border border-sky-200 rounded-2xl shadow-sm p-4 space-y-1.5">
        <div className="text-[11px] font-semibold text-sky-700">{modMeta.lawTag}</div>
        <h2 className="text-sm font-bold text-slate-950 leading-snug">{modMeta.fullTitle}</h2>
        <p className="text-xs text-slate-600 leading-relaxed">{modMeta.summary}</p>
      </section>

      {/* Module-Specific Parameter Sliders & Controls */}
      <section className="bg-white border border-sky-200 rounded-2xl shadow-sm p-4 space-y-4">
        <h3 className="text-xs font-bold text-slate-700">{t.controls.parametersHeading}</h3>

        {/* MODULE 1: BOYLE'S LAW */}
        {moduleId === 'boyle' && (
          <>
            {/* Toggle between Volume control and Pressure control */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-600">
                {t.controls.boyleInputMode}
              </div>
              <div className="grid grid-cols-2 gap-1 p-1 bg-sky-50 border border-sky-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => onChangeBoyleInputMode('V')}
                  className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    boyleInputMode === 'V'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  {t.controls.byVolume}
                </button>
                <button
                  type="button"
                  onClick={() => onChangeBoyleInputMode('P')}
                  className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    boyleInputMode === 'P'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  {t.controls.byPressure}
                </button>
              </div>
            </div>

            {boyleInputMode === 'V' ? (
              <EmeraldSlider
                id="boyle-v"
                label={t.controls.volume}
                value={V}
                min={1.0}
                max={10.0}
                step={0.1}
                unit={t.units.L}
                decimals={2}
                secondaryReadout={`${P.toFixed(2)} ${t.units.atm}`}
                onChange={onChangeV}
              />
            ) : (
              <EmeraldSlider
                id="boyle-p"
                label={t.controls.externalPressure}
                value={P}
                min={1.0}
                max={15.0}
                step={0.1}
                unit={t.units.atm}
                decimals={2}
                secondaryReadout={`${V.toFixed(2)} ${t.units.L}`}
                onChange={onChangeP}
              />
            )}

            {/* Slotted Weight Stacker */}
            <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span>{t.controls.slottedWeights}</span>
                <span className="font-mono tabular-nums text-emerald-700">
                  +{weightCount} atm
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onAddWeight}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.controls.addWeight}</span>
                </button>
                <button
                  type="button"
                  onClick={onRemoveWeight}
                  disabled={weightCount <= 0}
                  className="inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-white hover:bg-slate-50 border border-sky-200 text-slate-800 text-xs font-semibold disabled:opacity-45 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onClearWeights}
                  disabled={weightCount <= 0}
                  className="inline-flex items-center justify-center py-1.5 px-2.5 rounded-lg bg-white hover:bg-rose-50 border border-sky-200 text-rose-600 text-xs font-semibold disabled:opacity-45 cursor-pointer"
                  title={t.controls.clearWeights}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                {t.controls.weightsHint}
              </p>
            </div>

            <EmeraldSlider
              id="boyle-t"
              label={t.controls.constantTemp}
              value={T}
              min={200}
              max={600}
              step={5}
              unit={t.units.K}
              decimals={0}
              secondaryReadout={`${kelvinToCelsius(T).toFixed(0)}°C`}
              onChange={onChangeT}
            />

            <EmeraldSlider
              id="boyle-n"
              label={t.controls.moles}
              value={n}
              min={0.5}
              max={3.0}
              step={0.1}
              unit={t.units.mol}
              decimals={1}
              onChange={onChangeN}
            />
          </>
        )}

        {/* MODULE 2: CHARLES'S LAW & ABSOLUTE ZERO */}
        {moduleId === 'charles' && (
          <>
            {/* Celsius / Kelvin Switcher */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">
                {t.controls.tempUnitToggle}
              </span>
              <div className="flex items-center gap-1 p-0.5 bg-sky-50 border border-sky-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => onChangeTempUnit('C')}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold cursor-pointer ${
                    tempUnit === 'C'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  °C
                </button>
                <button
                  type="button"
                  onClick={() => onChangeTempUnit('K')}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold cursor-pointer ${
                    tempUnit === 'K'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  K
                </button>
              </div>
            </div>

            {tempUnit === 'C' ? (
              <EmeraldSlider
                id="charles-tc"
                label={t.controls.temperature}
                value={tempC}
                min={-250}
                max={300}
                step={1}
                unit="°C"
                decimals={1}
                secondaryReadout={`${T.toFixed(1)} K`}
                onChange={(c) => onChangeT(celsiusToKelvin(c))}
              />
            ) : (
              <EmeraldSlider
                id="charles-tk"
                label={t.controls.temperature}
                value={T}
                min={23.15}
                max={573.15}
                step={1}
                unit="K"
                decimals={2}
                secondaryReadout={`${tempC.toFixed(1)}°C`}
                onChange={onChangeT}
              />
            )}

            {/* Quick Thermal Source Presets */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-600">
                {t.controls.thermalActions}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => onChangeT(celsiusToKelvin(-200))}
                  className="inline-flex flex-col items-center gap-1 py-2 px-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-900 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  <Snowflake className="w-3.5 h-3.5 text-cyan-700" />
                  <span>{t.controls.iceBath}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeT(celsiusToKelvin(25))}
                  className="inline-flex flex-col items-center gap-1 py-2 px-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-slate-900 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  <Thermometer className="w-3.5 h-3.5 text-sky-700" />
                  <span>{t.controls.roomTemp}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeT(celsiusToKelvin(250))}
                  className="inline-flex flex-col items-center gap-1 py-2 px-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5 text-orange-600" />
                  <span>{t.controls.burnerHeat}</span>
                </button>
              </div>
            </div>

            <EmeraldSlider
              id="charles-p"
              label={t.controls.constantPressure}
              value={P}
              min={0.5}
              max={5.0}
              step={0.1}
              unit={t.units.atm}
              decimals={1}
              onChange={onChangeP}
            />

            <EmeraldSlider
              id="charles-n"
              label={t.controls.moles}
              value={n}
              min={0.5}
              max={2.0}
              step={0.1}
              unit={t.units.mol}
              decimals={1}
              onChange={onChangeN}
            />

            {/* Extrapolate to Absolute Zero Highlight Toggle */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50/60 border border-rose-200 cursor-pointer">
              <input
                type="checkbox"
                checked={extrapolateAbsZero}
                onChange={onToggleExtrapolate}
                className="mt-0.5 w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-rose-900">
                  {t.controls.extrapolateAbsZero}
                </div>
                <p className="text-[11px] text-rose-700 leading-snug">
                  {t.controls.extrapolateDesc}
                </p>
              </div>
            </label>
          </>
        )}

        {/* MODULE 3: GAY-LUSSAC'S LAW & IDEAL GAS SANDBOX */}
        {moduleId === 'gaylussac' && (
          <>
            {/* Lock Piston vs Free All Variables Toggle */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-600">
                {t.controls.lockPistonToggle}
              </div>
              <button
                type="button"
                onClick={onToggleSandbox}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                  isSandboxUnlocked
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-sky-50 border-sky-200 text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  {isSandboxUnlocked ? (
                    <Unlock className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <Lock className="w-4 h-4 text-sky-700" />
                  )}
                  <span>
                    {isSandboxUnlocked
                      ? t.controls.sandboxModeLabel
                      : t.controls.lockedModeLabel}
                  </span>
                </span>
              </button>
            </div>

            {isSandboxUnlocked && (
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-slate-600">
                  {t.controls.solveForLabel}
                </div>
                <div className="grid grid-cols-3 gap-1 p-1 bg-sky-50 border border-sky-200 rounded-lg">
                  {(['P', 'V', 'T'] as SandboxSolveTarget[]).map((target) => (
                    <button
                      key={target}
                      type="button"
                      onClick={() => onChangeSolveTarget(target)}
                      className={`py-1 rounded-md text-xs font-mono font-bold cursor-pointer ${
                        solveTarget === target
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-700 hover:bg-white'
                      }`}
                    >
                      {target}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <EmeraldSlider
              id="gl-t"
              label={t.controls.temperature}
              value={T}
              min={100}
              max={800}
              step={5}
              unit={t.units.K}
              decimals={1}
              secondaryReadout={`${tempC.toFixed(0)}°C`}
              disabled={isSandboxUnlocked && solveTarget === 'T'}
              onChange={onChangeT}
            />

            <EmeraldSlider
              id="gl-v"
              label={t.controls.lockedVolume}
              value={V}
              min={1.5}
              max={10.0}
              step={0.1}
              unit={t.units.L}
              decimals={2}
              disabled={isSandboxUnlocked && solveTarget === 'V'}
              lockedText={!isSandboxUnlocked ? 'V = const' : undefined}
              onChange={onChangeV}
            />

            {isSandboxUnlocked && (
              <EmeraldSlider
                id="gl-p"
                label={t.controls.externalPressure}
                value={P}
                min={0.5}
                max={16.0}
                step={0.1}
                unit={t.units.atm}
                decimals={2}
                disabled={solveTarget === 'P'}
                onChange={onChangeP}
              />
            )}

            <EmeraldSlider
              id="gl-n"
              label={t.controls.moles}
              value={n}
              min={0.5}
              max={3.0}
              step={0.1}
              unit={t.units.mol}
              decimals={1}
              onChange={onChangeN}
            />

            {/* Quick Thermal Actions */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                disabled={isSandboxUnlocked && solveTarget === 'T'}
                onClick={() => onChangeT(150)}
                className="inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-900 text-[11px] font-semibold disabled:opacity-40 cursor-pointer"
              >
                <Snowflake className="w-3.5 h-3.5 text-cyan-700" />
                <span>150 K</span>
              </button>
              <button
                type="button"
                disabled={isSandboxUnlocked && solveTarget === 'T'}
                onClick={() => onChangeT(300)}
                className="inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-slate-900 text-[11px] font-semibold disabled:opacity-40 cursor-pointer"
              >
                <Gauge className="w-3.5 h-3.5 text-sky-700" />
                <span>300 K</span>
              </button>
              <button
                type="button"
                disabled={isSandboxUnlocked && solveTarget === 'T'}
                onClick={() => onChangeT(600)}
                className="inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-semibold disabled:opacity-40 cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-orange-600" />
                <span>600 K</span>
              </button>
            </div>
          </>
        )}
      </section>

      {/* Playback Controls Card */}
      <section className="bg-white border border-sky-200 rounded-2xl shadow-sm p-4 space-y-2.5">
        <h3 className="text-xs font-bold text-slate-700">{t.controls.playbackHeading}</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? t.controls.pause : t.controls.play}</span>
          </button>

          <button
            type="button"
            onClick={onStep}
            disabled={isPlaying}
            className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-slate-800 text-xs font-semibold disabled:opacity-40 cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>{t.controls.step}</span>
          </button>

          <button
            type="button"
            onClick={onToggleSlowMo}
            className={`py-2 px-2.5 rounded-xl border text-xs font-semibold whitespace-nowrap cursor-pointer ${
              slowMo
                ? 'bg-slate-950 text-white border-slate-950'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-sky-200'
            }`}
          >
            {slowMo ? t.controls.slowMo : t.controls.normalSpeed}
          </button>
        </div>

        {(moduleId === 'boyle' || (moduleId === 'gaylussac' && isSandboxUnlocked)) && (
          <p className="text-[11px] text-sky-800 bg-sky-50 border border-sky-100 rounded-lg px-2.5 py-1.5">
            {t.controls.dragPistonHint}
          </p>
        )}
      </section>
    </aside>
  );
};
