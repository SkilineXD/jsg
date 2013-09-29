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
	g.material = ["floor"]
	var obj  = new jsggl.Object("floor");
	obj.addGroup(g);
	jsg.materials["floor"] =  { "name":"floor", "ambient":[0.000000, 0.000000, 0.000000, 1.0], "diffuse":[0.0, 0.0, 0.0, 1.0], "specular":[0.0, 0.0, 0.0, 1.0], "shininess":0, "transparence":1, "opticalDensity":0, "shaderType":-1};
	return obj;
}

jsggl.Object = function(name) {
	this.name = name;
	this.showOneTime = true;
	this.showFrontFace = true;
	this.showBackFace = true;
	this.shadowEnabled = false;
	this.receiveShadow = false;
	this.group = new jsgcol.ArrayMap();
	this.transforms = mat4.create();
	this.center = vec3.fromValues(0.0, 0.0, 0.0);
	mat4.identity(this.transforms);

	this.getGroup = function(name) {
		return this.group.get(name);
	}
	
	this.setPosition = function(pos){
		var p = this.getPivot();
		this.translate(pos);
		this.translate([-p[0], -p[1], -p[2]]);
	}
	
	this.getTransformations = function() {
		return mat4.clone(this.transforms);
	}
	
	this.getTranslations = function() {
		return vec3.fromValues(this.transforms[12], this.transforms[13], this.transforms[14]);
	}
	
	this.getLinearTransformations = function() {
		var t = this.getTransformations();
		t[12] = 0;
		t[13] = 0;
		t[14] = 0;
		return t;
	}
	
	this.getPivot = function() {
		var c = this.center;
		var v = vec3.fromValues(c[0], c[1], c[2]);
		return vec3.add(vec3.create(), v, this.getTranslations());
	}
	
	this.centerToGeometry = function() {
		var x = [1000000, -1000000];
		var y = [1000000, -1000000];
		var z = [1000000, -1000000];
		this.group.forEach(function(g){
			var vl = g.vertices[0];
			for (var i = 0; i < vl.length; i = i + 3) {
				if (x[0] > vl[i]) {
					x[0] = vl[i];
				}
				if (x[1] < vl[i]){
					x[1] = vl[i];
				}
				if (y[0] > vl[i+1]) {
					y[0] = vl[i+1];
				} 
				if (y[1] < vl[i+1]){
					y[1] = vl[i+1];
				}
				if (z[0] > vl[i+2]) {
					z[0] = vl[i+2];
				} 
				if (z[1] < vl[i+2]){
					z[1] = vl[i+2];
				}
			}
		});
		this.xmax = x[1];
		this.xmin = x[0];
		this.ymax = y[1];
		this.ymin = y[0];
		this.zmax = z[1];
		this.zmin = z[0];
		
		this.center[0] = 0.5*(x[1] + x[0]);
		this.center[1] = 0.5*(y[1] + y[0]);
		this.center[2] = 0.5*(z[1] + z[0]);
	}
	
	this.getPosition = function() {
		return vec3.fromValues(this.transforms[12], this.transforms[13], this.transforms[14]);
	}

	this.setMaterial = function(mat) {
		this.material = mat;
	}
	
	this.addGroup = function(g){
		this.group.put(g.name, g);
	}

	this.removeGroup = function(name){
		this.group.remove(name);
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
		this.forEachGroup(function(g){
			obj.addGroup(g);
		});
		return obj;
	}

	this.forEachGroup = function(callback){
		var keys = this.group.getKeys();
		for (var i = 0; i < keys.length; i++) {
			var g = this.group.get(keys[i]);
			callback(g);
		}
	}

	this.build = function(){
		var keys = this.group.getKeys();
		for (var i = 0; i < keys.length; i++) {
			this.group.get(keys[i]).build();
		}
		this.centerToGeometry();
	}
	
	this.draw = function(jsg){
		jsg.pushModelView();
		mat4.multiply(jsg.modelView, jsg.modelView, this.transforms);
		var keys = this.group.getKeys();
		for (var i = 0; i < keys.length; i++) {
			var g = this.group.get(keys[i]);
			g.showFrontFace = this.showFrontFace;
			g.showBackFace = this.showBackFace;
			g.showOneTime = this.showOneTime;			
			var bkp = [g.shadowEnabled, g.receiveShadow];
			g.shadowEnabled = this.shadowEnabled;
			g.receiveShadow = this.receiveShadow;
			g.forceMaterial = this.material;
			g.draw();
			g.shadowEnabled = bkp[0];
			g.receiveShadow = bkp[1];
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
			obj3d.textures = ob.textmap;
			obj3d.groupNameList = ob.groupName;
			obj3d.material = ob.groupMaterial;
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
		obj3d.textures = ob.textmap;
		obj3d.groupNameList = ob.groupName;	
		obj3d.material = ob.groupMaterial;
		obj3d.setRenderingMode(jsg.TRIANGLES);
		obj.addGroup(obj3d);
		return obj;
	}
}

