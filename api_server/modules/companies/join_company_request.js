// handle the PUT /companies/join/:id request to join a company that has domain-based 
// or code host-based joining enabled

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const TeamErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/errors');
const AddTeamMembers = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/add_team_members');
const AddTeamPublisher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/add_team_publisher');
const EmailUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/email_utilities');

class JoinCompanyRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(TeamErrors);
	}

	// authorize the request for the current user©29
	async authorize () {
		// get the company
		this.company = await this.data.companies.getById(this.request.params.id.toLowerCase());
		if (!this.company || this.company.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'company' });
		}

		// code host joining is not yet supported, so for now we need to check that the user's email domain matches
		// whatever domain-based joining the company has enabled
		const domains = this.company.get('domainJoining') || [];
		const userDomain = EmailUtilities.parseEmail(this.user.get('email')).domain.toLowerCase();
		if (!domains.includes(userDomain)) {
			throw this.errorHandler.error('notAuthorizedToJoin');
		}
		this.joinMethod = 'Joined Team by Domain';

		// TODO: eventually support code host joining?

		// get the everyone team for the company, since this is what they're REALLY joining
		const everyoneTeamId = this.company.get('everyoneTeamId');
		if (!everyoneTeamId) {
			throw this.errorHandler.error('updateAuth', { reason: 'cannot join a company that has no "everyone" team' });
		}
		this.team = await this.data.teams.getById(everyoneTeamId);
		if (!this.team || this.team.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'everyone team' }); // shouldn't really happen
		}
	}

	// process the request
	async process () {
		// add the current user to the everyone team for the company
		await new AddTeamMembers({
			request: this,
			addUsers: [this.request.user],
			team: this.team,
			joinMethod: this.joinMethod
		}).addTeamMembers();

		// get the team and user again since the team object has been modified,
		// this should just fetch from the cache, not from the database
		this.company = await this.data.companies.getById(this.team.get('companyId'));
		this.team = await this.data.teams.getById(this.team.id);
		this.responseData = {
			user: this.transforms.userUpdates[0],
			company: this.company.getSanitizedObject({ request: this }),
			team: this.team.getSanitizedObject({ request: this })
		};
		this.responseData.team.companyMemberCount = await this.company.getCompanyMemberCount(this.data);
	}

	// after the join is complete and response returned...
	async postProcess () {
		// publish to the team that the users have been added,
		// and publish to each user that they've been added to the team

		// get the team and user again since the team object has been modified,
		// this should just fetch from the cache, not from the database
		await new AddTeamPublisher({
			request: this,
			broadcaster: this.api.services.broadcaster,
			users: [this.request.user],
			team: this.team,
			teamUpdate: this.transforms.teamUpdate,
			userUpdates: this.transforms.userUpdates
		}).publishAddedUsers();
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
