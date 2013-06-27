var jsggl = jsggl || {};

jsggl.Camera = function(name, type){
	this.type = type;
	this.name = name;

	var self = this;
	this.reset = function() {
		self.position = vec4.create();
		self.position[3] = 1.0;
		self.position[2] = 10.0;
		self.position[1] = 3.0;
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
		$("#display").html(self.toString());
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

