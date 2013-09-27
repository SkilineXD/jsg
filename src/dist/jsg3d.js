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
    this.textureRendering = function(){
        this.build = function(){};
        this.bind = function(){};
        this.unbind = function(){};
    };
    this.shadowEnabled = false;
	this.receiveShadow = false;
	var self = this;
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
					this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.textures[i]), this.gl.STATIC_DRAW);
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
		var stbkp = this.jsg.shaderType;
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
					material.shaderType = 1;
				}
				this.jsg.materialColor = material.diffuse;
				this.jsg.ambientColor = material.ambient;
				this.jsg.specularColor = material.specular;
				this.jsg.shininess = material.shininess;
			} 


			if (this.jsg.shaderType != 3){
				this.jsg.shaderType = material.shaderType || -1;
			}

			if ( (this.receiveShadow) && this.jsg.shaderType != 3) { //3 = make depth map
				this.jsg.shaderType =  material.shaderType + 3; //gouroud or phong shading
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
			this.simpleDraw(i);
            this.jsg.shaderType = stbkp;
		}
		this.currentVertexPosition = null;
		this.currentVertexNormal = null;
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
		this.jsg.afterDraw();
	},

	simpleDraw: function(i) {
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

var jsggl = jsggl || {};

jsggl.Projection = function(type){
	this.type = type;
	if (type == jsggl.Projection.type.PERSPECTIVE) {
		this.FOV = 30 * Math.PI/180.0;
		this.near = 0.1;
		this.far = 1000;
		this.aspectRatio = 1.0;
        this.getMatrix = function() {
            return mat4.perspective(mat4.create(), this.FOV, this.aspectRatio, this.near, this.far);
        }
	} else if (type == jsggl.Projection.type.ORTOGRAPHIC){
		this.left = -1.0;
		this.right = 1.0;
		this.bottom = -1.0;
        this.top = 1.0;
		this.near = 0.01;
		this.far = 2.0;
        this.getMatrix = function() {
            return mat4.ortho(mat4.create(), this.left, this.right, this.bottom, this.top, this.near, this.far);   
        }
	} else {
		throw new Error("Invalid projection type");
	}	
}

jsggl.Projection.newPerspective = function(fov, aspectRatio, near, far) {
	var p = new jsggl.Projection(jsggl.Projection.type.PERSPECTIVE);
	p.FOV = fov;
	p.aspectRatio = aspectRatio;
	p.near = near;
	p.far = far;
	return p;
}

jsggl.Projection.newOrtographic = function(left, right, bottom, top, near, far) {
	var p = new jsggl.Projection(jsggl.Projection.type.ORTOGRAPHIC);
	p.left = left;
	p.right = right;
	p.bottom = bottom;
	p.top = top;
	p.near = near;
	p.far = far;
	return p;
}

jsggl.Projection.type = {};
jsggl.Projection.type.PERSPECTIVE = 0;
jsggl.Projection.type.ORTOGRAPHIC = 1;

jsggl.Camera = function(name, type, projection){
	this.type = type;
	this.name = name;
	this.projection = projection || new jsggl.Projection(jsggl.Projection.type.PERSPECTIVE);

	var self = this;
	this.reset = function() {
		self.position = vec4.create();
		self.position[2] = 10.0;
		self.position[1] = 1.0;
		self.position[0] = 0.0;
		self.azimute = 0.0;
		self.elevation = 0.0;
		self.roll = 0.0;
		self.matrix = mat4.create();
		mat4.identity(this.matrix);
		self.right = vec4.create();
		self.up = vec4.create();
		self.normal = vec4.create();
		this.update();
	}
	
	this.toString = function(){
		return this.matrix[0] + ", " + this.matrix[4] + ", " + this.matrix[8] + ", " + this.matrix[12] + "<br />" +
		this.matrix[1] + ", " + this.matrix[5] + ", " + this.matrix[9] + ", " + this.matrix[13] + "<br />" +
		this.matrix[2] + ", " + this.matrix[6] + ", " + this.matrix[10] + ", " + this.matrix[14] + "<br />" +
		this.matrix[3] + ", " + this.matrix[7] + ", " + this.matrix[11] + ", " + this.matrix[15] + "<br />";
	}

	this.calculateOrientation = function(){
		var m = self.matrix;
		vec4.transformMat4(self.right, [1, 0, 0, 0], m);
		vec4.transformMat4(self.up, [0, 1, 0, 0], m);
		vec4.transformMat4(self.normal, [0, 0, 1, 0], m);
	}
	
	this.update = function() {
		mat4.identity(self.matrix);
		self.calculateOrientation();
		if (self.type == jsggl.Camera.TRACKING) {
			mat4.translate(self.matrix, self.matrix, self.position);
			mat4.rotateZ(self.matrix, self.matrix, self.roll * Math.PI/180.0);
			mat4.rotateY(self.matrix, self.matrix, self.azimute * Math.PI/180.0);				
			mat4.rotateX(self.matrix, self.matrix, self.elevation * Math.PI/180.0);
			vec4.transformMat4(self.position, [0, 0, 0, 1], self.matrix);
		} else {
			mat4.rotateZ(self.matrix, self.matrix, self.roll * Math.PI/180.0);
			mat4.rotateY(self.matrix, self.matrix, self.azimute * Math.PI/180.0);				
			mat4.rotateX(self.matrix, self.matrix, self.elevation * Math.PI/180.0);
			mat4.translate(self.matrix, self.matrix, self.position);					
		}
		self.calculateOrientation();
	}

	this.getMatrix = function(){ 
		return	mat4.invert(mat4.create(), self.matrix);
	}

	this.reset();
};

jsggl.Camera.ORBITING = 0;
jsggl.Camera.TRACKING = 1;
var jsggl = jsggl || {};

jsggl.Light = function(name, type){
	this.name = name;
	this.type = type;
	this.shadowEnabled = false;
	
	this.build = function(arg1, color, specularColor, positionDirection) {
		var pos;
		if (this.type == jsggl.Light.types.POSITIONAL) {
			this.position = arg1;
			pos = this.position;
			this.direction = positionDirection || [0.0, 0.0, 0.0];
			this.projection = jsggl.Projection.newPerspective(17 * Math.PI/180.0, (jsg.canvas.width)/(jsg.canvas.height), 0.1, 1000);
		} else if (this.type == jsggl.Light.types.DIRECTIONAL) {
			this.direction = arg1;
			pos = this.direction;
			this.projection = jsggl.Projection.newOrtographic (-1000, 1000, -1000, 1000, 0.1, 1000);
		} else {
			throw new Error("Invalid light type: " + arg1);
		}
		this.modelViewMatrix = mat4.lookAt(mat4.create(), vec3.fromValues(pos[0], pos[1], pos[2]), vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(0, 1, 0));
		this.specularColor = specularColor || [0.0, 0.0, 0.0, 1.0];
		this.color = color;
		return this;
	}
}

jsggl.Light.types = {};
jsggl.Light.types.POSITIONAL = 0;
jsggl.Light.types.DIRECTIONAL = 1;
jsggl = jsggl || {};

jsggl.ShadowMapping = function(jsg, w, h) {
	this.renderer = jsggl.TextureRendering(jsg, w, h);

}

jsggl.TextureRendering = function (jsg, w, h){
    this.framebuffer;
    this.texture;
    this.renderbuffer;
    var gl = jsg.gl;
    this.width = w;
    this.height = h;
    
    this.build = function() {
        this.framebuffer = gl.createFramebuffer();
        this.texture = gl.createTexture();
        this.renderbuffer = gl.createRenderbuffer();
		this.index = jsg.currentTexture++;
		return this;
    }
    
    this.bind = function(){
        this.framebuffer.width = this.width;
        this.framebuffer.height = this.height;
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);       

		this.activeTexture(gl.TEXTURE0 + this.index);
		
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.framebuffer.width, this.framebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.generateMipmap(gl.TEXTURE_2D);
 
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.framebuffer.width, this.framebuffer.height);
        
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);
    }
 
	this.activeTexture = function() {
		gl.activeTexture(gl.TEXTURE0 + this.index);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
	}
 
    this.unbind = function() {
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);   
    }
	
	this.delete = function(){
		gl.deleteTexture(this.texture);
	}
}

var jsggl = jsggl || {};

jsggl.Material = function(name, matAmb, matDiffuse, matSpecular, shininess) {
	this.name = name;
	this.ambient = matAmb;
	this.diffuse = matDiffuse;
	this.specular = matSpecular;
	this.shininess = shininess;
    this.shaderType = 1;
}


jsggl.Material.newMaterial = function(name, ambient, diffuse, specular, s, t, o) {
 	return {"name":name, "ambient":ambient, "diffuse":diffuse, "specular":specular || [0.0, 0.0, 0.0, 1.0], "shininess":s || 100.0, "transparence":t || 1.0, "opticalDensity":o || 1.0, "shaderType": 1};
}

jsggl.Material.loadFromJSON = function(jsg, obj){
	jsg.materials = jsg.materials || {};
	jsg.textures = jsg.textures || {};
	for (i = 0; i < obj.materialList.length; i++) {
		var mtl = obj.materialList[i];
		if (mtl.mapka){
			mtl.textureka = new jsggl.Texture(jsg, mtl.mapka.texpath);
			mtl.textureka.build();
			mtl.useTextureKa = true;
		} else {
			mtl.useTextureKa = false;
		}
		
		if (mtl.mapkd){
			mtl.texturekd = new jsggl.Texture(jsg, mtl.mapkd.texpath);
			mtl.texturekd.build();
			mtl.useTextureKd = true;
		} else {
			mtl.useTextureKd = false;
		}
		
		jsg.materials[mtl.name] = mtl;
	}
}

