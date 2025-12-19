import { gachaLogic } from "./GachaLogic/gacha.js";
import { sortByRarityFromN, sortByRarityFromLR } from "./GachaLogic/sort.js";
import { arraySummary } from "./GachaLogic/arraySummary.js";
import { createTableElement } from "./Create/createTableElement.js";
import {saveDataToLocalStorage, getDataFromLocalStorage} from "./DataSave/localStrage.js";
import {createTableHeader} from "./Create/createTableHeader.js";
import {importZipFile, getResultItemsToFile} from "./DataSave/importZip.js";
import {saveToIndexedDB, loadFromIndexedDB, clearAllIndexedDBData, showAllIndexedDBData, saveHistory, loadHistoryFromIndexedDB} from "./DataSave/indexedDB.js";
import {getFormattedDate} from "./Create/formattedDate.js";
import { createCsvURL, createTextURL, createTweetURL} from "./Create/createURL.js";
import { showNotification } from "./showNotification.js";
import { buildHistoryToTextString, buildHistoryToCsvString} from "./DataSave/exportHistoryData.js";
import { Xoshiro256ss } from "./Create/Xoshiro256ss.js";
import { formatLineup } from "./Create/formattedLinenup.js";
import { createItemNameArray } from "./Create/createItemNameArray.js";
import { formattedRarity } from "./Create/formattedRarity.js";

class MainData
{
  static createRandomObject;

  //---変更されないデータ群----

  //レアリティのベース
  static rarityTable = ["N", "R", "SR", "SSR", "UR" ,"LR"];
  
  //レアリティ名、排出確率のヘッダーテキスト
  static rarityDisplayHeaderTextArray = ["表示名（編集可）", "排出確率（%）"]; 

  //アイテムのレアリティと名前編集のヘッダーテキスト
  static itemDisplayHeaderTextArray = ["レアリティ（変更可）","アイテム名（編集可）"];

  //デフォルトの確率
  static baseWeights = {
    N: 55, 
    R: 30,
    SR: 10,
    SSR: 3,
    UR: 1.5,
    LR: 0.5
  };

  //結果ツイートURL
  static tweetUrl = `https://twitter.com/intent/tweet`;

  //DBに保存されているkeyの一覧
  static dataKey = new Array;

  //現在読み込んでいるデータのkey
  static onLoadedDatakey = "";

  //データ消去の警告文
  static deleteMassage ="以下のデータが全て削除されます。よろしいですか？\n・ガチャの名前\n・読み込んだファイル\n・レアリティ表示名\n・排出確率\n・排出アイテム";
  //------------------------
  
  //---ユーザーの操作によって自由に変更されるデータ群-----

  //ガチャの名前(連想配列でdatakeyと紐づける)
  static gachaName = new Map;

  //レアリティ総数
  static rarityNum = 6;

  //ラインナップ総数
  static itemLineupNum = 5;

  //レアリティの表示変更用
  static rarityDisplayNames = {
    N: "N",
    R: "R",
    SR: "SR",
    SSR: "SSR",
    UR: "UR",
    LR: "LR"
  };

  //アイテム名とそのレアリティ
  static resultItems = {};

  //ユーザーが設定したレアリティの確率
  static editableWeights = [];

  //詳細設定の選択状態の保持
  static userSettings ={};
  //------------------------

  /**
   * 編集可能な値全てを取得する
   * 
   * @returns 編集可能な変数名をキーとした連想配列
   */
  static getEditableDatas() {
    MainData.saveUserSettings();
    const datas = {
      rarityNum: this.rarityNum,
      itemLineupNum: this.itemLineupNum,
      rarityDisplayNames: this.rarityDisplayNames,
      resultItems: this.resultItems,
      editableWeights: this.editableWeights,
      userSettings: this.userSettings
    }
    return datas; 
  }

  /**
   * 出力方式、詳細設定の保存用関数
   */
  static saveUserSettings() {
    const downloadType = getValueToRadioButton("downloadType");
    const isFilterOnlyActiveItems = document.getElementById("isFilterOnlyActiveItems")?.checked;
    const combineDuplicates = document.getElementById("combineDuplicates")?.checked;
    const rarityHighlight = document.getElementById("rarityHighlight")?.checked;
    const sortType = getValueToRadioButton("raritySort");

    this.userSettings = {
      downloadType,
      isFilterOnlyActiveItems,
      combineDuplicates,
      rarityHighlight,
      sortType
    }
  }

