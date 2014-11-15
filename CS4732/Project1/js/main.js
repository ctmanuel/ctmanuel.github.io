/* Module      : Folling a spline curve
 * Author      : Christian Manuel
 * Email       : ctmanuel@wpi.edu
 * Course      : CS 4732
 *
 * Description : This is the code for project 1.
 *
 * Date        : 2014/11/12
 *
 * History:
 * Revision      Date          Changed By
 * --------      ----------    ----------
 * 01.00         2014/11/12    ctmanuel
*/


/*INCLUDE FILES*/
/* three.min.js: The WebGL library 
 * OribtControl.js: Mouse Control:
 					left click and drag the mouse to rotate the camera.
 					middle click and drag the mouse to zoom in and out.
 					right click and drag the mouse to pan the camera
*/


/*GLOBAL VARIABLES*/
/* scene, camera, controls, renderer: needed by three.js in order to draw the canvas and render the scene

 * ctx: html canvas variable used to control text being displayed on the webpage 

 * numberOfSplines: the number of splines from the text file

 * numberOfControlPoints: array used to store the number of control points for each spline in the text file

 * transitionTime: array used to store the time it takes the objects interpolate the points

 * positions: array of array of Vector3 positions used to store spline locations in the text file

 * rotations: array of array of Vector3 rotations used to store spline rotations in the text file

 * timer: used to track frames passed

 * currentSpline: used to iterate through multiple splines

 * currentCP: used to iterate thrpough control points 

 * catmullromPoints: array of interpolation vector3 positions used for the catmull rom interpolation

 * bsplinePoints: array of interpolation vector3 positions used for the uniform bspline interpolation

 * slerpRotations: array of interpolation vector3 rotations used for the spherical linear interpolation
*/

var scene, camera, controls, renderer, cube, ctx;

var timer = 0;
var currentSpline = 0;
var currentCP = 0;

var numberOfSplines;
var numberOfControlPoints = [];
var transitionTime = [];
var positions = [[]];
var rotations = [[]];

var catmullromPoints = [];
var bsplinePoints = [];
var slerpRotations = [];

/**
 * Called when the program starts. 
 * This funciton calls the parseFile and starts the animation
 * @constructor
 * @param {void} 
 * @return {void} 
 */
window.onload = function()
{
	parseFile();
};

/**
 * Called when the program starts. 
 * This funciton calls the parseFile and starts the animation.
 * All the values are stored in variables and used when the 
 * scene is drawn.
 * @constructor
 * @param {void} 
 * @return {void} 
 */
function parseFile()
{
	// get the spline file
	var request = new XMLHttpRequest();
	request.open("GET", "http://users.wpi.edu/~ctmanuel/CS4732/Project1/spline1.txt", true);
	request.send();

	//when the file is loaded, us this callback function
	request.onload = function(e)
	{
		//file text stored in an array after each new line character
		var file = request.responseText.split("\n");
		
		var splitFileItems = [];
		var currentLocation = 0;
		var positionsLeft = [[]];
		var rotationsLeft = [[]];
		
		//for all lines starting with # or an empty character, delete that line
		file.forEach
		(
			function(item)
			{
				if(item.charAt(0) != "#" && item.charAt(0) != "")
				{
					splitFileItems.push(item);
				}
			}
		);

		numberOfSplines = parseInt(splitFileItems[currentLocation]); //number of splines 
		currentLocation += 1;
		//parse the splines for control points, times, and positions
		for(var i = 0; i < numberOfSplines; i += 1)
		{		
			numberOfControlPoints[i] = parseInt(splitFileItems[currentLocation]); //number of control points for the current spline
			currentLocation += 1;
			
			transitionTime[i] = parseInt(splitFileItems[currentLocation]); //transition time for the current spline
			currentLocation += 1;
			/*store an unparsed version of both the denoted position and rotation vectors*/
			for(var j = 0; j < numberOfControlPoints[i]; j += 1)
			{
				positionsLeft[i][j] = splitFileItems[currentLocation];
				currentLocation += 1;
				rotationsLeft[i][j] = splitFileItems[currentLocation];
				currentLocation += 1;
			}
		}
		
		for(var i = 0; i < positionsLeft.length; i += 1)
		{
			for(var j = 0; j < positionsLeft[i].length; j += 1)
			{
				var tempPos = positionsLeft[i][j].split(","); //positions split with delimiter ","
				var tempRot = rotationsLeft[i][j].split(","); //rotations split with delimiter ","
				
				positions[i][j] = new THREE.Vector3(
						parseFloat(tempPos[0]),
						parseFloat(tempPos[1]),
						parseFloat(tempPos[2]));
				rotations[i][j] = new THREE.Vector3(
						parseFloat(tempRot[0]),
						parseFloat(tempRot[1]),
						parseFloat(tempRot[2]));
			}
		}
		
		initializeScene(); 		//initialize the scene
		render(); 		//render the scene
	};
};

