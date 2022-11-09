// handle the "GET /users/:id" request, to fetch a given user

'use strict';

const GetRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/get_request');
const GetEligibleJoinCompanies = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/companies/get_eligible_join_companies');

class GetUserRequest extends GetRequest {

	// process the request...
	async process () {
		// allow for specifying "me" as the user to fetch
		if (this.request.params.id.toLowerCase() === 'me') {
			// allow certain "me-attributes" that only this user can see
			this.responseData = { user: this.user.getSanitizedObjectForMe({ request: this }) };

			// send "eligible join companies" if needed
			const eligibleJoinCompanies = await GetEligibleJoinCompanies(this.user.get('email'), this);
			if (eligibleJoinCompanies && eligibleJoinCompanies.length > 0) {
				this.responseData.user.eligibleJoinCompanies = eligibleJoinCompanies;
			}
			return;
		}
		await super.process();

		// we allow the fetching of me-attributes for a user if confirmationCheat is sent
		if (this.request.headers['x-cs-me-cheat'] === this.api.config.sharedSecrets.confirmationCheat) {
			this.warn('NOTE: sending me-attributes with ordinary user fetch, this had better be a test!');
			this.responseData.user = this.model.getSanitizedObjectForMe({ request: this });
		}
	}
	
	// describe this route for help
	static describe (module) {
		const description = GetRequest.describe(module);
		description.access = 'Current user can access the user object for all users across all the teams they are on';
		description.input = 'Specify the ID of the user in the path; the ID can also be \'me\', to fetch the current user\'s own user object';
		return description;
	}
}

module.exports = GetUserRequest;
