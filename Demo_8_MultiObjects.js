/*-----------------------------------------------------------------------------------*/
// Variable Declaration
/*-----------------------------------------------------------------------------------*/

// Common variables
var canvas, gl, program;
var pBuffer, nBuffer, vPosition, vNormal;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var modelViewMatrix, projectionMatrix, nMatrix;

// Variables referencing HTML elements
// theta = [x, y, z]
const X_AXIS = 0;
const Y_AXIS = 1;
const Z_AXIS = 2;
var cylinderX, cylinderY, cylinderZ, cylinderAxis = X_AXIS, cylinderBtn;
var cubeX, cubeY, cubeZ, cubeAxis = X_AXIS, cubeBtn;
var cylinderObj, cubeObj, cylinderFlag = false, cubeFlag = false;
var cylinderTheta = [0,0,0], cubeTheta = [0, 0, 0], animFrame = 0;
var pointsArray = [], normalsArray = [], cylinderV, cubeV, totalV;

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

/*-----------------------------------------------------------------------------------*/
// WebGL Utilities
/*-----------------------------------------------------------------------------------*/

// Execute the init() function when the web page has fully loaded
window.onload = function init()
{
    // Primitive (geometric shape) initialization
    // Shape 1 = Cylinder, Shape 2 = Cube
    cylinderObj = cylinder(72, 3, true);
    cylinderObj.Rotate(45, [1, 1, 0]);
    cylinderObj.Scale(1.2, 1.2, 1.2);
    concatData(cylinderObj.Point, cylinderObj.Normal);

    cubeObj = cube();
    cubeObj.Rotate(45, [1, 1, 0]);
    cubeObj.Scale(1, 1, 1);
    concatData(cubeObj.Point, cubeObj.Normal);
    
    cylinderV = (cylinderObj.Point).length;
    cubeV = (cubeObj.Point).length;
	totalV = pointsArray.length;

    // WebGL setups
    getUIElement();
    configWebGL();
    render();
}

// Retrieve all elements from HTML and store in the corresponding variables
function getUIElement()
{
    canvas = document.getElementById("gl-canvas");

    cylinderX = document.getElementById("cylinder-x");
    cylinderY = document.getElementById("cylinder-y");
    cylinderZ = document.getElementById("cylinder-z");
    cylinderBtn = document.getElementById("cylinder-btn");

    cubeX = document.getElementById("cube-x");
    cubeY = document.getElementById("cube-y");
    cubeZ = document.getElementById("cube-z");
    cubeBtn = document.getElementById("cube-btn");

    cylinderX.onchange = function() 
	{
		if(cylinderX.checked) cylinderAxis = X_AXIS;
    };

    cylinderY.onchange = function() 
	{
		if(cylinderY.checked) cylinderAxis = Y_AXIS;
    };

    cylinderZ.onchange = function() 
	{
		if(cylinderZ.checked) cylinderAxis = Z_AXIS;
    };

    cylinderBtn.onclick = function()
	{
		cylinderFlag = !cylinderFlag;
	};

    cubeX.onchange = function() 
	{
		if(cubeX.checked) cubeAxis = X_AXIS;
    };

    cubeY.onchange = function() 
	{
		if(cubeY.checked) cubeAxis = Y_AXIS;
    };

    cubeZ.onchange = function() 
	{
		if(cubeZ.checked) cubeAxis = Z_AXIS;
    };

    cubeBtn.onclick = function()
	{
		cubeFlag = !cubeFlag;
	};
}

// Configure WebGL Settings
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
    // Cancel the animation frame before performing any graphic rendering
    if(cylinderFlag || cubeFlag)
    {
        cylinderFlag = false;
        cubeFlag = false;
        window.cancelAnimationFrame(animFrame);
    }

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

    animUpdate();
}

// Update the animation frame
function animUpdate()
{
    // Clear the color buffer and the depth buffer before rendering a new frame
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    drawCylinder();
    drawCube();
 
    // Schedule the next frame for a looped animation (60fps)
    animFrame = window.requestAnimationFrame(animUpdate);
}

// Draw the first shape (cylinder)
function drawCylinder()
{
    // Increment the rotation value if the animation is enabled
    if(cylinderFlag)
    {
        cylinderTheta[cylinderAxis] += 1;
    }

    // Pass the model view matrix from JavaScript to the GPU for use in shader
    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, translate(-1.5, 0, 0));
    modelViewMatrix = mult(modelViewMatrix, rotate(cylinderTheta[X_AXIS], [1, 0, 0]));
    modelViewMatrix = mult(modelViewMatrix, rotate(cylinderTheta[Y_AXIS], [0, 1, 0]));
    modelViewMatrix = mult(modelViewMatrix, rotate(cylinderTheta[Z_AXIS], [0, 0, 1]));
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
    // Increment the rotation value if the animation is enabled
    if(cubeFlag)
    {
        cubeTheta[cubeAxis] += 1;
    }

    // Pass the model view matrix from JavaScript to the GPU for use in shader
    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, translate(1.5, 0, 0));
    modelViewMatrix = mult(modelViewMatrix, rotate(cubeTheta[X_AXIS], [1, 0, 0]));
    modelViewMatrix = mult(modelViewMatrix, rotate(cubeTheta[Y_AXIS], [0, 1, 0]));
    modelViewMatrix = mult(modelViewMatrix, rotate(cubeTheta[Z_AXIS], [0, 0, 1]));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    // Pass the normal matrix from JavaScript to the GPU for use in shader
    nMatrix = normalMatrix(modelViewMatrix);
    gl.uniformMatrix3fv(normalMatrixLoc, false, nMatrix);

    // Draw the primitive from the last index of shape 1 to the last index of shape 2
    gl.drawArrays(gl.TRIANGLES, cylinderV, cubeV);
}

// Concatenate the corresponding shape's values
function concatData(point, normal)
{
	pointsArray = pointsArray.concat(point);
	normalsArray = normalsArray.concat(normal);
}

/*-----------------------------------------------------------------------------------*/