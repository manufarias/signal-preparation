#!/bin/bash

BASE="https://fhir.medblocks.com/fhir/3A77s6opP2lCnpo3UALErBIyYOIWborT"
TOKEN="eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJtYW51ZWxmYXJpYXNAZ21haWwuY29tIiwidGVuYW50X2lkIjoiM0E3N3M2b3BQMmxDbnBvM1VBTEVyQkl5WU9JV2JvclQiLCJyb2xlIjoiVEVOQU5UX1VTRVIiLCJpYXQiOjE3Nzg4NjU4NTgsImV4cCI6MTc4NDA0OTg1OH0.fdxOxLdjzwDxI45I88lwD6GZb4MlaK0PQoOaM6C_ouN07XLajr8V4H4LqRJppNPmgTT1lWK-Qs6eMwn-W-NOMQ"

delete_appt() {
  curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/Appointment/$1" \
    -H "Authorization: Bearer $TOKEN"
}

delete_obs() {
  curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/Observation/$1" \
    -H "Authorization: Bearer $TOKEN"
}

post_appt() {
  curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/Appointment" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/fhir+json" \
    -d "$1"
}

post_obs() {
  curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/Observation" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/fhir+json" \
    -d "$1"
}

# ── DELETE EXISTING APPOINTMENTS ──────────────────────────────────────
echo "=== Deleting existing appointments ==="
for ID in \
  "1f2af6a3-df47-4106-9dec-b1781f85f894" \
  "2745ff6d-d87e-4b01-96b7-810513ceef93" \
  "2eb61823-9c38-4939-9be8-275c6d44ba34" \
  "34f4f64f-ee54-4b39-8310-b2b7e25c3ffb" \
  "44e44003-6966-4ddb-89a3-632a5c91bb47" \
  "4d6cc263-ea04-42fe-a543-5227610d9e4f" \
  "87500685-b415-45f7-8cd2-95a4e8d199d4" \
  "9527e0f1-673a-4ef3-b14e-68eb1f77b1b9" \
  "994232b8-0fe1-4638-b92d-85e7ad762a46" \
  "9a6ef332-1d81-4d92-9537-183452266281" \
  "a4e7f46e-4941-4221-8298-6c1882e42248" \
  "a787b190-8cbc-417a-b216-7de29a94fd5a" \
  "b33c32e2-4c76-4e6d-b969-03f7232ff342" \
  "b7b2ecc5-bd48-45f6-b985-62e7d78459c8" \
  "cf55d680-c09e-4b62-8db5-1d28f4317759" \
  "d175261b-b35c-4a1a-a059-46439b2d074c" \
  "ef93c6cc-14cf-463a-83dc-82bc2074e796" \
  "f35b95c2-e599-4575-a4a8-43fbd7951009" \
  "f5c86c55-70ec-4b8b-a137-a8a0e528e6a9"
do
  echo -n "Deleting appointment $ID... "
  delete_appt "$ID"
  echo ""
done

# ── DELETE EXISTING SIGNAL OBSERVATIONS ───────────────────────────────
echo ""
echo "=== Deleting existing Signal observations ==="
# Fetch and delete all Signal observations
OBS_IDS=$(curl -s "$BASE/Observation?_tag=signal-episode&_count=100" \
  -H "Authorization: Bearer $TOKEN" | \
  grep -o '"id":"[^"]*"' | grep -v 'versionId' | sed 's/"id":"//;s/"//')

for ID in $OBS_IDS; do
  echo -n "Deleting observation $ID... "
  delete_obs "$ID"
  echo ""
done

# ── CREATE APPOINTMENTS — Week May 18-22 2026 ─────────────────────────
echo ""
echo "=== Creating appointments — Week May 18-22 2026 ==="

# ── MONDAY MAY 18 ──
echo -n "MON 08:00 Clarinda O'Connell (booked)... "
post_appt '{"resourceType":"Appointment","status":"booked","description":"Chronic fatigue — initial evaluation","start":"2026-05-18T08:00:00-03:00","end":"2026-05-18T08:30:00-03:00","participant":[{"actor":{"reference":"Patient/6fbddf55-7096-b883-7cd3-260f27953080","display":"Clarinda O'\''Connell"},"status":"accepted"}]}'
echo ""

