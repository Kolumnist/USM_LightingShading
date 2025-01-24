/*-----------------------------------------------------------------------------------*/
// Variable Declaration
/*-----------------------------------------------------------------------------------*/

// Common variables
var canvas, gl, program;
var pBuffer, nBuffer, vPosition, vNormal;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var modelViewMatrix, projectionMatrix, nMatrix;

// Variables referencing HTML elements
const X_AXIS = 0;
const Y_AXIS = 1;
const Z_AXIS = 2;
var cylinderX, cylinderY, cylinderZ, cylinderAxis = X_AXIS, cylinderBtn;
var cubeX, cubeY, cubeZ, cubeAxis = X_AXIS, cubeBtn;
var sphereX, sphereY, sphereZ, sphereAxis = X_AXIS, sphereBtn;
var cylinderObj, cubeObj, sphereObj, cylinderFlag = false, cubeFlag = false, sphereFlag = false;
var cylinderTheta = [0,0,0], cubeTheta = [0, 0, 0], sphereTheta = [0, 0, 0];
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
var sliderAmbient, sliderDiffuse, sliderSpecular, sliderShininess;
var sliderLightX, sliderLightY, sliderLightZ;
var textAmbient, textDiffuse, textSpecular, textShininess;
var textLightX, textLightY, textLightZ;

/*-----------------------------------------------------------------------------------*/
// WebGL Utilities
/*-----------------------------------------------------------------------------------*/

// Execute the init() function when the web page has fully loaded
window.onload = function init()
{
    initObjects();
    // WebGL setups
    getUIElement();
    configWebGL();
    render();
}

function initObjects() 
{
    cylinderObj = cylinder(72, 3, true);
    //cylinderObj.Rotate(45, [1, 1, 0]);
    cylinderObj.Scale(1.2, 1.2, 1.2);
    concatData(cylinderObj.Point, cylinderObj.Normal);

    cubeObj = cube();
    cubeObj.Rotate(45, [1, 1, 0]);
    cubeObj.Scale(1, 1, 1);
    concatData(cubeObj.Point, cubeObj.Normal);

    sphereObj = sphere(5);
    sphereObj.Scale(0.5, 0.5, 0.5);
    concatData(sphereObj.Point, sphereObj.Normal);
    
    cylinderV = (cylinderObj.Point).length;
    cubeV = (cubeObj.Point).length;
    sphereV = (sphereObj.Point).length;
	totalV = pointsArray.length;
}

function getUIElement()
{
    canvas = document.getElementById("gl-canvas");

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

    sliderAmbient.onchange = function(event) 
	{
		ambient = event.target.value;
		textAmbient.innerHTML = ambient;
        lightAmbient = vec4(ambient, ambient, ambient, 1.0);
        recompute();
    };

    sliderDiffuse.onchange = function(event) 
	{
		diffuse = event.target.value;
		textDiffuse.innerHTML = diffuse;
        lightDiffuse = vec4(diffuse, diffuse, diffuse, 1.0);
        recompute();
    };

    sliderSpecular.onchange = function(event) 
	{
		specular = event.target.value;
		textSpecular.innerHTML = specular;
        lightSpecular = vec4(specular, specular, specular, 1.0);
        recompute();
    };

    sliderShininess.onchange = function(event) 
	{
		shininess = event.target.value;
		textShininess.innerHTML = shininess;
        recompute();
    };

    sliderLightX.onchange = function(event) 
	{
		lightPos[0] = event.target.value;
		textLightX.innerHTML = lightPos[0].toFixed(1);
        recompute();
    };

    sliderLightY.onchange = function(event) 
	{
		lightPos[1] = event.target.value;
		textLightY.innerHTML = lightPos[1].toFixed(1);
        recompute();
    };

    sliderLightZ.onchange = function(event) 
	{
		lightPos[2] = event.target.value;
		textLightZ.innerHTML = lightPos[2].toFixed(1);
        recompute();
    };
}

