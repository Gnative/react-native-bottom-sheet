#pragma once

#include <react/renderer/components/ReactNativeBottomSheetSpec/ShadowNodes.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

class BottomSheetViewComponentDescriptor final
    : public ConcreteComponentDescriptor<BottomSheetViewShadowNode> {
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
};

} // namespace facebook::react
