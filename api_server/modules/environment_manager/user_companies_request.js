// handle the "GET /xenv/user-companies" request, to fetch cross-environment companies
// a given user (by email) is a member of

'use strict';

const XEnvRequest = require('./xenv_request');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');

class UserCompaniesRequest extends XEnvRequest {

	// process the request...
	async process () {
		await this.requireAllowParameters('query', {
			required: {
				string: ['email'],
			}
		});

		// get user matching the email
		const user = await this.data.users.getOneByQuery(
			{ 
				searchableEmail: decodeURIComponent(this.request.query.email).toLowerCase() 
			},
			{
				hint: UserIndexes.bySearchableEmail
			}
		);
		if (!user) {
			return [];
		}

		// get companies the user is a member of
		const companyIds = user.get('companyIds') || [];
		let companies = [];
		if (companyIds.length > 0) {
			companies = await this.data.companies.getByIds(companyIds);
		}

		const accessToken = ((user.get('accessTokens') || {}).web || {}).token;
		this.responseData.companies = companies.map(company => {
			return {
				...(company.getSanitizedObject({ request: this })),
				accessToken
			};
		});
	}
}

module.exports = UserCompaniesRequest;
