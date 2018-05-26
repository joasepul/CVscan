var app = function() {
    self = {};
    // IO FUNCTIONS
    self.start_io = function(){jQuery('.progress').slideDown();};
    self.stop_io = function(data){jQuery('.progress').slideUp();};
    self.on_error = function(){jQuery('.progress').slideUp();};
    self.GET = function(url, data) {
        self.start_io();
        return jQuery.getJSON(url, data).fail(self.on_error).done(self.stop_io);
    };
    self.METHOD = function(method) {
        return function(url, data) {
            var d = {url:url, method:method, contentType: 'application/json', processData: false};
            if(data) d.data = JSON.stringify(data);
            self.start_io();
            return jQuery.ajax(d).fail(self.on_error).done(self.stop_io);
        };
    };
    self.POST   = self.METHOD('POST');
    self.PUT    = self.METHOD('PUT');
    self.DELETE = self.METHOD('DELETE');

    // Configure Vue
    Vue.config.delimiters = ['${', '}']
    Vue.config.unsafeDelimiters = ['!{', '}']
    Vue.config.silent = false; // show all warnings
    Vue.config.async = true; // for debugging only
    self.vue = new Vue({
            el: '#vue',
            data: {
                page: ''        /* page name */,
                state: {},      /* global page state */
                keywords: '',   /* example: search field */
                docs: []        /* example search response */
            },
            filters: {
                marked: marked
            },
            methods: {
                goto: function(page, state) { self.vue.page=page; self.vue.state=state; },
            }
        });
    $("#vue-div").show()
    return self;
};

var APP = null;
jQuery(function(){APP = app();});
