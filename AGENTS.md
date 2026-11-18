# PortfolioSite — project rules (global rules live in ~/.claude/CLAUDE.md)

## Copywriting & prose (STRICT)
- NEVER draft, overwrite, or replace portfolio bios, project summaries, technical write-ups, or copy. The user writes all site copy, biography, and project text themselves.
- Keep placeholder markers (`[ ... ]`) and structural slots unless the user explicitly pastes copy to insert.

## Stack & standards
- Vite + TypeScript (strict mode) + Three.js for 3D graphics; Vitest for tests.
- Dev-side palette: clean phosphor green on deep black (color scheme only; NO falling glyphs or digital rain tropes). Avoid unrequested cyan/neon glow tropes.
- Follow `modern-web-guidance`; avoid outdated DOM hacks.
- Specs for this project: TypeScript interfaces without bodies, a wireframe outline, or a Mermaid data flow diagram.

## Verification
1. `npm run build` (`tsc && vite build`) with zero errors.
2. `npm test` (`vitest run`) passes.
3. For visual UI or 3D canvas changes, check rendering across viewport breakpoints in a browser and include screenshots.
4. Clean up any temporary mocks or test files.
