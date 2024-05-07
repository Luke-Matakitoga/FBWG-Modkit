var canvas;
var ctx;
var level;
var mouseX;
var mouseY;
var posX;
var posY;
var readyToRender;
var chars;
var objects;
var currentMouseType = 1;
let lastFrameTime = 0;
const fpsInterval = 1000 / 60; // Target FPS
const pixelsPerUnit = 30;

$(document).on("DOMContentLoaded", function(){
    canvas = document.getElementById("editor");
    ctx = canvas.getContext("2d");
    loadLevel();
});

function updateDebug(){
    document.getElementById("debug-info").innerHTML = "Width: " + level.width;
    document.getElementById("debug-info").innerHTML += "<br>Height: " + level.height;
}

function loadLevel(){
    $.getJSON("tutorial_forest.json", (data)=>{
        level = data;
        canvas.width = level.width * pixelsPerUnit;
        canvas.height = level.height * pixelsPerUnit;
        updateDebug();
        canvas.addEventListener('mousemove', function(event) {
            getMouseCellPosition(event);
        });
        canvas.addEventListener('mousedown', function(event){
            event.preventDefault();
            level.layers[0].data[(mouseY*level.width) + mouseX] = currentMouseType;
        });
        canvas.addEventListener('contextmenu', function(event){
            event.preventDefault();
            level.layers[0].data[(mouseY*level.width) + mouseX] = 0;
        });
        canvas.addEventListener('wheel', function(event) {
            // Prevent default scrolling behavior
            event.preventDefault();
        
            // Change currentMouseType based on wheel direction
            if (event.deltaY > 0) {
                // Scroll down, decrease currentMouseType
                currentMouseType = (currentMouseType === 1) ? 8 : currentMouseType - 1;
            } else {
                // Scroll up, increase currentMouseType
                currentMouseType = (currentMouseType === 8) ? 1 : currentMouseType + 1;
            }
        
            // Log the currentMouseType (you can remove this line)
            console.log('Current Mouse Type:', currentMouseType);
        });
        readyToRender = true;
        mainLoop();
    });
}

function mainLoop(timestamp) {
    if (!lastFrameTime) {
        lastFrameTime = timestamp;
    }

    const elapsed = timestamp - lastFrameTime;

    if (elapsed > fpsInterval) {
        lastFrameTime = timestamp - (elapsed % fpsInterval);
        update();
    }

    window.requestAnimationFrame(mainLoop);
}

function drawGridLines(){
    ctx.beginPath();
    ctx.lineWidth = 0.1;

    for(let x = 0; x < level.height; x++){
        ctx.moveTo(0, x * pixelsPerUnit);
        ctx.lineTo(level.width * pixelsPerUnit, x * pixelsPerUnit);
    }
    for(let x = 0; x < level.width; x++){
        ctx.moveTo(x * pixelsPerUnit, 0);
        ctx.lineTo(x * pixelsPerUnit, level.height * pixelsPerUnit);
    }
    ctx.stroke(); // Draw all lines at once
}

function downloadLevel(){
    const json = JSON.stringify(level);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = "tutorial_forest.json";
    
    document.body.appendChild(a);
    a.click();
    
    window.URL.revokeObjectURL(url);
}

function fillCell(x,y){
    ctx.fillRect(x * pixelsPerUnit, y * pixelsPerUnit, pixelsPerUnit, pixelsPerUnit);
}

function fillCellLiquid(x,y){
    ctx.fillRect(x * pixelsPerUnit, y * pixelsPerUnit, pixelsPerUnit, pixelsPerUnit);
    ctx.fillStyle = "#000"
    ctx.fillRect(x * pixelsPerUnit, (y*pixelsPerUnit) + (pixelsPerUnit/4)*3, pixelsPerUnit, pixelsPerUnit/4);
}

function getMouseCellPosition(event) {
    let rect = canvas.getBoundingClientRect();
    posX = event.clientX - rect.left;
    posY = event.clientY - rect.top;

    mouseX = Math.floor(posX / pixelsPerUnit);
    mouseY = Math.floor(posY / pixelsPerUnit);
}

