/**
 * ラインナップを文字列に変換
 * 
 * @param {String} gacyaName 
 * @param {Number} num - 表示中の総数(指定しないとゴミが残る) 
 * @param {Object[]} rarity -アイテムの一覧
 * @returns 
 */
export function formattedRarity (gacyaName, num, rarity) {
    let msg = `${gacyaName}\nレアリティ数:${num}\n`;

    for(let i = 0; i < rarity.length; i++) {
        msg += `${rarity[i].name}\t${rarity[i].value}\n`;
    }
    return msg;
}