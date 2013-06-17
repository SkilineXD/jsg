var jsggl = jsggl || {};

jsggl.Material = function(name, matAmb, matDiffuse, matSpecular) {
	this.name = name;
	this.specular = matAmb;
	this.diffuseColor = matDiffuse;
	this.specularColor = matSpecular;
}

jsggl.loadMaterialsFromJSON = function(jsg, obj){
	jsg.materials = {}
	for (i = 0; i < obj.materialList.length; i++) {
		var mtl = obj.materialList[i];
		jsg.materials[mtl.name] = mtl;
	}
}
