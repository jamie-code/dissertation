var aes256 = require('aes256');

var key = 'my passphrase';
var plaintext = 'my plaintext message';
var buffer = Buffer.from(plaintext);

var encryptedPlainText = aes256.encrypt(key, plaintext);
var decryptedPlainText = aes256.decrypt(key, encryptedPlainText);
// plaintext === decryptedPlainText