// delete-consultations.cjs
const https = require("https");

const BASE = "https://fhir.medblocks.com/fhir/3A77s6opP2lCnpo3UALErBIyYOIWborT";
const TOKEN =
  "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJtYW51ZWxmYXJpYXNAZ21haWwuY29tIiwidGVuYW50X2lkIjoiM0E3N3M2b3BQMmxDbnBvM1VBTEVyQkl5WU9JV2JvclQiLCJyb2xlIjoiVEVOQU5UX1VTRVIiLCJpYXQiOjE3Nzg4NjU4NTgsImV4cCI6MTc4NDA0OTg1OH0.fdxOxLdjzwDxI45I88lwD6GZb4MlaK0PQoOaM6C_ouN07XLajr8V4H4LqRJppNPmgTT1lWK-Qs6eMwn-W-NOMQ";

const PATIENTS = [
  "58fc88d1-289b-4917-9429-b2383b744b82",
  "982750f4-569b-5949-196b-60699bdda3fb",
];

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const data = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method,
        headers: {
          "Content-Type": "application/fhir+json",
          Authorization: `Bearer ${TOKEN}`,
          ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(body);
          }
        });
      },
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  for (const patientId of PATIENTS) {
    console.log(`\nFetching consultations for ${patientId}...`);
    const res = await request(
      "GET",
      `/Composition?subject=Patient/${patientId}&type=11488-4&_count=20`,
    );
    const entries = res.entry ?? [];
    console.log(`Found ${entries.length} consultation(s)`);

    for (const { resource: r } of entries) {
      console.log(`  Deleting Composition/${r.id} — "${r.title}"`);
      await request("DELETE", `/Composition/${r.id}`);

      if (r.encounter?.reference) {
        const encId = r.encounter.reference.split("/")[1];
        console.log(`  Deleting Encounter/${encId}`);
        await request("DELETE", `/Encounter/${encId}`);
      }
    }
  }
  console.log("\nDone");
}

main().catch(console.error);
