var jsggl = jsggl || {};

jsggl.Camera = function(name, pos, center, up){
	this.name = name;
	this.data = mat4.create();
	this.position = pos;
	this.up = up;
	this.center = center;

	this.update = function(){
		mat4.identity(this.data);
		mat4.lookAt(this.data, this.position, this.center, this.up);
	};

	this.getMatrix = function(){
		return mat4.clone(this.data);
	};

	this.update();
};

jsggl.TCamera = function(name, position, azimute, elevation, roll){
	this.name = name;
	this.position = position;
	this.azimute = azimute;
	this.elevation = elevation;
	this.roll = roll;
	this.matrix = mat4.create();
	mat4.identity(this.matrix);

	this.update = function() {
		mat4.identity(this.matrix);
		mat4.translate(this.matrix, this.matrix, this.position);				
		mat4.rotateX(this.matrix, this.matrix, this.elevation * Math.PI/180.0);
		mat4.rotateY(this.matrix, this.matrix, this.azimute * Math.PI/180.0);
		mat4.rotateZ(this.matrix, this.matrix, this.roll * Math.PI/180.0);
	}

	this.getMatrix = function(){ 
		return	mat4.clone(this.matrix);
	}
};

jsggl.OCamera = function(name, position, azimute, elevation, roll){
	this.name = name;
	this.position = position;
	this.azimute = azimute;
	this.elevation = elevation;
	this.roll = roll;
	this.matrix = mat4.create();
	mat4.identity(this.matrix);

	this.update = function() {
		mat4.identity(this.matrix);
		mat4.rotateX(this.matrix, this.matrix, this.elevation * Math.PI/180.0);
		mat4.rotateY(this.matrix, this.matrix, this.azimute * Math.PI/180.0);
		mat4.rotateZ(this.matrix, this.matrix, this.roll * Math.PI/180.0);
		mat4.translate(this.matrix, this.matrix, this.position);			
	}

	this.getMatrix = function(){ 
		return	mat4.clone(this.matrix);
	}
};

