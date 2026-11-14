# Load and performance budget
Type: grilling
Status: resolved
Blocked by: 05

## Question

With click-to-load stages decided (05), what are the hard budgets for the finished Dev portfolio: first-load weight of the Desktop before any stage loads (JS, CSS, fonts, Three.js hero), the KCC Unity build's size limit and compression (Brotli/gzip, and what to do where the host can't send `Content-Encoding`), how many live stages may run at once (and what happens past that limit), and memory/frame-rate targets on phones?

## Answer

Settled with the user, 2026-11-13:

- **Live stages:** at most 1 at a time. Focusing or loading another stage unloads the previous one back to its poster.
- **First load:** Desktop JS at most 350 KB gzip before any stage loads (Three.js tree-shaken and code-split); enforced as a build check.
- **KCC build:** at most 15 MB Brotli. Where the host can't send `Content-Encoding`, no Decompression Fallback: the stage uses the gameplay video instead.
- **Phones:** memory and frame-rate targets follow from the above (no Unity on phones, one live stage); no further numeric targets set.

