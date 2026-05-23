// add-signal-photos.cjs
// Adds photo attachments to Signal Obs 2 for the 4 original patients
// Run: node add-signal-photos.cjs

const https = require("https");

const BASE = "https://fhir.medblocks.com/fhir/3A77s6opP2lCnpo3UALErBIyYOIWborT";
const TOKEN =
  "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJtYW51ZWxmYXJpYXNAZ21haWwuY29tIiwidGVuYW50X2lkIjoiM0E3N3M2b3BQMmxDbnBvM1VBTEVyQkl5WU9JV2JvclQiLCJyb2xlIjoiVEVOQU5UX1VTRVIiLCJpYXQiOjE3Nzg4NjU4NTgsImV4cCI6MTc4NDA0OTg1OH0.fdxOxLdjzwDxI45I88lwD6GZb4MlaK0PQoOaM6C_ouN07XLajr8V4H4LqRJppNPmgTT1lWK-Qs6eMwn-W-NOMQ";

const UPDATES = [
  {
    id: "eb7cad4e-5936-41b0-8156-756846eb1f21",
    patient: "Shalanda",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800",
        title: "Left knee — frontal view",
      },
      {
        url: "https://images.unsplash.com/photo-1591228127791-8e2eaef098d3?w=800",
        title: "Left knee — lateral view",
      },
    ],
  },
  {
    id: "f3392714-7cab-43e1-98f5-79d364fc90d6",
    patient: "Dwana",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800",
        title: "Sleep environment",
      },
    ],
  },
  {
    id: "278d0930-7997-4303-97e3-b9b16f3c2f34",
    patient: "Jody",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
        title: "Lower back — area of pain",
      },
    ],
  },
  {
    id: "6ff27bfa-0005-4d90-90da-4fc1c547010a",
    patient: "Ethyl",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=800",
        title: "Fatigue symptoms",
      },
    ],
  },
];

function get(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "GET",
      headers: {
        "Content-Type": "application/fhir+json",
        Authorization: `Bearer ${TOKEN}`,
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
    req.end();
  });
}

function put(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "PUT",
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

async function main() {
  for (const update of UPDATES) {
    process.stdout.write(`${update.patient}... `);
    try {
      // GET existing observation
      const obs = await get(`/Observation/${update.id}`);

      // Limpiar foto components vacíos anteriores
      obs.component = (obs.component ?? []).filter(
        (c) =>
          !(c.code?.text === "photo" && !c.valueString && !c.valueAttachment),
      );

      // Agregar nuevos con valueString
      const photoComponents = update.photos.map((p) => ({
        code: { text: "photo" },
        valueString: p.url,
      }));

      obs.component = [...obs.component, ...photoComponents];

      // PUT back
      await put(`/Observation/${update.id}`, obs);
      console.log(`✓ ${update.photos.length} photo(s) added`);
    } catch (err) {
      console.log(`✗ ${err.message}`);
    }
  }
  console.log("\nDone");
}

main().catch(console.error);
