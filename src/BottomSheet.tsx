import { useState, type ReactNode } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  runOnUI,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomSheetNativeComponent from './BottomSheetNativeComponent';
import { Portal } from './BottomSheetProvider';
import { type Detent, resolveDetent } from './bottomSheetUtils';
export type { Detent, DetentValue } from './bottomSheetUtils';
export { programmatic } from './bottomSheetUtils';

const DefaultScrim = ({ progress }: { progress: SharedValue<number> }) => {
  const style = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
        style,
      ]}
    />
  );
};

export interface BottomSheetProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  detents?: Detent[];
  index: number;
  animateIn?: boolean;
  onIndexChange?: (index: number) => void;
  position?: SharedValue<number>;
  modal?: boolean;
  renderScrim?: (progress: SharedValue<number>) => ReactNode;
}

export const BottomSheet = ({
  children,
  style,
  detents = [0, 'max'],
  index,
  animateIn = true,
  onIndexChange,
  position,
  modal = false,
  renderScrim,
}: BottomSheetProps) => {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const maxHeight = screenHeight - insets.top;
  const [contentHeight, setContentHeight] = useState(0);
  const internalPosition = useSharedValue(0);

  const resolvedDetents = detents.map((detent) => {
    const value = resolveDetent(detent, contentHeight, maxHeight);
    return {
      height: Math.max(0, Math.min(value, maxHeight)),
      programmatic: isDetentProgrammatic(detent),
    };
  });

  const handleSentinelLayout = (event: LayoutChangeEvent) => {
    setContentHeight(event.nativeEvent.layout.y);
  };

  const clampedIndex = Math.max(0, Math.min(index, resolvedDetents.length - 1));
  const isCollapsed = (resolvedDetents[clampedIndex]?.height ?? 0) === 0;
  const sheetPointerEvents = isCollapsed ? 'none' : 'box-none';
  const scrimPosition = position ?? internalPosition;
  const firstNonzeroDetent =
    resolvedDetents.find((detent) => detent.height > 0)?.height ?? 0;
  const scrimProgress = useDerivedValue(() => {
    if (firstNonzeroDetent <= 0) {
      return 0;
    }

    const progress = scrimPosition.value / firstNonzeroDetent;
    return Math.min(1, Math.max(0, progress));
  });

  const handleIndexChange = (event: { nativeEvent: { index: number } }) => {
    onIndexChange?.(event.nativeEvent.index);
  };

  const handlePositionChange = (event: {
    nativeEvent: { position: number };
  }) => {
    if (position !== undefined) {
      const height = event.nativeEvent.position;
      runOnUI(() => {
        'worklet';
        position.set(height);
      })();
      return;
    }

    const height = event.nativeEvent.position;
    runOnUI(() => {
      'worklet';
      internalPosition.set(height);
    })();
  };

  const closedIndex = resolvedDetents.findIndex(
    (detent) => detent.height === 0
  );
  const handleScrimPress = () => {
    if (closedIndex === -1 || clampedIndex === closedIndex) {
      return;
    }

    onIndexChange?.(closedIndex);
  };

  const scrimElement =
    renderScrim !== undefined ? (
      renderScrim(scrimProgress)
    ) : modal ? (
      <DefaultScrim progress={scrimProgress} />
    ) : null;

  const sheet = (
    <Animated.View
      style={StyleSheet.absoluteFill}
      pointerEvents={modal ? (isCollapsed ? 'none' : 'auto') : 'box-none'}
    >
      {modal && scrimElement !== null ? (
        <Pressable style={StyleSheet.absoluteFill} onPress={handleScrimPress}>
          {scrimElement}
        </Pressable>
      ) : null}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <BottomSheetNativeComponent
          pointerEvents={sheetPointerEvents}
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: maxHeight,
            },
            style,
          ]}
          detents={resolvedDetents}
          index={index}
          animateIn={animateIn}
          onIndexChange={handleIndexChange}
          onPositionChange={handlePositionChange}
        >
          <View
            collapsable={false}
            style={{ flex: 1 }}
            pointerEvents="box-none"
          >
            {children}
            <View onLayout={handleSentinelLayout} pointerEvents="none" />
          </View>
        </BottomSheetNativeComponent>
      </View>
    </Animated.View>
  );

  if (modal) {
    return <Portal>{sheet}</Portal>;
  }

  return sheet;
};

function isDetentProgrammatic(detent: Detent): boolean {
  if (typeof detent === 'object' && detent !== null) {
    return detent.programmatic === true;
  }
  return false;
}
