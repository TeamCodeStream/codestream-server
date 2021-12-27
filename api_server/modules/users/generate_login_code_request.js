// handle the "POST /no-auth/login-code" request to have a login code sent to
// user's email address

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const ConfirmCode = require('./confirm_code');
const Indexes = require('./indexes');

class GenerateLoginCodeRequest extends RestfulRequest {

	async authorize () {
		// no pre-authorization needed
	}

	async process () {
		await this.requireAndAllow(); // require certain parameters, and discard unknown parameters
		await this.getUser(); // fetch the user object for the requested email address
		await this.generateLoginCode(); // generate a login code and expiry date
		await this.updateUser(); // write the model to the user database
	}

	async postProcess () {
		await this.sendLoginCodeEmail(); // send the email with the login code
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters('body', {
			required: {
				string: ['email'],
			},
		});
	}

	// fetch the user object for the requested email address
	async getUser () {
		this.user = await this.data.users.getOneByQuery(
			{ searchableEmail: this.request.body.email.toLowerCase() },
			{ hint: Indexes.bySearchableEmail }
		);
	}

	// generate a login code and expiry date
	async generateLoginCode () {
		if (!this.user) {
			return;
		}

		this.loginCode = ConfirmCode();
		// FIXME: this should be configurable
		this.loginCodeExpiresAt = Date.now() + 15*60*1000;
		this.loginCodeAttempts = 0;
	}

	// write the model to the user database
	async updateUser () {
		if (!this.user) {
			return;
		}

		const op = {
			$set: {
				loginCode: this.loginCode,
				loginCodeExpiresAt: this.loginCodeExpiresAt,
				loginCodeAttempts: this.loginCodeAttempts,
			},
		};
		this.data.users.applyOpById(this.user.id, op)
	}

	// send the email with the login code
	async sendLoginCodeEmail () {
		if (!this.user) {
			return;
		}

		this.log(`Triggering email with login code to ${this.user.get('email')}...`);
		await this.api.services.email.queueEmailSend(
			{
				type: 'loginCode',
				userId: this.user.id,
			},
			{
				request: this,
				user: this.user,
			}
		);
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'loginCode',
			summary: 'Generates a login code',
			access: 'No authorization needed',
			description: 'Generates a login code for a user and sends them an email with the code',
			input: {
				summary: 'Specify attributes in the body',
				looksLike: {
					'email*': '<User\'s email>'
				},
			}
		};
	}
}

module.exports = GenerateLoginCodeRequest;
