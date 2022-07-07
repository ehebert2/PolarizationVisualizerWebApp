var initialWaveformManager, finalWaveformManager;
var padding = 5;
var FPS = 60;
var frequency = 0.4;
var c = 3;
var delay = 0;
var polAngle = 45;
var spokeSpacing = 15;
var textPadding = 20;

var state = 0;
const LINEAR = 0;
const LHCP = 1;
const RHCP = 1;

const xColor = "#ff0000";
const yColor = "#00ff00";
const xyColor = "#0000ff";
const axisColor = "#dddddd";

window.addEventListener('load', initialize);

window.onresize = function () {
    clearTimeout(doit);
    doit = setTimeout(windowResize, 300);
};

var doit;
function windowResize() {
    
}

function initialize() {

    initialWaveformManager = new WaveformManager('profile_initial', 'viewport_initial', frequency, 0, Math.sqrt(2)/2, Math.sqrt(2)/2);
    finalWaveformManager = new WaveformManager('profile_final', 'viewport_final', frequency, delay * Math.PI / 180, Math.sqrt(2) / 2, Math.sqrt(2) / 2);

    document.getElementById('delay').value = delay;
    document.getElementById('input_angle').value = polAngle;
    document.getElementById('linear').checked = true;

    window.requestAnimationFrame(update);
}

function update() {
    initialWaveformManager.update();
    finalWaveformManager.update();

    window.requestAnimationFrame(update);
}

function changePolarizationType(radio) {
    if (radio.value == 'LINEAR') {
        document.getElementById('input_angle').disabled = false;
        state = LINEAR;
        this.polAngle = document.getElementById('input_angle').value;
        initialWaveformManager.xMag = Math.cos(Math.PI * this.polAngle / 180);
        initialWaveformManager.yMag = Math.sin(Math.PI * this.polAngle / 180);
        initialWaveformManager.delay = 0;
        finalWaveformManager.xMag = initialWaveformManager.xMag;
        finalWaveformManager.yMag = initialWaveformManager.yMag;
        finalWaveformManager.delay = delay*Math.PI/180;
    } else if (radio.value == "LHCP") {
        document.getElementById('input_angle').disabled = true;
        state = LHCP;
        initialWaveformManager.xMag = Math.sqrt(2) / 2;
        initialWaveformManager.yMag = Math.sqrt(2) / 2;
        initialWaveformManager.delay = Math.PI / 2;
        finalWaveformManager.xMag = Math.sqrt(2) / 2;
        finalWaveformManager.yMag = Math.sqrt(2) / 2;
        finalWaveformManager.delay = Math.PI / 2 + delay*Math.PI/180;
    } else if (radio.value == "RHCP") {
        document.getElementById('input_angle').disabled = true;
        state = RHCP;
        initialWaveformManager.xMag = Math.sqrt(2) / 2;
        initialWaveformManager.yMag = Math.sqrt(2) / 2;
        initialWaveformManager.delay = -Math.PI / 2;
        finalWaveformManager.xMag = Math.sqrt(2) / 2;
        finalWaveformManager.yMag = Math.sqrt(2) / 2;
        finalWaveformManager.delay = -Math.PI / 2 + delay*Math.PI/180;
    }
}

function changePolarizationAngle() {
    if (state == LINEAR) {
        this.polAngle = document.getElementById('input_angle').value;
        initialWaveformManager.xMag = Math.cos(Math.PI * this.polAngle / 180);
        initialWaveformManager.yMag = Math.sin(Math.PI * this.polAngle / 180);
        finalWaveformManager.xMag = initialWaveformManager.xMag;
        finalWaveformManager.yMag = initialWaveformManager.yMag;
    }
}

function changeDelay() {
    delay = document.getElementById('delay').value;
    if (state == LINEAR) {
        finalWaveformManager.delay = delay*Math.PI/180;
    } else if (state == LHCP) {
        finalWaveformManager.delay = delay * Math.PI / 180 + Math.PI / 2;
    } else if (state == RHCP) {
        finalWaveformManager.delay = delay * Math.PI / 180 - Math.PI / 2;
    }
}

