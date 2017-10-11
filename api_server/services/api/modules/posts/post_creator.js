'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Post = require('./post');
var Model_Creator = require(process.env.CI_API_TOP + '/lib/util/restful/model_creator');
var Stream_Creator = require(process.env.CI_API_TOP + '/services/api/modules/streams/stream_creator');

class Post_Creator extends Model_Creator {

	get model_class () {
		return Post;
	}

	get collection_name () {
		return 'posts';
	}

	create_post (attributes, callback) {
		return this.create_model(attributes, callback);
	}

	validate_attributes (callback) {
		const required_attributes = ['company_id', 'team_id'];
		let error = this.check_required(required_attributes) ||
			this.validate_stream();
		return callback(error);
	}

	validate_stream () {
		if (this.attributes.stream_id) {
			return;
		}
		if (typeof this.attributes.stream !== 'object') {
			return { stream_id: 'must provide a stream_id or a stream object' };
		}
	}

	pre_save (callback) {
		this.attributes.creator_id = this.user.id;
		Bound_Async.series(this, [
			this.check_create_stream
		], (error) => {
			if (error) { return callback(error); }
			super.pre_save(callback);
		});
	}

	check_create_stream (callback) {
		if (!this.attributes.stream) {
			return callback();
		}
		this.attributes.stream.company_id = this.attributes.company_id;
		this.attributes.stream.team_id = this.attributes.team_id;
		new Stream_Creator({
			request: this.request
		}).create_strean(
			this.attributes.stream,
			(error, stream) => {
				if (error) { return callback(error); }
				this.stream = stream;
				delete this.attributes.stream;
				process.nextTick(callback);
			}
		);
	}

	post_save (callback) {
		if (this.stream) {
			this.attach_to_response.stream = this.stream.get_sanitized_object();
		}
		process.nextTick(callback);
	}
}

module.exports = Post_Creator;
