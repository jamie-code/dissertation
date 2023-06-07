const sql = require("./webauthn_db.js");
const argon2 = require('argon2-browser');
const rp = require('../functions/relyingParty');
const utils = require('../functions/utils'); /* FROM https://github.com/milesstoetzner/WebAuthn-Node.js-Demo/blob/master/routes/utils.js */
const Passwordmanager = function(player) {
    this.name = "";
};

/* JS FROM https://gist.github.com/6174/6062387*/
const rnd = (() => {//Generate a random string for the salt
  const gen = (min, max) => max++ && [...Array(max-min)].map((s, i) => String.fromCharCode(min+i));

  const sets = {
      num: gen(48,57),
      alphaLower: gen(97,122),
      alphaUpper: gen(65,90),
      special: [...`~!@#$%^&*()_+-=[]\{}|;:'",./<>?`]
  };

  function* iter(len, set) {
      if (set.length < 1) set = Object.values(sets).flat(); 
      for (let i = 0; i < len; i++) yield set[Math.random() * set.length|0]
  }

  return Object.assign(((len, ...set) => [...iter(len, set.flat())].join('')), sets);
})();

function isJsonString(str) {// From https://stackoverflow.com/questions/3710204/how-to-check-if-a-string-is-a-valid-json-string
  try {
      JSON.parse(str);
  } catch (e) {
      return false;
  }
  return true;
}


Passwordmanager.register = (email, argon2hash, publickey, privatekey, result) => {
  let argon2generatedsalt=rnd(128);
    argon2.hash({//hash #2
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        hashLen: 128,
        time: 3,
        pass: argon2hash,
        salt: argon2generatedsalt
    }).then(serversidehash => {//hash #2
      console.log("reg hash "+serversidehash);
      sql.query("SELECT * FROM users WHERE email=?",
      [email],
      (err, res) => {
        if (err) {
          console.log("error: ", err);
          result(err, null);
          return;
        }
        if (res.length) {
          result(null, "Account with that email already exists!");
          return;
        } else {
          sql.query("INSERT INTO users (email, argon2hash, argon2salt, publickey, privatekey) VALUES(?,?,?,?,?)",
            [email, serversidehash.encoded, argon2generatedsalt, publickey, privatekey],
            (err, res) => {
              if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
              }
              result(null, 'Success');//should send sessionkey cookie
              return;
            });
        }
        
      });
    });

    

  
    
};

Passwordmanager.login = (email, hash, result) => {
    
  sql.query("SELECT id, argon2salt, argon2hash FROM users WHERE email=? LIMIT 1",//limit 1 wont matter because email is unique in db
    [email],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      }
      if (res.length) {
        argon2.hash({//hash #2
          type: argon2.argon2id,
          memoryCost: 2 ** 16,
          hashLen: 128,
          time: 3,
          pass: hash,
          salt: res[0]['argon2salt']
      }).then(serversidehash => {//hash #2
        if(serversidehash.encoded==res[0]['argon2hash']){//if hashes match password is correct
          //!CHECK FOR WEBAUTHN
          let userid = res[0]['id'];
          sql.query("SELECT COUNT(*) as records, id FROM Security_Keys WHERE uid=?",
            [userid],
            (err, res2) => {
              if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
              }
              let sessionid = Buffer.from(rnd(50)).toString('base64');
              let sessionkey = Buffer.from(rnd(100)).toString('base64');
              let creation=new Date();//current date and time of session creation
              let expires=new Date();//when the session expires
              let expiredays=30;//30 days until expired
              let verified=0;
              expires.setTime(expires.getTime() + (expiredays*24*60*60*1000));
              if (res2[0].records>0) {//if webauthn make a session but dont sent vault and ask for webauthn else send vault and session
                verified=0;
              } else {//send vault, keys and session
                verified=1;
              }
                sql.query("INSERT INTO Sessions (uid, sessionid, sessionkey, verified, creation, expires) VALUES (?, ?, ?, ?, ?, ?);SELECT COUNT(*) AS records, password FROM Personal_Passwords WHERE uid=?;",
                [userid, sessionid, sessionkey, verified, creation, expires, userid],
                (err, res3) => {
                  if (err) {
                    console.log("error: ", err);
                    result(err, null);
                    return;
                  }
                  console.log(res3);
                  if (res3[1][0].records>0) {//password exist
                    result(null, '{"sessionid": "'+sessionid+'","sessionkey": "'+sessionkey+'", "verified": "'+verified+'", "expires": "'+expires.toUTCString()+'"}');
                    return;
                  } else {//no passwords yet
                    result(null, '{"sessionid": "'+sessionid+'","sessionkey": "'+sessionkey+'", "verified": "'+verified+'", "expires": "'+expires.toUTCString()+'"}');
                    return;
                  }
                
                });
              
            });
        } else {
          result(null, "Invalid password");
          return;
        }

        
      })
        
      } else {
        result(null, "Email Not Registered");
      }
      
    }
  );
    
};

Passwordmanager.add = (sessionid, password, result) => {
  sql.query("SELECT COUNT(*) as records, uid FROM Sessions WHERE sessionid=?",
  [sessionid],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      }
      if (res[0].records>0) {
        let uid = res[0].uid;
        //Delete sessions that match the uid which are expired
        //Then check for the sessionid where the sessionid matches so all expired ones are removed
        sql.query("DELETE sd FROM Sessions sd JOIN users ud ON sd.uid = ud.id WHERE ud.id=? AND expires<NOW(); SELECT COUNT(s.id) AS records FROM users u JOIN Sessions s ON u.id = s.uid WHERE uid=? AND sessionid=? AND s.verified=1;",
        [uid, uid, sessionid],
        (err, res) => {
          if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
          }
          if (res[1][0].records>0) {//If records are returned user has a valid session
            sql.query("INSERT INTO Personal_Passwords (uid, password) VALUES (?,?)",
            [uid, password],
            (err, res2) => {
              if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
              } else {
                result(null, "Added");
                return;
              }
            });
          } else {
            result(null, "Invalid Session");
            return;
          }
        });
      } else {
        result(null, "Invalid Session");
        return;
      }
    });
    
};

function findbyID(id, array){/*from https://stackoverflow.com/questions/57946100/how-could-i-find-a-json-object-by-id-using-nodejs-js*/
  const key = Object.keys(array).find(row => array[row].id === id)
  return key;
}

