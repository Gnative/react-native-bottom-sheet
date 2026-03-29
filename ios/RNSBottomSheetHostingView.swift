import UIKit

@objc public protocol RNSBottomSheetHostingViewDelegate: AnyObject {
  func bottomSheetHostingView(_ view: RNSBottomSheetHostingView, didChangeIndex index: Int)
  func bottomSheetHostingView(_ view: RNSBottomSheetHostingView, didChangePosition position: CGFloat)
}

private struct DetentSpec {
  let height: CGFloat
  let programmatic: Bool
}

@objcMembers
public final class RNSBottomSheetHostingView: UIView {
  public weak var eventDelegate: RNSBottomSheetHostingViewDelegate?

  private var detentSpecs: [DetentSpec] = [] {
    didSet { setNeedsLayout() }
  }

  private var targetIndex: Int = 0
  public var animateIn: Bool = true

  public let sheetContainer = UIView()
  private var panGesture: UIPanGestureRecognizer!
  private var activeAnimator: UIViewPropertyAnimator?
  private var displayLink: CADisplayLink?
  private var pendingIndex: Int?
  private var hasLaidOut = false
  private var isPanning = false
  private var isContentInteractionDisabled = false

  public override init(frame: CGRect) {
    super.init(frame: frame)
    backgroundColor = .clear
    clipsToBounds = false

    sheetContainer.backgroundColor = .clear
    sheetContainer.clipsToBounds = false
    addSubview(sheetContainer)

    panGesture = UIPanGestureRecognizer(target: self, action: #selector(handlePan(_:)))
    panGesture.delegate = self
    panGesture.cancelsTouchesInView = true
    panGesture.delaysTouchesBegan = true
    panGesture.delaysTouchesEnded = false
    sheetContainer.addGestureRecognizer(panGesture)
  }

  public required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  private weak var surfaceTouchHandler: UIGestureRecognizer?

  public override func didMoveToWindow() {
    super.didMoveToWindow()
    surfaceTouchHandler = nil
    guard window != nil else { return }
    var current: UIView? = superview
    while let view = current {
      for gr in view.gestureRecognizers ?? [] {
        if NSStringFromClass(type(of: gr)).contains("TouchHandler") {
          surfaceTouchHandler = gr
          return
        }
      }
      current = view.superview
    }
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    guard bounds.width > 0, bounds.height > 0 else { return }

    let maxHeight = detentSpecs.last?.height ?? bounds.height
    sheetContainer.bounds = CGRect(x: 0, y: 0, width: bounds.width, height: maxHeight)
    sheetContainer.center = CGPoint(x: bounds.width / 2, y: bounds.height - maxHeight / 2)

    if !hasLaidOut && !detentSpecs.isEmpty {
      hasLaidOut = true
      let indexToApply = pendingIndex ?? targetIndex
      pendingIndex = nil
      targetIndex = max(0, min(detentSpecs.count - 1, indexToApply))

      if animateIn {
        let closedTy = detentSpecs.last?.height ?? bounds.height
        sheetContainer.transform = CGAffineTransform(translationX: 0, y: closedTy)
        emitPosition()
        snapToIndex(targetIndex, velocity: 0)
      } else {
        sheetContainer.transform = CGAffineTransform(translationX: 0, y: translationY(for: targetIndex))
        emitPosition()
        eventDelegate?.bottomSheetHostingView(self, didChangeIndex: targetIndex)
      }
      return
    }

    if activeAnimator != nil || isPanning { return }
    sheetContainer.transform = CGAffineTransform(translationX: 0, y: translationY(for: targetIndex))
  }

  private var presentedSheetFrame: CGRect {
    if let presentation = sheetContainer.layer.presentation() {
      return presentation.frame
    }
    return sheetContainer.frame
  }

  public override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
    presentedSheetFrame.contains(point)
  }

  public override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    guard self.point(inside: point, with: event) else { return nil }

