/**
* This file contains code of JavaScript Graphical Library for WebGL (JSGWebGL).
* JSGWebGL is free for non commercial propose.
* Author: Gilzamir Ferreira Gomes (Todos os direitos reservados)
* Date: jun/05/2013
*/

/* Add replaceAll method in String objects. 
* parameter de : source string.
* parameter para: target string.
* returns new string with replacement of parameter de by parameter para.
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

jsggl.ShaderFunction = function(name, returnType, paramNames, paramTypes) {
	this.name = name;
	this.returnType = returnType;
	this.paramsName = paramNames;
	this.paramsType = paramTypes;
	this.localDeclarations = [];	
	this.mainLogical = [];

	this.generateCode = function() {
		var code = this.returnType + "  " + this.name + "(";
		for (var i = 0; i < this.paramsName.length; i++) {
			code += this.paramTypes[i] + " " + paramsName[i];
			if (i < this.paramsName.length-1) code += ", ";
		}
		code += "){\n";
		for (var i = 0; i < this.localDeclarations.length;  i++) {
			code += this.localDeclarations[i] + "\n";
		}

		for (var i = 0; i < this.mainLogical.length;  i++) {
			code += this.mainLogical[i] + "\n";
		}

		code += "}\n";
		return code;
	}
}

jsggl.Shader = function(header, footer){
	this.header = header || "";
	this.globalDeclarations = [];
	this.localDeclarations = [];
	this.mainLogical = [];
	this.footer = footer || "";
	this.functions = [];

	this.generateCode = function(){
		var code = this.header;
		for (var i = 0; i < this.globalDeclarations.length; i++){
			code += this.globalDeclarations[i] + "\n";
		}
		

		for (var i = 0; i < this.functions.length; i++) {
			code += this.functions[i].generateCode() + "\n";
		}

		code += "void main(void){\n"
		for (var i = 0; i < this.localDeclarations.length; i++) {
			code += this.localDeclarations[i]+"\n";
		}
		
		for (var i = 0; i < this.mainLogical.length; i++) {
			code += this.mainLogical[i]+"\n";
		}
		
		code += "}\n";
		code += this.footer;
		return code;
	}
}

jsggl.DiffuseLight = function(name, direction, diffuseColor){
	this.name = name;
	this.direction = direction;
	this.diffuseColor = diffuseColor;
	this.globalDeclarations = [];
	this.mainLogical = [];

	this.globalDeclarations.push("uniform vec3 {name}uLightDirection;".replaceAll("{name}", name));	
	this.globalDeclarations.push("uniform vec4 {name}uLightDiffuse;".replaceAll("{name}", name));

	this.mainLogical.push("vec3 {name} = normalize({name}uLightDirection);".replaceAll("{name}", this.name));
	this.mainLogical.push("float {name}lambertTerm = clamp(dot(N, -{name}), 0.0, 1.0);".replaceAll("{name}", this.name));	
	this.mainLogical.push("vec4 {name}Id  = uMaterialDiffuse * {name}uLightDiffuse * {name}lambertTerm;".replaceAll("{name}", this.name));
	this.mainLogical.push("acm = acm + {name}Id;".replaceAll("{name}", this.name));

	this.uniforms = ["{name}uLightDiffuse".replaceAll("{name}", name), "{name}uLightDirection".replaceAll("{name}", name)];
	this.setValues = function(jsg) {
		jsg.gl.uniform4fv(jsg.program[this.uniforms[0]], this.diffuseColor);
		jsg.gl.uniform3fv(jsg.program[this.uniforms[1]], this.direction);	
	};
}

jsggl.PhongSpecularLight = function(name, shininess, specularColor, base){
	this.name = name;
	this.shininess = shininess;
	this.specularColor = specularColor;
	this.globalDeclarations = [];
	this.mainLogical = [];
	this.base = base || this;
	this.globalDeclarations.push("uniform float {name}uShininess;".replaceAll("{name}", name));	
	this.globalDeclarations.push("uniform vec4 {name}uLightSpecular;".replaceAll("{name}", name));


	this.mainLogical.push("vec3 {name}R = reflect({basename}, N);".replaceAll("{name}", this.name).replaceAll("{basename}", this.base.name));

	this.mainLogical.push("float {name}specular = pow(max(dot({name}R, E), 0.0), {name}uShininess );".replaceAll("{name}", this.name));

	this.mainLogical.push("vec4 {name}Is = {name}uLightSpecular * uMaterialSpecular * {name}specular;".replaceAll("{name}", this.name));

	this.mainLogical.push("acm = acm + {name}Is;".replace("{name}",this.name));

	this.uniforms = ["{name}uShininess".replaceAll("{name}", this.name), "{name}uLightSpecular".replaceAll("{name}", this.name)];

	this.setValues = function(jsg) {
		jsg.gl.uniform1f(jsg.program[this.uniforms[0]], this.shininess);
		jsg.gl.uniform4fv(jsg.program[this.uniforms[1]], this.specularColor);	
	};
}

jsggl.PhongShader = function(jsg){
	this.vertexShader = new jsggl.Shader();
	this.fragShader = new jsggl.Shader();
	this.lights = jsg.lights;
	this.uniforms = ["uMVMatrix", "uPMatrix","uNMatrix", "uMaterialDiffuse", "uLightAmbient", "uMaterialSpecular", "uMaterialAmbient"];

	this.setGlobalValues = function(jsg){
		for (var i in jsg.lights) {
			if (jsg.lights.hasOwnProperty(i)){
				jsg.lights[i].setValues(jsg);
			}
		}
		jsg.gl.uniform4fv(jsg.program.uLightAmbient, jsg.ambientLight);	 
	};

	this.setLocalValues = function(jsg) {
		jsg.gl.uniform4fv(jsg.program.uMaterialDiffuse, jsg.materialDiffuse);
		jsg.gl.uniform4fv(jsg.program.uMaterialSpecular, jsg.materialSpecular);
		jsg.gl.uniform4fv(jsg.program.uMaterialAmbient, jsg.materialAmbient);
   		jsg.gl.uniformMatrix4fv(jsg.program.uNMatrix, false, jsg.normalMatrix);
   		jsg.gl.uniformMatrix4fv(jsg.program.uPMatrix, false, jsg.projectionMatrix);
		jsg.gl.uniformMatrix4fv(jsg.program.uMVMatrix, false, jsg.modelViewMatrix);
	};

	this.attributes = ["aVertexPosition","aVertexNormal"]

	this.vertexShader.globalDeclarations.push("attribute vec3 aVertexPosition;");
	this.vertexShader.globalDeclarations.push("attribute vec3 aVertexNormal;");
	this.vertexShader.globalDeclarations.push("uniform mat4 uMVMatrix;");
	this.vertexShader.globalDeclarations.push("uniform mat4 uPMatrix;");
	this.vertexShader.globalDeclarations.push("uniform mat4 uNMatrix;");
	this.vertexShader.globalDeclarations.push("varying vec3 vNormal;");
	this.vertexShader.globalDeclarations.push("varying vec3 vEyeVec;");

	this.vertexShader.mainLogical.push("vec4 vertex = uMVMatrix * vec4(aVertexPosition, 1.0);");	
	this.vertexShader.mainLogical.push("vNormal = vec3(uNMatrix * vec4(aVertexNormal, 1.0));");
	this.vertexShader.mainLogical.push("vEyeVec = -vec3(vertex.xyz);");	
	this.vertexShader.mainLogical.push("gl_Position=uPMatrix*uMVMatrix*vec4(aVertexPosition,1.0);");


	this.fragShader.globalDeclarations.push("#ifdef GL_ES");
	this.fragShader.globalDeclarations.push("precision highp float;");
	this.fragShader.globalDeclarations.push("#endif");

	this.fragShader.globalDeclarations.push("uniform vec4 uLightAmbient;");
	this.fragShader.globalDeclarations.push("uniform vec4 uMaterialDiffuse;");
	this.fragShader.globalDeclarations.push("uniform vec4 uMaterialAmbient;");
	this.fragShader.globalDeclarations.push("uniform vec4 uMaterialSpecular;");
	this.fragShader.globalDeclarations.push("varying vec3 vNormal;");
	this.fragShader.globalDeclarations.push("varying vec3 vEyeVec;");

	this.fragShader.mainLogical.push("vec3 N = normalize(vNormal);");
	this.fragShader.mainLogical.push("vec4 Ia = uLightAmbient * uMaterialAmbient;");
	this.fragShader.mainLogical.push("vec4 acm = vec4(0.0, 0.0, 0.0, 1.0);");
	this.fragShader.mainLogical.push("vec3 E = normalize(vEyeVec);");

	for (var i in this.lights) {
		if (this.lights.hasOwnProperty(i)){
			var l = this.lights[i];
			var gd = l.globalDeclarations;
			var ml = l.mainLogical;
			for (var j = 0; j < gd.length; j++) {
				this.fragShader.globalDeclarations.push(gd[j]);
			}

			for (var j = 0; j < ml.length; j++) {
				this.fragShader.mainLogical.push(ml[j]);
			}
		}
	}
	this.fragShader.mainLogical.push("vec4 finalColor = Ia + acm;");	
	this.fragShader.mainLogical.push("finalColor.a = 1.0;");
	this.fragShader.mainLogical.push("gl_FragColor = finalColor;");
}

jsggl.GoraudShader = function(jsg){
	this.vertexShader = new jsggl.Shader();
	this.fragShader = new jsggl.Shader();
	this.lights = jsg.lights;
	this.uniforms = ["uMVMatrix", "uPMatrix","uNMatrix", "uMaterialDiffuse", "uLightAmbient", "uMaterialSpecular", "uMaterialAmbient"];

	this.setGlobalValues = function(jsg){
		for (var i in jsg.lights) {
			if (jsg.lights.hasOwnProperty(i)){
				jsg.lights[i].setValues(jsg);
			}
		}
		jsg.gl.uniform4fv(jsg.program.uLightAmbient, jsg.ambientLight);	 
	};

	this.setLocalValues = function(jsg) {
		jsg.gl.uniform4fv(jsg.program.uMaterialDiffuse, jsg.materialDiffuse);
		jsg.gl.uniform4fv(jsg.program.uMaterialSpecular, jsg.materialSpecular);
		jsg.gl.uniform4fv(jsg.program.uMaterialAmbient, jsg.materialAmbient);
   		jsg.gl.uniformMatrix4fv(jsg.program.uNMatrix, false, jsg.normalMatrix);
   		jsg.gl.uniformMatrix4fv(jsg.program.uPMatrix, false, jsg.projectionMatrix);
		jsg.gl.uniformMatrix4fv(jsg.program.uMVMatrix, false, jsg.modelViewMatrix);
	};

	this.attributes = ["aVertexPosition","aVertexNormal"]

	this.vertexShader.globalDeclarations.push("attribute vec3 aVertexPosition;");
	this.vertexShader.globalDeclarations.push("attribute vec3 aVertexNormal;");
	this.vertexShader.globalDeclarations.push("uniform mat4 uMVMatrix;");
	this.vertexShader.globalDeclarations.push("uniform mat4 uPMatrix;");
	this.vertexShader.globalDeclarations.push("uniform mat4 uNMatrix;");
	this.vertexShader.globalDeclarations.push("uniform vec4 uLightAmbient;");
	this.vertexShader.globalDeclarations.push("uniform vec4 uMaterialDiffuse;");
	this.vertexShader.globalDeclarations.push("uniform vec4 uMaterialAmbient;");
	this.vertexShader.globalDeclarations.push("uniform vec4 uMaterialSpecular;");
	this.vertexShader.globalDeclarations.push("varying vec4 vFinalColor;");

	this.vertexShader.mainLogical.push("vec3 N = vec3(uNMatrix * vec4(aVertexNormal, 1.0));");
	this.vertexShader.mainLogical.push("vec4 Ia = uLightAmbient * uMaterialAmbient;");
	this.vertexShader.mainLogical.push("vec4 acm = vec4(0.0, 0.0, 0.0, 1.0);");		
	this.vertexShader.mainLogical.push("vec4 vertex = uMVMatrix * vec4(aVertexPosition, 1.0);");	
	this.vertexShader.mainLogical.push("vec3 eyeVec = -vec3(vertex.xyz);");	
	this.vertexShader.mainLogical.push("vec3 E = normalize(eyeVec);");

	for (var i in this.lights) {
		if (this.lights.hasOwnProperty(i)){
			var l = this.lights[i];
			var gd = l.globalDeclarations;
			var ml = l.mainLogical;
			for (var j = 0; j < gd.length; j++) {
				this.vertexShader.globalDeclarations.push(gd[j]);
			}
	
			for (var j = 0; j < ml.length; j++) {
				this.vertexShader.mainLogical.push(ml[j]);
			}
		}
	}
	
	this.vertexShader.mainLogical.push("vFinalColor = Ia + acm;");
	this.vertexShader.mainLogical.push("vFinalColor.a = 1.0;");
	this.vertexShader.mainLogical.push("gl_Position=uPMatrix*uMVMatrix*vec4(aVertexPosition,1.0);");

	this.fragShader.globalDeclarations.push("#ifdef GL_ES");
	this.fragShader.globalDeclarations.push("precision highp float;");
	this.fragShader.globalDeclarations.push("#endif");
	this.fragShader.globalDeclarations.push("varying vec4 vFinalColor;");
	this.fragShader.mainLogical.push("gl_FragColor = vFinalColor;");
}


jsggl.JsgGl = function(id){
	this.id = id;

	this.ambientLight = [0.01,0.01,0.01,1.0];

	this.materialDiffuse = [0.1,0.5,0.8,1.0];
	this.materialAmbient = [0.001, 0.001, 0.001, 1.0];
	this.materialSpecular = [1.0, 1.0, 1.0, 1.0];

	this.lights = {};
	//this.lights["L"] = new jsggl.DiffuseLight("L", [-1.0, 0.0, -1.0], [0.5,0.5,0.5,1.0]);
	//this.lights["G"]  = new jsggl.PhongSpecularLight('G', 1.0, [1.0, 1.0, 1.0, 1.0], this.lights["L"]);	

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
	this.projectionMatrix = mat4.create();
	mat4.identity(this.projectionMatrix);
	this.modelViewMatrix = mat4.create();
	mat4.identity(this.modelViewMatrix);

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
				this.display();
				window.requestAnimationFrame(mainLoop);
			} else {
				this.finalize();
			}
	};
	
	this.mainLoop = mainLoop;
}

jsggl.JsgGl.prototype = {
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

		for (var i in this.lights) {
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

jsggl.Drawable = function(name, jsggl){	
	this.vertices = [];
	this.indices = [];
	this.name = name;
	this.vboName = "";
	this.idoName = "";
	this.gl = jsggl.gl;
	this.jsg = jsggl;
	this.vertexBuffer = undefined;
	this.indexBuffer = undefined;
	this.normalsBuffer = undefined;
	this.renderingmode = this.gl.LINES;
	this.materialDiffuse = [0.1,0.5,0.8,1.0];
	this.material = [0.001, 0.001, 0.001, 1.0];
	this.materialSpecular = [1.0, 1.0, 1.0, 1.0];
}

jsggl.Drawable.prototype = {
	init: function() {
		this.vertexBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.STATIC_DRAW);

		this.indexBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.STATIC_DRAW);


		this.normals = jsgutils.calcNormals(this.vertices, this.indices);
   		
   		this.normalsBuffer = this.gl.createBuffer();
    		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalsBuffer);
    		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.normals), this.gl.STATIC_DRAW);
		
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
		this.gl.enableVertexAttribArray(prg.aVertexPosition);
		this.gl.enableVertexAttribArray(prg.aVertexNormal);
		
		var pMatrix = jsg.projectionMatrix;
		var mvMatrix = jsg.modelViewMatrix;
		var nMatrix = mat4.create();
		
    		mat4.set(mvMatrix, nMatrix);
    		mat4.inverse(nMatrix);
    		mat4.transpose(nMatrix);
		
		this.jsg.normalMatrix = nMatrix;
		this.jsg.materialDiffuse = this.materialDiffuse;
		this.jsg.materialAmbient = this.material;
		this.jsg.materialSpecular = this.materialSpecular;

		this.jsg.shader.setLocalValues(this.jsg);
    				
    		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    		this.gl.vertexAttribPointer(prg.aVertexPosition, 3, this.gl.FLOAT, false, 0, 0);

    		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalsBuffer);
    		this.gl.vertexAttribPointer(prg.aVertexNormal, 3, this.gl.FLOAT, false, 0, 0);

    		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    		this.gl.drawElements(this.getRenderingMode(), this.indices.length, this.gl.UNSIGNED_SHORT, 0);
			    			
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
	}
}

