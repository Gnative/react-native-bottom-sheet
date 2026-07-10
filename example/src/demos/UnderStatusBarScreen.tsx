import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@swmansion/react-native-bottom-sheet';

import {
  DemoScreen,
  SheetBackground,
  SheetHeader,
  useSheetBottomPadding,
} from '../demoShared';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const UnderStatusBarScreen = () => {
  const [index, setIndex] = useState(0);
  const insets = useSafeAreaInsets()
  const [extendUnderStatusBar, setExtendUnderStatusBar] = useState(false);
  const [useFullscreenDetent, setUseFullscreenDetent] = useState(false);
  const [fullscreenTopOffset, setFullscreenTopOffset] = useState(insets.top - 30);
  const sheetBottomPadding = useSheetBottomPadding();

  const openSheet = (
    nextExtendUnderStatusBar: boolean,
    nextUseFullscreenDetent: boolean = false,
    nextFullscreenTopOffset: number = insets.top - 30
  ) => {
    setExtendUnderStatusBar(nextExtendUnderStatusBar);
    setUseFullscreenDetent(nextUseFullscreenDetent);
    setFullscreenTopOffset(nextFullscreenTopOffset);
    setIndex(1);
  };

  return (
    <DemoScreen
      title="Under status bar"
      sheet={
        <BottomSheet
          extendUnderStatusBar={extendUnderStatusBar}
          fullscreenTopOffset={fullscreenTopOffset}
          detents={useFullscreenDetent ? [0, 'fullscreen'] : [0, 'content']}
          index={index}
          onIndexChange={setIndex}
          surface={
            <SheetBackground
              style={[
                StyleSheet.absoluteFill,
                {
                  borderTopLeftRadius: extendUnderStatusBar ? 0 : 16,
                  borderTopRightRadius: extendUnderStatusBar ? 0 : 16,
                  borderWidth:1,
                },
              ]}
            />
          }
        >
          <View style={{ flex: 1, borderWidth:1, borderColor:'red' }}>
            <View>
              <SheetHeader
                title="Under status bar"
                onClose={() => setIndex(0)}
              />
            </View>
            <View
              style={{
                flex: 1,
                paddingHorizontal: 20,
                paddingTop: 24,
                paddingBottom: sheetBottomPadding,
                gap: 16,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '600' }}>
                {useFullscreenDetent
                  ? `Fullscreen detent stops ${fullscreenTopOffset}pt from the top.`
                  : extendUnderStatusBar
                    ? 'Sheet can use the full screen height.'
                    : 'Sheet is capped below the status bar.'}
              </Text>
              <Text style={{ fontSize: 15, lineHeight: 22, color: '#555' }}>
                Open each mode and compare the sheet top edge. The blue header
                includes status-bar padding, so it visibly reaches the top only
                when the top cap is relaxed.
              </Text>
            </View>
          </View>
        </BottomSheet>
      }
    >
      <Button title="Open below status bar" onPress={() => openSheet(false)} />
      <Button title="Open under status bar" onPress={() => openSheet(true)} />
      <Button title="Open fullscreen detent" onPress={() => openSheet(false, true)} />
      <Button
        title="Open 22pt from top"
        onPress={() => openSheet(false, true, 22)}
      />
      <Text>extendUnderStatusBar: {String(extendUnderStatusBar)}</Text>
      <Text>useFullscreenDetent: {String(useFullscreenDetent)}</Text>
      <Text>fullscreenTopOffset: {fullscreenTopOffset}</Text>
      <Text>
        detents: [{useFullscreenDetent ? `0, 'fullscreen'` : `0, 'content'`}]
      </Text>
    </DemoScreen>
  );
};
