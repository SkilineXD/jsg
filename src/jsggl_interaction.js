var jsgint = jsgint || {};



jsgint.Utils = jsgint.Utils || {};


jsgint.Utils.getCanvasCoords = function(jqcanvas, pageX, pageY) {
	var bww =  jqcanvas.outerWidth() - jqcanvas.innerWidth() + jqcanvas.offset().left;
	var bwh = jqcanvas.outerHeight() - jqcanvas.innerHeight() + jqcanvas.offset().top;
	return [pageX  - bww, pageY  - bwh];
};

/**
* winx = horizontal canvas coordinate
* winy = vertical canvas coordinate
* winz = projection plan position
* mm = transformation matrix
* pm = projection matrix
* width = viewport width
* height = viewport height
*/
jsgint.Utils.unproject = function(winx, winy, winz, mm, pm, width, height) {
	      // winz is either 0 (near plane), 1 (far plane) or somewhere in between.
	      // if it's not given a value we'll produce coords for both.
	      if (typeof(winz) == "number") {
		        winx = parseFloat(winx);
		        winy = parseFloat(winy);
		        winz = parseFloat(winz);
      
		        var inf = [];
        		var viewport = [0, 0, width, height];
    
        		//Calculation for inverting a matrix, compute projection x modelview; then compute the inverse
        		var m = mat4.copy(mat4.create(), mm);
        
        		mat4.invert(m, m); // WHY do I have to do this? --see Jax.Context#reloadMatrices
        		mat4.multiply(m, pm, m);
        		mat4.invert(m, m);
    
        		// Transformation of normalized coordinates between -1 and 1
        		inf[0]=(winx-viewport[0])/viewport[2]*2.0-1.0;
        		inf[1]=(winy-viewport[1])/viewport[3]*2.0-1.0;
       	 		inf[2]=2.0*winz-1.0;
        		inf[3]=1.0;
    
        		//Objects coordinates
       	 		var out = vec4.create();
        		vec4.transformMat4(out, inf, m);
        		if(out[3]==0.0)
           			return null;
        		out[3]=1.0/out[3];
        		return [out[0]*out[3], out[1]*out[3], out[2]*out[3]];
      		}
      		else
        		return [this.unproject(winx, winy, 0), this.unproject(winx, winy, 1)];
};

jsgint.Sensor = function(name, obj, jsg){
	this.name = name;
	this.target = obj;
	this.jsg = jsg;

	this.input = function(){return true;};
	this.output = function(inp){ return inp;};
	
	this.execute = function() {
		var inp = this.input();
		var out = this.outup(inp);
		return out;
	}
}

