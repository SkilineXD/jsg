var jsggl = jsggl || {};

jsggl.Material = function(name, matAmb, matDiffuse, matSpecular) {
	this.name = name;
	this.ambient = matAmb;
	this.diffuse = matDiffuse;
	this.specular = matSpecular;
}

jsggl.Material.loadMaterialsFromJSON = function(jsg, obj){
	jsg.materials = jsg.materials || {};
	for (i = 0; i < obj.materialList.length; i++) {
		var mtl = obj.materialList[i];
		jsg.materials[mtl.name] = mtl;
	}
}
