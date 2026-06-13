const AudioMgr = (() => {
    let audioCtx = null;
    let rollOsc = null;
    let rollGain = null;
    let rollPlaying = false;

    function initAudio() {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    function createTone(freq, duration, type = "sine") {
        if (!audioCtx) initAudio();
        if (audioCtx.state === "suspended") audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = 0.25;

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + duration / 1000);
    }

    // 滾動音效：單一 oscillator 連續播放
    function startRollSound() {
        if (rollPlaying) return;
        initAudio();
        if (audioCtx.state === "suspended") audioCtx.resume();
        rollOsc = audioCtx.createOscillator();
        rollGain = audioCtx.createGain();
        rollOsc.type = "square";
        rollOsc.frequency.value = 320;
        rollGain.gain.value = 0.15;
        rollOsc.connect(rollGain);
        rollGain.connect(audioCtx.destination);
        rollOsc.start();
        rollPlaying = true;
    }

    function stopRollSound() {
        if (rollOsc) {
            rollOsc.stop();
            rollOsc.disconnect();
            rollOsc = null;
        }
        if (rollGain) {
            rollGain.disconnect();
            rollGain = null;
        }
        rollPlaying = false;
    }

    return {
        playStart() {
            createTone(440, 120);
        },
        playRoll() {
            startRollSound();
        },
        stopRoll() {
            stopRollSound();
        },
        playWin() {
            createTone(520, 180);
            setTimeout(() => createTone(660, 180), 100);
        },
        playJackpot() {
            [500, 620, 750, 880].forEach((f, i) => {
                setTimeout(() => createTone(f, 220), i * 120);
            });
        }
    };
})();
