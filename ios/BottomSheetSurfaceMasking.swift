import UIKit

enum SurfaceGeometryMode {
  case inactive
  case live(spacing: CGFloat, cornerRadius: CGFloat)
  case syntheticClosed(reference: SurfaceGeometryReference)
}

struct SurfaceGeometryReference {
  let height: CGFloat
  let spacing: CGFloat
  let cornerRadius: CGFloat
}

struct SurfaceGeometryTransition {
  let sourceHeight: CGFloat
  let targetHeight: CGFloat
  let sourceSpacing: CGFloat
  let targetSpacing: CGFloat
  let sourceCornerRadius: CGFloat
  let targetCornerRadius: CGFloat
}

struct SurfacePanResumeTransition {
  let transition: SurfaceGeometryTransition
  let currentHeight: CGFloat
  let progress: CGFloat
}

struct SurfaceMaskGeometry {
  let isActive: Bool
  let spacing: CGFloat
  let cornerRadius: CGFloat
  let clipFrame: CGRect
  let viewportBounds: CGRect
  let maskPath: CGPath
  let shadowPath: CGPath
}

struct SurfaceGeometryContext {
  let bounds: CGRect
  let sheetContainerHeight: CGFloat
  let translationY: CGFloat
  let surfaceExtensionHeight: CGFloat
  let detentHeights: [CGFloat]
  let detentSpacings: [CGFloat]
  let detentCornerRadii: [CGFloat]
  let displayCornerRadius: CGFloat
  let forcePath: Bool
  let isClosedTransitionGeometryActive: Bool
  let closedTransitionGeometryIndex: Int?
  let targetIndex: Int
  let activeSpringTargetIndex: Int?
  let activeSpringSurfaceTransition: SurfaceGeometryTransition?
  let activeSpringProgress: CGFloat?
  let activePanResumeTransition: SurfacePanResumeTransition?
  let isPanning: Bool
}

struct SurfaceGeometryResolver {
  let context: SurfaceGeometryContext

  func resolve() -> SurfaceMaskGeometry {
    let mode = geometryMode()
    var clipFrame: CGRect
    let resolvedSpacing: CGFloat
    let resolvedCornerRadius: CGFloat

    switch mode {
    case .inactive:
      clipFrame = context.bounds
      resolvedSpacing = 0
      resolvedCornerRadius = 0
    case let .live(spacing, cornerRadius):
      clipFrame = visibleSheetFrame(forTranslationY: context.translationY, spacing: spacing)
      resolvedSpacing = spacing
      resolvedCornerRadius = cornerRadius
    case let .syntheticClosed(reference):
      clipFrame = closedTransitionMaskFrame(
        forTranslationY: context.translationY,
        reference: reference
      )
      resolvedSpacing = reference.spacing
      resolvedCornerRadius = reference.cornerRadius
    }
    clipFrame = extendedClipFrame(clipFrame)

    let viewportBounds = CGRect(origin: .zero, size: clipFrame.size)
    let safeViewportBounds = CGRect(
      origin: .zero,
      size: CGSize(
        width: max(1, viewportBounds.width),
        height: max(1, viewportBounds.height)
      )
    )
    let edgeInset = max(0, min(clipFrame.minX, context.bounds.height - clipFrame.maxY))
    let bottomRadius = min(
      max(0, context.displayCornerRadius - edgeInset),
      safeViewportBounds.width / 2,
      safeViewportBounds.height / 2
    )
    let topRadius = min(
      max(0, resolvedCornerRadius),
      bottomRadius,
      safeViewportBounds.width / 2,
      safeViewportBounds.height / 2
    )
    let maskPath = Self.roundedSurfacePath(
      in: safeViewportBounds,
      topRadius: topRadius,
      bottomRadius: bottomRadius
    )
    let shadowPath = Self.roundedSurfacePath(
      in: clipFrame,
      topRadius: topRadius,
      bottomRadius: bottomRadius
    )

    let isActive: Bool
    switch mode {
    case .inactive:
      isActive = false
    case .live, .syntheticClosed:
      isActive = true
    }

    return SurfaceMaskGeometry(
      isActive: isActive,
      spacing: resolvedSpacing,
      cornerRadius: resolvedCornerRadius,
      clipFrame: clipFrame,
      viewportBounds: safeViewportBounds,
      maskPath: maskPath,
      shadowPath: shadowPath
    )
  }