Passwordmanager.edit = (sessionid, password, passwordid, result) => {
  sql.query("SELECT COUNT(*) as records, uid FROM Sessions WHERE sessionid=?",
  [sessionid],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      }
      if (res[0].records==1) {
        let uid = res[0].uid;
        //Delete sessions that match the uid which are expired
        //Then check for the sessionid where the sessionid matches so all expired ones are removed
        sql.query("DELETE sd FROM Sessions sd JOIN users ud ON sd.uid = ud.id WHERE ud.id=? AND expires<NOW(); SELECT COUNT(s.id) AS records FROM users u JOIN Sessions s ON u.id = s.uid WHERE uid=? AND sessionid=? AND s.verified=1;",
        [uid, uid, sessionid],
        (err, res) => {
          if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
          }
            if (res[1][0].records==1) {//If records are returned user has a valid session
            password=Buffer.from(password, 'base64').toString('ascii');
            console.log(password);

            if(isJsonString(password)){
              let pwds = JSON.parse(password);
              if(pwds.passwords.personal.password){
                  if(pwds.passwords.personal.password!=""){
                    //check if user has permission to edit
                    sql.query("SELECT COUNT(id) AS records FROM Personal_Passwords WHERE id=? AND uid=?; SELECT COUNT(id) AS records FROM Shared_Passwords WHERE passwordid=? AND uid=? AND edit=1; SELECT uid FROM Personal_Passwords WHERE id=? LIMIT 1;",
                      [passwordid, uid, passwordid, uid, passwordid],
                      (err, res2) => {
                        if (err) {
                          console.log("error: ", err);
                          result(err, null);
                          return;
                        }
                        if(res2[0][0].records==0 && res2[1][0].records==0){//If uid doesnt match the owner of the password AND the uid doesnt have access to edit as a shared user
                          result(null, "Permission denied");
                          return;
                        } else {
                          //Check if password is shared
                          sql.query("SELECT u.id AS id, sp.id AS shareid, sp.edit FROM Shared_Passwords sp JOIN users u ON sp.uid = u.id WHERE sp.passwordid=?",
                          [passwordid],
                          (err, res3) => {
                            if (err) {
                              console.log("error: ", err);
                              result(err, null);
                              return;
                            }
                            if(!Object.keys(res3).length){//check if res3 is empty(personal password)
                              //permission to edit checked above so just update
                              sql.query("UPDATE Personal_Passwords SET password=? WHERE uid=? AND id=?",
                                [pwds.passwords.personal.password, uid, passwordid],
                                (err, res2) => {
                                  if (err) {
                                    console.log("error: ", err);
                                    result(err, null);
                                    return;
                                  } else {
                                    result(null, "Edited");
                                    return;
                                  }
                              });
                              
                            } else {//Not empty (shared password)
                              //permission to edit checked above
                              //check all passwords expected exist
                              if(pwds.passwords.shared){//check ids match, pwds not null
                                if(res3.length!=pwds.passwords.shared.length){
                                  console.log(res3.length+" "+pwds.passwords.shared.length);
                                  result(null, "All shared users must be provided");
                                  return;
                                } else {
                                  if(res2[0][0].records!=1){//if user is NOT the password owner
                                    //Find the password owners copy
                                    //get ownerid and pull from shared table
                                    //remove from shared and swap with personal
                                    let owneruid = res2[2][0].uid;
                                    let owner = findbyID( owneruid,pwds.passwords.shared);
                                    if(owner!=null){//If the owner's copy exists swap the personal and their shared copy so personal will be the actual password owners copy instead of the shared user's
                                      let tmppersonal = pwds.passwords.personal.password;
                                      pwds.passwords.personal.password = pwds.passwords.shared[owner].password;
                                      pwds.passwords.shared[owner].password=tmppersonal;
                                      pwds.passwords.shared[owner].id=uid;
                                    } else {//The password owner's copy isnt in the array
                                      result(null, "All shared users must be provided");
                                      return;
                                    }
                                  }
                                  //now check every user expected by the server (res3) matches the users array
                                  for(let i=0; i<res3.length; i++){
                                    
                                    let row = findbyID(res3[i].id, pwds.passwords.shared);
                                    if(row!=null){//row should return the record if not its null
                                      if(pwds.passwords.shared[row].password!=null){
                                        pwds.passwords.shared[row].shareid=res3[i].shareid;
                                        pwds.passwords.shared[row].edit=res3[i].edit;
                                        //data looks good check next record
                                      } else {
                                        result(null, "All shared users must have a password");
                                        return;
                                      }
                                    } else {
                                      result(null, "All shared users must be provided");
                                      return;
                                    }
                                  }
                                  //update db
                                  sql.query("BEGIN; UPDATE Personal_Passwords SET password=? WHERE id=?; INSERT INTO Shared_Passwords (id, passwordid, uid, edit, password) VALUES ? ON DUPLICATE KEY UPDATE id=VALUES(id), password=VALUES(password); COMMIT;",//begin and commit treats it as a transaction such that if one query fails it wont submit any changes
                                  [pwds.passwords.personal.password, passwordid, pwds.passwords.shared.map(record => [record.shareid, passwordid, record.id, record.edit, record.password])],//as the id of the record exists its treated as an update
                                  (err, res4) => {//bulk insert through mapping from https://stackoverflow.com/questions/8899802/how-do-i-do-a-bulk-insert-in-mysql-using-node-js
                                    if (err) {
                                      console.log("error: ", err);
                                      result(err, null);
                                      return;
                                    } else {
                                      result(null, "Edited");
                                      return;
                                    }
                                  })
                                }
                              } else {
                                result(null, "Must return shared encrypted password(s)");
                                return;
                              }
                              
                            }
                          });

                        }
                      });
                    
                  } else {
                    result(null, "Must return personal encrypted password");
                    return;
                  }
              } else {
                result(null, "Must return personal encrypted password");
                return;
              }
            } else {
              result(null, "Invalid format");
              return;
            }

            /*sql.query("UPDATE Personal_Passwords SET password=? WHERE uid=? AND id=?",
            [password, uid, passwordid],
            (err, res2) => {
              if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
              } else {
                result(null, "Edited");
                return;
              }
            });*/
          } else {
            result(null, "Invalid Session");
            return;
          }
        });
      } else {
        result(null, "Invalid Session");
        return;
      }
    });
    
};

