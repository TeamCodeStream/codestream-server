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
			string: ['commitHashWhenCreated']
		};
	}

	// called before the marker is actually saved
	async preSave () {
		await this.getMarker();		// get the marker
		await this.getPost();			// get its associated post
		await this.getStream();		// get the stream the marker is from
		await this.getPostStream();	// get the stream for the post, if different
		await super.preSave();		// base-class preSave
	}

	// get the marker
	async getMarker () {
		this.marker = await this.request.data.markers.getById(this.attributes._id);
		if (!this.marker) {
			throw this.errorHandler.error('notFound', { info: 'marker' });
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
