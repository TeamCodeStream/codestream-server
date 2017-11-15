'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/services/api/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class NewFileStreamMessageToTeamTest extends CodeStreamMessageTest {

	get description () {
		return 'members of the team should receive a message with the stream when a post is posted to a file stream created on the fly';
	}

	makeData (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,
			this.createPostCreator,
			this.createRepo
		], callback);
	}

	createTeamCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.teamCreatorData = response;
				callback();
			}
		);
	}

	createPostCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.postCreatorData = response;
				callback();
			}
		);
	}

	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				callback();
			},
			{
				withEmails: [
					this.currentUser.email,
					this.postCreatorData.user.email
				],
				withRandomEmails: 1,
				token: this.teamCreatorData.accessToken
			}
		);
	}

	setChannelName (callback) {
		this.channelName = 'team-' + this.team._id;
		callback();
	}

	generateMessage (callback) {
		let streamOptions = {
			type: 'file',
			file: this.streamFactory.randomFile(),
			teamId: this.team._id,
			repoId: this.repo._id,
		};
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = { stream: response.stream };
				callback();
			},
			{
				token: this.postCreatorData.accessToken,
				teamId: this.team._id,
				wantLocation: true,
				stream: streamOptions
			}
		);
	}
}

module.exports = NewFileStreamMessageToTeamTest;
