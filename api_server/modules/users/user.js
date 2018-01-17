'use strict';

var CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
var UserValidator = require('./user_validator');
var ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities.js');
var DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');
const UserAttributes = require('./user_attributes');

class User extends CodeStreamModel {

	getValidator () {
		return new UserValidator();
	}

	preSave (callback, options) {
		this.attributes.searchableEmail = this.attributes.email.toLowerCase();
		this.lowerCase('teamIds');
		this.lowerCase('companyIds');
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
			case 'marker':
				return this.authorizeMarker(id, request, callback);
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
				this.authorizeTeam(
					repo.get('teamId'),
					request,
					(error, authorized) => {
						callback(error, authorized ? repo : false);
					}
				);
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
				this.authorizeTeam(
					stream.get('teamId'),
					request,
					(error, authorized) => {
						callback(error, authorized ? stream : false);
					}
				);
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
				this.authorizeStream(
					post.get('streamId'),
					request,
					(error, authorized) => {
						callback(error, authorized ? post : false);
					}
				);
			}
		);
	}

	authorizeMarker (id, request, callback) {
		request.data.markers.getById(
			id,
			(error, marker) => {
				if (error) { return callback(error); }
				if (!marker) {
					return callback(request.errorHandler.error('notFound', { info: 'marker' }));
				}
				this.authorizeStream(
					marker.get('streamId'),
					request,
					(error, authorized) => {
						callback(error, authorized ? marker : false);
					}
				);
			}
		);
	}

	authorizeUser (id, request, callback) {
		if (
			id === request.user.id ||
			id.toLowerCase() === 'me'
		) {
			return callback(null, request.user);
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
				return callback(null, authorized ? otherUser : false);
			}
		);
	}

	// authorize the current user for access to a team, as given by IDs in the request
	authorizeFromTeamId (input, request, callback, options = {}) {
		if (!input.teamId) {
			return callback(request.errorHandler.error('parameterRequired', { info: 'teamId' }));
		}
		let teamId = decodeURIComponent(input.teamId).toLowerCase();
		this.authorizeTeam(
			teamId,
			request,
			(error, authorized) => {
				if (error) { return callback(error); }
				if (!authorized) {
					return callback(request.errorHandler.error(options.error || 'readAuth'));
				}
				return process.nextTick(callback);
			}
		);
	}

	// authorize the current user for access to a stream owned by a team, as given
	// by IDs in a request
	authorizeFromTeamIdAndStreamId (input, request, callback, options = {}) {
		let info = {};
		// team ID and stream ID are required, and the user must have access to the stream
		if (!input.teamId) {
			return callback(request.errorHandler.error('parameterRequired', { info: 'teamId' }));
		}
		else if (typeof input.teamId !== 'string') {
			return callback(request.errorHandler.error('invalidParameter', { info: 'teamId' }));
		}
		info.teamId = input.teamId.toLowerCase();
		if (!input.streamId) {
			return callback(request.errorHandler.error('parameterRequired', { info: 'streamId' }));
		}
		else if (typeof input.streamId !== 'string') {
			return callback(request.errorHandler.error('invalidParameter', { info: 'streamId' }));
		}
		info.streamId = input.streamId.toLowerCase();
		this.authorizeStream(info.streamId, request, (error, stream) => {
			if (error) { return callback(error); }
			if (!stream || (options.mustBeFileStream && stream.get('type') !== 'file')) {
				return callback(request.errorHandler.error(options.error || 'readAuth', { reason: 'not a file stream' }));
			}
			if (stream.get('teamId') !== info.teamId) {
				// stream must be owned by the given team, this anticipates sharding where this query
				// may not return a valid stream even if it exists but is not owned by the same team
				return callback(request.errorHandler.error('notFound', { info: 'stream' }));
			}
			info.stream = stream;
			process.nextTick(() => { callback(null, info); });
		});
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

	wantsEmail (streamId, mentioned) {
		let preferences = this.get('preferences') || {};
		let emailPreference = preferences.emailNotifications || 'on';
		if (typeof emailPreference === 'object') {
			let generalPreference = emailPreference.general || 'on';
			emailPreference = emailPreference[streamId] || generalPreference;
		}
		switch (emailPreference) {
			case 'off':
				return false;
			case 'mentions':
				return mentioned;
			default:
				return true;
		}
	}
}

module.exports = User;
