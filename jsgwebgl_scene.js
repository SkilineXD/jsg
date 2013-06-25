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
	this.groups = new jsgcol.ArrayMap();

	this.addGroup = function(g){
		this.groups.put(g.name, g);
	}

	this.removeGroup = function(name){
		this.groups.remove(name);
	}

	this.transformation = mat4.create();
	mat4.identity(this.transformation);
	
	this.draw = function(jsg){
		var mv = mat4.create();
		mat4.multiply(mv, jsg.getModelView(), this.transformation);
		jsg.modelViewStack.push(mv);
		var keys = this.groups.getKeys();
		for (var i = 0; i < keys.length; i++) {
			this.groups.get(keys[i]).draw();
		}
		jsg.modelViewStack.pop();
	}
}


jsggl.Scene = function(name){
	this.name = name;
	this.cameras = {};
	this.cameras["Default"] = new jsggl.TCamera("Default", [0.0, 0.0, 0.0], 10, 10, 0);
	this.activeCamera = "Default";
	this.objects = new jsgcol.ArrayMap();


	this.addObject = function(obj) {
		this.objects.put(obj.name, obj);
	}

	this.removeObject = function(name) {
		this.objects.remove(name);
	}

	this.getActiveCamera = function(){
		return this.cameras[this.activeCamera];
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
		var keys = this.objects.getKeys();
		for (var i = 0; i < keys.length; i++) {
			this.objects.get(keys[i]).draw(jsg);
		}
		jsg.modelViewStack.pop();
	}
}

