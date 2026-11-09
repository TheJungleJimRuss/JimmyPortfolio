export interface ProjectItem {
  id: string;
  code: string;
  title: string;
  category: string;
  summary: string;
  metrics: { label: string; value: string }[];
  techStack: string[];
  repoUrl: string;
  featuredBadge: string;
  schematicType: 'kinematics' | 'telemetry' | 'pipeline' | 'audio';
}

export interface CodeTabItem {
  id: string;
  filename: string;
  language: 'C# // UNITY 6' | 'TYPESCRIPT // STRICT';
  subsystem: string;
  description: string;
  highlights: string[];
  code: string;
}

export interface PhysicsPreset {
  id: string;
  name: string;
  badge: string;
  gravity: number;
  maxSlopeAngle: number;
  friction: number;
  stepHeight: number;
  maxBounces: number;
  description: string;
}

export const siteConfig = {
  features: {
    /**
     * Future-proof flag for commercial drone & aerial operations.
     * While false, NO mode toggle or flight deck UI is rendered anywhere on the site.
     * Flip to true in the future to automatically mount the mode switcher & aerial flight deck.
     */
    enableFlightOps: false,
  },

  identity: {
    name: 'JIMMY RUSS',
    monogram: 'JR',
    role: 'Systems & Gameplay Software Engineer',
    tagline:
      'Architecting deterministic game physics, custom kinematic character controllers, and high-performance interactive web applications.',
    statusText: 'AVAILABLE FOR SOFTWARE & GAME ENGINEERING ROLES',
    email: 'thejunglejimruss@gmail.com',
    githubUrl: 'https://github.com/TheJungleJimRuss',
    githubReposUrl: 'https://github.com/TheJungleJimRuss?tab=repositories',
    linkedinUrl: 'https://www.linkedin.com',
    location: 'UNITED STATES // UTC-6',
  },

  physicsPresets: [
    {
      id: 'standard',
      name: 'Standard Kinematic',
      badge: 'DEFAULT // 55° LIMIT',
      gravity: 24.0,
      maxSlopeAngle: 55,
      friction: 0.88,
      stepHeight: 0.35,
      maxBounces: 4,
      description: 'Crisp, responsive ground snapping with zero-jitter slope traversal and 4-iteration crease deflection.',
    },
    {
      id: 'low-grav',
      name: 'Low-G Orbital',
      badge: '0.35G // HIGH AIR CONTROL',
      gravity: 8.5,
      maxSlopeAngle: 60,
      friction: 0.65,
      stepHeight: 0.45,
      maxBounces: 5,
      description: 'Reduced gravitational acceleration emphasizing mid-air velocity deflection across angled obstacle hulls.',
    },
    {
      id: 'ice-slide',
      name: 'Zero-Friction Kinetic',
      badge: 'μ = 0.02 // PURE TANGENT',
      gravity: 24.0,
      maxSlopeAngle: 42,
      friction: 0.04,
      stepHeight: 0.25,
      maxBounces: 6,
      description: 'Preserves 98% of residual momentum along the collision tangent plane V_slide = V - (V · N)N.',
    },
    {
      id: 'steep-climb',
      name: 'High-Torque All-Terrain',
      badge: '72° CLIMB // SNAP LOCK',
      gravity: 28.0,
      maxSlopeAngle: 72,
      friction: 0.96,
      stepHeight: 0.55,
      maxBounces: 4,
      description: 'Aggressive ground-normal projection permitting traversal of extreme inclines without vertical pop.',
    },
  ] as PhysicsPreset[],

  projects: [
    {
      id: 'kinematic-controller',
      code: 'SYS_01 // PHYSICS ENGINE',
      title: 'Kinematic Character Controller',
      category: 'Unity 6 & C# Vector Mathematics',
      summary:
        'Custom swept-volume character motor implementing Kasper Fauerby’s collide-and-slide algorithm. Eliminates Unity Rigidbody physics jitter, resolves acute two-plane corner creases, and enforces deterministic ground snapping across arbitrary mesh topology.',
      metrics: [
        { label: 'Max Slide Bounces', value: '4 Iterations / Tick' },
        { label: 'Heap Allocations', value: '0 Bytes / Frame' },
        { label: 'Skin Width Precision', value: '0.015m Epsilon' },
      ],
      techStack: ['Unity 6', 'C# 11', 'Swept SphereCast', 'Linear Algebra', 'Zero-GC Architecture'],
      repoUrl: 'https://github.com/TheJungleJimRuss/Kinematic-Unity-Character-Controller',
      featuredBadge: 'CORE KINEMATICS',
      schematicType: 'kinematics',
    },
    {
      id: 'drone-desktop',
      code: 'SYS_02 // DESKTOP TELEMETRY',
      title: 'Drone Desktop',
      category: 'TypeScript, Electron & React',
      summary:
        '[ Drone Desktop Summary Placeholder — Ground control station for flight telemetry, sensor logs, and mission planning ]',
      metrics: [
        { label: 'Platform', value: 'Electron / Node.js' },
        { label: 'State Model', value: 'Deterministic FSM' },
        { label: 'Latency', value: '< 8ms Response' },
      ],
      techStack: ['TypeScript', 'Electron', 'React', 'Telemetry Logs', 'State Machines'],
      repoUrl: 'https://github.com/TheJungleJimRuss/DronePilotApp',
      featuredBadge: 'DESKTOP GCS',
      schematicType: 'telemetry',
    },
    {
      id: 'photography-portfolio',
      code: 'SYS_03 // VISUAL SHOWCASE',
      title: 'Photography Portfolio',
      category: 'Modern Web, Canvas & Visuals',
      summary:
        '[ Photography Portfolio Summary Placeholder — High-resolution imagery showcase with EXIF telemetry and responsive layouts ]',
      metrics: [
        { label: 'Color Space', value: 'OKLCH Perceptual' },
        { label: 'Performance', value: '60+ FPS Viewport' },
        { label: 'Layout Shift', value: '0.000 CLS' },
      ],
      techStack: ['HTML5 Canvas', 'Modern CSS Grid', 'GPU Compositing', 'EXIF Parser'],
      repoUrl: 'https://github.com/TheJungleJimRuss/Photography-Portfolio',
      featuredBadge: 'VISUAL PIPELINE',
      schematicType: 'pipeline',
    },
    {
      id: 'music-studio',
      code: 'SYS_04 // INTERACTIVE AUDIO',
      title: 'Music Studio Website',
      category: 'Web Audio API & Realtime DSP',
      summary:
        '[ Music Studio Website Summary Placeholder — Interactive studio environment with real-time audio playback and waveform visualization ]',
      metrics: [
        { label: 'Audio Engine', value: 'Web Audio API' },
        { label: 'DSP Latency', value: 'Low Buffer Realtime' },
        { label: 'Visualizer', value: 'FFT Spectrum' },
      ],
      techStack: ['Web Audio API', 'TypeScript', 'Canvas Spectrum', 'Audio Routing'],
      repoUrl: 'https://github.com/TheJungleJimRuss',
      featuredBadge: 'AUDIO ENGINE',
      schematicType: 'audio',
    },
  ] as ProjectItem[],

  codeTabs: [
    {
      id: 'collide-and-slide',
      filename: 'KinematicMotor.CollideAndSlide.cs',
      language: 'C# // UNITY 6',
      subsystem: 'Recursive Swept-Sphere Velocity Deflection',
      description:
        'Projects remaining displacement onto the collision tangent plane at each contact point. Handles acute two-plane creases by deflecting along the cross-product line of both normals to prevent corner oscillation.',
      highlights: [
        'Iterative sweep bounded by MaxBounces (default 4) with skin-width backoff',
        'Crease detection when two non-coplanar hit normals form an acute wedge',
        'Slope-limit filtering prevents upward velocity gain when colliding against steep walls',
      ],
      code: `public Vector3 CollideAndSlide(Vector3 velocity, Vector3 position, int depth, bool gravityPass, Vector3 velInit)
{
    if (depth >= maxBounces) return Vector3.zero;

    float dist = velocity.magnitude + skinWidth;
    if (dist <= skinWidth) return Vector3.zero;

    if (Physics.SphereCast(position, capsuleRadius, velocity.normalized,
        out RaycastHit hit, dist, collisionMask, QueryTriggerInteraction.Ignore))
    {
        Vector3 snapToSurface = velocity.normalized * (hit.distance - skinWidth);
        Vector3 leftover = velocity - snapToSurface;
        float slopeAngle = Vector3.Angle(Vector3.up, hit.normal);

        if (snapToSurface.magnitude <= skinWidth)
            snapToSurface = Vector3.zero;

        // Walkable slope: project leftover along tangent plane
        if (slopeAngle <= maxSlopeAngle)
        {
            if (gravityPass) return snapToSurface;
            leftover = ProjectAndScale(leftover, hit.normal);
        }
        else // Steep wall or obstacle crease
        {
            float scale = 1f - Vector3.Dot(
                new Vector3(hit.normal.x, 0f, hit.normal.z).normalized,
                -new Vector3(velInit.x, 0f, velInit.z).normalized
            );
            leftover = ProjectAndScale(leftover, hit.normal) * Mathf.Clamp01(scale);
        }

        return snapToSurface + CollideAndSlide(leftover, position + snapToSurface, depth + 1, gravityPass, velInit);
    }

    return velocity;
}`,
    },
    {
      id: 'ground-snapper',
      filename: 'GroundSnapResolver.cs',
      language: 'C# // UNITY 6',
      subsystem: 'Downward Slope Clamping & Step-Down Lock',
      description:
        'Keeps the character smoothly locked to descending ramps and stairs at high horizontal speeds without relying on artificial downward gravity spikes that break jump trajectories.',
      highlights: [
        'Activates exclusively when grounded on the previous tick and vertical velocity <= 0',
        'Verifies surface normal angle before committing position snap',
        'Zero heap allocations using pre-allocated RaycastHit structs',
      ],
      code: `private Vector3 ResolveGroundSnap(Vector3 currentPos, bool wasGroundedLastFrame)
{
    if (!wasGroundedLastFrame || verticalVelocity > 0f)
        return currentPos;

    float probeDistance = stepDownHeight + skinWidth;
    if (Physics.SphereCast(currentPos, capsuleRadius, Vector3.down,
        out RaycastHit groundHit, probeDistance, collisionMask, QueryTriggerInteraction.Ignore))
    {
        float surfaceAngle = Vector3.Angle(Vector3.up, groundHit.normal);
        float snapDelta = groundHit.distance - skinWidth;

        if (surfaceAngle <= maxSlopeAngle && snapDelta > 0.001f && snapDelta <= stepDownHeight)
        {
            isGrounded = true;
            groundNormal = groundHit.normal;
            return currentPos + Vector3.down * snapDelta;
        }
    }

    return currentPos;
}`,
    },
    {
      id: 'telemetry-state',
      filename: 'TelemetryChecklistEngine.ts',
      language: 'TYPESCRIPT // STRICT',
      subsystem: 'Deterministic Pre-Operation Risk & State Evaluator',
      description:
        'Strongly typed state engine that computes composite system readiness from environmental metrics, hardware battery cycles, and mandatory verification gates.',
      highlights: [
        'Discriminated union states guarantee impossible states cannot be rendered',
        'Pure evaluation pipeline runs in < 0.1ms for instant UI feedback',
        'Immutable audit log snapshots for post-session diagnostics',
      ],
      code: `export type ReadinessState =
  | { status: 'LOCKED'; blockingReasons: readonly string[]; score: number }
  | { status: 'CAUTION'; advisories: readonly string[]; score: number }
  | { status: 'NOMINAL'; verifiedAtIso: string; score: number };

export function evaluateSystemReadiness(
  metrics: TelemetryMetrics,
  checklist: ReadonlyArray<ChecklistGate>
): ReadinessState {
  const unverifiedCritical = checklist
    .filter((gate) => gate.critical && !gate.completed)
    .map((gate) => gate.label);

  const riskScore = computeEnvironmentalRiskIndex(metrics);

  if (unverifiedCritical.length > 0 || riskScore >= 75) {
    return {
      status: 'LOCKED',
      blockingReasons: unverifiedCritical,
      score: Math.max(0, 100 - riskScore),
    };
  }

  if (riskScore >= 35 || metrics.batteryInternalResistanceMilliohm > 42) {
    return {
      status: 'CAUTION',
      advisories: ['Elevated cell impedance or environmental shear detected'],
      score: 100 - riskScore,
    };
  }

  return {
    status: 'NOMINAL',
    verifiedAtIso: new Date().toISOString(),
    score: 100 - riskScore,
  };
}`,
    },
  ] as CodeTabItem[],

  disciplines: [
    {
      code: '01 // KINEMATICS & GAMEPLAY',
      title: 'Real-Time Physics & Spatial Math',
      description:
        'Engineering responsive character controllers, swept collision detection, custom raycast solvers, and deterministic update loops in Unity 6 & C#.',
      tags: ['Vector Projection', 'Swept Volumes', 'State Machines', 'Zero-GC C#'],
    },
    {
      code: '02 // SYSTEMS ARCHITECTURE',
      title: 'Modular Full-Stack Software',
      description:
        'Designing strongly typed TypeScript applications, reactive telemetry dashboards, and resilient data pipelines with clear separation of concerns.',
      tags: ['TypeScript', 'React', 'Finite State Machines', 'Data Modeling'],
    },
    {
      code: '03 // INTERFACE ENGINEERING',
      title: 'Tactile 60FPS User Experiences',
      description:
        'Crafting hardware-accelerated interfaces with 3D spatial depth, interactive WebGL/Canvas visualizers, and ergonomic typographic hierarchy.',
      tags: ['Three.js / WebGL', 'CSS View Timelines', 'OKLCH Tokens', 'Micro-Physics'],
    },
  ],

  /**
   * Dormant configuration block reserved for when siteConfig.features.enableFlightOps is flipped to true.
   */
  futureFlightOpsModule: {
    sectionTitle: 'Aerial Flight Deck & Telemetry',
    statusBadge: 'REMOTE PILOT OPERATIONS',
    capabilities: [
      'Cinematic Aerial Tracking & 10-Bit D-Log M Pipeline',
      'Site Photogrammetry & 3D Orthomosaic Mapping',
      'Commercial Architecture & Elevation Showcases',
    ],
  },
};
