// generate-appointments.cjs
// Run: node generate-appointments.cjs
// Reads patients-generated.json and creates appointments for May 25 - June 30

const https = require("https");
const fs = require("fs");

const BASE = "https://fhir.medblocks.com/fhir/3A77s6opP2lCnpo3UALErBIyYOIWborT";
const TOKEN = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJtYW51ZWxmYXJpYXNAZ21haWwuY29tIiwidGVuYW50X2lkIjoiM0E3N3M2b3BQMmxDbnBvM1VBTEVyQkl5WU9JV2JvclQiLCJyb2xlIjoiVEVOQU5UX1VTRVIiLCJpYXQiOjE3Nzg4NjU4NTgsImV4cCI6MTc4NDA0OTg1OH0.fdxOxLdjzwDxI45I88lwD6GZb4MlaK0PQoOaM6C_ouN07XLajr8V4H4LqRJppNPmgTT1lWK-Qs6eMwn-W-NOMQ";

// ── Reasons pool ──────────────────────────────────────────────────────
const REASONS = [
  "Annual check-up — routine visit",
  "Blood pressure monitoring — follow-up",
  "Diabetes management — HbA1c review",
  "Medication review — dosage adjustment",
  "Chronic back pain — physiotherapy follow-up",
  "Anxiety — initial assessment",
  "Thyroid function — lab results review",
  "Asthma control — quarterly check-up",
  "Weight management — nutritional review",
  "Post-surgical follow-up — wound healing",
  "Fatigue and low energy — evaluation",
  "Sleep disturbance — follow-up",
  "Knee pain — imaging review",
  "Headache — recurring episodes",
  "GERD symptoms — medication review",
  "Cholesterol control — statin review",
  "Pre-operative assessment",
  "Vaccination — annual flu shot",
  "Mental health check-in — anxiety management",
  "Cardiovascular risk assessment",
  "Respiratory symptoms — 10 days",
  "Abdominal discomfort — follow-up",
  "Joint pain — rheumatology referral review",
  "Skin lesion — dermatology follow-up",
  "Urinary symptoms — evaluation",
];

// ── Time slots ────────────────────────────────────────────────────────
const SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00"
];

// ── Helpers ───────────────────────────────────────────────────────────
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
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
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(body)); }
        catch { reject(new Error(body)); }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function getWorkingDays(startDate, endDate) {
  const days = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) {
      days.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function formatDateTime(date, timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  const offset = -3;
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  const hh = String(Math.floor(abs)).padStart(2, "0");
  const mm = String((abs % 1) * 60).padStart(2, "0");
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}T${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:00${sign}${hh}:${mm}`;
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  // Read generated patients
  const raw = fs.readFileSync("patients-generated.json", "utf8");
  const allPatients = JSON.parse(raw).filter(p => p.id);

  console.log(`Loaded ${allPatients.length} patients`);

  // Working days: May 25 - June 30 2026
  const workingDays = getWorkingDays("2026-05-25", "2026-06-30");
  console.log(`Working days: ${workingDays.length}`);
  console.log(`Starting appointment generation...\n`);

  let total = 0;
  let errors = 0;

  for (const day of workingDays) {
    const dateStr = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,"0")}-${String(day.getDate()).padStart(2,"0")}`;
    const dayOfWeek = day.getDay();

    // Realistic load — Tue/Wed/Thu heavier, Mon/Fri lighter
    let count;
    if (dayOfWeek === 1 || dayOfWeek === 5) {
      count = 4 + Math.floor(Math.random() * 3); // 4-6
    } else {
      count = 6 + Math.floor(Math.random() * 4); // 6-9
    }

    // Pick random patients and slots for this day
    const dayPatients = shuffle(allPatients).slice(0, count);
    const daySlots = shuffle(SLOTS).slice(0, count).sort();

    process.stdout.write(`${dateStr} (${count} appts)... `);

    for (let i = 0; i < count; i++) {
      const patient = dayPatients[i];
      const slot = daySlots[i];
      const status = Math.random() < 0.6 ? "booked" : "pending";

      const startISO = formatDateTime(day, slot);
      const endDate = new Date(day);
      const [h, m] = slot.split(":").map(Number);
      endDate.setHours(h, m + 30, 0, 0);
      const endSlot = `${String(h).padStart(2,"0")}:${String(m+30).padStart(2,"0")}`;
      const endISO = formatDateTime(day, m + 30 >= 60 ? `${h+1}:00` : endSlot);

      try {
        await post("/Appointment", {
          resourceType: "Appointment",
          status,
          description: pick(REASONS),
          start: startISO,
          end: endISO,
          participant: [{
            actor: {
              reference: `Patient/${patient.id}`,
              display: patient.name,
            },
            status: status === "booked" ? "accepted" : "needs-action",
          }],
        });
        total++;
        await sleep(100);
      } catch (err) {
        errors++;
        process.stdout.write(`✗`);
      }
    }

    console.log(`✓`);
    await sleep(200);
  }

  console.log(`\n=== Done ===`);
  console.log(`Created: ${total} appointments`);
  console.log(`Errors: ${errors}`);
}

main().catch(console.error);
