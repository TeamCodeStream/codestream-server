'use strict';

var GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');

class GetCompaniesRequest extends GetManyRequest {

	authorize (callback) {
		if (this.request.query.hasOwnProperty('mine')) {
			return callback();
		}
		else if (!this.request.query.ids) {
			return callback(this.errorHandler.error('parameterRequired', { info: 'ids' }));
		}
		let companyIds = decodeURIComponent(this.request.query.ids).split(',');
		if (!this.user.hasCompanies(companyIds)) {
			return callback(this.errorHandler.error('readAuth'));
		}
		return process.nextTick(callback);
	}

	process (callback) {
		if (this.request.query.hasOwnProperty('mine')) {
			this.ids = this.user.get('companyIds') || [];
		}
		super.process(callback);
	}
}

module.exports = GetCompaniesRequest;