  private func geometryMode() -> SurfaceGeometryMode {
    let isMaskingActive =
      !context.detentSpacings.isEmpty || !context.detentCornerRadii.isEmpty || context.forcePath
    guard isMaskingActive else {
      return .inactive
    }

    let sheetHeight = context.sheetContainerHeight - context.translationY
    if
      let reference = closedTransitionReference(),
      sheetHeight < reference.height
    {
      return .syntheticClosed(reference: reference)
    }

    return .live(
      spacing: resolvedLiveSpacing(forSheetHeight: sheetHeight),
      cornerRadius: resolvedLiveCornerRadius(forSheetHeight: sheetHeight)
    )
  }

  private func closedTransitionReference() -> SurfaceGeometryReference? {
    guard context.isClosedTransitionGeometryActive else {
      return nil
    }
    guard context.detentHeights.indices.contains(0), context.detentHeights[0] == 0 else {
      return nil
    }

    let candidateIndices = [
      context.closedTransitionGeometryIndex,
      context.activeSpringTargetIndex,
      context.targetIndex,
    ].compactMap { $0 }

    for index in candidateIndices
    where context.detentHeights.indices.contains(index) && context.detentHeights[index] > 0.001 {
      return SurfaceGeometryReference(
        height: context.detentHeights[index],
        spacing: detentSpacing(at: index),
        cornerRadius: detentCornerRadius(at: index)
      )
    }

    return nil
  }

  private func resolvedLiveSpacing(forSheetHeight sheetHeight: CGFloat) -> CGFloat {
    panResumeSpacing(forSheetHeight: sheetHeight)
      ?? springTransitionSpacing(forSheetHeight: sheetHeight)
      ?? interpolatedDetentSpacing(forSheetHeight: sheetHeight)
  }

  private func resolvedLiveCornerRadius(forSheetHeight sheetHeight: CGFloat) -> CGFloat {
    panResumeCornerRadius(forSheetHeight: sheetHeight)
      ?? springTransitionCornerRadius(forSheetHeight: sheetHeight)
      ?? interpolatedDetentCornerRadius(forSheetHeight: sheetHeight)
  }

  private func panResumeSpacing(forSheetHeight sheetHeight: CGFloat) -> CGFloat? {
    guard context.isPanning, let resume = context.activePanResumeTransition else { return nil }
    let normal = interpolatedDetentSpacing(forSheetHeight: sheetHeight)
    let t = min(max(resume.progress, 0), 1)
    return resume.transition.sourceSpacing
      + (normal - resume.transition.sourceSpacing) * t
  }

  private func panResumeCornerRadius(forSheetHeight sheetHeight: CGFloat) -> CGFloat? {
    guard context.isPanning, let resume = context.activePanResumeTransition else { return nil }
    let normal = interpolatedDetentCornerRadius(forSheetHeight: sheetHeight)
    let t = min(max(resume.progress, 0), 1)
    return resume.transition.sourceCornerRadius
      + (normal - resume.transition.sourceCornerRadius) * t
  }

  private func springTransitionSpacing(forSheetHeight sheetHeight: CGFloat) -> CGFloat? {
    guard
      !context.isPanning,
      let transition = context.activeSpringSurfaceTransition
    else {
      return nil
    }

    let span = transition.targetHeight - transition.sourceHeight
    let t = context.activeSpringProgress
      ?? (abs(span) > 0.001 ? (sheetHeight - transition.sourceHeight) / span : 0)
    let clampedT = min(max(t, 0), 1)
    return transition.sourceSpacing
      + (transition.targetSpacing - transition.sourceSpacing) * clampedT
  }

  private func springTransitionCornerRadius(forSheetHeight sheetHeight: CGFloat) -> CGFloat? {
    guard
      !context.isPanning,
      let transition = context.activeSpringSurfaceTransition
    else {
      return nil
    }

    let span = transition.targetHeight - transition.sourceHeight
    let t = context.activeSpringProgress
      ?? (abs(span) > 0.001 ? (sheetHeight - transition.sourceHeight) / span : 0)
    let clampedT = min(max(t, 0), 1)
    return transition.sourceCornerRadius
      + (transition.targetCornerRadius - transition.sourceCornerRadius) * clampedT
  }

  private func interpolatedDetentSpacing(forSheetHeight sheetHeight: CGFloat) -> CGFloat {
    guard !context.detentSpacings.isEmpty, !context.detentHeights.isEmpty else { return 0 }
    let values = context.detentHeights.indices.map { detentSpacing(at: $0) }
    return max(0, interpolate(forPosition: sheetHeight, values: values))
  }

