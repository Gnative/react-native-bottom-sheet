import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DEMO_CASES } from '../src/demoCases';
import { CaseButton } from '../src/demoShared';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 20,
        backgroundColor: 'white',
      }}
    >
      <FlatList
        data={DEMO_CASES}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{
          gap: 12,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
        }}
        renderItem={({ item }) => (
          <CaseButton
            title={item.title}
            onPress={() => router.push(item.href)}
          />
        )}
      />
    </View>
  );
}
