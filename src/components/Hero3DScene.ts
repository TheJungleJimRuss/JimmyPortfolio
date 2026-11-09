import * as THREE from 'three';
import { tactileAudio } from './TactileAudio';

export function initHero3DScene(): void {
  const canvas = document.getElementById('hero3dCanvas') as HTMLCanvasElement | null;
  const stage = document.getElementById('hero3dStage');
  const vectorReadout = document.getElementById('heroVectorReadout');
  const impulseBtn = document.getElementById('heroImpulseBtn');

  if (!canvas || !stage) return;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.3, 6.2);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Root assembly group
  const coreGroup = new THREE.Group();
  scene.add(coreGroup);

  // 1. Inner Wireframe Player Capsule (representing the Kinematic Character Controller)
  const capsuleGeo = new THREE.CapsuleGeometry(0.68, 1.05, 8, 18);
  const capsuleEdges = new THREE.EdgesGeometry(capsuleGeo);
  const capsuleMat = new THREE.LineBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.88,
  });
  const capsuleWire = new THREE.LineSegments(capsuleEdges, capsuleMat);
  coreGroup.add(capsuleWire);

  // Inner solid core with subtle fresnel-like dark translucency
  const innerCoreMat = new THREE.MeshBasicMaterial({
    color: 0x071526,
    transparent: true,
    opacity: 0.65,
  });
  const innerCoreMesh = new THREE.Mesh(capsuleGeo, innerCoreMat);
  coreGroup.add(innerCoreMesh);

  // 2. Outer Swept Collision Hull (Icosahedron wireframe)
  const hullGeo = new THREE.IcosahedronGeometry(1.75, 1);
  const hullEdges = new THREE.EdgesGeometry(hullGeo);
  const hullMat = new THREE.LineBasicMaterial({
    color: 0xf5be3b,
    transparent: true,
    opacity: 0.34,
  });
  const hullWire = new THREE.LineSegments(hullEdges, hullMat);
  coreGroup.add(hullWire);

  // 3. Gimbal Spatial Horizon Rings
  const ringGeo = new THREE.TorusGeometry(2.18, 0.012, 8, 72);
  const ringMatCyan = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.42,
  });
  const ringMatCrimson = new THREE.MeshBasicMaterial({
    color: 0xf22943,
    transparent: true,
    opacity: 0.35,
  });

  const ringXY = new THREE.Mesh(ringGeo, ringMatCyan);
  ringXY.rotation.x = Math.PI / 2.4;
  coreGroup.add(ringXY);

  const ringYZ = new THREE.Mesh(ringGeo, ringMatCrimson);
  ringYZ.rotation.y = Math.PI / 3;
  coreGroup.add(ringYZ);

  // 4. Live Velocity & Deflection Vector Arrows
  const origin = new THREE.Vector3(0, 0, 0);
  const velDir = new THREE.Vector3(1, 0.5, 0).normalize();
  const slideDir = new THREE.Vector3(-0.4, 0.9, 0.2).normalize();

  const velocityArrow = new THREE.ArrowHelper(velDir, origin, 1.9, 0x00f0ff, 0.28, 0.16);
  const slideArrow = new THREE.ArrowHelper(slideDir, origin, 1.65, 0xf22943, 0.25, 0.14);
  coreGroup.add(velocityArrow);
  coreGroup.add(slideArrow);

  // 5. Floating Spatial Coordinate Nodes (Particle Field)
  const particleCount = 90;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const r = 2.4 + Math.random() * 1.6;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0x7dd3fc,
    size: 0.045,
    transparent: true,
    opacity: 0.65,
  });
  const particleCloud = new THREE.Points(particleGeo, particleMat);
  scene.add(particleCloud);

  // Mouse & Spring Physics State
  let targetRotX = 0.18;
  let targetRotY = -0.35;
  let currentRotX = 0.18;
  let currentRotY = -0.35;
  let cursorSpeed = 0;
  let impulseEnergy = 0;
  let lastMouseX = 0;
  let lastMouseY = 0;

  const triggerImpulseWave = () => {
    impulseEnergy = 1.0;
    tactileAudio.playImpulse();
  };

  stage.addEventListener('pointermove', (e: PointerEvent) => {
    const rect = stage.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    cursorSpeed = Math.min(1.2, Math.hypot(dx, dy) * 0.025);
    targetRotY = nx * 0.95;
    targetRotX = -ny * 0.65;

    // Update live vector arrows toward pointer direction
    const pointerVec = new THREE.Vector3(nx * 1.2, ny * 1.2, 0.45).normalize();
    const normalVec = new THREE.Vector3(0, 1, 0.2).normalize();
    const slideVec = pointerVec.clone().sub(normalVec.clone().multiplyScalar(pointerVec.dot(normalVec))).normalize();

    velocityArrow.setDirection(pointerVec);
    slideArrow.setDirection(slideVec);

    if (vectorReadout) {
      vectorReadout.textContent = `V_SLIDE: (${slideVec.x.toFixed(2)}, ${slideVec.y.toFixed(2)}, ${slideVec.z.toFixed(2)})`;
    }
  });

  canvas.addEventListener('click', triggerImpulseWave);
  impulseBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerImpulseWave();
  });

  // Single ResizeObserver outside the paint loop (apply-webgl-shaders guidance)
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      }
    }
  });
  resizeObserver.observe(stage);

  let clock = performance.now();

  const animate = (now: number) => {
    const dt = Math.min(0.05, (now - clock) * 0.001);
    clock = now;

    // Smooth spring interpolation
    currentRotX += (targetRotX - currentRotX) * 7.5 * dt;
    currentRotY += (targetRotY - currentRotY) * 7.5 * dt;

    coreGroup.rotation.x = currentRotX + Math.sin(now * 0.0008) * 0.08;
    coreGroup.rotation.y = currentRotY + now * 0.00035;

    // Counter-rotate outer hull and gimbal rings
    hullWire.rotation.y = -now * 0.0006;
    hullWire.rotation.z = now * 0.0004;
    ringXY.rotation.z = now * 0.0009;
    ringYZ.rotation.x = -now * 0.0007;

    // Impulse & velocity hull expansion
    cursorSpeed = Math.max(0, cursorSpeed - dt * 2.2);
    impulseEnergy = Math.max(0, impulseEnergy - dt * 2.4);

    const hullScale = 1 + cursorSpeed * 0.14 + Math.sin(impulseEnergy * Math.PI) * 0.28;
    hullWire.scale.setScalar(hullScale);
    hullMat.opacity = 0.32 + impulseEnergy * 0.55;

    const capsulePulse = 1 + Math.sin(impulseEnergy * Math.PI * 2) * 0.1;
    capsuleWire.scale.setScalar(capsulePulse);

    particleCloud.rotation.y = now * 0.00018;
    particleCloud.rotation.x = currentRotX * 0.25;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}
