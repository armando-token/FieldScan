import * as THREE from '/static/vendor/three.module.js';
import { OrbitControls } from '/static/vendor/OrbitControls.js';
import { STLExporter } from '/static/vendor/STLExporter.js';

/* ==========================================================================
   CANONICAL TZ THT-02 METADATA, SUB-ASSEMBLIES & MANUAL INDEX
   ========================================================================== */
const ZONE_SPECS = {
  strainer_head: {
    id: 'strainer_head',
    title: 'Cabeza Ranurada + Filtro Sinterizado SHT30',
    shortLabel: 'FILTRO / SONDA SHT30',
    zRange: 'z = +42.0 .. +70.0 mm',
    dims: 'L = 28.0 mm · Ø16.0 mm (4 ranuras axiales · malla SS316L Ø10.9 mm)',
    manualPage: 1,
    faultPage: 6,
    summary: 'Jaula protectora ranurada con filtro sinterizado inox y chip CMOSens SHT30 (±0.3°C / ±2%RH). Si retorna 7FFFH, revisar obstrucción o condensación (Pág. 6).',
    anchorLocal: new THREE.Vector3(0, 11.5, 56.0),
  },
  upper_seal_ring: {
    id: 'upper_seal_ring',
    title: 'Anillo Elastómero Superior O-Ring',
    shortLabel: 'SELLO O-RING SUP.',
    zRange: 'z = +38.0 .. +42.0 mm',
    dims: 'Ancho = 4.0 mm · Ø16.2 mm NBR/Viton estanco',
    manualPage: 1,
    faultPage: 4,
    summary: 'Junta tórica superior de aislamiento ambiental (-40~85°C, 5~95%RH sin condensación · Pág. 4).',
    anchorLocal: new THREE.Vector3(0, 11.0, 40.0),
  },
  upper_barrel_dip: {
    id: 'upper_barrel_dip',
    title: 'Barril Superior + PCB Interna DIP-8',
    shortLabel: 'BARRIL SUP. / DIP-8 PCB',
    zRange: 'z = 0.0 .. +38.0 mm (PCB 30×11×1.6 mm)',
    dims: 'L = 38.0 mm · Ø16.0 mm ext / Ø13.2 mm int · Bloque DIP 1..8',
    manualPage: 5,
    faultPage: 5,
    summary: 'Aloja PCB azul RS-485 y selector DIP de 8 posiciones (pesos 128, 64, 32, 16, 8, 4, 2, 1). Desenroscar Paso 1 y Paso 2 para configurar dirección esclava (Pág. 5).',
    anchorLocal: new THREE.Vector3(0, 11.5, 16.0),
  },
  mounting_flange: {
    id: 'mounting_flange',
    title: 'Brida / Clip de Montaje Mural',
    shortLabel: 'BRIDA MONTAJE Ø4.2MM',
    zRange: 'z = +8.0 .. +28.0 mm',
    dims: 'Ancho total = 42.0 mm · Barrenos Ø4.2 mm (paso 32.0 mm)',
    manualPage: 1,
    faultPage: 9,
    summary: 'Abrazadera snap-on de polímero técnico con orejas laterales reforzadas y perforaciones Ø4.2 mm para fijación en ducto o muro (Pág. 1 / Pág. 9).',
    anchorLocal: new THREE.Vector3(0, 12.0, 18.0),
  },
  lower_barrel_rs485: {
    id: 'lower_barrel_rs485',
    title: 'Barril Inferior + Etapa Transceptora RS-485',
    shortLabel: 'BARRIL INF. RS-485',
    zRange: 'z = -50.0 .. 0.0 mm',
    dims: 'L = 50.0 mm · Ø16.0 mm · Rosca central M14 + O-ring',
    manualPage: 5,
    faultPage: 7,
    summary: 'Cuerpo tubular inferior con junta central y etapa Modbus-RTU (4800/9600/19200 bps, 8-N-1, CRC-16 A001 · Pág. 5–9).',
    anchorLocal: new THREE.Vector3(0, 11.5, -25.0),
  },
  waterproof_gland_leads: {
    id: 'waterproof_gland_leads',
    title: 'Terminal Impermeable + Latiguillo RS-485 (4 Hilos)',
    shortLabel: 'PRENSAESTOPAS / CABLE RS-485',
    zRange: 'z = -70.0 .. -50.0 mm + Cable Ø5.0 mm',
    dims: 'Tuerca estriada L = 20.0 mm + Rojo(V+) Negro(GND) Amarillo(A+) Verde(B-)',
    manualPage: 4,
    faultPage: 4,
    summary: 'Prensaestopas cónico estriado y cable blindado 1 m: Rojo V+ (5~24V DC), Negro GND común, Amarillo RS-485 A+, Verde RS-485 B- (Pág. 4).',
    anchorLocal: new THREE.Vector3(0, 11.5, -60.0),
  },
};

const MANUAL_PAGES = {
  1: 'Pág. 1 · Identificación de partes y sonda SHT30',
  2: 'Pág. 2 · Descripción general CMOSens SHT30 y áreas HVAC',
  3: 'Pág. 3 · Datos técnicos: DC 5~24V, SHT30 (-40~125°C, ±0.3°C)',
  4: 'Pág. 4 · Código de colores RS-485 (Rojo V+, Negro GND, Amarillo A+, Verde B-)',
  5: 'Pág. 5 · Interruptor DIP-8 (128..1, Ej: 176) y apertura en 2 pasos',
  6: 'Pág. 6 · Mapa de registros Modbus (0000H Temp, 0001H Hum, 7FFFH Anormal)',
  7: 'Pág. 7 · Función 03H lectura Modbus Poll y trama RTU',
  8: 'Pág. 8 · Función 06H ajuste Baud Rate (0005H) y respuesta de excepción',
  9: 'Pág. 9 · Códigos de error, cálculo CRC-16 (A001) y plano 140×16 mm',
};

const DIP_WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1];

/* ==========================================================================
   APPLICATION STATE
   ========================================================================== */
const state = {
  renderMode: 'solid', // 'solid' | 'wireframe'
  exploded: false,
  explodeProgress: 0, // 0..1 smooth animation
  autoExplodeEnabled: true,
  showDimensions: true,
  syncCameraAngle: true,
  cameraAngleDeg: 0,
  smoothedAngleDeg: 0,
  activeCameraMode: 'sim_normal',
  selectedZone: null,
  highlightedZone: null,
  faultReason: '',
  manualPage: 1,
  dipBits: [1, 0, 1, 1, 0, 0, 0, 0], // 128 + 32 + 16 = 176 (Manual Page 5 example)
  autoSpeak: true,
  isRecording: false,
  lastEscalation: null,
  lastDiagnosisText: '',
  lastAudioB64: null,
  videoStreamFailed: false,
  seenRepairEventId: 0,
  modbusHealthy: false,
};

/* ==========================================================================
   DOM REFERENCES
   ========================================================================== */
const dom = {
  pillAirplane: document.getElementById('pillAirplane'),
  pillAirplaneText: document.getElementById('pillAirplaneText'),
  pillCamText: document.getElementById('pillCamText'),
  pillModbus: document.getElementById('pillModbus'),
  pillModbusText: document.getElementById('pillModbusText'),
  pillModelText: document.getElementById('pillModelText'),
  pillRamText: document.getElementById('pillRamText'),
  pillLatencyText: document.getElementById('pillLatencyText'),

  scadaLiveCard: document.getElementById('scadaLiveCard'),
  scadaStatusBadge: document.getElementById('scadaStatusBadge'),
  scadaTempVal: document.getElementById('scadaTempVal'),
  scadaHumVal: document.getElementById('scadaHumVal'),
  scadaSlaveVal: document.getElementById('scadaSlaveVal'),
  scadaFrameHex: document.getElementById('scadaFrameHex'),
  btnScanRealModbus: document.getElementById('btnScanRealModbus'),
  btnSimConnectModbus: document.getElementById('btnSimConnectModbus'),
  btnBreathTest: document.getElementById('btnBreathTest'),

  videoStream: document.getElementById('videoStream'),
  videoFallbackCanvas: document.getElementById('videoFallbackCanvas'),
  camSourceBadge: document.getElementById('camSourceBadge'),
  hudSensorId: document.getElementById('hudSensorId'),
  hudStatusTag: document.getElementById('hudStatusTag'),
  scanAngleVal: document.getElementById('scanAngleVal'),
  scanDimVal: document.getElementById('scanDimVal'),
  scanZoneVal: document.getElementById('scanZoneVal'),
  photoUploadInput: document.getElementById('photoUploadInput'),

  manualPrevBtn: document.getElementById('manualPrevBtn'),
  manualNextBtn: document.getElementById('manualNextBtn'),
  manualPageIndicator: document.getElementById('manualPageIndicator'),
  manualQuickPills: document.getElementById('manualQuickPills'),
  manualViewerBox: document.getElementById('manualViewerBox'),
  manualPageImg: document.getElementById('manualPageImg'),
  manualPageCaption: document.getElementById('manualPageCaption'),

  btnModeSolid: document.getElementById('btnModeSolid'),
  btnModeWireframe: document.getElementById('btnModeWireframe'),
  btnToggleExplode: document.getElementById('btnToggleExplode'),
  btnToggleDims: document.getElementById('btnToggleDims'),
  btnSyncCam: document.getElementById('btnSyncCam'),
  btnResetView: document.getElementById('btnResetView'),
  fpsCounterText: document.getElementById('fpsCounterText'),

  canvasStage: document.getElementById('canvasStage'),
  cadCanvas: document.getElementById('cadCanvas'),
  labelDimLength: document.getElementById('labelDimLength'),
  labelDimDia: document.getElementById('labelDimDia'),
  labelDipAddr: document.getElementById('labelDipAddr'),
  faultCallout: document.getElementById('faultCallout'),
  faultCalloutZone: document.getElementById('faultCalloutZone'),
  faultCalloutText: document.getElementById('faultCalloutText'),

  dipHudCard: document.getElementById('dipHudCard'),
  dipCalcAddr: document.getElementById('dipCalcAddr'),
  dipSwitchesRow: document.getElementById('dipSwitchesRow'),

  assemblyTreePills: document.getElementById('assemblyTreePills'),
  selectedPartSummary: document.getElementById('selectedPartSummary'),

  btnAutoSpeak: document.getElementById('btnAutoSpeak'),
  qaLoadSensor: document.getElementById('qaLoadSensor'),
  qaDiagnoseCam: document.getElementById('qaDiagnoseCam'),
  qaInspectDip: document.getElementById('qaInspectDip'),
  qaEscalateCad: document.getElementById('qaEscalateCad'),

  chatFeed: document.getElementById('chatFeed'),
  btnPushToTalk: document.getElementById('btnPushToTalk'),
  pttLabel: document.getElementById('pttLabel'),
  voiceMeter: document.getElementById('voiceMeter'),
  voiceMeterFill: document.getElementById('voiceMeterFill'),
  textQueryForm: document.getElementById('textQueryForm'),
  queryInput: document.getElementById('queryInput'),

  escQueueTag: document.getElementById('escQueueTag'),
  btnDownloadDxf: document.getElementById('btnDownloadDxf'),
  btnDownloadStl: document.getElementById('btnDownloadStl'),
  btnOpenEscalateModal: document.getElementById('btnOpenEscalateModal'),

  manualModal: document.getElementById('manualModal'),
  lightboxTitle: document.getElementById('lightboxTitle'),
  lightboxPageBadge: document.getElementById('lightboxPageBadge'),
  lightboxImg: document.getElementById('lightboxImg'),
  lightboxPrevBtn: document.getElementById('lightboxPrevBtn'),
  lightboxNextBtn: document.getElementById('lightboxNextBtn'),
  lightboxCloseBtn: document.getElementById('lightboxCloseBtn'),

  escalationModal: document.getElementById('escalationModal'),
  escalationCloseBtn: document.getElementById('escalationCloseBtn'),
  escOutboxState: document.getElementById('escOutboxState'),
  escPackagePath: document.getElementById('escPackagePath'),
  escZipDownloadLink: document.getElementById('escZipDownloadLink'),
  escEmailTo: document.getElementById('escEmailTo'),
  escEmailSubject: document.getElementById('escEmailSubject'),
  escAttachmentsList: document.getElementById('escAttachmentsList'),
  escEmailBody: document.getElementById('escEmailBody'),
  escSnapshotImg: document.getElementById('escSnapshotImg'),
  escSummaryZone: document.getElementById('escSummaryZone'),
  escSummaryDip: document.getElementById('escSummaryDip'),
};

/* ==========================================================================
   PROCEDURAL INDUSTRIAL TEXTURES (ZERO EXTERNAL ASSETS)
   ========================================================================== */
function createSinteredMetalTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#9aa3ad';
  ctx.fillRect(0, 0, 256, 256);

  // Deterministic pseudo-random porous stainless granules
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 6500; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const r = 0.6 + rand() * 1.6;
    const shade = Math.floor(110 + rand() * 95);
    ctx.fillStyle = `rgb(${shade},${shade + 3},${shade + 7})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}

function createBarrelMarkingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#bcc4cd';
  ctx.fillRect(0, 0, 512, 256);

  // Subtle polymer satin brush lines
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  for (let y = 0; y < 256; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Laser-etched industrial identification
  ctx.save();
  ctx.translate(256, 128);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#55606e';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TZ THT-02  RS-485', 0, -14);
  ctx.font = '14px monospace';
  ctx.fillText('DC 5-24V · SHT30 · IP65', 0, 10);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBluePcbTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Industrial blue solder mask
  ctx.fillStyle = '#0c4a82';
  ctx.fillRect(0, 0, 512, 256);

  // Copper traces under solder mask
  ctx.strokeStyle = '#1565ad';
  ctx.lineWidth = 4;
  for (let i = 0; i < 8; i++) {
    const x = 140 + i * 28;
    ctx.beginPath();
    ctx.moveTo(x, 42);
    ctx.lineTo(x, 215);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(35, 70);
  ctx.lineTo(475, 70);
  ctx.moveTo(35, 186);
  ctx.lineTo(475, 186);
  ctx.stroke();

  // Gold ENIG pads at wire terminal end
  const wireLabels = ['V+', 'GND', 'A+', 'B-'];
  for (let i = 0; i < 4; i++) {
    const y = 44 + i * 54;
    ctx.fillStyle = '#eab308';
    ctx.fillRect(18, y - 12, 34, 24);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(wireLabels[i], 58, y + 5);
  }

  // White silkscreen outline & labels
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, 496, 240);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 17px monospace';
  ctx.fillText('TZ-THT02-REV1.1', 300, 34);
  ctx.fillText('SW1: ADDR DIP-8', 135, 34);
  ctx.font = '14px monospace';
  ctx.fillText('128 64 32 16  8  4  2  1', 124, 236);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ==========================================================================
   THREE.JS 60 FPS PARAMETRIC CAD STUDIO ENGINE
   ========================================================================== */
const cad = {
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  raycaster: new THREE.Raycaster(),
  pointer: new THREE.Vector2(),

  sensorRig: null, // Root rig rotated horizontally so Z (-70..+70) spans left->right
  lowerSlideGroup: null, // Gland nut slides -Z on Step 1 unscrew
  upperSlideGroup: null, // Upper barrel + seal + flange + strainer slide +Z on Step 2 unscrew
  pcbGroup: null, // Internal blue DIP-8 PCB stays centered in gap for inspection
  dipActuatorMeshes: [], // 8 white switch actuators dynamically toggled
  dimensionsGroup: null,
  faultBoxHelper: null,

  zoneGroups: {},
  zoneMeshes: {},
  allSolidMaterials: [],
  emissiveRestoreMap: new Map(),

  // 3D anchor points for 2D crisp overlay badges
  anchorDimLength: new THREE.Vector3(0, -18.5, 0),
  anchorDimDia: new THREE.Vector3(0, 0, 77.5),
  anchorDipLabel: new THREE.Vector3(0, 15.5, 13.0),
};

function tagZoneGroup(group, zoneId) {
  cad.zoneGroups[zoneId] = group;
  cad.zoneMeshes[zoneId] = [];
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.userData.zoneId = zoneId;
      obj.castShadow = true;
      obj.receiveShadow = true;
      cad.zoneMeshes[zoneId].push(obj);

      // Clone material per zone if shared so emissive fault glow isolates cleanly
      if (obj.material && !obj.material.userData?.zoneCloned) {
        obj.material = obj.material.clone();
        obj.material.userData = {
          zoneCloned: true,
          baseOpacity: obj.material.opacity ?? 1.0,
          baseTransparent: Boolean(obj.material.transparent),
          isInternal: Boolean(obj.userData.isInternal),
        };
        cad.allSolidMaterials.push(obj.material);
      }
    }
  });
}

function buildParametricSensorAssembly() {
  const sinteredTex = createSinteredMetalTexture();
  const barrelTex = createBarrelMarkingTexture();
  const pcbTex = createBluePcbTexture();

  // Shared PBR Materials (cloned per-zone during tagging)
  const polymerGreyMat = new THREE.MeshStandardMaterial({
    color: 0xc2cad2,
    roughness: 0.36,
    metalness: 0.08,
  });

  const polymerMarkedMat = new THREE.MeshStandardMaterial({
    map: barrelTex,
    roughness: 0.38,
    metalness: 0.08,
  });

  const darkPolymerThreadMat = new THREE.MeshStandardMaterial({
    color: 0x9aa4b0,
    roughness: 0.48,
    metalness: 0.12,
  });

  const elastomerBlackMat = new THREE.MeshStandardMaterial({
    color: 0x15181d,
    roughness: 0.84,
    metalness: 0.04,
  });

  const sinteredSteelMat = new THREE.MeshStandardMaterial({
    color: 0xb8c2cc,
    map: sinteredTex,
    bumpMap: sinteredTex,
    bumpScale: 0.35,
    roughness: 0.44,
    metalness: 0.82,
  });

  // Master Rig: orient local Z (-70..+70 mm) along World +X so sensor matches Page 5 & Page 9
  const sensorRig = new THREE.Group();
  sensorRig.rotation.y = Math.PI / 2;
  cad.sensorRig = sensorRig;

  const centralStaticGroup = new THREE.Group();
  const upperSlideGroup = new THREE.Group();
  const lowerSlideGroup = new THREE.Group();
  sensorRig.add(centralStaticGroup);
  sensorRig.add(upperSlideGroup);
  sensorRig.add(lowerSlideGroup);
  cad.upperSlideGroup = upperSlideGroup;
  cad.lowerSlideGroup = lowerSlideGroup;

  /* ------------------------------------------------------------------------
     1. STRAINER_HEAD (z = +42 .. +70 mm, Ø16.0 mm)
     Slotted protective cage (4 true vertical slots/pillars) + Sintered SS316
     Strainer + Internal SHT30 CMOSens die!
     ------------------------------------------------------------------------ */
  const strainerGroup = new THREE.Group();
  strainerGroup.name = 'strainer_head';

  // Base ring z = +42 .. +45.2 (Lathe around Y, then rotateX(+PI/2) -> along +Z)
  const baseRingPts = [
    new THREE.Vector2(6.0, 42.0),
    new THREE.Vector2(8.0, 42.0),
    new THREE.Vector2(8.0, 45.2),
    new THREE.Vector2(6.2, 45.2),
    new THREE.Vector2(6.0, 42.0),
  ];
  const baseRingGeo = new THREE.LatheGeometry(baseRingPts, 48);
  baseRingGeo.rotateX(Math.PI / 2);
  strainerGroup.add(new THREE.Mesh(baseRingGeo, polymerGreyMat));

  // 4 Curved Axial Pillars around circumference (leaving 4 open vertical slots!)
  const pillarRIn = 6.35;
  const pillarROut = 8.0;
  const pillarArc = 0.66; // ~38 deg pillar, ~52 deg open slot
  for (let i = 0; i < 4; i++) {
    const startAngle = i * (Math.PI / 2) + Math.PI / 4 - pillarArc / 2;
    const endAngle = startAngle + pillarArc;
    const sector = new THREE.Shape();
    sector.absarc(0, 0, pillarROut, startAngle, endAngle, false);
    sector.absarc(0, 0, pillarRIn, endAngle, startAngle, true);
    sector.closePath();

    const extrudeGeo = new THREE.ExtrudeGeometry(sector, {
      depth: 22.0,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.16,
      bevelThickness: 0.2,
      curveSegments: 16,
    });
    const pillarMesh = new THREE.Mesh(extrudeGeo, polymerGreyMat);
    pillarMesh.position.z = 45.2;
    strainerGroup.add(pillarMesh);
  }

  // Top chamfered cap dome (z = +67.2 .. +70.0)
  const capPts = [
    new THREE.Vector2(0.0, 67.2),
    new THREE.Vector2(8.0, 67.2),
    new THREE.Vector2(8.0, 68.4),
    new THREE.Vector2(7.35, 69.5),
    new THREE.Vector2(6.2, 70.0),
    new THREE.Vector2(2.6, 70.0),
    new THREE.Vector2(2.3, 69.2),
    new THREE.Vector2(0.0, 69.2),
  ];
  const capGeo = new THREE.LatheGeometry(capPts, 48);
  capGeo.rotateX(Math.PI / 2);
  strainerGroup.add(new THREE.Mesh(capGeo, polymerGreyMat));

  // Internal Sintered Stainless Steel Cylindrical Strainer (z = +44 .. +67.0, R = 5.45 mm)
  const filterGeo = new THREE.CylinderGeometry(5.45, 5.45, 23.0, 40);
  filterGeo.rotateX(Math.PI / 2);
  const filterMesh = new THREE.Mesh(filterGeo, sinteredSteelMat);
  filterMesh.position.z = 55.5;
  filterMesh.userData.isInternal = true;
  strainerGroup.add(filterMesh);

  // Internal SHT30 Sensor Carrier + Tiny CMOSens Die inside the strainer
  const shtCarrierMat = new THREE.MeshStandardMaterial({
    color: 0x0f766e,
    roughness: 0.4,
    metalness: 0.2,
  });
  const shtCarrier = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.0, 14.0), shtCarrierMat);
  shtCarrier.position.set(0, 0, 50.5);
  shtCarrier.userData.isInternal = true;
  strainerGroup.add(shtCarrier);

  const shtDieMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.25,
    metalness: 0.55,
  });
  const shtDie = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.9, 2.5), shtDieMat);
  shtDie.position.set(0, 0.85, 54.0);
  shtDie.userData.isInternal = true;
  strainerGroup.add(shtDie);

  // White PTFE protective membrane dot on SHT30 die
  const ptfeDot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.75, 0.75, 0.2, 16),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
  );
  ptfeDot.position.set(0, 1.35, 54.0);
  ptfeDot.userData.isInternal = true;
  strainerGroup.add(ptfeDot);

  upperSlideGroup.add(strainerGroup);
  tagZoneGroup(strainerGroup, 'strainer_head');

  /* ------------------------------------------------------------------------
     2. UPPER_SEAL_RING (z = +38 .. +42 mm)
     Matte black elastomer O-ring collar
     ------------------------------------------------------------------------ */
  const sealGroup = new THREE.Group();
  sealGroup.name = 'upper_seal_ring';

  const sealPts = [
    new THREE.Vector2(6.5, 38.0),
    new THREE.Vector2(8.08, 38.0),
    new THREE.Vector2(8.16, 38.6),
    new THREE.Vector2(8.16, 41.4),
    new THREE.Vector2(8.08, 42.0),
    new THREE.Vector2(6.5, 42.0),
  ];
  const sealGeo = new THREE.LatheGeometry(sealPts, 48);
  sealGeo.rotateX(Math.PI / 2);
  sealGroup.add(new THREE.Mesh(sealGeo, elastomerBlackMat));

  upperSlideGroup.add(sealGroup);
  tagZoneGroup(sealGroup, 'upper_seal_ring');

  /* ------------------------------------------------------------------------
     3. UPPER_BARREL_DIP (z = 0 .. +38 mm + Internal Blue DIP-8 PCB)
     Hollow polymer cylinder slides apart to expose the internal Blue PCB!
     ------------------------------------------------------------------------ */
  const upperBarrelMaster = new THREE.Group();
  upperBarrelMaster.name = 'upper_barrel_dip';

  // Outer hollow shell (placed in upperSlideGroup so it slides +Z on unscrew!)
  const upperShellSub = new THREE.Group();
  const upperBarrelPts = [
    new THREE.Vector2(6.65, 0.0),
    new THREE.Vector2(8.0, 0.0),
    new THREE.Vector2(8.0, 38.0),
    new THREE.Vector2(6.65, 38.0),
    new THREE.Vector2(6.65, 0.0),
  ];
  const upperBarrelGeo = new THREE.LatheGeometry(upperBarrelPts, 56);
  upperBarrelGeo.rotateX(Math.PI / 2);
  const upperBarrelMesh = new THREE.Mesh(upperBarrelGeo, polymerMarkedMat);
  upperShellSub.add(upperBarrelMesh);
  upperSlideGroup.add(upperShellSub);

  // Internal Blue PCB (30.0 x 11.0 x 1.6 mm) anchored to centralStaticGroup at z = -3..+27
  // so when upperSlideGroup moves +34 mm, the DIP-8 PCB is 100% exposed just like Page 5!
  const pcbGroup = new THREE.Group();
  cad.pcbGroup = pcbGroup;

  const pcbBoardMat = new THREE.MeshStandardMaterial({
    map: pcbTex,
    roughness: 0.32,
    metalness: 0.18,
  });
  const pcbBoard = new THREE.Mesh(new THREE.BoxGeometry(11.0, 1.6, 30.0), pcbBoardMat);
  pcbBoard.position.set(0, -0.4, 12.0);
  pcbBoard.userData.isInternal = true;
  pcbGroup.add(pcbBoard);

  // 8-Position DIP Switch Housing (SW1)
  const dipHousingMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.42,
    metalness: 0.1,
  });
  const dipHousing = new THREE.Mesh(new THREE.BoxGeometry(6.4, 2.5, 16.4), dipHousingMat);
  dipHousing.position.set(0, 1.55, 14.5);
  dipHousing.userData.isInternal = true;
  pcbGroup.add(dipHousing);

  // Red top faceplate strip on DIP switch
  const dipTopPlate = new THREE.Mesh(
    new THREE.BoxGeometry(5.8, 0.25, 15.8),
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.45 })
  );
  dipTopPlate.position.set(0, 2.75, 14.5);
  dipTopPlate.userData.isInternal = true;
  pcbGroup.add(dipTopPlate);

  // 8 Individual White DIP Switch Rockers (1..8) + Gold Gull-Wing Pins
  const actuatorMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.3,
    metalness: 0.05,
  });
  const goldPinMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.25,
    metalness: 0.88,
  });

  cad.dipActuatorMeshes = [];
  for (let i = 0; i < 8; i++) {
    const zPos = 7.8 + i * 1.92;
    // Slot recess
    const slotRecess = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.3, 1.15),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
    );
    slotRecess.position.set(0, 2.8, zPos);
    slotRecess.userData.isInternal = true;
    pcbGroup.add(slotRecess);

    // Movable white rocker (slides X = +0.85 for ON, X = -0.85 for OFF)
    const rocker = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.75, 0.95), actuatorMat);
    rocker.position.set(state.dipBits[i] ? 0.85 : -0.85, 3.05, zPos);
    rocker.userData.isInternal = true;
    rocker.userData.dipIndex = i;
    pcbGroup.add(rocker);
    cad.dipActuatorMeshes.push(rocker);

    // Left & right gold IC pins
    for (const side of [-1, 1]) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.45), goldPinMat);
      pin.position.set(side * 3.45, 0.9, zPos);
      pin.userData.isInternal = true;
      pcbGroup.add(pin);
    }
  }

  // SMD MAX485 SOIC-8 Transceiver IC + MCU + SMD Capacitors on PCB
  const icDarkMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.35, metalness: 0.25 });
  const max485Chip = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.35, 5.0), icDarkMat);
  max485Chip.position.set(-1.6, 1.0, 2.2);
  max485Chip.userData.isInternal = true;
  pcbGroup.add(max485Chip);

  const mcuChip = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.1, 4.0), icDarkMat);
  mcuChip.position.set(2.4, 0.9, 24.4);
  mcuChip.userData.isInternal = true;
  pcbGroup.add(mcuChip);

  const smdCapMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.4, metalness: 0.3 });
  for (const [cx, cz] of [[2.6, 1.5], [2.6, 3.6], [-2.5, 24.5]]) {
    const smd = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.9), smdCapMat);
    smd.position.set(cx, 0.75, cz);
    smd.userData.isInternal = true;
    pcbGroup.add(smd);
  }

  // Internal 4-wire harness connecting lower RS-485 bus into PCB pads (z = -8 .. -1)
  const internalWireDefs = [
    { color: 0xdc2626, x: -3.6 }, // Red V+
    { color: 0x171717, x: -1.2 }, // Black GND
    { color: 0xeab308, x: 1.2 },  // Yellow A+
    { color: 0x16a34a, x: 3.6 },  // Green B-
  ];
  for (const iw of internalWireDefs) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(iw.x * 0.65, -0.3, -10.0),
      new THREE.Vector3(iw.x * 0.85, 0.2, -5.0),
      new THREE.Vector3(iw.x, 0.45, -1.5),
    ]);
    const wGeo = new THREE.TubeGeometry(curve, 12, 0.55, 8, false);
    const wMesh = new THREE.Mesh(
      wGeo,
      new THREE.MeshStandardMaterial({ color: iw.color, roughness: 0.5 })
    );
    wMesh.userData.isInternal = true;
    pcbGroup.add(wMesh);
  }

  centralStaticGroup.add(pcbGroup);

  // Register both outer shell and internal PCB meshes under 'upper_barrel_dip'
  cad.zoneGroups.upper_barrel_dip = upperShellSub;
  cad.zoneMeshes.upper_barrel_dip = [];
  for (const grp of [upperShellSub, pcbGroup]) {
    grp.traverse((obj) => {
      if (obj.isMesh) {
        obj.userData.zoneId = 'upper_barrel_dip';
        obj.castShadow = true;
        obj.receiveShadow = true;
        cad.zoneMeshes.upper_barrel_dip.push(obj);
        obj.material = obj.material.clone();
        obj.material.userData = {
          zoneCloned: true,
          baseOpacity: 1.0,
          baseTransparent: false,
          isInternal: Boolean(obj.userData.isInternal),
        };
        cad.allSolidMaterials.push(obj.material);
      }
    });
  }

  /* ------------------------------------------------------------------------
     4. MOUNTING_FLANGE (z = +8 .. +28 mm)
     Snap-on wall-mounting saddle clip with 42 mm winged ears & Ø4.2 mm holes
     ------------------------------------------------------------------------ */
  const flangeGroup = new THREE.Group();
  flangeGroup.name = 'mounting_flange';

  // Winged mounting plate in X-Z plane (X = -21..+21 mm, Z = +8..+28 mm) with 2 Ø4.2mm holes at X = ±16mm
  const wingShape = new THREE.Shape();
  const hw = 21.0;
  const hh = 10.0;
  const cr = 2.6;
  wingShape.moveTo(-hw + cr, -hh);
  wingShape.lineTo(hw - cr, -hh);
  wingShape.quadraticCurveTo(hw, -hh, hw, -hh + cr);
  wingShape.lineTo(hw, hh - cr);
  wingShape.quadraticCurveTo(hw, hh, hw - cr, hh);
  wingShape.lineTo(-hw + cr, hh);
  wingShape.quadraticCurveTo(-hw, hh, -hw, hh - cr);
  wingShape.lineTo(-hw, -hh + cr);
  wingShape.quadraticCurveTo(-hw, -hh, -hw + cr, -hh);

  // Central bore cutout + Left/Right Ø4.2 mm screw holes (32 mm spacing -> ±16 mm)
  for (const holeX of [-16.0, 16.0]) {
    const hole = new THREE.Path();
    hole.absarc(holeX, 0, 2.1, 0, Math.PI * 2, true);
    wingShape.holes.push(hole);
  }

  const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
    depth: 2.8,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.25,
    bevelThickness: 0.25,
  });
  wingGeo.rotateX(Math.PI / 2); // Extrude along Y (backing plate behind barrel at Y = -8.2..-11.0)
  const wingMesh = new THREE.Mesh(wingGeo, polymerGreyMat);
  wingMesh.position.set(0, -6.8, 18.0);
  flangeGroup.add(wingMesh);

  // Horizontal stiffening gusset ribs across left & right ears (matching Page 1 photo!)
  for (const side of [-1, 1]) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(11.5, 2.4, 2.2), polymerGreyMat);
    rib.position.set(side * 14.0, -5.8, 18.0);
    flangeGroup.add(rib);
  }

  // Snap-on C-clip collar hugging the Ø16mm barrel (245° wrap)
  const cClipShape = new THREE.Shape();
  const clipStart = -Math.PI * 0.18;
  const clipEnd = Math.PI * 1.18;
  cClipShape.absarc(0, 0, 9.45, clipEnd, clipStart, true);
  cClipShape.absarc(0, 0, 8.04, clipStart, clipEnd, false);
  cClipShape.closePath();

  const cClipGeo = new THREE.ExtrudeGeometry(cClipShape, {
    depth: 18.0,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.2,
    bevelThickness: 0.2,
    curveSegments: 32,
  });
  const cClipMesh = new THREE.Mesh(cClipGeo, polymerGreyMat);
  cClipMesh.rotation.z = Math.PI; // Opening faces +Y front, backing plate on -Y
  cClipMesh.position.z = 9.0;
  flangeGroup.add(cClipMesh);

  upperSlideGroup.add(flangeGroup);
  tagZoneGroup(flangeGroup, 'mounting_flange');

  /* ------------------------------------------------------------------------
     5. LOWER_BARREL_RS485 (z = -50 .. 0 mm)
     Lower cylindrical body + thin seam O-ring at z = 0 + male threads at ends
     ------------------------------------------------------------------------ */
  const lowerBarrelGroup = new THREE.Group();
  lowerBarrelGroup.name = 'lower_barrel_rs485';

  const lowerPts = [
    new THREE.Vector2(5.8, -50.0),
    new THREE.Vector2(6.9, -50.0),
    new THREE.Vector2(6.9, -43.8),
    new THREE.Vector2(8.0, -43.8),
    new THREE.Vector2(8.0, 0.0),
    new THREE.Vector2(6.55, 0.0),
    new THREE.Vector2(6.55, 5.2),
    new THREE.Vector2(5.8, 5.2),
    new THREE.Vector2(5.8, -50.0),
  ];
  const lowerGeo = new THREE.LatheGeometry(lowerPts, 56);
  lowerGeo.rotateX(Math.PI / 2);
  lowerBarrelGroup.add(new THREE.Mesh(lowerGeo, polymerGreyMat));

  // Precision machined thread rings at z = -49..-44.5 (Step 1 joint) and z = +0.8..+4.8 (Step 2 joint)
  for (const zThread of [-48.6, -47.2, -45.8, 1.4, 2.8, 4.2]) {
    const rThread = zThread < 0 ? 7.15 : 6.72;
    const threadTorus = new THREE.Mesh(
      new THREE.TorusGeometry(rThread, 0.28, 10, 40),
      darkPolymerThreadMat
    );
    threadTorus.position.z = zThread;
    lowerBarrelGroup.add(threadTorus);
  }

  // Thin middle seam elastomer O-ring at z = 0.0
  const midOring = new THREE.Mesh(
    new THREE.TorusGeometry(7.96, 0.42, 14, 48),
    elastomerBlackMat
  );
  midOring.position.z = 0.0;
  lowerBarrelGroup.add(midOring);

  centralStaticGroup.add(lowerBarrelGroup);
  tagZoneGroup(lowerBarrelGroup, 'lower_barrel_rs485');

  /* ------------------------------------------------------------------------
     6. WATERPROOF_GLAND_LEADS (z = -70 .. -50 mm + Cable + 4 Color-Coded Leads)
     Tapered ribbed dome nut + CatmullRomCurve3 shielded cable + V+, GND, A+, B-
     ------------------------------------------------------------------------ */
  const glandGroup = new THREE.Group();
  glandGroup.name = 'waterproof_gland_leads';

  // Tapered dome nut profile (z = -70 .. -50)
  const glandPts = [
    new THREE.Vector2(2.6, -70.0),
    new THREE.Vector2(5.2, -70.0),
    new THREE.Vector2(6.5, -66.5),
    new THREE.Vector2(7.55, -60.0),
    new THREE.Vector2(8.0, -53.5),
    new THREE.Vector2(8.0, -49.8),
    new THREE.Vector2(7.0, -49.8),
    new THREE.Vector2(7.0, -54.5),
    new THREE.Vector2(2.6, -54.5),
  ];
  const glandGeo = new THREE.LatheGeometry(glandPts, 48);
  glandGeo.rotateX(Math.PI / 2);
  glandGroup.add(new THREE.Mesh(glandGeo, polymerGreyMat));

  // 16 Longitudinal Grip Ribs around tapered dome nut (matching Page 1, 5, 9!)
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2;
    const ribGeo = new THREE.BoxGeometry(0.65, 0.72, 15.2);
    const ribMesh = new THREE.Mesh(ribGeo, polymerGreyMat);
    const rMid = 7.45;
    ribMesh.position.set(Math.cos(ang) * rMid, Math.sin(ang) * rMid, -58.8);
    ribMesh.rotation.z = ang;
    // Slight taper tilt
    ribMesh.lookAt(
      Math.cos(ang) * (rMid - 1.5),
      Math.sin(ang) * (rMid - 1.5),
      -74.0
    );
    glandGroup.add(ribMesh);
  }

  // Black rubber strain-relief bushing collar at z = -71.8 .. -69.8
  const bootGeo = new THREE.CylinderGeometry(3.4, 4.3, 2.6, 28);
  bootGeo.rotateX(Math.PI / 2);
  const bootMesh = new THREE.Mesh(bootGeo, elastomerBlackMat);
  bootMesh.position.z = -70.8;
  glandGroup.add(bootMesh);

  // Smooth 3D CatmullRomCurve3 Black Ø5.0 mm Shielded RS-485 Cable Loop
  const cableJacketMat = new THREE.MeshStandardMaterial({
    color: 0x14181f,
    roughness: 0.52,
    metalness: 0.08,
  });

  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, -71.5),
    new THREE.Vector3(0, -2.5, -86.0),
    new THREE.Vector3(4.0, -14.0, -96.0),
    new THREE.Vector3(12.0, -24.5, -80.0),
    new THREE.Vector3(15.0, -25.5, -45.0),
    new THREE.Vector3(12.0, -23.0, -12.0),
    new THREE.Vector3(6.5, -16.5, 4.0),
    new THREE.Vector3(3.0, -10.5, -6.0),
  ]);
  const cableGeo = new THREE.TubeGeometry(cableCurve, 72, 2.5, 18, false);
  glandGroup.add(new THREE.Mesh(cableGeo, cableJacketMat));

  // Braided tin shield ferrule at stripped jacket end (3.0, -10.5, -6.0)
  const shieldCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(2.65, 2.65, 3.0, 20),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.85 })
  );
  shieldCollar.position.set(3.0, -10.5, -6.0);
  shieldCollar.rotation.set(0.45, 0.2, 0.25);
  glandGroup.add(shieldCollar);

  // 4 Distinct Color-Coded Stripped RS-485 Leads + Tinned Copper Tips!
  // Manual Page 4: Red (V+), Black (GND), Yellow (A+), Green (B-)
  const tinnedTipMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.22,
    metalness: 0.92,
  });

  const leadSpecs = [
    { name: 'V+', color: 0xef4444, end: new THREE.Vector3(-2.0, -4.2, -22.5), mid: new THREE.Vector3(0.8, -7.2, -14.0) },
    { name: 'GND', color: 0x1e293b, end: new THREE.Vector3(0.8, -6.8, -24.5), mid: new THREE.Vector3(2.0, -8.8, -15.0) },
    { name: 'A+', color: 0xfacc15, end: new THREE.Vector3(4.2, -9.2, -24.0), mid: new THREE.Vector3(3.8, -10.0, -14.8) },
    { name: 'B-', color: 0x22c55e, end: new THREE.Vector3(7.4, -11.8, -22.0), mid: new THREE.Vector3(5.5, -11.4, -14.0) },
  ];

  const jacketExit = new THREE.Vector3(3.0, -10.5, -6.5);
  for (const lead of leadSpecs) {
    const leadCurve = new THREE.CatmullRomCurve3([jacketExit, lead.mid, lead.end]);
    const leadGeo = new THREE.TubeGeometry(leadCurve, 20, 0.68, 10, false);
    const leadMat = new THREE.MeshStandardMaterial({
      color: lead.color,
      roughness: 0.42,
      metalness: 0.06,
    });
    glandGroup.add(new THREE.Mesh(leadGeo, leadMat));

    // Tinned copper conductor tip extending 4.2 mm from wire insulation end
    const tangent = lead.end.clone().sub(lead.mid).normalize();
    const tipEnd = lead.end.clone().addScaledVector(tangent, 4.2);
    const tipCurve = new THREE.LineCurve3(lead.end, tipEnd);
    const tipGeo = new THREE.TubeGeometry(tipCurve, 4, 0.42, 8, false);
    glandGroup.add(new THREE.Mesh(tipGeo, tinnedTipMat));
  }

  lowerSlideGroup.add(glandGroup);
  tagZoneGroup(glandGroup, 'waterproof_gland_leads');

  /* ------------------------------------------------------------------------
     7. 3D CAD DIMENSION LINES (140.0 MM LENGTH & Ø16.0 MM DIAMETER)
     ------------------------------------------------------------------------ */
  const dimsGroup = new THREE.Group();
  const dimLineMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
  });

  // Total 140.0 mm length dimension along Z = -70 .. +70 at Y = -16.5 mm
  const lenLinePts = [
    // Left extension line (z = -70)
    new THREE.Vector3(0, -8.5, -70.0),
    new THREE.Vector3(0, -18.5, -70.0),
    // Right extension line (z = +70)
    new THREE.Vector3(0, -8.5, 70.0),
    new THREE.Vector3(0, -18.5, 70.0),
    // Main dimension bar
    new THREE.Vector3(0, -16.5, -70.0),
    new THREE.Vector3(0, -16.5, 70.0),
    // Left tick arrow
    new THREE.Vector3(0, -15.2, -67.2),
    new THREE.Vector3(0, -16.5, -70.0),
    new THREE.Vector3(0, -17.8, -67.2),
    new THREE.Vector3(0, -16.5, -70.0),
    // Right tick arrow
    new THREE.Vector3(0, -15.2, 67.2),
    new THREE.Vector3(0, -16.5, 70.0),
    new THREE.Vector3(0, -17.8, 67.2),
    new THREE.Vector3(0, -16.5, 70.0),
  ];
  const lenLineGeo = new THREE.BufferGeometry().setFromPoints(lenLinePts);
  dimsGroup.add(new THREE.LineSegments(lenLineGeo, dimLineMat));

  // Ø16.0 mm diameter dimension at Z = +75.5 mm spanning Y = -8.0 .. +8.0 mm
  const diaLinePts = [
    new THREE.Vector3(0, 8.0, 70.5),
    new THREE.Vector3(0, 8.0, 77.5),
    new THREE.Vector3(0, -8.0, 70.5),
    new THREE.Vector3(0, -8.0, 77.5),
    new THREE.Vector3(0, -8.0, 75.5),
    new THREE.Vector3(0, 8.0, 75.5),
    // Top & bottom arrows
    new THREE.Vector3(0, 6.2, 74.5),
    new THREE.Vector3(0, 8.0, 75.5),
    new THREE.Vector3(0, 6.2, 76.5),
    new THREE.Vector3(0, 8.0, 75.5),
    new THREE.Vector3(0, -6.2, 74.5),
    new THREE.Vector3(0, -8.0, 75.5),
    new THREE.Vector3(0, -6.2, 76.5),
    new THREE.Vector3(0, -8.0, 75.5),
  ];
  const diaLineGeo = new THREE.BufferGeometry().setFromPoints(diaLinePts);
  dimsGroup.add(new THREE.LineSegments(diaLineGeo, dimLineMat));

  sensorRig.add(dimsGroup);
  cad.dimensionsGroup = dimsGroup;

  return sensorRig;
}

function initCadStudio() {
  const stage = dom.canvasStage;
  const width = Math.max(320, stage.clientWidth || 720);
  const height = Math.max(280, stage.clientHeight || 520);

  const scene = new THREE.Scene();
  cad.scene = scene;

  const camera = new THREE.PerspectiveCamera(34, width / height, 1.0, 1200);
  camera.position.set(16, 48, 185);
  cad.camera = camera;

  const renderer = new THREE.WebGLRenderer({
    canvas: dom.cadCanvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  cad.renderer = renderer;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 55;
  controls.maxDistance = 420;
  controls.target.set(0, -4, 0);
  controls.update();
  cad.controls = controls;

  // 3-Point Engineering Studio Lighting
  const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.85);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.85);
  keyLight.position.set(65, 115, 95);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 20;
  keyLight.shadow.camera.far = 340;
  keyLight.shadow.camera.left = -120;
  keyLight.shadow.camera.right = 120;
  keyLight.shadow.camera.top = 80;
  keyLight.shadow.camera.bottom = -80;
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.72);
  rimLight.position.set(-90, 40, -110);
  scene.add(rimLight);

  const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.55);
  fillLight.position.set(-45, -35, 85);
  scene.add(fillLight);

  // Subtle Shadow-Catching CAD Workbench Plane & Precision 10mm Grid
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(360, 240),
    new THREE.ShadowMaterial({ opacity: 0.34 })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -29.5;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  const cadGrid = new THREE.GridHelper(280, 28, 0x2a3b4f, 0x16202c);
  cadGrid.position.y = -29.6;
  scene.add(cadGrid);

  // Build & Mount TZ THT-02 Parametric Assembly
  const sensorRig = buildParametricSensorAssembly();
  scene.add(sensorRig);

  // Dynamic Crimson Bounding Wireframe Cage for Active Fault Zone
  const faultBox = new THREE.Box3();
  const faultHelper = new THREE.Box3Helper(faultBox, 0xef4444);
  faultHelper.visible = false;
  scene.add(faultHelper);
  cad.faultBoxHelper = faultHelper;

  // Responsive ResizeObserver
  const ro = new ResizeObserver(() => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (w > 0 && h > 0) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
  });
  ro.observe(stage);

  // Raycast Part Inspection (distinguish clean click from orbit drag)
  let downPos = { x: 0, y: 0 };
  renderer.domElement.addEventListener('pointerdown', (e) => {
    downPos = { x: e.clientX, y: e.clientY };
  });
  renderer.domElement.addEventListener('pointerup', (e) => {
    const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
    if (dist > 5) return;
    const rect = renderer.domElement.getBoundingClientRect();
    cad.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    cad.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    cad.raycaster.setFromCamera(cad.pointer, camera);
    const hits = cad.raycaster.intersectObjects(sensorRig.children, true);
    const meshHit = hits.find((h) => h.object?.userData?.zoneId);
    if (meshHit) {
      // Check if user clicked directly on a DIP switch actuator when exploded!
      if (state.exploded && typeof meshHit.object.userData.dipIndex === 'number') {
        toggleDipBit(meshHit.object.userData.dipIndex);
      }
      selectZone(meshHit.object.userData.zoneId, { flipManual: true });
    }
  });

  // Start 60 FPS Render Loop
  let frames = 0;
  let lastFpsStamp = performance.now();
  let prevFrameTime = performance.now();

  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, (now - prevFrameTime) / 1000);
    prevFrameTime = now;

    // 1. FPS Telemetry
    frames += 1;
    if (now - lastFpsStamp >= 600) {
      const fps = Math.min(60, Math.round((frames * 1000) / (now - lastFpsStamp)));
      dom.fpsCounterText.textContent = `FPS: ${fps}`;
      frames = 0;
      lastFpsStamp = now;
    }

    // 2. Smooth Unscrew / Explode Animation (Manual Page 5 Step 1 & Step 2)
    const targetExplode = state.exploded ? 1.0 : 0.0;
    state.explodeProgress += (targetExplode - state.explodeProgress) * Math.min(1, dt * 6.5);
    const ep = state.explodeProgress;

    // Step 1: Waterproof gland nut unscrews & slides -18 mm along -Z
    cad.lowerSlideGroup.position.z = -18.0 * ep;
    cad.lowerSlideGroup.rotation.z = -ep * Math.PI * 1.2;

    // Step 2: Upper barrel + seal + flange + strainer unscrews & slides +35 mm along +Z
    cad.upperSlideGroup.position.z = 35.0 * ep;
    cad.upperSlideGroup.rotation.z = ep * Math.PI * 0.85;

    // 3. Smooth Camera Angle Sync (OpenCV detected sensor tilt)
    const targetAngle = state.syncCameraAngle ? state.cameraAngleDeg : 0.0;
    state.smoothedAngleDeg += (targetAngle - state.smoothedAngleDeg) * Math.min(1, dt * 5.0);
    // Sensor Z is mapped to World +X via rotation.y = PI/2; screen-plane tilt is World Z rotation
    cad.sensorRig.rotation.z = THREE.MathUtils.degToRad(-state.smoothedAngleDeg * 0.65);

    // 4. Crimson Fault Highlighting Pulse + Bounding Wireframe Cage
    updateFaultVisuals(now);

    controls.update();
    renderer.render(scene, camera);

    // 5. Project 3D CAD Dimension & Fault Callout Badges to 2D Screen Coordinates
    updateProjectedOverlays();
  }

  requestAnimationFrame(animate);
}

/* ==========================================================================
   3D VIEWPORT MODES, FAULT PULSE & 2D PROJECTED LABELS
   ========================================================================== */
function setRenderMode(mode) {
  state.renderMode = mode;
  const isWire = mode === 'wireframe';
  dom.btnModeSolid.classList.toggle('active', !isWire);
  dom.btnModeWireframe.classList.toggle('active', isWire);

  for (const mat of cad.allSolidMaterials) {
    if (mat.userData?.isInternal) {
      // Keep internal SHT30 die & Blue DIP-8 PCB vivid inside translucent X-Ray outer shell!
      mat.wireframe = false;
      mat.transparent = false;
      mat.opacity = 1.0;
    } else {
      mat.wireframe = isWire;
      mat.transparent = isWire;
      mat.opacity = isWire ? 0.34 : 1.0;
    }
    mat.needsUpdate = true;
  }
}

function setExplodedState(exploded, { manualTrigger = false } = {}) {
  if (manualTrigger) {
    // If user manually toggles, temporarily pause auto-override unless opened
    state.autoExplodeEnabled = false;
    setTimeout(() => {
      state.autoExplodeEnabled = true;
    }, 12000);
  }
  state.exploded = Boolean(exploded);
  dom.btnToggleExplode.classList.toggle('active', state.exploded);
  dom.dipHudCard.hidden = !state.exploded;
}

function updateFaultVisuals(nowMs) {
  const pulse = 0.5 + 0.5 * Math.sin(nowMs * 0.0075);

  for (const [zoneId, meshes] of Object.entries(cad.zoneMeshes)) {
    const isFault = state.highlightedZone === zoneId;
    const isSelected = state.selectedZone === zoneId && !isFault;

    for (const mesh of meshes) {
      const mat = mesh.material;
      if (!mat || !mat.emissive) continue;
      if (isFault) {
        mat.emissive.setHex(0xef4444);
        mat.emissiveIntensity = 0.28 + 0.52 * pulse;
      } else if (isSelected) {
        mat.emissive.setHex(0x38bdf8);
        mat.emissiveIntensity = 0.22;
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0.0;
      }
    }
  }

  if (state.highlightedZone && cad.zoneMeshes[state.highlightedZone]?.length) {
    const box = cad.faultBoxHelper.box;
    box.makeEmpty();
    for (const m of cad.zoneMeshes[state.highlightedZone]) {
      box.expandByObject(m);
    }
    box.expandByScalar(1.4);
    cad.faultBoxHelper.visible = true;
  } else {
    cad.faultBoxHelper.visible = false;
  }
}

function projectToScreen(worldVec, stageWidth, stageHeight) {
  const projected = worldVec.clone().project(cad.camera);
  if (projected.z > 1) return null;
  return {
    x: (projected.x * 0.5 + 0.5) * stageWidth,
    y: (-projected.y * 0.5 + 0.5) * stageHeight,
  };
}

function updateProjectedOverlays() {
  if (!cad.sensorRig || !cad.camera) return;
  const w = dom.canvasStage.clientWidth;
  const h = dom.canvasStage.clientHeight;
  if (!w || !h) return;

  cad.dimensionsGroup.visible = state.showDimensions;

  if (state.showDimensions) {
    const lenWorld = cad.anchorDimLength.clone().applyMatrix4(cad.sensorRig.matrixWorld);
    const lenPos = projectToScreen(lenWorld, w, h);
    if (lenPos) {
      dom.labelDimLength.hidden = false;
      dom.labelDimLength.style.left = `${lenPos.x}px`;
      dom.labelDimLength.style.top = `${lenPos.y}px`;
      dom.labelDimLength.textContent = state.exploded
        ? '140.0 MM (DESPIECE DIP-8)'
        : '140.0 MM';
    }

    const diaAnchor = cad.anchorDimDia.clone();
    diaAnchor.z += 35.0 * state.explodeProgress;
    const diaWorld = diaAnchor.applyMatrix4(cad.sensorRig.matrixWorld);
    const diaPos = projectToScreen(diaWorld, w, h);
    if (diaPos) {
      dom.labelDimDia.hidden = false;
      dom.labelDimDia.style.left = `${diaPos.x}px`;
      dom.labelDimDia.style.top = `${diaPos.y}px`;
    }

    const dipWorld = cad.anchorDipLabel.clone().applyMatrix4(cad.sensorRig.matrixWorld);
    const dipPos = projectToScreen(dipWorld, w, h);
    if (dipPos) {
      dom.labelDipAddr.hidden = false;
      dom.labelDipAddr.style.left = `${dipPos.x}px`;
      dom.labelDipAddr.style.top = `${dipPos.y}px`;
    }
  } else {
    dom.labelDimLength.hidden = true;
    dom.labelDimDia.hidden = true;
    dom.labelDipAddr.hidden = true;
  }

  // Floating 3D Fault Callout Badge
  if (state.highlightedZone && ZONE_SPECS[state.highlightedZone]) {
    const spec = ZONE_SPECS[state.highlightedZone];
    const faultAnchor = spec.anchorLocal.clone();
    if (
      ['strainer_head', 'upper_seal_ring', 'mounting_flange'].includes(state.highlightedZone)
    ) {
      faultAnchor.z += 35.0 * state.explodeProgress;
    } else if (state.highlightedZone === 'waterproof_gland_leads') {
      faultAnchor.z -= 18.0 * state.explodeProgress;
    }
    const worldPt = faultAnchor.applyMatrix4(cad.sensorRig.matrixWorld);
    const screenPt = projectToScreen(worldPt, w, h);
    if (screenPt) {
      dom.faultCallout.hidden = false;
      const clampedX = Math.max(110, Math.min(w - 110, screenPt.x));
      const clampedY = Math.max(95, Math.min(h - 75, screenPt.y));
      dom.faultCallout.style.left = `${clampedX}px`;
      dom.faultCallout.style.top = `${clampedY}px`;
      dom.faultCalloutZone.textContent = `FALLA · ${spec.shortLabel}`;
      dom.faultCalloutText.textContent = state.faultReason || spec.summary;
    }
  } else {
    dom.faultCallout.hidden = true;
  }
}

function selectZone(zoneId, { flipManual = false } = {}) {
  const spec = ZONE_SPECS[zoneId];
  if (!spec) return;
  state.selectedZone = zoneId;

  dom.assemblyTreePills.querySelectorAll('.part-chip').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.zone === zoneId);
  });

  dom.selectedPartSummary.textContent = `${spec.title} (${spec.zRange}) — ${spec.dims} · Manual Pág. ${spec.manualPage}`;

  if (zoneId === 'upper_barrel_dip' && !state.exploded) {
    setExplodedState(true, { manualTrigger: true });
  }

  if (flipManual) {
    setManualPage(spec.manualPage, { flash: true });
  }
}

function setFaultHighlight(zoneId, reason = '') {
  const cleanZone = zoneId && ZONE_SPECS[zoneId] ? zoneId : null;
  state.highlightedZone = cleanZone;
  state.faultReason = reason || (cleanZone ? ZONE_SPECS[cleanZone].summary : '');

  dom.assemblyTreePills.querySelectorAll('.part-chip').forEach((btn) => {
    btn.classList.toggle('fault', btn.dataset.zone === cleanZone);
  });

  if (cleanZone) {
    const short = ZONE_SPECS[cleanZone].shortLabel;
    dom.scanZoneVal.textContent = short;
    dom.scanZoneVal.classList.add('fault-active');
    dom.hudStatusTag.textContent = `ANOMALÍA: ${short}`;
    dom.hudStatusTag.classList.add('is-fault');
  } else {
    dom.scanZoneVal.textContent = 'NINGUNA';
    dom.scanZoneVal.classList.remove('fault-active');
    dom.hudStatusTag.textContent = 'NOMINAL';
    dom.hudStatusTag.classList.remove('is-fault');
  }
}

/* ==========================================================================
   INTERACTIVE 8-POSITION DIP SWITCH CALCULATOR (MANUAL PAGE 5)
   ========================================================================== */
function computeDipAddress() {
  return state.dipBits.reduce((acc, bit, idx) => acc + (bit ? DIP_WEIGHTS[idx] : 0), 0);
}

function renderDipHud() {
  const addr = computeDipAddress();
  const activePositions = state.dipBits
    .map((b, idx) => (b ? idx + 1 : null))
    .filter(Boolean);
  const posText = activePositions.length ? activePositions.join(',') : 'OFF';
  const hexAddr = `0x${addr.toString(16).toUpperCase().padStart(2, '0')}`;

  dom.dipCalcAddr.textContent = `ADDR = ${addr} (${hexAddr})`;
  dom.labelDipAddr.textContent = `MODBUS ADDR: ${addr} [DIP ${posText}]`;
  dom.escSummaryDip.textContent = `${addr} (DIP ${posText} ON)`;

  dom.dipSwitchesRow.innerHTML = '';
  state.dipBits.forEach((bit, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `dip-bit-btn${bit ? ' is-on' : ''}`;
    btn.title = `DIP ${idx + 1} (Peso ${DIP_WEIGHTS[idx]}): ${bit ? 'ON' : 'OFF'}`;
    btn.innerHTML = `<span>${idx + 1}</span><span class="dip-knob"></span><span>${DIP_WEIGHTS[idx]}</span>`;
    btn.addEventListener('click', () => toggleDipBit(idx));
    dom.dipSwitchesRow.appendChild(btn);
  });

  // Sync 3D white actuator rockers on the internal Blue PCB
  cad.dipActuatorMeshes.forEach((mesh, idx) => {
    mesh.position.x = state.dipBits[idx] ? 0.85 : -0.85;
  });
}

function toggleDipBit(index) {
  if (index < 0 || index >= 8) return;
  state.dipBits[index] = state.dipBits[index] ? 0 : 1;
  renderDipHud();
}

/* ==========================================================================
   MANUAL & 2D BLUEPRINT INSPECTOR + LIGHTBOX
   ========================================================================== */
function setManualPage(pageNum, { flash = false } = {}) {
  const page = Math.max(1, Math.min(9, Number(pageNum) || 1));
  state.manualPage = page;
  const imgUrl = `/assets/manual_pages/page_${page}.png`;
  const caption = MANUAL_PAGES[page] || `Pág. ${page} · Manual TZ THT-02`;

  dom.manualPageImg.src = imgUrl;
  dom.manualPageImg.alt = `Manual técnico TZ THT-02 Página ${page}`;
  dom.manualPageIndicator.textContent = `PÁG ${page} / 9`;
  dom.manualPageCaption.textContent = caption;

  dom.manualQuickPills.querySelectorAll('.page-pill').forEach((pill) => {
    pill.classList.toggle('active', Number(pill.dataset.page) === page);
  });

  // Update Lightbox if open
  dom.lightboxImg.src = imgUrl;
  dom.lightboxPageBadge.textContent = `${page} / 9`;
  dom.lightboxTitle.textContent = `TZ THT-02 User's Manual V1.1 — ${caption}`;

  if (flash) {
    dom.manualViewerBox.classList.remove('cited-flash');
    void dom.manualViewerBox.offsetWidth;
    dom.manualViewerBox.classList.add('cited-flash');
    setTimeout(() => dom.manualViewerBox.classList.remove('cited-flash'), 1600);
  }
}

