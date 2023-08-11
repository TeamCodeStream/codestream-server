'use strict';

const JoinCompanyRequest = require('./join_company_request');

// bit of a hack here
// by starting its route with /web, this allows PUT /join-company/:id to be called as an AJAX call
// using a cookie for auth, which is needed for the web-based domain-picker after social sign-up
class WebJoinCompanyRequest extends JoinCompanyRequest {

	async process () {
		// when coming from the web, end the flow by setting the signup flow's signup token
		if (!this.request.body.signupToken) {
			throw this.errorHandler.error('required', { info: 'signupToken' });
		}
		this.signupToken = this.request.body.signupToken;
		delete this.request.body.signupToken;
		delete this.request.body._csrf;

		await super.process();

		this.log('NEWRELIC IDP TRACK: Saving signup token after doing web-based join-company');
		await this.api.services.signupTokens.insert(
			this.signupToken,
			this.responseData.userId,
			{
				requestId: this.request.id,
				more: {
					signupStatus: 'userCreated'
				}
			}
		);
	}
}

module.exports = WebJoinCompanyRequest;
