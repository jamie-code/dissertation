/*JS FROM https://stackoverflow.com/questions/55926281/how-do-i-hash-a-string-using-javascript-with-sha512-algorithm*/
function sha512(str) {
    return crypto.subtle.digest("SHA-512", new TextEncoder("utf-8").encode(str)).then(buf => {
      return Array.prototype.map.call(new Uint8Array(buf), x=>(('00'+x.toString(16)).slice(-2))).join('');
    });
}

(function ($) {
    "use strict";

    
    /*==================================================================
    [ Validate ]*/
    function validate (input) {
        if($(input).attr('type') == 'email' || $(input).attr('name') == 'email') {
            if($(input).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null) {
                return false;
            }
        }
        else {
            if($(input).val().trim() == ''){
                return false;
            }
            if($(input).val().trim().length<8){
                return false;
            }
        }
    }

    function showValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).addClass('alert-validate');
    }

    function hideValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).removeClass('alert-validate');
    }
    var input = $('.validate-input .input100');

    $('.validate-form').on('submit',function(){
        var check = true;

        for(var i=0; i<input.length; i++) {
            if(validate(input[i]) == false){
                showValidate(input[i]);
                check=false;
            }
        }
        
        if(check === true){
            let email=$(input[0]).val().trim();
            let password=$(input[1]).val().trim();
            argon2
            .hash({
                type: argon2.argon2id,
                memoryCost: 2 ** 16, //64MiB of RAM
                hashLen: 128,
                time: 5,
                pass: password,//password is pass
                salt: email//email is salt
            })
            .then(hash => {
                //hash will be the main key for encryption
                let vaulthashkey = hash.encoded;

                let sha512salt=password;//use password as salt
                sha512(vaulthashkey+sha512salt).then(
                    sha512password => {
                        argon2
                            .hash({
                                type: argon2.argon2id,
                                memoryCost: 2 ** 16,
                                hashLen: 128,
                                time: 3,
                                pass: sha512password,
                                salt: password//password is salt
                            })
                            .then(hash2 => {//hash #1
                                fetch("https://api.jamiez.co.uk/pwdmanager/login", {
                                    method: 'POST',
                                    headers: {
                                        'content-type': 'Application/Json'
                                    },
                                    body: JSON.stringify({
                                        email: email,
                                        argon2hash: hash2.encoded
                                    })
                                }).then(result => 
                                        result.text().then(data => ({
                                            data: data
                                        })
                                ).then(res => {
                                    if(res.data=="Invalid parameters" || res.data=="Email Not Registered" || res.data=="Invalid password"){
                                        console.log("An error occurred");
                                        $('#errortext').text(res.data);
                                    } else {
                                        console.log(JSON.parse(res.data));
                                        let data = JSON.parse(res.data);
                                        
                                        //make cookie from sessionid
                                        let sessionid = data.sessionid;
                                        document.cookie = "pwdmgr-sessionid="+sessionid+"; expires="+data.expires+";";
                                        //encrypt vaulthashkey with sessionkey and store in localstorage
                                        let sessionkey=data.sessionkey;
                                        argon2
                                        .hash({
                                            type: argon2.argon2id,
                                            memoryCost: 2 ** 16,
                                            hashLen: 32,
                                            time: 3,
                                            pass: sessionkey,
                                            salt: sessionid
                                        })
                                        .then(aeshashkey => {
                                            /* JS FROM https://www.npmjs.com/package/aes-js */
                                            // Convert text to bytes
                                            let encryptionkeyarray=aeshashkey.hash;
                                            var textBytes = aesjs.utils.utf8.toBytes(vaulthashkey);
                                            // The counter is optional, and if omitted will begin at 1
                                            var aesCtr = new aesjs.ModeOfOperation.ctr(encryptionkeyarray, new aesjs.Counter(5));
                                            var encryptedBytes = aesCtr.encrypt(textBytes);
                                            // To print or store the binary data, you may convert it to hex
                                            var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);//Encrypted vaultkey
                                            localStorage.setItem("pwdmgr-vaulthashkey", encryptedHex);//store the encrypted version in local storage
                                            localStorage.setItem("pwdmgr-email", email);//store email
                                            if(data.verified==0){//webauthn required
                                                //ask for challenge from loginkey
                                                fetch("https://api.jamiez.co.uk/pwdmanager/loginkey", {
                                                    method: 'POST',
                                                    headers: {
                                                        'content-type': 'Application/Json'
                                                    },
                                                    body: JSON.stringify({
                                                        sessionid: sessionid
                                                    })
                                                }).then(result => 
                                                        result.text().then(data => ({
                                                            data: data
                                                        })
                                                ).then(res => {
                                                    try{
                                                        /* Based on https://github.com/milesstoetzner/WebAuthn-Node.js-Demo/blob/master/views/authenticate.ejs */
                                                        //Encode challenge and each id in allowCredentials as Uint8Array
                                                        let options = JSON.parse(res.data);
                                                        options.challenge = new Uint8Array(options.challenge.data);
                                                        for (let i = 0; i < options.allowCredentials.length; i++) {
                                                            options.allowCredentials[i].id = new Uint8Array(options.allowCredentials[i].id.data);
                                                        }
                                                        //Call webauthn to sign the challenge
                                                        navigator.credentials.get({"publicKey": options})
                                                            .then(function (PublicKeyCredential) {
                                                                // Encode the received answer as JSON
                                                                let PublicKeyCredentialJSON = {
                                                                    PublicKeyCredential: {
                                                                        id: PublicKeyCredential.id,
                                                                        rawId: Array.from(new Uint8Array(PublicKeyCredential.rawId)),
                                                                        response: {
                                                                            authenticatorData: Array.from(new Uint8Array(PublicKeyCredential.response.authenticatorData)),
                                                                            clientDataJSON: Array.from(new Uint8Array(PublicKeyCredential.response.clientDataJSON)),
                                                                            signature: Array.from(new Uint8Array(PublicKeyCredential.response.signature)),
                                                                            userHandle: Array.from(new Uint8Array(PublicKeyCredential.response.userHandle))
                                                                        },
                                                                        type: PublicKeyCredential.type
                                                                    },
                                                                    sessionid: sessionid
                                                                }
                                                                console.log('PublicKeyCredential:', PublicKeyCredential);
                                                                // Send the answer to the server
                                                                let data = JSON.stringify(PublicKeyCredentialJSON);
                                                                console.log(data);
                                                                fetch('https://api.jamiez.co.uk/pwdmanager/loginkey/callback', {
                                                                    method: 'POST',
                                                                    headers: {
                                                                        'content-type': 'Application/Json'
                                                                    },
                                                                    body: data
                                                                    }).then(result =>
                                                                        result.text().then(data => ({
                                                                            data: data
                                                                        })).then(response => {
                                                                            console.log(response.data);
                                                                            if(response.data=="Logged in"){
                                                                                //goto dashboard
                                                                                window.location.href = 'https://jamiez.co.uk/test/dashboard.php';
                                                                            } else {
                                                                                $('#errortext').text(response.data);
                                                                            }
                                                                        })
                                                                    )
                                                            }).catch(function (err) {
                                                            // No acceptable authenticator or user refused consent
                                                            
                                                            $('#errortext').text("No acceptable authenticator or user refused consent!");
                                                            console.log('Error inside navigator.credentials.get:', err);
                                                            throw new Error("No acceptable authenticator or user refused consent!");
                                                        });
                                                    } catch(e){
                                                        console.log(e);
                                                        $('#errortext').text(res.data);
                                                    }
                                                }));
                                            } else {//No webauthn required
                                                window.location.href = 'https://jamiez.co.uk/test/dashboard.php';
                                            }
                                        });
                                    }
                                })).catch(err => {
                                    console.log(err);
                                })
                            });
                    }
                );
            });
        }

        return false;
    });


    $('.validate-form .input100').each(function(){
        $(this).focus(function(){
           hideValidate(this);
        });
    });

    
    
    

})(jQuery);