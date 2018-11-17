// this class should be used to update codemark documents in the database

'use strict';

const ModelUpdater = require(process.env.CS_API_TOP + '/lib/util/restful/model_updater');
const Codemark = require('./codemark');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

class CodemarkUpdater extends ModelUpdater {

	get modelClass () {
		return Codemark;	// class to use to create a codemark model
	}

	get collectionName () {
		return 'codemarks';	// data collection to use
	}

	// convenience wrapper
	async updateCodemark (id, attributes) {
		return await this.updateModel(id, attributes);
	}

	// get attributes that are allowed, we will ignore all others
	getAllowedAttributes () {
		return {
			string: ['postId', 'streamId', 'status', 'text', 'title', 'color'],
			'array(string)': ['assignees']
		};
	}

	// called before the codemark is actually saved
	async preSave () {
		await this.getCodemark();		// get the codemark
		if (this.attributes.postId || this.attributes.streamId) {
			// if providing post ID, we assume it is a pre-created codemark for third-party
			// integration, which requires special treatment
			await this.validatePostId();
			await this.updateMarkers();
		}
		await this.preValidate();
		await this.validateAssignees();
		await super.preSave();		// base-class preSave
	}

	// get the codemark
	async getCodemark () {
		this.codemark = await this.request.data.codemarks.getById(this.attributes.id);
		if (!this.codemark) {
			throw this.errorHandler.error('notFound', { info: 'codemark' });
		}
	}

	// validate the operation
	async validatePostId () {
		if (this.codemark.get('postId')) {
			throw this.errorHandler.error('validation', { info: 'codemark already has a post ID' });
		}
		if (!this.codemark.get('providerType')) {
			throw this.errorHandler.error('validation', { info: 'can not set postId if codemark is has no providerType' });
		}
		if (!this.attributes.streamId || !this.attributes.postId) {
			throw this.errorHandler.error('parameterRequired', { info: 'streamId and postId' });
		}
	}

	// if postID and stream ID are being set, set them on any referenced markers as well
	async updateMarkers () {
		if (!this.codemark.get('markerIds')) {
			return;
		}
		this.transforms.markerUpdates = [];
		this.markers = await this.request.data.markers.getByIds(this.codemark.get('markerIds'));
		await Promise.all(this.markers.map(async marker => {
			await this.updateMarker(marker);
		}));
	}

	// update a marker with post ID and stream ID
	async updateMarker (marker) {
		const op = {
			$set: {
				postStreamId: this.attributes.streamId,
				postId: this.attributes.postId,
				modifiedAt: Date.now()
			}
		};
		const markerUpdate = await new ModelSaver({
			request: this.request,
			collection: this.request.data.markers,
			id: marker.id
		}).save(op);
		this.transforms.markerUpdates.push(markerUpdate);
	}

	// pre-validate the incoming attributes before saving
	async preValidate () {
		// since validation is dependent on the type of codemark, we can't let the
		// generic ModelUpdater do the full validation, so create a temporary model
		// and run the validation against that
		const tempAttributes = DeepClone(this.codemark.attributes);
		Object.assign(tempAttributes, this.attributes);
		const tempModel = new Codemark(tempAttributes);
		try {
			await tempModel.preSave();
		}
		catch (error) {
			throw this.request.errorHandler.error('validation', { info: error });
		}
	}

	// if this is an issue, validate the assignees ... all users must be on the team
	async validateAssignees () {
		if (this.codemark.get('type') !== 'issue') {
			// assignees only valid for issues
			delete this.attributes.assignees;
			return;
		}
		else if (this.codemark.get('providerType') || !this.attributes.assignees) {
			// if using a third-party provider, we don't care what goes in there
			return;
		}

		const users = await this.data.users.getByIds(
			this.attributes.assignees,
			{
				fields: ['id', 'teamIds'],
				noCache: true
			}
		);
		const teamId = this.codemark.get('teamId');
		if (
			users.length !== this.attributes.assignees.length ||
			users.find(user => !user.hasTeam(teamId))
		) {
			throw this.errorHandler.error('validation', { info: 'assignees must contain only users on the team' });
		}
	}

}

module.exports = CodemarkUpdater;
