package {
    import flash.display.BitmapData;
    import flash.display.Bitmap;
    import flash.display.MovieClip;
    import flash.geom.Rectangle;
    import flash.media.Camera;
    import flash.media.Video;
    import flash.events.StatusEvent;
    import flash.events.Event;
    import flash.utils.ByteArray;
    import flash.external.ExternalInterface;
    public class Camera_getCameraExample extends MovieClip {
       	var vid:Video;
	var cam:Camera;
	function Camera_getCameraExample(){ 
		cam = Camera.getCamera(); 
 		ExternalInterface.addCallback("capture", capture);
		if (cam == null) 
		{ 
    			trace("Unable to locate available cameras."); 
			ExternalInterface.call("onFail", "unable to locate available cameras.");
		} 
		else 
		{ 
    			trace("Found camera: " + cam.name); 
			var cfg = ExternalInterface.call("getJSGCamConfig");
			var c = cfg.split(";");       		
                	cam.setMode(parseInt(c[0]), parseInt(c[1]), parseInt(c[2])); 
                	cam.addEventListener(StatusEvent.STATUS, statusHandler); 
    			vid = new Video(cam.width, cam.height); 
    			vid.attachCamera(cam); 
			if (!cam.muted){
				addChild(vid);
			} 


		} 
	}

	function statusHandler(event:StatusEvent):void 
	{ 
    		if (cam.muted) 
    		{ 
        		trace("Unable to connect to active camera."); 
			ExternalInterface.call("onFail", "Unable to connect to active camera."); 
    		} 
    		else 
    		{ 
        		// Resize Video object to match camera settings and  
        		// add the video to the display list. 
        		vid.width = cam.width; 
        		vid.height = cam.height; 
			addChild(vid);
			ExternalInterface.call("onSuccess");
    		} 
    		// Remove the status event listener. 
    		cam.removeEventListener(StatusEvent.STATUS, statusHandler); 
		
	}

	function capture(){			
		var bd:BitmapData = new BitmapData(vid.width, vid.height, true);
		bd.draw(vid);
		var data:Array = new Array();
		for (var i = 0; i < vid.height; i++){
			for (var j = 0; j < vid.width; j++){
				var intVal = bd.getPixel(j, i);
				var r = (intVal >> 16) & 0xff;
                		var g = (intVal >> 8) & 0xff;
                		var b = (intVal ) & 0xff;
				data.push(r); data.push(g); data.push(b); data.push(255);
			}
		}
		return data;
	}
    }
}

