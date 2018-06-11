// JS for default/index.html

var app = function() {

    var self = {};

    Vue.config.silent = false; // show all warnings

    //Vue functions go here

    /* Initial Webcam Check */
     function hasGetUserMedia() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
     }

    //Code from URL:
    //https://coderwall.com/p/i817wa/one-line-function-to-detect-mobile-devices-with-javascript
    function isMobileDevice() {
        return (typeof window.orientation !== "undefined") ||
            (navigator.userAgent.indexOf('IEMobile') !== -1);
    }

    function handleError(error) {
      alert('Error: ' + error);
      console.log('Error: ', error);
    }

    self.resetPhoto = function(){
        console.log('resetPhoto');
        $("#mainState1").hide();
        $("#mainState0").show();
    };

    self.openFile = function(event) {
        self.vue.isProcessing = true;
        var input = event.target;

        // Modified code from: https://github.com/exif-js/exif-js
        EXIF.getData(input.files[0], function() {
            var orientation = EXIF.getTag(this, "Orientation");
            console.log('image orientation: ' + orientation);
            self.vue.orientation = orientation;
        });

        var reader = new FileReader();
        var img_dataURL;

        reader.onload = function(){
            var img_dataURL = reader.result;
            var fixed_dataURL = img_dataURL.split(",")[1];
            self.vue.raw_imagelist.push(img_dataURL);
            $.post({
                //method:"POST",
                url:doc_alg_url,
                data:{
                    img_b64:fixed_dataURL,
                    orientation: self.vue.orientation
                },
                success: function(res){
                    var img = new Image;
                    img.src = "data:image/png;base64," + res.b64img;
                    console.log(img.src);
                    img.onload = function() {
                        if (res.qos == false) {onProcessingFail(img.src); return;};
                        alert("Document processed successfully: " + res.qos);
                        alert("image size: " + res.width + " * " + res.height);
                        self.vue.newdataURL = img.src;
                        console.log(img.src.length);
                        self.vue.imagelist.push(img.src);
                        self.vue.currentPage = self.vue.imagelist.length - 1;
                        self.vue.isProcessing = false;
                        $("#mainState0").hide();
                        $("#mainState2").show();
                    }
                },
                error: function(){
                    self.vue.isProcessing = false;
                    //alert("Server could not detect corners. Manually select the corners of your document.");
                    alert("500 ERROR");
                }
            });
            $("input#img_input").val("");
        };
        reader.readAsDataURL(input.files[0]);
    };

    function onProcessingFail(img_dataURL){
        self.vue.isProcessing = false;
        $("#mainState0").hide();
        $("#mainState1").show();
        //TESTING
        //THIS SHOULD BE IN self.takeScreenshot!
        //REMEMBER: Video snapshot is being phased out!

        self.vue.drawbutton = document.querySelector('#draw-button');
        self.vue.canvas = document.querySelector('#imgcanvas');
        var img = new Image;
        img.src = img_dataURL;
        img.onload = function() {
            self.vue.canvas.width = this.width;
            self.vue.canvas.height = this.height;
             alert("image size: " + this.width + " * " + this.height);
            self.vue.canvas.getContext('2d').drawImage(this, 0, 0);
            self.vue.img.src = img_dataURL;
            self.vue.dataURL = img_dataURL;
            //clear_CanvasState();
            self.init_coord_draw();
        }
    };

        /* CANVAS FUNCTIONS */

    self.init_coord_draw = function() {
      clear_CanvasState();
      init();
    };


    // Shape and CanvasState based on code by Simon Sarris
    // www.simonsarris.com
    // sarris@acm.org

     /* Shape Drawing Constructor */
    function Shape(x, y, r, fill){
      this.x = (x || 0) * self.vue.rescaleConst;
      this.y = (y || 0) * self.vue.rescaleConst;
      this.r = (r || 1) * self.vue.rescaleConst;
      this.strokeStyle = '#FF0000';
    }

    /* Draw shape to given context */


    Shape.prototype.draw = function(ctx) {
      ctx.fillStyle = this.fill;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
      ctx.lineWidth = 3* self.vue.rescaleConst;
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
      self.vue.rescaleConst = (this.canvas.width / this.canvas.clientWidth);
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
        if (myState.dragging){
          e.preventDefault();
          var touch = myState.getTouch(e);
          myState.selection.x = touch.x - myState.dragoffx;
          myState.selection.y = touch.y - myState.dragoffy;
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
        this.clear();

        //ADD STUFF TO BE ALWAYS DRAWN ON BOTTOM HERE
        if (self.vue.img != null){
            ctx.drawImage(self.vue.img,0,0);
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
        ctx.lineWidth = ctx.lineWidth/3;
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
      // CALCULATE MOUSE COORDS WITHIN CANVAS
      mx = e.pageX - offsetX;
      my = e.pageY - offsetY;
      // CALCULATE MOUSE COORDS WITHIN THE PHOTO
      mx = mx * (this.canvas.width / this.canvas.clientWidth);
      my = my * (this.canvas.width / this.canvas.clientWidth);

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
      // CALCULATE Touch COORDS WITHIN CANVAS
      tx = e.targetTouches[0].pageX - offsetX;
      ty = e.targetTouches[0].pageY - offsetY;
      // CALCULATE Touch COORDS WITHIN THE PHOTO
      tx = tx * (this.canvas.width / this.canvas.clientWidth);
      ty = ty * (this.canvas.width / this.canvas.clientWidth);
      return {x: tx, y: ty};
    };

    CanvasState.prototype.getShapeCoords = function(shape_id) {
        var this_shape = this.shapes[shape_id];
        return this_shape
    };

    function clear_CanvasState(){
        if (self.vue.myCanvasState != null){
          clearInterval(self.vue.myCanvasState.interval_var);
          self.vue.myCanvasState = null;
      }
    }

    self.return_points = function() {
      const re_rescaleConst = 1 / self.vue.rescaleConst
      var shape0 = self.vue.myCanvasState.getShapeCoords(0);
      var shape1 = self.vue.myCanvasState.getShapeCoords(1);
      var shape2 = self.vue.myCanvasState.getShapeCoords(2);
      var shape3 = self.vue.myCanvasState.getShapeCoords(3);
      console.log("------------");
      console.log("Top Left: "+ shape0.x + " " + shape0.y);
      console.log("Top Right: "+ shape1.x + " " + shape1.y);
      console.log("Bottom Left: "+ shape2.x + " " + shape2.y);
      console.log("Bottom Right: "+ shape3.x + " " + shape3.y);
      return [[shape0.x, shape0.y],
              [shape1.x, shape1.y],
              [shape2.x, shape2.y],
              [shape3.x, shape3.y]]
    };

    function init() {
        var r = 10;
        if (isMobileDevice()) { r = 30 }
                /* Vars from canvas.js*/
        self.vue.myCanvasState = new CanvasState(document.getElementById('imgcanvas'));
        self.vue.myCanvasState.addShape(new Shape(70,70,r));
        self.vue.myCanvasState.addShape(new Shape(140,70,r));
        self.vue.myCanvasState.addShape(new Shape(70,140,r));
        self.vue.myCanvasState.addShape(new Shape(140,140,r));
    }

    self.post_button = function(){
        console.log('Send_to_server');
        var image_URL = self.vue.dataURL;
        var fixed_dataURL = image_URL.split(",")[1];
        console.log(fixed_dataURL);
        var corners = self.vue.return_points();
        $.post({
            url:rectify_doc_url,
            data:{
              'img_b64':fixed_dataURL,
              'pt1': corners[0],
              'pt2': corners[1],
              'pt3': corners[2],
              'pt4': corners[3]
            },
            success: function(res){
              var img = new Image;

              img.src = "data:image/png;base64," + res.b64img;
              self.vue.newdataURL = img.src;
              console.log(img.src.length);
              self.vue.imagelist.splice(self.vue.currentPage, 0, img.src);
              self.vue.currentPage = self.vue.imagelist.length - 1;
              $("#mainState1").hide();
              $("#mainState2").show();
              }
         });
    };

    self.newPhoto = function(){
        $("#mainState2").hide();
        $("#mainState0").show();
    };

    self.editPhoto = function(){
        var currentPhoto = self.vue.currentPage;
        self.vue.imagelist.splice(currentPhoto, 1);
        $("#mainState2").hide();
        onProcessingFail(self.vue.raw_imagelist[currentPhoto]);
    }



    self.imglist_to_pdf = function(){
        console.log('imglist to pdf');
        self.vue.pdf = new jsPDF();
        var width = self.vue.pdf.internal.pageSize.width;
        var height = self.vue.pdf.internal.pageSize.height;
        self.vue.pdf.addImage(self.vue.imagelist[0], 'PNG', 0, 0,width, height);
        for(let i = 1; i < self.vue.imagelist.length; i++){
            self.vue.pdf.addPage();
            self.vue.pdf.addImage(self.vue.imagelist[i], 'PNG', 0, 0,width,height);
        }

        // self.vue.pdf.save("download.pdf");
        var file = self.vue.pdf.output('datauristring')
        console.log('adding pdf');
        add_pdf(file);
        ///////////////
        var file_name = prompt("Please enter a file name", "CVscanned_doc");
        if (!file_name.includes(".pdf")) {
            file_name = file_name + ".pdf";
        }
        self.vue.pdf.save(file_name);
        self.vue.imagelist=[];
        self.vue.raw_imagelist=[];
    };
    
    function add_pdf(file){
        console.log('add_pdf()');
        $.post(add_pdf_url,
            {
            pdf_uri: file,
            },
            function(data){
                console.log('added');
                console.log(file);
                self.vue.imagelist=[];
                window.open(file);
                self.vue.is_making_pdf = false;
                self.display_archive();
            });
    };

    self.prev_page = function() {
        if(self.vue.currentPage > 0){
            self.vue.currentPage -= 1;
        }
    };

    self.next_page = function() {
        if(self.vue.currentPage < self.vue.imagelist.length - 1){
            self.vue.currentPage += 1;
        }else if(self.vue.currentPage === self.vue.imagelist.length - 1){
            self.newPhoto();
        }
    };

    self.display_main = function() {
        $("#archive_mode").hide();
        $("#main_mode").show();
    };


    const fakePDFList = {
        // email: null,
        pdf: null,
        createdOn: null,
        title: null,
    };

    function setupFakeUsers(){
        $.getJSON(get_pdfs_url,
            function(data) {
                self.vue.pdfList = data.pdfList;
        });
    }

    self.display_archive = function() {
        $("#main_mode").hide();
        $("#archive_mode").show();
    };

    //Call Vue data and methods here
    self.vue = new Vue({
        el: "#vue-div",
        mounted: function(){},
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            is_making_pdf: false,
            logged_in: false,
            raw_imagelist: [],
            imagelist: [],
            img: new Image,
            canvas: null,
            myCanvasState: null, //CanvasState
            ctx: null,
            dataURL: null,
            pdf: null,
            newdataURL: null,
            currentPage: 0,
            pdfList: [],
            rescaleConst: null,
            isProcessing: false,
            orientation: null
        },
        methods: {
            pdf_test: self.pdf_test,
            init_coord_draw: self.init_coord_draw,
            sendToServer: self.sendToServer,
            post_button: self.post_button,
            create_new_pdf: self.create_new_pdf,
            btn_download: self.btn_download,
            return_points: self.return_points,
            resetPhoto: self.resetPhoto,
            openFile: self.openFile,
            newPhoto: self.newPhoto,
            editPhoto: self.editPhoto,
            imglist_to_pdf: self.imglist_to_pdf,
            prev_page: self.prev_page,
            next_page: self.next_page,
            display_main: self.display_main,
            display_archive: self.display_archive,
        }

    });

    //Anything else needed goes here
    setupFakeUsers();
    $("#vue-div").show();
    return self;
};

var APP = null;

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x
jQuery(function(){APP = app();});
