"""
Root window. Manages screen switching via show/hide frames.
"""
import customtkinter as ctk
from view.theme import Theme


SCREEN_PART1      = "part1"
SCREEN_PART2      = "part2"
SCREEN_STAGE_DONE = "stageDone"
SCREEN_LEARNING_PATH = "learningPath"
SCREEN_TOPIC_DETAILS = "topicDetails"
SCREEN_VOCAB_PACKS   = "vocabPacks"
SCREEN_VOCAB_STUDY_HUB = "vocabStudyHub"
SCREEN_LEVEL1        = "level1"
SCREEN_LEVEL2        = "level2"
SCREEN_LEVEL3        = "level3"
SCREEN_LEVEL4        = "level4"
SCREEN_LEVEL5        = "level5"
SCREEN_HANDWRITING   = "handwriting"


class MainFrame(ctk.CTk):

    def __init__(self):
        super().__init__()

        self.title("Japanese Kana Learner")
        self.geometry(f"{Theme.WINDOW_WIDTH}x{Theme.WINDOW_HEIGHT}")
        self.minsize(Theme.MIN_WIDTH, Theme.MIN_HEIGHT)
        self.configure(fg_color=Theme.BG)

        # Container that holds all screens
        self.container = ctk.CTkFrame(self, fg_color=Theme.BG)
        self.container.pack(fill="both", expand=True)
        self.container.grid_rowconfigure(0, weight=1)
        self.container.grid_columnconfigure(0, weight=1)

        self.screens: dict[str, ctk.CTkFrame] = {}
        self.current_screen: str | None = None

    def add_screen(self, name: str, screen: ctk.CTkFrame):
        self.screens[name] = screen
        screen.grid(row=0, column=0, sticky="nsew", in_=self.container)
        screen.grid_remove()  # hide initially

    def show_screen(self, name: str):
        if self.current_screen and self.current_screen in self.screens:
            self.screens[self.current_screen].grid_remove()
        self.current_screen = name
        self.screens[name].grid()
        self.screens[name].tkraise()
