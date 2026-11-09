# Unity WebGL Build Drop-In Directory

To embed your real **Unity 6 Kinematic Character Controller** WebGL export into the portfolio's interactive Testing Chamber:

1. In Unity, open **File > Build Profiles > Web (WebGL)**.
2. Set **Compression Format** to **Disabled** (or **Gzip/Brotli** if your static host serves `Content-Encoding` headers) and build into this folder (`public/unity-build/`).
3. Ensure your exported `index.html` (or `Build/` directory) lives at:
   `public/unity-build/index.html`
4. The Testing Chamber (`src/components/UnityChamber.ts`) automatically checks for `/unity-build/index.html`. While no Unity export is present, it runs a built-in interactive 3D/2.5D kinematic character controller simulation so visitors can test slope sliding, wall deflection, and live vector telemetry immediately!
