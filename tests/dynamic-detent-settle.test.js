/* global globalThis */
import { describe, expect, mock, test } from 'bun:test';

mock.module('react-native', () => ({
  Platform: { OS: 'web' },
  I18nManager: {},
  StyleSheet: { flatten: (style) => style },
  processColor: (color) => color,
}));
const { BottomSheetWebController } = await import('../src/web/controller');
const { normalizeDetents, CONTENT_HEIGHT_MARKER_NATIVE_ID } =
  await import('../src/bottomSheetUtils');

// Layout-only DOM stand-ins: exercise the real content measurement and
// detent resolver without a browser or rendering React.
class LayoutElement {}
globalThis.HTMLElement = LayoutElement;

function sheet({ animate = true, activeSpring = false } = {}) {
  const controller = new BottomSheetWebController();
  const wrapper = new LayoutElement();
  const marker = Object.assign(new LayoutElement(), {
    id: CONTENT_HEIGHT_MARKER_NATIVE_ID,
    offsetParent: wrapper,
    offsetTop: 200,
  });
  wrapper.children = [marker];
  controller.elements = {
    host: { clientWidth: 400 },
    content: { firstElementChild: wrapper },
  };
  controller.config = { animateContentHeight: animate, modal: false };
  controller.rawDetents = normalizeDetents(
    [0, 'content', 600],
    0,
    { maxWidth: 0, placementBias: 0.5 },
    false,
    false
  );
  controller.detents = [0, 100, 600].map((position) => ({
    position,
    programmatic: false,
    insetLeft: 0,
    insetRight: 0,
    insetBottom: 0,
  }));
  controller.hasLaidOut = true;
  controller.hostHeight = 800;
  controller.lastAppliedHostHeight = 800;
  controller.targetIndex = 1;
  controller.translateY = 700;
  const settle = mock();
  const indexChange = mock();
  controller.emit = (callback) =>
    callback({ onSettle: settle, onIndexChange: indexChange });
  controller.emitPosition = mock();
  controller.setTranslateY = (value) => {
    controller.translateY = value;
  };
  const snap = mock();
  controller.snapping = {
    isSpringActive: activeSpring,
    springEmitsSettle: true,
    translationY: () => 600,
    detentPosition: () => 200,
    cancelSpring: () => controller.translateY,
    snapToIndex: snap,
  };
  return { controller, marker, settle, indexChange, snap };
}

describe('dynamic detent completion', () => {
  test('animated resize requests one settle without an index change', () => {
    const { controller, settle, indexChange, snap } = sheet();
    controller.resolveDetentsFromLayout();
    expect(snap).toHaveBeenCalledTimes(1);
    expect(snap).toHaveBeenCalledWith(1, 0, false, true, true);
    expect(settle).not.toHaveBeenCalled(); // delivered by the spring on completion
    expect(indexChange).not.toHaveBeenCalled();
    controller.resolveDetentsFromLayout();
    expect(snap).toHaveBeenCalledTimes(1);
  });

  test('immediate growth and shrink each settle once; repeated layout is silent', () => {
    const { controller, marker, settle, indexChange, snap } = sheet({
      animate: false,
    });
    controller.resolveDetentsFromLayout();
    expect(controller.translateY).toBe(600);
    expect(settle).toHaveBeenCalledTimes(1);
    expect(settle).toHaveBeenCalledWith(1);
    controller.resolveDetentsFromLayout();
    expect(settle).toHaveBeenCalledTimes(1);
    marker.offsetTop = 150;
    controller.snapping.translationY = () => 650;
    controller.snapping.detentPosition = () => 150;
    controller.resolveDetentsFromLayout();
    expect(controller.translateY).toBe(650);
    expect(settle).toHaveBeenCalledTimes(2);
    expect(indexChange).not.toHaveBeenCalled();
    expect(snap).not.toHaveBeenCalled();
  });

  test('a geometry update that does not move the active detent is silent', () => {
    const { controller, marker, settle, snap } = sheet({ animate: false });
    marker.offsetTop = 100;
    controller.rawDetents = normalizeDetents(
      [0, 'content', 650],
      0,
      { maxWidth: 0, placementBias: 0.5 },
      false,
      false
    );
    controller.snapping.translationY = () => 700;
    controller.snapping.detentPosition = () => 100;
    controller.resolveDetentsFromLayout();
    expect(settle).not.toHaveBeenCalled();
    expect(snap).not.toHaveBeenCalled();
  });

  test('resizing during a spring preserves its pending settle', () => {
    const { controller, settle, indexChange, snap } = sheet({
      activeSpring: true,
    });
    controller.resolveDetentsFromLayout();
    expect(snap).toHaveBeenCalledTimes(1);
    expect(snap).toHaveBeenCalledWith(1, 0, false, true, true);
    expect(settle).not.toHaveBeenCalled();
    expect(indexChange).not.toHaveBeenCalled();
  });
});
