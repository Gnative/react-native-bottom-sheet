import { useState } from 'react';
import { Button, StyleSheet, Text, View, Pressable } from 'react-native';
import { BottomSheet } from '@swmansion/react-native-bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DemoScreen,
  SECTION_HEIGHT,
  SheetBackground,
  SheetHeader,
  useSheetBottomPadding,
} from '../demoShared';

const DETENTS = [0, 220, 420, 800] as const;
const ACCESSORY_MAX_DETENT = 700;

const SheetAccessory = () => {
  return (
    <View
      pointerEvents="box-none"
      style={{
        paddingHorizontal: 16,
        alignItems: 'center',
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
        marginBottom: 10,
        width: '100%',
      }}
    >
      <View
        style={{
          flex: 1,
          // minHeight: height,
          borderRadius: 5,
          backgroundColor: 'grey',
          padding: 10,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#4b5563' }}>
          ACCESSORY
        </Text>
        <Text style={{ marginTop: 6, fontSize: 15, color: '#111827' }}>
          Stops at {ACCESSORY_MAX_DETENT}pt while the sheet keeps opening.
        </Text>
      </View>

      <Pressable
        onPress={() => {
          console.log('Pressed');
        }}
        style={({ pressed }) => [
          {
            width: 40,
            height: 40,
            marginTop: 10,
            padding: 5,
            backgroundColor: 'blue',
            color: 'white',
            borderRadius: 5,
          },
          pressed && {
            backgroundColor: 'red',
          },
        ]}
      >
        <Text
          style={{
            color: 'white',
          }}
        >
          X
        </Text>
      </Pressable>
    </View>
  );
};

export const AccessoryViewScreen = () => {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const sheetBottomPadding = useSheetBottomPadding(0);

  return (
    <DemoScreen
      title="Accessory view"
      sheet={
        <BottomSheet
          detents={[...DETENTS]}
          index={index}
          accessory={<SheetAccessory />}
          accessoryMaxDetent={ACCESSORY_MAX_DETENT}
          accessoryMinDetent={insets.bottom + 20}
          onIndexChange={setIndex}
          surface={<SheetBackground style={StyleSheet.absoluteFill} />}
        >
          <SheetHeader title="Accessory view" onClose={() => setIndex(0)} />
          <View
            style={{
              height: SECTION_HEIGHT,
              paddingHorizontal: 20,
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '600' }}>
              Drag upward past the accessory clamp
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 22, color: '#555' }}>
              The accessory follows the sheet until 260pt. After that it stays
              parked while the sheet slides over it.
            </Text>
          </View>
          <View
            style={{
              height: SECTION_HEIGHT,
              paddingHorizontal: 20,
              justifyContent: 'center',
              borderTopWidth: 1,
              borderTopColor: '#eee',
            }}
          >
            <Text style={{ fontSize: 15, lineHeight: 22, color: '#555' }}>
              Because the accessory is a separate native child, it stays in
              lockstep with drag and settle animations without a JS follower.
            </Text>
          </View>
          <View
            style={{
              height: SECTION_HEIGHT + sheetBottomPadding,
              paddingHorizontal: 20,
              paddingBottom: sheetBottomPadding,
              justifyContent: 'center',
              borderTopWidth: 1,
              borderTopColor: '#eee',
            }}
          >
            <Text style={{ fontSize: 15, lineHeight: 22, color: '#555' }}>
              Snap between detents or drag freely to see where the accessory
              stops and where the sheet continues.
            </Text>
          </View>
        </BottomSheet>
      }
    >
      <View style={{ gap: 12 }}>
        <Button title="Close" onPress={() => setIndex(0)} />
        <Button title="Open preview" onPress={() => setIndex(1)} />
        <Button title="Open tall detent" onPress={() => setIndex(2)} />
        <Button title="Open content detent" onPress={() => setIndex(3)} />
      </View>
      <View
        style={{
          padding: 16,
          borderRadius: 16,
          backgroundColor: '#f3f3f3',
          gap: 6,
        }}
      >
        <Text style={{ fontWeight: '600' }}>Current state</Text>
        <Text>detents: [{`0, 220, 420, 'content'`}]</Text>
        <Text>accessoryMaxDetent: {ACCESSORY_MAX_DETENT}pt</Text>
        <Text>index: {index}</Text>
      </View>
    </DemoScreen>
  );
};
