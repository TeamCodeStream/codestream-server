// base class for many tests of the "PUT /editing" requests

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,		// create another registered user
			this.createRandomRepo,		// create a random repo (and team) for the test
			this.createRandomStream,	// create a stream in that repo, as needed
			this.createSecondRepo,		// create another random repo, as needed
			this.makeEditingData,		// make the data to be used during the update
			this.setAlreadyEditing, 	// set that the user is already editing the file, as needed
			this.makeEditingDataAgain	// make editing data again, as needed, if we set that we are already editing
		], callback);
	}

	// create another registered user (in addition to the "current" user)
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a random repo to use for the test
	createRandomRepo (callback) {
		const withEmails = this.withoutMeOnTeam ? [] : [this.currentUser.email];	// include current user unless specifired
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				withEmails: withEmails,
				withRandomEmails: 1,	// another user for good measure
				token: this.otherUserData.accessToken	// the "other user" is the repo and team creator
			}
		);
	}

	// create a random stream to use for the test
	createRandomStream (callback) {
		if (this.dontWantExistingStream) { return callback(); }
        let type = this.type || 'file';
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
            {
                type: type,
    			teamId: this.team._id,	// create the stream in the team we already created
                repoId: type === 'file' ? this.repo._id : undefined,  // file-type streams must have repoId
    			token: this.otherUserData.accessToken	// the "other user" is the stream creator
            }
		);
	}

	// create a second random repo to use for the test, as needed
	createSecondRepo (callback) {
		if (!this.wantSecondRepo) { return callback(); }	// only if specified for the test
		const withEmails = [this.currentUser.email];	// include current user
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherRepo = response.repo;
				if (!this.secondRepoHasSameTeamId) {
					this.otherTeam = response.team;
				}
				callback();
			},
			{
				withEmails: withEmails,
				token: this.otherUserData.accessToken,	// the "other user" is the repo and team creator
				teamId: this.secondRepoHasSameTeamId ? this.team._id : undefined
			}
		);
	}

	// form the data to be used in the test request
	makeEditingData (callback) {
		const editing = this.stopEditing ? false : { commitHash: this.repoFactory.randomCommitHash() };
        this.data = {
			teamId: this.team._id,
			repoId: this.repo._id,
			streamId: this.stream ? this.stream._id : undefined,
			file: this.stream ? undefined : this.streamFactory.randomFile(),
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
