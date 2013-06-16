var jsggl = jsggl || {};

jsggl.SunLight = function(name, direction, difcolor){
	this.name = name;
	this.direction = direction;
	this.diffuseColor = difcolor;
	
	this.update = function() {
		this.diffuse = new jsggl.DiffuseLight(this.name + "1", this.direction, this.diffuseColor);
	};

	this.update();

	this.addTo = function(jsg, over){
		var idx = jsg.getLightIdx(this.diffuse.name);
		if (idx < 0){
			jsg.addLight(this.diffuse);
			return true;
		} else if (over) {
			this.update();
			jsg.lights[idx] = this.diffuse;
			return true;
		}
		return false;
	}
}

jsggl.PointLight = function(name, position, difcolor, specColor, shininess, shaderType){
	this.name = name;

	this.position = position;
	this.diffuseColor = difcolor;
	this.specularColor = specColor;
	this.shininess = shininess;
	this.shaderType = shaderType;

	this.update = function() {
		this.diffuse = new jsggl.DiffusePositionalLight(this.name+"1", this.position, this.diffuseColor, this.shaderType);
		this.specular = new jsggl.PhongSpecularLight(this.name+"2", this.shininess, this.specularColor, this.diffuse);
	}

	this.update();

	this.addTo = function(jsg, over){
		var idx = jsg.getLightIdx(this.diffuse.name);
		if (idx < 0){
			jsg.addLight(this.diffuse);
			jsg.addLight(this.specular);
			return true;
		} else if (over) {
			this.update();
			jsg.lights[idx] = this.diffuse;
			jsg.lights[idx+1] = this.specular;
			return true;
		}
		return false;
	}
}


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


jsggl.DiffusePositionalLight = function(name, position, diffuseColor, shaderType){
	this.name = name;
	this.type = "diffuse";
	this.shaderType=shaderType || "goraud";
	this.position = position;
	this.diffuseColor = diffuseColor;
	this.globalDeclarations = [];
	this.mainLogical = [];
	this.vertexGlobalDeclarations = [];
	this.fragGlobalDeclarations = [];
	this.vertexMainLogical = [];
	this.fragMainLogical = [];

	this.vertexGlobalDeclarations.push("uniform vec3 {name}uLightPosition;".replaceAll("{name}", name));	
	this.fragGlobalDeclarations.push("uniform vec3 {name}uLightPosition;".replaceAll("{name}", name));	

	this.globalDeclarations.push("uniform vec4 {name}uLightDiffuse;".replaceAll("{name}", name));
	
	if (this.shaderType=="phong"){
		this.vertexGlobalDeclarations.push("varying vec3 {name}vLightDir;".replaceAll("{name}", name));
		this.fragGlobalDeclarations.push("varying vec3 {name}vLightDir;".replaceAll("{name}", name));
		this.vertexMainLogical.push("{name}vLightDir = vertex.xyz - {name}uLightPosition;".replaceAll("{name}", name));
	} else if (this.shaderType == "goraud") {
		this.vertexMainLogical.push("vec3 {name}vLightDir;".replaceAll("{name}", name));
		this.vertexMainLogical.push("{name}vLightDir = vertex.xyz - {name}uLightPosition;".replaceAll("{name}", name));
	}

	this.mainLogical.push("vec3 {name} = normalize({name}vLightDir);".replaceAll("{name}", name));
	this.mainLogical.push("float {name}lambertTerm = clamp(dot(N, -{name}), 0.0, 1.0);".replaceAll("{name}", name));	
	this.mainLogical.push("vec4 {name}Id  = uMaterialDiffuse * {name}uLightDiffuse * {name}lambertTerm;".replaceAll("{name}", name));
	this.mainLogical.push("acm = acm + {name}Id;".replaceAll("{name}", name));

	this.uniforms = ["{name}uLightDiffuse".replaceAll("{name}", name), "{name}uLightPosition".replaceAll("{name}", name)];
	this.setValues = function(jsg) {
		jsg.gl.uniform4fv(jsg.program[this.uniforms[0]], this.diffuseColor);
		jsg.gl.uniform3fv(jsg.program[this.uniforms[1]], this.position);	
	};	
}