function configWebGL()
{
    // Initialize the WebGL context
    gl = WebGLUtils.setupWebGL(canvas);
    
    if(!gl)
    {
        alert("WebGL isn't available");
    }

    // Set the viewport and clear the color
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // Enable hidden-surface removal
    gl.enable(gl.DEPTH_TEST);

    // Compile the vertex and fragment shaders and link to WebGL
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

// Render the graphics for viewing
function render()
{
    // Clear the color buffer and the depth buffer before rendering a new frame
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Pass the projection matrix from JavaScript to the GPU for use in shader
    // ortho(left, right, bottom, top, near, far)
    projectionMatrix = ortho(-4, 4, -2.25, 2.25, -5, 5);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // Compute the ambient, diffuse, and specular values
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPos"), flatten(lightPos));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), shininess);

    drawCylinder();
    drawCube();
    drawSphere();

    requestAnimationFrame(render);
}

// Draw the first shape (cylinder)
function drawCylinder()
{
    //cylinderTheta[cylinderAxis] += 0.1;

    // Pass the model view matrix from JavaScript to the GPU for use in shader
    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, lookAt(eye, at , up));
    modelViewMatrix = mult(modelViewMatrix, translate(0, 0, 0));
    //modelViewMatrix = mult(modelViewMatrix, rotate(cylinderTheta[X_AXIS], [1, 0, 0]));
    //modelViewMatrix = mult(modelViewMatrix, rotate(cylinderTheta[Y_AXIS], [0, 1, 0]));
    //modelViewMatrix = mult(modelViewMatrix, rotate(cylinderTheta[Z_AXIS], [0, 0, 1]));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    // Pass the normal matrix from JavaScript to the GPU for use in shader
    nMatrix = normalMatrix(modelViewMatrix);
    gl.uniformMatrix3fv(normalMatrixLoc, false, nMatrix);

    // Draw the primitive from index 0 to the last index of shape 1
    gl.drawArrays(gl.TRIANGLES, 0, cylinderV);
}

// Draw the second shape (cube)
function drawCube()
{
    //cubeTheta[cubeAxis] += 0.1;

    /* Pass the model view matrix from JavaScript to the GPU for use in shader
    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, translate(1.5, 0, 0));
    modelViewMatrix = mult(modelViewMatrix, rotate(cubeTheta[X_AXIS], [1, 0, 0]));
    modelViewMatrix = mult(modelViewMatrix, rotate(cubeTheta[Y_AXIS], [0, 1, 0]));
    modelViewMatrix = mult(modelViewMatrix, rotate(cubeTheta[Z_AXIS], [0, 0, 1]));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    */

    // Pass the normal matrix from JavaScript to the GPU for use in shader
    nMatrix = normalMatrix(modelViewMatrix);
    gl.uniformMatrix3fv(normalMatrixLoc, false, nMatrix);

    // Draw the primitive from the last index of shape 1 to the last index of shape 2
    //gl.drawArrays(gl.TRIANGLES, cylinderV, cubeV);
}

// Draw the third shape (sphere)
function drawSphere()
{
    //sphereTheta[sphereAxis] += 0.1;

    /* Pass the model view matrix from JavaScript to the GPU for use in shader
    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, translate(0, 0, 0));
    modelViewMatrix = mult(modelViewMatrix, rotate(sphereTheta[X_AXIS], [1, 0, 0]));
    modelViewMatrix = mult(modelViewMatrix, rotate(sphereTheta[Y_AXIS], [0, 1, 0]));
    modelViewMatrix = mult(modelViewMatrix, rotate(sphereTheta[Z_AXIS], [0, 0, 1]));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    */

    // Pass the normal matrix from JavaScript to the GPU for use in shader
    nMatrix = normalMatrix(modelViewMatrix);
    gl.uniformMatrix3fv(normalMatrixLoc, false, nMatrix);

    // Draw the primitive from the last index of shape 2 to the last index of shape 3
    //gl.drawArrays(gl.TRIANGLES, cylinderV + cubeV, sphereV);
}

// Concatenate the corresponding shape's values
function concatData(point, normal)
{
	pointsArray = pointsArray.concat(point);
	normalsArray = normalsArray.concat(normal);
}

// Recompute points and colors, followed by reconfiguring WebGL for rendering
function recompute()
{
    // Reset points and normals for render update
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
    console.log(at[0]);
}

function onKeyDown(event) {
    const maximum = 5;
    const minimum = -5;

    switch (event.key) {
        case 'ArrowUp':
            eye[1] += 0.1;
            if (eye[1] > maximum) eye[1] = maximum;
            break;
        case 'ArrowDown':
            eye[1] -= 0.1;
            if (eye[1] < minimum) eye[1] = minimum;
            break;
        case 'ArrowLeft':
            eye[0] -= 0.1;
            if (eye[0] < minimum) eye[0] = minimum;
            break;
        case 'ArrowRight':
            eye[0] += 0.1;
            if (eye[0] > maximum) eye[0] = maximum;
            break;
        default: break;
    }
    console.log(eye);
}