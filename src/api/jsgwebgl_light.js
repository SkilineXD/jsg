var jsggl = jsggl || {};

jsggl.Light = function(name, type){
	this.name = name;
	this.type = type;
	this.shadowEnabled = false;
	
	this.build = function(arg1, color, specularColor, positionDirection) {
		var pos;
		if (this.type == jsggl.Light.types.POSITIONAL) {
			this.position = arg1;
			pos = this.position;
			this.direction = positionDirection || [0.0, 0.0, 0.0];
			this.projection = jsggl.Projection.newPerspective(17 * Math.PI/180.0, (jsg.canvas.width)/(jsg.canvas.height), 0.1, 1000);
		} else if (this.type == jsggl.Light.types.DIRECTIONAL) {
			this.direction = arg1;
			pos = this.direction;
			this.projection = jsggl.Projection.newOrtographic (-1000, 1000, -1000, 1000, 0.1, 1000);
		} else {
			throw new Error("Invalid light type: " + arg1);
		}
		this.modelViewMatrix = mat4.lookAt(mat4.create(), vec3.fromValues(pos[0], pos[1], pos[2]), vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(0, 1, 0));
		this.specularColor = specularColor || [0.0, 0.0, 0.0, 1.0];
		this.color = color;
		return this;
	}
}

jsggl.Light.types = {};
jsggl.Light.types.POSITIONAL = 0;
jsggl.Light.types.DIRECTIONAL = 1;
