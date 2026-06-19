import { codegenNativeComponent, type ViewProps } from 'react-native';

// Accessory view that tracks the sheet top but is laid out independently from
// the sheet container so it can sit above the sheet and optionally stop before
// the sheet reaches its tallest detent.
export interface NativeProps extends ViewProps {}

export default codegenNativeComponent<NativeProps>('BottomSheetAccessoryView');
