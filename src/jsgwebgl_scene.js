
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
					l.texture = l.texture || new jsggl.TextureRendering(this.jsg, this.jsg.canvas.width, this.jsg.canvas.height).build();
					var pos = l.position;
					l.shadowIdx = sidx;
					this.jsg.sdLightPos = vec3.fromValues(pos[0], pos[1], pos[2]);
					this.jsg.sdLightViewMatrix = mat4.lookAt(mat4.create(), this.jsg.sdLightPos, vec3.fromValues(0, 1.0, 0), vec3.fromValues(0, 1, 0));
					this.jsg.sdLightProjectionMatrix = currentCamera.projection.getMatrix();
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
		var bs = jsg.shaderType;
		if (this.shadowEnabled) {
			var bs =  this.jsg.shaderType;	
			for (var i = 0; i < shadows.length; i++) {
				var l = shadows[i];
				l.texture.bind(i);
				this.jsg.shaderType = 3;
				this.jsg.activeShadow = i;
				this.simpleDraw();
				l.texture.unbind();
				l.texture.activeTexture(i);
			}
			this.jsg.activeShadow = -1;
			this.jsg.shaderType = 4; //SHADOW MAPPING
			this.simpleDraw();
		} else {
			this.simpleDraw();
		}
		this.jsg.shaderType = bs;
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
		for (var i = 0; i < keys.length; i++) {	 
			var obj = this.objects.get(keys[i]);
			if (jsg.shaderType == 3 || jsg.shaderType == 4) {
				this.jsg.shadowMatrices = new Float32Array(this.shadows.length * 16);
				if (this.jsg.shadowMatrices){
					var j;
					for (j = 0; j < this.shadows.length; j++){
						this.jsg.shadowMatrices.set(mat4.multiply(mat4.create(), this.shadows[j].matrix, obj.transforms), j*16);
					}
				}
				
				obj.draw(jsg);
			} else {
				obj.draw(jsg);
			}
		}
		jsg.popModelView();
	}
}

