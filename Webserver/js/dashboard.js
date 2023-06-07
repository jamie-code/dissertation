



async function start(){
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
            //Request passwords from api
            let vaultfetch = await pfetch("https://api.jamiez.co.uk/pwdmanager/vault", JSON.stringify({
                    sessionid: sessionid
            }));
            if(isJsonString(vaultfetch)){//if the vault is ok proceed to load the rest of the functionality
                
                let vault = JSON.parse(vaultfetch);
                let iprivatekey = await importprivatekey(vault.sessionkey, sessionid, email, vault.privatekey, encryptedvaulthashkey);
                let publickey = window.atob(vault.publickey);//publickey is send as base64 to avoid json breaking
                loadVault(vault, iprivatekey);
                drawContextMenu(sessionid, iprivatekey);
                deleteDataOnModalHide();

                
                document.getElementById("add-password").addEventListener('click', async function() {
                    var input = $('.add-password');
                    let url=$(input[0]).val().trim();
                    let name=$(input[1]).val().trim();
                    let username=$(input[2]).val().trim();
                    let password=$(input[3]).val().trim();
                    if(name!=""){
                        let add_password_json = JSON.stringify({
                            url: url,
                            name: name,
                            username: username,
                            password: password
                        });
                        
                        let encryptedBase64 = await encrypt(publickey, add_password_json);

                        let addpwd = await pfetch("https://api.jamiez.co.uk/pwdmanager/add", JSON.stringify({
                            sessionid: sessionid,
                            password: encryptedBase64
                        }));
                        if(addpwd=="Added"){
                            $('#myModal').modal('hide');
                            $('input#url').val('');
                            $('input#name').val('');
                            $('input#username').val('');
                            $('input#password').val('');
                            window.location.reload();
                        } else {
                            console.log(addpwd);
                            alert(addpwd);//an error
                        }
                    } else {
                        alert("Name cannot be empty");
                        console.log("Name cannot be empty");
                    }
                });

                document.getElementById("edit-password").addEventListener('click', async function() {
                    var input = $('.add-password');
                    let url=$(input[0]).val().trim();
                    let name=$(input[1]).val().trim();
                    let username=$(input[2]).val().trim();
                    let password=$(input[3]).val().trim();
                    let passwordid=$(input[4]).val().trim();
                    if(name!=""&&passwordid!=""){
                        let add_password_json = JSON.stringify({
                            url: url,
                            name: name,
                            username: username,
                            password: password
                        });
                        //must update other users (if any)
                        let shareddata = await encryptshared(sessionid, passwordid, add_password_json);
                        if(shareddata==false){//Probably a permission failure
                            return;
                        }
                        let personaldata = await encrypt(publickey, add_password_json);
                        let editdata = {"passwordid":passwordid, "passwords":{"shared":shareddata.editdata, "personal":{"password":personaldata}}};
                        let editpwd = await pfetch("https://api.jamiez.co.uk/pwdmanager/edit", JSON.stringify({
                            sessionid: sessionid,
                            passwordid: passwordid,
                            password: btoa(JSON.stringify(editdata))
                        }));
                        if(editpwd=="Edited"){
                            $('#myModal').modal('hide');
                            $('input#url').val('');
                            $('input#name').val('');
                            $('input#username').val('');
                            $('input#password').val('');
                            window.location.reload();
                        } else {
                            console.log(editpwd);
                            alert(editpwd);//an error
                        }
                    } else {
                        alert("Name cannot be empty");
                        console.log("Name cannot be empty");
                    }
                });

                document.getElementById("sharepassword").addEventListener('click', async function() {
                    var input = $('.share');
                    let sharewith=$(input[0]).val().trim();
                    let passwordid=$(input[1]).val().trim();
                    let editpermission = 0;
                    if($('#editpermission').is(":checked")){
                        editpermission = "1";
                    } else {
                        editpermission = "0";
                    }
                    var table = $("#passwords").DataTable();
                    var rowid = $('#passwords').dataTable().fnFindCellRowIndexes(passwordid, 0);
                    var row = table.row(rowid, 0);//column 0 is the ID column
                    var rowdata=row.data();
                    
                    let share_password_json = JSON.stringify({
                        url: rowdata.url,
                        name: rowdata.name,
                        username: rowdata.username,
                        password: rowdata.password
                    });
                    //request email publickey
                    let sharepublic = await pfetch("https://api.jamiez.co.uk/pwdmanager/sharing/publickey", JSON.stringify({
                        sessionid: sessionid,
                        email: sharewith
                    }));
                    
                    if(isJsonString(sharepublic)) {//check its valid
                        let sharewithpublickey = window.atob(JSON.parse(sharepublic).publickey);//Convert from base64 back to text
                        let encryptedBase64 = await encrypt(sharewithpublickey, share_password_json);
                        
                        
                        let addshared = await pfetch("https://api.jamiez.co.uk/pwdmanager/sharing/add", JSON.stringify({
                            sessionid: sessionid,
                            email: sharewith,
                            passwordid: rowdata.id,
                            edit: editpermission,
                            password: encryptedBase64
                        }));
                        if(addshared=="Added"){
                            //$('#sharingModal').modal('hide');
                            $('#errortext').text("");
                            //window.location.reload();
                            //Reload the sharing table to get the new id/record
                            let sharinginfo = await pfetch("https://api.jamiez.co.uk/pwdmanager/sharing/info", JSON.stringify({
                                passwordid: rowdata.id,
                                sessionid: sessionid
                            }));

                            let countbeforeupdate = $("#sharingtbl").DataTable().rows().count();
                            if(isJsonString(sharinginfo)){
                                if ( $.fn.dataTable.isDataTable( '#sharingtbl' ) ) {
                                    $('#sharingtbl').DataTable().destroy();
                                }
                                $('#sharingtbl').DataTable({
                                    data: JSON.parse(sharinginfo).sharedbyme,
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
                            } else {
                                $('#errortext').text(sharinginfo);
                                return;
                            }

                            //reload main table to show shared symbol
                            if(countbeforeupdate==0){
                                let vaultfetch2 = await pfetch("https://api.jamiez.co.uk/pwdmanager/vault", JSON.stringify({
                                    email: email,
                                    sessionid: sessionid
                                }));
                                if(isJsonString(vaultfetch2)){
                                    $('#passwords').DataTable().destroy();
                                    loadVault(JSON.parse(vaultfetch2), iprivatekey);
                                } else {
                                    $('#errortext').text(vaultfetch2);
                                    return;
                                }
                            }
                            

                        } else {
                            $('#errortext').text(addshared);
                            return;
                        }
                    } else {
                        $('#errortext').text(sharepublic);
                        return;
                    }
                });
            } else {
                console.log(vaultfetch);
                alert(vaultfetch);
            }
        } else {
            sendtoLogin();
            return;
        }
    }
};
$(document).ready(function() { 
    start();
});