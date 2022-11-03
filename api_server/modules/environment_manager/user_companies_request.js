// handle the "GET /xenv/user-companies" request, to fetch cross-environment companies
// a given user (by email) is a member of

'use strict';

const XEnvRequest = require('./xenv_request');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');

class UserCompaniesRequest extends XEnvRequest {

	// process the request...
	async process () {
		// this endpoint is deprecated as of one-user-per-org
		throw this.errorHandler.error('deprecated'); 
		
		await this.requireAllowParameters('query', {
			required: {
				string: ['email'],
			}
		});

		// get users matching the email
		const users = await this.data.users.getByQuery(
			{ 
				searchableEmail: decodeURIComponent(this.request.query.email).toLowerCase() 
			},
			{
				hint: UserIndexes.bySearchableEmail
			}
		);

		// get all the companyID, to make a single request to the database for all the companies
		const allCompanyIds = [];
		users.forEach(user => {
			const companyIds = user.get('companyIds') || [];
			allCompanyIds.push.apply(allCompanyIds, companyIds); 
		});
		const allCompanies = await this.data.companies.getByIds(allCompanyIds);

		// put each company in the response, along with access token if available
		this.responseData.companies = [];
		users.forEach(user => {
			const companyIds = user.get('companyIds') || [];
			companyIds.forEach(companyId => {
				const company = allCompanies.find(c => c.id === companyId);
				if (company) {
					const accessToken = ((user.get('accessTokens') || {}).web || {}).token;
					this.responseData.companies.push({
						...(company.getSanitizedObject({ request: this })),
						accessToken
					});
				}
			});
		});
	}
}

module.exports = UserCompaniesRequest;
