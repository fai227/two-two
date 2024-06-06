// キャンバス初期設定
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");


// 色の設定
const blockColor = { r: 255, g: 220, b: 169 };
const colorMax = 20;

/**
 * @property {number} x 移動先のX座標
 * @property {number} y 移動先のY座標
 * @property {number} wayX 移動中のX座標
 * @property {number} wayY 移動中のY座標
 * @property {number} previousX 移動前のX座標
 * @property {number} previousY 移動前のY座標
 */
class Block {
    constructor(targetX, targetY, value) {
        this.targetX = targetX;
        this.targetY = targetY;
        this.value = value;

        this.wayX = null;
        this.wayY = null;
        this.previousX = null;
        this.previousY = null;

        this.new = true;
        this.size = 0;

        return this;
    }

    getValue() {
        return this.value;
    }

    setTargetPosition(x, y) {
        this.targetX = x;
        this.targetY = y;

        return this;
    }
    getTargetPosition() {
        return [this.targetX, this.targetY];
    }


    setWayPosition(x, y) {
        this.wayX = x;
        this.wayY = y;

        return this;
    }
    getWayPosition() {
        return [this.wayX, this.wayY];
    }
    deleteWayPosition() {
        this.wayX = null;
        this.wayY = null;

        return this;
    }

    setPreviousPosition(x, y) {
        this.previousX = x;
        this.previousY = y;

        return this;
    }
    getPreviousPosition() {
        return [this.previousX, this.previousY];
    }
    hasPreviousPosition() {
        return this.previousX != null && this.previousY != null;
    }
    deletePreviousPosition() {
        this.previousX = null;
        this.previousY = null;

        return this;
    }

    getSize() {
        return this.size;
    }
    setSize(size) {
        this.size = size;
        return this;
    }

    isNew() {
        return this.new;
    }
    setOld() {
        this.new = false;
        this.size = 1;
        return this;
    }
}
let blocks = [];

let score = 0;
let lowest = 0;

// グリッドサイズ
let row = 4;  //行
let column = 4;  //列

const rankingURL = "https://vvbasr6ub1.execute-api.ap-northeast-1.amazonaws.com/two-two";

// #region キャンバス関数
let movingStartTime = null;
const movingDuration = 300;

/**
 * ブロック移動の計算
 * @param {number} time Callbackで渡されるタイムスタンプ
 */
function moveBlock(time) {
    // 移動終了時
    if (movingStartTime + movingDuration < time) {
        movingStartTime = undefined;

        // 位置移動
        let newBlocks = [];  // 位置がかぶっている要素計算用
        let deleteBlocks = [];  // 削除する要素を入れるため

        blocks.forEach((block, i) => {
            block.deleteWayPosition().deletePreviousPosition().setOld();  // いらないデータの削除
            let [targetX, targetY] = block.getTargetPosition();

            // 配列の位置を計算
            let index = targetY * row + targetX;
            let thereBlockIndex = newBlocks[index];

            // 同じ場所にブロックが重なる場合
            if (thereBlockIndex != undefined) {
                let thereBlock = blocks[thereBlockIndex];

                // 数値を比較
                let dif = block.getValue() - thereBlock.getValue();
                if (dif == 0) {  // どちらも削除
                    deleteBlocks.push(thereBlock, block);
                }
                else if (dif > 0) {  // 上書き
                    newBlocks[index] = i;  // 上書き
                    deleteBlocks.push(thereBlock);  // 削除
                }
                else {  // 小さいときはブロックを削除
                    deleteBlocks.push(block);
                }
            }
            // 新しく設定する際、ブロック番号を設定
            else {
                newBlocks[index] = i;
            }
        })

        // 削除リストを見て削除
        blocks = blocks.filter(block => !deleteBlocks.includes(block));
    }
    // 移動中
    else {
        blocks.forEach(block => {  // 移動計算
            let timeRatio = (time - movingStartTime) / movingDuration;
            if (block.hasPreviousPosition()) {
                let [x, y] = block.getTargetPosition();
                let [previousX, previousY] = block.getPreviousPosition();

                let wayX = previousX + (x - previousX) * timeRatio;
                let wayY = previousY + (y - previousY) * timeRatio;

                block.setWayPosition(wayX, wayY);

                // 新しいブロックの時はサイズ計算
                if (block.isNew()) {
                    block.setSize(timeRatio);
                }
            }
        });
    }

    // 描画
    drawCanvas();

    // 移動中は描画を続ける
    if (movingStartTime != null) {
        requestAnimationFrame(moveBlock);
    }
}

/**
 * blocksに格納されている値を参照しキャンバスを表示
 */
function drawCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    blocks.forEach(block => {
        let [x, y] = block.hasPreviousPosition() ? block.getWayPosition() : block.getTargetPosition();
        let value = block.getValue();
        let size = block.getSize();

        drawBlock(x, y, value, size);
    });
}

