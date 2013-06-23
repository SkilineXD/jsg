var jsggl = jsggl || {};

jsggl.Camera = function(name, pos, center, up){
	this.name = name;

	this.update = function(pos, center, up){
		this.pos = pos;
		this.up = up;
		this.center = center;
	};

	this.getMatrix = function(){
		var m = mat4.create();
		mat4.lookAt(m, pos, center, up);
		return m;
	};

	this.update(pos, center, up);
}