  /**
   * 保存されたユーザー設定の反映
   */
  static loadUserSettings() {
    //対象のElementを取得
    const downloadType = document.querySelector(`input[value="${MainData.userSettings?.downloadType}"]`) ?? document.querySelector(`input[value=".txt"]`);
    const isFilterOnlyActiveItems = document.getElementById("isFilterOnlyActiveItems");
    const combineDuplicates = document.getElementById("combineDuplicates");
    const rarityHighlight = document.getElementById("rarityHighlight");
    const sortType = document.querySelector(`input[value="${MainData.userSettings?.sortType}"]`) ?? document.querySelector(`input[value="none"]`);

    
    isFilterOnlyActiveItems.checked = MainData.userSettings?.isFilterOnlyActiveItems ?? true;
    combineDuplicates.checked = MainData.userSettings?.combineDuplicates ?? true;
    rarityHighlight.checked = MainData.userSettings?.rarityHighlight ?? false;
    downloadType.checked = true;
    sortType.checked = true;
  }

  /**
   * 編集可能な値全てに対して値をセットする
   * 
   * @param {Object} datas  編集可能な変数名をキーとした連想配列
   */
  static setEditableDatas({ 
      rarityNum = null,
      itemLineupNum = null,
      rarityDisplayNames = null,
      resultItems = null,
      editableWeights = null,
      userSettings = null 
    } = {}) {
    this.rarityNum = rarityNum ?? 6;
    this.itemLineupNum = itemLineupNum ?? 5;
    this.resultItems = structuredClone(resultItems || {});
    this.editableWeights = structuredClone(editableWeights || {});
    if(rarityDisplayNames) {
      this.rarityDisplayNames = structuredClone(rarityDisplayNames);
    }
    else{
      this.rarityDisplayNames = {
        N: "N",
        R: "R",
        SR: "SR",
        SSR: "SSR",
        UR: "UR",
        LR: "LR"
      };
    }

    

    //HTMLに対して値の変更を反映
    const elementRarityNum = document.getElementById("rarityNum");
    elementRarityNum.value = this.rarityNum;
    elementRarityNum.options[elementRarityNum.value - 1];
    document.getElementById("lineupNum").value = this.itemLineupNum;
    if(userSettings) {
      this.userSettings = structuredClone(userSettings);
    }
    else {
      this.userSettings = null;
    }
    MainData.loadUserSettings();
    updateLabels();
    showLineup();
  }

  /**
   * 編集可能な値の初期化
   */
  static initDefaultValue(){
    MainData.onLoadedDatakey = "";
    this.setEditableDatas();
  }


  //デバッグ用
  static debugMainData() {
    let msg = "MainData Debug\n\n";

    msg += "[rarityNum]:";
    msg += `${MainData.rarityNum}\n`;

    msg += "[itemLineupNum]:";
    msg += `${MainData.itemLineupNum}\n`;

    msg += "[editableWeights]\n";

    for (const [r, v] of Object.entries(this.editableWeights)) {
      msg += `  ${r}: ${v}\n`;
    }

    msg += "\n";
    msg += "[rarityDisplayNames]\n";

    for (const [r, v] of Object.entries(this.rarityDisplayNames)) {
      msg += `  ${r}: ${v}\n`;
    }

    msg += "\n";
    msg += "[resultItems]\n";

    for (const [indexKey, itemObj] of Object.entries(this.resultItems)) {
      const name = itemObj.itemName || "[\"空文字列\"]";
      const rarity = itemObj.rarity || "(no rarity)";
      msg += `  ${indexKey}: [Rarity: ${rarity}] ${name}\n`;
    }

    msg += "[dataKey]\n";
  
    for(let i = 0; i < MainData.dataKey.length; i++){
      msg += `${i} : ${MainData.dataKey[i] || "none"}\n`;
    }


    msg += "\n";
    msg += "[gachaName]\n";

    for (const [indexKey, value] of this.gachaName) {
      const name = value || "[\"空文字列\"]";
      
      msg += `  ${indexKey}: ${name}\n`;
    }
    msg += "\n";
    msg += `[onLoadedDatakey]:${MainData.onLoadedDatakey}`;

    msg += "\n";
    msg += "[userSettings]";

    if(this.userSettings){
      msg += `\n`;
      for (const [indexKey, value] of Object.entries(this.userSettings)) {
        msg += `  ${indexKey}: ${value}\n`;
      }
    }
    else {
      msg += `:null`
    }


    console.log(msg);
  }
}

