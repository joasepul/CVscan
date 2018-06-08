var app = function() {

    var self = {};
  
    Vue.config.silent = false; // show all warnings
  
    // Extends an array
    self.extend = function(a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);
        }
    };
  
    // Enumerates an array.
    var enumerate = function(v) { var k=0; return v.map(function(e) {e._idx = k++;});};

    self.get_image = function () {
        // The URL is initial_data_url
        $.getJSON(
            get_image_url,
            function (data) {           
                self.vue.images = data.images;
            }
        );
    }; 

    self.add_image = function () {
        console.log("here");
      // Submits the track info.
      // This is the last step of the track insertion process.
      $.post(add_image_url,
          {
              image_url: newdataURL,
          },
          function (data) {
              console.log(newdataURL);
              self.get_image();
          });
    };

    self.toggle_select = function (image_url) {
        $.post(toggle_select_url,
            { image_url: image_url },
            function () {
                self.get_image();
            }
        )
    };

    self.download_selected_pdf = function() {
        for (var i=0; i < self.vue.images.length; i++) {
            if (self.vue.images[i].is_selected) {
                self.vue.selected_images.push(self.vue.images[i]);
            }
        }
        var pdf = new jsPDF();
        pdf.addImage(self.vue.selected_images[0].image_url, 'PNG', 0, 0);
        for (var i=1; i < self.vue.selected_images.length; i++) {
            pdf.addPage();
            pdf.addImage(self.vue.selected_images[i].image_url,'PNG',0,0);
        }
        pdf.save("download.pdf");
        self.vue.selected_images=[];
    }

    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            images: [],
            selected_images: [],
        },
        methods: {
            toggle_select: self.toggle_select,
            add_image: self.add_image,
            get_image: self.get_image,
            download_selected_pdf: self.download_selected_pdf,
        },
  
    });
    self.get_image();
    $("#vue-div").show();
  
    return self;
  };
  
  var APP = null;
  
  // This will make everything accessible from the js console;
  // for instance, self.x above would be accessible as APP.x
  jQuery(function(){APP = app();});