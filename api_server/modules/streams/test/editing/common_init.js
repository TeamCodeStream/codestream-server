// base class for many tests of the "PUT /editing" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const TestTeamCreator = require(process.env.CS_API_TOP + '/lib/test_base/test_team_creator');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.createForeignTeam,		// create another team, as needed
			this.makeEditingData,		// make the data to be used during the update
			this.setAlreadyEditing, 	// set that the user is already editing the file, as needed
			this.makeEditingDataAgain	// make editing data again, as needed, if we set that we are already editing
		], callback);
	}

	setTestOptions (callback) {
		this.repoOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		callback();
	}

	// create a "foreign" team, for which the current user is not a member
	createForeignTeam (callback) {
		if (!this.wantForeignTeam) {
			return callback();
		}
		new TestTeamCreator({
			test: this,
			teamOptions: Object.assign({}, this.teamOptions, {
				creatorToken: this.users[1].accessToken
			}),
			userOptions: this.userOptions
		}).create((error, response) => {
			if (error) { return callback(error); }
			this.foreignTeam = response.team;
			callback();
		});
	}
	
	// form the data to be used in the test request
	makeEditingData (callback) {
		const editing = this.stopEditing ? false : { commitHash: this.repoFactory.randomCommitHash() };
		const fileStream = this.dontWantExistingStream ? null : this.repoStreams[0];
		this.data = {
			teamId: this.team._id,
			repoId: this.repo._id,
			streamId: fileStream ? fileStream._id : undefined,
			file: fileStream ? undefined : this.streamFactory.randomFile(),
			editing: editing
		};
		this.editedAfter = Date.now();
		callback();
	}

	// indicate the user is already editing the file, as needed for the test
	setAlreadyEditing (callback) {
		if (!this.wantAlreadyEditing) { return callback(); }
		this.alreadyEditingData = this.data;
		this.doApiRequest(
			{
				method: 'put',
				path: '/editing',
				data: this.data,
				token: this.token
			},
			callback
		);
	}

	// make editing data again, as needed, if we set that we are already editing
	makeEditingDataAgain (callback) {
		if (!this.wantAlreadyEditing) { return callback(); }
		if (this.wantStopEditing) {
			this.stopEditing = true;
		}
		this.makeEditingData(callback);
	}
}

module.exports = CommonInit;
