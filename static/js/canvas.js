// Based on code by Simon Sarris
// www.simonsarris.com
// sarris@acm.org


/* Shape Drawing Constructor */
function Shape(x, y, r, fill){
  this.x = x || 0;
  this.y = y || 0;
  this.r = r || 1;
  this.strokeStyle = '#AAAAAA';
}

/* Draw shape to given context */
Shape.prototype.draw = function(ctx) {
  ctx.fillStyle = this.fill;
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
  ctx.lineWidth = 3;
  ctx.strokeStyle = this.strokeStyle;
  ctx.stroke();
}

/* Determine if a point is inside the shape's bounds */
Shape.prototype.contains = function(mx, my) {
  // is the mouse withinn the area of the circle?
  return (Math.pow(mx - this.x, 2) + Math.pow(my - this.y, 2) <= Math.pow(this.r, 2));
}

/* Canvas state tracking object */
function CanvasState (canvas) {
  /* Canvas set up */
  this.canvas = canvas;
  this.width = canvas.width;
  this.height = canvas.height;
  this.ctx = canvas.getContext('2d');
  //fixes map coordinaton when there's border/paddingBottom
  //see getMouse for details
  var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
  if (document.defaultView && document.defaultView.getComputedStyle) {
    this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
    this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
    this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
    this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
  }
  
  // Some pages have fixed-position bars (like the stumbleupon bar) at the top or left of the page
  // They will mess up mouse coordinates and this fixes that
  var html = document.body.parentNode;
  this.htmlTop = html.offsetTop;
  this.htmlLeft = html.offsetLeft;

  
  /* Keep track of states */
  this.valid = false; //will redraw everything
  this.shapes = []; // collection of shapes to draw
  this.dragging = false; // are we dragging?
  this.selection = null // selected object
  this.dragoffx = 0; //see mousedown and mousemove for explaination
  this.dragoffy = 0;
  
  /* Events */
  //refers to CanvasState, differentiates from event this (canvas)
  var myState = this; 
  //fixes a problem where double clicking causes text to get selected on the canvas
  canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);
  
  //on mouseDOWN
  canvas.addEventListener('mousedown', function(e) {
    var mouse = myState.getMouse(e);
    var mx = mouse.x;
    var my = mouse.y;
    var shapes = myState.shapes;
    var l = shapes.length;
    for (var i = l-1; i >= 0; i--) {
      if (shapes[i].contains(mx, my)) {
        var mySel = shapes[i];
        // Keep track of where in the object we clicked
        // so we can move it smoothly (see mousemove)
        myState.dragoffx = mx - mySel.x;
        myState.dragoffy = my - mySel.y;
        myState.dragging = true;
        myState.selection = mySel;
        myState.valid = false;
        return;
      }
    }
    // havent returned means we have failed to select anything.
    // If there was an object selected, we deselect it
    if (myState.selection) {
      myState.selection = null;
      myState.valid = false; // Need to clear the old selection border
    }
  }, true);
  
  //on mouseMOVE
  canvas.addEventListener('mousemove', function(e) {
    if (myState.dragging){
      var mouse = myState.getMouse(e);
      // We don't want to drag the object by its top-left corner, we want to drag it
      // from where we clicked. Thats why we saved the offset and use it here
      myState.selection.x = mouse.x - myState.dragoffx;
      myState.selection.y = mouse.y - myState.dragoffy;   
      myState.valid = false; // Something's dragging so we must redraw
    }
  }, true);
  
  //on mouseMOVE
  canvas.addEventListener('mouseup', function(e) {
    myState.dragging = false;
  }, true)
  
  /* Options */
  this.selectionColor = '#CC0000';
  this.selectionWidth = 2;  
  this.interval = 30;
  setInterval(function() { myState.draw(); }, myState.interval);
}

/* Add shape to canvas*/
CanvasState.prototype.addShape = function(shape) {
  this.shapes.push(shape);
  this.valid = false;
}

/* Clear canvas */
CanvasState.prototype.clear = function() {
  this.ctx.clearRect(0, 0, this.width, this.height);
}

/* Canvas Redrawing */
CanvasState.prototype.draw = function(){
  //if state invalid, redraw & revalidate
  if(!this.valid) {
    var ctx = this.ctx;
    var shapes = this.shapes;
    this.clear();
    
    //ADD STUFF TO BE ALWAYS DRAWN ON BOTTOM HERE
    if (img != null){
        ctx.drawImage(img,0,0);
    }
    
    //draw all shapes
    var l = shapes.length;
    for (var i = 0; i < l; i++){
      var shape = shapes[i];
      // We can skip the drawing of elements off the screen
      if(shape.x > this.width || shape.y > this.height ||
         shape.x + shape.w < 0 || shape.y + shape.h < 0) 
         {continue;}
      shapes[i].draw(ctx);
    }
    
    //draw selection
    if (this.selection != null) {
      ctx.strokeStyle = this.selectionColor;
      ctx.lineWidth = this.selectionWidth;
      var mySel = this.selection;
      ctx.strokeRect(mySel.x, mySel.y, mySel.w, mySel.h);
    }
    
    //ADD STUFF TO BE ALWAYS DRAWN ON TOP HERE
    
    this.valid = true;
  }
}

// Creates an object with x and y defined, set to the mouse position relative to the state's canvas
// If you wanna be super-correct this can be tricky, we have to worry about padding and borders
CanvasState.prototype.getMouse = function(e) {
  var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;
  
  // Compute the total offset
  if (element.offsetParent !== undefined) {
    do {
      offsetX += element.offsetLeft;
      offsetY += element.offsetTop;
    } while ((element = element.offsetParent));
  }

  // Add padding and border style widths to offset
  // Also add the <html> offsets in case there's a position:fixed bar
  offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
  offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

  mx = e.pageX - offsetX;
  my = e.pageY - offsetY;
  
  // We return a simple javascript object (a hash) with x and y defined
  return {x: mx, y: my};
}

const drawbutton = document.querySelector('#draw-button');
var s = null //CanvasState

drawbutton.onclick = function() {
  if (s != null) {s.clear()}
  init();
};


// If you dont want to use <body onLoad='init()'>
// You could uncomment this init() reference and place the script reference inside the body tag

function init() {
  s = new CanvasState(document.getElementById('imgcanvas'));
  s.addShape(new Shape(40,40,5)); // The default is gray
  s.addShape(new Shape(50,50,10));
  // Lets make some partially transparent
  s.addShape(new Shape(60,60,20));
  s.addShape(new Shape(70,70,30));
}