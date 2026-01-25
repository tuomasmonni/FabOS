// Puristehitsattujen ritilöiden ja askelmien tuotetiedot
// Perustuu dokumentaatioon: C:\Claude\ritilämoduuli

export const MATERIALS = [
  { id: 'steel', name: 'Teräs S235JR', priceMultiplier: 1.0 },
  { id: 'stainless_v2a', name: 'RST V2A (AISI 304)', priceMultiplier: 3.2 },
  { id: 'stainless_v4a', name: 'Haponkestävä V4A (AISI 316L)', priceMultiplier: 4.5 }
];

export const SURFACE_TREATMENTS = [
  { id: 'hot_dip_galvanized', name: 'Kuumasinkitty', priceMultiplier: 1.2 },
  { id: 'untreated', name: 'Käsittelemätön', priceMultiplier: 1.0 },
  { id: 'painted', name: 'Maalattu', priceMultiplier: 1.4 }
];

export const BEARING_BAR_PROFILES = [
  // Paksuus 2mm
  { code: '20/2', height: 20, thickness: 2 },
  { code: '25/2', height: 25, thickness: 2 },
  { code: '30/2', height: 30, thickness: 2 },
  { code: '35/2', height: 35, thickness: 2 },
  { code: '40/2', height: 40, thickness: 2 },
  { code: '45/2', height: 45, thickness: 2 },
  { code: '50/2', height: 50, thickness: 2 },
  // Paksuus 3mm
  { code: '20/3', height: 20, thickness: 3 },
  { code: '25/3', height: 25, thickness: 3 },
  { code: '30/3', height: 30, thickness: 3 },
  { code: '35/3', height: 35, thickness: 3 },
  { code: '40/3', height: 40, thickness: 3 },
  { code: '45/3', height: 45, thickness: 3 },
  { code: '50/3', height: 50, thickness: 3 },
  { code: '60/3', height: 60, thickness: 3 },
  { code: '70/3', height: 70, thickness: 3 },
  { code: '80/3', height: 80, thickness: 3 },
  // Paksuus 4mm
  { code: '20/4', height: 20, thickness: 4 },
  { code: '25/4', height: 25, thickness: 4 },
  { code: '30/4', height: 30, thickness: 4 },
  { code: '35/4', height: 35, thickness: 4 },
  { code: '40/4', height: 40, thickness: 4 },
  { code: '45/4', height: 45, thickness: 4 },
  { code: '50/4', height: 50, thickness: 4 },
  { code: '60/4', height: 60, thickness: 4 },
  { code: '70/4', height: 70, thickness: 4 },
  { code: '80/4', height: 80, thickness: 4 },
  // Paksuus 5mm
  { code: '20/5', height: 20, thickness: 5 },
  { code: '25/5', height: 25, thickness: 5 },
  { code: '30/5', height: 30, thickness: 5 },
  { code: '35/5', height: 35, thickness: 5 },
  { code: '40/5', height: 40, thickness: 5 },
  { code: '45/5', height: 45, thickness: 5 },
  { code: '50/5', height: 50, thickness: 5 },
  { code: '60/5', height: 60, thickness: 5 },
  { code: '70/5', height: 70, thickness: 5 },
  { code: '80/5', height: 80, thickness: 5 }
];

export const BEARING_BAR_SPACINGS = [
  15.08, 17.15, 20.77, 23.69, 25.00, 30.15, 34.30, 41.45, 45.23, 51.45, 60.30, 68.60
];

export const CROSS_BAR_SPACINGS = [
  19.25, 24.0, 38.1, 50.8, 76.2, 101.6
];

