package com.swmansion.reactnativebottomsheet

import android.content.Context
import android.view.View
import com.facebook.react.views.view.ReactViewGroup

// Visual surface that sits behind the sheet content. It carries no behavior of
// its own; the BottomSheetView identifies it by this type and owns its geometry,
// laying it out to cover the full sheet so a content shrink never exposes blank
// space. Its React children provide the appearance only.
class BottomSheetSurfaceView(context: Context) : ReactViewGroup(context) {

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    val width = right - left
    val height = bottom - top
    for (index in 0 until childCount) {
      val child: View = getChildAt(index)
      child.layout(0, 0, width, height)
    }
  }
}