/**
 * Called by the parseFile function. This function initalises
 * the cube, control points, camera, and renderer 
 * 
 * @constructor
 * @param {void} 
 * @return {void} 
 */
function initializeScene()
{
	scene = new THREE.Scene();

	initializeCube();
	initializeControlPoints();
	initializeCamera();
	initializeRenderer();
	
	document.body.appendChild(renderer.domElement);
	controls = new THREE.OrbitControls(camera);
	window.addEventListener('resize', onWindowResize, false);
	
	// Gets canvas from the HTML page and set text font
	var canvas = document.getElementById('myCanvas');
  	ctx = canvas.getContext("2d");
  	ctx.font="30px Verdana";	
};

/**
 * Initalize the cube object. Creates the cube then adds
 * it to the scene
 * 
 * @constructor 
 * @param {none} 
 * @return {none} 
 */
function initializeCube()
{
	cube = new THREE.Mesh(new THREE.CubeGeometry(3, 3, 3), new THREE.MeshNormalMaterial());
	cube.position = positions[0][0];
	scene.add(cube);
};

/**
 * Set up the control points from the spline txt file
 * 
 * @constructor
 * @param {void} 
 * @return {void} 
 */
function initializeControlPoints()
{
	for(var i = 0; i < positions.length; i += 1)
	{
		
		for(var j = 0; j < positions[i].length; j += 1) //individual spline points
		{
			var controlPoint = new THREE.Mesh(new THREE.SphereGeometry(0.5, 50, 50), new THREE.MeshNormalMaterial());
			controlPoint.position = positions[i][j];
			controlPoint.rotation = rotations[i][j];
			scene.add(controlPoint);
		}
	}

	createSplines();		//initialize catmullrom points
	calculateSlerp();			//initialize slerp rotation points
};

/**
 * Initalize the scene camera
 * 
 * @constructor
 * @param {void} 
 * @return {void} 
 */
function initializeCamera()
{
	camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.01, 100000);

	camera.position.set(5, 5, 15);
	camera.aspect = 2;
	camera.lookAt(scene.position);
};
/**
 * Initalize the renderer
 * 
 * @constructor
 * @param {void} 
 * @return {void} 
 */
function initializeRenderer()
{
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
};

/**
 * Draw the scene once every frame
 * 
 * @constructor
 * @param {void} 
 * @return {void} 
 */
function render()
{
	requestAnimationFrame(render);
	animate();
	renderer.render(scene, camera);
};

/**
 * Resizes the window if it is changed
 * 
 * @constructor
 * @param {void}
 * @return{void} 
 */
function onWindowResize()
{
	camera.aspect = window.innerWidth/window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth,window.innerHeight);
	render();
};

/**
 * Animates the scene, updating the animation once per frame
 * 
 * @constructor
 * @param {void} 
 * @return {void} 
 */
function animate()
{
	var catmullTime = transitionTime[currentSpline] * 60;
	var bsplineTime = transitionTime[currentSpline] * 120;
	var rotationTime = transitionTime[currentSpline] * 180;
	
	if(timer < catmullTime) //
	{
		cube.position = catmullromPoints[timer];				//change location based on catmullromPoints
		
		ctx.clearRect(0,0,900,100)
		ctx.fillText("CatMull Rom interpolation", 300, 50);
	}
	
	else if(timer >= catmullTime && timer < bsplineTime)
	{
		cube.position = bsplinePoints[timer - catmullTime];		//change position based on bspline
		
		ctx.clearRect(0,0,900,100)
		ctx.fillText("bSpline interpolation", 300, 50);
	}
		
	else if(timer >= bsplineTime && timer < rotationTime)	//perform slerp rotations on the cube
	{
		cube.rotation = slerpRotations[timer - bsplineTime];	//change rotation based on slerp
		cube.position = catmullromPoints[timer - bsplineTime];	//change location based on catmullrom 

		if(slerpRotations[timer - bsplineTime] == slerpRotations[slerpRotations.length - 1])
		{
			timer = 0;
		}

		ctx.clearRect(0,0,900,100)
		ctx.fillText("Slerp Rotation following CatMull Rom", 200, 50);
		
	}
	else
	{
		timer = 0;
	}
	
	timer += 1;  
};

