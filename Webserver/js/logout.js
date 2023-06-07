function logout(){
    let sessionid = getCookieValue("pwdmgr-sessionid");
    if(sessionid!=null){
        fetch("https://api.jamiez.co.uk/pwdmanager/logout", {
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
                if(res.data=="Success"){
                    localStorage.removeItem('pwdmgr-email');
                    localStorage.removeItem('pwdmgr-vaulthashkey');
                    document.cookie = "cookiename=pwdmgr-sessionid; expires=Thu, 01 Jan 1970 00:00:00 GMT"//delete by setting date to past
                    window.location.href = 'https://jamiez.co.uk/test/login.php';
                    return;
                } else {
                    console.log(res.data);//some error
                }
            }));
    }
}