jsggl.Texture = function(jsg, texpath) {
	this.texpath =  texpath;
	this.jsg = jsg;
	var self = this;

	this.build = function(){
			var jsg = self.jsg;
			self.number = jsg.currentTexture++;
			jsg.gl.pixelStorei(jsg.gl.UNPACK_FLIP_Y_WEBGL, true);
			self.texture = jsg.gl.createTexture();
			self.image = new Image();
			self.image.onload = function(){
				var jsg = self.jsg;
				jsg.gl.bindTexture(jsg.gl.TEXTURE_2D, self.texture);
				jsg.gl.texImage2D(jsg.gl.TEXTURE_2D, 0, jsg.gl.RGBA, jsg.gl.RGBA, jsg.gl.UNSIGNED_BYTE, self.image);
				jsg.gl.texParameteri(jsg.gl.TEXTURE_2D, jsg.gl.TEXTURE_MAG_FILTER, jsg.gl.NEAREST);
				jsg.gl.texParameteri(jsg.gl.TEXTURE_2D, jsg.gl.TEXTURE_MIN_FILTER, jsg.gl.NEAREST);
				jsg.gl.texParameteri(jsg.gl.TEXTURE_2D, jsg.gl.TEXTURE_WRAP_S, jsg.gl.CLAMP_TO_EDGE);
				jsg.gl.texParameteri(jsg.gl.TEXTURE_2D, jsg.gl.TEXTURE_WRAP_T, jsg.gl.CLAMP_TO_EDGE);
				jsg.gl.bindTexture(jsg.gl.TEXTURE_2D, null);
			}
			self.image.src = self.texpath;
	}

	this.active = function() {
		var jsg = this.jsg;
		jsg.gl.activeTexture(jsg.gl.TEXTURE0+self.number);
		jsg.gl.bindTexture(jsg.gl.TEXTURE_2D, self.texture);
	}

	this.delete = function(){
		this.jsg.gl.deleteTexture(this.texture);
	}
}

var jsggl = jsggl || {};

jsggl.builtin = jsggl.builtin || {};

jsggl.builtin.getFloor = function(jsg, dim, lines){
	var inc = 2*dim/lines;
	var v = [];
	var i = [];
	
	for(var l=0;l<=lines;l++){
		v[6*l] = -dim; 
	    v[6*l+1] = 0;
	    v[6*l+2] = -dim+(l*inc);
	                        
	    v[6*l+3] = dim;
	    v[6*l+4] = 0;
	    v[6*l+5] = -dim+(l*inc);
                        
	    v[6*(lines+1)+6*l] = -dim+(l*inc); 
	    v[6*(lines+1)+6*l+1] = 0;
	    v[6*(lines+1)+6*l+2] = -dim;
                        
	    v[6*(lines+1)+6*l+3] = -dim+(l*inc);
	    v[6*(lines+1)+6*l+4] = 0;
	    v[6*(lines+1)+6*l+5] = dim;
	                        
	    i[2*l] = 2*l;
	    i[2*l+1] = 2*l+1;
	    i[2*(lines+1)+2*l] = 2*(lines+1)+2*l;
	    i[2*(lines+1)+2*l+1] = 2*(lines+1)+2*l+1;        
	}
	
	var g = new jsggl.Drawable("floor", jsg);
	g.vertices = [v];
	g.indices = [i];
	g.groupNameList = ["floor"];
	var obj  = new jsggl.Object("floor");
	obj.addGroup(g);
	obj.material =  { "name":"floor", "ambient":[0.000000, 0.000000, 0.000000, 1.0], "diffuse":[0.0, 0.0, 0.0, 1.0], "specular":[0.0, 0.0, 0.0, 1.0], "shininess":0, "transparence":1, "opticalDensity":0, "shaderType":-1};
	
	return obj;
}

jsggl.Object = function(name) {
	this.name = name;
	this.showOneTime = true;
	this.showFrontFace = true;
	this.showBackFace = true;
	this.shadowEnabled = false;
	this.receiveShadow = false;
	this.renderGroup = new jsgcol.ArrayMap();
	this.transforms = mat4.create();
	this.center = vec3.fromValues(0.0, 0.0, 0.0);
	mat4.identity(this.transforms);

	this.getGroup = function(name) {
		return this.renderGroup.get(name);
	}
	
	this.setPosition = function(pos){
		var p = this.getPivot();
		this.translate(pos);
		this.translate([-p[0], -p[1], -p[2]]);
	}
	
	this.getTransformations = function() {
		return mat4.clone(this.transforms);
	}
	
	this.getTranslations = function() {
		return vec3.fromValues(this.transforms[12], this.transforms[13], this.transforms[14]);
	}
	
	this.getLinearTransformations = function() {
		var t = this.getTransformations();
		t[12] = 0;
		t[13] = 0;
		t[14] = 0;
		return t;
	}
	
	this.getPivot = function() {
		var c = this.center;
		var v = vec3.fromValues(c[0], c[1], c[2]);
		//return vec4.(vec4.create(), v, this.getTransformations());
		return vec3.add(vec3.create(), v, this.getTranslations());
	}
	
	this.centerToGeometry = function() {
		var x = [1000000, -1000000];
		var y = [1000000, -1000000];
		var z = [1000000, -1000000];
		this.renderGroup.forEach(function(g){
			var vl = g.vertices[0];
			for (var i = 0; i < vl.length; i = i + 3) {
				if (x[0] > vl[i]) {
					x[0] = vl[i];
				}
				if (x[1] < vl[i]){
					x[1] = vl[i];
				}
				if (y[0] > vl[i+1]) {
					y[0] = vl[i+1];
				} 
				if (y[1] < vl[i+1]){
					y[1] = vl[i+1];
				}
				if (z[0] > vl[i+2]) {
					z[0] = vl[i+2];
				} 
				if (z[1] < vl[i+2]){
					z[1] = vl[i+2];
				}
			}
		});
		this.xmax = x[1];
		this.xmin = x[0];
		this.ymax = y[1];
		this.ymin = y[0];
		this.zmax = z[1];
		this.zmin = z[0];
		
		this.center[0] = 0.5*(x[1] + x[0]);
		this.center[1] = 0.5*(y[1] + y[0]);
		this.center[2] = 0.5*(z[1] + z[0]);
	}
	
	this.getPosition = function() {
		return vec3.fromValues(this.transforms[12], this.transforms[13], this.transforms[14]);
	}

	this.addGroup = function(g){
		this.renderGroup.put(g.name, g);
	}

	this.removeGroup = function(name){
		this.renderGroup.remove(name);
	}

	this.translate = function(tv){
		mat4.translate(this.transforms, this.transforms, tv);
	}

	this.rotate = function(rad, axis) {
		mat4.rotate(this.transforms, this.transforms, rad, axis);
	}

	this.scale = function(params){
		mat4.scale(this.transforms, this.transforms,  params);
	}

	this.linkDataCopy = function(name) {
		var obj = new jsggl.Object(name);
		obj.renderGroup = this.renderGroup;
		return obj;
	}

	this.forEachRenderGroup = function(callback){
		var keys = this.renderGroup.getKeys();
		for (var i = 0; i < keys.length; i++) {
			var g = this.renderGroup.get(keys[i]);
			callback(g);
		}
	}

	this.build = function(){
		var keys = this.renderGroup.getKeys();
		for (var i = 0; i < keys.length; i++) {
			this.renderGroup.get(keys[i]).build();
		}
		this.centerToGeometry();
	}
	
	this.draw = function(jsg){
		jsg.pushModelView();
		mat4.multiply(jsg.modelView, jsg.modelView, this.transforms);
		var keys = this.renderGroup.getKeys();
		for (var i = 0; i < keys.length; i++) {
			var g = this.renderGroup.get(keys[i]);
			g.showFrontFace = this.showFrontFace;
			g.showBackFace = this.showBackFace;
			g.showOneTime = this.showOneTime;			
			g.material = this.material;
			var bkp = [g.shadowEnabled, g.receiveShadow];
			g.shadowEnabled = this.shadowEnabled;
			g.receiveShadow = this.receiveShadow;
			g.draw();
			g.shadowEnabled = bkp[0];
			g.receiveShadow = bkp[1];
		}
		jsg.popModelView();
	}
}

jsggl.Object.loadFromJSON = function(objson, type, ID) {
	if (!type) type = "object";
	if (type == "group") {
		var obj = new jsggl.Object(ID || "default");
		for (var i = 0; i < objson.objectList.length; i++) {
			var ob = objson.objectList[i];
			var obj3d = new jsggl.Drawable(ob.name, jsg);
			obj3d.indices = ob.indices;
			obj3d.vertices = ob.vertices;
			obj3d.textures = ob.textmap;
			obj3d.groupNameList = ob.groupName;				
			obj3d.setRenderingMode(jsg.TRIANGLES);
			obj.addGroup(obj3d);
		}
		return obj;
	} else if (type == "object") {
		var ob = objson.objectList[ID || 0];
		var obj = new jsggl.Object(ob.name);
		var obj3d = new jsggl.Drawable(ob.name, jsg);
		obj3d.indices = ob.indices;
		obj3d.vertices = ob.vertices;			
		obj3d.groupNameList = ob.groupName;				
		obj3d.setRenderingMode(jsg.TRIANGLES);
		obj.addGroup(obj3d);
		return obj;
	}
}

