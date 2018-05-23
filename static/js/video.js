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
var img = null;
//IN CASE WE NEED TO SEPERATE IMG AND CANVAS FOR SOME REASON
// const img = document.querySelector('#screenshot-img');
// const corners = document.querySelector('#corners-canvas');
const canvas = document.querySelector('#imgcanvas');

/* On button click, create video snapshot */
button.onclick = videoElement.onclick = function() {
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    canvas.getContext('2d').drawImage(videoElement, 0, 0);
    //Other browsers will fall back to image/png
    // img.src = canvas.toDataURL('image/webp');
    img = canvas.toDataURL('image/webp'); //create snapshot of canvas
  };

/* video feed handling */
navigator.mediaDevices.enumerateDevices().then(gotDevices).then(getStream).catch(handleError);

//switch to selected feed
videoSelect.onchange = getStream;

//ennumerate and list feeds
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
    window.stream.getTracks().forEach(function(track) {
      track.stop();
    });
  }

  //set up video constraints
  var constraints = {
    audio: false,
    video: {
      deviceId: {exact: videoSelect.value}
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
  alert('Error: ' +  error);
  console.log('Error: ', error);
}
