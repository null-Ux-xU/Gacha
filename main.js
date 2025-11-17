import { MersenneTwister } from "./MersenneTwister.js";
import { gachaLogic } from "./gacha.js";
import { sortByRarity } from "./sort.js";
import { arraySummary } from "./arraySummary.js";
import { createTableElement } from "./createTableElement.js";
import {saveDataToLocalStorage, getDataFromLocalStorage} from "./localStrage.js";
class MainData
{

  //---変更されないデータ群----

  //レアリティのベース
  static rarityTable = ["N", "R", "SR", "SSR", "UR" ,"LR"];
  
  //レアリティ名、排出確率のヘッダーテキスト
  static rarityDisplayHeaderTextArray = ["表示名（編集可）", "排出確率（%）"]; 

  //デフォルトの確率
  static baseWeights = {
    N: 55, 
    R: 30,
    SR: 10,
    SSR: 3,
    UR: 1.5,
    LR: 0.5
  };
  //------------------------
  

  //---ユーザーの操作によって変更されるデータ群-----

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
  static itemsByRarity = {};

  static editableWeights = [];

  //------------------------

  static getEditableDatas() {
    const datas = {
      rarityDisplayNames: this.rarityDisplayNames,
      itemsByRarity: this.itemsByRarity,
      editableWeights: this.editableWeights
    }
   
    return datas;
  }


  static setEditableDatas(datas) {
    this.rarityDisplayNames = datas["rarityDisplayNames"];
    this.itemsByRarity = datas["itemsByRarity"];
    this.editableWeights = datas["editableWeights"];
  }

  //デバッグ用
  static debugMainData() {
  let msg = "=== MainData Debug ===\n\n";

  msg += "[editableWeights]\n";
  for (const [r, v] of Object.entries(MainData.editableWeights)) {
    msg += `  ${r}: ${v}\n`;
  }
  msg += "\n";

  msg += "[rarityDisplayNames]\n";
  for (const [r, v] of Object.entries(MainData.rarityDisplayNames)) {
    msg += `  ${r}: ${v}\n`;
  }
  msg += "\n";

  msg += "[itemsByRarity]\n";
  for (const [r, items] of Object.entries(MainData.itemsByRarity)) {
    msg += `  ${r}: ${items?.join(", ") || "(なし)"}\n`;
  }


  alert(msg);
}

}

/**
 * ガチャシステム
 * 
 * @param {int} count ガチャ回数
 */
function callMainAction(count) {
  //入力値
  const rarityNum = parseInt(document.getElementById("rarityNum").value);

  //入力欄から確率を取得
  const probabilities = MainData.rarityTable.slice(0,rarityNum).map(r => {
    return parseFloat(MainData.editableWeights[r] ?? MainData.baseWeights[r]);
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
    rarityNum: rarityNum,
    rarityTable: MainData.rarityTable,
    itemsByRarity: MainData.itemsByRarity
  });

  //レアリティソート
  const isSort = document.getElementById("sortByRarity")?.checked;
  if(isSort) {
    resultLen = sortByRarity(resultLen, MainData.rarityTable);
  }

  //重複をまとめた表示
  const combine = document.getElementById("combineDuplicates").checked;
  if (combine) {
    resultLen = arraySummary(resultLen);
  }

  //表示処理
  const tbody = document.getElementById("resultBody");
  tbody.replaceChildren(); 
  for (const res of resultLen) {
    tbody.insertAdjacentHTML(
      "beforeend",
      `<tr><td>${MainData.rarityDisplayNames[res.rarity]}</td><td>${res.item}</td><td>×${res.val || 1}個</td></tr>`
    );
  }
}

