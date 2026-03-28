import type { ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import { BottomSheet, type BottomSheetProps } from './BottomSheet';

export interface ModalBottomSheetProps
  extends Omit<BottomSheetProps, 'modal' | 'renderScrim'> {
  scrim?: (progress: SharedValue<number>) => ReactNode;
}

export const ModalBottomSheet = ({
  scrim,
  ...props
}: ModalBottomSheetProps) => (
  <BottomSheet {...props} modal renderScrim={scrim} />
);
