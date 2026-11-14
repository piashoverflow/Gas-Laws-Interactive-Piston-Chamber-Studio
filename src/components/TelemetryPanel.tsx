import React from 'react';
import type {
  BoyleGraphMode,
  Language,
  ModuleId,
  RUnit,
  SnapshotState,
  TempUnit,
} from '../types';
import { PressureGauge } from './PressureGauge';
import { LiveGraph } from './LiveGraph';
import { FormulaCard } from './FormulaCard';

interface TelemetryPanelProps {
  lang: Language;
  moduleId: ModuleId;
  P: number;
  V: number;
  T: number;
  n: number;
  collisionRate: number;
  boyleGraphMode: BoyleGraphMode;
  onChangeBoyleGraphMode: (mode: BoyleGraphMode) => void;
  tempUnit: TempUnit;
  extrapolateAbsZero: boolean;
  snapshot: SnapshotState | null;
  onCaptureSnapshot: () => void;
  rUnit: RUnit;
  onChangeRUnit: (unit: RUnit) => void;
  isSandboxUnlocked: boolean;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  lang,
  moduleId,
  P,
  V,
  T,
  n,
  collisionRate,
  boyleGraphMode,
  onChangeBoyleGraphMode,
  tempUnit,
  extrapolateAbsZero,
  snapshot,
  onCaptureSnapshot,
  rUnit,
  onChangeRUnit,
  isSandboxUnlocked,
}) => {
  return (
    <aside className="w-full lg:w-[330px] shrink-0 flex flex-col gap-3">
      <PressureGauge
        lang={lang}
        P={P}
        V={V}
        T={T}
        collisionRate={collisionRate}
      />

      <LiveGraph
        lang={lang}
        moduleId={moduleId}
        P={P}
        V={V}
        T={T}
        n={n}
        boyleGraphMode={boyleGraphMode}
        onChangeBoyleGraphMode={onChangeBoyleGraphMode}
        tempUnit={tempUnit}
        extrapolateAbsZero={extrapolateAbsZero}
        snapshot={snapshot}
      />

      <FormulaCard
        lang={lang}
        moduleId={moduleId}
        P={P}
        V={V}
        T={T}
        n={n}
        snapshot={snapshot}
        onCaptureSnapshot={onCaptureSnapshot}
        rUnit={rUnit}
        onChangeRUnit={onChangeRUnit}
        isSandboxUnlocked={isSandboxUnlocked}
      />
    </aside>
  );
};
