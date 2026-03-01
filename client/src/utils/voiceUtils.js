export const speak = (message, options = {}) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // Anti-spam protection: Cancel ongoing speech before starting a new one
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = options.rate || 0.95;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;

    // Optional voice selection
    if (options.voiceURI) {
        const voices = window.speechSynthesis.getVoices();
        const selected = voices.find(v => v.voiceURI === options.voiceURI);
        if (selected) utterance.voice = selected;
    }

    if (options.onStart) utterance.onstart = options.onStart;
    if (options.onEnd) utterance.onend = options.onEnd;

    utterance.onerror = (e) => {
        console.warn("Speech synthesis error:", e);
        if (options.onEnd) options.onEnd(); // cleanup state
    };

    window.speechSynthesis.speak(utterance);
};

export const playAlarm = () => {
    try {
        // Attempt to play external alarm file
        const audio = new Audio('/alarm.mp3');
        audio.play().catch((e) => {
            console.warn('Could not play /alarm.mp3. Falling back to synthetic beep.', e);
            playSyntheticBeep();
        });
    } catch (err) {
        console.warn('Alarm sound playback failed:', err);
    }
};

// Fallback synthetic double-beep using Web Audio API
const playSyntheticBeep = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        // First beep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880; // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);

        // Second beep
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1100; // C#6
        gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.45);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);
        osc2.start(ctx.currentTime + 0.45);
        osc2.stop(ctx.currentTime + 0.85);
    } catch (e) {
        // Silently ignore audio context failures (e.g. browser blocks auto-play)
    }
};
