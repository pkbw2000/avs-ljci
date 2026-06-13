/**
 * UICtrl - UI 控制模組
 * 負責：DOM 操作、動畫效果、押注管理、事件處理
 * 所有 DOM 操作集中在此，與遊戲邏輯分離
 */
const UICtrl = (() => {
    // DOM 元素快取
    const els = {
        userScore: document.getElementById("userScore"),
        jackpotPool: document.getElementById("jackpotPool"),
        totalBet: document.getElementById("totalBet"),
        startBtn: document.getElementById("startBtn"),
        stopBtn: document.getElementById("stopBtn"),
        gridItems: Array.from(document.querySelectorAll(".grid-item")),
        symbolBetItems: Array.from(document.querySelectorAll(".symbol-bet-item")),
        winTip: document.getElementById("winTip"),
        guideModal: document.getElementById("guideModal"),
        closeGuide: document.getElementById("closeGuide"),
        marqueeText: document.getElementById("marqueeText")
    };

    // 押注資料（閉包變數）
    const betData = {};
    const BET_STEP = 10;
    const BET_MAX = 100;

    // 加倍模式狀態
    let currentMulti = 1;
    let bonusSid = -1;

    // 最高獎金顯示
    let currentMaxWin = 0;

    /**
     * 設定格子符號
     */
    function setGridItem(index, symbol) {
        const img = els.gridItems[index].querySelector("img");
        if (img) img.src = symbol.src;
    }

    /**
     * 初始化格子符號（隨機）
     */
    function initGridSymbol() {
        for (let i = 0; i < 9; i++) {
            const sym = Utils.getRandomSymbol();
            setGridItem(i, sym);
        }
    }

    /**
     * 初始化事件監聽
     */
    function initEvent() {
        // 押注按鈕事件（事件委派）
        const betList = document.querySelector(".symbol-bet-list");
        if (betList) {
            betList.addEventListener("click", (e) => {
                // 向上尋找 symbol-bet-item
                let target = e.target.closest(".symbol-bet-item");
                if (!target) return;
                if (GameCore.getState() !== "IDLE") return;

                const sid = Number(target.dataset.sid);
                let curr = betData[sid] || 0;
                if (curr + BET_STEP > BET_MAX) return;

                curr += BET_STEP;
                betData[sid] = curr;
                target.querySelector(".bet-num").textContent = curr;
                target.querySelector(".symbol-circle").classList.add("active");
                updateTotalBet();
            });
        }

        // 關閉教學
        if (els.closeGuide) {
            els.closeGuide.addEventListener("click", async () => {
                els.guideModal.style.display = "none";
                await DataStore.setGuideDone();
            });
        }
    }

    /**
     * 更新總押注顯示
     */
    function updateTotalBet() {
        const total = Object.values(betData).reduce((a, b) => a + b, 0);
        els.totalBet.textContent = total;
    }

    /**
     * 清空所有押注
     */
    function clearAllBet() {
        Object.keys(betData).forEach(sid => {
            betData[sid] = 0;
            const item = els.symbolBetItems.find(el => Number(el.dataset.sid) === Number(sid));
            if (item) {
                item.querySelector(".bet-num").textContent = 0;
                item.querySelector(".symbol-circle").classList.remove("active");
            }
        });
        updateTotalBet();
    }

    /**
     * 重置押注樣式（清除所有動畫）
     */
    function resetBetStyle() {
        els.symbolBetItems.forEach(item => {
            item.querySelector(".symbol-circle").classList.remove("active", "flash-green");
        });
        els.gridItems.forEach(item => {
            item.classList.remove("win-cell", "full-win", "bonus-cell");
        });
    }

    /**
     * 隨機觸發加倍事件（20% 機率）
     */
    function randomBonus() {
        const rate = Math.random();
        if (rate > 0.8) {
            currentMulti = Math.floor(Math.random() * 10) + 1;
            bonusSid = Math.floor(Math.random() * 6);
            const symbolList = Utils.getSymbolConfig();
            const targetName = symbolList.find(s => s.id === bonusSid)?.name || "符號";
            els.marqueeText.className = "marquee-text marquee-green";
            els.marqueeText.textContent = `幸運加倍！${targetName} 獎金 x${currentMulti}倍`;
            const target = els.symbolBetItems.find(el => Number(el.dataset.sid) === bonusSid);
            if (target) target.querySelector(".symbol-circle").classList.add("flash-green");
        } else {
            currentMulti = 1;
            bonusSid = -1;
        }
    }

    /**
     * 設定 Bonus 格子閃爍效果
     */
    function setBonusCellEffect(gridResult) {
        if (bonusSid === -1) return;
        gridResult.forEach((item, idx) => {
            if (item.id === bonusSid) {
                els.gridItems[idx].classList.add("bonus-cell");
            }
        });
    }

    /**
     * 初始化最高獎金跑馬燈
     */
    function initMaxWinMarquee(max) {
        currentMaxWin = max;
        if (max > 0) {
            els.marqueeText.className = "marquee-text marquee-red";
            els.marqueeText.textContent = `累計最高中獎：${max.toLocaleString()}`;
        }
    }

    /**
     * 更新最高獎金
     */
    function refreshMaxWinIfNew(newWin) {
        if (newWin > currentMaxWin) {
            currentMaxWin = newWin;
            els.marqueeText.className = "marquee-text marquee-red";
            els.marqueeText.textContent = `新紀錄！最高中獎：${newWin.toLocaleString()}`;
        }
    }

    /**
     * 顯示中獎跑馬燈
     */
    function showWinMarquee(text) {
        els.marqueeText.className = "marquee-text marquee-yellow";
        els.marqueeText.textContent = text;
    }

    /**
     * 清除閃爍綠光
     */
    function clearFlashGreen() {
        els.symbolBetItems.forEach(item => {
            item.querySelector(".symbol-circle").classList.remove("flash-green");
        });
    }

    return {
        /** 初始化 */
        init() {
            initEvent();
            initGridSymbol();
        },

        /** 取得押注資料 */
        getBetData() { return { ...betData }; },

        /** 取得總押注 */
        getTotalBet() { return Number(els.totalBet.textContent); },

        /** 保留押注樣式 */
        keepBetStyle() { resetBetStyle(); },

        /** 清除閃爍 */
        clearFlashGreen,

        /** 清空押注 */
        clearAllBet,

        /** 檢查積分與押注 */
        checkScoreAndBet(nowScore, totalBet) {
            if (nowScore < totalBet) {
                this.clearAllBet();
                this.showWinTip("積分不足，押注已歸零");
                return false;
            }
            return true;
        },

        /** 更新積分 */
        updateScore(num) {
            els.userScore.textContent = Utils.formatNum(num);
        },

        /** 更新獎池 */
        updateJackpot(num) {
            els.jackpotPool.textContent = Utils.formatNum(num);
        },

        /** 禁用/啟用開始按鈕 */
        setBtnDisable(flag) {
            els.startBtn.disabled = flag;
        },

        /** 啟用/禁用停止按鈕 */
        setStopBtn(flag) {
            els.stopBtn.disabled = flag;
        },

        /** 設定格子符號 */
        setGridItem,

        /** 設定 Bonus 格子效果 */
        setBonusCellEffect,

        /** 切換格子滾動動畫 */
        toggleGridRoll(isRoll) {
            els.gridItems.forEach(item => {
                if (isRoll) item.classList.add("grid-rolling");
                else item.classList.remove("grid-rolling");
            });
        },

        /** 清除中獎效果 */
        clearWinEffect() {
            els.gridItems.forEach(item => {
                item.classList.remove("win-cell", "full-win", "bonus-cell");
            });
        },

        /** 設定連線中獎格子 */
        setWinCells(indexArr) {
            indexArr.forEach(idx => {
                els.gridItems[idx].classList.add("win-cell");
            });
        },

        /** 設定滿屏大獎效果 */
        setFullWinEffect() {
            els.gridItems.forEach(item => item.classList.add("full-win"));
        },

        /** 顯示中獎提示 */
        showWinTip(text) {
            els.winTip.textContent = text;
            els.winTip.classList.add("show");
        },

        /** 清除中獎提示 */
        clearWinTip() {
            els.winTip.classList.remove("show");
        },

        /** 檢查教學引導 */
        async checkGuide() {
            const done = await DataStore.getGuideStatus();
            if (done) els.guideModal.style.display = "none";
        },

        /** 隨機加倍 */
        randomBonus,

        /** 取得加倍倍率 */
        getMulti() { return currentMulti; },

        /** 取得 Bonus 符號 ID */
        getBonusSid() { return bonusSid; },

        /** 初始化最高獎金跑馬燈 */
        initMaxWinMarquee,

        /** 更新最高獎金 */
        refreshMaxWinIfNew,

        /** 顯示跑馬燈 */
        showWinMarquee
    };
})();
