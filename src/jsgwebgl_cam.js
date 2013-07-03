var jsggl = jsggl || {};


jsggl.Projection = function(type){
	this.type = type;
	if (type == jsggl.Projection.type.PERSPECTIVE) {
		this.FOV = 45;
		this.near = 0.01;
		this.far = 10000;
		this.aspectRatio = 1.0;
	} else if (type == jsggl.Projection.type.ORTOGRAPHIC){
		this.left = -1.0;
		this.right = 1.0;
		this.top = 1.0;
		this.bottom = -1.0;
		this.near = 0.01;
		this.far = 2.0;
	} else {
		throw new Error("Invalid projection type");
	}	

	this.getMatrix = function() {
		if (this.type == jsggl.Projection.type.PERSPECTIVE){
			return mat4.perspective(mat4.create(), this.FOV, this.aspectRatio, this.near, this.far);
		} else if (this.type == jsggl.Projection.type.ORTOGRAPHIC) {
			return mat4.ortho(mat4.create(), this.left, this.right, this.bottom, this.top, this.near, this.far);
		}
	}
}

jsggl.Projection.newPerspective = function(fov, aspectRatio, near, far) {
	var p = new jsggl.Projection(jsggl.Projection.type.PERSPECTIVE);
	p.FOV = fov;
	p.aspectRatio = aspectRatio;
	p.near = near;
	p.far = far;
	return p;
}

jsggl.Projection.newOrtographic = function(left, right, bottom, top, near, far) {
	var p = new jsggl.Projection(jsggl.Projection.type.ORTOGRAPHIC);
	p.left = left;
	p.right = right;
	p.bottom = bottom;
	p.top = top;
	p.near = near;
	p.far = far;
	return p;
}

jsggl.Projection.type = {};
jsggl.Projection.type.PERSPECTIVE = 0;
jsggl.Projection.type.ORTOGRAPHIC = 1;

jsggl.Camera = function(name, type, projection){
	this.type = type;
	this.name = name;
	this.projection = projection || new jsggl.Projection(jsggl.Projection.type.PERSPECTIVE);

	var self = this;
	this.reset = function() {
		self.position = vec4.create();
		self.position[3] = 1.0;
		self.position[2] = 4.0;
		self.position[1] = 1.0;
		self.azimute = 0.0;
		self.elevation = 0.0;
		self.roll = 0.0;
		self.matrix = mat4.create();
		mat4.identity(this.matrix);
		self.right = vec4.create();
		self.up = vec4.create();
		self.normal = vec4.create();
		this.update();
	}

	this.toString = function(){
		return this.matrix[0] + ", " + this.matrix[4] + ", " + this.matrix[8] + ", " + this.matrix[12] + "<br />" +
		this.matrix[1] + ", " + this.matrix[5] + ", " + this.matrix[9] + ", " + this.matrix[13] + "<br />" +
		this.matrix[2] + ", " + this.matrix[6] + ", " + this.matrix[10] + ", " + this.matrix[14] + "<br />" +
		this.matrix[3] + ", " + this.matrix[7] + ", " + this.matrix[11] + ", " + this.matrix[15] + "<br />";
	}

	this.update = function() {
		mat4.identity(self.matrix);
		if (self.type == jsggl.Camera.TRACKING) {
			mat4.translate(self.matrix, self.matrix, self.position);
			mat4.rotateZ(self.matrix, self.matrix, self.roll * Math.PI/180.0);
			mat4.rotateY(self.matrix, self.matrix, self.azimute * Math.PI/180.0);				
			mat4.rotateX(self.matrix, self.matrix, self.elevation * Math.PI/180.0);
			vec4.transformMat4(self.position, [0, 0, 0, 1], self.matrix);
		} else {
			mat4.rotateZ(self.matrix, self.matrix, self.roll * Math.PI/180.0);
			mat4.rotateY(self.matrix, self.matrix, self.azimute * Math.PI/180.0);				
			mat4.rotateX(self.matrix, self.matrix, self.elevation * Math.PI/180.0);
			mat4.translate(self.matrix, self.matrix, self.position);					
		}
   		vec4.transformMat4(self.right, [1, 0, 0, 0], self.matrix);
    		vec4.transformMat4(self.up, [0, 1, 0, 0], self.matrix);
    		vec4.transformMat4(self.normal, [0, 0, 1, 0], self.matrix);
	}

	this.getMatrix = function(){ 
		return	mat4.invert(mat4.create(), self.matrix);
	}

	this.reset();
};

jsggl.Camera.ORBITING = 0;
jsggl.Camera.TRACKING = 1;

