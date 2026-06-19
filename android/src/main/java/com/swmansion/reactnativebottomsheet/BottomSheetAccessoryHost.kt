package com.swmansion.reactnativebottomsheet

import android.view.View
import android.view.ViewGroup

internal class BottomSheetAccessoryHost(
  private val owner: ViewGroup,
  private val sheetContainer: ViewGroup,
  private val attachView: (View) -> Unit,
  private val detachView: (View) -> Unit,
  private val requestLayoutSync: () -> Unit,
) {
  private var accessoryMinDetentHeight = 0f
  private var accessoryMaxDetentHeight = Float.NaN
  private var accessoryView: View? = null

  private val accessoryLayoutListener =
    View.OnLayoutChangeListener { _, _, _, _, _, _, _, _, _ ->
      requestLayoutSync()
      updatePosition(owner.height.toFloat(), sheetContainer.translationY, resolvedMaxDetentHeight())
    }

  fun setMinDetentHeight(accessoryMinDetentHeight: Float) {
    this.accessoryMinDetentHeight = accessoryMinDetentHeight.coerceAtLeast(0f)
  }

  fun setMaxDetentHeight(accessoryMaxDetentHeight: Float) {
    this.accessoryMaxDetentHeight = accessoryMaxDetentHeight
  }

  fun mount(child: View) {
    accessoryView = child
    child.addOnLayoutChangeListener(accessoryLayoutListener)
    attachView(child)
    sheetContainer.bringToFront()
  }

  fun unmount(child: View) {
    if (accessoryView === child) {
      child.removeOnLayoutChangeListener(accessoryLayoutListener)
      accessoryView = null
    }
    detachView(child)
  }

  fun layout(viewWidth: Int, viewHeight: Float, sheetTranslationY: Float, resolvedMaxDetentHeight: Float) {
    val accessory = accessoryView ?: return
    val accessoryHeight = accessoryHeight(accessory)
    accessory.layout(0, 0, viewWidth, accessoryHeight.toInt())
    updatePosition(viewHeight, sheetTranslationY, resolvedMaxDetentHeight)
  }

  fun updatePosition(viewHeight: Float, sheetTranslationY: Float, resolvedMaxDetentHeight: Float) {
    val accessory = accessoryView ?: return
    if (viewHeight <= 0f) return
    val sheetHeight = (resolvedMaxDetentHeight - sheetTranslationY).coerceAtLeast(0f)
    val cappedSheetHeight =
      sheetHeight.coerceAtMost(
        resolvedAccessoryMaxDetentHeight(resolvedMaxDetentHeight) ?: sheetHeight
      )
    val accessoryHeight = accessoryHeight(accessory)
    accessory.translationY =
      if (accessoryMinDetentHeight > 0f) {
        val flooredSheetHeight = cappedSheetHeight.coerceAtLeast(accessoryMinDetentHeight)
        sheetHeight - flooredSheetHeight - accessoryHeight
      } else {
        when {
          cappedSheetHeight <= 0f -> sheetHeight
          cappedSheetHeight < accessoryHeight -> sheetHeight - cappedSheetHeight
          else -> sheetHeight - cappedSheetHeight - accessoryHeight
        }
      }
  }

  fun isTouchOnAccessoryBand(y: Float, sheetTop: Float): Boolean {
    val accessoryBottom =
      accessoryView
        ?.takeIf { it.visibility == View.VISIBLE }
        ?.let { sheetTop + it.translationY + it.height }
        ?: sheetTop
    return y < sheetTop && y >= accessoryBottom
  }

  fun reset() {
    accessoryView?.removeOnLayoutChangeListener(accessoryLayoutListener)
    accessoryView?.let(detachView)
    accessoryView = null
    accessoryMinDetentHeight = 0f
    accessoryMaxDetentHeight = Float.NaN
  }

  fun currentHeight(): Float {
    val accessory = accessoryView ?: return 0f
    return accessoryHeight(accessory)
  }

  fun contains(view: View): Boolean = accessoryView === view

  fun keepsContainerVisibleWhenClosed(): Boolean =
    accessoryMinDetentHeight > 0f && accessoryView != null

  fun closedDetentOffset(): Float {
    if (accessoryMinDetentHeight > 0f) {
      return 0f
    }
    return currentHeight()
  }

  private fun resolvedAccessoryMaxDetentHeight(resolvedMaxDetentHeight: Float): Float? {
    if (!accessoryMaxDetentHeight.isFinite() || accessoryMaxDetentHeight < 0f) {
      return null
    }
    return accessoryMaxDetentHeight.coerceIn(0f, resolvedMaxDetentHeight)
  }

  private fun resolvedMaxDetentHeight(): Float = owner.height.toFloat().coerceAtLeast(0f)

  private fun accessoryHeight(accessory: View): Float {
    val measuredHeight = accessory.measuredHeight.takeIf { it > 0 } ?: accessory.height
    return measuredHeight.toFloat().coerceAtLeast(0f)
  }
}
