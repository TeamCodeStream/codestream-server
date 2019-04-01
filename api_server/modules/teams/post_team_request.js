// handle the 'POST /teams' request, to create a new team

'use strict';

const PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');

class PostTeamRequest extends PostRequest {

	async authorize () {
		// anyone can create a team at any time
	}

	// after we've processed the request....
	async postProcess () {
		await this.publishUserUpdate();
	}

	// publish a joinMethod update if the joinMethod attribute was changed for the user as
	// a result of fulfilling this request
	async publishUserUpdate () {
		const message = {
			requestId: this.request.id,
			user: this.transforms.userUpdate
		};
		const channel = `user-${this.user.id}`;
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish joinMethod update message to user ${this.user.id}: ${JSON.stringify(error)}`);
		}
	}

	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}
		this.responseData.company = this.transforms.createdCompany.getSanitizedObject({ request: this });
		this.responseData.streams = [
			this.transforms.createdTeamStream.getSanitizedObject({ request: this })
		];
		super.handleResponse();
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
