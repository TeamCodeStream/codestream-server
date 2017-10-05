'use strict';

var API_Request = require(process.env.CI_API_TOP + '/lib/api_server/api_request.js');
//var Object_Deleter = require('./object_deleter');

class Delete_Request extends API_Request {

	authorize (callback) {
		return callback(false);
	}

	process (callback) {
		callback();
		/*
		new Object_Deleter({
			data: this.data,
			user: this.request.user,
			logger: this.request.api
		}).update_object(
			this.request.body,
			(error, object) => {
				if (error) { return callback(error); }
				this.response_data = object;
				callback();
			}
		);
		*/
	}
}

module.exports = Delete_Request;