var jsggl = jsggl ||  {};

jsggl.Scene = function(name, jsg){
	this.name = name;
	this.jsg = jsg;
	this.cameras = {};
	this.currentCamera = new jsggl.Camera("Default", jsggl.Camera.ORBITING);
	this.cameras["Default"] = this.currentCamera;
	this.activeCamera = "Default";
	this.lights = new jsgcol.ArrayMap();
	this.objects = new jsgcol.ArrayMap();

	this.build = function(nul) {
		this.forEachObject(function(obj){
			obj.build();
		});

		this.updateLights();
	}

	this.getObject = function(name) {
		return this.objects.get(name);
	}

	this.addLight = function(l){
		this.lights.put(l.name, l);
	}

	this.forEachLight = function(callback) {
		var keys = this.lights.getKeys();
		for (var i = 0; i < keys.length; i++) {
			var obj = this.lights.get(keys[i]);
			callback(obj);
		}	
	}
	
	this.forEachObject = function(callback) {
		var keys = this.objects.getKeys();
		for (var i = 0; i < keys.length; i++) {
			var obj = this.objects.get(keys[i]);
			callback(obj);
		}
	}

	this.removeLight = function(name){
		return this.lights.remove(name);
	}
	
	this.addObject = function(obj) {
		this.objects.put(obj.name, obj);
	}
	
	this.updateLights = function() {
		var p = []; //position of positional light
		var d = []; //direction of directional light
		var spec = []; //specular colour of positional light 
		var dspec = []; //specular colour of directional light
		var pc = []; //diffuse colour of positional light
		var dc = []; //diffuse colour of \directional light
		var pd = []; //direction of spotlight
		
		var shadows = []; //shadow ligths
		var dq = 0; //directional light quantity
		var pq = 0; //positional light quantity
		var sidx = 0; //shadow index for shadowmap
		var currentCamera = this.currentCamera;
		this.forEachLight(
			function(l) {
				if (l.type == jsggl.Light.types.POSITIONAL) {
					p = p.concat(l.position);
					pc = pc.concat(l.color);
					pd = pd.concat(l.direction);
					spec = spec.concat(l.specularColor);
					pq++;
				} else {
					dspec = dspec.concat(l.specularColor);
					d = d.concat(l.direction);
					dc = dc.concat(l.color);
					dq++;
				}
				if (l.shadowEnabled) {
					shadows.push(l);
					l.texture = l.texture || (new jsggl.TextureRendering(this.jsg, this.jsg.canvas.width, this.jsg.canvas.height).build());
					var pos = l.position;
					l.shadowIdx = sidx;
					this.jsg.sdLightPos = vec3.fromValues(pos[0], pos[1], pos[2]);
					this.jsg.sdLightViewMatrix = l.modelViewMatrix;
					this.jsg.sdLightProjectionMatrix = l.projection.getMatrix();
					this.jsg.sdLightProjView = mat4.multiply(mat4.create(), this.jsg.sdLightProjectionMatrix, this.jsg.sdLightViewMatrix);
					l.matrix = this.jsg.sdLightProjView;
					sidx++;
				}
			}
		);
		this.shadows = shadows;
		this.jsg.shadowCount = shadows.length;
		this.jsg.positionalLightQtd = pq;
		this.jsg.directionalLightQtd = dq;
		this.jsg.lightPosition = p;
		this.jsg.lightPositionDirection = pd;
		this.jsg.lightDirection = d;
		this.jsg.directionalSpecularLight = dspec;
		this.jsg.specularLight = spec;
		this.jsg.pLightColor = pc;
		this.jsg.dLightColor = dc;
	}
	
	this.removeObject = function(name) {
		this.objects.remove(name);
	}

	this.getActiveCamera = function(){
		return this.cameras[this.activeCamera];
	}

	this.setActiveCamera = function(camName){ 
		if (this.cameras.hasOwnProperty(camName)){
			this.activeCamera = camName;
			this.currentCamera = this.cameras[this.activeCamera];
			return true;
		}
		return false;
	}

	this.draw = function() {
		var jsg = this.jsg;
		var shadows = this.shadows;
		var bst = jsg.shaderType;
		if (this.shadowEnabled) {
			for (var i = 0; i < shadows.length; i++) {
				var l = shadows[i];
				jsg.depthSampler[i] = l.texture.index;
				l.texture.bind();
				jsg.shaderType = 3;
				jsg.activeShadow = i;
				this.simpleDraw();
				l.texture.unbind();
				l.texture.activeTexture();
			}
			jsg.activeShadow = -1;
			jsg.shaderType = 4; //SHADOW MAPPING
			this.simpleDraw();
		} else {
			this.simpleDraw();
		}
		jsg.shaderType = bst;
	}
	
	this.simpleDraw = function(){
		var m = null;
		var jsg = this.jsg;
		var mv = mat4.clone(jsg.modelView);
		var cm = this.currentCamera.getMatrix();
		jsg.pushModelView();
		jsg.projection = this.currentCamera.projection.getMatrix();
		mat4.multiply(jsg.modelView, cm, jsg.modelView);
		var keys = this.objects.getKeys();
		var bse = jsg.shadowEnabled;
		for (var i = 0; i < keys.length; i++) {
			var obj = this.objects.get(keys[i]);
			jsg.shadowEnabled = obj.shadowEnabled;
			if (jsg.shaderType == 3 || jsg.shaderType == 4) {
				this.jsg.shadowMatrices = new Float32Array(this.shadows.length * 16);
				if (this.jsg.shadowMatrices){
					var j;
					for (j = 0; j < this.shadows.length; j++){
						jsg.shadowMatrices.set(mat4.multiply(mat4.create(), this.shadows[j].matrix, obj.transforms), j*16);
					}
				}		
				obj.draw(jsg);
				jsg.gl.depthFunc(jsg.gl.LEQUAL);
			} else {
				obj.draw(jsg);
			}
		}
		jsg.previewShadowStatus = 0;
		jsg.popModelView();
		this.jsg.shadowEnabled = bse;
	}
}

var jsggl = jsggl || {};

jsggl.ShaderCode = function(header, footer){
	this.text = [];
	this.generateCode = function(){
		var code = "";
		for (var i = 0; i < this.text.length; i++){
			code += this.text[i] + "\n";
		}
		return code;
	}
}

jsggl.ShaderMap = function(){
	this.statemap = {};
	this.statemethod = {};	
	this.state = {};
	this.statetype = {};
	
	this.newStateMap = function(property, method, webglprop, value, type) {
		if (type==undefined) type = jsggl.ShaderMap.UNIFORM;
		this.statemethod[property] = method;
		this.statemap[property] = webglprop;
		this.state[property] = value;
		this.statetype[property] = type;
	}
	
	this.setProperty = function(prop, value){
		if (this.state.hasOwnProperty(prop)){
			this.state[prop] = value;
		} else {
			throw new Error("Property not found: " + prop);
		}
	}
	
	this.getProperty = function(prop){
		return this.state[prop];
	}
	
	this.setValues = function(jsg) {
		for (k in this.state) {
			if (this.state.hasOwnProperty(k)){
					var value = this.state[k];
					var varname = this.statemap[k];
					var method = this.statemethod[k];	
					method(jsg, jsg.program[k], value);
			}
		}
	}
	
	this.load = function(jsg) {
		var prg = jsg.program;
		for (k in this.state){
			if (this.state.hasOwnProperty(k)){
				if (this.statetype[k]==jsggl.ShaderMap.UNIFORM) {
					prg[k] = jsg.gl.getUniformLocation(prg, this.statemap[k]);
				} else if (this.statetype[k] == jsggl.ShaderMap.ATTRIBUTE){
					prg[k] =  jsg.gl.getAttribLocation(prg, this.statemap[k]);
				}
			}
		}
	}
}

jsggl.ShaderMap.ATTRIBUTE = 0;
jsggl.ShaderMap.UNIFORM = 1;

