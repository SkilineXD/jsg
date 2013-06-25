"use strict"

function createJSG2DObject(jsg) {
	var jsg2d = new Object();
	
	jsg2d.jsg = jsg;
	
	jsg2d.begin = function() {
		jsg2d.context.beginPath();
	}

	jsg2d.save = function(){ 
		jsg2d.context.save();
	}
	
	jsg2d.restore = function() {
		jsg2d.context.restore();
	}

	jsg2d.end = function() {
		jsg2d.context.closePath();
	}
	
	jsg2d.strokeStyle = function(str){
		jsg2d.context.strokeStyle = str;
	}
	
	jsg2d.fillStyle = function(str) {
		jsg2d.context.fillStyle = str;
	}
	
	jsg2d.fill = function() {
		jsg2d.context.fill();
	}
	
	jsg2d.moveTo = function(x1, y1){
		var ctx = jsg2d.context, jsg = jsg2d.jsg;
		ctx.moveTo(jsg.xToScr(x1), jsg.yToScr(y1));
	}

	jsg2d.lineTo = function(x1, y1) {
		var ctx = jsg2d.context, jsg = jsg2d.jsg;
		ctx.lineTo(jsg.xToScr(x1), jsg.yToScr(y1));
	}
	
	
	jsg2d.stroke = function() {
		jsg2d.context.stroke();
	}
	
	jsg2d.drawLine = function (x1, y1, x2, y2){
		var ctx = jsg2d.context, jsg = jsg2d.jsg;
		ctx.moveTo(jsg.xToScr(x1), jsg.yToScr(y1));
		ctx.lineTo(jsg.xToScr(x2), jsg.yToScr(y2));
		ctx.stroke();
	}

	jsg2d.fillArc = function(cx, cy, radio, startAngle, endAngle, ccw) {
		var ctx = jsg2d.context, jsg = jsg2d.jsg;
		
		var r = Math.abs(Math.max(jsg.widthToScr(radio), jsg.heightToScr(radio)));
		
		ctx.arc(jsg.xToScr(cx), jsg.yToScr(cy), r, startAngle, endAngle, ccw);
		ctx.fill();
	}

	jsg2d.drawArc = function(cx, cy, radio, startAngle, endAngle, ccw) {
		var ctx = jsg2d.context, jsg = jsg2d.jsg;
		var r = Math.max(jsg.widthToScr(radio), jsg.heightToScr(radio));
		ctx.arc(jsg.xToScr(cx), jsg.yToScr(cy), r, startAngle, endAngle, ccw);
		ctx.stroke();
	}

	jsg2d.fillCircle = function(cx, cy, radio){
		jsg2d.fillArc(cx, cy, radio, 0, 2 * Math.PI, true);
	}
	
	jsg2d.drawCircle = function(cx, cy, radio){
		jsg2d.drawArc(cx, cy, radio, 0, 2 * Math.PI, true);
	}

	jsg2d.bezierCurveTo = function(cp1x, cp1y, cp2x, cp2y, x, y) {
		var ctx = jsg2d.context;
		var jsg = jsg2d.jsg;
		
		ctx.bezierCurveTo(jsg.xToScr(cp1x), jsg.yToScr(cp1y), jsg.xToScr(cp2x), 
			jsg.yToScr(cp2y), jsg.xToScr(x), jsg.yToScr(y) );
		
		ctx.stroke();
	}

	jsg2d.fillRect = function(x, y, w, h) {
		var ctx = jsg2d.context, jsg = jsg2d.jsg;
		var jsg = jsg2d.jsg;
		ctx.fillRect(jsg.xToScr(x), jsg.yToScr(y), jsg.widthToScr(w), jsg.heightToScr(h));
		ctx.fill();
	}

	jsg2d.drawRect = function(x, y, w, h) {
		var ctx = jsg2d.context, jsg = jsg2d.jsg;
		var jsg = jsg2d.jsg;
		ctx.rect(jsg.xToScr(x), jsg.yToScr(y), jsg.widthToScr(w), jsg.heightToScr(h));
		ctx.stroke();
	}

	jsg2d.wireRect = function(x1, y1, x2, y2) {
		var ctx = jsg2d.context, jsg = jsg2d.jsg;
		var jsg = jsg2d.jsg;
		jsg2d.drawLine(x1, y1, x2, y1);
		jsg2d.drawLine(x2, y1, x2, y2);		
		jsg2d.drawLine(x2, y2, x1, y2);
		jsg2d.drawLine(x1, y2, x1, y1);
	}
	
	jsg2d.rotate = function(angle){
		var ctx = jsg2d.context, jsg = jsg2d.jsg;
		var x = jsg.xToScr(0), y = jsg.yToScr(0);
		ctx.translate(x, y);
		ctx.rotate(angle);
		ctx.translate(-x, -y);
	}
	
	jsg2d.scale = function(sx, sy){
		var ctx = jsg2d.context, jsg = jsg2d.jsg;
		var x = jsg.xToScr(0), y = jsg.yToScr(0);
		ctx.translate(x, y);
		ctx.scale(sx, sy);
		ctx.translate(-x, -y);
	}
	
	jsg2d.translate = function(dx, dy) {
		var ctx = jsg2d.context, jsg = jsg2d.jsg;
		ctx.translate(jsg.widthToScr(dx), jsg.heightToScr(dy));
	}
	
	jsg2d.drawImage = function(img, sx, sy, sw, sh, x, y, w, h){
		var width = w || jsg2d.jsg.canvas.width;
		var height = h || jsg2d.jsg.canvas.height;
		jsg2d.context.drawImage(img, sx || 0, sy || 0, sw || img.width, sh || img.height, x || 0, y || 0, width, height);
	}

	jsg2d.createImageData = function(a, b){
		if (a && b){
		 return jsg2d.context.createImageData(a, b);
		} else if (a) {
			return jsg2d.context.createImageData(a.width, a.height);
		}
	}

	jsg2d.getPixelByIndex = function(imgDt, idx) {
		return [imgDt.data[idx+0],
		imgDt.data[idx+1],
		imgDt.data[idx+2],
		imgDt.data[idx+3]];
	} 

	jsg2d.getPixel = function(imgDt, x, y) {
		var idx = y * imgDt.width * 4 + x * 4;
		return jsg2d.getPixelByIndex(imgDt, idx);
	}

	jsg2d.setPixelByIndex = function(imgDt, idx, R, G, B, A) {
		imgDt.data[idx] = R;
		imgDt.data[idx+1] = G;
		imgDt.data[idx+2] = B;
		imgDt.data[idx+3] = A;
	} 

	jsg2d.setPixel = function(imgDt, x, y, R, G, B, A) {
		var idx = y * imgDt.width * 4 + x * 4;
		jsg2d.setPixelByIndex(imgDt, idx, R, G, B, A);
	}
	
	jsg2d.getImageData = function(x, y, w, h) {
		return jsg2d.context.getImageData(x || 0, y || 0, w || jsg.canvas.width, h || jsg.canvas.height);
	}

	jsg2d.putImageData = function(imgDt, x, y){
		return jsg2d.context.putImageData(imgDt, x || 0, y || 0);
	}

	jsg2d.Point2D = function(x, y) {
		this.x = x;
		this.y = y;	
	}

	jsg2d.clear = function(){
		jsg2d.clearRect(0, 0, jsg2d.jsg.width, jsg2d.jsg.height);
	}

	jsg2d.font = function(style) {
		jsg2d.context.font = style;
	}

	jsg2d.fillText = function(text, x, y){
		var jsg = jsg2d.jsg;
		jsg2d.context.fillText(text, jsg.xToScr(x), jsg.yToScr(y));
	}

	jsg2d.strokeText = function(text, x, y) {
		jsg2d.context.strokeText(text, jsg2d.jsg.xToScr(x), jsg2d.jsg.yToScr(y));
	}

	jsg2d.drawText = function(text, x, y, style){
		if (style) {
			jsg2d.context.font=style;
		}
		jsg2d.context.fillText(text,jsg2d.jsg.xToScr(x), jsg2d.jsg.yToScr(y));

	}

	jsg2d.Line2D = function(p1, p2) {
		this.firstPoint = p1;
		this.lastPoint = p2;
	}
	
	return jsg2d;
}

