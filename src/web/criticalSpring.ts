/**
 * Critically damped (ζ = 1) spring; see `CriticalSpring.swift`. The stiffness is
 * picked so the sheet looks settled (within ~0.5% of target) right at the
 * duration: for a critically-damped spring that point is ω·t ≈ 8.
 */
export class CriticalSpring {
  private readonly omega: number;

  constructor(
    readonly from: number,
    readonly target: number,
    /** Initial velocity in pixels per second. */
    readonly v0: number,
    /** `performance.now()` timestamp the curve starts at. */
    readonly startTime: number,
    /** Seconds the spring takes. */
    readonly duration: number
  ) {
    this.omega = 8 / duration;
  }

  /**
   * Position at a `performance.now()` timestamp. The spring only approaches its
   * target, so the offset left at `duration` is scaled out of the whole curve:
   * it starts at `from`, keeps its shape, and lands on `target` at `duration`
   * rather than jumping the leftover when the settle finishes.
   */
  value(time: number) {
    const t = Math.min(
      Math.max(0, time - this.startTime) / 1000,
      this.duration
    );
    const a = this.from - this.target;
    const end = this.offset(this.duration);
    if (a === end) return this.target + this.offset(t);
    // The share of the way still to go: exactly 1 at the start and 0 at the end.
    const remaining = (this.offset(t) - end) / (a - end);
    return this.target + a * remaining;
  }

  isFinished(time: number) {
    return time - this.startTime >= this.duration * 1000;
  }

  /** Offset from the target `t` seconds in. */
  private offset(t: number) {
    const a = this.from - this.target;
    const decay = Math.exp(-this.omega * t);
    return decay * (a + (this.v0 + this.omega * a) * t);
  }
}
