// Written By Eric Hebert 2022.
// This is intended as a teaching tool to learn about elliptical polarization states.
// It draws to psuedo 3d isometric renderings and 2 axial views of waveforms.
// varies levers and buttons can be used to modify the waveforms to better understand
// phase delays, projections, phase velocity, etc.

// Graphical objects
var initialWaveformManager, finalWaveformManager;
var profileInitialCanvas, profileFinalCanvas, sideInitialCanvas, sideFinalCanvas;

// animation variables
var FPS = 60;
var running = true;
let rafID;
var doit;

// waveform variables
var frequency = 0.4;
var c = 3;
var delay = 0;
var inputDelay = 0;
var polAngle = 45;
var polarizerAngle = 0;
var polarizerOn = false;
var circBasis = false;

// helper variables so that I don't have to constantly reinitialize
var Ex = 0;
var Ey = 0;
var lMag = 0;
var rMag = 0;
var ldelay = 0;
var rdelay = 0;
var delayRad = 0;

// variables for drawing and placement
// xTextPadding and yTextPadding should be overwritten while running based on screen textsizes
var spokeSpacing = 15;
var xTextPadding = 20;
var yTextPadding = 15;
var padding = 5;
var labelFont = "14px serif";
const sideViewBlockRadius = 2;
const profileViewBlockRadius = 4;
const xColor = "#ff0000";
const yColor = "#00ff00";
const xyColor = "#0000ff";
const polColor = "#f0a80e";
const axisColor = "#dddddd";

// input polarization state
// LINEAR mean x and y are in phase
// LHCP is left handed circular polarization
// RHCP is righ handed circular polarization
// arbitrary is an arbitrary state (you define x,y magnitudes and phase relationship)
var state = 0;
const LINEAR = 0;
const LHCP = 1;
const RHCP = 2;
const ARB = 3;

// make sure the DOM is loaded before you start running
window.addEventListener('load', initialize);

// listens for window resizing
// timer is used in case user is continuously changing the window (draging the corner)
window.onresize = function () {
    clearTimeout(doit);
    doit = setTimeout(resetCanvasSizes, 300);
};

// used to reset elements when window size changes
// has some problems that I haven't figured out how to solve
function resetCanvasSizes() {
    // stop animation because reinstantiation of variable could leave elements undefined mid render
    window.cancelAnimationFrame(rafID);

    // shrink canvases (I hoped this would help resize parent div's appropriately, but I'm not sure)
    profileInitialCanvas.width = "100px";
    profileFinalCanvas.width = "100px";
    profileInitialCanvas.height = "100px";
    profileFinalCanvas.height = "100px";
    profileInitialCanvas.parentElement.parentElement.style.flex = "0 0 100";
    profileFinalCanvas.parentElement.parentElement.style.flex = "0 0 100";
    profileInitialCanvas.parentElement.parentElement.style.flex = "1 1 auto";
    profileFinalCanvas.parentElement.parentElement.style.flex = "1 1 auto";

    // delete current waveform manager (will recreate in a moment)
    initialWaveformManager = null;
    finalWaveformManager = null;

    // timer is intended to allow elements to be resized. I resize some elements manually based on 
    // the web-browser drawn dimensions, so I need it to settle first.
    setTimeout(setupCanvas, 500);
}

// Called to resize profile canvas to be square (surprisingly hard to do in flex layout with css)
// also initializes waveform managers
function setupCanvas() {
    // calculate font dimensions used for spacing some manually drawn elements
    let tempCanvas = document.getElementById('viewport_initial');
    let tempContext = tempCanvas.getContext('2d');
    tempContext.font = labelFont;
    let metrics = tempContext.measureText('Ex');
    xTextPadding = metrics.width;
    metrics = tempContext.measureText('Ey');
    yTextPadding = parseInt(tempContext.font);

    // Make the divs holding the profile views square (the canvases are manually resized by the ProfileView constructors)
    let properties = window.getComputedStyle(profileInitialCanvas.parentElement, null);
    let targetWidth = Math.ceil(parseFloat(properties.height)) - 5;
    profileInitialCanvas.parentElement.parentElement.style.flex = "0 0 " + targetWidth + "px";

    properties = window.getComputedStyle(profileFinalCanvas.parentElement, null);
    targetWidth = Math.ceil(parseFloat(properties.height)) - 5;
    profileFinalCanvas.parentElement.parentElement.style.flex = "0 0 " + targetWidth + "px";

    // create waveform managers which handle all animation
    // and make sure animation matches global variables (configureWaveformManagers())
    initialWaveformManager = new WaveformManager('profile_initial', 'viewport_initial', frequency, 0, Math.sqrt(2) / 2, Math.sqrt(2) / 2);
    finalWaveformManager = new WaveformManager('profile_final', 'viewport_final', frequency, delay * Math.PI / 180, Math.sqrt(2) / 2, Math.sqrt(2) / 2);
    configureWaveformManagers();

    // Start animation loop
    rafID = window.requestAnimationFrame(update);
}

