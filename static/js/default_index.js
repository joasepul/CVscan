// JS for default/index.html

var app = function() {

    var self = {};

    Vue.config.silent = false; // show all warnings

    //Vue functions go here


    //Call Vue data and methods here
    self.vue = new Vue({
        el: "#vue-div",
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