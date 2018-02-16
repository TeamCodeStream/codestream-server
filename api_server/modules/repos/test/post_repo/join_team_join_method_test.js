'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class JoinTeamJoinMethodTest extends CodeStreamMessageTest {

	get description () {
		return 'when a user joins their first team by posting a repo, they should get a method indicating their join method as "Joined Team"';
	}

	// make the data needed before triggering the actual test
	makeData (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,		// create a second registered user
			this.createRepo 			// create a repo (and team)
		], callback);
	}

	// create a second registered user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create the pre-existing repo to use for the test
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				callback();
			},
			{
				withRandomEmails: 1,	// add an unregisterd user for good measure
				token: this.otherUserData.accessToken	// "other" user creates the repo
			}
		);
	}

	// set the name of the channel on which to listen for messages
	setChannelName (callback) {
		this.channelName = 'user-' + this.currentUser._id;
		callback();
	}

	// issue the request that will generate the message we want to listen for
	generateMessage (callback) {
		// this is the message we expect to see
		this.message = {
			user: {
				_id: this.currentUser._id,
				$set: {
					joinMethod: 'Joined Team'
				}
			}
		};
		// POST the same repo, which should now add the current user to the team that owns the repo,
		// this should trigger a message to the current user that their joinMethod has been set
		const data = {
			url: this.repo.url,
			firstCommitHash: this.repo.firstCommitHash
		};
		this.doApiRequest(
			{
				method: 'post',
				path: '/repos',
				data: data,
				token: this.token
			},
			callback
		);
	}

	// validate the incoming message
	validateMessage (message) {
		let subMessage = message.message;
		// ignore any other message, we're looking for an update to our own user object
		if (!subMessage.user) {
			return false;
		}
		return super.validateMessage(message);
	}
}

module.exports = JoinTeamJoinMethodTest;
