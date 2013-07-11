
jsggl.Scene = function(name, jsg){
	this.name = name;
	this.jsg = jsg;
	this.cameras = {};
	this.currentCamera = new jsggl.Camera("Default", jsggl.Camera.ORBITING);
	this.cameras["Default"] = this.currentCamera;
	this.activeCamera = "Default";
	this.lights = new jsgcol.ArrayMap();
	this.objects = new jsgcol.ArrayMap();

	this.build = function() {
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
		var p = [];
		var d = [];
		var spec = [];
		var dspec = [];
		var pc = [];
		var dc = [];
		var dq = 0;
		var pq = 0;
		this.forEachLight(
			function(l) {
				if (l.type == jsggl.Light.types.POSITIONAL) {
					p = p.concat(l.position);
					pc = pc.concat(l.color);
					spec = spec.concat(l.specularColor);
					pq++;
				} else {
					dspec = dspec.concat(l.specularColor);
					d = d.concat(l.direction);
					dc = dc.concat(l.color);
					dq++;
				}
			}
		);
		this.jsg.positionalLightQtd = pq;
		this.jsg.directionalLightQtd = dq;
		this.jsg.lightPosition = p;
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

	this.draw = function(){
		var jsg = this.jsg;
		var cam = this.currentCamera;
		jsg.pushModelView();
		jsg.projection = cam.projection.getMatrix();
		mat4.multiply(jsg.modelView, cam.getMatrix(), jsg.modelView);
		var keys = this.objects.getKeys();
		for (var i = 0; i < keys.length; i++) {
			var obj = this.objects.get(keys[i]);
			obj.draw(jsg);
		}
		jsg.popModelView();
	}
}

