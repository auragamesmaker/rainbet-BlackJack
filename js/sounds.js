/**
 * Sound Manager - Premium Casino Audio
 * Uses Web Audio API for synthesized sounds with reliable playback
 * Includes modern shuffle, card dealing, and chip sounds
 */

const SOUND_PACKS = {
    premium: {
        name: 'Premium Casino',
        useWebAudio: true
    },
    classic: {
        name: 'Classic Casino',
        useWebAudio: true
    },
    minimal: {
        name: 'Minimal',
        useWebAudio: true,
        enabledSounds: ['card', 'chip', 'deal']
    },
    silent: {
        name: 'Silent',
        useWebAudio: false
    }
};

class SoundManager {
    constructor() {
        this.enabled = true;
        this.volume = 0.5;
        this.currentPack = 'premium';
        this.audioContext = null;
        this.masterGain = null;
        this.initialized = false;

        this.loadPreferences();
    }

    initAudioContext() {
        if (this.initialized) return true;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.volume;
            this.initialized = true;
            return true;
        } catch (e) {
            console.warn('Web Audio API not supported');
            return false;
        }
    }

    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    play(soundType) {
        if (!this.enabled) return;
        
        const pack = SOUND_PACKS[this.currentPack];
        if (!pack || !pack.useWebAudio) return;
        
        // Check if sound is enabled for minimal pack
        if (pack.enabledSounds && !pack.enabledSounds.includes(soundType)) return;

        if (!this.initAudioContext()) return;
        this.resumeContext();

        // Play the appropriate synthesized sound
        switch (soundType) {
            case 'card':
            case 'deal':
                this.playCardSound();
                break;
            case 'flip':
                this.playFlipSound();
                break;
            case 'chip':
            case 'chipPlace':
                this.playChipSound();
                break;
            case 'chipRemove':
                this.playChipRemoveSound();
                break;
            case 'shuffle':
                this.playShuffleSound();
                break;
            case 'win':
            case 'victory':
                this.playWinSound();
                break;
            case 'lose':
            case 'defeat':
                this.playLoseSound();
                break;
            case 'blackjack':
                this.playBlackjackSound();
                break;
            case 'push':
                this.playPushSound();
                break;
            case 'button':
            case 'click':
                this.playClickSound();
                break;
            default:
                this.playClickSound();
        }
    }

    // Premium card dealing sound - crisp snap
    playCardSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // White noise burst for card snap
        const bufferSize = ctx.sampleRate * 0.04;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            // Shaped noise - starts loud, fades quickly
            const envelope = Math.exp(-i / (bufferSize * 0.15));
            data[i] = (Math.random() * 2 - 1) * envelope;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        // High-pass filter for crisp sound
        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 2000;
        highpass.Q.value = 1;
        
        // Bandpass for body
        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 4000;
        bandpass.Q.value = 0.7;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3 * this.volume, now);
        gain.gain.exponentialDecayTo = 0.001;
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        
        noise.connect(highpass);
        highpass.connect(bandpass);
        bandpass.connect(gain);
        gain.connect(this.masterGain);
        
        noise.start(now);
        noise.stop(now + 0.05);
    }

    // Card flip sound - softer whoosh
    playFlipSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const bufferSize = ctx.sampleRate * 0.08;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            const envelope = Math.sin(t * Math.PI) * Math.exp(-t * 3);
            data[i] = (Math.random() * 2 - 1) * envelope;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3000;
        filter.Q.value = 0.5;
        
        const gain = ctx.createGain();
        gain.gain.value = 0.2 * this.volume;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        noise.start(now);
        noise.stop(now + 0.1);
    }

    // Chip placement sound - simple soft click
    playChipSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Simple short click - like a soft tap
        const bufferSize = Math.floor(ctx.sampleRate * 0.025);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            // Quick decay envelope
            const envelope = Math.exp(-t * 20);
            data[i] = (Math.random() * 2 - 1) * envelope * 0.5;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        // Bandpass filter for a muted click
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1500;
        filter.Q.value = 2;
        
        const gain = ctx.createGain();
        gain.gain.value = 0.4 * this.volume;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        noise.start(now);
        noise.stop(now + 0.03);
    }

    // Chip removal - softer, lower click
    playChipRemoveSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Softer, slightly lower pitched click
        const bufferSize = Math.floor(ctx.sampleRate * 0.02);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            const envelope = Math.exp(-t * 25);
            data[i] = (Math.random() * 2 - 1) * envelope * 0.4;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 1.5;
        
        const gain = ctx.createGain();
        gain.gain.value = 0.3 * this.volume;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        noise.start(now);
        noise.stop(now + 0.025);
    }

    // Modern digital shuffle sound - electronic riffle effect
    playShuffleSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const duration = 0.6;
        
        // Create multiple rapid card sounds for riffle effect
        for (let i = 0; i < 12; i++) {
            const delay = i * 0.04 + Math.random() * 0.02;
            this.scheduleShuffleClick(now + delay, 0.15 - i * 0.01);
        }
        
        // Add whoosh overlay
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            // Bell curve envelope
            const envelope = Math.exp(-Math.pow((t - 0.3) * 4, 2)) * 0.5;
            data[i] = (Math.random() * 2 - 1) * envelope;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.linearRampToValueAtTime(4000, now + 0.3);
        filter.frequency.linearRampToValueAtTime(2000, now + duration);
        filter.Q.value = 1;
        
        const gain = ctx.createGain();
        gain.gain.value = 0.25 * this.volume;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        noise.start(now);
        noise.stop(now + duration);
    }

    scheduleShuffleClick(time, vol) {
        const ctx = this.audioContext;
        
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2500 + Math.random() * 500, time);
        osc.frequency.exponentialRampToValueAtTime(1000, time + 0.02);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vol * this.volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(time);
        osc.stop(time + 0.04);
    }

    // Win sound - triumphant ascending tones
    playWinSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const gain = ctx.createGain();
            const startTime = now + i * 0.08;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.2 * this.volume, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(startTime);
            osc.stop(startTime + 0.35);
        });
        
        // Add shimmer
        this.playShimmer(now, 0.5);
    }

    // Blackjack sound - extra celebratory
    playBlackjackSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Fanfare arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5 to E6
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const osc2 = ctx.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.value = freq * 2;
            
            const gain = ctx.createGain();
            const startTime = now + i * 0.06;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.18 * this.volume, startTime + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
            
            const gain2 = ctx.createGain();
            gain2.gain.setValueAtTime(0, startTime);
            gain2.gain.linearRampToValueAtTime(0.08 * this.volume, startTime + 0.015);
            gain2.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
            
            osc.connect(gain);
            osc2.connect(gain2);
            gain.connect(this.masterGain);
            gain2.connect(this.masterGain);
            
            osc.start(startTime);
            osc2.start(startTime);
            osc.stop(startTime + 0.45);
            osc2.stop(startTime + 0.3);
        });
        
        // Extra shimmer
        this.playShimmer(now, 0.8);
        this.playShimmer(now + 0.15, 0.6);
    }

    // Shimmer effect helper
    playShimmer(startTime, intensity) {
        const ctx = this.audioContext;
        
        const bufferSize = ctx.sampleRate * 0.4;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            const envelope = Math.sin(t * Math.PI) * Math.exp(-t * 2);
            data[i] = (Math.random() * 2 - 1) * envelope;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 6000;
        filter.Q.value = 0.5;
        
        const gain = ctx.createGain();
        gain.gain.value = 0.1 * intensity * this.volume;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        noise.start(startTime);
        noise.stop(startTime + 0.4);
    }

    // Lose sound - descending tone
    playLoseSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
        
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(300, now);
        osc2.frequency.exponentialRampToValueAtTime(150, now + 0.35);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0.1 * this.volume, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        
        osc.connect(gain);
        osc2.connect(gain2);
        gain.connect(this.masterGain);
        gain2.connect(this.masterGain);
        
        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.45);
        osc2.stop(now + 0.5);
    }

    // Push sound - neutral tone
    playPushSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 440;
        
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 554.37; // C#5
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.3);
        osc2.stop(now + 0.3);
    }

    // UI click sound
    playClickSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.02);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.04);
    }

    setSoundPack(packName) {
        if (SOUND_PACKS[packName]) {
            this.currentPack = packName;
            this.savePreferences();
        }
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
        this.savePreferences();
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        this.savePreferences();
    }

    savePreferences() {
        try {
            localStorage.setItem('blackjack_sound_prefs', JSON.stringify({
                enabled: this.enabled,
                volume: this.volume,
                pack: this.currentPack
            }));
        } catch (e) { }
    }

    loadPreferences() {
        try {
            const saved = localStorage.getItem('blackjack_sound_prefs');
            if (saved) {
                const prefs = JSON.parse(saved);
                this.enabled = prefs.enabled ?? true;
                this.volume = prefs.volume ?? 0.5;
                this.currentPack = prefs.pack ?? 'premium';
            }
        } catch (e) { }
    }
}

// Export
window.SoundManager = SoundManager;
window.SOUND_PACKS = SOUND_PACKS;
