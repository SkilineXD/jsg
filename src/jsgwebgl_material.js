var jsggl = jsggl || {};

jsggl.Material = function(name, matAmb, matDiffuse, matSpecular, shininess) {
	this.name = name;
	this.ambient = matAmb;
	this.diffuse = matDiffuse;
	this.specular = matSpecular;
	this.shininess = shininess;
}


jsggl.Material.newMaterial = function(name, ambient, diffuse, specular, s, t, o) {
 	return {"name":name, "ambient":ambient, "diffuse":diffuse, "specular":specular || [0.0, 0.0, 0.0, 1.0], "shininess":s || 100.0, "transparence":t || 1.0, "opticalDensity":o || 1.0};
}

jsggl.Material.loadFromJSON = function(jsg, obj){
	jsg.materials = jsg.materials || {};
	for (i = 0; i < obj.materialList.length; i++) {
		var mtl = obj.materialList[i];
		jsg.materials[mtl.name] = mtl;
	}
}
