const Player = require("../models/player.model.js");
const Passwordmanager = require("../models/passwordmanager.model.js");



exports.register = (req, res) => {
    // Validate request
    if(req.body.email && req.body.argon2hash && req.body.publickey && req.body.privatekey){
        Passwordmanager.register(req.body.email, req.body.argon2hash, req.body.publickey, req.body.privatekey, (err, data) => {
            if (err)
            res.status(500).send({
                message:
                err.message || "Some error occurred."
            });
            else res.send(data);
        });
    } else {
        res.send("Invalid parameters");
    }
    
};

exports.login = (req, res) => {
    // Validate request
    if(req.body.email && req.body.argon2hash){
        Passwordmanager.login(req.body.email, req.body.argon2hash, (err, data) => {
            if (err)
            res.status(500).send({
                message:
                err.message || "Some error occurred."
            });
            else res.send(data);
        });
    } else {
        res.send("Invalid parameters");
    }
};

exports.add = (req, res) => {
    // Validate request
    if(req.body.sessionid && req.body.password){
        if(req.body.password!=""){
            Passwordmanager.add(req.body.sessionid, req.body.password, (err, data) => {
                if (err)
                res.status(500).send({
                    message:
                    err.message || "Some error occurred."
                });
                else res.send(data);
            });
        } else {
            res.send("Invalid parameters");
        }
    } else {
        res.send("Invalid parameters");
    }
};

exports.edit = (req, res) => {
    // Validate request
    if(req.body.sessionid && req.body.password && req.body.passwordid){
        if(req.body.password!=""&&req.body.passwordid!=""){
            Passwordmanager.edit(req.body.sessionid, req.body.password, req.body.passwordid, (err, data) => {
                if (err)
                res.status(500).send({
                    message:
                    err.message || "Some error occurred."
                });
                else res.send(data);
            });
        } else {
            res.send("Invalid parameters");
        }
    } else {
        res.send("Invalid parameters");
    }
};

exports.delete = (req, res) => {
    // Validate request
    if(req.body.sessionid && req.body.passwordid){
        if(req.body.passwordid!=""){
            Passwordmanager.delete(req.body.sessionid, req.body.passwordid, (err, data) => {
                if (err)
                res.status(500).send({
                    message:
                    err.message || "Some error occurred."
                });
                else res.send(data);
            });
        } else {
            res.send("Invalid parameters");
        }
    } else {
        res.send("Invalid parameters");
    }
};

exports.vault = (req, res) => {
    // Validate request
    if(req.body.sessionid){
        Passwordmanager.vault(req.body.sessionid, 0, (err, data) => {
            if (err)
            res.status(500).send({
                message:
                err.message || "Some error occurred."
            });
            else res.send(data);
        });
    } else {
        res.send("Invalid parameters");
    }
};

exports.export = (req, res) => {
    // Validate request
    if(req.body.sessionid&&req.body.type){
        if(Number.isInteger(req.body.type)){
            if(req.body.type>0&&req.body.type<=3){
                Passwordmanager.vault(req.body.sessionid, req.body.type, (err, data) => {
                    if (err)
                    res.status(500).send({
                        message:
                        err.message || "Some error occurred."
                    });
                    else res.send(data);
                });
            } else {
                res.send("Please select a type.");
            }
        } else {
        res.send("Invalid parameters");
        }
    } else {
        res.send("Invalid parameters");
    }
};

exports.sharingkeys = (req, res) => {
    // Validate request
    if(req.body.sessionid&&req.body.passwordid){
        if(req.body.passwordid!=""){
            Passwordmanager.sharingkeys(req.body.sessionid, req.body.passwordid, (err, data) => {
                if (err)
                res.status(500).send({
                    message:
                    err.message || "Some error occurred."
                });
                else res.send(data);
            });
        } else {
            res.send("Invalid parameters");
        }
    } else {
        res.send("Invalid parameters");
    }
};

exports.sharing = (req, res) => {
    // Validate request
    if(req.body.sessionid){
        Passwordmanager.sharing(req.body.sessionid, (err, data) => {
            if (err)
            res.status(500).send({
                message:
                err.message || "Some error occurred."
            });
            else res.send(data);
        });
    } else {
        res.send("Invalid parameters");
    }
};

exports.sharinginfo = (req, res) => {
    // Validate request
    if(req.body.sessionid&&req.body.passwordid){
        if(req.body.passwordid!=""){
            Passwordmanager.sharinginfo(req.body.sessionid, req.body.passwordid, (err, data) => {
                if (err)
                res.status(500).send({
                    message:
                    err.message || "Some error occurred."
                });
                else res.send(data);
            });
        } else {
        res.send("Invalid parameters");
        }
    } else {
        res.send("Invalid parameters");
    }
};

exports.publickey = (req, res) => {
    // Validate request
    if(req.body.sessionid&&req.body.email){
        if(req.body.email!=""){
            Passwordmanager.publickey(req.body.sessionid, req.body.email, (err, data) => {
                if (err)
                res.status(500).send({
                    message:
                    err.message || "Some error occurred."
                });
                else res.send(data);
            });
        } else {
        res.send("Invalid parameters");
        }
    } else {
        res.send("Invalid parameters");
    }
};

