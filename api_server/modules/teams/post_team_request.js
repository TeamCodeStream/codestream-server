// handle the 'POST /teams' request, to create a new team

'use strict';

const PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');

class PostTeamRequest extends PostRequest {

	async authorize () {
		// anyone can create a team at any time
	}

	// after we've processed the request....
	async postProcess () {
		await this.publishJoinMethodUpdate();
	}

	// publish a joinMethod update if the joinMethod attribute was changed for the user as
	// a result of fulfilling this request
	async publishJoinMethodUpdate () {
		if (!this.creator.joinMethodUpdate) {
			return;	// no joinMethod update to perform
		}
		const channel = 'user-' + this.user.id;
		const message = {
			requestId: this.request.id,
			user: Object.assign({}, this.creator.joinMethodUpdate, { _id: this.user.id })
		};
		try {
			await this.api.services.messager.publish(
				message,
				channel,
				{ request: this	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish joinMethod update message to user ${this.user._id}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe (module) {
		const description = PostRequest.describe(module);
		description.description = 'Creates a new team';
		description.access = 'No access rules; anyone can create a new team at any time.';
		description.input = {
			summary: description.input,
			looksLike: {
				'name*': '<Name of the team>'
			}
		};
		description.returns.summary = 'The created team object';
		return description;
	}
}

module.exports = PostTeamRequest;
