'use strict';

const Fetch = require('node-fetch');

class ApiRequester {

	constructor (options) {
		Object.assign(this, options);
	}

	setOptions (options) {
		Object.assign(this, options);
	}

	async doApiRequest (options) {
		const result = await this.sendApiRequest(options);
		if (result.status >= 200 && result.status < 300) {
			return result.responseData;
		} else {
			throw new Error(`api request ${options.method} ${options.path} returned ${result.status}`);
		}
	}

	async sendApiRequest (options) {
		const {
			protocol = this.protocol || 'http',
			host = this.host || 'localhost',
			port = this.port || '',
			method = 'get',
			path = '/',
			headers = {},
			data,
			strictSSL,
			bearerToken,
			noJSONInRequest
		} = options; 
		const requestOptions = options.requestOptions || {};

		if (!strictSSL) {
			requestOptions.rejectUnauthorized = false; // avoid complaints about security
		}
		if (bearerToken) {
			headers.Authorization = `Bearer ${bearerToken}`;
		}
		if (!noJSONInRequest) {
			headers['Content-Type'] = 'application/json';
		}

		let error, response;
		if (this.inMockMode) {
			response = await this.sendIpcRequest({
				method,
				path,
				data,
				headers
			}, requestOptions);
		} else {
			const portStr = port ? `:${port}` : '';
			const url = `${protocol}://${host}${portStr}${path}`
			if (data && Object.keys(data).length > 0 && method.toLowerCase() === 'get') {
				url += '?'+ Object.keys(data).map(key => {
					return `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`;
				}).join('&');
				data = undefined;
			}

			response = await Fetch(url, {
				...requestOptions,
				method: method,
				body: JSON.stringify(data),
				headers: headers
			});
		}

		const status = (response && response.status) || 0;
		let responseData;
		try {
			responseData = await response.json();
		} catch (error) {
		}
		return { response, status, responseData };
	}
}

module.exports = ApiRequester;