echo -n "MON 08:30 Jody Hickle (pending)... "
post_appt '{"resourceType":"Appointment","status":"pending","description":"Post-antibiotic treatment follow-up","start":"2026-05-18T08:30:00-03:00","end":"2026-05-18T09:00:00-03:00","participant":[{"actor":{"reference":"Patient/76b20010-c318-5754-8c85-983aa538522f","display":"Jody Hickle"},"status":"needs-action"}]}'
echo ""

echo -n "MON 09:00 Shalanda Treutel (booked — Signal)... "
post_appt '{"resourceType":"Appointment","status":"booked","description":"Left knee pain — worsening pattern detected by Signal","start":"2026-05-18T09:00:00-03:00","end":"2026-05-18T09:30:00-03:00","participant":[{"actor":{"reference":"Patient/46ee9d82-b52c-856d-069b-5064ff052225","display":"Shalanda Treutel"},"status":"accepted"}]}'
echo ""

echo -n "MON 09:30 Augusta Homenick (pending)... "
post_appt '{"resourceType":"Appointment","status":"pending","description":"Diabetes management — HbA1c pending","start":"2026-05-18T09:30:00-03:00","end":"2026-05-18T10:00:00-03:00","participant":[{"actor":{"reference":"Patient/b380e520-ec93-0886-7838-121e7c69d1e6","display":"Augusta Homenick"},"status":"needs-action"}]}'
echo ""

echo -n "MON 10:00 Wilfredo Fritsch (booked)... "
post_appt '{"resourceType":"Appointment","status":"booked","description":"Anxiety — initial assessment","start":"2026-05-18T10:00:00-03:00","end":"2026-05-18T10:30:00-03:00","participant":[{"actor":{"reference":"Patient/aee7bbe1-0c45-c028-1e62-1f4cdb30c273","display":"Wilfredo Fritsch"},"status":"accepted"}]}'
echo ""

echo -n "MON 10:30 Larissa Nikolaus (pending)... "
post_appt '{"resourceType":"Appointment","status":"pending","description":"Postpartum follow-up — 6 weeks","start":"2026-05-18T10:30:00-03:00","end":"2026-05-18T11:00:00-03:00","participant":[{"actor":{"reference":"Patient/eb5910f1-26e6-bc6f-b300-716eae678d6f","display":"Larissa Nikolaus"},"status":"needs-action"}]}'
echo ""

echo -n "MON 14:00 Dwana Tremblay (booked — Signal)... "
post_appt '{"resourceType":"Appointment","status":"booked","description":"Sleep disturbance — escalating pattern detected by Signal","start":"2026-05-18T14:00:00-03:00","end":"2026-05-18T14:30:00-03:00","participant":[{"actor":{"reference":"Patient/982750f4-569b-5949-196b-60699bdda3fb","display":"Dwana Tremblay"},"status":"accepted"}]}'
echo ""

echo -n "MON 14:30 Ethyl Medhurst (pending)... "
post_appt '{"resourceType":"Appointment","status":"pending","description":"Blood pressure control — second visit","start":"2026-05-18T14:30:00-03:00","end":"2026-05-18T15:00:00-03:00","participant":[{"actor":{"reference":"Patient/a305a3c5-c2f8-e006-d7f5-8e772561fe56","display":"Ethyl Medhurst"},"status":"needs-action"}]}'
echo ""

# ── TUESDAY MAY 19 ──
echo -n "TUE 08:00 Mauro Braun (booked)... "
post_appt '{"resourceType":"Appointment","status":"booked","description":"Intermittent fever — 5 days","start":"2026-05-19T08:00:00-03:00","end":"2026-05-19T08:30:00-03:00","participant":[{"actor":{"reference":"Patient/2d68ad16-268a-478c-1f84-d0f1976e1a46","display":"Mauro Braun"},"status":"accepted"}]}'
echo ""

