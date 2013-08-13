var jsg, jsg2d, gravity=-10, maxsprites = 50, time = 0, step = 1/60, h, sprites = [];

function init() {
	jsg = createJSGObject("banner");
	jsg2d = jsg.jsg2d;
	jsg.display = display;
	jsg.initialize = configure;

	jsg.mainLoop();

}

function firstScreen() {
	jsg2d.save();
	jsg2d.context.font="30px Verdana";
	var gradient=jsg2d.context.createLinearGradient(0,0,jsg.canvas.width,0);
	gradient.addColorStop("0.0","rgb(0, 0, 0)");
	gradient.addColorStop("0.5","rgb(255,255, 0)");
	gradient.addColorStop("1.0","rgb(0, 0, 255)");
		jsg2d.context.shadowColor = "red" // string
		jsg2d.context.shadowOffsetX = 0; // integer
		jsg2d.context.shadowOffsetY = 0; // integer
		jsg2d.context.shadowBlur = 10; // integer				

	jsg2d.context.fillStyle = gradient;
	jsg2d.begin();
	jsg2d.fillText("JSGWEBGL, JSG2D, JSGVISION", 100, 540);
	jsg2d.end();
	jsg2d.fill();
}

function startGame() {
	for (var i = 0; i < sprites.length; i++){
		var s = sprites[i];
		s.update();
		s.draw();
	}
	time += step;	
}

function configure(){
	h = jsg.canvas.height;
	for (var i = 0; i < maxsprites; i++) {
		var s = new Sprite(10, [255, 0, 0], i);
		s.y = h;
		s.color[0] = Math.round(Math.random() * 256);
		s.color[1] = Math.round(Math.random() * 256);
		s.color[2]  = Math.round(Math.random() * 256);
		s.v0 = -Math.random()*20;
		s.x = Math.random()*jsg.canvas.width;
		sprites.push(s);
	}
	jsg.setBackground(5, 5, 5);
}


function genColor() {
	return Math.round(Math.random() * 256);
}

function display() {
	jsg.clearColor();
	startGame();
	//firstScreen();
}

function Sprite(size, color, id) {
	this.x = 0.0;
	this.id = id;
	this.y = 0.0;
	this.v0 = 0.0;
	this.v = 0;
	this.color = [0, 0, 0];	
	this.style = "";
	this.size = size;
	this.time = 0;
	var shapes = [jsg2d.fillCircle, jsg2d.drawRect, jsg2d.fillRect];
	var i = Math.round(Math.random() * 2);					
	this.shape = shapes[i];

	this.setColor = function(R, G, B) {
		this.color[0] = R;
		this.color[1] = G;
		this.color[2] = B;
		this.style = "rgb(" + this.color[0] + ", " + this.color[1] + ", " + this.color[2] + ")";
	}

	this.setColor(color[0], color[1], color[2]);

	this.update = function() {
		var y = this.y;
		this.y = y + this.v0 * this.time + gravity * this.time * this.time;
		this.color[0] = Math.round((h-this.y)/h * 255);				
		if (this.y <= 0) {
			this.time = 0;
			this.setColor(Math.round(Math.random() * 256), Math.round(Math.random() * 256), Math.round(Math.random() * 256));

			this.x = Math.random() * jsg.canvas.width;
			this.y = h;
			this.v0 = -Math.random()*20;
		}
		this.time += step;
	}

	this.draw = function(){
		var style = this.style;
		jsg2d.save();
		jsg2d.context.fillStyle = style;
		jsg2d.context.style = style;	

		jsg2d.begin();
			this.shape(this.x, this.y, this.size, this.size);
		jsg2d.fill();
		jsg2d.end();
		jsg2d.restore();				
	}			
}

