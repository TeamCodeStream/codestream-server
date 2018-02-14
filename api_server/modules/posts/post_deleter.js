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
            this.getParentPost,     // get the parent post (if this is a reply)
            this.updateNumComments, // update numComments field in a parent marker, if needed
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

    // get the parent post, if the deleted post is a reply
    getParentPost (callback) {
        if (!this.post.get('parentPostId')) {
            return callback();
        }
        this.request.data.posts.getById(
            this.post.get('parentPostId'),
            (error, parentPost) => {
                if (error) { return callback(error); }
                this.parentPost = parentPost;
                callback();
            }
        );
    }

    // if the deleted post is a reply to a post with code block(s),
    // update the numComments attribute of the associated marker(s)
    updateNumComments (callback) {
        if (!this.parentPost || !(this.parentPost.get('codeBlocks') instanceof Array)) {
            return callback();
        }
        let markerIds = this.parentPost.get('codeBlocks').map(codeBlock => codeBlock.markerId);
        this.attachToResponse.markers = [];
        BoundAsync.forEachLimit(
            this,
            markerIds,
            10,
            this.updateNumCommentsForMarker,
            callback
        );
    }

    // if the deleted post is a reply to a post with code block(s),
    // update the numComments attribute of the given marker
    updateNumCommentsForMarker (markerId, callback) {
        if (!markerId) { return callback(); }
        // update the database, and also save the marker op for publishing to clients
        let op = { $inc: { numComments: -1 } };
        let marker = Object.assign({}, { _id: markerId }, op);
        this.attachToResponse.markers.push(marker);
        this.request.data.markers.applyOpById(
            markerId,
            op,
            callback
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
