import UIKit

final class BottomSheetAccessoryHost: NSObject {
  private weak var owner: UIView?
  private weak var sheetContainer: UIView?
  private weak var accessoryView: UIView?
  private var observedAccessoryView: UIView?
  private var minDetentHeight: CGFloat = 0
  private var maxDetentHeight: CGFloat = .nan

  private static var observationContext = 0

  init(owner: UIView, sheetContainer: UIView) {
    self.owner = owner
    self.sheetContainer = sheetContainer
  }

  var presentedFrame: CGRect? {
    guard let accessoryView, !accessoryView.isHidden, accessoryView.alpha > 0.01 else { return nil }
    return accessoryView.frame
  }

  func setMinDetentHeight(_ minDetentHeight: CGFloat) {
    self.minDetentHeight = max(0, minDetentHeight)
  }

  func setMaxDetentHeight(_ maxDetentHeight: CGFloat) {
    self.maxDetentHeight = maxDetentHeight
  }

  func mount(_ accessoryView: UIView) {
    self.accessoryView = accessoryView
    if let owner, let sheetContainer {
      owner.insertSubview(accessoryView, belowSubview: sheetContainer)
    }
    refreshObservation()
    owner?.setNeedsLayout()
  }

  func unmount(_ accessoryView: UIView) {
    if self.accessoryView === accessoryView {
      stopObserving()
      self.accessoryView = nil
    }
    accessoryView.removeFromSuperview()
    owner?.setNeedsLayout()
  }

  func layout(
    in bounds: CGRect,
    sheetHeight: CGFloat,
    resolvedMaxDetentHeight: CGFloat,
    translationY: CGFloat
  ) {
    guard let accessoryView else { return }
    let accessoryHeight = max(accessoryView.bounds.height, accessoryView.sizeThatFits(bounds.size).height)
    accessoryView.frame = CGRect(
      x: 0,
      y: accessoryView.frame.minY,
      width: bounds.width,
      height: accessoryHeight
    )
    updatePosition(
      boundsHeight: bounds.height,
      sheetHeight: sheetHeight,
      resolvedMaxDetentHeight: resolvedMaxDetentHeight,
      translationY: translationY
    )
  }

  func updatePosition(
    boundsHeight: CGFloat,
    sheetHeight: CGFloat,
    resolvedMaxDetentHeight: CGFloat,
    translationY: CGFloat
  ) {
    guard let accessoryView else { return }
    let accessoryHeight = accessoryView.bounds.height
    let cappedSheetHeight = min(sheetHeight, resolvedAccessoryMaxDetentHeight(resolvedMaxDetentHeight) ?? sheetHeight)

    if minDetentHeight > 0 {
      let flooredSheetHeight = max(cappedSheetHeight, minDetentHeight)
      accessoryView.frame.origin.y = boundsHeight - flooredSheetHeight - accessoryHeight
      return
    }

    if cappedSheetHeight <= 0 {
      accessoryView.frame.origin.y = boundsHeight
    } else if cappedSheetHeight < accessoryHeight {
      accessoryView.frame.origin.y = boundsHeight - cappedSheetHeight
    } else {
      accessoryView.frame.origin.y = boundsHeight - cappedSheetHeight - accessoryHeight
    }
  }

  func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    guard let accessoryView, let frame = presentedFrame, frame.contains(point), let owner else {
      return nil
    }
    let accessoryPoint = owner.convert(point, to: accessoryView)
    return accessoryView.hitTest(accessoryPoint, with: event)
  }

  func reset() {
    let mountedAccessoryView = accessoryView
    stopObserving()
    accessoryView = nil
    minDetentHeight = 0
    maxDetentHeight = .nan
    mountedAccessoryView?.removeFromSuperview()
  }

  deinit {
    stopObserving()
  }

  func currentHeight(fitting bounds: CGRect) -> CGFloat {
    guard let accessoryView else { return 0 }
    return max(accessoryView.bounds.height, accessoryView.sizeThatFits(bounds.size).height)
  }

  private func resolvedAccessoryMaxDetentHeight(_ resolvedMaxDetentHeight: CGFloat) -> CGFloat? {
    guard maxDetentHeight.isFinite, maxDetentHeight >= 0 else { return nil }
    return min(max(0, maxDetentHeight), resolvedMaxDetentHeight)
  }

  private func refreshObservation() {
    guard let accessoryView else {
      stopObserving()
      return
    }
    guard accessoryView !== observedAccessoryView else { return }
    stopObserving()
    accessoryView.layer.addObserver(
      self,
      forKeyPath: "bounds",
      options: [],
      context: &Self.observationContext
    )
    observedAccessoryView = accessoryView
  }

  private func stopObserving() {
    guard let observedAccessoryView else { return }
    observedAccessoryView.layer.removeObserver(
      self,
      forKeyPath: "bounds",
      context: &Self.observationContext
    )
    self.observedAccessoryView = nil
  }

  override func observeValue(
    forKeyPath keyPath: String?,
    of object: Any?,
    change: [NSKeyValueChangeKey : Any]?,
    context: UnsafeMutableRawPointer?
  ) {
    if context == &Self.observationContext {
      owner?.setNeedsLayout()
    } else {
      super.observeValue(forKeyPath: keyPath, of: object, change: change, context: context)
    }
  }
}
