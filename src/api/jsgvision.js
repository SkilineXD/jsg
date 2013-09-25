function JsgVision(jsg2d) {
	this.avg = [0.0, 0.0, 0.0];
	this.std = [0.0, 0.0, 0.0];
	this.n = 0;
	this.mins = 0;
	this.minh = 0;
	this.maxs = 0;
	this.maxh = 0;
	this.jsg2d = jsg2d;
	var self = this;

	this.parseImageData = function(data, callback, paramList, minW, minH, maxW, maxH){
		if (!minW) minW = 0;
		if (!minH) minH = 0;
		if (!maxW) maxW = data.width;
		if (!maxH) maxH = data.height;
		for (var i = minW; i < maxW; i++){ 
			for (var j = minH; j < maxH; j++) {
				if (typeof(callback) == "function"){
					var p = self.jsg2d.getPixel(data, i, j);
					callback(data, i, j, p, paramList);
				} else {
					for (var k = 0; k < callback.length; k++) {
						var p = self.jsg2d.getPixel(data, i, j);
						callback[k](data, i, j, p, paramList);
					}
				}
			}
		}
		return data;
	};

	this.newGenericImageData = function(data){
		var pData = new Array(data.width * data.height * 4);
		var pImg = new Object();
		pImg.data = pImg;
		pImg.width = data.width;
		pImg.height = data.height;
		return pImg;		
	};

	this.NORM_RGB = function(data, i, j, p){
		var s = p[0] + p[1] + p[2];
		self.jsg2d.setPixel(out, i, j, p[0]/s, p[1]/s, p[2]/s, 255);
	};

	this.INORM_RGB = function(data, i, j, p){
		self.jsg2d.setPixel(p[0] * 255, p[1] * 255, p[2] * 255);		 
	};

	this.getHandStd = function(data, i, j, p){
		var a = p[0];
		var b = p[1];
		var c = p[2];
		self.std[0] += (a - self.avg[0])*(a - self.avg[0]);
		self.std[1] += (b - self.avg[1])*(b - self.avg[1]);
		self.std[2] += (c - self.avg[2])*(c - self.avg[2]);
		self.n++;
	};

	this.getHandStatistical = function(data, mw, mh, mxw, mxh){
		self.mins = 1.0;
		self.minh = 360.0;
		self.maxs = 0.0;
		self.maxh = 0.0;

		self.avg = [0.0, 0.0, 0.0];
		self.std = [0.0, 0.0, 0.0];
		self.n = 0;
		self.parseImageData(data, self.getHandAverage, undefined, mw || 0, mh || 0, mxw || data.width, mxh || data.height);

		self.avg[0] /= self.n;
		self.avg[1] /= self.n;
		self.avg[2] /= self.n;
		self.n = 0;
		self.parseImageData(data, self.getHandStd);
		self.std[0] /= (self.n-1);
		self.std[1] /= (self.n-1);
		self.std[2] /= (self.n-1);
		self.std[0] = Math.sqrt(self.std[0]);
		self.std[1] = Math.sqrt(self.std[1]);
		self.std[2] = Math.sqrt(self.std[2]);
	};

	this.getHandAverage = function(data, i, j, p) {
		self.avg[0] += p[0];
		self.avg[1] += p[1];
		self.avg[2] += p[2];

		if (self.maxs < p[1])  self.maxs = p[1];
		else if (self.mins > p[1]) self.mins = p[1];

		if (self.maxh < p[0])  this.maxh = p[0];
		else if (self.minh > p[0]) self.minh = p[0];
		
		self.n++;	
	};

	this.erode = function(src){
		return self.morf_meta(src, 0);
	};

	this.dilatation = function(src){
		return self.morf_meta(src, 255);
	};

	this.morf_meta = function(src, ref){
		var obj = self.jsg2d.createImageData(src.width, src.height);
		var i = 0;
		while ( i  < src.width) {
			var j = 0;
			while (j < src.height){
				var cp = self.jsg2d.getPixel(src, i, j);
				self.jsg2d.setPixel(obj, i, j, cp[0], cp[1], cp[2], 255);
				if (cp[0] == 255-ref) {
					var  l = i - 1 > 0 ? [i - 1, j] : undefined;
					var  r = i + 1 < src.width ?  [i + 1, j]: undefined;
					var  t = j - 1 > 0 ? (i, j - 1) : undefined;
					var  b = j + 1 < src.height ? [i, j + 1]: undefined;
					//var lt = l && t ? [l, t] : undefined;
					//var lb = l && b ? [l, b] : undefined;
					//var rt = r && t ? [r, t] : undefined;
					//var rb = r && b ? [r, b] : undefined;
					var m = [t, l, r, b] ;
					INNER_SEARCH:
					for (var k = 0; k < m.length; k++) {
						var v = m[k];
						if (v) {
							var p = self.jsg2d.getPixel(src, v[0], v[1]);
							if (p[0] == ref) {
								self.jsg2d.setPixel(obj, i, j, ref,ref,ref, 255);
								break INNER_SEARCH;
							}
						}
					}
				}
				j++;
			}
			i++;
		}
		return obj;
	};


	this.RGB2HSV = function(data, i, j, p, out) {
		var max = 0, min = 0, h, s, v;
		for (var k = 1; k < 3; k++){
			if (p[max] < p[k]) max = k;
			if (p[min] > p[k]) min = k;
		}			
		var d = p[max] - p[min];
		s = d/p[max];
		v = p[max];
		if (d != 0){
			if (max == 0) { 
				h = 60 * (p[1] - p[2])/d;
				if (p[1] < p[2]) h += 360; 
			} else if (max == 1){ 
				h = 60 * (p[2] - p[0])/d + 120;		
			} else {
				h = 60 * (p[0] - p[1])/d + 240;
			}
		} else {
			h = 0;
		}
		self.jsg2d.setPixel(out, i, j, h, s, v, 255);
	};

	this.SEG_HSV_AVGSTD = function(data, i, j, p, out){
		var m = [20.685, 0.32, 147.23];
		var d = [20.25, 0.32, 142.74];
		self.jsg2d.setPixel(out, i, j, p[0], p[1], p[2], 255);
		self.RGB2HSV(data, i, j, p, out);
		p = self.jsg2d.getPixel(out, i, j);
		if (Math.abs(p[0] - m[0]) <= d[0] && Math.abs(p[1]-m[1]) <= d[1]){
			self.jsg2d.setPixel(data, i, j, 255,255,255, 255);
		} else {
			self.jsg2d.setPixel(data, i, j, 0,0,0, 255);
		}
	};

	this.SEG_RGB_RULES = function(data, i, j, p) {
		var max = Math.max(Math.max(p[0],p[1]), p[2]);
		var min = Math.min(Math.min(p[0],p[1]), p[2]);
		if (p[0] > 95 && p[1] > 40 && p[2] > 20 && max - min > 15 && 
		    Math.abs(p[0]-p[1])>15 && p[0] > p[1] && p[0] > p[2]){
			self.jsg2d.setPixel(data, i, j, 255, 255, 255, 255);
		} else {
			self.jsg2d.setPixel(data, i, j, 0, 0, 0, 255);
		}
	};

	this.HIST_RGB = function(data, i, j, p, matriz){
		matriz[p[0]]++;
		matriz[p[1]]++;
		matriz[p[2]]++;
	};

	this.getStatisticString = function() {
		var display = "<div>avg = [";
		for (var i = 0; i < self.avg.length; i++) {
			if (i != 0) display += ", ";
			display += self.avg[i].toFixed(6);
		}	
		display += "]</div>";

		display += "<div>std = [";
		for (var i = 0; i < self.std.length; i++) {
			if (i != 0) display += ", ";
			display += self.std[i].toFixed(6);
		}	
		display += "]</div>";

		display += "<div> min hue = " + self.minh + ", max hue = " + self.maxh + "</div>";
		display += "<div> min saturation = " + self.mins + ", max saturation = " + self.maxs + "</div>";  

	};	

	this.getNeighborhood = function(i, j, w, h){
		var n = new Array();
		var  l = i - 1 > 0 ? [i - 1, j] : undefined;
		var  r = i + 1 < w ?  [i + 1, j]: undefined;
		var  t = j - 1 > 0 ? (i, j - 1) : undefined;
		var  b = j + 1 < h ? [i, j + 1]: undefined;
		var lt = l && t ? [l, t] : undefined;
		var lb = l && b ? [l, b] : undefined;
		var rt = r && t ? [r, t] : undefined;
		var rb = r && b ? [r, b] : undefined;
		return [lt, t, rt, l, r, lb, b, rb];
	}

	this.GET_WHITEPIXELSBYPOS = function(data, i, j, p, stat){
		stat[0][i] = stat[0][i] || 0;
		stat[1][j] = stat[1][j] || 0;
			
		if (p[0] == 255) {
		 	stat[0][i]++;
			stat[1][j]++;
		}
	};
}

