import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Generic 3D stage shared by every digital twin: PBR renderer, X-ray shading,
// staged disassembly (with unscrew rotation), picking, labels and camera presets.

// [color, fresnel power, base glow, opacity]
const XRAY = {
  structure: ['#4f7282', 2.4, 0.015, 0.3],
  shell: ['#5fd4d0', 2.0, 0.025, 0.8],
  electronics: ['#ffb347', 1.6, 0.12, 0.85],
  signal: ['#6fe3a1', 1.0, 0.55, 1],
  fluid: ['#3aa0ff', 1.3, 0.16, 0.75],
  internal: ['#ffd166', 1.1, 0.55, 1],
};

function xrayMaterial([color, power, base, opacity]) {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(color) },
      power: { value: power },
      base: { value: base },
      opacity: { value: opacity },
    },
    vertexShader: `
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vec4 local = vec4(position, 1.0);
        vec3 n = normal;
        #ifdef USE_INSTANCING
          local = instanceMatrix * local;
          n = mat3(instanceMatrix) * n;
        #endif
        vec4 mv = modelViewMatrix * local;
        vN = normalize(normalMatrix * n);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 color;
      uniform float power;
      uniform float base;
      uniform float opacity;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), power);
        float a = clamp((base + f) * opacity, 0.0, 1.0);
        gl_FragColor = vec4(color * (base + f * 1.25), a);
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}

export const ease = k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const clamp01 = v => Math.max(0, Math.min(1, v));

function visibleInScene(o) {
  for (let p = o; p; p = p.parent) if (!p.visible) return false;
  return true;
}

export class Stage {
  /**
   * @param model { root, room, parts, anchors } — parts: { id: { object, explode:[x,y,z], spin?:[ax,ay,az,rad], window?:[a,b], parent?, name, ... } }
   */
  constructor(container, model, opts = {}) {
    const {
      onSelect = () => {}, onHover = () => {}, presets = {}, initial = 'overview',
      background = '#0d151a', fog = [8, 18], minFocus = 0.35, focusScale = 1.6,
      near = 0.02, far = 60, minDistance = 0.2, maxDistance = 9, exposure = 1.05, envIntensity = 0.5,
    } = opts;
    this.container = container;
    this.onSelect = onSelect;
    this.onHover = onHover;
    this.presets = presets;
    this.minFocus = minFocus;
    this.focusScale = focusScale;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = exposure;
    container.appendChild(renderer.domElement);
    this.renderer = renderer;

    const labels = new CSS2DRenderer();
    Object.assign(labels.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
    container.appendChild(labels.domElement);
    this.labelRenderer = labels;

    const scene = new THREE.Scene();
    this.bg = { normal: new THREE.Color(background), xray: new THREE.Color('#03080b') };
    scene.background = this.bg.normal;
    scene.fog = new THREE.Fog(background, fog[0], fog[1]);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = envIntensity;
    this.scene = scene;

    const start = presets[initial] || { pos: [2, 2, 3], target: [0, 0, 0] };
    this.camera = new THREE.PerspectiveCamera(40, 1, near, far);
    this.camera.position.set(...start.pos);
    const controls = new OrbitControls(this.camera, renderer.domElement);
    controls.target.set(...start.target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = 1.52;
    controls.minDistance = minDistance;
    controls.maxDistance = maxDistance;
    controls.autoRotateSpeed = 0.6;
    controls.addEventListener('start', () => { this.tween = null; });
    this.controls = controls;

    this.model = model;
    scene.add(model.root);
    this.grid = new THREE.GridHelper(10, 50, 0x1f5560, 0x0f2a31);
    this.grid.visible = false;
    scene.add(this.grid);

    this.parts = model.parts;
    const q = new THREE.Quaternion();
    for (const [id, def] of Object.entries(this.parts)) {
      def.id = id;
      def.base = def.object.position.clone();
      def.baseQuat = def.object.quaternion.clone();
      def.offset = new THREE.Vector3(...def.explode);
      if (def.spin) def.spinAxis = new THREE.Vector3(def.spin[0], def.spin[1], def.spin[2]).normalize();
      def.object.userData.partId = id;
    }
    this.q = q;

    const xmats = Object.fromEntries(Object.entries(XRAY).map(([k, v]) => [k, xrayMaterial(v)]));
    model.root.traverse(o => {
      if (!o.isMesh) return;
      o.userData.mat = o.material;
      o.userData.xmat = xmats[o.userData.cat] || xmats.structure;
      o.userData.shadow = o.castShadow;
    });

    this.labels = {};
    for (const [id, anchor] of Object.entries(model.anchors || {})) {
      const div = document.createElement('div');
      div.className = 'label3d';
      const obj = new CSS2DObject(div);
      obj.position.copy(anchor);
      this.parts[id].object.add(obj);
      this.labels[id] = div;
    }

    this.selectionBox = new THREE.Box3Helper(new THREE.Box3(), 0xffc857);
    this.selectionBox.visible = false;
    scene.add(this.selectionBox);

    this.view = 'normal';
    this.explode = 0;
    this.explodeTarget = 0;
    this.selected = null;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.tmp = new THREE.Matrix4();
    this.box = new THREE.Box3();
    this.active = true;

    this.bindPointer();
    new ResizeObserver(() => this.resize()).observe(container);
    this.resize();
    this.clock = new THREE.Timer();
    this.clock.connect(document);
    renderer.setAnimationLoop(() => this.frame());
  }

  setLabel(id, title, value, cls = '') {
    const el = this.labels[id];
    if (!el) return;
    el.className = 'label3d ' + cls;
    el.innerHTML = `<b>${title}</b><span>${value}</span>`;
  }

  // Pause rendering while the stage is hidden behind another workspace.
  setActive(on) {
    if (on === this.active) return;
    this.active = on;
    this.renderer.setAnimationLoop(on ? () => this.frame() : null);
    if (on) {
      this.clock.reset?.();
      this.resize();
    }
  }

  resize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // ------------------------------------------------------------ interaction

  pickHit(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    for (const hit of this.raycaster.intersectObject(this.model.root, true)) {
      if (visibleInScene(hit.object)) return hit;
    }
    return null;
  }

  pick(event) {
    const hit = this.pickHit(event);
    for (let o = hit?.object; o; o = o.parent) if (o.userData.partId) return o.userData.partId;
    return null;
  }

  // Hook for clickable sub-objects (e.g. DIP sliders); return true to consume the click.
  onPickObject() { return false; }

  bindPointer() {
    const el = this.renderer.domElement;
    let down = null;
    let raf = 0;
    el.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
    el.addEventListener('pointerup', e => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 4) return;
      const hit = this.pickHit(e);
      if (hit && this.onPickObject(hit.object)) return;
      const id = this.pick(e);
      this.select(id);
      this.onSelect(id);
    });
    el.addEventListener('pointermove', e => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const hit = this.pickHit(e);
        const hint = hit?.object.userData.hint;
        const id = this.pick(e);
        el.style.cursor = hint || id ? 'pointer' : 'grab';
        this.onHover(hint || (id ? this.parts[id].name : null), e.clientX, e.clientY);
      });
    });
    el.addEventListener('pointerleave', () => this.onHover(null));
  }

  select(id) {
    this.selected = id && this.parts[id] ? this.parts[id] : null;
    this.selectionBox.visible = !!this.selected;
  }

  focus(id) {
    const def = this.parts[id];
    if (!def) return;
    // Measure only after the explode animation settles, otherwise we aim at the old position.
    if (Math.abs(this.explode - this.explodeTarget) > 0.01) {
      this.pendingFocus = id;
      return;
    }
    this.pendingFocus = null;
    this.box.setFromObject(def.object, true);
    const center = this.box.getCenter(new THREE.Vector3());
    const size = this.box.getSize(new THREE.Vector3()).length();
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    if (dir.y < 0.15) dir.y = 0.25;
    dir.normalize();
    this.flyTo(center.clone().addScaledVector(dir, Math.max(this.minFocus, size * this.focusScale)), center);
  }

  preset(name) {
    const p = this.presets[name];
    if (p) this.flyTo(new THREE.Vector3(...p.pos), new THREE.Vector3(...p.target));
  }

  flyTo(pos, target, duration = 1100) {
    this.tween = {
      p0: this.camera.position.clone(), t0: this.controls.target.clone(),
      p1: pos, t1: target, start: performance.now(), duration,
    };
  }

  // ------------------------------------------------------------ view modes

  setView(mode) {
    this.view = mode;
    const xray = mode === 'xray';
    this.model.root.traverse(o => {
      if (!o.isMesh || o.material?.userData?.keep || o.userData.mat?.userData?.keep) return;
      o.material = xray ? o.userData.xmat : o.userData.mat;
      o.castShadow = !xray && o.userData.shadow;
    });
    if (this.model.room) this.model.room.visible = !xray && !this.isolated;
    this.grid.visible = xray;
    this.scene.background = xray ? this.bg.xray : this.bg.normal;
    this.scene.fog.color.copy(this.scene.background);
  }

  setExplode(value) {
    this.explodeTarget = clamp01(value);
  }

  setLabels(on) {
    this.container.classList.toggle('labels-off', !on);
  }

  setAutoRotate(on) {
    this.controls.autoRotate = on;
  }

  isolate(id) {
    let root = this.parts[id];
    while (root?.parent) root = this.parts[root.parent];
    for (const def of Object.values(this.parts)) {
      if (!def.parent) def.object.visible = def === root;
      else def.object.visible = true;
    }
    this.isolated = true;
    if (this.model.room) this.model.room.visible = false;
    this.focus(id);
  }

  showAll() {
    for (const def of Object.values(this.parts)) def.object.visible = true;
    this.isolated = false;
    if (this.model.room) this.model.room.visible = this.view !== 'xray';
  }

  // ------------------------------------------------------------ render loop

  tick() {} // per-frame hook for subclasses: (dt, t)

  frame() {
    this.clock.update();
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.getElapsed();

    this.explode += (this.explodeTarget - this.explode) * Math.min(1, dt * 4);
    if (Math.abs(this.explodeTarget - this.explode) < 0.0005) this.explode = this.explodeTarget;
    const e = clamp01(this.explode);
    if (this.pendingFocus && Math.abs(this.explode - this.explodeTarget) <= 0.01) this.focus(this.pendingFocus);
    for (const def of Object.values(this.parts)) {
      // Each part moves inside its own window of the global explode value, so a
      // disassembly can follow a real procedure (gland first, then the barrel...).
      const [a, b] = def.window || [0, 1];
      const k = ease(clamp01((e - a) / (b - a)));
      def.object.position.copy(def.base).addScaledVector(def.offset, k);
      if (def.spinAxis) {
        this.q.setFromAxisAngle(def.spinAxis, def.spin[3] * k);
        def.object.quaternion.copy(def.baseQuat).multiply(this.q);
      }
    }

    this.tick(dt, t);

    if (this.selected) this.selectionBox.box.setFromObject(this.selected.object, true);

    if (this.tween) {
      const k = Math.min(1, (performance.now() - this.tween.start) / this.tween.duration);
      const qq = ease(k);
      this.camera.position.lerpVectors(this.tween.p0, this.tween.p1, qq);
      this.controls.target.lerpVectors(this.tween.t0, this.tween.t1, qq);
      if (k >= 1) this.tween = null;
    }
    this.controls.update(dt);
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }
}
