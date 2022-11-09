// handle the "POST /xenv/publish-ejc" request, to publish a change in eligibleJoinCompanies for a given email
// issues across environments

'use strict';

const XEnvRequest = require('./xenv_request');
const EligibleJoinCompaniesPublisher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/eligible_join_companies_publisher');

class PublishEligibleJoinCompaniesRequest extends XEnvRequest {

	// process the request...
	async process () {
		await this.requireAllowParameters('body', {
			required: {
				string: ['email'],
			}
		});

		await new EligibleJoinCompaniesPublisher({
			request: this,
			broadcaster: this.api.services.broadcaster
		}).publishEligibleJoinCompanies(this.request.body.email, { dontPublishInOtherEnvironments: true });

	}
}

module.exports = PublishEligibleJoinCompaniesRequest;
