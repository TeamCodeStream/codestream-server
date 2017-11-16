'use strict';

var GetRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');
var DeepClone = require(process.env.CS_API_TOP + '/lib/util/deep_clone');
const UserAttributes = require('./user_attributes');

class GetUserRequest extends GetRequest {

	process (callback) {
		if (this.request.params.id.toLowerCase() === 'me') {
			let meOnlyAttributes = this.getMeOnlyAttributes();
			this.responseData = { user: this.user.getSanitizedObject() };
			Object.assign(this.responseData.user, meOnlyAttributes);
			return process.nextTick(callback);
		}
		super.process(callback);
	}

	getMeOnlyAttributes () {
		let meOnlyAttributes = {};
		let meAttributes = Object.keys(UserAttributes).filter(attribute => UserAttributes[attribute].forMe);
		meAttributes.forEach(attribute => {
			if (typeof this.user.attributes[attribute] !== 'undefined') {
				meOnlyAttributes[attribute] = DeepClone(this.user.attributes[attribute]);
			}
		});
		return meOnlyAttributes;
	}
}

module.exports = GetUserRequest;
