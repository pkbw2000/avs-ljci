/**
 * Main - 主入口模組
 * 負責：初始化、事件綁定、Service Worker 註冊
 */
const Main = (async () => {
    /**
     * 初始化遊戲
     */
    async function init() {
        try {
            // 初始化 UI
            UICtrl.init();

            // 檢查教學引導
            await UICtrl.checkGuide();

            // 讀取持久化資料
            const userScore = await DataStore.getUserScore();
            const jackpot = await DataStore.getJackpot();
            const maxWin = await DataStore.getMaxWin();

            // 更新 UI 顯示
            UICtrl.updateScore(userScore);
            UICtrl.updateJackpot(jackpot);
            UICtrl.initMaxWinMarquee(maxWin);
            UICtrl.setStopBtn(true);

            // 綁定按鈕事件
            const startBtn = document.getElementById("startBtn");
            const stopBtn = document.getElementById("stopBtn");

            startBtn.addEventListener("click", async () => {
                if (GameCore.getState() !== "IDLE") return;

                const betData = UICtrl.getBetData();
                const totalBet = UICtrl.getTotalBet();
                const nowScore = await DataStore.getUserScore();

                if (!UICtrl.checkScoreAndBet(nowScore, totalBet)) return;
                await GameCore.runGame(betData, totalBet, nowScore, await DataStore.getJackpot());
            });

            stopBtn.addEventListener("click", () => {
                if (GameCore.getState() === "ROLLING") {
                    GameCore.stopRoll();
                }
            });
        } catch (err) {
            console.error("初始化遊戲失敗:", err);
            if (typeof UICtrl !== "undefined") {
                UICtrl.showWinTip("遊戲載入失敗，請重新整理");
            }
        }
    }

    /**
     * 註冊 Service Worker
     */
    function registerSW() {
        if ("serviceWorker" in navigator) {
            window.addEventListener("load", async () => {
                try {
                    await navigator.serviceWorker.register("service-worker.js");
                } catch (e) {
                    console.log("Service Worker 註冊失敗", e);
                }
            });
        }
    }

    // 註冊 SW 並初始化遊戲
    registerSW();
    await init();
})();
