#pragma once

#include <jsi/jsi.h>
#include <react/renderer/components/ReactNativeBottomSheetSpec/BottomSheetViewState.h>
#include <react/renderer/components/ReactNativeBottomSheetSpec/EventEmitters.h>
#include <react/renderer/components/ReactNativeBottomSheetSpec/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {

JSI_EXPORT extern const char BottomSheetViewComponentName[];

class JSI_EXPORT BottomSheetViewShadowNode final
    : public ConcreteViewShadowNode<
          BottomSheetViewComponentName,
          BottomSheetViewProps,
          BottomSheetViewEventEmitter,
          BottomSheetViewState> {
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

 public:
  void adjustLayoutWithState();
};

} // namespace facebook::react
