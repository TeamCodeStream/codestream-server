// provide a factory for creating random teams, for testing purposes

'use strict';

var RandomString = require('randomstring');

class RandomTeamFactory {

	constructor (options) {
		Object.assign(this, options);
	}

	// create the team by submitting a request to the server
	createTeam (data, token, callback) {
		throw 'direct team creation is deprecated';
		this.apiRequester.doApiRequest({
			method: 'post',
			path: '/teams',
			data: data,
			token: token
		}, callback);
	}

	// return a random team name
	randomName () {
		return 'team ' + RandomString.generate(12);
	}

	// get some random attributes to create a random team
	getRandomTeamData (callback) {
		let data = {
			name: this.randomName()
		};
		return callback(null, data);
	}


	// create a random team in the database
	createRandomTeam (callback, options = {}) {
		this.getRandomTeamData(
			(error, data) => {
				if (error) { return callback(error); }
				this.createTeam(data, options.token, callback);
			},
			options
		);
	}
}

module.exports = RandomTeamFactory;
