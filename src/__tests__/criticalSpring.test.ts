/// <reference types="bun" />

import { describe, expect, test } from 'bun:test';

import { CriticalSpring } from '../web/criticalSpring';

const START = 1000;
const DURATION = 0.3;
const END = START + DURATION * 1000;

describe('CriticalSpring', () => {
  test('starts at from and lands on the target at the duration', () => {
    const spring = new CriticalSpring(874, 0, 0, START, DURATION);

    expect(spring.value(START)).toBe(874);
    expect(spring.value(END)).toBe(0);
  });

  test('closes the last frame without a jump', () => {
    const spring = new CriticalSpring(874, 0, 0, START, DURATION);
    const frame = 1000 / 60;

    // The unscaled spring is still 0.3% (2.6 px) short here; the step onto the
    // target must be no larger than the frame before it.
    const lastStep = spring.value(END - frame) - spring.value(END);
    const stepBefore =
      spring.value(END - 2 * frame) - spring.value(END - frame);
    expect(lastStep).toBeGreaterThan(0);
    expect(lastStep).toBeLessThan(stepBefore);
  });

  test('stays on the target past the duration', () => {
    const spring = new CriticalSpring(874, 0, 0, START, DURATION);

    expect(spring.value(END + 1)).toBe(0);
    expect(spring.value(END + 5000)).toBe(0);
  });

  test('never passes the target from rest', () => {
    const spring = new CriticalSpring(0, 600, 0, START, DURATION);

    let previous = spring.value(START);
    for (let time = START + 1; time <= END; time += 1) {
      const value = spring.value(time);
      expect(value).toBeGreaterThanOrEqual(previous);
      expect(value).toBeLessThanOrEqual(600);
      previous = value;
    }
  });

  test('lands on the target with a release velocity in either direction', () => {
    const toward = new CriticalSpring(300, 0, -3000, START, DURATION);
    const away = new CriticalSpring(300, 0, 1500, START, DURATION);

    expect(toward.value(START)).toBe(300);
    expect(toward.value(END)).toBe(0);
    expect(away.value(START)).toBe(300);
    expect(away.value(END)).toBe(0);
    // A release heading away from the target still turns around first.
    expect(away.value(START + 5)).toBeGreaterThan(300);
  });

  test('holds still when it starts on the target', () => {
    const spring = new CriticalSpring(120, 120, 0, START, DURATION);

    expect(spring.value(START)).toBe(120);
    expect(spring.value(START + 100)).toBe(120);
    expect(spring.value(END)).toBe(120);
  });
});
