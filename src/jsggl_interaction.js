var jsgint = jsgint || {};

jsgint.Sensor = function(name, obj){
	this.name = name;
	this.target = obj;

	this.input = function(){return true;};
	this.output = function(inp){ return inp;};
	
	this.execute = function() {
		var inp = this.input();
		var out = this.outup(inp);
		return out;
	}
}