// Initial setup
// Mostly makes sure webpage ui elements match script global variables
// all the other setup is handled by setupCanvas() since it needs to be redone when the window is resized.
function initialize() {
    // The canvas are used in a fiew places
    profileInitialCanvas = document.getElementById('profile_initial');
    profileFinalCanvas = document.getElementById('profile_final');
    sideInitialCanvas = document.getElementById('viewport_initial');
    sideFinalCanvas = document.getElementById('viewport_final');

    document.getElementById('delay').value = delay;
    document.getElementById('input_angle').value = polAngle;
    document.getElementById('linear').checked = true;
    document.getElementById('input_delay').value = inputDelay;
    document.getElementById('input_delay').disabled = true;
    document.getElementById('polarizerOn').checked = false;
    document.getElementById('polarizer_angle').value = polarizerAngle;
    document.getElementById('polarizer_angle').disabled = true;
    document.getElementById('wave_speed').value = c;
    document.getElementById('frequency').value = frequency;

    setupCanvas();
}

// animation loop
// waveform managers do most of the work
function update() {
    initialWaveformManager.update();
    finalWaveformManager.update();

    rafID = window.requestAnimationFrame(update);
}

// called when radio buttons are changed to set input polarization state
// mostly activates/deactivates relavent ui elements and sets global state variable
// the heavy lifting is passed to configureWaveformManagers
function changePolarizationType(radio) {
    if (radio.value == 'LINEAR') {
        document.getElementById('input_angle').disabled = false;
        document.getElementById('input_delay').disabled = true;
        state = LINEAR;
        polAngle = document.getElementById('input_angle').value;
        configureWaveformManagers();
    } else if (radio.value == "LHCP") {
        document.getElementById('input_angle').disabled = true;
        document.getElementById('input_delay').disabled = true;
        state = LHCP;
        configureWaveformManagers();
    } else if (radio.value == "RHCP") {
        document.getElementById('input_angle').disabled = true;
        document.getElementById('input_delay').disabled = true;
        state = RHCP;
        configureWaveformManagers();
    } else if (radio.value == "ARB") {
        document.getElementById('input_angle').disabled = false;
        document.getElementById('input_delay').disabled = false;
        state = ARB;
        configureWaveformManagers();
    }
}

function changeBasis(radio) {
    if (radio.value == "CART") {
        circBasis = false;
        configureWaveformManagers();
    } else if (radio.value == "CIRC") {
        circBasis = true;
        configureWaveformManagers();
    }
}

// changes the input polarization angle
// only applies to linear and arbitrary polarization states
function changePolarizationAngle() {
    if ((state == LINEAR) || (state == ARB)) {
        polAngle = checkNumber(document.getElementById('input_angle'), polAngle);
        configureWaveformManagers();
    }
}

// Change the x delay on the input polarization state which is user defined for the arbitrary waveform setting
function changeInitialDelay() {
    if (state == ARB) {
        inputDelay = checkNumber(document.getElementById('input_delay'), inputDelay);
        configureWaveformManagers();
    }
}

// Change the delay on the x-component between the initial and final waveforms
function changeDelay() {
    delay = checkNumber(document.getElementById('delay'),delay);
    configureWaveformManagers();
}

// Change the angle of the polarizer simulated after the final waveform (just renders a projection on an arbitrary axis)
function changerPolarizerAngle() {
    if (polarizerOn) {
        polarizerAngle = checkNumber(document.getElementById('polarizer_angle'), polarizerAngle);
        configureWaveformManagers();
    }
}

