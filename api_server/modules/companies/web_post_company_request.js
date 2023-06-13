'use strict';

const PostCompanyRequest = require('./post_company_request');

// bit of a hack here
// by starting its route with /web, this allows POST /companies to be called as an AJAX call
// using a cookie for auth, which is needed for the web-based domain-picker after social sign-up
class WebPostCompanyRequest extends PostCompanyRequest {

	async process () {
		// when coming from the web, end the flow by setting the signup flow's signup token
		if (!this.request.body.signupToken) {
			throw this.errorHandler.error('required', { info: 'signupToken' });
		}
		this.signupToken = this.request.body.signupToken;
		delete this.request.body.signupToken;
		delete this.request.body._csrf;

		await super.process();

		const userId = (this.transforms.additionalCompanyResponse && this.transforms.additionalCompanyResponse.userId) || this.user.id;
		await this.api.services.signupTokens.insert(
			this.signupToken,
			userId,
			{
				requestId: this.request.id,
				more: {
					signupStatus: 'userCreated'
				}
			}
		);
	}
}

module.exports = WebPostCompanyRequest;
