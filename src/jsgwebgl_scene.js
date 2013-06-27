var jsggl = jsggl || {};

jsggl.Object = function(name) {
	this.name = name;
	this.renderGroup = new jsgcol.ArrayMap();

	this.addGroup = function(g){
		this.renderGroup.put(g.name, g);
	}

	this.removeGroup = function(name){
		this.renderGroup.remove(name);
	}

	this.transformation = mat4.create();
	mat4.identity(this.transformation);

	this.build = function(){
		var keys = this.renderGroup.getKeys();
		for (var i = 0; i < keys.length; i++) {
			this.renderGroup.get(keys[i]).build();
		}
	}
	
	this.draw = function(jsg){
		var mv = mat4.create();
		mat4.multiply(mv, jsg.getModelView(), this.transformation);
		jsg.modelViewStack.push(mv);
		var keys = this.renderGroup.getKeys();
		for (var i = 0; i < keys.length; i++) {
			this.renderGroup.get(keys[i]).draw();
		}
		jsg.modelViewStack.pop();
	}
}


jsggl.Scene = function(name){
	this.name = name;
	this.cameras = {};
	this.currentCamera = new jsggl.Camera("Default", jsggl.Camera.TRACKING);
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

	this.addLight = function(l){
		this.lights.put(l.name, l);
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
		var cm = cam.getMatrix();
		mat4.multiply(cm, cm, jsg.getModelView());
		jsg.modelViewStack.push(cm);
		var keys = this.objects.getKeys();
		for (var i = 0; i < keys.length; i++) {
			this.objects.get(keys[i]).draw(jsg);
		}
		jsg.modelViewStack.pop();
	}
}

