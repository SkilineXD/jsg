var jsgcol = jsgcol || {};

jsgcol.ArrayMap = function(){
	this.keys = {};
	this.data = [];
	this.next = [0];
	this.keyList = [];
	this.p = 0;
	
	this.shiftNext = function() {
		if (this.p == 0) {
			this.next[this.p]++;
		} else {
			this.next.pop();
			this.p--;
		}
	}


	this.getNext = function(){
		return this.next[this.p];
	}	

	this.getIndex = function(key) {
		if (this.keys.hasOwnProperty(key) && this.keys[key] != null){
			return this.keys[key];
		} 
		
		return -1;
	}


	this.isActive = function(idx){
		return this.data[idx] != null;
	}	

	this.getKeys = function(){
		return this.keyList;
	}

	this.get = function(key) {
		var idx = this.getIndex(key);
		if (idx >= 0) {
			return this.data[idx];
		}
		return null;
	}
	

	this.size = function() {
		return this.data.length;
	}

	this.put = function(key, obj){
		if (key) {
			var idx = this.getIndex(key);
			if ( idx >= 0) {
				this.data[idx] = obj;
			} else {
				idx = this.getNext();
				this.shiftNext(); 
				if (idx >= this.data.length) {
					this.data.push(obj);
				} else {
					this.data[idx] = obj;
				}
				this.keys[key] = idx;
				this.keyList.push(key);
			}
		} else {
			throw new Error("Invalid Key: " + key);
		}
	}

	this.remove = function(key){
		var idx = this.getIndex(key);
		var obj;
		if (idx >= 0){
			this.keys[key] = undefined;
			obj = this.data[idx];
			this.data[idx] = undefined;
			this.next.push(idx);
			idx = this.keyList.indexOf(key);
			this.keyList.splice(idx, 1);
			this.p++;
		}
		return obj;
	}
}


