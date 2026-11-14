import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { BottomSheet, type Detent } from '@swmansion/react-native-bottom-sheet';

import { DemoScreen, SheetHeader } from '../demoShared';

// Each edge pair can override the uniform radius independently. The middle
// detent inherits its bottom corners from surfaceStyle (16).
const DETENTS: Detent[] = [
  0,
  {
    value: 320,
    insets: { left: 16, right: 16, bottom: 32 },
    borderTopRadius: 40,
    borderBottomRadius: 8,
  },
  {
    value: '70%',
    insets: { left: 8, right: 8, bottom: 16 },
    borderTopRadius: 12,
  },
  { value: '100%', borderRadius: 0 },
];

export const DetentRadiiScreen = () => {
  const [index, setIndex] = useState(0);

  return (
    <DemoScreen
      title="Per-detent corner radii"
      sheet={
        <BottomSheet
          detents={DETENTS}
          scaleContent={false}
          index={index}
          onIndexChange={setIndex}
          surfaceStyle={{
            borderRadius: 16,
            boxShadow: '0px -4px 16px rgba(0, 0, 0, 0.2)',
          }}
          surface={<View style={styles.surface} />}
        >
          <View style={styles.header}>
            <SheetHeader
              title="Drag to change the corners"
              onClose={() => setIndex(0)}
            />
          </View>
          <View style={styles.controls}>
            <Text>
              Top and bottom radii blend independently. Text stays the same size
              as the insets change.
            </Text>
            <Button
              title="Low: top 40 / bottom 8"
              onPress={() => setIndex(1)}
            />
            <Button
              title="Middle: top 12 / bottom 16 (default)"
              onPress={() => setIndex(2)}
            />
            <Button title="Full: square corners" onPress={() => setIndex(3)} />
          </View>
        </BottomSheet>
      }
    >
      <Text>
        Open the sheet, then drag or use its buttons. Watch the top and bottom
        corners, inset gaps, and shadow animate together. The background stays
        interactive; outside taps do not close the sheet.
      </Text>
      <Button title="Open rounded sheet" onPress={() => setIndex(1)} />
    </DemoScreen>
  );
};

const styles = StyleSheet.create({
  surface: { ...StyleSheet.absoluteFill, backgroundColor: '#fef3c7' },
  header: { backgroundColor: '#c7d2fe', paddingHorizontal: 24 },
  controls: { paddingHorizontal: 32, paddingTop: 12, gap: 8 },
});
