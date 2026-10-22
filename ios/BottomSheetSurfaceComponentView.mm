#import "BottomSheetSurfaceComponentView.h"

#import "../common/cpp/react/renderer/components/ReactNativeBottomSheetSpec/ComponentDescriptors.h"

#import <React/RCTFabricComponentsPlugins.h>
#import <react/renderer/components/ReactNativeBottomSheetSpec/Props.h>

using namespace facebook::react;

@implementation BottomSheetSurfaceComponentView

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const BottomSheetSurfaceViewProps>();
    _props = defaultProps;
  }
  return self;
}

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
