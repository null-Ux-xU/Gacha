/**
 * DBをひらく
 * @param {string} storeName 
 * @returns Promise
 */
function openDB(storeName ="GachaStore") {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(storeName, 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * ガチャのプロパティを保存する
 * 
 * @param {string} storeName 
 * @param {string} keyId  キーの名前
 * @param {string} gachaName 表示名 
 * @param {any} fileBlob 保存したいデータ
 * @param {Object} meta itemName,レアリティ等
 * @returns 
 */
export async function saveToIndexedDB(keyId, gachaName, fileBlob = null, editableMainData = {}, storeName = "GachaStore") {
  const db = await openDB(storeName);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    //連想配列にして保存
    const data = {
      id: keyId,
      gachaName,
      zipFileName: fileBlob instanceof Blob ? keyId : null,
      blob: fileBlob ?? null,
      editableMainData: editableMainData ?? null
    };

    const request = store.put(data);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}


/**
 * 履歴を上書き保存
 * 
 * @param {String} historyData -履歴
 * @returns 
 */
export async function saveHistory(historyData) {
    const db = await openDB("history");

    return new Promise((resolve, reject) => {
    const tx = db.transaction("history", "readwrite");
    const store = tx.objectStore("history");

    const data = {
      id: "history",
      data: historyData
    };

    const request = store.put(data);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * DBにあるデータをロード
 * 
 * @param {String} keyId 
 * @param {String} storeName 
 * @returns {Object} - data = { id, gachaName, zipFileName, blob, editableMainData };
 */
export async function loadFromIndexedDB(keyId, storeName = "GachaStore") {
  const db = await openDB(storeName);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(keyId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * DBにある履歴をロード
 * 
 * @returns {Object[]} - data
 */
export async function loadHistoryFromIndexedDB() {
  const db = await openDB("history");
  return new Promise((resolve, reject) => {
    const tx = db.transaction("history", "readonly");
    const store = tx.objectStore("history");
    const request = store.get("history");

    request.onsuccess = () => resolve(request.result?.data || {});
    request.onerror = () => reject(request.error);
  });
}

/**
 * 指定のDB内のデータ全削除
 * 
 * @param {string} storeName - DBの名前
 */
export async function clearAllIndexedDBData(storeName = "GachaStore") {
  const db = await openDB(storeName);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    const request = store.clear();

    request.onsuccess = () => {
      console.log("GachaStore のデータを全て削除しました");
      resolve(true);
    };

    request.onerror = () => {
      console.error("削除に失敗しました:", request.error);
      reject(request.error);
    };
  });
}

/**
 * GachaStore に保存されている全データを取得し、内容を確認表示する()デバッグ用
 */
export async function showAllIndexedDBData(storeName = "GachaStore") {
  const db = await openDB(storeName);

  return new Promise((resolve, reject) => {
    const tx = db.transaction("GachaStore", "readonly");
    const store = tx.objectStore("GachaStore");

    const request = store.getAll();

    request.onsuccess = () => {
      const allData = request.result;

      if (allData.length === 0) {
        console.log("IndexedDB に保存されているデータはありません。");
        resolve([]);
        return;
      }

      console.group("IndexedDB 内の全データ一覧");
      allData.forEach((entry, index) => {
        console.group(`▼ No.${index + 1}`);
        console.log("ID:", entry.id);
        console.log("名前:", entry.gachaName);
        // ZIP有無
        if (entry.blob instanceof Blob) {
          console.log(`Blob サイズ: ${entry.blob.size} bytes`);
          console.log("元ZIPファイル名:", entry.zipFileName);
        } else {
          console.log("Blob: null");
        }

        const meta = entry.editableMainData || {};
        console.log("▼ editableMainData -------------");

        console.log("rarityNum:", meta.rarityNum ?? "null");
        console.log("itemLineupNum:", meta.itemLineupNum);
        console.log("rarityDisplayNames:", meta.rarityDisplayNames ?? "null");
        console.log("resultItems:", meta.resultItems ?? "null");

        console.log("editableWeights:");
        if (meta.editableWeights) {
          for (const [key,val] of Object.entries(meta.editableWeights)) {
            console.log(`  ${key}: ${val}`);
          }
        } else {
          console.log("  null");
        }
        console.groupEnd();
      });
      console.groupEnd();

      resolve(allData);
    };

    request.onerror = () => reject(request.error);
  });
}
