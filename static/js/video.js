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
var newdataURL;
var pdf;
var n = 0;

/* On button click, create video snapshot */
button.onclick = videoElement.onclick = function () {
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
}

function handleError(error) {
  alert('Error: ' + error);
  console.log('Error: ', error);
}


var image_fromserver = document.querySelector('#imgcanvas_fromserver');
var ctx = image_fromserver.getContext('2d');
$('#post-button').click(
  function () {
    var image = dataURL;
    console.log(image);
    $.post({
      url: doc_alg_url,
      data: {
        'img_b64': image
      },
      success: function (res) {
        var img = new Image;
        img.onload = function () {
          ctx.drawImage(this, 0, 0);
        };
        img.src = "data:image/png;base64," + res.b64img;
        image_fromserver.width = res.width;
        image_fromserver.height = res.height;
        newdataURL = img.src;
        console.log(img.src.length);
      }
    });
  });
/* 
window.onload = function () {
  var button1 = document.getElementById('btn-download');
  button1.addEventListener('click', function (e) {
    var pdf = new jsPDF();
    pdf.addImage(newdataURL, 'PNG', 0, 0);
    pdf.save("download.pdf");
  });
} */
$('#create_new_pdf').click(
  function () {
    pdf = new jsPDF();
    console.log(1);
  }
)


$('#save_to_pdf').click(
  function () {
/*     var pdf_canvas = document.createElement('canvas');
    document.body.appendChild(pdf_canvas);
    pdf_canvas.width = 1100;
    pdf_canvas.height = 1700;

    //add the images
    var context = pdf_canvas.getContext('2d');
    var newimg = new Image;
    newimg.src = newdataURL;
    context.drawImage(newimg, 0, 0, 1100, 1700);
    context.drawImage(newimg, 100, 30, 200, 137);
    context.drawImage(newimg, 350, 55, 93, 104); */

    //now grab the one image data for jspdf
/*     var imgData = pdf_canvas.toDataURL();

    //and lose the canvas when you're done
    document.body.removeChild(pdf_canvas); */
    
    pdf.addImage(newdataURL, 'PNG', 0, 0);
    pdf.addPage();
    n = n + 1;
    console.log(n);
  }
)
$('#btn_download').click(
  function () {
    pdf.save("download.pdf");
  }
)