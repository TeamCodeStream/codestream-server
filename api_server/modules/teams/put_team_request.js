// handle the PUT /teams request to update attributes of a team

'use strict';

const PutRequest = require(process.env.CS_API_TOP + '/lib/util/restful/put_request');

class PutTeamRequest extends PutRequest {

	// authorize the request for the current user
	async authorize () {
		const authorized = await this.request.user.authorizeTeam(this.request.params.id, this);
		if (!authorized) {
			throw this.errorHandler.error('updateAuth', { reason: 'only members can update this team' });
		}
	}

	// after the stream is updated...
	async postProcess () {
        // publish the team update to all members
        await this.publishTeam();
	}
	
	// publish the team update to the team channel
	async publishTeam () {
		const teamId = this.updater.model.id;
		const channel = 'team-' + teamId;
		const message = {
			team: Object.assign({}, this.updater.updatedAttributes),
			requestId: this.request.id
		};
		try {
			await this.api.services.messager.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish updated team message to team ${teamId}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe (module) {
		const description = PutRequest.describe(module);
		description.access = 'Current user must be a member of the team.';
		description.input = {
			summary: description.input,
			looksLike: {
				'name': '<Updated name of the team>'
			}
		};
		description.publishes = {
            summary: 'Publishes the updated attributes of the team object to the team channel for the team',
			looksLike: {
				team: '<@@#team object#team@@>',
			}
		};
		return description;
	}
}

module.exports = PutTeamRequest;
