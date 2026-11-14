import React, { useCallback, useState } from 'react';
import type {
  BoyleGraphMode,
  Language,
  ModuleId,
  RUnit,
  SandboxSolveTarget,
  SnapshotState,
  TempUnit,
} from './types';
import {
  clamp,
  computePressureAtm,
  computeTempK,
  computeVolumeL,
} from './physics/gasPhysics';
import { TopBar } from './components/TopBar';
import { ControlSidebar } from './components/ControlSidebar';
import { PistonChamberCanvas } from './components/PistonChamberCanvas';
import { TelemetryPanel } from './components/TelemetryPanel';

interface ModuleState {
  P: number;
  V: number;
  T: number;
  n: number;
  snapshot: SnapshotState | null;
}

const INITIAL_BOYLE: ModuleState = {
  V: 5.0,
  T: 300,
  n: 1.0,
  P: computePressureAtm(1.0, 300, 5.0),
  snapshot: {
    V: 5.0,
    T: 300,
    n: 1.0,
    P: computePressureAtm(1.0, 300, 5.0),
  },
};

const INITIAL_CHARLES: ModuleState = {
  P: 2.0,
  T: 298.15, // 25 °C
  n: 0.5,
  V: computeVolumeL(0.5, 298.15, 2.0),
  snapshot: {
    P: 2.0,
    T: 298.15,
    n: 0.5,
    V: computeVolumeL(0.5, 298.15, 2.0),
  },
};

const INITIAL_GAYLUSSAC: ModuleState = {
  V: 3.0,
  T: 300,
  n: 1.0,
  P: computePressureAtm(1.0, 300, 3.0),
  snapshot: {
    V: 3.0,
    T: 300,
    n: 1.0,
    P: computePressureAtm(1.0, 300, 3.0),
  },
};

