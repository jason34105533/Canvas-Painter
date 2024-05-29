// 第一張畫布
var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
// 第二張畫布
var canvas_2 = document.getElementById("canvas_2");
var ctx_2 = canvas_2.getContext("2d");

var isMouseDown = false;  //紀錄現在有沒有mousedown
var prev_x = -1,prev_y = -1; //紀錄上一刻的滑鼠座標
var down_x = -1,down_y = -1;

var strokeWidth =  16,strokeColor =  "#000000"; //預設的筆刷顏色與寬度

// 一個紀錄每一部後的畫面的Array(UNDO、REDO用的)，還有現在在歷史當中的哪一張
var historyImgs =  [],currentImgsIdx =  0,curImg =  "";
// 記錄當前使用的工具(改變游標、還有一些有用的部分)
var tool = "cursor";
// 用來Save圖檔用的img的連結，get叫做"Imglink"物件(即，html內的<a>元素)
var download_link = document.getElementById("Imglink");

// 用來打字用的文字方塊
var box = document.getElementById("text-box");
box.addEventListener("keydown",MakeTextOnCanvas);

var fontsize = 24,fontstyle = "Callibri";  //預設的字體大小與字型
var eraser_exception;

// 畫布的初始化
canvas.width = 0.5*window.outerWidth;
canvas.height = 0.7*window.outerHeight;
console.log("canvas width",canvas.width);
console.log("canvas height",canvas.width);
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.lineCap = "round";
ctx.lineJoin = "round";
ctx.strokeStyle = strokeColor;
ctx.lineWidth = strokeWidth;
ctx.font = "24px Callibri";
ctx.fillStyle = "black";
// canvas_2 init()
canvas_2.width = 0.5*window.outerWidth;
canvas_2.height = 0.7*window.outerHeight;
ctx_2.clearRect(0, 0, canvas_2.width, canvas_2.height);
ctx_2.lineCap = "round";
ctx_2.lineJoin = "round";
ctx_2.strokeStyle = strokeColor;
ctx_2.lineWidth = strokeWidth;
ctx_2.font = "24px Callibri";
ctx_2.fillStyle = "black";

// Prevent button be selected after double-clicking on canvas or page body
canvas.onselectstart = function () { return false; }
canvas_2.onselectstart = function () { return false; }
document.getElementById("body").onselectstart = function () { return false; }

// 把空白的第一頁也push進去那個紀錄畫面的Array
curImg = canvas.toDataURL();
download_link.href = curImg;  //主要在意的就是這個<a href屬性>
historyImgs.push(curImg);

var paint_bucket = false;


// iro.js 網路上找的調色盤腳本
var colorPicker = new iro.ColorPicker("#picker", {
    // Set the size of the color picker
    width: 52,
    // Set the initial color to pure red
    color: "#f00",
    layoutDirection:"horizontal",
    border:"solid",
});
var hex = colorPicker.color.hexString;
console.log(hex); // hex = "#ff0000"
colorPicker.on('color:change', function(color) {  //這裡是改變顏色(操作調色盤)的時候變更顏色
    // log the current color as a HEX string
    console.log(color.hexString);
    ChangeColor(color.hexString);
});

// 點擊到調色盤的時候也改變顏色，因為上面是"操作"調色盤才變色，我希望點一下原本的顏色也可以
function ClickOnPicker(){  //Just want to switch to that color from other pen, doesn't want to re-adjust color
    console.log(colorPicker.color.hexString);
    ChangeColor(colorPicker.color.hexString);
}


// Function
// 滑鼠敲擊下來
function onMouseDown(e) {
    console.log("onMouseDown");
    [down_x, down_y] = [prev_x, prev_y] = [e.offsetX, e.offsetY];  //紀錄當下滑鼠的位置
    isMouseDown = true;  
    if(tool == "text"){  //如果現在是文字方塊模式，就把藏起來的文字方塊拉過來
        CallText(e.offsetX, e.offsetY);
    }
    else if(tool == "stamp"){
        DrawImage('icon/stamp.svg',prev_x,prev_y);
    }
    else if(tool == "eraser"){
        eraser_exception = canvas.toDataURL();
    }
}