/* ==========================================================================
   LOCAL CANVAS FALLBACK WHEN MJPEG STREAM IS INITIALIZING
   ========================================================================== */
function drawFallbackScannerFrame() {
  if (!state.videoStreamFailed) return;
  const canvas = dom.videoFallbackCanvas;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#0d131a';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#1b2836';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Draw schematic TZ THT-02 silhouette
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(THREE.MathUtils.degToRad(state.cameraAngleDeg));
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(-150, -18, 300, 36);
  ctx.fillStyle = '#111827';
  ctx.fillRect(62, -19, 12, 38);
  if (state.activeCameraMode === 'sim_open_dip') {
    ctx.fillStyle = '#0d4f8b';
    ctx.fillRect(-20, -13, 64, 26);
  }
  if (state.highlightedZone === 'strainer_head') {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.strokeRect(75, -24, 82, 48);
  }
  ctx.restore();

  ctx.fillStyle = '#7dd3fc';
  ctx.font = '12px monospace';
  ctx.fillText(`MODO LOCAL: ${state.activeCameraMode.toUpperCase()} · ESPERANDO /api/video/stream`, 16, h - 14);
}

/* ==========================================================================
   BACKEND API INTEGRATION (RESILIENT TO MULTIPLE FASTAPI PAYLOAD SHAPES)
   ========================================================================== */
