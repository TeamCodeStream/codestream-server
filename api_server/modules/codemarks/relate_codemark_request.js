// handle the PUT /relate-codemark/:id request to relate two codemarks
// also handles PUT /unrelate-codemark/:id

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class RelateCodemarkRequest extends RestfulRequest {

	// authorize the request for the current user
	async authorize () {
		// codemarks must be on the same team, and only a user on the team can relate them
		const codemark1Id = this.request.params.id1.toLowerCase();
		const codemark2Id = this.request.params.id2.toLowerCase();
		this.codemark1 = await this.data.codemarks.getById(codemark1Id);
		this.codemark2 = await this.data.codemarks.getById(codemark2Id);
		if (!this.codemark1) {
			throw this.errorHandler.error('notFound', { info: `codemark ${codemark1Id}` });
		}
		if (!this.codemark2) {
			throw this.errorHandler.error('notFound', { info: `codemark ${codemark2Id}` });
		}
		if (!this.user.hasTeam(this.codemark1.get('teamId'))) {
			throw this.errorHandler.error('updateAuth', { reason: 'user must be a member of the team' });
		}
		if (this.codemark1.get('teamId') !== this.codemark2.get('teamId')) {
			throw this.errorHandler.error('updateAuth', { reason: 'codemarks must be from the same team' });
		}
	}

	// process the request...
	async process () {
		this.unrelating = this.request.path.match(/^\/unrelate-codemark/i);
		this.transforms.updatedCodemarks = [];
		await this.relateCodemarks(this.codemark1, this.codemark2);
		await this.relateCodemarks(this.codemark2, this.codemark1);
	}

	// relate one codemark to another
	async relateCodemarks (codemark1, codemark2) {
		if (
			this.unrelating &&
			(codemark1.get('relatedCodemarkIds') || []).indexOf(codemark2.id) === -1 &&
			(codemark2.get('relatedCodemarkIds') || []).indexOf(codemark1.id) === -1
		) {
			return;
		}
		else if (
			!this.unrelating &&
			(codemark1.get('relatedCodemarkIds') || []).indexOf(codemark2.id) !== -1 &&
			(codemark2.get('relatedCodemarkIds') || []).indexOf(codemark1.id) !== -1
		) {
			return;
		}

		const now = Date.now();
		const relateOp = this.unrelating ? '$pull' : '$addToSet';
		const op = { 
			[relateOp]: { 
				relatedCodemarkIds: codemark2.id
			},
			$set: {
				modifiedAt: now
			}
		};
		const updateOp = await new ModelSaver({
			request: this.request,
			collection: this.data.codemarks,
			id: codemark1.id
		}).save(op);
		this.transforms.updatedCodemarks.push(updateOp);
	}

	async handleResponse () {
		if (this.gotError) {
			return await super.handleResponse();
		}
		this.responseData = { codemarks: this.transforms.updatedCodemarks };
		await super.handleResponse();
	}

	// after the codemarks are related...
	async postProcess () {
		// send message to the team channel
		const channel = 'team-' + this.codemark1.get('teamId');
		const message = Object.assign({}, this.responseData, { requestId: this.request.id });
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate
			this.warn(`Unable to publish codemark relation message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'relate-codemark',
			summary: 'Relate two codemarks',
			access: 'Codemarks must be from the same team, and the user must be a member of the team.',
			description: 'Relate two codemarks. The relationship is bi-directional, and will be set in both directions.',
			input: 'Specify each codemark ID in the request path, the order is irrelevant',
			returns: 'A codemarks array, with directives indicating how to update the codemarks',
			publishes: 'The response data will be published on the team channel for the team that owns the codemarks',
			errors: [
				'updateAuth',
				'notFound'
			]
		};
	}
}

module.exports = RelateCodemarkRequest;
