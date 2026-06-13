const Utils = (() => {
    const SYMBOL_CONFIG = [
        { id: 0, src: "symbols/lv1_s.png", rate: 50, weight: 10, name: "小黃鯊" },
        { id: 1, src: "symbols/lv2_a1.png", rate: 28, weight: 15, name: "鸚鵡" },
        { id: 2, src: "symbols/lv2_a2.png", rate: 28, weight: 15, name: "龍貓" },
        { id: 3, src: "symbols/lv3_b1.png", rate: 12, weight: 20, name: "企鵝" },
        { id: 4, src: "symbols/lv3_b2.png", rate: 10, weight: 20, name: "變色龍" },
        { id: 5, src: "symbols/lv3_b3.png", rate: 8,  weight: 20, name: "孔雀" }
    ];

    const WIN_LINES = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ];

    const OBJECT_POOL = [];

    function getRandomSymbol() {
        const totalWeight = SYMBOL_CONFIG.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.floor(Math.random() * totalWeight);
        for (const item of SYMBOL_CONFIG) {
            random -= item.weight;
            if (random < 0) return item;
        }
        return SYMBOL_CONFIG[0];
    }

    return {
        getRandomSymbol,
        getSymbolConfig: () => [...SYMBOL_CONFIG],
        getWinLines: () => [...WIN_LINES],
        formatNum(num) {
            return Number(num).toLocaleString();
        },
        debounce(fn, delay = 100) {
            let timer = null;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => fn.apply(this, args), delay);
            };
        },
        getFromPool() {
            return OBJECT_POOL.pop() || {};
        },
        returnToPool(obj) {
            OBJECT_POOL.push(obj);
        }
    };
})();
