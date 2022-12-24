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

// グリッドサイズ
let row = 4;  //行
let column = 4;  //列

// #region キャンバス関数
let movingStartTime = null;

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

        thinkNext();
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
    context.lineWidth = size * lineWidthPercentage;

    context.textAlign = "center";
    context.textBaseline = "middle";

    drawCanvas();
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
    if (value > maxValue) maxValue = value;

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
// #endregion


function start() {
    document.getElementById("buttonWrapper").style.display = "none";
    document.getElementById("inputWrapper").style.display = "none";

    movingDuration = Number(document.getElementById("moveDuration").value) * 1000;
    thinkingInterval = Number(document.getElementById("thinkingInterval").value) * 1000;

    beforeMove();
}

function main() {
    // キャンバス設定
    window.onresize = resetCanvasSize;
    canvas.style.display = "inline-block";

    // スコア追加時のアニメーション初期設定
    let animationElement = document.getElementById("addedScore");
    animationElement.addEventListener("animationend", () => {
        animationElement.classList.remove("animation");
    });

    resetCanvasSize();
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

// #region 予測関数群
function thinkNext() {
    setTimeout(function () {
        think();
    }, thinkingInterval);
}

let maxSearch = 6;
let trial = 10;
function think() {
    let blockGrid = [[], [], [], []];
    blocks.forEach(block => {
        let [x, y] = block.getTargetPosition();
        blockGrid[y][x] = block.getValue();
    })

    let upWorth = 0;
    let downWorth = 0;
    let rightWorth = 0;
    let leftWorth = 0;
    for (let i = 0; i < trial; i++) {
        upWorth += checkUp(blockGrid, 1);
        downWorth += checkDown(blockGrid, 1);
        rightWorth += checkRight(blockGrid, 1);
        leftWorth += checkLeft(blockGrid, 1);
    }
    let min = Math.min(upWorth, downWorth, rightWorth, leftWorth);

    switch (min) {
        case upWorth:
            moveUp();
            break;

        case downWorth:
            moveDown();
            break;

        case rightWorth:
            moveRight();
            break;

        default:
            moveLeft();
            break;
    }

}

function checkNext(blockGrid, num) {
    if (num >= maxSearch) return 0;

    // 新しくできる数値挿入（フルになるときはMAX_VALUEを返す）
    let emptyGrid = [];
    for (let y = 0; y < column; y++) {
        for (let x = 0; x < row; x++) {
            if (blockGrid[y][x] == undefined) {
                emptyGrid.push({ x: x, y: y });
            }
        }
    }
    let newBlockGrid = getRandomElement(emptyGrid);
    blockGrid[newBlockGrid.y][newBlockGrid.x] = getNewBlockValue();  //最大値探す必要あり

    // 次を探索
    let nextUpWorth = checkUp(blockGrid, num + 1);
    let nextDownWorth = checkDown(blockGrid, num + 1);
    let nextRightWorth = checkDown(blockGrid, num + 1);
    let nextLeftWorth = checkLeft(blockGrid, num + 1);

    // 最小値を返す
    return Math.min(nextUpWorth, nextDownWorth, nextRightWorth, nextLeftWorth);
}

function checkUp(blockGrid, num) {
    // 配列をコピー
    let nextBlockGrid = [];
    for (let y = 0; y < column; y++) {
        nextBlockGrid[y] = [];
        for (let x = 0; x < row; x++) {
            nextBlockGrid[y][x] = blockGrid[y][x];
        }
    }

    // 上の操作の計算
    for (let y = 1; y < column; y++) {
        for (let x = 0; x < row; x++) {
            if (nextBlockGrid[y][x] == undefined) continue;  // 数値がないときは動かさない
            for (let i = y - 1; ; i--) {
                if (i < 0) {  // 範囲外の時
                    // 端っこに置く
                    nextBlockGrid[i + 1][x] = nextBlockGrid[y][x];
                    nextBlockGrid[y][x] = null;
                    break;
                }
                if (nextBlockGrid[i][x] != undefined) {  // 数字があるとき
                    if (nextBlockGrid[i][x] == nextBlockGrid[y][x]) {  // 数字が同じなので結合
                        nextBlockGrid[i][x]++;
                        nextBlockGrid[y][x] = null;

                        break;
                    }
                    else {
                        // 入れ替え
                        let tmp = nextBlockGrid[i + 1][x];
                        nextBlockGrid[i + 1][x] = nextBlockGrid[y][x];
                        nextBlockGrid[y][x] = tmp;
                        break;
                    }
                }
            }
        }
    }

    return evaluate(nextBlockGrid, num);
}

function checkDown(blockGrid, num) {
    // 配列をコピー
    let nextBlockGrid = [];
    for (let y = 0; y < column; y++) {
        nextBlockGrid[y] = [];
        for (let x = 0; x < row; x++) {
            nextBlockGrid[y][x] = blockGrid[y][x];
        }
    }

    // 下の操作の計算
    for (let y = column - 2; y >= 0; y--) {
        for (let x = 0; x < row; x++) {
            if (nextBlockGrid[y][x] == undefined) continue;  // 数値がないときは動かさない
            for (let i = y + 1; ; i++) {
                if (i >= column) {  // 範囲外の時
                    // 端っこに置く
                    nextBlockGrid[i - 1][x] = nextBlockGrid[y][x];
                    nextBlockGrid[y][x] = null;
                    break;
                }
                if (nextBlockGrid[i][x] != undefined) {  // 数字があるとき
                    if (nextBlockGrid[i][x] == nextBlockGrid[y][x]) {  // 数字が同じなので結合
                        nextBlockGrid[i][x]++;
                        nextBlockGrid[y][x] = null;

                        break;
                    }
                    else {
                        // 入れ替え
                        let tmp = nextBlockGrid[i - 1][x];
                        nextBlockGrid[i - 1][x] = nextBlockGrid[y][x];
                        nextBlockGrid[y][x] = tmp;
                        break;
                    }
                }
            }
        }
    }

    return evaluate(nextBlockGrid, num);
}

function checkLeft(blockGrid, num) {
    // 配列をコピー
    let nextBlockGrid = [];
    for (let y = 0; y < column; y++) {
        nextBlockGrid[y] = [];
        for (let x = 0; x < row; x++) {
            nextBlockGrid[y][x] = blockGrid[y][x];
        }
    }

    // 左の操作の計算
    for (let y = 0; y < column; y++) {
        for (let x = 1; x < row; x++) {
            if (nextBlockGrid[y][x] == undefined) continue;  // 数値がないときは動かさない
            for (let i = x - 1; ; i--) {
                if (i < 0) {  // 範囲外の時
                    // 端っこに置く
                    nextBlockGrid[y][i + 1] = nextBlockGrid[y][x];
                    nextBlockGrid[y][x] = null;
                    break;
                }
                if (nextBlockGrid[y][i] != undefined) {  // 数字があるとき
                    if (nextBlockGrid[y][i] == nextBlockGrid[y][x]) {  // 数字が同じなので結合
                        nextBlockGrid[y][i]++;
                        nextBlockGrid[y][x] = null;

                        break;
                    }
                    else {
                        // 入れ替え
                        let tmp = nextBlockGrid[y][i + 1];
                        nextBlockGrid[y][i + 1] = nextBlockGrid[y][x];
                        nextBlockGrid[y][x] = tmp;
                        break;
                    }
                }
            }
        }
    }

    return evaluate(nextBlockGrid, num);
}

function checkRight(blockGrid, num) {
    // 配列をコピー
    let nextBlockGrid = [];
    for (let y = 0; y < column; y++) {
        nextBlockGrid[y] = [];
        for (let x = 0; x < row; x++) {
            nextBlockGrid[y][x] = blockGrid[y][x];
        }
    }

    // 右の操作の計算
    for (let y = 0; y < column; y++) {
        for (let x = row - 2; x >= 0; x--) {
            if (nextBlockGrid[y][x] == undefined) continue;  // 数値がないときは動かさない
            for (let i = x + 1; ; i++) {
                if (i >= row) {  // 範囲外の時
                    // 端っこに置く
                    nextBlockGrid[y][i - 1] = nextBlockGrid[y][x];
                    nextBlockGrid[y][x] = null;
                    break;
                }
                if (nextBlockGrid[y][i] != undefined) {  // 数字があるとき
                    if (nextBlockGrid[y][i] == nextBlockGrid[y][x]) {  // 数字が同じなので結合
                        nextBlockGrid[y][i]++;
                        nextBlockGrid[y][x] = null;

                        break;
                    }
                    else {
                        // 入れ替え
                        let tmp = nextBlockGrid[y][i - 1];
                        nextBlockGrid[y][i - 1] = nextBlockGrid[y][x];
                        nextBlockGrid[y][x] = tmp;
                        break;
                    }
                }
            }
        }
    }

    return evaluate(nextBlockGrid, num);
}

function evaluate(blockGrid, num) {
    // 枚数計算
    let length = 0;
    for (let y = 0; y < column; y++) {
        for (let x = 0; x < row; x++) {
            if (blockGrid[y][x] != undefined) length++;
        }
    }
    if (length == row * column) return 1000 * (maxSearch + 10 - num);

    return length + checkNext(blockGrid, num);
}

function finishGame() {
    if (confirm(`ゲーム終了\nScore: ${score}`)) {
        location.reload();
    }
}
function back() {
    location.href = "./";
}
// #endregion