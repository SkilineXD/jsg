var jsgphy = jsgphy || {};

jsgphy.OBJ_TYPE_DYNAMIC = 0;
jsgphy.OBJ_TYPE_STATIC = 1;
jsgphy.OBJ_TYPE_GHOST = 2;

jsgphy.Object = function(name, target){
	this.name = name;
	this.target = target;
	var self = this;
	this.build = function() {
		this.position = vec3.fromValues(0.0, 0.0, 0.0);
		this.initialVelocity = vec3.fromValues(0.0, 0.0, 0.0);
		this.velocity = vec3.fromValues(0.0, 0.0, 0.0);
		this.mass = 1.0;
		this.type = jsgphy.OBJ_TYPE_DYNAMIC;
		this.setPosition(vec3.fromValues(0.0, 0.0, 0.0));
		this.setVelocity(vec3.fromValues(0.0, 0.0, 0.0));
		this.forces = vec3.fromValues(0.0, 0.0, 0.0);
		this.beforeObjectSimulateListener = function(){};
		this.afterObjectSimulateListener = function(){};
		this.frictionCoefficient = 0.2;
		this.bounciness = 0.5;
		this.minHeight = (this.target.ymax - this.target.ymin)/2.0;
		this.initialPosition = vec3.fromValues(0.0, 0.0, 0.0);
		this.finalPosition = vec3.fromValues(0.0, 0.0, 0.0);
		this.initialVelocity  = vec3.fromValues(0.0, 0.0, 0.0);
		this.finalVelocity = vec3.fromValues(0.0, 0.0, 0.0);
		this.force = vec3.fromValues(0.0, 0.0, 0.0);
		
		this.elapsedTime =  0;
		this.time = vec3.fromValues(0.0, 0.0, 0.0);
		this.enableGravity = true;
		this.collisionTest = jsgphy.COLLISION_BOUNDINGBOX;
		if (this.target) {
			this.collisionObjectMaker = function() {
				var tg = this.target;
				var m = tg.getLinearTransformations();
				var p = vec4.fromValues(tg.xmax - tg.xmin, tg.ymax - tg.ymin, tg.zmax - tg.zmin, 1.0);
				p = vec4.transformMat4(vec4.create(), p, m);
				return jsgphy.makeSimpleBoundingBoxObject(this.position, 0.5 * p[0],  0.5 * p[1], 0.5 * p[2]);
			}
		} else {
			this.collisionObjectMaker = function() {
				return jsgphy.makeSimpleBoundingBoxObject(tg.getPivot(), 1,  1, 1);
			}
		}
	}
	
	this.resetForce = function() {
		this.force = vec3.fromValues(0.0, 0.0, 0.0);
	}
	
	this.updateForceChange = function(i, dir, pos) {
		var dir = dir || 1;
		var pos = pos || this.position[i];
		this.time[i] = this.world.time;
		this.initialVelocity[i] = dir * this.velocity[i];
		this.initialPosition[i] = this.position[i];
		this.position[i] = pos;
	}
	
	this.setupDefaultSimulationMethod = function() {
			this.simulate = function() {
				self.resetForce();
				self.setupForce(self.userForce);
				self.setupForce(vec3.fromValues(self.friction, 0.0, 0.0));
				self.setupForce(vec3.fromValues(0.0, self.gravityForce, 0.0));
				self.setupForce(self.collisionForce);
				self.setupForce(vec3.fromValues(0.0, self.normalForce, 0.0));
				self.updateForce();
			}
	
			self.userForce = vec3.fromValues(0.0, 0.0, 0.0); //horizontal force
			self.gravityForce =  -1.0; //gravity force
			self.normalForce = 0.0;
			self.collisionForce = vec3.fromValues(0.0, 0.0, 0.0);
			self.friction = 0.0;
			self.bounciness = 0.8;
			self.force = vec3.fromValues(0.0, 0.0, 0.0);
			self.initialPosition[0] = self.position[0];
			self.initialVelocity[0] = self.velocity[0];
			self.initialPosition[1] = self.position[1];
			self.initialVelocity[1] = self.velocity[1];
			self.initialPosition[2] = self.position[2];
			self.initialVelocity[2] = self.velocity[2];
			self.time = vec3.fromValues(self.world.time, self.world.time, self.world.time);
			self.resetForce();
	}
	
	this.setupForce = function(force) { 
		self.force[0] += force[0];
		self.force[1] += force[1];
		self.force[2] += force[2];
	}
	
	this.updateForce = function(){
		var t0 = this.world.time - this.time[0];
		var t1 = this.world.time - this.time[1];
		var t2 = this.world.time - this.time[2];
		var a0 = this.force[0]/this.mass;
		var a1 = this.force[1]/this.mass;
		var a2 = this.force[2]/this.mass;
		
		this.velocity[0] = this.initialVelocity[0] + a0 * t0;
		this.velocity[1] = this.initialVelocity[1] + a1 * t1;
		this.velocity[2] = this.initialVelocity[2] + a2 * t2;
		
		this.position[0] = this.initialPosition[0] + this.initialVelocity[0] * t0 + 0.5 * a0 * t0 * t0;
		this.position[1] = this.initialPosition[1] + this.initialVelocity[1] * t1 + 0.5 * a1 * t1 * t1;
		this.position[2] = this.initialPosition[2] + this.initialVelocity[2] * t2 + 0.5 * a2 * t2 * t2;
	}
	
	this.updatePosition = function() {
		if (this.update){
			updateObjectPosition(this);
		} else {
			this.update = true; 
		}
	}

	this.setPosition = function(pos){
		this.position[0] = pos[0];
		this.position[1] = pos[1];
		this.position[2] = pos[2];
	}
	
	this.setInitialVelocity = function(v) {
		this.initialVelocity[0] = v[0];
		this.initialVelocity[1] = v[1];
		this.initialVelocity[2] = v[2];
	}
	
	this.collisionHandler = function() {};
	this.collisionFailHandler = function(){};
	
	this.collides = function(target) {
		var b1 = this.collisionObjectMaker();
		var b2 = target.collisionObjectMaker();
		return this.collisionTest(b1, b2);
	}

	this.setVelocity = function(v) {
		this.velocity[0] = v[0];
		this.velocity[1] = v[1];
		this.velocity[2] = v[2];
	}	

	this.simulate = function() {
	
	}
	
	this.build();
}

