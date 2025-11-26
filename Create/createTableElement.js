
/**
 * テーブルの要素を作成する関数
 * 
 * @param {object} params パラメータ
 * @param {string} params.elementId id (HTML全体でユニークなもの)
 * @param {string} params.elementName name (重複可)
 * @param {string} params.inputType inputのtype
 * @param {object} params.inputValue 初期値
 * @param {string} params.ariaLabel 補助テキスト
 * @param {float}  params.styleWidthValue styleWidthの値
 * @param {float}  params.stepValue stepValueの値

 * @returns  ```<td> <input> </td>``` || null 
 */
export function createTableElement({elementId, elementName, inputType, inputValue, ariaLabel, styleWidthValue = null, stepValue = null}) {
    const tdElement = document.createElement("td"); //td作成
    const input = document.createElement("input");  //input作成

    input.id = elementId;                       //id指定
    input.name = elementName;                   //name指定
    input.type = inputType;                     //type指定
    input.value = inputValue;                   //vaue指定
    input.ariaLabel = ariaLabel;                //補助テキスト

    if(styleWidthValue !== null) {
        //input.style.width = styleWidthValue;    //style.width指定
    }

    if(stepValue !== null) {
        //input.step = stepValue;                 //step指定
    } 
    tdElement.appendChild(input);
    return tdElement;
}