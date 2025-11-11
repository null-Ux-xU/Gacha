/**
 * 配列の重複を個数表記に置き換える
 * 
 * @param {Object} array まとめたい配列
 * @returns {Object} まとめた後の配列
 * 
 */
export function arraySummary(array) {
    const summary = {};

    for (const obj of array) {
      const key = `${obj.rarity}：${obj.item}`;
      summary[key] = (summary[key] || 0) + 1;
    }

    const summaryArray = Object.entries(summary).map(([key, val]) => {
        const [rarity, item] = key.split("：");
        return { rarity, item, val };
    });
    return summaryArray;
}