import QuartzCore

/// Critically damped (ζ = 1): reaches the target as fast as possible without overshooting.
struct CriticalSpring {
  let from: CGFloat
  let target: CGFloat
  /// Initial velocity (points/sec) — e.g. carried over from a finger flick.
  let v0: CGFloat
  /// Angular frequency (rad/sec) — the spring's stiffness/speed. Higher ω snaps faster.
  let omega: CGFloat
  /// Absolute media time the curve starts at — the same instant the modal's
  /// keyframe animation is pinned to via its `beginTime`, so `value(at:)` and the
  /// modal share one clock.
  let startTime: CFTimeInterval
  let duration: CFTimeInterval

  /// Position at an absolute `time`. The spring only approaches its target, so
  /// at `duration` it is still a fraction of the way short (0.3% from rest at
  /// ω·t = 8). Ending there would leave that fraction to a one-frame jump when
  /// the animation is removed, so the leftover is scaled out of the whole curve:
  /// it starts at `from`, keeps its shape, and lands on `target` at `duration`.
  func value(at time: CFTimeInterval) -> CGFloat {
    // Seconds since the spring started, held at both ends: a past `time` reads
    // as t = 0, and past `duration` the curve stays on the target.
    let t = CGFloat(min(max(0, time - startTime), duration))
    // A: how far `from` is from `target` — the offset the spring must close.
    let a = from - target
    let end = offset(at: CGFloat(duration))
    guard a != end else { return target + offset(at: t) }
    // The share of the way still to go: exactly 1 at the start and 0 at `duration`.
    let remaining = (offset(at: t) - end) / (a - end)
    return target + a * remaining
  }

  /// Offset from the target `t` seconds in, from the closed-form solution of a
  /// critically-damped spring (ζ = 1):
  ///   x(t) − target = e^(−ω·t)·[A + (v0 + ω·A)·t]
  /// where A is the starting offset from the target. The `e^(−ω·t)` term decays
  /// the offset toward 0 (so x → target), and the linear `…·t` factor is what
  /// lets a critically-damped spring carry initial velocity without oscillating.
  private func offset(at t: CGFloat) -> CGFloat {
    let a = from - target
    // Exponential envelope: 1 at t = 0, shrinking toward 0 as time passes.
    let decay = exp(-omega * t)
    return decay * (a + (v0 + omega * a) * t)
  }

  /// Samples this curve into `count + 1` evenly-spaced points over `[0, duration]`
  /// for use as `CAKeyframeAnimation.values`. CA replays these samples on the
  /// render server, while `value(at:)` feeds the follower from the analytical
  /// spring on the app thread.
  func keyframeValues(count: Int) -> [CGFloat] {
    let n = max(count, 1)
    return (0 ... n).map { i in
      let t = duration * CFTimeInterval(i) / CFTimeInterval(n)
      return value(at: startTime + t)
    }
  }
}
