export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("GachaDB", 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("GachaStore")) {
        db.createObjectStore("GachaStore", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
/**
 * 
 * @param {string} keyId  キーの名前
 * @param {any} fileBlob 保存したいデータ
 * @param {Object} meta itemName,レアリティ等
 * @returns 
 */
export async function saveToIndexedDB(keyId, fileBlob = null, editableMainData = {}) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("GachaStore", "readwrite");
    const store = tx.objectStore("GachaStore");

    const data = {
      id: keyId,
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
 * DBにあるデータをロード
 * 
 * @param {string} keyId 
 * @returns SaveData(saveToIndexedDBのdata参照)
 */
export async function loadFromIndexedDB(keyId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("GachaStore", "readonly");
    const store = tx.objectStore("GachaStore");
    const request = store.get(keyId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 
 * @param {string} fileId ファイル名 
 * @returns {URL} URL.revokeObjectURL(this)を忘れずに
 */
export async function getUrl(fileId) {
    const data = await loadFromIndexedDB(fileId);
    if (!data) {
        throw new Error("該当するファイルが見つかりません。");
    }
    return URL.createObjectURL(data.blob);
}
/**
 * GachaStore に保存されている全データを取得し、内容を確認表示する()デバッグ用
 */
export async function showAllIndexedDBData() {
  const db = await openDB();

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

        // ZIP有無
        if (!entry.blob) {
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
