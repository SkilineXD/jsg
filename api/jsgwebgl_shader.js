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