const boxSizePercentage = 0.9;
const roundPercentage = 0.05;
const textWidthPercentage = 0.9;
const textHeightPercentage = 0.75;
/**
 * ブロックの表示
 * @param {number} x 表示するブロックのX座標
 * @param {number} y 表示するブロックのY座標
 * @param {number} value 表示するブロックの値
 * @param {number} size 表示するブロックのサイズ（0<=x<=1）
 */
function drawBlock(x, y, value, size) {
    if (size <= 0) {
        return;
    }

    const halfBoxSize = canvas.width / row * boxSizePercentage / 2 * size;
    const boxRadius = halfBoxSize * 2 * roundPercentage;

    const centerX = canvas.width / row * (x + 0.5);
    const centerY = canvas.height / column * (y + 0.5);

    const leftPostion = centerX - halfBoxSize;
    const rightPosition = centerX + halfBoxSize;
    const upPosition = centerY - halfBoxSize;
    const downPosition = centerY + halfBoxSize;


    // ボックス描画
    context.beginPath();
    context.moveTo(centerX, upPosition);
    context.arcTo(leftPostion, upPosition, leftPostion, downPosition, boxRadius);
    context.arcTo(leftPostion, downPosition, rightPosition, downPosition, boxRadius);
    context.arcTo(rightPosition, downPosition, rightPosition, upPosition, boxRadius);
    context.arcTo(rightPosition, upPosition, leftPostion, upPosition, boxRadius);
    context.lineTo(centerX, upPosition);
    context.fillStyle = getColor(value);
    context.fill();
    context.stroke();  // 線描画

    // 数字描画用計算
    let displayValue = 1;
    for (let i = 0; i < value - 1; i++) {
        displayValue *= 2;
    }

    // 数字描画
    const fontSize = halfBoxSize * 2 * textHeightPercentage;
    const textWidth = halfBoxSize * 2 * textWidthPercentage;
    context.fillStyle = "white";
    context.font = `${fontSize}px 'MainFont'`;
    context.strokeText(displayValue, centerX, centerY, textWidth);
    context.fillText(displayValue, centerX, centerY, textWidth);
}

const lineWidthPercentage = 0.01;
function resetCanvasSize() {
    let size = window.innerHeight;
    if (window.innerHeight > window.innerWidth) size = window.innerWidth;

    canvas.width = canvas.height = size * 0.9;
    document.getElementById("rankingParent").style.width = canvas.width + "px";
    context.lineWidth = size * lineWidthPercentage;

    context.textAlign = "center";
    context.textBaseline = "middle";

    drawCanvas();
}
// #endregion

// #region タッチ・キー判定
let positions = {};
function touchStart(e) {
    e.preventDefault();

    positions.x = e.changedTouches[0].clientX;
    positions.y = e.changedTouches[0].clientY;
}
function touchEnd(e) {
    e.preventDefault();

    // タッチが始まってなかったら何も行わない
    if (!positions) {
        return;
    }

    // 移動中なら何も行わない
    if (movingStartTime != null) {
        return;
    }

    let difX = e.changedTouches[0].clientX - positions.x;
    let difY = e.changedTouches[0].clientY - positions.y;

    let squereSize = (canvas.width / 5); squereSize *= squereSize;
    if (difX * difX + difY * difY < squereSize) return;

    // 左右移動
    if (Math.abs(difX) > Math.abs(difY)) {
        (difX > 0) ? moveRight() : moveLeft();
    }
    // 上下移動
    else {
        (difY > 0) ? moveDown() : moveUp();
    }

    positions = {};
}
function keyDown(e) {
    // 移動中なら何も行わない
    if (movingStartTime != null) {
        return;
    }

    switch (e.key) {
        case "ArrowRight":
            e.preventDefault();
            moveRight();
            break;

        case "ArrowLeft":
            e.preventDefault();
            moveLeft();
            break;

        case "ArrowUp":
            e.preventDefault();
            moveUp();
            break;

        case "ArrowDown":
            e.preventDefault();
            moveDown();
            break;
    }
}
// #endregion

