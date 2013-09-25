
FlashCam = function(base){
	this.base = base;
	this.width = base.width;
	this.height = base.height;
	this.callback = function(){};
	this.ready = false;
	window.jsgcam = base;
	window.onSuccess = this.onSuccess;
	window.onFail = this.onFail;
	window.getJSGCamConfig = this.getJSGCamConf;
}

FlashCam.prototype = {
	getHTMLFlash: function(){
		var ef = document.getElementById("iembedflash");
		if (!ef){
			var fhtml = '<object  id="iembedflash" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0" width="' + this.base.width + '" height="'  + this.base.height + '"><param name="movie" value="webcam.swf"></param><param name="quality" value="high"></param><param name="allowScriptAccess" value="always"></param><embed  allowScriptAccess="always"  id="embedflash" src="webcam.swf" quality="high" width="' + this.base.width + '" height="' + this.base.height + '" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" mayscript="true"></embed></object>';
		       this.base.container.innerHTML += fhtml;			
		};
	},

	getJSGCamConf: function(){		
		var cfg = window.jsgcam.width + ";" + window.jsgcam.height + ";" + (window.jsgcam.frame || 24);
		return cfg;	
	},

        capture: function(callback) {
	    this.callback = callback;
	    try{
		this.flash = document.getElementById("embedflash");
            	var data = this.flash.capture();
		this.callback(data);
		return true;
	    } catch(error){
		this.error = error;
		return false;
	    }
        },

	isReady : function(){
		return this.ready;
	},

	drawImageData: function(canvas, data){
	    var w = window.jsgcam.width;
	    var h = window.jsgcam.height;
	    var ctx = canvas.getContext("2d");
	    ctx.clearRect(0, 0, w, h);
	    var imgDt = ctx.getImageData(0,0, w, h);
	 
	    for (var c = 0; c < data.length; c++){
	    	imgDt.data[c] = data[c];
            }

	    ctx.putImageData(imgDt, 0, 0);
	},

	onSuccess: function() {
		window.jsgcam.camera.ready = true;	
	},

	onFail: function(msg) {
		window.jsgcam.camera.ready = false;
	},
	
	start: function(){
		this.getHTMLFlash();
	}
}

DefaultCam = function(base){
	this.base = base;
	this.buffer = document.createElement("canvas");
	this.buffer.width = base.width;
	this.buffer.height = base.height;
	this.video = document.createElement("video");
	this.video.width = this.base.width;
	this.video.height = this.base.height;
	if (base.visible) {
		base.container.appendChild(this.video);
	}
	window.jsgcam = base;
	this.video.addEventListener("playing", function () {
    		window.jsgcam.camera.ready = true;
	}, false);
	this.ready = false;
}

DefaultCam.prototype = {
	start : function() {
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || msGetUserMedia;
		this.base.getUserMedia();
	},

	capture: function(callback) {
		if (this.ready){
			callback(this.video);
			return true;
		} else {
			return false;
		}
	},

	drawImageData: function(canvas, data){
		try{
			canvas.getContext("2d").drawImage(data, 0, 0, 640, 480, 0, 0, canvas.width, canvas.height);
		}catch(err){}
	},

	onSuccess: function(stream){
		window.jsgcam.camera.video.src = window.URL.createObjectURL(stream);
		localMediaStream = stream;
		window.jsgcam.camera.video.play();	
	},

	isReady: function(){
		return this.ready;
	},

	onFail: function(err){
		this.error = err;
	}
}


JsgCam = function(container, width, height, visible){
	this.container = container;
	this.camera = undefined;
	this.use_video = true;
	this.use_audio = true;
	this.width = width;
	this.height = height;
	this.visible = visible;
}

JsgCam.prototype = {
	hasGetUserMedia: function() {
  		return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
            		navigator.mozGetUserMedia || navigator.msGetUserMedia);
	},	

	getUserMedia: function() {	
		navigator.getUserMedia({video:this.use_video, audio: this.use_audio}, this.camera.onSuccess, this.camera.onFail);
	},

	getCamera: function(optFlash){
		if (this.hasGetUserMedia()) {
			this.camera = new DefaultCam(this);
		} else if (optFlash) {
			this.camera = new FlashCam(this);
		} 
		if (this.camera){
			this.camera.start();
			return this.camera;
		}
		return null;
	}
}