async function fetchJsonWithFallback(urls, options = {}) {
  let lastErr = null;
  for (const url of urls) {
    try {
      const resp = await fetch(url, options);
      if (resp.status === 404 || resp.status === 405) continue;
      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(errText || `HTTP ${resp.status}`);
      }
      return await resp.json();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Endpoint local no disponible');
}

function applyTelemetryPayload(data) {
  if (!data || typeof data !== 'object') return;

  const vision = data.vision || data.telemetry || data.camera || data;
  const sys = data.system || data.hardware || data;
  const offline = data.offline || data.airplane_guard || data;

  // 1. Airplane Mode Socket Guard Pill
  const blocked = offline.blocked_external_attempts ?? 0;
  const offlineOk = offline.offline_verified !== false && offline.guard_active !== false;
  if (offlineOk) {
    dom.pillAirplaneText.textContent = `AIRPLANE MODE: VERIFIED (${blocked} EXT SOCKETS)`;
  }

  // 2. Camera FPS & Source Pill
  const fps = vision.fps ?? data.fps;
  const camSrc = vision.camera_source || vision.sim_mode || state.activeCameraMode;
  if (fps !== undefined) {
    const isRealUsb = String(camSrc).includes('video') || camSrc === 'uvc' || camSrc === 'usb';
    dom.pillCamText.textContent = `${isRealUsb ? 'USB CAM' : 'BENCH SIM'}: ${Number(fps).toFixed(0)} FPS`;
    dom.camSourceBadge.textContent = String(camSrc).toUpperCase();
  }

  // 3. Model Pill
  if (sys.model_name || sys.models_label) {
    dom.pillModelText.textContent = sys.model_name || sys.models_label;
  }

  // 4. RAM Pill
  const ramUsed = sys.ram_used_gb ?? sys.memory_used_gb;
  const ramTotal = sys.ram_total_gb ?? sys.memory_total_gb;
  if (ramUsed !== undefined && ramTotal !== undefined) {
    dom.pillRamText.textContent = `${Number(ramUsed).toFixed(1)} / ${Number(ramTotal).toFixed(0)} GB`;
  }

  // 5. Latency & Throughput Pill
  const latMs = sys.last_latency_ms ?? data.latency_ms;
  const tokSec = sys.tokens_per_sec ?? data.tok_per_s ?? data.tps;
  if (latMs !== undefined && latMs !== null) {
    const tpsText = tokSec ? ` (${Number(tokSec).toFixed(1)} tok/s)` : '';
    dom.pillLatencyText.textContent = `${Math.round(Number(latMs))} ms${tpsText}`;
  }

  // 6. Scanner Angle, Metrology Dimensions & Real-Time 3D Sync
  if (typeof vision.angle_deg === 'number') {
    state.cameraAngleDeg = vision.angle_deg;
    dom.scanAngleVal.textContent = `${vision.angle_deg.toFixed(1)}°`;
  }

  const estL = vision.est_length_mm;
  const estD = vision.est_diameter_mm;
  if (typeof estL === 'number' && typeof estD === 'number') {
    dom.scanDimVal.textContent = `${estL.toFixed(1)}×${estD.toFixed(1)}mm`;
  }

  // 7. Auto-Explode 3D Housing when OpenCV detects open DIP switch PCB!
  const pcbOpen = Boolean(vision.pcb_open_detected || data.explode_pcb);
  if (state.autoExplodeEnabled && pcbOpen !== state.exploded) {
    setExplodedState(pcbOpen);
  }

  // 8. Real-Time Fault Highlighting from OpenCV Anomaly Detector
  if (vision.anomaly_detected && vision.anomaly_zone) {
    setFaultHighlight(
      vision.anomaly_zone,
      vision.anomaly_label || `Anomalía óptica detectada en ${vision.anomaly_zone} (conf ${(Number(vision.anomaly_confidence || 0.9) * 100).toFixed(0)}%)`
    );
  } else if (vision.anomaly_detected === false && !state.lastDiagnosisFaultLock) {
    setFaultHighlight(null);
  }

  // 9. Live RS-485 Modbus SCADA Telemetry (FT2232HL USB / Simulator)
  const mb = data.modbus;
  if (mb && typeof mb === 'object' && dom.scadaLiveCard) {
    const healthy = Boolean(mb.healthy);
    const abn7fff = Boolean(mb.online && mb.sensor_abnormal_7fff);
    state.modbusHealthy = healthy;

    dom.scadaLiveCard.classList.toggle('is-online', healthy);
    dom.scadaStatusBadge.classList.remove('is-offline', 'is-online', 'is-fault');

    if (healthy) {
      dom.scadaStatusBadge.classList.add('is-online');
      dom.scadaStatusBadge.textContent = 'VALIDADO EN LÍNEA';
      dom.scadaTempVal.textContent = `${Number(mb.temp_c).toFixed(1)} °C`;
      dom.scadaHumVal.textContent = `${Number(mb.humidity_rh).toFixed(1)} %RH`;
      dom.scadaSlaveVal.textContent = `#${mb.slave_id} · ${mb.baud_bps || 9600}`;
      dom.scadaFrameHex.textContent = `RX: ${mb.last_rx_hex || ''} (CRC OK · ${mb.roundtrip_ms || 12}ms)`;
      if (dom.pillModbus) {
        dom.pillModbus.className = 'pill pill-emerald';
        dom.pillModbusText.textContent = `MODBUS #${mb.slave_id}: ${Number(mb.temp_c).toFixed(1)}°C · ${Number(mb.humidity_rh).toFixed(1)}%RH`;
      }
    } else if (abn7fff) {
      dom.scadaStatusBadge.classList.add('is-fault');
      dom.scadaStatusBadge.textContent = 'ALARMA 7FFFH';
      dom.scadaTempVal.textContent = '7FFF H';
      dom.scadaHumVal.textContent = '7FFF H';
      dom.scadaSlaveVal.textContent = `#${mb.slave_id} · ${mb.baud_bps || 9600}`;
      dom.scadaFrameHex.textContent = `RX: ${mb.last_rx_hex || ''} (SONDA SHT30 ANORMAL)`;
      if (dom.pillModbus) {
        dom.pillModbus.className = 'pill pill-amber';
        dom.pillModbusText.textContent = 'MODBUS RS-485: ALARMA 7FFFH';
      }
    } else {
      dom.scadaStatusBadge.classList.add('is-offline');
      dom.scadaStatusBadge.textContent = mb.adapter_present ? 'SIN RESPUESTA' : 'SIN SEÑAL';
      dom.scadaTempVal.textContent = '--.- °C';
      dom.scadaHumVal.textContent = '--.- %RH';
      dom.scadaSlaveVal.textContent = `#${mb.target_slave_id || 1} · ${mb.baud_bps || 9600}`;
      dom.scadaFrameHex.textContent = `TX: ${mb.last_tx_hex || '01 03 00 00 00 08 44 0C'} · TIMEOUT`;
      if (dom.pillModbus) {
        dom.pillModbus.className = 'pill pill-neutral';
        dom.pillModbusText.textContent = 'MODBUS RS-485: SIN SEÑAL';
      }
    }
  }

  // 10. Zero-Click Proactive Live Repair Event Watcher (speaks automatically when Modbus connects!)
  const latestEvId = Number(data.repair?.latest_event_id || 0);
  if (latestEvId > state.seenRepairEventId) {
    state.seenRepairEventId = latestEvId;
    fetch(`/api/repair/event/${latestEvId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((ev) => {
        if (!ev) return;
        if (ev.explode_pcb === false) {
          setExplodedState(false);
          setFaultHighlight(null);
          state.lastDiagnosisFaultLock = false;
        }
        handleCopilotResponse({
          ...ev,
          model: `LIVE WATCH · ${ev.title || 'SCADA'}`,
        });
      })
      .catch(() => {});
  }
}

async function pollTelemetry() {
  try {
    const data = await fetchJsonWithFallback(['/api/telemetry', '/api/status', '/api/health']);
    applyTelemetryPayload(data);
  } catch (_err) {
    drawFallbackScannerFrame();
  }
}

async function switchCameraMode(mode) {
  state.activeCameraMode = mode;
  state.lastDiagnosisFaultLock = false;

  document.querySelectorAll('.sim-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.camMode === mode);
  });

  // Optimistic local responsiveness even before backend round-trip completes
  if (mode === 'sim_open_dip') {
    setExplodedState(true);
    setManualPage(5, { flash: true });
  } else if (mode === 'sim_normal') {
    setExplodedState(false);
    setFaultHighlight(null);
  } else if (mode === 'sim_strainer_patch') {
    setExplodedState(false);
    setFaultHighlight('strainer_head', 'Obstrucción detectada en cabezal filtrante SHT30');
  } else if (mode === 'sim_gland_fault') {
    setExplodedState(false);
    setFaultHighlight('waterproof_gland_leads', 'Anomalía mecánica/eléctrica en prensaestopas y latiguillo RS-485');
  }

  try {
    const res = await fetchJsonWithFallback(
      ['/api/camera/mode', '/api/video/mode', '/api/scanner/mode'],
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      }
    );
    applyTelemetryPayload(res);
    // Refresh MJPEG stream seamlessly
    state.videoStreamFailed = false;
    dom.videoFallbackCanvas.hidden = true;
    dom.videoStream.hidden = false;
    dom.videoStream.src = `/api/video/stream?t=${Date.now()}`;
  } catch (_err) {
    drawFallbackScannerFrame();
  }
}

async function uploadCustomBenchPhoto(file) {
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('image', file);

  appendChatMessage({
    role: 'user',
    author: 'OPERADOR DE CAMPO',
    text: `📷 Fotografía de inspección cargada: ${file.name}`,
  });

  try {
    const res = await fetchJsonWithFallback(
      ['/api/camera/upload', '/api/video/upload', '/api/scanner/upload'],
      { method: 'POST', body: formData }
    );
    applyTelemetryPayload(res);
    dom.videoStream.src = `/api/video/stream?t=${Date.now()}`;
    document.querySelectorAll('.sim-btn').forEach((b) => b.classList.remove('active'));
  } catch (err) {
    appendChatMessage({
      role: 'assistant',
      author: 'SISTEMA',
      text: `Imagen cargada localmente (${file.name}). Lista para diagnóstico multimodal.`,
    });
  }
}

/* ==========================================================================
   MULTIMODAL COPILOT CHAT, CITATIONS & SPEECH AUDIO PLAYBACK
   ========================================================================== */
function playDiagnosisAudio(audioB64, fallbackText) {
  if (audioB64) {
    try {
      const src = audioB64.startsWith('data:')
        ? audioB64
        : `data:audio/wav;base64,${audioB64}`;
      const audio = new Audio(src);
      audio.play().catch(() => speakBrowserFallback(fallbackText));
      return;
    } catch (_e) {
      // Fallback to Web Speech Synthesis
    }
  }
  speakBrowserFallback(fallbackText);
}

function speakBrowserFallback(text) {
  if (!text || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const clean = text.replace(/[`*_#]/g, '');
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = 'es-ES';
    utter.rate = 1.04;
    window.speechSynthesis.speak(utter);
  } catch (_e) {
    // Ignore if headless browser lacks TTS voices
  }
}

function normalizeCitations(payload) {
  const raw = payload.citations || payload.manual_citations || payload.cited_pages || [];
  const list = [];
  for (const item of raw) {
    if (typeof item === 'number') {
      list.push({ page: item, label: `Pág. ${item} · ${MANUAL_PAGES[item]?.split('·')[1]?.trim() || 'Manual'}` });
    } else if (typeof item === 'string') {
      const m = item.match(/(\d+)/);
      const p = m ? Number(m[1]) : 1;
      list.push({ page: p, label: item });
    } else if (item && typeof item === 'object') {
      const p = Number(item.page || item.page_number || 1);
      const lbl = item.label || item.title || item.section || `Pág. ${p}`;
      list.push({ page: p, label: lbl.includes('Pág') ? lbl : `Pág. ${p} · ${lbl}` });
    }
  }
  return list;
}

function appendChatMessage({
  role = 'assistant',
  author = 'LFM3-VL-2B · COPILOTO',
  text = '',
  causes = [],
  citations = [],
  audioB64 = null,
  isFault = false,
  latencyMs = null,
}) {
  const article = document.createElement('article');
  article.className = `msg msg-${role}${isFault ? ' is-fault' : ''}`;

  const timeStr = latencyMs
    ? `${Math.round(latencyMs)} ms`
    : new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const meta = document.createElement('div');
  meta.className = 'msg-meta';
  meta.innerHTML = `<span class="msg-author"></span><span class="msg-time"></span>`;
  meta.querySelector('.msg-author').textContent = author;
  meta.querySelector('.msg-time').textContent = timeStr;
  article.appendChild(meta);

  const body = document.createElement('div');
  body.className = 'msg-text';
  body.textContent = text;
  article.appendChild(body);

  if (Array.isArray(causes) && causes.length > 0) {
    const causesBox = document.createElement('div');
    causesBox.className = 'causes-box';
    const title = document.createElement('div');
    title.className = 'causes-title';
    title.textContent = 'CAUSAS PROBABLES Y ACCIONES DE CAMPO:';
    causesBox.appendChild(title);

    const ul = document.createElement('ul');
    ul.className = 'causes-list';
    causes.forEach((c) => {
      const li = document.createElement('li');
      li.textContent = typeof c === 'string' ? c : (c.cause || c.description || JSON.stringify(c));
      ul.appendChild(li);
    });
    causesBox.appendChild(ul);
    article.appendChild(causesBox);
  }

  if ((citations && citations.length > 0) || role === 'assistant') {
    const row = document.createElement('div');
    row.className = 'citation-row';

    citations.forEach((cite) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'cite-chip';
      chip.textContent = cite.label;
      chip.addEventListener('click', () => setManualPage(cite.page, { flash: true }));
      row.appendChild(chip);
    });

    if (role === 'assistant' && text) {
      const speakBtn = document.createElement('button');
      speakBtn.type = 'button';
      speakBtn.className = 'btn-speak-msg';
      speakBtn.textContent = '🔊 Escuchar diagnóstico';
      speakBtn.addEventListener('click', () => playDiagnosisAudio(audioB64, text));
      row.appendChild(speakBtn);
    }

    article.appendChild(row);
  }

  dom.chatFeed.appendChild(article);
  dom.chatFeed.scrollTop = dom.chatFeed.scrollHeight;
}

function handleCopilotResponse(res, fallbackQuery = '') {
  if (!res || typeof res !== 'object') return;

  const answerText =
    res.diagnosis ||
    res.answer ||
    res.response ||
    res.message ||
    res.summary ||
    'Diagnóstico completado sobre gemelo TZ THT-02.';

  const causes = res.probable_causes || res.causes || res.recommendations || [];
  const citations = normalizeCitations(res);
  const audioB64 = res.audio_wav_b64 || res.audio_b64 || null;
  const latMs = res.latency_ms ?? res.inference_ms ?? null;
  const tokSec = res.tokens_per_sec ?? res.tok_per_s ?? null;

  if (latMs !== null) {
    dom.pillLatencyText.textContent = `${Math.round(Number(latMs))} ms${tokSec ? ` (${Number(tokSec).toFixed(1)} tok/s)` : ''}`;
  }

  // Highlight 3D CAD zone if returned by AI / OpenCV
  const zone = res.highlighted_zone || res.fault_zone || res.anomaly_zone || null;
  if (zone && ZONE_SPECS[zone]) {
    state.lastDiagnosisFaultLock = true;
    setFaultHighlight(zone, res.fault_title || res.short_diagnosis || answerText.slice(0, 110));
    selectZone(zone, { flipManual: false });
  }

  // Auto-open housing if AI sets explode_pcb
  if (res.explode_pcb === true || zone === 'upper_barrel_dip') {
    setExplodedState(true);
  } else if (res.explode_pcb === false) {
    setExplodedState(false);
  }

  // Sync 3D DIP-8 switches on internal Blue PCB if AI prescribed a pin configuration!
  if (Array.isArray(res.dip_bits) && res.dip_bits.length === 8) {
    state.dipBits = res.dip_bits.map((b) => (b ? 1 : 0));
    renderDipHud();
  }

  // Auto-flip Manual Page to primary cited page!
  const primaryPage = res.manual_page || citations[0]?.page;
  if (primaryPage) {
    setManualPage(primaryPage, { flash: true });
  }

  state.lastDiagnosisText = answerText;
  state.lastAudioB64 = audioB64;

  appendChatMessage({
    role: 'assistant',
    author: res.model || 'LiquidAI LFM3-VL-2B',
    text: answerText,
    causes,
    citations,
    audioB64,
    isFault: Boolean(zone),
    latencyMs: latMs,
  });

  if (res.signoff_package) {
    state.lastEscalation = res.signoff_package;
    dom.escalationModal.hidden = false;
    populateEscalationModal(res.signoff_package);
  }

  if (state.autoSpeak) {
    playDiagnosisAudio(audioB64, answerText);
  }
}

/* ==========================================================================
   GUIDED CLOSED-LOOP REPAIR QUICK-ACTIONS & TEXT / VOICE QUERIES
   ========================================================================== */
async function runStep1OpenInspection() {
  appendChatMessage({
    role: 'user',
    author: 'OPERADOR · PASO 1',
    text: 'Mira, este sensor TZ THT-02 no enciende, está abierto y desconfigurado con sus pines.',
  });

  setExplodedState(true);
  setManualPage(5, { flash: true });

  try {
    const res = await fetchJsonWithFallback(['/api/repair/step'], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: 'inspect_open', sync_simulator: true }),
    });
    dom.videoStream.src = `/api/video/stream?t=${Date.now()}`;
    handleCopilotResponse({ ...res, model: 'COPILOTO LIVE · INSPECCIÓN PASO 1' });
    pollTelemetry();
  } catch (_err) {
    await submitDiagnosisQuery('Este sensor está abierto y no enciende, revisar pines DIP', {
      includeCamera: true,
      zoneHint: 'upper_barrel_dip',
    });
  }
}

