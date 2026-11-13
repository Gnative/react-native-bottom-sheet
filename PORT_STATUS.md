# Contours port onto upstream main

Branch: `contours-main-port`, based on upstream 1.0.0 main (`33270c52`).

Implemented:

- Optional `borderRadius`, `borderTopRadius`, and `borderBottomRadius` on detent
  objects, interpolated independently between open detents; omitted radii
  inherit `surfaceStyle`. Zero is a square corner.
- `scaleContent` defaults to `true`, preserving upstream scaling. Set it to
  `false` to keep full-host content coordinates and clip inset edges instead.
  Add child padding to keep controls clear of clipping in that mode.
- Content-height resolution and measurement metadata follow the selected mode.
- Changes cover iOS, Android and web. Insets still clip content as upstream
  does; the older surface-only Contours masking architecture is not restored.
- Fork package identity and GitHub registry settings retained. Version
  `1.0.0-contours.0` is a development version; nothing has been published.

Example:

```tsx
scaleContent={false}
detents={[
  0,
  { value: 320, insets: { left: 16, right: 16, bottom: 32 }, borderTopRadius: 24, borderBottomRadius: 8 },
  { value: '100%', programmatic: true, borderRadius: 0 },
]}
```

Validation: library TypeScript and Bob build passed, changed JS/TS lint passed,
Fabric code generation passed for both platforms, Swift parse passed, and a
focused web runtime check covered unchanged transforms, unscaled heights, radius
interpolation and invalid radius rejection. Android regression tests were
updated, but the test run failed in example settings during Expo React Native
autolinking before compiling this library. Full native builds and device
verification remain outstanding.

This is the first implementation step. Fullscreen detents, gesture lifecycle
callbacks, navigation stability and dynamic-detent settle semantics from the old
Contours branch still need porting and verification. Do not switch the app or
publish this branch as a complete replacement yet.

Top/bottom overrides take precedence over `borderRadius`; omitted values inherit
the corresponding corners from `surfaceStyle`. Zero explicitly squares that
edge.
