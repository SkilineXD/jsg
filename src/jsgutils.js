
var jsgutils = jsgutils || {}
 

jsgutils.Point2D = function(x, y) {
	this.x = x;
	this.y = y;
};

jsgutils.Vector2D = function(x, y) {
				this.x = x;
			this.y = y;
		
			this.size = function() {
				return Math.sqrt(this.x * this.x + this.y * this.y);
			};

			this.add = function(other) {
				this.x += other.x;
				this.y += other.y;
				return this;
			};
			
			this.sub = function(other){
				this.y -= other.y;
				this.x -= other.x;
				return this;
			};

			this.scale = function(k) {
				this.x *= k;
				this.y *= k;
				return this;
			};
	
			this.scale2 = function(kx, ky) {
				this.x *= kx;
				this.y *= ky;
				return this;
			}
			this.normalize = function() {
				var s = this.size();
				this.x = x/this.size();
				this.y = y/this.size();
				return this;
			};
			this.angle = function() { return Math.atan2(y, x); };
			this.rotate = function(angle) {
				var s = Math.sin(angle);
				var c = Math.cos(angle);
				var nx = this.x * c - this.y * s;
				var ny = this.y * s + this.y * c;
				this.x = nx;
				this.y = ny;			
				return this;
			};

			this.dot = function (other) {
				return this.x * other.x + this.y * other.y;
			}
};	

jsgutils.newVector2DBySizeAngle = function(size, angle) {
		return new jsgutils.Vector2D(Math.cos(angle) * size, Math.sin(angle) * size);
}

jsgutils.area2 = function (a, b, c) {
	return (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x); 
}; //retorna Area(ABC) * 2: > 0 se anti-horario; < 0 se horário

jsgutils.area2v = function (a, b, c) {
	return (a[0] - c[0]) * (b[1] - c[1]) - (a[1] - c[1]) * (b[0] - c[0]); 
}; //retorna Area(ABC) * 2: > 0 se anti-horario; < 0 se horário

jsgutils.containsv = function(a, b, c, p){
	return (jsgutils.area2v(a, b, c) >= 0 && 
			jsgutils.area2v(a, b, p) >= 0 &&
			jsgutils.area2v(b, c, p) >= 0 &&
			jsgutils.area2v(c, a, p) >= 0) || 
		   (jsgutils.area2v(a, b, c) <= 0 && 
			jsgutils.area2v(a, b, p) <= 0 &&
			jsgutils.area2v(b, c, p) <= 0 &&
			jsgutils.area2v(c, a, p) <= 0);
};


jsgutils.contains = function(a, b, c, p){
	return (jsgutils.area2(a, b, c) >= 0 && 
			jsgutils.area2(a, b, p) >= 0 &&
			jsgutils.area2(b, c, p) >= 0 &&
			jsgutils.area2(c, a, p) >= 0) || 
		   (jsgutils.area2(a, b, c) <= 0 && 
			jsgutils.area2(a, b, p) <= 0 &&
			jsgutils.area2(b, c, p) <= 0 &&
			jsgutils.area2(c, a, p) <= 0);

};

jsgutils.insidePolygon = function(p, pol){
	var n = pol.length, j = n - 1,
			b = false, x = p.x, y = p.y;
			
	for (i = 0; i < n; i++) {
		if (pol[j].y <= y && y < pol[i].y &&
			jsgutils.area2(pol[j], pol[i], p) > 0 ||
			pol[i].y <= y && y <= pol[j].y &&
			jsgutils.area2(pol[i], pol[j], p) > 0) b = !b;
		j = i; 
	}
	return b;
}

jsgutils.insidePolygonv = function(p, pol){
	var n = pol.length, j = n - 1,
			b = false, x = p[0], y = p[1];
			
	for (i = 0; i < n; i++) {
		if (pol[j][1] <= y && y < pol[i][1] &&
			jsgutils.area2v(pol[j], pol[i], p) > 0 ||
			pol[i][1] <= y && y <= pol[j][1] &&
			jsgutils.area2v(pol[i], pol[j], p) > 0) b = !b;
		j = i; 
	}
	return b;
}

jsgutils.projectionOnSegment = function(a, b, p){
	var vx = b.x - a.x, vy = b.y - a.y, len2 = vx * vx + vy * vy,
		inprod = vx * (p.x - a.x) + vy * (p.y - a.y);
		return new jsgutils.Point2D(a.x + inprod * vx/len2, a.y + inprod * vy/len2);
}