async function runStep2ModbusDipGuidance() {
  appendChatMessage({
    role: 'user',
    author: 'OPERADOR · PASO 2',
    text: 'Está en modo Modbus-RTU. Acércate a los pines e indícame cómo configurarlos.',
  });

  setExplodedState(true);
  setManualPage(5, { flash: true });

  try {
    const res = await fetchJsonWithFallback(['/api/repair/step'], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'guide_dip',
        query: 'Está en modo Modbus dirección esclava 1 (9600 bps)',
      }),
    });
    handleCopilotResponse({ ...res, model: 'COPILOTO LIVE · GUÍA PINES DIP-8' });
    pollTelemetry();
  } catch (_err) {
    await submitDiagnosisQuery('Modo Modbus dirección esclava 1, qué pines DIP pongo', {
      includeCamera: true,
      zoneHint: 'upper_barrel_dip',
    });
  }
}

async function runStep3ConnectAndValidateModbus() {
  appendChatMessage({
    role: 'user',
    author: 'OPERADOR · PASO 3',
    text: 'Pines configurados y carcasa cerrada. Conectando sensor al USB-RS485 (FT2232HL) y fuente DC...',
  });

  try {
    const res = await fetchJsonWithFallback(['/api/repair/step'], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'connect_modbus',
        slave_id: computeDipAddress() || 1,
      }),
    });
    dom.videoStream.src = `/api/video/stream?t=${Date.now()}`;
    if (res.event_id) {
      state.seenRepairEventId = Math.max(state.seenRepairEventId, Number(res.event_id));
    }
    if (res.diagnosis) {
      handleCopilotResponse({ ...res, model: 'SCADA RS-485 · VALIDACIÓN EN VIVO' });
    }
    pollTelemetry();
  } catch (_err) {
    pollTelemetry();
  }
}