// Change the phase velocity of the wave.
// Because of how things are rendered, this has to be an integer value.
// You also need multiple nodes per window so you can't travers the entire render span
// in a frame, but that would look like nonsense anyway.
function changeSpeed() {
    // most of the conditionals are to make sure the speed input is a valid value and not 'cat' or '1 billion'
    let elem = document.getElementById('wave_speed');
    if (elem.value.length == 0) {
        elem.value = c;
    } else {
        let tempC = Math.round(parseFloat(elem.value));
        if ((tempC > 0) && (tempC < window.innerWidth / 10)) {
            // stop animation since path extension involves instantiating new links, which is an expensive operation
            window.cancelAnimationFrame(rafID);
            c = tempC;

            // let waveform managers know speed changed so they can update path lengths
            initialWaveformManager.changeSpeed();
            finalWaveformManager.changeSpeed();

            // restart animation
            rafID = window.requestAnimationFrame(update);
        } else {
            elem.value = c;
        }
    }
}

// change the frequency of the wave
// also make sure the user input is a number > 0
// waveform managers store it locally.
// I considered allowing them to be controlled seperately, but currently this is unnecessary
function changeFrequency() {
    let tempF = checkNumber(document.getElementById('frequency'), frequency);
    if (tempF > 0) {
        frequency = tempF;
        initialWaveformManager.frequency = frequency;
        finalWaveformManager.frequency = frequency;
    } else {
        document.getElementById('frequency').value = frequency;
    }
}

// turn polarizer on or off
// disable polarizer angle field if it is off
function polarizerToggle() {
    if (document.getElementById('polarizerOn').checked) {
        polarizerOn = true;
        document.getElementById('polarizer_angle').disabled = false;
        configureWaveformManagers();
    } else {
        polarizerOn = false;
        document.getElementById('polarizer_angle').disabled = true;
        configureWaveformManagers();
    }
}

// used by a number of fields to check if a number input is actually a number
// revert element to previous state if it isn't
function checkNumber(elem, def) {
    if (elem.value.length == 0) {
        elem.value = def;
        return def;
    } else {
        return parseFloat(elem.value);
    }
}