function updateLabels() {
  //レアリティの個数を取得
  const rarityNum = parseInt(document.getElementById("rarityNum").value);

  //id=tableのタグを取得し、中身を消す
  const container = document.getElementById("table");
  container.replaceChildren();

  //テーブルtagを生成
  const table = document.createElement("table");
  table.style.borderCollapse = "collapse"; 
  table.style.marginTop = "10px";

  //ヘッダーの作成
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  MainData.rarityDisplayHeaderTextArray.forEach(text => {
    const th = document.createElement("th");
    th.textContent = text;
    applyCellStyle(th);
    th.style.background = "#f0f0f0";
    headerRow.appendChild(th);
  });

  //作成したものを追加
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  //body
  const tbody = document.createElement("tbody");

  //表示されるところ
  const adjustedWeights = MainData.rarityTable.slice(0, rarityNum).map(rarity => MainData.baseWeights[rarity]);
  
  //失われた値を最高レアリティに追加
  adjustedWeights[rarityNum - 1] += parseFloat(100 - calcTotalValue(adjustedWeights));

  for (let i = 0; i < rarityNum; i++) {
    const rarity = MainData.rarityTable[i];
    const displayName = MainData.rarityDisplayNames[rarity];
    const resultValue = adjustedWeights[i].toFixed(2);
    const row = document.createElement("tr");

    // ▼ 表示名入力
    const  tdNameInput = createTableElement({
      inputType: rarity + "text",
      inputValue: displayName,
      ariaLabel: "レアリティ" + rarity + "を任意の文字に置き換える為の入力欄",
      styleWidthValue: "120px",
      rarityName: rarity
    });
    tdNameInput.addEventListener("input", onNameInput);
    applyCellStyle(tdNameInput);

    //確率入力
    const  tdProbInput = createTableElement({
      inputType: "number",
      inputValue: resultValue,
      ariaLabel: "レアリティ" + rarity + "の排出確率を入力する欄",
      styleWidthValue: "80px",
      stepValue: 0.1,
      rarityName: rarity
    });
    tdProbInput.addEventListener("input", onProbInput);
    applyCellStyle(tdProbInput);
   
    row.appendChild(tdNameInput);
    row.appendChild(tdProbInput);
    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  container.appendChild(table);
}

function showLineup(rarityNum) {
  const table = document.getElementById("lineup-table");
  table.innerHTML = ""; // 表をクリア

  const totalCount = parseInt(document.getElementById("lineupNum").value) || 1;

  // --- 表ヘッダー ---
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  const thRarity = document.createElement("th");
  thRarity.textContent = "レアリティ（変更可）";
  const thItem = document.createElement("th");
  thItem.textContent = "アイテム名（編集可）";
  const thCount = document.createElement("th");
  //thCount.textContent = "個数";

  headerRow.appendChild(thRarity);
  headerRow.appendChild(thItem);
  //headerRow.appendChild(thCount);
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // --- 表本体 ---
  const tbody = document.createElement("tbody");

  // すべてのアイテムをフラットに取得
  const allItems = [];
  for (let i = 0; i < rarityNum; i++) {
    const rarity = MainData.rarityTable[i];
    const items = MainData.itemsByRarity[rarity] || [];
    items.forEach(item => {
      allItems.push({ rarity, item });
    });
  }

  // totalCount に合わせて行を作る
  for (let i = 0; i < totalCount; i++) {
    const data = allItems[i] || { rarity: "N", item: "" }; // 空白はN
    const row = document.createElement("tr");

    // ▼ レアリティプルダウン
    const rarityCell = document.createElement("td");
    const select = document.createElement("select");
    MainData.rarityTable.forEach(r => {
      const option = document.createElement("option");
      option.value = r;
      option.textContent =  MainData.rarityDisplayNames[r];
      if (r === data.rarity) option.selected = true;
      select.appendChild(option);
    });
    select.addEventListener("change", e => {
      const newRarity = e.target.value;
      // 元の配列から削除
      if (MainData.itemsByRarity[data.rarity]) {
        const index = MainData.itemsByRarity[data.rarity].indexOf(data.item);
        if (index >= 0) MainData.itemsByRarity[data.rarity].splice(index, 1);
      }
      // 新しいレアリティに追加
      if (!MainData.itemsByRarity[newRarity]) MainData.itemsByRarity[newRarity] = [];
      MainData.itemsByRarity[newRarity].push(data.item);
      showLineup(rarityNum);
    });
    rarityCell.appendChild(select);

    // ▼ アイテム名テキストボックス
    const itemCell = document.createElement("td");
    const input = document.createElement("input");
    input.type = "text";
    input.value = data.item;
    input.style.width = "200px";
    input.addEventListener("input", e => {
      if (!MainData.itemsByRarity[data.rarity]) MainData.itemsByRarity[data.rarity] = [];
      const idx = MainData.itemsByRarity[data.rarity].indexOf(data.item);
      if (idx >= 0) MainData.itemsByRarity[data.rarity][idx] = e.target.value;
      data.item = e.target.value;
    });
    
    itemCell.appendChild(input);
    row.appendChild(rarityCell);
    row.appendChild(itemCell);
    tbody.appendChild(row);
  }

  table.appendChild(tbody);

  // --- 表スタイル ---
  table.style.borderCollapse = "collapse";
  table.style.marginTop = "10px";
  table.querySelectorAll("th, td").forEach(cell => {
    cell.style.border = "1px solid black";
    cell.style.padding = "4px 8px";
  });  
}

/**
 * 編集可能な情報をロードする関数
 */
function loadMainData() {

  const datas = getDataFromLocalStorage("gacyaData");
  if(datas) {
    MainData.setEditableDatas(datas);
  }
  else {
    console.log("localdataが存在しない");
  }
}

/**
 * 編集可能な情報を保存する関数
 */
function saveMainData() {
  saveDataToLocalStorage("gacyaData",MainData.getEditableDatas());
  alert("レアリティ名を保存しました！");
}
/**
 * 文字列と一致するlocalstlageのデータを削除
 * 
 * @param {string} text localstrageの名前
 */
function deleteLocalStrageData(text) {
  if(typeof text === "string") {
    localStorage.removeItem(text);
    alert("消しました");
  }
  else {
    console.log("文字列じゃないよ");
  }
}

/**
 * メインデータの削除
 */
function deleteMainData() {
  deleteLocalStrageData("gacyaData");
}


function applyCellStyle(td) {
  Object.assign(td.style, {
    border: "1px solid black",
    padding: "4px 8px"
  });
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

/**
 * ベースウェイトをレアリティの数に合わせた配列を取得する関数
 * 
 * @param {int} rarityNum 
 * @returns 
 */
function getCorrectedBaceWight(rarityNum){
  //表示されるところ
  const adjustedWeights = MainData.baseWeights.slice(0, rarityNum);
  
  //失われた値を最高レアリティに追加
  adjustedWeights[rarityNum - 1] += parseFloat(100 - calcTotalValue(adjustedWeights));
  return adjustedWeights;
}

//表示名変更
function onNameInput(e) {
  const rarity = e.target.dataset.rarity;
  const text = e.target.value.trim() || rarity;

  MainData.rarityDisplayNames[rarity] = text;
  localStorage.setItem("rarityDisplayNames", JSON.stringify(MainData.rarityDisplayNames));
  showLineup(parseInt(document.getElementById("rarityNum").value));
}

// ▼ 確率変更
function onProbInput(e) {
  const rarity = e.target.dataset.rarity;
  MainData.editableWeights[rarity] = parseFloat(e.target.value) ?? MainData.baseWeights[rarity];
}

// イベント登録
window.addEventListener("DOMContentLoaded", () => {
  loadMainData();
  updateLabels();
  const rarityNum = parseInt(document.getElementById("rarityNum").value) || 1;
  showLineup(rarityNum);


  //デバッグ用
  document.getElementById("showMaindatabutton").addEventListener("click", () => MainData.debugMainData());


  // 行数変更時に再描画
  document.getElementById("lineupNum").addEventListener("change", () => {
  const rarityNum = parseInt(document.getElementById("rarityNum").value);
  showLineup(rarityNum);
  });
  
  //rarityNumが変更された時
  document.getElementById("rarityNum").addEventListener("change", () => {
    updateLabels();
    const rarityNum = parseInt(document.getElementById("rarityNum").value);
    showLineup(rarityNum);
  });

  //gachaSingleがクリックされた時
  document.getElementById("gachaSingle").addEventListener("click", () => callMainAction(1));

  //gachaTenがクリックされた時
  document.getElementById("gachaTen").addEventListener("click", () => callMainAction(10));

  //gachaCustomがクリックされた時
  document.getElementById("gachaCustom").addEventListener("click", () => {
    const count = parseInt(document.getElementById("gachaCount").value) || 1;
    callMainAction(count);
  });

  //データの保存をクリックされた時
  document.getElementById("saveButton").addEventListener("click", () =>saveMainData());

  //保存したデータの削除をクリックされた時
  document.getElementById("deleteDataButton").addEventListener("click", () =>deleteMainData());
});