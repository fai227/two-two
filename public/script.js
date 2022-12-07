// キャンバス初期設定
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");




function resetCanvas() {
    if (window.innerHeight > window.innerWidth) {
        canvas.width = canvas.height = window.innerWidth * 0.9;
    }
    else {
        canvas.width = canvas.height = window.innerHeight * 0.9;
    }


}

// #region タッチ判定
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
}
// #endregion

// #region キー設定
function moveRight() {

}
function moveLeft() {

}
function moveUp() {

}
function moveDown() {

}
// #endregion



function main() {
    window.onresize = resetCanvas;
    canvas.style.display = "inline-block";

    // タップ設定
    canvas.addEventListener("pointerdown", touchStart);
    canvas.addEventListener("pointerup", touchEnd);
    canvas.addEventListener("pointerleave", touchEnd);

    resetCanvas();
}
main();