    let containerPoint = convert(point, to: sheetContainer)
    guard sheetContainer.bounds.contains(containerPoint) else { return nil }
    return sheetContainer.hitTest(containerPoint, with: event)
  }

  public func setDetents(_ raw: [NSDictionary]) {
    detentSpecs = raw.compactMap { dict in
      guard let height = dict["height"] as? Double ?? (dict["height"] as? NSNumber)?.doubleValue else {
        return nil
      }
      let programmatic = (dict["programmatic"] as? Bool) ?? (dict["programmatic"] as? NSNumber)?.boolValue ?? false
      return DetentSpec(height: CGFloat(height), programmatic: programmatic)
    }
  }

  public func setDetentIndex(_ newIndex: Int) {
    guard newIndex >= 0 else { return }

    if !hasLaidOut {
      pendingIndex = newIndex
      targetIndex = newIndex
      return
    }

    guard newIndex < detentSpecs.count, newIndex != targetIndex else { return }
    snapToIndex(newIndex, velocity: 0)
  }

  public func mountChildComponentView(_ childView: UIView, atIndex index: Int) {
    sheetContainer.insertSubview(childView, at: index)
  }

  public func unmountChildComponentView(_ childView: UIView) {
    childView.removeFromSuperview()
  }

  public func resetSheetState() {
    activeAnimator?.stopAnimation(true)
    activeAnimator = nil
    stopDisplayLink()
    detentSpecs = []
    targetIndex = 0
    pendingIndex = nil
    hasLaidOut = false
    isPanning = false
    setContentInteractionEnabled(true)
    sheetContainer.transform = .identity
    for subview in sheetContainer.subviews {
      subview.removeFromSuperview()
    }
  }

  private func detent(at index: Int) -> DetentSpec {
    guard detentSpecs.indices.contains(index) else {
      return DetentSpec(height: 0, programmatic: false)
    }
    return detentSpecs[index]
  }

  private func translationY(for index: Int) -> CGFloat {
    let maxHeight = detentSpecs.last?.height ?? bounds.height
    let snapHeight = detent(at: index).height
    return maxHeight - snapHeight
  }

  private var draggableRange: (minTy: CGFloat, maxTy: CGFloat) {
    let draggable = detentSpecs.enumerated().filter { !$0.element.programmatic }
    let highestIndex = draggable.last?.offset ?? 0
    let lowestIndex = draggable.first?.offset ?? 0
    return (minTy: translationY(for: highestIndex), maxTy: translationY(for: lowestIndex))
  }

  private func emitPosition() {
    let maxHeight = detentSpecs.last?.height ?? bounds.height
    let ty = sheetContainer.layer.presentation()?.affineTransform().ty ?? sheetContainer.transform.ty
    eventDelegate?.bottomSheetHostingView(self, didChangePosition: maxHeight - ty)
  }

  private func startDisplayLink() {
    guard displayLink == nil else { return }
    let link = CADisplayLink(target: self, selector: #selector(displayLinkFired))
    link.add(to: .main, forMode: .common)
    displayLink = link
  }

  private func stopDisplayLink() {
    displayLink?.invalidate()
    displayLink = nil
  }

  private func setContentInteractionEnabled(_ isEnabled: Bool) {
    if isContentInteractionDisabled == !isEnabled {
      return
    }

    for subview in sheetContainer.subviews {
      subview.isUserInteractionEnabled = isEnabled
    }
    isContentInteractionDisabled = !isEnabled
  }

  @objc private func displayLinkFired() {
    emitPosition()
  }

  private func snapToIndex(_ index: Int, velocity: CGFloat) {
    guard index >= 0, index < detentSpecs.count else { return }
    targetIndex = index

    let currentTy = sheetContainer.transform.ty
    let targetTy = translationY(for: index)
    let distance = targetTy - currentTy
    let velocityRatio = distance != 0 ? velocity / distance : 0
    let clampedRatio = min(max(velocityRatio, -5), 5)
    let initialVelocity = CGVector(dx: 0, dy: clampedRatio)

    activeAnimator?.stopAnimation(true)

    let spring = UISpringTimingParameters(dampingRatio: 1.0, initialVelocity: initialVelocity)
    let animator = UIViewPropertyAnimator(duration: 0.45, timingParameters: spring)

    animator.addAnimations {
      self.sheetContainer.transform = CGAffineTransform(translationX: 0, y: targetTy)
    }
    animator.addCompletion { [weak self] position in
      guard let self, position == .end else { return }
      self.stopDisplayLink()
      self.emitPosition()
      self.activeAnimator = nil
      self.setContentInteractionEnabled(true)
      self.eventDelegate?.bottomSheetHostingView(self, didChangeIndex: index)
    }
    animator.startAnimation()
    activeAnimator = animator
    startDisplayLink()
  }

  @objc private func handlePan(_ gesture: UIPanGestureRecognizer) {
    let maxHeight = detentSpecs.last?.height ?? bounds.height

    switch gesture.state {
    case .began:
      isPanning = true
      setContentInteractionEnabled(false)
      if let handler = surfaceTouchHandler {
        handler.isEnabled = false
        handler.isEnabled = true
      }
      gesture.setTranslation(.zero, in: self)
      if let animator = activeAnimator {
        stopDisplayLink()
        let visual = sheetContainer.layer.presentation()?.affineTransform() ?? sheetContainer.transform
        animator.stopAnimation(true)
        sheetContainer.transform = visual
        activeAnimator = nil
      }

    case .changed:
      let delta = gesture.translation(in: self).y
      gesture.setTranslation(.zero, in: self)
      let minTy = draggableRange.minTy
      let maxTy = draggableRange.maxTy
      let newTy = max(minTy, min(maxTy, sheetContainer.transform.ty + delta))
      sheetContainer.transform = CGAffineTransform(translationX: 0, y: newTy)
      emitPosition()

    case .ended:
      isPanning = false
      let velocity = gesture.velocity(in: self).y
      let currentHeight = maxHeight - sheetContainer.transform.ty
      let index = bestSnapIndex(for: currentHeight, velocity: velocity)
      snapToIndex(index, velocity: velocity)

    case .cancelled:
      isPanning = false
      setContentInteractionEnabled(true)
      let cancelVelocity = gesture.velocity(in: self).y
      let cancelHeight = maxHeight - sheetContainer.transform.ty
      let cancelIndex = bestSnapIndex(for: cancelHeight, velocity: cancelVelocity)
      snapToIndex(cancelIndex, velocity: cancelVelocity)

    case .failed:
      isPanning = false
      setContentInteractionEnabled(true)

    default:
      break
    }
  }

  private func bestSnapIndex(for height: CGFloat, velocity: CGFloat) -> Int {
    let draggable = detentSpecs.enumerated().filter { !$0.element.programmatic }
    guard !draggable.isEmpty else { return targetIndex }

    let flickThreshold: CGFloat = 600

    if velocity < -flickThreshold {
      return draggable.first(where: { $0.element.height > height })?.offset
        ?? draggable.last?.offset ?? targetIndex
    }
    if velocity > flickThreshold {
      return draggable.last(where: { $0.element.height < height })?.offset
        ?? draggable.first?.offset ?? targetIndex
    }

    return draggable.min(by: {
      abs($0.element.height - height) < abs($1.element.height - height)
    })?.offset ?? targetIndex
  }

  private func firstScrollView(in view: UIView) -> UIScrollView? {
    for subview in view.subviews {
      if let scrollView = subview as? UIScrollView {
        return scrollView
      }
      if let found = firstScrollView(in: subview) {
        return found
      }
    }
    return nil
  }

  public override func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
    guard gestureRecognizer === panGesture else { return true }

    let velocity = panGesture.velocity(in: self)
    guard abs(velocity.y) > abs(velocity.x) else { return false }

    let draggable = detentSpecs.enumerated().filter { !$0.element.programmatic }
    guard draggable.count > 1 else { return false }

    let maxDraggableIndex = draggable.last?.offset ?? 0
    guard targetIndex >= maxDraggableIndex else { return true }

    if velocity.y < 0 {
      return false
    }

    let scrollAtTop = (firstScrollView(in: sheetContainer)?.contentOffset.y ?? 0) <= 0
    return scrollAtTop
  }
}

extension RNSBottomSheetHostingView: UIGestureRecognizerDelegate {
  public func gestureRecognizer(
    _ gestureRecognizer: UIGestureRecognizer,
    shouldBeRequiredToFailBy other: UIGestureRecognizer
  ) -> Bool {
    guard gestureRecognizer === panGesture else { return false }
    return other is UIPanGestureRecognizer || other is UITapGestureRecognizer
  }

  public func gestureRecognizer(
    _ gestureRecognizer: UIGestureRecognizer,
    shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer
  ) -> Bool {
    return false
  }
}
