// provide a factory for creating random companies, for testing purposes

'use strict';

const RandomString = require('randomstring');

class RandomCompanyFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	// create the company by submitting a request to the server
	async createCompany (data, options = {}) {
		if (!options.token) {
			throw new Error('access token needed to create test company');
		}
		return this.apiRequester.doApiRequest({
			method: 'post',
			path: '/companies',
			data: data,
			token: options.token
		}, callback);
	}

	// return a random company name
	randomName () {
		return 'company ' + RandomString.generate(12);
	}

	// get some random attributes to create a random company
	getRandomCompanyData (data) {
		return {
			name: this.randomName(),
			...data
		};
	}

	// return a random company domain
	randomDomain () {
		return `${RandomString.generate(10)}.${RandomString.generate(3)}`;
	}

	// create a random comapny in the database
	async createRandomCompany (data = {}, options = {}) {
		data = this.getRandomCompanyData(data, options);
		return this.createCompany(data, options);
	}
}

module.exports = RandomCompanyFactory;
