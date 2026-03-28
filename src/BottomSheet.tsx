import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomSheetNativeComponent from './BottomSheetNativeComponent';
import { Portal } from './BottomSheetProvider';
import { type Detent, resolveDetent } from './bottomSheetUtils';
export type { Detent, DetentValue } from './bottomSheetUtils';
export { programmatic } from './bottomSheetUtils';

const DefaultScrim = ({
  progress,
  color,
}: {
  progress: Animated.Value;
  color: string;
}) => {
  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { flex: 1, backgroundColor: color, opacity: progress },
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
  onPositionChange?: (position: number) => void;
  modal?: boolean;
  scrimColor?: string;
}

export const BottomSheet = ({
  children,
  style,
  detents = [0, 'max'],
  index,
  animateIn = true,
  onIndexChange,
  onPositionChange,
  modal = false,
  scrimColor = 'rgba(0, 0, 0, 0.5)',
}: BottomSheetProps) => {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const maxHeight = screenHeight - insets.top;
  const [contentHeight, setContentHeight] = useState(0);
  const currentPositionRef = useRef(0);
  const scrimProgress = useRef(new Animated.Value(0)).current;

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
  const scrimPressEnabledRef = useRef(!modal || isCollapsed);
  const previousIsCollapsedRef = useRef(isCollapsed);
  const firstNonzeroDetent =
    resolvedDetents.find((detent) => detent.height > 0)?.height ?? 0;

  useEffect(() => {
    const progress =
      firstNonzeroDetent <= 0
        ? 0
        : Math.min(
            1,
            Math.max(0, currentPositionRef.current / firstNonzeroDetent)
          );
    scrimProgress.setValue(progress);
  }, [firstNonzeroDetent, scrimProgress]);

  useEffect(() => {
    if (!modal) {
      scrimPressEnabledRef.current = true;
      previousIsCollapsedRef.current = isCollapsed;
      return undefined;
    }

    if (previousIsCollapsedRef.current && !isCollapsed) {
      scrimPressEnabledRef.current = false;
      previousIsCollapsedRef.current = isCollapsed;

      const frame = requestAnimationFrame(() => {
        scrimPressEnabledRef.current = true;
      });

      return () => cancelAnimationFrame(frame);
    }

    scrimPressEnabledRef.current = !isCollapsed;
    previousIsCollapsedRef.current = isCollapsed;
    return undefined;
  }, [isCollapsed, modal]);

  const handleIndexChange = (event: { nativeEvent: { index: number } }) => {
    onIndexChange?.(event.nativeEvent.index);
  };

  const handlePositionChange = (event: {
    nativeEvent: { position: number };
  }) => {
    const height = event.nativeEvent.position;
    currentPositionRef.current = height;
    const progress =
      firstNonzeroDetent <= 0
        ? 0
        : Math.min(1, Math.max(0, height / firstNonzeroDetent));
    scrimProgress.setValue(progress);
    onPositionChange?.(height);
  };

  const closedIndex = resolvedDetents.findIndex(
    (detent) => detent.height === 0
  );
  const handleScrimPress = () => {
    if (
      closedIndex === -1 ||
      clampedIndex === closedIndex ||
      !scrimPressEnabledRef.current
    ) {
      return;
    }

    onIndexChange?.(closedIndex);
  };

  const scrimElement = modal ? (
    <DefaultScrim progress={scrimProgress} color={scrimColor} />
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
