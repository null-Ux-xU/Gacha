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
 * @param {string} fileId ファイルの名前
 * @param {any} fileBlob 保存したいデータ
 * @param {any} meta itemName,レアリティ等
 * @returns 
 */
export async function saveToIndexedDB(fileId, fileBlob, meta = null) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("GachaStore", "readwrite");
    const store = tx.objectStore("GachaStore");

    const data = {
      id: fileId,
      blob: fileBlob, //ZIPから抽出したデータ
    };

    const request = store.put(data);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function loadFromIndexedDB(fileId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("GachaStore", "readonly");
    const store = tx.objectStore("GachaStore");
    const request = store.get(fileId);

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