jsgphy.World = function(){
		this.build = function(){
			this.objects = {};
			this.collisionList = [];
			this.gravity = -9.81;
			this.time = 0;
			this.step = 0.05;
			this.kineticFrictionCoef = 0.5; //Under wood 
			this.staticFrictionCoef =  0.3; //Motion under woord
			this.beforeSimulateListener = function(){};
			this.afterSimulateListener = function(){};
		}
		
		this.addObject = function(obj){
			this.objects[obj.name] = obj;
			if (obj.type != jsgphy.OBJ_TYPE_GHOST){
				this.collisionList.push(obj.name);
			}
		}
		
		this.run = function() {
			this.beforeSimulateListener();
			for (objname in this.objects) {
				if (this.objects.hasOwnProperty(objname)){
					var obj = this.objects[objname];
					if (obj.type != jsgphy.OBJ_TYPE_STATIC){
						obj.simulate();
					}
				}
			}
			this.next();
			this.afterSimulateListener();
		}
	
		this.next = function(){
			var n = this.collisionList.length;
			for (var i = 0; i < n; i++){
				var obj = this.objects[this.collisionList[i]]; 
				for (var j = i+1; j < n; j++) {
					var targ = this.objects[this.collisionList[j]];
					if (obj.collides(targ)){
						obj.collisionHandler(targ);
						targ.collisionHandler(obj);
					} else {
						obj.collisionFailHandler(targ);
						targ.collisionFailHandler(targ);
					}
				}
			}
			this.time += this.step;
		}
		
		this.reset = function(){
			this.time = 0;
			this.step = 0.005;
		}
		
		this.build();
}

jsgphy.eq = jsgphy.eq || {};
jsgphy.G = 6.67e-11; 

jsgphy.eq.FINALPOSITION = function(z0, v0, t, g) {//ALTITUDE CALCULATION OF OBJECTS AT DEFINED TIME
	return z0 + v0 * t + 0.5 * g * t * t;
}

jsgphy.gravityForce = function(m1, m2, d){
	return (jsgphy.G * m1 * m2)/(d*d);
}

jsgphy.COLLISION_BOUNDINGBOX = function(b1, b2) {
	return !(b1.maxx < b2.minx || b1.minx > b2.maxx ||
	    b1.maxy < b2.miny || b1.miny > b2.maxy ||
		b1.maxz < b2.minz || b1.minz > b2.maxz);  
}

jsgphy.makeSimpleBoundingBoxObject = function(ref, sizex, sizey, sizez){
	var bb = new Object();
	bb.minx = ref[0] - sizex;
	bb.maxx = ref[0] + sizex;
	bb.miny = ref[1] - sizey;
	bb.maxy = ref[1] + sizey;
	bb.minz = ref[2] - sizez;
	bb.maxz = ref[2] + sizez;
	return bb;
}