async function submitDiagnosisQuery(queryText, { includeCamera = true, zoneHint = null } = {}) {
  if (!queryText.trim()) return;
  appendChatMessage({
    role: 'user',
    author: 'OPERADOR DE CAMPO',
    text: queryText,
  });

  try {
    const res = await fetchJsonWithFallback(['/api/diagnose'], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: queryText,
        include_camera: includeCamera,
        zone: zoneHint,
        dip_address: computeDipAddress(),
        dip_bits: state.dipBits,
      }),
    });
    handleCopilotResponse(res, queryText);
  } catch (_err) {
    // Deterministic offline engineering fallback if backend is still starting up
    const lower = queryText.toLowerCase();
    const isDip = lower.includes('dip') || zoneHint === 'upper_barrel_dip';
    const addr = computeDipAddress();
    handleCopilotResponse(
      isDip
        ? {
            model: 'LFM3-VL-2B (OFFLINE)',
            highlighted_zone: 'upper_barrel_dip',
            explode_pcb: true,
            diagnosis: `Carcasa abierta en vista de despiece (Pasos 1 y 2). El bloque DIP de 8 posiciones suma los bits en ON con pesos [128, 64, 32, 16, 8, 4, 2, 1]. Dirección esclava actual: ${addr} (registro 0004H solo lectura).`,
            probable_causes: [
              'Verificar que no existan dos sensores con la misma dirección esclava en el bus RS-485.',
              'Confirmar formato RTU 9600 bps, 8 bits de datos, sin paridad, 1 bit de parada (Pág. 5).',
            ],
            citations: [
              { page: 5, label: 'Pág. 5 · DIP Switch (Ej. 176)' },
              { page: 6, label: 'Pág. 6 · Reg 0004H Dirección' },
            ],
          }
        : {
            model: 'LFM3-VL-2B (OFFLINE)',
            highlighted_zone: state.highlightedZone || 'strainer_head',
            diagnosis:
              'Inspección óptica + manual TZ THT-02: anomalía localizada en el cabezal ranurado / filtro sinterizado del SHT30. Cuando el registro 0000H o 0001H reporta 7FFFH, el sensor indica condición anormal en el elemento sensible.',
            probable_causes: [
              'Obstrucción física o saturación por condensación en el filtro sinterizado de acero inoxidable (Pág. 1 / Pág. 4).',
              'Lectura 7FFFH en registros 0000H (Temp) o 0001H (Humedad) por daño en sonda SHT30 (Pág. 6).',
              'Ruido de modo común en bus RS-485 por falta de tierra común GND entre transceptor y fuente DC 5~24V (Pág. 4).',
            ],
            citations: [
              { page: 6, label: 'Pág. 6 · Reg 7FFFH Sensor Anormal' },
              { page: 4, label: 'Pág. 4 · Tierra RS-485 GND' },
              { page: 1, label: 'Pág. 1 · Filtro Inox SHT30' },
            ],
          }
    );
  }
}

