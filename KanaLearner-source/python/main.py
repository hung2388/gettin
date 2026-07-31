"""
Application entry point.
"""
import customtkinter as ctk
from controller.app_controller import AppController


def main():
    ctk.set_appearance_mode("dark")
    ctk.set_default_color_theme("blue")

    controller = AppController()
    controller.start()


if __name__ == "__main__":
    main()
