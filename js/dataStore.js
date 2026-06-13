/**
 * DataStore - 持久化資料模組
 * 使用 IndexedDB 儲存玩家數據
 * 提供 async/await 介面，方便使用
 */
const DataStore = (() => {
    const DB_NAME = "SlotGameDB";
    const DB_VERSION = 1;
    let db = null;
    let dbOpenPromise = null;

    /**
     * 開啟資料庫（避免併發開啟）
     */
    function openDB() {
        if (dbOpenPromise) return dbOpenPromise;
        if (db) return Promise.resolve(db);

        dbOpenPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);

            req.onupgradeneeded = e => {
                const newDb = e.target.result;
                if (!newDb.objectStoreNames.contains("gameData")) {
                    newDb.createObjectStore("gameData", { keyPath: "key" });
                }
            };

            req.onsuccess = e => {
                db = e.target.result;
                dbOpenPromise = null;
                resolve(db);
            };

            req.onerror = e => {
                dbOpenPromise = null;
                reject(new Error("IndexedDB 開啟失敗: " + (e.target.error?.message || "未知錯誤")));
            };
        });

        return dbOpenPromise;
    }

    /**
     * 讀取鍵值
     */
    async function get(key) {
        try {
            await openDB();
            const tx = db.transaction("gameData", "readonly");
            const store = tx.objectStore("gameData");
            const res = await new Promise((resolve, reject) => {
                const req = store.get(key);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
            return res ? res.value : null;
        } catch (err) {
            console.warn("DataStore.get 失敗:", key, err);
            return null;
        }
    }

    /**
     * 儲存鍵值
     */
    async function set(key, value) {
        try {
            await openDB();
            const tx = db.transaction("gameData", "readwrite");
            const store = tx.objectStore("gameData");
            await new Promise((resolve, reject) => {
                const req = store.put({ key, value });
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
        } catch (err) {
            console.warn("DataStore.set 失敗:", key, err);
        }
    }

    // 預設值
    const DEFAULT_SCORE = 2000;
    const DEFAULT_JACKPOT = 50000;
    const DEFAULT_MAX_WIN = 0;

    return {
        /** 取得玩家積分 */
        async getUserScore() {
            const val = await get("userScore");
            return val ?? DEFAULT_SCORE;
        },

        /** 設定玩家積分 */
        async setUserScore(score) {
            await set("userScore", Number(score));
        },

        /** 取得累積獎池 */
        async getJackpot() {
            const val = await get("jackpot");
            return val ?? DEFAULT_JACKPOT;
        },

        /** 設定累積獎池 */
        async setJackpot(pool) {
            await set("jackpot", Number(pool));
        },

        /** 取得教學狀態 */
        async getGuideStatus() {
            const val = await get("guideDone");
            return val === true;
        },

        /** 標記教學已關閉 */
        async setGuideDone() {
            await set("guideDone", true);
        },

        /** 取得最高獎金紀錄 */
        async getMaxWin() {
            const val = await get("maxWin");
            return val ?? DEFAULT_MAX_WIN;
        },

        /** 設定最高獎金紀錄 */
        async setMaxWin(num) {
            await set("maxWin", Number(num));
        }
    };
})();
