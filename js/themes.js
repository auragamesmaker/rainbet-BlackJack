/**
 * Theme Manager - Custom color themes with glassmorphism
 */

const THEMES = {
    vanilla: {
        name: 'Vanilla',
        icon: '🍦',
        colors: {
            '--bg-main': '#080810',
            '--bg-panel': '#0c0c14',
            '--bg-card': '#13131d',
            '--bg-elevated': '#1a1a26',
            '--bg-hover': 'rgba(255, 255, 255, 0.05)',
            '--text-primary': '#ffffff',
            '--text-secondary': '#9ca3af',
            '--text-muted': '#6b7280',
            '--accent': '#00f5a0',
            '--accent-dim': 'rgba(0, 245, 160, 0.12)',
            '--accent-glow': 'rgba(0, 245, 160, 0.4)',
            '--accent-hover': '#00ffb0',
            '--border': 'rgba(255, 255, 255, 0.08)',
            '--border-glow': 'rgba(0, 245, 160, 0.3)',
            '--glass': 'rgba(255, 255, 255, 0.03)',
            '--glass-border': 'rgba(255, 255, 255, 0.08)',
            '--table-gradient-1': 'rgba(0, 245, 160, 0.06)',
            '--table-gradient-2': 'rgba(0, 200, 130, 0.04)'
        }
    },
    dark: {
        name: 'Midnight Dark',
        icon: '🌙',
        colors: {
            '--bg-main': '#080810',
            '--bg-panel': '#0c0c14',
            '--bg-card': '#13131d',
            '--bg-elevated': '#1a1a26',
            '--bg-hover': 'rgba(255, 255, 255, 0.05)',
            '--text-primary': '#ffffff',
            '--text-secondary': '#9ca3af',
            '--text-muted': '#6b7280',
            '--accent': '#00d26a',
            '--accent-dim': 'rgba(0, 210, 106, 0.12)',
            '--accent-glow': 'rgba(0, 210, 106, 0.4)',
            '--accent-hover': '#00e777',
            '--border': 'rgba(255, 255, 255, 0.08)',
            '--border-glow': 'rgba(0, 210, 106, 0.3)',
            '--glass': 'rgba(255, 255, 255, 0.03)',
            '--glass-border': 'rgba(255, 255, 255, 0.08)',
            '--table-gradient-1': 'rgba(0, 210, 106, 0.06)',
            '--table-gradient-2': 'rgba(0, 150, 80, 0.04)'
        }
    },
    neon: {
        name: 'Neon Cyberpunk',
        icon: '⚡',
        colors: {
            '--bg-main': '#0a0012',
            '--bg-panel': '#12001f',
            '--bg-card': '#1a0030',
            '--bg-elevated': '#250045',
            '--bg-hover': 'rgba(255, 0, 255, 0.08)',
            '--text-primary': '#ffffff',
            '--text-secondary': '#c792ea',
            '--text-muted': '#7c5295',
            '--accent': '#ff00ff',
            '--accent-dim': 'rgba(255, 0, 255, 0.15)',
            '--accent-glow': 'rgba(255, 0, 255, 0.5)',
            '--accent-hover': '#ff44ff',
            '--border': 'rgba(255, 0, 255, 0.15)',
            '--border-glow': 'rgba(255, 0, 255, 0.4)',
            '--glass': 'rgba(255, 0, 255, 0.04)',
            '--glass-border': 'rgba(255, 0, 255, 0.12)',
            '--table-gradient-1': 'rgba(255, 0, 255, 0.08)',
            '--table-gradient-2': 'rgba(0, 255, 255, 0.04)'
        }
    },
    vegas: {
        name: 'Vegas Gold',
        icon: '🎰',
        colors: {
            '--bg-main': '#0d0906',
            '--bg-panel': '#15100a',
            '--bg-card': '#1f1810',
            '--bg-elevated': '#2a2015',
            '--bg-hover': 'rgba(255, 215, 0, 0.08)',
            '--text-primary': '#fff8e7',
            '--text-secondary': '#d4af37',
            '--text-muted': '#8b7355',
            '--accent': '#ffd700',
            '--accent-dim': 'rgba(255, 215, 0, 0.15)',
            '--accent-glow': 'rgba(255, 215, 0, 0.5)',
            '--accent-hover': '#ffed4a',
            '--border': 'rgba(255, 215, 0, 0.12)',
            '--border-glow': 'rgba(255, 215, 0, 0.35)',
            '--glass': 'rgba(255, 215, 0, 0.04)',
            '--glass-border': 'rgba(255, 215, 0, 0.1)',
            '--table-gradient-1': 'rgba(255, 215, 0, 0.06)',
            '--table-gradient-2': 'rgba(139, 115, 85, 0.04)'
        }
    },
    emerald: {
        name: 'Classic Emerald',
        icon: '♠️',
        colors: {
            '--bg-main': '#061a0e',
            '--bg-panel': '#0a2614',
            '--bg-card': '#0e3219',
            '--bg-elevated': '#144020',
            '--bg-hover': 'rgba(0, 255, 127, 0.08)',
            '--text-primary': '#ffffff',
            '--text-secondary': '#7dcea0',
            '--text-muted': '#4a8c6a',
            '--accent': '#00ff7f',
            '--accent-dim': 'rgba(0, 255, 127, 0.15)',
            '--accent-glow': 'rgba(0, 255, 127, 0.4)',
            '--accent-hover': '#40ffaa',
            '--border': 'rgba(0, 255, 127, 0.12)',
            '--border-glow': 'rgba(0, 255, 127, 0.3)',
            '--glass': 'rgba(0, 255, 127, 0.04)',
            '--glass-border': 'rgba(0, 255, 127, 0.1)',
            '--table-gradient-1': 'rgba(0, 255, 127, 0.06)',
            '--table-gradient-2': 'rgba(0, 180, 90, 0.04)'
        }
    },
    ocean: {
        name: 'Ocean Blue',
        icon: '🌊',
        colors: {
            '--bg-main': '#040810',
            '--bg-panel': '#081020',
            '--bg-card': '#0c1830',
            '--bg-elevated': '#102040',
            '--bg-hover': 'rgba(0, 150, 255, 0.08)',
            '--text-primary': '#ffffff',
            '--text-secondary': '#7ec8e3',
            '--text-muted': '#4a8aa8',
            '--accent': '#00bfff',
            '--accent-dim': 'rgba(0, 191, 255, 0.15)',
            '--accent-glow': 'rgba(0, 191, 255, 0.4)',
            '--accent-hover': '#40d0ff',
            '--border': 'rgba(0, 191, 255, 0.12)',
            '--border-glow': 'rgba(0, 191, 255, 0.3)',
            '--glass': 'rgba(0, 191, 255, 0.04)',
            '--glass-border': 'rgba(0, 191, 255, 0.1)',
            '--table-gradient-1': 'rgba(0, 191, 255, 0.06)',
            '--table-gradient-2': 'rgba(0, 100, 180, 0.04)'
        }
    },
    crimson: {
        name: 'Crimson',
        icon: '🔴',
        colors: {
            '--bg-main': '#100808',
            '--bg-panel': '#180c0c',
            '--bg-card': '#201212',
            '--bg-elevated': '#2a1818',
            '--bg-hover': 'rgba(255, 100, 100, 0.08)',
            '--text-primary': '#ffffff',
            '--text-secondary': '#e8a0a0',
            '--text-muted': '#a06060',
            '--accent': '#ff4444',
            '--accent-dim': 'rgba(255, 68, 68, 0.15)',
            '--accent-glow': 'rgba(255, 68, 68, 0.4)',
            '--accent-hover': '#ff6666',
            '--border': 'rgba(255, 68, 68, 0.12)',
            '--border-glow': 'rgba(255, 68, 68, 0.3)',
            '--glass': 'rgba(255, 68, 68, 0.04)',
            '--glass-border': 'rgba(255, 68, 68, 0.1)',
            '--table-gradient-1': 'rgba(255, 68, 68, 0.06)',
            '--table-gradient-2': 'rgba(200, 50, 50, 0.04)'
        }
    },
    sapphire: {
        name: 'Sapphire',
        icon: '💎',
        colors: {
            '--bg-main': '#080812',
            '--bg-panel': '#0c0c1a',
            '--bg-card': '#121228',
            '--bg-elevated': '#1a1a38',
            '--bg-hover': 'rgba(100, 100, 255, 0.08)',
            '--text-primary': '#ffffff',
            '--text-secondary': '#a0a0e8',
            '--text-muted': '#6060a0',
            '--accent': '#6366f1',
            '--accent-dim': 'rgba(99, 102, 241, 0.15)',
            '--accent-glow': 'rgba(99, 102, 241, 0.4)',
            '--accent-hover': '#818cf8',
            '--border': 'rgba(99, 102, 241, 0.12)',
            '--border-glow': 'rgba(99, 102, 241, 0.3)',
            '--glass': 'rgba(99, 102, 241, 0.04)',
            '--glass-border': 'rgba(99, 102, 241, 0.1)',
            '--table-gradient-1': 'rgba(99, 102, 241, 0.06)',
            '--table-gradient-2': 'rgba(70, 70, 180, 0.04)'
        }
    }
};

