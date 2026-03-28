#include "ShadowNodes.h"

#include <yoga/Yoga.h>

namespace facebook::react {

void BottomSheetViewShadowNode::adjustLayoutWithState() {
#ifdef ANDROID
  ensureUnsealed();

  auto state =
      std::static_pointer_cast<const BottomSheetViewShadowNode::ConcreteState>(
          getState());
  auto stateData = state->getData();

  auto adjustedStyle = getConcreteProps().yogaStyle;
  auto newPaddingTop =
      yoga::Style::Length::points(stateData.contentOffsetY);

  if (adjustedStyle.padding(yoga::Edge::Top) != newPaddingTop) {
    adjustedStyle.setPadding(yoga::Edge::Top, newPaddingTop);
    yogaNode_.setStyle(adjustedStyle);
    yogaNode_.setDirty(true);
  }
#endif
}

} // namespace facebook::react