// used to configure waveform managers when when a user controlled input is changed
// sometimes also called to make sure that waveform managers are in sync with global variables
// set by user
function configureWaveformManagers() {
    // if circular polarization basis is selected, need to transform appropriately
    if (circBasis) {
        initialWaveformManager.circBasis = true;
        finalWaveformManager.circBasis = true;

        if (state == LINEAR) {
            Ex = Math.cos(Math.PI * polAngle / 180);
            Ey = Math.sin(Math.PI * polAngle / 180);
            lMag = (1 / 2) * Math.sqrt(Ey ** 2 + Ex ** 2);
            rMag = lMag;
            ldelay = Math.atan2(Ex, Ey);
            rdelay = Math.atan2(-Ex, Ey);

            initialWaveformManager.lMag = lMag;
            initialWaveformManager.rMag = rMag;
            initialWaveformManager.ldelay = ldelay;
            initialWaveformManager.rdelay = rdelay;
            finalWaveformManager.lMag = lMag;
            finalWaveformManager.rMag = rMag;
            finalWaveformManager.ldelay = ldelay;
            finalWaveformManager.rdelay = rdelay + delay * Math.PI / 180;
        } else if (state == LHCP) {
            initialWaveformManager.lMag = 1/Math.sqrt(2);
            initialWaveformManager.rMag = 0;
            initialWaveformManager.ldelay = 0;
            initialWaveformManager.rdelay = 0;
            finalWaveformManager.lMag = 1/Math.sqrt(2);
            finalWaveformManager.rMag = 0;
            finalWaveformManager.ldelay = 0;
            finalWaveformManager.rdelay = delay * Math.PI / 180;
        } else if (state == RHCP) {
            initialWaveformManager.lMag = 0;
            initialWaveformManager.rMag = 1/Math.sqrt(2);
            initialWaveformManager.ldelay = 0;
            initialWaveformManager.rdelay = 0;
            finalWaveformManager.lMag = 0;
            finalWaveformManager.rMag = 1/Math.sqrt(2);
            finalWaveformManager.ldelay = 0;
            finalWaveformManager.rdelay = delay * Math.PI / 180;
        } else if (state == ARB) {
            Ex = Math.cos(Math.PI * polAngle / 180);
            Ey = Math.sin(Math.PI * polAngle / 180);
            delayRad = inputDelay * Math.PI / 180;
            lMag = (1 / 2) * Math.sqrt((Ey - Ex * Math.sin(delayRad)) ** 2 + (Ex * Math.cos(delayRad)) ** 2);
            rMag = (1 / 2) * Math.sqrt((Ey + Ex * Math.sin(delayRad)) ** 2 + (Ex * Math.cos(delayRad)) ** 2);
            ldelay = Math.atan2(Ex * Math.cos(delayRad), (Ey - Ex * Math.sin(delayRad)));
            rdelay = Math.atan2(-Ex * Math.cos(delayRad), (Ey + Ex * Math.sin(delayRad)));

            initialWaveformManager.lMag = lMag;
            initialWaveformManager.rMag = rMag;
            initialWaveformManager.ldelay = ldelay;
            initialWaveformManager.rdelay = rdelay;
            finalWaveformManager.lMag = lMag;
            finalWaveformManager.rMag = rMag;
            finalWaveformManager.ldelay = ldelay;
            finalWaveformManager.rdelay = rdelay;
        }
    } else {
        initialWaveformManager.circBasis = false;
        finalWaveformManager.circBasis = false;

        if (state == LINEAR) {
            initialWaveformManager.xMag = Math.cos(Math.PI * polAngle / 180);
            initialWaveformManager.yMag = Math.sin(Math.PI * polAngle / 180);
            initialWaveformManager.delay = 0;
            finalWaveformManager.xMag = initialWaveformManager.xMag;
            finalWaveformManager.yMag = initialWaveformManager.yMag;
            finalWaveformManager.delay = delay * Math.PI / 180;
        } else if (state == LHCP) {
            initialWaveformManager.xMag = Math.sqrt(2) / 2;
            initialWaveformManager.yMag = Math.sqrt(2) / 2;
            initialWaveformManager.delay = -Math.PI / 2;
            finalWaveformManager.xMag = Math.sqrt(2) / 2;
            finalWaveformManager.yMag = Math.sqrt(2) / 2;
            finalWaveformManager.delay = -Math.PI / 2 + delay * Math.PI / 180;
        } else if (state == RHCP) {
            initialWaveformManager.xMag = Math.sqrt(2) / 2;
            initialWaveformManager.yMag = Math.sqrt(2) / 2;
            initialWaveformManager.delay = Math.PI / 2;
            finalWaveformManager.xMag = Math.sqrt(2) / 2;
            finalWaveformManager.yMag = Math.sqrt(2) / 2;
            finalWaveformManager.delay = Math.PI / 2 + delay * Math.PI / 180;
        } else if (state == ARB) {
            initialWaveformManager.xMag = Math.cos(Math.PI * polAngle / 180);
            initialWaveformManager.yMag = Math.sin(Math.PI * polAngle / 180);
            initialWaveformManager.delay = inputDelay * Math.PI / 180;
            finalWaveformManager.xMag = initialWaveformManager.xMag;
            finalWaveformManager.yMag = initialWaveformManager.yMag;
            finalWaveformManager.delay = ((inputDelay + delay) * Math.PI / 180);
        }
    }

    if (polarizerOn) {
        finalWaveformManager.profileDrawing.polarizerOn = true;
        finalWaveformManager.profileDrawing.setPolarizerAngle(polarizerAngle * Math.PI / 180);
        finalWaveformManager.sideDrawing.polarizerOn = true;
        finalWaveformManager.sideDrawing.setPolarizerAngle(polarizerAngle * Math.PI / 180);
    } else {
        finalWaveformManager.profileDrawing.polarizerOn = false;
        finalWaveformManager.sideDrawing.polarizerOn = false;
    }
}

