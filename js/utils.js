/**
 * Utils - 工具模組
 * 負責：符號配置、權重隨機、中獎連線、工具函式
 * 使用 IIFE 封裝，避免污染全域命名空間
 */
const Utils = (() => {
    /**
     * 符號配置
     * rate: 中獎倍率（用於獎勵計算）
     * weight: 出現權重（用於隨機抽取）
     */
    const SYMBOL_CONFIG = [
        { id: 0, src: "symbols/lv1_s.png", rate: 50, weight: 10, name: "小黃鯊" },
        { id: 1, src: "symbols/lv2_a1.png", rate: 28, weight: 15, name: "鸚鵡" },
        { id: 2, src: "symbols/lv2_a2.png", rate: 28, weight: 15, name: "龍貓" },
        { id: 3, src: "symbols/lv3_b1.png", rate: 12, weight: 20, name: "企鵝" },
        { id: 4, src: "symbols/lv3_b2.png", rate: 10, weight: 20, name: "變色龍" },
        { id: 5, src: "symbols/lv3_b3.png", rate: 8,  weight: 20, name: "孔雀" }
    ];

    /**
     * 中獎連線定義（8 條）
     * 0 1 2
     * 3 4 5
     * 6 7 8
     */
    const WIN_LINES = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // 水平
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // 垂直
        [0, 4, 8], [2, 4, 6]              // 對角
    ];

    /**
     * 物件池 - 用於減少 GC 負擔
     */
    const SYMBOL_POOL = [];

    /**
     * 權重隨機抽取符號
     * @returns {Object} 符號物件 { id, src, rate, weight, name }
     */
    function getRandomSymbol() {
        const totalWeight = SYMBOL_CONFIG.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.floor(Math.random() * totalWeight);
        for (const item of SYMBOL_CONFIG) {
            random -= item.weight;
            if (random < 0) return item;
        }
        return SYMBOL_CONFIG[0];
    }

    /**
     * 從物件池取得符號物件（減少物件建立）
     */
    function getSymbolFromPool(symbolData) {
        let obj = SYMBOL_POOL.pop();
        if (!obj) {
            obj = {};
        }
        obj.id = symbolData.id;
        obj.src = symbolData.src;
        obj.rate = symbolData.rate;
        obj.weight = symbolData.weight;
        obj.name = symbolData.name;
        return obj;
    }

    /**
     * 返回物件池
     */
    function returnSymbolToPool(obj) {
        if (obj && typeof obj === "object") {
            obj.id = -1;
            obj.src = "";
            obj.rate = 0;
            obj.weight = 0;
            obj.name = "";
            SYMBOL_POOL.push(obj);
        }
    }

    return {
        getRandomSymbol,
        getSymbolConfig: () => [...SYMBOL_CONFIG],
        getWinLines: () => [...WIN_LINES],
        getSymbolFromPool,
        returnSymbolToPool,
        formatNum(num) {
            return Number(num).toLocaleString();
        },
        debounce(fn, delay = 100) {
            let timer = null;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => fn.apply(null, args), delay);
            };
        }
    };
})();
