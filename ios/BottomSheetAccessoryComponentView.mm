#import "BottomSheetAccessoryComponentView.h"
#import "../common/cpp/react/renderer/components/ReactNativeBottomSheetSpec/ComponentDescriptors.h"

#import <React/RCTFabricComponentsPlugins.h>
#import <react/renderer/components/ReactNativeBottomSheetSpec/RCTComponentViewHelpers.h>

using namespace facebook::react;

@implementation BottomSheetAccessoryComponentView

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<BottomSheetAccessoryViewComponentDescriptor>();
}

@end

Class<RCTComponentViewProtocol> BottomSheetAccessoryViewCls(void)
{
  return BottomSheetAccessoryComponentView.class;
}