Passwordmanager.delete = (sessionid, passwordid, result) => {
  sql.query("SELECT COUNT(*) as records, uid FROM Sessions WHERE sessionid=?",
  [sessionid],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      }
      if (res[0].records>0) {
        let uid = res[0].uid;
        sql.query("DELETE sd FROM Sessions sd JOIN users ud ON sd.uid = ud.id WHERE ud.id=? AND expires<NOW(); SELECT COUNT(s.id) AS records, u.email FROM users u JOIN Sessions s ON u.id = s.uid WHERE u.id=? AND s.sessionid=? AND s.verified=1;",
        [uid, uid, sessionid],
        (err, res) => {
          if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
          }
          if (res[1][0].records>0) {//If records are returned user has a valid session
            sql.query("SELECT uid FROM Personal_Passwords WHERE id=? LIMIT 1;",
              [passwordid],
              (err, res2) => {
                if (err) {
                  console.log("error: ", err);
                  result(err, null);
                  return;
                }
                if(res2[0].uid!=uid){//User does not own the password
                  result(null, "Permission denied");
                  return;
                } else {
                  sql.query("SELECT u.id AS id, sp.id AS shareid, sp.edit FROM Shared_Passwords sp JOIN users u ON sp.uid = u.id WHERE sp.passwordid=?",
                  [passwordid],
                  (err, res3) => {
                    if (err) {
                      console.log("error: ", err);
                      result(err, null);
                      return;
                    }
                    if(!Object.keys(res3).length){//check if res3 is empty(personal password)
                      sql.query("DELETE FROM Personal_Passwords WHERE uid=? AND id=?;",
                      [uid, passwordid],
                      (err, res) => {
                        if (err) {
                          console.log("error: ", err);
                          result(err, null);
                          return;
                        }
                        result(null, "Success");
                        return;
                      });
                      
                    } else {//Not empty (shared password)
                      sql.query("BEGIN; DELETE FROM Personal_Passwords WHERE uid=? AND id=?; DELETE FROM Shared_Passwords WHERE passwordid=?; COMMIT;",
                      [uid, passwordid, passwordid],
                      (err, res) => {
                        if (err) {
                          console.log("error: ", err);
                          result(err, null);
                          return;
                        }
                        result(null, "Success");
                        return;
                      });
                    }
                  });
                }
              });
                        
            
            
          } else {
            result(null, "Invalid Session");
            return;
          }
        });
      } else {
        result(null, "Invalid Session");
        return;
      }
    });
};

Passwordmanager.vault = (sessionid, type, result) => {
  sql.query("SELECT COUNT(*) as records, uid FROM Sessions WHERE sessionid=?",
  [sessionid],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      }
      if (res[0].records>0) {
        let uid = res[0].uid;
        sql.query("DELETE sd FROM Sessions sd JOIN users ud ON sd.uid = ud.id WHERE ud.id=? AND expires<NOW(); SELECT COUNT(s.id) AS records, s.sessionkey, u.publickey, u.privatekey FROM users u JOIN Sessions s ON u.id = s.uid WHERE u.id=? AND s.sessionid=? AND s.verified=1;",
        [uid, uid, sessionid],
        (err, res) => {
          if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
          }
          if (res[1][0].records>0) {//If records are returned user has a valid session
            //Send vault and sessionkey to decrypt vaultkey
            let sessionkey=res[1][0].sessionkey;
            let publickey=res[1][0].publickey;
            let privatekey=res[1][0].privatekey;
            let query="";
            let args="";
            if(type==0){//normal vault call
              query="SELECT pp.id, 0 AS passwordid, pp.password, 1 AS edit, !isnull(sp.id) AS shared FROM Personal_Passwords pp LEFT JOIN Shared_Passwords sp ON pp.id = sp.passwordid WHERE pp.uid=? GROUP BY pp.id; SELECT id, passwordid, password, edit, 2 AS shared FROM Shared_Passwords WHERE uid=?;";
              args=[uid, uid];
            } else if(type==1){//export personal and shared
              query="SELECT pp.password, IFNULL(GROUP_CONCAT(u.email), '') AS sharedwith, '' AS sharedby FROM Personal_Passwords pp LEFT JOIN Shared_Passwords sp ON pp.id=sp.passwordid LEFT JOIN users u ON sp.uid=u.id WHERE pp.uid=? GROUP BY pp.id; SELECT sp.password, '' AS sharedwith, u.email AS sharedby FROM Shared_Passwords sp JOIN Personal_Passwords pp ON sp.passwordid = pp.id JOIN users u ON pp.uid = u.id WHERE sp.uid=?;";
              args=[uid, uid];
            } else if(type==2){//export personal only
              query="SELECT pp.password, IFNULL(GROUP_CONCAT(u.email), '') AS sharedwith FROM Personal_Passwords pp LEFT JOIN Shared_Passwords sp ON pp.id=sp.passwordid LEFT JOIN users u ON sp.uid=u.id WHERE pp.uid=? GROUP BY pp.id;";
              args=[uid];
            } else if(type==3){//export shared only
              query="SELECT sp.password, u.email AS sharedby FROM Shared_Passwords sp JOIN Personal_Passwords pp ON sp.passwordid = pp.id JOIN users u ON pp.uid = u.id WHERE sp.uid=?;"
              args=[uid];
            } else {
              result(null, "Invalid type");
              return;
            }
              //!isnull will return if the shared passwords record is null and flip it to get if it is a shared password
              sql.query(query,
              args,
              (err, res2) => {
                if (err) {
                  console.log("error: ", err);
                  result(err, null);
                  return;
                }
                switch(type){
                  case 0:
                    result(null, '{"sessionkey": "'+sessionkey+'", "publickey": "'+Buffer.from(publickey).toString('base64')+'", "privatekey": "'+privatekey+'","passwords":'+JSON.stringify(res2[0].concat(res2[1]))+'}');
                    break;
                  case 1:
                    result(null, '{"sessionkey": "'+sessionkey+'", "privatekey": "'+privatekey+'","passwords":'+JSON.stringify(res2[0].concat(res2[1]))+'}');
                    break;
                  case 2:
                  case 3:
                    result(null, '{"sessionkey": "'+sessionkey+'", "privatekey": "'+privatekey+'","passwords":'+JSON.stringify(res2)+'}');
                    break;
                }
                  
                return;
              });
            
            
            
          } else {
            result(null, "Invalid Session");
            return;
          }
        });
      } else {
        result(null, "Invalid Session");
        return;
      }
    });
};

