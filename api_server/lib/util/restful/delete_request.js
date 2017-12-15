// fulfill a restful DELETE request ... this is not yet implemented

'use strict';

var APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');
//var ObjectDeleter = require('./object_deleter');

class DeleteRequest extends APIRequest {

	authorize (callback) {
		return callback(false);
	}

	process (callback) {
		callback();
		/*
		new ObjectDeleter({
			data: this.data,
			user: this.request.user,
			logger: this.request.api
		}).updateObject(
			this.request.body,
			(error, object) => {
				if (error) { return callback(error); }
				this.responseData = object;
				callback();
			}
		);
		*/
	}
}

module.exports = DeleteRequest;
