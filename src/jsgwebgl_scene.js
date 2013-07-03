
jsggl.Scene = function(name){
	this.name = name;
	this.cameras = {};
	this.currentCamera = new jsggl.Camera("Default", jsggl.Camera.ORBITING);
	this.cameras["Default"] = this.currentCamera;
	this.activeCamera = "Default";
	this.lights = new jsgcol.ArrayMap();
	this.objects = new jsgcol.ArrayMap();

	this.build = function() {
		var keys = this.objects.getKeys();
		for (var i = 0; i < keys.length; i++) {
			this.objects.get(keys[i]).build();
		}
	}

	this.getObject = function(name) {
		return this.objects.get(name);
	}

	this.addLight = function(l){
		this.lights.put(l.name, l);
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

	this.draw = function(jsg){
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

