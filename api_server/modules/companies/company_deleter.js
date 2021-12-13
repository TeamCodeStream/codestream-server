// this class should be used to delete company documents in the database

'use strict';

const ModelDeleter = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_deleter');

class CompanyDeleter extends ModelDeleter {

	get collectionName () {
		return 'companies'; // data collection to use
	}

	// convenience wrapper
	async deleteCompany (id) {
		return await this.deleteModel(id);
	}

	// set the actual op to execute to delete an op
	async setOpForDelete () {
		// get the company to delete
		this.companyToDelete = await this.data.companies.getById(this.request.request.params.id);
		if (!this.companyToDelete) {
			throw this.errorHandler.error('notFound', { info: 'company' });
		}

		// change the company's name to indicate this is a deactivated company
		super.setOpForDelete();
		const name = this.companyToDelete.get('name');
		const now = Date.now();
		this.deleteOp.$set.name = `${name}-deactivated${now}`;
		this.deleteOp.$set.modifiedAt = Date.now();
	}
}

module.exports = CompanyDeleter;
