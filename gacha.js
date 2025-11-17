import { MersenneTwister } from "./MersenneTwister.js";


/**
 * ガチャを引く
 * @param {Object} params パラメータ
 * @param {int} params.gachaCount - 回数(n連)
 * @param {float[]} params.probabilities - レアリティ毎の確率
 * @param {int} params.rarityNum - レアリティ個数
 * @param {string[]} params.rarityTable - レアリティの名前
 * @param {string[]} params.itemsByRarity - レアリティごとのアイテムリスト
 * @returns {Object[]} 排出されたアイテム群[({ レアリティ, アイテム })]
 */
export function gachaLogic({gachaCount, probabilities, rarityNum, rarityTable, itemsByRarity}) {
    //乱数生成
    const mt = new MersenneTwister(Date.now());
  
    //計算に使う変数の作成
    const resultLen = [];

    //countに応じたループ(n連実装部)
    for(let i = 0; i < gachaCount; i++ ){
        

        //初期化
        let rand = mt.random()*100;
        let cumulative = 0;
        let rarity = "";

        //レアリティ抽選
        for (let j = 0; j < rarityNum; j++) {
            //確率を加算して何回目で当たったかでレアリティを確定(N→0~60まで R60以上60+n以下)
            cumulative += probabilities[j];

            //当たった時の処理
            if (rand < cumulative) {
                rarity = rarityTable[j];
                break;
            }
        }

        //アイテム抽選( "" or undefind は「はずれ」)
        const itemList = itemsByRarity[rarity] || [];
        let item = "はずれ";

        if (itemList.length > 0) {
            const selected = itemList[Math.floor(mt.random() * itemList.length)];
            // 空文字なら「はずれ」にする
            item = selected && selected.trim() !== "" ? selected : "はずれ";
        }

        resultLen.push({ rarity, item });
    }
    return resultLen;
}