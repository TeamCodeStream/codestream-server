'use strict';

const ConfirmationEmailTest = require('./confirmation_email_test');
const Assert = require('assert');
const TokenHandler = require(process.env.CS_API_TOP + '/server_utils/token_handler');

class ConfirmationEmailWithLinkTest extends ConfirmationEmailTest {

	constructor (options) {
		super(options);
		this.wantLink = true;
	}

	get description () {
		return 'should send a confirmation email with a confirmation link when a new user registers with the wantLink flag';
	}

	validateMessage (message) {
		const gotMessage = message.message;

		// verify a match to the url
		const host = this.apiConfig.webclient.host.replace(/\//g, '\\/');
		const shouldMatch = new RegExp(`${host}\\/confirm-email\\/(.*)$`);
		const match = gotMessage.url.match(shouldMatch);
		Assert(match && match.length === 2, 'confirmation link url is not correct');

		// verify correct payload
		const token = match[1];
		const payload = new TokenHandler(this.apiConfig.secrets.auth).verify(token);
		Assert.equal(payload.iss, 'CodeStream', 'token payload issuer is not CodeStream');
		Assert.equal(payload.alg, 'HS256', 'token payload algortihm is not HS256');
		Assert.equal(payload.type, 'conf', 'token payload type should be conf');
		Assert.equal(payload.uid, this.currentUser.user.id, 'uid in token payload is incorrect');
		Assert(payload.iat <= Math.floor(Date.now() / 1000), 'iat in token payload is not earlier than now');
		Assert.equal(payload.exp, payload.iat + 86400, 'token payload expiration is not one day out');

		// allow to pass deepEqual
		this.message.url = gotMessage.url;
		return super.validateMessage(message);
	}
}

module.exports = ConfirmationEmailWithLinkTest;
