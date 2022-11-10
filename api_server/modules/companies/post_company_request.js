// handle the 'POST /companies' request, to create a new company

'use strict';

const PostRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/post_request');
const TeamCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/team_creator');
const NewRelicIDPErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/newrelic_idp/errors');

class PostCompanyRequest extends PostRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(NewRelicIDPErrors);
	}
	
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

		// only return a full response if we are not in one-user-per-org (ONE_USER_PER_ORG),
		// or this was the user's first company
		if (this.transforms.additionalCompanyResponse) {
			this.log('NOTE: sending additional company response to POST /companies request');
			this.responseData = this.transforms.additionalCompanyResponse;
		} else {
			if (this.transforms.createdTeam) {
				this.responseData.team = this.transforms.createdTeam.getSanitizedObject({ request: this });
				this.responseData.team.companyMemberCount = 1;
			}
			if (this.transforms.createdTeamStream) {
				this.responseData.streams = [
					this.transforms.createdTeamStream.getSanitizedObject({ request: this })
				]
			}
		}
		return super.handleResponse();
	}

	// after we've processed the request....
	async postProcess () {
		// only necessary when not in ONE_USER_PER_ORG, once we have moved fully to that, 
		// this can be completely removed
		if (!this.transforms.additionalCompanyResponse) {
			await this.publishUserUpdate();
		}
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
