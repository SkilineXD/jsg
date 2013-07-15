var jsggl = jsggl || {};


jsggl.Light = function(name, type){
	this.name = name;
	this.type = type;
	
	this.build = function(arg1, color, specularColor, positionDirection) {
		if (this.type == jsggl.Light.types.POSITIONAL) {
			this.position = arg1;
			this.direction = positionDirection || [0.0, 0.0, 0.0];
		} else if (this.type == jsggl.Light.types.DIRECTIONAL) {
			this.direction = arg1;
		} else {
			throw new Error("Invalid light type: " + arg1);
		}
		this.specularColor = specularColor || [0.0, 0.0, 0.0, 1.0];
		this.color = color;
		return this;
	}
}

jsggl.Light.types = {};
jsggl.Light.types.POSITIONAL = 0;
jsggl.Light.types.DIRECTIONAL = 1;
