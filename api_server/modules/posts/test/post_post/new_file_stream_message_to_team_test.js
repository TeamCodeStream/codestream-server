'use strict';

const NewPostMessageToTeamTest = require('./new_post_message_to_team_test');

class NewFileStreamMessageToTeamTest extends NewPostMessageToTeamTest {

	get description () {
		return 'members of the team should receive a message with the stream and the post when a post is posted to a file stream created on the fly';
	}
	
	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 1;
			this.streamOptions.type = 'file';
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(() => {
			// get some data for a random stream and add that to the post options,
			// this is an attempt to create a stream "on-the-fly"
			this.streamFactory.getRandomStreamData(
				(error, data) => {
					if (error) { return callback(error); }
					delete this.data.streamId;
					this.data.stream = data;
					callback();
				},
				{
					teamId: this.team._id,
					repoId: this.repo._id,
					type: 'file'
				}
			);
		});
	}
}

module.exports = NewFileStreamMessageToTeamTest;
