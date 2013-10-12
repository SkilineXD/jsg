/**
* This file contains code of JavaScript Graphics Library for WebGL (JSGWebGL).
* JSGWebGL is free for non commercial propose.
* Author: Gilzamir Ferreira Gomes (Todos os direitos reservados)
* Date: jun/05/2013
*/

/* The name jsggl contains objects for graphical manipulation. */
var jsggl = jsggl || {};

jsggl.JsgGl = function(id){
	//BEGIN:configure canvas and context...	
	this.canvas = document.getElementById(id);
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

	this.gl = ctx;

	if (!this.gl) {
		return undefined;
	}
	//END:configure canvas and context
	
	//BEGIN: state attributes
	this.id = id;
	this.materials = {};
	this.materials["Material"] =  { "name":"floor", "ambient":[0.000000, 0.000000, 0.000000, 1.0], "diffuse":[0.0, 0.0, 0.0, 1.0], "specular":[0.0, 0.0, 0.0, 1.0], "shininess":0, "transparence":1, "opticalDensity":0, "shaderType":-1};
	this.scenes = new jsgcol.ArrayMap();
	this.activeScene = null;
	this.currentScene = null;
	this.ambientLight = [1.0, 1.0, 1.0, 1.0];
	this.ambientColor = [0.0,0.0,0.0, 1.0];
	this.materialColor = [0.001,0.001 ,0.001,1.0];
	this.specularColor = [0.001, 0.001, 0.001, 1.0];
	this.shininess = 100.0;
	this.positionalLightQtd = 0;
	this.directionalLightQtd = 0;
	this.pLightColor = [0,0,0,0];
	this.dLightColor = [0, 0, 0, 0];
	this.specularLight = [0, 0, 0, 0];
	this.lightPosition = [0,0,0];
	this.lightDirection = [0, 0, 0];
	this.lightPositionDirection = [0, 0, 0];
	this.updateLightPosition = true;
	this.diffuseCutOff = 0.1;
	this.useTexture = false;
	this.lightMatrix = mat4.identity(mat4.create());
	this.currentVertexPosition = null;
	this.currentVertexNormal = null;
	this.currentTexPosition = null;
    this.shaderType = 1;
	this.shader = null;
	this.modelView = mat4.identity(mat4.create());
	this.projection = mat4.identity(mat4.create());
	this.modelViewStack = [this.modelView];
	this.shadowEnabled = true;
	this.currentTexture = 0;
	this.depthSampler = [-1, -1, -1];
	//BEGIN: state attributes

	//BEGIN: WEBGL CONTEXT SHORTCUTS 
	this.COLOR_BUFFER_BIT = this.gl.COLOR_BUFFER_BIT;
	this.DEPTH_BUFFER_BIT = this.gl.DEPTH_BUFFER_BIT;
	this.LINE_LOOP = this.gl.LINE_LOOP;	
	this.TRIANGLE_FAN = this.gl.TRIANGLE_FAN;
	this.LINE_STRIP = this.gl.LINE_STRIP;
	this.LINES = this.gl.LINES;
	this.TRIANGLE_STRIP = this.gl.TRIANGLE_STRIP;
	this.TRIANGLES = this.gl.TRIANGLES;
	this.POINTS = this.gl.POINTS;
	this.STATIC_DRAW = this.gl.STATIC_DRAW;
	this.DYNAMIC_DRAW = this.gl.DYNAMIC_DRAW;
	//END: WEBGL CONTEXT SHORTCUTS
	this.beforeDraw = function(){};
	this.afterDraw = function(){};
	//BEGIN: animation configuration
	this.initialize = this.initialize || function(){};
	this.display = this.display || function(){};
	this.finalize = this.finalize || function(){};
	this.stopped = false;
	var self = this;
	self.animationRate = 30;
	
	window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;

	function onFrame() {
		var time = +new Date();
		var elapsedTime = time - self.frameTime;
		if (elapsedTime < self.animationRate) return; 
		var steps = Math.floor( elapsedTime / self.animationRate );			
		if (steps > 1000) steps = 1000;
		while (!self.stopped && steps > 0){
			self.display();
			steps -= 1;
		}
		self.frameTime = +new Date();	
	}

	function mainLoop(time) {	
			if (!self.stopped) {
				if (!self.started) {
					self.frameTime = +new Date();
					self.started = true;
					self.initialize();
				}
				onFrame();
				window.requestAnimationFrame(mainLoop);
			} else {
				self.finalize();
			}
	};

	this.mainLoop = mainLoop;
	//BAGIN: animation configuration
}

jsggl.JsgGl.prototype = {
	setActiveScene: function(name) {
		this.currentScene = this.scenes.get(name);
		this.activeScene = name;
	},

	addScene: function(scene) {
		this.scenes.put(scene.name, scene);
	},

	removeScene: function(scene) {
		if (this.scenes.hasKey(scene) && scene != this.activeScene){
			this.scenes.remove(scene);
			return true;
		}
		return false;
	},

	getModelView: function() {
		return this.modelView;
	},	

	getProjection: function() {
		return this.projection;
	},

	resetProjection: function() {
		this.projection = mat4.identity(mat4.create());
	},

	pushModelView: function(){
		this.modelView = mat4.clone(this.modelView);
		this.modelViewStack.push(this.modelView);
	},

	popModelView: function(){
		this.modelViewStack.pop();
		this.modelView = this.modelViewStack[this.modelViewStack.length - 1];
	},

	enableDepthTest: function() {
		this.gl.enable(this.gl.DEPTH_TEST);
	},

	clearColor: function(R, G, B, A) {
		this.gl.clearColor(R, G, B, A);	
	},
	
	depthFunc:function(CODE){
		this.gl.depthFunc(CODE);
	},	   

	clearDepth: function(v) {
		this.gl.clearDepth(v);
	},

	clear: function(mask) {
		this.gl.clear(mask);
	},

	viewport: function(x, y, c_width, c_height) {
		this.gl.viewport(x, y, this.canvas.width, this.canvas.height);
	},

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

	build: function(updateScene) {
		updateScene = updateScene || true;
		var scene = this.scenes.get(this.activeScene);
		if (scene){
			if (updateScene) {
				scene.build();
			}
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


	run: function() {
		if (this.currentScene) {
			this.currentScene.draw(this);
		}
	}
}





