// JS for default/index.html

var app = function() {

    var self = {};

    Vue.config.silent = false; // show all warnings

    //Vue functions go here


    //Call Vue data and methods here
    self.vue = new Vue({
        el: "#vue-div",
        mounted: function(){
            // ======= video.js ===============================================
            'use strict';

            /* Initial Webcam Check */
            function hasGetUserMedia() {
              return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
            }

            if (hasGetUserMedia()) {
              // green light
            } else {
              alert('getUserMedia() is not supported by your browser');
            }

            /* General Variable Set up */
            var videoElement = document.querySelector('video');
            videoElement.autoplay = true;
            videoElement.playsinline = true;
            var videoSelect = document.querySelector('select#videoSource');
            const button = document.querySelector('#screenshot-button');
            var img = new Image;
            //IN CASE WE NEED TO SEPERATE IMG AND CANVAS FOR SOME REASON
            // const img = document.querySelector('#screenshot-img');
            // const corners = document.querySelector('#corners-canvas');
            const canvas = document.querySelector('#imgcanvas');
            var dataURL;

            /* On button click, create video snapshot */
            button.onclick = videoElement.onclick = function() {
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;
                canvas.getContext('2d').drawImage(videoElement, 0, 0);
                //Other browsers will fall back to image/png
                // img.src = canvas.toDataURL('image/webp');
                img.src = canvas.toDataURL('image/png'); //create snapshot of canvas
                dataURL = img.src;
              };

            /* video feed handling */
            navigator.mediaDevices.enumerateDevices().then(gotDevices).then(getStream).catch(handleError);

            //switch to selected feed
            videoSelect.onchange = getStream;


            window.onload = function () {
              var button1 = document.getElementById('btn-download');
              button1.addEventListener('click', function (e) {
                var pdf = new jsPDF();
                pdf.addImage(dataURL, 'PNG', 0, 0);
                pdf.save("download.pdf");
              });
            }

            function gotDevices(deviceInfos) {
              for (var i = 0; i !== deviceInfos.length; ++i) {
                var deviceInfo = deviceInfos[i];
                var option = document.createElement('option');
                option.value = deviceInfo.deviceId;
                if (deviceInfo.kind === 'videoinput') {
                  option.text = deviceInfo.label || 'camera ' +
                    (videoSelect.length + 1);
                  videoSelect.appendChild(option);
                  console.log('Video Device Found', deviceInfo);
                } else {
                  console.log('Found one other kind of source/device: ', deviceInfo);
                }
              }
            }

            //return selected feed
            function getStream() {
              if (window.stream) {
                window.stream.getTracks().forEach(function (track) {
                  track.stop();
                });
              }


              var constraints = {
                audio: false,
                video: {
                  deviceId: { exact: videoSelect.value }
                }
              };

              //display feed
              navigator.mediaDevices.getUserMedia(constraints).
                then(gotStream).catch(handleError);
            }

            //set feed
            function gotStream(stream) {
              window.stream = stream; // make stream available to console
              videoElement.srcObject = stream;
              console.log(stream);
            }

            function handleError(error) {
              alert('Error: ' + error);
              console.log('Error: ', error);
            }


            var image_fromserver = document.querySelector('#imgcanvas_fromserver');
            var ctx = image_fromserver.getContext('2d');
            $('#post-button').click(
                function(){
                  var image = img.src;
                  $.ajax({
                      url:doc_alg_url,
                      data:{
                        'img_b64':image
                      },
                      success: function(res){
                        var img = new Image;
                        img.onload = function() {
                          ctx.drawImage(this, 0, 0);
                          };
                        img.src = "data:image/png;base64," + res.b64img;
                        image_fromserver.width = res.width;
                        image_fromserver.height = res.height;
                        console.log(img.src.length);
                        }
                  });});
            
            // ======= canvas.js ==============================================
            
            // Based on code by Simon Sarris
            // www.simonsarris.com
            // sarris@acm.org

            /* Vars */
            const drawbutton = document.querySelector('#draw-button');
            var s = null; //CanvasState

            /* Shape Drawing Constructor */
            function Shape(x, y, r, fill){
              this.x = x || 0;
              this.y = y || 0;
              this.r = r || 1;
              this.strokeStyle = '#FF0000';
            }

            /* Draw shape to given context */
            Shape.prototype.draw = function(ctx) {
              ctx.fillStyle = this.fill;
              ctx.beginPath();
              ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
              ctx.lineWidth = 3;
              ctx.strokeStyle = this.strokeStyle;
              ctx.stroke();
            };

            /* Determine if a point is inside the shape's bounds */
            Shape.prototype.contains = function(mx, my) {
              // is the mouse withinn the area of the circle?
              return (Math.pow(mx - this.x, 2) + Math.pow(my - this.y, 2) <= Math.pow(this.r, 2));
            };

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
              this.selection = null; // selected object
              this.dragoffx = 0; //see mousedown and mousemove for explaination
              this.dragoffy = 0;
              
              /* Events */
              //refers to CanvasState, differentiates from event this (canvas)
              var myState = this; 
              //fixes a problem where double clicking causes text to get selected on the canvas
              canvas.addEventListener('selectstart', function(e) { 
                e.preventDefault();
                return false;
              }, false);
              
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
                // haven't returned means we have failed to select anything.
                // If there was an object selected, we deselect it
                if (myState.selection) {
                  myState.selection = null;
                  myState.valid = false; // Need to clear the old selection border
                }
              }, true);
              
              //on touchSTART
              canvas.addEventListener('touchstart', function(e) {
                var touch = myState.getTouch(e);
                var tx = touch.x;
                var ty = touch.y;
                var shapes = myState.shapes;
                var l = shapes.length;
                for (var i = l-1; i >= 0; i--) {
                  if (shapes[i].contains(tx, ty)) {
                    var mySel = shapes[i];
                    // Keep track of where in the object we clicked
                    // so we can move it smoothly (see mousemove)
                    myState.dragoffx = tx - mySel.x;
                    myState.dragoffy = ty - mySel.y;
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
                  myState.selection.x = mouse.x - myState.dragoffx;
                  myState.selection.y = mouse.y - myState.dragoffy;
                  myState.valid = false; // Something's dragging so we must redraw
                }
              }, true);
              
              //on touchMOVE
              canvas.addEventListener('touchmove', function(e) {
                e.preventDefault();
                if (myState.dragging){
                  var touch = myState.getTouch(e);
                  // We don't want to drag the object by its top-left corner, we want to drag it
                  // from where we clicked. Thats why we saved the offset and use it here
                  a = myState.selection.x = touch.x - myState.dragoffx;
                  b = myState.selection.y = touch.y - myState.dragoffy;   
                  alert(a + " " + b);
                  myState.valid = false; // Something's dragging so we must redraw
                }
              }, false);
              
              //on mouseUP
              canvas.addEventListener('mouseup', function(e) {
                myState.dragging = false;
              }, false);
              
              //on touchEND
              canvas.addEventListener('touchend', function(e) {
                myState.dragging = false;
              }, false);
              
              
              /* Options */
              this.selectionColor = '#CC0000';
              this.selectionWidth = 2;  
              this.interval = 30;
              this.interval_var = setInterval(function() { 
                myState.draw(); 
              }, myState.interval);
            }

            /* Add shape to canvas*/
            CanvasState.prototype.addShape = function(shape) {
              this.shapes.push(shape);
              this.valid = false;
            };

            /* Clear canvas */
            CanvasState.prototype.clear = function() {
              this.ctx.clearRect(0, 0, this.width, this.height);
            };

            /* Canvas Redrawing */
            CanvasState.prototype.draw = function(){
              //if state invalid, redraw & revalidate
              if(!this.valid) {
                var ctx = this.ctx;
                var shapes = this.shapes;
                /* console.log(shapes);
                console.log(this); */
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

                ctx.beginPath();
                ctx.moveTo(shapes[0].x, shapes[0].y);
                ctx.lineTo(shapes[2].x, shapes[2].y);
                ctx.lineTo(shapes[3].x, shapes[3].y);
                ctx.moveTo(shapes[1].x, shapes[1].y);
                ctx.lineTo(shapes[0].x, shapes[0].y);
                ctx.moveTo(shapes[1].x, shapes[1].y);
                ctx.lineTo(shapes[3].x, shapes[3].y);
                ctx.stroke();

                
                //draw selection
                if (this.selection != null) {
                  ctx.strokeStyle = this.selectionColor;
                  ctx.lineWidth = this.selectionWidth;
                  var mySel = this.selection;
                  ctx.arc(mySel.x, mySel.y, mySel.r, 0, 2 * Math.PI, false);
                }
                
                //ADD STUFF TO BE ALWAYS DRAWN ON TOP HERE
                
                this.valid = true;
              }
            };

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
            };
            
            CanvasState.prototype.getTouch = function(e) {
              var element = this.canvas, offsetX = 0, offsetY = 0, tx, ty;
              
              // Compute the total offset
              if (element.offsetParent !== undefined) {
                do {
                  offsetX += element.offsetLeft;
                  offsetY += element.offsetTop;
                } while ((element = element.offsetParent));
              }

              offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
              offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

              tx = e.targetTouches[0].pageX - offsetX;
              ty = e.targetTouches[0].pageY - offsetY;
              return {x: tx, y: ty};
            };
            
            CanvasState.prototype.getShapeCoords = function(shape_id) {
                var this_shape = this.shapes[shape_id];
                return this_shape
            };

            drawbutton.onclick = function() {
              /* if (s != null) {
                  s.clear();
                  s = null;
              } */
              init();
            };
            
            const displaybutton = document.querySelector('#btn-display');
            displaybutton.onclick = function() {
              console.log("------------")
              console.log("Top Left: "+s.getShapeCoords(0).x + " " + s.getShapeCoords(0).y);
              console.log("Top Right: "+s.getShapeCoords(1).x + " " + s.getShapeCoords(1).y);
              console.log("Bottom Left: "+s.getShapeCoords(2).x + " " + s.getShapeCoords(2).y);
              console.log("Bottom Right: "+s.getShapeCoords(3).x + " " + s.getShapeCoords(3).y);
            };

            function init() {
              if (s != null){
                  clearInterval(s.interval_var);
                  // s = null;
              }
              s = new CanvasState(document.getElementById('imgcanvas'));
              s.addShape(new Shape(50,50,10));
              s.addShape(new Shape(100,50,10));
              s.addShape(new Shape(50,100,10));
              s.addShape(new Shape(100,100,10));

            }
            
            
            // ======= END MOUNTING ===========================================
        },
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            logged_in: false,
            archive_mode: false
        },
        methods: {

        }

    });

    //Anything else needed goes here

    $("#vue-div").show();
    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});