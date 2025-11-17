/**
 * ローカルストレージにデータを保存する
 * 
 * @param {string} localStorageName 名前(キー)
 * @param {object} data 保存したいデータの連想配列
 * @returns {bool} 成否判定
 * 
 */
export function saveDataToLocalStorage(localStorageName, data) {
    if (typeof data !== "object") {
        console.error("保存するデータがオブジェクトではありません:", data);
        return false;
    }
    localStorage.setItem(localStorageName, JSON.stringify(data));
    return true;
}

/**
 * ローカルストレージからデータを取得する
 * 
 * @param {string} localStorageName 
 * @returns object(連想配列) || null
 */
export function getDataFromLocalStorage(localStorageName) {
    const json = localStorage.getItem(localStorageName);
    if (!json) return null;

    try {
        return JSON.parse(json);
    } catch (e) {
        console.error("localStorage からの復元に失敗:", e);
        return null;
    }
}

