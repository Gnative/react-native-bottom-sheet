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

Navigation-transition stability and opening/closing geometry from the old
Contours branch still need verification/porting. Do not publish this branch as a
complete replacement before device regression testing.

Top/bottom overrides take precedence over `borderRadius`; omitted values inherit
the corresponding corners from `surfaceStyle`. Zero explicitly squares that
edge.

Dynamic-detent completion now emits `onSettle` for both animated and immediate
height changes without emitting `onIndexChange`. No-op layouts remain silent;
in-flight springs retain their pending completion. Focused web resolver tests
cover these paths; Android regression coverage was added but native execution
remains subject to the example build setup noted above.

Drag lifecycle callbacks are now wired through Fabric and both native hosts, and
supported by the web gesture controller. `onDragStart` reports an accepted pan,
not touch-down. `onDragEnd` pairs it on release/cancellation or reset, before
settling. Direct and nested Android drag paths share a guarded event pair. The
snap-callback demo logs both events. Seven focused web lifecycle tests pass;
Android direct-drag, cancellation, and nested-handoff tests were added but
native execution remains unverified.

Fullscreen detents now bypass the normal top cap. `fullscreenTopOffset` defaults
to 0. `contentTopInset="safeArea"` protects only content; the signed
`contentTopInsetOffset` can subtract handle height to align the area below it.
The content viewport and measurement metadata account for the live native
offset. The dedicated fullscreen demo supports inline/modal/window-overlay
presentation.

Fullscreen validation: the iOS simulator example build succeeded. Library and
fullscreen-demo typechecks, lint, Bob build, Fabric codegen and all 23 web tests
passed. Handle compensation is enabled by default in the demo and can be
toggled. Android verification requires Gradle dependencies not present in the
offline cache. Visual device checks remain outstanding, including scrolling,
rotation and presentation/dismissal transitions.
