'use strict';

var Generic_Test = require('./generic_test');
var HTTPS_Bot = require(process.env.CI_API_TOP + '/lib/util/https_bot');
var Test_API_Config = require(process.env.CI_API_TOP + '/config/api_test');

class API_Request_Test extends Generic_Test {

	get method () {
		return this._method || 'get';
	}

	set method (method) {
		this._method = method;
	}

	get path () {
		return this._path || '/';
	}

	set path (path) {
		this._path = path;
	}

	do_api_request (options = {}, callback = null) {
		let request_options = Object.assign({}, options.request_options || {});
		request_options.rejectUnauthorized = false;
		if (options.token) {
			request_options.headers = Object.assign({}, request_options.headers || {});
			request_options.headers.Authorization = 'Bearer ' + options.token;
		}

		const method = options.method || 'get';
		const path = options.path || '/';
		const data = options.data || null;
		HTTPS_Bot[method](
			Test_API_Config.api.host,
			Test_API_Config.api.port,
			path,
			data,
			callback,
			request_options
		);
	}

	api_request (callback) {
		this.do_api_request(
			{
				method: this.method,
				path: this.path,
				data: this.data,
				request_options: this.api_request_options || {},
				token: this.token
			},
			(error, response) => {
				this.check_response(error, response, callback);
			}
		);
	}

	run (callback) {
		this.api_request(callback);
	}
}

module.exports = API_Request_Test;