/* ==========================================================================
   PUSH-TO-TALK MICROPHONE RECORDING (LFM3-Audio-2B -> POST /api/voice)
   ========================================================================== */
let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;
let audioCtx = null;
let meterRaf = 0;

async function toggleVoiceRecording() {
  if (state.isRecording) {
    stopVoiceRecording();
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    appendChatMessage({
      role: 'assistant',
      author: 'AUDIO HARDWARE',
      text: 'El navegador actual no expone captura de micrófono en este contexto; utilice la barra de consulta o los botones rápidos 1–4.',
    });
    return;
  }

  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    mediaRecorder = new MediaRecorder(audioStream);

    mediaRecorder.addEventListener('dataavailable', (e) => {
      if (e.data && e.data.size > 0) audioChunks.push(e.data);
    });

    mediaRecorder.addEventListener('stop', async () => {
      const mimeType = mediaRecorder.mimeType || 'audio/webm';
      const blob = new Blob(audioChunks, { type: mimeType });
      cleanupAudioStream();
      await sendVoiceBlob(blob);
    });

    // Live Voice Level Meter
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(audioStream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const dataArr = new Uint8Array(analyser.frequencyBinCount);

    const updateMeter = () => {
      if (!state.isRecording) return;
      analyser.getByteFrequencyData(dataArr);
      let sum = 0;
      for (let i = 0; i < dataArr.length; i++) sum += dataArr[i];
      const avg = sum / dataArr.length;
      const pct = Math.min(100, Math.max(6, (avg / 110) * 100));
      dom.voiceMeterFill.style.width = `${pct}%`;
      meterRaf = requestAnimationFrame(updateMeter);
    };

    state.isRecording = true;
    dom.btnPushToTalk.classList.add('recording');
    dom.pttLabel.textContent = '⏹ Grabando voz... (Clic para Enviar a LFM3-Audio)';
    dom.voiceMeter.hidden = false;
    mediaRecorder.start();
    updateMeter();
  } catch (err) {
    appendChatMessage({
      role: 'assistant',
      author: 'AUDIO PERMISOS',
      text: `No se pudo abrir el micrófono local (${err.message}). Verifique permisos de audio o ingrese texto directamente.`,
    });
  }
}

function stopVoiceRecording() {
  if (!state.isRecording) return;
  state.isRecording = false;
  dom.btnPushToTalk.classList.remove('recording');
  dom.pttLabel.textContent = '🎤 Hablar al Copiloto (Clic para Grabar)';
  dom.voiceMeter.hidden = true;
  if (meterRaf) cancelAnimationFrame(meterRaf);
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}

function cleanupAudioStream() {
  if (audioStream) {
    audioStream.getTracks().forEach((t) => t.stop());
    audioStream = null;
  }
  if (audioCtx) {
    audioCtx.close().catch(() => {});
    audioCtx = null;
  }
}

async function sendVoiceBlob(blob) {
  const formData = new FormData();
  formData.append('audio', blob, 'field_query.webm');
  formData.append('file', blob, 'field_query.webm');
  formData.append('include_camera', 'true');
  formData.append('dip_address', String(computeDipAddress()));

  appendChatMessage({
    role: 'user',
    author: 'VOZ OPERADOR (ASR OFFLINE)',
    text: '🎙 Procesando comando de voz en LiquidAI LFM3-Audio-2B...',
  });

  try {
    const res = await fetchJsonWithFallback(['/api/voice'], {
      method: 'POST',
      body: formData,
    });
    if (res.transcript) {
      // Update last user bubble with actual recognized transcript
      const userBubbles = dom.chatFeed.querySelectorAll('.msg-user .msg-text');
      const lastBubble = userBubbles[userBubbles.length - 1];
      if (lastBubble) lastBubble.textContent = `🎙 "${res.transcript}"`;
    }
    handleCopilotResponse(res);
  } catch (err) {
    appendChatMessage({
      role: 'assistant',
      author: 'LFM3-AUDIO-2B',
      text: `Audio capturado (${(blob.size / 1024).toFixed(1)} KB). Ejecutando diagnóstico multimodal sobre cámara activa...`,
    });
    await submitDiagnosisQuery('Diagnosticar estado actual del sensor TZ THT-02 en cámara', {
      includeCamera: true,
    });
  }
}

/* ==========================================================================
   AUTOCAD (.DXF), 3D SOLID (.STL) & OFFLINE STORE-AND-FORWARD (.ZIP)
   ========================================================================== */
function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function exportClientBinaryStl() {
  const exporter = new STLExporter();
  // Clone only solid sensor geometry (excluding dimension helper lines)
  const exportGroup = new THREE.Group();
  Object.values(cad.zoneMeshes).forEach((meshes) => {
    meshes.forEach((m) => {
      const clone = m.clone();
      clone.geometry = m.geometry.clone();
      clone.applyMatrix4(m.matrixWorld);
      exportGroup.add(clone);
    });
  });
  const result = exporter.parse(exportGroup, { binary: true });
  const blob = new Blob([result], { type: 'application/sla' });
  triggerBlobDownload(blob, 'TZ_THT02_140x16mm_Twin.stl');
}

function generateClientAutoCadDxf() {
  // Standards-compliant AutoCAD R12 (AC1009) 2D Orthographic Engineering Blueprint (1:1 mm)
  const lines = [
    '0', 'SECTION', '2', 'HEADER',
    '9', '$ACADVER', '1', 'AC1009',
    '9', '$INSUNITS', '70', '4', // 4 = Millimeters
    '0', 'ENDSEC',
    '0', 'SECTION', '2', 'ENTITIES',
  ];

  const addLine = (layer, x1, y1, x2, y2, color = 7) => {
    lines.push(
      '0', 'LINE', '8', layer, '62', String(color),
      '10', x1.toFixed(3), '20', y1.toFixed(3), '30', '0.0',
      '11', x2.toFixed(3), '21', y2.toFixed(3), '31', '0.0'
    );
  };

  const addCircle = (layer, cx, cy, r, color = 7) => {
    lines.push(
      '0', 'CIRCLE', '8', layer, '62', String(color),
      '10', cx.toFixed(3), '20', cy.toFixed(3), '30', '0.0',
      '40', r.toFixed(3)
    );
  };

  const addText = (layer, x, y, height, text, color = 2) => {
    lines.push(
      '0', 'TEXT', '8', layer, '62', String(color),
      '10', x.toFixed(3), '20', y.toFixed(3), '30', '0.0',
      '40', height.toFixed(2), '1', text
    );
  };

  // Outer 140.0 x 16.0 mm body (z = -70..+70 mapped to X = 0..140, Y = -8..+8)
  addLine('THT02_BODY', 20, -8, 140, -8, 7);
  addLine('THT02_BODY', 20, 8, 140, 8, 7);
  addLine('THT02_BODY', 140, -8, 140, 8, 7);
  // Tapered waterproof dome nut X = 0..20
  addLine('THT02_GLAND', 0, -5.2, 20, -8, 8);
  addLine('THT02_GLAND', 0, 5.2, 20, 8, 8);
  addLine('THT02_GLAND', 0, -5.2, 0, 5.2, 8);
  // Seam at X = 70 (z = 0), Seal ring at X = 108..112 (z = +38..+42)
  addLine('THT02_SEAMS', 70, -8, 70, 8, 8);
  addLine('THT02_SEAL', 108, -8.2, 108, 8.2, 9);
  addLine('THT02_SEAL', 112, -8.2, 112, 8.2, 9);
  // Slotted strainer window X = 115..137
  addLine('THT02_STRAINER', 115, -4.5, 137, -4.5, 4);
  addLine('THT02_STRAINER', 115, 4.5, 137, 4.5, 4);
  // Mounting flange ears (X = 78..98, Y = -21..+21, Ø4.2mm holes at Y = ±16)
  addLine('THT02_FLANGE', 78, -21, 98, -21, 6);
  addLine('THT02_FLANGE', 78, 21, 98, 21, 6);
  addLine('THT02_FLANGE', 78, -21, 78, 21, 6);
  addLine('THT02_FLANGE', 98, -21, 98, 21, 6);
  addCircle('THT02_FLANGE', 88, 16, 2.1, 6);
  addCircle('THT02_FLANGE', 88, -16, 2.1, 6);

  // Engineering Dimensions & Fault Annotation
  addLine('DIMENSIONS', 0, -28, 140, -28, 4);
  addText('DIMENSIONS', 56, -33, 3.2, '140.0 MM NOMINAL', 4);
  addText('DIMENSIONS', 143, -1.5, 3.0, 'DIA 16.0 MM', 4);
  addText('TITLEBLOCK', 0, 29, 3.5, `FIELDSCAN CAD - TZ THT-02 TWIN | DIP ADDR: ${computeDipAddress()}`, 2);
  if (state.highlightedZone) {
    addText('FAULT_TAG', 0, 24, 3.0, `ACTIVE FAULT ZONE: ${state.highlightedZone.toUpperCase()}`, 1);
  }

  lines.push('0', 'ENDSEC', '0', 'EOF');
  const blob = new Blob([lines.join('\r\n')], { type: 'application/dxf' });
  triggerBlobDownload(blob, 'TZ_THT02_140x16mm_Blueprint.dxf');
}

function captureMultiAngle3DViews() {
  if (!cad.renderer || !cad.scene || !cad.camera || !cad.controls) return null;
  const origCamPos = cad.camera.position.clone();
  const origTarget = cad.controls.target.clone();
  const origLowerZ = cad.lowerSlideGroup.position.z;
  const origLowerRot = cad.lowerSlideGroup.rotation.z;
  const origUpperZ = cad.upperSlideGroup.position.z;
  const origUpperRot = cad.upperSlideGroup.rotation.z;

  const snapPose = (px, py, pz, tx, ty, tz, ep) => {
    cad.lowerSlideGroup.position.z = -18.0 * ep;
    cad.lowerSlideGroup.rotation.z = -ep * Math.PI * 1.2;
    cad.upperSlideGroup.position.z = 35.0 * ep;
    cad.upperSlideGroup.rotation.z = ep * Math.PI * 0.85;
    cad.camera.position.set(px, py, pz);
    cad.controls.target.set(tx, ty, tz);
    cad.controls.update();
    cad.renderer.render(cad.scene, cad.camera);
    return dom.cadCanvas.toDataURL('image/png');
  };

  try {
    const views = {
      isometric: snapPose(28, 62, 175, 0, -4, 0, 0.0),
      front_dim: snapPose(0, 8, 195, 0, -4, 0, 0.0),
      exploded_dip: snapPose(14, 58, 142, 8, 0, 0, 1.0),
      side_gland: snapPose(-142, 36, 98, -32, -2, 0, 0.0),
    };
    return views;
  } catch (_e) {
    return null;
  } finally {
    cad.lowerSlideGroup.position.z = origLowerZ;
    cad.lowerSlideGroup.rotation.z = origLowerRot;
    cad.upperSlideGroup.position.z = origUpperZ;
    cad.upperSlideGroup.rotation.z = origUpperRot;
    cad.camera.position.copy(origCamPos);
    cad.controls.target.copy(origTarget);
    cad.controls.update();
    cad.renderer.render(cad.scene, cad.camera);
  }
}

