# 08: Dev content layout on phones

**What to build:** On phones the Dev portfolio's project cards sit in one column with thumbnails sized for the screen, and the demo viewport no longer forces a 420px minimum height. Card hover effects only appear on hover-capable devices, so taps don't leave cards stuck. Tablets use their extra width without just stretching the phone layout.

**Blocked by:** 01 (Delete unused components and dead layout CSS)

**Status:** ready-for-agent

- [ ] Project grid is single column on phones and keeps the existing collapse breakpoint on tablets; thumbnail height tuned for phones
- [ ] Demo viewport minimum height relaxed on small viewports; aspect ratio kept
- [ ] Card hover styles gated to hover-capable devices; no stuck hover after tap
- [ ] Desktop layout unchanged
- [ ] No copy or placeholder changes
- [ ] `npm run build` exits 0 and `npm test` passes
- [ ] Browser check at 375, 768 and 1024 widths (portrait and landscape): no horizontal overflow, zero console errors, screenshots attached
