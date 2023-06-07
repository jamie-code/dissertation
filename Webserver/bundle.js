(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var _client = require("@webauthn/client");
const loginButton = document.getElementById('login');
const registerButton = document.getElementById('register');
const messageDiv = document.getElementById('message');
let userEmail = document.getElementById('email');
const displayMessage = message => {
  messageDiv.innerHTML = message;
};

window.foo = 123;

registerButton.onclick = async () => {
  const challenge = await fetch('https://api.jamiez.co.uk/pwdmanager/webauthn/request-register', {
    method: 'POST',
    headers: {
      'content-type': 'Application/Json'
    },
    body: JSON.stringify({
      id: 'uuid',
      email: userEmail.value
    })
  }).then(response => response.json());
  const credentials = await (0, _client.solveRegistrationChallenge)(challenge);
  const 
    loggedIn
   = await fetch('https://api.jamiez.co.uk/pwdmanager/webauthn/register', {
    method: 'POST',
    headers: {
      'content-type': 'Application/Json'
    },
    body: JSON.stringify(credentials)
  }).then((response => response.text()));
  

    if (loggedIn=="Success") {
      displayMessage('registration successful');
    } else {
      displayMessage('registration failed');
    }
  
  
};
//modal from https://codepen.io/evavic44/pen/zYjjzoV
    
        const modal = document.querySelector(".modal");
const overlay = document.querySelector(".overlay");
//const openModalBtn = document.querySelector(".btn-open");
const closeModalBtn = document.querySelector(".btn-close");

// close modal function
const closeModal = function () {
  modal.classList.add("hidden");
  overlay.classList.add("hidden");
  $("#keytable tr").remove(); 
};

// close the modal when the close button and overlay is clicked
closeModalBtn.addEventListener("click", closeModal);
overlay.addEventListener("click", closeModal);

// close modal when the Esc key is pressed
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

// open modal function
const openModal = function () {
  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
};
// open modal event
//openModalBtn.addEventListener("click", openModal);
function parseKey(key){
  console.log(key);
}
function buildTable(data){
  var table = document.getElementById('keys')
let rowcolor="even";
  for (var i = 0; i < data.length; i++){
    if(i % 2 == 0){//if even
      rowcolor="even";
    } else {
      rowcolor="odd";
    }
    
    var row = `<tr>
          <td class="${rowcolor}"><a class="selectkey" id="keyid-${data[i].id}">${data[i].name}</a></td>
          </tr>`
    table.innerHTML += row


  }
  var elements = document.getElementsByClassName('selectkey');
  for(var i = 0; i < elements.length; i++){
    let currentelementid=elements[i].id;
    elements[i].onclick = async function(){
      let keyarr=currentelementid.split("-");
      let keyid = keyarr[1];
      const challenge = await fetch('https://api.jamiez.co.uk/pwdmanager/webauthn/login', {
        method: 'POST',
        headers: {
          'content-type': 'Application/Json'
        },
        body: JSON.stringify({
          email: userEmail.value,
          keyid: keyid
        })
      }).then(response => response.json());
      const credentials = await (0, _client.solveLoginChallenge)(challenge);
      const 
        loggedIn
       = await fetch('https://api.jamiez.co.uk/pwdmanager/webauthn/login-challenge', {
        method: 'POST',
        headers: {
          'content-type': 'Application/Json'
        },
        body: JSON.stringify(credentials)
      }).then(response => response.text());
      if (loggedIn) {
        displayMessage('You are logged in');
        closeModal();
        return;
      }
      displayMessage('Invalid credential');
      closeModal();
    };
  }
  
}

loginButton.onclick = async () => {
  const keys = await fetch('https://api.jamiez.co.uk/pwdmanager/webauthn/request-keys', {
    method: 'POST',
    headers: {
      'content-type': 'Application/Json'
    },
    body: JSON.stringify({
      email: userEmail.value
    })
  }).then(response => response.text());
  console.log(keys);
  
  var jsonObj = JSON.parse(keys);
  if(jsonObj.length==0){
    //no keys on the account
    console.log("No keys");
  } else if (jsonObj.length==1){
    //If there is only one key we dont need a list to select from
    const challenge = await fetch('https://api.jamiez.co.uk/pwdmanager/webauthn/login', {
        method: 'POST',
        headers: {
          'content-type': 'Application/Json'
        },
        body: JSON.stringify({
          email: userEmail.value,
          keyid: jsonObj[0].id
        })
      }).then(response => response.json());
      const credentials = await (0, _client.solveLoginChallenge)(challenge);
      const 
        loggedIn
       = await fetch('https://api.jamiez.co.uk/pwdmanager/webauthn/login-challenge', {
        method: 'POST',
        headers: {
          'content-type': 'Application/Json'
        },
        body: JSON.stringify(credentials)
      }).then(response => response.text());
      if (loggedIn) {
        displayMessage('You are logged in');
        return;
      }
      displayMessage('Invalid credential');
  } else {
    buildTable(jsonObj);

    openModal()
  }
  /*const challenge = await fetch('https://api.jamiez.co.uk/pwdmanager/webauthn/login', {
        method: 'POST',
        headers: {
          'content-type': 'Application/Json'
        },
        body: JSON.stringify({
          email: userEmail.value,
          keyid: 30
        })
      }).then(response => response.json());
      const credentials = await (0, _client.solveLoginChallenge)(challenge);
      const 
        loggedIn
       = await fetch('https://api.jamiez.co.uk/pwdmanager/webauthn/login-challenge', {
        method: 'POST',
        headers: {
          'content-type': 'Application/Json'
        },
        body: JSON.stringify(credentials)
      }).then(response => response.text());
      console.log(loggedIn);
      if (loggedIn) {
        displayMessage('You are logged in');
        return;
      }
      displayMessage('Invalid credential');
    */
};
/*
  */

},{"@webauthn/client":2}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "solveLoginChallenge", {
  enumerable: true,
  get: function () {
    return _solveLoginChallenge.solveLoginChallenge;
  }
});
Object.defineProperty(exports, "solveRegistrationChallenge", {
  enumerable: true,
  get: function () {
    return _solveRegistrationChallenge.solveRegistrationChallenge;
  }
});
var _solveRegistrationChallenge = require("./solveRegistrationChallenge");
var _solveLoginChallenge = require("./solveLoginChallenge");

},{"./solveLoginChallenge":3,"./solveRegistrationChallenge":4}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.solveLoginChallenge = void 0;
var _utils = require("./utils");
const loginChallengeToPublicKey = getAssert => {
  const {
    Unibabel
  } = require('unibabel');
  return {
    ...getAssert,
    challenge: Unibabel.base64ToBuffer(getAssert.challenge),
    allowCredentials: getAssert.allowCredentials.map(allowCredential => ({
      ...allowCredential,
      id: Unibabel.base64ToBuffer(allowCredential.id)
    }))
  };
};
const solveLoginChallenge = async credentialsChallengeRequest => {
  const publicKey = loginChallengeToPublicKey(credentialsChallengeRequest);

  // @ts-ignore
  const credentials = await navigator.credentials.get({
    publicKey
  });
  return (0, _utils.publicKeyCredentialToJSON)(credentials);
};
exports.solveLoginChallenge = solveLoginChallenge;

},{"./utils":5,"unibabel":6}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.solveRegistrationChallenge = void 0;
var _utils = require("./utils");
const registrationChallengeToPublicKey = credentialsChallengeRequest => {
  const {
    Unibabel
  } = require('unibabel');
  return {
    ...credentialsChallengeRequest,
    pubKeyCredParams: JSON.parse('[{"type": "public-key","alg": -7},{"type": "public-key","alg": -257}]'),
    challenge: Unibabel.base64ToBuffer(credentialsChallengeRequest.challenge),
    user: {
      ...credentialsChallengeRequest.user,
      id: Unibabel.base64ToBuffer(credentialsChallengeRequest.user.id)
    }
  };
};
const solveRegistrationChallenge = async credentialsChallengeRequest => {
  const publicKey = registrationChallengeToPublicKey(credentialsChallengeRequest);
  const credentials = await navigator.credentials.create({
    publicKey
  });
  return (0, _utils.publicKeyCredentialToJSON)(credentials);
};
exports.solveRegistrationChallenge = solveRegistrationChallenge;

},{"./utils":5,"unibabel":6}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.publicKeyCredentialToJSON = void 0;
const publicKeyCredentialToJSON = item => {
  if (item instanceof Array) {
    return item.map(publicKeyCredentialToJSON);
  }
  if (item instanceof ArrayBuffer) {
    const {
      Unibabel
    } = require('unibabel');
    // ArrayBuffer must be converted to typed arrays
    return Unibabel.bufferToBase64(new Uint8Array(item));
  }
  if (item instanceof Object) {
    const obj = {};

    // tslint:disable-next-line
    for (const key in item) {
      obj[key] = publicKeyCredentialToJSON(item[key]);
    }
    return obj;
  }
  return item;
};
exports.publicKeyCredentialToJSON = publicKeyCredentialToJSON;

},{"unibabel":6}],6:[function(require,module,exports){
(function (global){(function (){
(function (exports) {
'use strict';

function utf8ToBinaryString(str) {
  var escstr = encodeURIComponent(str);
  // replaces any uri escape sequence, such as %0A,
  // with binary escape, such as 0x0A
  var binstr = escstr.replace(/%([0-9A-F]{2})/g, function(match, p1) {
    return String.fromCharCode(parseInt(p1, 16));
  });

  return binstr;
}

function utf8ToBuffer(str) {
  var binstr = utf8ToBinaryString(str);
  var buf = binaryStringToBuffer(binstr);
  return buf;
}

function utf8ToBase64(str) {
  var binstr = utf8ToBinaryString(str);
  return btoa(binstr);
}

function binaryStringToUtf8(binstr) {
  var escstr = binstr.replace(/(.)/g, function (m, p) {
    var code = p.charCodeAt(0).toString(16).toUpperCase();
    if (code.length < 2) {
      code = '0' + code;
    }
    return '%' + code;
  });

  return decodeURIComponent(escstr);
}

function bufferToUtf8(buf) {
  var binstr = bufferToBinaryString(buf);

  return binaryStringToUtf8(binstr);
}

function base64ToUtf8(b64) {
  var binstr = atob(b64);

  return binaryStringToUtf8(binstr);
}

function bufferToBinaryString(buf) {
  var binstr = Array.prototype.map.call(buf, function (ch) {
    return String.fromCharCode(ch);
  }).join('');

  return binstr;
}

function bufferToBase64(arr) {
  var binstr = bufferToBinaryString(arr);
  return btoa(binstr);
}

function binaryStringToBuffer(binstr) {
  var buf;

  if ('undefined' !== typeof Uint8Array) {
    buf = new Uint8Array(binstr.length);
  } else {
    buf = [];
  }

  Array.prototype.forEach.call(binstr, function (ch, i) {
    buf[i] = ch.charCodeAt(0);
  });

  return buf;
}

function base64ToBuffer(base64) {
  var binstr = atob(base64);
  var buf = binaryStringToBuffer(binstr);
  return buf;
}

exports.Unibabel = {
  utf8ToBinaryString: utf8ToBinaryString
, utf8ToBuffer: utf8ToBuffer
, utf8ToBase64: utf8ToBase64
, binaryStringToUtf8: binaryStringToUtf8
, bufferToUtf8: bufferToUtf8
, base64ToUtf8: base64ToUtf8
, bufferToBinaryString: bufferToBinaryString
, bufferToBase64: bufferToBase64
, binaryStringToBuffer: binaryStringToBuffer
, base64ToBuffer: base64ToBuffer

// compat
, strToUtf8Arr: utf8ToBuffer
, utf8ArrToStr: bufferToUtf8
, arrToBase64: bufferToBase64
, base64ToArr: base64ToBuffer
};

}('undefined' !== typeof exports && exports || 'undefined' !== typeof window && window || global));

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
