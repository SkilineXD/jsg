/**
* This file contains code of JavaScript Graphical Library for WebGL (JSGWebGL).
* JSGWebGL is free for non commercial propose.
* Author: Gilzamir Ferreira Gomes (Todos os direitos reservados)
* Date: jun/05/2013
*/

/* Add replaceAll method in String objects. 
* parameter de : source string.
* parameter para: target string.
* returns new string with replacement of parameter 'de' by parameter 'para'.
* Sample:
* var str = "My las name is {lastname}. Meu sobrenome é {lastname}...".replaceAll("{lastname}", "Silva");
*/
String.prototype.replaceAll = function(de, para){
    var str = this;
    var pos = str.indexOf(de);
    while (pos > -1){
		str = str.replace(de, para);
		pos = str.indexOf(de);
	}
    return (str);
}

/* The name jsggl contains objects for graphical manipulation. */
var jsggl = jsggl || {};
var JSGGL_ARRAY_TYPE = Float32Array || Array;
var JSGGL_EPSLON = 0.000001;

jsggl.JsgGl = function(id){
	this.id = id;
	this.ambientLight = [0.01,0.01,0.01,1.0];
	this.materialDiffuse = [0.001,0.001 ,0.001,1.0];
	this.materialAmbient = [0.001, 0.001, 0.001, 1.0];
	this.materialSpecular = [0.001, 0.001, 0.001, 1.0];
	this.lightsKey = {};
	this.lights = [];

	this.addLight = function(light){	
		var idx = this.lights.length;
		this.lights.push(light);
		this.lightsKey[light.name] = idx;
	}	

	this.getLightIdx = function(name){
		if (this.lightsKey.hasOwnProperty(name)) {
			return this.lightsKey[name];
		} else {
			return -1;
		}
	}

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

	this.modelViewStack = [mat4.identity(mat4.create())];
	this.projectionStack = [mat4.identity(mat4.create())];

	this.COLOR_BUFFER_BIT = this.gl.COLOR_BUFFER_BIT;
	this.DEPTH_BUFFER_BIT = this.gl.DEPTH_BUFFER_BIT;
	this.LINE_LOOP = this.gl.LINE_LOOP;	
	this.TRIANGLE_FAN = this.gl.TRIANGLE_FAN;
	this.LINE_STRIP = this.gl.LINE_STRIP;
	this.LINES = this.gl.LINES;
	this.TRIANGLE_STRIP = this.gl.TRIANGLE_STRIP;
	this.TRIANGLES = this.gl.TRIANGLES;
	this.POINTS = this.gl.POINTS;

	this.interval = 50;
	this.initialize = this.initialize || function(){};
	this.display = this.display || function(){};
	this.finalize = this.finalize || function(){};
	this.stopped = false;
	var self = this;

	this.camera = new jsggl.Camera([0.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 1.0, 0.0]);

	function mainLoop(time) {
			if (!time) {
				time = +new Date();
			}
			self.frameTime = time;
			if (!self.stopped) {
				if (!self.started) {
					self.started = true;
					self.initialize();
				}
				self.display();
				window.requestAnimationFrame(mainLoop);
			} else {
				self.finalize();
			}
	};
	
	this.mainLoop = mainLoop;
}

jsggl.JsgGl.prototype = {

	getModelView: function() {
		return this.modelViewStack[this.modelViewStack.length - 1];
	},	

	getProjection: function() {
		return this.projectionStack[this.projectionStack.length - 1];
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

	compileProgram: function(shader) {
		this.shader = shader;
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
			this.compileProgramStatus = "Program link error.";
			return false;
		}
		
		this.gl.useProgram(prg);

    		prg.aVertexPosition  = this.gl.getAttribLocation(prg, "aVertexPosition");
    		prg.aVertexNormal    = this.gl.getAttribLocation(prg, "aVertexNormal");
	
		prg.uPMatrix = this.gl.getUniformLocation(prg, "uPMatrix");
		prg.uMVMatrix = this.gl.getUniformLocation(prg, "uMVMatrix");
		prg.uNMatrix = this.gl.getUniformLocation(prg, "uNMatrix");
		prg.uLightAmbient = this.gl.getUniformLocation(prg, "uLightAmbient");
		prg.uMaterialDiffuse = this.gl.getUniformLocation(prg, "uMaterialDiffuse");
		prg.uMaterialSpecular = this.gl.getUniformLocation(prg, "uMaterialSpecular");
		prg.uMaterialAmbient = this.gl.getUniformLocation(prg, "uMaterialAmbient");
		

		for (var i = 0; i < this.lights.length; i++) {
			var l = this.lights[i];
			for (var j = 0; j < l.uniforms.length; j++){
				prg[l.uniforms[j]] = this.gl.getUniformLocation(prg, l.uniforms[j]);
			}
		}

		this.program = prg;
		this.compileProgramStatus =  this.gl.getShaderInfoLog(shaderfs);
		this.shader.setGlobalValues(this);
		return true;
	},
}



