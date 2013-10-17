/**
* This file contains code of JavaScript Graphics Library (JSGWebGL).
* JSGWebGL is free for non commercial propose.
* Author: Gilzamir Ferreira Gomes (Todos os direitos reservados)
* Date: jun/05/2013
*/

/* @namespace API namespace */
var jsggl = jsggl || {};

/*                        
* jsggl.JsgGl object manages web based graphical applications.
*
* @class JSG Application Context
* @param {string} id identify of the canvas of the application.
*/
jsggl.JsgGl = function(id){
	//BEGIN:configure canvas and context...	
	this.canvas = document.getElementById(id); //canvas target
	if (!this.canvas){
		return undefined;
	}
	var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
	var ctx = null;
	for (var i = 0; i < names.length; ++i) {
		try {
			ctx = this.canvas.getContext(names[i]);
		} 
		catch(e) {
			if (ctx) {
				break;
			}
		}
		if (ctx) break;
	}

	this.gl = ctx; //WebGL context

	if (!this.gl) {
		return undefined;
	}
	//END:configure canvas and context
	
	//BEGIN: state attributes
	this.id = id; //application and canvas identification
	this.materials = {}; //current materials
	this.materials["Material"] =  { "name":"floor", "ambient":[0.000000, 0.000000, 0.000000, 1.0], "diffuse":[0.0, 0.0, 0.0, 1.0], "specular":[0.0, 0.0, 0.0, 1.0], "shininess":0, "transparence":1, "opticalDensity":0, "shaderType":-1};
	this.scenes = new jsgcol.ArrayMap(); //scenes array
	this.activeScene = null; //current scene
	this.currentScene = null; //current scene
	this.ambientLight = [1.0, 1.0, 1.0, 1.0]; //ambient light
	this.ambientColor = [0.0,0.0,0.0, 1.0]; //ambient color
	this.materialColor = [0.001,0.001 ,0.001,1.0]; //material color
	this.specularColor = [0.001, 0.001, 0.001, 1.0]; //specular color.
	this.shininess = 100.0; //shininess
	this.positionalLightQtd = 0; //Quantity of positional light
	this.directionalLightQtd = 0; //Quantity of directional light
	this.pLightColor = [0,0,0,0]; //positional diffuse ligth color
	this.dLightColor = [0, 0, 0, 0]; //directional diffuse ligth color
	this.specularLight = [0, 0, 0, 0]; //specular light color
	this.lightPosition = [0,0,0]; //ligth position
	this.lightDirection = [0, 0, 0]; //ligth direction
	this.lightPositionDirection = [0, 0, 0]; //direction of positional light
	this.updateLightPosition = true; //flag to active update of the light position.
	this.diffuseCutOff = 0.1; //diffuse cutoff flag
	this.useTexture = false; //texture enable/disable flag
	this.lightMatrix = mat4.identity(mat4.create()); //ligth transformation matrix
	this.currentVertexPosition = null; //current vertex position
	this.currentVertexNormal = null; //current vertex normal
	this.currentTexPosition = null; //current texture position
    	this.shaderType = 1; //shader type: gouroud (with shadows on or shadows off), phong (with shadows on or shadows off) and flat.
	this.shader = null; //current shader
	this.modelView = mat4.identity(mat4.create()); //modelview matrix
	this.projection = mat4.identity(mat4.create()); //projection matrix
	this.modelViewStack = [this.modelView]; //stack of modelview matrix
	this.shadowEnabled = true; //shadow enable/disable flag
	this.currentTexture = 0; //current texture
	this.depthSampler = [-1, -1, -1]; //depth sampler
	//BEGIN: state attributes

	//BEGIN: WEBGL CONTEXT SHORTCUTS 
	this.COLOR_BUFFER_BIT = this.gl.COLOR_BUFFER_BIT; //color buffer flag
	this.DEPTH_BUFFER_BIT = this.gl.DEPTH_BUFFER_BIT; //depth buffer flag
	this.LINE_LOOP = this.gl.LINE_LOOP; //rendering mode flag
	this.TRIANGLE_FAN = this.gl.TRIANGLE_FAN; //rendering mode flag
	this.LINE_STRIP = this.gl.LINE_STRIP; //rendering mode flag
	this.LINES = this.gl.LINES; //rendering mode flag
	this.TRIANGLE_STRIP = this.gl.TRIANGLE_STRIP; //rendering mode flag
	this.TRIANGLES = this.gl.TRIANGLES; //rendering mode flag
	this.POINTS = this.gl.POINTS; //rendering mode flag
	this.STATIC_DRAW = this.gl.STATIC_DRAW; //rendering mode flag
	this.DYNAMIC_DRAW = this.gl.DYNAMIC_DRAW; //rendering mode flag
	//END: WEBGL CONTEXT SHORTCUTS
	this.beforeDraw = function(){}; //callback function
	this.afterDraw = function(){}; //callback function
	//BEGIN: animation configuration
	this.initialize = this.initialize || function(){}; //initialize function
	this.display = this.display || function(){}; //display function
	this.finalize = this.finalize || function(){}; //finalize function
	this.stopped = false; // stop/start flag
	this.animationRate = 30; //animation rate

	window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;
	
	this.mainLoop = function(){ jsggl.start(this); }; //method to start application

	//END: animation configuration
}