Passwordmanager.sharingkeys = (sessionid, passwordid, result) => {
  sql.query("SELECT COUNT(*) as records, uid FROM Sessions WHERE sessionid=?",
  [sessionid],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      }
      if (res[0].records==1) {
        let uid = res[0].uid;
        sql.query("DELETE sd FROM Sessions sd JOIN users ud ON sd.uid = ud.id WHERE ud.id=? AND expires<NOW(); SELECT COUNT(s.id) AS records FROM users u JOIN Sessions s ON u.id = s.uid WHERE u.id=? AND s.sessionid=? AND s.verified=1;",
        [uid, uid, sessionid],
        (err, res) => {
          if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
          }
          if (res[1][0].records==1) {//If records are returned user has a valid session
            sql.query("SELECT COUNT(id) AS records FROM Personal_Passwords WHERE id=? AND uid=?; SELECT COUNT(id) AS records FROM Shared_Passwords WHERE passwordid=? AND uid=? AND edit=1;",
            [passwordid, uid, passwordid, uid],
            (err, res2) => {
              if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
              }
              if(res2[0][0].records==0 && res2[1][0].records==0){//If uid doesnt match the owner of the password AND the uid doesnt have access to edit as a shared user
                result(null, "Permission denied");
                return;
              } else {
                sql.query("SELECT u.id, TO_BASE64(u.publickey) AS publickey FROM Shared_Passwords sp JOIN users u ON sp.uid = u.id WHERE sp.passwordid=? AND uid!=?",
                [passwordid, uid],
                (err, res3) => {
                  if (err) {
                    console.log("error: ", err);
                    result(err, null);
                    return;
                  }

                  if(res2[0][0].records==0){//if not the password owner send the owner public key
                      sql.query("SELECT u.id, TO_BASE64(u.publickey) AS publickey FROM Personal_Passwords pp JOIN users u ON pp.uid = u.id WHERE pp.id=?",
                        [passwordid],
                        (err, res4) => {
                          if (err) {
                            console.log("error: ", err);
                            result(err, null);
                            return;
                          }
                          let personaldata={id:res4[0].id, publickey:res4[0].publickey};
                          res3.push(personaldata);
                          result(null, res3);//send shared keys and the owners key
                        });
                  } else {
                    result(null, res3);//send public keys to user, if it is not a shared password(no users) it will be an empty array
                    return;
                  }
                
                });
              }
              
            });

            
            
          } else {
            result(null, "Invalid Session");
            return;
          }
        });
      } else {
        result(null, "Invalid Session");
        return;
      }
    });
};

Passwordmanager.sharing = (sessionid, result) => {
  sql.query("SELECT COUNT(*) as records, uid FROM Sessions WHERE sessionid=?",
  [sessionid],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      }
      if (res[0].records>0) {
        let uid = res[0].uid;
        sql.query("DELETE sd FROM Sessions sd JOIN users ud ON sd.uid = ud.id WHERE ud.id=? AND expires<NOW(); SELECT COUNT(s.id) AS records, s.sessionkey, u.publickey, u.privatekey FROM users u JOIN Sessions s ON u.id = s.uid WHERE u.id=? AND s.sessionid=? AND s.verified=1;",
        [uid, uid, sessionid],
        (err, res) => {
          if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
          }
          if (res[1][0].records>0) {//If records are returned user has a valid session
            let sessionkey=res[1][0].sessionkey;
            let publickey=res[1][0].publickey;
            let privatekey=res[1][0].privatekey;
            sql.query("SELECT pp.id, pp.password, GROUP_CONCAT(sp.id) AS sharedids, GROUP_CONCAT(u.email) AS sharedwith, GROUP_CONCAT(sp.edit) AS edit FROM Personal_Passwords pp JOIN Shared_Passwords sp ON pp.id=sp.passwordid JOIN users u ON sp.uid=u.id WHERE pp.uid=? GROUP BY pp.id;SELECT sp.id, sp.passwordid, sp.password, sp.edit, u.email AS owner FROM Shared_Passwords sp JOIN Personal_Passwords pp ON sp.passwordid = pp.id JOIN users u ON pp.uid = u.id WHERE sp.uid=?",
            [uid, uid],
            (err, res2) => {
              if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
              }
              result(null, '{"sessionkey": "'+sessionkey+'", "publickey": "'+Buffer.from(publickey).toString('base64')+'", "privatekey": "'+privatekey+'","sharedbyme":'+JSON.stringify(res2[0])+', "sharedwithme":'+JSON.stringify(res2[1])+'}');
              return;
            });           
          } else {
            result(null, "Invalid Session");
            return;
          }
        });
      } else {
        result(null, "Invalid Session");
        return;
      }
    });
};

Passwordmanager.sharinginfo = (sessionid, passwordid, result) => {
  sql.query("SELECT COUNT(*) as records, uid FROM Sessions WHERE sessionid=?",
  [sessionid],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      }
      if (res[0].records>0) {
        let uid = res[0].uid;
        sql.query("DELETE sd FROM Sessions sd JOIN users ud ON sd.uid = ud.id WHERE ud.id=? AND expires<NOW(); SELECT COUNT(s.id) AS records, s.sessionkey, u.publickey, u.privatekey FROM users u JOIN Sessions s ON u.id = s.uid WHERE u.id=? AND s.sessionid=? AND s.verified=1;",
        [uid, uid, sessionid],
        (err, res) => {
          if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
          }
          if (res[1][0].records>0) {//If records are returned user has a valid session
            sql.query("SELECT sp.id AS sharedid, u.email AS sharedwith, sp.edit AS edit, CASE WHEN sp.edit=1 THEN 'Yes' ELSE 'No' END AS canedit FROM Personal_Passwords pp JOIN Shared_Passwords sp ON pp.id=sp.passwordid JOIN users u ON sp.uid=u.id WHERE pp.uid=? AND pp.id=?",
            [uid, passwordid],
            (err, res2) => {
              if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
              }
              result(null, '{"sharedbyme":'+JSON.stringify(res2)+'}');
              return;
            });
            
          } else {
            result(null, "Invalid Session");
            return;
          }
        });
      } else {
        result(null, "Invalid Session");
        return;
      }
    });
};

Passwordmanager.publickey = (sessionid, email, result) => {
  sql.query("SELECT COUNT(*) as records, uid FROM Sessions WHERE sessionid=?",
  [sessionid],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      }
      if (res[0].records==1) {
        let uid = res[0].uid;
        sql.query("DELETE sd FROM Sessions sd JOIN users ud ON sd.uid = ud.id WHERE ud.id=? AND expires<NOW(); SELECT COUNT(s.id) AS records FROM users u JOIN Sessions s ON u.id = s.uid WHERE u.id=? AND s.sessionid=? AND s.verified=1;",
        [uid, uid, sessionid],
        (err, res) => {
          if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
          }
          if (res[1][0].records==1) {//If records are returned user has a valid session
            sql.query("SELECT COUNT(id) AS records, publickey FROM users WHERE email=?",
            [email],
            (err, res2) => {
              if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
              }
              if(res2[0].records==1){//Email matches an account
                result(null, '{"publickey": "'+Buffer.from(res2[0].publickey).toString('base64')+'"}');                
                return;
              } else {
                result(null, "No user with that email found!");
                return;
              }
              
            });
            
          } else {
            result(null, "Invalid Session");
            return;
          }
        });
      } else {
        result(null, "Invalid Session");
        return;
      }
    });
};