jsggl.Shader = function(jsg){
	this.jsg = jsg;
	this.vertexShader = new jsggl.ShaderCode();
	this.fragShader = new jsggl.ShaderCode();
	this.localmap = new jsggl.ShaderMap();
	this.globalmap = new jsggl.ShaderMap();
	this.USE_EXP_DIFFUSE_CUTOFF = true;
	this.diffuseCutOffExpoent = 40.0;
	this.maxLights = 4;
	this.maxShadows = 2;

	var uniform1i = function(jsg, p, value) { jsg.gl.uniform1i(p, value); };
	var uniform1f = function(jsg, p, value) { jsg.gl.uniform1f(p, value); }
	var uniform2iv = function(jsg, p, value){ jsg.gl.uniform2i(p, value); }
	var uniform3iv = function(jsg, p, value){ jsg.gl.uniform3iv(p, value); }
	var uniform3i = function(jsg, p, value){ jsg.gl.uniform3i(p, value); }
	var uniform2fv = function(jsg, p, value){ jsg.gl.uniform2fv(p, value); }
	var uniform3fv = function(jsg, p, value){ jsg.gl.uniform3fv(p, value); };
	var uniform4fv = function(jsg, p, value){ jsg.gl.uniform4fv(p, value); };	
	var uniformMatrix4fv = function(jsg, p, value){jsg.gl.uniformMatrix4fv(p, false, value); };
	var attr = function(jsg, p, value) {
			if (value != undefined && value != null) {
				jsg.gl.enableVertexAttribArray(p);
				jsg.gl.bindBuffer(jsg.gl.ARRAY_BUFFER, value);
				jsg.gl.vertexAttribPointer(p, 3, jsg.gl.FLOAT, false, 0, 0);
			}
	};

	this.globalmap.newStateMap("POSITIONAL_LIGHT_QTD", uniform1i, "uPosLights", 0);
	this.globalmap.newStateMap("DIRECTIONAL_LIGHT_QTD", uniform1i, "uDirLights", 0);
	this.globalmap.newStateMap("POS_LIGHT_COLOR", uniform4fv, "uPLightColor", []);
	this.globalmap.newStateMap("DIR_LIGHT_COLOR", uniform4fv, "uDLightColor", []);
	this.globalmap.newStateMap("LIGHT_POSITION", uniform3fv, "uLightPosition");
	this.globalmap.newStateMap("LIGHT_DIRECTION", uniform3fv, "uLightDirection");
	this.globalmap.newStateMap("SPECULAR_LIGHT", uniform4fv, "uLightSpecular");
	this.globalmap.newStateMap("DIR_SPECULAR_LIGHT", uniform4fv, "uDLightSpecular");
	this.globalmap.newStateMap("AMBIENT_LIGHT", uniform4fv, "uAmbientLight");
	this.globalmap.newStateMap("UPDATE_LIGHT_POSITION", uniform1i, "uUpdateLightPosition", true);
	this.globalmap.newStateMap("LIGHT_POSITION_DIR", uniform3fv, "uLightPositionDir");
	this.globalmap.newStateMap("SHADOW_BIAS_MATRIX", uniformMatrix4fv, "shadowBiasMatrix");

	this.localmap.newStateMap("MATERIAL_COLOR", uniform4fv, "uMaterialColor", [0.0, 0.0, 0.0, 1.0]);
	this.localmap.newStateMap("SPECULAR_COLOR", uniform4fv, "uSpecularColor", [0.0, 0.0, 0.0, 1.0]);
	this.localmap.newStateMap("SHININESS", uniform1f, "uShininess", 100.0);
	this.localmap.newStateMap("PROJECTION_MATRIX", uniformMatrix4fv, "uPMatrix", mat4.create());
	this.localmap.newStateMap("MODELVIEW_MATRIX", uniformMatrix4fv, "uMVMatrix", mat4.create());
	this.localmap.newStateMap("NORMAL_MATRIX", uniformMatrix4fv, "uNMatrix", mat4.create());
	this.localmap.newStateMap("LIGHT_MATRIX", uniformMatrix4fv, "uLMatrix", mat4.create());
	this.localmap.newStateMap("LIGHT_PROJ_MATRIX", uniformMatrix4fv, "uWLPMatrix", mat4.create());
	this.localmap.newStateMap("TEX_POSITION", attr, "aVertexTextureCoords", null, jsggl.ShaderMap.ATTRIBUTE);
	this.localmap.newStateMap("VERTEX_POSITION", attr, "aVertexPos", null, jsggl.ShaderMap.ATTRIBUTE);
	this.localmap.newStateMap("VERTEX_NORMAL", attr, "aVertexNormal", null, jsggl.ShaderMap.ATTRIBUTE);
	this.localmap.newStateMap("AMBIENT_COLOR", uniform4fv, "uAmbientColor", [0.0, 0.0, 0.0, 1.0]);
	this.localmap.newStateMap("DIFFUSE_CUTOFF", uniform1f, "uCutOff", 0.4);
	this.localmap.newStateMap("USE_TEXTUREKA", uniform1i, "uUseTextureKa", false);
	this.localmap.newStateMap("USE_TEXTUREKD", uniform1i, "uUseTextureKd", false);
	this.localmap.newStateMap("TEX_SAMPLERKA", uniform1i, "uSamplerKa", 0);
	this.localmap.newStateMap("TEX_SAMPLERKD", uniform1i, "uSamplerKd", 0);
    this.localmap.newStateMap("SHADER_TYPE", uniform1i, "shaderType", 1);
	
	this.localmap.newStateMap("DEPTH_SAMPLER0", uniform1i, "uDepthSampler0", 0);
	this.localmap.newStateMap("DEPTH_SAMPLER1", uniform1i, "uDepthSampler1", 0);
	this.localmap.newStateMap("DEPTH_SAMPLER2", uniform1i, "uDepthSampler2", 0);	
	this.localmap.newStateMap("ACTIVE_SHADOW", uniform1i, "uActiveShadow", -1);
	this.localmap.newStateMap("SHADOW_COUNT", uniform1i, "uShadowCount", 0);
	this.localmap.newStateMap("SHADOW_ENABLED", uniform1i, "uShadowEnabled", 0);

	this.load = function() {
		this.localmap.load(this.jsg);
		this.globalmap.load(this.jsg);
	}
	
	this.updateGlobalValues = function() {
		var shadowBiasMatrix = mat4.create();
		shadowBiasMatrix=mat4.identity(shadowBiasMatrix);
		shadowBiasMatrix=mat4.scale(shadowBiasMatrix, shadowBiasMatrix, [0.5, 0.5, 0.5]);
		shadowBiasMatrix=mat4.translate(shadowBiasMatrix, shadowBiasMatrix, [1.0, 1.0, 1.0, 1.0]);
	
		var jsg = this.jsg;
		var globalmap = this.globalmap;
		globalmap.setProperty("POSITIONAL_LIGHT_QTD", jsg.positionalLightQtd);
		globalmap.setProperty("DIRECTIONAL_LIGHT_QTD", jsg.directionalLightQtd);
		globalmap.setProperty("POS_LIGHT_COLOR", jsg.pLightColor);
		globalmap.setProperty("DIR_LIGHT_COLOR", jsg.dLightColor);
		globalmap.setProperty("LIGHT_DIRECTION", jsg.lightDirection);
		globalmap.setProperty("LIGHT_POSITION", jsg.lightPosition);
		globalmap.setProperty("LIGHT_POSITION_DIR", jsg.lightPositionDirection);
		globalmap.setProperty("SPECULAR_LIGHT", jsg.specularLight);
		globalmap.setProperty("DIR_SPECULAR_LIGHT", jsg.directionalSpecularLight);
		globalmap.setProperty("AMBIENT_LIGHT", jsg.ambientLight);
		globalmap.setProperty("UPDATE_LIGHT_POSITION", jsg.updateLightPosition);
		globalmap.setProperty("SHADOW_BIAS_MATRIX", shadowBiasMatrix);
	}
	
	this.setGlobalValues = function(){
		this.updateGlobalValues();
		this.globalmap.setValues(jsg);
	}
	
	function clone(m) {
		var res = new Float32Array(m.length);
		for (var i  = 0; i < m.length; i++) {
			res[i] = m[i];
		}
		return res;
	}
	
	function concatMat4(m1, m2) {
		if (m2 == null) return clone(m1);
		var res = new Float32Array(m1.length + m2.length);
		var idx = 0;
		for (var i = 0; i < m2.length; i++) {
			res[idx++] = m2[i];
		}
		for (var i = 0; i < m1.length; i++) {
			res[idx++] = m1[i];
		}
		return res;
	}
	
	this.updateLocalValues = function() {
		var jsg = this.jsg;
		var localmap = this.localmap;
		
		localmap.setProperty("MATERIAL_COLOR", jsg.materialColor);
		localmap.setProperty("PROJECTION_MATRIX", jsg.getProjection());
		localmap.setProperty("MODELVIEW_MATRIX", jsg.getModelView());
		localmap.setProperty("NORMAL_MATRIX", jsg.normalMatrix);;
		localmap.setProperty("TEX_POSITION", jsg.currentTexPosition);
		localmap.setProperty("VERTEX_POSITION", jsg.currentVertexPosition);
		localmap.setProperty("VERTEX_NORMAL", jsg.currentVertexNormal);
		localmap.setProperty("SPECULAR_COLOR", jsg.specularColor);
		localmap.setProperty("SHININESS", jsg.shininess);
		localmap.setProperty("AMBIENT_COLOR", jsg.ambientColor);
		localmap.setProperty("DIFFUSE_CUTOFF", jsg.diffuseCutOff);
		localmap.setProperty("USE_TEXTUREKA", jsg.useTextureKa);
		localmap.setProperty("USE_TEXTUREKD", jsg.useTextureKd);
		localmap.setProperty("TEX_SAMPLERKA", jsg.texSamplerKa);
		localmap.setProperty("TEX_SAMPLERKD", jsg.texSamplerKd);
        localmap.setProperty("SHADER_TYPE", jsg.shaderType);
		localmap.setProperty("LIGHT_PROJ_MATRIX", jsg.shadowMatrices || mat4.create());
		if (jsg.depthSampler[0] >= 0) {
			localmap.setProperty("DEPTH_SAMPLER0", jsg.depthSampler[0]);
		}
		if (jsg.depthSampler[1] >= 0) {
			localmap.setProperty("DEPTH_SAMPLER1", jsg.depthSampler[1]);
		}
		if (jsg.depthSampler[2] >= 0) {
			localmap.setProperty("DEPTH_SAMPLER2", jsg.depthSampler[2]);
		}
		localmap.setProperty("ACTIVE_SHADOW", jsg.activeShadow);
		localmap.setProperty("SHADOW_COUNT", jsg.shadowCount);
		localmap.setProperty("SHADOW_ENABLED", jsg.shadowEnabled);
	}
	
	this.setLocalValues = function() {
		this.updateLocalValues();
		this.localmap.setValues(jsg);
	}

	this.build = function() {
		var totalLights = jsg.positionalLightQtd + jsg.directionalLightQtd;
		if (totalLights > this.maxLights) {
			throw new Error("Light quantity limit is " + this.maxLights + ", but " + totalLights + " lights was found.");
		}
		if (jsg.shadowCount > this.maxShadows) {
			throw new Error("Shadow light quantity limit is " + this.maxShadows + ",  but " + jsg.shadowCount + " shadow light quantity was found.");
		}
		if (jsg.positionalLightQtd > 0) 		this.vertexShader.text.push("#define MAX_POS_LIGHTS "+ jsg.positionalLightQtd + "");
		if (jsg.directionalLightQtd > 0) 		this.vertexShader.text.push("#define MAX_DIR_LIGHTS  " + jsg.directionalLightQtd + "");
		if (jsg.shadowCount > 0) 		this.vertexShader.text.push("#define MAX_SHADOWS  " + jsg.shadowCount + "");
		this.vertexShader.text.push("attribute vec3 aVertexPos;");
		this.vertexShader.text.push("attribute vec3 aVertexNormal;");
		this.vertexShader.text.push("attribute vec2 aVertexTextureCoords;");
		this.vertexShader.text.push("uniform mat4 uMVMatrix;");
		this.vertexShader.text.push("uniform mat4 uPMatrix;");
		this.vertexShader.text.push("uniform mat4 uNMatrix;");
		this.vertexShader.text.push("uniform int uPosLights;");
		this.vertexShader.text.push("uniform int uDirLights;");
		this.vertexShader.text.push("uniform int uUseTexture;");
		this.vertexShader.text.push("uniform vec4 uAmbientLight;");
		this.vertexShader.text.push("uniform float uShininess;");
		this.vertexShader.text.push("uniform vec4 uSpecularColor;");
		this.vertexShader.text.push("uniform vec4 uMaterialColor;");
		this.vertexShader.text.push("uniform vec4 uAmbientColor;");
		this.vertexShader.text.push("uniform bool uUpdateLightPosition;");
		this.vertexShader.text.push("uniform mat4 uLMatrix;");
		this.vertexShader.text.push("uniform float uCutOff;");
		this.vertexShader.text.push("#ifdef MAX_POS_LIGHTS");
		this.vertexShader.text.push("uniform vec3 uLightPosition[MAX_POS_LIGHTS];");
		this.vertexShader.text.push("uniform vec4 uLightSpecular[MAX_POS_LIGHTS];");
		this.vertexShader.text.push("uniform	vec4 uPLightColor[MAX_POS_LIGHTS];");
		this.vertexShader.text.push("uniform vec3 uLightPositionDir[MAX_POS_LIGHTS];");
		this.vertexShader.text.push("varying vec3 lightdir[MAX_POS_LIGHTS];");
		this.vertexShader.text.push("#endif");
		this.vertexShader.text.push("uniform int shaderType;");
		this.vertexShader.text.push("#ifdef MAX_DIR_LIGHTS");
		this.vertexShader.text.push("uniform vec3 uLightDirection[MAX_DIR_LIGHTS];");
		this.vertexShader.text.push("uniform	vec4 uDLightColor[MAX_DIR_LIGHTS];");
		this.vertexShader.text.push("uniform	vec4 uDLightSpecular[MAX_DIR_LIGHTS];");
		this.vertexShader.text.push("#endif");
		this.vertexShader.text.push("varying vec4 vColor;");
		this.vertexShader.text.push("varying vec2 vTextureCoords;");
		this.vertexShader.text.push("varying vec3 eyeVec;");
		this.vertexShader.text.push("varying vec3 vNormal;");
		this.vertexShader.text.push("#ifdef MAX_SHADOWS");
		this.vertexShader.text.push("uniform mat4 uWLPMatrix[MAX_SHADOWS];");
		this.vertexShader.text.push("varying vec4 shadowPosition[MAX_SHADOWS];");
		this.vertexShader.text.push("uniform mat4 shadowBiasMatrix;");
		this.vertexShader.text.push("uniform int uActiveShadow;");
		this.vertexShader.text.push("uniform int uShadowCount;");
		this.vertexShader.text.push("#endif");
		this.vertexShader.text.push("void phong(void){");
		this.vertexShader.text.push("vec4 vertex = uMVMatrix * vec4(aVertexPos, 1.0);");
		this.vertexShader.text.push("eyeVec = -vertex.xyz;");
		this.vertexShader.text.push("vNormal = vec3(uNMatrix * vec4(aVertexNormal, 1.0));");
		this.vertexShader.text.push("#ifdef MAX_POS_LIGHTS");
		this.vertexShader.text.push("for(int i = 0; i < MAX_POS_LIGHTS; i++){");
		this.vertexShader.text.push("vec4 pos = uLMatrix * vec4(uLightPosition[i], 1.0);");
		this.vertexShader.text.push("lightdir[i] = vertex.xyz - pos.xyz;");
		this.vertexShader.text.push("}");
		this.vertexShader.text.push("#endif");
		this.vertexShader.text.push("gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPos, 1.0);");
		this.vertexShader.text.push("vTextureCoords = aVertexTextureCoords;");
		this.vertexShader.text.push("}");
		this.vertexShader.text.push("void goroud(void){");
		this.vertexShader.text.push("vec4 vertex = uMVMatrix * vec4(aVertexPos, 1.0);");
		this.vertexShader.text.push("vec3 eyeVec = -vec3(vertex.xyz);");
		this.vertexShader.text.push("vec3 E = normalize(eyeVec);");
		this.vertexShader.text.push("vec4 Ia = uAmbientLight * uAmbientColor;");
		this.vertexShader.text.push("vColor = vec4(0.0, 0.0, 0.0, 1.0);");
		this.vertexShader.text.push("#ifdef MAX_POS_LIGHTS");
		this.vertexShader.text.push("for(int i = 0; i < MAX_POS_LIGHTS; i++){");
		this.vertexShader.text.push("vec3 N = normalize(vec3(uNMatrix * vec4(aVertexNormal, 1.0))-uLightPositionDir[i]);");
		this.vertexShader.text.push("vec4 pos = uLMatrix * vec4(uLightPosition[i], 1.0);");
		this.vertexShader.text.push("vec3 lightdir = vertex.xyz - pos.xyz;");
		this.vertexShader.text.push("vec3 L = normalize(lightdir);");
		this.vertexShader.text.push("vec3 R = reflect(L, N);");
		this.vertexShader.text.push("float lt = dot(N, -L);");
		this.vertexShader.text.push("float specular = pow(max(dot(R,E), 0.0), uShininess);");
		this.vertexShader.text.push("float f = 40.0001;");
		this.vertexShader.text.push("vec4 Id = uMaterialColor * uPLightColor[i] * pow(lt, f * uCutOff);");
		this.vertexShader.text.push("vec4 Is = uSpecularColor * uLightSpecular[i] * specular;");
		this.vertexShader.text.push("vColor += Id + Is;");
		this.vertexShader.text.push("}");
		this.vertexShader.text.push("#endif");
		this.vertexShader.text.push("#ifdef MAX_DIR_LIGHTS");
		this.vertexShader.text.push("vec3 N = normalize(vec3(uNMatrix * vec4(aVertexNormal, 1.0)));");
		this.vertexShader.text.push("for(int i = 0; i < MAX_DIR_LIGHTS; i++){");
		this.vertexShader.text.push("vec3 L = normalize(uLightDirection[i]);");
		this.vertexShader.text.push("vec3 R = reflect(L, N);");
		this.vertexShader.text.push("float lt = dot(N, -L);");
		this.vertexShader.text.push("float specular = pow(max(dot(R,E), 0.0), uShininess);");
		this.vertexShader.text.push("float f = 40.0001;");
		this.vertexShader.text.push("vec4 Id = uMaterialColor * uDLightColor[i] * pow(lt, f * uCutOff);");
		this.vertexShader.text.push("vec4 Is = uSpecularColor * uDLightSpecular[i] * specular;");
		this.vertexShader.text.push("vColor += Id + Is;");
		this.vertexShader.text.push("}");
		this.vertexShader.text.push("#endif");
		this.vertexShader.text.push("vColor += Ia;");
		this.vertexShader.text.push("vColor[3] = uMaterialColor[3];");
		this.vertexShader.text.push("gl_Position = uPMatrix * vertex;");
		this.vertexShader.text.push("gl_PointSize = 1.0;");
		this.vertexShader.text.push("if (uUseTexture != 0) {");
		this.vertexShader.text.push("vTextureCoords = aVertexTextureCoords;");
		this.vertexShader.text.push("}");
		this.vertexShader.text.push("}");
		this.vertexShader.text.push("void flatMode(void){");
		this.vertexShader.text.push("vec4 vertex = uMVMatrix * vec4(aVertexPos, 1.0);");
		this.vertexShader.text.push("gl_Position = uPMatrix * vertex;");
		this.vertexShader.text.push("gl_PointSize = 1.0;");
		this.vertexShader.text.push("}");
		this.vertexShader.text.push("#ifdef MAX_SHADOWS");
		this.vertexShader.text.push("void depthMap(void) {");
		this.vertexShader.text.push("for (int i = 0; i < MAX_SHADOWS; i++) {");
		this.vertexShader.text.push("if (i == uActiveShadow) {");
		this.vertexShader.text.push("gl_Position = uWLPMatrix[i] * vec4(aVertexPos, 1.0);");
		this.vertexShader.text.push("vec3 vertexShifted = vec3(aVertexPos) + 0.5;");
		this.vertexShader.text.push("shadowPosition[i] = shadowBiasMatrix * uWLPMatrix[i] * vec4(vertexShifted, 1.0);");
		this.vertexShader.text.push("break;");
		this.vertexShader.text.push("}");
		this.vertexShader.text.push("}");
		this.vertexShader.text.push("}");
		this.vertexShader.text.push("void shadowMapping(void) {");
		this.vertexShader.text.push("vec3 vertexShifted = vec3(aVertexPos) + 0.5;");
		this.vertexShader.text.push("for (int i = 0; i < MAX_SHADOWS; i++) {");
		this.vertexShader.text.push("if (i >= uShadowCount) break;");
		this.vertexShader.text.push("shadowPosition[i] = shadowBiasMatrix * uWLPMatrix[i] * vec4(vertexShifted, 1.0);");
		this.vertexShader.text.push("}");
		this.vertexShader.text.push("}");
		this.vertexShader.text.push("#endif");
		this.vertexShader.text.push("void main(void) {");
		this.vertexShader.text.push("if (shaderType == 1) {");
		this.vertexShader.text.push("goroud();");
		this.vertexShader.text.push("} else if (shaderType == 2) {");
		this.vertexShader.text.push("phong();");
		this.vertexShader.text.push("} else if (shaderType == 3) {");
		this.vertexShader.text.push("#ifdef MAX_SHADOWS");
		this.vertexShader.text.push("depthMap();");
		this.vertexShader.text.push("#endif");
		this.vertexShader.text.push("} else if (shaderType == 4) {");
		this.vertexShader.text.push("goroud();");
		this.vertexShader.text.push("#ifdef MAX_SHADOWS");
		this.vertexShader.text.push("shadowMapping();");
		this.vertexShader.text.push("#endif");
		this.vertexShader.text.push("} else if (shaderType == 5) {");
		this.vertexShader.text.push("#ifdef MAX_SHADOWS");
		this.vertexShader.text.push("phong();");
		this.vertexShader.text.push("shadowMapping();");
		this.vertexShader.text.push("#endif");
		this.vertexShader.text.push("} else {");
		this.vertexShader.text.push("flatMode();");
		this.vertexShader.text.push("}");
		this.vertexShader.text.push("}");
		this.fragShader.text.push("#ifdef GL_ES");
		this.fragShader.text.push("precision highp float;");
		this.fragShader.text.push("precision highp int;");
		this.fragShader.text.push("#endif");
		this.fragShader.text.push("#define TRUE 1");
		this.fragShader.text.push("#define FALSE 0");
		if (jsg.positionalLightQtd > 0) 		this.fragShader.text.push("#define MAX_POS_LIGHTS "+ jsg.positionalLightQtd + "");
		if (jsg.directionalLightQtd > 0) 		this.fragShader.text.push("#define MAX_DIR_LIGHTS  " + jsg.directionalLightQtd + "");
		if (jsg.shadowCount > 0) 		this.fragShader.text.push("#define MAX_SHADOWS  " + jsg.shadowCount + "");
		this.fragShader.text.push("uniform int uUseTextureKa;");
		this.fragShader.text.push("uniform int uUseTextureKd;");
		this.fragShader.text.push("uniform sampler2D uSamplerKa;");
		this.fragShader.text.push("uniform sampler2D uSamplerKd;");
		this.fragShader.text.push("uniform vec4 uMaterialColor;");
		this.fragShader.text.push("uniform vec4 uAmbientColor;");
		this.fragShader.text.push("uniform int uPosLights;");
		this.fragShader.text.push("uniform int uDirLights;");
		this.fragShader.text.push("uniform float uShininess;");
		this.fragShader.text.push("uniform vec4 uSpecularColor;");
		this.fragShader.text.push("uniform vec4 uAmbientLight;");
		this.fragShader.text.push("uniform float uCutOff;");
		this.fragShader.text.push("#ifdef MAX_POS_LIGHTS");
		this.fragShader.text.push("uniform vec3 uLightPosition[MAX_POS_LIGHTS];");
		this.fragShader.text.push("uniform	vec4 uPLightColor[MAX_POS_LIGHTS];");
		this.fragShader.text.push("uniform vec4 uLightSpecular[MAX_POS_LIGHTS];");
		this.fragShader.text.push("uniform vec3 uLightPositionDir[MAX_POS_LIGHTS];");
		this.fragShader.text.push("varying vec3 lightdir[MAX_POS_LIGHTS];");
		this.fragShader.text.push("#endif");
		this.fragShader.text.push("uniform int shaderType;");
		this.fragShader.text.push("varying vec3 eyeVec;");
		this.fragShader.text.push("varying vec3 vNormal;");
		this.fragShader.text.push("varying vec4 vColor;");
		this.fragShader.text.push("varying vec2 vTextureCoords;");
		this.fragShader.text.push("#ifdef MAX_DIR_LIGHTS");
		this.fragShader.text.push("uniform vec3 uLightDirection[MAX_DIR_LIGHTS];");
		this.fragShader.text.push("uniform	vec4 uDLightColor[MAX_DIR_LIGHTS];");
		this.fragShader.text.push("uniform	vec4 uDLightSpecular[MAX_DIR_LIGHTS];");
		this.fragShader.text.push("#endif");
		this.fragShader.text.push("#ifdef MAX_SHADOWS");
		this.fragShader.text.push("uniform sampler2D uDepthSampler0;");
		this.fragShader.text.push("uniform sampler2D uDepthSampler1;");
		this.fragShader.text.push("uniform sampler2D uDepthSampler2;");
		this.fragShader.text.push("varying highp vec4 shadowPosition[MAX_SHADOWS];");
		this.fragShader.text.push("uniform int uActiveShadow;");
		this.fragShader.text.push("uniform int uShadowCount;");
		this.fragShader.text.push("uniform int uShadowEnabled;");
		this.fragShader.text.push("#endif");
		this.fragShader.text.push("vec4 phong(void){");
		this.fragShader.text.push("vec4 ambientMaterial = uAmbientColor;");
		this.fragShader.text.push("vec4 diffuseMaterial = uMaterialColor;");
		this.fragShader.text.push("if (uUseTextureKa == 1) {");
		this.fragShader.text.push("ambientMaterial = ambientMaterial * texture2D(uSamplerKa, vTextureCoords);");
		this.fragShader.text.push("}");
		this.fragShader.text.push("if (uUseTextureKd == 1) {");
		this.fragShader.text.push("diffuseMaterial = diffuseMaterial  * texture2D(uSamplerKd, vTextureCoords);");
		this.fragShader.text.push("}");
		this.fragShader.text.push("vec3 E = normalize(eyeVec);");
		this.fragShader.text.push("vec4 Ia = uAmbientLight * ambientMaterial;");
		this.fragShader.text.push("vec4 fColor = vec4(0.0, 0.0, 0.0, 1.0);");
		this.fragShader.text.push("#ifdef MAX_POS_LIGHTS");
		this.fragShader.text.push("for(int i = 0; i < MAX_POS_LIGHTS; i++){");
		this.fragShader.text.push("vec3 N = normalize(vNormal-uLightPositionDir[i]);");
		this.fragShader.text.push("vec3 L = normalize(lightdir[i]);");
		this.fragShader.text.push("vec3 R = reflect(L, N);");
		this.fragShader.text.push("float lt = dot(N, -L);");
		this.fragShader.text.push("float specular = pow(max(dot(R,E), 0.0), uShininess);");
		this.fragShader.text.push("float f = 40.0001;");
		this.fragShader.text.push("vec4 Id = diffuseMaterial * uPLightColor[i] * pow(lt, f * uCutOff);");
		this.fragShader.text.push("vec4 Is = uSpecularColor * uLightSpecular[i] * specular;");
		this.fragShader.text.push("fColor +=  Id + Is;");
		this.fragShader.text.push("}");
		this.fragShader.text.push("#endif");
		this.fragShader.text.push("#ifdef MAX_DIR_LIGHTS");
		this.fragShader.text.push("vec3 N = normalize(vNormal);");
		this.fragShader.text.push("for(int i = 0; i < MAX_DIR_LIGHTS; i++){");
		this.fragShader.text.push("vec3 L = normalize(uLightDirection[i]);");
		this.fragShader.text.push("vec3 R = reflect(L, N);");
		this.fragShader.text.push("float lt = dot(N, -L);");
		this.fragShader.text.push("float specular = pow(max(dot(R,E), 0.0), uShininess);");
		this.fragShader.text.push("float f = 40.0001;");
		this.fragShader.text.push("vec4 Id = diffuseMaterial * uDLightColor[i] * pow(lt, f * uCutOff);");
		this.fragShader.text.push("vec4 Is = uSpecularColor * uDLightSpecular[i] * specular;");
		this.fragShader.text.push("fColor += Id + Is;");
		this.fragShader.text.push("}");
		this.fragShader.text.push("#endif");
		this.fragShader.text.push("fColor += Ia;");
		this.fragShader.text.push("fColor[3] = uMaterialColor[3];");
		this.fragShader.text.push("return fColor;");
		this.fragShader.text.push("}");
		this.fragShader.text.push("vec4 goroud(void){");
		this.fragShader.text.push("vec4 color = vColor;");
		this.fragShader.text.push("if (uUseTextureKa == 1) {");
		this.fragShader.text.push("color = color * texture2D(uSamplerKa, vTextureCoords);");
		this.fragShader.text.push("} else if (uUseTextureKd == 1) {");
		this.fragShader.text.push("color = color  * texture2D(uSamplerKd, vTextureCoords);");
		this.fragShader.text.push("}");
		this.fragShader.text.push("return color;");
		this.fragShader.text.push("}");
		this.fragShader.text.push("void flatMode(void) {");
		this.fragShader.text.push("gl_FragColor = uMaterialColor;");
		this.fragShader.text.push("}");
		this.fragShader.text.push("#ifdef MAX_SHADOWS");
		this.fragShader.text.push("highp vec4 pack_depth( const in highp float depth ) {");
		this.fragShader.text.push("const highp vec4 bit_shift = vec4( 256.0 * 256.0 * 256.0, 256.0 * 256.0, 256.0, 1.0 );");
		this.fragShader.text.push("const highp vec4 bit_mask  = vec4( 0.0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0 );");
		this.fragShader.text.push("highp vec4 res = fract( depth * bit_shift );");
		this.fragShader.text.push("res -= res.xxyz * bit_mask;");
		this.fragShader.text.push("return res;");
		this.fragShader.text.push("}");
		this.fragShader.text.push("highp vec4 pack_depth2 (highp float depth)");
		this.fragShader.text.push("{");
		this.fragShader.text.push("const highp vec4 bias = vec4(1.0 / 255.0,");
		this.fragShader.text.push("1.0 / 255.0,");
		this.fragShader.text.push("1.0 / 255.0,");
		this.fragShader.text.push("0.0);");
		this.fragShader.text.push("highp float r = depth;");
		this.fragShader.text.push("highp float g = fract(r * 255.0);");
		this.fragShader.text.push("highp float b = fract(g * 255.0);");
		this.fragShader.text.push("highp float a = fract(b * 255.0);");
		this.fragShader.text.push("highp vec4 colour = vec4(r, g, b, a);");
		this.fragShader.text.push("return colour - (colour.yzww * bias);");
		this.fragShader.text.push("}");
		this.fragShader.text.push("highp float unpack_depth( const in highp vec4 rgba_depth ) {");
		this.fragShader.text.push("const highp vec4 bit_shift = vec4( 1.0 / ( 256.0 * 256.0 * 256.0 ), 1.0 / ( 256.0 * 256.0 ), 1.0 / 256.0, 1.0 );");
		this.fragShader.text.push("highp float depth = dot( rgba_depth, bit_shift );");
		this.fragShader.text.push("return depth;");
		this.fragShader.text.push("}");
		this.fragShader.text.push("highp float unpack_depth2 (highp vec4 colour)");
		this.fragShader.text.push("{");
		this.fragShader.text.push("const highp vec4 bitShifts = vec4(");
		this.fragShader.text.push("1.0,");
		this.fragShader.text.push("1.0 / 255.0,");
		this.fragShader.text.push("1.0 / (255.0 * 255.0),");
		this.fragShader.text.push("1.0 / (255.0 * 255.0 * 255.0)");
		this.fragShader.text.push(");");
		this.fragShader.text.push("return dot(colour, bitShifts);");
		this.fragShader.text.push("}");
		this.fragShader.text.push("void depthMap(void) {");
		this.fragShader.text.push("if (uShadowEnabled == TRUE) {");
		this.fragShader.text.push("gl_FragColor  = pack_depth2( gl_FragCoord.z );");
		this.fragShader.text.push("} else  {");
		this.fragShader.text.push("gl_FragColor = pack_depth2( 1.0 );");
		this.fragShader.text.push("}");
		this.fragShader.text.push("}");
		this.fragShader.text.push("vec4 shadowMapping(vec4 color) {");
		this.fragShader.text.push("highp float visibility = 1.0;");
		this.fragShader.text.push("for (int i = 0; i < MAX_SHADOWS; i++) {");
		this.fragShader.text.push("if (i >= uShadowCount) break;");
		this.fragShader.text.push("//BEGIN:shadowmap code");
		this.fragShader.text.push("highp float bias = 0.0000000000000000000000001;");
		this.fragShader.text.push("highp vec3 shadowCoordZDivide = shadowPosition[i].xyz/shadowPosition[i].w;");
		this.fragShader.text.push("highp vec4 rgba_depth;");
		this.fragShader.text.push("if (i==0){");
		this.fragShader.text.push("rgba_depth = texture2D(uDepthSampler0, shadowCoordZDivide.xy );");
		this.fragShader.text.push("} else if (i == 1) {");
		this.fragShader.text.push("rgba_depth = texture2D(uDepthSampler1, shadowCoordZDivide.xy );");
		this.fragShader.text.push("} else if (i == 2) {");
		this.fragShader.text.push("rgba_depth = texture2D(uDepthSampler2, shadowCoordZDivide.xy);");
		this.fragShader.text.push("}");
		this.fragShader.text.push("//highp float depth = unpack_depth( rgba_depth );");
		this.fragShader.text.push("highp float depth = unpack_depth2( rgba_depth );");
		this.fragShader.text.push("if(shadowPosition[i].w > 0.1)");
		this.fragShader.text.push("{");
		this.fragShader.text.push("if( (shadowCoordZDivide.z) > (depth - bias) )");
		this.fragShader.text.push("{");
		this.fragShader.text.push("visibility *= 0.5;");
		this.fragShader.text.push("}");
		this.fragShader.text.push("}");
		this.fragShader.text.push("//END:shadowmap code");
		this.fragShader.text.push("}");
		this.fragShader.text.push("return vec4(color.rgb * visibility, color.a);");
		this.fragShader.text.push("}");
		this.fragShader.text.push("#endif");
		this.fragShader.text.push("void main(void) {");
		this.fragShader.text.push("if (shaderType == 1) {");
		this.fragShader.text.push("gl_FragColor = goroud();");
		this.fragShader.text.push("} else if (shaderType == 2) {");
		this.fragShader.text.push("gl_FragColor = phong();");
		this.fragShader.text.push("} else if (shaderType == 3) {");
		this.fragShader.text.push("#ifdef MAX_SHADOWS");
		this.fragShader.text.push("depthMap();");
		this.fragShader.text.push("#endif");
		this.fragShader.text.push("} else if (shaderType == 4) {");
		this.fragShader.text.push("#ifdef MAX_SHADOWS");
		this.fragShader.text.push("gl_FragColor = shadowMapping(goroud());");
		this.fragShader.text.push("#endif");
		this.fragShader.text.push("} else if (shaderType == 5) {");
		this.fragShader.text.push("#ifdef MAX_SHADOWS");
		this.fragShader.text.push("gl_FragColor = shadowMapping(phong());");
		this.fragShader.text.push("#endif");
		this.fragShader.text.push("} else {");
		this.fragShader.text.push("flatMode();");
		this.fragShader.text.push("}");
		this.fragShader.text.push("}");
        this.updateGlobalValues();
	}
	return this;
}

