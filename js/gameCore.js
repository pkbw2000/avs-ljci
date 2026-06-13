/**
 * GameCore - 遊戲核心模組
 * 負責：遊戲流程、狀態機、中獎計算、滿屏檢測
 * 所有遊戲邏輯集中在此，與 UI 分離
 */
const GameCore = (() => {
    const WIN_LINES = Utils.getWinLines();
    const JACKPOT_RATIO = 0.1;
    const RESET_JACKPOT = 50000;

    let gameState = "IDLE";
    let gridResult = [];
    let rollFrameId = null;
    let rollStartTime = 0;
    const ROLL_DURATION = 1800; // 自動停止時間（毫秒）
    const ROLL_INTERVAL = 80;   // 符號刷新間隔（毫秒）

    /** 設定遊戲狀態 */
    function setState(state) { gameState = state; }

    /** 取得遊戲狀態 */
    function getState() { return gameState; }

    /**
     * 檢查是否滿屏（9 格全部相同）
     */
    function checkFullScreen() {
        if (gridResult.length < 9) return false;
        const firstId = gridResult[0].id;
        return gridResult.every(item => item.id === firstId);
    }

    /**
     * 計算中獎獎勵
     * @param {Object} betData - 玩家押注資料 { sid: amount }
     * @param {number} totalBet - 本局總押注
     * @param {number} multi - 加倍倍率
     * @param {number} bonusSid - Bonus 符號 ID
     * @returns {Object} 獎勵結果
     */
    function calcWinReward(betData, totalBet, multi, bonusSid) {
        let totalReward = 0;
        let winLineCount = 0;
        const winCellIndex = new Set();
        let bonusCount = 0;
        let bonusLineCount = 0;

        // 統計 bonus 符號數量
        if (bonusSid !== -1) {
            gridResult.forEach(item => {
                if (item.id === bonusSid) bonusCount++;
            });
        }

        // 遍歷所有連線
        WIN_LINES.forEach(line => {
            const [a, b, c] = line;
            const s1 = gridResult[a];
            const s2 = gridResult[b];
            const s3 = gridResult[c];

            // 檢查是否三連
            if (s1.id === s2.id && s2.id === s3.id) {
                winLineCount++;
                winCellIndex.add(a);
                winCellIndex.add(b);
                winCellIndex.add(c);

                // 基礎線獎勵：totalBet × 符號倍率
                let lineReward = totalBet * s1.rate;

                // 已下注加成：1.5 倍
                const userBet = betData[s1.id] || 0;
                if (userBet > 0) {
                    lineReward = Math.floor(lineReward * 1.5);
                }

                // Bonus 加倍：bonus 符號連線時套用
                if (bonusSid !== -1 && s1.id === bonusSid) {
                    lineReward = Math.floor(lineReward * multi);
                    bonusLineCount++;
                }

                totalReward += lineReward;
            }
        });

        // 多線連擊加成
        if (winLineCount > 1) {
            let extraRate;
            if (winLineCount === 2) {
                extraRate = 0.1;
            } else if (winLineCount === 3) {
                extraRate = 0.25;
            } else if (winLineCount >= 4 && winLineCount <= 5) {
                extraRate = 0.5;
            } else if (winLineCount >= 6) {
                extraRate = 0.8;
            } else {
                extraRate = 0;
            }
            totalReward = Math.floor(totalReward * (1 + extraRate));
        }

        // Bonus 符號額外獎勵
        if (bonusSid !== -1 && bonusLineCount > 0) {
            const singleBet = betData[bonusSid] || 0;
            if (singleBet > 0) {
                totalReward += singleBet * 2 * bonusLineCount;
            }
        }

        return {
            totalReward,
            winLineCount,
            winCells: Array.from(winCellIndex),
            bonusLineCount,
            bonusCount
        };
    }

    /**
     * 滾動動畫（使用 requestAnimationFrame）
     */
    function startRollAnimation(timestamp) {
        if (gameState !== "ROLLING") return;

        if (!rollStartTime) rollStartTime = timestamp;
        const elapsed = timestamp - rollStartTime;

        // 每 ROLL_INTERVAL ms 更新一次符號
        if (elapsed % ROLL_INTERVAL < 16) {
            gridResult = Array(9).fill(0).map(() => Utils.getRandomSymbol());
            gridResult.forEach((sym, idx) => UICtrl.setGridItem(idx, sym));
        }

        // 檢查是否超過自動停止時間
        if (elapsed >= ROLL_DURATION && gameState === "ROLLING") {
            stopRoll();
            return;
        }

        rollFrameId = requestAnimationFrame(startRollAnimation);
    }

    /**
     * 停止滾動
     */
    function stopRoll() {
        if (rollFrameId) {
            cancelAnimationFrame(rollFrameId);
            rollFrameId = null;
        }
        AudioMgr.stopRoll();
        UICtrl.toggleGridRoll(false);
        setState("SETTLE");
    }

    /**
     * 執行一局遊戲
     * @param {Object} userBetData - 玩家押注資料
     * @param {number} totalBet - 本局總押注
     * @param {number} userScore - 玩家當前積分
     * @param {number} jackpot - 當前累積獎池
     * @returns {Promise<Object>} 新積分與獎池
     */
    async function runGame(userBetData, totalBet, userScore, jackpot) {
        // 檢查押注
        if (totalBet <= 0) {
            UICtrl.showWinTip("請先進行押注");
            return { newScore: userScore, newJackpot: jackpot };
        }

        // 清除舊狀態
        UICtrl.clearWinTip();
        UICtrl.clearFlashGreen();
        UICtrl.clearWinEffect();
        UICtrl.randomBonus();

        // 設定狀態
        setState("ROLLING");
        UICtrl.setBtnDisable(true);
        UICtrl.setStopBtn(false);
        UICtrl.toggleGridRoll(true);
        AudioMgr.playStart();

        // 開始滾動動畫
        rollStartTime = 0;
        rollFrameId = requestAnimationFrame(startRollAnimation);
        AudioMgr.playRoll();

        // 等待使用者停止或自動停止
        await new Promise(resolve => {
            const check = setInterval(() => {
                if (gameState === "SETTLE") {
                    clearInterval(check);
                    resolve();
                }
            }, 50);
        });

        // 生成最終結果
        gridResult = Array(9).fill(0).map(() => Utils.getRandomSymbol());

        // 渲染最終畫面
        gridResult.forEach((sym, idx) => UICtrl.setGridItem(idx, sym));
        UICtrl.setBonusCellEffect(gridResult);

        // 計算結果
        let newScore = userScore - totalBet;
        let newJackpot = jackpot + Math.floor(totalBet * JACKPOT_RATIO);
        let winText = "";
        let finalWin = 0;

        const multi = UICtrl.getMulti();
        const bSid = UICtrl.getBonusSid();
        let { totalReward, winLineCount, winCells, bonusLineCount, bonusCount } = calcWinReward(userBetData, totalBet, multi, bSid);
        const isFullScreen = checkFullScreen();

        // 一般中獎
        if (totalReward > 0) {
            newScore += totalReward;
            finalWin = totalReward;
            winText = `中獎 +${totalReward} 分`;
            if (winLineCount > 0) UICtrl.setWinCells(winCells);
            AudioMgr.playWin();

            if (bSid !== -1) {
                UICtrl.setBonusCellEffect(gridResult);
                UICtrl.showWinMarquee(`幸運加倍！${multi}倍 連線×${winLineCount}`);
            } else {
                UICtrl.showWinMarquee(`連線中獎！×${winLineCount}`);
            }
        }

        // Bonus 格子分（加倍模式下，grid 中每個 bonus 符號格子都給基礎分）
        if (bSid !== -1 && bonusCount > 0) {
            const allSymbols = Utils.getSymbolConfig();
            const bonusSym = allSymbols.find(s => s.id === bSid);
            if (bonusSym) {
                const bonusBaseReward = totalBet * bonusSym.rate;
                const bonusGridReward = bonusBaseReward * bonusCount;
                newScore += bonusGridReward;
                finalWin += bonusGridReward;
                totalReward += bonusGridReward;
                winText = `中獎 +${totalReward} 分`;
                UICtrl.setBonusCellEffect(gridResult);
            }
        }

        // 滿屏大獎
        if (isFullScreen) {
            newScore += newJackpot;
            finalWin += newJackpot;
            winText = "🎉 滿屏超級大獎！";
            newJackpot = RESET_JACKPOT;
            UICtrl.setFullWinEffect();
            AudioMgr.playJackpot();
            UICtrl.showWinMarquee("滿屏大獎！奪取全部獎池！");
        }

        // 更新最高獎金紀錄
        const oldMax = await DataStore.getMaxWin();
        if (finalWin > oldMax) {
            await DataStore.setMaxWin(finalWin);
            UICtrl.refreshMaxWinIfNew(finalWin);
        }

        // 持久化
        await DataStore.setUserScore(newScore);
        await DataStore.setJackpot(newJackpot);

        // 更新 UI
        UICtrl.updateScore(newScore);
        UICtrl.updateJackpot(newJackpot);
        if (winText) UICtrl.showWinTip(winText);

        // 恢復 idle 狀態
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
