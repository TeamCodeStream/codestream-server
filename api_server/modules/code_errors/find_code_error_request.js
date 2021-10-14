// handle a GET /code-errors/find request to find a single code error, by object ID

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const Indexes = require("./indexes");
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const CodeErrorPublisher = require('./code_error_publisher');

class FindCodeErrorRequest extends RestfulRequest {

	async authorize () {
		// authorization handled during processing
	}

	async process () {
		if (!await this.getCodeError()) {
			this.responseData = { notFound: true };
		} else if (!await this.authorizeCodeError()) {
			this.responseData = { unauthorized: true };
		} else {
			await this.makeFollower();
			this.responseData = { found: true };
		}
	}

	// get any code error matching the object ID and object type passed
	async getCodeError () {
		const { objectId, objectType } = this.request.query;
		if (!objectId) {
			throw this.errorHandler.error('parameterRequired', { info: 'objectId' });
		}
		if (!objectType) {
			throw this.errorHandler.error('parameterRequired', { info: 'objectType' });
		}
		this.codeError = await this.data.codeErrors.getOneByQuery(
			{ objectId, objectType },
			{ hint: Indexes.byobjectId}
		);
		return !!this.codeError;
	}

	// authorize the code error: if created by any of my teammates, i can access it
	async authorizeCodeError () {
		const teamIds = this.user.get('teamIds') || [];
		let teams;
		if (teamIds.length > 0) {
			teams = await this.data.teams.getByIds(teamIds);
		} else {
			teams = [];
		}
		return !!teams.find(team => {
			return (team.get('memberIds') || []).includes(this.codeError.get('creatorId'));
		});
	}


	// make the current user a follower of this code error
	async makeFollower () {
		if ((this.codeError.get('followerIds') || []).includes(this.user.id)) {
			return;
		}

		const now = Date.now();
		const op = {
			$addToSet: {
				followerIds: this.user.id
			},
			$set: {
				modifiedAt: now
			}
		};

		this.updateOp = await new ModelSaver({
			request: this.request,
			collection: this.data.codeErrors,
			id: this.codeError.id
		}).save(op);

		this.responseData.codeError.followerIds.push(this.user.id);
		this.responseData.codeError.modifiedAt = now;
	}

	// called after the response is returned
	async postProcess () {
		if (!this.updateOp) { return; }
		new CodeErrorPublisher({
			codeError: this.codeError,
			request: this,
			data: { codeError: this.updateOp }
		}).publishCodeError();
	}
}

module.exports = FindCodeErrorRequest;
