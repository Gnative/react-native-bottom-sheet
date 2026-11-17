package com.swmansion.reactnativebottomsheet.host

internal enum class DetentKind {
  POINTS,
  PERCENTAGE,
  FULLSCREEN,
  CONTENT,
}

internal enum class ScrollCoordinationLevel(val value: Int) {
  NONE(0),
  INITIAL(1),
  HANDOFF(2);

  companion object {
    fun from(value: Int): ScrollCoordinationLevel =
      entries.firstOrNull { it.value == value.coerceIn(0, 2) } ?: NONE
  }
}

/** The space kept around the card at a detent, in px. */
internal data class DetentInsets(
  // Null for the status bar's overlap with the host, which can change.
  val top: Float? = null,
  val left: Float = 0f,
  val right: Float = 0f,
  val bottom: Float = 0f,
)

/** The card's horizontal span in the host, in px. */
internal data class CardSpan(val left: Float, val width: Float)

internal data class RawDetentSpec(
  val value: Float,
  val kind: DetentKind,
  val programmatic: Boolean,
  val insets: DetentInsets,
  val borderRadius: Float = -1f,
  val borderTopRadius: Float = -1f,
  val borderBottomRadius: Float = -1f,
  // The widest open card, which the content is laid out against. Flagged in JS, which lays the
  // content out.
  val widestCard: Boolean,
)

/**
 * [position] is how far the card's top rests above the host's bottom: the card's height plus its
 * bottom inset. Zero when closed, whatever the inset.
 */
internal data class DetentSpec(
  val position: Float,
  val programmatic: Boolean,
  val insets: DetentInsets,
  val borderRadius: Float = -1f,
  val borderTopRadius: Float = -1f,
  val borderBottomRadius: Float = -1f,
)

internal data class ContentInsetTransition(
  val from: Float,
  val to: Float,
  val fromInset: Float,
  val toInset: Float,
)

internal data class StateSnapshot(
  val contentOffsetX: Double,
  val contentOffsetY: Double,
  val contentScale: Double,
  val frameWidth: Double,
  val frameHeight: Double,
  val contentRegionInset: Double,
  val surfaceOverflow: Double,
)
