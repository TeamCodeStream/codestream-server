// this class should be used to update post documents in the database

'use strict';

const ModelDeleter = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_deleter');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');

class MarkerDeleter extends ModelDeleter {

	get collectionName () {
		return 'markers';	// data collection to use
	}

	// convenience wrapper
	async deleteMarker (id) {
		return await this.deleteModel(id);
	}

	async preDelete () {
		// update the parent codemark to remove the marker and its file stream ID
		this.marker = await this.request.data.markers.getById(this.id);
		if (!this.marker) { throw this.request.errorHandler.error('notFound', { info: 'marker' }); }
		this.codemark = await this.request.data.codemarks.getById(this.marker.get('codemarkId'));
		if (!this.codemark) { throw this.request.errorHandler.error('notFound', { info: 'codemark' }); }
		const markerIds = this.codemark.get('markerIds') || [];
		const fileStreamIds = this.codemark.get('fileStreamIds') || [];
		const index = markerIds.indexOf(this.marker.id);
		if (index === -1) {
			return; // shouldn't happen
		}
		markerIds.splice(index, 1);
		fileStreamIds.splice(index, 1);

		const op = {
			$set: {
				markerIds: markerIds,
				fileStreamIds: fileStreamIds,
				modifiedAt: Date.now()
			}
		};
		this.updateCodemarkOp = await new ModelSaver({
			request: this.request,
			collection: this.request.data.codemarks,
			id: this.codemark.id
		}).save(op);
	}

	// set the actual op to execute to delete an op 
	setOpForDelete () {
		super.setOpForDelete();
		this.deleteOp.$set.modifiedAt = Date.now();
	}
}

module.exports = MarkerDeleter;
