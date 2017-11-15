'use strict';

var Get_Request = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');
var Deep_Clone = require(process.env.CS_API_TOP + '/lib/util/deep_clone');
const User_Attributes = require('./user_attributes');

class Get_User_Request extends Get_Request {

	process (callback) {
		if (this.request.params.id.toLowerCase() === 'me') {
			let me_only_attributes = this.get_me_only_attributes();
			this.response_data = { user: this.user.get_sanitized_object() };
			Object.assign(this.response_data.user, me_only_attributes);
			return process.nextTick(callback);
		}
		super.process(callback);
	}

	get_me_only_attributes () {
		let me_only_attributes = {};
		let me_attributes = Object.keys(User_Attributes).filter(attribute => User_Attributes[attribute].for_me);
		me_attributes.forEach(attribute => {
			if (typeof this.user.attributes[attribute] !== 'undefined') {
				me_only_attributes[attribute] = Deep_Clone(this.user.attributes[attribute]);
			}
		});
		return me_only_attributes;
	}
}

module.exports = Get_User_Request;
