var jsggl = jsggl || {};

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

jsggl.ShaderCode = function(jsg){
	this.jsg = jsg;
	this.vertexShader = new jsggl.Shader();
	this.fragShader = new jsggl.Shader();
	this.localmap = new jsggl.ShaderMap();
	this.globalmap = new jsggl.ShaderMap();
	this.USE_EXP_DIFFUSE_CUTOFF = true;
	this.diffuseCutOffExpoent = 40.0;
	this.maxLights = 4;

	var uniform1i = function(jsg, p, value){ jsg.gl.uniform1i(p, value); };
	var uniform1f = function(jsg, p, value){ jsg.gl.uniform1f(p, value); }
	var uniform3fv = function(jsg, p, value){ jsg.gl.uniform3fv(p, value); };
	var uniform4fv = function(jsg, p, value){jsg.gl.uniform4fv(p, value);};	
	var uniformMatrix4fv = function(jsg, p, value){ jsg.gl.uniformMatrix4fv(p, false, value); };
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
	
	this.localmap.newStateMap("MATERIAL_COLOR", uniform4fv, "uMaterialColor", [0.0, 0.0, 0.0, 1.0]);
	this.localmap.newStateMap("SPECULAR_COLOR", uniform4fv, "uSpecularColor", [0.0, 0.0, 0.0, 1.0]);
	this.localmap.newStateMap("SHININESS", uniform1f, "uShininess", 100.0);
	this.localmap.newStateMap("PROJECTION_MATRIX", uniformMatrix4fv, "uPMatrix", mat4.identity(mat4.create()));
	this.localmap.newStateMap("MODELVIEW_MATRIX", uniformMatrix4fv, "uMVMatrix", mat4.identity(mat4.create()));
	this.localmap.newStateMap("NORMAL_MATRIX", uniformMatrix4fv, "uNMatrix", mat4.identity(mat4.create()));
	this.localmap.newStateMap("LIGHT_MATRIX", uniformMatrix4fv, "uLMatrix", mat4.identity(mat4.create()));
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
	
	this.load = function() {
		this.localmap.load(this.jsg);
		this.globalmap.load(this.jsg);
	}
	
	this.updateGlobalValues = function() {
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
	}
	
	this.setGlobalValues = function(){
		this.updateGlobalValues();
		this.globalmap.setValues(jsg);
	}
	
	this.updateLocalValues = function() {
		var jsg = this.jsg;
		var localmap = this.localmap;
		localmap.setProperty("MATERIAL_COLOR", jsg.materialColor);
		localmap.setProperty("PROJECTION_MATRIX", jsg.getProjection());
		localmap.setProperty("MODELVIEW_MATRIX", jsg.getModelView());
		localmap.setProperty("NORMAL_MATRIX", jsg.normalMatrix);
		localmap.setProperty("LIGHT_MATRIX", jsg.lightMatrix);
		localmap.setProperty("TEX_POSITION", jsg.currentTexPosition);
		localmap.setProperty("VERTEX_POSITION", jsg.currentVertexPosition);
		localmap.setProperty("VERTEX_NORMAL", jsg.currentVertexNormal);
		localmap.setProperty("SPECULAR_COLOR", jsg.specularColor);
		localmap.setProperty("SHININESS", jsg.shininess);
		localmap.setProperty("AMBIENT_COLOR", jsg.ambientColor);
		localmap.setProperty("DIFFUSE_CUTOFF", jsg.diffuseCutOff);
		localmap.setProperty("USE_TEXTUREKA", jsg.useTextureKa || false);
		localmap.setProperty("USE_TEXTUREKD", jsg.useTextureKd || false);
		localmap.setProperty("TEX_SAMPLERKA", jsg.texSamplerKa || 0);
		localmap.setProperty("TEX_SAMPLERKD", jsg.texSamplerKd || 0);
        localmap.setProperty("SHADER_TYPE", jsg.shaderType || 1);
	}
	
	this.setLocalValues = function() {
		this.updateLocalValues();
		this.localmap.setValues(jsg);
	}

	this.build = function() {
		var totalLights = jsg.positionalLightQtd + jsg.directionalLightQtd;
		if (totalLights > this.maxLights) {
			throw new Error("Light quantity limit is " + this.maxLights + ", but " + totalLights + " lights was found." );
		}
		this.vertexShader.text.push("const int MAX_POS_LIGHTS = "+ jsg.positionalLightQtd + ";");
		this.vertexShader.text.push("const int MAX_DIR_LIGHTS = " + jsg.directionalLightQtd + ";");
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
		this.vertexShader.text.push("uniform vec3 uLightPosition[MAX_POS_LIGHTS];");
		this.vertexShader.text.push("uniform vec4 uLightSpecular[MAX_POS_LIGHTS];");
		this.vertexShader.text.push("uniform	vec4 uPLightColor[MAX_POS_LIGHTS];");
		this.vertexShader.text.push("uniform vec3 uLightPositionDir[MAX_POS_LIGHTS];");
		this.vertexShader.text.push("uniform int shaderType;");
		this.vertexShader.text.push("uniform vec3 uLightDirection[MAX_DIR_LIGHTS];");
		this.vertexShader.text.push("uniform	vec4 uDLightColor[MAX_DIR_LIGHTS];");
		this.vertexShader.text.push("uniform	vec4 uDLightSpecular[MAX_DIR_LIGHTS];");
		this.vertexShader.text.push("varying vec4 vColor;");
		this.vertexShader.text.push("varying vec2 vTextureCoords;");
		this.vertexShader.text.push("varying vec3 eyeVec;");
		this.vertexShader.text.push("varying vec3 vNormal;");
		this.vertexShader.text.push("varying vec3 lightdir[MAX_POS_LIGHTS];");
		this.vertexShader.text.push("void phong(void){");
		this.vertexShader.text.push("vec4 vertex = uMVMatrix * vec4(aVertexPos, 1.0);");
		this.vertexShader.text.push("eyeVec = -vertex.xyz;");
		this.vertexShader.text.push("vNormal = vec3(uNMatrix * vec4(aVertexNormal, 1.0));");
		this.vertexShader.text.push("for(int i = 0; i < MAX_POS_LIGHTS; i++){");
		this.vertexShader.text.push("vec4 pos = uLMatrix * vec4(uLightPosition[i], 1.0);");
		this.vertexShader.text.push("lightdir[i] = vertex.xyz - pos.xyz;");
		this.vertexShader.text.push("}");
		this.vertexShader.text.push("gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPos, 1.0);");
		this.vertexShader.text.push("vTextureCoords = aVertexTextureCoords;");
		this.vertexShader.text.push("}");
		this.vertexShader.text.push("void goroud(void){");
		this.vertexShader.text.push("vec4 vertex = uMVMatrix * vec4(aVertexPos, 1.0);");
		this.vertexShader.text.push("vec3 eyeVec = -vec3(vertex.xyz);");
		this.vertexShader.text.push("vec3 E = normalize(eyeVec);");
		this.vertexShader.text.push("vec4 Ia = uAmbientLight * uAmbientColor;");
		this.vertexShader.text.push("vColor = vec4(0.0, 0.0, 0.0, 1.0);");
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
		this.vertexShader.text.push("vec3 N = normalize(vec3(uNMatrix * vec4(aVertexNormal, 1.0)));");
		this.vertexShader.text.push("for(int i = 0; i < MAX_DIR_LIGHTS; i++){");
		this.vertexShader.text.push("vec3 L = normalize(uLightDirection[i]);");
		this.vertexShader.text.push("vec3 R = reflect(L, N);");
		this.vertexShader.text.push("float lt = dot(N, -L);");
		this.vertexShader.text.push("float specular = pow(max(dot(R,E), 0.0), uShininess);");
		this.vertexShader.text.push("float f = 40.0001;");
		this.vertexShader.text.push("vec4 Id = uMaterialColor * uPLightColor[i] * pow(lt, f * uCutOff);");
		this.vertexShader.text.push("vec4 Is = uSpecularColor * uDLightSpecular[i] * specular;");
		this.vertexShader.text.push("vColor += Id + Is;");
		this.vertexShader.text.push("}");
		this.vertexShader.text.push("vColor += Ia;");
		this.vertexShader.text.push("vColor[3] = uMaterialColor[3];");
		this.vertexShader.text.push("gl_Position = uPMatrix * vertex;");
		this.vertexShader.text.push("gl_PointSize = 1.0;");
		this.vertexShader.text.push("vTextureCoords = aVertexTextureCoords;");
		this.vertexShader.text.push("}");
		this.vertexShader.text.push("void shadowMapping(void){");
		this.vertexShader.text.push("vec4 vertex = uMVMatrix * vec4(aVertexPos, 1.0);");
		this.vertexShader.text.push("vColor = vec4(1.0, 1.0, 1.0, 1.0);");
		this.vertexShader.text.push("gl_Position = uPMatrix * vertex;");
		this.vertexShader.text.push("gl_PointSize = 1.0;");
		this.vertexShader.text.push("}");
		this.vertexShader.text.push("void flatMode(void){");
		this.vertexShader.text.push("vec4 vertex = uMVMatrix * vec4(aVertexPos, 1.0);");
		this.vertexShader.text.push("vColor = vec4(1.0, 1.0, 1.0, 1.0);");
		this.vertexShader.text.push("gl_Position = uPMatrix * vertex;");
		this.vertexShader.text.push("gl_PointSize = 1.0;");
		this.vertexShader.text.push("}");
		this.vertexShader.text.push("void main(void) {");
		this.vertexShader.text.push("if (shaderType == 1){");
		this.vertexShader.text.push("goroud();");
		this.vertexShader.text.push("} else if (shaderType == 2) {");
		this.vertexShader.text.push("phong();");
		this.vertexShader.text.push("} else if (shaderType == 3) {");
		this.vertexShader.text.push("shadowMapping();");
		this.vertexShader.text.push("} else {");
		this.vertexShader.text.push("flatMode();");
		this.vertexShader.text.push("}");
		this.vertexShader.text.push("}");
		this.fragShader.text.push("#ifdef GL_ES");
		this.fragShader.text.push("precision highp float;");
		this.fragShader.text.push("precision highp int;");
		this.fragShader.text.push("#endif");
		this.fragShader.text.push("const int MAX_POS_LIGHTS = "+ jsg.positionalLightQtd + ";");
		this.fragShader.text.push("const int MAX_DIR_LIGHTS = " + jsg.directionalLightQtd + ";");
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
		this.fragShader.text.push("uniform vec3 uLightPosition[MAX_POS_LIGHTS];");
		this.fragShader.text.push("uniform	vec4 uPLightColor[MAX_POS_LIGHTS];");
		this.fragShader.text.push("uniform vec4 uLightSpecular[MAX_POS_LIGHTS];");
		this.fragShader.text.push("uniform vec3 uLightPositionDir[MAX_POS_LIGHTS];");
		this.fragShader.text.push("uniform int shaderType;");
		this.fragShader.text.push("varying vec3 eyeVec;");
		this.fragShader.text.push("varying vec3 vNormal;");
		this.fragShader.text.push("varying vec3 lightdir[MAX_POS_LIGHTS];");
		this.fragShader.text.push("varying vec4 vColor;");
		this.fragShader.text.push("varying vec2 vTextureCoords;");
		this.fragShader.text.push("uniform vec3 uLightDirection[MAX_DIR_LIGHTS];");
		this.fragShader.text.push("uniform	vec4 uDLightColor[MAX_DIR_LIGHTS];");
		this.fragShader.text.push("uniform	vec4 uDLightSpecular[MAX_DIR_LIGHTS];");
		this.fragShader.text.push("void phong(void){");
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
		this.fragShader.text.push("vec3 N = normalize(vNormal);");
		this.fragShader.text.push("for(int i = 0; i < MAX_DIR_LIGHTS; i++){");
		this.fragShader.text.push("vec3 L = normalize(uLightDirection[i]);");
		this.fragShader.text.push("vec3 R = reflect(L, N);");
		this.fragShader.text.push("float lt = dot(N, -L);");
		this.fragShader.text.push("float specular = pow(max(dot(R,E), 0.0), uShininess);");
		this.fragShader.text.push("float f = 40.0001;");
		this.fragShader.text.push("vec4 Id = diffuseMaterial * uPLightColor[i] * pow(lt, f * uCutOff);");
		this.fragShader.text.push("vec4 Is = uSpecularColor * uDLightSpecular[i] * specular;");
		this.fragShader.text.push("fColor += Id + Is;");
		this.fragShader.text.push("}");
		this.fragShader.text.push("fColor += Ia;");
		this.fragShader.text.push("fColor[3] = uMaterialColor[3];");
		this.fragShader.text.push("gl_FragColor = fColor;");
		this.fragShader.text.push("}");
		this.fragShader.text.push("void goroud(void){");
		this.fragShader.text.push("vec4 color = vColor;");
		this.fragShader.text.push("if (uUseTextureKa == 1) {");
		this.fragShader.text.push("color = color * texture2D(uSamplerKa, vTextureCoords);");
		this.fragShader.text.push("} else if (uUseTextureKd == 1) {");
		this.fragShader.text.push("color = color  * texture2D(uSamplerKd, vTextureCoords);");
		this.fragShader.text.push("}");
		this.fragShader.text.push("gl_FragColor = color;");
		this.fragShader.text.push("}");
		this.fragShader.text.push("void shadowMapping(void){");
		this.fragShader.text.push("gl_FragColor = vColor;");
		this.fragShader.text.push("}");
		this.fragShader.text.push("void flatMode() {");
		this.fragShader.text.push("gl_FragColor = vColor;");
		this.fragShader.text.push("}");
		this.fragShader.text.push("void main(void) {");
		this.fragShader.text.push("if (shaderType == 1) {");
		this.fragShader.text.push("goroud();");
		this.fragShader.text.push("} else if (shaderType == 2) {");
		this.fragShader.text.push("phong();");
		this.fragShader.text.push("} else if (shaderType == 3) {");
		this.fragShader.text.push("shadowMapping();");
		this.fragShader.text.push("} else {");
		this.fragShader.text.push("flatMode();");
		this.fragShader.text.push("}");
		this.fragShader.text.push("}");
        this.updateGlobalValues();
	}
	return this;
}

jsggl.TextureRendering = function (jsg, w, h){
    this.frameBuffer;
    this.texture;
    this.renderBuffer;
    var gl = jsg.gl;
    this.width = w;
    this.height = h;
    
    this.build = function() {
        this.frameBuffer = gl.createFrameBuffer();
        this.texture = gl.createTexture();
        this.renderBuffer = gl.createRenderBuffer();
    }
    
    this.bind = function(){
        gl.bindFrameBuffer(gl.FRAMEBUFFER, this.frameBuffer);
        this.frameBuffer.width = this.width;
        this.frameBuffer.height = this.height;
        
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.framebuffer.width, this.framebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        
        gl.bindRenderBuffer(gl.RENDERBUFFER, this.renderBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.framebuffer.width, this.framebuffer.height);
        
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);
    }
    
    this.unbind = function() {
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);   
    }
}
