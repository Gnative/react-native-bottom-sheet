import { useState } from 'react';
import {
  Button,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {
  BottomSheet,
  ModalBottomSheet,
  type BottomSheetProps,
} from '@swmansion/react-native-bottom-sheet';

import {
  DemoScreen,
  HANDLE_HEIGHT,
  SheetHeader,
  useSheetBottomPadding,
} from '../demoShared';

type Mode = 'inline' | 'modal' | 'overlay';
const MODES: Mode[] = ['inline', 'modal', 'overlay'];

export const FullscreenDetentsScreen = () => {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<Mode>('inline');
  const [safeContent, setSafeContent] = useState(true);
  const [compensateHandle, setCompensateHandle] = useState(true);
  const bottomPadding = useSheetBottomPadding();

  const props: BottomSheetProps = {
    index,
    onIndexChange: setIndex,
    scaleContent: false,
    contentTopInset: safeContent ? 'safeArea' : 0,
    contentTopInsetOffset: compensateHandle ? -HANDLE_HEIGHT - 8 : 0,
    detents: [
      0,
      {
        value: 320,
        insets: { left: 10, right: 10, bottom: 10 },
        borderTopRadius: 24,
        borderBottomRadius: 52,
      },
      { value: '100%', borderTopRadius: 16, borderBottomRadius: 62 },
      { value: 'fullscreen', borderRadius: 0 },
    ],
    surfaceStyle: { boxShadow: '0px -4px 16px rgba(0, 0, 0, 0.2)' },
    surface: <View style={styles.surface} />,
    children: (
      <View style={styles.content}>
        <View style={styles.header}>
          <SheetHeader
            title="Fullscreen surface, safe content"
            onClose={() => setIndex(0)}
          />
        </View>
        <View style={styles.buttons}>
          <Button
            title="Preview"
            disabled={index === 1}
            onPress={() => setIndex(1)}
          />
          <Button
            title="100%"
            disabled={index === 2}
            onPress={() => setIndex(2)}
          />
          <Button
            title="Fullscreen"
            disabled={index === 3}
            onPress={() => setIndex(3)}
          />
        </View>
        <ScrollView
          style={styles.list}
          contentContainerStyle={{ paddingBottom: bottomPadding }}
        >
          <Text style={styles.description}>
            100% stops the surface below the safe area. Fullscreen takes the
            surface to the host top while keeping content at its configured
            boundary. Scroll to the last row to check the content viewport.
          </Text>
          {Array.from({ length: 30 }, (_, row) => (
            <View key={row} style={styles.row}>
              <Text>
                {row === 29 ? 'Last row — fully reachable' : `Row ${row + 1}`}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    ),
  };

  return (
    <DemoScreen
      title="Fullscreen detents"
      backgroundColor="#94a3b8"
      sheet={
        mode === 'inline' ? (
          <BottomSheet {...props} />
        ) : (
          <ModalBottomSheet {...props} windowOverlay={mode === 'overlay'} />
        )
      }
    >
      <Text>Mode: {mode}. Close the sheet to change modes.</Text>
      <View style={styles.buttons}>
        {MODES.map((value) => (
          <Button
            key={value}
            title={value}
            onPress={() => {
              setIndex(0);
              setMode(value);
            }}
          />
        ))}
      </View>
      <View style={styles.buttons}>
        <Text>Keep content below the safe area</Text>
        <Switch value={safeContent} onValueChange={setSafeContent} />
      </View>
      <View style={styles.buttons}>
        <Text>Align below handle with safe area</Text>
        <Switch value={compensateHandle} onValueChange={setCompensateHandle} />
      </View>
      <Button title="Open preview" onPress={() => setIndex(1)} />
      <Button title="Open at 100%" onPress={() => setIndex(2)} />
      <Button title="Open fullscreen directly" onPress={() => setIndex(3)} />
    </DemoScreen>
  );
};

const styles = StyleSheet.create({
  surface: { ...StyleSheet.absoluteFill, backgroundColor: '#fef3c7' },
  content: { flex: 1 },
  header: { backgroundColor: '#fde68a' },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  list: { flex: 1 },
  description: { padding: 20 },
  row: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d6d3d1',
  },
});
