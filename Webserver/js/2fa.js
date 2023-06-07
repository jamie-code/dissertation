

$(document).ready(function() { 
    let sessionid = getCookieValue("pwdmgr-sessionid");
    if(sessionid==null){
        //send to login
        sendtoLogin();
        return;
    } else {//found a sessionid cookie
        //check for email and encrypted vault key
        let email = localStorage.getItem('pwdmgr-email');
        if(email !=null){//values exist in local storage
            console.log(email);
            console.log(sessionid);
            //Request passwords from api
            fetch("https://api.jamiez.co.uk/pwdmanager/request-keys", {
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
                if(res.data=="Invalid Session"){
                    sendtoLogin();
                    return;
                } else {
                    console.log(res.data);
                    
                    $('#keys').DataTable({//Insert into table
                        data: JSON.parse(res.data),
                        columns: [
                            { "title": "id", "data": "id"},//, data: 'id' },
                            { "title": "Name", "data": "name"}// data: 'name' }
                            
                        ],
                        columnDefs: [
                            {
                                target: 0,
                                visible: false,
                                searchable: false,
                            },
                        ],
                        order: [[1, 'desc']],
                        language: {
                            "emptyTable": "There are currently no 2FA keys on your account.",
                        }
                    });
                    //Based on code from https://stackoverflow.com/questions/55054305/getting-datatable-row-clicked-on-with-context-menu
                    var table = $('#keys').DataTable()

                    $.contextMenu({
                        selector: 'tr', 
                        trigger: 'right',
                        callback: function(key, options) {
                            var row = table.row(options.$trigger)
                            var rowdata=row.data();
                            console.log(rowdata.id);
                            switch (key) {
                            case 'deletesub' :
                                fetch("https://api.jamiez.co.uk/pwdmanager/deletekey", {
                                    method: 'POST',
                                    headers: {
                                        'content-type': 'Application/Json'
                                    },
                                    body: JSON.stringify({
                                        keyid: rowdata.id,
                                        sessionid: sessionid
                                    })
                                }).then(result => 
                                        result.text().then(data => ({
                                            data: data
                                        })
                                ).then(res => {
                                    if(res.data=="Invalid Session"){
                                        sendtoLogin();
                                        return;
                                    } else {
                                        row.remove().draw();
                                        console.log(res.data);
                                    }
                                })).catch(err => {
                                    console.log(err);
                                })
                                break;
                            default :
                                break
                            } 
                        },
                        items: {
                            "delete": {name: "Delete", icon: "delete", items:{
                                "deletesub": { name: "DELETE!", icon: "delete"}
                            }},
                        }
                    }) 

                    document.getElementById("register-key").addEventListener('click', function() {
                        var input = $('.add-key');
                        let name=$(input[0]).val().trim();
                        if(name!=""){
                            //register key with name
                            //check key not already registered with name
                            fetch('https://api.jamiez.co.uk/pwdmanager/registerkey', {
                            method: 'POST',
                            headers: {
                                'content-type': 'Application/Json'
                            },
                            body: JSON.stringify({
                                sessionid: sessionid,
                                keyname: name
                            })
                            }).then(result =>
                                result.text().then(data => ({
                                    data: data
                                })).then(PublicKeyCredentialCreationOptions => {
                                    //check for error
                                    if(!isJsonString(PublicKeyCredentialCreationOptions.data)){//If not json then an error occured
                                        alert(PublicKeyCredentialCreationOptions.data);
                                        return;
                                    } else {
                                    
                                        /* Based on https://github.com/milesstoetzner/WebAuthn-Node.js-Demo/blob/master/views/register.ejs */
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
                                                    sessionid: sessionid,
                                                    keyname: name
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
                                                            if(response.data=="Success"){
                                                                //close modal
                                                                $('#myModal').modal('hide');
                                                                window.location.reload();
                                                            } else {
                                                                alert(response.data);
                                                            }
                                                        })
                                                    )

                                            }).catch(function (err) {
                                            // No acceptable authenticator or user refused consent
                                            alert(err);
                                            console.log('Error inside navigator.credentials.create:', err);
                                            
                                        });
                                    }
                                
                            
                                })
                            )
                        } else {
                            console.log("Name cannot be empty");
                        }
                    });
                            
                }

            })).catch(err => {
                console.log(err);
            })
        } else {
            sendtoLogin();
            return;
        }
    }
});