function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
  
if (hasGetUserMedia()) {
// green light
} else {
    alert('getUserMedia() is not supported by your browser');
}

'use strict';

var videoElement = document.querySelector('video');
videoElement.autoplay = true;
videoElement.playsinline = true;
var videoSelect = document.querySelector('select#videoSource');
const button = document.querySelector('#screenshot-button');
const drawbutton = document.querySelector('#draw-button');
/* const img = document.querySelector('#screenshot-img');
const corners = document.querySelector('#corners-canvas'); */

/* const canvas = document.createElement('canvas'); */
const canvas = document.querySelector('#imgcanvas');

button.onclick = videoElement.onclick = function() {
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    canvas.getContext('2d').drawImage(videoElement, 0, 0);
    // Other browsers will fall back to image/png
    /* img.src = canvas.toDataURL('image/webp'); */
    
    
    
  };

drawbutton.onclick = function() {
  var ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.arc(250, 210, 200, 0, 2 * Math.PI, false);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#00ff00';
  ctx.stroke();
};

navigator.mediaDevices.enumerateDevices().then(gotDevices).then(getStream).catch(handleError);

videoSelect.onchange = getStream;

function gotDevices(deviceInfos) {
  alert(deviceInfos.length + ' devices were found!');
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

function getStream() {
  if (window.stream) {
    window.stream.getTracks().forEach(function(track) {
      track.stop();
    });
  }

  
  
  
  var constraints = {
    audio: false,
    video: {
      deviceId: {exact: videoSelect.value}
    }
  };

  navigator.mediaDevices.getUserMedia(constraints).
    then(gotStream).catch(handleError);
}

function gotStream(stream) {
  window.stream = stream; // make stream available to console 
  videoElement.srcObject = stream;
}

function handleError(error) {
  alert('Error: ' +  error);
  console.log('Error: ', error);
}
