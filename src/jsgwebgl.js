/**
* This file contains code of JavaScript Graphics Library for WebGL (JSGWebGL).
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
	this.shader = null;
	this.modelView = mat4.identity(mat4.create());
	this.projection = mat4.identity(mat4.create());
	this.modelViewStack = [this.modelView];
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
			alert(vertexShader);
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

jsggl.Drawable = function(name, globj){	
	this.vertices = [];
	this.indices = [];
	this.textures = [];
	this.name = name;
	this.vboName = "";
	this.idoName = "";
	this.showFrontFace = true;
	this.showBackFace = true;
	this.showOneTine = true;
	this.gl = globj.gl;
	this.jsg = globj;
	this.vertexBuffer = undefined;
	this.indexBuffer = undefined;
	this.normalsBuffer = undefined;
	this.texBuffer = undefined;
	this.renderingmode = this.gl.LINES;
	this.groupNameList = []
	this.material = undefined;
}

jsggl.Drawable.prototype = {
	build: function() {
		if (this.built) return;
		this.built = true;
		this.vertexBuffer = [];
		this.texBuffer = [];
		for (var i = 0; i < this.vertices.length; i++){
			var vBuffer = this.gl.createBuffer();
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vBuffer);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices[i]), this.gl.STATIC_DRAW);
			this.vertexBuffer.push(vBuffer)
			
			if (this.textures) {
				if (this.textures.length > 0 && this.textures[0] && this.textures[0][0] != -2) {
					var tBuffer = this.gl.createBuffer();
					this.gl.bindBuffer(this.gl.ARRAY_BUFFER, tBuffer); 
					this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.textures[i]), this.gl.		STATIC_DRAW);
					this.texBuffer.push(tBuffer);
				} else {
					this.texBuffer.push(undefined);
				}
			}
		}

		this.indexBuffer = [];
		this.normalsBuffer = [];
		for (var i = 0; i < this.indices.length; i++) {
			var iBuffer  = this.gl.createBuffer();
			this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, iBuffer);
			this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices[i]), this.gl.STATIC_DRAW);
			var normals = jsgutils.calcNormals(this.vertices[i], this.indices[i]);
		
   			var nBuffer = this.gl.createBuffer();
			this.indexBuffer.push(iBuffer);
			this.normalsBuffer.push(nBuffer);
    		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, nBuffer);
    		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normals), this.gl.STATIC_DRAW);
		}

		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    	this.gl.bindBuffer(this.gl.ARRAY_BUFFER,null);
	},
	
	setRenderingMode: function(rm) {
		this.renderingmode = rm;
	},

	getRenderingMode: function() {
		return this.renderingmode;
	},

	draw : function() {
		var prg = this.jsg.program;
		this.jsg.beforeDraw();
		var mvMatrix = this.jsg.getModelView();
		
		var nMatrix = mat4.create();
		
    	mat4.transpose(nMatrix, mvMatrix);
		
		this.jsg.normalMatrix = nMatrix;
	
		if (this.material) {
			var material = this.material;
			this.jsg.materialColor = material.diffuse;
		}
		
		for (var i = 0; i < this.indexBuffer.length; i++) {
			var group = this.groupNameList[i]
					
			if (!this.material) {
				var material = this.jsg.materials[group];
				if (!material) { 
					material = {};
					material.diffuse = [1.0, 1.0, 1.0, 1.0];
					material.ambient = [0.001, 0.001, 0.001, 1.0];
					material.specular = [0.0, 0.0, 0.0, 1.0];
					material.shininess = 1.0;
				}
				this.jsg.materialColor = material.diffuse;
				this.jsg.ambientColor = material.ambient;
				this.jsg.specularColor = material.specular;
				this.jsg.shininess = material.shininess;
			}
			
			this.jsg.currentVertexPosition = this.vertexBuffer[i];
			this.jsg.currentVertexNormal = this.normalsBuffer[i];
			this.jsg.currentTexPosition = this.texBuffer[i];
			this.jsg.useTextureKa = material.useTextureKa;
			this.jsg.useTextureKd = material.useTextureKd;
				
			if (material.textureka && this.texBuffer[i]) {
				this.jsg.texSamplerKa = material.textureka.number;
				var tex = material.textureka;
				tex.active();
			}
			if (material.texturekd && this.texBuffer[i]) {
				this.jsg.texSamplerKd = material.texturekd.number;
				var tex = material.texturekd;
				tex.active();
			}
			this.jsg.shader.setLocalValues();				
			this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer[i]);
			if (this.showOneTime){
				this.gl.drawElements(this.getRenderingMode(), this.indices[i].length, this.gl.UNSIGNED_SHORT, 0);
			} else {
				if (this.showBackFace) {
					this.gl.cullFace(this.gl.FRONT);
					this.gl.drawElements(this.getRenderingMode(), this.indices[i].length, this.gl.UNSIGNED_SHORT, 0);
				}
				if (this.showFrontFace) {
					this.gl.cullFace(this.gl.BACK);
					this.gl.drawElements(this.getRenderingMode(), this.indices[i].length, this.gl.UNSIGNED_SHORT, 0);
				}
			}
		}
		
		this.currentVertexPosition = null;
		this.currentVertexNormal = null;
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
		this.jsg.afterDraw();
	},

	delete: function(){
		for (var i = 0; i < this.indexBuffer.length; i++){
			this.gl.deleteBuffer(this.indedexBuffer[i]);
			this.gl.deleteBuffer(this.vertexBuffer[i]);
			if (this.normalsBuffer && this.normalsBuffer[i]){
				this.gl.deleteBuffer(this.normalsBuffer[i]);
			}
		}
		this.indexBuffer = null;
		this.vertexBuffer = null;
		this.normalsBuffer = null;
	}			
}

