const UICtrl = (() => {
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

    const betData = {};
    const BET_STEP = 10;
    const BET_MAX = 100;
    let currentMulti = 1;
    let bonusSid = -1;
    let currentMaxWin = 0;

    function setGridItem(index, symbol) {
        const img = els.gridItems[index].querySelector("img");
        img.src = symbol.src;
    }

    function initGridSymbol() {
        for(let i = 0; i < 9; i++){
            const sym = Utils.getRandomSymbol();
            setGridItem(i, sym);
        }
    }

    function initEvent() {
        els.symbolBetItems.forEach(item => {
            const sid = Number(item.dataset.sid);
            betData[sid] = betData[sid] || 0;

            item.addEventListener("click", () => {
                if(GameCore.getState() !== "IDLE") return;

                let curr = betData[sid];
                if(curr + BET_STEP > BET_MAX) return;

                curr += BET_STEP;
                betData[sid] = curr;
                item.querySelector(".bet-num").textContent = curr;
                item.querySelector(".symbol-circle").classList.add("active");
                updateTotalBet();
            });
        });

        els.closeGuide.addEventListener("click", async () => {
            els.guideModal.style.display = "none";
            await DataStore.setGuideDone();
        });
    }

    function updateTotalBet() {
        const total = Object.values(betData).reduce((a,b)=>a+b, 0);
        els.totalBet.textContent = total;
    }

    function clearAllBet() {
        Object.keys(betData).forEach(sid=>{
            betData[sid] = 0;
            const item = els.symbolBetItems.find(el=>Number(el.dataset.sid) === Number(sid));
            if(item){
                item.querySelector(".bet-num").textContent = 0;
                item.querySelector(".symbol-circle").classList.remove("active");
            }
        });
        updateTotalBet();
    }

    function resetBetStyle() {
        els.symbolBetItems.forEach(item => {
            item.querySelector(".symbol-circle").classList.remove("active","flash-green");
        });
        els.gridItems.forEach(item => {
            item.classList.remove("win-cell","full-win","bonus-cell");
        });
    }

    function randomBonus() {
        const rate = Math.random();
        if(rate > 0.8) {
            currentMulti = Math.floor(Math.random() * 10) + 1;
            bonusSid = Math.floor(Math.random() * 6);
            const symbolList = Utils.getSymbolConfig();
            const targetName = symbolList.find(s => s.id === bonusSid).name;
            els.marqueeText.className = "marquee-text marquee-green";
            els.marqueeText.textContent = `幸運加倍！${targetName} 獎金 x${currentMulti}倍`;
            const target = els.symbolBetItems.find(el=>Number(el.dataset.sid) === bonusSid);
            if(target) target.querySelector(".symbol-circle").classList.add("flash-green");
        } else {
            currentMulti = 1;
            bonusSid = -1;
        }
    }

    function setBonusCellEffect(gridResult) {
        if(bonusSid === -1) return;
        gridResult.forEach((item, idx) => {
            if(item.id === bonusSid) {
                els.gridItems[idx].classList.add("bonus-cell");
            }
        });
    }

    function initMaxWinMarquee(max) {
        currentMaxWin = max;
        els.marqueeText.className = "marquee-text marquee-red";
        els.marqueeText.textContent = `累計最高中獎：${max}`;
    }

    function refreshMaxWinIfNew(newWin) {
        if(newWin > currentMaxWin) {
            currentMaxWin = newWin;
            els.marqueeText.className = "marquee-text marquee-red";
            els.marqueeText.textContent = `新紀錄！最高中獎：${currentMaxWin}`;
        }
    }

    function showWinMarquee(text) {
        els.marqueeText.className = "marquee-text marquee-yellow";
        els.marqueeText.textContent = text;
    }


    function clearFlashGreen() {
        els.symbolBetItems.forEach(item => {
            item.querySelector(".symbol-circle").classList.remove("flash-green");
        });
    }
    return {
        init() {
            initEvent();
            initGridSymbol();
        },
        getBetData() { return {...betData}; },
        getTotalBet() { return Number(els.totalBet.textContent); },
        keepBetStyle() { resetBetStyle(); },
        clearFlashGreen,
        clearAllBet,

        checkScoreAndBet(nowScore, totalBet) {
            if(nowScore < totalBet) {
                this.clearAllBet();
                this.showWinTip("積分不足，押注已歸零");
                return false;
            }
            return true;
        },

        updateScore(num) {
            els.userScore.textContent = Utils.formatNum(num);
        },
        updateJackpot(num) {
            els.jackpotPool.textContent = Utils.formatNum(num);
        },
        setBtnDisable(flag) {
            els.startBtn.disabled = flag;
        },
        setStopBtn(flag) {
            els.stopBtn.disabled = flag;
        },
        setGridItem,
        setBonusCellEffect,

        toggleGridRoll(isRoll) {
            els.gridItems.forEach(item => {
                if (isRoll) item.classList.add("grid-rolling");
                else item.classList.remove("grid-rolling");
            });
        },
        clearWinEffect() {
            els.gridItems.forEach(item => {
                item.classList.remove("win-cell","full-win","bonus-cell");
            });
        },
        setWinCells(indexArr) {
            indexArr.forEach(idx => {
                els.gridItems[idx].classList.add("win-cell");
            });
        },
        setFullWinEffect() {
            els.gridItems.forEach(item => item.classList.add("full-win"));
        },

        showWinTip(text) {
            els.winTip.textContent = text;
            els.winTip.classList.add("show");
        },
        clearWinTip() {
            els.winTip.classList.remove("show");
        },

        async checkGuide() {
            const done = await DataStore.getGuideStatus();
            if (done) els.guideModal.style.display = "none";
        },

        randomBonus,
        getMulti() { return currentMulti; },
        getBonusSid() { return bonusSid; },
        initMaxWinMarquee,
        refreshMaxWinIfNew,
        showWinMarquee
    };
})();
