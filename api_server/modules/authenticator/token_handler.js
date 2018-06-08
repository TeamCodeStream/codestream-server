// wrapper to JSON web token generation and verification

'use strict';

const JWT = require('jsonwebtoken');

const JWT_ALGORITHM = 'HS256';
const JWT_ISSUER = 'CodeStream';

class TokenHandler {

	constructor (secret) {
		if (!secret) {
			throw 'must provide secret for Tokens';
		}
		this.secret = secret;
	}

	generate (user, type = 'web') {
		const payload = {
			userId: user._id.toString(),
			iss: JWT_ISSUER,
			alg: JWT_ALGORITHM,
			type: type
		};
		return JWT.sign(payload, this.secret);
	}

	verify (token) {
		return JWT.verify(
			token,
			this.secret,
			{
				algorithms: [JWT_ALGORITHM]
			}
		);
	}

	decode (token) {
		return JWT.decode(
			token,
			this.secret,
			{
				algorithms: [JWT_ALGORITHM]
			}
		);
	}
}

module.exports = TokenHandler;
