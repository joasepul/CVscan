/* Video Selector */
    self.initVideo = function(){
        if (!hasGetUserMedia()) {
            alert('getUserMedia() is not supported by your browser');
        }
        self.vue.videoSelect = document.querySelector('select#videoSource');
        /* Video Element */
        self.vue.videoElement = document.getElementById("video");
        // self.vue.videoElement = document.createElement("video");
        // document.getElementById("videoSourceSelect").appendChild(self.vue.videoElement);
        if(self.vue.videoElement != null){
            self.vue.videoElement.autoplay = true;
            self.vue.videoElement.playsinline = true;
            navigator.mediaDevices.enumerateDevices().then(gotDevices).then(self.getStream).catch(handleError);
            /* video feed handling */
            console.log("video initialized");
        }
    };


    /* Helper Functions */
    function gotDevices(deviceInfos) {
      console.log('gotDevices');
      for (var i = 0; i !== deviceInfos.length; ++i) {
        var deviceInfo = deviceInfos[i];
        var option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'videoinput') {
          option.text = deviceInfo.label || 'camera ' +
            (self.vue.videoSelect.length + 1);
          self.vue.videoSelect.appendChild(option);
          console.log('Video Device Found', deviceInfo);
        } else {
          console.log('Found one other kind of source/device: ', deviceInfo);
        }
      }
    }


    //return selected feed
    self.getStream = function() {
      console.log('getStream');
      if (window.stream) {
        window.stream.getTracks().forEach(function (track) {
          track.stop();
        });

      }
      var constraints = {
        audio: false,
        video: {
          deviceId: { exact: self.vue.videoSelect.value }
        }
      };
      //display feed
      navigator.mediaDevices.getUserMedia(constraints).
        then(gotStream).catch(handleError);
    };

    //set feed
    function gotStream(stream) {
      console.log('gotStream');
      window.stream = stream; // make stream available to console
      self.vue.videoElement.srcObject = stream;
      self.vue.videoElement.onloadedmetadata = function(){
          self.vue.videoWidth = this.videoWidth;
          self.vue.videoHeight = this.videoHeight;
          console.log(this.videoWidth);
          console.log(this.videoHeight);

      }
    }
    
    /* On button click, create video snapshot */
    self.takeScreenshot = function() {
        console.log('takeScreenshot');
        $("#mainState0").hide();
        $("#mainState1").show();
        self.vue.drawbutton = document.querySelector('#draw-button');
        self.vue.canvas = document.querySelector('#imgcanvas');
        self.vue.canvas.width = self.vue.videoWidth;
        self.vue.canvas.height = self.vue.videoHeight;
        self.vue.canvas.getContext('2d').drawImage(self.vue.videoElement, 0, 0);
        //Other browsers will fall back to image/png
        // self.vue.img.src = canvas.toDataURL('image/webp');
        self.vue.img.src = self.vue.canvas.toDataURL('image/png'); //create snapshot of canvas
        self.vue.dataURL = self.vue.img.src;
        //clear_CanvasState();
        self.init_coord_draw();
    };