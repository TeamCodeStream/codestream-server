// wrapper to JSON web token generation and verification

'use strict';

const JWT = require('jsonwebtoken');

const JWT_ALGORITHM = 'HS256';
const JWT_ISSUER = 'CodeStream';

class TokenHandler {

	constructor (secret) {
		if (!secret) {
			throw 'must provide secret for TokenHandler';
		}
		this.secret = secret;
	}

	// generate a token with the given payload and of the given type, with optional expiration
	generate (payload, type = 'web', options = {}) {
		payload = Object.assign({}, payload, {
			iss: JWT_ISSUER,
			alg: JWT_ALGORITHM,
			type: type
		});
		if (options.expiresAt) {
			payload.exp = Math.floor(options.expiresAt / 1000);
		}
		return JWT.sign(payload, this.secret);
	}

	// verify the passed token and return payload
	verify (token) {
		return JWT.verify(
			token,
			this.secret,
			{
				algorithms: [JWT_ALGORITHM]
			}
		);
	}

	// decode the passed token and return payload, this does not check the signature
	// and should be used only when the token is fully trusted already
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
