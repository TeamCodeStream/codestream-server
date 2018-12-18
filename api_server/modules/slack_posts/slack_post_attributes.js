// attributes for slack-post documents/models

'use strict';

module.exports = {
	teamId: {
		type: 'id',
		required: true,
		description: 'ID of the @@#team#team@@ that owns this post'
	},
	streamId: {
		type: 'string',
		maxLength: 50,
		required: true,
		description: 'ID of the slack stream in which the post was created'
	},
	postId: {
		type: 'string',
		maxLength: 50,
		required: true,
		description: 'ID of the slack post that was created'
	},
	origin: {
		type: 'string',
		maxLength: 20,
		description: 'Origin of the post: "email" for an email reply, "slack" for a reply from Slack, "teams" for a reply from MSTeams'
	},
	parentPostId: {
		type: 'string',
		maxLength: 50,
		description: 'ID of the parent post to this post' 
	}
};
