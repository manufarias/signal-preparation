export type RangeStatus = "normal" | "watch" | "critical" | "unknown";

export interface ClinicalSource {
  label: string;
  year: string;
  url: string;
}

export interface ClinicalBasis {
  type: "guideline" | "consensus" | "operational";
  population: string;
  intendedUse: "screening" | "monitoring" | "alert";
  rationale: string;
}

export interface RangeResult {
  status: RangeStatus;
  label: string;
  description: string;
  source: ClinicalSource;
  basis: ClinicalBasis;
  range: {
    normal: string;
    watch: string;
    critical: string;
  };
}

interface RangeContext {
  hasHypertension?: boolean;
  hasCOPD?: boolean;
}

interface RangeDefinition {
  displayName: string;
  unit: string;
  loinc: string;
  clinicalDisclaimer: string;
  evaluate: (value: number, context?: RangeContext) => RangeResult;
}

const SOURCES = {
  accaha2017: {
    label: "ACC/AHA High Blood Pressure Guideline",
    year: "2017",
    url: "https://www.acc.org/latest-in-cardiology/articles/2017/11/08/11/47/mon-5pm-bp-guideline-aha-2017",
  },
  esc2024: {
    label: "ESC Elevated Blood Pressure and Hypertension Guideline",
    year: "2024",
    url: "https://www.acc.org/latest-in-cardiology/ten-points-to-remember/2024/09/05/14/11/2024-esc-guidelines-for-bp-esc-2024",
  },
  who2021: {
    label: "WHO Pharmacological Treatment of Hypertension in Adults",
    year: "2021",
    url: "https://www.who.int/publications/i/item/9789240033986",
  },
  bts2017: {
    label: "BTS Oxygen Use in Adults Guideline",
    year: "2017",
    url: "https://www.brit-thoracic.org.uk/quality-improvement/guidelines/emergency-oxygen/",
  },
  medlineplus2024: {
    label: "MedlinePlus Vital Signs Reference",
    year: "2024",
    url: "https://medlineplus.gov/spanish/ency/article/002341.htm",
  },
  heartRateConsensus2024: {
    label: "Adult Resting Heart Rate Reference",
    year: "2024",
    url: "https://my.clevelandclinic.org/health/diagnostics/heart-rate",
  },
  painConsensus: {
    label: "Numeric Rating Scale Pain Severity Reference",
    year: "2023",
    url: "https://geriatricpain.org/sites/geriatricpain.org/files/2023-12/Clinicians%20NRS%20Combined%20Instructions%20Plus%20Tool%20%282023%29.pdf",
  },
};

function invalidResult(
  source: ClinicalSource,
  basis: ClinicalBasis,
  range: RangeResult["range"],
  description: string,
): RangeResult {
  return {
    status: "unknown",
    label: "Invalid",
    description,
    source,
    basis,
    range,
  };
}

