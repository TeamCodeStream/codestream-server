// this class should be used to update codemark documents in the database

'use strict';

const ModelDeleter = require(process.env.CS_API_TOP + '/lib/util/restful/model_deleter');
const MarkerDeleter = require(process.env.CS_API_TOP + '/modules/markers/marker_deleter');

class CodemarkDeleter extends ModelDeleter {

	get collectionName () {
		return 'codemarks';	// data collection to use
	}

	// convenience wrapper
	async deleteCodemark (id) {
		return await this.deleteModel(id);
	}

	// set the actual op to execute to delete an op 
	setOpForDelete () {
		super.setOpForDelete();
		this.deleteOp.$set.modifiedAt = Date.now();
	}

	// called before the delete is actually deleted
	async preDelete () {
		await this.getCodemark();		// get the codemark
		await this.deletePost();		// delete the associated post
		await this.deleteMarkers();		// delete any associated markers
		await super.preDelete();		// base-class preDelete
	}

	// get the codemark
	async getCodemark () {
		this.codemark = await this.request.data.codemarks.getById(this.id);
		if (!this.codemark) {
			throw this.errorHandler.error('notFound', { info: 'post' });
		}
		if (this.codemark.get('deactivated')) {
			throw this.errorHandler.error('alreadyDeleted');
		}
	}

	// delete its associated post, unless from third-party provider
	async deletePost () {
		if (
			!this.request.postDeleter || 
			this.codemark.get('providerType') || 
			!this.codemark.get('postId')
		) {
			return;
		}
		this.transforms.deletedPost = await this.request.postDeleter.deletePost(this.codemark.get('postId'));
	}

	// delete any associated markers
	async deleteMarkers () {
		const markerIds = this.codemark.get('markerIds') || [];
		if (markerIds.length === 0) {
			return;
		}
		this.transforms.deletedMarkers = [];
		await Promise.all(markerIds.map(async markerId => {
			await this.deleteMarker(markerId);
		}));
	}

	// delete a single associated marker
	async deleteMarker (markerId) {
		const deletedMarker = await new MarkerDeleter({
			request: this.request
		}).deleteMarker(markerId);
		this.transforms.deletedMarkers.push(deletedMarker);
	}
}

module.exports = CodemarkDeleter;
