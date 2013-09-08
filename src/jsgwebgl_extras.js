jsggl = jsggl || {};

jsggl.ShadowMapping = function(jsg, w, h) {
	this.renderer = jsggl.TextureRendering(jsg, w, h);

}


jsggl.TextureRendering = function (jsg, w, h){
    this.frameBuffer;
    this.texture;
    this.renderBuffer;
    var gl = jsg.gl;
    this.width = w;
    this.height = h;
    
    this.build = function() {
        this.frameBuffer = gl.createFrameBuffer();
        this.texture = gl.createTexture();
        this.renderBuffer = gl.createRenderBuffer();
    }
    
    this.bind = function(){
        gl.bindFrameBuffer(gl.FRAMEBUFFER, this.frameBuffer);
        this.frameBuffer.width = this.width;
        this.frameBuffer.height = this.height;
        
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.framebuffer.width, this.framebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        
        gl.bindRenderBuffer(gl.RENDERBUFFER, this.renderBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.framebuffer.width, this.framebuffer.height);
        
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);
    }
    
    this.unbind = function() {
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);   
    }
}