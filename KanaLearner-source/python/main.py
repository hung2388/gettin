"""
Application entry point — KanaFlow v2.0
Launches the premium HTML/CSS/JS frontend via pywebview,
keeping all Python business logic intact.
"""
import os
import sys
import threading

# ── Path setup ────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

# ── Model & Bridge ────────────────────────────────────────────────
from model.app_model import AppModel
from view.bridge import Api

HTML_FILE = os.path.join(BASE_DIR, "view", "app.html")


def main():
    try:
        import webview
    except ImportError:
        print("pywebview not installed. Run: python -m pip install pywebview")
        _fallback_tkinter()
        return

    model = AppModel()
    api = Api(model)

    html_url = f"file:///{HTML_FILE.replace(os.sep, '/')}"

    window = webview.create_window(
        title="KanaFlow · Japanese Learning",
        url=html_url,
        js_api=api,
        width=1280,
        height=820,
        min_size=(900, 600),
        background_color="#070B12",
        frameless=False,
        easy_drag=False,
    )

    webview.start(debug=False)


def _fallback_tkinter():
    """Emergency fallback to old Tkinter UI if pywebview is unavailable."""
    print("Starting fallback Tkinter mode...")
    import customtkinter as ctk
    from controller.app_controller import AppController
    ctk.set_appearance_mode("dark")
    ctk.set_default_color_theme("blue")
    controller = AppController()
    controller.start()


if __name__ == "__main__":
    main()
