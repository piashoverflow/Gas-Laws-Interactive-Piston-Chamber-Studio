import type { Language, ModuleId } from './types';

export interface TranslationDict {
  studioTitle: string;
  studioSubtitle: string;
  reset: string;
  langToggleBn: string;
  langToggleEn: string;
  modules: Record<ModuleId, {
    shortTitle: string;
    fullTitle: string;
    lawTag: string;
    summary: string;
  }>;
  controls: {
    parametersHeading: string;
    playbackHeading: string;
    volume: string;
    externalPressure: string;
    temperature: string;
    moles: string;
    constantTemp: string;
    constantPressure: string;
    lockedVolume: string;
    slottedWeights: string;
    addWeight: string;
    removeWeight: string;
    clearWeights: string;
    weightsHint: string;
    tempUnitToggle: string;
    extrapolateAbsZero: string;
    extrapolateDesc: string;
    thermalActions: string;
    iceBath: string;
    roomTemp: string;
    burnerHeat: string;
    lockPistonToggle: string;
    lockedModeLabel: string;
    sandboxModeLabel: string;
    solveForLabel: string;
    play: string;
    pause: string;
    slowMo: string;
    normalSpeed: string;
    step: string;
    dragPistonHint: string;
    boyleInputMode: string;
    byVolume: string;
    byPressure: string;
  };
  canvas: {
    cylinderLabel: string;
    pistonDraggable: string;
    pistonLocked: string;
    pistonFloating: string;
    isothermalBath: string;
    iceBathActive: string;
    burnerActive: string;
    ambientBase: string;
    reliefValveWarning: string;
    reliefValveNominal: string;
    moleculesCount: string;
    weightsLabel: string;
    absZeroReached: string;
  };
  telemetry: {
    pressureGauge: string;
    volumeReadout: string;
    temperatureReadout: string;
    collisionRate: string;
    hitsPerSec: string;
    graphHeading: string;
    graphPV: string;
    graphPInvV: string;
    graphPVvsP: string;
    ghostIsotherms: string;
    ghostIsobars: string;
    ghostIsochores: string;
    absZeroPoint: string;
    formulaCardHeading: string;
    captureState1: string;
    state1Label: string;
    state2Label: string;
    constantK: string;
    idealGasVerifier: string;
    unitSwitchLabel: string;
    leftSide: string;
    rightSide: string;
    verifiedMatch: string;
    highPressureAlert: string;
    normalPressureState: string;
  };
  units: {
    L: string;
    atm: string;
    kPa: string;
    K: string;
    C: string;
    mol: string;
    J: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationDict> = {
  bn: {
    studioTitle: 'গ্যাসের সূত্রাবলি ও পিস্টন চেম্বার স্টুডিও',
    studioSubtitle: 'আণবিক গতিবিদ্যা ও তাপগতিবিজ্ঞান গবেষণাগার',
    reset: 'রিসেট',
    langToggleBn: 'বাংলা',
    langToggleEn: 'English',
    modules: {
      boyle: {
        shortTitle: '১. বয়েলের সূত্র',
        fullTitle: 'মডিউল ১: বয়েলের সূত্র (স্থির তাপমাত্রা T)',
        lawTag: 'সমোষ্ণ প্রক্রিয়া · P ∝ 1/V',
        summary: 'তাপমাত্রা (T) ও গ্যাসের ভর (n) স্থির থাকলে চাপ আয়তনের ব্যস্তানুপাতিক।',
      },
      charles: {
        shortTitle: '২. চার্লসের সূত্র',
        fullTitle: 'মডিউল ২: চার্লসের সূত্র ও পরম শূন্য তাপমাত্রা (স্থির চাপ P)',
        lawTag: 'সমচাপীয় প্রক্রিয়া · V ∝ T',
        summary: 'চাপ (P) স্থির থাকলে গ্যাসের আয়তন পরম তাপমাত্রার সমানুপাতিক এবং −273.15°C-এ শূন্য হয়।',
      },
      gaylussac: {
        shortTitle: '৩. চাপীয় সূত্র ও PV=nRT',
        fullTitle: 'মডিউল ৩: রেনোর চাপীয় সূত্র ও আদর্শ গ্যাস সমীকরণ',
        lawTag: 'সমআয়তন প্রক্রিয়া · P ∝ T · PV = nRT',
        summary: 'আয়তন (V) স্থির থাকলে চাপ পরম তাপমাত্রার সমানুপাতিক; মুক্ত মোডে PV = nRT যাচাই করুন।',
      },
    },
    controls: {
      parametersHeading: 'পরীক্ষণীয় চলক ও নিয়ন্ত্রণ',
      playbackHeading: 'সিমুলেশন ও অ্যানিমেশন',
      volume: 'চেম্বার আয়তন (V)',
      externalPressure: 'বাহ্যিক চাপ (P)',
      temperature: 'তাপমাত্রা (T)',
      moles: 'গ্যাসের পরিমাণ (n)',
      constantTemp: 'স্থির তাপমাত্রা (T)',
      constantPressure: 'স্থির চাপ লোড (P)',
      lockedVolume: 'স্থির আয়তন (V)',
      slottedWeights: 'পিস্টনে বাটখারা যুক্ত করুন',
      addWeight: '+১ atm বাটখারা',
      removeWeight: '−১ atm',
      clearWeights: 'সব সরান',
      weightsHint: 'চেম্বারে পিস্টন টেনে অথবা বাটখারা বসিয়ে চাপ পরিবর্তন করুন',
      tempUnitToggle: 'তাপমাত্রার একক',
      extrapolateAbsZero: 'পরম শূন্য (−273.15°C) বর্ধিত রেখা',
      extrapolateDesc: 'সেলসিয়াস লেখচিত্র পেছনে টেনে −273.15°C (0 K) ছেদবিন্দু দেখুন',
      thermalActions: 'তাপীয় উৎস নিয়ন্ত্রণ',
      iceBath: 'বরফ শীতল',
      roomTemp: 'কক্ষ তাপমাত্রা',
      burnerHeat: 'বার্নার উত্তাপ',
      lockPistonToggle: 'পিস্টন লক / মুক্ত মোড',
      lockedModeLabel: 'লক করা আয়তন (চাপীয় সূত্র)',
      sandboxModeLabel: 'সকল চলক মুক্ত (PV = nRT)',
      solveForLabel: 'পরিবর্তনশীল চলক (নির্ভরশীল)',
      play: 'চালু',
      pause: 'বিরতি',
      slowMo: 'ধীর গতি (0.35×)',
      normalSpeed: 'স্বাভাবিক (1×)',
      step: 'ধাপ',
      dragPistonHint: 'ক্যানভাসে পিস্টন ধরে উপরে/নিচে টানতে পারবেন',
      boyleInputMode: 'নিয়ন্ত্রণ পদ্ধতি',
      byVolume: 'আয়তন (V) দিয়ে',
      byPressure: 'চাপ (P) দিয়ে',
    },
    canvas: {
      cylinderLabel: 'গ্র্যাজুয়েটেড কাচের সিলিন্ডার',
      pistonDraggable: 'টেনে সরানো যাবে (অবাধ পিস্টন)',
      pistonLocked: 'যান্ত্রিক পিন দিয়ে আবদ্ধ (V স্থির)',
      pistonFloating: 'স্থির চাপে ভাসমান পিস্টন',
      isothermalBath: 'সমোষ্ণ তাপ-নিয়ন্ত্রক আধার',
      iceBathActive: 'বরফ-পানি শীতলকরণ সক্রিয়',
      burnerActive: 'বার্নার উত্তাপন সক্রিয়',
      ambientBase: 'নিরপেক্ষ তাপীয় প্লেট',
      reliefValveWarning: 'সতর্কতা: চাপ > 12 atm · সেফটি ভাল্ভ খোলা',
      reliefValveNominal: 'নিরাপদ চাপ সীমা (≤ 12 atm)',
      moleculesCount: 'অণু সংখ্যা',
      weightsLabel: 'বাটখারা চাপ',
      absZeroReached: 'পরম শূন্যের নিকটবর্তী (−273.15°C)',
    },
    telemetry: {
      pressureGauge: 'লাইভ প্রেসার গেজ',
      volumeReadout: 'আয়তন (V)',
      temperatureReadout: 'তাপমাত্রা (T)',
      collisionRate: 'দেয়ালে সংঘর্ষ হার',
      hitsPerSec: 'সংঘর্ষ/সে.',
      graphHeading: 'লাইভ বৈজ্ঞানিক লেখচিত্র',
      graphPV: 'P বনাম V',
      graphPInvV: 'P বনাম 1/V',
      graphPVvsP: 'PV বনাম P',
      ghostIsotherms: 'বিভিন্ন তাপমাত্রার সমোষ্ণ রেখা',
      ghostIsobars: 'সমচাপীয় তুলনামূলক রেখা',
      ghostIsochores: 'সমআয়তন তুলনামূলক রেখা',
      absZeroPoint: 'পরম শূন্য (−273.15°C, 0 L)',
      formulaCardHeading: 'সূত্র ও তাৎক্ষণিক মান যাচাই',
      captureState1: 'অবস্থা-১ সংরক্ষণ',
      state1Label: 'অবস্থা ১',
      state2Label: 'অবস্থা ২ (বর্তমান)',
      constantK: 'ধ্রুবক',
      idealGasVerifier: 'আদর্শ গ্যাস সমীকরণ যাচাই (PV = nRT)',
      unitSwitchLabel: 'R এর একক',
      leftSide: 'বাম পক্ষ (PV)',
      rightSide: 'ডান পক্ষ (nRT)',
      verifiedMatch: 'উভয় পক্ষ সমান — সূত্র প্রমাণিত',
      highPressureAlert: 'উচ্চ চাপ সতর্কতা (> 12 atm)',
      normalPressureState: 'স্বাভাবিক চাপ',
    },
    units: {
      L: 'L',
      atm: 'atm',
      kPa: 'kPa',
      K: 'K',
      C: '°C',
      mol: 'mol',
      J: 'J',
    },
  },
  en: {
    studioTitle: 'Gas Laws & Interactive Piston Chamber Studio',
    studioSubtitle: 'Molecular Kinetics & Thermodynamics Laboratory',
    reset: 'Reset',
    langToggleBn: 'বাংলা',
    langToggleEn: 'English',
    modules: {
      boyle: {
        shortTitle: "1. Boyle's Law",
        fullTitle: "Module 1: Boyle's Law (Constant Temperature T)",
        lawTag: 'Isothermal Process · P ∝ 1/V',
        summary: 'At constant temperature (T) and moles (n), gas pressure varies inversely with volume.',
      },
      charles: {
        shortTitle: "2. Charles's Law",
        fullTitle: "Module 2: Charles's Law & Absolute Zero (Constant Pressure P)",
        lawTag: 'Isobaric Process · V ∝ T',
        summary: 'At constant pressure (P), gas volume expands linearly with Kelvin temperature toward −273.15°C.',
      },
      gaylussac: {
        shortTitle: '3. Pressure Law & PV=nRT',
        fullTitle: "Module 3: Gay-Lussac's Pressure Law & Ideal Gas Equation",
        lawTag: 'Isochoric Process · P ∝ T · PV = nRT',
        summary: 'At constant volume (V), pressure scales with Kelvin temperature; unlock all variables for PV = nRT.',
      },
    },
    controls: {
      parametersHeading: 'Experimental Controls',
      playbackHeading: 'Simulation Playback',
      volume: 'Chamber Volume (V)',
      externalPressure: 'External Pressure (P)',
      temperature: 'Temperature (T)',
      moles: 'Gas Amount (n)',
      constantTemp: 'Constant Temperature (T)',
      constantPressure: 'Constant Pressure Load (P)',
      lockedVolume: 'Locked Volume (V)',
      slottedWeights: 'Stack Piston Weights',
      addWeight: '+1 atm Weight',
      removeWeight: '−1 atm',
      clearWeights: 'Clear',
      weightsHint: 'Drag the piston directly or stack slotted weights to compress the gas',
      tempUnitToggle: 'Temperature Scale',
      extrapolateAbsZero: 'Extrapolate to Absolute Zero (−273.15°C)',
      extrapolateDesc: 'Extend the linear V-θ line back to its zero-volume intercept at −273.15°C (0 K)',
      thermalActions: 'Thermal Base Presets',
      iceBath: 'Ice Bath',
      roomTemp: 'Room Temp',
      burnerHeat: 'Burner Heat',
      lockPistonToggle: 'Piston Lock Mode',
      lockedModeLabel: 'Locked Volume (Pressure Law)',
      sandboxModeLabel: 'Free All Variables (PV = nRT)',
      solveForLabel: 'Dependent Variable',
      play: 'Play',
      pause: 'Pause',
      slowMo: 'Slow Mo (0.35×)',
      normalSpeed: 'Normal (1×)',
      step: 'Step',
      dragPistonHint: 'Drag the piston handle up or down directly on the chamber',
      boyleInputMode: 'Primary Control',
      byVolume: 'Control V',
      byPressure: 'Control P',
    },
    canvas: {
      cylinderLabel: 'Graduated Borosilicate Cylinder',
      pistonDraggable: 'Draggable Frictionless Piston',
      pistonLocked: 'Mechanically Locked (V = const)',
      pistonFloating: 'Floating Constant-Load Piston',
      isothermalBath: 'Constant-T Thermal Bath',
      iceBathActive: 'Cryogenic Ice Bath Active',
      burnerActive: 'Thermal Burner Active',
      ambientBase: 'Neutral Thermal Plate',
      reliefValveWarning: 'Alert: P > 12 atm · Relief Valve Open',
      reliefValveNominal: 'Nominal Pressure (≤ 12 atm)',
      moleculesCount: 'Molecules',
      weightsLabel: 'Load Mass',
      absZeroReached: 'Approaching Absolute Zero',
    },
    telemetry: {
      pressureGauge: 'Live Pressure Gauge',
      volumeReadout: 'Volume (V)',
      temperatureReadout: 'Temperature (T)',
      collisionRate: 'Wall Impact Frequency',
      hitsPerSec: 'hits/s',
      graphHeading: 'Synchronized Live Plot',
      graphPV: 'P vs V',
      graphPInvV: 'P vs 1/V',
      graphPVvsP: 'PV vs P',
      ghostIsotherms: 'Reference Isotherms',
      ghostIsobars: 'Reference Isobars',
      ghostIsochores: 'Reference Isochores',
      absZeroPoint: 'Absolute Zero (−273.15°C, 0 L)',
      formulaCardHeading: 'Live Formula Verification',
      captureState1: 'Capture State 1',
      state1Label: 'State 1',
      state2Label: 'State 2 (Live)',
      constantK: 'Constant',
      idealGasVerifier: 'Ideal Gas Verifier (PV = nRT)',
      unitSwitchLabel: 'R Constant Unit',
      leftSide: 'Left (PV)',
      rightSide: 'Right (nRT)',
      verifiedMatch: 'Identity Verified: PV = nRT',
      highPressureAlert: 'High Pressure (> 12 atm)',
      normalPressureState: 'Nominal Range',
    },
    units: {
      L: 'L',
      atm: 'atm',
      kPa: 'kPa',
      K: 'K',
      C: '°C',
      mol: 'mol',
      J: 'J',
    },
  },
};
