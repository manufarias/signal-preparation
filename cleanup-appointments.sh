BASE="https://fhir.medblocks.com/fhir/3A77s6opP2lCnpo3UALErBIyYOIWborT"
TOKEN="eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJtYW51ZWxmYXJpYXNAZ21haWwuY29tIiwidGVuYW50X2lkIjoiM0E3N3M2b3BQMmxDbnBvM1VBTEVyQkl5WU9JV2JvclQiLCJyb2xlIjoiVEVOQU5UX1VTRVIiLCJpYXQiOjE3Nzg4NjU4NTgsImV4cCI6MTc4NDA0OTg1OH0.fdxOxLdjzwDxI45I88lwD6GZb4MlaK0PQoOaM6C_ouN07XLajr8V4H4LqRJppNPmgTT1lWK-Qs6eMwn-W-NOMQ"

# Traer todos los IDs de appointments
IDS=$(curl -s "$BASE/Appointment?_count=200" \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys,json; data=json.load(sys.stdin); [print(e['resource']['id']) for e in data.get('entry',[])]")

# Borrar cada uno
for ID in $IDS; do
  echo -n "Deleting $ID... "
  curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/Appointment/$ID" \
    -H "Authorization: Bearer $TOKEN"
  echo ""
done