var jsggl = jsggl || {};

jsggl.Drawable = function(name, globj){	
	this.vertices = [];
	this.indices = [];
	this.name = name;
	this.vboName = "";
	this.idoName = "";
	this.gl = globj.gl;
	this.jsg = globj;
	this.vertexBuffer = undefined;
	this.indexBuffer = undefined;
	this.normalsBuffer = undefined;
	this.renderingmode = this.gl.LINES;
	this.groupNameList = []
	this.material = {};
	this.material["None"] = new jsggl.Material("None", [0.001, 0.001, 0.001, 1.0], [1.0,0.0,0.0,1.0], [1.0, 1.0, 1.0, 1.0]);	
	this.material["Material"] = new jsggl.Material("Material", [0.001, 0.001, 0.001, 1.0], [0.0,1.0,0.0,1.0], [1.0, 1.0, 1.0, 1.0]);	
	this.material["Material.001"] = new jsggl.Material("Material", [0.001, 0.001, 0.001, 1.0], [0.1,0.5,0.8,1.0], [1.0, 1.0, 1.0, 1.0]);	
}

jsggl.Drawable.prototype = {
	init: function() {
		this.vertexBuffer = [];
		
		
		for (var i = 0; i < this.vertices.length; i++){
			var vBuffer = this.gl.createBuffer();
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vBuffer);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices[i]), this.gl.STATIC_DRAW);
			this.vertexBuffer.push(vBuffer)
		}
	

		this.indexBuffer = [];
		this.normalsBuffer = [];
		for (var i = 0; i < this.indices.length; i++) {
			var iBuffer  = this.gl.createBuffer();
			this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, iBuffer);
			this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices[i]), this.gl.STATIC_DRAW);
			var normals = jsgutils.calcNormals(this.vertices[i], this.indices[i]);
		
   			var nBuffer = this.gl.createBuffer();
			this.indexBuffer.push(iBuffer);
			this.normalsBuffer.push(nBuffer);
    			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, nBuffer);
    			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normals), this.gl.STATIC_DRAW);
		}

		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    		this.gl.bindBuffer(this.gl.ARRAY_BUFFER,null);
	},
	
	setRenderingMode: function(rm) {
		this.renderingmode = rm;
	},

	getRenderingMode: function() {
		return this.renderingmode;
	},

	draw : function() {		
		if (this.jsg.materials){
			this.material = this.jsg.materials;
		}
		var prg = this.jsg.program;

		var pMatrix = this.jsg.getProjection();
		var mvMatrix = this.jsg.getModelView();
		
		var nMatrix = mat4.create();
		
    		mat4.copy(nMatrix, mvMatrix);
    		mat4.invert(nMatrix, nMatrix);
    		mat4.transpose(nMatrix, nMatrix);
		
		this.jsg.normalMatrix = nMatrix;
		
		if (this.groupNameList.length == 0){
			var material = this.material["None"];
			this.jsg.materialSpecular = material.specular;
			this.jsg.materialDiffuse = material.diffuse;
			this.jsg.materialAmbient = material.ambient;
			this.jsg.shader.setLocalValues(this.jsg);
			for (var i = 0; i < this.indexBuffer.length; i++) {
				if (prg.aVertexPosition >= 0){
					this.gl.enableVertexAttribArray(prg.aVertexPosition);    				
			    		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer[i]);
			    		this.gl.vertexAttribPointer(prg.aVertexPosition, 3, this.gl.FLOAT, false, 0, 0);
				}

			if (prg.aVertexNormal >= 0){
					this.gl.enableVertexAttribArray(prg.aVertexNormal);
    					this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalsBuffer[i]);
    					this.gl.vertexAttribPointer(prg.aVertexNormal, 3, this.gl.FLOAT, false, 0, 0);
				}
				this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer[i]);			
				this.gl.drawElements(this.getRenderingMode(), this.indices[i].length, this.gl.UNSIGNED_SHORT, 0);
			}
		} else {		
			for (var i = 0; i < this.indexBuffer.length; i++) {
				var group = this.groupNameList[i]
				var material = this.material[group];
				if (!material) material = this.material["None"];
				this.jsg.materialSpecular = material.specular;
				this.jsg.materialDiffuse = material.diffuse;
				this.jsg.materialAmbient = material.ambient;
				this.jsg.shader.setLocalValues(this.jsg);
				if (prg.aVertexPosition >= 0){
					this.gl.enableVertexAttribArray(prg.aVertexPosition);    				
			    		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer[i]);
			    		this.gl.vertexAttribPointer(prg.aVertexPosition, 3, this.gl.FLOAT, false, 0, 0);
				}

				if (prg.aVertexNormal >= 0){
					this.gl.enableVertexAttribArray(prg.aVertexNormal);
    					this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalsBuffer[i]);
    					this.gl.vertexAttribPointer(prg.aVertexNormal, 3, this.gl.FLOAT, false, 0, 0);
				}

				this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer[i]);				
    				this.gl.drawElements(this.getRenderingMode(), this.indices[i].length, this.gl.UNSIGNED_SHORT, 0);
			}
		}

		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
	},

	delete: function(){
		for (var i = 0; i < this.indexBuffer.length; i++){
			this.gl.deleteBuffer(this.indedexBuffer[i]);
			this.gl.deleteBuffer(this.vertexBuffer[i]);
			if (this.normalsBuffer && this.normalsBuffer[i]){
				this.gl.deleteBuffer(this.normalsBuffer[i]);
			}
		}
		this.indexBuffer = null;
		this.vertexBuffer = null;
		this.normalsBuffer = null;
	}			
}

jsggl.Object = function(name) {
	this.name = name;
	this.group = [];
	this.groupKey = {};

	this.addGroup = function(g){
		if (this.groupKey.hasOwnProperty(g.name)){
			var idx = this.groupKey[g.name];
			this.group[idx] = g;
		} else {
			var idx = this.group.length;
			this.group.push(g);
			this.groupKey[g.name] = idx;
		}
	}

	this.transformation = mat4.create();
	mat4.identity(this.transformation);
	
	this.draw = function(jsg){
		var mv = mat4.create();
		mat4.multiply(mv, jsg.getModelView(), this.transformation);
		jsg.modelViewStack.push(mv);
		for (var i = 0; i < this.group.length; i++) {
			this.group[i].draw();
		}
		jsg.modelViewStack.pop();
	}
}


jsggl.Scene = function(name){
	this.name = name;
	this.cameras = {};
	this.cameras["Default"] = new jsggl.Camera("Default", [0.0, 0.0, 0.0], [0.0, 0.0, -1.0], [0.0, 1.0, 0.0]);
	this.activeCamera = "Default";
	this.objects = [];
	this.objectKey = {};

	this.addObject = function(obj) {
		if (this.objectKey.hasOwnProperty(obj.name)){
			var idx = this.objectKey[obj.name];
			this.objects[idx] = obj;
		} else {
			var idx = this.objects.length;
			this.objects.push(obj);
			this.objectKey[obj.name] = idx;
		}
	}

	this.setActiveCamera = function(camName){ 
		if (this.cameras.hasOwnProperty(camName)){
			this.activeCamera = camName;
			return true;
		}
		return false;
	}

	this.draw = function(jsg){
		var cam = this.cameras[this.activeCamera];
		var cm = cam.getMatrix();
		mat4.multiply(cm, jsg.getModelView(), cm);
		jsg.modelViewStack.push(cm);
		for (var i = 0; i < this.objects.length; i++) {
				this.objects[i].draw(jsg);
		}
		jsg.modelViewStack.pop();
	}
}

