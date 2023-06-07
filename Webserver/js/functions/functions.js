/*
Convert a string into an ArrayBuffer
from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
*/
function str2ab(str) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }
function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}
/* get cookie function from https://stackoverflow.com/questions/5639346/what-is-the-shortest-function-for-reading-a-cookie-by-name-in-javascript */
const getCookieValue = (name) => (
    document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || ''
)

function sendtoLogin() {
    window.location.href = 'https://jamiez.co.uk/test/login.php';
}

function isJsonString(str) {// From https://stackoverflow.com/questions/3710204/how-to-check-if-a-string-is-a-valid-json-string
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

/** From https://cdn.datatables.net/plug-ins/1.10.12/api/fnFindCellRowIndexes.js
 * Search through a table looking for a given string (optionally the search
 * can be restricted to a single column). The return value is an array with
 * the data indexes (from DataTables' internal data store) for any rows which
 * match.
 *
 *  @name fnFindCellRowIndexes
 *  @summary Search for data, returning row indexes
 *  @author [Allan Jardine](http://sprymedia.co.uk)
 *
 *  @param {string} sSearch Data to search for
 *  @param {integer} [iColumn=null] Limit search to this column
 *  @returns {array} Array of row indexes with this data
 *
 *  @example
 *    $(document).ready(function() {
 *        var table = $('#example').dataTable();
 * 
 *        var a = table.fnFindCellRowIndexes( '1.7' ); // Search all columns
 *
 *        var b = table.fnFindCellRowIndexes( '1.7', 3 );  // Search only column 3
 *    } );
 */
if(jQuery.fn.dataTableExt){//if datatables extension loaded
jQuery.fn.dataTableExt.oApi.fnFindCellRowIndexes = function ( oSettings, sSearch, iColumn )
{
	var
		i,iLen, j, jLen, val,
		aOut = [], aData,
		columns = oSettings.aoColumns;

	for ( i=0, iLen=oSettings.aoData.length ; i<iLen ; i++ )
	{
		aData = oSettings.aoData[i]._aData;

		if ( iColumn === undefined )
		{
			for ( j=0, jLen=columns.length ; j<jLen ; j++ )
			{
				val = this.fnGetData(i, j);

				if ( val == sSearch )
				{
					aOut.push( i );
				}
			}
		}
		else if (this.fnGetData(i, iColumn) == sSearch )
		{
			aOut.push( i );
		}
	}

	return aOut;
};
}

async function pfetch(url, body){
    let call = await fetch(url, {
        method: 'POST',
        headers: {
            'content-type': 'Application/Json'
        },
        body: body
    });
    if(!call.ok){
        throw new Error("Http Error: ${call.status}");//if there is an error code such as 502, 404
    }
    let result = await call.text();
    if(result=="Invalid Session"){
        sendtoLogin();
        return;
    } else {
        return result;
    }
}

async function argon(pass, salt, length, time){
    let derivation = await argon2
    .hash({
        type: argon2.argon2id,
        memoryCost: 2 ** 16,//64MiB of RAM
        hashLen: length,//def 32
        time: time,//def 3
        pass: pass,
        salt: salt
    });
    return derivation
}

async function importprivatekey(sessionkey, sessionid, email, encprivatekey, encryptedvaulthashkey){
    //decrypt vaulthashkey
    let aeshashkey = await argon(sessionkey, sessionid, 32, 3);
    /* JS FROM https://www.npmjs.com/package/aes-js */
    // When ready to decrypt the hex string, convert it back to bytes
    var encryptedBytes = aesjs.utils.hex.toBytes(encryptedvaulthashkey);
    // The counter mode of operation maintains internal state, so to
    // decrypt a new instance must be instantiated.
    var aesCtr = new aesjs.ModeOfOperation.ctr(aeshashkey.hash, new aesjs.Counter(5));
    var decryptedBytes = aesCtr.decrypt(encryptedBytes);
    // Convert our bytes back into text
    var vaulthashkey = aesjs.utils.utf8.fromBytes(decryptedBytes);

    //Now we have the decrypted vault key we need to unencrypt the private key to decrypt the vault
    let encryptedPrivateKeyBytes = aesjs.utils.hex.toBytes(encprivatekey);
    let privatehashkey = await argon(vaulthashkey, email, 32, 3);
    let privatekeyaesCtr = new aesjs.ModeOfOperation.ctr(privatehashkey.hash, new aesjs.Counter(5));
    let privatekeyBytes = privatekeyaesCtr.decrypt(encryptedPrivateKeyBytes);
    let privatekey = aesjs.utils.utf8.fromBytes(privatekeyBytes);//already plaintext because it was encrypted
    // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey
    const PemHeader = "-----BEGIN PRIVATE KEY-----";
    const PemFooter = "-----END PRIVATE KEY-----";
    const PemContents = privatekey.substring(PemHeader.length, privatekey.length - PemFooter.length);
    // base64 decode the string to get the binary data
    const binaryDerString = window.atob(PemContents);
    // convert from a binary string to an ArrayBuffer
    const binaryDer = str2ab(binaryDerString);

    return window.crypto.subtle.importKey(
        "pkcs8",
        binaryDer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        ["decrypt"]
    );
}

async function decrypt(iprivatekey, arraybuf){
    let decrypted = await window.crypto.subtle.decrypt(
        {
            name: "RSA-OAEP"
        },
        iprivatekey,
        arraybuf
    );
    return decrypted;

}

async function encryptshared(sessionid, passwordid, add_password_json){
    
        let call = await pfetch("https://api.jamiez.co.uk/pwdmanager/sharing/keys", JSON.stringify({
            sessionid: sessionid,
            passwordid: passwordid
        }))//ask api for public keys
        let edittable = JSON.parse('{"editdata": []}');
        
        if(isJsonString(call)){
            let sharedkeys = JSON.parse(call);
            for(let i=0; i<sharedkeys.length; i++){//encrypt using the public key of the shared users
                const SpkiHeader = "-----BEGIN PUBLIC KEY-----";
                const SpkiFooter = "-----END PUBLIC KEY-----";
                let publickey = window.atob(sharedkeys[i].publickey);
                const SpkiContents = publickey.substring(SpkiHeader.length, publickey.length - SpkiFooter.length);
                // base64 decode the string to get the binary data
                const binaryDerString2 = window.atob(SpkiContents);
                // convert from a binary string to an ArrayBuffer
                const binaryDer2 = str2ab(binaryDerString2);
                console.log(sharedkeys[i]);
                let ipublickey = await window.crypto.subtle.importKey(
                    "spki",
                    binaryDer2,
                    {
                    name: "RSA-OAEP",
                    hash: "SHA-256"
                    },
                    true,
                    ["encrypt"]
                );
                
                /* modified from https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt */
                let enc = new TextEncoder();
                let encodedpassword = enc.encode(add_password_json);
                let encrypted_password = await window.crypto.subtle.encrypt(
                    {
                    name: "RSA-OAEP",
                    },
                    ipublickey,
                    encodedpassword
                );
                
                const encryptedBase64 = window.btoa(ab2str(encrypted_password));
                let row = {"id": sharedkeys[i].id, "password": encryptedBase64};
                edittable.editdata.push(row);//add to array
            
            }
            return edittable;//send array
        } else {
            alert(call);//an error
            return false;
        }
    
    
}

async function encrypt(publickey, add_password_json){
    const SpkiHeader = "-----BEGIN PUBLIC KEY-----";
    const SpkiFooter = "-----END PUBLIC KEY-----";
    const SpkiContents = publickey.substring(SpkiHeader.length, publickey.length - SpkiFooter.length);
    // base64 decode the string to get the binary data
    const binaryDerString2 = window.atob(SpkiContents);
    // convert from a binary string to an ArrayBuffer
    const binaryDer2 = str2ab(binaryDerString2);
    let ipublickey = await window.crypto.subtle.importKey(
        "spki",
        binaryDer2,
        {
        name: "RSA-OAEP",
        hash: "SHA-256"
        },
        true,
        ["encrypt"]
    );
    
    /* modified from https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt */
    let enc = new TextEncoder();
    let encodedpassword = enc.encode(add_password_json);
    let encrypted_password = await window.crypto.subtle.encrypt(
        {
        name: "RSA-OAEP",
        },
        ipublickey,
        encodedpassword
    );
    const encryptedBase64 = window.btoa(ab2str(encrypted_password));
    return encryptedBase64;
}

function drawContextMenu(sessionid, iprivatekey){
    //Based on code from https://stackoverflow.com/questions/55054305/getting-datatable-row-clicked-on-with-context-menu
    ///NOTE: Callback async doesn't work so calls must be made with .then
    

    $.contextMenu({
        selector: 'tbody tr', //open only on the body section of the table when a table row(tr) is right clicked
        trigger: 'right',
        build: function(element, event) {
            switch(element.parents('table').first().attr('id')){
                case "passwords":
                    let deletestring="";
                    let deletesubstring="";
                    if($('#passwords').DataTable().row(element).data().shared==2){
                        deletestring="Remove";
                        deletesubstring="REMOVE!"
                    } else {
                        deletestring="Delete";
                        deletesubstring="DELETE!"
                    }
                    return {
                        callback: function(key, options) {
                            var table = $("#"+options.$trigger.parents('table').first().attr('id')).DataTable()
                            var row = table.row(options.$trigger)
                            var rowdata=row.data();
                            
                            switch (key) {
                            case 'copyuser' :
                                navigator.clipboard.writeText(rowdata.username);
                                break;
                            case 'copypwd' :
                                navigator.clipboard.writeText(rowdata.password);
                                break;
                            case 'edit' :
                                if(rowdata.shared==2){
                                    $('input#editid').val(rowdata.passwordid);    
                                } else {
                                    $('input#editid').val(rowdata.id);
                                }
                                $("h1.modal-title.can-change").html("Edit Password");//When the modal is closed revert it back to the add password text
                                $("button#edit-password").removeClass('hide');
                                $("button#add-password").addClass('hide');
                                $("input#url").val(rowdata.url);
                                $("input#name").val(rowdata.name);
                                $("input#username").val(rowdata.username);
                                $("input#password").val(rowdata.password);
                                $('#myModal').modal('show');
                                break;
                            case 'share' :
                                fetch("https://api.jamiez.co.uk/pwdmanager/sharing/info", {
                                    method: 'POST',
                                    headers: {
                                        'content-type': 'Application/Json'
                                    },
                                    body: JSON.stringify({
                                        passwordid: rowdata.id,
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
                                        if ( $.fn.dataTable.isDataTable( '#sharingtbl' ) ) {
                                            $('#sharingtbl').DataTable().destroy();
                                        }
                                        $('#sharingtbl').DataTable({
                                            data: JSON.parse(res.data).sharedbyme,
                                            columns: [
                                                { "title": "id", "data": "sharedid"},//, data: 'id' },
                                                { "title": "Name", "data": "sharedwith"},// data: 'name' }
                                                { "title": "Can Edit", "data": "canedit" },
                                                { "title": "Edit", "data": "edit" }
                                                
                                            ],
                                            columnDefs: [
                                                {
                                                    target: 0,
                                                    visible: false,
                                                    searchable: false,
                                                },
                                                {
                                                    target: 3,
                                                    visible: false,
                                                    searchable: false,
                                                },
                                            ],
                                            order: [[1, 'desc']],
                                            language: {
                                                "emptyTable": "This password is not currently shared with anyone.",
                                            }
                                        });
                                        $("input#passwordid").val(rowdata.id);
                                        $('#sharingModal').modal('show');
                                    }
                                })).catch(err => {
                                    console.log(err);
                                })
                                break;
                            case 'deletesub' :
                                if(rowdata.shared==2){
                                    //remove not delete
                                    fetch("https://api.jamiez.co.uk/pwdmanager/sharing/revoke", {
                                        method: 'POST',
                                        headers: {
                                            'content-type': 'Application/Json'
                                        },
                                        body: JSON.stringify({
                                            revokeid: rowdata.id,
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
                                        } else if(res.data=="Revoked") {
                                            row.remove().draw();
                                            console.log(res.data);
                                        } else {
                                            console.log(res.data);
                                            alert(res.data);
                                        }
                                    })).catch(err => {
                                        console.log(err);
                                    })
                                } else {
                                    fetch("https://api.jamiez.co.uk/pwdmanager/delete", {
                                        method: 'POST',
                                        headers: {
                                            'content-type': 'Application/Json'
                                        },
                                        body: JSON.stringify({
                                            passwordid: rowdata.id,
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
                                }
                                break;
                            default :
                                break
                            } 
                        },
                        items: {
                            "copyuser": {name: "Copy Username", icon: "copy"},
                            "copypwd": {name: "Copy Password", icon: "copy"},
                            "edit": {name: "Edit", icon: "edit", disabled: function(key, opt){//Disabled if it is a shared password and the owner hasn't given permission to edit
                                var table=$("#"+opt.$trigger.parents('table').first().attr('id')).DataTable()
                                var row = table.row(opt.$trigger)
                                var rowdata=row.data();
                                if(rowdata.editpermission==1){//If permission to edit
                                    return false;
                                } else {
                                    return true;
                                }
                                
                            }},
                            "share": {name: "Share", icon: "fa-handshake", disabled: function(key, opt){
                                var table=$("#"+opt.$trigger.parents('table').first().attr('id')).DataTable()
                                var row = table.row(opt.$trigger)
                                var rowdata=row.data();
                                if(rowdata.shared==2){//If password shared with user cant share
                                    return true;
                                } else {
                                    return false;
                                }
                            }},
                            "delete": {name: deletestring, icon: "delete", items:{
                                "deletesub": { name: deletesubstring, icon: "delete"}
                            }},                                        
                        }
                    }
                    break;
                case "sharingtbl":
                    var table = $("#"+element.parents('table').first().attr('id')).DataTable()
                    var row = table.row(element);
                    var rowdata = row.data();
                    var edittext=""
                    if(rowdata.edit==1){
                        edittext="Disable Editing";
                    } else {
                        edittext="Enable Editing";
                    }
                    return {
                        callback: function(key, options) {
                            var table = $("#"+options.$trigger.parents('table').first().attr('id')).DataTable()
                            var row = table.row(options.$trigger)
                            var rowdata=row.data();
                            
                            switch (key) {
                            case 'edit' :
                                let editpermission="";
                                if(rowdata.edit==1){
                                    editpermission="disable";
                                } else {
                                    editpermission="enable";
                                }
                                fetch("https://api.jamiez.co.uk/pwdmanager/sharing/edit/"+editpermission, {
                                    method: 'POST',
                                    headers: {
                                        'content-type': 'Application/Json'
                                    },
                                    body: JSON.stringify({
                                        passwordid: rowdata.sharedid,
                                        sessionid: sessionid
                                    })
                                }).then(result => 
                                        result.text().then(data => ({
                                            data: data
                                        })
                                ).then(res => {
                                    if(res.data=="Updated"){
                                        let updatedrow = rowdata;
                                        updatedrow.edit = !rowdata.edit;
                                        if(rowdata.canedit=="Yes"){
                                            updatedrow.canedit="No";
                                        } else {
                                            updatedrow.canedit="Yes";
                                        }
                                        row.data(updatedrow).draw();
                                        $('#errortextsharing').text("");//clear error text on success
                                    }
                                    else if(res.data=="Invalid Session"){
                                        sendtoLogin();
                                        return;
                                    } else {
                                        $('#errortextsharing').text(res.data);
                                        console.log(res.data);
                                    }
                                })).catch(err => {
                                    console.log(err);
                                })
                                break;
                            case 'revokesub' :
                                fetch("https://api.jamiez.co.uk/pwdmanager/sharing/revoke", {
                                    method: 'POST',
                                    headers: {
                                        'content-type': 'Application/Json'
                                    },
                                    body: JSON.stringify({
                                        revokeid: rowdata.sharedid,
                                        sessionid: sessionid
                                    })
                                }).then(result => 
                                        result.text().then(data => ({
                                            data: data
                                        })
                                ).then(res => {
                                    if(res.data=="Revoked"){
                                        row.remove().draw();
                                        $('#errortextsharing').text("");//clear error text on success
                                        
                                        if($("#sharingtbl").DataTable().rows().count()==0&&$.fn.dataTable.isDataTable( '#passwords' )){
                                            //update password table to remove shared symbol
                                            fetch("https://api.jamiez.co.uk/pwdmanager/vault", {
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
                                            ).then(vaultfetch2 => {
                                            
                                            if(isJsonString(vaultfetch2.data)){
                                                $('#passwords').DataTable().destroy();
                                                loadVault(JSON.parse(vaultfetch2.data), iprivatekey);
                                            } else {
                                                $('#errortext').text(vaultfetch2.data);
                                                return;
                                            }
                                            }));
                                        }
                                    }
                                    else if(res.data=="Invalid Session"){
                                        sendtoLogin();
                                        return;
                                    } else {
                                        $('#errortextsharing').text(res.data);
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
                            
                            "edit": {name: edittext, icon: "edit"},
                            
                            "revoke": {name: "Revoke", icon: "delete", items:{
                                "revokesub": { name: "REVOKE ACCESS!", icon: "delete"}
                            }},                                        
                        }
                        
                    }
                    break;
                case "sharedbymetbl":
                    return {
                        callback: function(key, options) {
                            var table = $("#"+options.$trigger.parents('table').first().attr('id')).DataTable()
                            var row = table.row(options.$trigger)
                            var rowdata=row.data();
                            console.log(rowdata);
                            
                            switch (key) {
                            case 'copyuser' :
                                navigator.clipboard.writeText(rowdata.username);
                                break;
                            case 'copypwd' :
                                navigator.clipboard.writeText(rowdata.password);
                                break;
                            case 'copyurl' :
                                navigator.clipboard.writeText(rowdata.url);
                                break;
                            case 'edit' :
                                $('#myModal').modal('show');
                                $('input#editid').val(rowdata.id);
                                $("h1.modal-title").html("Edit Password");//When the modal is closed revert it back to the add password text
                                $("button#edit-password").removeClass('hide');
                                $("button#add-password").addClass('hide');
                                $("input#url").val(rowdata.url);
                                $("input#name").val(rowdata.name);
                                $("input#username").val(rowdata.username);
                                $("input#password").val(rowdata.password);
                                break;
                            case 'share' :
                                fetch("https://api.jamiez.co.uk/pwdmanager/sharing/info", {
                                    method: 'POST',
                                    headers: {
                                        'content-type': 'Application/Json'
                                    },
                                    body: JSON.stringify({
                                        passwordid: rowdata.id,
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
                                        if ( $.fn.dataTable.isDataTable( '#sharingtbl' ) ) {
                                            $('#sharingtbl').DataTable().destroy();
                                        }
                                        $('#sharingtbl').DataTable({
                                            data: JSON.parse(res.data).sharedbyme,
                                            columns: [
                                                { "title": "id", "data": "sharedid"},//, data: 'id' },
                                                { "title": "Name", "data": "sharedwith"},// data: 'name' }
                                                { "title": "Can Edit", "data": "canedit" },
                                                { "title": "Edit", "data": "edit" }
                                                
                                            ],
                                            columnDefs: [
                                                {
                                                    target: 0,
                                                    visible: false,
                                                    searchable: false,
                                                },
                                                {
                                                    target: 3,
                                                    visible: false,
                                                    searchable: false,
                                                },
                                            ],
                                            order: [[1, 'desc']],
                                            language: {
                                                "emptyTable": "This password is not currently shared with anyone.",
                                            }
                                        });
                                        $("input#passwordid").val(rowdata.id);
                                        $('#sharingModal').modal('show');
                                    }
                                })).catch(err => {
                                    console.log(err);
                                })
                                break;
                            case 'deletesub' :
                                fetch("https://api.jamiez.co.uk/pwdmanager/delete", {
                                    method: 'POST',
                                    headers: {
                                        'content-type': 'Application/Json'
                                    },
                                    body: JSON.stringify({
                                        passwordid: rowdata.id,
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
                            "copyuser": {name: "Copy Username", icon: "copy"},
                            "copypwd": {name: "Copy Password", icon: "copy"},
                            "copyurl": {name: "Copy URL", icon: "copy"},
                            "edit": {name: "Edit", icon: "edit"},
                            "share": {name: "Share", icon: "fa-handshake"},
                            "delete": {name: "Delete", icon: "delete", items:{
                                "deletesub": { name: "DELETE!", icon: "delete"}
                            }},                                        
                        }
                    }
                    break;
                case "sharedwithmetbl":
                    return {
                        callback: function(key, options) {
                            var table = $("#"+options.$trigger.parents('table').first().attr('id')).DataTable()
                            var row = table.row(options.$trigger)
                            var rowdata=row.data();
                            console.log(rowdata);
                            
                            switch (key) {
                            case 'copyuser' :
                                navigator.clipboard.writeText(rowdata.username);
                                break;
                            case 'copypwd' :
                                navigator.clipboard.writeText(rowdata.password);
                                break;
                            case 'copyurl' :
                                navigator.clipboard.writeText(rowdata.url);
                                break;
                            case 'edit' :
                                $('#myModal').modal('show');
                                $('input#editid').val(rowdata.passwordid);
                                $("h1.modal-title").html("Edit Password");//When the modal is closed revert it back to the add password text
                                $("button#edit-password").removeClass('hide');
                                $("button#add-password").addClass('hide');
                                $("input#url").val(rowdata.url);
                                $("input#name").val(rowdata.name);
                                $("input#username").val(rowdata.username);
                                $("input#password").val(rowdata.password);
                                break;
                            case 'removesub' :
                                fetch("https://api.jamiez.co.uk/pwdmanager/sharing/revoke", {
                                    method: 'POST',
                                    headers: {
                                        'content-type': 'Application/Json'
                                    },
                                    body: JSON.stringify({
                                        revokeid: rowdata.id,
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
                                    } else if(res.data=="Revoked") {
                                        row.remove().draw();
                                        console.log(res.data);
                                    } else {
                                        console.log(res.data);
                                        alert(res.data);
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
                            "copyuser": {name: "Copy Username", icon: "copy"},
                            "copypwd": {name: "Copy Password", icon: "copy"},
                            "copyurl": {name: "Copy URL", icon: "copy"},
                            "edit": {name: "Edit", icon: "edit", disabled: function(key, opt){//Disabled if it is a shared password and the owner hasn't given permission to edit
                                var table = $("#"+opt.$trigger.parents('table').first().attr('id')).DataTable()
                                var row = table.row(opt.$trigger);
                                var rowdata=row.data();
                                if(rowdata.editpermission==1){//only allow edit if user has permission
                                    return false;
                                } else {
                                    return true;
                                }
                            }},
                            "remove": {name: "Remove", icon: "delete", items:{
                                "removesub": { name: "REMOVE!", icon: "delete"}
                            }},                                        
                        }
                    }
                    break;
                default :
                    break;
            }
        }
        
    }) 
}

async function decryptArray(iprivatekey, passwords, tabledata, shared){
    for(let i=0; i<passwords.length; i++){
        try {
            let arraybuf = str2ab(window.atob(passwords[i].password));
            let decodedpassword = await decrypt(iprivatekey, arraybuf);
            let decoded = new TextDecoder().decode(decodedpassword)
            passwords[i].password=decoded;
            let pwddata = JSON.parse(passwords[i].password);
            if(shared==0){
                let row = {"id": passwords[i].id, "passwordid": passwords[i].passwordid, "name": pwddata.name, "url": pwddata.url, "username": pwddata.username, "password": pwddata.password, "editpermission": passwords[i].edit, "shared": passwords[i].shared };
                tabledata.passwords.push(row);
            } else if(shared==1) {
                let row = {"id": passwords[i].id, "name": pwddata.name, "url": pwddata.url, "username": pwddata.username, "password": pwddata.password, "sharedwith": passwords[i].sharedwith, "editpermission": passwords[i].edit };
                tabledata.sharedbyme.push(row);
            } else if(shared==2){
                let row = {"id": passwords[i].id, "passwordid": passwords[i].passwordid, "name": pwddata.name, "url": pwddata.url, "username": pwddata.username, "password": pwddata.password, "sharedby": passwords[i].owner, "editpermission": passwords[i].edit };
                tabledata.sharedwithme.push(row);
            } else if(shared==3){
                let row = {"name": pwddata.name, "url": pwddata.url, "username": pwddata.username, "password": pwddata.password, "sharedwith": passwords[i].sharedwith, "sharedby": passwords[i].sharedby };
                tabledata.passwords.push(row);
            } else if(shared==4){
                let row = {"name": pwddata.name, "url": pwddata.url, "username": pwddata.username, "password": pwddata.password, "sharedwith": passwords[i].sharedwith };
                tabledata.passwords.push(row);
            } else if(shared==5){
                let row = {"name": pwddata.name, "url": pwddata.url, "username": pwddata.username, "password": pwddata.password, "sharedby": passwords[i].sharedby };
                tabledata.passwords.push(row);
            }
        } catch(e){
            console.log(e+": Possible parsing fail for "+JSON.stringify(passwords[i].password));//could occur if the password cant be parsed
        }
    }
    return tabledata;
}

async function loadVault(vault, iprivatekey){
    //Now decrypt the vault passwords
    //for loop for passwords to decrypt
    let inittabledata = JSON.parse('{"passwords": []}');
    let tabledata = await decryptArray(iprivatekey, vault.passwords, inittabledata, 0);
    
    $('#passwords').DataTable({//Insert into table
        data: tabledata.passwords,
        columns: [
            { "title": "id", "data": "id"},//, data: 'id' },
            { "title": "Name", "data": "name"},// data: 'name' }
            { "title": "URL", "data": "url" },
            { "title": "Username", "data": "username" },
            { "title": "Password", "data": "password" },
            { "title": "Shared", "data": "shared" }
            
        ],
        columnDefs: [
            {
                target: 0,
                visible: false,
                searchable: false,
            },
            {
                "render": function ( data, type, row ) {
                    let newdata=data.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    if(row.shared=="1"){
                        return '<i title="Shared by me" class="fa fa-handshake green pad-right"></i>'+newdata;
                    } else if(row.shared=="2"){
                        return '<i title="Shared with me" class="fa fa-handshake orange pad-right"></i>'+newdata;
                    } else {
                        return newdata;
                    }
                },
                target: 1,
            },
            {
                "render": function ( data, type, row ) {
                    let newdata=data.replace(/</g, "&lt;").replace(/>/g, "&gt;");//converts < and > to html equivilant From https://stackoverflow.com/questions/20855482/preventing-html-and-script-injections-in-javascript
                    //this stops html code being injected eg <h1>test</h1> wont show as a big "test" header
                    return newdata;
                },
                targets: [2,3],
            },
            {
                target: 4,
                visible: false,
                searchable: false,
            },
            {
                target: 5,
                visible: false,
                searchable: false,
            },
        ],
        order: [[1, 'asc']],
        language: {
            "emptyTable": "There are currently no stored passwords on your account.",
        }
    });
}

function deleteDataOnModalHide(){
    $('#myModal').on('hide.bs.modal', function(){//From https://www.w3schools.com/bootstrap/tryit.asp?filename=trybs_ref_js_modal_event_hide&stacked=h
        if($("h1.modal-title:contains('Edit')").length){//length is required because it returns an object not boolean but if the length is 0 then it is false
            //If the user was editing clear the fields(if was adding keep them incase they reopen the modal)
            $('input#url').val('');
            $('input#name').val('');
            $('input#username').val('');
            $('input#password').val('');
            $('input#editid').val('');
        }
        $("h1.modal-title.can-change").html("Add Password");//When the modal is closed revert it back to the add password text
        $("button#edit-password").addClass('hide');
        $("button#add-password").removeClass('hide');
    });

    $('#sharingModal').on('hide.bs.modal', function(){//From https://www.w3schools.com/bootstrap/tryit.asp?filename=trybs_ref_js_modal_event_hide&stacked=h
        $('#errortextsharing').text("");//clear the error text when closed
    });
}