function CallText(x,y){
    setTimeout(() =>{box.focus()},1);  //反正就是要加
    box.style.visibility = "visible";  //把文字方塊的隱藏變成可見，然後把文字方塊拖過來滑鼠這裡
    box.style.left = x + "px";
    box.style.top = y + "px";
}

function MakeTextOnCanvas(event){
    if(event.key == "Enter" && tool == "text"){  //當文字方塊模式輸入完成按下Enter
        // 超爛fillText的後面兩個位置參數只能吃整數，但box的style是"數字px"，所以把px兩個字源拔掉轉成整數
        if(box.value != "") {
            // 記錄圖檔(push進Array)
            ctx.fillText(box.value,Number(box.style.left.substring(0,box.style.left.length-2)),Number(box.style.top.substring(0,box.style.top.length-2)));
            RecordImg();
        }
        // 把文字寫上canvas後，再把原本的輸入方塊隱藏起來
        box.style.visibility = "hidden";
        // 文字方塊內容清除
        box.value = "";
    }
}

function RecordImg(){
    console.log("Record");
    if(historyImgs[currentImgsIdx] === canvas.toDataURL()) return;
    // console.log("Record");
    historyImgs = historyImgs.slice(0,currentImgsIdx+1);
    curImg = canvas.toDataURL();
    download_link.href = curImg;
    if(curImg != historyImgs[historyImgs.length-1] ) historyImgs.push(curImg);

    currentImgsIdx = historyImgs.length-1;
    console.log("currentImgidx:",currentImgsIdx);
}

function onMouseup(e) {  //當滑鼠在Canvas內從按下變成鬆開，表示剛剛應該有作畫
    console.log("onMouseUp");
    isMouseDown = false;

    ctx.drawImage(canvas_2, 0, 0);
    ctx_2.clearRect(0, 0, canvas_2.width, canvas_2.height);
    
    // 記錄圖檔(push進Array)
    if(((tool!="cursor" && tool!="text") && !(down_x == e.offsetX && down_y == e.offsetY)) || tool == "stamp") {
        if(tool=="eraser" && canvas.toDataURL() == eraser_exception) return;
        RecordImg();
    }
}

function onMouseMove(e) {
    // 滑鼠移動+有按下+有選取工具中 => 做事
    if (isMouseDown) {
        if(tool == "pen"){  //正常作畫模式
            onDraw(e.offsetX, e.offsetY);
        }
        else if(tool == "eraser"){
            onDraw(e.offsetX, e.offsetY); // 橡皮擦就是正常作畫，只是變成清除模式
        }else if(tool == "triangle"){
            onDrawTriangle(e.offsetX, e.offsetY);
        }else if(tool == "rectangle"){
            onDrawRectangle(e.offsetX, e.offsetY);
        }else if(tool == "circle"){
            onDrawCircle(e.offsetX, e.offsetY);
        }else if(tool == "line"){
            onDrawLine(e.offsetX, e.offsetY);
        }
        
    }

}

function onDraw(x, y) {  //正常的畫直線function

    ctx.beginPath();
    ctx.moveTo(prev_x, prev_y);
    ctx.lineTo(x, y);
    ctx.stroke();
    /*
        更新所謂"上一刻的滑鼠位置"
        搭配OnMouseMove()，就是不斷地在更新位置畫出超短的小直線，看起來就是在畫畫
    */
    [prev_x, prev_y] = [x, y];
}

function onDrawLine(x, y) {

    ctx_2.clearRect(0, 0, canvas_2.width, canvas_2.height);

    ctx_2.beginPath();
    ctx_2.moveTo(prev_x,prev_y);
    ctx_2.lineTo(x,y);

    if(paint_bucket) ctx_2.fill();
    ctx_2.stroke();
}

function onDrawTriangle(x, y) {

    ctx_2.clearRect(0, 0, canvas_2.width, canvas_2.height);

    ctx_2.beginPath();
    ctx_2.moveTo(prev_x,prev_y);
    ctx_2.lineTo(x,y);
    ctx_2.lineTo(x-(x-prev_x)*2,y);
    ctx_2.lineTo(prev_x,prev_y);

    if(paint_bucket) ctx_2.fill();
    ctx_2.stroke();
}

function onDrawRectangle(x, y) {

    ctx_2.clearRect(0, 0, canvas.width, canvas.height);

    ctx_2.beginPath();
    ctx_2.rect(prev_x, prev_y, x-prev_x, y-prev_y);

    if(paint_bucket) ctx_2.fill();
    ctx_2.stroke();
}