/**
 * ガチャシステム
 * 
 * @param {int} count ガチャ回数
 */
async function callMainAction(count) {
  //入力欄から確率を取得
  const probabilities = MainData.rarityTable.slice(0, MainData.rarityNum).map(r => {
    return parseFloat(document.getElementById(r + "-Probability").value);
  });
  
  // 合計チェック
  const total = calcTotalValue(probabilities);
  if (Math.abs(parseFloat(total - 100)) > 0.01) {
    alert("合計確率が100%になるように設定してください！ (現在: " + parseFloat(total.toFixed(2)) + "%)");
    return;
  }

  //ガチャの処理
  let resultLen = gachaLogic({
    gachaCount: count,
    probabilities: probabilities,
    rarityNum: MainData.rarityNum,
    rarityTable: MainData.rarityTable,
    resultItems: MainData.resultItems,
    itemLineupNum: MainData.itemLineupNum,
    isFilterOnlyActiveItems: document.getElementById("isFilterOnlyActiveItems")?.checked,
    createRandomObject: MainData.createRandomObject
  });

  //レアリティソート
  switch(getValueToRadioButton("raritySort")) {
    case "desc": 
      sortByRarityFromLR(resultLen, MainData.rarityTable);
      break;

    case "asc":
    sortByRarityFromN(resultLen, MainData.rarityTable);
    break;

    case "none": break;
  };

  //重複をまとめる
  if (document.getElementById("combineDuplicates")?.checked) {
    resultLen = arraySummary(resultLen);
  }

  //表示処理
  const tbody = document.getElementById("resultBody");
  tbody.replaceChildren(); 
  


  //zipダウンロード用の変数の生成
  const resultIndexNo = [];
  const name = MainData.gachaName.get(MainData.onLoadedDatakey) ?? document.getElementById("gachaName").value;
  let userName = document.getElementById("userName").value || "名無し";
  let resultText = `${userName}さん\nガチャ名:[${name?.trim() || "なし"}]${count}連\n` ?? "";
  
  const frag = document.createDocumentFragment(); //DOMアクセスを減らせるらしい

  for (const res of resultLen) {
    const tr = document.createElement("tr");
    const rarityTd = document.createElement("td");
    const itemTd = document.createElement("td");
    const valueTd = document.createElement("td");

    rarityTd.insertAdjacentText("beforeend", `${MainData.rarityDisplayNames[res.rarity]}`);
    itemTd.insertAdjacentText("beforeend", `${res.item}`);
    valueTd.insertAdjacentText("beforeend", `x${res.val || 1}個`);

    
    //レアリティ毎の強調表示
    if (document.getElementById("rarityHighlight")?.checked) {
      //色の指定はcssで行っている
      rarityTd.classList.add(`${res.rarity}`);
      itemTd.classList.add(`${res.rarity}`);
      valueTd.classList.add(`${res.rarity}`);
    }
    tr.append(rarityTd, itemTd, valueTd);
    frag.appendChild(tr);

    const index = parseInt(res.indexNo?.split(".")[1] ?? -1, 10);
    resultIndexNo.push(index);
    console.log(`${res.indexNo}:${index}`);

    resultText += `${MainData.rarityDisplayNames[res.rarity]}：${res.item} ×${res.val || 1}個\n`;
  }
  tbody.appendChild(frag);
  document.getElementById("resultElements").hidden = false;

  //結果ツイート文生成
  const twitterTag = "#空のつーる";
  resultText += twitterTag; 
  MainData.tweetUrl = createTweetURL(resultText);

  updateHistory(resultLen, userName, name?.trim());
  
  //ツイートボタン
  if(MainData.onLoadedDatakey){
    let fileName = `${userName}さん_ガチャ名[${name?.trim() || "なし"}]_${count}連結果`;
    await getResultItemsToFile(MainData.onLoadedDatakey, resultIndexNo ,fileName);
  }
  else {
    const anchor = document.getElementById("downloadZipBtn");
    anchor.hidden = true;
    anchor.style.display = "none";
  }
}

