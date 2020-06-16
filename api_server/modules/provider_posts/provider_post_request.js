// handle the POST /provider-posts/:provider request to create a new "provider" post

'use strict';

const PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');

class ProviderPostRequest extends PostRequest {

	// authorize the request for the current user
	async authorize () {
		await this.user.authorizeFromTeamId (this.request.body, this, { error: 'createAuth' });
	}

	// after the response is returned....
	async postProcess () {
		// send the update to the totalPosts count for the user on the user's me-channel
		const channel = `user-${this.user.id}`;
		const message = {
			user: Object.assign(
				{
					id: this.user.id,
					_id: this.user.id // DEPRECATE ME
				},
				this.creator.updateOp
			),
			requestId: this.request.id
		};
	
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate
			this.warn(`Unable to publish bump posts message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe (module) {
		const description = PostRequest.describe(module);
		description.description = 'Creates a "shared" provider post (for tracking purposes only, no content is accepted)';
		description.access = 'The current user must be a member of the team.';
		description.input = {
			summary: description.input,
			looksLike: {
				'teamId*': '<ID of the team associated with the provider account in which the provider post is being created>',
				'streamId*': '<ID of the provider stream in which the provider post is being created>',
				'postId*': '<ID of the provider post>',
				'parentPostId': '<ID of the parent provider post>'
			}
		};
		description.returns.summary = 'The provider-post object created';
		return description;
	}
}

module.exports = ProviderPostRequest;