/**
 * Accounts for negative values in positions and rotations
 * 
 * @constructor
 * @param {float}  n  - first value
 * @param {float}  m  - second value
 * @return {float} t  -	 now positive value
 */
function negate(n, m)							
{
	var t = ((m % n) + n) % n;
	return t;
};

/**
 * Calculate the catmull rom position for a specific axis
 * 
 * @constructor
 * @param {float}	p0 - first point 
 * @param {float}	p1 - second point
 * @param {float}	p2 - third point
 * @param {float}	p3 - fourth point
 * @return {float} 	x  - new x/y/z position value 
 */
function calculateCatMullRom(p0, p1, p2, p3, k)
{
	var x = (2.0 * p1) + (-p0 + p2) * k;
	x += ((2.0 * p0) - (5.0 * p1) + (4 * p2) - p3) * Math.pow(k, 2);
	x += (-p0 + (3.0 * p1) - (3.0 * p2) + p3) * Math.pow(k, 3);
	x *= 0.5;
	return x;
};

/**
 * Calculate the bspline position for a specific axis
 * 
 * @constructor
 * @param {float}	p0 - first point 
 * @param {float}	p1 - second point
 * @param {float}	p2 - third point
 * @param {float}	p3 - fourth point
 * @return {float} 	x  - new x/y/z position value 
 */
function calculatebSpline(p0, p1, p2, p3, k)
{
	//set the time related variables that are used frequently
	var time2 = k * k;
	var time3 = time2 * k;

	var x = (
	((1/6 * Math.pow((1 - k),3)) * p0) +
	(((1/2 * time3) - time2 + (2/3)) * p1) +
	(((-1/2 * time3) + (1/2 * time2) + (1/2 * k) + 1/6) * p2) +
	((1/6 * time3) * p3));
	return x;
};

/**
 * Converts the given euler vector to a quaternion vector
 * 
 * @constructor
 * @param {Vector3}	vector - The vector3 euler. 
 * @return{Vector4} quat - The equivalent vector4 quaternion
 */
function eulerToQuaternion(vector)
{
	var rotX = ((Math.PI * vector.x) / 180) / 2;
	var rotY = ((Math.PI * vector.y) / 180) / 2;
	var rotZ = ((Math.PI * vector.z) / 180) / 2;
	var quat = new THREE.Vector4();
	
	var w = Math.cos(rotX) * Math.cos(rotY) * Math.cos(rotZ) - Math.sin(rotX) * Math.sin(rotY) * Math.sin(rotZ);
	var x = Math.sin(rotX) * Math.cos(rotY) * Math.cos(rotZ) + Math.cos(rotX) * Math.sin(rotY) * Math.sin(rotZ);
	var y = Math.cos(rotX) * Math.sin(rotY) * Math.cos(rotZ) - Math.sin(rotX) * Math.cos(rotY) * Math.sin(rotZ);
	var z = Math.cos(rotX) * Math.cos(rotY) * Math.sin(rotZ) + Math.sin(rotX) * Math.sin(rotY) * Math.cos(rotZ);

	quat.set(x, y, z, w);
	return quat;
};

/**
 * Converts the given quaternion vector to a euler vector
 * 
 * @constructor
 * @param {Vector3}	quaternion - The vector3 euler. 
 * @return{Vector4} vector - The equivalent vectore vector
 */
function quaternionToEuler(quaternion)
{
	var wW = quaternion.w * quaternion.w;
	var xX = quaternion.x * quaternion.x;
	var yY = quaternion.y * quaternion.y;
	var zZ = quaternion.z * quaternion.z;

	var vector = new THREE.Vector3();

	vector.x = Math.atan(2 * (quaternion.x * quaternion.w - quaternion.y * quaternion.z), (wW - xX - yY + zZ));
	vector.y = Math.asin(2 * (quaternion.x * quaternion.z + quaternion.y * quaternion.w) , -1, 1);
	vector.z = Math.atan(2 * (quaternion.x * quaternion.y + quaternion.z * quaternion.w) , (wW + xX - yY - zZ));
	return vector;
};

/**
 * Creates spline interpolation points of a 
 * catmull rom interpolation for 10 seconds
 * 
 * @constructor
 * @param {void} 
 * @return {void} 
 */
