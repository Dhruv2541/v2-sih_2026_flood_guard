import { SectorData, ReliefCamp, GaugeStation, FloodAlert, HistoricalYearRecord, ModelMetric, DataSourceItem, InfrastructureItem } from '../types';

export const ASSAM_SECTORS: Record<string, SectorData> = {
  dhemaji: {
    id: 'dhemaji',
    district: 'Dhemaji',
    subdivision: 'Upper Assam Valley',
    state: 'Assam',
    coordinates: { lat: 27.4812, lng: 94.5822 },
    stationCode: 'Jiadhal Gauge #04',
    stationName: 'Dhemaji Town',
    vulnerabilityIndex: 88,
    hazardLevel: 'HIGH',
    levelBadge: 'Level 4',
    statusSummary: 'HIGH FLOOD RISK & INUNDATION',
    floodProb: 87.6,
    confidence: 93.4,
    peakWindow: '18-36 Hrs',
    peakWindowDesc: 'Hydro-surge',
    riverStageDelta: '+1.85m',
    riverStageDesc: 'Over Danger Mark',
    stageAbsolute: 104.85,
    dangerLevel: 103.00,
    riverName: 'Jiadhal River (Braided Tributary)',
    warningMessage: 'Severe flood risk predicted in Dhemaji. Jiadhal River stage rising above 104.85m (+1.85m over Danger Level). Potential embankment breach at Batgharia.',
    asdmaDirective: 'ASDMA DIRECTIVE LEVEL 3 ACTIVATED: Follow official evacuation guidance and move to designated high-bund relief camps. Keep livestock untethered.',

    // 4 Core Questions
    inundationAreaKm2: 142.8,
    waterDepthAvgM: 1.45,
    waterDepthPeakM: 2.85,
    affectedNeighborhoods: [
      'Dhemaji Municipality (Wards 1, 3, 5)',
      'Gogamukh Riverine Agricultural Belt',
      'Batgharia Embankment Breach Zone',
      'Machkhowa Low-lying Chaporis',
      'Sissiborgaon Floodplain'
    ],
    inundationPathSummary: 'Upstream surge spilling through breached right embankment at Batgharia, flowing south-west along NH-15 culvert channels toward Moridhal.',
    populationAtRisk: 686000,
    vulnerableDemographics: {
      childrenUnder5: 84200,
      elderlyOver65: 58900,
      livestockCount: 142000
    },
    infrastructureCounts: {
      hospitals: 4,
      schools: 23,
      roads: 18,
      bridges: 3
    },
    infrastructureList: [
      {
        id: 'inf-h1',
        type: 'hospital',
        name: 'Dhemaji Civil District Hospital',
        status: 'Potentially affected',
        riskLevel: 'HIGH',
        distanceFromInundationM: 320,
        coordinates: { x: 380, y: 175, lat: 27.485, lng: 94.588 },
        details: 'Basement generators elevated; outpatient wards relocated to 1st floor.',
        capacityOrBeds: '200 Beds • Trauma Center'
      },
      {
        id: 'inf-h2',
        type: 'hospital',
        name: 'Gogamukh Community Health Centre (CHC)',
        status: 'Critical inundation zone',
        riskLevel: 'CRITICAL',
        distanceFromInundationM: 45,
        coordinates: { x: 260, y: 220, lat: 27.442, lng: 94.495 },
        details: 'Surrounding compound submerged 0.6m. Patients shifted to raised wing.',
        capacityOrBeds: '50 Beds • Emergency Unit'
      },
      {
        id: 'inf-h3',
        type: 'hospital',
        name: 'Sissiborgaon Model Hospital',
        status: 'Potentially affected',
        riskLevel: 'HIGH',
        distanceFromInundationM: 480,
        coordinates: { x: 420, y: 140, lat: 27.52, lng: 94.62 },
        details: 'Access road submerged; ambulance boats deployed.',
        capacityOrBeds: '30 Beds'
      },
      {
        id: 'inf-h4',
        type: 'hospital',
        name: 'Machkhowa Primary Health Unit',
        status: 'Potentially affected',
        riskLevel: 'HIGH',
        distanceFromInundationM: 210,
        coordinates: { x: 480, y: 260, lat: 27.39, lng: 94.63 },
        details: 'Essential ORS, anti-venom, and water purification stocks staged.',
        capacityOrBeds: '15 Beds'
      },
      {
        id: 'inf-s1',
        type: 'school',
        name: 'Dhemaji Higher Secondary School',
        status: 'Safe / Active Shelter',
        riskLevel: 'LOW',
        distanceFromInundationM: 1400,
        coordinates: { x: 360, y: 160, lat: 27.483, lng: 94.586 },
        details: 'Designated ASDMA Multi-Purpose Relief Center. Elevated MSL 108.5m.',
        capacityOrBeds: 'Capacity: 1,200 Evacuees'
      },
      {
        id: 'inf-s2',
        type: 'school',
        name: 'Batgharia Tribal Primary School',
        status: 'Critical inundation zone',
        riskLevel: 'CRITICAL',
        distanceFromInundationM: 0,
        coordinates: { x: 330, y: 145, lat: 27.49, lng: 94.54 },
        details: 'Ground-level classrooms submerged by 1.2m surge waters.',
        capacityOrBeds: 'Closed • Students Relocated'
      },
      {
        id: 'inf-s3',
        type: 'school',
        name: 'Moridhal College Campus',
        status: 'Safe / Active Shelter',
        riskLevel: 'LOW',
        distanceFromInundationM: 2100,
        coordinates: { x: 440, y: 120, lat: 27.502, lng: 94.611 },
        details: 'Active DDMA emergency shelter with 24h clean water and medical post.',
        capacityOrBeds: 'Capacity: 2,500 Evacuees'
      },
      {
        id: 'inf-r1',
        type: 'road',
        name: 'National Highway 15 (NH-15 KM 42-56)',
        status: 'Potentially affected',
        riskLevel: 'HIGH',
        distanceFromInundationM: 110,
        coordinates: { x: 310, y: 190, lat: 27.47, lng: 94.56 },
        details: 'Water overtopping culverts at Batgharia. Heavy vehicles restricted.',
        capacityOrBeds: '14.2 km Corridor at Risk'
      },
      {
        id: 'inf-r2',
        type: 'road',
        name: 'Dhemaji - Machkhowa PWD Arterial',
        status: 'Critical inundation zone',
        riskLevel: 'CRITICAL',
        distanceFromInundationM: 0,
        coordinates: { x: 420, y: 230, lat: 27.42, lng: 94.61 },
        details: 'Breached at 3 embankment cuts. Inundated by 0.9m fast-moving current.',
        capacityOrBeds: 'Cut-off • Ferry Transshipment'
      },
      {
        id: 'inf-b1',
        type: 'bridge',
        name: 'Jiadhal RCC River Bridge #3',
        status: 'Potentially affected',
        riskLevel: 'HIGH',
        distanceFromInundationM: 15,
        coordinates: { x: 320, y: 160, lat: 27.48, lng: 94.55 },
        details: 'Clearance under bridge deck reduced to 0.45m. Debris clearance underway.',
        capacityOrBeds: 'Structural Pier Scour Watch'
      },
      {
        id: 'inf-b2',
        type: 'bridge',
        name: 'Kumotia Tributary Culvert Bridge',
        status: 'Critical inundation zone',
        riskLevel: 'CRITICAL',
        distanceFromInundationM: 0,
        coordinates: { x: 390, y: 210, lat: 27.43, lng: 94.58 },
        details: 'Approach road washed out. Traffic fully diverted via Moridhal.',
        capacityOrBeds: 'Severed Approach Road'
      }
    ],
    rainfall: {
      currentRainfall24hMm: 245,
      expectedRainfall48hMm: 380,
      expectedRainfall72hMm: 465,
      intensity: 'VERY HEAVY',
      trend: 'increasing',
      hourlyTimeline: [
        { hour: '-18h', mm: 14, cumulative: 35 },
        { hour: '-12h', mm: 26, cumulative: 61 },
        { hour: '-6h', mm: 48, cumulative: 109 },
        { hour: 'Now', mm: 52, cumulative: 161 },
        { hour: '+6h', mm: 44, cumulative: 205 },
        { hour: '+12h', mm: 40, cumulative: 245 },
        { hour: '+24h', mm: 65, cumulative: 310 },
        { hour: '+48h', mm: 70, cumulative: 380 },
        { hour: '+72h', mm: 85, cumulative: 465 }
      ],
      stationSource: 'IMD Doppler Radar Mohanbari & CWC Telemetric Stn'
    },
    factors: [
      {
        id: 'f-1',
        name: 'Heavy Precipitation Accumulation',
        category: 'Rainfall',
        status: 'CRITICAL',
        contributionPercent: 38,
        direction: 'increased',
        observedValue: '245 mm / 24h (Very Heavy)',
        scientificExplanation: 'Intense orographic monsoon depression over Arunachal foothills triggering flash catchment surge.'
      },
      {
        id: 'f-2',
        name: 'Low Elevation & Flat Plain',
        category: 'Terrain',
        status: 'HIGH',
        contributionPercent: 24,
        direction: 'increased',
        observedValue: '104m MSL (Slope < 0.4%)',
        scientificExplanation: 'SRTM 30m DEM reveals shallow topographic wetness bowl with poor gravitational drainage.'
      },
      {
        id: 'f-3',
        name: 'Soil Moisture Saturation',
        category: 'Soil',
        status: 'HIGH',
        contributionPercent: 20,
        direction: 'increased',
        observedValue: '89.4% Volumetric Saturation',
        scientificExplanation: 'NASA SMAP & insitu sensors confirm ground is completely saturated; zero percolation buffer remains.'
      },
      {
        id: 'f-4',
        name: 'Upstream River Gauge Surge',
        category: 'River Hydrology',
        status: 'HIGH',
        contributionPercent: 12,
        direction: 'increased',
        observedValue: '28,400 m³/s (+1.85m HFL delta)',
        scientificExplanation: 'CWC station reports water flowing 1.85m over official Danger Level with rising hydrograph trend.'
      },
      {
        id: 'f-5',
        name: 'Historical Flood Recurrence',
        category: 'History',
        status: 'HIGH',
        contributionPercent: 6,
        direction: 'increased',
        observedValue: 'Inundated 7 of last 8 monsoons',
        scientificExplanation: 'Historical satellite record indicates high sediment deposition and recurring embankment breach vulnerability.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 82, riskLevel: 'HIGH', floodProbability: 87.6, rainfallAccumulatedMm: 161, inundationAreaKm2: 84.2, populationAtRisk: 410000, riverStageM: 104.85, inundationOpacity: 0.5 },
      { hour: 6, label: '+6h', riskScore: 86, riskLevel: 'HIGH', floodProbability: 90.2, rainfallAccumulatedMm: 205, inundationAreaKm2: 108.5, populationAtRisk: 520000, riverStageM: 105.15, inundationOpacity: 0.65 },
      { hour: 12, label: '+12h', riskScore: 89, riskLevel: 'HIGH', floodProbability: 92.5, rainfallAccumulatedMm: 245, inundationAreaKm2: 126.0, populationAtRisk: 615000, riverStageM: 105.45, inundationOpacity: 0.78 },
      { hour: 24, label: '+24h', riskScore: 91, riskLevel: 'CRITICAL', floodProbability: 94.8, rainfallAccumulatedMm: 310, inundationAreaKm2: 142.8, populationAtRisk: 686000, riverStageM: 105.90, inundationOpacity: 0.88 },
      { hour: 48, label: '+48h', riskScore: 84, riskLevel: 'HIGH', floodProbability: 86.4, rainfallAccumulatedMm: 380, inundationAreaKm2: 135.2, populationAtRisk: 590000, riverStageM: 105.30, inundationOpacity: 0.75 },
      { hour: 72, label: '+72h', riskScore: 68, riskLevel: 'MODERATE', floodProbability: 69.1, rainfallAccumulatedMm: 465, inundationAreaKm2: 98.4, populationAtRisk: 380000, riverStageM: 104.20, inundationOpacity: 0.55 }
    ],
    recommendedActions: [
      'Monitor official warnings issued by ASDMA and District Magistrate Dhemaji.',
      'Keep 72-hour emergency survival kit packed in waterproof containers.',
      'Charge mobile devices, power banks, and flashlights immediately.',
      'Protect important documents (Aadhaar, land patta, ration cards) in sealed poly-sleeves.',
      'Avoid flooded roads and bridges; never drive or walk through moving flood currents.',
      'Untie domestic cattle and drive them along high-bund paths to elevated shelters.',
      'Follow official evacuation guidance and move to designated relief centers when instructed.'
    ]
  },
  majuli: {
    id: 'majuli',
    district: 'Majuli Island',
    subdivision: 'Central Brahmaputra Basin',
    state: 'Assam',
    coordinates: { lat: 26.9634, lng: 94.2238 },
    stationCode: 'Kherkatia Gauge #02',
    stationName: 'Nematighat - Kamalabari',
    vulnerabilityIndex: 81,
    hazardLevel: 'HIGH',
    levelBadge: 'Level 4',
    statusSummary: 'SEVERE CHANNEL EMBANKMENT THREAT',
    floodProb: 81.2,
    confidence: 91.8,
    peakWindow: '24-48 Hrs',
    peakWindowDesc: 'Braided Surge',
    riverStageDelta: '+1.42m',
    riverStageDesc: 'Over Danger Mark',
    stageAbsolute: 86.82,
    dangerLevel: 85.40,
    riverName: 'Brahmaputra & Subansiri Confluence',
    warningMessage: 'Rising flood risk predicted in Majuli. Kherkatia Suti backwater pressure rising rapidly. Embankment seepage reported at Salmora.',
    asdmaDirective: 'ASDMA DIRECTIVE LEVEL 3: River island ferry services suspended. Evacuation alerts active for low-lying chaporis.',

    inundationAreaKm2: 98.6,
    waterDepthAvgM: 1.25,
    waterDepthPeakM: 2.40,
    affectedNeighborhoods: [
      'Salmora Pottery Village (Riverbank Erosion Zone)',
      'Kamalabari Ghat Lowlands',
      'Garamur Satra Peripheral Chaporis',
      'Jengraimukh Tribal Blocks',
      'Ahotguri Southern Lowlands'
    ],
    inundationPathSummary: 'Brahmaputra swell forcing reverse backflow up Kherkatia Suti channel, overtopping agricultural bunds.',
    populationAtRisk: 168000,
    vulnerableDemographics: {
      childrenUnder5: 21400,
      elderlyOver65: 16800,
      livestockCount: 78000
    },
    infrastructureCounts: {
      hospitals: 2,
      schools: 14,
      roads: 12,
      bridges: 2
    },
    infrastructureList: [
      {
        id: 'inf-m1',
        type: 'hospital',
        name: 'Garamur Sub-Divisional Civil Hospital',
        status: 'Potentially affected',
        riskLevel: 'HIGH',
        distanceFromInundationM: 280,
        coordinates: { x: 310, y: 340, lat: 26.98, lng: 94.25 },
        details: 'Generators positioned on raised plinths. Paramedic boat team ready.',
        capacityOrBeds: '100 Beds'
      },
      {
        id: 'inf-m2',
        type: 'hospital',
        name: 'Kamalabari Model Hospital',
        status: 'Safe / Active Shelter',
        riskLevel: 'MODERATE',
        distanceFromInundationM: 650,
        coordinates: { x: 280, y: 380, lat: 26.95, lng: 94.21 },
        details: 'Operating normally with elevated drainage channels.',
        capacityOrBeds: '40 Beds'
      },
      {
        id: 'inf-ms1',
        type: 'school',
        name: 'Majuli College Higher Secondary Campus',
        status: 'Safe / Active Shelter',
        riskLevel: 'LOW',
        distanceFromInundationM: 1200,
        coordinates: { x: 320, y: 350, lat: 26.97, lng: 94.23 },
        details: 'ASDMA high-bund shelter accommodating 800 people.',
        capacityOrBeds: 'Active Shelter'
      },
      {
        id: 'inf-mr1',
        type: 'road',
        name: 'Kamalabari - Garamur Main Spine Road',
        status: 'Potentially affected',
        riskLevel: 'HIGH',
        distanceFromInundationM: 180,
        coordinates: { x: 290, y: 360, lat: 26.96, lng: 94.22 },
        details: 'Water touching road shoulder; sandbagging active at Km 8.',
        capacityOrBeds: '11.5 km Segment'
      },
      {
        id: 'inf-mb1',
        type: 'bridge',
        name: 'Luit Subansiri Floating Ferry Ramp',
        status: 'Critical inundation zone',
        riskLevel: 'CRITICAL',
        distanceFromInundationM: 0,
        coordinates: { x: 270, y: 390, lat: 26.94, lng: 94.20 },
        details: 'Inundated and closed due to violent river eddies and debris.',
        capacityOrBeds: 'Operations Suspended'
      }
    ],
    rainfall: {
      currentRainfall24hMm: 198,
      expectedRainfall48hMm: 310,
      expectedRainfall72hMm: 395,
      intensity: 'HEAVY',
      trend: 'increasing',
      hourlyTimeline: [
        { hour: '-18h', mm: 12, cumulative: 28 },
        { hour: '-12h', mm: 22, cumulative: 50 },
        { hour: '-6h', mm: 36, cumulative: 86 },
        { hour: 'Now', mm: 42, cumulative: 128 },
        { hour: '+6h', mm: 35, cumulative: 163 },
        { hour: '+12h', mm: 35, cumulative: 198 },
        { hour: '+24h', mm: 48, cumulative: 246 },
        { hour: '+48h', mm: 64, cumulative: 310 },
        { hour: '+72h', mm: 85, cumulative: 395 }
      ],
      stationSource: 'IMD Jorhat Agromet & CWC Nematighat'
    },
    factors: [
      {
        id: 'fm-1',
        name: 'Brahmaputra Main-Stem High Inflow',
        category: 'River Hydrology',
        status: 'CRITICAL',
        contributionPercent: 36,
        direction: 'increased',
        observedValue: '31,200 m³/s (+1.42m over danger)',
        scientificExplanation: 'Combined surge of Subansiri, Dibang, and Lohit funnels into Majuli bottle-neck.'
      },
      {
        id: 'fm-2',
        name: 'Riverbank Soil Erosion & Saturation',
        category: 'Soil',
        status: 'HIGH',
        contributionPercent: 26,
        direction: 'increased',
        observedValue: '93% Volumetric Soil Moisture',
        scientificExplanation: 'Alluvial sandbar deposits become fluid under high hydrostatic pressure, increasing bank slumping.'
      },
      {
        id: 'fm-3',
        name: 'Heavy Monsoonal Precipitation',
        category: 'Rainfall',
        status: 'HIGH',
        contributionPercent: 22,
        direction: 'increased',
        observedValue: '198 mm / 24h',
        scientificExplanation: 'Widespread monsoonal clouds sweeping north across the valley.'
      },
      {
        id: 'fm-4',
        name: 'Flat Sandbar Island Topography',
        category: 'Terrain',
        status: 'HIGH',
        contributionPercent: 16,
        direction: 'increased',
        observedValue: '84m MSL (Low floodplain)',
        scientificExplanation: 'Minimal elevation variance across the island makes bund overtopping rapid and widespread.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 78, riskLevel: 'HIGH', floodProbability: 81.2, rainfallAccumulatedMm: 128, inundationAreaKm2: 62.4, populationAtRisk: 110000, riverStageM: 86.82, inundationOpacity: 0.5 },
      { hour: 6, label: '+6h', riskScore: 81, riskLevel: 'HIGH', floodProbability: 84.0, rainfallAccumulatedMm: 163, inundationAreaKm2: 74.0, populationAtRisk: 132000, riverStageM: 87.05, inundationOpacity: 0.62 },
      { hour: 12, label: '+12h', riskScore: 84, riskLevel: 'HIGH', floodProbability: 87.1, rainfallAccumulatedMm: 198, inundationAreaKm2: 86.5, populationAtRisk: 152000, riverStageM: 87.25, inundationOpacity: 0.72 },
      { hour: 24, label: '+24h', riskScore: 88, riskLevel: 'HIGH', floodProbability: 91.0, rainfallAccumulatedMm: 246, inundationAreaKm2: 98.6, populationAtRisk: 168000, riverStageM: 87.60, inundationOpacity: 0.82 },
      { hour: 48, label: '+48h', riskScore: 82, riskLevel: 'HIGH', floodProbability: 85.0, rainfallAccumulatedMm: 310, inundationAreaKm2: 92.0, populationAtRisk: 145000, riverStageM: 87.10, inundationOpacity: 0.70 },
      { hour: 72, label: '+72h', riskScore: 65, riskLevel: 'MODERATE', floodProbability: 66.0, rainfallAccumulatedMm: 395, inundationAreaKm2: 70.5, populationAtRisk: 95000, riverStageM: 86.20, inundationOpacity: 0.50 }
    ],
    recommendedActions: [
      'Discontinue all non-essential river ferry crossings across Brahmaputra and Subansiri.',
      'Move elderly and young children to elevated concrete Satra buildings and shelters.',
      'Keep boats and local country canoes tethered with extra safety ropes.',
      'Avoid standing near crumbling alluvial riverbanks at Salmora and Kamalabari.',
      'Ensure 3 days of stored drinking water and chlorine treatment tablets.'
    ]
  },
  lakhimpur: {
    id: 'lakhimpur',
    district: 'North Lakhimpur',
    subdivision: 'Upper Assam Foothills',
    state: 'Assam',
    coordinates: { lat: 27.2346, lng: 94.1042 },
    stationCode: 'Subansiri Gauge #01',
    stationName: 'Garamur - Chauldhowa',
    vulnerabilityIndex: 58,
    hazardLevel: 'MODERATE',
    levelBadge: 'Level 3',
    statusSummary: 'MODERATE RUNOFF & SUBANSIRI WATCH',
    floodProb: 64.5,
    confidence: 89.0,
    peakWindow: '36-60 Hrs',
    peakWindowDesc: 'Controlled Outflow',
    riverStageDelta: '+0.45m',
    riverStageDesc: 'Near Warning Threshold',
    stageAbsolute: 112.45,
    dangerLevel: 113.20,
    riverName: 'Subansiri & Ranganadi River',
    warningMessage: 'Subansiri barrage outflow sustained within threshold. Ranganadi monitoring alert active.',
    asdmaDirective: 'ASDMA DIRECTIVE LEVEL 2: Continuous telemetry watch for Subansiri downstream catchments.',

    inundationAreaKm2: 68.4,
    waterDepthAvgM: 0.85,
    waterDepthPeakM: 1.65,
    affectedNeighborhoods: [
      'Nowboicha Revenue Circle Lowlands',
      'Bihpuria Agricultural Basin',
      'Ranganadi Riverbank Villages',
      'Chauldhowa Embankment Zone'
    ],
    inundationPathSummary: 'Ranganadi overflow draining into Nowboicha low-lying agricultural depressions.',
    populationAtRisk: 310000,
    vulnerableDemographics: {
      childrenUnder5: 38500,
      elderlyOver65: 27100,
      livestockCount: 92000
    },
    infrastructureCounts: {
      hospitals: 3,
      schools: 19,
      roads: 15,
      bridges: 4
    },
    infrastructureList: [
      {
        id: 'inf-l1',
        type: 'hospital',
        name: 'Lakhimpur Medical College & Hospital',
        status: 'Operational',
        riskLevel: 'LOW',
        distanceFromInundationM: 1800,
        coordinates: { x: 210, y: 260, lat: 27.24, lng: 94.12 },
        details: 'High ground campus. Emergency flood ward designated.',
        capacityOrBeds: '500 Beds'
      },
      {
        id: 'inf-l2',
        type: 'hospital',
        name: 'Nowboicha Community Health Centre',
        status: 'Potentially affected',
        riskLevel: 'MODERATE',
        distanceFromInundationM: 350,
        coordinates: { x: 180, y: 290, lat: 27.20, lng: 94.08 },
        details: 'Monitoring ground floor flood gates; power backup checked.',
        capacityOrBeds: '40 Beds'
      },
      {
        id: 'inf-lr1',
        type: 'road',
        name: 'NH-15 Chauldhowa - Bihpuria Sector',
        status: 'Operational',
        riskLevel: 'MODERATE',
        distanceFromInundationM: 240,
        coordinates: { x: 190, y: 270, lat: 27.22, lng: 94.09 },
        details: 'Patrolled by SDRF teams; no water logging on paved carriageway.',
        capacityOrBeds: '18.4 km Highway'
      }
    ],
    rainfall: {
      currentRainfall24hMm: 142,
      expectedRainfall48hMm: 210,
      expectedRainfall72hMm: 285,
      intensity: 'HEAVY',
      trend: 'increasing',
      hourlyTimeline: [
        { hour: '-18h', mm: 8, cumulative: 18 },
        { hour: '-12h', mm: 16, cumulative: 34 },
        { hour: '-6h', mm: 28, cumulative: 62 },
        { hour: 'Now', mm: 34, cumulative: 96 },
        { hour: '+6h', mm: 24, cumulative: 120 },
        { hour: '+12h', mm: 22, cumulative: 142 },
        { hour: '+24h', mm: 32, cumulative: 174 },
        { hour: '+48h', mm: 36, cumulative: 210 },
        { hour: '+72h', mm: 75, cumulative: 285 }
      ],
      stationSource: 'IMD Doppler & Ranganadi Hydel Telemetry'
    },
    factors: [
      {
        id: 'fl-1',
        name: 'Moderate Monsoonal Rainfall',
        category: 'Rainfall',
        status: 'MODERATE',
        contributionPercent: 32,
        direction: 'increased',
        observedValue: '142 mm / 24h',
        scientificExplanation: 'Rainfall in upper Subansiri basin generating steady volume.'
      },
      {
        id: 'fl-2',
        name: 'Ranganadi Dam Controlled Discharge',
        category: 'River Hydrology',
        status: 'MODERATE',
        contributionPercent: 28,
        direction: 'neutral',
        observedValue: '19,600 m³/s (Regulated)',
        scientificExplanation: 'Outflow regulated by upstream hydel gates, dampening peak hydrograph crest.'
      },
      {
        id: 'fl-3',
        name: 'Soil Moisture Saturation',
        category: 'Soil',
        status: 'MODERATE',
        contributionPercent: 24,
        direction: 'increased',
        observedValue: '76% Moisture',
        scientificExplanation: 'Piedmont alluvial soil retains some remaining infiltration capacity.'
      },
      {
        id: 'fl-4',
        name: 'Foothill Gradient Drainage',
        category: 'Terrain',
        status: 'LOW',
        contributionPercent: 16,
        direction: 'decreased',
        observedValue: '109m MSL (Slope 1.1%)',
        scientificExplanation: 'Gentle gradient assists gravity runoff into trunk river.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 58, riskLevel: 'MODERATE', floodProbability: 64.5, rainfallAccumulatedMm: 96, inundationAreaKm2: 44.0, populationAtRisk: 195000, riverStageM: 112.45, inundationOpacity: 0.4 },
      { hour: 6, label: '+6h', riskScore: 61, riskLevel: 'MODERATE', floodProbability: 67.2, rainfallAccumulatedMm: 120, inundationAreaKm2: 52.0, populationAtRisk: 230000, riverStageM: 112.65, inundationOpacity: 0.48 },
      { hour: 12, label: '+12h', riskScore: 64, riskLevel: 'MODERATE', floodProbability: 70.0, rainfallAccumulatedMm: 142, inundationAreaKm2: 60.0, populationAtRisk: 275000, riverStageM: 112.85, inundationOpacity: 0.55 },
      { hour: 24, label: '+24h', riskScore: 68, riskLevel: 'MODERATE', floodProbability: 73.5, rainfallAccumulatedMm: 174, inundationAreaKm2: 68.4, populationAtRisk: 310000, riverStageM: 113.10, inundationOpacity: 0.62 },
      { hour: 48, label: '+48h', riskScore: 62, riskLevel: 'MODERATE', floodProbability: 68.0, rainfallAccumulatedMm: 210, inundationAreaKm2: 58.0, populationAtRisk: 260000, riverStageM: 112.70, inundationOpacity: 0.50 },
      { hour: 72, label: '+72h', riskScore: 48, riskLevel: 'MODERATE', floodProbability: 51.0, rainfallAccumulatedMm: 285, inundationAreaKm2: 42.0, populationAtRisk: 170000, riverStageM: 111.90, inundationOpacity: 0.35 }
    ],
    recommendedActions: [
      'Maintain continuous watch on Ranganadi and Subansiri river stage alerts.',
      'Check culverts and drainage channels in Nowboicha and Bihpuria.',
      'Prepare family emergency grab-bags with food, flashlight, and medicine.',
      'Farmers should avoid low-lying river islands with cattle during evening hours.'
    ]
  },
  dibrugarh: {
    id: 'dibrugarh',
    district: 'Dibrugarh',
    subdivision: 'South Bank Brahmaputra',
    state: 'Assam',
    coordinates: { lat: 27.4728, lng: 94.912 },
    stationCode: 'Brahmaputra Gauge #08',
    stationName: 'Dibrugarh Town Protection (DTP)',
    vulnerabilityIndex: 46,
    hazardLevel: 'MODERATE',
    levelBadge: 'Level 2',
    statusSummary: 'CONTROLLED DRAINAGE INUNDATION',
    floodProb: 48.0,
    confidence: 94.2,
    peakWindow: '48-72 Hrs',
    peakWindowDesc: 'Stable Channel',
    riverStageDelta: '-0.30m',
    riverStageDesc: 'Below Danger Level',
    stageAbsolute: 105.40,
    dangerLevel: 105.70,
    riverName: 'Brahmaputra Main Stem',
    warningMessage: 'Main Brahmaputra channel embankment fortified. Urban drain sluices operational at Maijan.',
    asdmaDirective: 'ASDMA DIRECTIVE LEVEL 1: Standard monsoon urban drainage watch active.',

    inundationAreaKm2: 38.5,
    waterDepthAvgM: 0.45,
    waterDepthPeakM: 1.10,
    affectedNeighborhoods: [
      'Maijan Tea Estate Low Drain Basin',
      'Dibrugarh Town Drain Culverts (Water Logging)',
      'Mornoi Floodplain Agricultural Strip'
    ],
    inundationPathSummary: 'Localized stormwater ponding in low urban hollows due to high Brahmaputra outfall head.',
    populationAtRisk: 140000,
    vulnerableDemographics: {
      childrenUnder5: 14200,
      elderlyOver65: 12900,
      livestockCount: 22000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 8,
      roads: 6,
      bridges: 1
    },
    infrastructureList: [
      {
        id: 'inf-d1',
        type: 'hospital',
        name: 'Assam Medical College & Hospital (AMCH)',
        status: 'Operational',
        riskLevel: 'LOW',
        distanceFromInundationM: 2400,
        coordinates: { x: 520, y: 190, lat: 27.46, lng: 94.92 },
        details: 'Premier regional tertiary medical center. Fully operational and elevated.',
        capacityOrBeds: '1,200 Beds'
      }
    ],
    rainfall: {
      currentRainfall24hMm: 95,
      expectedRainfall48hMm: 140,
      expectedRainfall72hMm: 190,
      intensity: 'MODERATE',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 6, cumulative: 12 },
        { hour: '-12h', mm: 12, cumulative: 24 },
        { hour: '-6h', mm: 18, cumulative: 42 },
        { hour: 'Now', mm: 20, cumulative: 62 },
        { hour: '+6h', mm: 16, cumulative: 78 },
        { hour: '+12h', mm: 17, cumulative: 95 },
        { hour: '+24h', mm: 22, cumulative: 117 },
        { hour: '+48h', mm: 23, cumulative: 140 },
        { hour: '+72h', mm: 50, cumulative: 190 }
      ],
      stationSource: 'IMD Mohanbari Aerodrome Doppler'
    },
    factors: [
      {
        id: 'fd-1',
        name: 'DTP Revetment Dyke Fortification',
        category: 'Terrain',
        status: 'LOW',
        contributionPercent: 38,
        direction: 'decreased',
        observedValue: '106m MSL + Geobag Revetment',
        scientificExplanation: 'Reinforced town protection dyke shields major urban core from main channel erosion.'
      },
      {
        id: 'fd-2',
        name: 'Moderate Monsoon Rain',
        category: 'Rainfall',
        status: 'MODERATE',
        contributionPercent: 30,
        direction: 'neutral',
        observedValue: '95 mm / 24h',
        scientificExplanation: 'Precipitation handled by heavy-duty sluice pumps discharging into Brahmaputra.'
      },
      {
        id: 'fd-3',
        name: 'River Stage Below Danger',
        category: 'River Hydrology',
        status: 'LOW',
        contributionPercent: 20,
        direction: 'decreased',
        observedValue: '105.40m (-0.30m below danger)',
        scientificExplanation: 'Water surface maintains 30cm clearance below critical threshold.'
      },
      {
        id: 'fd-4',
        name: 'Moderate Soil Saturation',
        category: 'Soil',
        status: 'MODERATE',
        contributionPercent: 12,
        direction: 'neutral',
        observedValue: '68% Saturation',
        scientificExplanation: 'Normal seasonal monsoonal soil moisture.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 46, riskLevel: 'MODERATE', floodProbability: 48.0, rainfallAccumulatedMm: 62, inundationAreaKm2: 24.0, populationAtRisk: 85000, riverStageM: 105.40, inundationOpacity: 0.3 },
      { hour: 6, label: '+6h', riskScore: 48, riskLevel: 'MODERATE', floodProbability: 50.5, rainfallAccumulatedMm: 78, inundationAreaKm2: 28.0, populationAtRisk: 105000, riverStageM: 105.50, inundationOpacity: 0.35 },
      { hour: 12, label: '+12h', riskScore: 50, riskLevel: 'MODERATE', floodProbability: 52.0, rainfallAccumulatedMm: 95, inundationAreaKm2: 32.5, populationAtRisk: 120000, riverStageM: 105.58, inundationOpacity: 0.4 },
      { hour: 24, label: '+24h', riskScore: 52, riskLevel: 'MODERATE', floodProbability: 54.2, rainfallAccumulatedMm: 117, inundationAreaKm2: 38.5, populationAtRisk: 140000, riverStageM: 105.65, inundationOpacity: 0.45 },
      { hour: 48, label: '+48h', riskScore: 45, riskLevel: 'MODERATE', floodProbability: 46.0, rainfallAccumulatedMm: 140, inundationAreaKm2: 30.0, populationAtRisk: 100000, riverStageM: 105.35, inundationOpacity: 0.35 },
      { hour: 72, label: '+72h', riskScore: 36, riskLevel: 'LOW', floodProbability: 38.0, rainfallAccumulatedMm: 190, inundationAreaKm2: 20.0, populationAtRisk: 65000, riverStageM: 104.90, inundationOpacity: 0.25 }
    ],
    recommendedActions: [
      'Keep urban storm-drainage inlets and culverts free from plastic waste.',
      'Check local water supplies; boil drinking water as precautionary measure.',
      'Monitor DDMA Dibrugarh announcements on local FM and social channels.'
    ]
  },
  tinsukia: {
    id: 'tinsukia',
    district: 'Tinsukia',
    subdivision: 'Far East Assam',
    state: 'Assam',
    coordinates: { lat: 27.4922, lng: 95.3468 },
    stationCode: 'Lohit Gauge #01',
    stationName: 'Dhola-Sadiya Reach',
    vulnerabilityIndex: 22,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 21.5,
    confidence: 96.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-1.40m',
    riverStageDesc: 'Well Below Danger',
    stageAbsolute: 118.20,
    dangerLevel: 119.60,
    riverName: 'Lohit & Dibang Rivers',
    warningMessage: 'Lohit confluence levels holding comfortably under danger mark. Embankments stable.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 14.2,
    waterDepthAvgM: 0.25,
    waterDepthPeakM: 0.65,
    affectedNeighborhoods: ['Dhola Sadiya Peripheral Sandbanks'],
    inundationPathSummary: 'Seasonal braided sandbar flooding confined within active river course.',
    populationAtRisk: 45000,
    vulnerableDemographics: {
      childrenUnder5: 4600,
      elderlyOver65: 3900,
      livestockCount: 8500
    },
    infrastructureCounts: {
      hospitals: 0,
      schools: 2,
      roads: 3,
      bridges: 1
    },
    infrastructureList: [
      {
        id: 'inf-t1',
        type: 'bridge',
        name: 'Dhola - Sadiya Bridge (Bhupen Hazarika Setu)',
        status: 'Operational',
        riskLevel: 'LOW',
        distanceFromInundationM: 850,
        coordinates: { x: 620, y: 150, lat: 27.58, lng: 95.66 },
        details: 'High-clearance bridge span unaffected by current stage levels.',
        capacityOrBeds: 'Clear Corridor'
      }
    ],
    rainfall: {
      currentRainfall24hMm: 58,
      expectedRainfall48hMm: 92,
      expectedRainfall72hMm: 135,
      intensity: 'MODERATE',
      trend: 'decreasing',
      hourlyTimeline: [
        { hour: '-18h', mm: 4, cumulative: 8 },
        { hour: '-12h', mm: 8, cumulative: 16 },
        { hour: '-6h', mm: 12, cumulative: 28 },
        { hour: 'Now', mm: 10, cumulative: 38 },
        { hour: '+6h', mm: 10, cumulative: 48 },
        { hour: '+12h', mm: 10, cumulative: 58 },
        { hour: '+24h', mm: 15, cumulative: 73 },
        { hour: '+48h', mm: 19, cumulative: 92 },
        { hour: '+72h', mm: 43, cumulative: 135 }
      ],
      stationSource: 'IMD Digboi / Tinsukia Weather Station'
    },
    factors: [
      {
        id: 'ft-1',
        name: 'Elevated Alluvial Shelf',
        category: 'Terrain',
        status: 'LOW',
        contributionPercent: 44,
        direction: 'decreased',
        observedValue: '124m MSL',
        scientificExplanation: 'High natural elevation protects settlement cores from inundation.'
      },
      {
        id: 'ft-2',
        name: 'Low River Stage Level',
        category: 'River Hydrology',
        status: 'LOW',
        contributionPercent: 32,
        direction: 'decreased',
        observedValue: '-1.40m Below Danger Mark',
        scientificExplanation: 'Deep wide braided river channel easily conveys upstream Himalayan runoff.'
      },
      {
        id: 'ft-3',
        name: 'Light Monsoonal Rainfall',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 24,
        direction: 'decreased',
        observedValue: '58 mm / 24h (Light)',
        scientificExplanation: 'Precipitation well within natural infiltration and drainage limits.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 22, riskLevel: 'LOW', floodProbability: 21.5, rainfallAccumulatedMm: 38, inundationAreaKm2: 8.0, populationAtRisk: 22000, riverStageM: 118.20, inundationOpacity: 0.15 },
      { hour: 6, label: '+6h', riskScore: 23, riskLevel: 'LOW', floodProbability: 22.0, rainfallAccumulatedMm: 48, inundationAreaKm2: 9.5, populationAtRisk: 28000, riverStageM: 118.25, inundationOpacity: 0.18 },
      { hour: 12, label: '+12h', riskScore: 24, riskLevel: 'LOW', floodProbability: 23.5, rainfallAccumulatedMm: 58, inundationAreaKm2: 11.0, populationAtRisk: 34000, riverStageM: 118.30, inundationOpacity: 0.20 },
      { hour: 24, label: '+24h', riskScore: 26, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 73, inundationAreaKm2: 14.2, populationAtRisk: 45000, riverStageM: 118.40, inundationOpacity: 0.22 },
      { hour: 48, label: '+48h', riskScore: 21, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 92, inundationAreaKm2: 10.0, populationAtRisk: 25000, riverStageM: 118.15, inundationOpacity: 0.16 },
      { hour: 72, label: '+72h', riskScore: 18, riskLevel: 'LOW', floodProbability: 16.0, rainfallAccumulatedMm: 135, inundationAreaKm2: 7.0, populationAtRisk: 18000, riverStageM: 117.90, inundationOpacity: 0.12 }
    ],
    recommendedActions: [
      'Normal activities permitted.',
      'Maintain routine seasonal preparedness and awareness.'
    ]
  },
  barpeta: {
    id: 'barpeta',
    district: 'Barpeta',
    subdivision: 'Lower Assam Valley',
    state: 'Assam',
    coordinates: { lat: 26.3216, lng: 91.0044 },
    stationCode: 'Beki Gauge #03',
    stationName: 'Barpeta Road Sluice',
    vulnerabilityIndex: 18,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'NORMAL CHANNEL VELOCITY',
    floodProb: 17.2,
    confidence: 95.1,
    peakWindow: '>72 Hrs',
    peakWindowDesc: 'Buffer Safe',
    riverStageDelta: '-1.80m',
    riverStageDesc: 'Safe Mark',
    stageAbsolute: 42.10,
    dangerLevel: 43.90,
    riverName: 'Beki & Manas River',
    warningMessage: 'Beki river flood gates regulated; Manas runoff safely conveyed to Brahmaputra trunk.',
    asdmaDirective: 'ASDMA BASELINE: Normal telemetry advisory.',

    inundationAreaKm2: 11.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Beki Riverbed Sandbanks'],
    inundationPathSummary: 'Confined flow within existing dyke and floodway structures.',
    populationAtRisk: 25000,
    vulnerableDemographics: { childrenUnder5: 2500, elderlyOver65: 2100, livestockCount: 5400 },
    infrastructureCounts: { hospitals: 0, schools: 1, roads: 2, bridges: 0 },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 42,
      expectedRainfall48hMm: 75,
      expectedRainfall72hMm: 110,
      intensity: 'MODERATE',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 3, cumulative: 6 },
        { hour: '-12h', mm: 6, cumulative: 12 },
        { hour: '-6h', mm: 8, cumulative: 20 },
        { hour: 'Now', mm: 8, cumulative: 28 },
        { hour: '+6h', mm: 7, cumulative: 35 },
        { hour: '+12h', mm: 7, cumulative: 42 },
        { hour: '+24h', mm: 12, cumulative: 54 },
        { hour: '+48h', mm: 21, cumulative: 75 },
        { hour: '+72h', mm: 35, cumulative: 110 }
      ],
      stationSource: 'IMD Barpeta Road Stn'
    },
    factors: [
      { id: 'fb-1', name: 'Low River Stage Level', category: 'River Hydrology', status: 'LOW', contributionPercent: 50, direction: 'decreased', observedValue: '-1.80m Below Danger', scientificExplanation: 'Substantial buffer capacity in Manas-Beki delta.' },
      { id: 'fb-2', name: 'Light Rainfall', category: 'Rainfall', status: 'LOW', contributionPercent: 35, direction: 'decreased', observedValue: '42 mm / 24h', scientificExplanation: 'Monsoonal rainfall well below flood triggering thresholds.' },
      { id: 'fb-3', name: 'Regulated Sluice Gates', category: 'Terrain', status: 'LOW', contributionPercent: 15, direction: 'decreased', observedValue: 'Controlled Gate Apertures', scientificExplanation: 'Sluice gates operating at nominal discharge capacity.' }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 18, riskLevel: 'LOW', floodProbability: 17.2, rainfallAccumulatedMm: 28, inundationAreaKm2: 6.0, populationAtRisk: 14000, riverStageM: 42.10, inundationOpacity: 0.12 },
      { hour: 6, label: '+6h', riskScore: 19, riskLevel: 'LOW', floodProbability: 18.0, rainfallAccumulatedMm: 35, inundationAreaKm2: 7.5, populationAtRisk: 17000, riverStageM: 42.15, inundationOpacity: 0.14 },
      { hour: 12, label: '+12h', riskScore: 20, riskLevel: 'LOW', floodProbability: 19.5, rainfallAccumulatedMm: 42, inundationAreaKm2: 9.0, populationAtRisk: 21000, riverStageM: 42.22, inundationOpacity: 0.16 },
      { hour: 24, label: '+24h', riskScore: 22, riskLevel: 'LOW', floodProbability: 21.0, rainfallAccumulatedMm: 54, inundationAreaKm2: 11.5, populationAtRisk: 25000, riverStageM: 42.30, inundationOpacity: 0.18 },
      { hour: 48, label: '+48h', riskScore: 18, riskLevel: 'LOW', floodProbability: 17.0, rainfallAccumulatedMm: 75, inundationAreaKm2: 8.5, populationAtRisk: 18000, riverStageM: 42.10, inundationOpacity: 0.14 },
      { hour: 72, label: '+72h', riskScore: 15, riskLevel: 'LOW', floodProbability: 14.0, rainfallAccumulatedMm: 110, inundationAreaKm2: 5.0, populationAtRisk: 11000, riverStageM: 41.90, inundationOpacity: 0.10 }
    ],
    recommendedActions: ['Normal conditions prevailing. Monitor periodic ASDMA bulletins.']
  },
  cachar: {
    id: 'cachar',
    district: 'Cachar (Silchar)',
    subdivision: 'Barak Valley Catchment',
    state: 'Assam',
    coordinates: { lat: 24.8333, lng: 92.7789 },
    stationCode: 'Barak Gauge #05',
    stationName: 'Silchar Annapurna Ghat',
    vulnerabilityIndex: 19,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BARAK BASIN EQUILIBRIUM',
    floodProb: 18.0,
    confidence: 94.8,
    peakWindow: '>72 Hrs',
    peakWindowDesc: 'Normal Flow',
    riverStageDelta: '-2.10m',
    riverStageDesc: 'Below Danger Mark',
    stageAbsolute: 17.75,
    dangerLevel: 19.85,
    riverName: 'Barak River',
    warningMessage: 'Barak river stage normal. Bethukandi dyke sluices operating with uninhibited drainage.',
    asdmaDirective: 'ASDMA BASELINE: Normal operational mode.',

    inundationAreaKm2: 9.8,
    waterDepthAvgM: 0.15,
    waterDepthPeakM: 0.40,
    affectedNeighborhoods: ['Barak Riparian Sandbanks'],
    inundationPathSummary: 'No active overtopping; flow contained within embankments.',
    populationAtRisk: 30000,
    vulnerableDemographics: { childrenUnder5: 3100, elderlyOver65: 2700, livestockCount: 6200 },
    infrastructureCounts: { hospitals: 0, schools: 1, roads: 1, bridges: 0 },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 35,
      expectedRainfall48hMm: 65,
      expectedRainfall72hMm: 95,
      intensity: 'MODERATE',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 7, cumulative: 17 },
        { hour: 'Now', mm: 6, cumulative: 23 },
        { hour: '+6h', mm: 6, cumulative: 29 },
        { hour: '+12h', mm: 6, cumulative: 35 },
        { hour: '+24h', mm: 11, cumulative: 46 },
        { hour: '+48h', mm: 19, cumulative: 65 },
        { hour: '+72h', mm: 30, cumulative: 95 }
      ],
      stationSource: 'IMD Silchar Kumbhirgram'
    },
    factors: [
      { id: 'fc-1', name: 'Barak Stage Well Below Danger', category: 'River Hydrology', status: 'LOW', contributionPercent: 55, direction: 'decreased', observedValue: '17.75m (-2.10m below danger)', scientificExplanation: 'Barak basin has ample freeboard at Annapurna Ghat.' },
      { id: 'fc-2', name: 'Bethukandi Sluice Operational', category: 'Terrain', status: 'LOW', contributionPercent: 30, direction: 'decreased', observedValue: 'Dyke Reinforcement Intact', scientificExplanation: 'Reinforced dyke and automated sluice gates safeguard Silchar city.' },
      { id: 'fc-3', name: 'Light Catchment Rainfall', category: 'Rainfall', status: 'LOW', contributionPercent: 15, direction: 'decreased', observedValue: '35 mm / 24h', scientificExplanation: 'Rainfall easily absorbed by local tributaries.' }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 19, riskLevel: 'LOW', floodProbability: 18.0, rainfallAccumulatedMm: 23, inundationAreaKm2: 5.0, populationAtRisk: 16000, riverStageM: 17.75, inundationOpacity: 0.12 },
      { hour: 6, label: '+6h', riskScore: 20, riskLevel: 'LOW', floodProbability: 18.8, rainfallAccumulatedMm: 29, inundationAreaKm2: 6.2, populationAtRisk: 20000, riverStageM: 17.80, inundationOpacity: 0.14 },
      { hour: 12, label: '+12h', riskScore: 21, riskLevel: 'LOW', floodProbability: 19.5, rainfallAccumulatedMm: 35, inundationAreaKm2: 7.5, populationAtRisk: 24000, riverStageM: 17.85, inundationOpacity: 0.15 },
      { hour: 24, label: '+24h', riskScore: 23, riskLevel: 'LOW', floodProbability: 21.0, rainfallAccumulatedMm: 46, inundationAreaKm2: 9.8, populationAtRisk: 30000, riverStageM: 17.95, inundationOpacity: 0.18 },
      { hour: 48, label: '+48h', riskScore: 19, riskLevel: 'LOW', floodProbability: 17.5, rainfallAccumulatedMm: 65, inundationAreaKm2: 7.0, populationAtRisk: 21000, riverStageM: 17.75, inundationOpacity: 0.14 },
      { hour: 72, label: '+72h', riskScore: 16, riskLevel: 'LOW', floodProbability: 14.5, rainfallAccumulatedMm: 95, inundationAreaKm2: 4.5, populationAtRisk: 14000, riverStageM: 17.55, inundationOpacity: 0.10 }
    ],
    recommendedActions: ['Conditions safe. Standard monsoon surveillance.']
  }
  ,

  "baksa": {
    id: 'baksa',
    district: 'Baksa',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Baksa River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "bajali": {
    id: 'bajali',
    district: 'Bajali',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Bajali River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "biswanath": {
    id: 'biswanath',
    district: 'Biswanath',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Biswanath River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "bongaigaon": {
    id: 'bongaigaon',
    district: 'Bongaigaon',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Bongaigaon River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "charaideo": {
    id: 'charaideo',
    district: 'Charaideo',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Charaideo River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "chirang": {
    id: 'chirang',
    district: 'Chirang',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Chirang River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "darrang": {
    id: 'darrang',
    district: 'Darrang',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Darrang River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "dhubri": {
    id: 'dhubri',
    district: 'Dhubri',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Dhubri River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "dimahasao": {
    id: 'dimahasao',
    district: 'Dima Hasao',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Dima Hasao River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "goalpara": {
    id: 'goalpara',
    district: 'Goalpara',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Goalpara River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "golaghat": {
    id: 'golaghat',
    district: 'Golaghat',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Golaghat River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "hailakandi": {
    id: 'hailakandi',
    district: 'Hailakandi',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Hailakandi River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "hojai": {
    id: 'hojai',
    district: 'Hojai',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Hojai River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "jorhat": {
    id: 'jorhat',
    district: 'Jorhat',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Jorhat River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "kamrup": {
    id: 'kamrup',
    district: 'Kamrup',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Kamrup River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "kamrupmetropolitan": {
    id: 'kamrupmetropolitan',
    district: 'Kamrup Metropolitan',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Kamrup Metropolitan River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "karbianglong": {
    id: 'karbianglong',
    district: 'Karbi Anglong',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Karbi Anglong River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "karimganj": {
    id: 'karimganj',
    district: 'Karimganj',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Karimganj River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "kokrajhar": {
    id: 'kokrajhar',
    district: 'Kokrajhar',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Kokrajhar River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "morigaon": {
    id: 'morigaon',
    district: 'Morigaon',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Morigaon River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "nagaon": {
    id: 'nagaon',
    district: 'Nagaon',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Nagaon River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "nalbari": {
    id: 'nalbari',
    district: 'Nalbari',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Nalbari River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "sivasagar": {
    id: 'sivasagar',
    district: 'Sivasagar',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Sivasagar River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "sonitpur": {
    id: 'sonitpur',
    district: 'Sonitpur',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Sonitpur River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "southsalmara-mankachar": {
    id: 'southsalmara-mankachar',
    district: 'South Salmara-Mankachar',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'South Salmara-Mankachar River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "tamulpur": {
    id: 'tamulpur',
    district: 'Tamulpur',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Tamulpur River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "udalguri": {
    id: 'udalguri',
    district: 'Udalguri',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'Udalguri River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },

  "westkarbianglong": {
    id: 'westkarbianglong',
    district: 'West Karbi Anglong',
    subdivision: 'Assam District',
    state: 'Assam',
    coordinates: { lat: 26.2, lng: 92.9 },
    stationCode: 'CWC Station',
    stationName: 'West Karbi Anglong River Reach',
    vulnerabilityIndex: 35,
    hazardLevel: 'LOW',
    levelBadge: 'Level 1',
    statusSummary: 'BASELINE SEASONAL RUNOFF',
    floodProb: 25.0,
    confidence: 88.0,
    peakWindow: 'Normal',
    peakWindowDesc: 'Equilibrium',
    riverStageDelta: '-0.80m',
    riverStageDesc: 'Below Danger',
    stageAbsolute: 55.20,
    dangerLevel: 56.00,
    riverName: 'Local Tributary',
    warningMessage: 'Normal river stages for this season. Embankments hold firm.',
    asdmaDirective: 'ASDMA BASELINE: Normal hydrologic monitoring.',

    inundationAreaKm2: 12.5,
    waterDepthAvgM: 0.20,
    waterDepthPeakM: 0.50,
    affectedNeighborhoods: ['Low-lying areas near riverbanks'],
    inundationPathSummary: 'Seasonal river swell confined to natural channels.',
    populationAtRisk: 25000,
    vulnerableDemographics: {
      childrenUnder5: 2500,
      elderlyOver65: 1800,
      livestockCount: 5000
    },
    infrastructureCounts: {
      hospitals: 1,
      schools: 5,
      roads: 4,
      bridges: 1
    },
    infrastructureList: [],
    rainfall: {
      currentRainfall24hMm: 25,
      expectedRainfall48hMm: 45,
      expectedRainfall72hMm: 65,
      intensity: 'LIGHT',
      trend: 'steady',
      hourlyTimeline: [
        { hour: '-18h', mm: 2, cumulative: 5 },
        { hour: '-12h', mm: 5, cumulative: 10 },
        { hour: '-6h', mm: 8, cumulative: 18 },
        { hour: 'Now', mm: 7, cumulative: 25 },
        { hour: '+6h', mm: 6, cumulative: 31 },
        { hour: '+12h', mm: 5, cumulative: 36 },
        { hour: '+24h', mm: 9, cumulative: 45 },
        { hour: '+48h', mm: 12, cumulative: 57 },
        { hour: '+72h', mm: 8, cumulative: 65 }
      ],
      stationSource: 'IMD Station'
    },
    factors: [
      {
        id: 'f-base-1',
        name: 'Normal Monsoon Rain',
        category: 'Rainfall',
        status: 'LOW',
        contributionPercent: 40,
        direction: 'neutral',
        observedValue: '25 mm / 24h',
        scientificExplanation: 'Regular seasonal precipitation patterns.'
      }
    ],
    timeline: [
      { hour: 0, label: 'Now (+0h)', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 25, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 6, label: '+6h', riskScore: 36, riskLevel: 'LOW', floodProbability: 26.0, rainfallAccumulatedMm: 31, inundationAreaKm2: 13.0, populationAtRisk: 26000, riverStageM: 55.25, inundationOpacity: 0.2 },
      { hour: 12, label: '+12h', riskScore: 37, riskLevel: 'LOW', floodProbability: 27.0, rainfallAccumulatedMm: 36, inundationAreaKm2: 13.5, populationAtRisk: 27000, riverStageM: 55.30, inundationOpacity: 0.25 },
      { hour: 24, label: '+24h', riskScore: 38, riskLevel: 'LOW', floodProbability: 28.0, rainfallAccumulatedMm: 45, inundationAreaKm2: 14.0, populationAtRisk: 28000, riverStageM: 55.35, inundationOpacity: 0.25 },
      { hour: 48, label: '+48h', riskScore: 35, riskLevel: 'LOW', floodProbability: 25.0, rainfallAccumulatedMm: 57, inundationAreaKm2: 12.5, populationAtRisk: 25000, riverStageM: 55.20, inundationOpacity: 0.2 },
      { hour: 72, label: '+72h', riskScore: 30, riskLevel: 'LOW', floodProbability: 20.0, rainfallAccumulatedMm: 65, inundationAreaKm2: 10.0, populationAtRisk: 20000, riverStageM: 54.80, inundationOpacity: 0.15 }
    ],
    recommendedActions: [
      'Maintain standard situational awareness.',
      'Check local weather updates daily.'
    ]
  },
};

export const CWC_GAUGE_STATIONS: GaugeStation[] = [
  { id: 'cwc-01', name: 'Jiadhal Gauge #04 (Dhemaji)', river: 'Jiadhal', currentStage: 104.85, dangerLevel: 103.00, highestFloodLevel: 105.10, trend: 'rising', discharge: 28400, stationCode: 'AS-CWC-04', coordinates: { lat: 27.4812, lng: 94.5822 } },
  { id: 'cwc-02', name: 'Nematighat (Majuli/Jorhat)', river: 'Brahmaputra', currentStage: 86.82, dangerLevel: 85.40, highestFloodLevel: 87.37, trend: 'rising', discharge: 31200, stationCode: 'AS-CWC-02', coordinates: { lat: 26.9634, lng: 94.2238 } },
  { id: 'cwc-03', name: 'Garamur Subansiri (Lakhimpur)', river: 'Subansiri', currentStage: 112.45, dangerLevel: 113.20, highestFloodLevel: 114.60, trend: 'rising', discharge: 19600, stationCode: 'AS-CWC-01', coordinates: { lat: 27.2346, lng: 94.1042 } },
  { id: 'cwc-04', name: 'Dibrugarh DTP Gauge', river: 'Brahmaputra', currentStage: 105.40, dangerLevel: 105.70, highestFloodLevel: 106.48, trend: 'steady', discharge: 22100, stationCode: 'AS-CWC-08', coordinates: { lat: 27.4728, lng: 94.912 } },
  { id: 'cwc-05', name: 'Dhola Lohit Confluence (Tinsukia)', river: 'Lohit', currentStage: 118.20, dangerLevel: 119.60, highestFloodLevel: 120.90, trend: 'falling', discharge: 14200, stationCode: 'AS-CWC-09', coordinates: { lat: 27.4922, lng: 95.3468 } },
  { id: 'cwc-06', name: 'Tezpur Gauge Station (Sonitpur)', river: 'Brahmaputra', currentStage: 65.10, dangerLevel: 65.23, highestFloodLevel: 66.02, trend: 'steady', discharge: 27800, stationCode: 'AS-CWC-06', coordinates: { lat: 26.6528, lng: 92.7926 } },
  { id: 'cwc-07', name: 'Pandu Guwahati (Kamrup Metro)', river: 'Brahmaputra', currentStage: 49.30, dangerLevel: 49.68, highestFloodLevel: 51.46, trend: 'rising', discharge: 34500, stationCode: 'AS-CWC-07', coordinates: { lat: 26.1788, lng: 91.7011 } },
  { id: 'cwc-08', name: 'Barpeta Road Sluice (Barpeta)', river: 'Beki', currentStage: 42.10, dangerLevel: 43.90, highestFloodLevel: 45.20, trend: 'falling', discharge: 11400, stationCode: 'AS-CWC-03', coordinates: { lat: 26.3216, lng: 91.0044 } },
  { id: 'cwc-09', name: 'Goalpara Steamer Ghat', river: 'Brahmaputra', currentStage: 35.80, dangerLevel: 36.27, highestFloodLevel: 37.43, trend: 'rising', discharge: 38200, stationCode: 'AS-CWC-11', coordinates: { lat: 26.1743, lng: 90.6247 } },
  { id: 'cwc-10', name: 'Silchar Annapurna Ghat (Cachar)', river: 'Barak', currentStage: 17.75, dangerLevel: 19.85, highestFloodLevel: 21.98, trend: 'steady', discharge: 8900, stationCode: 'AS-CWC-05', coordinates: { lat: 24.8333, lng: 92.7789 } }
];

export const RELIEF_CAMPS: ReliefCamp[] = [
  {
    id: 'rc-01',
    name: 'Dhemaji Higher Secondary School Relief Shelter',
    district: 'Dhemaji',
    location: 'Ward No. 3, Dhemaji Town',
    coordinates: '27.4831° N, 94.5867° E',
    capacity: 1200,
    currentOccupancy: 420,
    elevatedMsl: 108.5,
    contactOfficer: 'Dr. J. Dutta (Circle Officer)',
    phone: '03753-224222',
    hasMedicalPost: true,
    hasCleanWater: true,
    hasCattleShelter: true,
    distanceKm: 2.1
  },
  {
    id: 'rc-02',
    name: 'Moridhal College Multi-Purpose Cyclone/Flood Shelter',
    district: 'Dhemaji',
    location: 'Moridhal, NH-15 Bypass',
    coordinates: '27.5020° N, 94.6110° E',
    capacity: 2500,
    currentOccupancy: 860,
    elevatedMsl: 111.0,
    contactOfficer: 'Sri P. Gogoi (Relief Supt.)',
    phone: '03753-224280',
    hasMedicalPost: true,
    hasCleanWater: true,
    hasCattleShelter: true,
    distanceKm: 4.8
  },
  {
    id: 'rc-03',
    name: 'Gogamukh High School High-Bund Center',
    district: 'Dhemaji',
    location: 'Gogamukh Sub-division',
    coordinates: '27.4431° N, 94.4920° E',
    capacity: 1800,
    currentOccupancy: 310,
    elevatedMsl: 109.2,
    contactOfficer: 'Smt. K. Borah (Block Officer)',
    phone: '03753-224310',
    hasMedicalPost: true,
    hasCleanWater: true,
    hasCattleShelter: true,
    distanceKm: 8.5
  },
  {
    id: 'rc-04',
    name: 'Machkhowa Rural Elevated Community Hall',
    district: 'Dhemaji',
    location: 'Machkhowa Block, South Dhemaji',
    coordinates: '27.3912° N, 94.6210° E',
    capacity: 950,
    currentOccupancy: 180,
    elevatedMsl: 107.0,
    contactOfficer: 'Sri T. Saikia (DDMA Inspector)',
    phone: '03753-224401',
    hasMedicalPost: false,
    hasCleanWater: true,
    hasCattleShelter: true,
    distanceKm: 12.4
  }
];

export const ACTIVE_FLOOD_ALERTS: FloodAlert[] = [
  {
    id: 'alt-01',
    location: 'Dhemaji District',
    district: 'Dhemaji',
    riskLevel: 'CRITICAL',
    score: 91,
    timestamp: '14 min ago',
    headline: 'Severe Flood Inundation Predicted in Dhemaji Catchment',
    summary: 'Jiadhal River overtopping right bank embankment at Batgharia with discharge exceeding 28,400 m³/s. Water spreading south-west across NH-15 culverts.',
    populationAtRisk: 686000,
    recommendedAction: 'Follow official evacuation guidance immediately. Move to designated high-bund relief shelters and untie domestic livestock.',
    issuedBy: 'ASDMA State Emergency Operations Centre (SEOC) & DDMA Dhemaji',
    category: 'Critical'
  },
  {
    id: 'alt-02',
    location: 'Majuli Island',
    district: 'Majuli',
    riskLevel: 'HIGH',
    score: 84,
    timestamp: '32 min ago',
    headline: 'Rising Flood Risk & Backwater Pressure on Majuli Island',
    summary: 'Kherkatia Suti reverse backflow threatening Kamalabari and Salmora sandbars. Ferry services suspended across Brahmaputra.',
    populationAtRisk: 168000,
    recommendedAction: 'Move to elevated multi-purpose cyclone/flood shelters. Cease all private boat navigation on braided channels.',
    issuedBy: 'DDMA Majuli & Inland Waterways Authority (IWAI)',
    category: 'High'
  },
  {
    id: 'alt-03',
    location: 'North Lakhimpur Lowlands',
    district: 'Lakhimpur',
    riskLevel: 'MODERATE',
    score: 64,
    timestamp: '1 hour ago',
    headline: 'Subansiri & Ranganadi Hydrologic Watch Advisory',
    summary: 'Subansiri stage near warning threshold. Outflow from upstream hydro project closely regulated. Minor inundation in Nowboicha farm depressions.',
    populationAtRisk: 310000,
    recommendedAction: 'Keep emergency grab-bags ready. Avoid tethering cattle in riverbed lowlands during evening runoff surge.',
    issuedBy: 'DDMA North Lakhimpur Disaster Cell',
    category: 'Moderate'
  },
  {
    id: 'alt-04',
    location: 'Barpeta Beki Basin',
    district: 'Barpeta',
    riskLevel: 'RESOLVED',
    score: 18,
    timestamp: '3 hours ago',
    headline: 'Beki River Sluice Operations Stabilized — Inundation Receded',
    summary: 'Water level at Barpeta Road sluice dropped 45cm below warning mark. Highway NH-27 traffic moving normally.',
    populationAtRisk: 0,
    recommendedAction: 'Standard seasonal vigilance maintained. Disinfection of flooded wells underway by Public Health Dept.',
    issuedBy: 'District Disaster Management Authority Barpeta',
    category: 'Resolved'
  }
];

export const HISTORICAL_DATA: HistoricalYearRecord[] = [
  {
    year: 2025,
    monsoonRainfallMm: 1890,
    floodInundationAreaKm2: 2420,
    affectedPopulationTotal: 1840000,
    districtsAffectedCount: 22,
    highestSeverityDistrict: 'Dhemaji & Majuli',
    damagesCrInr: 410,
    cwcPeakStageM: 105.15,
    keyEvents: 'Flash monsoonal pulse caused multiple embankment cuts along Jiadhal and Subansiri.'
  },
  {
    year: 2024,
    monsoonRainfallMm: 2180,
    floodInundationAreaKm2: 3850,
    affectedPopulationTotal: 2950000,
    districtsAffectedCount: 29,
    highestSeverityDistrict: 'Dhemaji, Barpeta, Dhubri',
    damagesCrInr: 850,
    cwcPeakStageM: 105.80,
    keyEvents: 'Tri-phase monsoonal surge submerged 65% of Kaziranga National Park and cut off NH-15 in Upper Assam.'
  },
  {
    year: 2023,
    monsoonRainfallMm: 1740,
    floodInundationAreaKm2: 2110,
    affectedPopulationTotal: 1420000,
    districtsAffectedCount: 18,
    highestSeverityDistrict: 'Lakhimpur & Dhemaji',
    damagesCrInr: 320,
    cwcPeakStageM: 104.70,
    keyEvents: 'Late June cloudburst in foothills triggered flash floods along Ranganadi basin.'
  },
  {
    year: 2022,
    monsoonRainfallMm: 2540,
    floodInundationAreaKm2: 5200,
    affectedPopulationTotal: 5450000,
    districtsAffectedCount: 34,
    highestSeverityDistrict: 'Silchar (Cachar) & Barpeta',
    damagesCrInr: 1680,
    cwcPeakStageM: 106.20,
    keyEvents: 'Historic catastrophic inundation of Silchar city following Bethukandi dyke breach; 85% of town submerged.'
  },
  {
    year: 2021,
    monsoonRainfallMm: 1620,
    floodInundationAreaKm2: 1850,
    affectedPopulationTotal: 1180000,
    districtsAffectedCount: 16,
    highestSeverityDistrict: 'Dhemaji & Majuli',
    damagesCrInr: 280,
    cwcPeakStageM: 104.30,
    keyEvents: 'Moderate flood year; sand deposition damaged cropland along Jiadhal alluvial cone.'
  },
  {
    year: 2020,
    monsoonRainfallMm: 2360,
    floodInundationAreaKm2: 4400,
    affectedPopulationTotal: 3820000,
    districtsAffectedCount: 30,
    highestSeverityDistrict: 'Barpeta, Dhemaji, Morigaon',
    damagesCrInr: 960,
    cwcPeakStageM: 105.90,
    keyEvents: 'Dual crisis of COVID-19 pandemic during massive flood evacuations in Brahmaputra valley.'
  },
  {
    year: 2019,
    monsoonRainfallMm: 2110,
    floodInundationAreaKm2: 3600,
    affectedPopulationTotal: 2780000,
    districtsAffectedCount: 28,
    highestSeverityDistrict: 'Kaziranga & Upper Assam',
    damagesCrInr: 680,
    cwcPeakStageM: 105.45,
    keyEvents: 'Severe embankment washouts in Majuli and Sonitpur districts.'
  },
  {
    year: 2018,
    monsoonRainfallMm: 1910,
    floodInundationAreaKm2: 2600,
    affectedPopulationTotal: 1950000,
    districtsAffectedCount: 24,
    highestSeverityDistrict: 'Golaghat & Dhemaji',
    damagesCrInr: 450,
    cwcPeakStageM: 104.90,
    keyEvents: 'Dhansiri river overflow inundated vast agricultural belts in Golaghat district.'
  }
];

export const MODEL_METRICS: ModelMetric[] = [
  { metric: 'Inundation Detection F1-Score', category: 'Hydrologic Inundation', value: '92.6%', benchmark: 'Sentinel-1 SAR Ground Truth', status: 'Validated' },
  { metric: 'Heavy Rainfall Classification Precision', category: 'Rainfall Model', value: '88.4%', benchmark: 'IMD Doppler Radar Overlap', status: 'Validated' },
  { metric: 'Stage Peak Timing MAE', category: 'River Hydrology' as any, value: '± 2.4 Hours', benchmark: 'CWC Gauge Hydrographs', status: 'Validated' },
  { metric: 'Spatial Inundation Extent IoU', category: 'Hydrologic Inundation', value: '84.1%', benchmark: 'Copernicus EMS Flood Extent', status: 'Validated' },
  { metric: 'Population Exposure Calibration Error', category: 'Risk Classification', value: '± 4.8%', benchmark: 'Census + LandScan Grid', status: 'Validated' },
  { metric: '72-Hour Forecast Horizon Degradation', category: 'Risk Classification', value: '--', benchmark: 'Awaiting model evaluation', status: 'Awaiting model evaluation' }
];

export const DATA_SOURCES_CATALOG: DataSourceItem[] = [
  { id: 'ds-1', category: 'Weather', name: 'IMD Doppler Weather Radar (DWR)', sourceAgency: 'India Meteorological Department (IMD)', updateFrequency: 'Hourly (15 min rapid scans)', spatialResolution: '250m radial bin', status: 'Active Feed' },
  { id: 'ds-2', category: 'River Hydrology', name: 'National Hydrometric Network Telemetry', sourceAgency: 'Central Water Commission (CWC)', updateFrequency: 'Hourly automated tele-gauges', spatialResolution: '114 Gauging Sites in Assam', status: 'Active Feed' },
  { id: 'ds-3', category: 'Satellite Observation', name: 'Sentinel-1 C-SAR Synthetic Aperture Radar', sourceAgency: 'European Space Agency (ESA) / Copernicus', updateFrequency: 'Every 6–12 days (orbit passes)', spatialResolution: '10m x 10m Ground Pixel', status: 'Active Feed' },
  { id: 'ds-4', category: 'Elevation & DEM', name: 'SRTM 1 Arc-Second Global DEM', sourceAgency: 'NASA / USGS Earth Resources (EROS)', updateFrequency: 'Static calibrated baseline', spatialResolution: '30m Hydrologically Enforced', status: 'Active Feed' },
  { id: 'ds-5', category: 'Soil Moisture', name: 'Soil Moisture Active Passive (SMAP L4)', sourceAgency: 'NASA Jet Propulsion Laboratory (JPL)', updateFrequency: '3-Hourly surface & root zone', spatialResolution: '9 km EASE-Grid 2.0', status: 'Active Feed' },
  { id: 'ds-6', category: 'Population & Exposure', name: 'High-Resolution Population Density Layer', sourceAgency: 'Census of India & Humanitarian Data Exchange', updateFrequency: 'Annualized spatial disaggregation', spatialResolution: '30m Settlement Grids', status: 'Active Feed' },
  { id: 'ds-7', category: 'Infrastructure', name: 'OpenStreetMap Critical Infrastructure Layer', sourceAgency: 'OSM Contributor Network & ASDMA Geo-database', updateFrequency: 'Continuous validation', spatialResolution: 'Vector Points & Polyline Network', status: 'Active Feed' },
  { id: 'ds-8', category: 'Historical Floods', name: 'ASDMA 20-Year Flood Archive (2004–2024)', sourceAgency: 'Assam State Disaster Management Authority', updateFrequency: 'Post-Monsoon Audit', spatialResolution: 'Revenue Circle & Village Level', status: 'Active Feed' }
];

export const EMERGENCY_CONTACTS = [
  { name: 'State Emergency Ops (SEOC)', numbers: ['1070', '1079'], available: '24x7 Toll Free', type: 'state' },
  { name: 'DDMA Dhemaji Control Room', numbers: ['03753-224222', '03753-224340'], available: 'Active District Watch', type: 'district' },
  { name: 'NDRF 1st Battalion (Patgaon)', numbers: ['0361-2849005', '94350-02222'], available: 'Rapid Boat Dispatch', type: 'ndrf' },
  { name: 'SDRF Flood Rescue Cell', numbers: ['1077 (District Tollfree)'], available: 'Speedboat Team Stationed', type: 'sdrf' },
  { name: 'Medical / Trauma Ambulance', numbers: ['108'], available: 'Emergency Paramedics', type: 'medical' }
];

export const REGIONAL_GUIDES = {
  assamese: {
    language: 'অসমীয়া (Assamese)',
    title: 'বানপানীৰ পূৰ্ব প্ৰস্তুতি আৰু জীৱন ৰক্ষাৰ নিৰ্দেশনাৱলী',
    sub: 'অসম ৰাজ্যিক দুৰ্যোগ ব্যৱস্থাপনা প্ৰাধিকৰণ (ASDMA) আৰু FloodGuard দ্বাৰা প্ৰকাশিত',
    before: [
      'আধাৰ কাৰ্ড, মাটিৰ পট্টা, ৰেচন কাৰ্ড আৰু অন্যান্য গুৰুত্বপূৰ্ণ নথি জলৰোধী পলিথিন মোনাত পেক কৰক।',
      '৭২ ঘণ্টাৰ বাবে পৰ্যাপ্ত বিশুদ্ধ খোৱাপানী, হেল’জেন/ক্ল’ৰিন টেবলেট আৰু শুকান চিৰা-মুড়ি মজুত ৰাখক।',
      'মোবাইল ফোন, হাই-প্ৰৱাহ টৰ্চলাইট আৰু পাৱাৰ বেংক সম্পূৰ্ণ চাৰ্জ কৰি ৰাখক।',
      'গৰু-ম’হ আৰু ঘৰচীয়া জীৱ-জন্তুৰ ৰছী খুলি দিয়ক আৰু উচ্চ মথাউৰি বা আশ্ৰয় শিবিৰলৈ স্থানান্তৰ কৰক।',
      'চোতালত পানী সোমোৱালৈ অপেক্ষা নকৰিব; বিপদসীমা অতিক্ৰম কৰাৰ লগে লগে নিৰাপদ স্থানলৈ যাওক।'
    ],
    during: [
      'বৈ থকা বা কোবাল পানীত কেতিয়াও সাঁতুৰিব বা খোজ কাঢ়িব নালাগে। ১৫ চে.মি. পানীতে ডাঙৰ মানুহ উটি যাব পাৰে।',
      'ছিঙি পৰা বৈদ্যুতিক তাঁৰ, ট্ৰান্সফৰ্মাৰ আৰু বিজুলীৰ খুঁটাৰ পৰা সম্পূৰ্ণ আঁতৰত থাকক।',
      'বিপদ সংকেত আৰু নিৰ্দেশনা শুনিবলৈ আকাশবাণী গুৱাহাটী বা ডিডি অসমৰ বাতৰি শুনক।',
      'পানীত আৱদ্ধ হ’লে ওখ পকা চালত উঠি উজ্জ্বল ৰঙৰ কাপোৰেৰে উদ্ধাৰকাৰীক সংকেত দিয়ক।',
      'পানীত ডুবি থকা পথত গাড়ী নচলাব—৩০ চে.মি. পানীত গাড়ী সহজে উটি যায়।'
    ]
  },
  bodo: {
    language: 'बड़ो (Bodo)',
    title: 'दैबाना सिगां आरो समाव रैखाथि जानाয় बिथोन',
    sub: 'ASDMA आरो FloodGuard जों फोसावनाय रैखाथि राहफोर',
    before: [
      'आधार कार्ड, हा-हुनि बिलाइ आरो गासै गोनांथार डकुमेन्टफोरखौ दै हाबहैयै पोलिथिन बेगत दोन।',
      '72 घन्टा सुबुंनि थाखाय दै लोंनाय, हलोजीन ट्याबलेट आरो सुकां जामुं (बैखा/मुरी) जमा खालामना दोन।',
      'मोबाइल आरो ब्याट्री-टार्चखौ पुराव चार्ज खालामना लाखि।',
      'गावनि मैसौ-गोरोफोरखौ गोजौ जायगायाव दोनहै, जिउ बासायनो फांसि होआलासे गोजौ दानाव दोन।'
    ],
    during: [
      'बोहैथि दैनाव जेबो समावबो हाबहानो नाङा। 15 से.मी. बोहैथि दैयानो मानसिफोरखौ बोजावहैनो हागौ।',
      'गावनि गारिखौ दै गोजौ लामायाव थौहैनो नाङा।',
      'सिग्नल होनो गावनि गोजौ नखर’आव गाखोना गाब गोनां दखना/गामोसा जों रेस्क्यु टिमखौ दिन्थि।'
    ]
  },
  english: {
    language: 'English',
    title: 'Assam Monsoon Flood Readiness & Survival Directives',
    sub: 'Authorized by ASDMA and FloodGuard Hydrological Intelligence',
    before: [
      'Pack Aadhaar, land deeds, and ration cards into airtight waterproof poly-sleeves.',
      'Store 72 hours of sealed clean drinking water, chlorine tablets, and dry roasted grains.',
      'Charge handsets, high-drain torchlights, and battery power banks fully right now.',
      'Untie domestic cattle and livestock; shift them to raised earth embankments (high bunds).',
      'Do not wait for water to enter courtyard before moving.'
    ],
    during: [
      'Never walk or swim through flowing water. 15 cm of moving water can knock an adult down.',
      'Strictly stay clear of severed transformers, electrical lines, and flooded iron lampposts.',
      'Tune AM transistor to All India Radio Guwahati / DD Assam for broadcast siren notices.',
      'If trapped, climb to reinforced roof slabs. Signal rescuers with brightly colored cloths.',
      'Turn Around, Don\'t Drown. Vehicles easily float in 30cm flow.'
    ]
  }
};