var jsgcol = jsgcol || {};

jsgcol.ArrayMap = function(){
	this.keys = {};
	this.data = [];
	this.next = [0];
	this.keyList = [];
	this.p = 0;

	this.clear = function(){
		this.keys = {};
		this.data = [];
		this.next = [0];
		this.keyList = [];
		this.p = 0;
	}

	this.hasKey = function(key) {
		return this.keys.hasOwnProperty(key);
	}
	
	this.shiftNext = function() {
		if (this.p == 0) {
			this.next[this.p]++;
		} else {
			this.next.pop();
			this.p--;
		}
	}

	this.getNext = function(){
		return this.next[this.p];
	}	

	this.getIndex = function(key) {
		if (this.keys.hasOwnProperty(key) && this.keys[key] != null){
			return this.keys[key];
		} 
		
		return -1;
	}

	this.isActive = function(idx){
		return this.data[idx] != null;
	}	

	this.forEach = function(callback){
		var keys = this.getKeys();
		for (k in keys){
			callback(this.data[k]);
		}
	}
	
	this.getKeys = function(){
		return this.keyList;
	}

	this.get = function(key) {
		var idx = this.getIndex(key);
		if (idx >= 0) {
			return this.data[idx];
		}
		return null;
	}

	this.size = function() {
		return this.data.length;
	}

	this.put = function(key, obj){
		if (key) {
			var idx = this.getIndex(key);
			if ( idx >= 0) {
				this.data[idx] = obj;
			} else {
				idx = this.getNext();
				this.shiftNext(); 
				if (idx >= this.data.length) {
					this.data.push(obj);
				} else {
					this.data[idx] = obj;
				}
				this.keys[key] = idx;
				this.keyList.push(key);
			}
		} else {
			throw new Error("Invalid Key: " + key);
		}
	}

	this.remove = function(key){
		var idx = this.getIndex(key);
		var obj;
		if (idx >= 0){
			this.keys[key] = undefined;
			obj = this.data[idx];
			this.data[idx] = undefined;
			this.next.push(idx);
			idx = this.keyList.indexOf(key);
			this.keyList.splice(idx, 1);
			this.p++;
		}
		return obj;
	}
}

