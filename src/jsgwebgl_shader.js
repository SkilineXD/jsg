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
					//alert(k + " : " + varname + " : " +  value);	
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

jsggl.GoraudShader = function(jsg){
	this.jsg = jsg;
	this.vertexShader = new jsggl.Shader();
	this.fragShader = new jsggl.Shader();
	this.localmap = new jsggl.ShaderMap();
	this.globalmap = new jsggl.ShaderMap();
	this.maxLights = 4;

	var pj = mat4.create();
	var mv = mat4.create();
	var nm = mat4.create();

	var uniform1i = function(jsg, p, value){ jsg.gl.uniform1i(p, value); };
	var uniform1f = function(jsg, p, value){ jsg.gl.uniform1f(p, value); }
	var uniform3fv = function(jsg, p, value){ jsg.gl.uniform3fv(p, value); };
	var uniform4fv = function(jsg, p, value){jsg.gl.uniform4fv(p, value);};	
	var uniformMatrix4fv = function(jsg, p, value){ jsg.gl.uniformMatrix4fv(p, false, value); };
	var attr = function(jsg, p, value) {
			jsg.gl.enableVertexAttribArray(p);
    		jsg.gl.bindBuffer(jsg.gl.ARRAY_BUFFER, value);
    		jsg.gl.vertexAttribPointer(p, 3, jsg.gl.FLOAT, false, 0, 0);
	};
		
	this.globalmap.newStateMap("POSITIONAL_LIGHT_QTD", uniform1i, "uPosLights", 0);
	this.globalmap.newStateMap("DIRECTIONAL_LIGHT_QTD", uniform1i, "uDirLights", 0);
	this.globalmap.newStateMap("AMBIENT_COLOR", uniform4fv, "uAmbientColor", [0.0, 0.0, 0.0, 1.0]);
	this.globalmap.newStateMap("POS_LIGHT_COLOR", uniform4fv, "uPLightColor", []);
	this.globalmap.newStateMap("DIR_LIGHT_COLOR", uniform4fv, "uDLightColor", []);
	this.globalmap.newStateMap("LIGHT_POSITION", uniform3fv, "uLightPosition");
	this.globalmap.newStateMap("LIGHT_DIRECTION", uniform3fv, "uLightDirection");
	this.globalmap.newStateMap("SPECULAR_LIGHT", uniform4fv, "uLightSpecular");
	this.globalmap.newStateMap("DIR_SPECULAR_LIGHT", uniform4fv, "uDLightSpecular");
	
	this.localmap.newStateMap("MATERIAL_COLOR", uniform4fv, "uMaterialColor", [0.0, 0.0, 0.0, 1.0]);
	this.localmap.newStateMap("SPECULAR_COLOR", uniform4fv, "uSpecularColor", [0.0, 0.0, 0.0, 1.0]);
	this.localmap.newStateMap("SHININESS", uniform1f, "uShininess", 100.0);
	this.localmap.newStateMap("PROJECTION_MATRIX", uniformMatrix4fv, "uPMatrix", pj);
	this.localmap.newStateMap("MODELVIEW_MATRIX", uniformMatrix4fv, "uMVMatrix", mv);
	this.localmap.newStateMap("NORMAL_MATRIX", uniformMatrix4fv, "uNMatrix", nm);
	this.localmap.newStateMap("VERTEX_POSITION", attr, "aVertexPos", null, jsggl.ShaderMap.ATTRIBUTE);
	this.localmap.newStateMap("VERTEX_NORMAL", attr, "aVertexNormal", null, jsggl.ShaderMap.ATTRIBUTE);
	
	this.load = function() {
		this.localmap.load(this.jsg);
		this.globalmap.load(this.jsg);
	}
	
	this.updateGlobalValues = function() {
		var jsg = this.jsg;
		var globalmap = this.globalmap;
		globalmap.setProperty("AMBIENT_COLOR", jsg.ambientColor);
		globalmap.setProperty("POSITIONAL_LIGHT_QTD", jsg.positionalLightQtd);
		globalmap.setProperty("DIRECTIONAL_LIGHT_QTD", jsg.directionalLightQtd);
		globalmap.setProperty("POS_LIGHT_COLOR", jsg.pLightColor);
		globalmap.setProperty("DIR_LIGHT_COLOR", jsg.dLightColor);
		globalmap.setProperty("LIGHT_DIRECTION", jsg.lightDirection);
		globalmap.setProperty("LIGHT_POSITION", jsg.lightPosition);
		globalmap.setProperty("SPECULAR_LIGHT", jsg.specularLight);
		globalmap.setProperty("DIR_SPECULAR_LIGHT", jsg.directionalSpecularLight);
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
		localmap.setProperty("VERTEX_POSITION", jsg.currentVertexPosition);
		localmap.setProperty("VERTEX_NORMAL", jsg.currentVertexNormal);
		localmap.setProperty("SPECULAR_COLOR", jsg.specularColor);
		localmap.setProperty("SHININESS", jsg.shininess);
	}
	
	this.setLocalValues = function() {
		this.updateLocalValues();
		this.localmap.setValues(jsg);
	}
	
	this.build = function() {
		var totalLights = jsg.positionalLightQtd + jsg.directionalLightQtd;
		if (totalLights > this.maxLights) {
			throw new Error("Max lights limit is " + this.maxLights + "., but " + totalLights + " was found." );
		}
	
		var indexP = "[" + jsg.positionalLightQtd + "]";
		var indexD = "[" + jsg.directionalLightQtd + "]";
		
		this.updateGlobalValues();
		//VERTEX_SHADER
		this.vertexShader.globalDeclarations.push("attribute vec3 aVertexPos;");
		this.vertexShader.globalDeclarations.push("attribute vec3 aVertexNormal;");
		this.vertexShader.globalDeclarations.push("uniform mat4 uMVMatrix;");
		this.vertexShader.globalDeclarations.push("uniform mat4 uPMatrix;");
		this.vertexShader.globalDeclarations.push("uniform mat4 uNMatrix;");
		this.vertexShader.globalDeclarations.push("uniform int uPosLights;");
		this.vertexShader.globalDeclarations.push("uniform int uDirLights;");
		this.vertexShader.globalDeclarations.push("const int MAX_POS_LIGHTS = " + jsg.positionalLightQtd + ";");
		this.vertexShader.globalDeclarations.push("const int MAX_DIR_LIGHTS = " + jsg.directionalLightQtd + ";");
		this.vertexShader.globalDeclarations.push("uniform float uShininess;");
		this.vertexShader.globalDeclarations.push("uniform vec4 uSpecularColor;");
		this.vertexShader.globalDeclarations.push("uniform vec4 uMaterialColor;");
		this.vertexShader.globalDeclarations.push("uniform vec4 uAmbientColor;");
		this.vertexShader.globalDeclarations.push("varying vec4 vColor;");
			this.vertexShader.mainLogical.push("vec4 vertex = uMVMatrix * vec4(aVertexPos, 1.0);");
			this.vertexShader.mainLogical.push("vec3 N = vec3(uNMatrix * vec4(aVertexNormal, 1.0));");
			this.vertexShader.mainLogical.push("vec3 eyeVec = -vec3(vertex.xyz);");
			this.vertexShader.mainLogical.push("vec3 E = normalize(eyeVec);");
			this.vertexShader.mainLogical.push("vec4 Ia = uMaterialColor * uAmbientColor;");
			this.vertexShader.mainLogical.push("vec4 Id = vec4(0.0, 0.0, 0.0, 1.0);");
			this.vertexShader.mainLogical.push("vec4 Is = vec4(0.0, 0.0, 0.0, 1.0);");
			this.vertexShader.mainLogical.push("vColor = Ia;");
			if (jsg.positionalLightQtd > 0) {
				this.vertexShader.globalDeclarations.push("uniform vec3 uLightPosition[MAX_POS_LIGHTS];");
				this.vertexShader.globalDeclarations.push("uniform vec4 uLightSpecular[MAX_POS_LIGHTS];");
				this.vertexShader.globalDeclarations.push("uniform	vec4 uPLightColor[MAX_POS_LIGHTS];");
				this.vertexShader.mainLogical.push("for(int i = 0; i < MAX_POS_LIGHTS; i++){");
				this.vertexShader.mainLogical.push("vec3 lightdir = vertex.xyz - uLightPosition[i];");
				this.vertexShader.mainLogical.push("vec3 L = normalize(lightdir);");
				this.vertexShader.mainLogical.push("vec3 R = reflect(L, N);");
				this.vertexShader.mainLogical.push("float lt = clamp( dot(N, -L), 0.0, 1.0);");
				this.vertexShader.mainLogical.push("float specular = pow(max(dot(R,E), 0.0), uShininess);");
				this.vertexShader.mainLogical.push("Id = uMaterialColor * uPLightColor[i] * lt;");
				this.vertexShader.mainLogical.push("Is = uSpecularColor * uLightSpecular[i] * specular;");
				this.vertexShader.mainLogical.push("vColor += Ia + Id + Is;");
				this.vertexShader.mainLogical.push("}");
			} else {
				this.vertexShader.mainLogical.push("vColor = Ia;")				
			}
			if (jsg.directionalLightQtd > 0) {
				this.vertexShader.globalDeclarations.push("uniform vec3 uLightDirection[MAX_DIR_LIGHTS];");
				this.vertexShader.globalDeclarations.push("uniform	vec4 uDLightColor[MAX_DIR_LIGHTS];");
				this.vertexShader.globalDeclarations.push("uniform	vec4 uDLightSpecular[MAX_DIR_LIGHTS];");
				this.vertexShader.mainLogical.push("for(int i = 0; i < MAX_DIR_LIGHTS; i++){");
				this.vertexShader.mainLogical.push("vec3 L = normalize(uLightDirection[i]);");
				this.vertexShader.mainLogical.push("vec3 R = reflect(L, N);");
				this.vertexShader.mainLogical.push("float lt = clamp( dot(N, -L), 0.0, 1.0);");
				this.vertexShader.mainLogical.push("float specular = pow(max(dot(R,E), 0.0), uShininess);");
				this.vertexShader.mainLogical.push("Id = uMaterialColor * uDLightColor[i] * lt;");
				this.vertexShader.mainLogical.push("Is = uSpecularColor * uDLightSpecular[i] * specular;");
				this.vertexShader.mainLogical.push("vColor += Ia + Id + Is;");
				this.vertexShader.mainLogical.push("}");
			}
			
			if (jsg.directionalLightQtd <= 0 && jsg.positionalLightQtd <= 0){
				this.vertexShader.mainLogical.push("vColor = Ia;");
			}
			
			this.vertexShader.mainLogical.push("vColor[3] = 1.0;")
			this.vertexShader.mainLogical.push("gl_Position = uPMatrix * vertex;");
			this.vertexShader.mainLogical.push("gl_PointSize = 1.0;");
		
			//FRAGMENT SHADER
			this.fragShader.globalDeclarations.push("#ifdef GL_ES");
			this.fragShader.globalDeclarations.push("precision highp float;");
			this.fragShader.globalDeclarations.push("#endif");
			this.fragShader.globalDeclarations.push("varying vec4 vColor;");
			this.fragShader.mainLogical.push("gl_FragColor = vColor;");
	}
	
	return this;
}

