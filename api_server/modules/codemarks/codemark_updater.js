// this class should be used to update codemark documents in the database

'use strict';

const ModelUpdater = require(process.env.CS_API_TOP + '/lib/util/restful/model_updater');
const Codemark = require('./codemark');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

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
		if (this.attributes.postId) {
			// if providing post ID, we assume it is a pre-created codemark for third-party
			// integration, which requires special treatment
			await this.validatePostId();
			await this.updateMarkers();
		}
		await super.preSave();		// base-class preSave
	}

	// get the codemark
	async getCodemark () {
		this.codemark = await this.request.data.codemarks.getById(this.attributes._id);
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
		if (!this.attributes.streamId) {
			throw this.errorHandler.error('parameterRequired', { info: 'streamId' });
		}
		this.attributes.providerType = this.codemark.get('providerType');
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
}

module.exports = CodemarkUpdater;