var jsgutils = jsgutils || {}
 
jsgutils.Point2D = function(x, y) {
	this.x = x;
	this.y = y;
};

jsgutils.Vector2D = function(x, y) {
				this.x = x;
			this.y = y;
		
			this.size = function() {
				return Math.sqrt(this.x * this.x + this.y * this.y);
			};

			this.add = function(other) {
				this.x += other.x;
				this.y += other.y;
				return this;
			};
			
			this.sub = function(other){
				this.y -= other.y;
				this.x -= other.x;
				return this;
			};

			this.scale = function(k) {
				this.x *= k;
				this.y *= k;
				return this;
			};
	
			this.scale2 = function(kx, ky) {
				this.x *= kx;
				this.y *= ky;
				return this;
			}
			this.normalize = function() {
				var s = this.size();
				this.x = x/this.size();
				this.y = y/this.size();
				return this;
			};
			this.angle = function() { return Math.atan2(y, x); };
			this.rotate = function(angle) {
				var s = Math.sin(angle);
				var c = Math.cos(angle);
				var nx = this.x * c - this.y * s;
				var ny = this.y * s + this.y * c;
				this.x = nx;
				this.y = ny;			
				return this;
			};

			this.dot = function (other) {
				return this.x * other.x + this.y * other.y;
			}
};	