function updateLineupToZip(id) {
  if(MainData.dataKey.length > 0) {
    const loadZipNameElement = document.getElementById("loadZipName");
    if (!loadZipNameElement) return;
    loadZipNameElement.replaceChildren();
    const fragment = document.createDocumentFragment();

    for(const [key ,value] of MainData.gachaName.entries()){
      const option = document.createElement("option");
      option.value = key;
      option.textContent = value;
      if(id === key)option.selected = true;
      fragment.appendChild(option);
    }

    const stringValue = "新規データ";
    const option = document.createElement("option");
    option.value = stringValue;
    option.textContent = stringValue;
    if(id === undefined || id === null) option.selected = true;
    fragment.appendChild(option);

    loadZipNameElement.appendChild(fragment);
  }
}

/**
 * レアリティ名と排出確率を表示する
 */
function updateLabels() {
   //id=tableのタグを取得し、中身を消す
  const container = document.getElementById("rarityTable");
  container.replaceChildren();

  //テーブルtagを生成
  const table = document.createElement("table");
  table.style.borderCollapse = "collapse"; 
  table.style.marginTop = "10px";

  //ヘッダーの作成と追加
  table.appendChild(createTableHeader(MainData.rarityDisplayHeaderTextArray));
  
  //bodyの作成
  const tbody = document.createElement("tbody");

  //表示される確率の格納
  const baseWeights = MainData.rarityTable.slice(0, MainData.rarityNum).map(rarity => MainData.baseWeights[rarity]);
  const editableWeights = MainData.rarityTable.slice(0, MainData.rarityNum).map(rarity => MainData.editableWeights[rarity]);

  //失われた値を最高レアリティに追加
  baseWeights[MainData.rarityNum - 1] += parseFloat(100 - calcTotalValue(baseWeights));

  //レアリティの数だけ入力欄を作成
  for (let i = 0; i < MainData.rarityNum; i++) {
    const rarity = MainData.rarityTable[i];
    const displayName = MainData.rarityDisplayNames[rarity];
    const resultValue = editableWeights[i]?.toFixed(2) || baseWeights[i].toFixed(2);
    const row = document.createElement("tr");
    
    //表示名入力
    const  tdNameInput = createTableElement({
      elementId: rarity + "-DisplayName",
      elementName: "editRarityDisplayNameForm",
      inputType: "text",
      inputValue: displayName,
      ariaLabel: "レアリティ" + rarity + "を任意の文字に置き換える為の入力欄",
    });
    tdNameInput.addEventListener("input", onNameInput);

    //確率入力
    const  tdProbInput = createTableElement({
      elementId: rarity + "-Probability",
      elementName: "editRarityProbabilityForm",
      inputType: "number",
      inputValue: resultValue,
      ariaLabel: "レアリティ" + rarity + "の排出確率を入力する欄",
      divWrapperName: "ProbabilityWrapper",
      step: parseFloat(0.1)
    });
    tdProbInput.addEventListener("input", onProbInput);

    //作成したエレメントを追加
    row.appendChild(tdNameInput);
    row.appendChild(tdProbInput);
    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  container.appendChild(table);
}


/**
 * 排出アイテムを作成する
 */
function showLineup() {
  //lineupTableの取得と初期化
  const table = document.getElementById("lineupTable");
  table.replaceChildren();

  //ラインナップの総数取得
  const totalCount = MainData.itemLineupNum;

  //ヘッダー作成
  table.appendChild(createTableHeader(MainData.itemDisplayHeaderTextArray));

  //bodyを作成
  const tbody = document.createElement("tbody");

  // totalCount に合わせて行を作る
  for (let i = 0; i < totalCount; i++) {
    //1行ごとに要素を作成
    const row = document.createElement("tr");
    const arraykey = row.id = "indexNo." + i;

    const itemData = MainData.resultItems[row.id] || { rarity: "N", itemName: "" }; // 空白はN

    //レアリティプルダウン
    const rarityCell = document.createElement("td");
    const select = document.createElement("select");
    select.id = "index-" + i + "-editItemRarityForm";
    select.name = "editItemRarityForm";
    select.ariaLabel = "上から" + (i + 1) + "番目にあるアイテムのレアリティ";

    //レアリティの数だけプルダウンの要素を作成
    MainData.rarityTable.slice(0, MainData.rarityNum).forEach(r => {
      const option = document.createElement("option");
      option.value = r;
      option.textContent =  MainData.rarityDisplayNames[r];
      if (r === itemData.rarity) option.selected = true;
      select.appendChild(option);
    });

    rarityCell.appendChild(select);

    //アイテム名テキストボックス
    const itemCell = createTableElement({
      elementId: "index-" + i + "-editItemNameForm",
      elementName: "editItemNameForm",
      inputType: "text",
      inputValue: itemData.itemName,
      ariaLabel: "上から" + (i + 1) + "番目にあるアイテム名入力欄",
      className: "editItemNameForm"
    });
    
    MainData.resultItems[arraykey] = {
      itemName: itemData.itemName,
      rarity: itemData.rarity      
    };





    //名前入力欄に変更があったら登録

    itemCell.addEventListener("paste", (e)=> {
      //デフォルトの処理を停止
      e.preventDefault();
      //一行ずつのテキストに変換
      const lines = createItemNameArray(e.clipboardData.getData("text"));

      //貼り付けられた位置を取得
      const keyTemplate = "indexNo.";
      const startArraykey = row.id;
      console.log(startArraykey);
      const startIndex = Number(startArraykey.replace(keyTemplate,""));
      console.log(startIndex);
      

      lines.forEach((line, i) => {
        if (MainData.resultItems[keyTemplate + String(startIndex + i)]) {
          MainData.resultItems[keyTemplate + String(startIndex + i)].itemName = line;
        }
        else {
          MainData.resultItems[keyTemplate + String(startIndex + i)] = {
            itemName: line,
            rarity: itemData.rarity
          };
        }
      });

      const lineupNum = document.getElementById("lineupNum");
      const newItemNum = Number(lines.length + startIndex); 
      if(lineupNum.value < newItemNum) {
        lineupNum.value = newItemNum;
        MainData.itemLineupNum = newItemNum;
      }
      showLineup();      
    });

    itemCell.addEventListener("change", e => {
      //入力欄の番号取得
      const arraykey = row.id;

      //変更された値の取得
      const newName = e.target.value;
      
      //対象のindex番号がなかったら作成
      if (!MainData.resultItems[arraykey]) {
        MainData.resultItems[arraykey] = {
          itemName: itemData.itemName,
          rarity: itemData.rarity
        };
      }
      //新しい名前を追加
      MainData.resultItems[arraykey].itemName = newName;
    });

    //プルダウンに変更があったら登録
    select.addEventListener("change", e => {
      //入力欄の番号をチェック
      const arraykey = row.id;

      //変更された値の取得
      const newRarity = e.target.value;

      //対象のindex番号がなかったら作成
      if (!MainData.resultItems[arraykey]) {
        MainData.resultItems[arraykey] = {
          itemName: itemData.itemName,
          rarity: itemData.rarity
        };
      }
  
      //新しいレアリティに追加
      MainData.resultItems[arraykey].rarity = newRarity;
    });

    //作成したエレメントを追加
    row.appendChild(rarityCell);
    row.appendChild(itemCell);
    tbody.appendChild(row);
  }

  table.appendChild(tbody);

}

/**
 * 編集可能な情報をロードする関数
 */
function loadMainData() {
  const datas = getDataFromLocalStorage("gacyaData");
  if(!datas) {
    console.log("localStorage に保存されたデータが存在しません");
    return;
  }
  // dataKey 配列がある場合
  if(Array.isArray(datas.dataKey)) {
    MainData.dataKey = [...datas.dataKey];
  }

  // gachaName が存在していたら Map として復元
  if(datas.gachaName && typeof datas.gachaName === "object") {
    MainData.gachaName = new Map(Object.entries(datas.gachaName));
  }
}

/**
 * 編集可能な情報を保存する関数
 */
function saveMainData() {
  const saveData = {
    dataKey: [...MainData.dataKey],
    gachaName: Object.fromEntries(MainData.gachaName)
  };
  saveDataToLocalStorage("gacyaData",saveData);
}
/**
 * 文字列と一致するlocalstlageのデータを削除
 * 
 * @param {String} text localstrageの名前
 */
function deleteLocalStrageData(text) {
  localStorage.removeItem(String(text));
}

/**
 * メインデータの削除
 */
function deleteMainData() {
  deleteLocalStrageData("gacyaData");
}

/**
 * 配列内の合計値を求める関数
 * 
 * @param {number[]} numberArray
 * @returns 合計値 
 */
function calcTotalValue(numberArray){
  const totalWeight = numberArray.reduce((a, b) => a + b, 0);
  return totalWeight;
}

//表示名変更
function onNameInput(e) {
  const rarity = e.target.id.replace(/-DisplayName$/, "");
  const text = e.target.value.trim() || rarity;

  MainData.rarityDisplayNames[rarity] = text;
  showLineup();
}

//確率変更
function onProbInput(e) {
  const rarity = e.target.id.replace(/-Probability$/, "");
  MainData.editableWeights[rarity] = parseFloat(e.target.value) ?? MainData.baseWeights[rarity];
}

/**
 * ガチャ履歴の更新
 * 
 * @param {object[]} data -ガチャ結果
 * @param {String} userName -回した人の名前
 * @param {String} gachaName -ガチャの名前
 */
async function updateHistory(data, userName, gachaName) {
  //履歴の読み込み
  const history = await loadHistoryFromIndexedDB();

  //yyyy/mm/ddの日時取得
  const date = getFormattedDate();

  //該当日時がなかったら作成
  if (!history[date]) history[date] = {};

  //該当ユーザーがなかったら作成
  if (!history[date][userName]) history[date][userName] = {};

  //該当ガチャがなかったらリザルトと共に作成
  if (!history[date][userName][gachaName]) {
    history[date][userName][gachaName] = {results: []};
  }
  //結果の追加
  history[date][userName][gachaName].results.push(data);

  await saveHistory(history);
  await activeHistoryURL();
}

/**
 * ラジオボタンの選択されているElementの値を取得する
 * 
 * @param {String} name - inputの名前
 * @returns vale || "none"
 */
function getValueToRadioButton(name) {
  const selected = document.querySelector(`input[name="${String(name)}"]:checked`);
  return selected?.value ?? "none";
}

/**
 * 履歴をダウンロードするためのURLを設定する
 */
async function activeHistoryURL() {
  //履歴を取得
  const history = await loadHistoryFromIndexedDB();
  //文字列変換したデータを受け取る変数
  let resultValue;
  switch(getValueToRadioButton("downloadType")) {
    //テキストファイル
    case ".txt": 
      //結果をテキストファイル用の文字列に整形
      resultValue = buildHistoryToTextString(history, MainData.rarityDisplayNames);
      //成功したらURLを作成
      if(resultValue !== false) createTextURL(resultValue);
      break;
    //csvファイル
    case ".csv":
      //結果をcsvファイル用の文字列に整形
      resultValue = buildHistoryToCsvString(history,MainData.rarityDisplayNames);
      //成功したらURLを作成
      if(resultValue !== false) createCsvURL(resultValue);
      break;
    case "none": return;
  };
}

/**
 * 任意の文字列をクリップボードにコピー
 * 
 * @param {string} text 
 * @returns 
 */
async function setTextToClipboard(text) {
  if (!navigator.clipboard) {
      await showNotification("このブラウザは対応していません...", "error", 1500);
      return;
    }

    navigator.clipboard.writeText(text).then(
    async () => {
      await showNotification("クリップボードにコピーしました。", "success", 1500);
    },
    async () => {
      await showNotification("コピーに失敗しました。", "error", 1500);
    });
}

// イベント登録
window.addEventListener("DOMContentLoaded", () => {
  // --- 初期化処理 ---
  MainData.createRandomObject = Xoshiro256ss.fromSeed(Date.now());
  loadMainData();
  updateLineupToZip();
  updateLabels();
  showLineup();
  activeHistoryURL();
  const input = document.querySelector('input[type="text"][name="editRarityDisplayNameForm"]');
  input.addEventListener('input', () => {
    if (input.value.length > 10) {
      input.value = input.value.slice(0, 10);
    }
  });

  //コピー
  const name = MainData.gachaName.get(MainData.onLoadedDatakey) ?? document.getElementById("gachaName").value;
  
  //一覧のコピー
  document.getElementById("showItems").addEventListener("click", async() =>{
    //ラインナップを取得、テキストに変換
    const resultValue = formatLineup(name.trim() || "ガチャ名なし", MainData.itemLineupNum, MainData.resultItems);
    //クリップボードにコピー
    await setTextToClipboard(resultValue);
  });

  //レアリティのコピー
  document.getElementById("showRarity").addEventListener("click", async() =>{
    const rarityArray = []; //関数用の配列

    //レアリティの取り出し
    MainData.rarityTable.slice(0, MainData.rarityNum).map(r => {
      const rarityValue = parseFloat(document.getElementById(r + "-Probability").value); 
      rarityArray.push({ 
        name: MainData.rarityDisplayNames[r], 
        value: rarityValue
      });
    });
    //テキストに変換
    const resultValue = formattedRarity(name.trim() || "ガチャ名なし", MainData.rarityNum, rarityArray);

    //クリップボードにコピー
    await setTextToClipboard(resultValue);
  });

  // --- データ管理イベント ---
  const loadZipNameElement = document.getElementById("loadZipName");

  //新規ファイルのインポート
  const element = document.getElementById("importZip");
  element.addEventListener("change", async(e)=>{
    console.log(e.target.value);

    //value = ファイルパス
    let filePath = new String(e.target.value);

    //拡張子が[.zip]であるかの確認(最終文字から4文字のみを見て判断) 
    if(!filePath.includes(".zip", filePath.length - 4)) {
      showNotification("zipファイルを選択してください", "error", 4000);
      return;
    }
    const returnParam = await importZipFile(e);
    if(!returnParam) return;
    
    MainData.resultItems = returnParam.resultItems;
    MainData.dataKey.push(returnParam.zipId);
    MainData.gachaName.set(returnParam.zipId, returnParam.zipId);
    document.getElementById("lineupNum").value = MainData.itemLineupNum = returnParam.itemLineupNum;
    loadZipNameElement.value = returnParam.zipId;
    showLineup();
    updateLineupToZip(returnParam.zipId);
    MainData.onLoadedDatakey = returnParam.zipId;
    saveMainData();
    element.value = "";
  });
  
  //過去に読み込んだファイルのロード
  loadZipNameElement.addEventListener("change", async(e) => {
    const loadDataKey = e.target.value;

    //キーが存在しない(新規データ想定)
    if(!MainData.dataKey.includes(loadDataKey)) {
      console.log("指定されたキーは存在しません");
      MainData.initDefaultValue();
      return;
    }
    //読み込み処理
    const returnParam = await loadFromIndexedDB(loadDataKey);   
    console.log(returnParam);
    //データが無い(例外処理) 
    if (!returnParam) {
      console.log("データが見つかりません");
      MainData.initDefaultValue();
      return;
    }
    MainData.onLoadedDatakey = returnParam.id;
    MainData.setEditableDatas(returnParam.editableMainData);
  });

  //データ保存イベント
  document.getElementById("saveButton").addEventListener("click", async() =>{
    //保存する名前の取得
    const nameField = document.getElementById("gachaName");
    const gachaName = nameField.value.trim() || MainData.gachaName.get(MainData.onLoadedDatakey);
    
    if(!gachaName) {
      const errorText = document.getElementById("errorText");
      
      nameField.style.border = "5px solid #8a0b0b";
      errorText.hidden = false;
      await showNotification("名前を入力してください", "error", 1500);
      return;
    }

    //表示しているデータが既に存在するかチェック
    if(MainData.dataKey.includes(MainData.onLoadedDatakey)) {
      //ガチャの名前を変更
      MainData.gachaName.set(MainData.onLoadedDatakey, gachaName);
      const newData = await loadFromIndexedDB(MainData.onLoadedDatakey);
      newData.editableMainData = structuredClone(MainData.getEditableDatas());
      saveToIndexedDB(newData.id, gachaName, newData.blob ?? null, newData.editableMainData);
      saveMainData();
      updateLineupToZip(newData.id);
      MainData.onLoadedDatakey = newData.id;
    }
    else {
      //新規作成
      MainData.dataKey.push(gachaName);
      MainData.gachaName.set(gachaName, gachaName);
      const saveData = MainData.getEditableDatas();
      saveToIndexedDB(gachaName, gachaName, null, saveData);
      saveMainData();
      updateLineupToZip(gachaName);
      MainData.onLoadedDatakey = gachaName;  
    }
    nameField.value = "";
    nameField.style.border = "";
    errorText.hidden = true;
    await showNotification("保存しました", "success");
  });

  //データの全削除イベント
  document.getElementById("deleteDataButton").addEventListener("click", () =>{
    // 確認ポップアップ
    if (confirm(MainData.deleteMassage)) {
        //全削除
        clearAllIndexedDBData().then(async () => {
          deleteMainData();   //localstrageも削除
          location.reload();  //ページのリロード

        }).catch(async () => {
          await showNotification("削除に失敗しました。", "error");
        });
    }
  });


  // --- 基本ロジックイベント群 ---

  //アイテム表示数変更時に再描画
  const lineupNum = document.getElementById("lineupNum");
    lineupNum.addEventListener("change", (e) => {
    MainData.itemLineupNum = e.target.value;
    showLineup();
  });
  
  document.getElementById("lineupPlus").onclick = () => { 
    lineupNum.stepUp();
    MainData.itemLineupNum = lineupNum.value;
    showLineup();
    
  };

  document.getElementById("lineupMinus").onclick = () => {
    lineupNum.stepDown();
    MainData.itemLineupNum = lineupNum.value;
    showLineup();
  };

  //rarityNumが変更された時
  document.getElementById("rarityNum").addEventListener("change", (e) => {
    MainData.rarityNum = parseInt(e.target.value);
    updateLabels();
    showLineup();
  });

  // --- ガチャ実行イベント群 ---

  //gachaSingleがクリックされた時
  document.getElementById("gachaSingle").addEventListener("click", async() => await callMainAction(1));

  //gachaTenがクリックされた時
  document.getElementById("gachaTen").addEventListener("click", async() => await callMainAction(10));

  //gachaCustomがクリックされた時
  document.getElementById("gachaCustom").addEventListener("click", async () => {
    const element = document.getElementById("gachaCount")
    const count = parseInt(element.value);

    //自分のPCで動く限界値(適当)
    if(count > 1000001) {
      alert("回数は1000000以下にしてください");
      element.value = 1000000;
    }
    else {
      await callMainAction(count);
    }

    MainData.saveUserSettings();
  });
  //履歴の取得(ダウンロードリンクがない場合)
  const resultdownload = document.querySelector('a#resultdownload');
  resultdownload.addEventListener("click", async ()=> {
    const href = resultdownload.getAttribute("href");
    if(href !== null) return;
    await showNotification("履歴が存在しません。", "error");
  });
  //ラジオボタンの変更イベント
  document.querySelectorAll('input[name="downloadType"]').forEach((radio) => {
    radio.addEventListener("change", async() => await activeHistoryURL());
  });

  document.getElementById("deleteHistory").addEventListener("click", async ()=>{
    // 確認ポップアップ
    if (confirm(`ガチャの履歴が「全て」削除されます。\nよろしいですか？`)) {
        //全削除
        clearAllIndexedDBData("history").then(async () => {
          
          await showNotification("削除が完了しました。", "success");
        }).catch(async err => {
          await showNotification("削除に失敗しました。", "error");
        });
      const link = document.getElementById("resultdownload");
      link.removeAttribute("href");
      link.removeAttribute("download");
    }
  });
  document.getElementById("tweetButton").addEventListener("click", ()=> {
    //新しいタブで開く
    window.open(MainData.tweetUrl, "_blank");
  });

  // --- デバッグ用 ---
  document.getElementById("showMaindatabutton").addEventListener("click", () => MainData.debugMainData());
  document.getElementById("showDB").addEventListener("click", async () => {
    const allData = await showAllIndexedDBData();
    console.log("取得結果 →", allData);
  });
  document.getElementById("showlocalstrage").addEventListener("click", () =>{

    //keyの情報取得
    const datas = getDataFromLocalStorage("gacyaData");
    if(!datas) {
      console.log("localdataが存在しない");
      return;
    }
    
    if(datas.dataKey) {
      for(let i = 0; i < datas.dataKey.length; i++) {
        console.log(`${i} : ${datas.dataKey[i]}\n`);
      }
    }

    if(datas.gachaName) {
      for (const [indexKey, itemObj] of Object.entries(datas.gachaName)) {
        const name = itemObj.itemName || "[\"空文字列\"]";
        const rarity = itemObj.rarity || "(no rarity)";
        msg += `  ${indexKey}: [Rarity: ${rarity}] ${name}\n`;
      }
    }
  });
});