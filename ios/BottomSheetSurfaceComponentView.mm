#import "BottomSheetSurfaceComponentView.h"

#import "../common/cpp/react/renderer/components/ReactNativeBottomSheetSpec/ComponentDescriptors.h"

#import <React/RCTFabricComponentsPlugins.h>

using namespace facebook::react;

@implementation BottomSheetSurfaceComponentView

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<BottomSheetSurfaceViewComponentDescriptor>();
}

@end

Class<RCTComponentViewProtocol> BottomSheetSurfaceViewCls(void)
{
  return BottomSheetSurfaceComponentView.class;
}
