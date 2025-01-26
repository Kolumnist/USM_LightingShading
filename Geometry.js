/*-----------------------------------------------------------------------------------*/
// Sphere
/*-----------------------------------------------------------------------------------*/

function sphere(subdivNum) {
	var spherePoints = [], sphereNormals = [], sphereData = {};

	var va = vec4(0.0, 0.0, -1.0, 1);
	var vb = vec4(0.0, 0.942809, 0.333333, 1);
	var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
	var vd = vec4(0.816497, -0.471405, 0.333333, 1);

	function triangle(a, b, c) {
		spherePoints.push([a[0], a[1], a[2], 1]);
		spherePoints.push([b[0], b[1], b[2], 1]);
		spherePoints.push([c[0], c[1], c[2], 1]);

		sphereNormals.push([a[0], a[1], a[2]]);
		sphereNormals.push([b[0], b[1], b[2]]);
		sphereNormals.push([c[0], c[1], c[2]]);
	}

	function divideTriangle(a, b, c, count) {
		if (count > 0) {
			var ab = mix(a, b, 0.5);
			var ac = mix(a, c, 0.5);
			var bc = mix(b, c, 0.5);

			ab = normalize(ab, true);
			ac = normalize(ac, true);
			bc = normalize(bc, true);

			divideTriangle(a, ab, ac, count - 1);
			divideTriangle(ab, b, bc, count - 1);
			divideTriangle(bc, c, ac, count - 1);
			divideTriangle(ab, bc, ac, count - 1);
		}

		else {
			triangle(a, b, c);
		}
	}

	function tetrahedron(a, b, c, d, n) {
		divideTriangle(a, b, c, n);
		divideTriangle(d, c, b, n);
		divideTriangle(a, d, b, n);
		divideTriangle(a, c, d, n);
	}

	// Primitive (geometric shape) initialization
	tetrahedron(va, vb, vc, vd, subdivNum);

	// Functions for local transformation
	function translate(x, y, z) {
		for (var j = 0; j < spherePoints.length; j++) {
			spherePoints[j][0] += x;
			spherePoints[j][1] += y;
			spherePoints[j][2] += z;
		}
	}

	function rotate(angle, axis) {

		var d = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
		var x = axis[0] / d;
		var y = axis[1] / d;
		var z = axis[2] / d;
		var c = Math.cos(radians(angle));
		var s = Math.sin(radians(angle));
		var omc = 1.0 - c;

		var mat =
			[
				[x * x * omc + c, x * y * omc - z * s, x * z * omc + y * s],
				[x * y * omc + z * s, y * y * omc + c, y * z * omc - x * s],
				[x * z * omc - y * s, y * z * omc + x * s, z * z * omc + c]
			];

		for (var i = 0; i < spherePoints.length; i++) {
			var u = [0, 0, 0];
			var v = [0, 0, 0];
			for (var j = 0; j < 3; j++) {
				for (var k = 0; k < 3; k++) {
					u[j] += mat[j][k] * spherePoints[i][k];
					v[j] += mat[j][k] * sphereNormals[i][k];
				};
			}

			for (var j = 0; j < 3; j++) {
				spherePoints[i][j] = u[j];
				sphereNormals[i][j] = v[j];
			};
		};
	}

	function scale(sx, sy, sz) {
		for (var i = 0; i < spherePoints.length; i++) {
			spherePoints[i][0] *= sx;
			spherePoints[i][1] *= sy;
			spherePoints[i][2] *= sz;
			sphereNormals[i][0] /= sx;
			sphereNormals[i][1] /= sy;
			sphereNormals[i][2] /= sz;
		};
	}

	sphereData.Point = spherePoints;
	sphereData.Normal = sphereNormals;
	sphereData.Translate = translate;
	sphereData.Rotate = rotate;
	sphereData.Scale = scale;
	return sphereData;
}

/*-----------------------------------------------------------------------------------*/
// Cylinder
/*-----------------------------------------------------------------------------------*/

