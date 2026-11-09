import { siteConfig, type PhysicsPreset } from '../config/siteConfig';
import { tactileAudio } from './TactileAudio';

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
}

export function initUnityChamber(): void {
  const canvas = document.getElementById('chamberSimCanvas') as HTMLCanvasElement | null;
  const viewportWrap = document.getElementById('chamberViewportWrap');
  const presetBar = document.getElementById('chamberPresetBar');
  const fullscreenBtn = document.getElementById('chamberFullscreenBtn');
  const launchJumpBtn = document.getElementById('chamberJumpBtn');
  const loadUnityBtn = document.getElementById('chamberLoadUnityBtn');

  // Telemetry readout elements
  const elVel = document.getElementById('readoutVelocity');
  const elNormal = document.getElementById('readoutNormal');
  const elSlope = document.getElementById('readoutSlope');
  const elGrounded = document.getElementById('readoutGrounded');
  const elBounces = document.getElementById('readoutBounces');
  const elPresetBadge = document.getElementById('chamberActivePresetBadge');
  const elPresetDesc = document.getElementById('chamberPresetDescription');

  if (!canvas || !viewportWrap) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let activePreset: PhysicsPreset = siteConfig.physicsPresets[0];

  // Render preset buttons
  if (presetBar) {
    presetBar.innerHTML = siteConfig.physicsPresets
      .map(
        (preset, idx) => `
        <button
          type="button"
          class="preset-chip ${idx === 0 ? 'active' : ''}"
          data-preset-id="${preset.id}"
        >
          ${preset.name}
        </button>
      `
      )
      .join('');

    presetBar.querySelectorAll<HTMLButtonElement>('.preset-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-preset-id');
        const found = siteConfig.physicsPresets.find((p) => p.id === id);
        if (!found) return;
        activePreset = found;
        tactileAudio.playTick(1080);

        presetBar.querySelectorAll('.preset-chip').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        if (elPresetBadge) elPresetBadge.textContent = activePreset.badge;
        if (elPresetDesc) elPresetDesc.textContent = activePreset.description;
      });
    });
  }

  // ResizeObserver outside paint loop
  let width = 800;
  let height = 460;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const rect = entry.contentRect;
      if (rect.width > 0 && rect.height > 0) {
        width = rect.width;
        height = rect.height;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
    }
  });
  resizeObserver.observe(viewportWrap);

  // Player state in normalized simulation coordinates
  const player = {
    x: 180,
    y: 220,
    vx: 0,
    vy: 0,
    radius: 18,
    halfHeight: 16,
    grounded: false,
    groundNormalX: 0,
    groundNormalY: -1,
    slopeDeg: 0,
    bouncesThisTick: 0,
    targetX: 360,
    pointerActive: false,
  };

  const trail: { x: number; y: number }[] = [];

  // Mouse / Pointer steering inside chamber viewport
  canvas.addEventListener('pointermove', (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    player.targetX = e.clientX - rect.left;
    player.pointerActive = true;
  });

  canvas.addEventListener('pointerdown', (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    player.targetX = e.clientX - rect.left;
    player.pointerActive = true;
    // Trigger jump impulse when clicking inside the simulation
    if (player.grounded) {
      player.vy = -370;
      player.grounded = false;
      tactileAudio.playImpulse();
    } else {
      player.vy = -260;
      tactileAudio.playTick(720);
    }
  });

  launchJumpBtn?.addEventListener('click', () => {
    player.vy = -380;
    player.grounded = false;
    tactileAudio.playImpulse();
  });

  fullscreenBtn?.addEventListener('click', () => {
    tactileAudio.playTick(880);
    if (!document.fullscreenElement) {
      viewportWrap.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  });

  // Optional Unity WebGL build mount check
  loadUnityBtn?.addEventListener('click', async () => {
    tactileAudio.playConfirmChime();
    try {
      const res = await fetch('/unity-build/index.html', { method: 'HEAD' });
      if (res.ok && res.headers.get('content-type')?.includes('text/html')) {
        // Check if it is an actual exported build by verifying TemplateData or Build
        const buildCheck = await fetch('/unity-build/Build/', { method: 'HEAD' });
        if (buildCheck.ok) {
          viewportWrap.innerHTML = `<iframe class="chamber-unity-iframe" src="/unity-build/index.html" title="Unity 6 Kinematic Character Controller WebGL Build" allow="fullscreen; autoplay"></iframe>`;
          return;
        }
      }
    } catch {
      // Fallback notification if Unity build hasn't been dropped in yet
    }
    loadUnityBtn.textContent = 'Sim Mode Active (Drop Build in /public/unity-build)';
    setTimeout(() => {
      loadUnityBtn.textContent = 'Mount Unity WebGL Build';
    }, 3200);
  });

  // Build dynamic terrain segments scaled to canvas dimensions
  function getTerrainSegments(w: number, h: number): Segment[] {
    const base = h - 68;
    return [
      // Left boundary wall
      { x1: 28, y1: 60, x2: 28, y2: base, label: '90° WALL' },
      // Flat spawn deck
      { x1: 28, y1: base, x2: w * 0.25, y2: base, label: '0° FLAT' },
      // Step-up ledge
      { x1: w * 0.25, y1: base, x2: w * 0.25, y2: base - 22 },
      { x1: w * 0.25, y1: base - 22, x2: w * 0.42, y2: base - 22, label: 'STEP SNAP' },
      // Gentle 26 deg ramp
      { x1: w * 0.42, y1: base - 22, x2: w * 0.62, y2: base - 95, label: '26° RAMP' },
      // Mid plateau
      { x1: w * 0.62, y1: base - 95, x2: w * 0.74, y2: base - 95, label: 'PLATEAU' },
      // Steep 52 deg incline
      { x1: w * 0.74, y1: base - 95, x2: w * 0.88, y2: base - 210, label: '52° INCLINE' },
      // Steep 68 deg wall
      { x1: w * 0.88, y1: base - 210, x2: w - 32, y2: base - 335, label: '68° WALL' },
      // Floating angled deflector obstacle
      { x1: w * 0.34, y1: base - 175, x2: w * 0.52, y2: base - 215, label: 'DEFLECTOR HULL' },
    ];
  }

  // Closest point on segment to circle center
  function closestPointOnSegment(px: number, py: number, s: Segment) {
    const dx = s.x2 - s.x1;
    const dy = s.y2 - s.y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return { x: s.x1, y: s.y1 };
    const t = Math.max(0, Math.min(1, ((px - s.x1) * dx + (py - s.y1) * dy) / lenSq));
    return { x: s.x1 + t * dx, y: s.y1 + t * dy };
  }

  let lastTime = performance.now();
  let patrolPhase = 0;

  function updateSimulation(now: number) {
    const dt = Math.min(0.033, (now - lastTime) * 0.001);
    lastTime = now;

    const segments = getTerrainSegments(width, height);

    // Autonomous target patrol if pointer hasn't moved recently
    if (!player.pointerActive) {
      patrolPhase += dt * 0.65;
      player.targetX = width * 0.16 + ((Math.sin(patrolPhase) + 1) * 0.5) * (width * 0.72);
      if (Math.sin(patrolPhase * 3.1) > 0.96 && player.grounded) {
        player.vy = -340;
        player.grounded = false;
      }
    }

    // Horizontal steering acceleration toward targetX
    const dxTarget = player.targetX - player.x;
    const desiredVx = Math.max(-340, Math.min(340, dxTarget * 4.2));
    const accel = player.grounded ? 14 : 6;
    player.vx += (desiredVx - player.vx) * accel * dt;

    // Apply friction damping based on preset
    if (player.grounded && Math.abs(dxTarget) < 12) {
      player.vx *= Math.pow(1 - activePreset.friction * 0.85, dt * 60);
    }

    // Gravity pass
    player.vy += activePreset.gravity * 36 * dt;

    // Proposed displacement
    let remX = player.vx * dt;
    let remY = player.vy * dt;

    player.grounded = false;
    player.bouncesThisTick = 0;

    // Iterative Collide & Slide Solver (up to activePreset.maxBounces)
    for (let bounce = 0; bounce < activePreset.maxBounces; bounce++) {
      player.x += remX;
      player.y += remY;
      remX = 0;
      remY = 0;

      let collided = false;

      for (const seg of segments) {
        const cp = closestPointOnSegment(player.x, player.y, seg);
        const distX = player.x - cp.x;
        const distY = player.y - cp.y;
        const dist = Math.hypot(distX, distY);

        if (dist < player.radius && dist > 0.0001) {
          const nx = distX / dist;
          const ny = distY / dist;
          const penetration = player.radius - dist + 0.25;

          // Push out to skin-width surface
          player.x += nx * penetration;
          player.y += ny * penetration;

          // Calculate surface slope angle relative to up vector (0, -1)
          const upDot = Math.max(-1, Math.min(1, nx * 0 + ny * -1));
          const slopeDeg = (Math.acos(upDot) * 180) / Math.PI;

          // Project velocity onto tangent plane: V_slide = V - (V · N)N
          const vDotN = player.vx * nx + player.vy * ny;
          if (vDotN < 0) {
            if (slopeDeg <= activePreset.maxSlopeAngle) {
              player.grounded = true;
              player.groundNormalX = nx;
              player.groundNormalY = ny;
              player.slopeDeg = slopeDeg;

              // Slide seamlessly along walkable slope
              player.vx -= vDotN * nx;
              player.vy -= vDotN * ny;
            } else {
              // Steep slope > maxSlopeAngle: deflect without climbing
              const tangentScale = 1 - activePreset.friction * 0.35;
              player.vx = (player.vx - vDotN * nx) * tangentScale;
              player.vy = (player.vy - vDotN * ny) * tangentScale;
              player.groundNormalX = nx;
              player.groundNormalY = ny;
              player.slopeDeg = slopeDeg;
            }
          }

          collided = true;
          player.bouncesThisTick = bounce + 1;
        }
      }

      if (!collided) break;
    }

    // Keep within bounds
    if (player.y > height + 40) {
      player.x = 140;
      player.y = 140;
      player.vx = 0;
      player.vy = 0;
    }

    // Record motion trail
    trail.push({ x: player.x, y: player.y });
    if (trail.length > 36) trail.shift();

    // Update Telemetry DOM Readouts
    const speedMeters = (Math.hypot(player.vx, player.vy) / 38).toFixed(2);
    if (elVel) elVel.textContent = `${speedMeters} m/s`;
    if (elNormal) {
      elNormal.textContent = `(${player.groundNormalX.toFixed(2)}, ${(-player.groundNormalY).toFixed(2)})`;
    }
    if (elSlope) {
      elSlope.textContent = `${player.slopeDeg.toFixed(1)}° / ${activePreset.maxSlopeAngle}°`;
    }
    if (elGrounded) {
      elGrounded.textContent = player.grounded ? 'SNAPPED // TRUE' : 'AIRBORNE // FALSE';
      elGrounded.className = `readout-val ${player.grounded ? 'highlight-emerald' : 'highlight-amber'}`;
    }
    if (elBounces) {
      elBounces.textContent = `${player.bouncesThisTick} / ${activePreset.maxBounces} MAX`;
    }

    // Render Chamber Scene
    if (!ctx) return;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Subtle schematic grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
    ctx.lineWidth = 1;
    const gridStep = 36;
    for (let gx = 0; gx < width; gx += gridStep) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
      ctx.stroke();
    }
    for (let gy = 0; gy < height; gy += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
      ctx.stroke();
    }

    // Target cursor vertical guide line
    ctx.save();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.beginPath();
    ctx.moveTo(player.targetX, 20);
    ctx.lineTo(player.targetX, height - 40);
    ctx.stroke();
    ctx.restore();

    // Draw Trajectory Trail
    if (trail.length > 2) {
      ctx.beginPath();
      trail.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw Terrain Segments & Slope Labels
    ctx.font = '600 10px "JetBrains Mono", monospace';
    for (const seg of segments) {
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      if (seg.label) {
        const mx = (seg.x1 + seg.x2) * 0.5;
        const my = (seg.y1 + seg.y2) * 0.5 + 18;
        ctx.fillStyle = 'rgba(148, 163, 184, 0.72)';
        ctx.fillText(seg.label, mx - 28, my);
      }
    }

    // Draw Swept Ground-Snap Probe Ray
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x, player.y + player.radius + activePreset.stepHeight * 40);
    ctx.strokeStyle = 'rgba(245, 190, 59, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw Surface Normal Vector N (Emerald)
    const normLen = 42;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + player.groundNormalX * normLen, player.y + player.groundNormalY * normLen);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Draw Velocity Slide Vector V_slide (Cyan)
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + player.vx * 0.16, player.y + player.vy * 0.16);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Draw Kinematic Capsule Collider
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-player.radius * 0.78, -player.radius, player.radius * 1.56, player.radius * 2, player.radius * 0.78);
    ctx.fill();
    ctx.stroke();

    // Center mass crosshair
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Top-left live overlay legend inside canvas
    ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillText(`PRESET: ${activePreset.name.toUpperCase()}`, 22, 30);
    ctx.fillStyle = 'rgba(138, 150, 168, 0.9)';
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.fillText('MOVE CURSOR TO STEER CAPSULE • CLICK TO TRIGGER JUMP IMPULSE', 22, 48);

    ctx.restore();
    requestAnimationFrame(updateSimulation);
  }

  requestAnimationFrame(updateSimulation);
}
