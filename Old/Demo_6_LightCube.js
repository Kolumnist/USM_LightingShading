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
var sliderAmbient, sliderDiffuse, sliderSpecular, sliderShininess;
var sliderLightX, sliderLightY, sliderLightZ;
var textAmbient, textDiffuse, textSpecular, textShininess;
var textLightX, textLightY, textLightZ;
var startBtn, theta = [0, 0, 0];
var animFrame = 0, animFlag = false;

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

var eye = vec3(1.0, 1.0, 1.0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

// Variables for the sphere
var cubeObj, points = [], normals = [];

/*-----------------------------------------------------------------------------------*/
// WebGL Utilities
/*-----------------------------------------------------------------------------------*/

// Execute the init() function when the web page has fully loaded
window.onload = function init()
{
    // Primitive (geometric shape) initialization
    cubeObj = cube();
    points = cubeObj.Point;
    normals = cubeObj.Normal;

    // WebGL setups
    getUIElement();
    configWebGL();
    render();
}

// Retrieve all elements from HTML and store in the corresponding variables
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
    startBtn = document.getElementById("start-btn");

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

    startBtn.onclick = function()
	{
		animFlag = !animFlag;

        if(animFlag) animUpdate();
        else window.cancelAnimationFrame(animFrame);
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
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Buffer for normals
    nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
    
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
    if(animFlag)
    {
        animFlag = false;
        window.cancelAnimationFrame(animFrame);
    }
    
    // Clear the color buffer and the depth buffer before rendering a new frame
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Pass the projection matrix from JavaScript to the GPU for use in shader
    // ortho(left, right, bottom, top, near, far)
    projectionMatrix = ortho(-4, 4, -2.25, 2.25, -5, 5);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // Pass the model view matrix from JavaScript to the GPU for use in shader
    modelViewMatrix = lookAt(eye, at , up);
    modelViewMatrix = mult(modelViewMatrix, rotateZ(theta[2]));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    // Pass the normal matrix from JavaScript to the GPU for use in shader
    nMatrix = normalMatrix(modelViewMatrix);
    gl.uniformMatrix3fv(normalMatrixLoc, false, nMatrix);

    // Compute the ambient, diffuse, and specular values
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPos"), flatten(lightPos));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), shininess);

    // Draw the primitive / geometric shape
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
}

// Recompute points and colors, followed by reconfiguring WebGL for rendering
function recompute()
{
    // Reset points and normals for render update
    points = [];
	normals = [];
    
    cubeObj = cube();
    points = cubeObj.Point;
    normals = cubeObj.Normal;
    configWebGL();
    render();
}

// Update the animation frame
function animUpdate()
{
    // Clear the color buffer and the depth buffer before rendering a new frame
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Z-axis rotation increment by 1
    theta[2] -= 1;

    // Set the model view matrix for vertex transformation
    modelViewMatrix = lookAt(eye, at , up);
    modelViewMatrix = mult(modelViewMatrix, rotateZ(theta[2]));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    // Draw the primitive / geometric shape
    gl.drawArrays(gl.TRIANGLES, 0, points.length);

    // Schedule the next frame for a looped animation (60fps)
    animFrame = window.requestAnimationFrame(animUpdate);
}

/*-----------------------------------------------------------------------------------*/