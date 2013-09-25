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
		//LOAD_SHADERS, 2
        	this.updateGlobalValues();
	}
	return this;
}

