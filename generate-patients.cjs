// generate-patients.js
// Run: node generate-patients.js
// Generates 100 FHIR patients with realistic clinical profiles
// Saves patient IDs to patients-generated.json for use in appointment scripts

const https = require("https");
const fs = require("fs");

const BASE = "https://fhir.medblocks.com/fhir/3A77s6opP2lCnpo3UALErBIyYOIWborT";
const TOKEN =
  "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJtYW51ZWxmYXJpYXNAZ21haWwuY29tIiwidGVuYW50X2lkIjoiM0E3N3M2b3BQMmxDbnBvM1VBTEVyQkl5WU9JV2JvclQiLCJyb2xlIjoiVEVOQU5UX1VTRVIiLCJpYXQiOjE3Nzg4NjU4NTgsImV4cCI6MTc4NDA0OTg1OH0.fdxOxLdjzwDxI45I88lwD6GZb4MlaK0PQoOaM6C_ouN07XLajr8V4H4LqRJppNPmgTT1lWK-Qs6eMwn-W-NOMQ";

// ── Name pools ────────────────────────────────────────────────────────
const FIRST_MALE = [
  "James",
  "Robert",
  "John",
  "Michael",
  "David",
  "William",
  "Richard",
  "Joseph",
  "Thomas",
  "Charles",
  "Christopher",
  "Daniel",
  "Matthew",
  "Anthony",
  "Mark",
  "Donald",
  "Steven",
  "Paul",
  "Andrew",
  "Joshua",
  "Kenneth",
  "Kevin",
  "Brian",
  "George",
  "Timothy",
  "Ronald",
  "Edward",
  "Jason",
  "Jeffrey",
  "Ryan",
  "Carlos",
  "Miguel",
  "Jose",
  "Luis",
  "Juan",
  "Pedro",
  "Diego",
  "Andres",
  "Wei",
  "Jin",
  "Ming",
  "Kai",
  "Leon",
  "Felix",
  "Noah",
  "Ethan",
  "Lucas",
  "Mason",
];

const FIRST_FEMALE = [
  "Mary",
  "Patricia",
  "Jennifer",
  "Linda",
  "Barbara",
  "Elizabeth",
  "Susan",
  "Jessica",
  "Sarah",
  "Karen",
  "Lisa",
  "Nancy",
  "Betty",
  "Margaret",
  "Sandra",
  "Ashley",
  "Dorothy",
  "Kimberly",
  "Emily",
  "Donna",
  "Michelle",
  "Carol",
  "Amanda",
  "Melissa",
  "Deborah",
  "Stephanie",
  "Rebecca",
  "Sharon",
  "Laura",
  "Cynthia",
  "Sofia",
  "Isabella",
  "Valentina",
  "Camila",
  "Lucia",
  "Ana",
  "Maria",
  "Elena",
  "Mei",
  "Xia",
  "Yuki",
  "Aiko",
  "Fatima",
  "Aisha",
  "Amara",
  "Zoe",
  "Chloe",
  "Olivia",
];

const LAST = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
  "Torres",
  "Nguyen",
  "Hill",
  "Flores",
  "Green",
  "Adams",
  "Nelson",
  "Baker",
  "Hall",
  "Rivera",
  "Campbell",
  "Mitchell",
  "Carter",
  "Roberts",
  "Chen",
  "Kim",
  "Patel",
  "Singh",
];

// ── Clinical data pools ───────────────────────────────────────────────
const CONDITIONS = [
  { code: "38341003", display: "Hypertension" },
  { code: "44054006", display: "Type 2 diabetes mellitus" },
  { code: "414916001", display: "Obesity" },
  { code: "278860009", display: "Chronic low back pain" },
  { code: "197480006", display: "Anxiety disorder" },
  { code: "195967001", display: "Asthma" },
  { code: "40930008", display: "Hypothyroidism" },
  { code: "235595009", display: "Gastroesophageal reflux disease" },
  { code: "73211009", display: "Diabetes mellitus" },
  { code: "55822004", display: "Hyperlipidemia" },
];

const MEDICATIONS = [
  { code: "314076", display: "Lisinopril 10 MG Oral Tablet" },
  { code: "861007", display: "Metformin 500 MG Oral Tablet" },
  { code: "310965", display: "Ibuprofen 400 MG Oral Tablet" },
  { code: "402014", display: "Omeprazole 20 MG Oral Capsule" },
  { code: "966222", display: "Levothyroxine 50 MCG Oral Tablet" },
  { code: "307782", display: "Salbutamol 100 MCG Inhaler" },
  { code: "429503", display: "Atorvastatin 20 MG Oral Tablet" },
  { code: "197380", display: "Amlodipine 5 MG Oral Tablet" },
];

