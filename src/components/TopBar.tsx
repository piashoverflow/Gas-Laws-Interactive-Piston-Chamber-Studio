import React from 'react';
import { RotateCcw, Languages, Atom } from 'lucide-react';
import type { Language, ModuleId } from '../types';
import { TRANSLATIONS } from '../i18n';

interface TopBarProps {
  lang: Language;
  activeModule: ModuleId;
  onSelectModule: (id: ModuleId) => void;
  onToggleLanguage: () => void;
  onReset: () => void;
}

const MODULE_ORDER: ModuleId[] = ['boyle', 'charles', 'gaylussac'];

export const TopBar: React.FC<TopBarProps> = ({
  lang,
  activeModule,
  onSelectModule,
  onToggleLanguage,
  onReset,
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-sky-200 shadow-xs">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-2.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
        {/* Left: Studio Title */}
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Atom className="w-5 h-5" />
          </div>
          <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-950 whitespace-nowrap truncate max-w-[300px] sm:max-w-none">
            {t.studioTitle}
          </h1>
        </div>

        {/* Center: 3 Interactive Lab Mode Tabs (Pill Navigation) */}
        <nav
          aria-label="Simulation Modules"
          className="order-3 lg:order-2 w-full lg:w-auto flex items-center justify-center gap-1 p-1 bg-sky-100/80 border border-sky-200 rounded-full overflow-x-auto"
        >
          {MODULE_ORDER.map((id) => {
            const isActive = activeModule === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectModule(id)}
                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-white/70'
                }`}
              >
                {t.modules[id].shortTitle}
              </button>
            );
          })}
        </nav>

        {/* Right: Language Switcher, Reset & Institution Badge */}
        <div className="order-2 lg:order-3 flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleLanguage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-slate-900 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            title="Switch Language"
          >
            <Languages className="w-3.5 h-3.5 text-sky-700" />
            <span>{lang === 'bn' ? t.langToggleEn : t.langToggleBn}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>{t.reset}</span>
          </button>

          <span className="bg-rose-50 border border-rose-300 text-rose-600 font-extrabold px-3 py-1 rounded-full text-sm whitespace-nowrap shrink-0">
            উদ্ভাস
          </span>
        </div>
      </div>
    </header>
  );
};