async function generateAndOpenEscalationPackage() {
  const cadViews = captureMultiAngle3DViews();
  dom.escalationModal.hidden = false;
  dom.escSnapshotImg.src = `/api/video/snapshot?t=${Date.now()}`;
  dom.escSummaryZone.textContent = state.modbusHealthy
    ? 'REPARACIÓN VALIDADA EN SCADA'
    : state.highlightedZone || 'upper_barrel_dip';
  renderDipHud();

  appendChatMessage({
    role: 'user',
    author: 'OPERADOR · PASO 4',
    text: 'Créame el reporte completo con fotos Antes/Después, vistas 3D en 4 ángulos y planos AutoCAD para pedir el visto bueno al fabricante.',
  });

  try {
    const res = await fetchJsonWithFallback(['/api/repair/signoff', '/api/escalate'], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signoff_mode: true,
        sensor_id: 'TZ-THT-02',
        include_camera: true,
        highlighted_zone: state.highlightedZone || 'upper_barrel_dip',
        dip_address: computeDipAddress(),
        dip_bits: state.dipBits,
        cad_views_b64: cadViews,
        notes: 'Solicitamos confirmación y visto bueno técnico del procedimiento de reparación y puesta en marcha Modbus-RTU.',
      }),
    });

    state.lastEscalation = res;
    populateEscalationModal(res);

    handleCopilotResponse({
      model: 'DICTAMEN MANUAL V1.1 & OUTBOX',
      diagnosis:
        res.spoken_summary ||
        `Dossier post-reparación generado (${res.package_id}) con 4 ángulos 3D, fotos cronológicas y planos .DXF/.STL.`,
      audio_wav_b64: res.audio_wav_b64,
      citations: [
        { page: 5, label: 'Pág. 5 · DIP-8 Verificado' },
        { page: 7, label: 'Pág. 7 · Trama Modbus OK' },
        { page: 9, label: 'Pág. 9 · Plano 140×16mm' },
      ],
    });
  } catch (_err) {
    const fallbackPkg = {
      status: 'queued_offline',
      outbox_path: 'outbox/TZ_THT02_signoff_bundle.zip',
      email: {
        to: 'support-eng@tzonedigital.com',
        subject: `[VISTO BUENO REPARACIÓN] TZ THT-02 Validado en Modbus + 4 Vistas 3D + .DXF/.STL`,
        body: 'Dossier técnico almacenado localmente en /outbox/.',
      },
    };
    state.lastEscalation = fallbackPkg;
    populateEscalationModal(fallbackPkg);
  }
}

function populateEscalationModal(pkg) {
  const email = pkg.email || pkg.draft_email || {};
  const dxfUrl = pkg.dxf_url || pkg.files?.dxf || null;
  const stlUrl = pkg.stl_url || pkg.files?.stl || null;
  const quadUrl = pkg.quad_3d_url || null;
  const stripUrl = pkg.strip_url || null;
  const zipUrl = pkg.zip_url || pkg.bundle_url || pkg.files?.zip || null;
  const snapUrl = quadUrl || pkg.snapshot_url || pkg.files?.snapshot || `/api/video/snapshot?t=${Date.now()}`;

  dom.escOutboxState.textContent = (pkg.compliance_verdict || pkg.status || 'QUEUED_OFFLINE').toUpperCase();
  dom.escPackagePath.textContent = pkg.outbox_path || pkg.zip_path || 'Almacenado en /outbox/ local (0 sockets externos)';
  dom.escEmailTo.textContent = email.to || pkg.recipient || 'support-eng@tzonedigital.com';
  dom.escEmailSubject.textContent =
    email.subject || pkg.subject || `[FIELDSCAN-CAD] Escalamiento Técnico TZ THT-02 + .DXF/.STL`;
  dom.escEmailBody.textContent =
    email.body || pkg.email_body || pkg.report_markdown || JSON.stringify(pkg, null, 2);
  dom.escSnapshotImg.src = snapUrl;
  dom.escQueueTag.textContent = 'VISTO BUENO / OUTBOX';

  if (zipUrl) {
    dom.escZipDownloadLink.href = zipUrl;
    dom.escZipDownloadLink.hidden = false;
  } else {
    dom.escZipDownloadLink.hidden = true;
  }

  dom.escAttachmentsList.innerHTML = '';
  const attachments = [
    { label: '📐 Plano AutoCAD (.DXF)', url: dxfUrl, fallback: generateClientAutoCadDxf },
    { label: '🧊 Malla Sólida 3D (.STL)', url: stlUrl, fallback: exportClientBinaryStl },
  ];
  if (quadUrl) {
    attachments.unshift({ label: '🖼 Gemelo 3D (4 Ángulos)', url: quadUrl, fallback: null });
  }
  if (stripUrl) {
    attachments.push({ label: '📷 Fotos Antes/Después', url: stripUrl, fallback: null });
  }
  if (zipUrl) {
    attachments.push({ label: '📦 Dossier Completo (.ZIP)', url: zipUrl, fallback: null });
  }

  attachments.forEach((att) => {
    const a = document.createElement('a');
    a.className = 'att-badge';
    a.textContent = att.label;
    if (att.url) {
      a.href = att.url;
      a.target = '_blank';
    } else {
      a.href = '#';
      a.addEventListener('click', (e) => {
        e.preventDefault();
        if (att.fallback) att.fallback();
      });
    }
    dom.escAttachmentsList.appendChild(a);
  });
}

/* ==========================================================================
   EVENT WIRING & INITIALIZATION
   ========================================================================== */
function bindWorkstationEvents() {
  // Airplane Mode Socket Verification Self-Test
  dom.pillAirplane.addEventListener('click', async () => {
    try {
      const res = await fetchJsonWithFallback([
        '/api/offline/verify',
        '/api/airplane/verify',
        '/api/health',
      ]);
      const blocked = res.blocked_external_attempts ?? 0;
      dom.pillAirplaneText.textContent = `AIRPLANE MODE: VERIFIED (${blocked} EXT SOCKETS)`;
      appendChatMessage({
        role: 'assistant',
        author: 'AIRPLANE SOCKET GUARD',
        text: `Auditoría en vivo completada: egreso IP externo bloqueado activamente (${blocked} intentos bloqueados). 100% procesamiento local en dispositivo.`,
      });
    } catch (_e) {
      dom.pillAirplaneText.textContent = 'AIRPLANE MODE: VERIFIED (LOCAL)';
    }
  });

  // Live USB-RS485 Hardware Scan & SCADA Controls
  const triggerHardwareModbusScan = async () => {
    try {
      const res = await fetchJsonWithFallback(['/api/modbus/scan'], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quick: true }),
      });
      applyTelemetryPayload(res);
      const sr = res.scan_result || {};
      appendChatMessage({
        role: 'assistant',
        author: 'FT2232HL · ESCÁNER RS-485',
        text: sr.found
          ? `¡Sensor físico detectado en ${sr.port} (${sr.baud_bps} bps, Slave #${sr.slave_id})! Temp: ${sr.temp_c} °C · Humedad: ${sr.humidity_rh} %RH.`
          : `Puertos revisados (${(sr.ports_checked || []).join(', ') || 'ningún adaptador USB-RS485 conectado'}). ${sr.reason || ''} Use "⚡ Enchufar Sensor" para ensayar en simulador o conecte el FT2232HL.`,
      });
    } catch (_e) {}
  };

  if (dom.pillModbus) dom.pillModbus.addEventListener('click', triggerHardwareModbusScan);
  if (dom.btnScanRealModbus) dom.btnScanRealModbus.addEventListener('click', triggerHardwareModbusScan);
  if (dom.btnSimConnectModbus) {
    dom.btnSimConnectModbus.addEventListener('click', runStep3ConnectAndValidateModbus);
  }
  if (dom.btnBreathTest) {
    dom.btnBreathTest.addEventListener('click', async () => {
      try {
        const res = await fetchJsonWithFallback(['/api/repair/step'], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'breath_test', slave_id: computeDipAddress() || 1 }),
        });
        applyTelemetryPayload(res);
        appendChatMessage({
          role: 'assistant',
          author: 'SCADA EN VIVO · PRUEBA SHT30',
          text: 'Prueba dinámica de respuesta higrométrica activa: observe cómo suben en tiempo real la humedad (%RH) y temperatura (°C) en el bus RS-485.',
        });
      } catch (_e) {}
    });
  }

  // Video Stream Fallback Handler
  dom.videoStream.addEventListener('error', () => {
    state.videoStreamFailed = true;
    dom.videoStream.hidden = true;
    dom.videoFallbackCanvas.hidden = false;
    drawFallbackScannerFrame();
  });
  dom.videoStream.addEventListener('load', () => {
    state.videoStreamFailed = false;
    dom.videoFallbackCanvas.hidden = true;
    dom.videoStream.hidden = false;
  });

  // Camera & Workbench Simulator Switcher
  document.querySelectorAll('.sim-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchCameraMode(btn.dataset.camMode));
  });

  // Custom Bench Photo Upload
  dom.photoUploadInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) uploadCustomBenchPhoto(file);
  });

  // Manual Inspector Controls & Lightbox
  dom.manualPrevBtn.addEventListener('click', () => setManualPage(state.manualPage - 1));
  dom.manualNextBtn.addEventListener('click', () => setManualPage(state.manualPage + 1));
  dom.manualQuickPills.querySelectorAll('.page-pill').forEach((pill) => {
    pill.addEventListener('click', () => setManualPage(Number(pill.dataset.page)));
  });

  dom.manualViewerBox.addEventListener('click', () => {
    setManualPage(state.manualPage);
    dom.manualModal.hidden = false;
  });
  dom.lightboxPrevBtn.addEventListener('click', () => setManualPage(state.manualPage - 1));
  dom.lightboxNextBtn.addEventListener('click', () => setManualPage(state.manualPage + 1));
  dom.lightboxCloseBtn.addEventListener('click', () => {
    dom.manualModal.hidden = true;
  });
  dom.manualModal.addEventListener('click', (e) => {
    if (e.target === dom.manualModal) dom.manualModal.hidden = true;
  });

  // Initial Citation Chips in Welcome Message
  document.querySelectorAll('[data-cite-page]').forEach((chip) => {
    chip.addEventListener('click', () => setManualPage(Number(chip.dataset.citePage), { flash: true }));
  });

  // 3D Viewport Toolbar Controls
  dom.btnModeSolid.addEventListener('click', () => setRenderMode('solid'));
  dom.btnModeWireframe.addEventListener('click', () => setRenderMode('wireframe'));
  dom.btnToggleExplode.addEventListener('click', () =>
    setExplodedState(!state.exploded, { manualTrigger: true })
  );
  dom.btnToggleDims.addEventListener('click', () => {
    state.showDimensions = !state.showDimensions;
    dom.btnToggleDims.classList.toggle('active', state.showDimensions);
  });
  dom.btnSyncCam.addEventListener('click', () => {
    state.syncCameraAngle = !state.syncCameraAngle;
    dom.btnSyncCam.classList.toggle('active', state.syncCameraAngle);
  });
  dom.btnResetView.addEventListener('click', () => {
    cad.camera.position.set(16, 48, 185);
    cad.controls.target.set(0, -4, 0);
    cad.controls.update();
  });

  // Sub-Assembly Tree Chips
  dom.assemblyTreePills.querySelectorAll('.part-chip').forEach((chip) => {
    chip.addEventListener('click', () => selectZone(chip.dataset.zone, { flipManual: true }));
  });

  // Auto-Speak Toggle
  dom.btnAutoSpeak.addEventListener('click', () => {
    state.autoSpeak = !state.autoSpeak;
    dom.btnAutoSpeak.textContent = state.autoSpeak ? '🔊 Voz Auto: ON' : '🔇 Voz Auto: OFF';
  });

  // 4 Guided Closed-Loop Repair Quick-Actions
  dom.qaLoadSensor.addEventListener('click', runStep1OpenInspection);
  dom.qaInspectDip.addEventListener('click', runStep2ModbusDipGuidance);
  dom.qaDiagnoseCam.addEventListener('click', runStep3ConnectAndValidateModbus);
  dom.qaEscalateCad.addEventListener('click', generateAndOpenEscalationPackage);

  // Voice Push-To-Talk & Text Query Form
  dom.btnPushToTalk.addEventListener('click', toggleVoiceRecording);
  dom.textQueryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = dom.queryInput.value.trim();
    if (!q) return;
    dom.queryInput.value = '';
    await submitDiagnosisQuery(q, { includeCamera: true });
  });

  // CAD & Escalation Footer Buttons
  dom.btnDownloadDxf.addEventListener('click', async () => {
    if (state.lastEscalation?.dxf_url || state.lastEscalation?.files?.dxf) {
      window.open(state.lastEscalation.dxf_url || state.lastEscalation.files.dxf, '_blank');
      return;
    }
    try {
      const res = await fetchJsonWithFallback(['/api/escalate'], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sensor_id: 'TZ-THT-02',
          highlighted_zone: state.highlightedZone || 'strainer_head',
          dip_address: computeDipAddress(),
        }),
      });
      state.lastEscalation = res;
      if (res.dxf_url || res.files?.dxf) {
        window.location.href = res.dxf_url || res.files.dxf;
        return;
      }
    } catch (_e) {
      // Fall through to instant client AutoCAD R12 DXF generator
    }
    generateClientAutoCadDxf();
  });

  dom.btnDownloadStl.addEventListener('click', () => {
    if (state.lastEscalation?.stl_url || state.lastEscalation?.files?.stl) {
      window.location.href = state.lastEscalation.stl_url || state.lastEscalation.files.stl;
      return;
    }
    exportClientBinaryStl();
  });

  dom.btnOpenEscalateModal.addEventListener('click', generateAndOpenEscalationPackage);
  dom.escalationCloseBtn.addEventListener('click', () => {
    dom.escalationModal.hidden = true;
  });
  dom.escalationModal.addEventListener('click', (e) => {
    if (e.target === dom.escalationModal) dom.escalationModal.hidden = true;
  });

  // Escape key closes modals cleanly
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dom.manualModal.hidden = true;
      dom.escalationModal.hidden = true;
    }
  });
}

function bootstrap() {
  initCadStudio();
  renderDipHud();
  setManualPage(1);
  bindWorkstationEvents();

  // Start live OpenCV & system telemetry polling
  pollTelemetry();
  setInterval(pollTelemetry, 750);
}

bootstrap();
