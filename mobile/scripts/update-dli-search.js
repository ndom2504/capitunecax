const fs = require('fs');
let code = fs.readFileSync('app/capi/autonomie/dli-search.tsx', 'utf8');

const selectModalCode = `
// ---------------------------------------------------------------------------
// Composant SelectModal
// ---------------------------------------------------------------------------
import { Modal } from 'react-native';

function SelectDropdown({ 
  label, value, options, onSelect 
}: { 
  label: string; value: string; options: {label: string, value: string}[]; onSelect: (val: any) => void; 
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label || label;
  
  return (
    <>
      <TouchableOpacity 
        style={dropdownStyles.button} 
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={[dropdownStyles.buttonText, value !== 'all' && dropdownStyles.buttonTextActive]} numberOfLines={1}>
          {selectedLabel}
        </Text>
        <Ionicons name="chevron-down" size={14} color={value !== 'all' ? Colors.primary : Colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={dropdownStyles.modalBackdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={dropdownStyles.modalContent}>
            <View style={dropdownStyles.modalHeader}>
              <Text style={dropdownStyles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({item}) => (
                <TouchableOpacity 
                  style={[dropdownStyles.option, item.value === value && dropdownStyles.optionActive]} 
                  onPress={() => { onSelect(item.value); setOpen(false); }}
                >
                  <Text style={[dropdownStyles.optionText, item.value === value && dropdownStyles.optionTextActive]}>
                    {item.label}
                  </Text>
                  {item.value === value && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const dropdownStyles = StyleSheet.create({
  button: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bgLight, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10, marginHorizontal: 3,
  },
  buttonText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500', flex: 1, marginRight: 4 },
  buttonTextActive: { color: Colors.primary, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  optionActive: { backgroundColor: Colors.primary + '10' },
  optionText: { fontSize: 16, color: Colors.text },
  optionTextActive: { color: Colors.primary, fontWeight: '700' },
});
`;

code = code.replace(/function FilterChip[\s\S]*?labelActive: \{ color: '#fff' \},\n\}\);/, selectModalCode.trim());

const newCardCode = `
import { Image } from 'react-native';

function InstitutionCard({
  item, selected, canAdd, onViewAdmission, onValidate,
}: {
  item: DLIInstitution;
  selected: boolean;
  canAdd: boolean;
  onViewAdmission: () => void;
  onValidate: () => void;
}) {
  const typeLabel = TYPE_LABELS[item.type as DLIType] ?? item.type;
  const provLabel = PROVINCE_LABELS[item.province as ProvinceCode] ?? item.province;
  const avatarUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(item.nom) + "&background=random&size=128&bold=true&color=F27038&background=fff4ed";

  return (
    <View style={[cardStyles.card, selected && cardStyles.cardSelected]}>
      <View style={cardStyles.banner}>
        <Image source={{ uri: avatarUrl }} style={cardStyles.avatar} />
        <View style={cardStyles.typeBadge}>
          <Text style={cardStyles.typeBadgeText}>{typeLabel}</Text>
        </View>
        {selected && (
          <View style={cardStyles.selBadge}>
             <Ionicons name="checkmark-circle" size={16} color="#fff" />
          </View>
        )}
      </View>

      <View style={cardStyles.content}>
        <Text style={cardStyles.nom} numberOfLines={2}>{item.nom}</Text>
        <View style={cardStyles.metaRow}>
           <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
           <Text style={cardStyles.metaText}>{item.ville ? item.ville + ', ' : ''}{provLabel}</Text>
        </View>

        <View style={cardStyles.actions}>
          <TouchableOpacity style={cardStyles.viewBtn} onPress={onViewAdmission} activeOpacity={0.8}>
            <Text style={cardStyles.viewBtnText}>Demande d'admission</Text>
            <Ionicons name="open-outline" size={14} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              cardStyles.validateBtn,
              selected && cardStyles.validateBtnSelected,
              !canAdd && !selected && cardStyles.validateBtnDisabled,
            ]}
            onPress={onValidate}
            activeOpacity={0.8}
            disabled={!canAdd && !selected}
          >
            <Ionicons
              name={selected ? 'close' : 'checkmark'}
              size={18}
              color={selected ? Colors.textMuted : (canAdd ? Colors.primary : Colors.textMuted)}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1.5, borderColor: Colors.border, marginBottom: 16, ...UI.cardShadow,
  },
  cardSelected: { borderColor: Colors.success, backgroundColor: Colors.success + '05', borderWidth: 2 },
  banner: {
    height: 100, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 1, borderBottomColor: Colors.border, position: 'relative'
  },
  avatar: { width: 64, height: 64, borderRadius: 12 },
  typeBadge: {
    position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: Colors.border, ...UI.cardShadow,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
  selBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: Colors.success, borderRadius: 12, padding: 2 },
  content: { padding: 16 },
  nom: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 8, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  metaText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 8 },
  viewBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#ff7a00', borderRadius: 8, paddingVertical: 12,
  },
  viewBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  validateBtn: {
    width: 44, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 8,
  },
  validateBtnSelected: { backgroundColor: Colors.border, borderColor: Colors.border },
  validateBtnDisabled: { borderColor: Colors.border, opacity: 0.5 },
});
`;

code = code.replace(/function InstitutionCard[\s\S]*?validateBtnText: \{ fontSize: 12, fontWeight: '700', color: '#fff' \},\n\}\);/, newCardCode.trim());

