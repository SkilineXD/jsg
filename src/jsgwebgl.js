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
	this.scenes = new jsgcol.ArrayMap();
	this.activeScene = null;
	this.currentScene = null;
	this.ambientLight = [0.01,0.01,0.01,1.0];
	this.materialDiffuse = [0.001,0.001 ,0.001,1.0];
	this.materialAmbient = [0.001, 0.001, 0.001, 1.0];
	this.materialSpecular = [0.001, 0.001, 0.001, 1.0];
	this.shader = null;
	this.modelView = mat4.identity(mat4.create());
	this.projection = mat4.identity(mat4.create());
	this.modelViewStack = [this.modelView];
	this.projectionStack = [this.projection];
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

	//BEGIN: animation configuration
	this.interval = 1000/30.0;
	this.initialize = this.initialize || function(){};
	this.display = this.display || function(){};
	this.finalize = this.finalize || function(){};
	this.stopped = false;
	var self = this;

	this.animationRate = 30;	

	function requestNextFrame(animation){
		window.setInterval(animation, self.interval);
	}

	window.requestAnimationFrame = window.requestAnimationFrame || requestNextFrame;

	function onFrame() {
		var time = +new Date();
		var elapsedTime = time - self.frameTime;
		if (elapsedTime < self.animationRate) return; 
		var steps = Math.floor( elapsedTime / self.animationRate );			  
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

	pushProjection: function(){
		this.projection = mat4.clone(this.projection);
		this.modelViewStack(this.projection);
	},

	popProjection: function(){
		this.projectionStack.pop();
		this.projection = this.projectionStack[this.projectionStack.length - 1];
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
			this.program = prg;		

			var lights = scene.lights;
			var keys = lights.getKeys();
			for (var i = 0; i < keys.length; i++) {
				var lobj = lights.get(keys[i]);
				var l = [];
				if (lobj.diffuse) {
					l.push(lobj.diffuse);
				}
	
				if (lobj.specular) {
					l.push(lobj.specular);
				}
	
				for (var k = 0; k < l.length; k++) {
					l[k].loadUniforms(jsg);
				}
			}
		}

		this.compileProgramStatus =  this.gl.getShaderInfoLog(shaderfs);
		this.shader.setGlobalValues();
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
	this.name = name;
	this.vboName = "";
	this.idoName = "";
	this.gl = globj.gl;
	this.jsg = globj;
	this.vertexBuffer = undefined;
	this.indexBuffer = undefined;
	this.normalsBuffer = undefined;
	this.renderingmode = this.gl.LINES;
	this.groupNameList = []
	this.material = {};
}

jsggl.Drawable.prototype = {
	build: function() {
		this.vertexBuffer = [];
		for (var i = 0; i < this.vertices.length; i++){
			var vBuffer = this.gl.createBuffer();
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vBuffer);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices[i]), this.gl.STATIC_DRAW);
			this.vertexBuffer.push(vBuffer)
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
		if (this.jsg.materials){
			this.material = this.jsg.materials;
		}
		var prg = this.jsg.program;

		var pMatrix = this.jsg.getProjection();
		var mvMatrix = this.jsg.getModelView();
		
		var nMatrix = mat4.create();
		
    		mat4.transpose(nMatrix, mvMatrix);
		
		this.jsg.normalMatrix = nMatrix;
				
		for (var i = 0; i < this.indexBuffer.length; i++) {
			var group = this.groupNameList[i]
					
			var material = this.material[group];
			if (!material) material = this.material["None"];
			
			this.jsg.materialSpecular = material.specular;
			this.jsg.materialDiffuse = material.diffuse;
			this.jsg.materialAmbient = material.ambient;
			this.jsg.shader.setLocalValues(this.jsg);
			if (prg.aVertexPosition >= 0){
				this.gl.enableVertexAttribArray(prg.aVertexPosition);    				
			    	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer[i]);
			   	this.gl.vertexAttribPointer(prg.aVertexPosition, 3, this.gl.FLOAT, false, 0, 0);
			}

			if (prg.aVertexNormal >= 0){
				this.gl.enableVertexAttribArray(prg.aVertexNormal);
    				this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalsBuffer[i]);
    				this.gl.vertexAttribPointer(prg.aVertexNormal, 3, this.gl.FLOAT, false, 0, 0);
			}

			this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer[i]);				
    			this.gl.drawElements(this.getRenderingMode(), this.indices[i].length, this.gl.UNSIGNED_SHORT, 0);
		}
		

		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
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

