$(document).ready(function(){
  statusBox = document.getElementById('output');
});

var statusBox;

var response = null;

var key = config.apiKey;

function constructPath(){
  var path = null;
  return path; // path to API GET request
}

function init(){
  var xhr = new window.XMLHttpRequest();

  xhr.setContentType = function (contentType) {
    xhr.setRequestHeader('Content-type', contentType);
  };

  xhr.onload = function(){
    response = xhr.responseText || xhr.response;
  }

  xhr.onerror = function(error){
    console.log('Error',error);
  }

  var url = constructPath();

  xhr.open('GET',url,true);
  xhr.send();

}

function joinRoom(name) {
  
};

function leaveRoom(name) {
  
};
