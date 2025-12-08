export function createTextURL(text) {

    const link = document.getElementById("resultdownload");

    // Blobオブジェクトを作成
    const blob = new Blob([text], { type: "text/plain" });

    // ダウンロード用リンクを作成
    link.href = URL.createObjectURL(blob);
    link.download = "ガチャ履歴.txt"; // 保存するファイル名
}

export function createCsvURL(text) {

    const link = document.getElementById("resultdownload");

    // Blobオブジェクトを作成
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, text], { type: "text/csv" });

    // ダウンロード用リンクを作成
    link.href = URL.createObjectURL(blob);
    link.download = "ガチャ履歴.csv"; // 保存するファイル名
}