class ThemeManager {
    constructor() {
        this.currentTheme = 'vanilla';
        this.loadPreferences();
        this.applyTheme(this.currentTheme);
    }

    applyTheme(themeName) {
        const theme = THEMES[themeName];
        if (!theme) return false;

        const root = document.documentElement;

        // Apply CSS custom properties
        for (const [property, value] of Object.entries(theme.colors)) {
            root.style.setProperty(property, value);
        }

        // Update text variables mapping
        root.style.setProperty('--text-1', 'var(--text-primary)');
        root.style.setProperty('--text-2', 'var(--text-secondary)');
        root.style.setProperty('--text-3', 'var(--text-muted)');

        // Update game area gradients
        this.updateTableGradient(theme);

        this.currentTheme = themeName;
        this.savePreferences();

        // Dispatch event for UI updates
        document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: themeName } }));

        return true;
    }

    updateTableGradient(theme) {
        const gameArea = document.querySelector('.game-area');
        if (gameArea) {
            const g1 = theme.colors['--table-gradient-1'];
            const g2 = theme.colors['--table-gradient-2'];
            gameArea.style.background = `
                radial-gradient(ellipse at 50% 50%, ${g1}, transparent 70%),
                radial-gradient(ellipse at 50% 0%, ${g2}, transparent 50%),
                radial-gradient(ellipse at 50% 100%, ${g2}, transparent 50%),
                var(--bg-main)
            `;
        }
    }

    getTheme(themeName) {
        return THEMES[themeName] || null;
    }

    getAllThemes() {
        return THEMES;
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    savePreferences() {
        try {
            localStorage.setItem('blackjack_theme', this.currentTheme);
        } catch (e) { }
    }

    loadPreferences() {
        try {
            const saved = localStorage.getItem('blackjack_theme');
            if (saved && THEMES[saved]) {
                this.currentTheme = saved;
            }
        } catch (e) { }
    }
}

// Export
window.ThemeManager = ThemeManager;
window.THEMES = THEMES;