Passwordmanager.sharingadd = (sessionid, email, password, passwordid, edit, result) => {
  sql.query("SELECT COUNT(*) as records, uid FROM Sessions WHERE sessionid=?",
  [sessionid],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      }
      if (res[0].records==1) {
        let uid = res[0].uid;
        sql.query("DELETE sd FROM Sessions sd JOIN users ud ON sd.uid = ud.id WHERE ud.id=? AND expires<NOW(); SELECT COUNT(s.id) AS records FROM users u JOIN Sessions s ON u.id = s.uid WHERE u.id=? AND s.sessionid=? AND s.verified=1;",
        [uid, uid, sessionid],
        (err, res) => {
          if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
          }
          if (res[1][0].records==1) {//If records are returned user has a valid session
            //Check user with email exists and password id exists
            sql.query("SELECT COUNT(id) AS records FROM Personal_Passwords WHERE uid=? AND id=?; SELECT COUNT(id) as records, id FROM users WHERE email=?;",
            [uid, passwordid, email],
            (err, res2) => {
              if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
              }
              if(res2[0][0].records==1){//Password id matches a password that is owned by the user
                if(res2[1][0].records==1){//A user exists with the email
                  //check user doesn't already have the password shared to them
                  let sharinguid = res2[1][0].id;
                  if(sharinguid==uid){//don't allow sharing to themselves
                    result(null, "You cannot share a password to yourself.");
                    return;
                  } else {
                    sql.query("SELECT COUNT(id) AS records FROM Shared_Passwords WHERE uid=? AND passwordid=?",
                    [sharinguid, passwordid],
                    (err, res3) => {
                      if (err) {
                        console.log("error: ", err);
                        result(err, null);
                        return;
                      }
                      if (res3[0].records==1) {//User already has access to the password
                        result(null, "User already has this password shared with them.");
                        return;
                      } else {
                        //insert into db
                        sql.query("INSERT INTO Shared_Passwords (passwordid, uid, edit, password) VALUES (?,?,?,?);",
                        [passwordid, sharinguid, edit, password],
                        (err, res3) => {
                          if (err) {
                            console.log("error: ", err);
                            result(err, null);
                            return;
                          }
                          result(null, "Added");
                          return;
                        })
                      }
                    })
                  }
                  
                } else {
                  result(null, "No user with that email found");
                  return;
                }
              } else {
                console.log(res2[0][0].records);
                result(null, "No password with that id could be found");
                return;
              }
            });            
          } else {
            result(null, "Invalid Session");
            return;
          }
        });
      } else {
        result(null, "Invalid Session");
        return;
      }
    });
};

Passwordmanager.sharingrevoke = (sessionid, revokeid, result) => {
  sql.query("SELECT COUNT(*) as records, uid FROM Sessions WHERE sessionid=?",
  [sessionid],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      }
      if (res[0].records==1) {
        let uid = res[0].uid;
        sql.query("DELETE sd FROM Sessions sd JOIN users ud ON sd.uid = ud.id WHERE ud.id=? AND expires<NOW(); SELECT COUNT(s.id) AS records FROM users u JOIN Sessions s ON u.id = s.uid WHERE u.id=? AND s.sessionid=? AND s.verified=1;",
        [uid, uid, sessionid],
        (err, res) => {
          if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
          }
          if (res[1][0].records==1) {//If records are returned user has a valid session
            //Check id is valid
            sql.query("SELECT COUNT(id) AS records, passwordid FROM Shared_Passwords WHERE id=?;",
            [revokeid],
            (err, res2) => {
              if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
              }
              if(res2[0].records==1){//Revoke id matches a shared password id
                
                //check user owns password
                let passwordid = res2[0].passwordid;
                sql.query("SELECT COUNT(id) AS records FROM Personal_Passwords WHERE uid=? AND id=?; SELECT COUNT(id) AS records FROM Shared_Passwords WHERE uid=? AND passwordid=?;",
                [uid, passwordid, uid, passwordid],
                (err, res3) => {
                  if (err) {
                    console.log("error: ", err);
                    result(err, null);
                    return;
                  }
                  if (res3[0][0].records==1||res3[1][0].records==1) {//User owns password or is the shared recipient
                    
                    sql.query("DELETE FROM Shared_Passwords WHERE id=?;",//Delete the shared copy
                    [revokeid],
                    (err, res3) => {
                      if (err) {
                        console.log("error: ", err);
                        result(err, null);
                        return;
                      }
                      result(null, "Revoked");
                      return;
                    })
                    
                  } else {
                    result(null, "Unauthorized");
                    return;
                  }
                })
              } else {
                console.log(res2[0].records);
                result(null, "No password with that id could be found");
                return;
              }
            });            
          } else {
            result(null, "Invalid Session");
            return;
          }
        });
      } else {
        result(null, "Invalid Session");
        return;
      }
    });
};

Passwordmanager.sharingedit = (sessionid, id, edit, result) => {
  sql.query("SELECT COUNT(*) as records, uid FROM Sessions WHERE sessionid=?",
  [sessionid],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      }
      if (res[0].records==1) {
        let uid = res[0].uid;
        sql.query("DELETE sd FROM Sessions sd JOIN users ud ON sd.uid = ud.id WHERE ud.id=? AND expires<NOW(); SELECT COUNT(s.id) AS records FROM users u JOIN Sessions s ON u.id = s.uid WHERE u.id=? AND s.sessionid=? AND s.verified=1;",
        [uid, uid, sessionid],
        (err, res) => {
          if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
          }
          if (res[1][0].records==1) {//If records are returned user has a valid session
            //Check password id is valid
            sql.query("SELECT COUNT(id) AS records, passwordid FROM Shared_Passwords WHERE id=?;",
            [id],
            (err, res2) => {
              if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
              }
              if(res2[0].records==1){//id matches a shared password id
                
                //check user owns password
                let passwordid = res2[0].passwordid;
                sql.query("SELECT COUNT(id) AS records FROM Personal_Passwords WHERE uid=? AND id=?",
                [uid, passwordid],
                (err, res3) => {
                  if (err) {
                    console.log("error: ", err);
                    result(err, null);
                    return;
                  }
                  if (res3[0].records==1) {//User owns password and can change edit access
                    
                    sql.query("UPDATE Shared_Passwords SET edit=? WHERE id=?;",
                    [edit, id],
                    (err, res3) => {
                      if (err) {
                        console.log("error: ", err);
                        result(err, null);
                        return;
                      }
                      result(null, "Updated");
                      return;
                    })
                    
                  } else {
                    result(null, "Unauthorized");
                    return;
                  }
                })
              } else {
                console.log(res2[0][0].records);
                result(null, "No password with that id could be found");
                return;
              }
            });            
          } else {
            result(null, "Invalid Session");
            return;
          }
        });
      } else {
        result(null, "Invalid Session");
        return;
      }
    });
};

