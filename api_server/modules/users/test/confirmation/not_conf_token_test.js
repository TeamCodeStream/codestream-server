'use strict';

const ConfirmationWithLinkTest = require('./confirmation_with_link_test');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');

class NotConfTokenTest extends ConfirmationWithLinkTest {

	get description () {
		return 'should return an error when confirming with a token that is not a conf token';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1002'
		};
	}

	// before the test runs...
	before (callback) {
		// run the standard setup for a confirmation, but change the type of the token
		super.before(error => {
			if (error) { return callback(error); }
			const tokenHandler = new TokenHandler(this.apiConfig.sharedSecrets.auth);
			const payload = tokenHandler.decode(this.data.token);
			payload.type = 'xyz';
			this.data.token = tokenHandler.generate(payload, 'xyz');
			callback();
		});
	}
}

module.exports = NotConfTokenTest;
