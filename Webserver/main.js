//Solve registration Challenge
const publicKeyCredentialToJSON = (
    item
) => {
    if (item instanceof Array) {
        return item.map(publicKeyCredentialToJSON);
    }

    if (item instanceof ArrayBuffer) {
        const { Unibabel } = require('unibabel');
        // ArrayBuffer must be converted to typed arrays
        return Unibabel.bufferToBase64(new Uint8Array(item));
    }

    if (item instanceof Object) {
        const obj = {};

        // tslint:disable-next-line
        for (const key in item) {
            obj[key] = publicKeyCredentialToJSON(item[key]);
        }

        return obj;
    }

    return item;
};


const registrationChallengeToPublicKey = credentialsChallengeRequest => {
    const { Unibabel } = require('unibabel');

    return {
        ...credentialsChallengeRequest,
        challenge: Unibabel.base64ToBuffer(
            credentialsChallengeRequest.challenge
        ),
        user: {
            ...credentialsChallengeRequest.user,
            id: Unibabel.base64ToBuffer(credentialsChallengeRequest.user.id),
        },
    };
};

const solveRegistrationChallenge = async credentialsChallengeRequest => {
    const publicKey = registrationChallengeToPublicKey(
        credentialsChallengeRequest
    );
    const credentials = await navigator.credentials.create({
        publicKey,
    });

    return publicKeyCredentialToJSON(credentials);
};
//login challenge

const loginChallengeToPublicKey = getAssert => {
    const { Unibabel } = require('unibabel');

    return {
        ...getAssert,
        challenge: Unibabel.base64ToBuffer(getAssert.challenge),
        allowCredentials: getAssert.allowCredentials.map(allowCredential => ({
            ...allowCredential,
            id: Unibabel.base64ToBuffer(allowCredential.id),
        })),
    };
};

const solveLoginChallenge = async credentialsChallengeRequest => {
    const publicKey = loginChallengeToPublicKey(credentialsChallengeRequest);

    // @ts-ignore
    const credentials = await navigator.credentials.get({
        publicKey,
    });

    return publicKeyCredentialToJSON(credentials);
};


            const loginButton = document.getElementById('login');
            const registerButton = document.getElementById('register');
            const messageDiv = document.getElementById('message');

            const displayMessage = message => {
                messageDiv.innerHTML = message;
            }

            registerButton.onclick = async () => {
                const challenge = await fetch('https://api.jamiez.co.uk/webauthn/request-register', {
                    method: 'POST',
                    headers: {
                        'content-type': 'Application/Json'
                    },
                    body: JSON.stringify({ id: 'uuid', email: 'test@test' })
                })
                    .then(response => response.json());
                const credentials = await solveRegistrationChallenge(challenge);

                const { loggedIn } = await fetch(
                    'https://api.jamiez.co.uk/register', 
                    {
                        method: 'POST',
                        headers: {
                            'content-type': 'Application/Json'
                        },
                        body: JSON.stringify(credentials)
                    }
                ).then(response => response.json());

                if (loggedIn) {
                    displayMessage('registration successful');
                    return;
                }
                displayMessage('registration failed');
            };

            loginButton.onclick = async () => {
                const challenge = await fetch('https://api.jamiez.co.uk/login', {
                    method: 'POST',
                    headers: {
                        'content-type': 'Application/Json'
                    },
                    body: JSON.stringify({ email: 'test@test' })
                })
                .then(response => response.json());


                const credentials = await solveLoginChallenge(challenge);
                const { loggedIn } = await fetch(
                    'https://api.jamiez.co.uk/login-challenge', 
                    {
                        method: 'POST',
                        headers: {
                            'content-type': 'Application/Json'
                        },
                        body: JSON.stringify(credentials)
                    }
                ).then(response => response.json());

                if (loggedIn) {
                    displayMessage('You are logged in');
                    return;
                }
                displayMessage('Invalid credential');
            };