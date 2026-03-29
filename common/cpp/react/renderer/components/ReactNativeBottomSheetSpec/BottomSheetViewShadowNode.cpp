#include "ShadowNodes.h"

namespace facebook::react {

Point BottomSheetViewShadowNode::getContentOriginOffset(
    bool /*includeTransform*/) const {
#ifdef ANDROID
  auto state =
      std::static_pointer_cast<const BottomSheetViewShadowNode::ConcreteState>(
          getState());
  return {0, state->getData().contentOffsetY};
#else
  return {0, 0};
#endif
}

} // namespace facebook::react
