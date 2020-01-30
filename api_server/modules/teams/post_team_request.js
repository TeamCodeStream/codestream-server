// handle the 'POST /teams' request, to create a new team

'use strict';

const PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities');

class PostTeamRequest extends PostRequest {

	async authorize () {
		// anyone can create a team at any time
	}

	// after we've processed the request....
	async postProcess () {
		await this.publishUserUpdate();
	}

	// handle returning the response to the client
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
			this.responseData.team[attribute] = this.creator.company.get(attribute);
		});
		this.responseData.team.companyMemberCount = await this.getCompanyMemberCount(this.creator.company);
		super.handleResponse();
	}

	// get the number of members across the whole company, which we return with the team
	async getCompanyMemberCount (company) {
		const teams = await this.data.teams.getByIds(company.get('teamIds') || []);
		const memberIds = teams.reduce((memberIds, team) => {
			memberIds = ArrayUtilities.union(memberIds, team.get('memberIds') || []);
			return memberIds;
		}, [this.user.id]);
		return memberIds.length;
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