  private func interpolatedDetentCornerRadius(forSheetHeight sheetHeight: CGFloat) -> CGFloat {
    guard !context.detentHeights.isEmpty else { return 0 }
    let values = context.detentHeights.indices.map { detentCornerRadius(at: $0) }
    return max(0, interpolate(forPosition: sheetHeight, values: values))
  }

  private func detentSpacing(at index: Int) -> CGFloat {
    guard context.detentSpacings.indices.contains(index) else { return 0 }
    return max(0, context.detentSpacings[index])
  }

  private func detentCornerRadius(at index: Int) -> CGFloat {
    guard context.detentCornerRadii.indices.contains(index) else {
      return detentSpacing(at: index)
    }
    let radius = context.detentCornerRadii[index]
    return radius >= 0 ? radius : detentSpacing(at: index)
  }

  private func clippingFrame(forTranslationY translationY: CGFloat, spacing: CGFloat) -> CGRect {
    let rootBounds = context.bounds
    guard rootBounds.width > 0, rootBounds.height > 0 else { return .zero }
    guard spacing > 0.001 else { return rootBounds }

    let inset = min(spacing, rootBounds.width / 2)
    let bottom = rootBounds.height - inset
    let height = max(0, bottom - translationY)
    return CGRect(
      x: inset,
      y: translationY,
      width: max(0, rootBounds.width - inset * 2),
      height: height
    )
  }

  private func visibleSheetFrame(forTranslationY translationY: CGFloat, spacing: CGFloat) -> CGRect {
    let rootBounds = context.bounds
    guard rootBounds.width > 0, rootBounds.height > 0 else { return .zero }
    if spacing > 0.001 {
      return clippingFrame(forTranslationY: translationY, spacing: spacing)
    }
    return CGRect(
      x: 0,
      y: translationY,
      width: rootBounds.width,
      height: max(0, rootBounds.height - translationY)
    )
  }

  private func extendedClipFrame(_ frame: CGRect) -> CGRect {
    let extensionHeight = max(0, context.surfaceExtensionHeight)
    guard extensionHeight > 0.001, !frame.isEmpty else { return frame }
    let minY = max(0, frame.minY - extensionHeight)
    return CGRect(
      x: frame.minX,
      y: minY,
      width: frame.width,
      height: max(0, frame.maxY - minY)
    )
  }

  private func closedTransitionMaskFrame(
    forTranslationY translationY: CGFloat,
    reference: SurfaceGeometryReference
  ) -> CGRect {
    let rootBounds = context.bounds
    let inset = min(reference.spacing, rootBounds.width / 2)
    let referenceTranslationY = max(0, context.sheetContainerHeight - reference.height)
    let referenceClipFrame = clippingFrame(
      forTranslationY: referenceTranslationY,
      spacing: reference.spacing
    )
    return CGRect(
      x: inset,
      y: translationY,
      width: max(0, referenceClipFrame.width),
      height: max(1, referenceClipFrame.height)
    )
  }

  private func interpolate(forPosition position: CGFloat, values: [CGFloat]) -> CGFloat {
    let pairs = zip(context.detentHeights, values)
      .map { (height: $0, value: $1) }
      .sorted { $0.height < $1.height }

    guard let first = pairs.first, let last = pairs.last else { return 0 }
    if position <= first.height { return first.value }
    if position >= last.height { return last.value }

    for i in 1 ..< pairs.count where position <= pairs[i].height {
      let lower = pairs[i - 1]
      let upper = pairs[i]
      let span = upper.height - lower.height
      let t = span <= 0 ? 1 : (position - lower.height) / span
      return lower.value + (upper.value - lower.value) * t
    }
    return last.value
  }

