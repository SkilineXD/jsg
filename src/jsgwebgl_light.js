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

