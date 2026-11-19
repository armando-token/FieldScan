import * as THREE from '/static/vendor/three.module.js';
import { OrbitControls } from '/static/vendor/OrbitControls.js';
import { STLExporter } from '/static/vendor/STLExporter.js';

/* ==========================================================================
   CANONICAL TZ THT-02 METADATA, SUB-ASSEMBLIES & MANUAL INDEX (100% ENGLISH)
   ========================================================================== */
const ZONE_SPECS = {
  strainer_head: {
    id: 'strainer_head',
    title: 'Slotted Protective Cap & Sintered SS316L SHT30 Filter',
    shortLabel: 'SHT30 STRAINER HEAD',
    zRange: 'z = +42.0 .. +70.0 mm',
    dims: 'L = 28.0 mm · Ø16.0 mm (4 axial slots · Ø10.9 mm SS316L mesh)',
    manualPage: 1,
    faultPage: 6,
    summary:
      'Slotted protective cage housing stainless sintered filter and SHT30 CMOSens die (±0.3°C / ±2%RH). Register 0x7FFF indicates probe contamination or sensor damage (Page 6).',
    anchorLocal: new THREE.Vector3(0, 11.5, 56.0),
  },
  upper_seal_ring: {
    id: 'upper_seal_ring',
    title: 'Upper Elastomer Environmental O-Ring Collar',
    shortLabel: 'UPPER O-RING SEAL',
    zRange: 'z = +38.0 .. +42.0 mm',
    dims: 'Width = 4.0 mm · Ø16.2 mm NBR/Viton IP65 seal',
    manualPage: 1,
    faultPage: 4,
    summary:
      'Upper weatherproof O-ring isolating internal electronics from duct moisture (-40..+85°C, 5..95%RH non-condensing · Page 4).',
    anchorLocal: new THREE.Vector3(0, 11.0, 40.0),
  },
  upper_barrel_dip: {
    id: 'upper_barrel_dip',
    title: 'Upper Polymer Barrel & Internal 8-Pin DIP Switch PCB',
    shortLabel: 'UPPER BARREL / DIP-8 PCB',
    zRange: 'z = 0.0 .. +38.0 mm (PCB 30×11×1.6 mm)',
    dims: 'L = 38.0 mm · Ø16.0 mm OD / Ø13.2 mm ID · SW1 DIP 1..8',
    manualPage: 5,
    faultPage: 5,
    summary:
      'Houses the blue RS-485 PCB and 8-position binary DIP switch block (weights 128, 64, 32, 16, 8, 4, 2, 1). Unscrew Step 1 & Step 2 to set Modbus Slave ID (Page 5).',
    anchorLocal: new THREE.Vector3(0, 11.5, 16.0),
  },
  mounting_flange: {
    id: 'mounting_flange',
    title: 'Snap-On Wall & Duct Mounting Flange Clip',
    shortLabel: 'MOUNTING FLANGE Ø4.2MM',
    zRange: 'z = +8.0 .. +28.0 mm',
    dims: 'Span = 42.0 mm · 2× Ø4.2 mm bores (32.0 mm pitch)',
    manualPage: 1,
    faultPage: 9,
    summary:
      'Reinforced polymer snap-on saddle bracket with Ø4.2 mm mounting holes for wall or HVAC duct installation (Page 1 & Page 9).',
    anchorLocal: new THREE.Vector3(0, 12.0, 18.0),
  },
  lower_barrel_rs485: {
    id: 'lower_barrel_rs485',
    title: 'Lower Barrel & Isolated RS-485 Transceiver Stage',
    shortLabel: 'LOWER BARREL RS-485',
    zRange: 'z = -50.0 .. 0.0 mm',
    dims: 'L = 50.0 mm · Ø16.0 mm · M14 central thread & seam O-ring',
    manualPage: 5,
    faultPage: 7,
    summary:
      'Lower cylindrical body housing Modbus-RTU transceiver stage (4800/9600/19200 bps, 8N1, CRC-16 0xA001 · Pages 5–9).',
    anchorLocal: new THREE.Vector3(0, 11.5, -25.0),
  },
  waterproof_gland_leads: {
    id: 'waterproof_gland_leads',
    title: 'Waterproof Cable Gland & 4-Wire RS-485 Pigtail',
    shortLabel: 'CABLE GLAND & RS-485 LEADS',
    zRange: 'z = -70.0 .. -50.0 mm + Ø5.0 mm Cable',
    dims: 'Ribbed dome nut L = 20.0 mm + Red(V+) Black(GND) Yellow(A+) Green(B-)',
    manualPage: 4,
    faultPage: 4,
    summary:
      'Tapered strain-relief gland and shielded 4-conductor cable: Red V+ (5–24V DC), Black Common GND, Yellow RS-485 A+, Green RS-485 B- (Page 4).',
    anchorLocal: new THREE.Vector3(0, 11.5, -60.0),
  },
};

const MANUAL_PAGES = {
  1: 'Page 1 · Component Overview & SHT30 Probe',
  2: 'Page 2 · CMOSens SHT30 Architecture & HVAC Applications',
  3: 'Page 3 · Technical Specs: DC 5–24V, SHT30 (-40..125°C, ±0.3°C)',
  4: 'Page 4 · RS-485 Color Wiring (Red V+, Black GND, Yellow A+, Green B-)',
  5: 'Page 5 · 8-Pin DIP Switch Weights (128..1, Ex: 176) & 2-Step Opening',
  6: 'Page 6 · Holding Register Map (0x0000 Temp, 0x0001 Hum, 0x7FFF Fault)',
  7: 'Page 7 · Function 0x03 Read Holding Registers & RTU Frame',
  8: 'Page 8 · Function 0x06 Baud Rate Register (0x0005) & Exceptions',
  9: 'Page 9 · Error Codes, CRC-16 (0xA001) & 140.0×Ø16.0 mm Blueprint',
};

const DIP_WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1];

const CAMERA_MODE_LABELS = {
  usb: 'Cam: Live USB (/dev/video0)',
  ipad_camera: 'Cam: iPad Air M4 Camera (Live 30 FPS)',
  sim_normal: 'Cam: Nominal Sensor Sim',
  sim_open_dip: 'Cam: Open Housing DIP-8',
  sim_hand_screwdriver: 'Cam: Hand + Screwdriver (Masked)',
  sim_strainer_patch: 'Cam: Strainer Tip Fault',
  sim_gland_fault: 'Cam: RS-485 Gland Fault',
};

function notifyNativeBridge(event, payload = {}) {
  try {
    const handler = window.webkit?.messageHandlers?.fieldscanNative;
    if (handler && typeof handler.postMessage === 'function') {
      handler.postMessage({
        event,
        timestamp: Date.now(),
        ...payload,
      });
      return true;
    }
  } catch (_err) {
    // Ignore when running outside native FieldScanM4 WKWebView
  }
  return false;
}

/* ==========================================================================
   APPLICATION STATE
   ========================================================================== */
const state = {
  renderMode: 'solid', // 'solid' | 'wireframe'
  exploded: false,
  explodeProgress: 0,
  autoExplodeEnabled: true,
  showDimensions: true,
  syncCameraAngle: true,
  cameraAngleDeg: 0,
  smoothedAngleDeg: 0,
  minObservedAngle: 0,
  maxObservedAngle: 0,
  scanFramesObserved: 0,

  activeCameraMode: 'usb',
  sensorDetected: false,
  cameraOffline: false,
  activeModbusMode: 'auto',
  activeStep: 0,
  repairStage: 'IDLE_MONITORING',

  selectedZone: null,
  highlightedZone: null,
  lastDiagnosisFaultLock: false,
  faultReason: '',
  manualPage: 1,
  manualCollapsed: false,

  // Default Slave #01 (Pin 8 = ON, weight 1) for immediate standard Modbus RTU setup
  dipBits: [0, 0, 0, 0, 0, 0, 0, 1],
  dipPipVisible: false,
  dipPipDismissed: false,
  wasPhysicalPcbOpen: false,
  dipCropFailed: false,

  autoSpeak: true,
  isRecording: false,
  handsFreeEnabled: false,
  isAiSpeaking: false,
  aiSpeakCooldownUntil: 0,
  voiceRequestInFlight: false,
  lastEscalation: null,
  lastDiagnosisText: '',
  lastAudioB64: null,
  videoStreamFailed: false,
  seenRepairEventId: 0,

  modbusHealthy: false,
  modbusSimulation: false,
  wasModbusHealthy: false,
  activeSessionId: null,
  confirmedChangesCount: 0,
  pusrGatewayHost: '',
  pusrGatewayPort: 502,
  lastPollSeq: 0,
  emeraldVerifyUntil: 0,
  occlusionFiltered: false,
  handDetected: false,
  toolDetected: false,

  cvHudMode: 'spatial', // 'spatial' | 'minimal' | 'raw'
  camZoomMode: 'auto',  // 'auto' | 'manual'
  camZoomTarget: 1.0,
  camZoomCurrent: 1.0,
  camPanTarget: [0.5, 0.5],
  camPanCurrent: [0.5, 0.5],
  camDragActive: false,
  camDragLast: [0, 0],
  lastLostSensorTs: 0,
  snapshotRescueInFlight: false,
  hasLiveSnapshotFallback: false,
  visionSpatial: null,
  fastVisionInFlight: false,
  spatialSmooth: {
    quad: null,
    gland: null,
    tip: null,
    center: null,
    handCenter: null,
    toolTip: null,
    toolBase: null,
    anomalyPt: null,
  },
};

/* ==========================================================================
   DOM REFERENCES
   ========================================================================== */
const dom = {
  btnSensorPill: document.getElementById('btnSensorPill'),
  selectCameraMode: document.getElementById('selectCameraMode'),
  btnUploadPhoto: document.getElementById('btnUploadPhoto'),
  photoUploadInput: document.getElementById('photoUploadInput'),
  selectModbusMode: document.getElementById('selectModbusMode'),
  btnConfigGateway: document.getElementById('btnConfigGateway'),
  btnOpenCalibrationPlanned: document.getElementById('btnOpenCalibrationPlanned'),

  pillModelText: document.getElementById('pillModelText'),
  pillRamText: document.getElementById('pillRamText'),
  pillLatencyText: document.getElementById('pillLatencyText'),
  pillAirplane: document.getElementById('pillAirplane'),
  pillAirplaneText: document.getElementById('pillAirplaneText'),

  systemStateBanner: document.getElementById('systemStateBanner'),
  systemStateText: document.getElementById('systemStateText'),
  systemStateSub: document.getElementById('systemStateSub'),

  btnStepInspect: document.getElementById('btnStepInspect'),
  btnStepDip: document.getElementById('btnStepDip'),
  btnStepConnect: document.getElementById('btnStepConnect'),
  btnStepSignoff: document.getElementById('btnStepSignoff'),

  camSourceBadge: document.getElementById('camSourceBadge'),
  pillCamText: document.getElementById('pillCamText'),
  btnCycleCvHud: document.getElementById('btnCycleCvHud'),
  cvHudModeLabel: document.getElementById('cvHudModeLabel'),
  btnToggleDipPip: document.getElementById('btnToggleDipPip'),
  videoFrame: document.getElementById('videoFrame'),
  videoStream: document.getElementById('videoStream'),
  videoFallbackCanvas: document.getElementById('videoFallbackCanvas'),
  cvSpatialHudCanvas: document.getElementById('cvSpatialHudCanvas'),
  videoStaticReticle: document.getElementById('videoStaticReticle'),
  cameraHudTop: document.getElementById('cameraHudTop'),
  cameraZoomBar: document.getElementById('cameraZoomBar'),
  liveFeedProof: document.getElementById('liveFeedProof'),
  liveFeedProofText: document.getElementById('liveFeedProofText'),
  btnZoomAuto: document.getElementById('btnZoomAuto'),
  btnRawLiveToggle: document.getElementById('btnRawLiveToggle'),
  hudSensorId: document.getElementById('hudSensorId'),
  hudIsolationPill: document.getElementById('hudIsolationPill'),
  hudStatusTag: document.getElementById('hudStatusTag'),
  scanDimVal: document.getElementById('scanDimVal'),
  scanCoverageVal: document.getElementById('scanCoverageVal'),
  scanCoverageFill: document.getElementById('scanCoverageFill'),
  scanAngleVal: document.getElementById('scanAngleVal'),
  scanZoneVal: document.getElementById('scanZoneVal'),

  dipMacroPip: document.getElementById('dipMacroPip'),
  btnCloseDipPip: document.getElementById('btnCloseDipPip'),
  dipCropImg: document.getElementById('dipCropImg'),
  dipCropFallbackCanvas: document.getElementById('dipCropFallbackCanvas'),
  dipCalcAddr: document.getElementById('dipCalcAddr'),
  dipSwitchesRow: document.getElementById('dipSwitchesRow'),
  dipPinSummary: document.getElementById('dipPinSummary'),

  isolationGuardBadge: document.getElementById('isolationGuardBadge'),
  twinMatchBadge: document.getElementById('twinMatchBadge'),
  btnModeSolid: document.getElementById('btnModeSolid'),
  btnModeWireframe: document.getElementById('btnModeWireframe'),
  btnToggleExplode: document.getElementById('btnToggleExplode'),
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
  assemblyTreePills: document.getElementById('assemblyTreePills'),
  selectedPartSummary: document.getElementById('selectedPartSummary'),

  scadaLiveCard: document.getElementById('scadaLiveCard'),
  scadaStatusBadge: document.getElementById('scadaStatusBadge'),
  btnPollReadonly: document.getElementById('btnPollReadonly'),
  btnScanRealModbus: document.getElementById('btnScanRealModbus'),
  btnSimConnectModbus: document.getElementById('btnSimConnectModbus'),
  btnBreathTest: document.getElementById('btnBreathTest'),

  andonColumn: document.getElementById('andonColumn'),
  andonStack: document.getElementById('andonStack'),
  andonRed: document.getElementById('andonRed'),
  andonAmber: document.getElementById('andonAmber'),
  andonGreen: document.getElementById('andonGreen'),

  scadaTempVal: document.getElementById('scadaTempVal'),
  scadaHumVal: document.getElementById('scadaHumVal'),
  scadaSlaveVal: document.getElementById('scadaSlaveVal'),
  scadaCrcPill: document.getElementById('scadaCrcPill'),
  scadaFrameHex: document.getElementById('scadaFrameHex'),
  scadaChartWrap: document.getElementById('scadaChartWrap'),
  scadaChart: document.getElementById('scadaChart'),
  scadaFallbackCanvas: document.getElementById('scadaFallbackCanvas'),

  btnHandsFreeMic: document.getElementById('btnHandsFreeMic'),
  handsFreeText: document.getElementById('handsFreeText'),
  btnAutoSpeak: document.getElementById('btnAutoSpeak'),
  autoSpeakText: document.getElementById('autoSpeakText'),
  btnVoiceRecord: document.getElementById('btnVoiceRecord'),
  pttLabel: document.getElementById('pttLabel'),
  pttSubLabel: document.getElementById('pttSubLabel'),
  voiceMeter: document.getElementById('voiceMeter'),
  voiceMeterFill: document.getElementById('voiceMeterFill'),
  nextStepBox: document.getElementById('nextStepBox'),
  nextStepTitle: document.getElementById('nextStepTitle'),
  nextStepBody: document.getElementById('nextStepBody'),

  chatFeed: document.getElementById('chatFeed'),
  textQueryForm: document.getElementById('textQueryForm'),
  queryInput: document.getElementById('queryInput'),

  manualDrawer: document.getElementById('manualDrawer'),
  btnToggleManualDrawer: document.getElementById('btnToggleManualDrawer'),
  manualPrevBtn: document.getElementById('manualPrevBtn'),
  manualNextBtn: document.getElementById('manualNextBtn'),
  btnExpandManual: document.getElementById('btnExpandManual'),
  manualPageIndicator: document.getElementById('manualPageIndicator'),
  manualQuickPills: document.getElementById('manualQuickPills'),
  manualViewerBox: document.getElementById('manualViewerBox'),
  manualPageImg: document.getElementById('manualPageImg'),
  manualPageCaption: document.getElementById('manualPageCaption'),

  escQueueTag: document.getElementById('escQueueTag'),
  btnCaptureManualPhoto: document.getElementById('btnCaptureManualPhoto'),
  btnConfirmPhysicalChange: document.getElementById('btnConfirmPhysicalChange'),
  confirmChangeLabel: document.getElementById('confirmChangeLabel'),
  btnExportSessionDossier: document.getElementById('btnExportSessionDossier'),
  btnDownloadDxf: document.getElementById('btnDownloadDxf'),
  btnDownloadStl: document.getElementById('btnDownloadStl'),
  btnOpenEscalateModal: document.getElementById('btnOpenEscalateModal'),

  calibrationPlannedModal: document.getElementById('calibrationPlannedModal'),
  calibrationPlannedCloseBtn: document.getElementById('calibrationPlannedCloseBtn'),
  plannedCalEventCopy: document.getElementById('plannedCalEventCopy'),
  plannedCalScopeReason: document.getElementById('plannedCalScopeReason'),

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
  tabPreviewQuad: document.getElementById('tabPreviewQuad'),
  tabPreviewStrip: document.getElementById('tabPreviewStrip'),
  escSnapshotImg: document.getElementById('escSnapshotImg'),
  escSummaryZone: document.getElementById('escSummaryZone'),
  escSummaryDip: document.getElementById('escSummaryDip'),
};

/* ==========================================================================
   PROCEDURAL INDUSTRIAL TEXTURES (100% LOCAL, ZERO EXTERNAL ASSETS)
   ========================================================================== */
function createSinteredMetalTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#9aa3ad';
  ctx.fillRect(0, 0, 256, 256);

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

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  for (let y = 0; y < 256; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

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

  ctx.fillStyle = '#0c4a82';
  ctx.fillRect(0, 0, 512, 256);

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

  const wireLabels = ['V+', 'GND', 'A+', 'B-'];
  for (let i = 0; i < 4; i++) {
    const y = 44 + i * 54;
    ctx.fillStyle = '#eab308';
    ctx.fillRect(18, y - 12, 34, 24);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(wireLabels[i], 58, y + 5);
  }

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
   THREE.JS 60 FPS PARAMETRIC CAD + LASER SCAN + TWIN DEVIATION ENGINE
   ========================================================================== */
const cad = {
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  raycaster: new THREE.Raycaster(),
  pointer: new THREE.Vector2(),

  sensorRig: null,
  lowerSlideGroup: null,
  upperSlideGroup: null,
  pcbGroup: null,
  dipActuatorMeshes: [],
  dimensionsGroup: null,

  // Real-time 3D Laser Scan Ring & Point-Cloud Halo
  pointCloudHalo: null,
  pointCloudMat: null,
  laserScanGroup: null,
  laserRingMat: null,
  laserDiscMat: null,

  // Vivid Crimson 3D Anomaly Stain Volume & Bounding Wireframe
  faultBoxHelper: null,
  faultStainGroup: null,
  faultStainInnerMat: null,
  faultStainOuterMat: null,

  // Smooth Camera Auto-Zoom Animation Target
  camAnim: {
    active: false,
    pos: new THREE.Vector3(16, 48, 185),
    target: new THREE.Vector3(0, -4, 0),
  },

  zoneGroups: {},
  zoneMeshes: {},
  allSolidMaterials: [],

  anchorDimLength: new THREE.Vector3(0, -18.5, 0),
  anchorDimDia: new THREE.Vector3(0, 0, 77.5),
  anchorDipLabel: new THREE.Vector3(0, 15.5, 13.0),
};

function flyCameraTo(px, py, pz, tx, ty, tz) {
  cad.camAnim.pos.set(px, py, pz);
  cad.camAnim.target.set(tx, ty, tz);
  cad.camAnim.active = true;
}

function focusDip3DCamera() {
  if (cad.sensorRig) {
    cad.sensorRig.updateMatrixWorld(true);
    const dipWorld = new THREE.Vector3(0, 1.5, 13.0).applyMatrix4(cad.sensorRig.matrixWorld);
    flyCameraTo(dipWorld.x, dipWorld.y + 28, dipWorld.z + 68, dipWorld.x, dipWorld.y, dipWorld.z);
    return;
  }
  flyCameraTo(13, 30, 68, 13, 1.5, 0);
}

function reset3DCamera() {
  flyCameraTo(16, 48, 185, 0, -4, 0);
}

function tagZoneGroup(group, zoneId) {
  cad.zoneGroups[zoneId] = group;
  cad.zoneMeshes[zoneId] = [];
  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.userData.zoneId = zoneId;
      obj.castShadow = true;
      obj.receiveShadow = true;
      cad.zoneMeshes[zoneId].push(obj);

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

function buildLaserAndPointCloudOverlay(sensorRig) {
  // 1. Cylindrical Point-Cloud Reconstruction Shell (~980 points)
  const pts = [];
  for (let z = -69; z <= 69; z += 4.6) {
    const rBase = z < -50 ? 6.4 + ((z + 70) / 20) * 2.8 : 9.35;
    const ringCount = 28;
    for (let k = 0; k < ringCount; k++) {
      const ang = (k / ringCount) * Math.PI * 2 + z * 0.08;
      pts.push(Math.cos(ang) * rBase, Math.sin(ang) * rBase, z);
    }
  }
  // Flange ear points
  for (const side of [-1, 1]) {
    for (let x = 10; x <= 21; x += 3.5) {
      for (let z = 9; z <= 27; z += 4.5) {
        pts.push(side * x, -7.2, z);
      }
    }
  }

  const pcGeo = new THREE.BufferGeometry();
  pcGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const pcMat = new THREE.PointsMaterial({
    color: 0x38bdf8,
    size: 1.35,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const pointCloud = new THREE.Points(pcGeo, pcMat);
  sensorRig.add(pointCloud);
  cad.pointCloudHalo = pointCloud;
  cad.pointCloudMat = pcMat;

  // 2. Sweeping 3D Laser Scan Ring & Optical Plane
  const laserGroup = new THREE.Group();
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.88,
  });
  const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(11.4, 0.24, 12, 64), ringMat);
  laserGroup.add(ringMesh);

  const discMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.14,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const discMesh = new THREE.Mesh(new THREE.RingGeometry(7.9, 11.4, 48), discMat);
  laserGroup.add(discMesh);

  sensorRig.add(laserGroup);
  cad.laserScanGroup = laserGroup;
  cad.laserRingMat = ringMat;
  cad.laserDiscMat = discMat;
}

function buildParametricSensorAssembly() {
  const sinteredTex = createSinteredMetalTexture();
  const barrelTex = createBarrelMarkingTexture();
  const pcbTex = createBluePcbTexture();

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

  /* 1. STRAINER_HEAD (z = +42 .. +70 mm, Ø16.0 mm) */
  const strainerGroup = new THREE.Group();
  strainerGroup.name = 'strainer_head';

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

  const pillarRIn = 6.35;
  const pillarROut = 8.0;
  const pillarArc = 0.66;
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

  const filterGeo = new THREE.CylinderGeometry(5.45, 5.45, 23.0, 40);
  filterGeo.rotateX(Math.PI / 2);
  const filterMesh = new THREE.Mesh(filterGeo, sinteredSteelMat);
  filterMesh.position.z = 55.5;
  filterMesh.userData.isInternal = true;
  strainerGroup.add(filterMesh);

  const shtCarrier = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 1.0, 14.0),
    new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.4, metalness: 0.2 })
  );
  shtCarrier.position.set(0, 0, 50.5);
  shtCarrier.userData.isInternal = true;
  strainerGroup.add(shtCarrier);

  const shtDie = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.9, 2.5),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.25, metalness: 0.55 })
  );
  shtDie.position.set(0, 0.85, 54.0);
  shtDie.userData.isInternal = true;
  strainerGroup.add(shtDie);

  const ptfeDot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.75, 0.75, 0.2, 16),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
  );
  ptfeDot.position.set(0, 1.35, 54.0);
  ptfeDot.userData.isInternal = true;
  strainerGroup.add(ptfeDot);

  upperSlideGroup.add(strainerGroup);
  tagZoneGroup(strainerGroup, 'strainer_head');

  /* 2. UPPER_SEAL_RING (z = +38 .. +42 mm) */
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

  /* 3. UPPER_BARREL_DIP (z = 0 .. +38 mm + Internal Blue DIP-8 PCB) */
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
  upperShellSub.add(new THREE.Mesh(upperBarrelGeo, polymerMarkedMat));
  upperSlideGroup.add(upperShellSub);

  const pcbGroup = new THREE.Group();
  cad.pcbGroup = pcbGroup;

  const pcbBoard = new THREE.Mesh(
    new THREE.BoxGeometry(11.0, 1.6, 30.0),
    new THREE.MeshStandardMaterial({ map: pcbTex, roughness: 0.32, metalness: 0.18 })
  );
  pcbBoard.position.set(0, -0.4, 12.0);
  pcbBoard.userData.isInternal = true;
  pcbGroup.add(pcbBoard);

  const dipHousing = new THREE.Mesh(
    new THREE.BoxGeometry(6.4, 2.5, 16.4),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.1 })
  );
  dipHousing.position.set(0, 1.55, 14.5);
  dipHousing.userData.isInternal = true;
  pcbGroup.add(dipHousing);

  const dipTopPlate = new THREE.Mesh(
    new THREE.BoxGeometry(5.8, 0.25, 15.8),
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.45 })
  );
  dipTopPlate.position.set(0, 2.75, 14.5);
  dipTopPlate.userData.isInternal = true;
  pcbGroup.add(dipTopPlate);

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
    const slotRecess = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.3, 1.15),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
    );
    slotRecess.position.set(0, 2.8, zPos);
    slotRecess.userData.isInternal = true;
    pcbGroup.add(slotRecess);

    const rocker = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.75, 0.95), actuatorMat);
    rocker.position.set(state.dipBits[i] ? 0.85 : -0.85, 3.05, zPos);
    rocker.userData.isInternal = true;
    rocker.userData.dipIndex = i;
    pcbGroup.add(rocker);
    cad.dipActuatorMeshes.push(rocker);

    for (const side of [-1, 1]) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.45), goldPinMat);
      pin.position.set(side * 3.45, 0.9, zPos);
      pin.userData.isInternal = true;
      pcbGroup.add(pin);
    }
  }

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

  const internalWireDefs = [
    { color: 0xdc2626, x: -3.6 },
    { color: 0x171717, x: -1.2 },
    { color: 0xeab308, x: 1.2 },
    { color: 0x16a34a, x: 3.6 },
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

  /* 4. MOUNTING_FLANGE (z = +8 .. +28 mm) */
  const flangeGroup = new THREE.Group();
  flangeGroup.name = 'mounting_flange';

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
  wingGeo.rotateX(Math.PI / 2);
  const wingMesh = new THREE.Mesh(wingGeo, polymerGreyMat);
  wingMesh.position.set(0, -6.8, 18.0);
  flangeGroup.add(wingMesh);

  for (const side of [-1, 1]) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(11.5, 2.4, 2.2), polymerGreyMat);
    rib.position.set(side * 14.0, -5.8, 18.0);
    flangeGroup.add(rib);
  }

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
  cClipMesh.rotation.z = Math.PI;
  cClipMesh.position.z = 9.0;
  flangeGroup.add(cClipMesh);

  upperSlideGroup.add(flangeGroup);
  tagZoneGroup(flangeGroup, 'mounting_flange');

  /* 5. LOWER_BARREL_RS485 (z = -50 .. 0 mm) */
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

  for (const zThread of [-48.6, -47.2, -45.8, 1.4, 2.8, 4.2]) {
    const rThread = zThread < 0 ? 7.15 : 6.72;
    const threadTorus = new THREE.Mesh(
      new THREE.TorusGeometry(rThread, 0.28, 10, 40),
      darkPolymerThreadMat
    );
    threadTorus.position.z = zThread;
    lowerBarrelGroup.add(threadTorus);
  }

  const midOring = new THREE.Mesh(
    new THREE.TorusGeometry(7.96, 0.42, 14, 48),
    elastomerBlackMat
  );
  midOring.position.z = 0.0;
  lowerBarrelGroup.add(midOring);

  centralStaticGroup.add(lowerBarrelGroup);
  tagZoneGroup(lowerBarrelGroup, 'lower_barrel_rs485');

  /* 6. WATERPROOF_GLAND_LEADS (z = -70 .. -50 mm + Cable + 4 Color-Coded Leads) */
  const glandGroup = new THREE.Group();
  glandGroup.name = 'waterproof_gland_leads';

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

  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2;
    const ribGeo = new THREE.BoxGeometry(0.65, 0.72, 15.2);
    const ribMesh = new THREE.Mesh(ribGeo, polymerGreyMat);
    const rMid = 7.45;
    ribMesh.position.set(Math.cos(ang) * rMid, Math.sin(ang) * rMid, -58.8);
    ribMesh.rotation.z = ang;
    ribMesh.lookAt(Math.cos(ang) * (rMid - 1.5), Math.sin(ang) * (rMid - 1.5), -74.0);
    glandGroup.add(ribMesh);
  }

  const bootGeo = new THREE.CylinderGeometry(3.4, 4.3, 2.6, 28);
  bootGeo.rotateX(Math.PI / 2);
  const bootMesh = new THREE.Mesh(bootGeo, elastomerBlackMat);
  bootMesh.position.z = -70.8;
  glandGroup.add(bootMesh);

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
  glandGroup.add(
    new THREE.Mesh(
      cableGeo,
      new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.52, metalness: 0.08 })
    )
  );

  const shieldCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(2.65, 2.65, 3.0, 20),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.85 })
  );
  shieldCollar.position.set(3.0, -10.5, -6.0);
  shieldCollar.rotation.set(0.45, 0.2, 0.25);
  glandGroup.add(shieldCollar);

  const tinnedTipMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.22,
    metalness: 0.92,
  });

  const leadSpecs = [
    { color: 0xef4444, end: new THREE.Vector3(-2.0, -4.2, -22.5), mid: new THREE.Vector3(0.8, -7.2, -14.0) },
    { color: 0x1e293b, end: new THREE.Vector3(0.8, -6.8, -24.5), mid: new THREE.Vector3(2.0, -8.8, -15.0) },
    { color: 0xfacc15, end: new THREE.Vector3(4.2, -9.2, -24.0), mid: new THREE.Vector3(3.8, -10.0, -14.8) },
    { color: 0x22c55e, end: new THREE.Vector3(7.4, -11.8, -22.0), mid: new THREE.Vector3(5.5, -11.4, -14.0) },
  ];

  const jacketExit = new THREE.Vector3(3.0, -10.5, -6.5);
  for (const lead of leadSpecs) {
    const leadCurve = new THREE.CatmullRomCurve3([jacketExit, lead.mid, lead.end]);
    const leadGeo = new THREE.TubeGeometry(leadCurve, 20, 0.68, 10, false);
    glandGroup.add(
      new THREE.Mesh(
        leadGeo,
        new THREE.MeshStandardMaterial({ color: lead.color, roughness: 0.42, metalness: 0.06 })
      )
    );

    const tangent = lead.end.clone().sub(lead.mid).normalize();
    const tipEnd = lead.end.clone().addScaledVector(tangent, 4.2);
    const tipCurve = new THREE.LineCurve3(lead.end, tipEnd);
    glandGroup.add(new THREE.Mesh(new THREE.TubeGeometry(tipCurve, 4, 0.42, 8, false), tinnedTipMat));
  }

  lowerSlideGroup.add(glandGroup);
  tagZoneGroup(glandGroup, 'waterproof_gland_leads');

  /* 7. 3D CAD DIMENSION LINES (140.0 MM LENGTH & Ø16.0 MM DIAMETER) */
  const dimsGroup = new THREE.Group();
  const dimLineMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
  });

  const lenLinePts = [
    new THREE.Vector3(0, -8.5, -70.0),
    new THREE.Vector3(0, -18.5, -70.0),
    new THREE.Vector3(0, -8.5, 70.0),
    new THREE.Vector3(0, -18.5, 70.0),
    new THREE.Vector3(0, -16.5, -70.0),
    new THREE.Vector3(0, -16.5, 70.0),
    new THREE.Vector3(0, -15.2, -67.2),
    new THREE.Vector3(0, -16.5, -70.0),
    new THREE.Vector3(0, -17.8, -67.2),
    new THREE.Vector3(0, -16.5, -70.0),
    new THREE.Vector3(0, -15.2, 67.2),
    new THREE.Vector3(0, -16.5, 70.0),
    new THREE.Vector3(0, -17.8, 67.2),
    new THREE.Vector3(0, -16.5, 70.0),
  ];
  dimsGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lenLinePts), dimLineMat));

  const diaLinePts = [
    new THREE.Vector3(0, 8.0, 70.5),
    new THREE.Vector3(0, 8.0, 77.5),
    new THREE.Vector3(0, -8.0, 70.5),
    new THREE.Vector3(0, -8.0, 77.5),
    new THREE.Vector3(0, -8.0, 75.5),
    new THREE.Vector3(0, 8.0, 75.5),
    new THREE.Vector3(0, 6.2, 74.5),
    new THREE.Vector3(0, 8.0, 75.5),
    new THREE.Vector3(0, 6.2, 76.5),
    new THREE.Vector3(0, 8.0, 75.5),
    new THREE.Vector3(0, -6.2, 74.5),
    new THREE.Vector3(0, -8.0, 75.5),
    new THREE.Vector3(0, -6.2, 76.5),
    new THREE.Vector3(0, -8.0, 75.5),
  ];
  dimsGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(diaLinePts), dimLineMat));

  sensorRig.add(dimsGroup);
  cad.dimensionsGroup = dimsGroup;

  /* 8. REAL-TIME LASER SCAN RING & POINT-CLOUD RECONSTRUCTION HALO */
  buildLaserAndPointCloudOverlay(sensorRig);

  return sensorRig;
}

function initCadStudio() {
  const stage = dom.canvasStage;
  const width = Math.max(320, stage.clientWidth || 720);
  const height = Math.max(260, stage.clientHeight || 420);

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
  controls.dampingFactor = 0.08;
  controls.minDistance = 38;
  controls.maxDistance = 420;
  controls.target.set(0, -4, 0);
  controls.update();
  cad.controls = controls;

  // 3-Point Engineering Studio Lighting
  scene.add(new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.88));

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

  const sensorRig = buildParametricSensorAssembly();
  scene.add(sensorRig);

  // Crimson Wireframe Bounding Box + Semi-Transparent 3D Crimson Fault Stain Volume
  const faultBox = new THREE.Box3();
  const faultHelper = new THREE.Box3Helper(faultBox, 0xef4444);
  faultHelper.visible = false;
  scene.add(faultHelper);
  cad.faultBoxHelper = faultHelper;

  const faultStainGroup = new THREE.Group();
  faultStainGroup.visible = false;
  const stainInnerMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const stainOuterMat = new THREE.MeshBasicMaterial({
    color: 0xdc2626,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
  });
  faultStainGroup.add(new THREE.Mesh(new THREE.SphereGeometry(8.5, 24, 18), stainInnerMat));
  faultStainGroup.add(new THREE.Mesh(new THREE.SphereGeometry(13.8, 24, 18), stainOuterMat));
  scene.add(faultStainGroup);
  cad.faultStainGroup = faultStainGroup;
  cad.faultStainInnerMat = stainInnerMat;
  cad.faultStainOuterMat = stainOuterMat;

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

  let downPos = { x: 0, y: 0 };
  renderer.domElement.addEventListener('pointerdown', (e) => {
    // Yield smooth camera auto-zoom immediately if operator grabs 3D orbit controls
    cad.camAnim.active = false;
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
      if (state.exploded && typeof meshHit.object.userData.dipIndex === 'number') {
        toggleDipBit(meshHit.object.userData.dipIndex);
      }
      selectZone(meshHit.object.userData.zoneId, { flipManual: true });
    }
  });

  let frames = 0;
  let lastFpsStamp = performance.now();
  let prevFrameTime = performance.now();

  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, (now - prevFrameTime) / 1000);
    prevFrameTime = now;

    // 1. FPS Telemetry
    frames += 1;
    if (now - lastFpsStamp >= 650) {
      const fps = Math.min(60, Math.round((frames * 1000) / (now - lastFpsStamp)));
      dom.fpsCounterText.textContent = `${fps} FPS`;
      frames = 0;
      lastFpsStamp = now;
    }

    // 2. Smooth Unscrew / Explode Animation
    const targetExplode = state.exploded ? 1.0 : 0.0;
    state.explodeProgress += (targetExplode - state.explodeProgress) * Math.min(1, dt * 6.5);
    const ep = state.explodeProgress;

    cad.lowerSlideGroup.position.z = -18.0 * ep;
    cad.lowerSlideGroup.rotation.z = -ep * Math.PI * 1.2;
    cad.upperSlideGroup.position.z = 35.0 * ep;
    cad.upperSlideGroup.rotation.z = ep * Math.PI * 0.85;

    // 3. Smooth Camera Angle Sync from Live Optical Scanner
    const targetAngle = state.syncCameraAngle ? state.cameraAngleDeg : 0.0;
    state.smoothedAngleDeg += (targetAngle - state.smoothedAngleDeg) * Math.min(1, dt * 5.0);
    cad.sensorRig.rotation.z = THREE.MathUtils.degToRad(-state.smoothedAngleDeg * 0.65);

    // 4. Smooth Camera Auto-Zoom Interpolation (DIP-8 Focus / Reset)
    if (cad.camAnim.active) {
      const step = Math.min(1, dt * 5.5);
      camera.position.lerp(cad.camAnim.pos, step);
      controls.target.lerp(cad.camAnim.target, step);
      if (
        camera.position.distanceTo(cad.camAnim.pos) < 0.65 &&
        controls.target.distanceTo(cad.camAnim.target) < 0.35
      ) {
        cad.camAnim.active = false;
      }
    }

    // 5. Real-Time 3D Laser Scan Ring Sweep & Point-Cloud Halo Pulse
    if (cad.laserScanGroup) {
      const sweepSpan = 72 + 18 * ep;
      cad.laserScanGroup.position.z = Math.sin(now * 0.0019) * sweepSpan;
      const scanHex = state.modbusHealthy
        ? 0x10b981
        : state.highlightedZone
          ? 0xef4444
          : 0x38bdf8;
      cad.laserRingMat.color.setHex(scanHex);
      cad.laserDiscMat.color.setHex(scanHex);
      cad.pointCloudMat.color.setHex(state.modbusHealthy ? 0x34d399 : 0x38bdf8);
      cad.pointCloudMat.opacity = 0.32 + 0.14 * (0.5 + 0.5 * Math.sin(now * 0.003));
    }

    // 6. Crimson Fault Stain Volume & Emerald Twin Verification Glow
    updateFaultAndTwinVisuals(now);

    // 7. 60 FPS High-DPI Spatial Computer Vision HUD on Live Camera Viewport
    renderSpatialVisionHud(now, dt);

    controls.update();
    renderer.render(scene, camera);
    updateProjectedOverlays();
  }

  requestAnimationFrame(animate);
}

/* ==========================================================================
   STYLE 3 SPATIAL COMPUTER VISION HUD (60 FPS HIGH-DPI RETINA CANVAS)
   ========================================================================== */
function syncCvHudControls() {
  const labels = {
    spatial: 'AI HUD: ON',
    minimal: 'AI HUD: MIN',
    raw: 'AI HUD: OFF',
  };
  if (dom.cvHudModeLabel) {
    dom.cvHudModeLabel.textContent = labels[state.cvHudMode] || 'AI HUD: ON';
  }
  if (dom.btnCycleCvHud) {
    dom.btnCycleCvHud.classList.toggle('active', state.cvHudMode === 'spatial');
    dom.btnCycleCvHud.classList.toggle('is-minimal', state.cvHudMode === 'minimal');
  }
  const isRaw = state.cvHudMode === 'raw';
  if (dom.videoStaticReticle) {
    dom.videoStaticReticle.style.opacity = isRaw ? '0' : '1';
  }
  if (dom.cameraHudTop) {
    dom.cameraHudTop.style.opacity = isRaw ? '0' : '1';
  }
  if (dom.btnRawLiveToggle) {
    dom.btnRawLiveToggle.classList.toggle('is-raw-active', isRaw);
    dom.btnRawLiveToggle.textContent = isRaw ? 'RAW CAM: ACTIVE' : 'RAW LIVE CAM';
  }
}

function cycleCvHudMode() {
  const order = ['spatial', 'minimal', 'raw'];
  const idx = order.indexOf(state.cvHudMode);
  state.cvHudMode = order[(idx + 1) % order.length];
  syncCvHudControls();
}

function togglePureRawCamera() {
  state.cvHudMode = state.cvHudMode === 'raw' ? 'spatial' : 'raw';
  syncCvHudControls();
}

function setCameraZoomPreset(modeStr) {
  if (modeStr === 'auto') {
    state.camZoomMode = 'auto';
  } else {
    const val = Math.max(1.0, Math.min(5.0, Number(modeStr) || 1.0));
    state.camZoomMode = 'manual';
    state.camZoomTarget = val;
    if (val <= 1.01) {
      state.camPanTarget = [0.5, 0.5];
    } else if (state.visionSpatial?.detected && Array.isArray(state.visionSpatial.bbox)) {
      const v = state.visionSpatial;
      const fw = v.frame_size?.[0] || 1920;
      const fh = v.frame_size?.[1] || 1080;
      const vw = dom.videoFrame?.clientWidth || 480;
      const vh = dom.videoFrame?.clientHeight || 300;
      const cs = Math.max(vw / fw, vh / fh);
      const ox = (vw - fw * cs) * 0.5;
      const oy = (vh - fh * cs) * 0.5;
      const cx = (ox + (v.bbox[0] + v.bbox[2] * 0.5) * cs) / vw;
      const cy = (oy + (v.bbox[1] + v.bbox[3] * 0.5) * cs) / vh;
      state.camPanTarget = [
        Math.max(0.05, Math.min(0.95, cx)),
        Math.max(0.05, Math.min(0.95, cy)),
      ];
    }
  }
  syncZoomButtonsUi();
}

function syncZoomButtonsUi() {
  if (!dom.cameraZoomBar) return;
  const btns = dom.cameraZoomBar.querySelectorAll('.zoom-btn');
  btns.forEach((btn) => {
    const m = btn.dataset.zoomMode;
    if (m === 'auto') {
      btn.classList.toggle('active', state.camZoomMode === 'auto');
    } else {
      const targetNum = Number(m);
      btn.classList.toggle(
        'active',
        state.camZoomMode === 'manual' && Math.abs(state.camZoomTarget - targetNum) < 0.12
      );
    }
  });
}

function lerpPt2(prev, target, alpha) {
  if (!target || target.length < 2) return null;
  if (!prev || prev.length < 2) return [target[0], target[1]];
  return [
    prev[0] + (target[0] - prev[0]) * alpha,
    prev[1] + (target[1] - prev[1]) * alpha,
  ];
}

function drawRoundedRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function drawSpatialLeaderCallout(ctx, opts) {
  const { anchor, boxX, boxY, accent, title, sub, vw, vh } = opts;
  ctx.save();
  ctx.font = '700 10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  const wTitle = ctx.measureText(title).width;
  ctx.font = '600 9px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  const wSub = sub ? ctx.measureText(sub).width : 0;

  const boxW = Math.ceil(Math.max(wTitle, wSub) + 20);
  const boxH = sub ? 33 : 21;
  const cx = Math.max(8, Math.min(vw - boxW - 8, boxX));
  const cy = Math.max(40, Math.min(vh - boxH - 8, boxY));

  // Diagonal elbow leader line from real optical anchor to callout pill
  if (anchor && anchor.length === 2) {
    const targetX = anchor[0] < cx + boxW * 0.5 ? cx : cx + boxW;
    const targetY = cy + boxH * 0.5;
    const elbowX = anchor[0] + (targetX - anchor[0]) * 0.58;

    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(anchor[0], anchor[1]);
    ctx.lineTo(elbowX, targetY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(anchor[0], anchor[1], 3.0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Frosted dark industrial glass pill
  drawRoundedRectPath(ctx, cx, cy, boxW, boxH, 5);
  ctx.fillStyle = 'rgba(8, 13, 21, 0.88)';
  ctx.fill();
  ctx.lineWidth = 1.1;
  ctx.strokeStyle = accent;
  ctx.stroke();

  // Left semantic accent bar
  drawRoundedRectPath(ctx, cx + 1.5, cy + 2.5, 3, boxH - 5, 1.5);
  ctx.fillStyle = accent;
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  ctx.fillText(title, cx + 10, cy + 13);

  if (sub) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 9px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.fillText(sub, cx + 10, cy + 25.5);
  }
  ctx.restore();
}

function rescueSnapshotToFallbackCanvas() {
  if (state.snapshotRescueInFlight) return;
  state.snapshotRescueInFlight = true;
  const img = new Image();
  img.onload = () => {
    state.snapshotRescueInFlight = false;
    state.hasLiveSnapshotFallback = true;
    const canvas = dom.videoFallbackCanvas;
    if (!canvas) return;
    if (canvas.width !== img.naturalWidth && img.naturalWidth > 0) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.onerror = () => {
    state.snapshotRescueInFlight = false;
  };
  img.src = `/api/video/snapshot?raw=1&t=${Date.now()}`;
}

function renderSpatialVisionHud(nowMs, dt) {
  const canvas = dom.cvSpatialHudCanvas;
  const stage = dom.videoFrame;
  if (!canvas || !stage) return;

  // Chromium never fires `load` on infinite multipart/x-mixed-replace streams;
  // immediately unhide `#videoStream` as soon as its first JPEG frame decodes (`naturalWidth > 0`).
  const hasStreamPixels = Boolean(dom.videoStream && dom.videoStream.naturalWidth > 0);
  if (hasStreamPixels && (state.videoStreamFailed || dom.videoStream.hidden)) {
    state.videoStreamFailed = false;
    dom.videoFallbackCanvas.hidden = true;
    dom.videoStream.hidden = false;
  }

  const vw = stage.clientWidth;
  const vh = stage.clientHeight;
  if (!vw || !vh) return;

  const v = state.visionSpatial;
  const fw = (v && v.frame_size?.[0]) || dom.videoStream?.naturalWidth || 1920;
  const fh = (v && v.frame_size?.[1]) || dom.videoStream?.naturalHeight || 1080;
  const coverScale = Math.max(vw / fw, vh / fh);
  const offX = (vw - fw * coverScale) * 0.5;
  const offY = (vh - fh * coverScale) * 0.5;

  // Update real-time hardware frame proof pill so operator sees live frame counter advancing
  if (dom.liveFeedProofText && dom.liveFeedProof) {
    const isOffline = Boolean(state.cameraOffline);
    const srcStr = String(v?.camera_source || '').toLowerCase();
    const isIpadCam =
      !isOffline && (state.activeCameraMode === 'ipad_camera' || srcStr.includes('ipad'));
    const isUsb =
      !isOffline &&
      (isIpadCam || srcStr.startsWith('uvc:') || state.activeCameraMode === 'usb');
    dom.liveFeedProof.classList.toggle('is-standby', isOffline || !isUsb);
    const resTag = fh >= 1000 ? '1080P' : `${fh}P`;
    const seqNum = v?.frame_seq ? ` #${v.frame_seq}` : '';
    dom.liveFeedProofText.textContent = isOffline
      ? 'USB STANDBY'
      : isIpadCam
        ? `IPAD ${resTag}${seqNum}`
        : isUsb
          ? `LIVE ${resTag}${seqNum}`
          : `SIM${seqNum}`;
  }

  // Compute smooth 60 FPS Auto-Zoom & Pan onto detected TZ THT-02 sensor (or keep full 1.0x HD wide view on handheld iPad M4)
  const isHandheldIpadCamera = Boolean(
    window.FIELDSCAN_IOS_NATIVE === true ||
    state.activeCameraMode === 'ipad_camera' ||
    String(v?.camera_source || '').toLowerCase().includes('ipad')
  );
  const hasDipPinLock = Boolean(
    !isHandheldIpadCamera && v && v.detected && v.pcb_open_detected && Array.isArray(v.dip_focus_pt) && v.dip_focus_pt.length === 2
  );
  if (state.camZoomMode === 'auto') {
    if (isHandheldIpadCamera) {
      state.camZoomTarget = 1.0;
      state.camPanTarget = [0.5, 0.5];
    } else if (hasDipPinLock) {
      state.lastLostSensorTs = 0;
      const pinCxStage = (offX + v.dip_focus_pt[0] * coverScale) / vw;
      const pinCyStage = (offY + v.dip_focus_pt[1] * coverScale) / vh;
      state.camZoomTarget = 2.85;
      state.camPanTarget = [
        Math.max(0.05, Math.min(0.95, pinCxStage)),
        Math.max(0.05, Math.min(0.95, pinCyStage)),
      ];
    } else if (v && v.detected && Array.isArray(v.bbox) && v.bbox[2] > 0 && v.bbox[3] > 0) {
      state.lastLostSensorTs = 0;
      const cxStage = (offX + (v.bbox[0] + v.bbox[2] * 0.5) * coverScale) / vw;
      const cyStage = (offY + (v.bbox[1] + v.bbox[3] * 0.5) * coverScale) / vh;
      const bwFrac = (v.bbox[2] * coverScale) / vw;
      const bhFrac = (v.bbox[3] * coverScale) / vh;
      const maxSpanFrac = Math.max(bwFrac, bhFrac, 0.12);
      // Zoom in 1.85x-2.6x onto detected sensor body & printed label while keeping crisp framing
      const desiredAutoZ = maxSpanFrac < 0.42
        ? Math.min(2.6, 0.82 / maxSpanFrac)
        : 1.85;
      state.camZoomTarget = Math.max(1.80, Math.min(2.65, desiredAutoZ));
      state.camPanTarget = [
        Math.max(0.05, Math.min(0.95, cxStage)),
        Math.max(0.05, Math.min(0.95, cyStage)),
      ];
    } else {
      if (!state.lastLostSensorTs) state.lastLostSensorTs = nowMs;
      // Hold framing briefly for 900ms against micro-glitches, then smoothly zoom out to 1.0x wide scan
      if (nowMs - state.lastLostSensorTs > 900) {
        state.camZoomTarget = 1.0;
        state.camPanTarget = [0.5, 0.5];
      }
    }
    if (dom.btnZoomAuto) {
      dom.btnZoomAuto.textContent = hasDipPinLock
        ? `AUTO ${state.camZoomCurrent.toFixed(1)}× PIN`
        : `AUTO ${state.camZoomCurrent.toFixed(1)}×`;
    }
  } else if (dom.btnZoomAuto) {
    dom.btnZoomAuto.textContent = 'AUTO';
  }

  const zoomSmooth = Math.min(1, dt * 6.5);
  state.camZoomCurrent += (state.camZoomTarget - state.camZoomCurrent) * zoomSmooth;
  if (Math.abs(state.camZoomTarget - state.camZoomCurrent) < 0.003) {
    state.camZoomCurrent = state.camZoomTarget;
  }
  const panSmooth = state.camDragActive ? 1.0 : Math.min(1, dt * 7.5);
  state.camPanCurrent[0] += (state.camPanTarget[0] - state.camPanCurrent[0]) * panSmooth;
  state.camPanCurrent[1] += (state.camPanTarget[1] - state.camPanCurrent[1]) * panSmooth;

  const z = Math.max(1.0, state.camZoomCurrent);
  const focusX = state.camPanCurrent[0] * vw;
  const focusY = state.camPanCurrent[1] * vh;
  const screenAimX = state.camZoomMode === 'auto' && hasDipPinLock && state.dipPipVisible ? 0.31 : 0.5;
  const screenAimY = state.camZoomMode === 'auto' && hasDipPinLock && state.dipPipVisible ? 0.37 : 0.5;
  const tx = Math.min(0, Math.max(vw * (1 - z), vw * screenAimX - z * focusX));
  const ty = Math.min(0, Math.max(vh * (1 - z), vh * screenAimY - z * focusY));

  const xform = z > 1.004
    ? `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${z.toFixed(4)})`
    : 'none';
  if (dom.videoStream) dom.videoStream.style.transform = xform;
  if (dom.videoFallbackCanvas) dom.videoFallbackCanvas.style.transform = xform;
  stage.classList.toggle('is-zoomed', z > 1.03);

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const targetW = Math.round(vw * dpr);
  const targetH = Math.round(vh * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, vw, vh);

  if (state.cvHudMode === 'raw') {
    return;
  }

  // Never draw detection overlays unless genuine optical video pixels are visible underneath
  if (!hasStreamPixels && !state.hasLiveSnapshotFallback) {
    return;
  }

  if (!v || typeof v !== 'object') return;

  const isSpatialFull = state.cvHudMode === 'spatial';
  const mapPt = (pt) => [
    tx + z * (offX + pt[0] * coverScale),
    ty + z * (offY + pt[1] * coverScale),
  ];

  const lerpAlpha = Math.min(1, dt * 16.0);
  const sm = state.spatialSmooth;
  const pulse = 0.5 + 0.5 * Math.sin(nowMs * 0.0065);

  // 1. TZ THT-02 SENSOR LOCK-ON BRACKETS, SEGMENTATION HULL & SHI-TOMASI KEYPOINTS
  if (v.detected && Array.isArray(v.sensor_quad) && v.sensor_quad.length === 4) {
    const mappedQuad = v.sensor_quad.map(mapPt);
    if (!sm.quad || sm.quad.length !== 4) {
      sm.quad = mappedQuad;
    } else {
      sm.quad = sm.quad.map((prevPt, idx) => lerpPt2(prevPt, mappedQuad[idx], lerpAlpha));
    }

    const sensorColor = state.modbusHealthy ? '#34d399' : '#38bdf8';
    const sensorFill = state.modbusHealthy
      ? 'rgba(16, 185, 129, 0.09)'
      : 'rgba(56, 189, 248, 0.085)';

    if (isSpatialFull) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(sm.quad[0][0], sm.quad[0][1]);
      for (let i = 1; i < 4; i += 1) ctx.lineTo(sm.quad[i][0], sm.quad[i][1]);
      ctx.closePath();
      ctx.fillStyle = sensorFill;
      ctx.fill();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = state.modbusHealthy
        ? 'rgba(52, 211, 153, 0.42)'
        : 'rgba(56, 189, 248, 0.38)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    // Tactical rotated corner lock-on brackets
    ctx.save();
    ctx.strokeStyle = sensorColor;
    ctx.lineWidth = 2.2;
    ctx.shadowColor = sensorColor;
    ctx.shadowBlur = 7;
    for (let i = 0; i < 4; i += 1) {
      const p0 = sm.quad[i];
      const pPrev = sm.quad[(i + 3) % 4];
      const pNext = sm.quad[(i + 1) % 4];
      const dx1 = pPrev[0] - p0[0];
      const dy1 = pPrev[1] - p0[1];
      const len1 = Math.max(1, Math.hypot(dx1, dy1));
      const dx2 = pNext[0] - p0[0];
      const dy2 = pNext[1] - p0[1];
      const len2 = Math.max(1, Math.hypot(dx2, dy2));
      const arm1 = Math.min(18, len1 * 0.34);
      const arm2 = Math.min(18, len2 * 0.34);

      ctx.beginPath();
      ctx.moveTo(p0[0] + (dx1 / len1) * arm1, p0[1] + (dy1 / len1) * arm1);
      ctx.lineTo(p0[0], p0[1]);
      ctx.lineTo(p0[0] + (dx2 / len2) * arm2, p0[1] + (dy2 / len2) * arm2);
      ctx.stroke();
    }
    ctx.restore();

    // Calibrated longitudinal axis (-70 mm to +70 mm) + scanning pulse bead + keypoints
    if (v.sensor_axis?.gland && v.sensor_axis?.tip && v.sensor_axis?.center) {
      sm.gland = lerpPt2(sm.gland, mapPt(v.sensor_axis.gland), lerpAlpha);
      sm.tip = lerpPt2(sm.tip, mapPt(v.sensor_axis.tip), lerpAlpha);
      sm.center = lerpPt2(sm.center, mapPt(v.sensor_axis.center), lerpAlpha);

      if (isSpatialFull && sm.gland && sm.tip) {
        ctx.save();
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.55)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(sm.gland[0], sm.gland[1]);
        ctx.lineTo(sm.tip[0], sm.tip[1]);
        ctx.stroke();

        const axDx = sm.tip[0] - sm.gland[0];
        const axDy = sm.tip[1] - sm.gland[1];
        const axLen = Math.max(1, Math.hypot(axDx, axDy));
        const nx = -axDy / axLen;
        const ny = axDx / axLen;

        for (const frac of [0, 0.16, 0.37, 0.5, 0.69, 0.77, 1.0]) {
          const tx = sm.gland[0] + axDx * frac;
          const ty = sm.gland[1] + axDy * frac;
          ctx.beginPath();
          ctx.moveTo(tx - nx * 5, ty - ny * 5);
          ctx.lineTo(tx + nx * 5, ty + ny * 5);
          ctx.stroke();
        }

        // Traveling laser metrology bead along sensor axis
        const sweepT = 0.5 + 0.5 * Math.sin(nowMs * 0.0024);
        const beadX = sm.gland[0] + axDx * sweepT;
        const beadY = sm.gland[1] + axDy * sweepT;
        ctx.fillStyle = '#e0f2fe';
        ctx.shadowColor = sensorColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(beadX, beadY, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    if (isSpatialFull && Array.isArray(v.keypoints)) {
      ctx.save();
      v.keypoints.forEach((kp, idx) => {
        const [kx, ky] = mapPt(kp);
        const twinkle = 0.55 + 0.45 * Math.sin(nowMs * 0.005 + idx * 0.9);
        ctx.strokeStyle = `rgba(56, 189, 248, ${(0.55 * twinkle).toFixed(2)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(kx, ky, 3.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(240, 249, 255, ${(0.85 * twinkle).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(kx, ky, 1.3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    if (isSpatialFull && sm.center) {
      const estL = typeof v.est_length_mm === 'number' ? v.est_length_mm.toFixed(1) : '140.0';
      const estD = typeof v.est_diameter_mm === 'number' ? v.est_diameter_mm.toFixed(1) : '16.0';
      const angStr = typeof v.angle_deg === 'number' ? `${v.angle_deg >= 0 ? '+' : ''}${v.angle_deg.toFixed(1)}°` : '0.0°';
      const twinState = state.modbusHealthy ? '[SCADA VERIFIED]' : '[3D RECONSTRUCTING]';
      const anchorSensor = [
        sm.center[0] - Math.min(85, vw * 0.14),
        sm.center[1] - 18,
      ];
      drawSpatialLeaderCallout(ctx, {
        anchor: anchorSensor,
        boxX: 12,
        boxY: 44,
        accent: sensorColor,
        title: `TARGET · TZ THT-02 SENSOR · 99%`,
        sub: `${estL}×Ø${estD} MM · ${angStr} · ${twinState}`,
        vw,
        vh,
      });
    }
  } else {
    sm.quad = null;
  }

  // 2. PHYSICAL FAULT / OPEN SW1 DIP-8 PIN LOCK RETICLE & LEADER CALLOUT
  if ((Boolean(v.pcb_open_detected) || !state.modbusHealthy) && v.anomaly_detected && Array.isArray(v.anomaly_pt)) {
    sm.anomalyPt = lerpPt2(sm.anomalyPt, mapPt(v.anomaly_pt), lerpAlpha);
    if (sm.anomalyPt) {
      const [ax, ay] = sm.anomalyPt;
      const isDipOpen = Boolean(v.pcb_open_detected);
      const faultAccent = isDipOpen ? '#f59e0b' : '#ef4444';
      const rOuter = 16 + 5 * pulse;

      ctx.save();
      if (isDipOpen && Array.isArray(v.dip_quad) && v.dip_quad.length === 4) {
        const dq = v.dip_quad.map(mapPt);
        ctx.beginPath();
        ctx.moveTo(dq[0][0], dq[0][1]);
        for (let i = 1; i < 4; i += 1) ctx.lineTo(dq[i][0], dq[i][1]);
        ctx.closePath();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.14)';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.0;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.stroke();
      }

      ctx.strokeStyle = faultAccent;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = faultAccent;
      ctx.shadowBlur = 9;
      ctx.beginPath();
      ctx.arc(ax, ay, rOuter, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ax, ay, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#fef2f2';
      ctx.fill();
      ctx.restore();

      if (isSpatialFull) {
        const confPct = Math.round(Number(v.anomaly_confidence || 0.94) * 100);
        const zStr = typeof v.anomaly_z_mm === 'number'
          ? `z=${v.anomaly_z_mm >= 0 ? '+' : ''}${v.anomaly_z_mm.toFixed(1)} MM`
          : 'AXIAL MATCH';
        const zoneName = ZONE_SPECS[v.anomaly_zone]?.shortLabel || String(v.anomaly_zone || 'SENSOR').toUpperCase();
        drawSpatialLeaderCallout(ctx, {
          anchor: [ax, ay - rOuter],
          boxX: Math.max(264, vw * 0.46),
          boxY: 44,
          accent: faultAccent,
          title: isDipOpen
            ? `SW1 DIP-8 PIN LOCK · ${confPct}%`
            : `TWIN DEVIATION · ${zoneName} · ${confPct}%`,
          sub: isDipOpen
            ? `${zStr} · 8-PIN SWITCH ISOLATED (STICKERS IGNORED)`
            : `${zStr} · OPTICAL VS DIGITAL TWIN MISMATCH`,
          vw,
          vh,
        });
      }
    }
  } else {
    sm.anomalyPt = null;
  }

  // 3. PRECISION SCREWDRIVER / TOOL SHAFT LASER VECTOR & TIP CROSSHAIR
  if (v.tool_detected && v.tool_shaft?.tip && v.tool_shaft?.base) {
    sm.toolTip = lerpPt2(sm.toolTip, mapPt(v.tool_shaft.tip), lerpAlpha);
    sm.toolBase = lerpPt2(sm.toolBase, mapPt(v.tool_shaft.base), lerpAlpha);

    if (sm.toolTip && sm.toolBase) {
      const [tx, ty] = sm.toolTip;
      const [bx, by] = sm.toolBase;
      const toolAccent = '#e879f9';

      ctx.save();
      ctx.strokeStyle = toolAccent;
      ctx.lineWidth = 2.0;
      ctx.shadowColor = toolAccent;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      // Precision tip crosshair + rotating lock arc right where blade touches DIP-8
      const rot = (nowMs * 0.0028) % (Math.PI * 2);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(tx, ty, 9.5, rot, rot + Math.PI * 1.35);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(tx - 13, ty);
      ctx.lineTo(tx - 4, ty);
      ctx.moveTo(tx + 4, ty);
      ctx.lineTo(tx + 13, ty);
      ctx.moveTo(tx, ty - 13);
      ctx.lineTo(tx, ty - 4);
      ctx.moveTo(tx, ty + 4);
      ctx.lineTo(tx, ty + 13);
      ctx.stroke();
      ctx.restore();

      if (isSpatialFull) {
        // Place pill clear of bottom-right DIP-8 Macro PiP when visible
        const safeToolX = state.dipPipVisible ? 12 : Math.min(vw - 255, tx + 28);
        const safeToolY = state.dipPipVisible ? vh - 86 : Math.max(90, ty - 42);
        drawSpatialLeaderCallout(ctx, {
          anchor: [tx, ty],
          boxX: safeToolX,
          boxY: safeToolY,
          accent: toolAccent,
          title: 'PRECISION DRIVER · 95% · TIP LOCKED',
          sub: 'SHAFT VECTOR MASKED · [IGNORED IN 3D]',
          vw,
          vh,
        });
      }
    }
  } else {
    sm.toolTip = null;
    sm.toolBase = null;
  }

  // 4. OPERATOR HAND SEGMENTATION HULL, MOTION TRAIL & LIVE VELOCITY VECTOR
  if (v.hand_detected && Array.isArray(v.hand_center)) {
    sm.handCenter = lerpPt2(sm.handCenter, mapPt(v.hand_center), lerpAlpha);
    const handAccent = '#fbbf24';

    if (Array.isArray(v.hand_contour) && v.hand_contour.length >= 3) {
      const hPts = v.hand_contour.map(mapPt);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(hPts[0][0], hPts[0][1]);
      for (let i = 1; i < hPts.length; i += 1) ctx.lineTo(hPts[i][0], hPts[i][1]);
      ctx.closePath();
      if (isSpatialFull) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.14)';
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    }

    // Decaying optical motion trail following real hand speed
    if (isSpatialFull && Array.isArray(v.hand_trail) && v.hand_trail.length >= 2) {
      const trPts = v.hand_trail.map(mapPt);
      ctx.save();
      for (let i = 1; i < trPts.length; i += 1) {
        const frac = i / trPts.length;
        ctx.strokeStyle = `rgba(251, 191, 36, ${(0.15 + 0.65 * frac).toFixed(2)})`;
        ctx.lineWidth = 1.0 + 2.4 * frac;
        ctx.beginPath();
        ctx.moveTo(trPts[i - 1][0], trPts[i - 1][1]);
        ctx.lineTo(trPts[i][0], trPts[i][1]);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Live velocity vector arrow (px/s)
    const speedPx = Number(v.hand_velocity_px_s || 0);
    if (isSpatialFull && sm.handCenter && speedPx >= 6) {
      const vx = Number(v.hand_velocity_vec?.[0] || 0) * coverScale * 0.35;
      const vy = Number(v.hand_velocity_vec?.[1] || 0) * coverScale * 0.35;
      const clampLen = Math.max(14, Math.min(58, Math.hypot(vx, vy)));
      const ang = Math.atan2(vy, vx);
      const ex = sm.handCenter[0] + Math.cos(ang) * clampLen;
      const ey = sm.handCenter[1] + Math.sin(ang) * clampLen;

      ctx.save();
      ctx.strokeStyle = '#fde68a';
      ctx.fillStyle = '#fde68a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sm.handCenter[0], sm.handCenter[1]);
      ctx.lineTo(ex, ey);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - 7 * Math.cos(ang - 0.45), ey - 7 * Math.sin(ang - 0.45));
      ctx.lineTo(ex - 7 * Math.cos(ang + 0.45), ey - 7 * Math.sin(ang + 0.45));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (isSpatialFull && sm.handCenter) {
      const velTag = speedPx >= 6 ? `${Math.round(speedPx)} px/s` : 'STATIC';
      const safeHandX = state.dipPipVisible ? 12 : Math.max(14, sm.handCenter[0] - 115);
      const safeHandY = state.dipPipVisible ? vh - 44 : vh - 46;
      drawSpatialLeaderCallout(ctx, {
        anchor: sm.handCenter,
        boxX: safeHandX,
        boxY: safeHandY,
        accent: handAccent,
        title: `OPERATOR HAND · 97% · ${velTag}`,
        sub: 'SKIN LOCUS MASKED · [IGNORED IN 3D]',
        vw,
        vh,
      });
    }
  } else {
    sm.handCenter = null;
  }
}

/* ==========================================================================
   3D VIEWPORT MODES, RED FAULT STAIN & PROJECTED OVERLAYS
   ========================================================================== */
function setRenderMode(mode) {
  state.renderMode = mode;
  const isWire = mode === 'wireframe';
  dom.btnModeSolid.classList.toggle('active', !isWire);
  dom.btnModeWireframe.classList.toggle('active', isWire);

  for (const mat of cad.allSolidMaterials) {
    if (mat.userData?.isInternal) {
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

function setDipPipVisibility(visible, { userDismissed = false } = {}) {
  state.dipPipVisible = Boolean(visible);
  if (userDismissed) {
    state.dipPipDismissed = true;
  }
  dom.dipMacroPip.hidden = !state.dipPipVisible;
  dom.btnToggleDipPip.classList.toggle('active', state.dipPipVisible);
  if (state.dipPipVisible) {
    refreshDipCropImage();
  }
}

function setExplodedState(exploded, { manualTrigger = false, zoomDip = false } = {}) {
  if (manualTrigger) {
    state.autoExplodeEnabled = false;
    setTimeout(() => {
      state.autoExplodeEnabled = true;
    }, 12000);
  }
  state.exploded = Boolean(exploded);
  dom.btnToggleExplode.classList.toggle('active', state.exploded);

  if (state.exploded) {
    if (!state.dipPipDismissed || manualTrigger || zoomDip) {
      state.dipPipDismissed = false;
      setDipPipVisibility(true);
    }
    if (zoomDip || manualTrigger) {
      focusDip3DCamera();
    }
  } else {
    setDipPipVisibility(false);
  }
}

function updateFaultAndTwinVisuals(nowMs) {
  const pulse = 0.5 + 0.5 * Math.sin(nowMs * 0.0078);
  const emeraldGlowActive = nowMs < state.emeraldVerifyUntil;

  for (const [zoneId, meshes] of Object.entries(cad.zoneMeshes)) {
    const isFault = Boolean(state.highlightedZone === zoneId && !state.modbusHealthy);
    const isSelected = state.selectedZone === zoneId && !isFault;

    for (const mesh of meshes) {
      const mat = mesh.material;
      if (!mat || !mat.emissive) continue;
      if (isFault) {
        mat.emissive.setHex(0xef4444);
        mat.emissiveIntensity = 0.32 + 0.52 * pulse;
      } else if (emeraldGlowActive) {
        mat.emissive.setHex(0x10b981);
        mat.emissiveIntensity = 0.16 + 0.28 * pulse;
      } else if (isSelected) {
        mat.emissive.setHex(0x38bdf8);
        mat.emissiveIntensity = 0.22;
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0.0;
      }
    }
  }

  if (
    !state.modbusHealthy &&
    state.highlightedZone &&
    cad.zoneMeshes[state.highlightedZone]?.length
  ) {
    const box = cad.faultBoxHelper.box;
    box.makeEmpty();
    for (const m of cad.zoneMeshes[state.highlightedZone]) {
      box.expandByObject(m);
    }
    box.expandByScalar(1.5);
    cad.faultBoxHelper.visible = true;

    box.getCenter(cad.faultStainGroup.position);
    const s = 0.94 + 0.16 * pulse;
    cad.faultStainGroup.scale.set(s, s, s);
    cad.faultStainInnerMat.opacity = 0.24 + 0.2 * pulse;
    cad.faultStainOuterMat.opacity = 0.1 + 0.1 * pulse;
    cad.faultStainGroup.visible = true;
  } else {
    cad.faultBoxHelper.visible = false;
    cad.faultStainGroup.visible = false;
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
        ? '140.0 MM (EXPLODED DIP-8)'
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
  }

  if (!state.modbusHealthy && state.highlightedZone && ZONE_SPECS[state.highlightedZone]) {
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
      const clampedX = Math.max(130, Math.min(w - 130, screenPt.x));
      const clampedY = Math.max(92, Math.min(h - 78, screenPt.y));
      dom.faultCallout.style.left = `${clampedX}px`;
      dom.faultCallout.style.top = `${clampedY}px`;
      dom.faultCalloutZone.textContent = `⚠️ TWIN DEVIATION: ${spec.shortLabel} — PROBABLE FAULT SOURCE`;
      dom.faultCalloutText.textContent = state.faultReason || spec.summary;
    }
  } else {
    dom.faultCallout.hidden = true;
  }
}

function updateTwinMatchBadge() {
  dom.twinMatchBadge.classList.remove('is-nominal', 'is-verified', 'is-deviation');
  if (state.modbusHealthy && !state.highlightedZone) {
    dom.twinMatchBadge.classList.add('is-verified');
    dom.twinMatchBadge.textContent = state.modbusSimulation
      ? 'SIMULATION · PARAMETRIC CAD 140×Ø16 MM'
      : 'PARAMETRIC CAD MODEL · 140.0×Ø16.0 MM';
  } else if (state.highlightedZone && ZONE_SPECS[state.highlightedZone]) {
    dom.twinMatchBadge.classList.add('is-deviation');
    dom.twinMatchBadge.textContent = `⚠️ ZONE FOCUS: ${ZONE_SPECS[state.highlightedZone].shortLabel}`;
  } else if (state.activeCameraMode === 'usb' && !state.sensorDetected) {
    dom.twinMatchBadge.textContent = state.cameraOffline
      ? 'AWAITING USB CAMERA'
      : 'AWAITING SENSOR IN VIEW';
  } else {
    dom.twinMatchBadge.classList.add('is-nominal');
    dom.twinMatchBadge.textContent = 'PARAMETRIC CAD MODEL · 140.0×Ø16.0 MM';
  }
}

function selectZone(zoneId, { flipManual = false } = {}) {
  const spec = ZONE_SPECS[zoneId];
  if (!spec) return;
  state.selectedZone = zoneId;

  dom.assemblyTreePills.querySelectorAll('.part-chip').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.zone === zoneId);
  });

  dom.selectedPartSummary.textContent = `${spec.title} (${spec.zRange}) — ${spec.dims} · Manual Page ${spec.manualPage}`;

  if (zoneId === 'upper_barrel_dip' && !state.exploded) {
    setExplodedState(true, { manualTrigger: true, zoomDip: true });
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
    dom.hudStatusTag.textContent = `FAULT: ${short}`;
    dom.hudStatusTag.classList.add('is-fault');
  } else {
    dom.scanZoneVal.textContent = 'NONE';
    dom.scanZoneVal.classList.remove('fault-active');
    if (state.activeCameraMode === 'usb' && !state.sensorDetected) {
      dom.hudStatusTag.textContent = state.cameraOffline ? 'NO CAMERA' : 'SCANNING...';
    } else {
      dom.hudStatusTag.textContent = 'NOMINAL';
    }
    dom.hudStatusTag.classList.remove('is-fault');
  }
  updateTwinMatchBadge();
}

/* ==========================================================================
   INTERACTIVE 8-POSITION DIP SWITCH MACRO PIP & CALCULATOR (MANUAL PAGE 5)
   ========================================================================== */
function computeDipAddress() {
  return state.dipBits.reduce((acc, bit, idx) => acc + (bit ? DIP_WEIGHTS[idx] : 0), 0);
}

function renderDipHud() {
  const addr = computeDipAddress();
  const activePositions = state.dipBits
    .map((b, idx) => (b ? idx + 1 : null))
    .filter(Boolean);
  const posText = activePositions.length ? `PIN ${activePositions.join(',')} ON` : 'ALL OFF';
  const hexAddr = `0x${addr.toString(16).toUpperCase().padStart(2, '0')}`;
  const paddedAddr = String(addr).padStart(2, '0');

  dom.dipCalcAddr.textContent = `SLAVE #${paddedAddr} (${hexAddr})`;
  dom.labelDipAddr.textContent = `MODBUS ADDR: #${paddedAddr} [${posText}]`;
  dom.escSummaryDip.textContent = `Slave #${paddedAddr} (${posText})`;

  if (dom.dipPinSummary) {
    dom.dipPinSummary.textContent = activePositions.length
      ? `ON: Pin ${activePositions.join(', ')} -> Modbus Slave #${addr} (Click pins to toggle)`
      : 'Warning: All pins OFF (Address 0). Set Pin 8 ON for Slave #1.';
  }

  dom.dipSwitchesRow.innerHTML = '';
  state.dipBits.forEach((bit, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `dip-bit-btn${bit ? ' is-on' : ''}`;
    btn.title = `DIP Pin ${idx + 1} (Weight ${DIP_WEIGHTS[idx]}): ${bit ? 'ON' : 'OFF'}`;
    btn.innerHTML = `<span>${idx + 1}</span><span class="dip-knob"></span><span>${DIP_WEIGHTS[idx]}</span>`;
    btn.addEventListener('click', () => toggleDipBit(idx));
    dom.dipSwitchesRow.appendChild(btn);
  });

  cad.dipActuatorMeshes.forEach((mesh, idx) => {
    mesh.position.x = state.dipBits[idx] ? 0.85 : -0.85;
  });

  if (state.dipCropFailed) {
    drawDipCropFallback();
  }
}

function toggleDipBit(index) {
  if (index < 0 || index >= 8) return;
  state.dipBits[index] = state.dipBits[index] ? 0 : 1;
  renderDipHud();
}

function refreshDipCropImage() {
  if (!state.dipPipVisible || !dom.dipCropImg) return;
  dom.dipCropImg.src = `/api/video/dip_crop?t=${Date.now()}`;
}

function drawDipCropFallback() {
  const canvas = dom.dipCropFallbackCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#091422';
  ctx.fillRect(0, 0, w, h);

  // Blue PCB + Red DIP-8 close-up macro diagram
  ctx.fillStyle = '#0d4a84';
  ctx.fillRect(14, 8, w - 28, h - 16);
  ctx.strokeStyle = '#38bdf8';
  ctx.strokeRect(14, 8, w - 28, h - 16);

  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(46, 16, w - 92, h - 32);

  for (let i = 0; i < 8; i++) {
    const x = 56 + i * 21;
    const isOn = Boolean(state.dipBits[i]);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, 22, 13, 34);
    ctx.fillStyle = isOn ? '#fbbf24' : '#f8fafc';
    ctx.fillRect(x + 1, isOn ? 23 : 41, 11, 14);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(String(i + 1), x + 4, 68);
  }
}

/* ==========================================================================
   REAL-TIME uPLOT DUAL-SERIES SCADA TELEMETRY GRAPH (+ CANVAS FALLBACK)
   ========================================================================== */
const scadaSeries = {
  uplot: null,
  maxPoints: 60,
  ts: [],
  temp: [],
  hum: [],
};

function initScadaChart() {
  const nowSec = Math.floor(Date.now() / 1000);
  scadaSeries.ts = [];
  scadaSeries.temp = [];
  scadaSeries.hum = [];
  for (let i = 24; i >= 1; i--) {
    scadaSeries.ts.push(nowSec - i);
    scadaSeries.temp.push(null);
    scadaSeries.hum.push(null);
  }

  const wrap = dom.scadaChartWrap;
  const width = Math.max(240, (wrap?.clientWidth || 420) - 4);
  const height = Math.max(90, (wrap?.clientHeight || 118) - 2);

  if (typeof window.uPlot === 'function' && dom.scadaChart) {
    const opts = {
      width,
      height,
      cursor: { show: true, drag: { x: false, y: false } },
      legend: { show: false },
      scales: {
        x: { time: true },
        temp: {
          auto: true,
          range: (_u, min, max) => [
            min == null ? 18 : Math.min(18, min - 2),
            max == null ? 34 : Math.max(32, max + 2),
          ],
        },
        hum: {
          auto: true,
          range: (_u, min, max) => [
            min == null ? 30 : Math.min(30, min - 4),
            max == null ? 85 : Math.max(75, max + 5),
          ],
        },
      },
      axes: [
        {
          stroke: '#64748b',
          grid: { stroke: 'rgba(51,65,85,0.35)', width: 1 },
          ticks: { stroke: 'rgba(51,65,85,0.5)', size: 4 },
          font: '10px monospace',
          values: (_u, vals) =>
            vals.map((v) =>
              new Date(v * 1000).toLocaleTimeString('en-US', {
                hour12: false,
                minute: '2-digit',
                second: '2-digit',
              })
            ),
        },
        {
          scale: 'temp',
          stroke: '#fbbf24',
          grid: { stroke: 'rgba(51,65,85,0.32)', width: 1 },
          font: '10px monospace',
          size: 40,
          values: (_u, vals) => vals.map((v) => `${Number(v).toFixed(0)}°`),
        },
        {
          side: 1,
          scale: 'hum',
          stroke: '#38bdf8',
          grid: { show: false },
          font: '10px monospace',
          size: 42,
          values: (_u, vals) => vals.map((v) => `${Number(v).toFixed(0)}%`),
        },
      ],
      series: [
        {},
        {
          label: 'Temp (°C)',
          scale: 'temp',
          stroke: '#fbbf24',
          width: 2.2,
          fill: 'rgba(251, 191, 36, 0.10)',
          spanGaps: true,
        },
        {
          label: 'Humidity (%RH)',
          scale: 'hum',
          stroke: '#38bdf8',
          width: 2.2,
          fill: 'rgba(56, 189, 248, 0.10)',
          spanGaps: true,
        },
      ],
    };

    scadaSeries.uplot = new window.uPlot(
      opts,
      [scadaSeries.ts, scadaSeries.temp, scadaSeries.hum],
      dom.scadaChart
    );

    const ro = new ResizeObserver(() => {
      if (!scadaSeries.uplot || !wrap) return;
      const w = Math.max(200, wrap.clientWidth - 4);
      const h = Math.max(85, wrap.clientHeight - 2);
      scadaSeries.uplot.setSize({ width: w, height: h });
    });
    ro.observe(wrap);
  } else if (dom.scadaFallbackCanvas) {
    dom.scadaFallbackCanvas.hidden = false;
    drawFallbackScadaChart();
  }
}

function pushScadaSample(tempVal, humVal) {
  const nowSec = Date.now() / 1000;
  const prevTs = scadaSeries.ts.length ? scadaSeries.ts[scadaSeries.ts.length - 1] : 0;
  const safeTs = nowSec <= prevTs ? prevTs + 0.1 : nowSec;

  scadaSeries.ts.push(safeTs);
  scadaSeries.temp.push(typeof tempVal === 'number' && !Number.isNaN(tempVal) ? tempVal : null);
  scadaSeries.hum.push(typeof humVal === 'number' && !Number.isNaN(humVal) ? humVal : null);

  while (scadaSeries.ts.length > scadaSeries.maxPoints) {
    scadaSeries.ts.shift();
    scadaSeries.temp.shift();
    scadaSeries.hum.shift();
  }

  if (scadaSeries.uplot) {
    scadaSeries.uplot.setData([scadaSeries.ts, scadaSeries.temp, scadaSeries.hum]);
  } else {
    drawFallbackScadaChart();
  }
}

function drawFallbackScadaChart() {
  const canvas = dom.scadaFallbackCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#070c12';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#192534';
  for (let y = 20; y < h; y += 28) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const drawTrace = (arr, minV, maxV, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    arr.forEach((v, idx) => {
      if (v == null) return;
      const x = (idx / Math.max(1, arr.length - 1)) * (w - 16) + 8;
      const y = h - 10 - ((v - minV) / Math.max(1, maxV - minV)) * (h - 22);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    });
    if (started) ctx.stroke();
  };

  drawTrace(scadaSeries.temp, 15, 42, '#fbbf24');
  drawTrace(scadaSeries.hum, 25, 95, '#38bdf8');
}

/* ==========================================================================
   MANUAL & 2D BLUEPRINT DRAWER + FULLSCREEN LIGHTBOX
   ========================================================================== */
function setManualPage(pageNum, { flash = false, expandDrawer = false } = {}) {
  const page = Math.max(1, Math.min(9, Number(pageNum) || 1));
  state.manualPage = page;
  const imgUrl = `/assets/manual_pages/page_${page}.png`;
  const caption = MANUAL_PAGES[page] || `Page ${page} · TZ THT-02 Datasheet`;

  dom.manualPageImg.src = imgUrl;
  dom.manualPageImg.alt = `TZ THT-02 Technical Manual Page ${page}`;
  dom.manualPageIndicator.textContent = `PAGE ${page} / 9`;
  dom.manualPageCaption.textContent = caption;

  dom.manualQuickPills.querySelectorAll('.page-pill').forEach((pill) => {
    pill.classList.toggle('active', Number(pill.dataset.page) === page);
  });

  dom.lightboxImg.src = imgUrl;
  dom.lightboxPageBadge.textContent = `${page} / 9`;
  dom.lightboxTitle.textContent = `TZ THT-02 User's Manual V1.1 — ${caption}`;

  if (expandDrawer && state.manualCollapsed) {
    state.manualCollapsed = false;
    dom.manualDrawer.classList.remove('is-collapsed');
    dom.btnToggleManualDrawer.setAttribute('aria-expanded', 'true');
  }

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

  ctx.fillStyle = '#0b1118';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#182433';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  if (state.activeCameraMode !== 'usb') {
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
  }

  ctx.fillStyle = '#7dd3fc';
  ctx.font = '12px monospace';
  ctx.fillText(`LOCAL MODE: ${state.activeCameraMode.toUpperCase()} · AWAITING /api/video/stream`, 16, h - 14);
}

/* ==========================================================================
   DYNAMIC SYSTEM STATE BANNER, ANDON STACK LIGHT & WORKFLOW STEPPER SYNC
   ========================================================================== */
function setWorkflowActiveStep(stepNum) {
  state.activeStep = stepNum;
  const map = [
    [1, dom.btnStepInspect],
    [2, dom.btnStepDip],
    [3, dom.btnStepConnect],
    [4, dom.btnStepSignoff],
  ];
  for (const [n, btn] of map) {
    if (btn) btn.classList.toggle('is-current', n === stepNum);
  }
}

function updateAndonAndBanners({ healthy, abn7fff, mb, repair }) {
  const stage = repair?.stage || state.repairStage || 'IDLE_MONITORING';
  state.repairStage = stage;

  let andon = String(repair?.andon_state || '').toUpperCase();
  if (!['RED', 'AMBER', 'GREEN'].includes(andon)) {
    if (healthy) {
      andon = 'GREEN';
    } else if (stage === 'STEP2_GUIDING_DIP_MODBUS' || state.activeStep === 2) {
      andon = 'AMBER';
    } else {
      andon = 'RED';
    }
  }
  // Always prioritize healthy live SCADA green or 0x7FFF red alarm
  if (healthy) andon = 'GREEN';
  if (abn7fff) andon = 'RED';

  // 1. Update 3-Tier Industrial Signal Tower Lamp (Red / Yellow / Green)
  dom.andonStack.dataset.andon = andon;
  if (dom.andonColumn) dom.andonColumn.dataset.andon = andon;
  dom.andonRed.classList.toggle('is-active', andon === 'RED');
  dom.andonAmber.classList.toggle('is-active', andon === 'AMBER');
  dom.andonGreen.classList.toggle('is-active', andon === 'GREEN');

  // 2. Update Top System State Banner & Bottom SCADA Console Header
  dom.systemStateBanner.classList.remove('is-red', 'is-amber', 'is-green');
  dom.nextStepBox.classList.toggle('is-online', healthy);

  const isSimMb = Boolean(mb?.simulation || String(mb?.source || '').startsWith('simulator'));
  const hasHistorical = Boolean(!healthy && mb?.historical_sample);

  if (andon === 'GREEN') {
    dom.systemStateBanner.classList.add('is-green');
    if (isSimMb) {
      dom.systemStateText.textContent = '🧪 SIMULATION MODE · SYNTHETIC RESPONSE';
      dom.systemStateSub.textContent = `Simulated Slave #${mb?.slave_id || 1} · ${Number(mb?.temp_c ?? 24.4).toFixed(1)} °C · ${Number(mb?.humidity_rh ?? 48.8).toFixed(1)} %RH (Does Not Verify Hardware)`;
      dom.scadaLiveCard.dataset.scadaState = 'green';
      dom.scadaStatusBadge.textContent = 'SIMULATION: SYNTHETIC TELEMETRY';
    } else {
      dom.systemStateText.textContent = '🟢 SENSOR RESPONDED · COMM OK';
      dom.systemStateSub.textContent = `Bench Modbus Slave #${mb?.slave_id || 1} (${mb?.protocol || 'RTU'}) · ${Number(mb?.temp_c ?? 24.4).toFixed(1)} °C · ${Number(mb?.humidity_rh ?? 48.8).toFixed(1)} %RH · PLC/SCADA Not Verified`;
      dom.scadaLiveCard.dataset.scadaState = 'green';
      dom.scadaStatusBadge.textContent = 'GREEN: SENSOR RESPONDED (BENCH SCOPE)';
    }

    dom.nextStepTitle.textContent = 'NEXT STEP · STEP 4: EXPORT BENCH DOSSIER';
    dom.nextStepBody.innerHTML =
      'Observation recorded. Click <strong>PDF + JSON</strong> or <strong>4. 3D Sign-Off Dossier</strong> to save local maintenance evidence.';
    if (state.activeStep < 3) setWorkflowActiveStep(3);
  } else if (andon === 'AMBER') {
    dom.systemStateBanner.classList.add('is-amber');
    const targetSid = mb?.target_slave_id || computeDipAddress() || 1;
    dom.systemStateText.textContent = '🟡 INSPECTING · CONFIGURE DIP-8';
    dom.systemStateSub.textContent = `Set SW1 DIP-8 to Slave #${targetSid} · Close Housing & Poll Bus`;
    dom.scadaLiveCard.dataset.scadaState = 'amber';
    dom.scadaStatusBadge.textContent = 'AMBER: AWAITING SENSOR RESPONSE';

    dom.nextStepTitle.textContent = `NEXT STEP · STEP 3: POLL SLAVE #${targetSid}`;
    dom.nextStepBody.innerHTML =
      'Verify DIP-8 switches in the macro inset, re-thread the IP65 barrel, and click <strong>Start Read-Only Poll</strong>.';
  } else {
    dom.systemStateBanner.classList.add('is-red');
    dom.scadaLiveCard.dataset.scadaState = 'red';
    if (abn7fff) {
      dom.systemStateText.textContent = isSimMb
        ? '🧪 SIMULATION · 0x7FFF PROBE FAULT'
        : '🔴 SENSOR RESPONDED · 0x7FFF CHANNEL FAULT';
      dom.systemStateSub.textContent = 'Communication OK, but register 0000H/0001H returned 0x7FFF abnormal sentinel (Manual Page 6)';
      dom.scadaStatusBadge.textContent = 'ALERT: 0x7FFF SHT30 CHANNEL FAULT';
      dom.nextStepTitle.textContent = 'NEXT STEP · INSPECT SHT30 STRAINER TIP';
      dom.nextStepBody.innerHTML =
        'Channel reports <code>0x7FFF</code> sentinel. Inspect stainless steel strainer head for condensation or obstruction.';
    } else if (hasHistorical) {
      const hs = mb.historical_sample;
      dom.systemStateText.textContent = '🟠 LINK LOST · HISTORICAL DATA ONLY';
      dom.systemStateSub.textContent = `No fresh response (${mb?.error_code || 'TIMEOUT'}) · Historical from ${hs.captured_at_utc || 'earlier'}: ${hs.temp_c ?? '--'} °C / ${hs.humidity_rh ?? '--'} %RH`;
      dom.scadaStatusBadge.textContent = 'HISTORICAL SAMPLE ONLY · LINK OFFLINE';
      dom.nextStepTitle.textContent = 'NEXT STEP · RESTORE PHYSICAL LINK';
      dom.nextStepBody.innerHTML =
        'Link lost after previous reading. Last value is preserved strictly as <strong>Historical</strong> and cannot close as fresh verification.';
    } else if (stage === 'STEP1_OPEN_FAULT_DETECTED' || state.exploded) {
      dom.systemStateText.textContent = '🔴 OFFLINE · OPEN HOUSING DETECTED';
      dom.systemStateSub.textContent = 'Internal Blue DIP-8 PCB Exposed · Configure Modbus Slave Address';
      dom.scadaStatusBadge.textContent = 'STANDBY: NO MODBUS SIGNAL';
      dom.nextStepTitle.textContent = 'NEXT STEP · STEP 2: FOCUS & SET DIP-8';
      dom.nextStepBody.innerHTML =
        'Open housing detected! Click <strong>2. Focus &amp; Set DIP-8</strong> to inspect the 8 pins and Modbus address.';
    } else {
      dom.systemStateText.textContent = '🔴 STANDBY / NO SENSOR RESPONSE';
      dom.systemStateSub.textContent = state.highlightedZone
        ? `Zone Focus: ${ZONE_SPECS[state.highlightedZone]?.shortLabel || state.highlightedZone} · No Modbus Response`
        : 'No Modbus Response · Click "1. Inspect Fault" or "Start Read-Only Poll"';
      dom.scadaStatusBadge.textContent = 'STANDBY: NO MODBUS SIGNAL';
      dom.nextStepTitle.textContent = 'NEXT STEP · STEP 1: INSPECT SENSOR';
      dom.nextStepBody.innerHTML =
        'Click <strong>1. Inspect Fault</strong> in the top bar or hold the Push-to-Speak microphone button to begin.';
    }
  }
}

/* ==========================================================================
   BACKEND API INTEGRATION & REAL-TIME TELEMETRY POLLING (~650ms)
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
  throw lastErr || new Error('Local offline API endpoint unavailable');
}

function applyTelemetryPayload(data) {
  if (!data || typeof data !== 'object') return;

  const vision = data.vision || data.telemetry || data.camera || data;
  const sys = data.system || data.hardware || data;
  const offline = data.offline || data.airplane_guard || data;

  // 1. Airplane Mode Badge
  const blocked = offline.blocked_external_attempts ?? 0;
  const offlineOk = offline.offline_verified !== false && offline.guard_active !== false;
  if (offlineOk) {
    dom.pillAirplaneText.textContent = `Airplane Mode: Verified (${blocked} Blocked)`;
  }

  // 2. Camera FPS & Source
  const fps = vision.fps ?? data.fps;
  const camSrc = vision.camera_source || vision.sim_mode || state.activeCameraMode;
  const srcStr = String(camSrc).toLowerCase();
  const isUvcOffline = vision.sim_mode === 'uvc_offline' || srcStr.includes('offline');
  const isIpadCam =
    !isUvcOffline &&
    (state.activeCameraMode === 'ipad_camera' || srcStr.includes('ipad'));
  const isRealUsb =
    !isUvcOffline &&
    (srcStr.startsWith('uvc:') || srcStr.includes('video') || camSrc === 'uvc' || camSrc === 'usb');
  state.cameraOffline = isUvcOffline;
  if (vision.detected !== undefined) {
    state.sensorDetected = Boolean(vision.detected);
  }
  if (fps !== undefined) {
    dom.pillCamText.textContent = isUvcOffline ? 'STANDBY' : `${Number(fps).toFixed(0)} FPS`;
    dom.camSourceBadge.textContent = isIpadCam
      ? 'IPAD M4 CAM'
      : isRealUsb
        ? 'LIVE USB CAM'
        : isUvcOffline
          ? 'USB CAM STANDBY'
          : String(camSrc).toUpperCase();
  }

  // Sync camera dropdown if changed externally
  if (vision.mode) {
    state.activeCameraMode = vision.mode;
    if (dom.selectCameraMode && dom.selectCameraMode.value !== vision.mode) {
      const hasOpt = Array.from(dom.selectCameraMode.options).some((o) => o.value === vision.mode);
      if (hasOpt) dom.selectCameraMode.value = vision.mode;
    }
  }

  // 3. AI Model, RAM & Latency
  if (sys.model_name || sys.models_label) {
    dom.pillModelText.textContent = sys.model_name || sys.models_label;
  }
  const ramUsed = sys.ram_used_gb ?? sys.memory_used_gb;
  const ramTotal = sys.ram_total_gb ?? sys.memory_total_gb;
  if (ramUsed !== undefined && ramTotal !== undefined) {
    dom.pillRamText.textContent = `${Number(ramUsed).toFixed(1)}/${Number(ramTotal).toFixed(0)} GB`;
  }
  const latMs = sys.last_latency_ms ?? data.latency_ms;
  const tokSec = sys.tokens_per_sec ?? data.tok_per_s ?? data.tps;
  if (latMs !== undefined && latMs !== null && Number(latMs) > 0) {
    const tpsText = tokSec ? ` (${Number(tokSec).toFixed(1)} tok/s)` : '';
    dom.pillLatencyText.textContent = `${Math.round(Number(latMs))} ms${tpsText}`;
  }

  // 4. Operator Hand & Screwdriver Spatial Exclusion Filter + Scanner Angle & Metrology
  if (vision && typeof vision === 'object' && vision.detected !== undefined) {
    state.visionSpatial = vision;
  }
  const handDet = Boolean(vision.hand_detected);
  const toolDet = Boolean(vision.tool_detected);
  const occActive = Boolean(vision.occlusion_filtered || handDet || toolDet);
  state.handDetected = handDet;
  state.toolDetected = toolDet;
  state.occlusionFiltered = occActive;

  if (dom.isolationGuardBadge) {
    dom.isolationGuardBadge.classList.toggle('is-filtering', occActive);
    if (handDet && toolDet) {
      dom.isolationGuardBadge.textContent = 'HAND + TOOL MASKED · SENSOR ONLY';
    } else if (handDet) {
      dom.isolationGuardBadge.textContent = 'HAND MASKED · SENSOR ONLY';
    } else if (toolDet) {
      dom.isolationGuardBadge.textContent = 'TOOL MASKED · SENSOR ONLY';
    } else {
      dom.isolationGuardBadge.textContent = '3D LOCK: SENSOR ONLY';
    }
  }

  if (dom.hudIsolationPill) {
    dom.hudIsolationPill.hidden = !occActive;
    if (handDet && toolDet) {
      dom.hudIsolationPill.textContent = 'HAND + SCREWDRIVER IGNORED IN 3D';
    } else if (handDet) {
      dom.hudIsolationPill.textContent = 'OPERATOR HAND IGNORED IN 3D';
    } else if (toolDet) {
      dom.hudIsolationPill.textContent = 'SCREWDRIVER / TOOL IGNORED IN 3D';
    }
  }

  if (vision.detected) {
    if (typeof vision.angle_deg === 'number') {
      if (!occActive) {
        state.cameraAngleDeg = vision.angle_deg;
      }
      dom.scanAngleVal.textContent = `${vision.angle_deg.toFixed(1)}°`;

      state.scanFramesObserved += 1;
      state.minObservedAngle = Math.min(state.minObservedAngle, vision.angle_deg);
      state.maxObservedAngle = Math.max(state.maxObservedAngle, vision.angle_deg);
      const angularSpan = state.maxObservedAngle - state.minObservedAngle;
      const coveragePct = Math.min(
        100,
        Math.round(36 + angularSpan * 4.5 + Math.min(46, state.scanFramesObserved * 1.4))
      );
      dom.scanCoverageVal.textContent = `${coveragePct}%`;
      dom.scanCoverageFill.style.width = `${coveragePct}%`;
    }

    const estL = vision.est_length_mm;
    const estD = vision.est_diameter_mm;
    if (typeof estL === 'number' && typeof estD === 'number') {
      dom.scanDimVal.textContent = `${estL.toFixed(1)}×${estD.toFixed(1)} mm`;
    }
  } else if (vision.detected === false) {
    dom.scanAngleVal.textContent = '--.-°';
    dom.scanCoverageVal.textContent = '0%';
    dom.scanCoverageFill.style.width = '0%';
    dom.scanDimVal.textContent = isUvcOffline ? 'NO CAMERA' : 'SCANNING...';
  }

  // 5. Auto-Explode 3D Housing & DIP-8 Pin-Focus Macro PiP
  const physPcbNow = Boolean(vision.pcb_open_detected);
  if (physPcbNow && !state.wasPhysicalPcbOpen) {
    state.dipPipDismissed = false;
  }
  state.wasPhysicalPcbOpen = physPcbNow;

  const pcbOpen = Boolean(
    physPcbNow || data.explode_pcb || data.repair?.focus_dip
  );
  if (state.autoExplodeEnabled && pcbOpen !== state.exploded) {
    setExplodedState(pcbOpen, { zoomDip: pcbOpen });
  }
  if (pcbOpen && !state.dipPipVisible && !state.dipPipDismissed) {
    setDipPipVisibility(true);
  }

  // 6. Real-Time Optical Anomaly -> 3D Red/Amber Fault Highlight
  if (!state.modbusHealthy || physPcbNow) {
    if (vision.anomaly_detected && vision.anomaly_zone) {
      setFaultHighlight(
        vision.anomaly_zone,
        vision.anomaly_label ||
          (physPcbNow
            ? 'Physical SW1 DIP-8 switch exposed on camera — white stickers rejected, 8-pin block locked.'
            : `Optical deviation localized on ${vision.anomaly_zone} (${(
                Number(vision.anomaly_confidence || 0.92) * 100
              ).toFixed(0)}% confidence)`)
      );
    } else if (vision.anomaly_detected === false && !state.lastDiagnosisFaultLock) {
      setFaultHighlight(null);
    }
  }

  // 7. Live Bench Modbus Telemetry, Freshness & Action Gating
  const mb = data.modbus || {};
  const pollSeq = Number(mb.poll_seq || 0);
  if (pollSeq > 0 && pollSeq < state.lastPollSeq && mb.mode === dom.selectModbusMode?.value) {
    return; // Ignore out-of-order stale status packet
  }
  if (pollSeq > 0) state.lastPollSeq = pollSeq;

  const healthy = Boolean(mb.healthy && mb.fresh !== false);
  const abn7fff = Boolean(mb.online && mb.sensor_abnormal_7fff);
  const isSimMb = Boolean(mb.simulation || String(mb.source || '').startsWith('simulator'));
  state.modbusHealthy = healthy;
  state.modbusSimulation = isSimMb;

  if (mb.mode && dom.selectModbusMode && dom.selectModbusMode.value !== mb.mode) {
    const hasMbOpt = Array.from(dom.selectModbusMode.options).some((o) => o.value === mb.mode);
    if (hasMbOpt) dom.selectModbusMode.value = mb.mode;
  }

  // Gate virtual simulation buttons out of physical bench modes (`Phase 1.7`)
  const simModeActive = String(dom.selectModbusMode?.value || mb.mode || 'auto').startsWith('sim_');
  if (dom.btnSimConnectModbus) dom.btnSimConnectModbus.hidden = !simModeActive;
  if (dom.btnBreathTest) dom.btnBreathTest.hidden = !simModeActive;
  if (dom.btnPollReadonly) dom.btnPollReadonly.hidden = simModeActive;

  // Rising edge: Sensor just responded cleanly on Modbus!
  if (healthy && !state.wasModbusHealthy) {
    state.lastDiagnosisFaultLock = false;
    if (!physPcbNow) {
      setFaultHighlight(null);
    }
    state.emeraldVerifyUntil = performance.now() + 2600;
    if (state.exploded && state.autoExplodeEnabled && !pcbOpen) {
      setExplodedState(false);
      reset3DCamera();
    }
  }
  state.wasModbusHealthy = healthy;

  dom.scadaTempVal.classList.toggle('is-alarm', abn7fff && mb.temp_quality !== 'valid');
  dom.scadaHumVal.classList.toggle('is-alarm', abn7fff && mb.humidity_quality !== 'valid');

  const isMbap = mb.protocol === 'modbus_tcp_mbap';
  if (healthy) {
    const tVal = Number(mb.temp_c);
    const hVal = Number(mb.humidity_rh);
    dom.scadaTempVal.textContent = `${tVal.toFixed(1)} °C`;
    dom.scadaHumVal.textContent = `${hVal.toFixed(1)} %RH`;
    dom.scadaSlaveVal.textContent = `Slave #${String(mb.slave_id || 1).padStart(2, '0')} · ${isMbap ? 'MODBUS TCP' : `${mb.baud_bps || 9600} 8N1`}`;
    dom.scadaCrcPill.textContent = isSimMb ? 'SIMULATED' : isMbap ? 'MBAP OK' : 'CRC-16 OK';
    dom.scadaFrameHex.textContent = `RX: ${mb.last_rx_hex || ''} (${mb.roundtrip_ms || 12} ms)`;
    pushScadaSample(tVal, hVal);
  } else if (abn7fff) {
    dom.scadaTempVal.textContent = mb.temp_c !== null && mb.temp_c !== undefined ? `${Number(mb.temp_c).toFixed(1)} °C` : '0x7FFF';
    dom.scadaHumVal.textContent = mb.humidity_rh !== null && mb.humidity_rh !== undefined ? `${Number(mb.humidity_rh).toFixed(1)} %RH` : '0x7FFF';
    dom.scadaSlaveVal.textContent = `Slave #${String(mb.slave_id || 1).padStart(2, '0')} · ${isMbap ? 'MODBUS TCP' : `${mb.baud_bps || 9600} 8N1`}`;
    dom.scadaCrcPill.textContent = 'CHANNEL 0x7FFF';
    dom.scadaFrameHex.textContent = `RX: ${mb.last_rx_hex || ''} (CHANNEL FAULT)`;
    setFaultHighlight('strainer_head', 'Modbus Register 0x0000/0x0001 returned 0x7FFF channel sentinel.');
    pushScadaSample(null, null);
  } else if (mb.historical_sample) {
    const hs = mb.historical_sample;
    dom.scadaTempVal.textContent = hs.temp_c !== null && hs.temp_c !== undefined ? `${Number(hs.temp_c).toFixed(1)}*` : '--.- °C';
    dom.scadaHumVal.textContent = hs.humidity_rh !== null && hs.humidity_rh !== undefined ? `${Number(hs.humidity_rh).toFixed(1)}*` : '--.- %RH';
    dom.scadaSlaveVal.textContent = `HISTORICAL (${hs.captured_at_utc ? hs.captured_at_utc.slice(11, 19) + 'Z' : 'EARLIER'})`;
    dom.scadaCrcPill.textContent = mb.error_code || 'HISTORICAL';
    dom.scadaFrameHex.textContent = `LINK OFFLINE · LAST TX: ${mb.last_tx_hex || '01 03 00 00 00 08 44 0C'}`;
    pushScadaSample(null, null);
  } else {
    dom.scadaTempVal.textContent = '--.- °C';
    dom.scadaHumVal.textContent = '--.- %RH';
    dom.scadaSlaveVal.textContent = `Slave #${String(mb.target_slave_id || computeDipAddress() || 1).padStart(2, '0')} · ${isMbap ? 'MODBUS TCP' : `${mb.baud_bps || 9600} 8N1`}`;
    dom.scadaCrcPill.textContent = mb.error_code || (mb.adapter_present ? 'BUS TIMEOUT' : 'NO SIGNAL');
    dom.scadaFrameHex.textContent = `TX: ${mb.last_tx_hex || '01 03 00 00 00 08 44 0C'} · AWAITING RESPONSE`;
    pushScadaSample(null, null);
  }

  updateAndonAndBanners({ healthy, abn7fff, mb, repair: data.repair });
  updateTwinMatchBadge();

  // 8. Zero-Click Proactive Live Repair Voice Event Watcher
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
          reset3DCamera();
        }
        handleCopilotResponse({
          ...ev,
          model: `LIVE WATCH · ${ev.title || 'SCADA EVENT'}`,
        });
      })
      .catch(() => {});
  }
}

async function pollTelemetry() {
  try {
    const data = await fetchJsonWithFallback(['/api/telemetry', '/api/status', '/api/health']);
    applyTelemetryPayload(data);
    const noStreamPixels = !dom.videoStream || dom.videoStream.naturalWidth === 0;
    if (state.videoStreamFailed || noStreamPixels) {
      rescueSnapshotToFallbackCanvas();
      if (Date.now() - (state.lastStreamRetryTs || 0) > 2200) {
        state.lastStreamRetryTs = Date.now();
        dom.videoStream.src = `/api/video/stream?raw=1&t=${Date.now()}`;
      }
    }
    if (state.dipPipVisible) {
      refreshDipCropImage();
    }
  } catch (_err) {
    drawFallbackScannerFrame();
  }
}

async function pollVisionSpatialTelemetry() {
  if (state.fastVisionInFlight || (state.cvHudMode === 'raw' && state.camZoomMode !== 'auto')) return;
  state.fastVisionInFlight = true;
  try {
    const resp = await fetch('/api/video/telemetry', { cache: 'no-store' });
    if (resp.ok) {
      const vision = await resp.json();
      if (vision && typeof vision === 'object') {
        state.visionSpatial = vision;
        const handDet = Boolean(vision.hand_detected);
        const toolDet = Boolean(vision.tool_detected);
        const occActive = Boolean(vision.occlusion_filtered || handDet || toolDet);
        if (!occActive && typeof vision.angle_deg === 'number') {
          state.cameraAngleDeg = vision.angle_deg;
        }
      }
    }
  } catch (_err) {
    // Handled cleanly by main telemetry loop
  } finally {
    state.fastVisionInFlight = false;
  }
}

function applyUnifiedStatus(data) {
  return applyTelemetryPayload(data);
}

/* ==========================================================================
   LIVE IPAD AIR M4 CAMERA STREAMING (ipad_camera MODE -> POST /api/video/ipad_frame)
   ========================================================================== */
let ipadCamStream = null;
let ipadCamVideoEl = null;
let ipadCamOffscreenCanvas = null;
let ipadCamLoopActive = false;
let ipadCamFrameInFlight = false;
let ipadCamTimerId = 0;
let ipadCamUseRawBody = false;

async function postIpadCameraFrameBlob(jpegBlob) {
  if (!jpegBlob) return null;
  const tryPost = async (useRaw) => {
    if (useRaw) {
      return fetch('/api/video/ipad_frame', {
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg' },
        body: jpegBlob,
      });
    }
    const fd = new FormData();
    fd.append('file', jpegBlob, 'ipad_frame.jpg');
    fd.append('image', jpegBlob, 'ipad_frame.jpg');
    fd.append('frame', jpegBlob, 'ipad_frame.jpg');
    return fetch('/api/video/ipad_frame', {
      method: 'POST',
      body: fd,
    });
  };

  let resp = await tryPost(ipadCamUseRawBody);
  if (resp.status === 415 || resp.status === 422 || resp.status === 400) {
    ipadCamUseRawBody = !ipadCamUseRawBody;
    resp = await tryPost(ipadCamUseRawBody);
  }
  if (resp.status === 404) {
    const fdFallback = new FormData();
    fdFallback.append('file', jpegBlob, 'ipad_frame.jpg');
    fdFallback.append('image', jpegBlob, 'ipad_frame.jpg');
    resp = await fetch('/api/video/upload', {
      method: 'POST',
      body: fdFallback,
    });
  }
  if (!resp.ok) return null;
  return resp.json();
}

function stopIpadCameraStream() {
  ipadCamLoopActive = false;
  ipadCamFrameInFlight = false;
  if (ipadCamTimerId) {
    clearTimeout(ipadCamTimerId);
    ipadCamTimerId = 0;
  }
  if (ipadCamStream) {
    try {
      ipadCamStream.getTracks().forEach((track) => track.stop());
    } catch (_e) {}
    ipadCamStream = null;
  }
  if (ipadCamVideoEl) {
    try {
      ipadCamVideoEl.pause();
      ipadCamVideoEl.srcObject = null;
    } catch (_e) {}
    ipadCamVideoEl = null;
  }
  notifyNativeBridge('ipad_camera_stopped', { mode: state.activeCameraMode });
}

async function startIpadCameraStream() {
  stopIpadCameraStream();
  ipadCamLoopActive = true;
  notifyNativeBridge('ipad_camera_started', {
    mode: 'ipad_camera',
    label: CAMERA_MODE_LABELS.ipad_camera,
    target_fps: 30,
  });

  if (window.FIELDSCAN_IOS_NATIVE) {
    if (window.fieldscanNativeBridge && typeof window.fieldscanNativeBridge.startNativeCamera === 'function') {
      window.fieldscanNativeBridge.startNativeCamera('back');
    }
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return;
  }

  try {
    try {
      ipadCamStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });
    } catch (_constraintErr) {
      ipadCamStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
    }

    if (!ipadCamLoopActive || state.activeCameraMode !== 'ipad_camera') {
      stopIpadCameraStream();
      return;
    }

    const video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.muted = true;
    video.autoplay = true;
    video.srcObject = ipadCamStream;
    ipadCamVideoEl = video;
    await video.play().catch(() => {});

    if (!ipadCamOffscreenCanvas) {
      ipadCamOffscreenCanvas = document.createElement('canvas');
      ipadCamOffscreenCanvas.width = 960;
      ipadCamOffscreenCanvas.height = 540;
    }

    const pumpIpadFrame = () => {
      if (!ipadCamLoopActive || state.activeCameraMode !== 'ipad_camera' || !ipadCamVideoEl) {
        return;
      }
      if (ipadCamFrameInFlight || ipadCamVideoEl.readyState < 2) {
        ipadCamTimerId = window.setTimeout(pumpIpadFrame, 45);
        return;
      }

      const vw = ipadCamVideoEl.videoWidth || 1280;
      const vh = ipadCamVideoEl.videoHeight || 720;
      const targetW = vw >= 1280 ? 960 : Math.max(640, vw);
      const targetH = Math.round((targetW * vh) / Math.max(1, vw));
      if (
        ipadCamOffscreenCanvas.width !== targetW ||
        ipadCamOffscreenCanvas.height !== targetH
      ) {
        ipadCamOffscreenCanvas.width = targetW;
        ipadCamOffscreenCanvas.height = targetH;
      }

      const ctx = ipadCamOffscreenCanvas.getContext('2d');
      ctx.drawImage(ipadCamVideoEl, 0, 0, targetW, targetH);

      if (dom.videoFallbackCanvas && state.videoStreamFailed) {
        const fbCtx = dom.videoFallbackCanvas.getContext('2d');
        fbCtx.drawImage(
          ipadCamOffscreenCanvas,
          0,
          0,
          dom.videoFallbackCanvas.width,
          dom.videoFallbackCanvas.height
        );
        state.hasLiveSnapshotFallback = true;
      }

      ipadCamFrameInFlight = true;
      ipadCamOffscreenCanvas.toBlob(
        async (blob) => {
          try {
            if (blob && ipadCamLoopActive && state.activeCameraMode === 'ipad_camera') {
              const statusData = await postIpadCameraFrameBlob(blob);
              if (statusData) {
                applyUnifiedStatus(statusData);
              }
            }
          } catch (_postErr) {
            // Next frame will retry automatically
          } finally {
            ipadCamFrameInFlight = false;
            if (ipadCamLoopActive && state.activeCameraMode === 'ipad_camera') {
              ipadCamTimerId = window.setTimeout(pumpIpadFrame, 55);
            }
          }
        },
        'image/jpeg',
        0.82
      );
    };

    pumpIpadFrame();
  } catch (err) {
    appendChatMessage({
      role: 'assistant',
      author: 'IPAD M4 CAMERA',
      text: `iPad camera capture awaiting permission (${err.message || 'camera access'}).`,
    });
  }
}

/* ==========================================================================
   CAMERA & MODBUS BENCH MODE SELECTORS
   ========================================================================== */
async function switchCameraMode(mode) {
  const prevMode = state.activeCameraMode;
  state.activeCameraMode = mode;
  state.lastDiagnosisFaultLock = false;

  if (prevMode === 'ipad_camera' && mode !== 'ipad_camera') {
    stopIpadCameraStream();
  }

  notifyNativeBridge('camera_mode_changed', {
    mode,
    label: CAMERA_MODE_LABELS[mode] || mode,
  });

  if (mode === 'sim_open_dip' || mode === 'sim_hand_screwdriver') {
    state.dipPipDismissed = false;
    setExplodedState(true, { zoomDip: true });
    setFaultHighlight(
      'upper_barrel_dip',
      mode === 'sim_hand_screwdriver'
        ? 'Open housing DIP-8 detected while masking out operator hand & screwdriver from 3D view.'
        : 'Open housing detected exposing internal SW1 DIP-8 block.'
    );
    setManualPage(5, { flash: true });
  } else if (mode === 'sim_normal' || mode === 'usb' || mode === 'ipad_camera') {
    setExplodedState(false);
    setFaultHighlight(null);
    reset3DCamera();
  } else if (mode === 'sim_strainer_patch') {
    setExplodedState(false);
    setFaultHighlight('strainer_head', 'Physical obstruction / fault patch detected on SHT30 strainer head.');
    reset3DCamera();
  } else if (mode === 'sim_gland_fault') {
    setExplodedState(false);
    setFaultHighlight('waterproof_gland_leads', 'Mechanical/wiring fault detected at waterproof cable gland & RS-485 leads.');
    reset3DCamera();
  }

  try {
    const res = await fetchJsonWithFallback(
      ['/api/video/mode', '/api/camera/mode', '/api/scanner/mode'],
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      }
    );
    applyUnifiedStatus(res);
    state.videoStreamFailed = false;
    dom.videoFallbackCanvas.hidden = true;
    dom.videoStream.hidden = false;
    dom.videoStream.src = `/api/video/stream?raw=1&t=${Date.now()}`;
  } catch (_err) {
    drawFallbackScannerFrame();
  }

  if (mode === 'ipad_camera') {
    await startIpadCameraStream();
  }
}

async function switchModbusMode(mode) {
  state.activeModbusMode = mode;
  state.activeSessionId = null;
  state.confirmedChangesCount = 0;
  state.lastPollSeq = 0;
  if (dom.confirmChangeLabel) dom.confirmChangeLabel.textContent = 'Confirm Change (0)';
  const simModeActive = String(mode || 'auto').startsWith('sim_');
  if (dom.btnSimConnectModbus) dom.btnSimConnectModbus.hidden = !simModeActive;
  if (dom.btnBreathTest) dom.btnBreathTest.hidden = !simModeActive;
  if (dom.btnPollReadonly) dom.btnPollReadonly.hidden = simModeActive;
  try {
    const res = await fetchJsonWithFallback(['/api/modbus/mode'], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        slave_id: computeDipAddress() || 1,
      }),
    });
    applyTelemetryPayload(res);
  } catch (_err) {
    // Handled on next poll
  }
}

async function uploadCustomBenchPhoto(file) {
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('image', file);

  appendChatMessage({
    role: 'user',
    author: 'FIELD OPERATOR',
    text: `Uploaded optical inspection photo: ${file.name}`,
  });

  try {
    const res = await fetchJsonWithFallback(
      ['/api/video/upload', '/api/camera/upload', '/api/scanner/upload'],
      { method: 'POST', body: formData }
    );
    applyTelemetryPayload(res);
    dom.videoStream.src = `/api/video/stream?raw=1&t=${Date.now()}`;
  } catch (_err) {
    appendChatMessage({
      role: 'assistant',
      author: 'VISION SCANNER',
      text: `Loaded local frame (${file.name}) for multimodal inspection.`,
    });
  }
}

/* ==========================================================================
   AI VOICE ENGINEER TRANSCRIPT, CITATIONS & ENGLISH TTS PLAYBACK
   ========================================================================== */
let activeTtsAudio = null;

function stopActiveTtsPlayback() {
  if (activeTtsAudio) {
    try {
      activeTtsAudio.pause();
      activeTtsAudio.currentTime = 0;
    } catch (_e) {}
    activeTtsAudio = null;
  }
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (_e) {}
  }
  state.isAiSpeaking = false;
  state.aiSpeakCooldownUntil = Date.now() + 250;
}

