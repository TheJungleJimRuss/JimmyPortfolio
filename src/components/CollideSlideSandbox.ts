interface Wall {
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

interface SweepHit {
  t: number;
  nx: number;
  ny: number;
  contactX: number;
  contactY: number;
}

export function initCollideSlideSandbox(): void {
  const canvas = document.getElementById('collideSlideCanvas') as HTMLCanvasElement | null;
  const wrap = document.getElementById('collideSlideWrap');
  const eqReadout = document.getElementById('sandboxEquationReadout');

  if (!canvas || !wrap) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 520;
  let height = 360;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let pointerX = 360;
  let pointerY = 140;
  let pointerEngaged = false;

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
  resizeObserver.observe(wrap);

  canvas.addEventListener('pointermove', (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointerX = e.clientX - rect.left;
    pointerY = e.clientY - rect.top;
    pointerEngaged = true;
  });

  // Swept circle vs line segment intersection
  function sweepCircleSegment(
    ox: number,
    oy: number,
    dx: number,
    dy: number,
    radius: number,
    wall: Wall
  ): SweepHit | null {
    const wx = wall.bx - wall.ax;
    const wy = wall.by - wall.ay;
    const wLen = Math.hypot(wx, wy);
    if (wLen < 0.001) return null;

    // Unit normal pointing toward origin side
    let nx = -wy / wLen;
    let ny = wx / wLen;
    const toOriginX = ox - wall.ax;
    const toOriginY = oy - wall.ay;
    if (toOriginX * nx + toOriginY * ny < 0) {
      nx = -nx;
      ny = -ny;
    }

    const denom = dx * nx + dy * ny;
    // Must be moving toward the wall
    if (denom >= -0.0001) return null;

    const distToPlane = toOriginX * nx + toOriginY * ny - radius;
    const t = -distToPlane / denom;
    if (t < 0 || t > 1) return null;

    const hitCenterX = ox + dx * t;
    const hitCenterY = oy + dy * t;
    const contactX = hitCenterX - nx * radius;
    const contactY = hitCenterY - ny * radius;

    // Check if contact point projects within segment bounds
    const proj = ((contactX - wall.ax) * wx + (contactY - wall.ay) * wy) / (wLen * wLen);
    if (proj < -0.04 || proj > 1.04) return null;

    return { t, nx, ny, contactX, contactY };
  }

  function drawArrow(
    c: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    lineWidth = 2.2
  ) {
    const headLen = 9;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    c.strokeStyle = color;
    c.fillStyle = color;
    c.lineWidth = lineWidth;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();

    c.beginPath();
    c.moveTo(x2, y2);
    c.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    c.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    c.closePath();
    c.fill();
  }

  function render(now: number) {
    if (!ctx) return;

    // Gentle oscillation if user hasn't hovered yet
    if (!pointerEngaged) {
      pointerX = width * 0.68 + Math.cos(now * 0.0012) * 55;
      pointerY = height * 0.36 + Math.sin(now * 0.0017) * 65;
    }

    const startX = width * 0.22;
    const startY = height * 0.66;
    const radius = 20;
    const skinWidth = 2;

    // Angled corner wedge walls
    const walls: Wall[] = [
      { ax: width * 0.44, ay: height * 0.16, bx: width * 0.78, by: height * 0.48 },
      { ax: width * 0.78, ay: height * 0.48, bx: width * 0.48, by: height * 0.84 },
    ];

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Background coordinate grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw obstacle walls
    for (const w of walls) {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w.ax, w.ay);
      ctx.lineTo(w.bx, w.by);
      ctx.stroke();

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w.ax, w.ay);
      ctx.lineTo(w.bx, w.by);
      ctx.stroke();
    }

    // Desired displacement vector V
    const vx = pointerX - startX;
    const vy = pointerY - startY;

    // Ghost uncollided target vector
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(pointerX, pointerY);
    ctx.stroke();
    ctx.restore();

    // Iterative Collide & Slide (2 visual bounces)
    let curX = startX;
    let curY = startY;
    let remX = vx;
    let remY = vy;
    let hitCount = 0;
    let lastDotProduct = 0;

    for (let bounce = 0; bounce < 2; bounce++) {
      let earliest: SweepHit | null = null;
      for (const w of walls) {
        const hit = sweepCircleSegment(curX, curY, remX, remY, radius + skinWidth, w);
        if (hit && (!earliest || hit.t < earliest.t)) {
          earliest = hit;
        }
      }

      if (!earliest) {
        // Unobstructed segment
        drawArrow(ctx, curX, curY, curX + remX, curY + remY, bounce === 0 ? '#00f0ff' : '#f5be3b', 2.4);
        curX += remX;
        curY += remY;
        break;
      }

      hitCount++;
      const snapX = curX + remX * earliest.t;
      const snapY = curY + remY * earliest.t;

      // Primary approach vector up to contact skin
      drawArrow(ctx, curX, curY, snapX, snapY, '#00f0ff', 2.4);

      // Draw intermediate swept sphere at contact
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(snapX, snapY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw surface normal N at contact point
      drawArrow(
        ctx,
        earliest.contactX,
        earliest.contactY,
        earliest.contactX + earliest.nx * 38,
        earliest.contactY + earliest.ny * 38,
        '#10b981',
        2
      );

      // Remaining leftover displacement
      const leftX = remX * (1 - earliest.t);
      const leftY = remY * (1 - earliest.t);

      // Project leftover onto tangent plane: V_slide = V_left - (V_left · N)N
      const dot = leftX * earliest.nx + leftY * earliest.ny;
      lastDotProduct = dot;
      remX = leftX - dot * earliest.nx;
      remY = leftY - dot * earliest.ny;
      curX = snapX;
      curY = snapY;

      if (bounce === 1) {
        drawArrow(ctx, curX, curY, curX + remX, curY + remY, '#f22943', 2.4);
        curX += remX;
        curY += remY;
      }
    }

    // Draw Start Capsule Circle
    ctx.fillStyle = 'rgba(0, 240, 255, 0.14)';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(startX, startY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw Resolved Final Position Circle
    ctx.fillStyle = 'rgba(245, 190, 59, 0.18)';
    ctx.strokeStyle = '#f5be3b';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(curX, curY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (eqReadout) {
      eqReadout.textContent =
        hitCount > 0
          ? `BOUNCES: ${hitCount} // V_SLIDE = V - (${lastDotProduct.toFixed(1)})N`
          : `BOUNCES: 0 // UNOBSTRUCTED SWEEP`;
    }

    ctx.restore();
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