echo -n "TUE 08:30 Eunice Fay (pending)... "
post_appt '{"resourceType":"Appointment","status":"pending","description":"Abdominal pain — no prior diagnosis","start":"2026-05-19T08:30:00-03:00","end":"2026-05-19T09:00:00-03:00","participant":[{"actor":{"reference":"Patient/d3727ff2-5d7b-347f-d78c-edc4323cf890","display":"Eunice Fay"},"status":"needs-action"}]}'
echo ""

echo -n "TUE 09:00 Clarinda O'Connell (booked)... "
post_appt '{"resourceType":"Appointment","status":"booked","description":"Chronic medication review","start":"2026-05-19T09:00:00-03:00","end":"2026-05-19T09:30:00-03:00","participant":[{"actor":{"reference":"Patient/6fbddf55-7096-b883-7cd3-260f27953080","display":"Clarinda O'\''Connell"},"status":"accepted"}]}'
echo ""

echo -n "TUE 10:00 Augusta Homenick (booked)... "
post_appt '{"resourceType":"Appointment","status":"booked","description":"General check-up — asymptomatic patient","start":"2026-05-19T10:00:00-03:00","end":"2026-05-19T10:30:00-03:00","participant":[{"actor":{"reference":"Patient/b380e520-ec93-0886-7838-121e7c69d1e6","display":"Augusta Homenick"},"status":"accepted"}]}'
echo ""

echo -n "TUE 14:00 Jody Hickle (booked — Signal)... "
post_appt '{"resourceType":"Appointment","status":"booked","description":"Lower back pain — recurring observations detected by Signal","start":"2026-05-19T14:00:00-03:00","end":"2026-05-19T14:30:00-03:00","participant":[{"actor":{"reference":"Patient/76b20010-c318-5754-8c85-983aa538522f","display":"Jody Hickle"},"status":"accepted"}]}'
echo ""

# ── WEDNESDAY MAY 20 ──
echo -n "WED 08:00 Wilfredo Fritsch (pending)... "
post_appt '{"resourceType":"Appointment","status":"pending","description":"Lab results — thyroid panel","start":"2026-05-20T08:00:00-03:00","end":"2026-05-20T08:30:00-03:00","participant":[{"actor":{"reference":"Patient/aee7bbe1-0c45-c028-1e62-1f4cdb30c273","display":"Wilfredo Fritsch"},"status":"needs-action"}]}'
echo ""

echo -n "WED 09:00 Dwana Tremblay (booked)... "
post_appt '{"resourceType":"Appointment","status":"booked","description":"Blood pressure monitoring — adjusted medication","start":"2026-05-20T09:00:00-03:00","end":"2026-05-20T09:30:00-03:00","participant":[{"actor":{"reference":"Patient/982750f4-569b-5949-196b-60699bdda3fb","display":"Dwana Tremblay"},"status":"accepted"}]}'
echo ""

echo -n "WED 10:00 Larissa Nikolaus (pending)... "
post_appt '{"resourceType":"Appointment","status":"pending","description":"Annual gynecological check-up","start":"2026-05-20T10:00:00-03:00","end":"2026-05-20T10:30:00-03:00","participant":[{"actor":{"reference":"Patient/eb5910f1-26e6-bc6f-b300-716eae678d6f","display":"Larissa Nikolaus"},"status":"needs-action"}]}'
echo ""

echo -n "WED 11:00 Ethyl Medhurst (booked — Signal)... "
post_appt '{"resourceType":"Appointment","status":"booked","description":"Persistent fatigue — worsening pattern detected by Signal","start":"2026-05-20T11:00:00-03:00","end":"2026-05-20T11:30:00-03:00","participant":[{"actor":{"reference":"Patient/a305a3c5-c2f8-e006-d7f5-8e772561fe56","display":"Ethyl Medhurst"},"status":"accepted"}]}'
echo ""