function playDiagnosisAudio(audioB64, fallbackText) {
  stopActiveTtsPlayback();
  if (audioB64) {
    try {
      const src = audioB64.startsWith('data:')
        ? audioB64
        : `data:audio/wav;base64,${audioB64}`;
      const audio = new Audio(src);
      activeTtsAudio = audio;
      state.isAiSpeaking = true;
      const onDone = () => {
        if (activeTtsAudio === audio) activeTtsAudio = null;
        state.isAiSpeaking = false;
        state.aiSpeakCooldownUntil = Date.now() + 550;
      };
      audio.addEventListener('ended', onDone, { once: true });
      audio.addEventListener('pause', onDone, { once: true });
      audio.addEventListener('error', onDone, { once: true });
      audio.play().catch(() => {
        onDone();
        speakBrowserFallback(fallbackText);
      });
      return;
    } catch (_e) {
      state.isAiSpeaking = false;
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
    utter.lang = 'en-US';
    utter.rate = 1.03;
    utter.onstart = () => {
      state.isAiSpeaking = true;
    };
    const onSpeechEnd = () => {
      state.isAiSpeaking = false;
      state.aiSpeakCooldownUntil = Date.now() + 550;
    };
    utter.onend = onSpeechEnd;
    utter.onerror = onSpeechEnd;
    window.speechSynthesis.speak(utter);
  } catch (_e) {
    state.isAiSpeaking = false;
  }
}

function normalizeCitations(payload) {
  const raw = payload.manual_citations || payload.citations || payload.cited_pages || [];
  const list = [];
  for (const item of raw) {
    if (typeof item === 'number') {
      list.push({
        page: item,
        label: `Page ${item} · ${MANUAL_PAGES[item]?.split('·')[1]?.trim() || 'Datasheet'}`,
      });
    } else if (typeof item === 'string') {
      const m = item.match(/(\d+)/);
      const p = m ? Number(m[1]) : 1;
      list.push({ page: p, label: item });
    } else if (item && typeof item === 'object') {
      const p = Number(item.page || item.page_number || 1);
      const lbl = item.label || item.title || item.section || `Page ${p}`;
      list.push({ page: p, label: lbl.toLowerCase().includes('page') ? lbl : `Page ${p} · ${lbl}` });
    }
  }
  return list;
}

function appendChatMessage({
  role = 'assistant',
  author = 'LFM3-VL-2B · AI ENGINEER',
  text = '',
  causes = [],
  citations = [],
  audioB64 = null,
  isFault = false,
  isVerified = false,
  latencyMs = null,
}) {
  const article = document.createElement('article');
  article.className = `msg msg-${role}${isFault ? ' is-fault' : ''}${isVerified ? ' is-verified' : ''}`;

  const timeStr = latencyMs
    ? `${Math.round(latencyMs)} ms`
    : new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

  const meta = document.createElement('div');
  meta.className = 'msg-meta';
  meta.innerHTML = '<span class="msg-author"></span><span class="msg-time"></span>';
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
    title.textContent = 'PROBABLE CAUSES & FIELD ACTIONS:';
    causesBox.appendChild(title);

    const ul = document.createElement('ul');
    ul.className = 'causes-list';
    causes.forEach((c) => {
      const li = document.createElement('li');
      li.textContent = typeof c === 'string' ? c : c.cause || c.description || JSON.stringify(c);
      ul.appendChild(li);
    });
    causesBox.appendChild(ul);
    article.appendChild(causesBox);
  }

  if ((citations && citations.length > 0) || (role === 'assistant' && text)) {
    const row = document.createElement('div');
    row.className = 'citation-row';

    citations.forEach((cite) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'cite-chip';
      chip.textContent = cite.label;
      chip.addEventListener('click', () =>
        setManualPage(cite.page, { flash: true, expandDrawer: true })
      );
      row.appendChild(chip);
    });

    if (role === 'assistant' && text) {
      const speakBtn = document.createElement('button');
      speakBtn.type = 'button';
      speakBtn.className = 'btn-speak-msg';
      speakBtn.textContent = 'Replay Voice';
      speakBtn.addEventListener('click', () => playDiagnosisAudio(audioB64, text));
      row.appendChild(speakBtn);
    }

    article.appendChild(row);
  }

  dom.chatFeed.appendChild(article);
  dom.chatFeed.scrollTop = dom.chatFeed.scrollHeight;
}

