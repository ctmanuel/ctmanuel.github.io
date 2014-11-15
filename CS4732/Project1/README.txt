YOUTUBE LINK:
https://www.youtube.com/watch?v=A8qF61SEjo8&list=UUg_4NcvmCymSGSl_AkuyOHg

EXECUTING THE PROGRAM:---------------------------------------------------------------------------------------
This program runs on any browser with WebGL installed. This program has been proven to work with 
Google Chrome. To run the program, open the html page, Project1, or go to the URL:

http://users.wpi.edu/~ctmanuel/CS4732/Project1/Project1.html

The code for the program can be found there as well.

ABOUT THE PROGRAM:-------------------------------------------------------------------------------------------
This program is used to demonstrate a Cube object interpolating through a Catmull Rom spline, a b-Spline, and slerping through rotations using Euler angles. When the webpage loads, the cube will begin to go through the Catmull Rom 
interpolation. The 4 small spheres that make a square are the boundaries, or outline, of the cube's path. After about 10 seconds, the cube will be back at its original point, then begin to interpolate through a b-spline curve. This will
also take about 10 seconds. When the cube is back in its original position, it will change its orientation between different Euler angles using spherical linear interpolation (slerp). In the top left corner of the screen is a section for
text showing which spline the cube is currently going through. The program also utilizes OrbitControl.js, which allows mouse control of the camera. Using left click and draging the mouse to rotates the camera. Using middle click and drag
ging the mouse to zoom in and out. Right clicking and dragging the mouse to pan the camera.

HOW IT WORKS:------------------------------------------------------------------------------------------------
The program starts off by reading in the spline information from the spline.txt file. From this file it stores the number of splines in the file, the number of control points for that spline, the number of seconds to move from start to 
finish, the x,y, and z positions for the points, and the x, y, and z euler rotation angles for each control point. This process is repeated for each spline. 

After this information is read in and stored, the program initializes the camera, renderer, the cube object, the control points, and the text canvas. Then all of this is drawn to the screen. The render() function is called once per frame,
which in turn calls the animation function. The animation function is the function that updates the cubes position based on the current spline information. The animation function will call the catmull Rom, bspline, and slerp functions 
based on the timer that is keeping track of how many frames have passed. The formula used to caluclate the animation time is (transisiontime * 60n), where n is the animation number and transitiontime is the time read in from the 
spline.txt file. 

This is the formula used to calculate the catmull Rom spline:

	var x = (2.0 * p1) + (-p0 + p2) * k;
	x += ((2.0 * p0) - (5.0 * p1) + (4 * p2) - p3) * Math.pow(k, 2);
	x += (-p0 + (3.0 * p1) - (3.0 * p2) + p3) * Math.pow(k, 3);
	x *= 0.5;

where p0-p3 are the 4 different spline positions and k is the current position in the array. 

This is the formula used to calculate the bspline curve:

	var time2 = k * k;
	var time3 = time2 * k;

	var x = (
	((1/6 * Math.pow((1 - k),3)) * p0) +
	(((1/2 * time3) - time2 + (2/3)) * p1) +
	(((-1/2 * time3) + (1/2 * time2) + (1/2 * k) + 1/6) * p2) +
	((1/6 * time3) * p3));

where p0-p3 are the 4 different spline positions and k is the current position in the array and time2 and time 3 are time related variables. 

To calculate the slerp rotation, the euler rotations are read in first. Those are then converted to quaternion angles using these formulas:

	var rotX = ((Math.PI * vector.x) / 180) / 2;
	var rotY = ((Math.PI * vector.y) / 180) / 2;
	var rotZ = ((Math.PI * vector.z) / 180) / 2;
	var quat = new THREE.Vector4();
	
	var w = Math.cos(rotX) * Math.cos(rotY) * Math.cos(rotZ) - Math.sin(rotX) * Math.sin(rotY) * Math.sin(rotZ);
	var x = Math.sin(rotX) * Math.cos(rotY) * Math.cos(rotZ) + Math.cos(rotX) * Math.sin(rotY) * Math.sin(rotZ);
	var y = Math.cos(rotX) * Math.sin(rotY) * Math.cos(rotZ) - Math.sin(rotX) * Math.cos(rotY) * Math.sin(rotZ);
	var z = Math.cos(rotX) * Math.cos(rotY) * Math.sin(rotZ) + Math.sin(rotX) * Math.sin(rotY) * Math.cos(rotZ);

	quat.set(x, y, z, w);

where vector is the current euler angle. Once the quaternions have been caluclated, the angle between the them is calculated. If the angle is equal to  180 degrees then the result is not defined, and it rotates around any axis 
normal to the first or second euler angle. The values are then converted back to euler angles and applied to the cube. 