function cylinder(numSlices, numStacks, caps) {
	var cylinderPoints = [], cylinderNormals = [], cylinderData = {};

	var slices = 36;
	if (numSlices) slices = numSlices;

	var stacks = 1;
	if (numStacks) stacks = numStacks;

	var capsFlag = true;
	if (caps == false) capsFlag = caps;

	var top = 0.5;
	var bottom = -0.5;
	var radius = 0.5;

	// Primitive (geometric shape) initialization
	for (var j = 0; j < stacks; j++) {
		var stop = bottom + (j + 1) * (top - bottom) / stacks;
		var sbottom = bottom + j * (top - bottom) / stacks;
		var topPoints = [];
		var bottomPoints = [];

		for (var i = 0; i < slices; i++) {
			var theta = 2.0 * i * Math.PI / slices;
			topPoints.push([radius * Math.sin(theta), stop, radius * Math.cos(theta), 1.0]);
			bottomPoints.push([radius * Math.sin(theta), sbottom, radius * Math.cos(theta), 1.0]);
		};

		topPoints.push([0.0, stop, radius, 1.0]);
		bottomPoints.push([0.0, sbottom, radius, 1.0]);

		for (var i = 0; i < slices; i++) {
			var a = topPoints[i];
			var d = topPoints[i + 1];
			var b = bottomPoints[i];
			var c = bottomPoints[i + 1];
			var u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
			var v = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];

			var normal =
				[
					u[1] * v[2] - u[2] * v[1],
					u[2] * v[0] - u[0] * v[2],
					u[0] * v[1] - u[1] * v[0]
				];

			var mag = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2])
			normal = [normal[0] / mag, normal[1] / mag, normal[2] / mag];
			cylinderPoints.push([a[0], a[1], a[2], 1.0]);
			cylinderNormals.push([normal[0], normal[1], normal[2]]);

			cylinderPoints.push([b[0], b[1], b[2], 1.0]);
			cylinderNormals.push([normal[0], normal[1], normal[2]]);

			cylinderPoints.push([c[0], c[1], c[2], 1.0]);
			cylinderNormals.push([normal[0], normal[1], normal[2]]);

			cylinderPoints.push([a[0], a[1], a[2], 1.0]);
			cylinderNormals.push([normal[0], normal[1], normal[2]]);

			cylinderPoints.push([c[0], c[1], c[2], 1.0]);
			cylinderNormals.push([normal[0], normal[1], normal[2]]);

			cylinderPoints.push([d[0], d[1], d[2], 1.0]);
			cylinderNormals.push([normal[0], normal[1], normal[2]]);
		};
	};

	var topPoints = [];
	var bottomPoints = [];
	for (var i = 0; i < slices; i++) {
		var theta = 2.0 * i * Math.PI / slices;
		topPoints.push([radius * Math.sin(theta), top, radius * Math.cos(theta), 1.0]);
		bottomPoints.push([radius * Math.sin(theta), bottom, radius * Math.cos(theta), 1.0]);
	};

	topPoints.push([0.0, top, radius, 1.0]);
	bottomPoints.push([0.0, bottom, radius, 1.0]);

	if (capsFlag) {
		// Top surface
		for (i = 0; i < slices; i++) {
			normal = [0.0, 1.0, 0.0];
			var a = [0.0, top, 0.0, 1.0];
			var b = topPoints[i];
			var c = topPoints[i + 1];

			cylinderPoints.push([a[0], a[1], a[2], 1.0]);
			cylinderNormals.push(normal);

			cylinderPoints.push([b[0], b[1], b[2], 1.0]);
			cylinderNormals.push(normal);

			cylinderPoints.push([c[0], c[1], c[2], 1.0]);
			cylinderNormals.push(normal);
		};

		// Bottom surface
		for (i = 0; i < slices; i++) {
			normal = [0.0, -1.0, 0.0];
			var a = [0.0, bottom, 0.0, 1.0];
			var b = bottomPoints[i];
			var c = bottomPoints[i + 1];

			cylinderPoints.push([a[0], a[1], a[2], 1.0]);
			cylinderNormals.push(normal);

			cylinderPoints.push([b[0], b[1], b[2], 1.0]);
			cylinderNormals.push(normal);

			cylinderPoints.push([c[0], c[1], c[2], 1.0]);
			cylinderNormals.push(normal);
		};
	};

	// Functions for local transformation
	function translate(x, y, z) {
		for (var j = 0; j < cylinderPoints.length; j++) {
			cylinderPoints[j][0] += x;
			cylinderPoints[j][1] += y;
			cylinderPoints[j][2] += z;
		}
	}

	function rotate(angle, axis) {

		var d = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
		var x = axis[0] / d;
		var y = axis[1] / d;
		var z = axis[2] / d;
		var c = Math.cos(radians(angle));
		var s = Math.sin(radians(angle));
		var omc = 1.0 - c;

		var mat =
			[
				[x * x * omc + c, x * y * omc - z * s, x * z * omc + y * s],
				[x * y * omc + z * s, y * y * omc + c, y * z * omc - x * s],
				[x * z * omc - y * s, y * z * omc + x * s, z * z * omc + c]
			];

		for (var i = 0; i < cylinderPoints.length; i++) {
			var u = [0, 0, 0];
			var v = [0, 0, 0];
			for (var j = 0; j < 3; j++) {
				for (var k = 0; k < 3; k++) {
					u[j] += mat[j][k] * cylinderPoints[i][k];
					v[j] += mat[j][k] * cylinderNormals[i][k];
				};
			}

			for (var j = 0; j < 3; j++) {
				cylinderPoints[i][j] = u[j];
				cylinderNormals[i][j] = v[j];
			};
		};
	}

	function scale(sx, sy, sz) {
		for (var i = 0; i < cylinderPoints.length; i++) {
			cylinderPoints[i][0] *= sx;
			cylinderPoints[i][1] *= sy;
			cylinderPoints[i][2] *= sz;
			cylinderNormals[i][0] /= sx;
			cylinderNormals[i][1] /= sy;
			cylinderNormals[i][2] /= sz;
		};
	}

	cylinderData.Point = cylinderPoints;
	cylinderData.Normal = cylinderNormals;
	cylinderData.Translate = translate;
	cylinderData.Rotate = rotate;
	cylinderData.Scale = scale;
	return cylinderData;
}

