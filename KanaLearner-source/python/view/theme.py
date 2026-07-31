"""
Centralized design tokens for the whole app.
"""


class Theme:
    # ── Colors (hex strings for CTk) ──────────────────────────────────────
    BG          = "#0D0D1A"
    BG_GRADIENT = "#121228"
    CARD        = "#16213E"
    CARD_LIGHT  = "#1B2845"
    SURFACE     = "#0F3460"
    ACCENT      = "#6C63FF"
    ACCENT_LIGHT= "#9D97FF"
    ACCENT_GLOW = "#7B73FF"
    SUCCESS     = "#4CAF50"
    SUCCESS_DARK= "#2E7D32"
    ERROR       = "#E53935"
    ERROR_DARK  = "#C62828"
    WARNING     = "#FFC107"
    WARNING_DARK= "#FF8F00"
    TEXT        = "#E8E8F0"
    TEXT_MUTED  = "#8888AA"
    HIGHLIGHT   = "#FFE082"
    BORDER      = "#2D2D5E"
    GOLD        = "#FFD700"
    SAKURA      = "#FFB7C5"
    TEAL        = "#26A69A"

    # ── Hover colors ──────────────────────────────────────────────────────
    CARD_HOVER  = "#1E2A50"
    SECTION_BG  = "#1A2340"

    # ── Font tuples (family, size) or (family, size, style) ───────────────
    KANA_LARGE  = ("Yu Gothic UI", 72, "bold")
    KANA_MEDIUM = ("Yu Gothic UI", 44, "bold")
    KANA_SMALL  = ("Yu Gothic UI", 20)
    KANA_SMALL_BOLD = ("Yu Gothic UI", 20, "bold")
    TITLE       = ("Yu Gothic UI", 30, "bold")
    HEADING     = ("Yu Gothic UI", 24, "bold")
    SUBHEADING  = ("Yu Gothic UI", 18, "bold")
    BODY        = ("Yu Gothic UI", 14)
    BODY_BOLD   = ("Yu Gothic UI", 14, "bold")
    SMALL       = ("Yu Gothic UI", 12)
    SMALL_BOLD  = ("Yu Gothic UI", 12, "bold")
    MONO        = ("Consolas", 15)
    EMOJI       = ("Segoe UI Emoji", 36)

    # ── Dimensions ────────────────────────────────────────────────────────
    WINDOW_WIDTH  = 1000
    WINDOW_HEIGHT = 720
    MIN_WIDTH     = 860
    MIN_HEIGHT    = 640