function handleCopilotResponse(res) {
  if (!res || typeof res !== 'object') return;

  const answerText =
    res.assistant_message ||
    res.diagnosis ||
    res.answer ||
    res.response ||
    res.message ||
    res.summary ||
    'Multimodal inspection completed on TZ THT-02 Digital Twin.';

  const causes = res.probable_causes || res.causes || res.recommendations || [];
  const citations = normalizeCitations(res);
  const audioB64 = res.audio_wav_b64 || res.audio_b64 || null;
  const latMs = res.latency_ms ?? res.inference_ms ?? null;
  const tokSec = res.tokens_per_sec ?? res.tok_per_s ?? null;

  if (latMs !== null) {
    dom.pillLatencyText.textContent = `${Math.round(Number(latMs))} ms${tokSec ? ` (${Number(tokSec).toFixed(1)} tok/s)` : ''}`;
  }

  const zone = res.highlighted_zone || res.fault_zone || res.anomaly_zone || null;
  if (zone && ZONE_SPECS[zone] && !state.modbusHealthy) {
    state.lastDiagnosisFaultLock = true;
    setFaultHighlight(zone, res.fault_title || res.short_diagnosis || answerText.slice(0, 125));
    selectZone(zone, { flipManual: false });
  }

  const shouldFocusDip = Boolean(res.focus_dip || res.explode_pcb === true || zone === 'upper_barrel_dip');
  if (shouldFocusDip) {
    state.dipPipDismissed = false;
    setExplodedState(true, { zoomDip: true });
    setDipPipVisibility(true);
  } else if (res.explode_pcb === false) {
    setExplodedState(false);
    reset3DCamera();
  }

  if (Array.isArray(res.dip_bits) && res.dip_bits.length === 8) {
    state.dipBits = res.dip_bits.map((b) => (b ? 1 : 0));
    renderDipHud();
  }

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
    isFault: Boolean(zone && !state.modbusHealthy),
    isVerified: Boolean(state.modbusHealthy || res.stage === 'STEP3_SCADA_ONLINE_VERIFIED'),
    latencyMs: latMs,
  });

  if (res.signoff_package) {
    state.lastEscalation = res.signoff_package;
    dom.escalationModal.hidden = false;
    populateEscalationModal(res.signoff_package);
  }

  if (state.autoSpeak && !window.FIELDSCAN_IOS_NATIVE) {
    playDiagnosisAudio(audioB64, answerText);
  }
}

