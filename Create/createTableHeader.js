
/**
 * 
 * @param {string[]} headerTextArray ヘッダーテキスト配列
 * @returns ```<thead>...</thead> ```
 */
export function createTableHeader(headerTextArray) {
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerTextArray.forEach(text => {
        const th = document.createElement("th");
        th.textContent = text;
        headerRow.appendChild(th);
    });  
    thead.appendChild(headerRow);

    return thead;
}