class ProfileDrawing {
    constructor(canvasID) {
        this.canvasID = canvasID;
        this.initialize();
    }

    initialize() {
        this.canvas = document.getElementById(this.canvasID);
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
        this.context = this.canvas.getContext('2d');

        this.axisWidth = (this.canvas.width > this.canvas.height) ? ((this.canvas.height - textPadding - 2 * padding) / 2) : ((this.canvas.width - textPadding - 2 * padding) / 2);
        this.xCenter = Math.round(this.canvas.width / 2) - textPadding;
        this.yCenter = Math.round(this.canvas.height / 2) + textPadding;

        this.length = Math.round(FPS / (frequency * 10));
        this.xPath = new Path(this.xCenter, this.yCenter, this.length);
        this.yPath = new Path(this.xCenter, this.yCenter, this.length);
        this.xyPath = new Path(this.xCenter, this.yCenter, this.length);

        this.context.font = "14px serif";
        this.context.fillStyle = "White";
        this.context.fillText("Ey", this.xCenter, textPadding + padding)
        this.context.fillText("Ex", this.xCenter + this.axisWidth + padding, this.yCenter);
    }

    draw() {
        this.blank();
        this.context.lineWidth = 2;
        this.context.strokeStyle = axisColor;
        this.context.beginPath();
        this.context.moveTo(this.xCenter, (this.yCenter - this.axisWidth));
        this.context.lineTo(this.xCenter, (this.yCenter + this.axisWidth));
        this.context.stroke();
        this.context.beginPath();
        this.context.moveTo((this.xCenter - this.axisWidth), this.yCenter);
        this.context.lineTo((this.xCenter + this.axisWidth), this.yCenter);
        this.context.stroke();

        this.context.strokeStyle = xColor;
        this.context.fillStyle = xColor;
        this.xPath.drawProfileView(this.context);
        this.context.strokeStyle = 'green';
        this.context.fillStyle = 'green';
        this.yPath.drawProfileView(this.context);
        this.context.strokeStyle = xyColor;
        this.context.fillStyle = xyColor;
        this.xyPath.drawProfileView(this.context);
    }

    addPoint(x, y) {
        this.point = [Math.round(this.xCenter + this.axisWidth * x), Math.round(this.yCenter - this.axisWidth * y)];
        this.xPath.appendAndRemove([this.point[0], this.yCenter]);
        this.yPath.appendAndRemove([this.xCenter, this.point[1]]);
        this.xyPath.appendAndRemove(this.point);
    }

    blank() {
        this.context.fillStyle = "black";
        this.context.fillRect(this.xCenter-this.axisWidth-2, this.yCenter-this.axisWidth-2, 2*this.axisWidth+4, 2*this.axisWidth+4);
    }
}

class SideDrawing {
    
    constructor(canvasID) {
        this.canvasID = canvasID;
        this.initialize();
    }