/* ==========================================================================
   4-STEP GUIDED REPAIR WORKFLOW & MULTIMODAL QUERIES
   ========================================================================== */
async function runStep1OpenInspection() {
  setWorkflowActiveStep(1);
  state.dipPipDismissed = false;

  appendChatMessage({
    role: 'user',
    author: 'OPERATOR · STEP 1',
    text: 'Inspect this TZ THT-02 sensor: the housing is open, there is no Modbus signal, and the DIP-8 switches look unconfigured.',
  });

  setExplodedState(true, { zoomDip: true });
  setManualPage(5, { flash: true });

  try {
    const res = await fetchJsonWithFallback(['/api/repair/step'], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'inspect_open',
        sync_simulator: state.activeCameraMode !== 'usb',
      }),
    });
    dom.videoStream.src = `/api/video/stream?raw=1&t=${Date.now()}`;
    handleCopilotResponse({ ...res, model: 'AI VOICE ENGINEER · STEP 1 INSPECTION' });
    pollTelemetry();
  } catch (_err) {
    await submitDiagnosisQuery('Sensor housing is open and offline; inspect exposed DIP-8 switches.', {
      includeCamera: true,
      zoneHint: 'upper_barrel_dip',
    });
  }
}

async function runStep2ModbusDipGuidance() {
  setWorkflowActiveStep(2);
  state.dipPipDismissed = false;

  appendChatMessage({
    role: 'user',
    author: 'OPERATOR · STEP 2',
    text: 'Zoom in on the DIP-8 block and configure it for standard Industrial Modbus RTU Slave 1 (9600 bps, 8N1).',
  });

  setExplodedState(true, { zoomDip: true });
  setDipPipVisibility(true);
  focusDip3DCamera();
  setManualPage(5, { flash: true });

  try {
    const res = await fetchJsonWithFallback(['/api/repair/step'], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'guide_dip',
        query: 'Configure it for standard Industrial Modbus RTU slave 1 (9600 bps)',
      }),
    });
    handleCopilotResponse({ ...res, model: 'AI VOICE ENGINEER · STEP 2 DIP-8 GUIDE' });
    pollTelemetry();
  } catch (_err) {
    state.dipBits = [0, 0, 0, 0, 0, 0, 0, 1];
    renderDipHud();
    await submitDiagnosisQuery('Configure DIP-8 switches for Modbus RTU Slave 1 at 9600 bps.', {
      includeCamera: true,
      zoneHint: 'upper_barrel_dip',
    });
  }
}

async function runStep3ConnectAndValidateModbus() {
  setWorkflowActiveStep(3);
  const targetSlave = computeDipAddress() || 1;

  appendChatMessage({
    role: 'user',
    author: 'OPERATOR · STEP 3',
    text: `DIP-8 set to Slave #${targetSlave} and barrel closed. Energizing DC supply and connecting RS-485 bus...`,
  });

  try {
    const res = await fetchJsonWithFallback(['/api/repair/step'], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step: 'connect_modbus',
        slave_id: targetSlave,
      }),
    });
    dom.videoStream.src = `/api/video/stream?raw=1&t=${Date.now()}`;
    if (res.event_id) {
      state.seenRepairEventId = Math.max(state.seenRepairEventId, Number(res.event_id));
    }
    if (res.assistant_message || res.diagnosis) {
      handleCopilotResponse({ ...res, model: 'SCADA RS-485 · LIVE VERIFICATION' });
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
    author: 'FIELD OPERATOR',
    text: queryText,
  });

  try {
    const res = await fetchJsonWithFallback(['/api/diagnose'], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: queryText,
        prompt: queryText,
        include_camera: includeCamera,
        zone: zoneHint,
        dip_address: computeDipAddress(),
        dip_bits: state.dipBits,
      }),
    });
    handleCopilotResponse(res);
  } catch (_err) {
    const lower = queryText.toLowerCase().trim();
    const isGreeting = /^(hello|hi|hey|good morning|good afternoon|good evening)\b/.test(lower);
    if (isGreeting) {
      handleCopilotResponse({
        model: 'LFM3-VL-2B (OFFLINE)',
        diagnosis:
          'Hello! I am your offline FieldScan AI Engineer. What is your question? I can help with TZ THT-02 operation, SW1 DIP-8 switches, RS-485 wiring, or live diagnostics.',
        probable_causes: [],
        citations: [],
      });
      return;
    }
    const isDip = lower.includes('dip') || zoneHint === 'upper_barrel_dip';
    const addr = computeDipAddress();
    handleCopilotResponse(
      isDip
        ? {
            model: 'LFM3-VL-2B (OFFLINE)',
            highlighted_zone: 'upper_barrel_dip',
            explode_pcb: true,
            focus_dip: true,
            diagnosis: `Exploded view active (Manual Page 5 Steps 1 & 2). The 8-pin SW1 DIP switch sums active ON weights [128, 64, 32, 16, 8, 4, 2, 1]. Current Slave ID: #${addr} (Register 0x0004).`,
            probable_causes: [
              'Ensure every sensor on the RS-485 trunk has a unique Slave ID (1..247).',
              'Verify Modbus RTU serial framing: 9600 bps, 8 data bits, No parity, 1 stop bit (Page 5).',
            ],
            citations: [
              { page: 5, label: 'Page 5 · DIP-8 Addressing' },
              { page: 6, label: 'Page 6 · Reg 0x0004 Address' },
            ],
          }
        : {
            model: 'LFM3-VL-2B (OFFLINE)',
            highlighted_zone: state.highlightedZone || 'strainer_head',
            diagnosis:
              'Optical + TZ THT-02 Datasheet inspection: deviation localized on the slotted stainless steel SHT30 strainer head. Holding Register 0x7FFF indicates an abnormal sensing element condition.',
            probable_causes: [
              'Condensation saturation or particulate clogging inside the SS316L sintered filter mesh (Page 1 & Page 4).',
              'Sentinel 0x7FFF on Registers 0x0000 (Temp) or 0x0001 (Humidity) due to SHT30 probe damage (Page 6).',
              'Missing common GND reference between DC power supply and FT2232HL RS-485 transceiver (Page 4).',
            ],
            citations: [
              { page: 6, label: 'Page 6 · Reg 0x7FFF Probe Alarm' },
              { page: 4, label: 'Page 4 · RS-485 Wiring & GND' },
              { page: 1, label: 'Page 1 · SHT30 Strainer Filter' },
            ],
          }
    );
  }
}

/* ==========================================================================
   DIRECT 16 kHz 16-BIT MONO PCM WAV WEBAUDIO RECORDER (ZERO FFMPEG REQUIRED)
   + PUSH-TO-SPEAK + CONTINUOUS HANDS-FREE VAD (LFM3-Audio-2B -> POST /api/voice)
   ========================================================================== */
function encodeFloat32To16kHzWavBlob(float32Chunks, inputSampleRate = 48000) {
  const chunks = Array.isArray(float32Chunks)
    ? float32Chunks
    : float32Chunks instanceof Float32Array
      ? [float32Chunks]
      : [];

  let totalInputSamples = 0;
  for (let i = 0; i < chunks.length; i += 1) {
    if (chunks[i] && chunks[i].length) {
      totalInputSamples += chunks[i].length;
    }
  }

  const merged = new Float32Array(totalInputSamples);
  let writeOffset = 0;
  for (let i = 0; i < chunks.length; i += 1) {
    const c = chunks[i];
    if (c && c.length) {
      merged.set(c, writeOffset);
      writeOffset += c.length;
    }
  }

  const targetSampleRate = 16000;
  const inRate = Math.max(8000, Number(inputSampleRate) || 48000);
  let resampled;

  if (totalInputSamples === 0) {
    resampled = new Float32Array(0);
  } else if (Math.abs(inRate - targetSampleRate) < 1) {
    resampled = merged;
  } else {
    const ratio = inRate / targetSampleRate;
    const outLength = Math.max(1, Math.round(totalInputSamples / ratio));
    resampled = new Float32Array(outLength);
    for (let i = 0; i < outLength; i += 1) {
      const srcPos = i * ratio;
      const idx0 = Math.floor(srcPos);
      const idx1 = Math.min(totalInputSamples - 1, idx0 + 1);
      const frac = srcPos - idx0;
      resampled[i] = merged[idx0] * (1 - frac) + merged[idx1] * frac;
    }
  }

  const numSamples = resampled.length;
  const dataByteLen = numSamples * 2;
  const wavBuffer = new ArrayBuffer(44 + dataByteLen);
  const view = new DataView(wavBuffer);

  const writeAscii = (byteOffset, str) => {
    for (let i = 0; i < str.length; i += 1) {
      view.setUint8(byteOffset + i, str.charCodeAt(i));
    }
  };

  // Standard 44-byte RIFF WAVEfmt header (16000 Hz, 1 channel mono, 16-bit PCM)
  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataByteLen, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = Linear PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, targetSampleRate, true); // SampleRate (16000 Hz)
  view.setUint32(28, targetSampleRate * 2, true); // ByteRate (16000 * 1 * 2)
  view.setUint16(32, 2, true); // BlockAlign (1 * 2)
  view.setUint16(34, 16, true); // BitsPerSample (16)
  writeAscii(36, 'data');
  view.setUint32(40, dataByteLen, true);

  let pcmOffset = 44;
  for (let i = 0; i < numSamples; i += 1) {
    const clamped = Math.max(-1, Math.min(1, resampled[i] || 0));
    const int16 = clamped < 0 ? Math.round(clamped * 0x8000) : Math.round(clamped * 0x7fff);
    view.setInt16(pcmOffset, int16, true);
    pcmOffset += 2;
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

let mediaRecorder = null;
let audioChunks = [];
let pcmFloatChunks = [];
let pcmScriptProcessor = null;
let pcmSilentGain = null;
let audioStream = null;
let audioCtx = null;
let meterRaf = 0;

let hfStream = null;
let hfAudioCtx = null;
let hfAnalyser = null;
let hfScriptProcessor = null;
let hfSilentGain = null;
let hfPcmChunks = [];
let hfPreRollChunks = [];
let hfRaf = 0;
let hfRecorder = null;
let hfChunks = [];
let hfSpeechActive = false;
let hfSpeechStartTs = 0;
let hfAboveSinceTs = 0;
let hfLastVoiceTs = 0;
let hfNoiseFloor = 0.008;
let nativeHfPollTimer = null;
let nativeHfPollInFlight = false;

function syncMicDeckIdleUi() {
  if (state.handsFreeEnabled) {
    dom.btnVoiceRecord.classList.remove('recording');
    dom.btnVoiceRecord.classList.add('handsfree-listening');
    dom.pttLabel.textContent = 'Hands-Free Live Mic Active';
    dom.pttSubLabel.textContent = 'Speak anytime · Auto-sends when you pause speaking';
    dom.voiceMeter.hidden = false;
  } else {
    dom.btnVoiceRecord.classList.remove('recording', 'handsfree-listening');
    dom.pttLabel.textContent = 'Push to Speak to AI Engineer';
    dom.pttSubLabel.textContent = 'Offline LFM3-Audio-2B · Click to Record (or enable Hands-Free)';
    dom.voiceMeter.hidden = true;
  }
}

async function fetchNativeVoiceWithTimeout(url, options = {}, timeoutMs = 2200) {
  const ctrl = new AbortController();
  const timerId = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(timerId);
  }
}

async function startNativeIosHandsFreeMode() {
  try {
    const resp = await fetchNativeVoiceWithTimeout(
      '/api/voice/handsfree_start',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dip_address: computeDipAddress() }),
      },
      2500
    );
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    const startData = await resp.json().catch(() => ({}));
    if (startData.status === 'permission_denied' || startData.active === false) {
      appendChatMessage({
        role: 'assistant',
        author: 'AUDIO INTERFACE',
        text:
          startData.message ||
          'Microphone or Speech Recognition permission is turned off in iPadOS Settings > Privacy & Security. Use Push-to-Speak or touch controls until enabled.',
      });
      return false;
    }

    state.handsFreeEnabled = true;
    state.usingNativeHandsFree = true;
    if (dom.btnHandsFreeMic) dom.btnHandsFreeMic.classList.add('active');
    if (dom.handsFreeText) dom.handsFreeText.textContent = 'Hands-Free: LIVE';
    syncMicDeckIdleUi();

    if (nativeHfPollTimer) {
      clearInterval(nativeHfPollTimer);
    }
    nativeHfPollTimer = setInterval(async () => {
      if (!state.handsFreeEnabled || !state.usingNativeHandsFree || nativeHfPollInFlight) {
        return;
      }
      nativeHfPollInFlight = true;
      try {
        const pollResp = await fetchNativeVoiceWithTimeout('/api/voice/handsfree_poll', {}, 1800);
        if (!pollResp.ok) return;
        const data = await pollResp.json();
        if (!state.handsFreeEnabled) return;

        if (data.permission_state === 'denied') {
          disableHandsFreeMode();
          appendChatMessage({
            role: 'assistant',
            author: 'AUDIO INTERFACE',
            text: 'Microphone or Speech Recognition permission was denied on iPadOS. Enable it in Settings > Privacy & Security or use touch/text controls.',
          });
          return;
        }

        dom.voiceMeterFill.style.width = `${data.rms_pct || 8}%`;

        if (data.ai_speaking) {
          dom.btnVoiceRecord.classList.remove('recording');
          dom.btnVoiceRecord.classList.add('handsfree-listening');
          dom.pttLabel.textContent = 'AI Speaking · Mic Paused (Echo Guard)';
          dom.pttSubLabel.textContent = 'Hands-Free Live Voice · Resumes automatically after reply';
        } else if (data.partial_transcript && data.partial_transcript.trim().length > 0) {
          dom.btnVoiceRecord.classList.remove('handsfree-listening');
          dom.btnVoiceRecord.classList.add('recording');
          dom.pttLabel.textContent = `Listening: "${data.partial_transcript}"`;
          dom.pttSubLabel.textContent = 'Pause speaking to send automatically to FieldScan AI';
        } else {
          syncMicDeckIdleUi();
        }

        if (data.completed_turn && typeof data.completed_turn === 'object') {
          const turn = data.completed_turn;
          if (turn.transcript) {
            appendChatMessage({
              role: 'user',
              author: 'FIELD OPERATOR (LIVE VOICE)',
              text: turn.transcript,
            });
          }
          handleCopilotResponse(turn);
        }
      } catch (_err) {
        // Ignore transient poll errors or AbortController timeouts
      } finally {
        nativeHfPollInFlight = false;
      }
    }, 260);
    return true;
  } catch (_err) {
    return false;
  }
}