jsggl.DiffuseLight = function(name, direction, diffuseColor){
	this.name = name;
	this.type = "diffuse";
	this.direction = direction;
	this.diffuseColor = diffuseColor;
	this.globalDeclarations = [];
	this.mainLogical = [];
	this.vertexGlobalDeclarations = [];
	this.fragGlobalDeclarations = [];
	this.vertexMainLogical = [];
	this.fragMainLogical = [];

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
	this.type = "specular";
	this.shininess = shininess;
	this.specularColor = specularColor;
	this.globalDeclarations = [];
	this.mainLogical = [];
	this.vertexGlobalDeclarations = [];
	this.fragGlobalDeclarations = [];
	this.vertexMainLogical = [];
	this.fragMainLogical = [];
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
	this.type="phong";
	this.vertexShader = new jsggl.Shader();
	this.fragShader = new jsggl.Shader();
	this.lights = jsg.lights;
	this.uniforms = ["uMVMatrix", "uPMatrix","uNMatrix", "uMaterialDiffuse", "uLightAmbient", "uMaterialSpecular", "uMaterialAmbient"];

	this.setGlobalValues = function(jsg){
		for (var i=0; i < jsg.lights.length; i++) {
				jsg.lights[i].setValues(jsg);
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

	for (var i = 0; i < this.lights.length; i++) {
			var l = this.lights[i];
			var gd = l.globalDeclarations;
			var ml = l.mainLogical;
			var vgd = l.vertexGlobalDeclarations;
			var fgd = l.fragGlobalDeclarations;
			var vml = l.vertexMainLogical;
			var fml = l.fragMainLogical;

			for (var j = 0; j < gd.length; j++) {
				this.fragShader.globalDeclarations.push(gd[j]);
			}

			for (var j = 0; j < vgd.length; j++) {
				this.vertexShader.globalDeclarations.push(vgd[j]);
			}

			for (var j = 0; j < fgd.length; j++) {
				this.fragShader.globalDeclarations.push(fgd[j]);
			}

			for (var j = 0; j < vml.length; j++) {
				this.vertexShader.mainLogical.push(vml[j]);
			}

			for (var j = 0; j < fml.length; j++) {
				this.fragShader.mainLogical.push(fml[j]);
			}

			for (var j = 0; j < ml.length; j++) {
				this.fragShader.mainLogical.push(ml[j]);
			}
	}
	this.fragShader.mainLogical.push("vec4 finalColor = Ia + acm;");	
	this.fragShader.mainLogical.push("finalColor.a = 1.0;");
	this.fragShader.mainLogical.push("gl_FragColor = finalColor;");
}

jsggl.PhongShader.type = "phong";

jsggl.GoraudShader = function(jsg){
	this.type="goraud";
	this.vertexShader = new jsggl.Shader();
	this.fragShader = new jsggl.Shader();
	this.lights = jsg.lights;
	this.uniforms = ["uMVMatrix", "uPMatrix","uNMatrix", "uMaterialDiffuse", "uLightAmbient", "uMaterialSpecular", "uMaterialAmbient"];

	this.setGlobalValues = function(jsg){
		for (var i=0; i < jsg.lights.length; i++) {
				jsg.lights[i].setValues(jsg);
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


	this.fragShader.globalDeclarations.push("#ifdef GL_ES");
	this.fragShader.globalDeclarations.push("precision highp float;");
	this.fragShader.globalDeclarations.push("#endif");

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

	for (var i = 0; i < this.lights.length; i++) {
			var l = this.lights[i];
			var gd = l.globalDeclarations;
			var ml = l.mainLogical;
			var vgd = l.vertexGlobalDeclarations;
			var fgd = l.fragGlobalDeclarations;
			var vml = l.vertexMainLogical;
			var fml = l.fragMainLogical;
			
			for (var j = 0; j < vgd.length; j++) {
				this.vertexShader.globalDeclarations.push(vgd[j]);
			}
		
			for (var j = 0; j < vml.length; j++) {
				this.vertexShader.mainLogical.push(vml[j]);
			}

			for (var j = 0; j < fml.length; j++) {
				this.fragShader.mainLogical.push(fml[j]);
			}

			for (var j = 0; j < gd.length; j++) {
				this.vertexShader.globalDeclarations.push(gd[j]);
			}


			for (var j = 0; j < ml.length; j++) {
				this.vertexShader.mainLogical.push(ml[j]);
			}
	

			for (var j = 0; j < fgd.length; j++) {
				this.fragShader.globalDeclarations.push(fgd[j]);
			}
	}
	
	this.vertexShader.mainLogical.push("vFinalColor = Ia + acm;");
	this.vertexShader.mainLogical.push("vFinalColor.a = 1.0;");
	this.vertexShader.mainLogical.push("gl_Position=uPMatrix*uMVMatrix*vec4(aVertexPosition,1.0);");

	this.fragShader.globalDeclarations.push("varying vec4 vFinalColor;");
	this.fragShader.mainLogical.push("gl_FragColor = vFinalColor;");
}

jsggl.GoraudShader.type="goraud";

