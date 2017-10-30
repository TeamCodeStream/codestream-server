'use strict';

var Restful_Request = require('./restful_request');
var Model_Creator = require('./model_creator');

class Post_Request extends Restful_Request {

	process (callback) {
		let creator_class = this.module.creator_class || Model_Creator;
		this.creator = new creator_class({
			request: this
		});
		this.creator.create_model(
			this.request.body,
			(error, model) => {
				this.model_created(error, model, callback);
			}
		);
	}

	model_created (error, model, callback) {
		if (error) { return callback(error); }
		const model_name = this.module.model_name || 'model';
		this.response_data[model_name] = model.get_sanitized_object();
		Object.assign(
			this.response_data,
			this.creator.attach_to_response || {}
		);
		process.nextTick(callback);
	}
}

module.exports = Post_Request;
