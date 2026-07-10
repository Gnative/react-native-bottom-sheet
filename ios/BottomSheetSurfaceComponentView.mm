#import "BottomSheetSurfaceComponentView.h"

#import "../common/cpp/react/renderer/components/ReactNativeBottomSheetSpec/ComponentDescriptors.h"

#import <React/RCTFabricComponentsPlugins.h>

using namespace facebook::react;

@implementation BottomSheetSurfaceComponentView

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<BottomSheetSurfaceViewComponentDescriptor>();
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  UIView *contentView = self.contentView;
  if (contentView != nil) {
    contentView.frame = self.bounds;
  }
  for (UIView *subview in contentView.subviews) {
    subview.frame = contentView.bounds;
  }
}

@end

Class<RCTComponentViewProtocol> BottomSheetSurfaceViewCls(void)
{
  return BottomSheetSurfaceComponentView.class;
}