  private static func roundedSurfacePath(
    in rect: CGRect,
    topRadius: CGFloat,
    bottomRadius: CGFloat
  ) -> CGPath {
    let top = max(0, topRadius)
    let bottom = max(0, bottomRadius)
    let path = UIBezierPath()
    path.move(to: CGPoint(x: rect.minX + top, y: rect.minY))
    path.addLine(to: CGPoint(x: rect.maxX - top, y: rect.minY))
    path.addArc(
      withCenter: CGPoint(x: rect.maxX - top, y: rect.minY + top),
      radius: top,
      startAngle: -.pi / 2,
      endAngle: 0,
      clockwise: true
    )
    path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - bottom))
    path.addArc(
      withCenter: CGPoint(x: rect.maxX - bottom, y: rect.maxY - bottom),
      radius: bottom,
      startAngle: 0,
      endAngle: .pi / 2,
      clockwise: true
    )
    path.addLine(to: CGPoint(x: rect.minX + bottom, y: rect.maxY))
    path.addArc(
      withCenter: CGPoint(x: rect.minX + bottom, y: rect.maxY - bottom),
      radius: bottom,
      startAngle: .pi / 2,
      endAngle: .pi,
      clockwise: true
    )
    path.addLine(to: CGPoint(x: rect.minX, y: rect.minY + top))
    path.addArc(
      withCenter: CGPoint(x: rect.minX + top, y: rect.minY + top),
      radius: top,
      startAngle: .pi,
      endAngle: -.pi / 2,
      clockwise: true
    )
    path.close()
    return path.cgPath
  }
}

final class SurfaceMaskRenderer {
  private(set) var maskLayer: CAShapeLayer?
  private(set) var shadowLayer: CAShapeLayer?
  private weak var resolvedShadowSourceLayer: CALayer?
  private var didResolveShadowSourceLayer = false

  func reset(viewportLayer: CALayer) {
    viewportLayer.mask = nil
    maskLayer = nil
    shadowLayer?.removeFromSuperlayer()
    shadowLayer = nil
    resolvedShadowSourceLayer = nil
    didResolveShadowSourceLayer = false
  }

  func apply(
    geometry: SurfaceMaskGeometry,
    viewportLayer: CALayer,
    hostLayer: CALayer,
    shadowBelowLayer: CALayer,
    hostBounds: CGRect,
    shadowSource: CALayer?
  ) {
    guard geometry.isActive else {
      reset(viewportLayer: viewportLayer)
      return
    }

    let mask = ensureMaskLayer(in: viewportLayer)
    mask.frame = geometry.viewportBounds
    mask.path = geometry.maskPath

    updateShadow(
      path: geometry.shadowPath,
      hostLayer: hostLayer,
      shadowBelowLayer: shadowBelowLayer,
      hostBounds: hostBounds,
      source: shadowSource
    )
  }

  func prepareForAnimation(
    geometry: SurfaceMaskGeometry,
    viewportLayer: CALayer,
    hostLayer: CALayer,
    shadowBelowLayer: CALayer,
    hostBounds: CGRect,
    shadowSource: CALayer?
  ) {
    apply(
      geometry: geometry,
      viewportLayer: viewportLayer,
      hostLayer: hostLayer,
      shadowBelowLayer: shadowBelowLayer,
      hostBounds: hostBounds,
      shadowSource: shadowSource
    )
  }

  func removeAnimations(
    maskKeys: [String],
    shadowKeys: [String]
  ) {
    for key in maskKeys {
      maskLayer?.removeAnimation(forKey: key)
    }
    for key in shadowKeys {
      shadowLayer?.removeAnimation(forKey: key)
    }
  }

  private func ensureMaskLayer(in viewportLayer: CALayer) -> CAShapeLayer {
    if let maskLayer {
      return maskLayer
    }
    let mask = CAShapeLayer()
    maskLayer = mask
    viewportLayer.mask = mask
    return mask
  }

  private func updateShadow(
    path: CGPath,
    hostLayer: CALayer,
    shadowBelowLayer: CALayer,
    hostBounds: CGRect,
    source sourceLayer: CALayer?
  ) {
    guard let sourceLayer else {
      shadowLayer?.removeFromSuperlayer()
      shadowLayer = nil
      resolvedShadowSourceLayer = nil
      didResolveShadowSourceLayer = false
      return
    }
    if !didResolveShadowSourceLayer {
      resolvedShadowSourceLayer = firstShadowLayer(in: sourceLayer)
      didResolveShadowSourceLayer = true
    }
    guard let source = resolvedShadowSourceLayer else {
      shadowLayer?.removeFromSuperlayer()
      shadowLayer = nil
      return
    }
    let shadow = shadowLayer ?? CAShapeLayer()
    shadow.frame = hostBounds
    shadow.path = path
    shadow.fillColor = UIColor.black.withAlphaComponent(0.001).cgColor
    shadow.shadowColor = source.shadowColor
    shadow.shadowOpacity = source.shadowOpacity
    shadow.shadowRadius = source.shadowRadius
    shadow.shadowOffset = source.shadowOffset
    shadow.shadowPath = path
    shadow.zPosition = -2
    if shadowLayer == nil {
      shadowLayer = shadow
      hostLayer.insertSublayer(shadow, below: shadowBelowLayer)
    }
  }

