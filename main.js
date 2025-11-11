import { MersenneTwister } from "./MersenneTwister.js";
import { gachaLogic } from "./gacha.js";
import { sortByRarity } from "./sort.js";
import { arraySummary } from "./arraySummary.js";

class MainLogic
{
  //レアリティのベース
  static rarityTable = ["N", "R", "SR", "SSR", "UR" ,"LR"];
  
  //デフォルトの確率
  static baseWeights = [60, 30, 8, 1, 0.75, 0.25];

  //レアリティの表示変更用
  static rarityDisplayNames = {
  N: "N",
  R: "R",
  SR: "SR",
  SSR: "SSR",
  UR: "UR",
  LR: "LR"
  };
   //レアリティごとのアイテム
  static itemsByRarity = {};
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
  const probabilities = [];
  for(let i = 0; i < rarityNum; i++ ) {
    probabilities.push(parseFloat(document.getElementById("prob"+ MainLogic.rarityTable[i]).value));
  }
    
  // 合計チェック
  const total = probabilities.slice(0, rarityNum).reduce((a, b) => a + b, 0);
  if (Math.abs(parseFloat(total - 100)) > 0.01) {
    alert("合計が100%になるように設定してください！ (現在: " + parseFloat(total.toFixed(2)) + "%)");
    return;
  }

  //ガチャの処理
  let resultLen = gachaLogic({
    gachaCount: count,
    probabilities: probabilities,
    rarityNum: rarityNum,
    rarityTable: MainLogic.rarityTable,
    itemsByRarity: MainLogic.itemsByRarity
  });

  //レアリティソート
  const isSort = document.getElementById("sortByRarity")?.checked;
  if(isSort) {
    resultLen = sortByRarity(resultLen, MainLogic.rarityTable);
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
      `<tr><td>${MainLogic.rarityDisplayNames[res.rarity]}</td><td>${res.item}</td><td>×${res.val || 1}個</td></tr>`
    );
  }
}

function updateLabels() {
  const level = parseInt(document.getElementById("rarityNum").value);
  const container = document.getElementById("table");
  container.innerHTML = "";

  //保存済みのレアリティ名を復元
  const saved = JSON.parse(localStorage.getItem("rarityDisplayNames") || "{}");
  for (const [key, val] of Object.entries(saved)) {
    if (MainLogic.rarityDisplayNames[key]) {
      MainLogic.rarityDisplayNames[key] = val;
    }
  }

  // --- 基本確率を調整 ---
  const base = MainLogic.baseWeights;
  const lostWeights = base.slice(level).reduce((a, b) => a + b, 0);
  const adjustedWeights = base.slice(0, level);
  if (level > 0) adjustedWeights[level - 1] += lostWeights;
  const totalWeight = adjustedWeights.reduce((a, b) => a + b, 0);

  // --- テーブル生成 ---
  const table = document.createElement("table");
  table.style.borderCollapse = "collapse";
  table.style.marginTop = "10px";

  // --- ヘッダー行 ---
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["表示名（編集可）", "排出確率（%）"].forEach(text => {
    const th = document.createElement("th");
    th.textContent = text;
    th.style.border = "1px solid black";
    th.style.padding = "4px 8px";
    th.style.background = "#f0f0f0";
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // --- 本体 ---
  const tbody = document.createElement("tbody");

  for (let i = 0; i < level; i++) {
    const rarity = MainLogic.rarityTable[i];
    const displayName = MainLogic.rarityDisplayNames[rarity];
    const resultValue = (adjustedWeights[i] / totalWeight * 100).toFixed(2);

    const row = document.createElement("tr");

    // ▼ 表示名入力
    const tdName = document.createElement("td");
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = displayName;
    nameInput.dataset.rarity = rarity;
    nameInput.style.width = "120px";
    nameInput.addEventListener("input", e => {
      const r = e.target.dataset.rarity;
      MainLogic.rarityDisplayNames[r] = e.target.value.trim() || r;
      localStorage.setItem(
        "rarityDisplayNames",
        JSON.stringify(MainLogic.rarityDisplayNames)
      );
      const level = parseInt(document.getElementById("rarityNum").value);
      showLineup(level);
    });
    tdName.appendChild(nameInput);
    tdName.style.border = "1px solid black";
    tdName.style.padding = "4px 8px";

    // ▼ 確率入力
    const tdProb = document.createElement("td");
    const probInput = document.createElement("input");
    probInput.type = "number";
    probInput.id = "prob" + rarity;
    probInput.value = resultValue;
    probInput.step = "0.1";
    probInput.style.width = "80px";
    tdProb.appendChild(probInput);
    tdProb.style.border = "1px solid black";
    tdProb.style.padding = "4px 8px";

    //row.appendChild(tdSymbol);
    row.appendChild(tdName);
    row.appendChild(tdProb);
    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  container.appendChild(table);

  // --- 保存ボタン ---
  const saveBtn = document.createElement("button");
  saveBtn.textContent = "レアリティ名を保存";
  saveBtn.style.marginTop = "6px";
  saveBtn.addEventListener("click", () => {
    localStorage.setItem(
      "rarityDisplayNames",
      JSON.stringify(MainLogic.rarityDisplayNames)
    );
    alert("レアリティ名を保存しました！");
  });
  container.appendChild(saveBtn);
}

function showLineup(level) {
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
  for (let i = 0; i < level; i++) {
    const rarity = MainLogic.rarityTable[i];
    const items = MainLogic.itemsByRarity[rarity] || [];
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
    MainLogic.rarityTable.forEach(r => {
      const option = document.createElement("option");
      option.value = r;
      option.textContent =  MainLogic.rarityDisplayNames[r];
      if (r === data.rarity) option.selected = true;
      select.appendChild(option);
    });
    select.addEventListener("change", e => {
      const newRarity = e.target.value;
      // 元の配列から削除
      if (MainLogic.itemsByRarity[data.rarity]) {
        const index = MainLogic.itemsByRarity[data.rarity].indexOf(data.item);
        if (index >= 0) MainLogic.itemsByRarity[data.rarity].splice(index, 1);
      }
      // 新しいレアリティに追加
      if (!MainLogic.itemsByRarity[newRarity]) MainLogic.itemsByRarity[newRarity] = [];
      MainLogic.itemsByRarity[newRarity].push(data.item);
      showLineup(level);
    });
    rarityCell.appendChild(select);

    // ▼ アイテム名テキストボックス
    const itemCell = document.createElement("td");
    const input = document.createElement("input");
    input.type = "text";
    input.value = data.item;
    input.style.width = "200px";
    input.addEventListener("input", e => {
      if (!MainLogic.itemsByRarity[data.rarity]) MainLogic.itemsByRarity[data.rarity] = [];
      const idx = MainLogic.itemsByRarity[data.rarity].indexOf(data.item);
      if (idx >= 0) MainLogic.itemsByRarity[data.rarity][idx] = e.target.value;
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

  

// イベント登録
window.addEventListener("DOMContentLoaded", () => {
  updateLabels();
  const level = parseInt(document.getElementById("rarityNum").value) || 1;
  showLineup(level);

  // 行数変更時に再描画
  document.getElementById("lineupNum").addEventListener("change", () => {
  const level = parseInt(document.getElementById("rarityNum").value);
  showLineup(level);
  });
  
  //rarityNumが変更された時
  document.getElementById("rarityNum").addEventListener("change", () => {
    updateLabels();
    const level = parseInt(document.getElementById("rarityNum").value);
    showLineup(level);
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
});