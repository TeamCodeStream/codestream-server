'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/services/api/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class NumCommentsMessageTest extends CodeStreamMessageTest {

	get description () {
		return `members of the team should receive a message when the numComments attribute of a marker is incremented due to a reply to a post with markers`;
	}

	makeData (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,
			this.createPostCreator,
			this.createRepo,
			this.createStream,
			this.createParentPost
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

	createStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				type: 'file',
				token: this.teamCreatorData.accessToken,
				teamId: this.team._id,
				repoId: this.repo._id
			}
		);
	}

	createParentPost (callback) {
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.parentPost = response.post;
				callback();
			},
			{
				token: this.teamCreatorData.accessToken,
				streamId: this.stream._id,
				wantCodeBlocks: true
			}
		);
	}

	setChannelName (callback) {
		this.channelName = 'team-' + this.team._id;
		callback();
	}

	generateMessage (callback) {
		let postOptions = {
			token: this.postCreatorData.accessToken,
			streamId: this.stream._id,
			parentPostId: this.parentPost._id
		};
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = {
					post: response.post,
					markers: [{
						_id: this.parentPost.codeBlocks[0].markerId,
						$inc: { numComments: 1 }
					}]
				};
				callback();
			},
			postOptions
		);
	}
}

module.exports = NumCommentsMessageTest;
