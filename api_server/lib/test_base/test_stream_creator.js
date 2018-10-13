'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class TestStreamCreator {

	constructor (options) {
		Object.assign(this, options);
	}

	create (callback) {
		BoundAsync.series(this, [
			this.createStream,
			this.createPosts
		], error => {
			if (error) { return callback(error); }
			callback(null, {
				stream: this.stream,
				postData: this.postData
			});
		});
	}

	createStream (callback) {
		if (typeof this.streamOptions.creatorIndex !== 'number' || !this.streamOptions.type) {
			return callback();
		}
		const streamOptions = {
			type: this.streamOptions.type,
			privacy: this.streamOptions.privacy,
			isTeamStream: this.streamOptions.isTeamStream,
			teamId: this.team._id
		};
		if (this.streamOptions.type === 'file' && this.repo) {
			streamOptions.repoId = this.repo._id;
		}
		streamOptions.token = this.users[this.streamOptions.creatorIndex].accessToken;
		const hasMembers = (
			streamOptions.type === 'direct' ||
			(
				streamOptions.type === 'channel' && 
				!this.streamOptions.isTeamStream
			)
		);
		if (hasMembers) {
			if (this.streamOptions.members === 'all') {
				streamOptions.memberIds = this.users.map(u => u.user._id);
			}
			else if (this.streamOptions.members instanceof Array) {
				streamOptions.memberIds = [];
				this.streamOptions.members.forEach(userIndex => {
					streamOptions.memberIds.push(this.users[userIndex].user._id);
				});
			}
		}
		this.test.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			streamOptions
		);
	}

	createPosts (callback) {
		this.postData = [];
		if (
			typeof this.postOptions.creatorIndex !== 'number' && 
			!(this.postOptions.creatorIndex instanceof Array)
		) {
			return callback();
		}
		BoundAsync.timesSeries(
			this,
			this.postOptions.numPosts || 0,
			this.createPost,
			callback
		);
	}

	createPost (n, callback) {
		const postOptions = {
			streamId: this.stream._id,
		};
		if (this.postOptions.wantCodeBlock) {
			postOptions.wantCodeBlocks = 1;
			postOptions.codeBlockStream = {
				file: this.test.streamFactory.randomFile(),
				remotes: [this.test.repoFactory.randomUrl()]
			};
		}
		const creatorIndex = this.postOptions.creatorIndex instanceof Array ? 
			this.postOptions.creatorIndex[n] :
			this.postOptions.creatorIndex;
		postOptions.token = this.users[creatorIndex || 0].accessToken;
		this.test.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.postData.push(response);
				callback();
			},
			postOptions
		);
	}

}

module.exports = TestStreamCreator;

