'use strict';

const CodeErrorExistsTest = require('./code_error_exists_test');

class CodeErrorWrongTeamTest extends CodeErrorExistsTest {

	get description () {
		return 'should create a new code error when creating a code error with identical object ID and object type, but in a different team';
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		// replace the team and stream ID of the post we are going to create with those of hte other team
		super.makePostData(() => {
			this.createOtherTeam(error => {
				if (error) { return callback(error); }
				this.data.teamId = this.otherTeamResponse.team.id;
				this.data.streamId = this.otherTeamResponse.streams[0].id;
				this.codeErrorInDifferentTeam = {
					teamId: this.data.teamId,
					streamId: this.data.streamId
				};
				this.expectedTeamId = this.data.teamId;
				callback();
			});
		});
	}

	createOtherTeam (callback) {
		this.teamFactory.createRandomTeam(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherTeamResponse = response;
				callback();
			},
			{
				token: this.users[0].accessToken 
			}
		);
	}
}

module.exports = CodeErrorWrongTeamTest;
