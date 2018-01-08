// handle a GET /companies request

'use strict';

var GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');

class GetCompaniesRequest extends GetManyRequest {

	// authorize this request according to the current user
	authorize (callback) {
		if (this.request.query.hasOwnProperty('mine')) {
			// you always have permission to get companies you are a part of
			return callback();
		}
		else if (!this.request.query.ids) {
			// can't request companies without specifying IDs
			return callback(this.errorHandler.error('parameterRequired', { info: 'ids' }));
		}
		let companyIds = decodeURIComponent(this.request.query.ids).split(',');
		if (!this.user.hasCompanies(companyIds)) {
			// user is not in at least one of these companies ... bummer dude
			return callback(this.errorHandler.error('readAuth'));
		}
		return process.nextTick(callback);
	}

	// process the request
	process (callback) {
		if (this.request.query.hasOwnProperty('mine')) {
			// get companies i am in, the GetManyRequest class knows to look at this.ids
			this.ids = this.user.get('companyIds') || [];
		}
		super.process(callback);
	}
}

module.exports = GetCompaniesRequest;
