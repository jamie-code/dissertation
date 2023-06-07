function openPage(pageName, elmnt) { //From https://www.w3schools.com/howto/howto_js_full_page_tabs.asp
    // Hide all elements with class="tabcontent" by default */
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
  
    // Remove the background color of all tablinks/buttons
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].style.backgroundColor = "";
    }
  
    // Show the specific tab content
    document.getElementById(pageName).style.display = "block";
    elmnt.style.backgroundColor = "#34c72a";//set active tab button to green
}
  
// Get the element with id="defaultOpen" and click on it
document.getElementById("defaultOpen").click();//open shared by me tab



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
            //Request passwords from api
            let sharingvault = await pfetch("https://api.jamiez.co.uk/pwdmanager/sharing/vault", JSON.stringify({
                sessionid: sessionid
            }));
            if(isJsonString(sharingvault)){
                    
                let vault = JSON.parse(sharingvault);

                //decrypt vaulthashkey
                let iprivatekey = await importprivatekey(vault.sessionkey, sessionid, email, vault.privatekey, encryptedvaulthashkey);
                let publickey = window.atob(vault.publickey);
                
                //for loop for passwords to decrypt
                let inittabledata = JSON.parse('{"sharedbyme": []}');
                
                let tabledata = await decryptArray(iprivatekey, vault.sharedbyme, inittabledata, 1);
                
                $('#sharedbymetbl').DataTable({//Insert into table
                    data: tabledata.sharedbyme,
                    columns: [
                        { "title": "id", "data": "id"},//, data: 'id' },
                        { "title": "Name", "data": "name"},// data: 'name' }
                        { "title": "Username", "data": "username" },
                        { "title": "Shared With", "data": "sharedwith" },
                        { "title": "Password", "data": "password" }
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
                    ],
                    order: [[1, 'asc']],
                    language: {
                        "emptyTable": "There are currently no stored passwords on your account.",
                    }
                });
                let inittabledata2 = JSON.parse('{"sharedwithme": []}');
                let tabledata2 = await decryptArray(iprivatekey, vault.sharedwithme, inittabledata2, 2);
                
                $('#sharedwithmetbl').DataTable({//Insert into table
                    data: tabledata2.sharedwithme,
                    columns: [
                        { "title": "id", "data": "id"},//, data: 'id' },
                        { "title": "passwordid", "data": "passwordid"},
                        { "title": "Name", "data": "name"},// data: 'name' }
                        { "title": "Username", "data": "username" },
                        { "title": "Shared By", "data": "sharedby" },
                        { "title": "Password", "data": "password" }
                        
                    ],
                    columnDefs: [
                        {
                            target: 0,
                            visible: false,
                            searchable: false,
                        },
                        {
                            target: 1,
                            visible: false,
                            searchable: false,
                        },
                        {
                            target: 5,
                            visible: false,
                            searchable: false,
                        },
                    ],
                    order: [[1, 'desc']],
                    language: {
                        "emptyTable": "There are currently no stored passwords on your account.",
                    }
                });
                drawContextMenu(sessionid, 0);
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
                            window.location.href = 'https://jamiez.co.uk/test/dashboard.php';
                        } else {
                            console.log(addpwd);
                            alert(addpwd);//an error
                        }
                    } else {
                        console.log("Name cannot be empty");
                        alert("Name cannot be empty");
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
                        console.log("Name cannot be empty");
                        alert("Name cannot be empty");
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
                    var table = $("#sharedbymetbl").DataTable();
                    var rowid = $('#sharedbymetbl').dataTable().fnFindCellRowIndexes(passwordid, 0);
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
                console.log(sharingvault);
                alert(sharingvault);
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