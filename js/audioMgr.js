/**
 * AudioMgr - 音效管理模組
 * 使用 Web Audio API 產生合成音效，無需外部音檔
 * 支援：iOS Safari（需用戶互動後初始化）
 */
const AudioMgr = (() => {
    let audioCtx = null;
    let rollOsc = null;
    let rollGain = null;
    let rollPlaying = false;

    /**
     * 初始化 AudioContext
     * 注意：iOS 需要在用戶互動後才能建立
     */
    function initAudio() {
        if (audioCtx) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            audioCtx = new AudioContextClass();
        } catch (e) {
            console.warn("AudioContext 不支援:", e);
        }
    }

    /**
     * 建立單一音調
     */
    function createTone(freq, duration, type = "sine") {
        if (!audioCtx) initAudio();
        if (!audioCtx) return;
        if (audioCtx.state === "suspended") {
            audioCtx.resume().catch(() => {});
        }
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.value = 0.15;

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + duration / 1000);
        } catch (e) {
            console.warn("createTone 失敗:", e);
        }
    }

    /**
     * 開始滾動音效（連續方波）
     */
    function startRollSound() {
        if (rollPlaying) return;
        initAudio();
        if (!audioCtx) return;
        if (audioCtx.state === "suspended") {
            audioCtx.resume().catch(() => {});
        }
        try {
            rollOsc = audioCtx.createOscillator();
            rollGain = audioCtx.createGain();
            rollOsc.type = "square";
            rollOsc.frequency.value = 320;
            rollGain.gain.value = 0.1;
            rollOsc.connect(rollGain);
            rollGain.connect(audioCtx.destination);
            rollOsc.start();
            rollPlaying = true;
        } catch (e) {
            console.warn("startRollSound 失敗:", e);
        }
    }

    /**
     * 停止滾動音效
     */
    function stopRollSound() {
        if (rollOsc) {
            try {
                rollOsc.stop();
            } catch (e) { /* already stopped */ }
            try {
                rollOsc.disconnect();
            } catch (e) { /* already disconnected */ }
            rollOsc = null;
        }
        if (rollGain) {
            try {
                rollGain.disconnect();
            } catch (e) { /* already disconnected */ }
            rollGain = null;
        }
        rollPlaying = false;
    }

    return {
        /** 開始音效 */
        playStart() {
            initAudio();
            createTone(440, 120);
        },

        /** 滾動音效 */
        playRoll() {
            startRollSound();
        },

        /** 停止滾動 */
        stopRoll() {
            stopRollSound();
        },

        /** 中獎音效 */
        playWin() {
            initAudio();
            createTone(520, 180);
            setTimeout(() => createTone(660, 180), 100);
        },

        /** 大獎音效 */
        playJackpot() {
            initAudio();
            [500, 620, 750, 880].forEach((f, i) => {
                setTimeout(() => createTone(f, 220), i * 120);
            });
        }
    };
})();
