'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class ACLTest extends CodeStreamAPITest {

	get description () {
		return `should return an error when trying to create a ${this.type} stream in a team that i\'m not a member of`;
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/streams';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createOtherRepo,
			this.makeStreamData
		], callback);
	}

	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	createOtherRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				callback();
			},
			{
				withRandomEmails: 2,
				token: this.otherUserData.accessToken
			}
		);
	}

	makeStreamData (callback) {
		this.streamFactory.getRandomStreamData(
			(error, data) => {
				if (error) { return callback(error); }
				this.data = data;
				callback();
			},
			{
				type: this.type,
				teamId: this.team._id,
				repoId: this.type === 'file' ? this.repo._id : null
			}
		);
	}
}

module.exports = ACLTest;