/*-----------------------------------------------------------------------------------*/
// Cube
/*-----------------------------------------------------------------------------------*/

function cube() {
	var cubePoints = [], cubeNormals = [], cubeData = {};

	var cubeVertices =
		[
			[-0.5, -0.5, 0.5, 1.0],
			[-0.5, 0.5, 0.5, 1.0],
			[0.5, 0.5, 0.5, 1.0],
			[0.5, -0.5, 0.5, 1.0],
			[-0.5, -0.5, -0.5, 1.0],
			[-0.5, 0.5, -0.5, 1.0],
			[0.5, 0.5, -0.5, 1.0],
			[0.5, -0.5, -0.5, 1.0]
		];

	var cubeFaceNormals =
		[
			[0, 0, 1],
			[1, 0, 0],
			[0, -1, 0],
			[0, 1, 0],
			[0, 0, -1],
			[-1, 0, 0]
		];

	var cubeQuadElements =
		[
			1, 0, 3, 3, 2, 1,
			2, 3, 7, 7, 6, 2,
			3, 0, 4, 4, 7, 3,
			6, 5, 1, 1, 2, 6,
			4, 5, 6, 6, 7, 4,
			5, 4, 0, 0, 1, 5
		];

	var cubeNormalElements =
		[
			0, 0, 0, 0, 0, 0,
			1, 1, 1, 1, 1, 1,
			2, 2, 2, 2, 2, 2,
			3, 3, 3, 3, 3, 3,
			4, 4, 4, 4, 4, 4,
			5, 5, 5, 5, 5, 5
		];

	// Primitive (geometric shape) initialization
	for (var i = 0; i < cubeQuadElements.length; i++) {
		cubePoints.push(cubeVertices[cubeQuadElements[i]]);
		cubeNormals.push(cubeFaceNormals[cubeNormalElements[i]]);
	}

	// Functions for local transformation
	function translate(x, y, z) {
		for (var j = 0; j < cubeVertices.length; j++) {
			cubeVertices[j][0] += x;
			cubeVertices[j][1] += y;
			cubeVertices[j][2] += z;
		}
	}

	function rotate(angle, axis) {
		var d = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
		var x = axis[0] / d;
		var y = axis[1] / d;
		var z = axis[2] / d;
		var c = Math.cos(radians(angle));
		var s = Math.sin(radians(angle));
		var omc = 1.0 - c;

		var mat =
			[
				[x * x * omc + c, x * y * omc - z * s, x * z * omc + y * s],
				[x * y * omc + z * s, y * y * omc + c, y * z * omc - x * s],
				[x * z * omc - y * s, y * z * omc + x * s, z * z * omc + c]
			];

		for (var i = 0; i < cubeVertices.length; i++) {
			var t = [0, 0, 0];
			for (var j = 0; j < 3; j++) {
				for (var k = 0; k < 3; k++) {
					t[j] += mat[j][k] * cubeVertices[i][k];
				}
			}

			for (var m = 0; m < 3; m++) {
				cubeVertices[i][m] = t[m];
			}
		}
	}

	function scale(sx, sy, sz) {
		for (i = 0; i < cubeVertices.length; i++) {
			cubeVertices[i][0] *= sx;
			cubeVertices[i][1] *= sy;
			cubeVertices[i][2] *= sz;
		};

		for (i = 0; i < cubeFaceNormals.length; i++) {
			cubeFaceNormals[i][0] /= sx;
			cubeFaceNormals[i][1] /= sy;
			cubeFaceNormals[i][2] /= sz;
		};
	}

	cubeData.Point = cubePoints;
	cubeData.Normal = cubeNormals;
	cubeData.Translate = translate;
	cubeData.Rotate = rotate;
	cubeData.Scale = scale;
	return cubeData;
}
/*-----------------------------------------------------------------------------------*/
// Robot (Updated)
/*-----------------------------------------------------------------------------------*/

