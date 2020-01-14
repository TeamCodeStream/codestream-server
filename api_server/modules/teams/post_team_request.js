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

	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}
		if (this.transforms.companyUpdate) {
			this.responseData.company = this.transforms.companyUpdate;
		}
		else {
			this.responseData.company = this.transforms.createdCompany.getSanitizedObject({ request: this });
		}
		this.responseData.streams = [
			this.transforms.createdTeamStream.getSanitizedObject({ request: this })
		];
		['plan', 'trialStartDate', 'trialEndDate', 'planStartDate'].forEach(attribute => {
			this.responseData.team[attribute] = this.responseData.company[attribute];
		});
		super.handleResponse();
	}

	// publish a joinMethod update if the joinMethod attribute was changed for the user as
	// a result of fulfilling this request
	async publishUserUpdate () {
		const message = {
			requestId: this.request.id,
			user: this.transforms.userUpdate,
			team: this.responseData.team,
			company: this.responseData.company
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

	// describe this route for help
	static describe (module) {
		const description = PostRequest.describe(module);
		description.description = 'Creates a new team, which creates an owning company unless a company to attach to is specified';
		description.access = 'No access rules; anyone can create a new team at any time. However, if you attach the team to a company, you must be a member of the company.';
		description.input = {
			summary: description.input,
			looksLike: {
				'name*': '<Name of the team>',
				'companyId': '<Attach team to this company>'
			}
		};
		description.returns.summary = 'The created team object';
		return description;
	}
}

module.exports = PostTeamRequest;
