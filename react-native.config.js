module.exports = {
  dependency: {
    platforms: {
      android: {
        libraryName: 'ReactNativeBottomSheetSpec',
        componentDescriptors: [
          'BottomSheetViewComponentDescriptor',
          'BottomSheetSurfaceViewComponentDescriptor',
        ],
        cmakeListsPath: 'src/main/jni/CMakeLists.txt',
      },
    },
  },
};
