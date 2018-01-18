// this class should be used to update post documents in the database

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var ModelUpdater = require(process.env.CS_API_TOP + '/lib/util/restful/model_updater');
var Post = require('./post');

class PostUpdater extends ModelUpdater {

	get modelClass () {
		return Post;	// class to use to create a post model
	}

	get collectionName () {
		return 'posts';	// data collection to use
	}

	// convenience wrapper
	updatePost (id, attributes, callback) {
		return this.updateModel(id, attributes, callback);
	}

	// get attributes that are allowed, we will ignore all others
	getAllowedAttributes () {
		return {
            string: ['text']
		};
	}

	// called before the post is actually saved
	preSave (callback) {
		BoundAsync.series(this, [
            this.getPost,           // get the post
            this.getStream,         // get the stream the post is in
            this.addEditToHistory,  // add this edit to the maintained history of edits
			super.preSave			// base-class preSave
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
                this.post = post;
                callback();
            }
        );
    }

    // get the post the stream is in
    getStream (callback) {
        this.request.data.streams.getById(
            this.post.get('streamId'),
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

    // add an edit to the maintained history of edits
    addEditToHistory (callback) {
        this.attributes.hasBeenEdited = true;
        this.attributes.editHistory = this.post.get('editHistory') || [];
        this.attributes.editHistory.push({
            editorId: this.request.user.id,
            editedAt: Date.now(),
            previousAttributes: {
                text: this.post.get('text')
            }
        });
        process.nextTick(callback);
    }

    // after the post has been saved...
    postSave (callback) {
        // this.update is what we return to the client, since the modifiedAt
        // has changed, add that
        this.update.modifiedAt = this.model.get('modifiedAt');
        callback();
    }
}

module.exports = PostUpdater;
