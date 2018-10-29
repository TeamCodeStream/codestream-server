// this class should be used to update marker documents in the database

'use strict';

const ModelUpdater = require(process.env.CS_API_TOP + '/lib/util/restful/model_updater');
const Marker = require('./marker');

class MarkerUpdater extends ModelUpdater {

	get modelClass () {
		return Marker;	// class to use to create a marker model
	}

	get collectionName () {
		return 'markers';	// data collection to use
	}

	// convenience wrapper
	async updateMarker (id, attributes) {
		return await this.updateModel(id, attributes);
	}

	// get attributes that are allowed, we will ignore all others
	getAllowedAttributes () {
		return {
			string: ['commitHashWhenCreated', 'postId', 'postStreamId']
		};
	}

	// called before the marker is actually saved
	async preSave () {
		await this.getMarker();		// get the marker
		if (this.attributes.postId) {
			// if providing post ID, we assume it is a pre-created marker for third-party
			// integration, which requires special treatment
			await this.validatePostId();
		}
		else {
			await this.getPost();			// get its associated post
			await this.getStream();		// get the stream the marker is from
			await this.getPostStream();	// get the stream for the post, if different
		}
		await super.preSave();		// base-class preSave
	}

	// get the marker
	async getMarker () {
		this.marker = await this.request.data.markers.getById(this.attributes._id);
		if (!this.marker) {
			throw this.errorHandler.error('notFound', { info: 'marker' });
		}
	}

	// validate the operation
	async validatePostId () {
		if (this.marker.get('postId')) {
			throw this.errorHandler.error('validation', { info: 'marker already has a post ID' });
		}
		if (!this.marker.get('providerType')) {
			throw this.errorHandler.error('validation', { info: 'can not set postId if marker is has no providerType' });
		}
		if (!this.attributes.postStreamId) {
			throw this.errorHandler.error('parameterRequired', { info: 'postStreamId' });
		}
	}

	// get the post the marker is associated with
	async getPost () {
		this.post = await this.request.data.posts.getById(this.marker.get('postId'));
		if (!this.post) {
			throw this.errorHandler.error('notFound', { info: 'post' }); // really shouldn't happen
		}
	}

	// get the stream the marker is in
	async getStream () {
		this.stream = await this.request.data.streams.getById(this.marker.get('streamId'));
		if (!this.stream) {
			throw this.errorHandler.error('notFound', { info: 'stream' });   // really shouldn't happen
		}
	}

	// get the stream the post is from, if different from the stream the marker is from
	async getPostStream () {
		if (this.marker.get('streamId') === this.post.get('streamId')) {
			return;
		}
		this.postStream = await this.request.data.streams.getById(this.post.get('streamId'));
		if (!this.postStream) {
			throw this.errorHandler.error('notFound', { info: 'post stream' });   // really shouldn't happen
		}
	}
}

module.exports = MarkerUpdater;