Passwordmanager.registerkey = (sessionid, keyname, result) => {
  
  /* Based on https://github.com/milesstoetzner/WebAuthn-Node.js-Demo/blob/master/routes/register.js */
  sql.query("SELECT COUNT(*) as records, uid FROM Sessions WHERE sessionid=?",
  [sessionid],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      }
      if (res[0].records>0) {
        let uid = res[0].uid;
        sql.query("DELETE sd FROM Sessions sd JOIN users ud ON sd.uid = ud.id WHERE ud.id=? AND expires<NOW(); SELECT COUNT(s.id) AS records, u.email FROM users u JOIN Sessions s ON u.id = s.uid WHERE u.id=? AND s.sessionid=? AND s.verified=1;SELECT securitykey, name FROM Security_Keys WHERE uid=?;",//COUNT(*) as records,
        [uid, uid, sessionid, uid],
        (err, res) => {
          if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
          }
          if (res[1][0].records>0) {//If records are returned user has a valid session
            try {//to catch errors by the utils module
              let userHandle = utils.userHandle();
              //check if keys exist and add to exclusion array to stop re-registering the same key
              let excludeCredentials = [];
              //if(res[2][0].records>0){
              if(res[2].length>0){
                let toprecord = JSON.parse(res[2][0].securitykey);//the first record in the security keys table for the user
                userHandle = Buffer.from(toprecord.userHandle, 'base64');//If the user has keys use the same userhandle
                let securitykey = res[2];
                
                securitykey.forEach(key => {//For each key registered to the user push it to an exclusion list so the same key can't get registered
                  if(key.name==keyname){
                    result(null, "Key name already in use!");
                    return;
                  }
                  excludeCredentials.push({
                    type: "public-key",
                    id: Buffer.from(JSON.parse(key.securitykey).credentialId, 'base64'),
                    transports: ["usb", "nfc", "ble"]
                  });
                })
                
                
              }
              let email = res[1][0].email;
              
              let PublicKeyCredentialCreationOptions = {
                rp: rp,
                user: {
                    id: userHandle,
                    name: email,
                    displayName: email
                },
                challenge: utils.challenge(),
                pubKeyCredParams: [{
                    type: "public-key",
                    alg: -7
                },/* -7 for "ES256" as registered in the IANA COSE Algorithms registry */
                {
                  type: "public-key",
                  alg: -257 // Value registered by this specification for "RS256"
                }], 
                timeout: 60000,//time in milliseconds the user has to complete the challenge and send it back to the server (1min)
                excludeCredentials: excludeCredentials,
                authenticatorSelection: {
                    authenticatorAttachment: 'cross-platform',
                    requireResidentKey: false,
                    userVerification: 'preferred'
                },
                attestation: "none",
                extensions: {} /* no extensions */
              };
              //save PublicKeyCredentialCreationOptions to db
              sql.query("DELETE FROM Securitykey_Options WHERE uid=? AND register=1; INSERT INTO Securitykey_Options (uid, options, register) VALUES (?,?,1);",//Login and register are seperated by register 1 or 0
              [uid, uid, JSON.stringify(PublicKeyCredentialCreationOptions), uid],
              (err, res) => {
                if (err) {
                  console.log("error: ", err);
                  result(err, null);
                  return;
                }
                result(null, PublicKeyCredentialCreationOptions);
                return;
              })
            } catch(e){//catch errors by utils module
              console.log(e);
              result(null, e);
              return;
            }
            
          } else {
            result(null, "Invalid session");
            return;
          }
        });
      } else {
        result(null, "Invalid session");
        return;
      }
    }
  )
  
    
};


Passwordmanager.registerkeycallback = (sessionid, keyname, PublicKeyCredentials, result) => {
  /* Based on https://github.com/milesstoetzner/WebAuthn-Node.js-Demo/blob/master/routes/register.js */
  sql.query("SELECT COUNT(*) as records, uid FROM Sessions WHERE sessionid=?",
  [sessionid],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      }
      if (res[0].records>0) {
        let uid = res[0].uid;
        sql.query("DELETE sd FROM Sessions sd JOIN users ud ON sd.uid = ud.id WHERE ud.id=? AND expires<NOW(); SELECT COUNT(s.id) AS records, u.id, s.sessionkey, u.publickey, u.privatekey FROM users u JOIN Sessions s ON u.id = s.uid WHERE u.id=? AND s.sessionid=? AND s.verified=1; SELECT options FROM Securitykey_Options WHERE uid=? ORDER BY id DESC LIMIT 1;",
        [uid, uid, sessionid, uid],
        (err, res) => {
          if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
          }
          if (res[1][0].records>0) {//If records are returned user has a valid session
            try {//catch utils module errors
              //Retreive publickeycredentialoptions from db
              let PublicKeyCredentialCreationOptions = JSON.parse(res[2][0].options);
              let response = PublicKeyCredentials.response;
              let clientData = JSON.parse(utils.array2utf8(response.clientDataJSON));
              //let hash = utils.hash(Buffer.from(response.clientDataJSON));
              let attestationObject = response.attestationObject;
              let authData = utils.decodeAuthData(attestationObject.authData);
              let fmt = attestationObject.fmt;
              let attStmt = attestationObject.attStmt;

              if (!authData || !fmt || !attStmt) {
                result(null, "Invalid attestationObject");
                return;
              }

              // check expected values: type, challenge, origin and rpIdHash
              utils.equals(clientData.type, 'webauthn.create', 'Type');
              utils.equals(clientData.challenge, utils.array2base64url(PublicKeyCredentialCreationOptions.challenge), 'Challenge');
              utils.equals(clientData.origin, rp.origin, 'Origin');
              /* tokenBinding not supported */
              utils.equals(utils.array2hex(authData.rpIdHash), utils.hash(rp.id), 'RPID');

              // check userVerification respectively userPresence
              if (PublicKeyCredentialCreationOptions.authenticatorSelection.userVerification === 'required') {
                utils.matches(authData.flags, utils.FLAG_UV, 'FLAG_UV');
              } else {
                utils.matches(authData.flags, utils.FLAG_UP, 'FLAG_UP');
              }

              /* no extensions */

              // validate attestationStatement, which is in this implementation always 'none'
              console.log('fmt', fmt);
              switch (fmt) {
                  case 'none':
                      /* nothing to do */
                      console.log('valid attestation');
                      break;
                  default:
                      throw 'Unsupported Attestation Format';
              }

              // check if credentialId is already registered
              
              let credentialId = utils.array2base64url(authData.attestedCredentialData.credentialId);
              //CHECK IF USER HAS CREDENTIAL ID ALREADY REGISTERED AND ASSIGN TO USER
              sql.query("SELECT COUNT(*) AS records, securitykey FROM Security_Keys WHERE uid=?",
              [uid],
              (err, res) => {
                if (err) {
                  console.log("error: ", err);
                  result(err, null);
                  return;
                }
                let check=true;
                if (res[0].records>0) {
                  res.forEach(record => {
                    if(JSON.parse(record.securitykey).credentialId==credentialId){
                      check=false;
                    }
                  })
                }
                if(check==true){
                  //save new key
                  // create and save new user
                  user = PublicKeyCredentialCreationOptions.user;
                  let newKey = {
                    userHandle: utils.array2base64url(user.id),
                    name: user.name,
                    displayName: user.displayName,
                    credentialId: credentialId,
                    credentialPublicKey: authData.attestedCredentialData.credentialPublicKey,
                    signCount: utils.array2hex(authData.signCount)
                  };
                  console.log(JSON.stringify(newKey));
                  sql.query("INSERT INTO Security_Keys (uid, name, securitykey) VALUES (?,?,?); DELETE FROM Securitykey_Options WHERE uid=? AND register=1;",
                  [uid, keyname, JSON.stringify(newKey), uid],
                  (err, res) => {
                    if (err) {
                      console.log("error: ", err);
                      result(err, null);
                      return;
                    }
                    //key registered
                    result(null, "Success");
                    return;
                  })
                  
                } else {
                  result(null, "Key already registered");
                  return;
                }
              })
            } catch(e){
              console.log(e);
              result(null, e);
              return;
            }

            


          } else {
            result(null, "Invalid session");
            return;
          }
        })
      } else {
        result(null, "Invalid session");
        return;
      }
    })
    
};