function onDrawCircle(x, y) {

    ctx_2.clearRect(0, 0, canvas.width, canvas.height);

    ctx_2.beginPath();
    ctx_2.arc(prev_x, prev_y, ((prev_x-x)**2 +(prev_y-y)**2)**0.5 , 0, 2 * Math.PI);

    if(paint_bucket) ctx_2.fill();
    ctx_2.stroke();
}



function onMouseLeave() {
    // 當滑鼠離開畫布，也視為鬆開
    isMouseDown = false;
}

function onMouseEnter() {
    // 當滑鼠進入畫布，要改變游標的圖樣
    if(tool == "cursor") {
        document.getElementById("canvas_2").style.cursor = "url('icon/cursor.svg'), help";
        // console.log("cursor = cursor\n",document.getElementById("canvas_2").style.cursor);
    }
    else if(tool == "pen" ){
        document.getElementById("canvas_2").style.cursor = "url('icon/pen.svg'), help";
        // console.log("cursor = pen\n",document.getElementById("canvas_2").style.cursor);
    }
    else if(tool == "eraser"){
        document.getElementById("canvas_2").style.cursor = "url('icon/eraser.svg'), help";
        // console.log("cursor = pen\n",document.getElementById("canvas_2").style.cursor);
    }
    else if(tool == "text"){
        document.getElementById("canvas_2").style.cursor = "url('icon/text.svg'), help";
        // console.log("cursor = pen\n",document.getElementById("canvas_2").style.cursor);
    }
    else if(tool == "triangle"){
        document.getElementById("canvas_2").style.cursor = "url('icon/triangle.svg'), help";
        // console.log("cursor = pen\n",document.getElementById("canvas_2").style.cursor);
    }
    else if(tool == "circle"){
        document.getElementById("canvas_2").style.cursor = "url('icon/circle.svg'), help";
        // console.log("cursor = pen\n",document.getElementById("canvas_2").style.cursor);
    }
    else if(tool == "rectangle"){
        document.getElementById("canvas_2").style.cursor = "url('icon/rectangle.svg'), help";
        // console.log("cursor = pen\n",document.getElementById("canvas_2").style.cursor);
    }
    else if(tool == "stamp"){
        document.getElementById("canvas_2").style.cursor = "url('icon/stamp.svg'), help";
        // console.log("cursor = pen\n",document.getElementById("canvas_2").style.cursor);
    }
    else if(tool == "line"){
        document.getElementById("canvas_2").style.cursor = "url('icon/line.svg'), help";
        // console.log("cursor = pen\n",document.getElementById("canvas_2").style.cursor);
    }
}

function SwitchTool(target_tool){
    console.log("Before switch tool ",ctx.globalCompositeOperation);
    // 切換工具
    document.getElementById(tool+"_button").classList.remove("selected");
    tool = target_tool;
    document.getElementById(tool+"_button").classList.add("selected");

    if(target_tool != "text") { //如果是文字方塊模式切換工具，也要把方塊清空並藏起來
        box.style.visibility = "hidden";
        box.value = "";
    }
    if(target_tool == "eraser") ctx.globalCompositeOperation = "destination-out";
    else ctx.globalCompositeOperation = "source-over"; //如果非橡皮擦型的工具，務必確保得從清除模式改回來，不然drawImage的function會變成整頁清除
    console.log("After switch tool ",ctx.globalCompositeOperation);
}

function SwitchBucket() {

    // 當滑鼠離開畫布，也視為鬆開
    paint_bucket = !paint_bucket;
    let bucket_obj = document.getElementById("bucket_button");
    if(paint_bucket) bucket_obj.classList.add("selected");
    else bucket_obj.classList.remove("selected");
    console.log("Bucket:",paint_bucket);
}

function onClearAll() {
    console.log("Clear all");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx_2.clearRect(0, 0, canvas_2.width, canvas_2.height);

    historyImgs = [];
    curImg = canvas.toDataURL();
    download_link.href = curImg;  //主要在意的就是這個<a href屬性>
    historyImgs.push(curImg);
    currentImgsIdx = 0;
    console.log("currentImgidx:",currentImgsIdx);
}