const SIGNAL_EPISODES = [
  {
    symptom: "Left knee pain — worsening pattern",
    obs1: {
      note: "My left knee has been hurting when I walk. Started about a week ago, only when going up stairs.",
      components: {
        location: "Left knee",
        sensation: "Sharp, stabbing",
        pattern: "Only when walking",
        intensity: "3/10",
        since: "2 weeks ago",
      },
      output: "monitor",
    },
    obs2: {
      note: "The pain is now constant, even at rest. It was only when walking before.",
      components: {
        location: "Left knee",
        sensation: "Sharp, stabbing",
        pattern: "Constant, also at rest",
        intensity: "5/10",
        since: "2 weeks ago",
      },
      output: "advise",
      voice:
        "My left knee has been hurting for about two weeks. It started only when I walked but now I feel it even when sitting. It is getting worse.",
      ice: {
        thinks: "Maybe I injured it exercising",
        worries: "It should not hurt at rest",
        expects: "To know if I need imaging or just rest",
      },
    },
  },
  {
    symptom: "Sleep disturbance — escalating pattern",
    obs1: {
      note: "Having trouble falling asleep for about 2 weeks. Wake up multiple times.",
      components: {
        location: "General — sleep",
        sensation: "Inability to fall asleep",
        pattern: "Every night for 2 weeks",
        intensity: "4/10",
        since: "3 weeks ago",
      },
      output: "monitor",
    },
    obs2: {
      note: "Sleep is worse. Waking at 3am every night and unable to return to sleep.",
      components: {
        location: "General — sleep",
        sensation: "Early waking, inability to return to sleep",
        pattern: "Every night, waking at 3am",
        intensity: "7/10",
        since: "3 weeks ago",
      },
      output: "advise",
      voice:
        "I have not been able to sleep properly for almost a month. I wake up at 3am every night and cannot go back to sleep. I feel exhausted during the day.",
      ice: {
        thinks: "Might be stress from work",
        worries: "This has been going on too long",
        expects: "Something to help me sleep",
      },
    },
  },
  {
    symptom: "Lower back pain — spreading pattern",
    obs1: {
      note: "Lower back hurting after sitting for long periods. Goes away when I stand up.",
      components: {
        location: "Lower back, center",
        sensation: "Dull ache, tension",
        pattern: "After prolonged sitting",
        intensity: "3/10",
        since: "10 days ago",
      },
      output: "monitor",
    },
    obs2: {
      note: "Pain is now persistent and has started spreading to the left hip.",
      components: {
        location: "Lower back, spreading to left hip",
        sensation: "Dull ache with sharp episodes",
        pattern: "Persistent, no longer improves with movement",
        intensity: "5/10",
        since: "10 days ago",
      },
      output: "advise",
      voice:
        "My lower back pain has gotten worse. It used to go away when I moved around but now it stays. It started spreading to my hip yesterday.",
      ice: {
        thinks: "Probably related to my desk job",
        worries: "The fact it is spreading to my hip is new",
        expects: "To know if I need physiotherapy",
      },
    },
  },
  {
    symptom: "Persistent fatigue — limiting activities",
    obs1: {
      note: "Feeling more tired than usual for the past couple of weeks.",
      components: {
        location: "General — energy level",
        sensation: "Persistent tiredness",
        pattern: "Throughout the day, worse in afternoon",
        intensity: "4/10",
        since: "3 weeks ago",
      },
      output: "monitor",
    },
    obs2: {
      note: "Fatigue is now affecting daily activities. Unable to complete afternoon walks.",
      components: {
        location: "General — energy level",
        sensation: "Exhaustion, unrefreshing sleep",
        pattern: "Constant, limiting daily activities",
        intensity: "7/10",
        since: "3 weeks ago",
      },
      output: "advise",
      voice:
        "I am exhausted all the time now. Even after sleeping 8 hours I wake up tired. I have stopped doing my afternoon walks because I do not have the energy.",
      ice: {
        thinks: "Could be my age or thyroid",
        worries: "I have never felt this tired for this long",
        expects: "Blood tests to rule out anything serious",
      },
    },
  },
  {
    symptom: "Recurring headache — increasing frequency",
    obs1: {
      note: "Headaches a few times a week, usually in the afternoon.",
      components: {
        location: "Head, frontal",
        sensation: "Pressure, throbbing",
        pattern: "A few times per week",
        intensity: "4/10",
        since: "1 month ago",
      },
      output: "monitor",
    },
    obs2: {
      note: "Headaches now daily, affecting concentration and work.",
      components: {
        location: "Head, frontal and temples",
        sensation: "Pressure, throbbing",
        pattern: "Daily, affecting concentration",
        intensity: "6/10",
        since: "1 month ago",
      },
      output: "advise",
      voice:
        "I have been getting headaches almost every day now. They started a month ago a few times a week but now they are daily and affecting my ability to work.",
      ice: {
        thinks: "Might be tension headaches or screen time",
        worries: "The daily frequency is new and concerning",
        expects: "To understand if there is an underlying cause",
      },
    },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomDOB(minAge, maxAge) {
  const now = new Date();
  const age = minAge + Math.floor(Math.random() * (maxAge - minAge));
  const year = now.getFullYear() - age;
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/fhir+json",
        Authorization: `Bearer ${TOKEN}`,
        "Content-Length": Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error(body));
        }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Profile builders ──────────────────────────────────────────────────
async function createPatient(given, family, gender, dob) {
  const resource = {
    resourceType: "Patient",
    name: [{ use: "official", family, given: [given] }],
    gender,
    birthDate: dob,
  };
  const result = await post("/Patient", resource);
  return result.id;
}

async function createCondition(patientId, condition, onsetDate) {
  await post("/Condition", {
    resourceType: "Condition",
    clinicalStatus: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
          code: "active",
        },
      ],
    },
    verificationStatus: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
          code: "confirmed",
        },
      ],
    },
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-category",
            code: "problem-list-item",
            display: "Problem List Item",
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: "http://snomed.info/sct",
          code: condition.code,
          display: condition.display,
        },
      ],
      text: condition.display,
    },
    subject: { reference: `Patient/${patientId}` },
    onsetDateTime: onsetDate,
  });
}

