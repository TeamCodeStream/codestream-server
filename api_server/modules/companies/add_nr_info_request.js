// handle the POST /companies/add-nr-info/:id request to add New Relic org info to a company

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');

class AddNRInfoRequest extends RestfulRequest {

	// authorize the request for the current user
	async authorize () {
		throw this.errorHandler.error('deprecated');
		
		// get the company
		this.company = await this.data.companies.getById(this.request.params.id.toLowerCase());
		if (!this.company || this.company.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'company' });
		}

		// user must be a member of the everyone team for the company
		const teamId = this.company.get('everyoneTeamId') || (this.company.get('teamIds') || [])[0];
		if (!teamId || !(await this.user.authorizeTeam(teamId))) {
			throw this.errorHandler.error('updateAuth', { reason: 'user is not a member of this company' });
		}
	}

	// process the request
	async process () {
		if (!this.request.body.accountIds && !this.request.body.orgIds) {
			throw this.errorHandler.error('parameterRequired', { info: 'accountIds or orgIds' });
		}
		const op = {
			$set: {
				modifiedAt: Date.now()
			}
		};
		if (this.request.body.accountIds) {
			op.$set.nrAccountIds = this.request.body.accountIds;
		}
		if (this.request.body.orgIds) {
			if (this.request.body.orgIds.length !== 1) {
				throw this.errorHandler.error('invalidParameter', { info: 'orgIds must be a singleton' });
			}
			op.$set.nrOrgIds = this.request.body.orgIds;
		}

		this.updateOp = await new ModelSaver({
			request: this,
			collection: this.data.companies,
			id: this.company.id
		}).save(op);

		this.responseData = { company: this.updateOp };
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow() {
		await this.requireAllowParameters(
			'body',
			{
				optional: {
					'array(string)': ['orgIds'],
					'array(number)': ['accountIds']
				}
			}
		);
	}

	// after the join is complete and response returned...
	async postProcess () {
		const teamId = this.company.get('everyoneTeamId') || (this.company.get('teamIds') || [])[0];
		if (!teamId) { return; }
		// publish to the everyone team for the company
		const channel = 'team-' + teamId;
		const message = Object.assign({}, this.responseData, { requestId: this.request.id });
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate
			this.warn(`Unable to publish company update message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = AddNRInfoRequest;
