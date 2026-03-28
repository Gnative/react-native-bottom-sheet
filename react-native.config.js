module.exports = {
  dependency: {
    platforms: {
      android: {
        libraryName: 'ReactNativeBottomSheetSpec',
        componentDescriptors: ['BottomSheetViewComponentDescriptor'],
        cmakeListsPath: 'src/main/jni/CMakeLists.txt',
      },
    },
  },
};
