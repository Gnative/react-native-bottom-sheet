import { describe, expect, mock, test } from 'bun:test';
mock.module('react-native', () => ({
  Platform: { OS: 'web' },
  I18nManager: {},
  StyleSheet: { flatten: (style) => style },
  processColor: (color) => color,
}));
const { normalizeDetents, resolveContentTopInset } =
  await import('../src/bottomSheetUtils');
const { resolveDetentSpecs, contentRegionHeight, contentTopInsetAt } =
  await import('../src/web/detents');
const { SheetCard } = await import('../src/web/card');

function fixture({
  safeArea = 59,
  boundary = -1,
  offset = 0,
  scaleContent = false,
  bottom = 0,
} = {}) {
  const elements = Object.fromEntries(
    ['host', 'card', 'content', 'surface', 'shadow'].map((name) => [
      name,
      { style: {}, clientWidth: 400 },
    ])
  );
  const rawDetents = normalizeDetents(
    [0, 320, { value: 'fullscreen', insets: { bottom }, borderRadius: 0 }],
    undefined,
    false,
    false,
    offset
  );
  const host = {
    elements,
    config: {
      scaleContent,
      contentTopInset: boundary,
      cornerRadii: [24, 24, 8, 8],
      shadows: [],
    },
    hostHeight: 800,
    statusBarOverlap: safeArea,
    widestCardLeft: 0,
    widestCardGaps: 0,
    rawDetents,
    lastReportedError: null,
    emit() {},
    translateY: 0,
  };
  host.detents = resolveDetentSpecs(host);
  return { host, card: new SheetCard(host) };
}

describe('fullscreen detents and safe content', () => {
  test('fullscreen bypasses the ordinary safe-area cap', () => {
    const { host } = fixture();
    host.rawDetents = normalizeDetents(
      [0, '100%', 'fullscreen'],
      undefined,
      false,
      false
    );
    expect(resolveDetentSpecs(host).map((d) => d.position)).toEqual([
      0, 741, 800,
    ]);
  });
  test('a custom fullscreen offset affects only fullscreen detents', () => {
    const { host } = fixture({ offset: 22 });
    expect(host.detents.map((d) => d.position)).toEqual([0, 320, 778]);
    expect(contentTopInsetAt(host, 778)).toBe(37);
    expect(contentRegionHeight(host)).toBe(741);
  });
  test('safe area and numeric boundaries produce a continuous content-only offset', () => {
    const { host, card } = fixture();
    for (const [translation, inset] of [
      [200, 0],
      [59, 0],
      [30, 29],
      [0, 59],
    ]) {
      host.translateY = translation;
      card.updateCardShape();
      expect(contentTopInsetAt(host, 800 - translation)).toBe(inset);
      expect(host.elements.surface.style.transform).toBe('');
      expect(host.elements.content.style.transform).toBe(
        inset ? `translateY(${inset}px)` : ''
      );
    }
    host.config.contentTopInset = 80;
    card.updateCardClip();
    expect(host.elements.content.style.transform).toBe('translateY(80px)');
  });
  test('the viewport accounts for top and bottom gaps without shrinking the surface', () => {
    const { host, card } = fixture({ bottom: 32 });
    expect(host.detents.at(-1).position).toBe(800);
    expect(contentRegionHeight(host)).toBe(709);
    card.updateCardShape();
    expect(host.elements.shadow.style.height).toBe('768px');
    expect(host.elements.surface.style.transform).toBe('');
  });
  test('a negative handle adjustment aligns the area below the handle with the safe area', () => {
    const { host, card } = fixture();
    host.config.contentTopInsetOffset = -16;
    card.updateCardShape();
    expect(host.elements.content.style.transform).toBe('translateY(43px)');
    expect(contentTopInsetAt(host, 800) + 16).toBe(59);
    expect(contentRegionHeight(host)).toBe(757);
    host.translateY = 30;
    card.updateCardClip();
    expect(host.elements.content.style.transform).toBe('translateY(13px)');
    host.statusBarOverlap = 0;
    host.translateY = 0;
    card.updateCardClip();
    expect(host.elements.content.style.transform).toBe('');
    for (const value of [NaN, Infinity, -Infinity])
      expect(() => resolveContentTopInset('safeArea', value)).toThrow();
  });

  test('hosts without an overlapping safe area need no offset', () => {
    const { host, card } = fixture({ safeArea: 0 });
    expect(contentRegionHeight(host)).toBe(800);
    card.updateCardShape();
    expect(host.elements.content.style.transform).toBe('');
  });
  test('rotation recomputes the fullscreen height and content viewport', () => {
    const { host } = fixture();
    host.hostHeight = 400;
    host.statusBarOverlap = 0;
    expect(resolveDetentSpecs(host).at(-1).position).toBe(400);
    expect(contentRegionHeight(host)).toBe(400);
  });
  test('safe content works with card scaling without moving the surface down', () => {
    const { host, card } = fixture({ scaleContent: true });
    host.rawDetents = normalizeDetents(
      [0, 320, { value: 'fullscreen', insets: { left: 20, right: 20 } }],
      undefined,
      false,
      false
    );
    host.detents = resolveDetentSpecs(host);
    card.updateCardShape();
    expect(host.elements.surface.style.transform).toContain('scale(0.9)');
    expect(host.elements.surface.style.transform).not.toContain('translateY');
    expect(host.elements.content.style.transform).toStartWith(
      'translateY(59px)'
    );
    expect(contentRegionHeight(host)).toBeCloseTo(741 / 0.9);
  });
  test('default content behavior and input validation are preserved', () => {
    const { host, card } = fixture({ boundary: 0 });
    card.updateCardShape();
    expect(host.elements.content.style.transform).toBe('');
    expect(contentRegionHeight(host)).toBe(800);
    expect(resolveContentTopInset('safeArea')).toBe(-1);
    for (const value of [-1, NaN, Infinity, 'invalid'])
      expect(() => resolveContentTopInset(value)).toThrow();
    for (const value of [-1, NaN, Infinity])
      expect(() =>
        normalizeDetents(['fullscreen'], undefined, false, false, value)
      ).toThrow();
  });
});
