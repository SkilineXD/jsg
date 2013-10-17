var jsggl = jsggl || {};

jsggl.interpolate = jsggl.interpolate || {};

jsggl.inter = jsggl.interpolate; //alias to jsggl.interpolate namespace.

jsggl.inter.LINEAR = function(v1, v2, t) {
	return vec3.fromValues((1-t) * v1[0] + t * v2[0], (1-t) * v1[1] + t * v2[1], (1-t) * v1[2] + t * v2[2]);  
}

jsggl.inter.step2 = function(d1, d2, t, target, method){
	method = method || jsggl.inter.LINEAR;
	var d3 = target || new jsggl.Drawable(d1.name+"_"+t, d1.jsg);
	if (!d1.built) d1.build();
	if (!target) {
		d3 = d1.copy(d3);
	}
	d3.drawType = d3.jsg.DYNAMIC_DRAW;
	d3.vertices = [];
	var vertices = [];
	for (var j = 0; j < d1.vertices.length; j++) {
		var vertices1 = d1.vertices[j];
		var vertices2 = d2.vertices[j];
		var vertices3 = [];
		for (var i = 0; i < vertices1.length; i = i + 3){
			var idx = i, idx1 = i+1, idx2 = i+2;
			var v1 = vec3.fromValues(vertices1[idx], vertices1[idx1], vertices1[idx2]);
			var v2 = vec3.fromValues(vertices2[idx], vertices2[idx1], vertices2[idx2]);
			var v3 = method(v1, v2, t);
			vertices3.push(v3[0])
			vertices3.push(v3[1]);
			vertices3.push(v3[2]);
		}
		vertices.push(vertices3);
	}
	d3.setVertices(vertices);
	if (target){
		for (var k = 0; k < d3.vertices.length; k++) {
			d3.updateVertices(k);
		}
	} else { 
		d3.delete();
		d3.build();
	}
	return d3;
}

jsggl.interpolate.linearStepN = function(r, t, target){
	var n = r.length-1;
	if (t <= 0) t += 0.0001; 
	var d = 1/t;
	var i = n - Math.floor(1/t); //index calculate
	if (i < 0) {
		i = 0;
	} else if (i >= n){
		i = n-1;
	}
	var s = i * d;
	var e = (i+1) * d;
	var x = (t - s)/(e - s);
	return jsggl.interpolate.step2(r[i], r[i+1], t, target); 
}

jsggl.inter.obj = jsggl.inter.obj || {};

jsggl.inter.obj.step2 = function(o1, o2, t, target){ 
	var n = o1.group.data.length;
	for (var j = 0; j < n; j++) {
		var group1 = o1.group.data[j];
		var group2 = o2.group.data[j];
		if (group1 && group2) {
			var targ = target.group.data[j];
			targ = jsggl.inter.step2(group1, group2, t, targ);
		}
	}
	return target;
}

