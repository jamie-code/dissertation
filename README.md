# Dissertation
A password manager website which uses JavaScript for communication with an API, encrypting RSA keypairs with AES-256 for database storage, RSA key pairs for encrypting the password information, hashing with Argon2 and Web Authentication protocol.
The API in NodeJS handles secondary hashing with a random salt, WebAuthn validation and relaying information between the website and the database.

This alot of the processessing is handled clientside, it is also designed such that no one outside your computer will have enough information to read your passwords.
All information is encrypted on your browser before being sent to the API.

Some of the functionality doesn't scale well with mobile (right clicking for dropdowns etc) but I am currently working on a mobile app.
