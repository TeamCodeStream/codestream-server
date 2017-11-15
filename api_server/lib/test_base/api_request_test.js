'use strict';

var GenericTest = require('./generic_test');
var HTTPSBot = require(process.env.CS_API_TOP + '/lib/util/https_bot');
var TestAPIConfig = require(process.env.CS_API_TOP + '/config/api_test');

class APIRequestTest extends GenericTest {

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

	doApiRequest (options = {}, callback = null) {
		let requestOptions = Object.assign({}, options.requestOptions || {});
		requestOptions.rejectUnauthorized = false;
		if (options.token) {
			requestOptions.headers = Object.assign({}, requestOptions.headers || {});
			requestOptions.headers.Authorization = 'Bearer ' + options.token;
		}

		const method = options.method || 'get';
		const path = options.path || '/';
		const data = options.data || null;
		HTTPSBot[method](
			TestAPIConfig.api.host,
			TestAPIConfig.api.port,
			path,
			data,
			callback,
			requestOptions
		);
	}

	apiRequest (callback) {
		this.doApiRequest(
			{
				method: this.method,
				path: this.path,
				data: this.data,
				requestOptions: this.apiRequestOptions || {},
				token: this.token
			},
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	run (callback) {
		this.apiRequest(callback);
	}
}

module.exports = APIRequestTest;