  private func firstShadowLayer(in layer: CALayer) -> CALayer? {
    if layer.shadowOpacity > 0 { return layer }
    for child in layer.sublayers ?? [] {
      if let shadow = firstShadowLayer(in: child) { return shadow }
    }
    return nil
  }
}

final class SurfaceMaskController {
  private let renderer = SurfaceMaskRenderer()

  private let viewportPositionAnimationKey = "bottomSheetViewportPosition"
  private let viewportBoundsAnimationKey = "bottomSheetViewportBounds"
  private let sheetPositionAnimationKey = "bottomSheetSheetPosition"
  private let maskPositionAnimationKey = "bottomSheetMaskPosition"
  private let maskBoundsAnimationKey = "bottomSheetMaskBounds"
  private let maskPathAnimationKey = "bottomSheetMaskPath"
  private let shadowPathAnimationKey = "bottomSheetShadowPath"
  private let shadowShapeAnimationKey = "bottomSheetShadowShape"

  func resolveGeometry(context: SurfaceGeometryContext) -> SurfaceMaskGeometry {
    SurfaceGeometryResolver(context: context).resolve()
  }

  func reset(viewportLayer: CALayer) {
    renderer.reset(viewportLayer: viewportLayer)
  }

  func applyLayout(
    context: SurfaceGeometryContext,
    extensionHeight: CGFloat,
    clippingViewport: UIView,
    sheetContainer: UIView,
    surfaceHost: UIView,
    surfaceView: UIView?,
    hostLayer: CALayer,
    shadowBelowLayer: CALayer,
    shadowSource: CALayer?
  ) {
    let geometry = resolveGeometry(context: context)
    let clipFrame = geometry.clipFrame

    CATransaction.begin()
    CATransaction.setDisableActions(true)
    clippingViewport.frame = clipFrame
    sheetContainer.bounds = CGRect(
      x: 0,
      y: 0,
      width: context.bounds.width,
      height: context.sheetContainerHeight
    )
    sheetContainer.center = sheetCenter(in: clipFrame, bounds: context.bounds, sheetContainerHeight: context.sheetContainerHeight)

    let sheetBounds = sheetContainer.bounds
    surfaceHost.frame = CGRect(
      x: 0,
      y: -extensionHeight,
      width: sheetBounds.width,
      height: sheetBounds.height + extensionHeight
    )
    surfaceView?.frame = surfaceHost.bounds
    renderer.apply(
      geometry: geometry,
      viewportLayer: clippingViewport.layer,
      hostLayer: hostLayer,
      shadowBelowLayer: shadowBelowLayer,
      hostBounds: context.bounds,
      shadowSource: shadowSource
    )
    CATransaction.commit()
  }