// Yhteensopivuusmatriisi: kantoteräsjako -> saatavat sideteräsjaot
export const MESH_COMPATIBILITY = {
  15.08: [38.1, 50.8, 76.2, 101.6],
  17.15: [38.1, 50.8, 76.2, 101.6],
  20.77: [24.0, 38.1, 50.8, 76.2, 101.6], // 101.6 rajoitetusti
  23.69: [24.0, 38.1, 50.8, 76.2, 101.6], // 101.6 rajoitetusti
  25.00: [76.2, 101.6],
  30.15: [38.1, 50.8, 76.2, 101.6],
  34.30: [19.25, 24.0, 38.1, 50.8, 76.2, 101.6],
  41.45: [24.0, 38.1, 50.8, 76.2, 101.6],
  45.23: [38.1, 50.8, 76.2, 101.6],
  51.45: [38.1, 50.8, 76.2, 101.6],
  60.30: [24.0, 38.1, 50.8, 76.2, 101.6],
  68.60: [24.0, 38.1, 50.8, 76.2, 101.6]
};

export const ANTI_SLIP_OPTIONS = [
  { id: 'plain', name: 'Sileä', slipClass: null, priceMultiplier: 1.0 },
  { id: 'serrated', name: 'Liukuturvaloveuksilla', slipClass: 'R11-R13', priceMultiplier: 1.15 }
];

export const EDGE_BANDING_OPTIONS = [
  { id: 'flat_bar', name: 'Reunalista' },
  { id: 'angle', name: 'Kulmarauta' },
  { id: 't_section', name: 'T-profiili' },
  { id: 'u_section', name: 'U-profiili' }
];

export const NOSING_OPTIONS = [
  { id: 'ls_nosing', name: 'LS-liukastumisenestolistalla', default: true, slipClass: 'R11' },
  { id: 'checker_plate', name: 'Ruutulevyreunalla' },
  { id: 'perforated', name: "Rei'itetty turvanokka", description: 'Max 120mm läpiastuttava (ÖNORM B 5371)' }
];

export const STANDARD_TREAD_WIDTHS = [
  { width: 240, drillDistance: 120 },
  { width: 270, drillDistance: 150 },
  { width: 300, drillDistance: 180 },
  { width: 305, drillDistance: 180 }
];

export const SPIRAL_STEPS = [
  { length: 800, width: 368, height: '90/60', thickness: 3.0, weight: 5.80, radius: 57, angle: 18.5 },
  { length: 900, width: 386, height: '90/60', thickness: 3.0, weight: 6.90, radius: 67, angle: 16.4 },
  { length: 1000, width: 403, height: '90/60', thickness: 3.0, weight: 7.80, radius: 67, angle: 15.7 },
  { length: 1200, width: 411, height: '90/60', thickness: 3.0, weight: 9.70, radius: 84, angle: 11.7 }
];

export const FIXING_CLIPS = [
  { id: 'clamp_b', name: 'Kiinnitin S', description: 'Yläosa + alaosa + M8x60-ruuvit + M8-neliömutteri' },
  { id: 'double_clamp_b', name: 'Kaksoiskiinnitin B', description: '2x yläosa + alaosa + 2x kuusioruuvi + 2x neliömutteri' },
  { id: 'safety_clamp_a', name: 'Turvakiinnitin A', description: 'Turvayläosa + alaosa + kuusioruuvi + neliömutteri' },
  { id: 'safety_clamp_d', name: 'Turvakiinnitin D', description: 'Turvayläosa + alaosa + kuusioruuvi + neliömutteri' },
  { id: 'clamp_b10', name: 'Kiinnitin S tiheälle', description: 'Yläosa + kuusiokoloruuvi + alaosa + mutteri' },
  { id: 'hilti_clamp', name: 'Hilti XMGR', description: 'Hyvä tärinänkestävyys, 1 henkilön asennettavissa' },
  { id: 'heald_bolt', name: 'Ammuttava kiinnitin', description: 'Yläosa + laippa, offshore X-BT saatavilla' },
  { id: 'butt_joint', name: 'Puskuliitos', description: 'Yläosa + alaosa kierteellä + kuusiokoloruuvi' },
  { id: 'welded_plates', name: 'Hitsatut kiinnityslevyt', description: 'Reiän koko asiakkaan mukaan' }
];