echo -n "WED 14:00 Mauro Braun (booked)... "
post_appt '{"resourceType":"Appointment","status":"booked","description":"Cardiovascular follow-up — recent ECG","start":"2026-05-20T14:00:00-03:00","end":"2026-05-20T14:30:00-03:00","participant":[{"actor":{"reference":"Patient/2d68ad16-268a-478c-1f84-d0f1976e1a46","display":"Mauro Braun"},"status":"accepted"}]}'
echo ""

# ── THURSDAY MAY 21 ──
echo -n "THU 08:00 Eunice Fay (booked)... "
post_appt '{"resourceType":"Appointment","status":"booked","description":"Post-surgical follow-up — wound healing","start":"2026-05-21T08:00:00-03:00","end":"2026-05-21T08:30:00-03:00","participant":[{"actor":{"reference":"Patient/d3727ff2-5d7b-347f-d78c-edc4323cf890","display":"Eunice Fay"},"status":"accepted"}]}'
echo ""

echo -n "THU 09:00 Clarinda O'Connell (pending)... "
post_appt '{"resourceType":"Appointment","status":"pending","description":"Psychological evaluation — workplace anxiety","start":"2026-05-21T09:00:00-03:00","end":"2026-05-21T09:30:00-03:00","participant":[{"actor":{"reference":"Patient/6fbddf55-7096-b883-7cd3-260f27953080","display":"Clarinda O'\''Connell"},"status":"needs-action"}]}'
echo ""

echo -n "THU 10:00 Augusta Homenick (booked)... "
post_appt '{"resourceType":"Appointment","status":"booked","description":"Nutritional plan review — diabetes management","start":"2026-05-21T10:00:00-03:00","end":"2026-05-21T10:30:00-03:00","participant":[{"actor":{"reference":"Patient/b380e520-ec93-0886-7838-121e7c69d1e6","display":"Augusta Homenick"},"status":"accepted"}]}'
echo ""

echo -n "THU 11:00 Shalanda Treutel (pending)... "
post_appt '{"resourceType":"Appointment","status":"pending","description":"Lower back pain — imaging requested","start":"2026-05-21T11:00:00-03:00","end":"2026-05-21T11:30:00-03:00","participant":[{"actor":{"reference":"Patient/46ee9d82-b52c-856d-069b-5064ff052225","display":"Shalanda Treutel"},"status":"needs-action"}]}'
echo ""

echo -n "THU 14:00 Jody Hickle (booked)... "
post_appt '{"resourceType":"Appointment","status":"booked","description":"Chronic back pain — physiotherapy follow-up","start":"2026-05-21T14:00:00-03:00","end":"2026-05-21T14:30:00-03:00","participant":[{"actor":{"reference":"Patient/76b20010-c318-5754-8c85-983aa538522f","display":"Jody Hickle"},"status":"accepted"}]}'
echo ""

# ── FRIDAY MAY 22 ──
echo -n "FRI 08:00 Wilfredo Fritsch (booked)... "
post_appt '{"resourceType":"Appointment","status":"booked","description":"Bronchial asthma — quarterly check-up","start":"2026-05-22T08:00:00-03:00","end":"2026-05-22T08:30:00-03:00","participant":[{"actor":{"reference":"Patient/aee7bbe1-0c45-c028-1e62-1f4cdb30c273","display":"Wilfredo Fritsch"},"status":"accepted"}]}'
echo ""

echo -n "FRI 09:00 Dwana Tremblay (pending)... "
post_appt '{"resourceType":"Appointment","status":"pending","description":"Severe insomnia — psychiatry referral","start":"2026-05-22T09:00:00-03:00","end":"2026-05-22T09:30:00-03:00","participant":[{"actor":{"reference":"Patient/982750f4-569b-5949-196b-60699bdda3fb","display":"Dwana Tremblay"},"status":"needs-action"}]}'
echo ""