exports.sharingadd = (req, res) => {
    // Validate request
    if(req.body.sessionid&&req.body.email&&req.body.password&&req.body.edit&&req.body.passwordid){
        if(req.body.email!=""&&req.body.password!=""&&req.body.edit!=""&&req.body.passwordid!=""){
            Passwordmanager.sharingadd(req.body.sessionid, req.body.email, req.body.password, req.body.passwordid, req.body.edit, (err, data) => {
                if (err)
                res.status(500).send({
                    message:
                    err.message || "Some error occurred."
                });
                else res.send(data);
            });
        } else {
        res.send("Invalid parameters");
        }
    } else {
        res.send("Invalid parameters");
    }
};

exports.sharingrevoke = (req, res) => {
    // Validate request
    if(req.body.sessionid&&req.body.revokeid){
        if(req.body.revokeid!=""){
            Passwordmanager.sharingrevoke(req.body.sessionid, req.body.revokeid, (err, data) => {
                if (err)
                res.status(500).send({
                    message:
                    err.message || "Some error occurred."
                });
                else res.send(data);
            });
        } else {
        res.send("Invalid parameters");
        }
    } else {
        res.send("Invalid parameters");
    }
};

exports.sharingeditenable = (req, res) => {
    // Validate request
    if(req.body.sessionid&&req.body.passwordid){
        if(req.body.passwordid!=""){
            Passwordmanager.sharingedit(req.body.sessionid, req.body.passwordid, 1, (err, data) => {
                if (err)
                res.status(500).send({
                    message:
                    err.message || "Some error occurred."
                });
                else res.send(data);
            });
        } else {
        res.send("Invalid parameters");
        }
    } else {
        res.send("Invalid parameters");
    }
};

exports.sharingeditdisable = (req, res) => {
    // Validate request
    if(req.body.sessionid&&req.body.passwordid){
        if(req.body.passwordid!=""){
            Passwordmanager.sharingedit(req.body.sessionid, req.body.passwordid, 0, (err, data) => {
                if (err)
                res.status(500).send({
                    message:
                    err.message || "Some error occurred."
                });
                else res.send(data);
            });
        } else {
        res.send("Invalid parameters");
        }
    } else {
        res.send("Invalid parameters");
    }
};

exports.registerkey = (req, res) => {
    // Validate request
    if(req.body.sessionid && req.body.keyname){
        Passwordmanager.registerkey(req.body.sessionid, req.body.keyname, (err, data) => {
            if (err)
            res.status(500).send({
                message:
                err.message || "Some error occurred."
            });
            else res.send(data);
        });
    } else {
        res.send("Invalid parameters");
    }
};

exports.registerkeycallback = (req, res) => {
    // Validate request
    if(req.body.sessionid, req.body.keyname, req.body.PublicKeyCredential){
        Passwordmanager.registerkeycallback(req.body.sessionid, req.body.keyname, req.body.PublicKeyCredential, (err, data) => {
            if (err)
            res.status(500).send({
                message:
                err.message || "Some error occurred."
            });
            else res.send(data);
        });
    } else {
        res.send("Invalid parameters");
    }
};

exports.loginkey = (req, res) => {
    // Validate request
    if(req.body.sessionid){
        Passwordmanager.loginkey(req.body.sessionid, (err, data) => {
            if (err)
            res.status(500).send({
                message:
                err.message || "Some error occurred."
            });
            else res.send(data);
        });
    } else {
        res.send("Invalid parameters");
    }
};

exports.loginkeycallback = (req, res) => {
    // Validate request
    if(req.body.sessionid, req.body.PublicKeyCredential){
        Passwordmanager.loginkeycallback(req.body.sessionid, req.body.PublicKeyCredential, (err, data) => {
            if (err)
            res.status(500).send({
                message:
                err.message || "Some error occurred."
            });
            else res.send(data);
        });
    } else {
        res.send("Invalid parameters");
    }
};

exports.requestKeys = (req, res) => {
    // Validate request
    if(req.body.sessionid){
        Passwordmanager.requestKeys(req.body.sessionid, (err, data) => {
            if (err)
            res.status(500).send({
                message:
                err.message || "Some error occurred."
            });
            else res.send(data);
        });
    } else {
        res.send("Invalid parameters");
    }
};

exports.deletekey = (req, res) => {
    // Validate request
    if(req.body.sessionid && req.body.keyid){
        if(req.body.keyid!=""){
            Passwordmanager.deletekey(req.body.sessionid, req.body.keyid, (err, data) => {
                if (err)
                res.status(500).send({
                    message:
                    err.message || "Some error occurred."
                });
                else res.send(data);
            });
        } else {
            res.send("Invalid parameters");
        }
    } else {
        res.send("Invalid parameters");
    }
};

exports.logout = (req, res) => {
    // Validate request
    if(req.body.sessionid){
        Passwordmanager.logout(req.body.sessionid, (err, data) => {
            if (err)
            res.status(500).send({
                message:
                err.message || "Some error occurred."
            });
            else res.send(data);
        });
    } else {
        res.send("Invalid parameters");
    }
};

/*exports.login = (req, res) => {
    // Validate request
    Passwordmanager.login(req, (err, data) => {
        if (err)
        res.status(500).send({
            message:
            err.message || "Some error occurred."
        });
        else res.send(data);
    });
};*/