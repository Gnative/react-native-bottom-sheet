import { useMemo, useState } from 'react';
import { Button, FlatList, ScrollView, Text, View } from 'react-native';
import {
  BottomSheet,
  ModalBottomSheet,
} from '@swmansion/react-native-bottom-sheet';

import {
  DemoScreen,
  DATA,
  INLINE_FLATLIST_PREVIEW_ITEMS,
  LIST_ITEM_HEIGHT,
  ListRow,
  MODAL_SCRIM_COLOR,
  SECTION_HEIGHT,
  SHEET_HEADER_HEIGHT,
  SheetBackground,
  SheetHeader,
} from './demoShared';

export type CaseKey =
  | 'basic-modal'
  | 'modal-scroll-view'
  | 'modal-flat-list'
  | 'inline-detents'
  | 'inline-flat-list'
  | 'dynamic-detents';

export type DemoCase = {
  key: CaseKey;
  title: string;
  description: string;
  href: `/${CaseKey}`;
};

export const BasicModalScreen = () => {
  const [index, setIndex] = useState(0);

  return (
    <DemoScreen
      title="Basic modal"
      sheet={
        <ModalBottomSheet
          index={index}
          onIndexChange={setIndex}
          scrimColor={MODAL_SCRIM_COLOR}
        >
          <SheetBackground>
            <SheetHeader title="Basic modal" onClose={() => setIndex(0)} />
            <View
              style={{
                height: SECTION_HEIGHT,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text>Swipe down or tap scrim to dismiss</Text>
            </View>
          </SheetBackground>
        </ModalBottomSheet>
      }
    >
      <Button title="Open sheet" onPress={() => setIndex(1)} />
    </DemoScreen>
  );
};

export const ModalScrollViewScreen = () => {
  const [index, setIndex] = useState(0);

  return (
    <DemoScreen
      title="Modal with ScrollView"
      sheet={
        <ModalBottomSheet
          index={index}
          onIndexChange={setIndex}
          scrimColor={MODAL_SCRIM_COLOR}
        >
          <SheetBackground style={{ flex: 1 }}>
            <SheetHeader
              title="Modal with ScrollView"
              onClose={() => setIndex(0)}
            />
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              {DATA.map((item, itemIndex) => (
                <ListRow key={item.id} item={item} index={itemIndex} />
              ))}
            </ScrollView>
          </SheetBackground>
        </ModalBottomSheet>
      }
    >
      <Button title="Open sheet" onPress={() => setIndex(1)} />
    </DemoScreen>
  );
};

export const ModalFlatListScreen = () => {
  const [index, setIndex] = useState(0);

  return (
    <DemoScreen
      title="Modal with FlatList"
      sheet={
        <ModalBottomSheet
          index={index}
          onIndexChange={setIndex}
          scrimColor={MODAL_SCRIM_COLOR}
        >
          <SheetBackground style={{ flex: 1 }}>
            <SheetHeader
              title="Modal with FlatList"
              onClose={() => setIndex(0)}
            />
            <FlatList
              data={DATA}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item, index: itemIndex }) => (
                <ListRow item={item} index={itemIndex} />
              )}
            />
          </SheetBackground>
        </ModalBottomSheet>
      }
    >
      <Button title="Open sheet" onPress={() => setIndex(1)} />
    </DemoScreen>
  );
};

