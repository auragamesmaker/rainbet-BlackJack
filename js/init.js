/**
 * Game Initialization
 * Connects Game, UI, and Theme modules
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Game Engine
    const game = new window.BlackjackGame();

    // 2. Initialize Sound Manager
    window.soundManager = new window.SoundManager();

    // 3. Initialize Themes
    window.themeManager = new window.ThemeManager();

    // 4. Initialize UI (depends on others being ready)
    const ui = new window.BlackjackUI(game);

    // 5. Expose for debugging
    window.game = game;
    window.ui = ui;

    console.log('Blackjack App Initialized');
});
