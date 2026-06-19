module.exports = {
  dependency: {
    platforms: {
      android: {
        libraryName: 'ReactNativeBottomSheetSpec',
        componentDescriptors: [
          'BottomSheetViewComponentDescriptor',
          'BottomSheetAccessoryViewComponentDescriptor',
          'BottomSheetSurfaceViewComponentDescriptor',
        ],
        cmakeListsPath: 'src/main/jni/CMakeLists.txt',
      },
    },
  },
};
