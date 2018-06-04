'use strict';

var hdConstraints = {
  video: {width: {min: 1280}, height: {min: 720}}
};

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
    canvas.width = 1280;//videoElement.videoWidth;
    canvas.height = 720;//videoElement.videoHeight;
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
      deviceId: {
          exact: videoSelect.value,
          width: {min: 1280},
          height: {min: 720}
      }
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
          method:"POST",
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
            alert("Document processed successfully: " + res.qos);

        },
        error: function(){
            alert("failure");
        }
      });});
