/*JS FROM https://stackoverflow.com/questions/55926281/how-do-i-hash-a-string-using-javascript-with-sha512-algorithm*/
function sha512(str) {
    return crypto.subtle.digest("SHA-512", new TextEncoder("utf-8").encode(str)).then(buf => {
      return Array.prototype.map.call(new Uint8Array(buf), x=>(('00'+x.toString(16)).slice(-2))).join('');
    });
}
async function start() {
    let sessionid = getCookieValue("pwdmgr-sessionid");
    if(sessionid==null){
        //send to login
        sendtoLogin();
        return;
    } else {//found a sessionid cookie
        //check for email and encrypted vault key
        let email = localStorage.getItem('pwdmgr-email');
        let encryptedvaulthashkey = localStorage.getItem('pwdmgr-vaulthashkey');
        if(email !=null && encryptedvaulthashkey !=null){//values exist in local storage
            document.getElementById("exportpasswords").addEventListener("click", async function(){
                let passwordinput = $('.form-control');

                let personalpasswords = $('#personalpasswords:checked').length;
                let sharedpasswords = $('#sharedpasswords:checked').length;

                let masterpassword = $(passwordinput[0]).val().trim();
                let type=0;
                let addionalname="";
                if(personalpasswords&&sharedpasswords){
                    type=1
                } else if (personalpasswords){
                    type=2;
                    addionalname="-personal";
                } else if(sharedpasswords){
                    type=3;
                    addionalname="-shared";
                } else {
                    //No checkbox selected
                    $('#errortext').text("Please select a checkbox");
                    return;
                }
                let vaulthashkey = await argon(masterpassword, email, 128, 5);
                vaulthashkey=vaulthashkey.encoded;
                //Call api for passwords
                let exportpwds = await pfetch("https://api.jamiez.co.uk/pwdmanager/export", JSON.stringify({
                    type: type,
                    sessionid: sessionid
                }));
                if(isJsonString(exportpwds)){//returned ok
                    //check password matches (Its only a clientside check)
                    exportpwds = JSON.parse(exportpwds);
                    /* JS FROM https://www.npmjs.com/package/aes-js */
                    let aeshashkey = await argon(exportpwds.sessionkey, sessionid, 32, 3);
                    
                    let encryptionkeyarray=aeshashkey.hash;
                    var textBytes = aesjs.utils.utf8.toBytes(vaulthashkey);
                    // The counter is optional, and if omitted will begin at 1
                    var aesCtr = new aesjs.ModeOfOperation.ctr(encryptionkeyarray, new aesjs.Counter(5));
                    var encryptedBytes = aesCtr.encrypt(textBytes);
                    // To print or store the binary data, you may convert it to hex
                    var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);//Encrypted vaultkey
                    if(encryptedHex==encryptedvaulthashkey){//The password entered was the master password
                        //Decrypt the passwords
                        let iprivatekey = await importprivatekey(exportpwds.sessionkey, sessionid, email, exportpwds.privatekey, encryptedvaulthashkey);
                        let inittabledata = JSON.parse('{"passwords": []}');
                        let decrypted = await decryptArray(iprivatekey, exportpwds.passwords, inittabledata, type+2);
                        //From https://stackoverflow.com/questions/8847766/how-to-convert-json-to-csv-format-and-store-in-a-variable
                        const items = decrypted.passwords
                        const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
                        const header = Object.keys(items[0])
                        const csv = [
                        header.join(','), // header row first
                        ...items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
                        ].join('\r\n')

                        //From https://medium.com/@danny.pule/export-json-to-csv-file-using-javascript-a0b7bc5b00d2
                        var exportedFilenmae = email + addionalname + '.csv' || 'export.csv';

                        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                        if (navigator.msSaveBlob) { // IE 10+
                            navigator.msSaveBlob(blob, exportedFilenmae);
                        } else {
                            var link = document.createElement("a");
                            if (link.download !== undefined) { // feature detection
                                // Browsers that support HTML5 download attribute
                                var url = URL.createObjectURL(blob);
                                link.setAttribute("href", url);
                                link.setAttribute("download", exportedFilenmae);
                                link.style.visibility = 'hidden';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }
                        }
                    } else {
                        $('#errortext').text("Incorrect master password");
                    }

                } else {//error
                    console.log(exportpwds);
                    $('#errortext').text(exportpwds);
                }

                
                
            });

        } else {
            sendtoLogin();
            return;
        }
    }
};

$(document).ready(function() { 
    start();
});