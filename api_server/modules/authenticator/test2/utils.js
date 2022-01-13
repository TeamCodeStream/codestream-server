'use strict';

const JSONWebToken = require('jsonwebtoken');

const RetrieveSecret = function(options) {
	const { testRunner } = options;
	const testData = testRunner.getTestData();
	const config = testData.getCacheItem('config');
	return config.sharedSecrets.auth;
};

const ParseToken = function(token, secret, options) {
	let payload;
	try {
		payload = JSONWebToken.verify(token, secret);
	}
	catch (error) {
		throw new Error('invalid token: ' + error);
	}
	return payload;
};

module.exports = {

	removeUserIdFromJWT (token, options) {
		const secret = RetrieveSecret(options);
		const payload = ParseToken(token, secret, options);

		// take the user ID out of the payload and regenerate the token
		payload.uid = payload.userId;
		delete payload.userId;
		return JSONWebToken.sign(payload, secret);
	},

	alterUserIdInJWT (token, options) {
		const secret = RetrieveSecret(options);
		const payload = ParseToken(token, secret, options);

		// change the user ID and regenerate the token
		payload.uid = 'xxxxxxxxxxxxxxxxxxxxxxx';
		return JSONWebToken.sign(payload, secret);
	},

	alterIssuanceInJWT (token, options) {
		const secret = RetrieveSecret(options);
		const payload = ParseToken(token, secret, options);

		// change the issuance time and regenerate the token
		payload.iat = Math.floor(Date.now() / 1000) - 5 * 60;
		return JSONWebToken.sign(payload, secret);
	}
}