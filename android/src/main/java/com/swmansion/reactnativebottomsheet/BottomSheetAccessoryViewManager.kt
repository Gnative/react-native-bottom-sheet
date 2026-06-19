package com.swmansion.reactnativebottomsheet

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.BottomSheetAccessoryViewManagerDelegate
import com.facebook.react.viewmanagers.BottomSheetAccessoryViewManagerInterface

@ReactModule(name = BottomSheetAccessoryViewManager.NAME)
class BottomSheetAccessoryViewManager :
  ViewGroupManager<BottomSheetAccessoryView>(),
  BottomSheetAccessoryViewManagerInterface<BottomSheetAccessoryView> {

  companion object {
    const val NAME = "BottomSheetAccessoryView"
  }

  private val delegate = BottomSheetAccessoryViewManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<BottomSheetAccessoryView> = delegate

  override fun getName(): String = NAME

  override fun createViewInstance(context: ThemedReactContext): BottomSheetAccessoryView =
    BottomSheetAccessoryView(context)
}