// Kuormituksen valintaopas
export const LOAD_GUIDE = {
  pedestrian_light: {
    name: 'Kevyt jalankulku',
    profiles: ['20/2', '20/3', '25/2']
  },
  pedestrian_normal: {
    name: 'Normaali jalankulku',
    profiles: ['25/3', '30/2', '30/3']
  },
  industrial_light: {
    name: 'Kevyt teollinen',
    profiles: ['30/3', '35/3', '40/3']
  },
  industrial_heavy: {
    name: 'Raskas teollinen',
    profiles: ['40/4', '50/4', '60/5', '70/5', '80/5']
  }
};

// Valmistusrajat
export const MANUFACTURING_LIMITS = {
  maxCrossBarLength: 1250, // mm (leveys)
  maxBearingBarLength: 12200, // mm (pituus)
  minPanelSize: 100, // mm
  minTreadLength: 400 // mm
};

// Visualisoinnin värit
export const COLORS = {
  bearingBar2D: '#1E3A5F',
  bearingBar3D: '#2C5282',
  crossBar2D: '#A0AEC0',
  crossBar3D: '#CBD5E0',
  edgeBanding2D: '#2D3748',
  edgeBanding3D: '#4A5568',
  weldPoint2D: '#E53E3E',
  cutEdgeOpen2D: '#ED8936',
  cutEdgeOpen3D: '#DD6B20',
  cutEdgeBanded2D: '#2D3748',
  cutEdgeBanded3D: '#4A5568'
};

// Validointisäännöt
export const VALIDATION_RULES = {
  minCutSize: 50,
  minDistanceFromEdge: 20,
  minBearingBarsToEdge: 2,
  warnOpenEdgeLength: 500
};

// Yleiset silmäkoot
export const COMMON_MESHES = [
  { code: '34x38', bearingBar: 34.30, crossBar: 38.1, note: 'Tiheä, raskas kuormitus' },
  { code: '34x76', bearingBar: 34.30, crossBar: 76.2, note: 'Vakiorakenne askelmille' },
  { code: '30x50', bearingBar: 30.15, crossBar: 50.8, note: 'Yleinen teollisuus' },
  { code: '41x76', bearingBar: 41.45, crossBar: 76.2, note: 'Kevyempi rakenne' }
];

// Hinnoittelu (esimerkki perushinta €/m²)
export const BASE_PRICES = {
  steel_30_3: 85, // Teräs 30/3 kuumasinkitty
  steel_40_3: 95,
  steel_50_3: 110,
  stainless_30_3: 280,
  stainless_40_3: 320
};

// Apufunktio: laske hinta (yksinkertaistettu)
export function calculateGratingPrice(config) {
  const {
    length, // mm
    width, // mm
    material,
    surfaceTreatment,
    bearingBarProfile,
    antiSlip,
    quantity = 1
  } = config;

  // Perushintalaskelma (€/m²)
  let basePrice = 85; // Oletus teräs 30/3

  // Materiaalin kerroin
  const mat = MATERIALS.find(m => m.id === material);
  if (mat) basePrice *= mat.priceMultiplier;

  // Pintakäsittelyn kerroin
  const surface = SURFACE_TREATMENTS.find(s => s.id === surfaceTreatment);
  if (surface) basePrice *= surface.priceMultiplier;

  // Liukuturvan kerroin
  const slip = ANTI_SLIP_OPTIONS.find(a => a.id === antiSlip);
  if (slip) basePrice *= slip.priceMultiplier;

  // Kantoteräksen korkeus vaikuttaa hintaan
  const profile = BEARING_BAR_PROFILES.find(p => p.code === bearingBarProfile);
  if (profile) {
    basePrice *= (1 + (profile.height - 30) * 0.01);
  }

  // Pinta-ala m²
  const area = (length / 1000) * (width / 1000);

  // Kokonaishinta
  return basePrice * area * quantity;
}

// Apufunktio: snap kantoteräksen jakoon
export function snapToGrid(value, bearingBarSpacing) {
  return Math.round(value / bearingBarSpacing) * bearingBarSpacing;
}

// Apufunktio: tarkista silmäkoon yhteensopivuus
export function isValidMesh(bearingBarSpacing, crossBarSpacing) {
  const compatible = MESH_COMPATIBILITY[bearingBarSpacing];
  return compatible ? compatible.includes(crossBarSpacing) : false;
}