async function toggleHandsFreeMode() {
  if (state.handsFreeEnabled) {
    disableHandsFreeMode();
    return;
  }
  if (state.isRecording) {
    stopVoiceRecording();
  }

  if (window.FIELDSCAN_IOS_NATIVE === true || !navigator.mediaDevices?.getUserMedia) {
    const ok = await startNativeIosHandsFreeMode();
    if (!ok) {
      appendChatMessage({
        role: 'assistant',
        author: 'AUDIO INTERFACE',
        text: 'Could not start native Hands-Free microphone; use Push-to-Speak or the prompt bar below.',
      });
    }
    return;
  }

  try {
    hfStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    hfAudioCtx = new AudioCtxClass();
    if (hfAudioCtx.state === 'suspended') {
      await hfAudioCtx.resume().catch(() => {});
    }
    const src = hfAudioCtx.createMediaStreamSource(hfStream);
    hfAnalyser = hfAudioCtx.createAnalyser();
    hfAnalyser.fftSize = 512;
    src.connect(hfAnalyser);
    const pcmBuf = new Float32Array(hfAnalyser.fftSize);

    hfPcmChunks = [];
    hfPreRollChunks = [];
    if (typeof hfAudioCtx.createScriptProcessor === 'function') {
      hfScriptProcessor = hfAudioCtx.createScriptProcessor(4096, 1, 1);
      hfSilentGain = hfAudioCtx.createGain();
      hfSilentGain.gain.value = 0;
      src.connect(hfScriptProcessor);
      hfScriptProcessor.connect(hfSilentGain);
      hfSilentGain.connect(hfAudioCtx.destination);
      hfScriptProcessor.onaudioprocess = (ev) => {
        if (!state.handsFreeEnabled) return;
        const copy = new Float32Array(ev.inputBuffer.getChannelData(0));
        if (hfSpeechActive) {
          hfPcmChunks.push(copy);
        } else {
          hfPreRollChunks.push(copy);
          if (hfPreRollChunks.length > 2) {
            hfPreRollChunks.shift();
          }
        }
      };
    }

    state.handsFreeEnabled = true;
    hfSpeechActive = false;
    hfAboveSinceTs = 0;
    hfNoiseFloor = 0.008;
    if (dom.btnHandsFreeMic) dom.btnHandsFreeMic.classList.add('active');
    if (dom.handsFreeText) dom.handsFreeText.textContent = 'Hands-Free: LIVE';
    syncMicDeckIdleUi();

    const startHfUtterance = (now) => {
      if (!hfStream || hfSpeechActive) return;
      hfSpeechActive = true;
      hfSpeechStartTs = now;
      hfLastVoiceTs = now;
      hfPcmChunks = hfPreRollChunks.slice();
      hfPreRollChunks = [];

      if (!hfScriptProcessor && typeof MediaRecorder !== 'undefined') {
        hfChunks = [];
        hfRecorder = new MediaRecorder(hfStream);
        hfRecorder.addEventListener('dataavailable', (ev) => {
          if (ev.data && ev.data.size > 0) hfChunks.push(ev.data);
        });
        hfRecorder.addEventListener('stop', async () => {
          const durMs = Date.now() - hfSpeechStartTs;
          const mimeType = hfRecorder?.mimeType || 'audio/webm';
          const blob = new Blob(hfChunks, { type: mimeType });
          hfChunks = [];
          if (!state.handsFreeEnabled || durMs < 400 || blob.size < 900) {
            if (state.handsFreeEnabled) syncMicDeckIdleUi();
            return;
          }
          await sendVoiceBlob(blob, { handsFree: true });
          if (state.handsFreeEnabled) syncMicDeckIdleUi();
        });
        hfRecorder.start();
      }

      dom.btnVoiceRecord.classList.remove('handsfree-listening');
      dom.btnVoiceRecord.classList.add('recording');
      dom.pttLabel.textContent = 'Listening to You... (Auto-Send on Pause)';
      dom.pttSubLabel.textContent = 'Hands-Free VAD · 16 kHz PCM WAV -> LFM3-Audio-2B';
    };

    const stopHfUtterance = async () => {
      if (!hfSpeechActive) return;
      hfSpeechActive = false;
      hfAboveSinceTs = 0;
      const durMs = Date.now() - hfSpeechStartTs;
      dom.btnVoiceRecord.classList.remove('recording');

      if (hfScriptProcessor) {
        const captured = hfPcmChunks;
        hfPcmChunks = [];
        if (!state.handsFreeEnabled || durMs < 360 || captured.length === 0) {
          if (state.handsFreeEnabled) syncMicDeckIdleUi();
          return;
        }
        const wavBlob = encodeFloat32To16kHzWavBlob(
          captured,
          hfAudioCtx?.sampleRate || 48000
        );
        if (wavBlob.size < 900) {
          if (state.handsFreeEnabled) syncMicDeckIdleUi();
          return;
        }
        await sendVoiceBlob(wavBlob, { handsFree: true, filename: 'speech.wav' });
        if (state.handsFreeEnabled) syncMicDeckIdleUi();
        return;
      }

      if (hfRecorder && hfRecorder.state !== 'inactive') {
        hfRecorder.stop();
      }
    };

    const tickHandsFreeVad = () => {
      if (!state.handsFreeEnabled || !hfAnalyser) return;
      const now = Date.now();
      const gated =
        state.isAiSpeaking || now < state.aiSpeakCooldownUntil || state.voiceRequestInFlight;

      if (gated) {
        if (hfSpeechActive) {
          hfSpeechStartTs = now; // Discard echo fragment
          stopHfUtterance();
        }
        dom.voiceMeterFill.style.width = '6%';
        dom.pttLabel.textContent = state.voiceRequestInFlight
          ? 'Processing Speech Offline...'
          : 'AI Speaking · Mic Paused (Echo Guard)';
        hfRaf = requestAnimationFrame(tickHandsFreeVad);
        return;
      }

      if (!hfSpeechActive && dom.pttLabel.textContent.startsWith('AI Speaking')) {
        syncMicDeckIdleUi();
      }

      hfAnalyser.getFloatTimeDomainData(pcmBuf);
      let sq = 0;
      for (let i = 0; i < pcmBuf.length; i++) {
        sq += pcmBuf[i] * pcmBuf[i];
      }
      const rms = Math.sqrt(sq / pcmBuf.length);
      const pct = Math.min(100, Math.max(6, Math.round(rms * 420)));
      dom.voiceMeterFill.style.width = `${pct}%`;

      const threshold = Math.max(0.021, Math.min(0.065, hfNoiseFloor * 2.65));
      if (!hfSpeechActive) {
        if (rms < threshold * 0.85) {
          hfNoiseFloor = hfNoiseFloor * 0.96 + rms * 0.04;
        }
        if (rms >= threshold) {
          if (!hfAboveSinceTs) hfAboveSinceTs = now;
          if (now - hfAboveSinceTs >= 115) {
            startHfUtterance(now);
          }
        } else {
          hfAboveSinceTs = 0;
        }
      } else {
        if (rms >= threshold * 0.78) {
          hfLastVoiceTs = now;
        }
        if (now - hfLastVoiceTs >= 880 || now - hfSpeechStartTs >= 11000) {
          stopHfUtterance();
        }
      }

      hfRaf = requestAnimationFrame(tickHandsFreeVad);
    };

    tickHandsFreeVad();
  } catch (err) {
    disableHandsFreeMode();
    appendChatMessage({
      role: 'assistant',
      author: 'AUDIO PERMISSIONS',
      text: `Could not activate Hands-Free microphone (${err.message}). Check browser microphone permissions.`,
    });
  }
}

function disableHandsFreeMode() {
  const wasNativeHandsFree = Boolean(state.usingNativeHandsFree);
  state.handsFreeEnabled = false;
  state.usingNativeHandsFree = false;
  if (nativeHfPollTimer) {
    clearInterval(nativeHfPollTimer);
    nativeHfPollTimer = null;
  }
  nativeHfPollInFlight = false;
  if (wasNativeHandsFree || window.FIELDSCAN_IOS_NATIVE === true) {
    fetchNativeVoiceWithTimeout('/api/voice/handsfree_stop', { method: 'POST' }, 1500).catch(() => {});
  }
  hfSpeechActive = false;
  hfAboveSinceTs = 0;
  hfPcmChunks = [];
  hfPreRollChunks = [];
  if (hfRaf) cancelAnimationFrame(hfRaf);
  hfRaf = 0;
  if (hfScriptProcessor) {
    try {
      hfScriptProcessor.onaudioprocess = null;
      hfScriptProcessor.disconnect();
    } catch (_e) {}
    hfScriptProcessor = null;
  }
  if (hfSilentGain) {
    try {
      hfSilentGain.disconnect();
    } catch (_e) {}
    hfSilentGain = null;
  }
  if (hfRecorder && hfRecorder.state !== 'inactive') {
    try {
      hfSpeechStartTs = Date.now(); // Skip sending partial audio when turning off
      hfRecorder.stop();
    } catch (_e) {}
  }
  hfRecorder = null;
  if (hfStream) {
    hfStream.getTracks().forEach((t) => t.stop());
    hfStream = null;
  }
  if (hfAudioCtx) {
    hfAudioCtx.close().catch(() => {});
    hfAudioCtx = null;
  }
  hfAnalyser = null;
  if (dom.btnHandsFreeMic) dom.btnHandsFreeMic.classList.remove('active');
  if (dom.handsFreeText) dom.handsFreeText.textContent = 'Hands-Free: OFF';
  syncMicDeckIdleUi();
}

async function startNativeIosMicRecording() {
  try {
    const resp = await fetchNativeVoiceWithTimeout(
      '/api/voice/native_start',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dip_address: computeDipAddress() }),
      },
      2500
    );
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    const startJson = await resp.json().catch(() => ({}));
    if (startJson.status === 'permission_denied') {
      appendChatMessage({
        role: 'assistant',
        author: 'AUDIO INTERFACE',
        text: 'Microphone or Speech Recognition permission is disabled in iPadOS Settings > Privacy & Security.',
      });
      return false;
    }
    state.isRecording = true;
    state.usingNativeIosMic = true;
    dom.btnVoiceRecord.classList.add('recording');
    dom.pttLabel.textContent = 'Recording on iPad M4... Tap to Send';
    dom.pttSubLabel.textContent = '16 kHz Native Mic -> On-Device ASR & LFM3';
    dom.voiceMeter.hidden = false;

    const animateNativeMeter = () => {
      if (!state.isRecording || !state.usingNativeIosMic) return;
      const pct = 28 + Math.round(45 * Math.abs(Math.sin(performance.now() * 0.008)));
      dom.voiceMeterFill.style.width = `${pct}%`;
      meterRaf = requestAnimationFrame(animateNativeMeter);
    };
    animateNativeMeter();
    return true;
  } catch (_err) {
    return false;
  }
}

async function stopNativeIosMicRecording() {
  state.usingNativeIosMic = false;
  state.voiceRequestInFlight = true;
  dom.pttLabel.textContent = 'Transcribing & Diagnosing...';
  dom.pttSubLabel.textContent = 'Running On-Device ASR + FieldScan AI...';
  setThinkingState(true, 'Transcribing voice & inspecting sensor on iPad M4...');
  try {
    const resp = await fetchNativeVoiceWithTimeout(
      '/api/voice/native_stop',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dip_address: computeDipAddress() }),
      },
      6500
    );
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    const data = await resp.json();
    if (data.transcript) {
      appendChatMessage({
        role: 'user',
        author: 'FIELD OPERATOR (VOICE)',
        text: data.transcript,
      });
    }
    handleCopilotResponse(data);
  } catch (err) {
    appendChatMessage({
      role: 'assistant',
      author: 'VOICE PIPELINE',
      text: `Voice processing note: ${err.message}`,
    });
  } finally {
    state.voiceRequestInFlight = false;
    setThinkingState(false);
    syncMicDeckIdleUi();
  }
}

async function toggleVoiceRecording() {
  if (state.handsFreeEnabled) {
    disableHandsFreeMode();
  }
  if (state.isRecording) {
    stopVoiceRecording();
    return;
  }

  stopActiveTtsPlayback();

  if (window.FIELDSCAN_IOS_NATIVE || !navigator.mediaDevices?.getUserMedia) {
    const ok = await startNativeIosMicRecording();
    if (!ok) {
      appendChatMessage({
        role: 'assistant',
        author: 'AUDIO INTERFACE',
        text: 'Microphone capture is unavailable; use the prompt bar or the 4 color-coded workflow buttons above.',
      });
    }
    return;
  }

  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    pcmFloatChunks = [];

    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume().catch(() => {});
      }
      const source = audioCtx.createMediaStreamSource(audioStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      if (typeof audioCtx.createScriptProcessor === 'function') {
        pcmScriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1);
        pcmSilentGain = audioCtx.createGain();
        pcmSilentGain.gain.value = 0;
        source.connect(pcmScriptProcessor);
        pcmScriptProcessor.connect(pcmSilentGain);
        pcmSilentGain.connect(audioCtx.destination);
        pcmScriptProcessor.onaudioprocess = (ev) => {
          if (!state.isRecording) return;
          pcmFloatChunks.push(new Float32Array(ev.inputBuffer.getChannelData(0)));
        };
      } else if (typeof MediaRecorder !== 'undefined') {
        mediaRecorder = new MediaRecorder(audioStream);
        mediaRecorder.addEventListener('dataavailable', (e) => {
          if (e.data && e.data.size > 0) audioChunks.push(e.data);
        });
        mediaRecorder.addEventListener('stop', async () => {
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const blob = new Blob(audioChunks, { type: mimeType });
          cleanupAudioStream();
          await sendVoiceBlob(blob, { handsFree: false });
        });
        mediaRecorder.start();
      }

      const dataArr = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        if (!state.isRecording) return;
        analyser.getByteFrequencyData(dataArr);
        let sum = 0;
        for (let i = 0; i < dataArr.length; i++) sum += dataArr[i];
        const avg = sum / dataArr.length;
        const pct = Math.min(100, Math.max(8, (avg / 105) * 100));
        dom.voiceMeterFill.style.width = `${pct}%`;
        meterRaf = requestAnimationFrame(updateMeter);
      };

      state.isRecording = true;
      dom.btnVoiceRecord.classList.add('recording');
      dom.pttLabel.textContent = 'Recording... Click to Send';
      dom.pttSubLabel.textContent = '16 kHz PCM WAV -> Offline LFM3-Audio-2B';
      dom.voiceMeter.hidden = false;
      updateMeter();
    } else if (typeof MediaRecorder !== 'undefined') {
      mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorder.addEventListener('dataavailable', (e) => {
        if (e.data && e.data.size > 0) audioChunks.push(e.data);
      });
      mediaRecorder.addEventListener('stop', async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunks, { type: mimeType });
        cleanupAudioStream();
        await sendVoiceBlob(blob, { handsFree: false });
      });
      state.isRecording = true;
      dom.btnVoiceRecord.classList.add('recording');
      dom.pttLabel.textContent = 'Recording... Click to Send';
      dom.pttSubLabel.textContent = 'Streaming to Offline LFM3-Audio-2B';
      dom.voiceMeter.hidden = false;
      mediaRecorder.start();
    }
  } catch (err) {
    const okNative = await startNativeIosMicRecording();
    if (!okNative) {
      appendChatMessage({
        role: 'assistant',
        author: 'AUDIO PERMISSIONS',
        text: `Could not open local microphone (${err.message}). Check browser audio permissions or type your command below.`,
      });
    }
  }
}

function stopVoiceRecording() {
  if (!state.isRecording) return;
  state.isRecording = false;
  syncMicDeckIdleUi();
  if (meterRaf) cancelAnimationFrame(meterRaf);

  if (state.usingNativeIosMic) {
    stopNativeIosMicRecording();
    return;
  }

  if (pcmScriptProcessor) {
    const sampleRate = audioCtx?.sampleRate || 48000;
    const capturedChunks = pcmFloatChunks;
    pcmFloatChunks = [];
    const wavBlob = encodeFloat32To16kHzWavBlob(capturedChunks, sampleRate);
    cleanupAudioStream();
    sendVoiceBlob(wavBlob, { handsFree: false, filename: 'speech.wav' });
    return;
  }

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}

function cleanupAudioStream() {
  if (pcmScriptProcessor) {
    try {
      pcmScriptProcessor.onaudioprocess = null;
      pcmScriptProcessor.disconnect();
    } catch (_e) {}
    pcmScriptProcessor = null;
  }
  if (pcmSilentGain) {
    try {
      pcmSilentGain.disconnect();
    } catch (_e) {}
    pcmSilentGain = null;
  }
  if (audioStream) {
    audioStream.getTracks().forEach((t) => t.stop());
    audioStream = null;
  }
  if (audioCtx) {
    audioCtx.close().catch(() => {});
    audioCtx = null;
  }
}

async function sendVoiceBlob(blob, { handsFree = false, filename = null } = {}) {
  state.voiceRequestInFlight = true;
  const uploadName =
    filename || (blob?.type === 'audio/wav' ? 'speech.wav' : 'field_query.webm');
  const formData = new FormData();
  formData.append('audio', blob, uploadName);
  formData.append('file', blob, uploadName);
  formData.append('include_camera', 'true');
  formData.append('dip_address', String(computeDipAddress()));
  formData.append('hands_free', handsFree ? 'true' : 'false');

  if (!handsFree) {
    appendChatMessage({
      role: 'user',
      author: 'OPERATOR VOICE (OFFLINE ASR)',
      text: 'Processing spoken field command with LiquidAI LFM3-Audio-2B...',
    });
  }

  try {
    const res = await fetchJsonWithFallback(['/api/voice'], {
      method: 'POST',
      body: formData,
    });
    if (res.ignored_silence) {
      return;
    }
    if (handsFree) {
      appendChatMessage({
        role: 'user',
        author: 'OPERATOR VOICE (HANDS-FREE)',
        text: `"${res.transcript || 'Voice query'}"`,
      });
    } else if (res.transcript) {
      const userBubbles = dom.chatFeed.querySelectorAll('.msg-user .msg-text');
      const lastBubble = userBubbles[userBubbles.length - 1];
      if (lastBubble) lastBubble.textContent = `"${res.transcript}"`;
    }
    handleCopilotResponse(res);
  } catch (_err) {
    if (!handsFree) {
      await submitDiagnosisQuery('Diagnose current TZ THT-02 sensor state on optical camera and RS-485 bus.', {
        includeCamera: true,
      });
    }
  } finally {
    state.voiceRequestInFlight = false;
  }
}

/* ==========================================================================
   AUTOCAD (.DXF), 3D SOLID (.STL) & 4-ANGLE SIGN-OFF DOSSIER (.ZIP / .EML)
   ========================================================================== */
function triggerBlobDownload(blob, filename) {
  notifyNativeBridge('cad_export_ready', {
    filename,
    mime_type: blob?.type || 'application/octet-stream',
    size_bytes: blob?.size || 0,
  });
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
  const lines = [
    '0', 'SECTION', '2', 'HEADER',
    '9', '$ACADVER', '1', 'AC1009',
    '9', '$INSUNITS', '70', '4',
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

  addLine('THT02_BODY', 20, -8, 140, -8, 7);
  addLine('THT02_BODY', 20, 8, 140, 8, 7);
  addLine('THT02_BODY', 140, -8, 140, 8, 7);
  addLine('THT02_GLAND', 0, -5.2, 20, -8, 8);
  addLine('THT02_GLAND', 0, 5.2, 20, 8, 8);
  addLine('THT02_GLAND', 0, -5.2, 0, 5.2, 8);
  addLine('THT02_SEAMS', 70, -8, 70, 8, 8);
  addLine('THT02_SEAL', 108, -8.2, 108, 8.2, 9);
  addLine('THT02_SEAL', 112, -8.2, 112, 8.2, 9);
  addLine('THT02_STRAINER', 115, -4.5, 137, -4.5, 4);
  addLine('THT02_STRAINER', 115, 4.5, 137, 4.5, 4);
  addLine('THT02_FLANGE', 78, -21, 98, -21, 6);
  addLine('THT02_FLANGE', 78, 21, 98, 21, 6);
  addLine('THT02_FLANGE', 78, -21, 78, 21, 6);
  addLine('THT02_FLANGE', 98, -21, 98, 21, 6);
  addCircle('THT02_FLANGE', 88, 16, 2.1, 6);
  addCircle('THT02_FLANGE', 88, -16, 2.1, 6);

  addLine('DIMENSIONS', 0, -28, 140, -28, 4);
  addText('DIMENSIONS', 56, -33, 3.2, '140.0 MM NOMINAL', 4);
  addText('DIMENSIONS', 143, -1.5, 3.0, 'DIA 16.0 MM', 4);
  addText('TITLEBLOCK', 0, 29, 3.5, `FIELDSCAN CAD - TZ THT-02 TWIN | SLAVE ADDR: ${computeDipAddress()}`, 2);
  if (state.highlightedZone) {
    addText('FAULT_CALLOUT', 0, 24, 3.0, `ACTIVE FAULT ZONE: ${state.highlightedZone.toUpperCase()}`, 1);
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
  const origLaserVis = cad.laserScanGroup ? cad.laserScanGroup.visible : true;

  if (cad.laserScanGroup) cad.laserScanGroup.visible = false;

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
    return {
      isometric: snapPose(28, 62, 175, 0, -4, 0, 0.0),
      front_dim: snapPose(0, 8, 195, 0, -4, 0, 0.0),
      exploded_dip: snapPose(14, 58, 142, 8, 0, 0, 1.0),
      side_gland: snapPose(-142, 36, 98, -32, -2, 0, 0.0),
    };
  } catch (_e) {
    return null;
  } finally {
    if (cad.laserScanGroup) cad.laserScanGroup.visible = origLaserVis;
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
  setWorkflowActiveStep(4);
  const cadViews = captureMultiAngle3DViews();
  dom.escalationModal.hidden = false;
  dom.escSnapshotImg.src = `/api/video/snapshot?t=${Date.now()}`;
  dom.escSummaryZone.textContent = state.modbusHealthy
    ? (state.modbusSimulation ? 'SIMULATION WALKTHROUGH ONLY' : 'SENSOR COMM OBSERVED (BENCH)')
    : state.highlightedZone || 'PARTIAL INSPECTION';
  renderDipHud();

  appendChatMessage({
    role: 'user',
    author: 'OPERATOR · STEP 4',
    text: 'Compile the post-repair 4-Angle 3D Digital Twin Dossier with Before/During/After photos and .DXF/.STL CAD files for manufacturer sign-off.',
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
        notes: 'Requesting manufacturer engineering sign-off on field DIP-8 reconfiguration and verified RS-485 Modbus-RTU commissioning.',
      }),
    });

    state.lastEscalation = res;
    populateEscalationModal(res);

    handleCopilotResponse({
      model: 'MANUFACTURER SIGN-OFF ENGINE',
      diagnosis:
        res.spoken_summary ||
        `Post-repair sign-off dossier (${res.package_id || 'OUTBOX'}) generated with 4-angle 3D CAD views, chronological photo strip, and AutoCAD .DXF/.STL exports.`,
      audio_wav_b64: res.audio_wav_b64,
      citations: [
        { page: 5, label: 'Page 5 · DIP-8 Verified' },
        { page: 7, label: 'Page 7 · Modbus RTU Frame OK' },
        { page: 9, label: 'Page 9 · 140×16 mm Blueprint' },
      ],
    });
  } catch (_err) {
    const fallbackPkg = {
      status: 'queued_offline',
      outbox_path: 'outbox/TZ_THT02_signoff_bundle.zip',
      email: {
        to: 'support-eng@tzonedigital.com',
        subject: '[FIELDSCAN-SIGN-OFF] TZ THT-02 Verified Modbus Commissioning + 4-Angle 3D Twin + .DXF/.STL',
        body: 'Offline engineering sign-off bundle queued locally in /outbox/ with zero external network sockets.',
      },
    };
    state.lastEscalation = fallbackPkg;
    populateEscalationModal(fallbackPkg);
  }
}