  func animate(
    spring: CriticalSpring,
    sampleCount: Int,
    beginTime: CFTimeInterval,
    geometries: [SurfaceMaskGeometry],
    clippingViewportLayer: CALayer,
    sheetContainerLayer: CALayer,
    hostLayer: CALayer,
    shadowBelowLayer: CALayer,
    hostBounds: CGRect,
    sheetCenterProvider: (CGRect) -> CGPoint,
    shadowSource: CALayer?
  ) {
    guard !geometries.isEmpty else { return }

    let keyTimes = (0 ... sampleCount).map {
      NSNumber(value: Double($0) / Double(sampleCount))
    }
    let viewportPositions = geometries.map {
      NSValue(cgPoint: CGPoint(x: $0.clipFrame.midX, y: $0.clipFrame.midY))
    }
    let viewportBoundsValues = geometries.map {
      NSValue(cgRect: $0.viewportBounds)
    }
    let sheetPositions = geometries.map {
      NSValue(cgPoint: sheetCenterProvider($0.clipFrame))
    }
    let maskPositions = geometries.map {
      NSValue(cgPoint: CGPoint(x: $0.viewportBounds.midX, y: $0.viewportBounds.midY))
    }
    let maskBoundsValues = geometries.map {
      NSValue(cgRect: $0.viewportBounds)
    }
    let maskPaths = geometries.map(\.maskPath)
    let shadowPaths = geometries.map(\.shadowPath)

    if let firstGeometry = geometries.first {
      renderer.apply(
        geometry: firstGeometry,
        viewportLayer: clippingViewportLayer,
        hostLayer: hostLayer,
        shadowBelowLayer: shadowBelowLayer,
        hostBounds: hostBounds,
        shadowSource: shadowSource
      )
    }
    guard let mask = renderer.maskLayer else { return }

    addKeyframeAnimation(
      to: clippingViewportLayer,
      keyPath: "position",
      values: viewportPositions.map { $0 as Any },
      keyTimes: keyTimes,
      duration: spring.duration,
      beginTime: beginTime,
      key: viewportPositionAnimationKey
    )
    addKeyframeAnimation(
      to: clippingViewportLayer,
      keyPath: "bounds",
      values: viewportBoundsValues.map { $0 as Any },
      keyTimes: keyTimes,
      duration: spring.duration,
      beginTime: beginTime,
      key: viewportBoundsAnimationKey
    )
    addKeyframeAnimation(
      to: sheetContainerLayer,
      keyPath: "position",
      values: sheetPositions.map { $0 as Any },
      keyTimes: keyTimes,
      duration: spring.duration,
      beginTime: beginTime,
      key: sheetPositionAnimationKey
    )
    addKeyframeAnimation(
      to: mask,
      keyPath: "position",
      values: maskPositions.map { $0 as Any },
      keyTimes: keyTimes,
      duration: spring.duration,
      beginTime: beginTime,
      key: maskPositionAnimationKey
    )
    addKeyframeAnimation(
      to: mask,
      keyPath: "bounds",
      values: maskBoundsValues.map { $0 as Any },
      keyTimes: keyTimes,
      duration: spring.duration,
      beginTime: beginTime,
      key: maskBoundsAnimationKey
    )
    addKeyframeAnimation(
      to: mask,
      keyPath: "path",
      values: maskPaths.map { $0 as Any },
      keyTimes: keyTimes,
      duration: spring.duration,
      beginTime: beginTime,
      key: maskPathAnimationKey
    )

    if let shadow = renderer.shadowLayer {
      addKeyframeAnimation(
        to: shadow,
        keyPath: "path",
        values: shadowPaths.map { $0 as Any },
        keyTimes: keyTimes,
        duration: spring.duration,
        beginTime: beginTime,
        key: shadowShapeAnimationKey
      )
      addKeyframeAnimation(
        to: shadow,
        keyPath: "shadowPath",
        values: shadowPaths.map { $0 as Any },
        keyTimes: keyTimes,
        duration: spring.duration,
        beginTime: beginTime,
        key: shadowPathAnimationKey
      )
    }
  }

  func removeAnimations(
    sheetContainerLayer: CALayer,
    clippingViewportLayer: CALayer,
    springAnimationKey: String
  ) {
    sheetContainerLayer.removeAnimation(forKey: springAnimationKey)
    sheetContainerLayer.removeAnimation(forKey: sheetPositionAnimationKey)
    clippingViewportLayer.removeAnimation(forKey: viewportPositionAnimationKey)
    clippingViewportLayer.removeAnimation(forKey: viewportBoundsAnimationKey)
    renderer.removeAnimations(
      maskKeys: [
        maskPositionAnimationKey,
        maskBoundsAnimationKey,
        maskPathAnimationKey,
      ],
      shadowKeys: [
        shadowPathAnimationKey,
        shadowShapeAnimationKey,
      ]
    )
  }

  var hasMaskLayer: Bool {
    renderer.maskLayer != nil
  }

  private func addKeyframeAnimation(
    to layer: CALayer,
    keyPath: String,
    values: [Any],
    keyTimes: [NSNumber],
    duration: CFTimeInterval,
    beginTime: CFTimeInterval,
    key: String
  ) {
    let animation = CAKeyframeAnimation(keyPath: keyPath)
    animation.values = values
    animation.keyTimes = keyTimes
    animation.duration = duration
    animation.beginTime = layer.convertTime(beginTime, from: nil)
    animation.calculationMode = .linear
    animation.isRemovedOnCompletion = false
    animation.fillMode = .forwards
    layer.add(animation, forKey: key)
  }

  private func sheetCenter(
    in clipFrame: CGRect,
    bounds: CGRect,
    sheetContainerHeight: CGFloat
  ) -> CGPoint {
    CGPoint(
      x: -clipFrame.minX + bounds.width / 2,
      y: -clipFrame.minY + sheetContainerHeight / 2
    )
  }
}
