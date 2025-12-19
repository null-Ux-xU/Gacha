/**
 * 
 * @param {Number} num - 表示中の総数(指定しないとゴミが残る) 
 * @param {Object[]} items -アイテムの一覧
 * @returns 
 */
export function formatLineup (num, items) {
    let msg = `全${num}種類\n`;

    Object.entries(items).slice(0, num).forEach(([indexKey, itemObj]) => {
        const name = itemObj.itemName || "はずれ";
        const rarity = itemObj.rarity || "";
        msg += `${rarity}：${name}\n`;
    });
    return msg;
}