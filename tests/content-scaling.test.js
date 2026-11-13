import { describe, expect, mock, test } from 'bun:test';

mock.module('react-native', () => ({
  Platform: { OS: 'web' },
  I18nManager: {},
  StyleSheet: { flatten: (style) => style },
  processColor: (color) => color,
}));
const { SheetCard } = await import('../src/web/card');
const { normalizeDetents } = await import('../src/bottomSheetUtils');

function fixture(scaleContent) {
  const elements = Object.fromEntries(
    ['host', 'card', 'content', 'surface', 'shadow'].map((name) => [
      name,
      { style: {}, clientWidth: 400 },
    ])
  );
  const rawDetents = normalizeDetents(
    [
      0,
      {
        value: 300,
        insets: { left: 40, right: 40 },
        borderTopRadius: 24,
        borderBottomRadius: 8,
      },
      { value: 600, insets: { left: 8, right: 8 }, borderRadius: 0 },
    ],
    0,
    false,
    false
  );
  const host = {
    elements,
    config: { scaleContent, cornerRadii: [0, 0, 0, 0], shadows: [] },
    hostHeight: 800,
    translateY: 500,
    rawDetents,
    detents: [0, 300, 600].map((position, index) => ({
      position,
      ...rawDetents[index],
    })),
    widestCardLeft: 8,
    widestCardGaps: 16,
  };
  return { host, card: new SheetCard(host) };
}

describe('optional inset content scaling', () => {
  test('omitting the flag preserves upstream scaling and measurement', () => {
    const { host, card } = fixture(undefined);
    card.updateCardShape();
    expect(host.elements.content.style.transform).toContain(
      'scale(0.8333333333333334)'
    );
    expect(card.currentLayoutHeight()).toBe(360);
    expect(host.elements.shadow.style.borderRadius).toBe('24px 24px 8px 8px');
  });
  test('false preserves size and coordinates while retaining the clip and radii', () => {
    const { host, card } = fixture(false);
    card.updateCardShape();
    expect(host.elements.content.style.transform).toBe('');
    expect(host.elements.surface.style.transform).toBe('');
    expect(card.currentLayoutHeight()).toBe(300);
    expect(host.elements.card.style.clipPath).toContain('40px');
    expect(host.elements.shadow.style.borderRadius).toBe('24px 24px 8px 8px');
  });
  test('the mode can change at the current detent and clear old transforms', () => {
    const { host, card } = fixture(true);
    card.updateCardShape();
    host.config.scaleContent = false;
    card.updateCardClip();
    expect(host.elements.content.style.transform).toBe('');
    expect(card.currentLayoutHeight()).toBe(300);
    host.config.scaleContent = true;
    card.updateCardClip();
    expect(host.elements.content.style.transform).toContain('scale(');
    expect(card.currentLayoutHeight()).toBe(360);
  });
});
