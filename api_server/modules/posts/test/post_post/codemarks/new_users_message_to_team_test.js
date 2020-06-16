'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('../common_init');
const Assert = require('assert');

class NewUsersMessageToTeamTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	constructor (options) {
		super(options);
		this.streamOptions.isTeamStream = true;
	}

	get description () {
		return 'members of the team should receive a message with the users when new users are added to the team while creating a post with a codemark';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// form the data we'll use in creating the post
	makePostData (callback) {
		super.makePostData(() => {
			this.data.addedUsers = [
				this.userFactory.randomEmail(),
				this.userFactory.randomEmail()
			];
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// it is the team channel
		this.channelName = 'team-' + this.team.id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the update, this should trigger a message to the
		// team channel with the added users
		this.updatedAt = Date.now();
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				const usersAdded = [...response.users];
				usersAdded.sort((a, b) => {
					return a.id.localeCompare(b.id);
				});
				this.message = {
					users: usersAdded,
					team: {
						_id: this.team.id,	// DEPRECATE ME
						id: this.team.id,
						$addToSet: {
							memberIds: usersAdded.map(user => user.id)
						},
						$pull: {
							removedMemberIds: usersAdded.map(user => user.id),
						},
						$set: {
							version: 4
						},
						$version: {
							before: 3,
							after: 4
						}
					}
				};
				callback();
			}
		);
	}

	validateMessage (message) {
		if (!message.message.team) { return false; }
		message.message.team.$addToSet.memberIds.sort((a, b) => {
			return a.localeCompare(b);
		});
		message.message.team.$pull.removedMemberIds.sort((a, b) => {
			return a.localeCompare(b);
		});
		Assert(message.message.team.$set.modifiedAt >= this.postCreatedAfter, 'modifiedAt not changed');
		this.message.team.$set.modifiedAt = message.message.team.$set.modifiedAt;
		return super.validateMessage(message);
	}
}

module.exports = NewUsersMessageToTeamTest;
