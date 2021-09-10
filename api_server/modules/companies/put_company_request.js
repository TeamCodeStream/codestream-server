// handle the PUT /companies request to update attributes of a company

'use strict';

const PutRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/put_request');

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
	}

	// after the team is updated...
	async postProcess () {
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

	// describe this route for help
	static describe (module) {
		const description = PutRequest.describe(module);
		description.access = 'Current user must be admin of the company (under the hood, this means an admin on the "everyone" team for the company).';
		description.input = {
			summary: description.input,
			looksLike: {
				'name': '<Updated name of the company>',
				'domainJoining': '<Updated array of domains allowed for domain-based joining',
				'codeHostJoining': '<Updated array of code hosts allowed for code host-based joining'
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
