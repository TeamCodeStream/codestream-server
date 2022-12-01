// handle the PUT /companies request to update attributes of a company

'use strict';

const PutRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/put_request');
const EligibleJoinCompaniesPublisher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/eligible_join_companies_publisher');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');

class PutCompanyRequest extends PutRequest {

	// authorize the request for the current user
	async authorize () {
		// user must be an admin for the "everyone" team for the company
		this.company = await this.data.companies.getById(this.request.params.id.toLowerCase());
		if (!this.company || this.company.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'company' });
		}
		const everyoneTeamId = this.company.get('everyoneTeamId');
		if (!everyoneTeamId) {
			throw this.errorHandler.error('updateAuth', { reason: 'cannot update a company that has no "everyone" team' });
		}
		
		this.everyoneTeam = await this.data.teams.getById(everyoneTeamId);
		if (!this.everyoneTeam || this.everyoneTeam.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'everyone team' }); // shouldn't really happen
		}

		if (!(this.everyoneTeam.get('adminIds') || []).includes(this.request.user.id)) {
			throw this.errorHandler.error('updateAuth', { reason: 'only admins can update this company' });
		}

		// under unified identitiy, companies can only be updated if they are "codestream only",
		// here we not only check if the flag is present, but we double-check with New Relic
		if (!this.company.get('codestreamOnly')) {
			throw this.errorHandler.error('updateAuth', { reason: 'this company/org is managed by New Relic and can not be updated' });
		}
		const nrOrgId = this.company.get('linkedNROrgId'); // this SHOULD always be set under unified identity, once migrated
		if (!nrOrgId) { return; }
		const stillCodeStreamOnly = await this.api.services.idp.isNROrgCodeStreamOnly(
			nrOrgId,
			this.company.get('everyoneTeamId'),
			{ request: this }
		);
		if (stillCodeStreamOnly) {
			return;
		}

		// if no-longer codestream only, remove the flag and disable domain joining
		await this.data.companies.updateDirect(
			{
				_id: this.data.companies.objectIdSafe(this.company.id)
			},
			{
				$unset: {
					domainJoining: true,
					codestreamOnly: true
				}
			}
		);
		throw this.errorHandler.error('updateAuth', { reason: 'this company/org was found to be managed by New Relic and can not be updated' });
	}

	// after the team is updated...
	async postProcess () {
		await this.publishToTeam();
		await this.publishToInvitees();
	}

	async publishToTeam () {
		// publish the change to all users on the "everyone" team
		const channel = 'team-' + this.everyoneTeam.id;
		const message = Object.assign({}, this.responseData, { requestId: this.request.id });
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish updated company message to team ${this.everyoneTeam.id}: ${JSON.stringify(error)}`);
		}
	}

	// publish the change to all registered, invited users, in their "eligibleJoinCompanies" array
	async publishToInvitees () {
		// this sucks, and is NOT scaleable ... we need to broadcast out to every member of the
		// company that the company attributes have changed, because those attributes appear
		// in the eligibleJoinCompanies attribute for each user, and that gets displayed in the org
		// switcher ... unfortunately we haven't really implemented a good data model for this,
		// since it's an array ... so to broadcast the change we really need to fetch EVERYONE's
		// eligibleJoinCompanies, all at once ... just not a good idea for big orgs
		// https://issues.newrelic.com/browse/NR-62509
		const activeMemberIds = this.everyoneTeam.getActiveMembers();
		const members = await this.data.users.getByQuery(
			{
				id: { $in: activeMemberIds.map(id => this.data.users.objectIdSafe(id)) }
			},
			{
				noCache: true,
				fields: [/*'isRegistered', */'email'],
				hint: UserIndexes.byId
			}
		);
		/*
		const unregisteredMembers = members.filter(member => {
			return !member.isRegistered;
		});
		*/
		await Promise.all(members.map(async user => {
			await new EligibleJoinCompaniesPublisher({
				request: this,
				broadcaster: this.api.services.broadcaster
			}).publishEligibleJoinCompanies(user.email);
		}));
	}

	// describe this route for help
	static describe (module) {
		const description = PutRequest.describe(module);
		description.access = 'Current user must be admin of the company (under the hood, this means an admin on the "everyone" team for the company).';
		description.input = {
			summary: description.input,
			looksLike: {
				'name': '<Updated name of the company>',
				'domainJoining': '<Updated array of domains allowed for domain-based joining'
			}
		};
		description.publishes = {
			summary: 'Publishes the updated attributes of the company object to the team channel for the "everyone" team',
			looksLike: {
				company: '<@@#company object#company@@>',
			}
		};
		return description;
	}
}

module.exports = PutCompanyRequest;