// #region 移動関数
function moveRight() {
    // ブロックを右から順にソートする
    blocks.sort((a, b) => {
        return b.getTargetPosition()[0] - a.getTargetPosition()[0];
    });

    checkBlocks(1, 0);

    beforeMove();
}
function moveLeft() {
    // ブロックを左から順にソートする
    blocks.sort((a, b) => {
        return a.getTargetPosition()[0] - b.getTargetPosition()[0];
    });

    checkBlocks(-1, 0);

    beforeMove();
}
function moveUp() {
    // ブロックを上から順にソートする
    blocks.sort((a, b) => {
        return a.getTargetPosition()[1] - b.getTargetPosition()[1];
    });

    checkBlocks(0, -1);

    beforeMove();
}
function moveDown() {
    // ブロックを下から順にソートする
    blocks.sort((a, b) => {
        return b.getTargetPosition()[1] - a.getTargetPosition()[1];
    });

    checkBlocks(0, 1);

    beforeMove();
}
function beforeMove() {
    // 新しいブロックの生成
    let blockArray = [];  // 0~16の配列作成
    for (let i = 0; i < row * column; i++) {
        blockArray.push(i);
    }
    blocks.forEach(block => {
        let [x, y] = block.getTargetPosition();
        let index = y * row + x;

        let arrayIndex = blockArray.indexOf(index);
        if (arrayIndex >= 0) {
            blockArray.splice(arrayIndex, 1);
        }
    });

    // ゲームオーバー判定
    if (blockArray.length == 0) {
        finishGame();
    }

    let index = getRandomElement(blockArray);
    let x = index % row;
    let y = Math.floor(index / row);
    blocks.push(new Block(x, y, getNewBlockValue()).setPreviousPosition(x, y));

    // 時間を設定し移動開始
    movingStartTime = performance.now();
    moveBlock();
}
async function finishGame() {
    alert(`ゲーム終了\nScore: ${score}`);
    if (lowest <= score) {
        while (true) {
            try {
                let result = await fetch(
                    rankingURL,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            "score": score,
                            "name": username,
                            "time": Math.floor(performance.now() / 1000)
                        })
                    }
                );

                if (!result.ok) throw new Error(result.statusText);

                break;
            } catch (e) {
                let yes = confirm("ランキング反映中にエラーが発生しました。リトライしますか？");
                if (!yes) {
                    break;
                }
            }
        }
    }
    location.reload();
}
// #endregion

// #region ゲーム関連関数
function checkBlocks(moveX, moveY) {
    let newBlocks = [];  // 新しいブロック設置用配列
    let movedBlocks = [];  // 反映用のリストを生成

    function setPosition(block, x, y, value) {
        block.setTargetPosition(x, y);
        movedBlocks[y][x] = value;
    }

    for (let i = 0; i < column; i++) movedBlocks.push([]);

    // ブロックを1つずつ見ていく
    blocks.forEach(block => {
        let [x, y] = block.getTargetPosition();
        block.setPreviousPosition(x, y);
        let value = block.getValue();

        // 1つずつ進めていく
        while (true) {
            let nextPositionX = x + moveX;
            let nextPositionY = y + moveY;

            // 確認できない範囲になった際は終了
            if (nextPositionX < 0 || nextPositionX >= row || nextPositionY < 0 || nextPositionY >= column) {
                setPosition(block, x, y, value);
                break;
            }

            // 右に数字がある場合は終了
            let targetValue = movedBlocks[nextPositionY][nextPositionX];
            if (targetValue != undefined) {
                // 右と同じ場合、合体
                if (targetValue == value) {
                    let newValue = value + 1;
                    setPosition(block, nextPositionX, nextPositionY, newValue);
                    newBlocks.push(new Block(nextPositionX, nextPositionY, newValue));
                    addScore(newValue);
                }
                // 右と違う場合は止める
                else {
                    setPosition(block, x, y, value);
                }

                break;
            }

            // 次に向けて移動
            x += moveX;
            y += moveY;
        }
    });

    // 新しいブロックを設置
    newBlocks.forEach(newBlock => {
        blocks.push(newBlock);
    });
}

let maxValue = 1;
function addScore(value) {
    if (value > maxValue) {
        maxValue = value;
    }

    let point = 1;
    for (let i = 0; i < value - 1; i++) {
        point *= 2;
    }

    score += point;
    document.getElementById("score").innerHTML = score;

    // アニメーション実行
    let animationElement = document.getElementById("addedScore");
    animationElement.innerHTML = `+${point}`;
    animationElement.classList.add("animation");
}

function getNewBlockValue() {
    let array = [];
    let rand = Math.random();
    let ratio = 0;
    for (let i = 1; i < maxValue; i++) {
        let x = 1;
        for (let s = 0; s < i; s++) {
            x *= 2;
        }
        ratio += 1 / x;

        if (rand < ratio) {
            return i;
        }
    }
    return maxValue || 1;
}

function getName() {
    if (username == undefined) {
        username = prompt("ユーザー名を英数字で入力してください。");
    }
    while (!username || !username.match(/^[A-Za-z0-9]*$/)) {
        username = prompt("半角英数字で入力してください。（すべて大文字で表示されます。）");
    }
    localStorage.setItem("name", username);
}
function resetName() {
    username = undefined;
    getName();
}
function seeSolution() {
    location.href = "./sol.html";
}
// #endregion

