var jsggl = jsggl || {};

jsggl.Floor = {
	alias       : 'floor',
	dim         : 50,
	lines       : 50,
	vertices    : [],
	indices     : [],
	material : { "name":"floor", "ambient":[0.000000, 0.000000, 0.000000, 1.0], "diffuse":[0.7, 0.7, 0.7, 1.0], "specular":[0.7, 0.7, 0.7, 1.0], "shininess":0, "transparence":1, "opticalDensity":0 },
	build : function(d,e){
	            var Floor = jsggl.Floor;
	            if (d) Floor.dim = d;
	            if (e) Floor.lines = 2*Floor.dim/e;
	            var inc = 2*Floor.dim/Floor.lines;
	            var v = [];
	            var i = [];
	
	            for(var l=0;l<=Floor.lines;l++){
	                        v[6*l] = -Floor.dim; 
	                        v[6*l+1] = 0;
	                        v[6*l+2] = -Floor.dim+(l*inc);
	                        
	                        v[6*l+3] = Floor.dim;
	                        v[6*l+4] = 0;
	                        v[6*l+5] = -Floor.dim+(l*inc);
                        
	                        v[6*(Floor.lines+1)+6*l] = -Floor.dim+(l*inc); 
	                        v[6*(Floor.lines+1)+6*l+1] = 0;
	                        v[6*(Floor.lines+1)+6*l+2] = -Floor.dim;
                        
	                        v[6*(Floor.lines+1)+6*l+3] = -Floor.dim+(l*inc);
	                        v[6*(Floor.lines+1)+6*l+4] = 0;
	                        v[6*(Floor.lines+1)+6*l+5] = Floor.dim;
	                        
	                        i[2*l] = 2*l;
	                        i[2*l+1] = 2*l+1;
	                        i[2*(Floor.lines+1)+2*l] = 2*(Floor.lines+1)+2*l;
	                        i[2*(Floor.lines+1)+2*l+1] = 2*(Floor.lines+1)+2*l+1;        
	            }
                    Floor.vertices = v;
                    Floor.indices = i;
	}
}


jsggl.Object = function(name) {
	this.name = name;
	this.renderGroup = new jsgcol.ArrayMap();

	this.addGroup = function(g){
		this.renderGroup.put(g.name, g);
	}

	this.removeGroup = function(name){
		this.renderGroup.remove(name);
	}

	this.translate = function(tv){
		mat4.translate(this.transforms, this.transforms, tv);
	}

	this.rotate = function(rad, axis) {
		mat4.rotate(this.transforms, this.transforms, rad, axis);
	}

	this.scale = function(params){
		mat4.scale(this.transforms, this.transforms,  params);
	}

	this.transforms = mat4.create();
	mat4.identity(this.transforms);

	this.build = function(){
		var keys = this.renderGroup.getKeys();
		for (var i = 0; i < keys.length; i++) {
			this.renderGroup.get(keys[i]).build();
		}
	}
	
	this.draw = function(jsg){
		var mv = mat4.create();
		jsg.pushModelView();
		mat4.multiply(jsg.modelView, jsg.modelView, this.transforms);
		var keys = this.renderGroup.getKeys();
		for (var i = 0; i < keys.length; i++) {
			this.renderGroup.get(keys[i]).draw();
		}
		jsg.popModelView();
	}
}

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
		jsg.pushModelView();
		mat4.multiply(jsg.modelView, cam.getMatrix(), jsg.modelView);
		var keys = this.objects.getKeys();
		for (var i = 0; i < keys.length; i++) {
			var obj = this.objects.get(keys[i]);
			obj.draw(jsg);
		}
		jsg.popModelView();
	}
}

