function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function newsession(store, time) {
  var expires = new Date();
  expires.setTime(expires.getTime() + (20 * 60 * 1000));
  document.cookie = "sessionId=" + guid() + "; expires=" + expires.toUTCString();
  document.cookie = "storeId=" + store + "; expires=" + expires.toUTCString();
  document.cookie = "time=" + time + "; expires=" + expires.toUTCString();
}

function checksession() {
  // Need to check that the sessionId, storeId & time cookies are set. Return the sessionId & storeId cookies to make sure the dropdowns are set correctly.
  /* if($("#sessionId").val() == "") {
    $(":mobile-pagecontainer").pagecontainer("change", "#indexpage", { // Show an error message before redirect?
      reload: false
    });
  } */
}

function destroysession() {
}