// Update states
code = code.replace(/const \[province, setProvince\] = useState<ProvinceCode \| null>\(null\);\s*const \[typeFilter, setTypeFilter\] = useState<DLIType \| null>\(null\);/, 
`const [province, setProvince] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');`);

// Update logic
code = code.replace(/const results = useMemo\([\s\S]*?\[allInstitutions, debouncedQ, province, typeFilter\],\n  \);/,
`const results = useMemo(() => {
    let matchType = (item: DLIInstitution) => {
      if (levelFilter === 'all') return true;
      if (levelFilter === 'university') return item.type === 'universite';
      return item.type === 'cegep' || item.type === 'college' || item.type === 'technique';
    };

    const res = filterDLI(allInstitutions, { 
      query: debouncedQ, 
      province: province === 'all' ? undefined : province, 
      city: cityFilter === 'all' ? undefined : cityFilter, 
    });
    
    return res.filter(matchType);
  }, [allInstitutions, debouncedQ, province, cityFilter, levelFilter]);`);

// Update dropdowns content building
code = code.replace(/const provincesDisponibles = useMemo<ProvinceCode\[\]>\([\s\S]*?\[allInstitutions\],\n  \);/,
`const provincesDisponibles = useMemo(() => {
    return Array.from(new Set(allInstitutions.map(i => i.province as string))).filter(Boolean).sort();
  }, [allInstitutions]);

  const citiesDisponibles = useMemo(() => {
    const subset = province === 'all' ? allInstitutions : allInstitutions.filter(i => i.province === province);
    return Array.from(new Set(subset.map(i => i.ville))).filter(v => v && v.length > 1).sort();
  }, [allInstitutions, province]);`);

// Build UI blocks
const searchAndFilters = `
        {/* -- Section Web-like -- */}
        <View style={styles.fixedTop}>
          <View style={styles.webStyleHeader}>
            <View>
              <Text style={styles.webStyleTitle}>Trouver une formation</Text>
              <Text style={styles.webStyleSub}>Recherchez parmi les EED au Canada.</Text>
            </View>
            {!loading && (
              <View style={styles.connectedBadge}>
                <Text style={styles.connectedBadgeNum}>{allInstitutions.length}</Text>
                <Text style={styles.connectedBadgeText}> Établissements connectés</Text>
              </View>
            )}
          </View>

          <View style={styles.webStyleFiltersContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Ex: Informatique, Design, Montréal, UQAM..."
                placeholderTextColor={Colors.textMuted}
                value={query}
                onChangeText={onChangeQuery}
                returnKeyType="search"
                onSubmitEditing={() => Keyboard.dismiss()}
                autoCorrect={false}
              />
            </View>
            <View style={styles.dropdownsRow}>
              <SelectDropdown 
                label="Province" 
                value={province} 
                options={[{label: 'Toutes provinces', value: 'all'}, ...provincesDisponibles.map(p => ({label: PROVINCE_LABELS[p as ProvinceCode] || p, value: p}))]} 
                onSelect={(v) => { setProvince(v); setCityFilter('all'); }} 
              />
              <SelectDropdown 
                label="Ville" 
                value={cityFilter} 
                options={[{label: 'Toutes villes', value: 'all'}, ...citiesDisponibles.map(c => ({label: c, value: c}))]} 
                onSelect={(v) => setCityFilter(v)} 
              />
              <SelectDropdown 
                label="Niveau" 
                value={levelFilter} 
                options={[
                  {label: 'Tous niveaux', value: 'all'},
                  {label: 'Université', value: 'university'},
                  {label: 'Collège / Cégep', value: 'college'},
                ]} 
                onSelect={(v) => setLevelFilter(v)} 
              />
            </View>
            <Text style={styles.resultsCountText}>
              {results.length} résultats affichés sur {allInstitutions.length}
            </Text>
          </View>
`;

code = code.replace(/<View style=\{styles\.fixedTop\}>[\s\S]*?<\/ScrollView>/, searchAndFilters.trim());

// Remove old header title inside layout
code = code.replace(/<View style=\{\{ flex: 1 \}\}>\s*<Text style=\{styles.headerTitle\}>Trouver un établissement<\/Text>\s*<Text style=\{styles.headerSub\}>\s*\{loading \? 'Chargement…' : `\$\{results.length\} \/ \$\{allInstitutions.length\} DLI`\}\s*<\/Text>\s*<\/View>/, '<View style={{ flex: 1 }} />');

// Update styling
code = code.replace(/fixedTop: \{[\s\S]*?\},/, 
`fixedTop: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, backgroundColor: Colors.bgLight },
  webStyleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14, flexWrap: 'wrap', gap: 10 },
  webStyleTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  webStyleSub: { fontSize: 13, color: Colors.textMuted },
  connectedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary + '10', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary + '30' },
  connectedBadgeNum: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  connectedBadgeText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  webStyleFiltersContainer: { backgroundColor: Colors.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: Colors.border, ...UI.cardShadow },
  dropdownsRow: { flexDirection: 'row', gap: 0, marginTop: 10, marginHorizontal: -3 },
  resultsCountText: { fontSize: 11, color: Colors.textMuted, textAlign: 'right', marginTop: 10, fontWeight: '500' },`);

if (!code.includes('import { Image, Modal,')) {
  code = code.replace(/import \{/, "import { Image, Modal,");
}

fs.writeFileSync('app/capi/autonomie/dli-search.tsx', code, 'utf8');