// draws the polarization trace when looking down the optic axis
class ProfileDrawing {
    constructor(canvasID) {
        // get render tools and resize canvas to fill container div
        this.canvasID = canvasID;
        this.canvas = document.getElementById(this.canvasID);
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
        this.context = this.canvas.getContext('2d');

        // calculate axis width and center to make room for text labels and give some padding
        this.axisWidth = (this.canvas.width > this.canvas.height) ? Math.round((this.canvas.height - yTextPadding - 3 * padding) / 2) : Math.round((this.canvas.width - xTextPadding - 3 * padding) / 2);
        this.xCenter = padding + this.axisWidth;
        this.yCenter = 2 * padding + yTextPadding + this.axisWidth;

        // calculate trail length to be 1/10 of a revolution
        // setup linked lists use to hold coordinates of redered points
        this.length = Math.round(FPS / (frequency * 10));
        this.xPath = new Path(this.xCenter, this.yCenter, this.length);
        this.yPath = new Path(this.xCenter, this.yCenter, this.length);
        this.xyPath = new Path(this.xCenter, this.yCenter, this.length);

        // set some initial values for polarizer if used
        // usually changed by configureWaveformManagers() but I want to make sure they are null or undefined
        this.polarizerOn = false;
        this.alphaC = 0;
        this.alphaS = 0;
        this.polarizerProjMag = 0;

        // fonts are only drawn once since I don't redraw the whole canvas every frame
        this.context.font = labelFont;
        this.context.fillStyle = "White";
        this.context.fillText("Ey", this.xCenter, this.yCenter - this.axisWidth - padding-0.3*yTextPadding);
        this.context.fillText("Ex", this.xCenter + this.axisWidth + padding, this.yCenter);
    }

    draw() {
        // reset portion of canvas that changes
        this.blank();

        // draw axis
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

        // x-axis trail is used to store polarizer projection if in use
        // tell various paths to draw themselves
        this.context.lineWidth = 4;
        if (this.polarizerOn) {
            this.context.strokeStyle = xyColor;
            this.context.fillStyle = xyColor;
            this.xyPath.drawProfileView(this.context);
            this.context.strokeStyle = polColor;
            this.context.fillStyle = polColor;
            this.xPath.drawProfileView(this.context);
        } else {
            this.context.strokeStyle = xColor;
            this.context.fillStyle = xColor;
            this.xPath.drawProfileView(this.context);
            this.context.strokeStyle = yColor;
            this.context.fillStyle = yColor;
            this.yPath.drawProfileView(this.context);
            this.context.strokeStyle = xyColor;
            this.context.fillStyle = xyColor;
            this.xyPath.drawProfileView(this.context);
        }
    }

    // converts normalized (x,y) corrdinates to canvas coordinates and adds points to path
    // draws main path, x projection, y projection
    // if polarizer is in, draws main path and projection on polarizer axis
    addPoint(x, y) {
        this.point = [Math.round(this.xCenter + this.axisWidth * x), Math.round(this.yCenter - this.axisWidth * y)];
        this.xyPath.appendAndRemove(this.point);
        if (this.polarizerOn) {
            this.polarizerProjMag = this.alphaC * x + this.alphaS * y;
            this.xPath.appendAndRemove([Math.round(this.xCenter + this.axisWidth * this.polarizerProjMag * this.alphaC), Math.round(this.yCenter - this.axisWidth * this.polarizerProjMag * this.alphaS)]);
            this.yPath.appendAndRemove([this.xCenter, this.yCenter]);
        } else {
            this.xPath.appendAndRemove([this.point[0], this.yCenter]);
            this.yPath.appendAndRemove([this.xCenter, this.point[1]]);
        }
    }

    addPointCirc(x1, y1, x2, y2, x3, y3) {
        if (this.polarizerOn) {
            this.addPoint(x1, y1);
        } else {
            this.xyPath.appendAndRemove([Math.round(this.xCenter + this.axisWidth * x1), Math.round(this.yCenter - this.axisWidth * y1)]);
            this.xPath.appendAndRemove([Math.round(this.xCenter + this.axisWidth * x2), Math.round(this.yCenter - this.axisWidth * y2)]);
            this.yPath.appendAndRemove([Math.round(this.xCenter + this.axisWidth * x3), Math.round(this.yCenter - this.axisWidth * y3)]);
        }
    }

    // calculates sin and cos for polarizer projection math since they are used every frame when enabled
    setPolarizerAngle(angle) {
        this.alphaC = Math.cos(angle);
        this.alphaS = Math.sin(angle);
    }

    // blacks out portion of screen which changes
    blank() {
        this.context.fillStyle = "black";
        this.context.fillRect(this.xCenter - this.axisWidth - profileViewBlockRadius - 1, this.yCenter - this.axisWidth - profileViewBlockRadius - 1, 2 * (this.axisWidth + profileViewBlockRadius + 1), 2 * (this.axisWidth + profileViewBlockRadius + 1));
    }
}

