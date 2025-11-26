import { MersenneTwister } from "./MersenneTwister.js";


/**
 * ガチャを引く
 * @param {Object} params パラメータ
 * @param {int} params.gachaCount - 回数(n連)
 * @param {float[]} params.probabilities - レアリティ毎の確率
 * @param {int} params.rarityNum - レアリティ個数
 * @param {string[]} params.rarityTable - レアリティの名前
 * @param {int} params.itemLineupNum - ラインナップの表示個数
 * @param {string[]} params.resultItems - アイテムリスト
 * @param {bool} params.isFilterOnlyActiveItems - 表示されているアイテムリストのに存在するレアリティの中から抽選 default:true
 * @returns {Object[]} 排出されたアイテム群[({ レアリティ, アイテム })]
 */
export function gachaLogic({gachaCount, probabilities, rarityNum, rarityTable, itemLineupNum, resultItems, isFilterOnlyActiveItems = true}) {
    //配列生成
    const itemArray = {};
    for (const rarity of rarityTable) {
        itemArray[rarity] = [];
    }
    
    //渡された配列からレアリティと名前を取り出し、詰め替える
    const entries = Object.entries(resultItems).slice(0, itemLineupNum);

    for (const [indexNo, itemObj] of entries) {
        if (!itemObj.rarity) continue;

        const itemName = itemObj.itemName?.trim() || "はずれ";
        const rarity = itemObj.rarity;

        if (itemArray[rarity]) {
            itemArray[rarity].push({ indexNo, itemName });
        }
    }

     //フィルタ機能
    if (isFilterOnlyActiveItems) {
        let removedProbabilityTotal = 0;

        for (let i = 0; i < rarityNum; i++) {
            const rarity = rarityTable[i];

            //ラインナップに存在しないレアリティ
            if (itemArray[rarity].length === 0) {
                removedProbabilityTotal += probabilities[i];
                probabilities[i] = 0;
            }
        }

        // 0番目のレアリティに加算
        if (removedProbabilityTotal > 0) {
            probabilities[0] += removedProbabilityTotal;
        }
    }

    // 累積確率作成
    const cumulativeProb = [];
    let sum = 0;
    for (let i = 0; i < rarityNum; i++) {
        sum += probabilities[i];
        cumulativeProb.push(sum);
    }

    //乱数生成
    const mt = new MersenneTwister(Date.now());
  
    //結果を代入する配列
    const results = [];

    //countに応じたループ(n連実装部)
    for(let i = 0; i < gachaCount; i++ ){
        
        //乱数生成
        let rand = mt.random()*100;

        // 二分探索でレアリティ決定
        let left = 0, right = rarityNum - 1
        let rarityIndex = right;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (rand < cumulativeProb[mid]) {
                rarityIndex = mid;
                right = mid - 1;
            }
            else {
                left = mid + 1;
            }
        }
        const rarity = rarityTable[rarityIndex];
        
        //アイテム抽選( "" or undefind は「はずれ」)
        const itemList = itemArray[rarity];
        let item = "はずれ";
        let indexNo = null;

        if (itemList && itemList.length > 0) {
            const selected = itemList[Math.floor(mt.random() * itemList.length)];
            if (selected && selected.itemName.trim() !== "") {
                item = selected.itemName;
                indexNo = selected.indexNo;
            }
        }
        results.push({ rarity, item, indexNo });
    }
    return results;
}