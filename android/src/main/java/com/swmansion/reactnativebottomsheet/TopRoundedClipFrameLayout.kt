package com.swmansion.reactnativebottomsheet

import android.content.Context
import android.graphics.Canvas
import android.graphics.Outline
import android.graphics.Path
import android.os.Build
import android.view.View
import android.view.ViewOutlineProvider
import android.widget.FrameLayout
import kotlin.math.min

/** Clips children to rounded top corners while leaving the host un-clipped for shadows. */
internal class TopRoundedClipFrameLayout(context: Context) : FrameLayout(context) {
  private val clipPath = Path()
  private var topCornerRadius = 0f

  init {
    // Android 12+ can use a hardware outline for this convex path. Android 11
    // does not reliably clip a custom outline during translated animations, so
    // it uses the identical canvas path in dispatchDraw instead.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      outlineProvider =
        object : ViewOutlineProvider() {
          override fun getOutline(view: View, outline: Outline) {
            if (topCornerRadius <= 0f || width <= 0 || height <= 0) {
              outline.setRect(0, 0, width, height)
            } else {
              outline.setConvexPath(clipPath)
            }
          }
        }
    }
  }

  fun setTopCornerRadius(radius: Float) {
    val resolvedRadius = radius.coerceAtLeast(0f)
    if (topCornerRadius == resolvedRadius) return
    topCornerRadius = resolvedRadius
    rebuildClipPath()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      // Do not clip a square/fullscreen surface: it may intentionally extend
      // above this container for status-bar coverage.
      clipToOutline = resolvedRadius > 0f
      invalidateOutline()
    }
    invalidate()
  }

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    rebuildClipPath()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) invalidateOutline()
  }

  override fun dispatchDraw(canvas: Canvas) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S || topCornerRadius <= 0f) {
      super.dispatchDraw(canvas)
      return
    }
    val save = canvas.save()
    canvas.clipPath(clipPath)
    super.dispatchDraw(canvas)
    canvas.restoreToCount(save)
  }

  private fun rebuildClipPath() {
    clipPath.reset()
    val radius = min(topCornerRadius, min(width, height).toFloat() / 2f)
    if (width <= 0 || height <= 0 || radius <= 0f) {
      clipPath.addRect(0f, 0f, width.toFloat(), height.toFloat(), Path.Direction.CW)
      return
    }
    clipPath.addRoundRect(
      0f,
      0f,
      width.toFloat(),
      height.toFloat(),
      floatArrayOf(radius, radius, radius, radius, 0f, 0f, 0f, 0f),
      Path.Direction.CW,
    )
  }
}