export const DEFINITIONS: Record<string, RangeDefinition> = {
  "8867-4": {
    displayName: "Resting Heart Rate",
    unit: "bpm",
    loinc: "8867-4",
    clinicalDisclaimer:
      "This range is intended for resting, pre-consultation ambulatory screening only. Heart rate should be interpreted with symptoms, physical conditioning, medications such as beta-blockers, rhythm status, and measurement conditions. An isolated value outside range does not by itself establish a diagnosis.",
    evaluate: (value) => {
      const range = {
        normal: "60–100 bpm",
        watch: "50–59 bpm or 101–110 bpm",
        critical: "<50 bpm or >110 bpm",
      };

      const basis: ClinicalBasis = {
        type: "consensus",
        population: "General adults in ambulatory resting measurement",
        intendedUse: "screening",
        rationale:
          "Built from the common adult resting reference range of 60–100 bpm, with a narrow review band added before flagging clearly abnormal values.",
      };

      if (!Number.isFinite(value) || value < 0 || value > 300) {
        return invalidResult(
          SOURCES.heartRateConsensus2024,
          basis,
          range,
          "Heart rate value is not physiologically plausible.",
        );
      }

      if (value >= 60 && value <= 100) {
        return {
          status: "normal",
          label: "Normal resting range",
          description:
            "Resting heart rate is within the usual adult ambulatory reference range.",
          source: SOURCES.heartRateConsensus2024,
          basis,
          range,
        };
      }

      if ((value >= 50 && value < 60) || (value > 100 && value <= 110)) {
        return {
          status: "watch",
          label: "Borderline resting rate",
          description:
            "Resting heart rate is slightly outside the usual adult reference range; repeat and interpret with symptoms, medications, and conditioning status.",
          source: SOURCES.heartRateConsensus2024,
          basis,
          range,
        };
      }

      return {
        status: "critical",
        label: "Clearly abnormal resting rate",
        description:
          "Resting heart rate is clearly outside the usual ambulatory reference range and warrants clinical review.",
        source: SOURCES.heartRateConsensus2024,
        basis,
        range,
      };
    },
  },

  "8480-6": {
    displayName: "Systolic Blood Pressure",
    unit: "mmHg",
    loinc: "8480-6",
    clinicalDisclaimer:
      "This range is intended for pre-consultation ambulatory screening or follow-up, not for diagnosing hypertension from a single reading. Blood pressure should be measured with proper technique, repeated during the visit, and often confirmed across visits or with home/ambulatory monitoring before a diagnosis is made. Symptoms, frailty, treatment status, and measurement conditions may change interpretation.",
    evaluate: (value, context) => {
      const hasHypertension = !!context?.hasHypertension;

      const range = hasHypertension
        ? {
            normal: "120–129 mmHg if tolerated (ESC treatment target)",
            watch: "130–139 mmHg or <120 mmHg",
            critical: "≥140 mmHg; crisis if >180 mmHg",
          }
        : {
            normal: "<120 mmHg",
            watch:
              "120–129 mmHg (elevated BP) or 130–139 mmHg (stage 1 hypertension)",
            critical: "≥140 mmHg (stage 2 hypertension); crisis if >180 mmHg",
          };

      const source = hasHypertension ? SOURCES.esc2024 : SOURCES.accaha2017;

      const basis: ClinicalBasis = hasHypertension
        ? {
            type: "guideline",
            population:
              "Adults with diagnosed hypertension in ambulatory follow-up",
            intendedUse: "monitoring",
            rationale:
              "Built from ESC 2024 treatment targets, which recommend a default systolic treatment target of 120–129 mmHg if tolerated for most treated adults.",
          }
        : {
            type: "guideline",
            population:
              "General adult population in office or ambulatory screening",
            intendedUse: "screening",
            rationale:
              "Built from ACC/AHA 2017 categories: normal <120 mmHg, elevated BP 120–129 mmHg, stage 1 hypertension 130–139 mmHg, stage 2 hypertension ≥140 mmHg, and hypertensive crisis >180 mmHg.",
          };

      if (!Number.isFinite(value) || value < 0 || value > 350) {
        return invalidResult(
          source,
          basis,
          range,
          "Systolic blood pressure value is not physiologically plausible.",
        );
      }

      if (value > 180) {
        return {
          status: "critical",
          label: "Hypertensive crisis range",
          description:
            "Systolic blood pressure is in the hypertensive crisis range and needs urgent clinical assessment, especially if symptoms or acute organ injury are present.",
          source: SOURCES.accaha2017,
          basis,
          range,
        };
      }

      if (hasHypertension) {
        if (value >= 120 && value <= 129) {
          return {
            status: "normal",
            label: "On treatment target",
            description:
              "Systolic blood pressure is within the ESC default treatment target range for treated hypertension if tolerated.",
            source,
            basis,
            range,
          };
        }

        if (value < 120) {
          return {
            status: "watch",
            label: "Below default treatment target",
            description:
              "Systolic blood pressure is below the ESC default target range; this may be acceptable, but should be interpreted with symptoms, orthostasis, frailty, and treatment tolerance.",
            source,
            basis,
            range,
          };
        }

        if (value >= 130 && value <= 139) {
          return {
            status: "watch",
            label: "Above treatment target",
            description:
              "Systolic blood pressure is above the default ESC treatment target and should be rechecked and interpreted in follow-up context.",
            source,
            basis,
            range,
          };
        }

        return {
          status: "critical",
          label: "Uncontrolled hypertension range",
          description:
            "Systolic blood pressure remains in a clearly uncontrolled range for a patient with known hypertension.",
          source,
          basis,
          range,
        };
      }

      if (value < 120) {
        return {
          status: "normal",
          label: "Normal blood pressure range",
          description:
            "Systolic blood pressure is in the ACC/AHA normal range.",
          source,
          basis,
          range,
        };
      }

      if (value < 130) {
        return {
          status: "watch",
          label: "Elevated blood pressure",
          description:
            "Systolic blood pressure is in the ACC/AHA elevated blood pressure range, below the hypertension threshold.",
          source,
          basis,
          range,
        };
      }

      if (value < 140) {
        return {
          status: "watch",
          label: "Stage 1 hypertension range",
          description:
            "Systolic blood pressure is in the ACC/AHA stage 1 hypertension range and should be clinically confirmed.",
          source,
          basis,
          range,
        };
      }

      return {
        status: "critical",
        label: "Stage 2 hypertension range",
        description:
          "Systolic blood pressure is in the ACC/AHA stage 2 hypertension range and warrants prompt clinical follow-up.",
        source,
        basis,
        range,
      };
    },
  },

  "8462-4": {
    displayName: "Diastolic Blood Pressure",
    unit: "mmHg",
    loinc: "8462-4",
    clinicalDisclaimer:
      "This range is intended for pre-consultation ambulatory screening or follow-up, not for diagnosing hypertension from a single reading. Diastolic blood pressure should be interpreted together with systolic pressure, repeat measurements, symptoms, treatment status, and overall cardiovascular context.",
    evaluate: (value, context) => {
      const hasHypertension = !!context?.hasHypertension;

      const range = hasHypertension
        ? {
            normal: "<80 mmHg",
            watch: "80–89 mmHg",
            critical: "≥90 mmHg; crisis if >120 mmHg",
          }
        : {
            normal: "<80 mmHg",
            watch: "80–89 mmHg (stage 1 hypertension)",
            critical: "≥90 mmHg (stage 2 hypertension); crisis if >120 mmHg",
          };

      const source = hasHypertension ? SOURCES.esc2024 : SOURCES.accaha2017;

      const basis: ClinicalBasis = hasHypertension
        ? {
            type: "guideline",
            population:
              "Adults with diagnosed hypertension in ambulatory follow-up",
            intendedUse: "monitoring",
            rationale:
              "Built as a treatment-monitoring rule where diastolic blood pressure below 80 mmHg is considered on target and higher levels are above target.",
          }
        : {
            type: "guideline",
            population:
              "General adult population in office or ambulatory screening",
            intendedUse: "screening",
            rationale:
              "Built from ACC/AHA 2017 categories, in which diastolic blood pressure 80–89 mmHg falls in stage 1 hypertension and ≥90 mmHg falls in stage 2 hypertension.",
          };

      if (!Number.isFinite(value) || value < 0 || value > 250) {
        return invalidResult(
          source,
          basis,
          range,
          "Diastolic blood pressure value is not physiologically plausible.",
        );
      }

      if (value > 120) {
        return {
          status: "critical",
          label: "Hypertensive crisis range",
          description:
            "Diastolic blood pressure is in the hypertensive crisis range and needs urgent clinical assessment, especially if symptoms or acute organ injury are present.",
          source: SOURCES.accaha2017,
          basis,
          range,
        };
      }

      if (hasHypertension) {
        if (value < 80) {
          return {
            status: "normal",
            label: "On treatment target",
            description:
              "Diastolic blood pressure is within the usual treatment target for a patient with hypertension.",
            source,
            basis,
            range,
          };
        }

        if (value < 90) {
          return {
            status: "watch",
            label: "Above treatment target",
            description:
              "Diastolic blood pressure is above the usual treatment target and should be rechecked in follow-up context.",
            source,
            basis,
            range,
          };
        }

        return {
          status: "critical",
          label: "Uncontrolled hypertension range",
          description:
            "Diastolic blood pressure remains in a clearly uncontrolled range for a patient with known hypertension.",
          source,
          basis,
          range,
        };
      }

      if (value < 80) {
        return {
          status: "normal",
          label: "Normal blood pressure range",
          description:
            "Diastolic blood pressure is in the ACC/AHA normal range.",
          source,
          basis,
          range,
        };
      }

      if (value < 90) {
        return {
          status: "watch",
          label: "Stage 1 hypertension range",
          description:
            "Diastolic blood pressure is in the ACC/AHA stage 1 hypertension range and should be clinically confirmed.",
          source,
          basis,
          range,
        };
      }

      return {
        status: "critical",
        label: "Stage 2 hypertension range",
        description:
          "Diastolic blood pressure is in the ACC/AHA stage 2 hypertension range and warrants prompt clinical follow-up.",
        source,
        basis,
        range,
      };
    },
  },

  "9279-1": {
    displayName: "Respiratory Rate",
    unit: "breaths/min",
    loinc: "9279-1",
    clinicalDisclaimer:
      "This range is intended for resting pre-consultation ambulatory screening. Respiratory rate is highly affected by anxiety, talking, pain, fever, exertion, and measurement technique. An isolated abnormal value should usually be repeated and interpreted together with symptoms and oxygen saturation.",
    evaluate: (value) => {
      const range = {
        normal: "12–20 breaths/min",
        watch: "10–11 or 21–24 breaths/min",
        critical: "≤9 or ≥25 breaths/min",
      };

      const basis: ClinicalBasis = {
        type: "consensus",
        population: "General adults in ambulatory resting measurement",
        intendedUse: "screening",
        rationale:
          "Built from the usual adult resting respiratory rate of 12–20 breaths/min, with a narrow borderline band added before flagging clearly abnormal values.",
      };

      if (!Number.isFinite(value) || value < 0 || value > 80) {
        return invalidResult(
          SOURCES.medlineplus2024,
          basis,
          range,
          "Respiratory rate value is not physiologically plausible.",
        );
      }

      if (value >= 12 && value <= 20) {
        return {
          status: "normal",
          label: "Normal resting range",
          description:
            "Respiratory rate is within the usual adult resting reference range.",
          source: SOURCES.medlineplus2024,
          basis,
          range,
        };
      }

      if ((value >= 10 && value < 12) || (value > 20 && value <= 24)) {
        return {
          status: "watch",
          label: "Borderline respiratory rate",
          description:
            "Respiratory rate is slightly outside the usual adult resting range and should usually be repeated.",
          source: SOURCES.medlineplus2024,
          basis,
          range,
        };
      }

      return {
        status: "critical",
        label: "Clearly abnormal respiratory rate",
        description:
          "Respiratory rate is clearly outside the usual adult resting range and warrants clinical review.",
        source: SOURCES.medlineplus2024,
        basis,
        range,
      };
    },
  },

  "8310-5": {
    displayName: "Oral Body Temperature",
    unit: "°C",
    loinc: "8310-5",
    clinicalDisclaimer:
      "This range is intended for oral temperature used in pre-consultation ambulatory screening. Temperature interpretation changes with measurement site, recent drinking or smoking, time of day, antipyretic use, and infection context. An isolated value should not be interpreted without symptoms and measurement method.",
    evaluate: (value) => {
      const range = {
        normal: "36.1–37.3 °C",
        watch: "37.4–37.9 °C",
        critical: "≥38.0 °C or <35.0 °C",
      };

      const basis: ClinicalBasis = {
        type: "consensus",
        population: "General adults with oral temperature measurement",
        intendedUse: "screening",
        rationale:
          "Built from common adult oral temperature references, with 38.0 °C used as a practical fever threshold and <35.0 °C used as a clinically significant low-temperature threshold.",
      };

      if (!Number.isFinite(value) || value < 25 || value > 45) {
        return invalidResult(
          SOURCES.medlineplus2024,
          basis,
          range,
          "Temperature value is not physiologically plausible.",
        );
      }

      if (value >= 36.1 && value <= 37.3) {
        return {
          status: "normal",
          label: "Normal oral temperature range",
          description:
            "Oral temperature is within the usual adult reference range.",
          source: SOURCES.medlineplus2024,
          basis,
          range,
        };
      }

      if (value > 37.3 && value < 38.0) {
        return {
          status: "watch",
          label: "Low-grade temperature elevation",
          description:
            "Temperature is mildly elevated and should be interpreted with symptoms and repeat measurement if needed.",
          source: SOURCES.medlineplus2024,
          basis,
          range,
        };
      }

      if (value >= 38.0) {
        return {
          status: "critical",
          label: "Fever range",
          description:
            "Temperature is in the fever range and should be interpreted clinically.",
          source: SOURCES.medlineplus2024,
          basis,
          range,
        };
      }

      return {
        status: "critical",
        label: "Low temperature range",
        description:
          "Temperature is below the usual adult reference range and warrants clinical review.",
        source: SOURCES.medlineplus2024,
        basis,
        range,
      };
    },
  },

  "59408-5": {
    displayName: "Oxygen Saturation",
    unit: "%",
    loinc: "59408-5",
    clinicalDisclaimer:
      "This range is intended for pulse oximetry screening or follow-up in ambulatory care. Pulse oximetry is an estimate of oxygenation and may be affected by low perfusion, motion, nail polish, skin factors, device quality, and dyshemoglobinemia. It does not measure ventilation and should be interpreted with symptoms, respiratory effort, and underlying lung disease.",
    evaluate: (value, context) => {
      const hasCOPD = !!context?.hasCOPD;

      const range = hasCOPD
        ? {
            normal: "88–92 %",
            watch: "86–87 % or 93–94 %",
            critical: "<86 % or >94 %",
          }
        : {
            normal: "94–98 %",
            watch: "92–93 %",
            critical: "<92 %",
          };

      const basis: ClinicalBasis = hasCOPD
        ? {
            type: "guideline",
            population:
              "Adults at risk of hypercapnic respiratory failure, including COPD target-range use",
            intendedUse: "monitoring",
            rationale:
              "Built from BTS oxygen target guidance of 88–92% for adults at risk of hypercapnic respiratory failure.",
          }
        : {
            type: "guideline",
            population:
              "Most adult ambulatory patients without a COPD hypercapnia target",
            intendedUse: "screening",
            rationale:
              "Built from BTS oxygen target guidance of 94–98% for most adults.",
          };

      if (!Number.isFinite(value) || value < 0 || value > 100) {
        return invalidResult(
          SOURCES.bts2017,
          basis,
          range,
          "Oxygen saturation value is not valid.",
        );
      }

      if (hasCOPD) {
        if (value >= 88 && value <= 92) {
          return {
            status: "normal",
            label: "On COPD oxygen target",
            description:
              "Oxygen saturation is within the BTS target range used for adults at risk of hypercapnic respiratory failure.",
            source: SOURCES.bts2017,
            basis,
            range,
          };
        }

        if ((value >= 86 && value < 88) || (value > 92 && value <= 94)) {
          return {
            status: "watch",
            label: "Borderline outside COPD target",
            description:
              "Oxygen saturation is slightly outside the COPD target range and should usually be rechecked and interpreted in context.",
            source: SOURCES.bts2017,
            basis,
            range,
          };
        }

        return {
          status: "critical",
          label: "Outside COPD oxygen target",
          description:
            "Oxygen saturation is clearly outside the COPD target range and warrants clinical review.",
          source: SOURCES.bts2017,
          basis,
          range,
        };
      }

      if (value >= 94 && value <= 98) {
        return {
          status: "normal",
          label: "Normal oxygen target range",
          description:
            "Oxygen saturation is within the BTS target range used for most adults.",
          source: SOURCES.bts2017,
          basis,
          range,
        };
      }

      if (value >= 92 && value < 94) {
        return {
          status: "watch",
          label: "Borderline low oxygen saturation",
          description:
            "Oxygen saturation is slightly below the usual adult target range and should be rechecked.",
          source: SOURCES.bts2017,
          basis,
          range,
        };
      }

      return {
        status: "critical",
        label: "Low oxygen saturation range",
        description:
          "Oxygen saturation is below the usual adult target range and warrants clinical review.",
        source: SOURCES.bts2017,
        basis,
        range,
      };
    },
  },

  "72514-3": {
    displayName: "Pain Severity",
    unit: "0-10 scale",
    loinc: "72514-3",
    clinicalDisclaimer:
      "This range is intended for self-reported pre-consultation ambulatory pain screening. Pain scores are subjective and should be interpreted with location, duration, function, red flags, and clinician assessment. A high score signals severity of reported pain, not the diagnosis or cause.",
    evaluate: (value) => {
      const range = {
        normal: "0",
        watch: "1–6",
        critical: "7–10",
      };

      const basis: ClinicalBasis = {
        type: "consensus",
        population:
          "Adults using the 0–10 Numeric Rating Scale in ambulatory care",
        intendedUse: "monitoring",
        rationale:
          "Built from standard pain scale interpretation where 0 indicates no pain, 1–3 mild pain, 4–6 moderate pain, and 7–10 severe pain.",
      };

      if (!Number.isFinite(value) || value < 0 || value > 10) {
        return invalidResult(
          SOURCES.painConsensus,
          basis,
          range,
          "Pain score must be a numeric value from 0 to 10.",
        );
      }

      if (value === 0) {
        return {
          status: "normal",
          label: "No pain",
          description: "Pain score indicates no pain.",
          source: SOURCES.painConsensus,
          basis,
          range,
        };
      }

      if (value >= 1 && value <= 3) {
        return {
          status: "watch",
          label: "Mild pain range",
          description: "Pain score is in the mild pain range.",
          source: SOURCES.painConsensus,
          basis,
          range,
        };
      }

      if (value >= 4 && value <= 6) {
        return {
          status: "watch",
          label: "Moderate pain range",
          description:
            "Pain score is in the moderate pain range and may interfere with activities.",
          source: SOURCES.painConsensus,
          basis,
          range,
        };
      }

      return {
        status: "critical",
        label: "Severe pain range",
        description:
          "Pain score is in the severe pain range and warrants active clinical attention.",
        source: SOURCES.painConsensus,
        basis,
        range,
      };
    },
  },

  "39156-5": {
    displayName: "Body Mass Index",
    unit: "kg/m²",
    loinc: "39156-5",
    clinicalDisclaimer:
      "This range is intended for adult ambulatory screening only. BMI is a population-level anthropometric indicator and does not directly measure body fat, muscle mass, edema, pregnancy status, or body composition. It should be interpreted with age, functional status, waist measures, and clinical context.",
    evaluate: (value) => {
      const range = {
        normal: "18.5–24.9 kg/m²",
        watch: "25.0–29.9 kg/m²",
        critical: "<18.5 or ≥30.0 kg/m²",
      };

      const basis: ClinicalBasis = {
        type: "guideline",
        population: "General adults",
        intendedUse: "screening",
        rationale:
          "Built from standard WHO adult BMI classification for underweight, normal range, overweight, and obesity.",
      };

      if (!Number.isFinite(value) || value < 5 || value > 100) {
        return invalidResult(
          SOURCES.who2021,
          basis,
          range,
          "BMI value is not physiologically plausible.",
        );
      }

      if (value >= 18.5 && value < 25) {
        return {
          status: "normal",
          label: "Normal BMI range",
          description: "BMI is within the standard adult reference range.",
          source: SOURCES.who2021,
          basis,
          range,
        };
      }

      if (value >= 25 && value < 30) {
        return {
          status: "watch",
          label: "Overweight BMI range",
          description:
            "BMI is in the overweight range and should be interpreted with overall cardiometabolic risk.",
          source: SOURCES.who2021,
          basis,
          range,
        };
      }

      if (value < 18.5) {
        return {
          status: "critical",
          label: "Underweight BMI range",
          description: "BMI is below the standard adult reference range.",
          source: SOURCES.who2021,
          basis,
          range,
        };
      }

      return {
        status: "critical",
        label: value >= 40 ? "Severe obesity BMI range" : "Obesity BMI range",
        description:
          "BMI is in the obesity range and should be clinically interpreted.",
        source: SOURCES.who2021,
        basis,
        range,
      };
    },
  },

  "29463-7": {
    displayName: "Body Weight",
    unit: "kg",
    loinc: "29463-7",
    clinicalDisclaimer:
      "This range is intended for adult ambulatory documentation only. Body weight has no universal normal range by itself and must be interpreted relative to height, BMI, edema status, pregnancy, recent weight change, and overall clinical context.",
    evaluate: () => ({
      status: "unknown",
      label: "Interpret weight with BMI",
      description:
        "Body weight alone does not have a universal adult reference range and should be interpreted relative to height and BMI.",
      source: SOURCES.who2021,
      basis: {
        type: "guideline",
        population: "General adults",
        intendedUse: "screening",
        rationale:
          "Weight is not clinically classified as normal or abnormal in isolation; BMI is the standard adult reference framework because it adjusts weight to height.",
      },
      range: {
        normal: "BMI 18.5–24.9 kg/m²",
        watch: "BMI 25.0–29.9 kg/m²",
        critical: "BMI <18.5 or ≥30.0 kg/m²",
      },
    }),
  },
};

