# Contours bottom-sheet invariants

This forked version adds serveral updates needed for Contours

# Publishing

Ensure you have an `.npmrc` file with credentials. GITHUB_TOKEN shoud lexport
from your .bashrc file

```
@gnative:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

1. Update package.json to use

```
{
  "name": "@gnative/react-native-bottom-sheet",
  "version": "PUBLISH_VERION",
  "publishConfig": {
      "registry": "https://npm.pkg.github.com"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/gnative/rnmapbox.git"
  },
}
```

2. `npm publish`

## Surface geometry at the visibility boundary

On iOS, `detentSpacing` defines the side and bottom spacing of the sheet's
visual surface at each detent. Ordinary transitions between visible detents
interpolate their spacing. Presentation and dismissal are different: a
zero-height detent is a visibility boundary, not a surface-styling endpoint.

When presenting the sheet, resolve the surface geometry from the initial
non-zero target index before the first visible animation frame. Keep that
geometry fixed while the complete sheet slides in. Do not animate from the
zero-height detent's spacing to the target spacing.

When dismissing to a zero-height detent, resolve the surface geometry from the
current non-zero source index. Keep that geometry fixed for the entire closing
animation while the complete sheet slides out. Do not interpolate toward the
zero-height detent's spacing or through the spacing of intermediate detents.

For example:

```tsx
detents={[0, 100, 200, 300]}
detentSpacing={[10, 30, 40, 50]}
```

- Initial presentation at index `1` uses spacing `30` from the first frame and
  keeps it while sliding to the 100-point detent.
- Opening from index `0` to index `3` uses spacing `50` throughout the opening
  animation.
- Closing from index `3` to index `0` uses spacing `50` throughout the entire
  closing animation. It must never transition through `40`, `30`, or `10`.
- An ordinary visible transition from index `1` to index `2` interpolates
  spacing from `30` to `40`.

The same visibility-boundary behavior applies to the surface corner radius:
presentation uses the target visible detent's geometry, and dismissal uses the
source visible detent's geometry.

Initial presentation begins from a synthetic off-screen position. It must retain
the target detent's geometry even when the configured detents do not include a
zero-height detent.

## Native geometry is authoritative

The native host is the source of truth for the sheet frame, detent cap, content
region inset, and live translation. Do not pre-clamp detents from JavaScript
using estimated window dimensions or safe-area values. Inline, portal, and
native-overlay sheets must all resolve against their actual native host and
window geometry.

The sheet container is a stable, full-host-height coordinate system rather than
a view sized to the tallest detent. A detent changes the container's
translation, not its coordinate base. This is important when content shrinks,
when a `'content'` detent is remeasured, and when a fullscreen detent extends
above the standard safe-area cap.

The visual `surface` is independent of content layout. It is mounted in a
native-owned, full-size host behind the content so a content resize cannot
expose an uncovered area. Surface spacing and masking must not inset, clip, or
recenter the content container. Surface elements should fill their provided
host, for example with `StyleSheet.absoluteFill`.

## Fullscreen detents and status-bar geometry

`'fullscreen'` is a distinct native detent kind. It resolves to the host height
minus `fullscreenTopOffset`; it is not merely a standard detent clamped to the
safe-area cap. Standard full-height detents remain capped below the status bar
unless `extendUnderStatusBar` is enabled.

The surface backing may extend above the sheet container while approaching a
fullscreen position so the area near the status bar stays covered. Keep that
extension synchronized with live drag and spring positions and bounded by the
screen top. Changes here must be checked on devices with and without a top safe
area, with custom `fullscreenTopOffset` values, and in inline and overlay
presentation modes.

## Dynamic detents and callback semantics

If the active detent's resolved height changes, keep the current index and
re-anchor or animate the sheet to the new height. A resulting snap is a real
settle operation and must fire `onSettle`, even though the index did not change.
Do not fire `onIndexChange` for this geometry-only movement.

The callback responsibilities are intentionally distinct:

- `onIndexChange` fires when a user drag commits to a detent. It is the signal
  used to update the controlled `index`; it does not fire for programmatic index
  changes.
- `onSettle` fires at the end of every completed snap, including user-driven,
  programmatic, initial, and dynamic-detent movements.
- `onPositionChange` reports the live native position and fractional detent
  index throughout dragging and settling.

When `animateContentHeight` is disabled, an active `'content'` detent follows
content-size changes immediately. The surface must still remain fully covered.

## Drag event lifecycle

`onDragStart` means the sheet's native pan recognizer has begun handling a drag;
it is not a raw touch-down event. Emit it once per accepted pan. `onDragEnd`
means native pan handling ended, was cancelled, or failed. Emit it once for each
emitted start, before any subsequent settle completes. Keep these events aligned
across iOS and Android and do not emit them for purely programmatic snaps.

## iOS navigation-transition stability

Transient transforms applied by navigation controllers must not continuously
alter the sheet's detent cap. Compute the sheet's window origin from the
untransformed ancestor layout where possible, falling back to UIKit conversion
only when necessary. Otherwise every navigation-animation frame can look like a
geometry change and cancel or restart an active sheet spring.

Do not assign `frame` to the transformed iOS sheet container. Lay it out with
`bounds` and a bottom-anchored `center`; `frame` is derived and unstable while a
transform is active.

## Package identity and publishing

This fork is published as `@gnative/react-native-bottom-sheet` through GitHub
Packages, not as the upstream `@swmansion` package on npmjs.org. Preserve the
scoped registry configuration and keep package builds in `prepack`. Git hooks
are installed explicitly through `hooks:install`; they are intentionally not a
required side effect of package preparation.

## Historical accessory work

The all-refs history contains Gnative-authored `accessories` branches with an
experimental native accessory view. That work is not merged into the current
branch, and the current public `BottomSheetProps` has no `accessory` API. Do not
describe accessories as supported or copy branch-specific assumptions into the
current implementation without an explicit porting task.

If accessory support is intentionally revived, its core design was a separate
native child that follows drag and settle positions without a JavaScript
follower, remains independently hittable above the sheet, and may clamp its
movement to configured minimum and maximum detent heights. Reconcile that old
design with the current native geometry and surface-mask architecture rather
than cherry-picking it blindly.

### Implementation locations

- `ios/BottomSheetHostingView.swift` primes initial surface geometry and chooses
  the non-zero geometry reference for opening and closing transitions. It also
  owns iOS detent resolution, fullscreen extension, callbacks, and stable
  navigation geometry.
- `ios/BottomSheetSurfaceMasking.swift` resolves synthetic closed-transition
  geometry and ordinary interpolation between visible detents.
- `android/src/main/java/com/swmansion/reactnativebottomsheet/BottomSheetHostView.kt`
  owns the equivalent Android detent, gesture, callback, and live-position
  behavior.
- `src/BottomSheet.tsx` defines the public callback contract and forwards raw
  detent specifications for native resolution.

`detentSpacing` and per-detent surface masking are currently implemented on iOS.
The Android prop setter is currently a no-op; do not claim cross-platform
support unless Android receives an equivalent implementation.

### Regression checks

When changing detents, snapping, masking, or initial layout, verify:

1. Initial presentation directly to every non-zero index.
2. Opening from a zero-height detent to every non-zero index.
3. Closing from every non-zero index to the zero-height detent.
4. Ordinary transitions between adjacent and non-adjacent visible detents.
5. Delayed initial `'content'` detents after their content becomes measurable.
6. Detent arrays with no zero-height detent.
7. Active content or detent height changes, including exactly one `onSettle`.
8. Gesture start/end pairing for ended, cancelled, and failed gestures.
9. Fullscreen and status-bar behavior in inline, portal, and native-overlay
   modes.
10. A sheet spring running during an iOS navigation transition.

The first rendered presentation frame must already use the target spacing, and
the last visible dismissal frame must still use the source spacing.

## Main-based port: inset behavior

On `contours-main-port`, upstream detent objects support `borderRadius`. Insets
retain upstream card clipping and gap hit testing, but content is laid out at
the full host width, at x=0, with scale 1 on iOS, Android and web. Content
detent heights and measurement metadata must also remain unscaled. Add explicit
child padding to keep text and controls clear of clipped edges. This shared card
clipping is a deliberate difference from the old surface-only mask invariant
above; the old masking architecture has not been ported yet. Other old Contours
features are not yet fully ported on this branch.

Per-detent `borderTopRadius` and `borderBottomRadius` override the uniform
`borderRadius`. Each pair interpolates independently; an omitted pair inherits
its matching `surfaceStyle` corners and zero keeps it square.

### Optional content scaling

`scaleContent` defaults to `true` to retain upstream inset scaling. Contours can
pass `scaleContent={false}` to keep full-host content coordinates and unscaled
height measurements, as described above. Both modes retain card clipping,
per-detent radius interpolation, shadows, and gap hit testing. The per-detent
corner-radius demo opts out of scaling and uses a contrasting background so its
corners and gaps are visible.

## Main-based fullscreen and safe-content behavior

`'fullscreen'` is a distinct native detent kind. It fills the actual native host
height, minus `fullscreenTopOffset` (default **0**, superseding the old fork's
22-point default). Standard detents still obey `topInset` and the status-bar
cap. Insets at the bottom shorten the card while keeping its configured top.

Content protection is separate: `contentTopInset="safeArea"` reads the overlap
of the actual window safe area with the host. A numeric value sets a
host-coordinate boundary directly. Both default to no protection unless
explicitly configured. The native content offset is
`max(0, boundary - sheetTop)`; the surface is never translated by it. Native
dragging and spring samples drive the content transform, without JS frame
callbacks or per-frame Yoga padding updates. The tallest content viewport
subtracts the protected area, including scaling in its measurement units.

`contentTopInsetOffset` is a signed adjustment to that boundary (default **0**).
For a 16-point handle inside the content wrapper, use:

```tsx
contentTopInset="safeArea"
contentTopInsetOffset={-16}
```

With a 59-point safe area, the wrapper stops at 43 and the content below its
16-point handle begins at 59. Boundaries are clamped inside the host. An inline
host that does not overlap the top safe area needs no extra offset. Use the
rendered handle height when content scaling is enabled.

The fullscreen demo covers inline, portal modal and window-overlay hosts, direct
opening, preview/fullscreen transitions, scrolling to the last row, optional
safe-area protection and handle adjustment. Device checks for rotation,
notched/non-notched devices and interrupted springs remain required.
