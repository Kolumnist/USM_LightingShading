// Common variables
var canvas, gl, program;
var pBuffer, nBuffer, vPosition, vNormal;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var modelViewMatrix, projectionMatrix, nMatrix;

// Variables referencing HTML elements
const X_AXIS = 0;
const Y_AXIS = 1;
const Z_AXIS = 2;
var dropdownSelect; // Dropdown for object selection
var cylinderX, cylinderY, cylinderZ, cylinderAxis = X_AXIS, cylinderBtn;
var cubeX, cubeY, cubeZ, cubeAxis = X_AXIS, cubeBtn;
var sphereX, sphereY, sphereZ, sphereAxis = X_AXIS, sphereBtn;
var cylinderObj, cubeObj, sphereObj, cylinderFlag = false, cubeFlag = false, sphereFlag = false, selectedObject = "cylinder";
var cylinderTheta = [0, 0, 0], cubeTheta = [0, 0, 0], sphereTheta = [0, 0, 0];
var pointsArray = [], normalsArray = [], cylinderV, cubeV, sphereV, totalV;

// Variables for lighting control
var ambientProduct, diffuseProduct, specularProduct;
var ambient = 0.5, diffuse = 0.5, specular = 0.5, shininess = 60;
var lightPos = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(ambient, ambient, ambient, 1.0);
var lightDiffuse = vec4(diffuse, diffuse, diffuse, 1.0);
var lightSpecular = vec4(specular, specular, specular, 1.0);

var materialAmbient = vec4(0.5, 0.5, 1.0, 1.0);
var materialDiffuse = vec4(0.0, 0.9, 1.0, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var eye = vec3(0.0, 0.0, 1.0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

// Variables referencing HTML elements for light and material properties
var cameraPosition;
var sliderAmbient, sliderDiffuse, sliderSpecular, sliderShininess;
var sliderLightX, sliderLightY, sliderLightZ;
var textAmbient, textDiffuse, textSpecular, textShininess;
var textLightX, textLightY, textLightZ;

var isSmooth = true;

// Execute the init() function when the web page has fully loaded
window.onload = function init() {
    initObjects();
    getUIElement();
    configWebGL();
    render();
}

function initObjects() {
    cylinderObj = cylinder(72, 3, true);
    cylinderObj.Rotate(45, [1, 1, 0]);
    cylinderObj.Scale(1.2, 1.2, 1.2);
    concatData(cylinderObj.Point, cylinderObj.Normal);

    sphereObj = sphere(5);
    sphereObj.Scale(0.5, 0.5, 0.5);
    concatData(sphereObj.Point, sphereObj.Normal);

    cubeObj = cube();
    cubeObj.Scale(0.8, 1.5, 1);
    concatData(cubeObj.Point, cubeObj.Normal);

    cylinderV = (cylinderObj.Point).length;
    cubeV = (cubeObj.Point).length;
    sphereV = (sphereObj.Point).length;
    totalV = pointsArray.length;
}

function getUIElement() {
    canvas = document.getElementById("gl-canvas");
    cameraPosition = document.getElementById("camera-position");
    dropdownSelect = document.getElementById("object-select");

    sliderAmbient = document.getElementById("slider-ambient");
    sliderDiffuse = document.getElementById("slider-diffuse");
    sliderSpecular = document.getElementById("slider-specular");
    sliderShininess = document.getElementById("slider-shininess");
    sliderLightX = document.getElementById("slider-light-x");
    sliderLightY = document.getElementById("slider-light-y");
    sliderLightZ = document.getElementById("slider-light-z");
    textAmbient = document.getElementById("text-ambient");
    textDiffuse = document.getElementById("text-diffuse");
    textSpecular = document.getElementById("text-specular");
    textShininess = document.getElementById("text-shininess");
    textLightX = document.getElementById("text-light-x");
    textLightY = document.getElementById("text-light-y");
    textLightZ = document.getElementById("text-light-z");

    canvas.addEventListener("mousemove", onMouseMove);
    document.addEventListener("keydown", onKeyDown);

    dropdownSelect.onchange = function (event) {
        selectedObject = event.target.value;
        recompute();
    };

    sliderAmbient.oninput = function (event) {
        ambient = parseFloat(event.target.value);
        textAmbient.innerHTML = ambient;
        lightAmbient = vec4(ambient, ambient, ambient, 1.0);
        recompute();
    };

    sliderDiffuse.oninput = function (event) {
        diffuse = parseFloat(event.target.value);
        textDiffuse.innerHTML = diffuse;
        lightDiffuse = vec4(diffuse, diffuse, diffuse, 1.0);
        recompute();
    };

    sliderSpecular.oninput = function (event) {
        specular = parseFloat(event.target.value);
        textSpecular.innerHTML = specular;
        lightSpecular = vec4(specular, specular, specular, 1.0);
        recompute();
    };

    sliderShininess.oninput = function (event) {
        shininess = parseFloat(event.target.value);
        textShininess.innerHTML = shininess;
        recompute();
    };

    sliderLightX.oninput = function (event) {
        lightPos[0] = parseFloat(event.target.value);
        textLightX.innerHTML = lightPos[0].toFixed(1);
        recompute();
    };

    sliderLightY.oninput = function (event) {
        lightPos[1] = parseFloat(event.target.value);
        textLightY.innerHTML = lightPos[1].toFixed(1);
        recompute();
    };

    sliderLightZ.oninput = function (event) {
        lightPos[2] = parseFloat(event.target.value);
        textLightZ.innerHTML = lightPos[2].toFixed(1);
        recompute();
    };
}

function configWebGL() {
    gl = WebGLUtils.setupWebGL(canvas);

    if (!gl) {
        alert("WebGL isn't available");
    }

    // Set the viewport and clear the color
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Create buffers and link them to the corresponding attribute variables in vertex and fragment shaders
    // Buffer for positions
    pBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Buffer for normals
    nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    // Get the location of the uniform variables within a compiled shader program
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Pass the projection matrix from JavaScript to the GPU for use in shader
    // ortho(left, right, bottom, top, near, far)
    projectionMatrix = ortho(-4, 4, -2.25, 2.25, -10, 10);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // Compute the ambient, diffuse, and specular values
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = vec4(0.0, 0.0, 0.0, 1.0);
    if (isSmooth) {
        specularProduct = mult(lightSpecular, materialSpecular);
    }

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPos"), flatten(lightPos));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), shininess);

    // Render objects based on user selection
    if (selectedObject === "cylinder") {
        drawCylinder();
    } else if (selectedObject === "sphere") {
        drawSphere();
    } else if (selectedObject === "cube") {
        drawCube();
    }

    cameraPosition.innerHTML =
        "Eye: " + eye[0].toFixed(2) + ", " + eye[1].toFixed(2) + " ..... " +
        "At: " + at[0].toFixed(2) + ", " + at[1].toFixed(2) + " ..... " +
        "Up: " + up[0].toFixed(2);
    requestAnimationFrame(render);
}

function drawCylinder() {
    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, lookAt(eye, at, up));
    modelViewMatrix = mult(modelViewMatrix, translate(0, 0, 0));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    nMatrix = normalMatrix(modelViewMatrix);
    gl.uniformMatrix3fv(normalMatrixLoc, false, nMatrix);

    gl.drawArrays(gl.TRIANGLES, 0, cylinderV);
}

function drawSphere() {
    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, lookAt(eye, at, up));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    nMatrix = normalMatrix(modelViewMatrix);
    gl.uniformMatrix3fv(normalMatrixLoc, false, nMatrix);

    gl.drawArrays(gl.TRIANGLES, cylinderV, sphereV);
}