const LOINC_ALIASES: Record<string, string> = {};

export function evaluateBloodPressure(
  value: string,
  context?: RangeContext,
): RangeResult | null {
  const parts = value.split("/");
  if (parts.length !== 2) return null;
  const systolic = parseFloat(parts[0]);
  const diastolic = parseFloat(parts[1]);
  if (!Number.isFinite(systolic) || !Number.isFinite(diastolic)) return null;

  const systolicResult =
    DEFINITIONS["8480-6"]?.evaluate(systolic, context) ?? null;
  const diastolicResult =
    DEFINITIONS["8462-4"]?.evaluate(diastolic, context) ?? null;

  if (!systolicResult || !diastolicResult) return null;

  const priority: Record<RangeStatus, number> = {
    critical: 3,
    watch: 2,
    normal: 1,
    unknown: 0,
  };
  return priority[systolicResult.status] >= priority[diastolicResult.status]
    ? systolicResult
    : diastolicResult;
}

export function evaluateVital(
  loincCode: string,
  value: number,
  context?: RangeContext,
): RangeResult | null {
  const resolvedCode = LOINC_ALIASES[loincCode] ?? loincCode;
  const definition = DEFINITIONS[resolvedCode];
  if (!definition) return null;
  return definition.evaluate(value, context);
}

export function statusColor(status: RangeStatus): {
  bg: string;
  color: string;
} {
  switch (status) {
    case "normal":
      return { bg: "#E1F5EE", color: "#085041" };
    case "watch":
      return { bg: "#FAEEDA", color: "#854F0B" };
    case "critical":
      return { bg: "#FCEBEB", color: "#A32D2D" };
    default:
      return { bg: "#F3F4F6", color: "#6B7280" };
  }
}
