var jsggl = jsggl || {};

jsggl.Material = function(name, matAmb, matDiffuse, matSpecular, shininess) {
	this.name = name;
	this.ambient = matAmb;
	this.diffuse = matDiffuse;
	this.specular = matSpecular;
	this.shininess = shininess;
    this.shaderType = 1;
}


jsggl.Material.newMaterial = function(name, ambient, diffuse, specular, s, t, o) {
 	return {"name":name, "ambient":ambient, "diffuse":diffuse, "specular":specular || [0.0, 0.0, 0.0, 1.0], "shininess":s || 100.0, "transparence":t || 1.0, "opticalDensity":o || 1.0, "shaderType": 1};
}

jsggl.Material.loadFromJSON = function(jsg, obj){
	jsg.materials = jsg.materials || {};
	jsg.textures = jsg.textures || {};
	for (i = 0; i < obj.materialList.length; i++) {
		var mtl = obj.materialList[i];
		var n = 0;
		if (mtl.mapka){
			mtl.textureka = new jsggl.Texture(jsg, mtl.mapka.texpath, n);
			n=n+1;
			mtl.textureka.build();
			mtl.useTextureKa = true;
		} else {
			mtl.useTextureKa = false;
		}
		
		if (mtl.mapkd){
			mtl.texturekd = new jsggl.Texture(jsg, mtl.mapkd.texpath, n);
			mtl.texturekd.build();
			mtl.useTextureKd = true;
		} else {
			mtl.useTextureKd = false;
		}
		
		jsg.materials[mtl.name] = mtl;
	}
}

jsggl.Texture = function(jsg, texpath, number) {
	this.texpath =  texpath;
	this.jsg = jsg;
	var self = this;
	self.number = number;
	self.TEXTURE = [jsg.gl.TEXTURE0, jsg.gl.TEXTURE1];
	
	this.build = function(){
			var jsg = self.jsg;
			jsg.gl.pixelStorei(jsg.gl.UNPACK_FLIP_Y_WEBGL, true);
			self.texture = jsg.gl.createTexture();
			self.image = new Image();
			self.image.onload = function(){
				var jsg = self.jsg;
				jsg.gl.bindTexture(jsg.gl.TEXTURE_2D, self.texture);
				jsg.gl.texImage2D(jsg.gl.TEXTURE_2D, 0, jsg.gl.RGBA, jsg.gl.RGBA, jsg.gl.UNSIGNED_BYTE, self.image);
				jsg.gl.texParameteri(jsg.gl.TEXTURE_2D, jsg.gl.TEXTURE_MAG_FILTER, jsg.gl.NEAREST);
				jsg.gl.texParameteri(jsg.gl.TEXTURE_2D, jsg.gl.TEXTURE_MIN_FILTER, jsg.gl.NEAREST);
				jsg.gl.bindTexture(jsg.gl.TEXTURE_2D, null);
			}
			self.image.src = self.texpath;
	}

	this.active = function() {
		var jsg = this.jsg;
		jsg.gl.activeTexture(self.TEXTURE[self.number]);
		jsg.gl.bindTexture(jsg.gl.TEXTURE_2D, self.texture);
	}

	this.delete = function(){
		this.jsg.gl.deleteTexture(this.texture);
	}
}

