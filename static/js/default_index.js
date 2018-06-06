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
  
    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            images: [],
        },
        methods: {
            add_image: self.add_image,
            get_image: self.get_image,
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