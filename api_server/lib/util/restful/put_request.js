'use strict';

var Model_Updater = require('./model_updater');
var Restful_Request = require('./restful_request');

class Put_Request extends Restful_Request {

	authorize (callback) {
		return callback(false);
	}

	process (callback) {
		var updater_class = this.module.updater_class || Model_Updater;
		this.updater = new updater_class({
			module: this,
			user: this.user,
			logger: this.api,
			error_handler: this.error_handler
		}).update_model(
			this.request.body,
			(error, model) => {
				this.model_updated(error, model, callback);
			}
		);
	}

	model_updated (error, model, callback) {
		if (error) { return callback(error); }
		var model_name = this.module.model_name || 'model';
		this.response_data[model_name] = model.get_sanitized_object();
		Object.assign(
			this.response_data,
			this.updater.attach_to_response || {}
		);
		process.nextTick(callback);
	}
}

module.exports = Put_Request;
