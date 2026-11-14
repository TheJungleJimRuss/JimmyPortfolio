# Outline trace draws the Desktop
Type: grilling
Status: resolved
Blocked by: 04, 08

## Question

The user has already decided (2026-11-12) that the Desktop's lines (window borders, icons, taskbar) are drawn by the terminal sequence, the same way the Outline trace draws the Hero name today. Still open: which lines get traced and in what order (Hero name first or together); whether the terminal's commands visibly "build" each part; how long the trace runs (today it's 1,800ms for the name); how the trace handles the arrival layout from 04 (Hero window in front, Projects File Explorer, Desktop icons, taskbar) and a deep-linked Project window; whether the Hero name is traced inside its Hero window; how the Boot shell (08) hands over to the trace (does the shell text clear, stay or fade); phone behaviour and the Layout lock. Already settled by 08: a second input skips to the trace, reduced motion shows the finished Desktop with no trace, and every visit plays it.

## Answer

Settled with the user, 2026-11-12:

- **Handover:** when the Boot shell's output finishes, the shell text fades out quickly and the Outline trace draws on clean black.
- **What is traced:** every line of the arrival layout: the Taskbar, Desktop icons, the Projects File Explorer (frame, title bar, sidebar, folder icons), the Hero window frame and title bar, and the Hero name's outline. Window text and labels fade in after their frame closes.
- **Order:** outside in, with the Hero last: Taskbar and Desktop icons, then the File Explorer, then the Hero window frame, then the Hero name, which closes and blooms as today (the bloom stays the climax).
- **Duration:** about 3s in total: about 1.2s for the OS parts, then the existing about-1.8s name trace (constant-speed `linear`, as today).
- **Input during the trace:** ignored, so the trace always plays out. (A second input during the Boot shell still skips the shell output and goes to the trace, per 08.)
- **Deep links:** the trace is identical for every arrival. A deep-linked Project window opens after the bloom, with the ordinary window-open motion.
- **Phones:** the trace draws the Taskbar, the full-screen Hero window frame and title bar, then the stacked Hero name and its bloom.
- **Layout lock:** extended to the whole Desktop. The layout chosen when the trace starts holds until the bloom, then the Desktop re-lays out once.
- **Already settled by 08:** reduced motion shows the finished Desktop with no trace, and every visit plays it.
