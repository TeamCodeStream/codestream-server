// handle the "GET /xenv/eligible-join-companies" request, to fetch cross-environment companies
// that have domain joining on for a given domain

'use strict';

const XEnvRequest = require('./xenv_request');
const GetEligibleJoinCompanies = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/companies/get_eligible_join_companies');

class EligibleJoinCompaniesRequest extends XEnvRequest {

	// process the request...
	async process () {
		// remove this check when we fully move to ONE_USER_PER_ORG
		const oneUserPerOrg = (
			this.api.modules.modulesByName.users.oneUserPerOrg ||
			this.request.headers['x-cs-one-user-per-org']
		);

		if (oneUserPerOrg) {
			await this.requireAllowParameters('query', {
				required: {
					string: ['email']
				}
			});
		} else {
			await this.requireAllowParameters('query', {
				required: {
					string: ['domain']
				}
			});
		}

		this.responseData.companies = await GetEligibleJoinCompanies(
			this.request.query.email || this.request.query.domain.toLowerCase(),
			this,
			{ dontFetchCrossEnvironment: true }
		);
	}
}

module.exports = EligibleJoinCompaniesRequest;
