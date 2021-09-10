// provide a factory for creating random companies, for testing purposes

'use strict';

var RandomString = require('randomstring');

class RandomCompanyFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	// create the company by submitting a request to the server
	createCompany (data, token, callback) {
		this.apiRequester.doApiRequest({
			method: 'post',
			path: '/companies',
			data: data,
			token: token
		}, callback);
	}

	// return a random company name
	randomName () {
		return 'company ' + RandomString.generate(12);
	}

	// get some random attributes to create a random company
	getRandomCompanyData (callback) {
		let data = {
			name: this.randomName()
		};
		return callback(null, data);
	}

	// return a random company domain
	randomDomain () {
		return `${RandomString.generate(10)}.${RandomString.generate(3)}`;
	}

	// create a random comapny in the database
	createRandomCompany (callback, options = {}) {
		this.getRandomCompanyData(
			(error, data) => {
				if (error) { return callback(error); }
				this.createCompany(data, options.token, callback);
			},
			options
		);
	}
}

module.exports = RandomCompanyFactory;
