# Workspace Agent Rules: PortfolioSite

## 1. Copywriting & Prose Mandate (STRICT)
- **User-Authored Content**: NEVER draft, overwrite, or replace portfolio bios, project summaries, technical write-ups, or copy.
- The user writes all site copy, biography, and project text themselves.
- Maintain placeholder text markers (`[ ... ]`) and structural slots unless the user explicitly pastes copy to insert.

## 2. Tech Stack & Standards
- **Framework & Bundler**: Vite + TypeScript (strict mode) + Three.js for 3D graphics.
- **Testing**: Vitest (`npm test`).
- **Visual Palette (Dev Side)**: Clean phosphor green on deep black (color scheme only; NO falling glyphs or digital rain tropes). Avoid unrequested cyan/neon glow tropes.
- **Modern Web Practices**: Adhere to `modern-web-guidance` and avoid outdated DOM hacks.

## 3. Anti-One-Shot Mandate & Spec-Driven Development
- **Strict Anti-One-Shot Mandate**: NEVER jump directly into sprawling multi-component edits or unaligned feature work.
- **Skill Binding**: For any new system touching 2+ files or introducing architecture, you MUST activate and follow the `spec-driven-development` skill.
- **Stage 1 (White-Box & Wireframe)**: FIRST present an interface contract (TypeScript types/interfaces without bodies), wireframe outline, or Mermaid data flow diagram.
- **Stage 2 (Human Alignment Gate)**: Wait for unambiguous user confirmation ("Approved" or "Proceed") before editing project files.
- **Prohibition of Implicit Approval**: User constraint feedback or follow-up comments (e.g., *"remember to use placeholders"*, *"focus on styling"*) are strictly inputs to the proposal. They DO NOT constitute approval to edit project files.
- **Stage 3 (Micro-Batched Implementation)**: Slices strictly under 150 lines of code per turn.

## 4. Mandatory Test-Driven Development & Systematic Debugging
- **Skill Binding**: For all new algorithms, state transitions, or bug fixes, activate and follow the `red-green-refactor` skill.
- Always write a failing unit test first in Vitest (`npm test`), implement minimal passing logic, and refactor while confirming exit code 0.
- **Systematic Debugging**: When builds fail or tests break, activate the `scratchpad-debugger` skill before modifying code. Maintain `.agents/scratchpad.md` (or `~/.gemini/notes/PortfolioSite/scratchpad.md`).

## 5. Verification Protocol (MANDATORY)
Before declaring any task or feature complete:
1. Ensure TypeScript and Vite compile with zero errors: `npm run build` (`tsc && vite build`).
2. Run automated test suites: `npm test` (`vitest run`).
3. For visual UI or 3D canvas changes, verify rendering across viewport breakpoints via Chrome DevTools MCP.
4. **Mandatory Visual Confirmation**: Whenever visual capture tools are available (Chrome DevTools MCP screenshots, browser captures), agents MUST capture and present visual confirmation (embedding the screenshot/image or visual artifact) directly in the final report to the user. Never rely solely on textual assertions when visual proof can be provided.
5. Only report task completion if all checks pass cleanly with exit code 0.

## 6. Continuous Autonomous Execution ("Verify & Keep Working")
- **Deterministic Runtime Verification**: Never declare a bug fixed based on static file or property checks alone. Always execute dynamic verification (`npm test` / `npm run build` / browser inspection) that verifies exit code 0.
- **Visual Confirmation Delivery**: Whenever a task produces or modifies visual output (UI, 3D Canvas, layouts, CSS), capture and present visual confirmation directly to the user upon completion.
- **Test Fixture Safety**: Any temporary mocks or test files must be cleaned up properly.
- **Autonomous Continuation**: Once a bug or milestone is verified, DO NOT stop to ask the user to test what the agent can verify. Update `PROJECT_NOTES.md`, mark the milestone complete, and immediately continue working on the next active milestone until the feature goal is achieved or genuine human alignment is required.

## 7. Living Project Notes Protocol
- **Storage**: Maintain notes in `~/.gemini/notes/PortfolioSite/PROJECT_NOTES.md` and `.agents/PROJECT_NOTES.md`.
- **Automatic Read on Start**: At session start, read `PROJECT_NOTES.md` to ground in active milestones, architecture, and constraints.
- **Automatic Write on Progress**: Automatically record completed milestones, dated architectural decisions, and newly discovered quirks/gotchas into `PROJECT_NOTES.md`.
- **Rule**: Never leave project context purely in chat history; always anchor it into `PROJECT_NOTES.md`.

## 8. Ultra-Concise Responses & Targeted Explanations
- **Default Minimal Output**: Keep completion responses concise (1–3 short sentences stating what changed and was verified) whenever results can be directly inspected or tested by the user. Omit conversational fluff.
- **Explain Hard-to-Verify Logic**: Provide a focused explanation when changes involve internal logic, complex algorithms, subtle state/timing conditions, or background behavior that cannot be easily verified at a glance.
- **Disclose Unsolicited Changes**: Explicitly highlight and briefly justify any modifications, refactors, dependencies, or side effects that were not specifically requested by the user.
