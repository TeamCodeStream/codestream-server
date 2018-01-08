'use strict';

var GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');

class GetTeamsRequest extends GetManyRequest {

	authorize (callback) {
		if (this.request.query.hasOwnProperty('mine')) {
			return callback();
		}
		else if (!this.request.query.ids) {
			return callback(this.errorHandler.error('parameterRequired', { info: 'ids' }));
		}
		let teamIds = decodeURIComponent(this.request.query.ids).toLowerCase().split(',');
		if (!this.user.hasTeams(teamIds)) {
			return callback(this.errorHandler.error('readAuth'));
		}
		return process.nextTick(callback);
	}

	process (callback) {
		if (this.request.query.hasOwnProperty('mine')) {
			this.ids = this.user.get('teamIds') || [];
		}
		super.process(callback);
	}
}

module.exports = GetTeamsRequest;
