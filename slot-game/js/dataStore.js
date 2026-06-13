const DataStore = (() => {
    const DB_NAME = "SlotGameDB";
    const DB_VERSION = 1;
    let db = null;
    let dbOpenPromise = null;

    function openDB() {
        // Prevent concurrent open calls
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
                reject(new Error("IndexedDB 開啟失敗: " + e.target.error?.message || "未知錯誤"));
            };
        });

        return dbOpenPromise;
    }

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

    // 初始參數
    const DEFAULT_SCORE = 2000;
    const DEFAULT_JACKPOT = 50000;
    const DEFAULT_MAX_WIN = 0;

    return {
        async getUserScore() {
            const val = await get("userScore");
            return val ?? DEFAULT_SCORE;
        },
        async setUserScore(score) {
            await set("userScore", Number(score));
        },
        async getJackpot() {
            const val = await get("jackpot");
            return val ?? DEFAULT_JACKPOT;
        },
        async setJackpot(pool) {
            await set("jackpot", Number(pool));
        },
        async getGuideStatus() {
            const val = await get("guideDone");
            return val === true;
        },
        async setGuideDone() {
            await set("guideDone", true);
        },
        async getMaxWin() {
            const val = await get("maxWin");
            return val ?? DEFAULT_MAX_WIN;
        },
        async setMaxWin(num) {
            await set("maxWin", Number(num));
        }
    };
})();