// draws a psuedo 3D isometric-ish render of the polarization state
class SideDrawing {
    
    constructor(canvasID) {
        // get render tools and resize canvas to fill container div
        this.canvasID = canvasID;
        this.canvas = document.getElementById(this.canvasID);
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
        this.context = this.canvas.getContext('2d');

        // projScale determines how "squished" the x-axis looks (not true isometric)
        this.projScale = 0.6;

        // calculate various drawing dimensions
        this.yAxisHeight = Math.round((this.canvas.height - 2 * padding) / (2 * (1 + this.projScale)));
        this.xCenter = xTextPadding + 2 * padding + Math.round(this.yAxisHeight * this.projScale);
        this.yCenter = padding + Math.round(this.yAxisHeight * (1 + this.projScale));
        this.opticAxisLength = this.canvas.width - 2 * (this.xCenter) + xTextPadding + padding;
        this.xAxisHeight = Math.round(this.yAxisHeight * this.projScale);

        // build paths which store waveform coordinates
        this.xPath = new Path(this.xCenter, this.yCenter, Math.round(this.opticAxisLength / c));
        this.yPath = new Path(this.xCenter, this.yCenter, Math.round(this.opticAxisLength / c));
        this.xyPath = new Path(this.xCenter, this.yCenter, Math.round(this.opticAxisLength / c));

        // set some polarizer values assuming they can be changed later
        this.polarizerOn = false;
        this.alphaC = 0;
        this.alphaS = 0;
        this.polarizerProjMag = 0;

        // draw text which is never redrawn
        // calculate bounding boxes which need to be blacked out and redrawn since the content changes from frame to frame
        this.context.font = labelFont;
        this.context.fillStyle = "White";
        this.context.fillText("Ey", this.xCenter - xTextPadding, this.yCenter - this.yAxisHeight - padding);
        this.context.fillText("Ex", this.xCenter - this.xAxisHeight - xTextPadding - padding, this.yCenter + this.xAxisHeight);
        this.blankSquare1 = [this.xCenter - this.xAxisHeight - 2, this.yCenter - this.yAxisHeight - 2, this.opticAxisLength + 2 * this.xAxisHeight + 4, 2 * this.yAxisHeight + this.xAxisHeight + 4];
        this.blankSquare2 = [this.xCenter, this.blankSquare1[1] - this.xAxisHeight - 2, this.opticAxisLength + this.xAxisHeight + 2, this.xAxisHeight + 2];
    }