jsgutils.projectionOnLine = function(a, b, h, p) {
	var d = p.x * a + p.y * b - h;
	return new jsgutils.Point2D(p.x - d * a, p.y - d * b); 
}

jsgutils.Vector3D = function(x, y, z) {
			this.x = x;
			this.y = y;
			this.z = z;
		
			this.size = function() {
				return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
			};

			this.add = function(other) {
				this.x += other.x;
				this.y += other.y;
				this.z += other.z;
				return this;
			};
			
			this.sub = function(other){
				this.x -= other.x;
				this.y -= other.y;
				this.z -= other.z;
				return this;
			};

			this.scale = function(k) {
				this.x *= k;
				this.y *= k;
				this.z *= k;
				return this;
			};
	
			this.scale3 = function(kx, ky, kz) {
				this.x *= kx;
				this.y *= ky;
				this.z *= kz;
				return this;
			}
			
			this.normalize = function() {
				var s = this.size();
				if (s==0) s = 0.00001;
				this.x = this.x/s;
				this.y = this.y/s;
				this.z = this.z/s;
				return this;
			};
			
			this.dot = function (other) {
				return this.x * other.x + this.y * other.y + this.z * other.z;
			}
			
			this.prod = function(other) {
				return new jsgutils.Vector3D(this.y * other.z - this.z * other.y,
											  this.z * other.x - this.x * other.z,
											  this.x * other.y - this.y * other.x);
			}
			
			this.copy = function() {
				return new jsgutils.Vector3D(this.x, this.y, this.z);
			}

			this.toArray3 = function(){
				return [this.x, this.y, this.z];
			}
			
			this.toArray4 = function() {
				return [this.x, this.y, this.z, 1.0];
			}
};	

jsgutils.Point3D = function(x, y, z) {
	this.x = x;
	this.y = y;
	this.z = z;
	this.AsArray = function() {
		return [this.x, this.y, this.z];
	}
	
	this.asVector3D = function() {
		return new jsgutils.Vector3D(this.x, this.y, this.z, 1.0);
	}
};

jsgutils.arrayAsPoint3D = function(v) {
	new jsgutils.Point3D(v[0], v[1], v[2]);
}

jsgutils.getTextResource = function(resource, onSuccess, onError,type) {
	var request = new XMLHttpRequest();
	type = type || "GET"; 
	request.onreadystatechange = function() {
		if (request.readyState == 4){
			if (request.status == 200 || (request.status == 0 && document.domain.length == 0)){
				onSuccess(request.responseText);
			} else {
				onError(request.status);
			}
		}
	};
	request.open(type, resource, true);
	request.send(null);
};

jsgutils.calcNormal = function(v, normalize){
	var v1 = new jsgutils.Vector3D(v[2][0]-v[1][0], v[2][1] - v[1][1], v[2][2] - v[1][2]);
	var v2 = new jsgutils.Vector3D(v[0][0]-v[1][0], v[0][1] - v[1][1], v[0][2] - v[1][2]);
	if (normalize)
		return v1.prod(v2).normalize();
	else
		return v1.prod(v2);
};


jsgutils.calcNormals = function(vertices, indices) {
	var normals = new Array(vertices.length);	
	for (var f = 0; f < indices.length; f += 3) {
		var i = indices[f], j = indices[f+1]; k = indices[f+2];
		var t = [i, j, k];
		var triangle = [];
		for (var k = 0; k < t.length; k++) {
			var v = t[k];
			var vertex = [];
			for (var l = 0; l < 3; l++) {
				var idx = v * 3 + l;
				normals[idx] = normals[idx] || 0.0;
				vertex.push(vertices[idx]);
			}
			triangle.push(vertex);
		}

		for (var k = 0; k < t.length; k++) {
			var o = [triangle[k], triangle[((k+1) % 3)], triangle[( (k+2) % 3 )] ];
			var N = jsgutils.calcNormal(o).toArray3();
			var v = t[k];
			for (var l = 0; l < 3; l++) {
				var idx = v * 3 + l;
				normals[idx] += N[l];
			}	
		}		
	}

	for (var f = 0; f < normals.length; f += 3) {
		var s = Math.sqrt(normals[f]*normals[f] + normals[f+1]*normals[f+1] + normals[f+2]*normals[f+2]);
		if (s == 0) s = 0.00001;
		normals[f] = normals[f]/s;
		normals[f+1] = normals[f+1]/s;
		normals[f+2] = normals[f+2]/s;
	}
	
	return normals;
};