/*
* Initialize a non-initialized graphical application.
* @param {jsggl.JsgGl} app to initialize.
*/
jsggl.start = function(app) {
	if (!app.started) {
		app.onFrame = function() {
			var time = +new Date();
			var elapsedTime = time - app.frameTime;
			if (elapsedTime < app.animationRate) return; 
			var steps = Math.floor( elapsedTime / app.animationRate );			
			if (steps > 120) {
				steps = 120;
			}
			while (!app.stopped && steps > 0){
				app.display();
				steps -= 1;
			}
			app.frameTime = +new Date();
		}

		app.mainLoop = function(time) {
			if (!app.stopped) {
				if (!app.started) {
					app.frameTime = +new Date();
					app.started = true;
					app.initialize();
				}
				app.onFrame();
				window.requestAnimationFrame(app.mainLoop);
			} else {
				app.finalize();
			}
		}; 

		app.mainLoop();
 	}
}

/* jsggl.JsgGl class definition */
jsggl.JsgGl.prototype = {

	/* 
	* Defines active scene of the application.
	* @param {string} name name of the scene to activate.
	*/
	setActiveScene: function(name) {
		this.currentScene = this.scenes.get(name);
		this.activeScene = name;
	},

	/*
	* Add new scene to JSG application.
	* @param {jsggl.Scene} scene Scene object.
	*/
	addScene: function(scene) {
		this.scenes.put(scene.name, scene);
	},


	/*
	* Removes scenes of a JSG application.
	* @param {string} scene Scene name.
	*/
	removeScene: function(scene) {
		if (this.scenes.hasKey(scene) && scene != this.activeScene){
			this.scenes.remove(scene);
			return true;
		}
		return false;
	},

	/*
	* Returns current modelview matrix.
	* @returns {mat4} modelview matrix.
	*/
	getModelView: function() {
		return this.modelView;
	},	

	
	/* 
	* Returns current projection matrix.
	* @returns {mat4} projection matrix. 
	*/
	getProjection: function() {
		return this.projection;
	},

	/*
	* Load new identity matrix to projection matrix.
	*/
	resetProjection: function() {
		this.projection = mat4.identity(mat4.create());
	},

	/*
	* Stores current modelview matrix on top of modelview stack.
	*/
	pushModelView: function(){
		this.modelView = mat4.clone(this.modelView);
		this.modelViewStack.push(this.modelView);
	},


	/*
	* Removes current modelview matrix on top of modelview statck
	*/
	popModelView: function(){
		this.modelViewStack.pop();
		this.modelView = this.modelViewStack[this.modelViewStack.length - 1];
	},


	/*
	* Enable depth test
	*/
	enableDepthTest: function() {
		this.gl.enable(this.gl.DEPTH_TEST);
	},

	/*
	* Defines application background.
	* @param {number} R red intensity of the background color.
	* @param {number} G green intensity of the background color.
	* @param {number} B blue intensity of the background color.
	* @param {number} A alpha intensity of the background color.
	*/
	clearColor: function(R, G, B, A) {
		this.gl.clearColor(R, G, B, A);	
	},
	
	/*
	* Defines depth function.
	* @param {number} CODE code of the function.
	*/
	depthFunc:function(CODE){
		this.gl.depthFunc(CODE);
	},	   

	/*
	* Clear depth buffer.
	* @param {number} v maximum depth.
	*/
	clearDepth: function(v) {
		this.gl.clearDepth(v);
	},

	/*
	* Clear buffers.
	* @param {number} mask
	*/
	clear: function(mask) {
		this.gl.clear(mask);
	},


	/*
	* Defines viewport position and dimensions.
	* @param {number} x x coordinate
	* @param {number} y y coordinate
	* @param {number} c_width width of the viewport
	* @param {number} c_height height of the viewport
	*/
	viewport: function(x, y, c_width, c_height) {
		this.gl.viewport(x, y, this.canvas.width, this.canvas.height);
	},

	/*
	* Returns current supported shaders.
	* @param {string}
	*/
	getShader: function(type, str) {
		var shader;
		if (type == "x-shader/x-fragment"){
			shader = this.gl.createShader(jsg.gl.FRAGMENT_SHADER);
		} else if (type == "x-shader/x-vertex") {
			shader = this.gl.createShader(this.gl.VERTEX_SHADER);
		} else {
			return null;
		}
		
		this.gl.shaderSource(shader, str);
		this.gl.compileShader(shader);
		return shader;
	},

	/*
	* Build initial application. 
	*/
	build: function() {
		var scene = this.scenes.get(this.activeScene);
		if (scene){
			scene.build();
			var shader = this.shader;
			shader.build();
			
			var vertexShader = shader.vertexShader.generateCode();
			var fragShader = shader.fragShader.generateCode();
           	        var prg = this.gl.createProgram();
            
            
			var shadervs = this.getShader("x-shader/x-vertex", vertexShader);
			if (!this.gl.getShaderParameter(shadervs, this.gl.COMPILE_STATUS)) {
				this.compileProgramStatus =  "Vertex shader: " + this.gl.getShaderInfoLog(shadervs);
		    		return false;
			}

			var shaderfs = this.getShader("x-shader/x-fragment", fragShader);		
			if (!this.gl.getShaderParameter(shaderfs, this.gl.COMPILE_STATUS)) {
				this.compileProgramStatus =  "Fragment shader: " + this.gl.getShaderInfoLog(shaderfs);
		    		return false;
			}
		
			this.gl.attachShader(prg, shadervs);
			this.gl.attachShader(prg, shaderfs);
			this.gl.linkProgram(prg);
		
			if (!this.gl.getProgramParameter(prg, this.gl.LINK_STATUS)){
				this.compileProgramStatus = "Program link error: " + this.gl.getProgramInfoLog(prg);
				return false;
			}
		
			this.gl.useProgram(prg);
			this.program = prg;		
			shader.load();
			shader.setGlobalValues();
			this.compileProgramStatus =  this.gl.getShaderInfoLog(shaderfs);
		}
		return true;
	},
	
	/*
	* Star rendering pipeline.
	*/
	run: function() {
		if (this.currentScene) {
			this.currentScene.draw(this);
		}
	}
}