Passwordmanager.loginkey = (sessionid, result) => {
  /* Based on https://github.com/milesstoetzner/WebAuthn-Node.js-Demo/blob/master/routes/authenticate.js */
  sql.query("SELECT COUNT(*) as records, uid FROM Sessions WHERE sessionid=?",
  [sessionid],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      }
      if (res[0].records>0) {
        let uid = res[0].uid;
        sql.query("DELETE sd FROM Sessions sd JOIN users ud ON sd.uid = ud.id WHERE ud.id=? AND expires<NOW(); SELECT COUNT(s.id) AS records, u.id, s.sessionkey, u.publickey, u.privatekey FROM users u JOIN Sessions s ON u.id = s.uid WHERE u.id=? AND s.sessionid=? AND s.verified=0; SELECT COUNT(*) AS records FROM Security_Keys WHERE uid=?; SELECT securitykey FROM Security_Keys WHERE uid=?;",
        [uid, uid, sessionid, uid, uid],
        (err, res) => {
          if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
          }
          console.log(res);

          if (res[1][0].records>0) {//If records are returned user has a key valid session
            if(res[2][0].records>0){//If a valid security key is returned
              try{ //catch utils module errors
                let allowCredentials = [];
                let securitykeys = res[3];
                
                securitykeys.forEach(key => {
                  allowCredentials.push({
                    type: "public-key",
                    id: Buffer.from(JSON.parse(key.securitykey).credentialId, 'base64'),
                    transports: ["usb", "nfc", "ble"]
                  });
                })
                

                // create and send options
                let PublicKeyCredentialRequestOptions = {
                  challenge: utils.challenge(),
                  timeout: 60000,
                  rpId: rp.id,
                  allowCredentials: allowCredentials,//Ends up like [{type: "public-key", id: Buffer.from(user.credentialId, 'base64'), transports: ["usb", "nfc", "ble"]}, key2, key3],
                  userVerification: "preferred",
                  extensions: {}
                };
                //Save PublicKeyCredentialRequestOptions to db
                //Clear out any old records although there shouldnt be if login was successful and insert the new
                sql.query("DELETE FROM Securitykey_Options WHERE uid=? AND register=0;INSERT INTO Securitykey_Options (uid, options, register) VALUES (?,?,0);",
                [uid, uid, JSON.stringify(PublicKeyCredentialRequestOptions)],
                (err, res) => {
                  if (err) {
                    console.log("error: ", err);
                    result(err, null);
                    return;
                  }
                  result(null, PublicKeyCredentialRequestOptions);
                  return;
                })
              } catch(e) {
                console.log(e);
                result(null, e);
                return;
              }
            } else {
              result(null, "No security key registered");//This error should NEVER happen
              return;
            }
          } else {
            result(null, "Invalid session");
            return;
          }
        })
      } else {
        result(null, "Invalid session");
        return;
      }
    })
  
  
    
};

