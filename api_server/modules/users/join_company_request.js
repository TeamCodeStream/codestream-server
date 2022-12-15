// handle the PUT /join-company/:id request to accept an invite from a company,
// either one the user has been invited to, or one that has domain-based joining enabled

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const TeamErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/errors');
const NewRelicIDPErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/newrelic_idp/errors');
const JoinCompanyHelper = require('./join_company_helper');
const ConfirmHelper = require('./confirm_helper');

class JoinCompanyRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(TeamErrors);
		this.errorHandler.add(NewRelicIDPErrors);
	}

	// authorize the request for the current user
	async authorize () {
		this.helper = new JoinCompanyHelper({
			request: this,
			user: this.user,
			companyId: this.request.params.id.toLowerCase(),
			confirmHelperClass: ConfirmHelper // this avoids a circular require
		});
		return this.helper.authorize();
	}

	// process the request
	async process () {
		await this.helper.process();
		this.responseData = this.helper.responseData;
	}

	// after the join is complete and response returned...
	async postProcess () {
		return this.helper.postProcess();
	}

	// describe this route for help
	static describe (module) {
		return {
			tag: 'join-company',
			summary: 'Join a company based on domain or code host',
			access: 'The company must have domain-based joining enabled for a domain matching the domain of the user\'s email address',
			description: 'Current user joining a team which has domain-based joining enabled, based on the user\'s email domain',
			input: 'Specify the company ID in the path, no other input required',
			returns: {
				summary: 'A user object, with directives to update to the user model, the company object, and a team object representing the company\'s everyone team',
				looksLike: {
					user: '<directives>',
					team: '<team object>',
					company: '<company object>'
				}
			},
			publishes: {
				summary: 'The response data will be published on the user channel for the user joining the team, other updates will be published on the team channel for the everyone team for the company ',
			},
			errors: [
				'updateAuth',
				'notFound',
				'notAuthorizedToJoin'
			]
		};
	}
}

module.exports = JoinCompanyRequest;
