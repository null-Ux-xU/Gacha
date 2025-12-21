/**
 * 
 * @param {Number} num - 表示中の総数(指定しないとゴミが残る) 
 * @param {Object[]} items -アイテムの一覧
 * @returns 
 */
export function formatLineup (gachaName, num, items) {

    let msg = `${gachaName}\n全${num}種類\n`;

    console.log(items);
    Object.entries(items).slice(0, num).forEach(([indexKey, itemObj]) => {
        const name = itemObj.name || "はずれ";
        const rarity = itemObj.rarity || "";
        msg += `${rarity}：${name}\n`;
    });
    return msg;
}