function drawCell(x,y,type){
    if(type == 1){ // Square
        ctx.fillStyle="#000";
        ctx.fillRect(x * pixelsPerUnit, y * pixelsPerUnit, pixelsPerUnit, pixelsPerUnit);
    }
    if(type == 2){ // Ground-right slope
        ctx.fillStyle="#000";
        drawFilledSlope(x*pixelsPerUnit, y*pixelsPerUnit, pixelsPerUnit, pixelsPerUnit, 0);
    }
    if(type == 3){ // Ground-left slope
        ctx.fillStyle="#000";
        drawFilledSlope(x*pixelsPerUnit, y*pixelsPerUnit, pixelsPerUnit, pixelsPerUnit, 1);
    }
    if(type == 4){ // Ceiling-right slope
        ctx.fillStyle="#000";
        drawFilledSlope(x*pixelsPerUnit, y*pixelsPerUnit, pixelsPerUnit, pixelsPerUnit, 2);
    }
    if(type == 5){ // Ceiling-left slope
        ctx.fillStyle="#000";
        drawFilledSlope(x*pixelsPerUnit, y*pixelsPerUnit, pixelsPerUnit, pixelsPerUnit, 3);
    }
    if(type == 6){ // Water
        ctx.fillStyle="#00f";
        fillCellLiquid(x, y);
    }
    if(type == 7){ // Fire
        ctx.fillStyle="#f00";
        fillCellLiquid(x, y);
    }
    if(type == 8){ // Slime
        ctx.fillStyle="#0f0";
        fillCellLiquid(x, y);
    }

}

function drawFilledSlope(x, y, width, height, angle) {
    // 0 = ground-right
    // 1 = ground-left
    // 2 = ceiling-right
    // 3 = ceiling-left
    ctx.beginPath();

    if(angle==0){
        ctx.moveTo(x, y + height); 
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + height);
    }
    if(angle==1){
        ctx.moveTo(x, y + height); 
        ctx.lineTo(x, y);
        ctx.lineTo(x + width, y + height);
    }
    if(angle==2){
        ctx.moveTo(x + width, y); 
        ctx.lineTo(x, y);
        ctx.lineTo(x + width, y + height);
    }
    if(angle==3){
        ctx.moveTo(x + width, y); 
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + height);
    }

    // Close the path
    ctx.closePath();

    // Fill the shape
    ctx.fill();
}

function drawLevel(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //drawGridLines(); // If you want to draw grid lines, call it here
    for(let x = 0; x < level.width; x++){
        for(let y = 0; y < level.height; y++){
            drawCell(x, y, level.layers[0].data[(y*level.width) + x]);
        }
    }
    //Chars
    chars = level.layers.filter(x=>x.name=="Chars")[0];
    for(const item of chars.objects){
        drawChar(item.x, item.y, item.width, item.gid);
    }
    //Objects
    objects = level.layers.filter(x=>x.name=="Objects")[0];
}

function drawChar(x,y,width,gid){
    ctx.beginPath();

    if(gid == 16){ // Fireboy
        ctx.fillStyle="#f00";
        ctx.ellipse((x/32) * pixelsPerUnit, (y/32) * pixelsPerUnit, 10, 10, 0, 0, 2 * Math.PI);
    }
    if(gid == 17){ // Watergirl
        ctx.fillStyle="#00f";
        ctx.ellipse((x/32) * pixelsPerUnit, (y/32) * pixelsPerUnit, 10, 10, 0, 0, 2 * Math.PI);
    }
    if(gid == 18){ // Fireboy Exit
        ctx.fillStyle="#f77";
        ctx.ellipse((x/32) * pixelsPerUnit, (y/32) * pixelsPerUnit, 10, 10, 0, 0, 2 * Math.PI);
    }
    if(gid == 19){ // Watergirl Exit
        ctx.fillStyle="#77f";
        ctx.ellipse((x/32) * pixelsPerUnit, (y/32) * pixelsPerUnit, 10, 10, 0, 0, 2 * Math.PI);
    }
    if(gid == 21){ // Watergirl Gem
        ctx.fillStyle="#00f";
        ctx.ellipse((x/32) * pixelsPerUnit, (y/32) * pixelsPerUnit, 10, 10, 0, 0, 2 * Math.PI);
    }
    if(gid == 20){ // Fireboy Gem
        ctx.fillStyle="#f00";
        ctx.ellipse((x/32) * pixelsPerUnit, (y/32) * pixelsPerUnit, 10, 10, 0, 0, 2 * Math.PI);
    }

    ctx.fill();

}

function drawEllipse(x, y, radiusX, radiusY) {
    ctx.beginPath();
    ctx.fillStyle="#fff";
    ctx.ellipse(x, y, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle="#fff";
    ctx.lineWidth = 10;
    ctx.fillRect(x * pixelsPerUnit, y * pixelsPerUnit, pixelsPerUnit, pixelsPerUnit);
    ctx.stroke();
}

function update(){
    drawLevel();
    drawCell(mouseX, mouseY, currentMouseType);
    drawEllipse(posX, posY, 2, 2);
    updateDebug();
}