// #region ランキング表示関数
async function setRanking() {
    let result = await fetch(rankingURL);
    let data = await result.json();

    // 念のためソート
    data["week"].sort((a, b) => b.score - a.score);
    data["total"].sort((a, b) => b.score - a.score);

    // ヘッダー設置
    let element = document.getElementById("ranking");
    element.innerHTML = "<h1 style='margin-bottom:5px'>ranking</h1>";

    // 表生成
    let table = document.createElement("table");
    element.appendChild(table);

    // ヘッダー生成
    let headerRow = document.createElement("tr");
    table.appendChild(headerRow);

    // 週間ヘッダー生成
    let weeklyHeader = document.createElement("th");
    let weeklyH2 = document.createElement("h2");
    weeklyH2.innerHTML = "Weekly";
    weeklyHeader.appendChild(weeklyH2);
    weeklyH2.classList.add("rankingHeader");
    headerRow.appendChild(weeklyHeader);

    // 全体ヘッダー生成
    let totalHeader = document.createElement("th");
    let totalH2 = document.createElement("h2");
    totalH2.innerHTML = "Total";
    totalHeader.appendChild(totalH2);
    totalH2.classList.add("rankingHeader");
    headerRow.appendChild(totalHeader);

    // データ挿入
    let lentgh = data.total.length > data.week.length ? data.total.length : data.week.length;
    for (let i = 0; i < lentgh; i++) {
        // 行生成
        let row = document.createElement("tr");
        table.appendChild(row);

        // Weekly追加
        let weekly = document.createElement("td");
        row.appendChild(weekly);
        // スコア追加
        if (data.week.length > i) {
            let datum = data.week[i];
            let div = document.createElement("div");
            div.classList.add("border");
            div.classList.add("score");
            div.classList.add(`rank${i + 1}`);
            weekly.appendChild(div);

            // 名前表示
            let h2 = document.createElement("h2");
            h2.innerHTML = `${i + 1}. ${datum.name}`;
            h2.classList.add("rankingHeader");
            div.appendChild(h2);

            // スコア表示
            let scoreP = document.createElement("p");
            scoreP.innerHTML = "score: " + datum.score;
            scoreP.classList.add("information");
            div.appendChild(scoreP);

            // 時間表示
            let timeP = document.createElement("p");
            timeP.innerHTML = `(${datum.time} sec)`;
            timeP.classList.add("information");
            timeP.classList.add("sec");
            div.appendChild(timeP);
        }

        // total追加
        let total = document.createElement("td");
        row.appendChild(total);
        // スコア追加
        if (data.total.length > i) {
            let datum = data.total[i];
            let div = document.createElement("div");
            div.classList.add("border");
            div.classList.add("score");
            div.classList.add(`rank${i + 1}`);
            total.appendChild(div);

            // 名前表示
            let h2 = document.createElement("h2");
            h2.innerHTML = `${i + 1}. ${datum.name}`;
            h2.classList.add("rankingHeader");
            div.appendChild(h2);

            // スコア表示
            let scoreP = document.createElement("p");
            scoreP.innerHTML = "score: " + datum.score;
            scoreP.classList.add("information");
            div.appendChild(scoreP);

            // 時間表示
            let timeP = document.createElement("p");
            timeP.innerHTML = `(${datum.time} sec)`;
            timeP.classList.add("information");
            timeP.classList.add("sec");
            div.appendChild(timeP);
        }
    }

    if (data.week.length == 10) {
        lowest = Number(data.week[9].score);
    }
}
// #endregion


async function main() {
    // タップ設定
    canvas.addEventListener("touchstart", touchStart);
    canvas.addEventListener("touchend", touchEnd);

    // キー設定
    document.addEventListener("keydown", keyDown);

    // キャンバス設定
    window.onresize = resetCanvasSize;
    canvas.style.display = "inline-block";

    // name設定
    username = localStorage.getItem("name");
    if (username == undefined) {
        getName();
    }

    // 操作方法を表示
    if (navigator.userAgent.match(/(iPhone|iPod|Android.*Mobile)/i)) {
        // スマホ（iPhone・Androidスマホ）の場合の処理を記述
        document.getElementById("spControll").style.display = "block";
    } else {
        // PC・タブレットの場合の処理を記述
        document.getElementById("pcControll").style.display = "block";
    }

    // スコア追加時のアニメーション初期設定
    let animationElement = document.getElementById("addedScore");
    animationElement.addEventListener("animationend", () => {
        animationElement.classList.remove("animation");
    })

    // ランキング表示
    setRanking();

    resetCanvasSize();
    beforeMove();
}
main();

// #region 便利関数
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}


function getColor(value) {
    let num = (value > colorMax - 1) ? colorMax : value;
    let ratio = 1 - num / colorMax;

    let r = Math.floor(blockColor.r * ratio);
    let g = Math.floor(blockColor.g * ratio);
    let b = Math.floor(blockColor.b * ratio);

    return `rgb(${r},${g},${b})`;
}
// #endregion