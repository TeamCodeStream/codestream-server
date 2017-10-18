'use strict';

var Get_Many_Request = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');

class Get_Companies_Request extends Get_Many_Request {

	process (callback) {
		if (this.request.query.hasOwnProperty('mine')) {
			this.ids = this.user.get('company_ids') || [];
		}
		super.process(callback);
	}
}

module.exports = Get_Companies_Request;
