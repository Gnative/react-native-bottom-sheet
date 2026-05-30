import { codegenNativeComponent, type ViewProps } from 'react-native';

// The visual surface that sits behind the sheet content. It carries no props of
// its own: the library identifies it by component type and owns its geometry,
// sizing it to cover the full sheet so a content shrink never exposes blank
// space. Its React children provide the visual appearance only.
export interface NativeProps extends ViewProps {}

export default codegenNativeComponent<NativeProps>('BottomSheetSurfaceView');
