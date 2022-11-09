// handle the "POST /xenv/create-company" request, to create a company across environments

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const AuthErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/authenticator/errors');
const GetEligibleJoinCompanies = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/companies/get_eligible_join_companies');
const EligibleJoinCompaniesPublisher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/eligible_join_companies_publisher');

class CreateCompanyRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(AuthErrors);
	}

	async authorize () {
		// any authenticated user can do this
	}

	async process () {
		await this.requireAndAllow();
		await this.ensureUser(); // ensure the user exists in the other environment
		await this.createCompany();	// make an ordinary API call to create the company
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters('body', {
			required: {
				string: ['name', 'serverUrl']
			}
		});
	}

	// ensure the requesting user exists in the other environment (by email)
	async ensureUser () {
		const { serverUrl } = this.request.body;
		this.ensureUserResponse = await this.api.services.environmentManager.ensureUserOnEnvironmentHost(serverUrl, this.request.user.attributes);
	}

	// create the company on the environment host, impersonating the user we just ensured
	async createCompany () {
		const token = this.ensureUserResponse.accessToken;
		if (!token) {
			throw this.errorHandler.error('createAuth', { reason: 'cross-environment access token not received' });
		}
		const { serverUrl } = this.request.body;
		this.responseData = await this.api.services.environmentManager.fetchFromUrl(`${serverUrl}/companies`, {
			method: 'post',
			body: {
				name: this.request.body.name
			},
			headers: {
				Authorization: `Bearer ${token}`
			}
		});
		this.responseData.accessToken = token;

		// add an eligibleJoinCompanies update to the response so the client can update immediately,
		// rather than waiting for a pubnub message
		const eligibleJoinCompanies = await GetEligibleJoinCompanies(this.user.get('email'), this);
		this.responseData.user = {
			id: this.user.id,
			$set: {
				eligibleJoinCompanies
			},
			$version: {
				before: '*'
			}
		}
	}

	// publish that eligibleJoinCompanies has changed for this user
	async postProcess () {
		await new EligibleJoinCompaniesPublisher({
			request: this,
			broadcaster: this.api.services.broadcaster
		}).publishEligibleJoinCompanies(this.user.get('email'));
	}
}

module.exports = CreateCompanyRequest;
