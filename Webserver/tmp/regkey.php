<script src="js/cbor.js"></script><!--From https://github.com/milesstoetzner/WebAuthn-Node.js-Demo/blob/master/public/javascripts/cbor.js -->
<script>
    let sessionid="OkoiS0hKe1FKejNVVTllfDJjcilbLEduNUVtfU4sJk8/Nz15VVRfNUlpKXdScX43WTY=";
    fetch('https://api.jamiez.co.uk/pwdmanager/registerkey', {
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
            })).then(PublicKeyCredentialCreationOptions => {
                //check for error
                switch(PublicKeyCredentialCreationOptions.data){
                    case "No key found":
                        console.log(PublicKeyCredentialCreationOptions);
                        break;
                    case "No email found":
                        console.log(PublicKeyCredentialCreationOptions);
                        break;
                }
                /* Based on https://github.com/milesstoetzner/WebAuthn-Node.js-Demo/blob/master/views/register.ejs */
                console.log(PublicKeyCredentialCreationOptions.data);
                // Encode challenge, user.id and each id in excludeCredentials as Uint8Array
                let options = JSON.parse(PublicKeyCredentialCreationOptions.data);
                console.log(options.user.id);
                console.log(options.challenge);
                options.challenge = new Uint8Array(options.challenge.data);
                options.user.id = new Uint8Array(options.user.id.data);

                for (let i = 0; i < options.excludeCredentials.length; i++) {
		            options.excludeCredentials[i].id = new Uint8Array(options.excludeCredentials[i].id.data);
	            }
                // Call the registration on the authenticator using WebAuthentication API
                console.log(options);
                
                navigator.credentials.create({"publicKey": options})
                    .then(function (PublicKeyCredential) {
                        // Encode the received answer as JSON
                        let attestationObject = CBOR.decode(PublicKeyCredential.response.attestationObject);
                        let PublicKeyCredentialJSON = {
                            PublicKeyCredential: {
                                id: PublicKeyCredential.id,
                                rawId: Array.from(new Uint8Array(PublicKeyCredential.rawId)),
                                response: {
                                    attestationObject: {
                                        attStmt: {},
                                        authData: Array.from(attestationObject.authData),
                                        fmt: attestationObject.fmt
                                    },
                                    clientDataJSON: Array.from(new Uint8Array(PublicKeyCredential.response.clientDataJSON))
                                },
                                type: PublicKeyCredential.type
                            },
                            sessionid: sessionid
                        }
                        console.log('PublicKeyCredential:', PublicKeyCredential);
                        // Send the answer to the server
                        let data = JSON.stringify(PublicKeyCredentialJSON);
                        fetch('https://api.jamiez.co.uk/pwdmanager/registerkey/callback', {
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
                                })
                            )

                    }).catch(function (err) {
                    // No acceptable authenticator or user refused consent
                    alert('No acceptable authenticator or user refused consent!');
                    console.log('Error inside navigator.credentials.create:', err);
                    
                });
            
        
            })
        )
</script>