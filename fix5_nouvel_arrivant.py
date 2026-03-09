"""
Script 5: Ajoute des liens transport aéroport (Uber, InDriver, aéroports)
et insère une étape 'airport_transport' entre 'airport' et 'temp_housing'
dans les 4 statuts (rp, student, worker, asylum).
"""

PATH = r'c:\capitunecax\mobile\app\capi\nouvel-arrivant.tsx'

with open(PATH, 'r', encoding='utf-8') as f:
    content = f.read()

def replace_once(src, old, new, label):
    idx = src.find(old)
    if idx == -1:
        print(f'  ERROR: [{label}] not found!')
        return src
    print(f'  OK: [{label}] found at char {idx}')
    return src[:idx] + new + src[idx + len(old):]

# ─────────────────────────────────────────────────────────────────────────────
# 1. Ajouter les URLs de transport aéroport dans EXTERNAL
# ─────────────────────────────────────────────────────────────────────────────
OLD_TRANSPORT_SECTION = """  // Transport
  stm: 'https://www.stm.info',"""

NEW_TRANSPORT_SECTION = """  // Transport aéroport (rideshare + navettes)
  uber: 'https://www.uber.com/ca/fr/',
  inDriver: 'https://indriver.com/country/ca',
  yulTransport: 'https://www.admtl.com/fr/passagers/transport-et-stationnement',
  yyzTransport: 'https://www.torontopearson.com/fr/transports',
  yvrTransport: 'https://www.yvr.ca/fr/passagers/transport-terrestre',
  // Transport en commun
  stm: 'https://www.stm.info',"""

content = replace_once(content, OLD_TRANSPORT_SECTION, NEW_TRANSPORT_SECTION, 'EXTERNAL transport section')

# ─────────────────────────────────────────────────────────────────────────────
# 2. Nouvelle étape à insérer (même contenu pour tous les statuts)
# ─────────────────────────────────────────────────────────────────────────────
AIRPORT_TRANSPORT_STEP = """        // \u2500\u2500 \u00c9tape 1b : Transport a\u00e9roport \u2500\u2500
        {
          id: 'airport_transport',
          title: 'Transport : a\u00e9roport \u2192 h\u00e9bergement',
          description: 'Organisez votre trajet de l\u2019a\u00e9roport au logement. Uber est disponible dans la majorit\u00e9 des a\u00e9roports canadiens (zone de prise en charge d\u00e9di\u00e9e, distincte des taxis). Les taxis officiels sont r\u00e9glement\u00e9s et affichent un tarif fixe depuis les a\u00e9roports dans plusieurs villes.',
          when: 'Jour 0',
          documents: ['T\u00e9l\u00e9phone charg\u00e9 + internet (Wi-Fi a\u00e9roport ou SIM locale)', 'Adresse du logement temporaire'],
          links: [
            { label: 'Uber Canada \u2014 r\u00e9server un trajet', url: EXTERNAL.uber },
            { label: 'InDriver Canada \u2014 tarifs n\u00e9goci\u00e9s', url: EXTERNAL.inDriver },
            { label: 'Transports a\u00e9roport Montr\u00e9al / YUL (officiel)', url: EXTERNAL.yulTransport },
            { label: 'Transports a\u00e9roport Toronto / YYZ (officiel)', url: EXTERNAL.yyzTransport },
            { label: 'Transports a\u00e9roport Vancouver / YVR (officiel)', url: EXTERNAL.yvrTransport },
          ],
          checkItems: [
            { id: 'address_ready', label: 'Avoir l\u2019adresse du logement disponible (message, courriel ou note).' },
            { id: 'choose_ride', label: 'Choisir Uber, InDriver, navette ou taxi officiel selon la ville.' },
            { id: 'pickup_zone', label: 'Rep\u00e9rer la zone de prise en charge : Uber/rideshare \u2260 taxi (panneaux \u00e0 la sortie baggages).' },
            { id: 'set_destination', label: 'Saisir l\u2019adresse ou montrer la note au chauffeur.' },
          ],
        },
"""

# ─────────────────────────────────────────────────────────────────────────────
# Helper : insert AIRPORT_TRANSPORT_STEP after the 'airport' step in a given case
# Strategy: find `          id: 'temp_housing',` and insert just before it.
# Since 4 statuses all have `id: 'temp_housing'`, we do 4 replacements.
# ─────────────────────────────────────────────────────────────────────────────

# Each temp_housing block begins with this pattern (preceded by a step closing `},`)
# We'll match `        // \u2500\u2500 \u00c9tape 2` or just the `id: 'temp_housing'` line
# But since there are 4 occurrences, we'll do it by replacing each one by finding
# the text just before it and inserting between.

# For each status, the `id: 'temp_housing'` is preceded by a comment `// \u2500\u2500 \u00c9tape 2` 
# Let's match on the comment line which is unique per block.
# Pattern common to all 4: "        // \u2500\u2500 \u00c9tape 2 \u2500\u2500\n        {\n          id: 'temp_housing',"

MARKER = "        // \u2500\u2500 \u00c9tape 2 \u2500\u2500\n        {\n          id: 'temp_housing',"

count = content.count(MARKER)
print(f"Found {count} occurrences of MARKER (should be 4)")

# Replace all 4 occurrences at once by iterating
new_content = content
replaced = 0
pos = 0
while True:
    idx = new_content.find(MARKER, pos)
    if idx == -1:
        break
    new_content = new_content[:idx] + AIRPORT_TRANSPORT_STEP + new_content[idx:]
    pos = idx + len(AIRPORT_TRANSPORT_STEP) + len(MARKER)  # move past the inserted block
    replaced += 1

print(f"Replaced {replaced} occurrences")

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Done. New length: {len(new_content)} chars")
