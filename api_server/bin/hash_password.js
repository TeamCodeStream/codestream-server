#!/usr/bin/env node

// run this script to generate a password hash based on an input password

/* eslint no-console: 0 */

const PasswordHasher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/password_hasher');
const Password = process.argv[2];

new PasswordHasher({ password: Password }).hashPassword((error, hash) => {
	if (error) {
		console.error(JSON.stringify(error));
	}
	else {
		console.log(hash);
	}
});