    initialize() {
        this.canvas = document.getElementById(this.canvasID);
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
        this.context = this.canvas.getContext('2d');

        this.projScale = 0.6;

        this.yAxisHeight = Math.round((this.canvas.height-2*padding) / (2 * (1 + this.projScale)));
        this.xCenter = textPadding + padding + Math.round(this.yAxisHeight * this.projScale);
        this.yCenter = padding + Math.round(this.yAxisHeight * (1 + this.projScale));
        this.opticAxisLength = this.canvas.width - 2 * (this.xCenter + padding) - textPadding;
        this.xAxisHeight = Math.round(this.yAxisHeight * this.projScale);

        this.xPath = new Path(this.xCenter, this.yCenter, this.opticAxisLength/c);
        this.yPath = new Path(this.xCenter, this.yCenter, this.opticAxisLength/c);
        this.xyPath = new Path(this.xCenter, this.yCenter, this.opticAxisLength / c);

        this.context.font = "14px serif";
        this.context.fillStyle = "White";
        this.context.fillText("Ey", this.xCenter - textPadding, this.yCenter - this.yAxisHeight - textPadding);
        this.context.fillText("Ex", this.xCenter - this.xAxisHeight - textPadding, this.yCenter + this.xAxisHeight);
        this.blankSquare1 = [this.xCenter - this.xAxisHeight - padding, this.yCenter - this.yAxisHeight - padding, this.opticAxisLength + 2 * this.xAxisHeight + 2 * padding, 2 * this.yAxisHeight + this.xAxisHeight + 2*padding];
        this.blankSquare2 = [this.xCenter, this.blankSquare1[1] - this.xAxisHeight - padding, this.opticAxisLength + this.xAxisHeight + padding, this.xAxisHeight + padding];
    }

    draw() {
        this.blank();
        this.context.lineWidth = 2;

        this.context.strokeStyle = axisColor;
        this.context.beginPath();
        this.context.moveTo(this.xCenter, (this.yCenter - this.yAxisHeight));
        this.context.lineTo(this.xCenter, (this.yCenter + this.yAxisHeight));
        this.context.stroke();

        this.context.beginPath();
        this.context.moveTo((this.xCenter - this.xAxisHeight), (this.yCenter + this.xAxisHeight));
        this.context.lineTo((this.xCenter + this.xAxisHeight), (this.yCenter - this.xAxisHeight));
        this.context.stroke();

        this.context.beginPath();
        this.context.moveTo(this.xCenter, this.yCenter);
        this.context.lineTo((this.xCenter + this.opticAxisLength), (this.yCenter));
        this.context.stroke();

        this.context.strokeStyle = yColor;
        this.context.fillStyle = yColor;
        this.yPath.drawSideView(this.context);

        this.context.strokeStyle = xColor;
        this.context.fillStyle = xColor;
        this.xPath.drawSideView(this.context);

        this.context.strokeStyle = xyColor;
        this.context.fillStyle = xyColor;
        this.xyPath.drawSideView(this.context);

        this.context.lineWidth = 2;
        this.context.strokeStyle = axisColor;
        this.context.beginPath();
        this.context.moveTo((this.xCenter + this.opticAxisLength), (this.yCenter - this.yAxisHeight));
        this.context.lineTo((this.xCenter + this.opticAxisLength), (this.yCenter + this.yAxisHeight));
        this.context.stroke();

        this.context.beginPath();
        this.context.moveTo((this.xCenter - this.xAxisHeight + this.opticAxisLength), (this.yCenter + this.xAxisHeight));
        this.context.lineTo((this.xCenter + this.xAxisHeight + this.opticAxisLength), (this.yCenter - this.xAxisHeight));
        this.context.stroke();
    }

    addPoint(x, y, z) {
        this.getRealCoord(x, y, z);
        this.xyPath.appendAndRemove([this.realX, this.realY]);

        this.getRealCoord(x, 0, z);
        this.xPath.appendAndRemove([this.realX, this.realY]);

        this.getRealCoord(0, y, z);
        this.yPath.appendAndRemove([this.realX, this.realY]);
    }

    shift(displacement) {
        this.xPath.shift(displacement);
        this.yPath.shift(displacement);
        this.xyPath.shift(displacement);
    }

    getRealCoord(x, y, z) {
        this.realX = Math.round(this.xCenter + z - this.projScale * x * this.yAxisHeight);
        this.realY = Math.round(this.yCenter + this.yAxisHeight*(this.projScale * x - y));
    }

    blank() {
        this.context.fillStyle = "black";
        this.context.fillRect(this.blankSquare1[0], this.blankSquare1[1], this.blankSquare1[2], this.blankSquare1[3]);
        this.context.fillRect(this.blankSquare2[0], this.blankSquare2[1], this.blankSquare2[2], this.blankSquare2[3]);
    }
}