    // draw the waveform
    draw() {
        // clear window
        this.blank();

        // draw front axis
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

        // draw optic axis
        this.context.beginPath();
        this.context.moveTo(this.xCenter, this.yCenter);
        this.context.lineTo((this.xCenter + this.opticAxisLength), (this.yCenter));
        this.context.stroke();

        // draw polarization paths
        if (this.polarizerOn) {
            this.context.strokeStyle = xyColor;
            this.context.fillStyle = xyColor;
            this.xyPath.drawSideView(this.context);

            this.context.strokeStyle = polColor;
            this.context.fillStyle = polColor;
            this.xPath.drawSideView(this.context);
        } else {
            this.context.strokeStyle = yColor;
            this.context.fillStyle = yColor;
            this.yPath.drawSideView(this.context);

            this.context.strokeStyle = xColor;
            this.context.fillStyle = xColor;
            this.xPath.drawSideView(this.context);

            this.context.strokeStyle = xyColor;
            this.context.fillStyle = xyColor;
            this.xyPath.drawSideView(this.context);
        }

        // draw back axis
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

    // takes normalized and updates paths
    addPoint(x, y, z) {
        this.getRealCoord(x, y, z);
        this.xyPath.appendAndRemove([this.realX, this.realY]);

        if (this.polarizerOn) {
            this.polarizerProjMag = this.alphaC * x + this.alphaS * y;
            this.getRealCoord((this.polarizerProjMag * this.alphaC), (this.polarizerProjMag * this.alphaS), z);
            this.xPath.appendAndRemove([this.realX, this.realY]);
            this.yPath.appendAndRemove([this.xCenter, this.yCenter]);
        } else {
            this.getRealCoord(x, 0, z);
            this.xPath.appendAndRemove([this.realX, this.realY]);

            this.getRealCoord(0, y, z);
            this.yPath.appendAndRemove([this.realX, this.realY]);
        }
    }

    addPointCirc(x1, y1, x2, y2, x3, y3, z) {
        if (this.polarizerOn) {
            this.addPoint(x1, y1, z);
        } else {
            this.getRealCoord(x1, y1, z);
            this.xyPath.appendAndRemove([this.realX, this.realY]);
            this.getRealCoord(x2, y2, z);
            this.xPath.appendAndRemove([this.realX, this.realY]);
            this.getRealCoord(x3, y3, z);
            this.yPath.appendAndRemove([this.realX, this.realY]);
        }
    }

    // shift paths to create illusion of traveling wave
    shift(displacement) {
        this.xPath.shift(displacement);
        this.yPath.shift(displacement);
        this.xyPath.shift(displacement);
    }

    // convert from normalized coordinates to isometric canvas pixel coordinates
    getRealCoord(x, y, z) {
        this.realX = Math.round(this.xCenter + z - this.projScale * x * this.yAxisHeight);
        this.realY = Math.round(this.yCenter + this.yAxisHeight*(this.projScale * x - y));
    }

    // calculate sin and cos for projection math since they are used every frame when polarizer is enabled
    setPolarizerAngle(angle) {
        this.alphaC = Math.cos(angle);
        this.alphaS = Math.sin(angle);
    }

    // if phase speed changes, paths need to be resized to fill optic axis
    changeSpeed() {
        this.xPath.changeLength(Math.round(this.opticAxisLength / c));
        this.yPath.changeLength(Math.round(this.opticAxisLength / c));
        this.xyPath.changeLength(Math.round(this.opticAxisLength / c));
    }

    // black out canvas before redrawing
    blank() {
        this.context.fillStyle = "black";
        this.context.fillRect(this.blankSquare1[0], this.blankSquare1[1], this.blankSquare1[2], this.blankSquare1[3]);
        this.context.fillRect(this.blankSquare2[0], this.blankSquare2[1], this.blankSquare2[2], this.blankSquare2[3]);
    }
}

// node used for linked list
class PathNode {
    constructor(content, previousNode, nextNode) {
        this.content = content;
        this.previousNode = previousNode;
        this.nextNode = nextNode;
    }
}

// A linked list with some extra bells and whistles to simplify drawing operations
// content of each node is a two element array with x-y pixel coordinates
class Path {
    constructor(xCenter, yCenter, length) {
        // some initial values
        this.circleRadius = 2;
        this.length = length;
        this.xCenter = xCenter;
        this.yCenter = yCenter;

        // build the chain of nodes;
        this.firstNode = new PathNode([xCenter, yCenter], null, null);
        this.lastNode = this.firstNode;
        for (let i = 1; i < length; i++) {
            this.temp = new PathNode([xCenter, yCenter], this.lastNode, null);
            this.lastNode.nextNode = this.temp;
            this.lastNode = this.temp;
        }
    }

    // remove the last node
    removeLast() {
        this.temp = null;
        this.temp = this.lastNode;
        this.lastNode = this.lastNode.previousNode;
        this.lastNode.nextNode = null;
        this.temp.previousNode = null;
        this.length--;
    }

    // add a node to the start
    appendToStart(content) {
        this.temp = new PathNode(content, null, this.firstNode);
        this.firstNode.previousNode = this.temp;
        this.firstNode = this.temp;
        this.length++;
    }

    // add a node to the end
    appendToEnd(content) {
        this.temp = new PathNode(content, this.lastNode, null);
        this.lastNode.nextNode = this.temp;
        this.lastNode = this.temp;
        this.length++;
    }

    // move the last node to the front and refill it's contents
    // recycling to avoid instantiation every frame
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

    // change length (used when phase velocity "c" changes)
    changeLength(newLength) {
        let lengthDifference = newLength - this.length;
        if (lengthDifference < 0) {
            for (let i = 0; i < (-lengthDifference); i++) {
               this.removeLast();
            }
        } else if (lengthDifference > 0) {
            let content = this.firstNode.content;
            for (let i = 0; i < lengthDifference; i++) {
                this.appendToStart([content[0], content[1]]);
            }
        }
    }

