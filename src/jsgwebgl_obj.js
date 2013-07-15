var jsggl = jsggl || {};

jsggl.builtin = jsggl.builtin || {};

jsggl.builtin.getFloor = function(jsg, dim, lines){
	var inc = 2*dim/lines;
	var v = [];
	var i = [];
	
	for(var l=0;l<=lines;l++){
		v[6*l] = -dim; 
	    v[6*l+1] = 0;
	    v[6*l+2] = -dim+(l*inc);
	                        
	    v[6*l+3] = dim;
	    v[6*l+4] = 0;
	    v[6*l+5] = -dim+(l*inc);
                        
	    v[6*(lines+1)+6*l] = -dim+(l*inc); 
	    v[6*(lines+1)+6*l+1] = 0;
	    v[6*(lines+1)+6*l+2] = -dim;
                        
	    v[6*(lines+1)+6*l+3] = -dim+(l*inc);
	    v[6*(lines+1)+6*l+4] = 0;
	    v[6*(lines+1)+6*l+5] = dim;
	                        
	    i[2*l] = 2*l;
	    i[2*l+1] = 2*l+1;
	    i[2*(lines+1)+2*l] = 2*(lines+1)+2*l;
	    i[2*(lines+1)+2*l+1] = 2*(lines+1)+2*l+1;        
	}
	
	var g = new jsggl.Drawable("floor", jsg);
	g.vertices = [v];
	g.indices = [i];
	g.groupNameList = ["floor"];
	var obj  = new jsggl.Object("floor");
	obj.addGroup(g);
	obj.material =  { "name":"floor", "ambient":[0.000000, 0.000000, 0.000000, 1.0], "diffuse":[0.0, 0.0, 0.0, 1.0], "specular":[0.0, 0.0, 0.0, 1.0], "shininess":0, "transparence":1, "opticalDensity":0 };
	
	return obj;
}

jsggl.Object = function(name) {
	this.name = name;
	this.showOneTime = true;
	this.showFrontFace = true;
	this.showBackFace = true;
	this.renderGroup = new jsgcol.ArrayMap();
	this.transforms = mat4.create();
	mat4.identity(this.transforms);

	this.setPosition = function(pos){
		this.transforms[13] = pos[0];
		this.transforms[14] = pos[1];
		this.transforms[15] = pos[2];
	}
	
	this.getPosition = function() {
		return [this.transforms[13], this.transforms[14], this.transforms[15]];
	}

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

	this.linkDataCopy = function(name) {
		var obj = new jsggl.Object(name);
		obj.renderGroup = this.renderGroup;
		return obj;
	}

	this.forEachRenderGroup = function(callback){
		var keys = this.renderGroup.getKeys();
		for (var i = 0; i < keys.length; i++) {
			var g = this.renderGroup.get(keys[i]);
			callback(g);
		}
	}

	this.build = function(){
		var keys = this.renderGroup.getKeys();
		for (var i = 0; i < keys.length; i++) {
			this.renderGroup.get(keys[i]).build();
		}
	}
	
	this.draw = function(jsg){
		jsg.pushModelView();
		mat4.multiply(jsg.modelView, jsg.modelView, this.transforms);
		var keys = this.renderGroup.getKeys();
		for (var i = 0; i < keys.length; i++) {
			var g = this.renderGroup.get(keys[i]);
			g.showFrontFace = this.showFrontFace;
			g.showBackFace = this.showBackFace;
			g.showOneTime = this.showOneTime;			
			g.material = this.material;
			g.draw();
		}
		jsg.popModelView();
	}
}

jsggl.Object.loadFromJSON = function(objson, type, ID) {
	if (!type) type = "object";
	if (type == "group") {
		var obj = new jsggl.Object(ID || "default");
		for (var i = 0; i < objson.objectList.length; i++) {
			var ob = objson.objectList[i];
			var obj3d = new jsggl.Drawable(ob.name, jsg);
			obj3d.indices = ob.indices;
			obj3d.vertices = ob.vertices;			
			obj3d.groupNameList = ob.groupName;				
			obj3d.setRenderingMode(jsg.TRIANGLES);
			obj.addGroup(obj3d);
		}
		return obj;
	} else if (type == "object") {
		var ob = objson.objectList[ID || 0];
		var obj = new jsggl.Object(ob.name);
		var obj3d = new jsggl.Drawable(ob.name, jsg);
		obj3d.indices = ob.indices;
		obj3d.vertices = ob.vertices;			
		obj3d.groupNameList = ob.groupName;				
		obj3d.setRenderingMode(jsg.TRIANGLES);
		obj.addGroup(obj3d);
		return obj;
	}
}
