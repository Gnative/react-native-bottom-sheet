package com.swmansion.reactnativebottomsheet

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.BottomSheetSurfaceViewManagerDelegate
import com.facebook.react.viewmanagers.BottomSheetSurfaceViewManagerInterface

@ReactModule(name = BottomSheetSurfaceViewManager.NAME)
class BottomSheetSurfaceViewManager :
  ViewGroupManager<BottomSheetSurfaceView>(),
  BottomSheetSurfaceViewManagerInterface<BottomSheetSurfaceView> {

  companion object {
    const val NAME = "BottomSheetSurfaceView"
  }

  private val delegate = BottomSheetSurfaceViewManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<BottomSheetSurfaceView> = delegate

  override fun getName(): String = NAME

  override fun createViewInstance(context: ThemedReactContext): BottomSheetSurfaceView =
    BottomSheetSurfaceView(context)
}
