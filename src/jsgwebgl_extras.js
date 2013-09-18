jsggl = jsggl || {};

jsggl.ShadowMapping = function(jsg, w, h) {
	this.renderer = jsggl.TextureRendering(jsg, w, h);

}

jsggl.TextureRendering = function (jsg, w, h){
    this.framebuffer;
    this.texture;
    this.renderbuffer;
    var gl = jsg.gl;
    this.width = w;
    this.height = h;
    
    this.build = function() {
        this.framebuffer = gl.createFramebuffer();
        this.texture = gl.createTexture();
        this.renderbuffer = gl.createRenderbuffer();
		return this;
    }
    
    this.bind = function(t){
        this.framebuffer.width = this.width;
        this.framebuffer.height = this.height;
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);       
        
		this.activeTexture(t);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.framebuffer.width, this.framebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.generateMipmap(gl.TEXTURE_2D);
 
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.framebuffer.width, this.framebuffer.height);
        
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);
    }
 
	this.activeTexture = function(t) {
		switch(t) {
			case 0: gl.activeTexture(gl.TEXTURE0); break;
			case 1: gl.activeTexture(gl.TEXTURE1); break;
			case 2: gl.activeTexture(gl.TEXTURE2); break;
		}
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
	}
 
    this.unbind = function() {
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);   
    }
	
	this.delete = function(){
		gl.deleteTexture(this.texture);
	}
	
}

