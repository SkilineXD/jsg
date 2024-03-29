function createJSGObject(cvid) {
	var jsg = new Object();
	jsg.canvas = document.getElementById(cvid);
	jsg.jqcanvas = $("#" + jsg.canvas.id);
	if (jsg.canvas) {
		jsg.getContext2d = function() {
			return jsg.canvas.getContext("2d");
		}

		jsg.clearColor = function(waitFlushCommand){
			if (!waitFlushCommand) {
				jsg2d.save();
				jsg2d.context.fillStyle = jsg2d.context.style = jsg.background;
				jsg2d.context.fillRect(0,0, jsg.canvas.width, jsg.canvas.height);
				jsg2d.restore();
			} else {
				jsg.frontBuffer = jsg.jsg2d.createImageData(jsg.jsg2d.getImageData());
				jsg.flush();
			}
		}

		jsg.setBackground = function(r, g, b) {
			jsg.background = "rgb(" + r + ", " + g + ", " + b + ")";
		}

		jsg.flush = function(){
			jsg.jsg2d.putImageData(jsg.frontBuffer);
		}
		
		jsg.setDefaultCoordSystem = function(){			
			jsg.MAXX = jsg.canvas.width - 1;
			jsg.MAXY = jsg.canvas.height - 1;
			
			jsg.right = jsg.MAXX, jsg.left = 0, jsg.top = 0.00, jsg.bottom = jsg.MAXY;
						
			
			jsg.pixelWidth = (jsg.right-jsg.left)/jsg.MAXX;
			jsg.pixelHeight = Math.abs(jsg.top-jsg.bottom)/jsg.MAXY;
			
			jsg.pointWidth = 1/jsg.pixelWidth;
			jsg.pointHeight = -1/jsg.pixelHeight;
			

			jsg.drawBorders = function() {
				var ctx = jsg.getContext2d();
				ctx.beginPath();
					ctx.rect(0, 0, jsg.MAXX, jsg.MAXY); 
				ctx.closePath();
				ctx.stroke();
			}
			
			jsg.xToScr = function (x) {
				return Math.round(x/jsg.pixelWidth);
			}

			jsg.yToScr = function(y) {
				return Math.round(jsg.MAXY - y/jsg.pixelHeight);
			}

			jsg.scrToX = function(x) {
				return x*jsg.pixelWidth;
			}

			jsg.scrToY = function(y) {
				return (jsg.MAXY - y)*jsg.pixelHeight;
			}
		}

		jsg.setDeviceCoordSystem = function(){
			jsg.MAXX = jsg.canvas.width - 1;
			jsg.MAXY = jsg.canvas.height - 1;
	
			jsg.right = jsg.MAXX, jsg.left = 0, jsg.top = 0, jsg.bottom = jsg.MAXY;
						
			
			jsg.pixelWidth = 1;
			jsg.pixelHeight = 1;
			
			jsg.pointWidth = 1;
			jsg.pointHeight = 1;
			
			
			jsg.drawBorders = function() {
				var ctx = jsg.getContext2d();
				ctx.beginPath();
					ctx.rect(0, 0, jsg.MAXX, jsg.MAXY); 
				ctx.closePath();
				ctx.stroke();
			}
			
			jsg.xToScr = function (x) {
				return x;
			}

			jsg.yToScr = function(y) {
				return y;
			}

			jsg.scrToX = function(x) {
				return x;
			}

			jsg.scrToY = function(y) {
				return y;
			}
		}


		jsg.setIsotropicCoordSystem = function (xwidth, ywidth){
			jsg.right = xwidth/2, jsg.left = -xwidth/2, jsg.top = ywidth/2, jsg.bottom = -ywidth/2;
			jsg.centerX = jsg.MAXX/2;
			jsg.centerY = jsg.MAXY/2;
			jsg.XWIDTH = xwidth;
			jsg.YWIDTH = ywidth;
			jsg.pixelSize = Math.max(xwidth/jsg.MAXX, ywidth/jsg.MAXY);
			jsg.pixelWidth = jsg.pixelSize;
			jsg.pixelHeigth = -jsg.pixelSize;
			jsg.pointWidth = 1/jsg.pixelSize;
			jsg.pointHeight = -1/jsg.pixelSize;
			
			jsg.xToScr = function(x) {
				return Math.round(jsg.centerX + x/jsg.pixelSize); 
			}
	
			jsg.yToScr = function(y) {
				return Math.round(jsg.centerY  - y/jsg.pixelSize); 
			}
	
			jsg.scrToX = function(x) {
				return (x - jsg.centerX)*jsg.pixelSize;
			}
	
			jsg.scrToY = function(y) {
				return (jsg.centerY - y)*jsg.pixelSize;
			}
	
			jsg.drawBorders = function() {
				jsg.jsg2d.begin();
					jsg.jsg2d.wireRect(-jsg.XWIDTH/2, -jsg.YWIDTH/2, jsg.XWIDTH/2, jsg.YWIDTH/2); 
				jsg.jsg2d.end();
			}
		}

		jsg.widthToScr = function(w) {
			return w * jsg.pointWidth;
		}

		jsg.widthToWorld = function(w) {
			return w/jsg.pointWidth;
		}

		jsg.heightToWorld = function(h) {
			return h/jsg.pointHeight;
		}

		jsg.heightToScr = function(h) {
			return h * jsg.pointHeight;
		}

		jsg.stop = function() {
			jsg.stopped = true;
		}
		
		jsg.restart = function() {
			if (jsg.stopped) {
				jsg.stopped = false;
				jsg.restartHandler();
				window.requestAnimationFrame(jsg.privateDisplay);
			}
		}
		
		jsg.getCanvasCoords = function(pageX, pageY) {
			var bww =  jsg.jqcanvas.outerWidth() - jsg.jqcanvas.innerWidth() + jsg.jqcanvas.offset().left;
			var bwh = jsg.jqcanvas.outerHeight() - jsg.jqcanvas.innerHeight() + jsg.jqcanvas.offset().top;
			return new jsgutils.Point2D(jsg.scrToX(pageX  - bww), jsg.scrToY(pageY  - bwh));
		}
		
		if (!jsg.restartHandler){
			jsg.restartHandler = function(){}
		}
		
		if (!jsg.display) {
			jsg.display = function(){}
		}
		
		if (!jsg.initialize){
			jsg.initialize = function(){}
		}
		
		if (!jsg.finalize) {
			jsg.finalize = function(){}
		}
		
		
		if (!window.requestAnimationFrame){ //if browser not support requestAnimationFrame feature
			window.requestAnimationFrame = function(target){
				window.setInterval(target, this.interval);
			};
		}
		
		jsg.privateDisplay = function(time){
			if (!time) {
				time = +new Date();
			}
			jsg.frameTime = time;
			if (!jsg.stopped) {
				if (!jsg.started) {
					jsg.started = true;
					jsg.initialize();
				}
				jsg.display();
				window.requestAnimationFrame(jsg.privateDisplay);
			} else {
				jsg.finalize();
			}
		}
		
		jsg.mainLoop = function() {
			window.requestAnimationFrame(jsg.privateDisplay);	
		}
		
		if (createJSG2DObject) {
			jsg.jsg2d = createJSG2DObject(jsg);
		}

		function getCanvasCoords(pageX, pageY) {
			var bww =  jqmaincanvas.outerWidth() - jqmaincanvas.innerWidth();
			var bwh = jqmaincanvas.outerHeight() - jqmaincanvas.innerHeight();
			if (bww == 0) bww = jqmaincanvas.offset().left;
			if (bwh == 0) bwh = jqmaincanvas.offset().top;
			return [pageX  - bww, pageY  - bwh];
		}

		jsg.jsg2d.context = jsg.getContext2d();
		jsg.interval = 60/1000;
		jsg.stopped = false;
		jsg.background = "rgb(255, 255, 255)";
		jsg.setDefaultCoordSystem();
		return jsg;
	} else {
		return null;
	}
}
