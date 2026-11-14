import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ATM_TO_KPA, RELIEF_VALVE_ATM, type Language } from '../types';
import { TRANSLATIONS } from '../i18n';
import { clamp, kelvinToCelsius } from '../physics/gasPhysics';

interface PressureGaugeProps {
  lang: Language;
  P: number;
  V: number;
  T: number;
  collisionRate: number;
}

export const PressureGauge: React.FC<PressureGaugeProps> = ({
  lang,
  P,
  V,
  T,
  collisionRate,
}) => {
  const t = TRANSLATIONS[lang];
  const maxDial = 16;
  const clampedP = clamp(P, 0, maxDial);
  // Map 0..16 atm to -125 deg .. +125 deg
  const angleDeg = -125 + (clampedP / maxDial) * 250;
  const isOverPressure = P > RELIEF_VALVE_ATM;
  const tempC = kelvinToCelsius(T);
  const kPa = P * ATM_TO_KPA;

  const cx = 100;
  const cy = 96;
  const r = 72;

  const polarToCartesian = (deg: number, radius: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };

  const describeArc = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(endAngle, radius);
    const end = polarToCartesian(startAngle, radius);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const safeEndDeg = -125 + (RELIEF_VALVE_ATM / maxDial) * 250;
  const ticks = [0, 2, 4, 6, 8, 10, 12, 14, 16];

  return (
    <div className="bg-white border border-sky-200 rounded-2xl shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-slate-700 tracking-wide">
          {t.telemetry.pressureGauge}
        </h3>
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
            isOverPressure ? 'text-rose-700' : 'text-emerald-700'
          }`}
        >
          {isOverPressure ? (
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>
            {isOverPressure
              ? t.telemetry.highPressureAlert
              : t.telemetry.normalPressureState}
          </span>
        </span>
      </div>

      {/* Analog Dial + Digital Readout */}
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 200 132" className="w-full max-w-[235px] overflow-visible">
          {/* Background Track */}
          <path
            d={describeArc(-125, 125, r)}
            fill="none"
            stroke="#e0f2fe"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Safe Zone Arc (0 - 12 atm) */}
          <path
            d={describeArc(-125, safeEndDeg, r)}
            fill="none"
            stroke="#059669"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.85"
          />
          {/* High-Pressure Danger Zone Arc (12 - 16 atm) */}
          <path
            d={describeArc(safeEndDeg, 125, r)}
            fill="none"
            stroke="#e11d48"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Scale Ticks & Labels */}
          {ticks.map((val) => {
            const deg = -125 + (val / maxDial) * 250;
            const pOuter = polarToCartesian(deg, r - 8);
            const pInner = polarToCartesian(deg, r - 16);
            const pText = polarToCartesian(deg, r - 26);
            return (
              <g key={val}>
                <line
                  x1={pOuter.x}
                  y1={pOuter.y}
                  x2={pInner.x}
                  y2={pInner.y}
                  stroke={val >= 12 ? '#be123c' : '#334155'}
                  strokeWidth={val % 4 === 0 ? '2' : '1.2'}
                />
                {val % 4 === 0 && (
                  <text
                    x={pText.x}
                    y={pText.y + 3}
                    textAnchor="middle"
                    className="fill-slate-700 text-[9px] font-mono font-semibold"
                  >
                    {val}
                  </text>
                )}
              </g>
            );
          })}

          {/* Needle */}
          <g
            style={{
              transform: `rotate(${angleDeg}deg)`,
              transformOrigin: `${cx}px ${cy}px`,
              transition: 'transform 140ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <polygon
              points={`${cx - 3},${cy + 8} ${cx},${cy - 62} ${cx + 3},${cy + 8}`}
              fill={isOverPressure ? '#e11d48' : '#0f172a'}
            />
          </g>

          {/* Pivot Cap */}
          <circle cx={cx} cy={cy} r="7" fill="#0f172a" />
          <circle cx={cx} cy={cy} r="3" fill="#38bdf8" />

          {/* Digital Center Readout */}
          <text
            x={cx}
            y={cy + 26}
            textAnchor="middle"
            className={`text-[18px] font-mono font-bold tabular-nums ${
              isOverPressure ? 'fill-rose-600' : 'fill-slate-950'
            }`}
          >
            {P.toFixed(2)} atm
          </text>
          <text
            x={cx}
            y={cy + 39}
            textAnchor="middle"
            className="fill-slate-500 text-[10px] font-mono tabular-nums"
          >
            {kPa.toFixed(1)} kPa
          </text>
        </svg>
      </div>

      {/* Synchronized Telemetry Grid */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-sky-100">
        <div className="bg-sky-50/70 rounded-xl px-2.5 py-2">
          <div className="text-[10px] font-semibold text-slate-500 truncate">
            {t.telemetry.volumeReadout}
          </div>
          <div className="text-sm font-bold font-mono tabular-nums text-slate-950">
            {V.toFixed(2)} <span className="text-[11px] font-normal text-slate-600">{t.units.L}</span>
          </div>
        </div>

        <div className="bg-sky-50/70 rounded-xl px-2.5 py-2">
          <div className="text-[10px] font-semibold text-slate-500 truncate">
            {t.telemetry.temperatureReadout}
          </div>
          <div className="text-sm font-bold font-mono tabular-nums text-slate-950">
            {T.toFixed(1)} <span className="text-[11px] font-normal text-slate-600">{t.units.K}</span>
          </div>
          <div className="text-[10px] font-mono tabular-nums text-slate-500">
            {tempC.toFixed(1)} {t.units.C}
          </div>
        </div>

        <div className="bg-sky-50/70 rounded-xl px-2.5 py-2">
          <div className="text-[10px] font-semibold text-slate-500 truncate">
            {t.telemetry.collisionRate}
          </div>
          <div className="text-sm font-bold font-mono tabular-nums text-emerald-700">
            {Math.round(collisionRate)}
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            {t.telemetry.hitsPerSec}
          </div>
        </div>
      </div>
    </div>
  );
};