echo -n "FRI 10:00 Larissa Nikolaus (booked)... "
post_appt '{"resourceType":"Appointment","status":"booked","description":"Chronic headache — new medication","start":"2026-05-22T10:00:00-03:00","end":"2026-05-22T10:30:00-03:00","participant":[{"actor":{"reference":"Patient/eb5910f1-26e6-bc6f-b300-716eae678d6f","display":"Larissa Nikolaus"},"status":"accepted"}]}'
echo ""

echo -n "FRI 11:00 Ethyl Medhurst (pending)... "
post_appt '{"resourceType":"Appointment","status":"pending","description":"Blood pressure control — medication change","start":"2026-05-22T11:00:00-03:00","end":"2026-05-22T11:30:00-03:00","participant":[{"actor":{"reference":"Patient/a305a3c5-c2f8-e006-d7f5-8e772561fe56","display":"Ethyl Medhurst"},"status":"needs-action"}]}'
echo ""

echo -n "FRI 14:00 Mauro Braun (booked)... "
post_appt '{"resourceType":"Appointment","status":"booked","description":"Blood pressure — weekly monitoring","start":"2026-05-22T14:00:00-03:00","end":"2026-05-22T14:30:00-03:00","participant":[{"actor":{"reference":"Patient/2d68ad16-268a-478c-1f84-d0f1976e1a46","display":"Mauro Braun"},"status":"accepted"}]}'
echo ""

# ── CREATE SIGNAL OBSERVATIONS ────────────────────────────────────────
echo ""
echo "=== Creating Signal observations ==="

# ── SHALANDA TREUTEL — Left knee pain episode ──
# Episode ID: episode-shalanda-001
# 2 observations — Layer 2 triggers on Obs 2 (pain now at rest)

echo -n "Signal Obs 1 — Shalanda Treutel (May 12)... "
post_obs '{
  "resourceType": "Observation",
  "status": "final",
  "meta": {
    "tag": [{"system": "https://signal.health", "code": "signal-episode"}]
  },
  "code": {
    "coding": [{"system": "https://signal.health/observation", "code": "symptom-observation", "display": "Signal Symptom Observation"}],
    "text": "Signal Symptom Observation"
  },
  "subject": {"reference": "Patient/46ee9d82-b52c-856d-069b-5064ff052225"},
  "effectiveDateTime": "2026-05-12T18:30:00-03:00",
  "extension": [
    {"url": "https://signal.health/episode-id", "valueString": "episode-shalanda-001"},
    {"url": "https://signal.health/algorithm-output", "valueString": "monitor"},
    {"url": "https://signal.health/observation-number", "valueInteger": 1}
  ],
  "note": [{"text": "My left knee has been hurting when I walk. Started about a week ago, only when going up stairs or walking fast."}],
  "component": [
    {"code": {"text": "location"}, "valueString": "Left knee"},
    {"code": {"text": "sensation"}, "valueString": "Sharp, stabbing"},
    {"code": {"text": "pattern"}, "valueString": "Only when walking or climbing stairs"},
    {"code": {"text": "intensity"}, "valueString": "3/10"},
    {"code": {"text": "since"}, "valueString": "May 5, 2026"}
  ]
}'
echo ""

echo -n "Signal Obs 2 — Shalanda Treutel (May 15)... "
post_obs '{
  "resourceType": "Observation",
  "status": "final",
  "meta": {
    "tag": [{"system": "https://signal.health", "code": "signal-episode"}]
  },
  "code": {
    "coding": [{"system": "https://signal.health/observation", "code": "symptom-observation", "display": "Signal Symptom Observation"}],
    "text": "Signal Symptom Observation"
  },
  "subject": {"reference": "Patient/46ee9d82-b52c-856d-069b-5064ff052225"},
  "effectiveDateTime": "2026-05-15T20:00:00-03:00",
  "extension": [
    {"url": "https://signal.health/episode-id", "valueString": "episode-shalanda-001"},
    {"url": "https://signal.health/algorithm-output", "valueString": "advise"},
    {"url": "https://signal.health/observation-number", "valueInteger": 2},
    {"url": "https://signal.health/patient-voice", "valueString": "My left knee has been hurting for about a week. It started only when I walked but now I feel it even when I am sitting. It is getting worse and I am not sure why."},
    {"url": "https://signal.health/ice-thinks", "valueString": "Maybe I injured it exercising or walking too much"},
    {"url": "https://signal.health/ice-worries", "valueString": "It should not be hurting at rest — something might be wrong"},
    {"url": "https://signal.health/ice-expects", "valueString": "To understand if I need imaging or if rest is enough"}
  ],
  "note": [{"text": "The pain is now constant, even at rest. It was only when walking before."}],
  "component": [
    {"code": {"text": "location"}, "valueString": "Left knee"},
    {"code": {"text": "sensation"}, "valueString": "Sharp, stabbing"},
    {"code": {"text": "pattern"}, "valueString": "Constant, also at rest"},
    {"code": {"text": "intensity"}, "valueString": "5/10"},
    {"code": {"text": "since"}, "valueString": "May 5, 2026"}
  ]
}'
echo ""

