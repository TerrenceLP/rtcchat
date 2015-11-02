$(document).ready(function(){
  statusBox = document.getElementById('output');
});

var statusBox;

var response = null;

var endpoint = '//api.temasys.com.sg/api/';

function constructPath(){
  return endpoint + config.apiKey + '/' + config.defaultRoom + '?rand=' + (new Date()).toISOString() ;
}

function init(){
  var xhr = new window.XMLHttpRequest();

  xhr.setContentType = function (contentType) {
    xhr.setRequestHeader('Content-type', contentType);
  };

  xhr.onload = function(){
    response = xhr.responseText || xhr.response;
    console.log(response);
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