function drawCube() {
    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, lookAt(eye, at, up));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    nMatrix = normalMatrix(modelViewMatrix);
    gl.uniformMatrix3fv(normalMatrixLoc, false, nMatrix);

    gl.drawArrays(gl.TRIANGLES, cylinderV + sphereV, cubeV);
}

// Concatenate the corresponding shape's values
function concatData(point, normal) {
    pointsArray = pointsArray.concat(point);
    normalsArray = normalsArray.concat(normal);
}

// Recompute points and colors, followed by reconfiguring WebGL for rendering
function recompute() {
    pointsArray = [];
    normalsArray = [];

    initObjects();
    configWebGL();
    render();
}

function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    at[0] = (event.clientX / rect.width) * 10 - 5;
    at[1] = (event.clientY / rect.height) * 10 - 5;
}

function onKeyDown(event) {
    const eyeMax = 5;
    const eyeMin = -5;

    switch (event.key) {
        case "ArrowUp":
            eye[1] += 0.1;
            if (eye[1] > eyeMax) eye[1] = eyeMax;
            break;
        case "ArrowDown":
            eye[1] -= 0.1;
            if (eye[1] < eyeMin) eye[1] = eyeMin;
            break;
        case "ArrowLeft":
            eye[0] += 0.1;
            if (eye[0] > eyeMax) eye[0] = eyeMax;
            break;
        case "ArrowRight":
            eye[0] -= 0.1;
            if (eye[0] < eyeMin) eye[0] = eyeMin;
            break;
        case "d":
            up[0] += 0.02;
            if (up[0] > 1) up[0] = 1;
            break;
        case "a":
            up[0] -= 0.02;
            if (up[0] < -1) up[0] = -1;
            break;
        case "s":
            isSmooth = !isSmooth;
            break;
        default: break;
    }
}