    // add constant to the x-value of each node. Used to make the wave
    // move for the side render
    shift(displacement) {
        this.temp = this.firstNode;
        this.temp.content[0] += displacement;
        for (let i = 1; i < this.length; i++) {
            this.temp = this.temp.nextNode;
            this.temp.content[0] += displacement;
        }
    }

    // draw method for side view
    drawSideView(context) {
        this.temp = this.firstNode;

        // draw square at begining (hopefully makes it easier to see where profile matches with side view)
        context.fillRect(this.temp.content[0] - sideViewBlockRadius, this.temp.content[1] - sideViewBlockRadius, 2 * sideViewBlockRadius + 1, 2 * sideViewBlockRadius + 1);

        // draw a line between the coordinates held in each pair of adjacent nodes
        context.beginPath();
        context.moveTo(this.xCenter, this.yCenter);
        context.lineTo(this.temp.content[0], this.temp.content[1]);

        for (let i = 1; i < this.length; i++) {
            this.temp = this.temp.nextNode;
            context.lineTo(this.temp.content[0], this.temp.content[1]);
            // periodically draw line back to optic axis. Helps to visually understand what is being represented
            if ((i % spokeSpacing) == 0) {
                context.lineTo((this.xCenter + i*c), this.yCenter);
                context.moveTo(this.temp.content[0], this.temp.content[1]);
            }
        }

        context.stroke();
    }

    // draw method for profile view
    drawProfileView(context) {
        this.temp = this.firstNode;

        context.fillRect(this.temp.content[0] - profileViewBlockRadius, this.temp.content[1] - profileViewBlockRadius, 2 * profileViewBlockRadius + 1, 2 * profileViewBlockRadius + 1);

        context.beginPath();
        context.moveTo(this.temp.content[0], this.temp.content[1]);

        for (let i = 1; i < this.length; i++) {
            this.temp = this.temp.nextNode;
            context.lineTo(this.temp.content[0], this.temp.content[1]);
        }

        context.stroke();
    }
}

// calculates normalized polarization state coordinates and sends them to the drawing objects to be converted into pixel coordinates and stored
class WaveformManager {
    constructor(profileCanvasID, sideCanvasID, frequency, delay, xMag, yMag) {
        // set initial values
        this.frame = 0;
        this.sideDrawing = new SideDrawing(sideCanvasID);
        this.profileDrawing = new ProfileDrawing(profileCanvasID);
        this.frequency = frequency;
        this.delay = delay;
        this.xMag = xMag;
        this.yMag = yMag;
        this.circBasis = false;
        this.rdelay = 0;
        this.ldelay = 0;
        this.rMag = 1/2;
        this.lMag = 1/2;
    }

    // update and draw function used in animation loop
    update() {
        // advance frame counter
        this.frame++;

        // shift 3D view to make it look like wave is moving
        this.sideDrawing.shift(c);

        
        if (this.circBasis) {
            this.phase = 2 * Math.PI * this.frequency * this.frame / FPS;
            this.x2 = this.rMag * Math.sin(this.phase - Math.PI / 2 - this.rdelay);
            this.y2 = this.rMag * Math.sin(this.phase - this.rdelay);
            this.x3 = this.lMag * Math.sin(this.phase + Math.PI / 2 - this.ldelay);
            this.y3 = this.lMag * Math.sin(this.phase - this.ldelay);

            this.profileDrawing.addPointCirc((this.x2 + this.x3), (this.y2 + this.y3), this.x2, this.y2, this.x3, this.y3);
            this.sideDrawing.addPointCirc((this.x2 + this.x3), (this.y2 + this.y3), this.x2, this.y2, this.x3, this.y3, 0);
        } else {
            // calculate normalized coordinates of polarization state
            this.phase = 2 * Math.PI * this.frequency * this.frame / FPS;
            this.x0 = this.xMag * Math.sin(this.phase - this.delay);
            this.y0 = this.yMag * Math.sin(this.phase);

            // update drawing objects with normalized coordinates
            this.sideDrawing.addPoint(this.x0, this.y0, 0);
            this.profileDrawing.addPoint(this.x0, this.y0);
        }
        // draw
        this.sideDrawing.draw();
        this.profileDrawing.draw();
    }

    // needs to be passed through
    changeSpeed() {
        this.sideDrawing.changeSpeed();
    }
}