// キャンバス初期設定
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

// ゲーム初期設定
/**
 * 2次元配列
 * .value : 格納されている値
 * ?.x : 移動後のX座標
 * ?.y : 移動後のY座標
 * ?.wayX : 移動中のX座標
 * ?.wayY : 移動中のY座標
 * ?.new : true: 新規生成 false: 合体
 */
let blocks = [[],[],[],[]];
const row = 4;  //行
const column = 4;  //列

// #region キャンバス関数
let movingStartTime = null;
const movingDuration = 2000;

/**
 * ブロック移動の計算
 * @param {number} time Callbackで渡されるタイムスタンプ
 */
function moveBlock(time) {
    // 移動終了時
    if(movingStartTime + movingDuration < time) {
        movingStartTime = null;

        // 移動後の状態を作成
        let newBlocks = [[],[],[],[]];
        for(let y = 0; y < column; y++) {
            for(let x = 0; x < row; x++) {
                let tmpValue = blocks[y][x].value;
                blocks[y][x] = {};
                blocks[y][x].value = tmpValue;
            }
        }
    }
    else {
        // 移動計算
        for(let y = 0; y < column; y++) {
            for(let x = 0; x < row; x++) {
                if(blocks[y][x].value != null) {  // ブロックがある時
                    if(blocks[y][x].x != null || blocks[y][x].y != null) {  // 移動するとき
                        let targetX = blocks[y][x].x || x;
                        let targerY = blocks[y][x].y || y;
    
                        // 位置計算
                        blocks[y][x].wayX = x + (targetX - x) / movingDuration * (time - movingStartTime);
                        blocks[y][x].wayY = y + (targerY - y) / movingDuration * (time - movingStartTime);
    
                        // 新しく出来たブロックの場合、サイズ計算
                        if(blocks[y][x].new != null) {
                            blocks[y][x].size = (time - movingStartTime) / movingDuration;
                        }  
                    }
                }
            }
        }
    }

    // 描画
    drawCanvas();

    // 移動中は描画を続ける
    if(movingStartTime != null) {
        requestAnimationFrame(moveBlock);        
    }
}

/**
 * blockに格納されている値を参照しキャンバスを表示
 */
function drawCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for(let y = 0; y < column; y++) {
        for(let x = 0; x < row; x++) {
            if(blocks[y][x].value != null) {
                let posX = blocks[y][x].wayX || x;
                let posY = blocks[y][x].wayY || y;
                let size = blocks[y][x].size || 1;
                
                drawBlock(posX, posY, blocks[y][x].value, size);
            }
        }
    }
}

const boxSizePercentage = 0.9;
const roundPercentage = 0.05;
/**
 * ブロックの表示
 * @param {number} x 表示するブロックのX座標
 * @param {number} y 表示するブロックのY座標
 * @param {number} value 表示するブロックの値
 * @param {number} size 表示するブロックのサイズ（0<=x<=1）
 */
function drawBlock(x, y, value, size) {
    if(size <= 0) {
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

    context.beginPath();
    context.moveTo(rightPosition, upPosition);
    context.arcTo(leftPostion, upPosition, leftPostion, downPosition, boxRadius);
    context.arcTo(leftPostion, downPosition, rightPosition, downPosition, boxRadius);
    context.arcTo(rightPosition, downPosition, rightPosition, upPosition, boxRadius);
    context.arcTo(rightPosition, upPosition, leftPostion, upPosition, boxRadius);
    context.fill();

    console.log(`(${x},${y})=${value}`);
}

function resetCanvasSize() {
    if (window.innerHeight > window.innerWidth) {
        canvas.width = canvas.height = window.innerWidth * 0.9;
    }
    else {
        canvas.width = canvas.height = window.innerHeight * 0.9;
    }

    drawCanvas();
}
// #endregion

// #region タッチ・キー判定
let positions = {};
function touchStart(e) {
    positions.x = e.clientX;
    positions.y = e.clientY;
}
function touchEnd(e) {
    // タッチが始まってなかったら何も行わない
    if (!positions) {
        return;
    }

    // 移動中なら何も行わない
    if(movingStartTime != null) {
        return;
    }
}
function keyDown(e) {
    // 移動中なら何も行わない
    if(movingStartTime != null) {
        return;
    }

    switch(e.key) {
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
    // 状態をコピー
    let newBlocks = [[],[],[],[]];
    for(let y = 0; y < column; y++) {
        for(let x = 0; x < row; x++) {
            newBlocks[y][x] = blocks[y][x].value; 
        }
    }

    // 右からチェックしていき右にずらす
    for(let y = 0; y < column; y++) {
        for(let x = row - 1; x > 0; x--) {
            if(newBlocks[y][x] == null) {
                for(let i = x - 1; i >= 0; i--) {
                    if(newBlocks[y][i] != null) {
                        [newBlocks[y][x], newBlocks[y][i]] = [newBlocks[y][i], newBlocks[y][x]]  // 入れ替え
                        blocks[y][i].x = x;

                        // 移動後の右が同じ数値なら合体
                        if(x + 1 < row) {
                            if(newBlocks[y][x] == newBlocks[y][x + 1]) {
                                (blocks[y][x].x)++;  // 移動先を合わせる
                                blocks[y][x+1].new = false;  // 合体に設定

                                newBlocks[y][x] = null;  // 移動するやつを消す
                                newBlocks[y][x + 1] *= 2; //合体する数値を2倍
                            }
                        }

                        break;
                    }
                }
            }
        }
    }

    beforeMove(newBlocks);
}
function moveLeft() {

    beforeMove();
}
function moveUp() {

    beforeMove();
}
function moveDown() {

    beforeMove();
}
function beforeMove(newBlocks) {
    // 空いているブロックを探す
    let emptyBlockList = [];
    for(let y = 0; y < column; y++) {
        for(let x = 0; x < row; x++) {
            if(newBlocks[y][x] == null) {
                emptyBlockList.push({x: x, y: y});
            }
        }
    }

    // 空いているブロックの中に新しく追加
    let newBlocksPlace = getRandomElement(emptyBlockList);
    blocks[newBlocksPlace.y][newBlocksPlace.x].value = 1;
    blocks[newBlocksPlace.y][newBlocksPlace.x].new = true;

    // 時間を設定し移動開始
    movingStartTime = performance.now();
    moveBlock();
}
// #endregion



function main() {
    // タップ設定
    canvas.addEventListener("pointerdown", touchStart);
    canvas.addEventListener("pointerup", touchEnd);
    canvas.addEventListener("pointerleave", touchEnd);

    //キー設定
    document.addEventListener("keydown", keyDown);

    //ゲーム初期設定
    for(let y = 0; y < column; y++) {
        for(let x = 0; x < row; x++) {
            blocks[y][x] = {};
        }
    }
    blocks[0][0].value = 1;

    //キャンバス設定
    window.onresize = resetCanvasSize;
    canvas.style.display = "inline-block";
    resetCanvasSize();
}
main();

// #region 便利関数
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}
// #endregion