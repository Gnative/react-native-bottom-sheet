import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { ModalBottomSheet,  programmatic } from '@swmansion/react-native-bottom-sheet';

import {
  DemoScreen,
  MODAL_SCRIM_COLOR,
  SheetBackground,
  SheetHeader,
  useSheetBottomPadding,
} from '../demoShared';

const COMPACT_INDEX = 1;
const MID_INDEX = 2;
const FULL_INDEX = 3;


const DETENTS = [[programmatic(0), 180, 460, 660], [programmatic(0), 180, 'fullscreen']]
const DETENTS_SPACING = [[12, 12, 0, 12], [10,10, 0]]
const DETENTS_CORNER_RADIUS = [[50, 50, 20, 5], [50, 50, 20]]

export const CollapsedSurfaceScreen = () => {
  const [index, setIndex] = useState(COMPACT_INDEX);
  const [compactSpacing, setCompactSpacing] = useState(20);
  const [detentsIndex, setDetentsIndex] = useState(0);
  const sheetBottomPadding = useSheetBottomPadding();

  return (
    <DemoScreen
      title="Collapsed surface"
      sheet={
        <ModalBottomSheet
          index={index}
          onIndexChange={setIndex}

          detents={DETENTS[detentsIndex]}
          detentSpacing={DETENTS_SPACING[detentsIndex]}
          detentCornerRadius={DETENTS_CORNER_RADIUS[detentsIndex]}

          scrimColor={MODAL_SCRIM_COLOR}
          //scrimOpacities={[0, 0.25, 0.25, 0.75]}
          surface={<SheetBackground style={StyleSheet.absoluteFill} />}

          //animationDurationMs={2000}
          //debugSurfaceBorders
        >
          <SheetHeader
            title="Collapsed surface"
            onClose={() => setIndex(0)}
          />
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              // justifyContent: 'center',
              paddingHorizontal: 24,
              paddingBottom: sheetBottomPadding,
              gap: 12,
            }}
          >
            <Text style={styles.title}>
              {index === COMPACT_INDEX ? 'Compact detent' : 'Full detent'}
            </Text>
            <Text style={styles.description}>
              The surface narrows by {compactSpacing}pt at index 0 while this
              content remains centered. The same gap lifts it from the display
              bottom, and its shadow follows the rounded surface outline.
            </Text>
            <View style={styles.controls}>
              <Button title="Compact" onPress={() => setIndex(COMPACT_INDEX)} />
              <Button title="Mid" onPress={() => setIndex(MID_INDEX)} />
              <Button title="Full" onPress={() => setIndex(FULL_INDEX)} />
            </View>
            <View style={styles.controls}>
              <Button title="Toggle Detents" onPress={() => setDetentsIndex(detentsIndex === 0 ? 1 : 0)} />
            </View>
          </View>
        </ModalBottomSheet>
      }
    >
      <Text style={styles.description}>
        Drag between the two detents to inspect the floating island, centered
        content, device corner radius, and surface shadow.
      </Text>
      <View style={styles.controls}>
        <Button title="Open compact" onPress={() => setIndex(COMPACT_INDEX)} />
        <Button title="Open mid" onPress={() => setIndex(MID_INDEX)} />
        <Button title="Open full" onPress={() => setIndex(FULL_INDEX)} />
      </View>
      <View style={styles.controls}>
        <Button title="Spacing 12" onPress={() => setCompactSpacing(12)} />
        <Button title="Spacing 28" onPress={() => setCompactSpacing(28)} />
      </View>
    </DemoScreen>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700' },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
    textAlign: 'center',
  },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
});
