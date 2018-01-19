// this class should be used to update post documents in the database

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var ModelDeleter = require(process.env.CS_API_TOP + '/lib/util/restful/model_deleter');
var MarkerDeleter = require(process.env.CS_API_TOP + '/modules/markers/marker_deleter');
var Post = require('./post');

class PostDeleter extends ModelDeleter {

    get modelClass () {
        return Post;    // class to use to create a post model
    }

	get collectionName () {
		return 'posts';	// data collection to use
	}

	// convenience wrapper
	deletePost (id, callback) {
		return this.deleteModel(id, callback);
	}

	// called before the delete is actually deleted
	preDelete (callback) {
		BoundAsync.series(this, [
            this.getPost,           // get the post
            this.deleteMarkers,     // delete any associated markers
            this.addEditToHistory,  // add this deactivation to the maintained history of edits
			super.preDelete			// base-class preDelete
		], callback);
	}

    // get the post
    getPost (callback) {
        this.request.data.posts.getById(
            this.attributes._id,
            (error, post) => {
                if (error) { return callback(error); }
                if (!post) {
                    return callback(this.errorHandler.error('notFound', { info: 'post' }));
                }
                if (post.get('deactivated')) {
                    return callback(this.errorHandler.error('alreadyDeleted'));
                }
                this.post = post;
                callback();
            }
        );
    }

    // delete any associated markers
    deleteMarkers (callback) {
        let codeBlocks = this.post.get('codeBlocks') || [];
        let markerIds = codeBlocks.map(codeBlock => codeBlock.markerId);
        BoundAsync.forEachLimit(
            this,
            markerIds,
            10,
            this.deleteMarker,
            callback
        );
    }

    // delete a single associated marker
    deleteMarker (markerId, callback) {
        this.markerDeleter = new MarkerDeleter({
            request: this.request
        });
        this.markerDeleter.deleteMarker(
            markerId, 
            (error, markerUpdate) => {
                if (error) { return callback(error); }
                this.attachToResponse.markers = this.attachToResponse.markers || [];
                this.attachToResponse.markers.push(markerUpdate);
                callback();
            }
        );
    }

    // add an edit to the maintained history of edits
    addEditToHistory (callback) {
        this.attributes.editHistory = this.post.get('editHistory') || [];
        this.attributes.editHistory.push({
            editorId: this.request.user.id,
            editedAt: Date.now(),
            previousAttributes: {
                deactivated: false
            }
        });
        process.nextTick(callback);
    }
}

module.exports = PostDeleter;
