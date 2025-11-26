
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
        //th.style.border = "1px solid black";
        //th.style.padding = "4px 8px";
        //th.style.background = "#f0f0f0";
        headerRow.appendChild(th);
    });  
    thead.appendChild(headerRow);

    return thead;
}