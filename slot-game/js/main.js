const Main = (async () => {
    async function init() {
        try {
            UICtrl.init();
            await UICtrl.checkGuide();

            const userScore = await DataStore.getUserScore();
            const jackpot = await DataStore.getJackpot();
            const maxWin = await DataStore.getMaxWin();

            UICtrl.updateScore(userScore);
            UICtrl.updateJackpot(jackpot);
            UICtrl.initMaxWinMarquee(maxWin);
            UICtrl.setStopBtn(true);

            const startBtn = document.getElementById("startBtn");
            const stopBtn = document.getElementById("stopBtn");

            startBtn.addEventListener("click", async () => {
                if (GameCore.getState() !== "IDLE") return;

                const betData = UICtrl.getBetData();
                const totalBet = UICtrl.getTotalBet();
                const nowScore = await DataStore.getUserScore();

                if(!UICtrl.checkScoreAndBet(nowScore, totalBet)) return;
                await GameCore.runGame(betData, totalBet, nowScore, await DataStore.getJackpot());
            });

            stopBtn.addEventListener("click", () => {
                if(GameCore.getState() === "ROLLING"){
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

    function registerSW() {
        if ("serviceWorker" in navigator) {
            window.addEventListener("load", async () => {
                try {
                    await navigator.serviceWorker.register("service-worker.js");
                } catch (e) {
                    console.log("SW 註冊失敗", e);
                }
            });
        }
    }

    registerSW();
    await init();
})();
