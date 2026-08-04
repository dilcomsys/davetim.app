# Visual testing

## Interactive playground

Run:

```bash
npm run playground
```

This opens `playground/davetim-design-playground.html`, a dependency-free design explorer containing:

- landing hero, mobile home, template grid, and rewarded-ad disclosure previews;
- 375, 768, 1024, and 1440 pixel viewport presets;
- brand color, radius, density, motion, and grid controls;
- live horizontal-overflow, minimum 44 pixel touch-target, and WCAG contrast checks;
- a four-viewport test matrix;
- a natural-language implementation prompt that includes only changed design decisions.

The playground is a review and calibration tool. Passing its lightweight checks does not replace screenshots from the real React/React Native applications or testing on physical devices.

## Landing motion

The landing uses Framer Motion for a small set of intentional transitions:

- hero copy entrance;
- phone preview entrance;
- feature-card viewport reveal;
- rewarded-ad model visual reveal.

Every motion call respects `useReducedMotion`; CSS also retains a `prefers-reduced-motion` fallback.