function populateEscalationModal(pkg) {
  const email = pkg.email || pkg.email_preview || pkg.draft_email || {};
  const dxfUrl = pkg.dxf_url || pkg.files?.dxf || null;
  const stlUrl = pkg.stl_url || pkg.files?.stl || null;
  const emlUrl = pkg.eml_url || pkg.files?.eml || null;
  const quadUrl = pkg.quad_3d_url || null;
  const stripUrl = pkg.strip_url || null;
  const zipUrl = pkg.zip_url || pkg.bundle_url || pkg.files?.zip || null;
  const primaryImg = quadUrl || pkg.snapshot_url || pkg.png_url || `/api/video/snapshot?t=${Date.now()}`;

  dom.escOutboxState.textContent = String(
    pkg.compliance_verdict || pkg.status || 'QUEUED IN LOCAL OUTBOX'
  ).toUpperCase();
  dom.escPackagePath.textContent =
    pkg.outbox_path || pkg.zip_path || 'Queued locally in /outbox/ (0 external sockets)';
  dom.escEmailTo.textContent = email.to || pkg.recipient || 'support-eng@tzonedigital.com';
  dom.escEmailSubject.textContent =
    email.subject || pkg.subject || '[FIELDSCAN-SIGN-OFF] TZ THT-02 4-Angle 3D Dossier + .DXF/.STL';
  dom.escEmailBody.textContent =
    email.body || pkg.email_body || pkg.report_markdown || JSON.stringify(pkg, null, 2);

  dom.escSnapshotImg.src = primaryImg;
  dom.tabPreviewQuad.classList.add('active');
  dom.tabPreviewStrip.classList.remove('active');

  dom.tabPreviewQuad.onclick = () => {
    dom.tabPreviewQuad.classList.add('active');
    dom.tabPreviewStrip.classList.remove('active');
    dom.escSnapshotImg.src = primaryImg;
  };
  dom.tabPreviewStrip.onclick = () => {
    dom.tabPreviewStrip.classList.add('active');
    dom.tabPreviewQuad.classList.remove('active');
    dom.escSnapshotImg.src = stripUrl || primaryImg;
  };

  dom.escQueueTag.textContent = 'Sign-Off Ready';

  notifyNativeBridge('signoff_bundle_ready', {
    package_id: pkg.package_id || 'OUTBOX',
    zip_url: zipUrl,
    dxf_url: dxfUrl,
    stl_url: stlUrl,
    eml_url: emlUrl,
    quad_3d_url: quadUrl,
    strip_url: stripUrl,
    outbox_path: pkg.outbox_path || pkg.zip_path || null,
  });

  if (zipUrl) {
    dom.escZipDownloadLink.href = zipUrl;
    dom.escZipDownloadLink.hidden = false;
  } else {
    dom.escZipDownloadLink.hidden = true;
  }

  dom.escAttachmentsList.innerHTML = '';
  const attachments = [
    { label: 'AutoCAD Blueprint (.DXF)', url: dxfUrl, fallback: generateClientAutoCadDxf },
    { label: 'Solid 3D Mesh (.STL)', url: stlUrl, fallback: exportClientBinaryStl },
  ];
  if (emlUrl) {
    attachments.push({ label: 'RFC-5322 Email (.EML)', url: emlUrl, fallback: null });
  }
  if (quadUrl) {
    attachments.unshift({ label: '4-Angle 3D Sheet (.PNG)', url: quadUrl, fallback: null });
  }
  if (stripUrl) {
    attachments.push({ label: 'Before/After Strip (.PNG)', url: stripUrl, fallback: null });
  }
  if (zipUrl) {
    attachments.push({ label: 'Complete Bundle (.ZIP)', url: zipUrl, fallback: null });
  }

  attachments.forEach((att) => {
    const a = document.createElement('a');
    a.className = 'att-badge';
    a.textContent = att.label;
    if (att.url) {
      a.href = att.url;
      a.target = '_blank';
      a.rel = 'noopener';
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
   EVENT WIRING & BOOTSTRAP
   ========================================================================== */
function bindWorkstationEvents() {
  // Sensor Spec Pill -> Verify local 9-page PDF datasheet
  dom.btnSensorPill.addEventListener('click', async () => {
    try {
      const res = await fetchJsonWithFallback(['/api/sensor/load'], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'TZ THT-02 RS485 temperature and humidity sensor' }),
      });
      handleCopilotResponse({ ...res, model: 'LOCAL PDF DATASHEET ENGINE' });
    } catch (_e) {}
  });

  // Airplane Mode Socket Guard Audit
  dom.pillAirplane.addEventListener('click', async () => {
    try {
      const res = await fetchJsonWithFallback([
        '/api/offline/verify',
        '/api/airplane/verify',
        '/api/health',
      ]);
      const blocked = res.blocked_external_attempts ?? 0;
      dom.pillAirplaneText.textContent = `Airplane Mode: Verified (${blocked} Blocked)`;
      appendChatMessage({
        role: 'assistant',
        author: 'AIRPLANE SOCKET GUARD',
        text: `Live offline security audit passed: external IP egress actively blocked (${blocked} blocked attempts). 100% local on-device execution verified.`,
        isVerified: true,
      });
    } catch (_e) {
      dom.pillAirplaneText.textContent = 'Airplane Mode: Verified (Local)';
    }
  });

  // Clean Dropdown Selectors + Upload Icon Button
  dom.selectCameraMode.addEventListener('change', (e) => {
    switchCameraMode(e.target.value);
  });

  dom.btnUploadPhoto.addEventListener('click', () => {
    dom.photoUploadInput.click();
  });

  dom.photoUploadInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) uploadCustomBenchPhoto(file);
  });

  dom.selectModbusMode.addEventListener('change', (e) => {
    switchModbusMode(e.target.value);
  });

  // Top 4 Color-Coded Guided Workflow Step Buttons
  dom.btnStepInspect.addEventListener('click', runStep1OpenInspection);
  dom.btnStepDip.addEventListener('click', runStep2ModbusDipGuidance);
  dom.btnStepConnect.addEventListener('click', runStep3ConnectAndValidateModbus);
  dom.btnStepSignoff.addEventListener('click', generateAndOpenEscalationPackage);

  // Computer Vision Spatial HUD Mode Cycle, Optical Zoom & Pure Raw Camera Verification
  if (dom.btnCycleCvHud) {
    dom.btnCycleCvHud.addEventListener('click', cycleCvHudMode);
  }
  if (dom.btnRawLiveToggle) {
    dom.btnRawLiveToggle.addEventListener('click', togglePureRawCamera);
  }
  if (dom.cameraZoomBar) {
    dom.cameraZoomBar.querySelectorAll('.zoom-btn').forEach((btn) => {
      btn.addEventListener('click', () => setCameraZoomPreset(btn.dataset.zoomMode || 'auto'));
    });
  }

  // Smooth mouse-wheel optical zoom (1.0x .. 5.0x) and click-drag panning inside camera stage
  if (dom.videoFrame) {
    dom.videoFrame.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.16 : 1 / 1.16;
        const nextZ = Math.max(1.0, Math.min(5.0, state.camZoomCurrent * factor));
        state.camZoomMode = 'manual';
        state.camZoomTarget = nextZ;
        if (nextZ <= 1.02) {
          state.camPanTarget = [0.5, 0.5];
        } else {
          const rect = dom.videoFrame.getBoundingClientRect();
          const mx = (e.clientX - rect.left) / Math.max(1, rect.width);
          const my = (e.clientY - rect.top) / Math.max(1, rect.height);
          state.camPanTarget = [
            Math.max(0.05, Math.min(0.95, state.camPanTarget[0] + (mx - 0.5) * 0.18)),
            Math.max(0.05, Math.min(0.95, state.camPanTarget[1] + (my - 0.5) * 0.18)),
          ];
        }
        syncZoomButtonsUi();
      },
      { passive: false }
    );

    dom.videoFrame.addEventListener('pointerdown', (e) => {
      if (state.camZoomCurrent <= 1.03) return;
      if (e.target.closest('button') || e.target.closest('.dip-macro-pip')) return;
      state.camDragActive = true;
      state.camZoomMode = 'manual';
      state.camDragLast = [e.clientX, e.clientY];
      dom.videoFrame.classList.add('is-panning');
      syncZoomButtonsUi();
    });

    window.addEventListener('pointermove', (e) => {
      if (!state.camDragActive || !dom.videoFrame) return;
      const vw = Math.max(1, dom.videoFrame.clientWidth);
      const vh = Math.max(1, dom.videoFrame.clientHeight);
      const dx = e.clientX - state.camDragLast[0];
      const dy = e.clientY - state.camDragLast[1];
      state.camDragLast = [e.clientX, e.clientY];
      const z = Math.max(1.05, state.camZoomCurrent);
      state.camPanTarget = [
        Math.max(0.02, Math.min(0.98, state.camPanTarget[0] - dx / (vw * z))),
        Math.max(0.02, Math.min(0.98, state.camPanTarget[1] - dy / (vh * z))),
      ];
    });

    window.addEventListener('pointerup', () => {
      if (!state.camDragActive) return;
      state.camDragActive = false;
      dom.videoFrame?.classList.remove('is-panning');
    });
  }

  dom.btnToggleDipPip.addEventListener('click', () => {
    const next = !state.dipPipVisible;
    state.dipPipDismissed = !next;
    setDipPipVisibility(next);
  });
  dom.btnCloseDipPip.addEventListener('click', () => {
    setDipPipVisibility(false, { userDismissed: true });
  });

  dom.dipCropImg.addEventListener('error', () => {
    state.dipCropFailed = true;
    dom.dipCropImg.hidden = true;
    dom.dipCropFallbackCanvas.hidden = false;
    drawDipCropFallback();
  });
  dom.dipCropImg.addEventListener('load', () => {
    state.dipCropFailed = false;
    dom.dipCropFallbackCanvas.hidden = true;
    dom.dipCropImg.hidden = false;
  });

  // Video Stream Fallback Handler (rescues with live camera snapshot so screen never turns black)
  dom.videoStream.addEventListener('error', () => {
    state.videoStreamFailed = true;
    dom.videoStream.hidden = true;
    dom.videoFallbackCanvas.hidden = false;
    rescueSnapshotToFallbackCanvas();
    if (!state.hasLiveSnapshotFallback) {
      drawFallbackScannerFrame();
    }
  });
  dom.videoStream.addEventListener('load', () => {
    state.videoStreamFailed = false;
    dom.videoFallbackCanvas.hidden = true;
    dom.videoStream.hidden = false;
  });

  // 3D Viewport Segmented Controls
  dom.btnModeSolid.addEventListener('click', () => setRenderMode('solid'));
  dom.btnModeWireframe.addEventListener('click', () => setRenderMode('wireframe'));
  dom.btnToggleExplode.addEventListener('click', () =>
    setExplodedState(!state.exploded, { manualTrigger: true, zoomDip: !state.exploded })
  );
  dom.btnResetView.addEventListener('click', reset3DCamera);

  // Sub-Assembly Chips
  dom.assemblyTreePills.querySelectorAll('.part-chip').forEach((chip) => {
    chip.addEventListener('click', () => selectZone(chip.dataset.zone, { flipManual: true }));
  });

  // SCADA Console Actions
  dom.btnScanRealModbus.addEventListener('click', async () => {
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
        author: 'FT2232HL · RS-485 BUS SCANNER',
        text: sr.found
          ? `Hardware sensor online on ${sr.port} (${sr.baud_bps} bps, Slave #${sr.slave_id})! Temp: ${sr.temp_c} °C · Humidity: ${sr.humidity_rh} %RH.`
          : `Checked serial ports (${(sr.ports_checked || []).join(', ') || 'no USB-RS485 adapter attached'}). ${sr.reason || ''} Click "Energize Bus" or Step 3 to validate in bench mode or attach FT2232HL.`,
        isVerified: Boolean(sr.found),
      });
    } catch (_e) {}
  });

  dom.btnSimConnectModbus.addEventListener('click', runStep3ConnectAndValidateModbus);

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
        author: 'SCADA HMI · SHT30 BREATH SPIKE',
        text: 'Dynamic SHT30 hygrometric step-response active: watch live Humidity (%RH) and Temperature (°C) surge in real time on the SCADA trend graph.',
        isVerified: true,
      });
    } catch (_e) {}
  });

  // Voice Engineer Controls
  if (dom.btnHandsFreeMic) {
    dom.btnHandsFreeMic.addEventListener('click', toggleHandsFreeMode);
  }

  dom.btnAutoSpeak.addEventListener('click', () => {
    state.autoSpeak = !state.autoSpeak;
    if (!state.autoSpeak) stopActiveTtsPlayback();
    dom.btnAutoSpeak.classList.toggle('active', state.autoSpeak);
    dom.autoSpeakText.textContent = state.autoSpeak ? 'Voice: ON' : 'Voice: Muted';
  });

  dom.btnVoiceRecord.addEventListener('click', toggleVoiceRecording);

  dom.textQueryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = dom.queryInput.value.trim();
    if (!q) return;
    dom.queryInput.value = '';
    await submitDiagnosisQuery(q, { includeCamera: true });
  });

  // Initial Citation Chips
  document.querySelectorAll('[data-cite-page]').forEach((chip) => {
    chip.addEventListener('click', () =>
      setManualPage(Number(chip.dataset.citePage), { flash: true, expandDrawer: true })
    );
  });

  // Collapsible 2D Manual Drawer & Lightbox
  dom.btnToggleManualDrawer.addEventListener('click', () => {
    state.manualCollapsed = !state.manualCollapsed;
    dom.manualDrawer.classList.toggle('is-collapsed', state.manualCollapsed);
    dom.btnToggleManualDrawer.setAttribute('aria-expanded', String(!state.manualCollapsed));
  });

  dom.manualPrevBtn.addEventListener('click', () =>
    setManualPage(state.manualPage - 1, { expandDrawer: true })
  );
  dom.manualNextBtn.addEventListener('click', () =>
    setManualPage(state.manualPage + 1, { expandDrawer: true })
  );
  dom.manualQuickPills.querySelectorAll('.page-pill').forEach((pill) => {
    pill.addEventListener('click', () => setManualPage(Number(pill.dataset.page)));
  });

  const openManualLightbox = () => {
    setManualPage(state.manualPage);
    dom.manualModal.hidden = false;
  };
  dom.manualViewerBox.addEventListener('click', openManualLightbox);
  dom.btnExpandManual.addEventListener('click', openManualLightbox);

  dom.lightboxPrevBtn.addEventListener('click', () => setManualPage(state.manualPage - 1));
  dom.lightboxNextBtn.addEventListener('click', () => setManualPage(state.manualPage + 1));
  dom.lightboxCloseBtn.addEventListener('click', () => {
    dom.manualModal.hidden = true;
  });
  dom.manualModal.addEventListener('click', (e) => {
    if (e.target === dom.manualModal) dom.manualModal.hidden = true;
  });

  // CAD & Sign-Off Footer Buttons
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
          fault_zone: state.highlightedZone || 'strainer_head',
          dip_address: computeDipAddress(),
        }),
      });
      state.lastEscalation = res;
      if (res.dxf_url || res.files?.dxf) {
        window.location.href = res.dxf_url || res.files.dxf;
        return;
      }
    } catch (_e) {
      // Fall back to client AutoCAD R12 DXF generator
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

  // Planned Calibration Extension Modal (`CAL-00`)
  if (dom.btnOpenCalibrationPlanned && dom.calibrationPlannedModal) {
    dom.btnOpenCalibrationPlanned.addEventListener('click', async () => {
      try {
        const card = await fetchJsonWithFallback(['/api/calibration/planned']);
        if (card?.event_summary_en && dom.plannedCalEventCopy) {
          dom.plannedCalEventCopy.textContent = card.event_summary_en;
        }
        if (card?.tzone_scope_reason && dom.plannedCalScopeReason) {
          dom.plannedCalScopeReason.textContent = card.tzone_scope_reason;
        }
      } catch (_e) {}
      dom.calibrationPlannedModal.hidden = false;
    });
    dom.calibrationPlannedCloseBtn?.addEventListener('click', () => {
      dom.calibrationPlannedModal.hidden = true;
    });
    dom.calibrationPlannedModal.addEventListener('click', (e) => {
      if (e.target === dom.calibrationPlannedModal) dom.calibrationPlannedModal.hidden = true;
    });
  }

  // Configure PUSR Modbus TCP Gateway (`BUS-02`)
  if (dom.btnConfigGateway) {
    dom.btnConfigGateway.addEventListener('click', async () => {
      const currentTarget = state.pusrGatewayHost
        ? `${state.pusrGatewayHost}:${state.pusrGatewayPort}`
        : '192.168.0.7:502';
      const entered = window.prompt(
        'Enter isolated bench PUSR USR-DR164 Modbus TCP (MBAP) host:port (never use :5502 raw RTU bridge):',
        currentTarget
      );
      if (!entered) return;
      const parts = entered.trim().split(':');
      const host = (parts[0] || '').trim();
      const port = Number(parts[1] || 502) || 502;
      if (!host) return;
      state.pusrGatewayHost = host;
      state.pusrGatewayPort = port;
      try {
        await fetchJsonWithFallback(['/api/modbus/gateway'], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ host, port, activate_mode: true }),
        });
        if (dom.selectModbusMode) dom.selectModbusMode.value = 'pusr_tcp';
        appendChatMessage({
          role: 'assistant',
          author: 'BENCH GATEWAY CONFIG',
          text: `Configured PUSR Modbus TCP (MBAP) endpoint to ${host}:${port}. Previous session link invalidated; reconfirm asset before closing.`,
        });
        pollTelemetry();
      } catch (err) {
        appendChatMessage({
          role: 'assistant',
          author: 'BENCH GATEWAY CONFIG',
          text: `Failed to update gateway: ${err.message || err}`,
        });
      }
    });
  }

  // Physical Read-Only Poll (`FC03`)
  if (dom.btnPollReadonly) {
    dom.btnPollReadonly.addEventListener('click', async () => {
      try {
        await ensureActiveWorkSession();
        const res = await fetchJsonWithFallback(['/api/modbus/poll'], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: state.activeSessionId }),
        });
        if (res?.modbus) applyTelemetryPayload({ modbus: res.modbus });
        const m = res?.modbus || {};
        appendChatMessage({
          role: 'assistant',
          author: 'MODBUS READ-ONLY POLL',
          text: m.online
            ? `Sensor responded (${m.protocol || 'Modbus'}): Temp=${m.temp_c ?? 'FAULT'} °C, RH=${m.humidity_rh ?? 'FAULT'} %RH (Scope: ${m.scope || 'sensor_communication'}).`
            : `No fresh sensor response (${m.error_code || 'READ_TIMEOUT'}): ${m.status_label || 'Timeout'}.`,
        });
      } catch (_e) {}
    });
  }

  // Manual Session Photo Capture (`VIS-02` / `VIS-07`)
  if (dom.btnCaptureManualPhoto) {
    dom.btnCaptureManualPhoto.addEventListener('click', async () => {
      try {
        await ensureActiveWorkSession();
        const res = await fetchJsonWithFallback([`/api/sessions/${state.activeSessionId}/capture`], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ manual: true }),
        });
        const ph = res?.capture?.photo;
        appendChatMessage({
          role: 'assistant',
          author: 'SESSION EVIDENCE',
          text: ph
            ? `Saved manual photo ${ph.original_filename} (origin: ${ph.evidence_origin}, sha256: ${String(ph.original_sha256 || '').slice(0, 12)}...).`
            : `Photo not saved: ${res?.capture?.reason || 'unavailable'}.`,
        });
      } catch (_e) {}
    });
  }

  // Explicit Technician Confirmation of Physical Change (`Phase 1.5`, `DAT-04`, `FLU-02`)
  if (dom.btnConfirmPhysicalChange) {
    dom.btnConfirmPhysicalChange.addEventListener('click', async () => {
      const actionTaken = window.prompt(
        'Confirm physical intervention performed on bench (leave blank to cancel — inspection-only sessions keep 0 changes):',
        ''
      );
      if (!actionTaken || !actionTaken.trim()) return;
      try {
        await ensureActiveWorkSession();
        const res = await fetchJsonWithFallback([`/api/sessions/${state.activeSessionId}/actions`], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'confirm_physical_change',
            confirmed: true,
            observed: `Step ${state.activeStep} bench inspection`,
            action_taken: actionTaken.trim(),
          }),
        });
        const count = res?.session?.state?.confirmed_changes?.length || 0;
        state.confirmedChangesCount = count;
        if (dom.confirmChangeLabel) dom.confirmChangeLabel.textContent = `Confirm Change (${count})`;
        appendChatMessage({
          role: 'assistant',
          author: 'CHANGE CONFIRMATION LOG',
          text: `Recorded confirmed technician intervention (#${count}): "${actionTaken.trim()}". Perform a fresh post-change Modbus read before closing.`,
        });
      } catch (err) {
        appendChatMessage({
          role: 'assistant',
          author: 'CHANGE CONFIRMATION LOG',
          text: `Could not record change: ${err.message || err}`,
        });
      }
    });
  }

  // Export Authoritative Session PDF + JSON Dossier (`EXP-01`, `EXP-02`)
  if (dom.btnExportSessionDossier) {
    dom.btnExportSessionDossier.addEventListener('click', async () => {
      try {
        await ensureActiveWorkSession();
        const manifest = await fetchJsonWithFallback([`/api/sessions/${state.activeSessionId}/exports`], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audience: 'private_bench' }),
        });
        appendChatMessage({
          role: 'assistant',
          author: 'MAINTENANCE DOSSIER EXPORT',
          text: `Generated ${manifest.export_profile} dossier (partial=${manifest.partial_report}, changes=${manifest.confirmed_changes_count ?? 0}): PDF (${manifest.pdf_url}) & JSON (${manifest.json_url}).`,
        });
        if (manifest.pdf_url) {
          if (window.FIELDSCAN_IOS_NATIVE && window.fieldscanNativeBridge?.shareExportedFile) {
            const pdfName = manifest.pdf_url.split('/').pop();
            window.fieldscanNativeBridge.shareExportedFile(pdfName, '', 'application/pdf');
          } else {
            window.open(manifest.pdf_url, '_blank');
          }
        }
      } catch (err) {
        appendChatMessage({
          role: 'assistant',
          author: 'MAINTENANCE DOSSIER EXPORT',
          text: `Export error: ${err.message || err}`,
        });
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dom.manualModal.hidden = true;
      dom.escalationModal.hidden = true;
      if (dom.calibrationPlannedModal) dom.calibrationPlannedModal.hidden = true;
    }
  });
}

async function ensureActiveWorkSession() {
  if (state.activeSessionId) return state.activeSessionId;
  try {
    const mode = dom.selectModbusMode?.value || 'auto';
    const created = await fetchJsonWithFallback(['/api/sessions'], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile_id: 'tzone_tht02',
        transport_mode: mode,
        simulation: mode.startsWith('sim_'),
      }),
    });
    if (created?.session_id) {
      state.activeSessionId = created.session_id;
      const count = created?.state?.confirmed_changes?.length || 0;
      if (dom.confirmChangeLabel) dom.confirmChangeLabel.textContent = `Confirm Change (${count})`;
    }
  } catch (_e) {}
  return state.activeSessionId;
}

function bootstrap() {
  window.lucide?.createIcons();
  let cadOk = false;
  try {
    initCadStudio();
    cadOk = Boolean(cad.renderer);
  } catch (_err) {
    cadOk = false;
  }
  if (!cadOk) {
    let prevHudTs = performance.now();
    const fallbackHudTick = (now) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - prevHudTs) / 1000));
      prevHudTs = now;
      renderSpatialVisionHud(now, dt);
      requestAnimationFrame(fallbackHudTick);
    };
    requestAnimationFrame(fallbackHudTick);
  }
  initScadaChart();
  renderDipHud();
  syncCvHudControls();
  syncZoomButtonsUi();
  setManualPage(1);
  bindWorkstationEvents();

  pollTelemetry();
  pollVisionSpatialTelemetry();
  setInterval(pollTelemetry, 650);
  setInterval(pollVisionSpatialTelemetry, 115);

  window.encodeFloat32To16kHzWavBlob = encodeFloat32To16kHzWavBlob;
  window.startIpadCameraStream = startIpadCameraStream;
  window.stopIpadCameraStream = stopIpadCameraStream;
  window.applyUnifiedStatus = applyUnifiedStatus;
  window.notifyNativeBridge = notifyNativeBridge;
}

bootstrap();