class PathNode {
    constructor(content, previousNode, nextNode) {
        this.content = content;
        this.previousNode = previousNode;
        this.nextNode = nextNode;
    }
}

class Path {
    constructor(xCenter, yCenter, length) {
        this.circleRadius = 2;
        this.length = length;
        this.xCenter = xCenter;
        this.yCenter = yCenter;
        this.firstNode = new PathNode([xCenter, yCenter], null, null);
        this.lastNode = this.firstNode;

        for (let i = 1; i < length; i++) {
            this.temp = new PathNode([xCenter, yCenter], this.lastNode, null);
            this.lastNode.nextNode = this.temp;
            this.lastNode = this.temp;
        }
    }

    removeLast() {
        temp = lastNode;
        lastNode = lastNode.previousNode;
        lastNode.nextNode = null;
        temp.previousNode = null;
        length--;
    }

    appendToStart(content) {
        temp.content = content;
        temp.nextNode = firstNode;
        firstNode.previousNode = temp;
        firstNode = temp;
        length++;
    }

    appendAndRemove(content) {
        this.temp = this.lastNode;
        this.lastNode = this.lastNode.previousNode;
        this.temp.nextNode = this.firstNode;
        this.firstNode.previousNode = this.temp;
        this.firstNode = this.temp;
        this.firstNode.previousNode = null;
        this.lastNode.nextNode = null;
        this.firstNode.content = content;
    }

    shift(displacement) {
        this.temp = this.firstNode;
        this.temp.content[0] += displacement;
        for (let i = 1; i < this.length; i++) {
            this.temp = this.temp.nextNode;
            this.temp.content[0] += displacement;
        }
    }

    drawSideView(context) {
        this.temp = this.firstNode;

        context.fillRect(this.temp.content[0] - this.circleRadius, this.temp.content[1] - this.circleRadius, 2 * this.circleRadius + 1, 2 * this.circleRadius + 1);

        context.beginPath();
        context.moveTo(this.temp.content[0], this.temp.content[1]);

        for (let i = 1; i < this.length; i++) {
            this.temp = this.temp.nextNode;
            context.lineTo(this.temp.content[0], this.temp.content[1]);
            if ((i % spokeSpacing) == 0) {
                context.lineTo((this.xCenter + i*c), this.yCenter);
                context.moveTo(this.temp.content[0], this.temp.content[1]);
            }
        }

        context.stroke();
    }

    drawProfileView(context) {
        this.temp = this.firstNode;

        context.fillRect(this.temp.content[0] - this.circleRadius, this.temp.content[1] - this.circleRadius, 2 * this.circleRadius + 1, 2 * this.circleRadius + 1);

        context.beginPath();
        context.moveTo(this.temp.content[0], this.temp.content[1]);

        for (let i = 1; i < this.length; i++) {
            this.temp = this.temp.nextNode;
            context.lineTo(this.temp.content[0], this.temp.content[1]);
        }

        context.stroke();
    }
}

class WaveformManager {
    constructor(profileCanvasID, sideCanvasID, frequency, delay, xMag, yMag) {
        this.frame = 0;
        this.sideDrawing = new SideDrawing(sideCanvasID);
        this.profileDrawing = new ProfileDrawing(profileCanvasID);
        this.frequency = frequency;
        this.delay = delay;
        this.xMag = xMag;
        this.yMag = yMag;
    }

    update() {
        this.frame++;

        this.sideDrawing.shift(c);

        this.phase = 2 * Math.PI * this.frequency * this.frame / FPS;
        this.x0 = this.xMag*Math.sin(this.phase + this.delay);
        this.y0 = this.yMag*Math.sin(this.phase);

        this.sideDrawing.addPoint(this.x0, this.y0, 0);
        this.profileDrawing.addPoint(this.x0, this.y0);

        this.sideDrawing.draw();
        this.profileDrawing.draw();
    }
}