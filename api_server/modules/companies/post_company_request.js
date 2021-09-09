// handle the 'POST /companies' request, to create a new company

'use strict';

const PostRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/post_request');
const TeamCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/team_creator');

class PostCompanyRequest extends PostRequest {

	async authorize () {
		// anyone can create a company at any time
	}

	// process the request
	async process () {
		this.teamCreatorClass = TeamCreator; // this avoids a circular require
		return super.process();
	}

	// handle response to the incoming request
	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}
		if (this.transforms.createdTeam) {
			this.responseData.team = this.transforms.createdTeam.getSanitizedObject({ request: this });
		}
		return super.handleResponse();
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
			company: this.responseData.company,
			team: this.responseData.team,
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
			this.warn(`Could not publish company creation message to user ${this.user.id}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe (module) {
		const description = PostRequest.describe(module);
		description.description = 'Creates a new company';
		description.access = 'No access rules; anyone can create a new company at any time.';
		description.input = {
			summary: description.input,
			looksLike: {
				'name*': '<Name of the company>'
			}
		};
		description.returns.summary = 'The created company object';
		return description;
	}
}

module.exports = PostCompanyRequest;
