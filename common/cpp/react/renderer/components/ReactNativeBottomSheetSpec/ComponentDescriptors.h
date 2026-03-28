#pragma once

#include <react/renderer/components/ReactNativeBottomSheetSpec/ShadowNodes.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

class BottomSheetViewComponentDescriptor final
    : public ConcreteComponentDescriptor<BottomSheetViewShadowNode> {
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  void adopt(ShadowNode& shadowNode) const override {
    auto& node = static_cast<BottomSheetViewShadowNode&>(shadowNode);
    node.adjustLayoutWithState();
    ConcreteComponentDescriptor::adopt(shadowNode);
  }
};

} // namespace facebook::react
