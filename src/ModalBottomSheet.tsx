import { BottomSheet, type BottomSheetProps } from './BottomSheet';

export interface ModalBottomSheetProps
  extends Omit<BottomSheetProps, 'modal'> {}

export const ModalBottomSheet = (props: ModalBottomSheetProps) => (
  <BottomSheet {...props} modal />
);