function robot() {
	var robotPoints = [], robotNormals = [], robotData = {};

	// Helper function to append part data
	function appendPart(partPoints, partNormals) {
		robotPoints = robotPoints.concat(partPoints);
		robotNormals = robotNormals.concat(partNormals);
	}

	// Define torso
	function torso() {
		var torso = cube();
		torso.Scale(1.0, 2.5, 1.0); // Scale to desired dimensions
		torso.Translate(0.0, 0.0, 0.0); // Center position
		appendPart(torso.Point, torso.Normal);
	}

	// Define head
	function head() {
		var head = cube();
		head.Scale(0.5, 0.5, 0.5); // Scale to desired dimensions
		head.Translate(0.0, 1.5, 0.0); // Place on top of the torso
		appendPart(head.Point, head.Normal);
	}

	// Define left arm
	function leftArm() {
		var leftArm = cube();
		leftArm.Scale(0.3, 1.5, 0.3);
		leftArm.Translate(-0.8, 0.5, 0.0);
		appendPart(leftArm.Point, leftArm.Normal);
	}

	// Define right arm
	function rightArm() {
		var rightArm = cube();
		rightArm.Scale(0.3, 1.5, 0.3);
		rightArm.Translate(0.8, 0.5, 0.0);
		appendPart(rightArm.Point, rightArm.Normal);
	}

	// Define left leg
	function leftLeg() {
		var leftLeg = cube();
		leftLeg.Scale(0.3, 1.5, 0.3); // Scale to desired dimensions
		leftLeg.Translate(-0.4, -2.0, 0.0);
		appendPart(leftLeg.Point, leftLeg.Normal);
	}

	// Define right leg
	function rightLeg() {
		var rightLeg = cube();
		rightLeg.Scale(0.3, 1.5, 0.3);
		rightLeg.Translate(0.4, -2.0, 0.0);
		appendPart(rightLeg.Point, rightLeg.Normal);
	}

	// Construct robot by calling individual parts
	torso();
	head();
	leftArm();
	rightArm();
	leftLeg();
	rightLeg();

	// Finalize robot data
	robotData.Point = robotPoints;
	robotData.Normal = robotNormals;
	return robotData;
}

/*-----------------------------------------------------------------------------------*/
// Simple Color Cube
/*-----------------------------------------------------------------------------------*/

function colorCube() {
	var points = [], colors = [], data = {};

	var vertices =
		[
			[-0.5, -0.5, 0.5, 1.0],
			[-0.5, 0.5, 0.5, 1.0],
			[0.5, 0.5, 0.5, 1.0],
			[0.5, -0.5, 0.5, 1.0],
			[-0.5, -0.5, -0.5, 1.0],
			[-0.5, 0.5, -0.5, 1.0],
			[0.5, 0.5, -0.5, 1.0],
			[0.5, -0.5, -0.5, 1.0]
		];

	var vertexColors = [
		vec4(0.0, 0.0, 0.0, 1.0),  // black
		vec4(1.0, 0.0, 0.0, 1.0),  // red
		vec4(1.0, 1.0, 0.0, 1.0),  // yellow
		vec4(0.0, 1.0, 0.0, 1.0),  // green
		vec4(0.0, 0.0, 1.0, 1.0),  // blue
		vec4(1.0, 0.0, 1.0, 1.0),  // magenta
		vec4(1.0, 1.0, 1.0, 1.0),  // white
		vec4(0.0, 1.0, 1.0, 1.0)   // cyan
	];

	function quad(a, b, c, d) {
		colors.push(vertexColors[a]);
		points.push(vertices[a]);
		colors.push(vertexColors[a]);
		points.push(vertices[b]);
		colors.push(vertexColors[a]);
		points.push(vertices[c]);
		colors.push(vertexColors[a]);
		points.push(vertices[a]);
		colors.push(vertexColors[a]);
		points.push(vertices[c]);
		colors.push(vertexColors[a]);
		points.push(vertices[d]);
	}

	// Primitive (geometric shape) initialization
	quad(1, 0, 3, 2);
	quad(2, 3, 7, 6);
	quad(3, 0, 4, 7);
	quad(6, 5, 1, 2);
	quad(4, 5, 6, 7);
	quad(5, 4, 0, 1);

	data.Point = points;
	data.Color = colors;
	return data;
}

/*-----------------------------------------------------------------------------------*/