Passwordmanager.loginkeycallback = (sessionid, PublicKeyCredentials, result) => {
  /* Based on https://github.com/milesstoetzner/WebAuthn-Node.js-Demo/blob/master/routes/authenticate.js */
  sql.query("SELECT COUNT(*) as records, uid FROM Sessions WHERE sessionid=?",
  [sessionid],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      }
      if (res[0].records>0) {
        let uid = res[0].uid;
        sql.query("DELETE sd FROM Sessions sd JOIN users ud ON sd.uid = ud.id WHERE ud.id=? AND expires<NOW(); SELECT COUNT(s.id) AS records, u.id, s.sessionkey, u.publickey, u.privatekey FROM users u JOIN Sessions s ON u.id = s.uid WHERE u.id=? AND s.sessionid=? AND s.verified=0; SELECT options FROM Securitykey_Options WHERE uid=? ORDER BY id DESC LIMIT 1; SELECT id, securitykey FROM Security_Keys WHERE uid=?;",
        [uid, uid, sessionid, uid, uid],
        (err, res) => {
          if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
          }
          if (res[1][0].records>0) {//If records are returned user has a valid session
            try{ //catch utils module errors
              let PublicKeyCredentialRequestOptions = JSON.parse(res[2][0].options);//From DB
              let response = PublicKeyCredentials.response;//From user
              let authenticatorData = utils.decodeAuthData(response.authenticatorData);
              let clientData = JSON.parse(utils.array2utf8(response.clientDataJSON));
              let hash = [... Buffer.from(utils.hash(Buffer.from(response.clientDataJSON)), 'hex')];
              let userHandle = utils.array2base64url(response.userHandle);

              // check if received credential is allowed
              if (PublicKeyCredentialRequestOptions.allowCredentials) {
                utils.allowed(PublicKeyCredentials.id, PublicKeyCredentialRequestOptions.allowCredentials);//compare user id against the allowed
              } else {
                //allow credentials are missing
                result(null, "Allow credentials missing");
                return;
              }

              /*User handle is only optionally provided. By using userVerification: 'preferred' in registration it allows other authenticators that don't use it.
              Changing to required would prevent this issue but disallow other types of authenticators*/
              if(userHandle){
                let toprecord = JSON.parse(res[3][0].securitykey);//the first record in the security keys table for the user
                let serveruserHandle = Buffer.from(toprecord.userHandle, 'base64');//If the user has keys use the same userhandle
                utils.equals(serveruserHandle, userHandle, 'User Handle');//Check the client sent the correct userhandle
              }

              utils.equals(clientData.type, 'webauthn.get', 'Type');//Check it is a get token not a register from the client
              utils.equals(clientData.challenge, utils.array2base64url(PublicKeyCredentialRequestOptions.challenge), 'Challenge');//check the challenge matches
              utils.equals(clientData.origin, rp.origin, 'Origin');//ensure its from the same domain
              utils.equals(utils.array2hex(authenticatorData.rpIdHash), utils.hash(rp.id), 'RPID');

              // check userVerification respectively userPresence
              if (PublicKeyCredentialRequestOptions.userVerification === 'required') {
                  utils.matches(authenticatorData.flags, utils.FLAG_UV, 'FLAG_UV');
              } else {
                  utils.matches(authenticatorData.flags, utils.FLAG_UP, 'FLAG_UP');
              }

              //find which key is being used by the credentialid
              let securitykeys = res[3];
              let keyused = [];
              let keyid = "0";
              securitykeys.forEach(key => {
                let parsedkey = JSON.parse(key.securitykey);
                if(parsedkey.credentialId==PublicKeyCredentials.id){
                  keyused=parsedkey;
                  keyid=key.id;
                }
              })
              // verify assertionSignature
              utils.verify(keyused.credentialPublicKey, response.authenticatorData.concat(hash), response.signature);

              // check and update signCount
              let signCount = utils.array2hex(authenticatorData.signCount);
              if (signCount !== 0 || keyused.signCount !== 0) {//by implementing a signature count this will help prevent replay attacks
                  if (signCount <= keyused.signCount) {
                      throw 'Invalid Signature Counter';
                  }
              }
              keyused.signCount=signCount;
              //update signcount in db and allow session
              //Also delete the securitykey options
              sql.query("UPDATE Security_Keys SET securitykey=? WHERE uid=? AND id=?; UPDATE Sessions SET verified=1 WHERE sessionid=?; DELETE FROM Securitykey_Options WHERE uid=? AND register=0;",
              [JSON.stringify(keyused), uid, keyid, sessionid, uid],
              (err, res) => {
                if (err) {
                  console.log("error: ", err);
                  result(err, null);
                  return;
                }
                result(null, "Logged in");
                return;
              })
            } catch(e){
              console.log(e);
              result(null, e);
              return;
            }

          } else {
            result(null, "Invalid session");
            return;
          }

        })

      } else {
        result(null, "Invalid session");
        return;
      }
    })
    
};

Passwordmanager.requestKeys = (sessionid, result) => {//Show all registered keys
  sql.query("SELECT COUNT(*) as records, uid FROM Sessions WHERE sessionid=?",
  [sessionid],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      }
      if (res[0].records>0) {
        let uid = res[0].uid;
        sql.query("DELETE sd FROM Sessions sd JOIN users ud ON sd.uid = ud.id WHERE ud.id=? AND expires<NOW(); SELECT COUNT(s.id) AS records, u.id, s.sessionkey, u.publickey, u.privatekey FROM users u JOIN Sessions s ON u.id = s.uid WHERE u.id=? AND s.sessionid=? AND s.verified=1;",
        [uid, uid, sessionid, uid, uid],
        (err, res) => {
          if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
          }
          if (res[1][0].records>0) {//If records are returned user has a valid session
            
            sql.query("SELECT name, id FROM Security_Keys WHERE uid=?",
            [uid],
            (err, res) => {
              if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
              }
              if (res.length) {
                let keylist = JSON.stringify(res);
                result(null, keylist);
                return;
              } else {
                result(null, "[]");//login without key
                return;
              }
            });
              
          } else {
            result(null, "Invalid session");
            return;
          }
        });
      } else {
        result(null, "Invalid session");
        return;
      }
    });

  
  
};

Passwordmanager.deletekey = (sessionid, keyid, result) => {
    
  sql.query("SELECT COUNT(*) as records, uid FROM Sessions WHERE sessionid=?",
  [sessionid],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      }
      if (res[0].records>0) {
        let uid = res[0].uid;
        sql.query("DELETE sd FROM Sessions sd JOIN users ud ON sd.uid = ud.id WHERE ud.id=? AND expires<NOW(); SELECT COUNT(s.id) AS records, u.id, s.sessionkey, u.publickey, u.privatekey FROM users u JOIN Sessions s ON u.id = s.uid WHERE u.id=? AND s.sessionid=? AND s.verified=1;",
        [uid, uid, sessionid, uid, uid],
        (err, res) => {
          if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
          }
          if (res[1][0].records>0) {//If records are returned user has a valid session
            sql.query("DELETE FROM Security_Keys WHERE uid=? AND id=?",
            [uid, keyid],
            (err, res) => {
              if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
              }
              result(null, "Success")
              return;
            })
        
          } else {
            result(null, "Invalid session");
            return;
          }
        });
      } else {
        result(null, "Invalid session");
        return;
      }
    });
    
};

Passwordmanager.logout = (sessionid, result) => {
  
  sql.query("DELETE FROM Sessions WHERE sessionid=? LIMIT 1;",
    [sessionid],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      }
      result(null, "Success");
      return;      
    }
  );
    
};
/*Passwordmanager.login = (req, result) => {
  const { challenge, keyId } = parseLoginRequest(req.body);
  if(!challenge || !keyId){
    result(null, "No challenge/key");
    return;
  }
  
  sql.query("SELECT * FROM Webauthn_Keys WHERE challenge=? LIMIT 1",
    [challenge],
    (err, res) => {
      if (err) {
        console.log("error: ", err);
        result(err, null);
        return;
      }
      if (res.length) {
        
        const loggedIn = verifyAuthenticatorAssertion(req.body, JSON.parse(res[0].securitykey));
        console.log(loggedIn);
        
          result(null, { loggedIn });//should send sessionkey cookie
          //result(null, "success");
          return;
      }
      
    }
  );
    
};*/


  

module.exports = Passwordmanager;