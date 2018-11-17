'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');

class ResendConfirmTest extends CodeStreamAPITest {

	get description () {
		return 'should accept a request to resend a confirmation email to an unregistered user';
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/no-auth/resend-confirm';
	}

	// before the test runs...
	before (callback) {
		const options = {
			wantLink: true
		};
		// register a random user, they will be unconfirmed and we will confirm for the test
		this.userFactory.registerRandomUser((error, data) => {
			if (error) { return callback(error); }
			// form the data to send with the confirmation request
			this.userId = data.user.id;
			this.data = { 
				email: data.user.email,
				_confirmationCheat: SecretsConfig.confirmationCheat
			};
			this.originalToken = data.user.confirmationToken;    // returns by providing the confirmation cheat code
			setTimeout(callback, 2000); // wait a bit for the issuance time to change
		}, options);
	}
}

module.exports = ResendConfirmTest;
