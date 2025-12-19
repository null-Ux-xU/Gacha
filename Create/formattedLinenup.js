/**
 * ラインナップを文字列に変換
 * 
 * @param {String} gacyaName 
 * @param {Number} num - 表示中の総数(指定しないとゴミが残る) 
 * @param {Object[]} items -アイテムの一覧
 * @returns 
 */
export function formatLineup (gacyaName, num, items) {
    let msg = `${gacyaName}\n全${num}種類\n`;

    Object.entries(items).slice(0, num).forEach(([indexKey, itemObj]) => {
        const name = itemObj.itemName || "はずれ";
        const rarity = itemObj.rarity || "N";
        msg += `${rarity}\t${name}\n`;
    });
    return msg;
}