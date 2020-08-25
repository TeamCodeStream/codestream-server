'use strict';

const ConfirmationWithLinkTest = require('./confirmation_with_link_test');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');

class NoUidTest extends ConfirmationWithLinkTest {

	get description () {
		return 'should return an error when confirming with a token that has no uid';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1002'
		};
	}

	// before the test runs...
	before (callback) {
		// run the standard setup for a confirmation, but delete the uid in the token
		super.before(error => {
			if (error) { return callback(error); }
			const tokenHandler = new TokenHandler(this.apiConfig.sharedSecrets.auth);
			const payload = tokenHandler.decode(this.data.token);
			delete payload.uid;
			this.data.token = tokenHandler.generate(payload, 'conf');
			callback();
		});
	}
}

module.exports = NoUidTest;