function createSplines()
{
	for(var i = 0; i < positions.length; i += 1)			//go through each position
	{		
		for(var j = 0; j < positions[i].length; j += 1)	//go through control points
		{
			for(var k = 0; k < 1 ; k += 1/(transitionTime[i] * 10))	//go through number of times based on transition of time of current spline
			{
				var P0 = positions[i][negate(positions[i].length, j - 1)];
				var P1 = positions[i][j];
				var P2 = positions[i][negate(positions[i].length, j + 1)];
				var P3 = positions[i][negate(positions[i].length, j + 2)];

				//calculate x, y, and z catmull Rom values for the new object position
				var xCMR = calculateCatMullRom(P0.x,P1.x,P2.x,P3.x,k);
				var yCMR = calculateCatMullRom(P0.y,P1.y,P2.y,P3.y,k);
				var zCMR = calculateCatMullRom(P0.z,P1.z,P2.z,P3.z,k);

				//calculate x, y, and z bspline values for the new object position
				var xBS = calculatebSpline(P0.x,P1.x,P2.x,P3.x,k);
				var yBS = calculatebSpline(P0.y,P1.y,P2.y,P3.y,k);
				var zBS = calculatebSpline(P0.z,P1.z,P2.z,P3.z,k);

				//create a new vector3 to hold the position for the object to interpolate to
				var newCMRPos = new THREE.Vector3(xCMR,yCMR,zCMR);
				var newBSPos = new THREE.Vector3(xBS, yBS, zBS);

				//add the position to all global arrays holding the spline points
				catmullromPoints.push(newCMRPos);
				bsplinePoints.push(newBSPos);
			}
		}
	}
};

/**
 * Creates rotations for a spherical linear interpolation over the given splines
 * 
 * @constructor
 * @param {void} 
 * @return {void} 
 */
function calculateSlerp()
{
	for(var i = 0; i < rotations.length; i += 1)
	{
		for(var j = 0; j < rotations[i].length; j += 1)
		{
			for(var k = 0; k < 1 ; k += 1/(transitionTime[i] * 10))
			{
					
				var newQuaternion = new THREE.Vector4();			//used for speherical interpolation

				//euler rotations
				var rot0 = rotations[i][j];
				var rot1 = rotations[i][negate(rotations[i].length, j + 1)];
				
				//go from eulers to quaternions
				rot0 = eulerToQuaternion(rot0);
				rot1 = eulerToQuaternion(rot1);

				//calculate angle between quaternions. 
				var cosineHalfTheta = (rot0.w * rot1.w) + (rot0.x * rot1.x) + (rot0.y * rot1.y) + (rot0.z * rot1.z);
				
				if(Math.abs(cosineHalfTheta) >= 1.0)
				{
					newQuaternion.w = rot0.w;
					newQuaternion.x = rot0.x;
					newQuaternion.y = rot0.y;
					newQuaternion.z = rot0.z;
					slerpRotations.push(quaternionToEuler(newQuaternion));
					break;
				}

				//values used in comparisons
				var halfTheta = Math.acos(cosineHalfTheta);
				var sinHalfTheta = Math.sqrt(1.0 - (cosineHalfTheta * cosineHalfTheta));

				//if the angle is equal to  180 degrees then the result is not defined
				if(Math.abs(sinHalfTheta) < 0.001)
				{
					newQuaternion.w = (rot0.w * 0.5) + (rot1.w * 0.5);
					newQuaternion.x = (rot0.x * 0.5) + (rot1.x * 0.5);
					newQuaternion.y = (rot0.y * 0.5) + (rot1.y * 0.5);
					newQuaternion.z = (rot0.z * 0.5) + (rot1.z * 0.5);
					slerpRotations.push(quaternionToEuler(newQuaternion));
					break;
				}

				//conversion to euler angles 
				var ratioA = Math.sin((1 - k) * halfTheta) / sinHalfTheta;
				var ratioB = Math.sin(k * halfTheta) / sinHalfTheta;
				newQuaternion.w = (rot0.w * ratioA) + (rot1.w * ratioB);
				newQuaternion.x = (rot0.x * ratioA) + (rot1.x * ratioB);
				newQuaternion.y = (rot0.y * ratioA) + (rot1.y * ratioB);
				newQuaternion.z = (rot0.z * ratioA) + (rot1.z * ratioB);
				slerpRotations.push(quaternionToEuler(newQuaternion));
			}
		}
	}
};