# ── DWANA TREMBLAY — Sleep disturbance episode ──
# Episode ID: episode-dwana-001

echo -n "Signal Obs 1 — Dwana Tremblay (May 10)... "
post_obs '{
  "resourceType": "Observation",
  "status": "final",
  "meta": {
    "tag": [{"system": "https://signal.health", "code": "signal-episode"}]
  },
  "code": {
    "coding": [{"system": "https://signal.health/observation", "code": "symptom-observation", "display": "Signal Symptom Observation"}],
    "text": "Signal Symptom Observation"
  },
  "subject": {"reference": "Patient/982750f4-569b-5949-196b-60699bdda3fb"},
  "effectiveDateTime": "2026-05-10T22:00:00-03:00",
  "extension": [
    {"url": "https://signal.health/episode-id", "valueString": "episode-dwana-001"},
    {"url": "https://signal.health/algorithm-output", "valueString": "monitor"},
    {"url": "https://signal.health/observation-number", "valueInteger": 1}
  ],
  "note": [{"text": "I have been having trouble falling asleep for about 2 weeks. I wake up multiple times and feel tired in the morning."}],
  "component": [
    {"code": {"text": "location"}, "valueString": "General — sleep"},
    {"code": {"text": "sensation"}, "valueString": "Inability to fall asleep, frequent waking"},
    {"code": {"text": "pattern"}, "valueString": "Every night for 2 weeks"},
    {"code": {"text": "intensity"}, "valueString": "4/10"},
    {"code": {"text": "since"}, "valueString": "April 26, 2026"}
  ]
}'
echo ""

echo -n "Signal Obs 2 — Dwana Tremblay (May 16)... "
post_obs '{
  "resourceType": "Observation",
  "status": "final",
  "meta": {
    "tag": [{"system": "https://signal.health", "code": "signal-episode"}]
  },
  "code": {
    "coding": [{"system": "https://signal.health/observation", "code": "symptom-observation", "display": "Signal Symptom Observation"}],
    "text": "Signal Symptom Observation"
  },
  "subject": {"reference": "Patient/982750f4-569b-5949-196b-60699bdda3fb"},
  "effectiveDateTime": "2026-05-16T21:30:00-03:00",
  "extension": [
    {"url": "https://signal.health/episode-id", "valueString": "episode-dwana-001"},
    {"url": "https://signal.health/algorithm-output", "valueString": "advise"},
    {"url": "https://signal.health/observation-number", "valueInteger": 2},
    {"url": "https://signal.health/patient-voice", "valueString": "I have not been able to sleep properly for almost a month now. I wake up at 3am every night and cannot go back to sleep. I feel exhausted during the day and it is affecting my work."},
    {"url": "https://signal.health/ice-thinks", "valueString": "Might be stress from work or anxiety"},
    {"url": "https://signal.health/ice-worries", "valueString": "This has been going on too long and I cannot function properly"},
    {"url": "https://signal.health/ice-expects", "valueString": "Something to help me sleep — whether medication or another approach"}
  ],
  "note": [{"text": "Sleep is worse. Now waking at 3am every night and unable to return to sleep. Daytime fatigue is significant."}],
  "component": [
    {"code": {"text": "location"}, "valueString": "General — sleep"},
    {"code": {"text": "sensation"}, "valueString": "Early waking, inability to return to sleep"},
    {"code": {"text": "pattern"}, "valueString": "Every night, waking at 3am"},
    {"code": {"text": "intensity"}, "valueString": "7/10"},
    {"code": {"text": "since"}, "valueString": "April 26, 2026"}
  ]
}'
echo ""

