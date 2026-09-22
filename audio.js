/**
 * COSMIC GATE RUNNER - audio.js
 * 
 * 100% Royalty-Free, Procedural Web Audio API Soundscape & Music Synthesizer.
 * Synthesizes dynamic background music (rhythmic synthwave runner arpeggio + bassline)
 * and rich arcade sound effects without external audio files.
 * Fully compliant with YouTube Playables & FBInstant audio lifecycle rules.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.bgmPlaying = false;
        this.masterGain = null;
        this.bgmGain = null;
        this.sfxGain = null;
        this.musicTimer = null;
        this.currentStep = 0;
        this.tempo = 128; // BPM
        
        // Synthwave Melodic Scale (C Dorian / Cosmic Synthwave)
        // C4 (261.6), D4 (293.7), Eb4 (311.1), F4 (349.2), G4 (392.0), Bb4 (466.2), C5 (523.3), Eb5 (622.3)
        this.leadNotes = [261.63, 311.13, 349.23, 392.00, 466.16, 523.25, 622.25, 523.25];
        this.bassNotes = [65.41, 65.41, 77.78, 87.31]; // C2, C2, Eb2, F2
    }

    init() {
        if (this.ctx) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            
            this.ctx = new AudioContextClass();

            // Master, BGM, and SFX Gain nodes
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
            this.bgmGain.connect(this.masterGain);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
            this.sfxGain.connect(this.masterGain);
        } catch (e) {
            console.log("AudioContext initialization bypassed: ", e);
        }
    }

    resumeContext() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    suspendContext() {
        if (this.ctx && this.ctx.state === 'running') {
            this.ctx.suspend();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime, 0.03);
        }
        return this.isMuted;
    }

    setMute(mute) {
        this.isMuted = !!mute;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime, 0.03);
        }
    }

    // --- PROCEDURAL BACKGROUND SYNTHWAVE MUSIC ---
    startBGM() {
        this.init();
        this.resumeContext();
        if (this.bgmPlaying || !this.ctx) return;
        this.bgmPlaying = true;
        this.currentStep = 0;

        const stepDuration = (60 / this.tempo) / 4; // 16th notes
        const scheduleNextNote = () => {
            if (!this.bgmPlaying) return;
            this.playBGMStep(this.ctx.currentTime);
            this.musicTimer = setTimeout(scheduleNextNote, stepDuration * 1000);
        };

        scheduleNextNote();
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.musicTimer) {
            clearTimeout(this.musicTimer);
            this.musicTimer = null;
        }
    }

    playBGMStep(time) {
        if (!this.ctx || !this.bgmGain) return;
        const step = this.currentStep % 16;
        this.currentStep++;

        // 1. Kick on steps 0, 4, 8, 12 (Four-on-the-floor)
        if (step % 4 === 0) {
            this.playSynthKick(time);
        }

        // 2. Snare on steps 4, 12
        if (step === 4 || step === 12) {
            this.playSynthSnare(time);
        }

        // 3. Hi-hat on offbeats (steps 2, 6, 10, 14)
        if (step % 2 === 0) {
            this.playSynthHat(time, step % 4 === 2 ? 0.08 : 0.04);
        }

        // 4. Synthwave Arpeggio Lead (Every 16th note)
        const noteIdx = (this.currentStep) % this.leadNotes.length;
        const freq = this.leadNotes[noteIdx];
        this.playLeadNote(time, freq);

        // 5. Pulsing Bassline (Every quarter beat)
        if (step % 2 === 0) {
            const bassIdx = Math.floor(step / 4) % this.bassNotes.length;
            this.playBassNote(time, this.bassNotes[bassIdx]);
        }
    }

    playLeadNote(time, freq) {
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, time);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2200, time);
            filter.frequency.exponentialRampToValueAtTime(600, time + 0.12);

            gain.gain.setValueAtTime(0.09, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.bgmGain);

            osc.start(time);
            osc.stop(time + 0.15);
        } catch (e) {}
    }

    playBassNote(time, freq) {
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, time);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(450, time);
            filter.frequency.exponentialRampToValueAtTime(180, time + 0.18);

            gain.gain.setValueAtTime(0.14, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.bgmGain);

            osc.start(time);
            osc.stop(time + 0.22);
        } catch (e) {}
    }

    playSynthKick(time) {
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(130, time);
            osc.frequency.exponentialRampToValueAtTime(42, time + 0.09);

            gain.gain.setValueAtTime(0.35, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

            osc.connect(gain);
            gain.connect(this.bgmGain);

            osc.start(time);
            osc.stop(time + 0.15);
        } catch (e) {}
    }

    playSynthSnare(time) {
        try {
            // Noise burst + tone body
            const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.4;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const noiseFilter = this.ctx.createBiquadFilter();
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.setValueAtTime(1200, time);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.18, time);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.bgmGain);

            noise.start(time);
            noise.stop(time + 0.09);
        } catch (e) {}
    }

    playSynthHat(time, vol = 0.05) {
        try {
            const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.3;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(7000, time);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(vol, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.bgmGain);

            noise.start(time);
            noise.stop(time + 0.045);
        } catch (e) {}
    }

    // --- ARCADE SOUND EFFECTS (100% SYNTHESIZED) ---

    // 1. Coin Pickup: Crisp high-frequency dual-tone chime (987Hz to 1318Hz, B5 to E6)
    playCoin() {
        this.init();
        this.resumeContext();
        if (!this.ctx || !this.sfxGain) return;
        try {
            const now = this.ctx.currentTime;
            
            // Tone 1: 987.77 Hz (B5)
            const osc1 = this.ctx.createOscillator();
            const gain1 = this.ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(987.77, now);
            gain1.gain.setValueAtTime(0.22, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc1.connect(gain1);
            gain1.connect(this.sfxGain);
            osc1.start(now);
            osc1.stop(now + 0.13);

            // Tone 2: 1318.51 Hz (E6)
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1318.51, now + 0.06);
            gain2.gain.setValueAtTime(0.25, now + 0.06);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
            osc2.connect(gain2);
            gain2.connect(this.sfxGain);
            osc2.start(now + 0.06);
            osc2.stop(now + 0.25);
        } catch (e) {}
    }

    // 2. Gift Box Pickup: Ascending polyphonic power-up chord (C5 - E5 - G5 - C6)
    playGift() {
        this.init();
        this.resumeContext();
        if (!this.ctx || !this.sfxGain) return;
        try {
            const now = this.ctx.currentTime;
            const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            const step = 0.05;

            freqs.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const noteTime = now + idx * step;

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, noteTime);
                gain.gain.setValueAtTime(0.18, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.18);

                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(noteTime);
                osc.stop(noteTime + 0.2);
            });
        } catch (e) {}
    }

    // 3. Correct Barrier: Resonant triumph chime with harmonic overtone & reverb decay
    playCorrect() {
        this.init();
        this.resumeContext();
        if (!this.ctx || !this.sfxGain) return;
        try {
            const now = this.ctx.currentTime;
            
            // Major triad triumph chime
            const chords = [
                { f: 587.33, d: 0.35, v: 0.24 }, // D5
                { f: 739.99, d: 0.40, v: 0.22 }, // F#5
                { f: 880.00, d: 0.45, v: 0.25 }, // A5
                { f: 1174.66, d: 0.55, v: 0.28 } // D6
            ];

            chords.forEach(c => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(c.f, now);

                gain.gain.setValueAtTime(c.v, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + c.d);

                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(now);
                osc.stop(now + c.d + 0.02);
            });
        } catch (e) {}
    }

    // 4. Barrier Crash / Hazard Hit: Low-pass filtered noise burst paired with sub-bass rumble drop
    playCrash() {
        this.init();
        this.resumeContext();
        if (!this.ctx || !this.sfxGain) return;
        try {
            const now = this.ctx.currentTime;

            // White noise crunch
            const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.1));
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const noiseFilter = this.ctx.createBiquadFilter();
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.setValueAtTime(1200, now);
            noiseFilter.frequency.exponentialRampToValueAtTime(150, now + 0.35);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.45, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.sfxGain);
            noise.start(now);
            noise.stop(now + 0.4);

            // Sub-bass impact sine drop (90Hz -> 25Hz)
            const subOsc = this.ctx.createOscillator();
            const subGain = this.ctx.createGain();
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(90, now);
            subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.35);

            subGain.gain.setValueAtTime(0.55, now);
            subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

            subOsc.connect(subGain);
            subGain.connect(this.sfxGain);
            subOsc.start(now);
            subOsc.stop(now + 0.4);
        } catch (e) {}
    }

    // 5. Jump Whoosh
    playJump() {
        this.init();
        this.resumeContext();
        if (!this.ctx || !this.sfxGain) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(580, now + 0.15);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now);
            osc.stop(now + 0.18);
        } catch (e) {}
    }

    // 6. Slide Whoosh
    playSlide() {
        this.init();
        this.resumeContext();
        if (!this.ctx || !this.sfxGain) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(380, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);

            gain.gain.setValueAtTime(0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now);
            osc.stop(now + 0.22);
        } catch (e) {}
    }

    // 7. Level Clear Fanfare
    playLevelClear() {
        this.init();
        this.resumeContext();
        if (!this.ctx || !this.sfxGain) return;
        try {
            const now = this.ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            const dur = 0.14;

            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const noteTime = now + idx * dur;

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, noteTime);
                gain.gain.setValueAtTime(0.22, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur + 0.1);

                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(noteTime);
                osc.stop(noteTime + dur + 0.12);
            });
        } catch (e) {}
    }

    // 8. Grand Victory Fanfare
    playVictory() {
        this.init();
        this.resumeContext();
        if (!this.ctx || !this.sfxGain) return;
        try {
            const now = this.ctx.currentTime;
            const fanfare = [
                { f: 523.25, d: 0.15 },
                { f: 523.25, d: 0.15 },
                { f: 523.25, d: 0.15 },
                { f: 659.25, d: 0.45 },
                { f: 587.33, d: 0.15 },
                { f: 659.25, d: 0.15 },
                { f: 783.99, d: 0.60 }
            ];

            let accum = 0;
            fanfare.forEach(item => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const noteTime = now + accum;

                osc.type = 'sine';
                osc.frequency.setValueAtTime(item.f, noteTime);
                gain.gain.setValueAtTime(0.25, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + item.d);

                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(noteTime);
                osc.stop(noteTime + item.d + 0.05);

                accum += item.d;
            });
        } catch (e) {}
    }
}

// Global instance
const soundEngine = new SoundEngine();

// Module export for Node.js test environment & window exposure for browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SoundEngine,
        soundEngine
    };
}

if (typeof window !== 'undefined') {
    window.SoundEngine = SoundEngine;
    window.soundEngine = soundEngine;
}