export default function App() {
  const [lang, setLang] = useState<Language>('bn');
  const [activeModule, setActiveModule] = useState<ModuleId>('boyle');

  // Module states preserved cleanly across tab switches
  const [boyleState, setBoyleState] = useState<ModuleState>(INITIAL_BOYLE);
  const [charlesState, setCharlesState] = useState<ModuleState>(INITIAL_CHARLES);
  const [gayLussacState, setGayLussacState] = useState<ModuleState>(INITIAL_GAYLUSSAC);

  // Module-specific UI options
  const [boyleInputMode, setBoyleInputMode] = useState<'V' | 'P'>('V');
  const [boyleGraphMode, setBoyleGraphMode] = useState<BoyleGraphMode>('pv');
  const [weightCount, setWeightCount] = useState<number>(0);

  const [tempUnit, setTempUnit] = useState<TempUnit>('C');
  const [extrapolateAbsZero, setExtrapolateAbsZero] = useState<boolean>(true);

  const [isSandboxUnlocked, setIsSandboxUnlocked] = useState<boolean>(false);
  const [solveTarget, setSolveTarget] = useState<SandboxSolveTarget>('P');
  const [rUnit, setRUnit] = useState<RUnit>('atm');

  // Playback & Telemetry
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [slowMo, setSlowMo] = useState<boolean>(false);
  const [stepTrigger, setStepTrigger] = useState<number>(0);
  const [collisionRate, setCollisionRate] = useState<number>(0);

  const current =
    activeModule === 'boyle'
      ? boyleState
      : activeModule === 'charles'
      ? charlesState
      : gayLussacState;

  const handleToggleLanguage = () => {
    setLang((prev) => (prev === 'bn' ? 'en' : 'bn'));
  };

  const handleReset = () => {
    if (activeModule === 'boyle') {
      setBoyleState(INITIAL_BOYLE);
      setWeightCount(0);
      setBoyleInputMode('V');
    } else if (activeModule === 'charles') {
      setCharlesState(INITIAL_CHARLES);
      setExtrapolateAbsZero(true);
    } else {
      setGayLussacState(INITIAL_GAYLUSSAC);
      setIsSandboxUnlocked(false);
      setSolveTarget('P');
    }
    setIsPlaying(true);
    setSlowMo(false);
  };

  const handleCaptureSnapshot = () => {
    if (activeModule === 'boyle') {
      setBoyleState((s) => ({ ...s, snapshot: { P: s.P, V: s.V, T: s.T, n: s.n } }));
    } else if (activeModule === 'charles') {
      setCharlesState((s) => ({ ...s, snapshot: { P: s.P, V: s.V, T: s.T, n: s.n } }));
    } else {
      setGayLussacState((s) => ({ ...s, snapshot: { P: s.P, V: s.V, T: s.T, n: s.n } }));
    }
  };

  // Parameter change handlers respecting each module's physical constraints
  const handleChangeV = useCallback(
    (newV: number) => {
      if (activeModule === 'boyle') {
        const vClamped = clamp(newV, 1.0, 10.0);
        setBoyleState((s) => {
          const newP = computePressureAtm(s.n, s.T, vClamped);
          return { ...s, V: vClamped, P: newP };
        });
        setWeightCount(0);
      } else if (activeModule === 'gaylussac') {
        const vClamped = clamp(newV, 1.5, 10.0);
        setGayLussacState((s) => {
          if (!isSandboxUnlocked || solveTarget === 'P') {
            return { ...s, V: vClamped, P: computePressureAtm(s.n, s.T, vClamped) };
          }
          if (solveTarget === 'T') {
            const newT = clamp(computeTempK(s.P, vClamped, s.n), 50, 1200);
            return { ...s, V: vClamped, T: newT, P: computePressureAtm(s.n, newT, vClamped) };
          }
          return s;
        });
      }
    },
    [activeModule, isSandboxUnlocked, solveTarget]
  );

  const handleChangeP = useCallback(
    (newP: number) => {
      if (activeModule === 'boyle') {
        const pClamped = clamp(newP, 1.0, 25.0);
        setBoyleState((s) => {
          const rawV = computeVolumeL(s.n, s.T, pClamped);
          const vClamped = clamp(rawV, 1.0, 10.0);
          return {
            ...s,
            V: vClamped,
            P: computePressureAtm(s.n, s.T, vClamped),
          };
        });
      } else if (activeModule === 'charles') {
        const pClamped = clamp(newP, 0.5, 5.0);
        setCharlesState((s) => ({
          ...s,
          P: pClamped,
          V: computeVolumeL(s.n, s.T, pClamped),
        }));
      } else if (activeModule === 'gaylussac' && isSandboxUnlocked) {
        const pClamped = clamp(newP, 0.5, 16.0);
        setGayLussacState((s) => {
          if (solveTarget === 'V') {
            const rawV = computeVolumeL(s.n, s.T, pClamped);
            const vClamped = clamp(rawV, 1.5, 10.0);
            return { ...s, V: vClamped, P: computePressureAtm(s.n, s.T, vClamped) };
          }
          if (solveTarget === 'T') {
            const newT = clamp(computeTempK(pClamped, s.V, s.n), 50, 1200);
            return { ...s, T: newT, P: computePressureAtm(s.n, newT, s.V) };
          }
          return s;
        });
      }
    },
    [activeModule, isSandboxUnlocked, solveTarget]
  );

  const handleChangeT = useCallback(
    (newT: number) => {
      if (activeModule === 'boyle') {
        const tClamped = clamp(newT, 200, 600);
        setBoyleState((s) => ({
          ...s,
          T: tClamped,
          P: computePressureAtm(s.n, tClamped, s.V),
        }));
      } else if (activeModule === 'charles') {
        const tClamped = clamp(newT, 23.15, 573.15);
        setCharlesState((s) => ({
          ...s,
          T: tClamped,
          V: computeVolumeL(s.n, tClamped, s.P),
        }));
      } else if (activeModule === 'gaylussac') {
        const tClamped = clamp(newT, 100, 800);
        setGayLussacState((s) => {
          if (!isSandboxUnlocked || solveTarget === 'P') {
            return { ...s, T: tClamped, P: computePressureAtm(s.n, tClamped, s.V) };
          }
          if (solveTarget === 'V') {
            const rawV = computeVolumeL(s.n, tClamped, s.P);
            const vClamped = clamp(rawV, 1.5, 10.0);
            return { ...s, T: tClamped, V: vClamped, P: computePressureAtm(s.n, tClamped, vClamped) };
          }
          return s;
        });
      }
    },
    [activeModule, isSandboxUnlocked, solveTarget]
  );

  const handleChangeN = useCallback(
    (newN: number) => {
      const nClamped = clamp(newN, 0.5, 3.0);
      if (activeModule === 'boyle') {
        setBoyleState((s) => ({
          ...s,
          n: nClamped,
          P: computePressureAtm(nClamped, s.T, s.V),
        }));
      } else if (activeModule === 'charles') {
        const charlesN = clamp(newN, 0.5, 2.0);
        setCharlesState((s) => ({
          ...s,
          n: charlesN,
          V: computeVolumeL(charlesN, s.T, s.P),
        }));
      } else if (activeModule === 'gaylussac') {
        setGayLussacState((s) => {
          if (!isSandboxUnlocked || solveTarget === 'P') {
            return { ...s, n: nClamped, P: computePressureAtm(nClamped, s.T, s.V) };
          }
          if (solveTarget === 'V') {
            const vClamped = clamp(computeVolumeL(nClamped, s.T, s.P), 1.5, 10.0);
            return { ...s, n: nClamped, V: vClamped, P: computePressureAtm(nClamped, s.T, vClamped) };
          }
          const newT = clamp(computeTempK(s.P, s.V, nClamped), 50, 1200);
          return { ...s, n: nClamped, T: newT, P: computePressureAtm(nClamped, newT, s.V) };
        });
      }
    },
    [activeModule, isSandboxUnlocked, solveTarget]
  );

  // Module 1 Slotted Weights Handlers
  const applyWeightCount = (nextCount: number) => {
    const safeCount = clamp(nextCount, 0, 12);
    setWeightCount(safeCount);
    // Base atmospheric pressure ~ 2.46 atm at V=10L or current base + 1 atm per weight
    // Specifically: target pressure = 2.0 + safeCount * 1.0 atm (or add +1 atm to current P)
    const targetP = clamp(2.0 + safeCount * 1.2, 1.5, 20.0);
    setBoyleInputMode('P');
    handleChangeP(targetP);
  };

  const handleAddWeight = () => applyWeightCount(weightCount + 1);
  const handleRemoveWeight = () => applyWeightCount(weightCount - 1);
  const handleClearWeights = () => {
    setWeightCount(0);
    handleChangeV(5.0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-sky-50 text-slate-950">
      <TopBar
        lang={lang}
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        onToggleLanguage={handleToggleLanguage}
        onReset={handleReset}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 lg:px-6 py-4 flex flex-col lg:flex-row items-stretch gap-4">
        <ControlSidebar
          lang={lang}
          moduleId={activeModule}
          P={current.P}
          V={current.V}
          T={current.T}
          n={current.n}
          boyleInputMode={boyleInputMode}
          onChangeBoyleInputMode={setBoyleInputMode}
          weightCount={weightCount}
          onAddWeight={handleAddWeight}
          onRemoveWeight={handleRemoveWeight}
          onClearWeights={handleClearWeights}
          tempUnit={tempUnit}
          onChangeTempUnit={setTempUnit}
          extrapolateAbsZero={extrapolateAbsZero}
          onToggleExtrapolate={() => setExtrapolateAbsZero((e) => !e)}
          isSandboxUnlocked={isSandboxUnlocked}
          onToggleSandbox={() => setIsSandboxUnlocked((u) => !u)}
          solveTarget={solveTarget}
          onChangeSolveTarget={setSolveTarget}
          onChangeV={handleChangeV}
          onChangeP={handleChangeP}
          onChangeT={handleChangeT}
          onChangeN={handleChangeN}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          slowMo={slowMo}
          onToggleSlowMo={() => setSlowMo((s) => !s)}
          onStep={() => setStepTrigger((c) => c + 1)}
        />

        <PistonChamberCanvas
          lang={lang}
          moduleId={activeModule}
          P={current.P}
          V={current.V}
          T={current.T}
          n={current.n}
          weightCount={weightCount}
          isPlaying={isPlaying}
          slowMo={slowMo}
          stepTrigger={stepTrigger}
          isSandboxUnlocked={isSandboxUnlocked}
          onDragVolume={handleChangeV}
          onCollisionRateUpdate={setCollisionRate}
        />

        <TelemetryPanel
          lang={lang}
          moduleId={activeModule}
          P={current.P}
          V={current.V}
          T={current.T}
          n={current.n}
          collisionRate={collisionRate}
          boyleGraphMode={boyleGraphMode}
          onChangeBoyleGraphMode={setBoyleGraphMode}
          tempUnit={tempUnit}
          extrapolateAbsZero={extrapolateAbsZero}
          snapshot={current.snapshot}
          onCaptureSnapshot={handleCaptureSnapshot}
          rUnit={rUnit}
          onChangeRUnit={setRUnit}
          isSandboxUnlocked={isSandboxUnlocked}
        />
      </main>
    </div>
  );
}