# ── JODY HICKLE — Lower back pain episode ──
# Episode ID: episode-jody-001

echo -n "Signal Obs 1 — Jody Hickle (May 13)... "
post_obs '{
  "resourceType": "Observation",
  "status": "final",
  "meta": {
    "tag": [{"system": "https://signal.health", "code": "signal-episode"}]
  },
  "code": {
    "coding": [{"system": "https://signal.health/observation", "code": "symptom-observation", "display": "Signal Symptom Observation"}],
    "text": "Signal Symptom Observation"
  },
  "subject": {"reference": "Patient/76b20010-c318-5754-8c85-983aa538522f"},
  "effectiveDateTime": "2026-05-13T19:00:00-03:00",
  "extension": [
    {"url": "https://signal.health/episode-id", "valueString": "episode-jody-001"},
    {"url": "https://signal.health/algorithm-output", "valueString": "monitor"},
    {"url": "https://signal.health/observation-number", "valueInteger": 1}
  ],
  "note": [{"text": "My lower back has been hurting after sitting for long periods at my desk. It usually goes away when I stand up and move around."}],
  "component": [
    {"code": {"text": "location"}, "valueString": "Lower back, center"},
    {"code": {"text": "sensation"}, "valueString": "Dull ache, tension"},
    {"code": {"text": "pattern"}, "valueString": "After prolonged sitting, improves with movement"},
    {"code": {"text": "intensity"}, "valueString": "3/10"},
    {"code": {"text": "since"}, "valueString": "May 8, 2026"}
  ]
}'
echo ""

echo -n "Signal Obs 2 — Jody Hickle (May 17)... "
post_obs '{
  "resourceType": "Observation",
  "status": "final",
  "meta": {
    "tag": [{"system": "https://signal.health", "code": "signal-episode"}]
  },
  "code": {
    "coding": [{"system": "https://signal.health/observation", "code": "symptom-observation", "display": "Signal Symptom Observation"}],
    "text": "Signal Symptom Observation"
  },
  "subject": {"reference": "Patient/76b20010-c318-5754-8c85-983aa538522f"},
  "effectiveDateTime": "2026-05-17T20:00:00-03:00",
  "extension": [
    {"url": "https://signal.health/episode-id", "valueString": "episode-jody-001"},
    {"url": "https://signal.health/algorithm-output", "valueString": "advise"},
    {"url": "https://signal.health/observation-number", "valueInteger": 2},
    {"url": "https://signal.health/patient-voice", "valueString": "My lower back pain has gotten worse. It used to go away when I moved around but now it stays even after I have been walking. It started spreading slightly to my left hip yesterday."},
    {"url": "https://signal.health/ice-thinks", "valueString": "Probably related to my desk job and poor posture"},
    {"url": "https://signal.health/ice-worries", "valueString": "The fact that it is spreading to my hip is new and concerning"},
    {"url": "https://signal.health/ice-expects", "valueString": "To know if I need physiotherapy or further investigation"}
  ],
  "note": [{"text": "Pain is now persistent and has started spreading to the left hip. No longer resolves with movement."}],
  "component": [
    {"code": {"text": "location"}, "valueString": "Lower back, spreading to left hip"},
    {"code": {"text": "sensation"}, "valueString": "Dull ache, now with sharp episodes"},
    {"code": {"text": "pattern"}, "valueString": "Persistent, no longer improves with movement"},
    {"code": {"text": "intensity"}, "valueString": "5/10"},
    {"code": {"text": "since"}, "valueString": "May 8, 2026"}
  ]
}'
echo ""

