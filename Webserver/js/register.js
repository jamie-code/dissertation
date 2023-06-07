/*JS FROM https://stackoverflow.com/questions/55926281/how-do-i-hash-a-string-using-javascript-with-sha512-algorithm*/
function sha512(str) {
    return crypto.subtle.digest("SHA-512", new TextEncoder("utf-8").encode(str)).then(buf => {
      return Array.prototype.map.call(new Uint8Array(buf), x=>(('00'+x.toString(16)).slice(-2))).join('');
    });
}
/* JS FROM https://developer.chrome.com/blog/how-to-convert-arraybuffer-to-and-from-string/ */
function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}
/* JS FROM ColourLib*/
(function ($) {
    "use strict";

    
    /*==================================================================
    [ Validate ]*/
    function validate (input, i) {
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
            if(validate(input[i], i) == false){
                
                showValidate(input[i]);
                check=false;
            }
            if(i==2){//if it passes everything check passwords match
                if($(input[1]).val().trim()!==$(input[2]).val().trim()){
                    showValidate(input[2]);
                    check=false;
                }
                
            }
        }
        if(check==true){
            let email = $(input[0]).val().trim();
            let password = $(input[1]).val().trim();
            $(input[1]).val("");//clear the password from the form
            $(input[2]).val("");//clear the password from the form
            
            //hash with argon2id and 2x16MB of memory
                    
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
                        console.log(hash.encoded);
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
                                //hash with argon2id and 2x16MB of memory
                                
                                    argon2
                                        .hash({
                                            type: argon2.argon2id,
                                            memoryCost: 2 ** 16,
                                            hashLen: 32,
                                            time: 3,
                                            pass: vaulthashkey,
                                            salt: email
                                        })
                                        .then(hash3 => {//generate a key array to encrypt the rsa private key
                                            
                                            //Generate RSA key pairs to encrypt from https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/exportKey
                                            window.crypto.subtle.generateKey(
                                                {
                                                name: "RSA-OAEP",
                                                // Consider using a 4096-bit key for systems that require long-term security
                                                modulusLength: 2048,
                                                publicExponent: new Uint8Array([1, 0, 1]),
                                                hash: "SHA-256",
                                                },
                                                true,
                                                //^ determines if key is extractable
                                                ["encrypt", "decrypt"]
                                            ).then((keyPair) => {
                                                
                                                window.crypto.subtle.exportKey(
                                                    "spki",//Subject public key info
                                                    keyPair.publicKey
                                                ).then((PublicKey) => {
                                                    console.log(PublicKey);
                                                    const PublicKeyString = ab2str(PublicKey);
                                                    const PublicKeyBase64 = window.btoa(PublicKeyString);
                                                    const PublicKeySpki = `-----BEGIN PUBLIC KEY-----\n${PublicKeyBase64}\n-----END PUBLIC KEY-----`;
                                                    window.crypto.subtle.exportKey(
                                                        "pkcs8",
                                                        keyPair.privateKey
                                                    ).then((PrivateKey) => {
                                                        const PrivateKeyString = ab2str(PrivateKey);
                                                        const PrivateKeyBase64 = window.btoa(PrivateKeyString);
                                                        const PrivateKeyPem = `-----BEGIN PRIVATE KEY-----\n${PrivateKeyBase64}\n-----END PRIVATE KEY-----`;

                                                        let encryptionkeyarray = hash3.hash;//The hash from argon2 will be the encryptionkey
                                                        //This outputs a Uint8Array of 32 bytes ^
                                                        /* JS FROM https://www.npmjs.com/package/aes-js */
                                                        // Convert text to bytes
                                                        var text = PrivateKeyPem;//encrypt the private key
                                                        var textBytes = aesjs.utils.utf8.toBytes(text);

                                                        // The counter is optional, and if omitted will begin at 1
                                                        var aesCtr = new aesjs.ModeOfOperation.ctr(encryptionkeyarray, new aesjs.Counter(5));
                                                        var encryptedBytes = aesCtr.encrypt(textBytes);

                                                        // To print or store the binary data, you may convert it to hex
                                                        var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);//Encrypted private key
                                                        fetch("https://api.jamiez.co.uk/pwdmanager/register", {
                                                            method: 'POST',
                                                            headers: {
                                                                'content-type': 'Application/Json'
                                                            },
                                                            body: JSON.stringify({
                                                                email: email,
                                                                argon2hash: hash2.encoded,
                                                                publickey: PublicKeySpki,
                                                                privatekey: encryptedHex
                                                            })
                                                        }).then(result => 
                                                            result.text().then(data => ({
                                                                data: data
                                                            })
                                                        ).then(res => {
                                                            console.log(res.data);
                                                            if(res.data=="Success")
                                                                window.location.href = 'https://jamiez.co.uk/test/login.php';
                                                            else
                                                                $('#errortext').text(res.data);
                                                        })).catch(err => {
                                                            console.log(err);
                                                        })
                                                    });
                                                });
                                                
                                            });
                                        });
                                
                                    
                            });
                    });
            });
                
                           
                
        }


        return false;//if false the form submition stops
    });


    $('.validate-form .input100').each(function(){
        $(this).focus(function(){
           hideValidate(this);
        });
    });

    
    
    

})(jQuery);