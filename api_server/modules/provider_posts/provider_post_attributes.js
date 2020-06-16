// attributes for provider-post documents/models

'use strict';

module.exports = {
	provider: {
		type: 'string',
		required: true,
		maxLength: 20,
		description: 'The provider that owns this post (eg. "slack" or "msteams"'
	},
	teamId: {
		type: 'id',
		required: true,
		description: 'ID of the @@#team#team@@ that owns this post'
	},
	streamId: {
		type: 'string',
		maxLength: 150,
		required: true,
		description: 'ID of the provider stream in which the post was created'
	},
	postId: {
		type: 'string',
		maxLength: 150,
		required: true,
		description: 'ID of the provider post that was created'
	},
	origin: {
		type: 'string',
		maxLength: 20,
		description: 'Origin of the post: "email" for an email reply, "slack" for a reply from Slack, "msteams" for a reply from MSTeams'
	},
	parentPostId: {
		type: 'string',
		maxLength: 150,
		description: 'ID of the parent post to this post' 
	}
};
