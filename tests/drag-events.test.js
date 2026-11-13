/* global globalThis */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { SheetGestures } from '../src/web/gestures';

let saved;
beforeEach(() => {
  saved = Object.fromEntries(
    ['window', 'document', 'Element', 'HTMLElement'].map((key) => [
      key,
      globalThis[key],
    ])
  );
  class LayoutElement {}
  globalThis.Element = LayoutElement;
  globalThis.HTMLElement = LayoutElement;
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  globalThis.document = { activeElement: null };
});
afterEach(() => {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete globalThis[key];
    else globalThis[key] = value;
  }
});

function fixture() {
  const events = [];
  const host = {
    elements: { container: {} },
    detents: [{ position: 0 }, { position: 300 }, { position: 800 }],
    hostHeight: 800,
    translateY: 500,
    hasLaidOut: true,
    targetIndex: 1,
    isPanning: false,
    pendingIndex: null,
    scrimPinnedFull: false,
    momentum: { cancel() {}, start() {} },
    requireConfig: () => ({
      scrollExpandCoordination: 2,
      scrollCollapseCoordination: 1,
    }),
    setTranslateY(value) {
      this.translateY = value;
    },
    emitPosition() {},
    emit(callback) {
      callback({
        onDragStart: () => events.push('start'),
        onDragEnd: () => events.push('end'),
      });
    },
    snapping: {
      isSpringActive: false,
      cancelSpring() {},
      currentTranslateY: () => host.translateY,
      draggableRange: () => ({ minTy: 0, maxTy: 800 }),
      snapCandidateIndices: () => [0, 1, 2],
      bestSnapIndex: () => 1,
      snapToIndex() {
        events.push('settle');
      },
    },
  };
  const gestures = new SheetGestures(host);
  gestures.beginGesture('touch', 100, 100, null);
  return { host, gestures, events };
}

describe('sheet drag callbacks', () => {
  test('touch-down and movement below slop emit no events', () => {
    const { gestures, events } = fixture();
    gestures.moveGesture(new Event('touchmove'), 100, 102);
    gestures.endGesture();
    expect(events).toEqual([]);
  });
  test('horizontal rejection emits no start or orphan end', () => {
    const { gestures, events } = fixture();
    gestures.moveGesture(new Event('touchmove'), 150, 102);
    gestures.endGesture();
    expect(events).toEqual([]);
  });
  test('accepted moves emit one start and end before settling', () => {
    const { gestures, events } = fixture();
    gestures.moveGesture(new Event('touchmove'), 100, 80);
    gestures.moveGesture(new Event('touchmove'), 100, 60);
    expect(events).toEqual(['start']);
    gestures.endGesture();
    gestures.endGesture();
    expect(events).toEqual(['start', 'end', 'settle']);
  });
  test('touch cancellation pairs the start before snapping', () => {
    const { gestures, events } = fixture();
    gestures.gesture.touchId = 7;
    gestures.moveGesture(new Event('touchmove'), 100, 80);
    gestures.handleTouchEnd({
      type: 'touchcancel',
      changedTouches: [{ identifier: 7 }],
    });
    expect(events).toEqual(['start', 'end', 'settle']);
  });
  test('teardown ends a pan once without creating a snap', () => {
    const { gestures, events } = fixture();
    gestures.moveGesture(new Event('touchmove'), 100, 80);
    gestures.reset();
    gestures.reset();
    expect(events).toEqual(['start', 'end']);
  });
  test('handoff to scrolling keeps the same lifecycle pair', () => {
    const { gestures, events } = fixture();
    gestures.moveGesture(new Event('touchmove'), 100, 80);
    gestures.gesture.mode = 'scroll';
    gestures.gesture.chain = [{}];
    gestures.gesture.manualScroll = false;
    gestures.moveGesture(new Event('touchmove'), 100, 60);
    gestures.endGesture();
    expect(events).toEqual(['start', 'end', 'settle']);
  });
  test('programmatic snaps do not emit gesture events', () => {
    const { host, gestures, events } = fixture();
    host.snapping.snapToIndex(2, 0);
    gestures.reset();
    expect(events).toEqual(['settle']);
  });
});
