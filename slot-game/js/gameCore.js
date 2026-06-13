const GameCore = (() => {
    const WIN_LINES = Utils.getWinLines();
    const JACKPOT_RATIO = 0.1;
    const RESET_JACKPOT = 50000;

    let gameState = "IDLE";
    let gridResult = [];
    let rollTimer = null;

    function setState(state) { gameState = state; }
    function getState() { return gameState; }

    function checkFullScreen() {
        const firstId = gridResult[0].id;
        return gridResult.every(item => item.id === firstId);
    }

    // 計算中獎獎勵
    // 加倍模式：bonus 圖案亮起時，grid 中「任一符號連線」都有分
    function calcWinReward(betData, totalBet, multi, bonusSid) {
        let totalReward = 0;
        let winLineCount = 0;
        let winCellIndex = new Set();
        let bonusCount = 0;
        let bonusLineCount = 0;

        // 統計 bonus 符號數量
        if(bonusSid !== -1) {
            gridResult.forEach(item => {
                if(item.id === bonusSid) bonusCount++;
            });
        }

        WIN_LINES.forEach(line => {
            const [a,b,c] = line;
            const s1 = gridResult[a];
            const s2 = gridResult[b];
            const s3 = gridResult[c];

            if (s1.id === s2.id && s2.id === s3.id) {
                winLineCount++;
                winCellIndex.add(a);
                winCellIndex.add(b);
                winCellIndex.add(c);

                // 基礎線獎勵：totalBet × 符號倍率
                let lineReward = totalBet * s1.rate;

                // 有下注該符號時，附加 1.5 倍加成
                const userBet = betData[s1.id] || 0;
                if(userBet > 0) {
                    lineReward = Math.floor(lineReward * 1.5);
                }

                // bonus 符號的 multi 倍率：bonus 符號連線時套用
                if(bonusSid !== -1 && s1.id === bonusSid) {
                    lineReward = Math.floor(lineReward * multi);
                    bonusLineCount++;
                }

                totalReward += lineReward;
            }
        });

        // 多線連擊加成：使用階梯式倍率防止疊加過高
        if(winLineCount > 1){
            let extraRate;
            if(winLineCount === 2) {
                extraRate = 0.1;
            } else if(winLineCount === 3) {
                extraRate = 0.25;
            } else if(winLineCount >= 4 && winLineCount <= 5) {
                extraRate = 0.5;
            } else if(winLineCount >= 6) {
                extraRate = 0.8;
            } else {
                extraRate = 0;
            }
            totalReward = Math.floor(totalReward * (1 + extraRate));
        }

        // bonus 符號額外獎勵
        if(bonusSid !== -1 && bonusLineCount > 0) {
            const singleBet = betData[bonusSid] || 0;
            if(singleBet > 0) {
                totalReward += singleBet * 2 * bonusLineCount;
            }
        }

        return { totalReward, winLineCount, winCells: Array.from(winCellIndex), bonusLineCount, bonusCount };
    }

    function stopRoll() {
        if(rollTimer) clearInterval(rollTimer);
        AudioMgr.stopRoll();
        UICtrl.toggleGridRoll(false);
        setState("SETTLE");
    }

    async function runGame(userBetData, totalBet, userScore, jackpot) {
        if(totalBet <= 0){
            UICtrl.showWinTip("請先進行押注");
            return;
        }

        UICtrl.clearWinTip();
        UICtrl.clearFlashGreen();
        UICtrl.randomBonus();

        setState("ROLLING");
        UICtrl.setBtnDisable(true);
        UICtrl.setStopBtn(false);
        UICtrl.toggleGridRoll(true);
        UICtrl.clearWinEffect();
        AudioMgr.playStart();

        const rollTime = 1800;
        rollTimer = setInterval(() => {
            gridResult = Array(9).fill(0).map(() => Utils.getRandomSymbol());
            gridResult.forEach((sym, idx) => UICtrl.setGridItem(idx, sym));
        }, 80);
        // Start continuous roll sound once
        AudioMgr.playRoll();

        const autoStop = setTimeout(() => {
            stopRoll();
        }, rollTime);

        await new Promise(res => {
            const check = setInterval(() => {
                if(gameState === "SETTLE"){
                    clearInterval(check);
                    clearTimeout(autoStop);
                    res();
                }
            }, 50);
        });

        // 正常模式：隨機
        gridResult = Array(9).fill(0).map(() => Utils.getRandomSymbol());

        // 渲染最終畫面
        gridResult.forEach((sym, idx) => UICtrl.setGridItem(idx, sym));
        UICtrl.setBonusCellEffect(gridResult);

        let newScore = userScore - totalBet;
        let newJackpot = jackpot + Math.floor(totalBet * JACKPOT_RATIO);
        let winText = "";
        let finalWin = 0;

        const multi = UICtrl.getMulti();
        const bSid = UICtrl.getBonusSid();
        let { totalReward, winLineCount, winCells, bonusLineCount, bonusCount } = calcWinReward(userBetData, totalBet, multi, bSid);
        const isFullScreen = checkFullScreen();

        if (totalReward > 0) {
            newScore += totalReward;
            finalWin = totalReward;
            winText = `中獎 +${totalReward} 分`;
            if(winLineCount > 0) UICtrl.setWinCells(winCells);
            AudioMgr.playWin();

            if(bSid !== -1) {
                UICtrl.setBonusCellEffect(gridResult);
                UICtrl.showWinMarquee(`幸運加倍！${multi}倍 連線×${winLineCount}`);
            } else {
                UICtrl.showWinMarquee(`連線中獎！×${winLineCount}`);
            }
        }

        // ========== 加倍模式：只要 grid 中有 bonus 符號，每個 bonus 符號格子都給基礎分 + 閃動 ==========
        if (bSid !== -1 && bonusCount > 0) {
            // 每個 bonus 符號格子給基礎分：totalBet × 該符號 rate
            const allSymbols = Utils.getSymbolConfig();
            const bonusSym = allSymbols.find(s => s.id === bSid);
            if (bonusSym) {
                const bonusBaseReward = totalBet * bonusSym.rate;
                // 每個 bonus 格子給分（不含連線加成，單純每個格子都有分）
                const bonusGridReward = bonusBaseReward * bonusCount;
                newScore += bonusGridReward;
                finalWin += bonusGridReward;
                if (!winText) {
                    winText = `中獎 +${bonusGridReward} 分`;
                } else {
                    winText = `中獎 +${totalReward + bonusGridReward} 分`;
                }
                // 更新 totalReward 供後續使用
                totalReward += bonusGridReward;
                // 確保 bonus 格子有閃動效果
                UICtrl.setBonusCellEffect(gridResult);
                // bonus already counted above, skip duplicate playWin
            }
        }

        if (isFullScreen) {
            newScore += newJackpot;
            finalWin += newJackpot;
            winText = "🎉 滿屏超級大獎！";
            newJackpot = RESET_JACKPOT;
            UICtrl.setFullWinEffect();
            AudioMgr.playJackpot();
            UICtrl.showWinMarquee("滿屏大獎！奪取全部獎池！");
        }

        const oldMax = await DataStore.getMaxWin();
        if(finalWin > oldMax) {
            await DataStore.setMaxWin(finalWin);
            UICtrl.refreshMaxWinIfNew(finalWin);
        }

        await DataStore.setUserScore(newScore);
        await DataStore.setJackpot(newJackpot);

        UICtrl.updateScore(newScore);
        UICtrl.updateJackpot(newJackpot);
        if(winText) UICtrl.showWinTip(winText);

        // Bet data preserved; win effects stay until next spin

        setState("IDLE");
        UICtrl.setBtnDisable(false);
        UICtrl.setStopBtn(true);
        return { newScore, newJackpot };
    }

    return {
        runGame,
        getState,
        stopRoll
    };
})();
