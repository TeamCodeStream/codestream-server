// handle the POST /entities request to create a new New Relic entity

'use strict';

const PostRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/post_request');
const Indexes = require('./indexes');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');

class PostEntityRequest extends PostRequest {

	// authorize the request for the current user
	async authorize () {
		// user must be a member of the team
		let teamId = this.request.body.teamId;
		if (!teamId) {
			throw this.errorHandler.error('parameterRequired', { info: 'teamId' });
		}
		if (typeof teamId !== 'string') {
			throw this.errorHandler.error('invalidParameter', { info: 'teamId must be a string' });
		}
		teamId = teamId.toLowerCase();
		if (!await this.user.authorizeTeam(teamId, this)) {
			throw this.errorHandler.error('createAuth');
		}
		this.team = await this.data.teams.getById(teamId);
		if (!this.team || this.team.get('deactivated')) {
			throw this.errorHandler.error('notFound'); // shouldn't happen
		}
		this.request.body.companyId = this.team.get('companyId');
	}

	// process the request
	async process () {
		// does the entity already exist for this team? if so, just update it
		const entities = await this.data.entities.getByQuery(
			{
				entityId: this.request.body.entityId,
				deactivated: false
			},
			{
				hint: Indexes.byEntityId
			}
		);
		this.entity = entities.find(entity => entity.get('teamId') === this.team.id);
		if (this.entity) {
			const now = Date.now();
			const op = { 
				$set: {
					lastUserId: this.user.id,
					lastUpdated: now,
					modifiedAt: now
				}
			};
			await new ModelSaver({
				request: this,
				collection: this.data.entities,
				id: this.entity.id
			}).save(op);
		} else {
			return super.process();
		}
	}

	async handleResponse () {
		if (!this.gotError && this.entity) {
			this.responseData = { entity: this.entity.getSanitizedObject({ request: this }) };
		}
		return super.handleResponse();
	}
}

module.exports = PostEntityRequest;
