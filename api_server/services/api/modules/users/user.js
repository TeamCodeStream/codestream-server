'use strict';

var CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
var UserValidator = require('./user_validator');
var ArrayUtilities = require(process.env.CS_API_TOP + '/lib/util/array_utilities.js');
var DeepClone = require(process.env.CS_API_TOP + '/lib/util/deep_clone');
const UserAttributes = require('./user_attributes');

class User extends CodeStreamModel {

	getValidator () {
		return new UserValidator();
	}

	preSave (callback, options) {
		this.attributes.searchableEmail = this.attributes.email.toLowerCase();
		super.preSave(callback, options);
	}

	hasCompanies (ids) {
		return ArrayUtilities.hasAllElements(
			this.get('companyIds') || [],
			ids
		);
	}

	hasCompany (id) {
		return (this.get('companyIds') || []).indexOf(id) !== -1;
	}

	hasTeams (ids) {
		return ArrayUtilities.hasAllElements(
			this.get('teamIds') || [],
			ids
		);
	}

	hasTeam (id) {
		return (this.get('teamIds') || []).indexOf(id) !== -1;
	}

	authorizeModel (modelName, id, request, callback) {
		switch (modelName) {
			case 'company':
				return this.authorizeCompany(id, request, callback);
			case 'team':
				return this.authorizeTeam(id, request, callback);
			case 'repo':
				return this.authorizeRepo(id, request, callback);
			case 'stream':
				return this.authorizeStream(id, request, callback);
			case 'post':
				return this.authorizePost(id, request, callback);
			case 'user':
				return this.authorizeUser(id, request, callback);
			default:
				return callback(null, false);
		}
	}

	authorizeCompany (id, request, callback) {
		return callback(null, this.hasCompany(id));
	}

	authorizeTeam (id, request, callback) {
		return callback(null, this.hasTeam(id));
	}

	authorizeRepo (id, request, callback) {
		request.data.repos.getById(
			id,
			(error, repo) => {
				if (error) { return callback(error); }
				if (!repo) {
					return callback(request.errorHandler.error('notFound', { info: 'repo' }));
				}
				this.authorizeTeam(repo.get('teamId'), request, callback);
			}
		);
	}

	authorizeStream (id, request, callback) {
		request.data.streams.getById(
			id,
			(error, stream) => {
				if (error) { return callback(error); }
				if (!stream) {
					return callback(request.errorHandler.error('notFound', { info: 'stream' }));
				}
				if (
					stream.get('type') !== 'file' &&
					stream.get('memberIds').indexOf(this.id) === -1
				) {
					return callback(null, false);
				}
				this.authorizeTeam(stream.get('teamId'), request, callback);
			}
		);
	}

	authorizePost (id, request, callback) {
		request.data.posts.getById(
			id,
			(error, post) => {
				if (error) { return callback(error); }
				if (!post) {
					return callback(request.errorHandler.error('notFound', { info: 'post' }));
				}
				this.authorizeStream(post.get('streamId'), request, callback);
			}
		);
	}

	authorizeUser (id, request, callback) {
		if (
			id === request.user.id ||
			id.toLowerCase() === 'me'
		) {
			return callback(null, true);
		}
		request.data.users.getById(
			id,
			(error, otherUser) => {
				if (error) { return callback(error); }
				if (!otherUser) {
					return callback(request.errorHandler.error('notFound', { info: 'user' }));
				}
				let authorized = ArrayUtilities.hasCommonElement(
					request.user.get('teamIds') || [],
					otherUser.get('teamIds') || []
				);
				return callback(null, authorized);
			}
		);
	}

	getMeOnlyAttributes () {
		let meOnlyAttributes = {};
		let meAttributes = Object.keys(UserAttributes).filter(attribute => UserAttributes[attribute].forMe);
		meAttributes.forEach(attribute => {
			if (typeof this.attributes[attribute] !== 'undefined') {
				meOnlyAttributes[attribute] = DeepClone(this.attributes[attribute]);
			}
		});
		return meOnlyAttributes;
	}
}

module.exports = User;
