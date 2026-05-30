#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

// Visual surface that sits behind the sheet content. It carries no behavior of
// its own; the bottom sheet host identifies it by this type and owns its
// geometry. Its React children provide the appearance only.
@interface BottomSheetSurfaceComponentView : RCTViewComponentView

@end

NS_ASSUME_NONNULL_END
