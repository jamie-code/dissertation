const characters = [ // object of letters, numbers & symbols
    "abcdefghijklmnopqrstuvwxyz",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "0123456789",
    "!$~@#%^&*()-_=+[]{}/;:,.<>?"    
]

let range = $('.range input[type=range]');
let number = $('.pwd-length input[type=number]');
let button = $('#generate');
let icon = $('.fa-copy');
let checkboxinput = $('.form-check-input');
let passwordoutput = $('#password-output');
let addpasswordbutton = $('#addpassword');
let passwordfield = $('#password');

range.on('input propertychange', function(event) {
	number.val(event.target.value);
	generatepwd();
});
number.on('input propertychange', function(event) {
	range.val(event.target.value);
	generatepwd();
});

checkboxinput.change(function(event) {
	generatepwd();
});

icon.click(function(){
    navigator.clipboard.writeText(passwordoutput.val());
    icon.removeClass( 'fa-copy');
    icon.addClass( 'fa-check');
    icon.css('color', 'green');
    
    setTimeout(function(){ 
        icon.removeClass( 'fa-check');
        icon.addClass( 'fa-copy');
        icon.css('color', '#212529');
    }, 1000);
});
function generatepwd(){
    let rndpassword="";
    let usingcharacters="";

    checkboxinput.each(function(i){//loop through every checkbox
        if($(this).is(':checked')){//if checked
            usingcharacters += characters[i];//Add the character set (the checkboxs are in order so the index i will match the array index on characters)
        }
    })
    if(!usingcharacters.length){
        alert("At least one checkbox must be ticked.");
        return;
    }
    for (let i=0;i < number.val();i++) {//loop for as long as the password length is
        //Get a random integer From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
        let randomchar = usingcharacters[Math.floor(Math.random() * usingcharacters.length)];//pick a random character
        rndpassword += randomchar;//add the character
    }
    passwordoutput.val(rndpassword);
}
button.click(generatepwd);

addpasswordbutton.click(function(){
    passwordfield.val(passwordoutput.val());
    $('#myModal').modal('show');
})


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
            
            document.getElementById("add-password").addEventListener("click", async function(){
                //Get public key
                let publickey = await pfetch("https://api.jamiez.co.uk/pwdmanager/sharing/publickey", JSON.stringify({
                    sessionid: sessionid,
                    email: email
                }))
                //Encrypt
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
                        if(isJsonString(publickey)){
                            publickey=JSON.parse(publickey);
                        
                            let encryptedBase64 = await encrypt(window.atob(publickey.publickey), add_password_json);
                            let addpwd = await pfetch("https://api.jamiez.co.uk/pwdmanager/add", JSON.stringify({
                                sessionid: sessionid,
                                password: encryptedBase64
                            }));
                            if(addpwd=="Added"){
                                window.location.href = 'https://jamiez.co.uk/test/dashboard.php';
                            } else {
                                console.log(addpwd);
                                alert(addpwd);//an error
                            }
                        } else {
                            alert(publickey);
                            console.log(publickey);
                        }
                    } else {
                        console.log("Name cannot be empty");
                        alert("Name cannot be empty");
                    }
            });
        } else {
            sendtoLogin();
            return;
        }
    }
}
$( document ).ready(function(){
    start();
    generatepwd();
});//Call it on page load