jsgutils.newVector2DBySizeAngle = function(size, angle) {
		return new jsgutils.Vector2D(Math.cos(angle) * size, Math.sin(angle) * size);
}

jsgutils.area2 = function (a, b, c) {
	return (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x); 
}; //retorna Area(ABC) * 2: > 0 se anti-horario; < 0 se horário

jsgutils.area2v = function (a, b, c) {
	return (a[0] - c[0]) * (b[1] - c[1]) - (a[1] - c[1]) * (b[0] - c[0]); 
}; //retorna Area(ABC) * 2: > 0 se anti-horario; < 0 se horário

jsgutils.containsv = function(a, b, c, p){
	return (jsgutils.area2v(a, b, c) >= 0 && 
			jsgutils.area2v(a, b, p) >= 0 &&
			jsgutils.area2v(b, c, p) >= 0 &&
			jsgutils.area2v(c, a, p) >= 0) || 
		   (jsgutils.area2v(a, b, c) <= 0 && 
			jsgutils.area2v(a, b, p) <= 0 &&
			jsgutils.area2v(b, c, p) <= 0 &&
			jsgutils.area2v(c, a, p) <= 0);
};


jsgutils.contains = function(a, b, c, p){
	return (jsgutils.area2(a, b, c) >= 0 && 
			jsgutils.area2(a, b, p) >= 0 &&
			jsgutils.area2(b, c, p) >= 0 &&
			jsgutils.area2(c, a, p) >= 0) || 
		   (jsgutils.area2(a, b, c) <= 0 && 
			jsgutils.area2(a, b, p) <= 0 &&
			jsgutils.area2(b, c, p) <= 0 &&
			jsgutils.area2(c, a, p) <= 0);

};

