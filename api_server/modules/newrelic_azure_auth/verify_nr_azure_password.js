// fulfill a no-auth/verify-nr-azure-password request, called by Azure to verify a user's password
// after migration, so their correct CodeStream password can be ingested into Azure
// see: https://github.com/azure-ad-b2c/user-migration/tree/master/seamless-account-migration

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT +
	'/api_server/lib/util/restful/restful_request');
const LoginCore = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/login_core');

class VerifyNRAzurePasswordRequest extends RestfulRequest {
	constructor(options) {
		super(options);
	}

	async authorize() {
		// no pre-authorization needed, authorization is done according to email and password
	}

	// process the request....
	async process() {
		await this.requireAndAllow(); // require certain parameters, and discard unknown parameters
		await this.verifyPassword(); // verify the user's password
	}

	// require these parameters, and discard any unknown parameters
	async requireAndAllow() {
		await this.requireAllowParameters('body', {
			required: {
				string: ['email', 'password'],
			},
		});
	}

	// handle the actual login check ... get user and validate password
	async verifyPassword() {
		const { email, password } = this.request.body;
		this.user = await new LoginCore({
			request: this,
		}).login(email, password);

		this.responseData = {
			tokenSuccess: true,
			migrationRequired: false,
		};
	}
}

module.exports = VerifyNRAzurePasswordRequest;
