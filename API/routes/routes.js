module.exports = app => {
    const Webauthn = require("../controllers/webauthn.controller.js");
    const Passwordmanager = require("../controllers/passwordmanager.controller.js");
  
 

    //Yubikey webauthn old

    /*app.post("/pwdmanager/webauthn/request-register", Webauthn.requestRegister);
    app.post("/pwdmanager/webauthn/register", Webauthn.register);
    app.post("/pwdmanager/webauthn/request-keys", Webauthn.requestKeys);
    app.post("/pwdmanager/webauthn/login", Webauthn.requestLogin);
    app.post("/pwdmanager/webauthn/login-challenge", Webauthn.login);*/

    //Password manager

    app.post("/pwdmanager/register", Passwordmanager.register);
    app.post("/pwdmanager/login", Passwordmanager.login);
    app.post("/pwdmanager/add", Passwordmanager.add);
    app.post("/pwdmanager/edit", Passwordmanager.edit);
    app.post("/pwdmanager/delete", Passwordmanager.delete);
    app.post("/pwdmanager/vault", Passwordmanager.vault);
    app.post("/pwdmanager/export", Passwordmanager.export);
    
    app.post("/pwdmanager/sharing/keys", Passwordmanager.sharingkeys);
    app.post("/pwdmanager/sharing/vault", Passwordmanager.sharing);
    app.post("/pwdmanager/sharing/info", Passwordmanager.sharinginfo);
    app.post("/pwdmanager/sharing/publickey", Passwordmanager.publickey);
    app.post("/pwdmanager/sharing/add", Passwordmanager.sharingadd);
    app.post("/pwdmanager/sharing/revoke", Passwordmanager.sharingrevoke);
    app.post("/pwdmanager/sharing/edit/enable", Passwordmanager.sharingeditenable);
    app.post("/pwdmanager/sharing/edit/disable", Passwordmanager.sharingeditdisable);

    app.post("/pwdmanager/registerkey", Passwordmanager.registerkey);
    app.post("/pwdmanager/registerkey/callback", Passwordmanager.registerkeycallback);
    app.post("/pwdmanager/loginkey", Passwordmanager.loginkey);
    app.post("/pwdmanager/loginkey/callback", Passwordmanager.loginkeycallback);
    app.post("/pwdmanager/request-keys", Passwordmanager.requestKeys);
    app.post("/pwdmanager/deletekey", Passwordmanager.deletekey);
    app.post("/pwdmanager/logout", Passwordmanager.logout);




    app.get('*', function(req, res){
        res.status(404).send('Invalid path');
      });//!Put No Routes Below
  };