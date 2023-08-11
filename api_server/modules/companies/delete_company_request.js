// handle the DELETE /companies/:id request to delete (deactivate) a company

'use strict';

const DeleteRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/delete_request');
const DeleteCompanyHelper = require('./delete_company_helper');

class DeleteCompanyRequest extends DeleteRequest {

	// authorize the request for the current user
	async authorize () {
		// if secret passed, anyone can delete this team
		if (this.request.headers['x-delete-company-secret'] === this.api.config.sharedSecrets.confirmationCheat) {
			return;
		}

		// get the company to delete
		this.companyToDelete = await this.data.companies.getById(this.request.params.id.toLowerCase());
		if (!this.companyToDelete || this.companyToDelete.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'company' });
		}

		const everyoneTeamId = this.companyToDelete.get('everyoneTeamId');
		if (!everyoneTeamId) {
			throw this.errorHandler.error('deleteAuth', { reason: 'cannot delete company that has no "everyone" team' });
		}

		this.everyoneTeam = await this.data.teams.getById(everyoneTeamId);
		if (!this.everyoneTeam || this.everyoneTeam.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'everyone team' }); // shouldn't really happen
		}

		if (!(this.everyoneTeam.get('adminIds') || []).includes(this.request.user.id)) {
			throw this.errorHandler.error('deleteAuth', { reason: 'only admins can delete this company' });
		}
	}

	async process () {
		// here we pre-empt the restful deletion of a model out of the box ... instead
		// we handle it in a common helper function
		this.deleteCompanyHelper = new DeleteCompanyHelper({
			request: this,
			transactionContext: true,
			waitToPublishAndRevoke: true,
			everyoneTeam: this.everyoneTeam
		});
		await this.deleteCompanyHelper.deleteCompany(this.companyToDelete);

		this.responseData = { company: this.transforms.deleteCompanyOp };
	}

	async postProcess () {
		return this.deleteCompanyHelper.publishAndRevoke();x
	}
}

module.exports = DeleteCompanyRequest;