jsggl.PhongShader = function(jsg){
	this.jsg = jsg;
	this.base = new jsggl.GoraudShader(jsg);
	this.base.build = function() {
		var jsg = this.jsg;
		var totalLights = jsg.positionalLightQtd + jsg.directionalLightQtd;
		if (totalLights > this.maxLights) {
			throw new Error("Max lights limit is " + this.maxLights + "., but " + totalLights + " was found." );
		}	
		this.updateGlobalValues();
		var indexP = "[" + jsg.positionalLightQtd + "]";
		var indexD = "[" + jsg.directionalLightQtd + "]";
		this.vertexShader.globalDeclarations.push("const int MAX_POS_LIGHTS = " + this.jsg.positionalLightQtd + ";");
		this.vertexShader.globalDeclarations.push("attribute vec3 aVertexPos;");
		this.vertexShader.globalDeclarations.push("attribute vec3 aVertexNormal;");
		this.vertexShader.globalDeclarations.push("uniform mat4 uMVMatrix;");
		this.vertexShader.globalDeclarations.push("uniform mat4 uPMatrix;");
		this.vertexShader.globalDeclarations.push("uniform mat4 uNMatrix;");
		this.vertexShader.globalDeclarations.push("varying vec3 vNormal;");
		this.vertexShader.globalDeclarations.push("varying vec3 eyeVec;");
			this.vertexShader.mainLogical.push("vec3 vertex = vec3(uMVMatrix * vec4(aVertexPos, 1.0));");
			this.vertexShader.mainLogical.push("eyeVec = -vertex;");
			this.vertexShader.mainLogical.push("vNormal = vec3(uNMatrix * vec4(aVertexNormal, 1.0));");
		if (jsg.positionalLightQtd > 0) {
			this.vertexShader.globalDeclarations.push("uniform vec3 uLightPosition[MAX_POS_LIGHTS];");
				this.vertexShader.globalDeclarations.push("varying vec3 lightdir[MAX_POS_LIGHTS];");
				this.vertexShader.mainLogical.push("for(int i = 0; i < MAX_POS_LIGHTS; i++){");
				this.vertexShader.mainLogical.push("lightdir[i] = vertex.xyz - uLightPosition[i];");
				this.vertexShader.mainLogical.push("}");
		}
			this.vertexShader.mainLogical.push("gl_Position = uPMatrix * vec4(vertex, 1.0);");
			this.vertexShader.mainLogical.push("gl_PointSize = 1.0;");



		this.fragShader.globalDeclarations.push("#ifdef GL_ES");
		this.fragShader.globalDeclarations.push("precision highp float;");
		this.fragShader.globalDeclarations.push("#endif");
		this.fragShader.globalDeclarations.push("const int MAX_POS_LIGHTS = " + this.jsg.positionalLightQtd + ";");
		this.fragShader.globalDeclarations.push("const int MAX_DIR_LIGHTS = " + this.jsg.directionalLightQtd + ";");
		this.fragShader.globalDeclarations.push("uniform int uPosLights;");
		this.fragShader.globalDeclarations.push("uniform int uDirLights;");
		this.fragShader.globalDeclarations.push("uniform float uShininess;");
		this.fragShader.globalDeclarations.push("uniform vec4 uSpecularColor;");
		this.fragShader.globalDeclarations.push("uniform vec4 uMaterialColor;");
		this.fragShader.globalDeclarations.push("uniform vec4 uAmbientColor;");
		this.fragShader.globalDeclarations.push("varying vec3 vNormal;");
		this.fragShader.globalDeclarations.push("varying vec3 eyeVec;");
			this.fragShader.mainLogical.push("vec4 fColor;");
			this.fragShader.mainLogical.push("vec3 N = normalize(vNormal);");
			this.fragShader.mainLogical.push("vec3 E = normalize(eyeVec);");
			this.fragShader.mainLogical.push("vec4 Ia = uMaterialColor * uAmbientColor;");
			this.fragShader.mainLogical.push("vec4 Id = vec4(0.0, 0.0, 0.0, 1.0);");
			this.fragShader.mainLogical.push("vec4 Is = vec4(0.0, 0.0, 0.0, 1.0);");
			this.fragShader.mainLogical.push("fColor = vec4(0.0, 0.0, 0.0, 1.0);");
			if (jsg.positionalLightQtd > 0) {
				this.fragShader.globalDeclarations.push("uniform vec3 uLightPosition[MAX_POS_LIGHTS];");
				this.fragShader.globalDeclarations.push("uniform	vec4 uPLightColor[MAX_POS_LIGHTS];");
				this.fragShader.globalDeclarations.push("uniform vec4 uLightSpecular[MAX_POS_LIGHTS];");
				this.fragShader.globalDeclarations.push("varying vec3 lightdir[MAX_POS_LIGHTS];");
				this.fragShader.mainLogical.push("for(int i = 0; i < MAX_POS_LIGHTS; i++){");
				this.fragShader.mainLogical.push("vec3 L = normalize(lightdir[i]);");
				this.fragShader.mainLogical.push("vec3 R = reflect(L, N);");
				this.fragShader.mainLogical.push("float lt = clamp( dot(N, -L), 0.0, 1.0);");
				this.fragShader.mainLogical.push("float specular = pow(max(dot(R,E), 0.0), uShininess);");
				this.fragShader.mainLogical.push("Id = uMaterialColor * uPLightColor[i] * lt;");
				this.fragShader.mainLogical.push("Is = uSpecularColor * uLightSpecular[i] * specular;");
				this.fragShader.mainLogical.push("fColor +=  Ia + Id + Is;");
				this.fragShader.mainLogical.push("}");
			} 
			if (jsg.directionalLightQtd > 0) {
				this.fragShader.globalDeclarations.push("uniform vec3 uLightDirection[MAX_DIR_LIGHTS];");
				this.fragShader.globalDeclarations.push("uniform	vec4 uDLightColor[MAX_DIR_LIGHTS];");
				this.fragShader.globalDeclarations.push("uniform	vec4 uDLightSpecular[MAX_DIR_LIGHTS];");
				this.fragShader.mainLogical.push("for(int i = 0; i < MAX_DIR_LIGHTS; i++){");
				this.fragShader.mainLogical.push("vec3 L = normalize(uLightDirection[i]);");
				this.fragShader.mainLogical.push("vec3 R = reflect(L, N);");
				this.fragShader.mainLogical.push("float lt = clamp( dot(N, -L), 0.0, 1.0);");
				this.fragShader.mainLogical.push("float specular = pow(max(dot(R,E), 0.0), uShininess);");
				this.fragShader.mainLogical.push("Id = uMaterialColor * uDLightColor[i] * lt;");
				this.fragShader.mainLogical.push("Is = uSpecularColor * uDLightSpecular[i] * specular;");
				this.fragShader.mainLogical.push("fColor += Ia + Id + Is;");
				this.fragShader.mainLogical.push("}");
			}
			
			if (jsg.directionalLightQtd <= 0 && jsg.positionalLightQtd <= 0){
				this.vertexShader.mainLogical.push("fColor = Ia;");
			}
			this.fragShader.mainLogical.push("fColor[3] = 1.0;")
			this.fragShader.mainLogical.push("gl_FragColor = fColor;");
	}
	
	return this.base;
}

