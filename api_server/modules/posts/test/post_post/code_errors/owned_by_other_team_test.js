'use strict';

const CodeErrorTest = require('./code_error_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class OwnedByOtherTeamTest extends CodeErrorTest {

	get description () {
		return 'should return an error when trying to create a code error that matches one that is already owned by another team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
			reason: 'code error exists and is owned by another team'
		};
	}

	makePostData (callback) {
		BoundAsync.series(this, [
			super.makePostData,
			this.makeOtherTeam,
			this.makeCodeError
		], callback);
	}

	makeOtherTeam (callback) {
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherTeam = response.team;
				this.otherTeamStream = response.streams[0];
				this.otherTeamToken = response.accessToken;
				callback();
			},
			{
				token: this.users[1].accessToken
			}
		);
	}

	makeCodeError (callback) {
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherCodeError = response.codeError;
				Object.assign(this.data.codeError, {
					objectId: this.otherCodeError.objectId,
					objectType: this.otherCodeError.objectType,
					accountId: this.otherCodeError.accountId
				});
				callback();
			}, 
			{
				token: this.otherTeamToken,
				streamId: this.otherTeamStream.id,
				wantCodeError: true
			}
		);
	}
}

module.exports = OwnedByOtherTeamTest;