# ── ETHYL MEDHURST — Persistent fatigue episode ──
# Episode ID: episode-ethyl-001

echo -n "Signal Obs 1 — Ethyl Medhurst (May 11)... "
post_obs '{
  "resourceType": "Observation",
  "status": "final",
  "meta": {
    "tag": [{"system": "https://signal.health", "code": "signal-episode"}]
  },
  "code": {
    "coding": [{"system": "https://signal.health/observation", "code": "symptom-observation", "display": "Signal Symptom Observation"}],
    "text": "Signal Symptom Observation"
  },
  "subject": {"reference": "Patient/a305a3c5-c2f8-e006-d7f5-8e772561fe56"},
  "effectiveDateTime": "2026-05-11T17:00:00-03:00",
  "extension": [
    {"url": "https://signal.health/episode-id", "valueString": "episode-ethyl-001"},
    {"url": "https://signal.health/algorithm-output", "valueString": "monitor"},
    {"url": "https://signal.health/observation-number", "valueInteger": 1}
  ],
  "note": [{"text": "I have been feeling more tired than usual for the past couple of weeks. I thought it was just the season but it is not getting better."}],
  "component": [
    {"code": {"text": "location"}, "valueString": "General — energy level"},
    {"code": {"text": "sensation"}, "valueString": "Persistent tiredness, low energy"},
    {"code": {"text": "pattern"}, "valueString": "Throughout the day, worse in the afternoon"},
    {"code": {"text": "intensity"}, "valueString": "4/10"},
    {"code": {"text": "since"}, "valueString": "May 1, 2026"}
  ]
}'
echo ""

echo -n "Signal Obs 2 — Ethyl Medhurst (May 17)... "
post_obs '{
  "resourceType": "Observation",
  "status": "final",
  "meta": {
    "tag": [{"system": "https://signal.health", "code": "signal-episode"}]
  },
  "code": {
    "coding": [{"system": "https://signal.health/observation", "code": "symptom-observation", "display": "Signal Symptom Observation"}],
    "text": "Signal Symptom Observation"
  },
  "subject": {"reference": "Patient/a305a3c5-c2f8-e006-d7f5-8e772561fe56"},
  "effectiveDateTime": "2026-05-17T18:00:00-03:00",
  "extension": [
    {"url": "https://signal.health/episode-id", "valueString": "episode-ethyl-001"},
    {"url": "https://signal.health/algorithm-output", "valueString": "advise"},
    {"url": "https://signal.health/observation-number", "valueInteger": 2},
    {"url": "https://signal.health/patient-voice", "valueString": "I am exhausted all the time now. Even after sleeping 8 hours I wake up tired. I have stopped doing my afternoon walks because I do not have the energy. This has been going on for 3 weeks."},
    {"url": "https://signal.health/ice-thinks", "valueString": "Could be my age or possibly something with my thyroid or iron levels"},
    {"url": "https://signal.health/ice-worries", "valueString": "I have never felt this tired for this long — something feels different"},
    {"url": "https://signal.health/ice-expects", "valueString": "Blood tests to rule out anything serious and guidance on what to do"}
  ],
  "note": [{"text": "Fatigue is now affecting daily activities. Unable to complete afternoon walks. Waking unrefreshed despite adequate sleep duration."}],
  "component": [
    {"code": {"text": "location"}, "valueString": "General — energy level"},
    {"code": {"text": "sensation"}, "valueString": "Exhaustion, unrefreshing sleep"},
    {"code": {"text": "pattern"}, "valueString": "Constant, limiting daily activities"},
    {"code": {"text": "intensity"}, "valueString": "7/10"},
    {"code": {"text": "since"}, "valueString": "May 1, 2026"}
  ]
}'
echo ""

echo ""
echo "=== Done ==="
echo "Appointments: Mon-Fri May 18-22 2026"
echo "Signal episodes: Shalanda Treutel, Dwana Tremblay, Jody Hickle, Ethyl Medhurst"