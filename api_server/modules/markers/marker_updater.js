// this class should be used to update marker documents in the database

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var ModelUpdater = require(process.env.CS_API_TOP + '/lib/util/restful/model_updater');
var Marker = require('./marker');

class MarkerUpdater extends ModelUpdater {

	get modelClass () {
		return Marker;	// class to use to create a marker model
	}

	get collectionName () {
		return 'markers';	// data collection to use
	}

	// convenience wrapper
	updateMarker (id, attributes, callback) {
		return this.updateModel(id, attributes, callback);
	}

	// get attributes that are allowed, we will ignore all others
	getAllowedAttributes () {
		return {
			string: ['commitHashWhenCreated']
		};
	}

	// called before the marker is actually saved
	preSave (callback) {
		BoundAsync.series(this, [
            this.getMarker,         // get the marker
            this.getPost,           // get its associated post
			this.getStream,         // get the stream the marker is from
            this.getPostStream,     // get the stream for the post, if different
			super.preSave			// base-class preSave
		], callback);
	}

	// get the marker
	getMarker (callback) {
		this.request.data.markers.getById(
			this.attributes._id,
			(error, marker) => {
				if (error) { return callback(error); }
				if (!marker) {
					return callback(this.errorHandler.error('notFound', { info: 'marker' }));
				}
				this.marker = marker;
				callback();
			}
		);
	}

    // get the post the marker is associated with
    getPost (callback) {
        this.request.data.posts.getById(
            this.marker.get('postId'),
            (error, post) => {
                if (error) { return callback(error); }
                if (!post) {
                    return callback(this.errorHandler.error('notFound', { info: 'post' })); // really shouldn't happen
                }
                this.post = post;
                callback();
            }
        );
    }

	// get the stream the marker is in
	getStream (callback) {
		this.request.data.streams.getById(
			this.marker.get('streamId'),
			(error, stream) => {
				if (error) { return callback(error); }
				if (!stream) {
					return callback(this.errorHandler.error('notFound', { info: 'stream' }));   // really shouldn't happen
				}
				this.stream = stream;
				callback();
			}
		);
	}

    // get the stream the post is from, if different from the stream the marker is from
    getPostStream (callback) {
        if (this.marker.get('streamId') === this.post.get('streamId')) {
            return callback();
        }
        this.request.data.streams.getById(
            this.post.get('streamId'),
            (error, stream) => {
                if (error) { return callback(error); }
                if (!stream) {
                    return callback(this.errorHandler.error('notFound', { info: 'post stream' }));   // really shouldn't happen
                }
                this.postStream = stream;
                callback();
            }
        );
    }
}

module.exports = MarkerUpdater;
