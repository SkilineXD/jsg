var jsggl = jsggl || {};

jsggl.Material = function(name, matAmb, matDiffuse, matSpecular) {
	this.name = name;
	this.color = matAmb;
	this.diffuseColor = matDiffuse;
	this.specularColor = matSpecular;
}