jsgutils.insidePolygon = function(p, pol){
	var n = pol.length, j = n - 1,
			b = false, x = p.x, y = p.y;
			
	for (i = 0; i < n; i++) {
		if (pol[j].y <= y && y < pol[i].y &&
			jsgutils.area2(pol[j], pol[i], p) > 0 ||
			pol[i].y <= y && y <= pol[j].y &&
			jsgutils.area2(pol[i], pol[j], p) > 0) b = !b;
		j = i; 
	}
	return b;
}

jsgutils.insidePolygonv = function(p, pol){
	var n = pol.length, j = n - 1,
			b = false, x = p[0], y = p[1];
			
	for (i = 0; i < n; i++) {
		if (pol[j][1] <= y && y < pol[i][1] &&
			jsgutils.area2v(pol[j], pol[i], p) > 0 ||
			pol[i][1] <= y && y <= pol[j][1] &&
			jsgutils.area2v(pol[i], pol[j], p) > 0) b = !b;
		j = i; 
	}
	return b;
}

jsgutils.projectionOnSegment = function(a, b, p){
	var vx = b.x - a.x, vy = b.y - a.y, len2 = vx * vx + vy * vy,
		inprod = vx * (p.x - a.x) + vy * (p.y - a.y);
		return new jsgutils.Point2D(a.x + inprod * vx/len2, a.y + inprod * vy/len2);
}

jsgutils.projectionOnLine = function(a, b, h, p) {
	var d = p.x * a + p.y * b - h;
	return new jsgutils.Point2D(p.x - d * a, p.y - d * b); 
}

jsgutils.Vector3D = function(x, y, z) {
			this.x = x;
			this.y = y;
			this.z = z;
		
			this.size = function() {
				return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
			};

			this.add = function(other) {
				this.x += other.x;
				this.y += other.y;
				this.z += other.z;
				return this;
			};
			
			this.sub = function(other){
				this.x -= other.x;
				this.y -= other.y;
				this.z -= other.z;
				return this;
			};

			this.scale = function(k) {
				this.x *= k;
				this.y *= k;
				this.z *= k;
				return this;
			};
	
			this.scale3 = function(kx, ky, kz) {
				this.x *= kx;
				this.y *= ky;
				this.z *= kz;
				return this;
			}
			
			this.normalize = function() {
				var s = this.size();
				if (s==0) s = 0.00001;
				this.x = this.x/s;
				this.y = this.y/s;
				this.z = this.z/s;
				return this;
			};
			
			this.dot = function (other) {
				return this.x * other.x + this.y * other.y + this.z * other.z;
			}
			
			this.prod = function(other) {
				return new jsgutils.Vector3D(this.y * other.z - this.z * other.y,
											  this.z * other.x - this.x * other.z,
											  this.x * other.y - this.y * other.x);
			}
			
			this.copy = function() {
				return new jsgutils.Vector3D(this.x, this.y, this.z);
			}

			this.toArray3 = function(){
				return [this.x, this.y, this.z];
			}
			
			this.toArray4 = function() {
				return [this.x, this.y, this.z, 1.0];
			}
};	


jsgutils.Vector3D.equals = function(v1, v2) {
	return v1[0] == v2[0] && v1[1] == v2[1] && v1[2] == v2[2];
}

jsgutils.Vector3D.fromArray = function(a){
	return new jsgutils.Vector3D(a[0], a[1], a[2]);
};

jsgutils.Point3D = function(x, y, z) {
	this.x = x;
	this.y = y;
	this.z = z;
	this.AsArray = function() {
		return [this.x, this.y, this.z];
	}
	
	this.asVector3D = function() {
		return new jsgutils.Vector3D(this.x, this.y, this.z, 1.0);
	}
};

jsgutils.arrayAsPoint3D = function(v) {
	new jsgutils.Point3D(v[0], v[1], v[2]);
}

jsgutils.getTextResource = function(resource, onSuccess, onError,type) {
	var request = new XMLHttpRequest();
	type = type || "GET"; 
	request.onreadystatechange = function() {
		if (request.readyState == 4){
			if (request.status == 200 || (request.status == 0 && document.domain.length == 0)){
				onSuccess(request.responseText);
			} else {
				onError(request.status);
			}
		}
	};
	request.open(type, resource, true);
	request.send(null);
};

jsgutils.calcNormal = function(v, normalize){
	var v1 = new jsgutils.Vector3D(v[2][0]-v[1][0], v[2][1] - v[1][1], v[2][2] - v[1][2]);
	var v2 = new jsgutils.Vector3D(v[0][0]-v[1][0], v[0][1] - v[1][1], v[0][2] - v[1][2]);
	if (normalize)
		return v1.prod(v2).normalize();
	else
		return v1.prod(v2);
};


jsgutils.calcNormals = function(vertices, indices) {
	var normals = new Array(vertices.length);	
	for (var f = 0; f < indices.length; f += 3) {
		var i = indices[f], j = indices[f+1]; k = indices[f+2];
		var t = [i, j, k];
		var triangle = [];
		for (var k = 0; k < t.length; k++) {
			var v = t[k];
			var vertex = [];
			for (var l = 0; l < 3; l++) {
				var idx = v * 3 + l;
				normals[idx] = normals[idx] || 0.0;
				vertex.push(vertices[idx]);
			}
			triangle.push(vertex);
		}

		for (var k = 0; k < t.length; k++) {
			var o = [triangle[k], triangle[((k+1) % 3)], triangle[( (k+2) % 3 )] ];
			var N = jsgutils.calcNormal(o).toArray3();
			var v = t[k];
			for (var l = 0; l < 3; l++) {
				var idx = v * 3 + l;
				normals[idx] += N[l];
			}	
		}		
	}

	for (var f = 0; f < normals.length; f += 3) {
		var s = Math.sqrt(normals[f]*normals[f] + normals[f+1]*normals[f+1] + normals[f+2]*normals[f+2]);
		if (s == 0) s = 0.00001;
		normals[f] = normals[f]/s;
		normals[f+1] = normals[f+1]/s;
		normals[f+2] = normals[f+2]/s;
	}
	
	return normals;
};
