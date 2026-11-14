import React from 'react';
import {
  KELVIN_OFFSET,
  R_ATM,
  RELIEF_VALVE_ATM,
  type BoyleGraphMode,
  type Language,
  type ModuleId,
  type SnapshotState,
  type TempUnit,
} from '../types';
import { TRANSLATIONS } from '../i18n';
import { kelvinToCelsius } from '../physics/gasPhysics';

interface LiveGraphProps {
  lang: Language;
  moduleId: ModuleId;
  P: number;
  V: number;
  T: number;
  n: number;
  boyleGraphMode: BoyleGraphMode;
  onChangeBoyleGraphMode: (mode: BoyleGraphMode) => void;
  tempUnit: TempUnit;
  extrapolateAbsZero: boolean;
  snapshot: SnapshotState | null;
}

export const LiveGraph: React.FC<LiveGraphProps> = ({
  lang,
  moduleId,
  P,
  V,
  T,
  n,
  boyleGraphMode,
  onChangeBoyleGraphMode,
  tempUnit,
  extrapolateAbsZero,
  snapshot,
}) => {
  const t = TRANSLATIONS[lang];

  // SVG plot coordinate box
  const W = 300;
  const H = 205;
  const padL = 42;
  const padR = 14;
  const padT = 16;
  const padB = 32;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const toSvgX = (val: number, min: number, max: number) =>
    padL + ((val - min) / (max - min)) * plotW;
  const toSvgY = (val: number, min: number, max: number) =>
    padT + plotH - ((val - min) / (max - min)) * plotH;

  // Render Module 1: Boyle's Law Graphs
  const renderBoyleGraph = () => {
    if (boyleGraphMode === 'pv') {
      const xMin = 0;
      const xMax = 11;
      const yMin = 0;
      const yMax = Math.max(18, Math.ceil(P / 4) * 4 + 2);
      const ghostTemps = [200, 350, 500];

      const buildCurve = (tempK: number) => {
        const pts: string[] = [];
        for (let v = 0.8; v <= 10.5; v += 0.2) {
          const pVal = (n * R_ATM * tempK) / v;
          if (pVal <= yMax * 1.15) {
            pts.push(`${toSvgX(v, xMin, xMax).toFixed(1)},${toSvgY(Math.min(pVal, yMax), yMin, yMax).toFixed(1)}`);
          }
        }
        return pts.join(' ');
      };

      const curX = toSvgX(Math.min(V, xMax), xMin, xMax);
      const curY = toSvgY(Math.min(P, yMax), yMin, yMax);

      return (
        <>
          {/* Grid lines */}
          {[2, 4, 6, 8, 10].map((vTick) => (
            <g key={`x-${vTick}`}>
              <line
                x1={toSvgX(vTick, xMin, xMax)}
                y1={padT}
                x2={toSvgX(vTick, xMin, xMax)}
                y2={padT + plotH}
                stroke="#e0f2fe"
                strokeWidth="1"
              />
              <text
                x={toSvgX(vTick, xMin, xMax)}
                y={padT + plotH + 12}
                textAnchor="middle"
                className="fill-slate-500 text-[9px] font-mono"
              >
                {vTick}
              </text>
            </g>
          ))}
          {[0.25, 0.5, 0.75, 1].map((frac) => {
            const pTick = yMax * frac;
            return (
              <g key={`y-${frac}`}>
                <line
                  x1={padL}
                  y1={toSvgY(pTick, yMin, yMax)}
                  x2={padL + plotW}
                  y2={toSvgY(pTick, yMin, yMax)}
                  stroke="#e0f2fe"
                  strokeWidth="1"
                />
                <text
                  x={padL - 5}
                  y={toSvgY(pTick, yMin, yMax) + 3}
                  textAnchor="end"
                  className="fill-slate-500 text-[9px] font-mono"
                >
                  {pTick.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Ghost Isotherms */}
          {ghostTemps.map((gT) => (
            <polyline
              key={gT}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.55"
              points={buildCurve(gT)}
            />
          ))}

          {/* Active Isotherm */}
          <polyline
            fill="none"
            stroke="#0284c7"
            strokeWidth="2.5"
            strokeLinecap="round"
            points={buildCurve(T)}
          />

          {/* Snapshot State 1 Marker */}
          {snapshot && (
            <circle
              cx={toSvgX(Math.min(snapshot.V, xMax), xMin, xMax)}
              cy={toSvgY(Math.min(snapshot.P, yMax), yMin, yMax)}
              r="4"
              fill="#ffffff"
              stroke="#d97706"
              strokeWidth="2"
            />
          )}

          {/* Crosshair Drop Lines */}
          <line
            x1={curX}
            y1={curY}
            x2={curX}
            y2={padT + plotH}
            stroke="#059669"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
          <line
            x1={padL}
            y1={curY}
            x2={curX}
            y2={curY}
            stroke="#059669"
            strokeWidth="1"
            strokeDasharray="2,2"
          />

          {/* Live State Point */}
          <circle cx={curX} cy={curY} r="7" fill="rgba(5, 150, 105, 0.2)" />
          <circle cx={curX} cy={curY} r="4.5" fill="#059669" stroke="#ffffff" strokeWidth="1.5" />

          {/* Axis Labels */}
          <text x={padL + plotW / 2} y={H - 4} textAnchor="middle" className="fill-slate-700 text-[10px] font-semibold">
            V (L)
          </text>
          <text
            x={12}
            y={padT + plotH / 2}
            textAnchor="middle"
            transform={`rotate(-90 12 ${padT + plotH / 2})`}
            className="fill-slate-700 text-[10px] font-semibold"
          >
            P (atm)
          </text>
        </>
      );
    }

    if (boyleGraphMode === 'p_inv_v') {
      const xMin = 0;
      const xMax = 1.1; // 1/V up to 1.0 L^-1
      const yMin = 0;
      const kSlope = n * R_ATM * T;
      const yMax = Math.max(20, Math.ceil((kSlope * 1.0) / 5) * 5 + 2);
      const invV = 1 / Math.max(0.5, V);
      const curX = toSvgX(Math.min(invV, xMax), xMin, xMax);
      const curY = toSvgY(Math.min(P, yMax), yMin, yMax);

      return (
        <>
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((tick) => (
            <g key={tick}>
              <line
                x1={toSvgX(tick, xMin, xMax)}
                y1={padT}
                x2={toSvgX(tick, xMin, xMax)}
                y2={padT + plotH}
                stroke="#e0f2fe"
                strokeWidth="1"
              />
              <text
                x={toSvgX(tick, xMin, xMax)}
                y={padT + plotH + 12}
                textAnchor="middle"
                className="fill-slate-500 text-[9px] font-mono"
              >
                {tick.toFixed(1)}
              </text>
            </g>
          ))}
          {[0.25, 0.5, 0.75, 1].map((frac) => {
            const pTick = yMax * frac;
            return (
              <g key={frac}>
                <line
                  x1={padL}
                  y1={toSvgY(pTick, yMin, yMax)}
                  x2={padL + plotW}
                  y2={toSvgY(pTick, yMin, yMax)}
                  stroke="#e0f2fe"
                  strokeWidth="1"
                />
                <text
                  x={padL - 5}
                  y={toSvgY(pTick, yMin, yMax) + 3}
                  textAnchor="end"
                  className="fill-slate-500 text-[9px] font-mono"
                >
                  {pTick.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Straight line P = k * (1/V) */}
          <line
            x1={toSvgX(0, xMin, xMax)}
            y1={toSvgY(0, yMin, yMax)}
            x2={toSvgX(Math.min(xMax, yMax / kSlope), xMin, xMax)}
            y2={toSvgY(Math.min(yMax, kSlope * xMax), yMin, yMax)}
            stroke="#0284c7"
            strokeWidth="2.5"
          />

          <circle cx={curX} cy={curY} r="7" fill="rgba(5, 150, 105, 0.2)" />
          <circle cx={curX} cy={curY} r="4.5" fill="#059669" stroke="#ffffff" strokeWidth="1.5" />

          <text x={padL + plotW / 2} y={H - 4} textAnchor="middle" className="fill-slate-700 text-[10px] font-semibold">
            1 / V (L⁻¹)
          </text>
          <text
            x={12}
            y={padT + plotH / 2}
            textAnchor="middle"
            transform={`rotate(-90 12 ${padT + plotH / 2})`}
            className="fill-slate-700 text-[10px] font-semibold"
          >
            P (atm)
          </text>
        </>
      );
    }

    // PV vs P (Horizontal constant line)
    const pvVal = P * V;
    const xMin = 0;
    const xMax = Math.max(16, Math.ceil(P / 4) * 4 + 2);
    const yMin = 0;
    const yMax = Math.max(40, Math.ceil(pvVal / 10) * 10 + 15);
    const curX = toSvgX(Math.min(P, xMax), xMin, xMax);
    const curY = toSvgY(pvVal, yMin, yMax);

    return (
      <>
        {[0.25, 0.5, 0.75, 1].map((frac) => {
          const xTick = xMax * frac;
          const yTick = yMax * frac;
          return (
            <g key={frac}>
              <line
                x1={toSvgX(xTick, xMin, xMax)}
                y1={padT}
                x2={toSvgX(xTick, xMin, xMax)}
                y2={padT + plotH}
                stroke="#e0f2fe"
                strokeWidth="1"
              />
              <text
                x={toSvgX(xTick, xMin, xMax)}
                y={padT + plotH + 12}
                textAnchor="middle"
                className="fill-slate-500 text-[9px] font-mono"
              >
                {xTick.toFixed(0)}
              </text>
              <line
                x1={padL}
                y1={toSvgY(yTick, yMin, yMax)}
                x2={padL + plotW}
                y2={toSvgY(yTick, yMin, yMax)}
                stroke="#e0f2fe"
                strokeWidth="1"
              />
              <text
                x={padL - 5}
                y={toSvgY(yTick, yMin, yMax) + 3}
                textAnchor="end"
                className="fill-slate-500 text-[9px] font-mono"
              >
                {yTick.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Constant Horizontal Line PV = nRT */}
        <line
          x1={toSvgX(0.5, xMin, xMax)}
          y1={curY}
          x2={toSvgX(xMax, xMin, xMax)}
          y2={curY}
          stroke="#0284c7"
          strokeWidth="2.5"
        />
        <circle cx={curX} cy={curY} r="7" fill="rgba(5, 150, 105, 0.2)" />
        <circle cx={curX} cy={curY} r="4.5" fill="#059669" stroke="#ffffff" strokeWidth="1.5" />

        <text x={padL + plotW / 2} y={H - 4} textAnchor="middle" className="fill-slate-700 text-[10px] font-semibold">
          P (atm)
        </text>
        <text
          x={12}
          y={padT + plotH / 2}
          textAnchor="middle"
          transform={`rotate(-90 12 ${padT + plotH / 2})`}
          className="fill-slate-700 text-[10px] font-semibold"
        >
          PV (L·atm)
        </text>
      </>
    );
  };

  // Render Module 2: Charles's Law V vs T (with Absolute Zero Extrapolation)
  const renderCharlesGraph = () => {
    const xMinK = extrapolateAbsZero ? 0 : 20;
    const xMaxK = 600;
    const maxTheoreticalV = (n * R_ATM * xMaxK) / P;
    const yMin = 0;
    const yMax = Math.max(14, Math.ceil(maxTheoreticalV / 4) * 4);

    const expStartK = 23.15; // -250 C
    const expEndK = 573.15; // +300 C
    const vAtExpStart = (n * R_ATM * expStartK) / P;
    const vAtExpEnd = (n * R_ATM * expEndK) / P;

    const curX = toSvgX(T, xMinK, xMaxK);
    const curY = toSvgY(V, yMin, yMax);

    const xTicksK = [0, 150, 273.15, 450, 573.15];

    return (
      <>
        {xTicksK.map((tk) => {
          if (tk < xMinK) return null;
          const label =
            tempUnit === 'C'
              ? `${Math.round(tk - KELVIN_OFFSET)}°`
              : `${Math.round(tk)}`;
          return (
            <g key={tk}>
              <line
                x1={toSvgX(tk, xMinK, xMaxK)}
                y1={padT}
                x2={toSvgX(tk, xMinK, xMaxK)}
                y2={padT + plotH}
                stroke={tk === 0 ? '#fda4af' : '#e0f2fe'}
                strokeWidth={tk === 0 ? '1.5' : '1'}
              />
              <text
                x={toSvgX(tk, xMinK, xMaxK)}
                y={padT + plotH + 12}
                textAnchor="middle"
                className={`text-[8.5px] font-mono ${
                  tk === 0 ? 'fill-rose-600 font-bold' : 'fill-slate-500'
                }`}
              >
                {label}
              </text>
            </g>
          );
        })}

        {[0.25, 0.5, 0.75, 1].map((frac) => {
          const vTick = yMax * frac;
          return (
            <g key={frac}>
              <line
                x1={padL}
                y1={toSvgY(vTick, yMin, yMax)}
                x2={padL + plotW}
                y2={toSvgY(vTick, yMin, yMax)}
                stroke="#e0f2fe"
                strokeWidth="1"
              />
              <text
                x={padL - 5}
                y={toSvgY(vTick, yMin, yMax) + 3}
                textAnchor="end"
                className="fill-slate-500 text-[9px] font-mono"
              >
                {vTick.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Ghost Comparison Isobars */}
        {[1.0, 3.0, 5.0].map((gP) => {
          const vEnd = Math.min(yMax, (n * R_ATM * expEndK) / gP);
          const kEnd = Math.min(expEndK, (vEnd * gP) / (n * R_ATM));
          return (
            <line
              key={gP}
              x1={toSvgX(extrapolateAbsZero ? 0 : expStartK, xMinK, xMaxK)}
              y1={toSvgY(
                extrapolateAbsZero ? 0 : (n * R_ATM * expStartK) / gP,
                yMin,
                yMax
              )}
              x2={toSvgX(kEnd, xMinK, xMaxK)}
              y2={toSvgY(vEnd, yMin, yMax)}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="2,3"
              opacity="0.5"
            />
          );
        })}

        {/* Dashed Extrapolation Line to Absolute Zero (0 K / -273.15 C) */}
        {extrapolateAbsZero && (
          <>
            <line
              x1={toSvgX(0, xMinK, xMaxK)}
              y1={toSvgY(0, yMin, yMax)}
              x2={toSvgX(expStartK, xMinK, xMaxK)}
              y2={toSvgY(vAtExpStart, yMin, yMax)}
              stroke="#e11d48"
              strokeWidth="2.2"
              strokeDasharray="4,3"
            />
            <circle
              cx={toSvgX(0, xMinK, xMaxK)}
              cy={toSvgY(0, yMin, yMax)}
              r="4.5"
              fill="#e11d48"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <text
              x={toSvgX(0, xMinK, xMaxK) + 6}
              y={toSvgY(0, yMin, yMax) - 6}
              className="fill-rose-600 text-[8.5px] font-mono font-bold"
            >
              {tempUnit === 'C' ? '−273.15°C' : '0 K'}
            </text>
          </>
        )}

        {/* Solid Experimental Line */}
        <line
          x1={toSvgX(expStartK, xMinK, xMaxK)}
          y1={toSvgY(vAtExpStart, yMin, yMax)}
          x2={toSvgX(expEndK, xMinK, xMaxK)}
          y2={toSvgY(vAtExpEnd, yMin, yMax)}
          stroke="#0284c7"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Crosshair */}
        <line
          x1={curX}
          y1={curY}
          x2={curX}
          y2={padT + plotH}
          stroke="#059669"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
        <line
          x1={padL}
          y1={curY}
          x2={curX}
          y2={curY}
          stroke="#059669"
          strokeWidth="1"
          strokeDasharray="2,2"
        />

        <circle cx={curX} cy={curY} r="7" fill="rgba(5, 150, 105, 0.2)" />
        <circle cx={curX} cy={curY} r="4.5" fill="#059669" stroke="#ffffff" strokeWidth="1.5" />

        <text x={padL + plotW / 2} y={H - 4} textAnchor="middle" className="fill-slate-700 text-[10px] font-semibold">
          {tempUnit === 'C' ? 'θ (°C)' : 'T (K)'}
        </text>
        <text
          x={12}
          y={padT + plotH / 2}
          textAnchor="middle"
          transform={`rotate(-90 12 ${padT + plotH / 2})`}
          className="fill-slate-700 text-[10px] font-semibold"
        >
          V (L)
        </text>
      </>
    );
  };

  // Render Module 3: Gay-Lussac's Law P vs T Isochore
  const renderGayLussacGraph = () => {
    const xMinK = 0;
    const xMaxK = 820;
    const pAtMax = (n * R_ATM * xMaxK) / V;
    const yMin = 0;
    const yMax = Math.max(16, Math.ceil(Math.max(P, pAtMax) / 4) * 4);

    const curX = toSvgX(Math.min(T, xMaxK), xMinK, xMaxK);
    const curY = toSvgY(Math.min(P, yMax), yMin, yMax);

    const xTicksK = [0, 200, 400, 600, 800];

    return (
      <>
        {xTicksK.map((tk) => (
          <g key={tk}>
            <line
              x1={toSvgX(tk, xMinK, xMaxK)}
              y1={padT}
              x2={toSvgX(tk, xMinK, xMaxK)}
              y2={padT + plotH}
              stroke="#e0f2fe"
              strokeWidth="1"
            />
            <text
              x={toSvgX(tk, xMinK, xMaxK)}
              y={padT + plotH + 12}
              textAnchor="middle"
              className="fill-slate-500 text-[9px] font-mono"
            >
              {tk}
            </text>
          </g>
        ))}

        {[0.25, 0.5, 0.75, 1].map((frac) => {
          const pTick = yMax * frac;
          return (
            <g key={frac}>
              <line
                x1={padL}
                y1={toSvgY(pTick, yMin, yMax)}
                x2={padL + plotW}
                y2={toSvgY(pTick, yMin, yMax)}
                stroke="#e0f2fe"
                strokeWidth="1"
              />
              <text
                x={padL - 5}
                y={toSvgY(pTick, yMin, yMax) + 3}
                textAnchor="end"
                className="fill-slate-500 text-[9px] font-mono"
              >
                {pTick.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Safety Relief Threshold Line at 12 atm */}
        {RELIEF_VALVE_ATM <= yMax && (
          <g>
            <line
              x1={padL}
              y1={toSvgY(RELIEF_VALVE_ATM, yMin, yMax)}
              x2={padL + plotW}
              y2={toSvgY(RELIEF_VALVE_ATM, yMin, yMax)}
              stroke="#f43f5e"
              strokeWidth="1.2"
              strokeDasharray="4,3"
            />
            <text
              x={padL + plotW - 2}
              y={toSvgY(RELIEF_VALVE_ATM, yMin, yMax) - 3}
              textAnchor="end"
              className="fill-rose-600 text-[8px] font-mono font-bold"
            >
              12 atm limit
            </text>
          </g>
        )}

        {/* Ghost Isochores */}
        {[2.0, 4.5, 8.0].map((gV) => {
          const pMaxLine = (n * R_ATM * xMaxK) / gV;
          const clampedY = Math.min(yMax, pMaxLine);
          const clampedK = Math.min(xMaxK, (clampedY * gV) / (n * R_ATM));
          return (
            <line
              key={gV}
              x1={toSvgX(0, xMinK, xMaxK)}
              y1={toSvgY(0, yMin, yMax)}
              x2={toSvgX(clampedK, xMinK, xMaxK)}
              y2={toSvgY(clampedY, yMin, yMax)}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="2,3"
              opacity="0.5"
            />
          );
        })}

        {/* Extrapolated Origin Segment (0 -> 100K) */}
        <line
          x1={toSvgX(0, xMinK, xMaxK)}
          y1={toSvgY(0, yMin, yMax)}
          x2={toSvgX(100, xMinK, xMaxK)}
          y2={toSvgY((n * R_ATM * 100) / V, yMin, yMax)}
          stroke="#e11d48"
          strokeWidth="2"
          strokeDasharray="3,3"
        />

        {/* Active Isochore Segment */}
        {(() => {
          const kTop = Math.min(xMaxK, (yMax * V) / (n * R_ATM));
          const pTop = (n * R_ATM * kTop) / V;
          return (
            <line
              x1={toSvgX(100, xMinK, xMaxK)}
              y1={toSvgY((n * R_ATM * 100) / V, yMin, yMax)}
              x2={toSvgX(kTop, xMinK, xMaxK)}
              y2={toSvgY(pTop, yMin, yMax)}
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          );
        })()}

        {snapshot && (
          <circle
            cx={toSvgX(Math.min(snapshot.T, xMaxK), xMinK, xMaxK)}
            cy={toSvgY(Math.min(snapshot.P, yMax), yMin, yMax)}
            r="4"
            fill="#ffffff"
            stroke="#d97706"
            strokeWidth="2"
          />
        )}

        <circle cx={curX} cy={curY} r="7" fill="rgba(5, 150, 105, 0.2)" />
        <circle cx={curX} cy={curY} r="4.5" fill="#059669" stroke="#ffffff" strokeWidth="1.5" />

        <text x={padL + plotW / 2} y={H - 4} textAnchor="middle" className="fill-slate-700 text-[10px] font-semibold">
          T (K)
        </text>
        <text
          x={12}
          y={padT + plotH / 2}
          textAnchor="middle"
          transform={`rotate(-90 12 ${padT + plotH / 2})`}
          className="fill-slate-700 text-[10px] font-semibold"
        >
          P (atm)
        </text>
      </>
    );
  };

  return (
    <div className="bg-white border border-sky-200 rounded-2xl shadow-sm p-4 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-slate-700">{t.telemetry.graphHeading}</h3>
        <span className="text-[11px] font-mono tabular-nums text-sky-700 font-semibold">
          {moduleId === 'boyle' && `(${V.toFixed(2)} L, ${P.toFixed(2)} atm)`}
          {moduleId === 'charles' &&
            `(${
              tempUnit === 'C'
                ? `${kelvinToCelsius(T).toFixed(1)}°C`
                : `${T.toFixed(1)} K`
            }, ${V.toFixed(2)} L)`}
          {moduleId === 'gaylussac' && `(${T.toFixed(1)} K, ${P.toFixed(2)} atm)`}
        </span>
      </div>

      {/* Module 1 Dual Switchable Graph Controls */}
      {moduleId === 'boyle' && (
        <div className="grid grid-cols-3 gap-1 p-1 bg-sky-50 border border-sky-200 rounded-lg">
          {(['pv', 'p_inv_v', 'pv_vs_p'] as BoyleGraphMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onChangeBoyleGraphMode(mode)}
              className={`py-1 px-1.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                boyleGraphMode === mode
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              {mode === 'pv' && t.telemetry.graphPV}
              {mode === 'p_inv_v' && t.telemetry.graphPInvV}
              {mode === 'pv_vs_p' && t.telemetry.graphPVvsP}
            </button>
          ))}
        </div>
      )}

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-slate-50/70 rounded-xl border border-sky-100">
        {/* Coordinate Axes */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#64748b" strokeWidth="1.5" />
        <line
          x1={padL}
          y1={padT + plotH}
          x2={padL + plotW}
          y2={padT + plotH}
          stroke="#64748b"
          strokeWidth="1.5"
        />

        {moduleId === 'boyle' && renderBoyleGraph()}
        {moduleId === 'charles' && renderCharlesGraph()}
        {moduleId === 'gaylussac' && renderGayLussacGraph()}
      </svg>

      {/* Legend Line */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-600">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-0.5 bg-sky-600 inline-block" />
            {moduleId === 'boyle' && t.telemetry.ghostIsotherms}
            {moduleId === 'charles' && t.telemetry.ghostIsobars}
            {moduleId === 'gaylussac' && t.telemetry.ghostIsochores}
          </span>
        </div>
        {moduleId === 'charles' && extrapolateAbsZero && (
          <span className="text-rose-600 font-semibold">{t.telemetry.absZeroPoint}</span>
        )}
      </div>
    </div>
  );
};
