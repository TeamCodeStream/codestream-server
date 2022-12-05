// handle the PUT /join-company/:id request to accept an invite from a company,
// either one the user has been invited to, or one that has domain-based joining enabled

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const TeamErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/errors');
const AddTeamMembers = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/add_team_members');
const AddTeamPublisher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/add_team_publisher');
const EmailUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/email_utilities');
const Indexes = require('./indexes');
const ConfirmHelper = require('./confirm_helper');
const UserCreator = require('./user_creator');
const UserDeleter = require('./user_deleter');
const UserAttributes = require('./user_attributes');
const EligibleJoinCompaniesPublisher = require('./eligible_join_companies_publisher');
const NewRelicIDPErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/newrelic_idp/errors');
const IsCodeStreamOnly = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/companies/is_codestream_only');

class JoinCompanyRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(TeamErrors);
		this.errorHandler.add(NewRelicIDPErrors);
	}

	// authorize the request for the current user
	async authorize () {
		// this functionality is not supported if one-user-per-org is not active
		// remove this check when we are fully migrated to ONE_USER_PER_ORG
		if (
			!this.api.modules.modulesByName.users.oneUserPerOrg &&
			!this.request.headers['x-cs-one-user-per-org']
		) {
			throw this.errorHandler.error('notAuthorizedToJoin', { reason: 'one-user-per-org not enabled' });
		}
		this.log('NOTE: join-company request allowed in one-user-per-org paradigm');

		// get the company
		this.company = await this.data.companies.getById(this.request.params.id.toLowerCase());
		if (!this.company || this.company.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'company' });
		}

		// check whether the company is marked as "codestream-only", and whether its linked NR org
		// is also "codestream-only", which is the only scenario under which domain joining is possible
		const codestreamOnly = await IsCodeStreamOnly(this.company, this);
		if (!codestreamOnly) {
			await this.persist();
			await this.publishCompanyNoCSOnly();
			throw this.errorHandler.error('notAuthorizedToJoin', { reason: 'membership in this company is managed by New Relic' });
		}

		// get the company's everyone team
		this.team = await this.data.teams.getById(this.company.get('everyoneTeamId'));
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' }); // shouldn't happen
		}

		// get the user record that corresponds to this user's invite
		const matchingUsers = await this.data.users.getByQuery(
			{
				searchableEmail: this.user.get('email').toLowerCase()
			},
			{
				hint: Indexes.bySearchableEmail
			}
		);

		this.invitedUser = matchingUsers.find(user => {
			const teamIds = user.get('teamIds') || [];
			return (
				!user.get('deactivated') &&
				teamIds.length === 1 &&
				teamIds[0] === this.team.id
			);
		});

		if (this.invitedUser) {
			return;
		}

		// check that the user's email domain matches whatever domain-based joining the company has enabled
		const domains = this.company.get('domainJoining') || [];
		const userDomain = EmailUtilities.parseEmail(this.user.get('email')).domain.toLowerCase();
		if (!domains.includes(userDomain)) {
			throw this.errorHandler.error('notAuthorizedToJoin');
		}

		this.joinMethod = 'Joined Team by Domain';
	}

	// process the request
	async process () {
		if (!this.invitedUser) {
			this.invitedUser = await this.duplicateUser();
		}

		await this.confirmUser();
		await this.addUserToTeam();
		await this.handleIdPSignup();

		// if the original user is teamless, basically meaning they just confirmed,
		// and are now joining a company, delete the original user record
		if ((this.user.get('teamIds') || []).length === 0) {
			await new UserDeleter({
				request: this
			}).deleteUser(this.user.id);
		}

		// for tests, pass the updated user back in the response
		if (this.request.headers['x-cs-confirmation-cheat'] === this.api.config.sharedSecrets.confirmationCheat) {
			this.warn('NOTE: passing user object back in join-company request, this had better be a test!');
			this.responseData.user = this.invitedUser.getSanitizedObjectForMe({ request: this });
			this.responseData.broadcasterToken = this.invitedUser.get('broadcasterToken');
			this.responseData.user.version++;
		}
	}

	// under one-user-per-org, joining a company by virtue of domain joining (no invite) means
	// duplicating the user record for the joining user
	async duplicateUser () {
		const userData = {
			copiedFromUserId: this.user.id
		};
		const attributesToCopy = Object.keys(UserAttributes).filter(attr => {
			return UserAttributes[attr].copyOnInvite;
		});
		attributesToCopy.forEach(attribute => {
			const value = this.user.get(attribute);
			if (typeof value !== undefined) {
				userData[attribute] = value;
			}
		});
		return new UserCreator({ 
			request: this,
			force: true
		}).createUser(userData);
	}

	// under one-user-per-org, accepting an invite means confirming the user record for the unregistered
	// user who has been created as a result of the invite
	async confirmUser () {
		const accessToken = ((this.invitedUser.get('accessTokens') || {}).web || {}).token;
		if (accessToken) {
			this.responseData = {
				accessToken
			};
		} else {
			this.responseData = await new ConfirmHelper({
				request: this,
				user: this.invitedUser,
				notRealLogin: true
			}).confirm({
				email: this.invitedUser.get('email'),
				username: this.user.get('username'),
				fullName: this.user.get('fullName'),
				passwordHash: this.user.get('passwordHash'),
				providerInfo: this.user.get('providerInfo'),
				providerIdentities: this.user.get('providerIdentities')
			});
		}

		Object.assign(this.responseData, {
			userId: this.invitedUser.id,
			teamId: this.team.id
		});
	}

	// add the invited user to the everyone team for the company
	async addUserToTeam () {
		await new AddTeamMembers({
			request: this,
			addUsers: [this.invitedUser],
			team: this.team,
			joinMethod: this.joinMethod
		}).addTeamMembers();
	}

	// upon joining company creation is where we first register the user with our third-party Identity Provider
	// (i.e. NewRelic/Azure) ... even if the user is joining a second org, under one-user-per-org,
	// it's more or less functionally the same as signing up
	async handleIdPSignup () {
		if (!this.api.services.idp) { return; }
		let mockResponse;
		if (this.request.headers['x-cs-no-newrelic']) {
			mockResponse = true;
			this.log('NOTE: not handling IDP signup, sending mock response');
		}

		let password;
		const encryptedPassword = this.user.get('encryptedPasswordTemp');
		if (encryptedPassword) {
			password = await this.decryptPassword(encryptedPassword)
		}

		const nrOrgInfo = this.company.get('nrOrgInfo');
		if (!nrOrgInfo) {
			// shouldn't happen
			throw this.errorHandler.error('createAuth', { reason: 'company does not have New Relic org info' });
		}

		const name = this.invitedUser.get('fullName') || this.invitedUser.get('email').split('@')[0];
		const nrUserInfo = await this.api.services.idp.createUserWithPassword(
			{
				name,
				email: this.invitedUser.get('email'),
				authentication_domain_id: nrOrgInfo.authentication_domain_id,
				email_is_verified: true,
				active: true
			},
			password,
			{ 
				request: this,
				mockResponse
			}
		);

		// for some insane reason, the ID comes out as a string 
		if (typeof nrUserInfo.id === 'string') {
			nrUserInfo.id = parseInt(nrUserInfo.id, 10);
			if (!nrUserInfo.id || isNaN(nrUserInfo.id)) {
				throw this.errorHandler.error('internal', { reason: 'created user had non-numeric ID from New Relic' });
			}
		}

		// save NR user info obtained from the signup process
		await this.data.users.applyOpById(
			this.invitedUser.id,
			{
				$set: {
					nrUserInfo: nrUserInfo.attributes,
					nrUserId: nrUserInfo.id
				},
				$unset: {
					encryptedPasswordTemp: true
				}
			}
		);
	}

	// decrypt the user's stored password, which is encrypted upon registration for
	// temporary maintenance during the signup flow
	async decryptPassword (encryptedPassword) {
		return this.request.api.services.passwordEncrypt.decryptPassword(encryptedPassword);
	}
	
	// after the join is complete and response returned...
	async postProcess () {
		// publish to the team that the users have been added,
		// and publish to each user that they've been added to the team
		await new AddTeamPublisher({
			request: this,
			broadcaster: this.api.services.broadcaster,
			users: [this.invitedUser],
			team: this.team,
			teamUpdate: this.transforms.teamUpdate
		}).publishAddedUsers();

		// publish to all registered users the resulting change in eligibleJoinCompanies
		await new EligibleJoinCompaniesPublisher({
			request: this,
			broadcaster: this.api.services.broadcaster
		}).publishEligibleJoinCompanies(this.invitedUser.get('email'))
	}

	// if the company object has changed (because it was found to no longer be "codestream only"),
	// publish the change to the team channel
	async publishCompanyNoCSOnly () {
		if (!this.transforms.updateCompanyNoCSOnly) {
			return;
		}

		// publish the change to all users on the "everyone" team
		const channel = 'team-' + this.company.get('everyoneTeamId');
		const message = {
			company: this.transforms.updateCompanyNoCSOnly,
			requestId: this.request.id
		};;
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish updated company message to team ${this.company.get('everyoneTeamId')}: ${JSON.stringify(error)}`);
		}
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