function onShiftStep(step,e) {
    console.log("Shift step");

    // 在橡皮擦下，使用UNDO、REDO，先把模式改回畫畫模式
    ctx.globalCompositeOperation = "source-over";

    if ((step > 0 && currentImgsIdx >= historyImgs.length - 1) || (step < 0 && currentImgsIdx <= 0)) {
        console.log("currentImgsIdx",currentImgsIdx);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);  //清空畫布
    currentImgsIdx += step;
    DrawImage(historyImgs[currentImgsIdx]);  //畫上目標畫面

    // 等一下下，等DrawImage畫完，才改回清除模式(if 現在使用橡皮擦的話)
    setTimeout(
        ()=>{
            if(tool == "eraser") ctx.globalCompositeOperation = "destination-out";
            console.log("currentImgsIdx",currentImgsIdx);

            curImg = historyImgs[currentImgsIdx];
            download_link.href = curImg;
        },100
    );

    e.stopPropagation();  //加就對了
}

function DrawImage(src, x = 0, y = 0) { //畫出畫面的函式(後兩個參數預設為0)
    let img = new Image();
    img.src = src;
    img.onload = () => {
        // 調整一下要畫出的位置(如果圖片size不等於畫布size)
        if(x==0 && y==0){
            x = 0.5*window.outerWidth / 2 - img.width / 2;  
            y = 0.7*window.outerHeight / 2 - img.height / 2;
        }
        // canvas作畫函式
        ctx.drawImage(img, x, y);

        curImg = canvas.toDataURL(); //紀錄現在的樣貌(給save image功能和歷史紀錄功能)
    };
    // 一樣，畫畫需要時間，所以為了怕死先等100ms確保上面做完
    setTimeout(
        () =>{
            download_link.href = curImg; //(給save image功能用的)
        },100
    );
}

function ChangeColor(color,op) {

    strokeColor = color; //本地記錄顏色的全域變數

    ctx.strokeStyle = strokeColor; //改變筆刷顏色
    ctx.fillStyle = strokeColor;   //改變字體顏色
    ctx_2.strokeStyle = strokeColor; //改變筆刷顏色
    ctx_2.fillStyle = strokeColor;   //改變字體顏色
    console.log("Change Color to:",strokeColor);
}

function ChangeWidth(e){

    strokeWidth = e.target.value; //本地記錄粗度的全域變數

    ctx.lineWidth = strokeWidth;   //改變筆刷粗度
    ctx_2.lineWidth = strokeWidth; //改變筆刷粗度

    console.log("Change width to:",strokeWidth," px");
}

function onUploadImage(e) {  //上傳照片函式

    ctx.globalCompositeOperation = "source-over";  //一樣，先改回畫畫模式
    console.log("Upload IMG!");

    const file = e.target.files[0]; //取得file
    if (!file) return;
    const reader = new FileReader();  //一種打東東叫FileReader
    reader.readAsDataURL(file);  //呼叫FileReader的readAsDataURL method，把file讀成dataurl
    reader.onload = () => {  //既然是dataurl就可以使用寫好的DrawImage函式
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        DrawImage(reader.result);
    };

    setTimeout(  //畫畫需要時間，以防萬一，先等他畫好(等100ms應該夠)
        ()=>{
            if(tool == "eraser") ctx.globalCompositeOperation = "destination-out"; 
            // 記錄圖檔，push進Array
            RecordImg();
        },100
    );
}

function Change_Font_Size(e){  //改變字體大小(用bootstrap的dropdown做的選單)

    console.log("Change Font Size to",e.target.value,"px!!");

    fontsize = e.target.value;  //本地記錄字體大小的全域變數
    ctx.font = fontsize + "px " + fontstyle;  //ctx.font格式:"數字px 字體"，eg:"24px Callibri"

    document.getElementById("dropdownMenuButton1 font_size_display").innerText = fontsize; //改變選單上面顯示的數字

    console.log(ctx.font);
}

function Change_Font_Style(e){  //改變字型，基本原理同上

    console.log("Change Font Style !");
    console.log(e.target.value);

    fontstyle = e.target.value;
    ctx.font = fontsize + "px " + fontstyle;

    document.getElementById("dropdownMenuButton1 font_style_display").innerText = fontstyle;
    console.log(ctx.font);
}
