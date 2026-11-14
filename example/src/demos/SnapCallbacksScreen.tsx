import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@swmansion/react-native-bottom-sheet';

import {
  DemoScreen,
  SECTION_HEIGHT,
  SHEET_HEADER_HEIGHT,
  SheetBackground,
  SheetHeader,
  useSheetBottomPadding,
} from '../demoShared';

type SnapEventSource =
  'press' | 'resize' | 'indexChange' | 'settle' | 'dragStart' | 'dragEnd';
type SnapEvent = { id: number; source: SnapEventSource; index: number };

const SNAP_EVENT_LABEL: Record<SnapEventSource, string> = {
  dragStart: '↕ onDragStart — pan accepted',
  dragEnd: '◇ onDragEnd — pan ended',
  press: '⊙ setIndex — programmatic begin',
  resize: '↔ content height — toggled by 100',
  indexChange: '▶ onIndexChange — snap committed',
  settle: '■ onSettle — movement ended',
};

const SNAP_EVENT_COLOR: Record<SnapEventSource, string> = {
  dragStart: '#9333ea',
  dragEnd: '#be185d',
  press: '#8a5a1a',
  resize: '#0369a1',
  indexChange: '#1f6feb',
  settle: '#1a8a4a',
};

export const SnapCallbacksScreen = () => {
  const [index, setIndex] = useState(0);
  const [extraHeight, setExtraHeight] = useState(0);
  const [events, setEvents] = useState<SnapEvent[]>([]);
  const nextEventId = useRef(0);
  const sheetBottomPadding = useSheetBottomPadding(0);

  const logEvent = (source: SnapEventSource, eventIndex: number) => {
    setEvents((prev) =>
      [{ id: nextEventId.current++, source, index: eventIndex }, ...prev].slice(
        0,
        12
      )
    );
  };

  const snapTo = (nextIndex: number) => {
    // For a programmatic snap the "begin" moment is right here, at the call
    // site, so no callback is needed for it. onSettle still reports the end.
    logEvent('press', nextIndex);
    setIndex(nextIndex);
  };

  return (
    <DemoScreen
      title="Snap lifecycle callbacks"
      sheet={
        <BottomSheet
          detents={[0, SHEET_HEADER_HEIGHT + SECTION_HEIGHT, 'content']}
          index={index}
          onIndexChange={(nextIndex) => {
            // Fires the instant a user-driven drag commits to a detent, before
            // the animation settles. Keep controlled state in sync here.
            logEvent('indexChange', nextIndex);
            setIndex(nextIndex);
          }}
          onSettle={(nextIndex) => logEvent('settle', nextIndex)}
          onDragStart={() => logEvent('dragStart', index)}
          onDragEnd={() => logEvent('dragEnd', index)}
          surface={<SheetBackground style={StyleSheet.absoluteFill} />}
        >
          <SheetHeader
            title="Snap lifecycle callbacks"
            onClose={() => snapTo(0)}
          />
          <View
            style={{
              minHeight: SECTION_HEIGHT + sheetBottomPadding + extraHeight,
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: sheetBottomPadding,
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '600' }}>
              Drag the sheet or use the buttons
            </Text>
            <Button
              title={extraHeight === 0 ? 'Add 100 height' : 'Remove 100 height'}
              onPress={() => {
                logEvent('resize', index);
                setExtraHeight((height) => (height === 0 ? 100 : 0));
              }}
            />
            <Text>
              Snap to content (index 2), then toggle the height. Each completed
              resize should log onSettle at index 2 without onIndexChange.
            </Text>
            <Text style={{ fontSize: 15, lineHeight: 22, color: '#555' }}>
              onDragStart and onDragEnd bracket the accepted drag, including
              cancellation. onIndexChange fires when a drag commits; onSettle
              fires when the sheet arrives. For a programmatic snap the begin
              moment is the button press itself, so only onSettle follows.
            </Text>
            <View style={{ height: extraHeight }} />
          </View>
        </BottomSheet>
      }
    >
      <View style={{ gap: 12 }}>
        <Button title="Snap to collapsed" onPress={() => snapTo(0)} />
        <Button title="Snap to preview" onPress={() => snapTo(1)} />
        <Button title="Snap to content" onPress={() => snapTo(2)} />
      </View>
      <View
        style={{
          padding: 16,
          borderRadius: 16,
          backgroundColor: '#f3f3f3',
          gap: 8,
        }}
      >
        <Text style={{ fontWeight: '600' }}>Event log (newest first)</Text>
        {events.length === 0 ? (
          <Text style={{ color: '#888' }}>
            No events yet. Drag the sheet or tap a button.
          </Text>
        ) : (
          events.map((event) => (
            <Text
              key={event.id}
              style={{
                fontVariant: ['tabular-nums'],
                color: SNAP_EVENT_COLOR[event.source],
              }}
            >
              {SNAP_EVENT_LABEL[event.source]} → index {event.index}
            </Text>
          ))
        )}
      </View>
    </DemoScreen>
  );
};