async function createMedication(patientId, med) {
  await post("/MedicationRequest", {
    resourceType: "MedicationRequest",
    status: "active",
    intent: "order",
    medicationCodeableConcept: {
      coding: [
        {
          system: "http://www.nlm.nih.gov/research/umls/rxnorm",
          code: med.code,
          display: med.display,
        },
      ],
      text: med.display,
    },
    subject: { reference: `Patient/${patientId}` },
    authoredOn: daysAgo(Math.floor(Math.random() * 365)),
  });
}

async function createSignalEpisode(patientId, episodeTemplate, episodeId) {
  const EXT = {
    episodeId: "https://signal.health/episode-id",
    algorithmOutput: "https://signal.health/algorithm-output",
    observationNumber: "https://signal.health/observation-number",
    patientVoice: "https://signal.health/patient-voice",
    iceThinks: "https://signal.health/ice-thinks",
    iceWorries: "https://signal.health/ice-worries",
    iceExpects: "https://signal.health/ice-expects",
  };

  const obs1Date = new Date();
  obs1Date.setDate(obs1Date.getDate() - 6);

  const obs2Date = new Date();
  obs2Date.setDate(obs2Date.getDate() - 3);

  const buildComponents = (c) =>
    Object.entries(c).map(([key, val]) => ({
      code: { text: key },
      valueString: val,
    }));

  // Obs 1
  await post("/Observation", {
    resourceType: "Observation",
    status: "final",
    meta: {
      tag: [{ system: "https://signal.health", code: "signal-episode" }],
    },
    code: {
      coding: [
        {
          system: "https://signal.health/observation",
          code: "symptom-observation",
          display: "Signal Symptom Observation",
        },
      ],
      text: "Signal Symptom Observation",
    },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: obs1Date.toISOString(),
    extension: [
      { url: EXT.episodeId, valueString: episodeId },
      { url: EXT.algorithmOutput, valueString: episodeTemplate.obs1.output },
      { url: EXT.observationNumber, valueInteger: 1 },
    ],
    note: [{ text: episodeTemplate.obs1.note }],
    component: buildComponents(episodeTemplate.obs1.components),
  });

  // Obs 2
  await post("/Observation", {
    resourceType: "Observation",
    status: "final",
    meta: {
      tag: [{ system: "https://signal.health", code: "signal-episode" }],
    },
    code: {
      coding: [
        {
          system: "https://signal.health/observation",
          code: "symptom-observation",
          display: "Signal Symptom Observation",
        },
      ],
      text: "Signal Symptom Observation",
    },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: obs2Date.toISOString(),
    extension: [
      { url: EXT.episodeId, valueString: episodeId },
      { url: EXT.algorithmOutput, valueString: episodeTemplate.obs2.output },
      { url: EXT.observationNumber, valueInteger: 2 },
      { url: EXT.patientVoice, valueString: episodeTemplate.obs2.voice },
      { url: EXT.iceThinks, valueString: episodeTemplate.obs2.ice.thinks },
      { url: EXT.iceWorries, valueString: episodeTemplate.obs2.ice.worries },
      { url: EXT.iceExpects, valueString: episodeTemplate.obs2.ice.expects },
    ],
    note: [{ text: episodeTemplate.obs2.note }],
    component: buildComponents(episodeTemplate.obs2.components),
  });
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  const generated = [];
  let signalCount = 0;
  const MAX_SIGNAL = 20;

  console.log("=== Generating 100 patients ===\n");

  for (let i = 0; i < 100; i++) {
    const gender = Math.random() < 0.5 ? "male" : "female";
    const given = gender === "male" ? pick(FIRST_MALE) : pick(FIRST_FEMALE);
    const family = pick(LAST);
    const dob = randomDOB(25, 80);

    // Assign profile
    const rand = Math.random();
    let profile;
    if (rand < 0.2)
      profile = "A"; // Signal + full history
    else if (rand < 0.5)
      profile = "B"; // Full history, no Signal
    else if (rand < 0.75)
      profile = "C"; // Minimal history
    else profile = "D"; // No history

    process.stdout.write(
      `[${i + 1}/100] ${given} ${family} (${gender}, profile ${profile})... `,
    );

    try {
      const patientId = await createPatient(given, family, gender, dob);

      // Profile A — Signal + full history
      if (profile === "A" && signalCount < MAX_SIGNAL) {
        const conditions = pickN(CONDITIONS, 2 + Math.floor(Math.random() * 3));
        for (const c of conditions) {
          await createCondition(
            patientId,
            c,
            daysAgo(Math.floor(Math.random() * 1000 + 30)),
          );
        }
        const meds = pickN(MEDICATIONS, 1 + Math.floor(Math.random() * 3));
        for (const m of meds) {
          await createMedication(patientId, m);
        }
        const episode = pick(SIGNAL_EPISODES);
        const episodeId = `episode-${patientId.slice(0, 8)}`;
        await createSignalEpisode(patientId, episode, episodeId);
        signalCount++;
        generated.push({
          id: patientId,
          name: `${given} ${family}`,
          gender,
          dob,
          profile,
          signal: true,
          episodeId,
        });
        console.log(`✓ (Signal: ${episode.symptom})`);
      }

      // Profile B — Full history, no Signal
      else if (profile === "B") {
        const conditions = pickN(CONDITIONS, 2 + Math.floor(Math.random() * 3));
        for (const c of conditions) {
          await createCondition(
            patientId,
            c,
            daysAgo(Math.floor(Math.random() * 1000 + 30)),
          );
        }
        const meds = pickN(MEDICATIONS, 1 + Math.floor(Math.random() * 2));
        for (const m of meds) {
          await createMedication(patientId, m);
        }
        generated.push({
          id: patientId,
          name: `${given} ${family}`,
          gender,
          dob,
          profile,
          signal: false,
        });
        console.log("✓");
      }

      // Profile C — Minimal history
      else if (profile === "C") {
        if (Math.random() > 0.5) {
          await createCondition(
            patientId,
            pick(CONDITIONS),
            daysAgo(Math.floor(Math.random() * 365)),
          );
        }
        generated.push({
          id: patientId,
          name: `${given} ${family}`,
          gender,
          dob,
          profile,
          signal: false,
        });
        console.log("✓");
      }

      // Profile D — No history
      else {
        generated.push({
          id: patientId,
          name: `${given} ${family}`,
          gender,
          dob,
          profile,
          signal: false,
        });
        console.log("✓");
      }
    } catch (err) {
      console.log(`✗ ERROR: ${err.message}`);
      generated.push({
        id: null,
        name: `${given} ${family}`,
        error: err.message,
      });
    }

    // Rate limiting — 200ms between patients
    await sleep(200);
  }

  // Save results
  fs.writeFileSync(
    "patients-generated.json",
    JSON.stringify(generated, null, 2),
  );

  console.log("\n=== Done ===");
  console.log(
    `Total: ${generated.filter((p) => p.id).length} patients created`,
  );
  console.log(
    `Signal: ${generated.filter((p) => p.signal).length} patients with episodes`,
  );
  console.log(`Saved to: patients-generated.json`);
}

main().catch(console.error);