export const InlineDetentsScreen = () => {
  const [index, setIndex] = useState(0);

  return (
    <DemoScreen
      title="Inline with detents"
      sheet={
        <BottomSheet
          detents={[0, SHEET_HEADER_HEIGHT + SECTION_HEIGHT, 'content']}
          index={index}
          onIndexChange={setIndex}
        >
          <SheetBackground>
            <SheetHeader
              title="Inline with detents"
              onClose={() => setIndex(0)}
            />
            <View
              style={{
                height: SECTION_HEIGHT,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text>Section 1</Text>
            </View>
            <View
              style={{
                height: SECTION_HEIGHT,
                alignItems: 'center',
                justifyContent: 'center',
                borderTopWidth: 1,
                borderTopColor: '#eee',
              }}
            >
              <Text>Section 2</Text>
            </View>
          </SheetBackground>
        </BottomSheet>
      }
    >
      <Button title="Open sheet" onPress={() => setIndex(1)} />
    </DemoScreen>
  );
};

export const InlineFlatListScreen = () => {
  const [index, setIndex] = useState(0);

  return (
    <DemoScreen
      title="Inline with FlatList"
      sheet={
        <BottomSheet
          detents={[
            0,
            SHEET_HEADER_HEIGHT +
              LIST_ITEM_HEIGHT * INLINE_FLATLIST_PREVIEW_ITEMS,
            'content',
          ]}
          index={index}
          onIndexChange={setIndex}
        >
          <SheetBackground style={{ flex: 1 }}>
            <SheetHeader
              title="Inline with FlatList"
              onClose={() => setIndex(0)}
            />
            <FlatList
              data={DATA}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item, index: itemIndex }) => (
                <ListRow item={item} index={itemIndex} />
              )}
            />
          </SheetBackground>
        </BottomSheet>
      }
    >
      <Button title="Open sheet" onPress={() => setIndex(1)} />
    </DemoScreen>
  );
};

export const DynamicDetentsScreen = () => {
  const [index, setIndex] = useState(0);
  const [middleDetent, setMiddleDetent] = useState(200);
  const [position, setPosition] = useState(0);
  const detents = useMemo(
    () => [0, middleDetent, 'content'] as const,
    [middleDetent]
  );

  return (
    <DemoScreen
      title="Dynamic detent updates"
      sheet={
        <BottomSheet
          detents={[...detents]}
          index={index}
          onIndexChange={setIndex}
          onPositionChange={setPosition}
        >
          <SheetBackground>
            <SheetHeader
              title="Dynamic detent updates"
              onClose={() => setIndex(0)}
            />
            <View
              style={{
                height: 360,
                paddingHorizontal: 20,
                justifyContent: 'center',
                gap: 12,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '600' }}>
                Watch the middle detent animate
              </Text>
              <Text style={{ fontSize: 15, lineHeight: 22, color: '#555' }}>
                With the sheet at index 1, tap the 200pt and 300pt buttons
                above. The active detent should transition smoothly between the
                two heights.
              </Text>
            </View>
          </SheetBackground>
        </BottomSheet>
      }
    >
      <View style={{ gap: 12 }}>
        <Button title="Open at index 1" onPress={() => setIndex(1)} />
        <Button title="Expand to content" onPress={() => setIndex(2)} />
        <Button title="Collapse" onPress={() => setIndex(0)} />
      </View>
      <View style={{ gap: 12 }}>
        <Button
          title="Use 200pt middle detent"
          onPress={() => setMiddleDetent(200)}
        />
        <Button
          title="Use 300pt middle detent"
          onPress={() => setMiddleDetent(300)}
        />
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
        <Text>detents: [{`0, ${middleDetent}, 'content'`}]</Text>
        <Text>index: {index}</Text>
        <Text>position: {position.toFixed(0)}pt</Text>
      </View>
    </DemoScreen>
  );
};

export const DEMO_CASES: DemoCase[] = [
  {
    key: 'basic-modal',
    title: 'Basic modal',
    description: 'Simple modal bottom sheet with a fixed-height body.',
    href: '/basic-modal',
  },
  {
    key: 'modal-scroll-view',
    title: 'Modal with ScrollView',
    description: 'Modal bottom sheet containing a vertical ScrollView.',
    href: '/modal-scroll-view',
  },
  {
    key: 'modal-flat-list',
    title: 'Modal with FlatList',
    description: 'Modal bottom sheet containing a FlatList.',
    href: '/modal-flat-list',
  },
  {
    key: 'inline-detents',
    title: 'Inline with detents',
    description: 'Inline sheet with fixed and content detents.',
    href: '/inline-detents',
  },
  {
    key: 'inline-flat-list',
    title: 'Inline with FlatList',
    description: 'Inline sheet with FlatList content and preview detent.',
    href: '/inline-flat-list',
  },
  {
    key: 'dynamic-detents',
    title: 'Dynamic detent updates',
    description:
      'Toggle the middle detent while index 1 is active to verify animated updates.',
    href: '/dynamic-detents',
  },
];
