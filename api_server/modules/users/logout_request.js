// handle the "PUT /logout" request to log a user out, effectively revoking their access token

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const Errors = require('./errors');
const EligibleJoinCompaniesPublisher = require('./eligible_join_companies_publisher');

class LogoutRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	async authorize () {
		// no pre-authorization acts on current user
	}

	// process the request....
	async process () {
		// delete the user's access token
		return this.data.users.applyOpById(
			this.user.id,
			{
				$unset: {
					'accessTokens.web': true
				}
			}
		);
	}

	// after the response is returned
	async postProcess () {
		// publish the change in eligibleJoinCompanies to users with matching emails
		return new EligibleJoinCompaniesPublisher({
			request: this,
			broadcaster: this.api.services.broadcaster
		}).publishEligibleJoinCompanies(this.user.get('email'));
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'logout',
			summary: 'Performs logout',
			access: 'No authorization needed, applies to current user',
			description: 'Performs a logout for the current user, deleting their access token',
			returns: {
				summary: 'Returns an empty object'
			},
			errors: [
			]
		};
	}
}

module.exports = LogoutRequest;
