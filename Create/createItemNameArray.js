/**
 * 
 * @param {string} text Excel、スプレッドシートの列選択の複数コピー 想定
 * @returns {String[]} returnString[]
 */
export function createItemNameArray(text) {
    return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line !== "");
}