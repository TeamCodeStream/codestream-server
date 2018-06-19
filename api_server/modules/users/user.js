// provides the User model for handling users

'use strict';

const CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
const UserValidator = require('./user_validator');
const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities.js');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');
const UserAttributes = require('./user_attributes');
const Path = require('path');

class User extends CodeStreamModel {

	getValidator () {
		return new UserValidator();
	}

	// right before a user is saved...
	async preSave (options) {
		if (this.attributes.email) {	// searchable email is a lowercase form for case-insensitive matching
			this.attributes.searchableEmail = this.attributes.email.toLowerCase();
		}
		// ensure all stored IDs are lowercase
		this.lowerCase('teamIds');
		this.lowerCase('companyIds');
		await super.preSave(options);
	}

	// is the user a member of all of these companies?
	hasCompanies (ids) {
		return ArrayUtilities.hasAllElements(
			this.get('companyIds') || [],
			ids
		);
	}

	// is the user a member of the given company?
	hasCompany (id) {
		return (this.get('companyIds') || []).includes(id);
	}

	// is the user a member of all these teams?
	hasTeams (ids) {
		return ArrayUtilities.hasAllElements(
			this.get('teamIds') || [],
			ids
		);
	}

	// is the user a member of the given team?
	hasTeam (id) {
		return (this.get('teamIds') || []).includes(id);
	}

	// authorize the user to "access" the given model, based on type
	async authorizeModel (modelName, id, request) {
		switch (modelName) {
		case 'company':
			return await this.authorizeCompany(id, request);
		case 'team':
			return await this.authorizeTeam(id, request);
		case 'repo':
			return await this.authorizeRepo(id, request);
		case 'stream':
			return await this.authorizeStream(id, request);
		case 'post':
			return await this.authorizePost(id, request);
		case 'marker':
			return await this.authorizeMarker(id, request);
		case 'user':
			return await this.authorizeUser(id, request);
		default:
			return false;
		}
	}

	// authorize the user to "access" a company model, based on ID
	async authorizeCompany (id) {
		return this.hasCompany(id);
	}

	// authorize the user to "access" a team model, based on ID
	async authorizeTeam (id) {
		return this.hasTeam(id);
	}

	// authorize the user to "access" a repo model, based on ID
	async authorizeRepo (id, request) {
		// a repo is authorized if the user is a member of the team that owns it
		const repo = await request.data.repos.getById(id);
		if (!repo) {
			throw request.errorHandler.error('notFound', { info: 'repo' });
		}
		const authorized = await this.authorizeTeam(
			repo.get('teamId'),
			request
		);
		return authorized ? repo : false;
	}

	// authorize the user to "access" a stream model, based on ID
	async authorizeStream (id, request) {
		// a stream is authorized depending on its type ... for file-type streams,
		// the user must be a member of the team that owns it ... for channel and
		// direct streams, the user must be an explicit member of the stream
		const stream = await request.data.streams.getById(id);
		if (!stream) {
			throw request.errorHandler.error('notFound', { info: 'stream' });
		}
		if (
			stream.get('type') !== 'file' &&
			!stream.get('isTeamStream') && 
			!stream.get('memberIds').includes(this.id)
		) {
			return false;
		}
		const authorized = await this.authorizeTeam(
			stream.get('teamId'),
			request
		);
		return authorized ? stream : false;
	}

	// authorize the user to "access" a post model, based on ID
	async authorizePost (id, request) {
		// to access a post, the user must have access to the stream it belongs to
		// (this is for read access)
		const post = await request.data.posts.getById(id);
		if (!post) {
			throw request.errorHandler.error('notFound', { info: 'post' });
		}
		const authorized = await this.authorizeStream(
			post.get('streamId'),
			request
		);
		return authorized ? post : false;
	}

	// authorize the user to "access" a marker model, based on ID
	async authorizeMarker (id, request) {
		// to access a marker, the user must have access to the stream it belongs to
		// (this is for read access)
		const marker = await request.data.markers.getById(id);
		if (!marker) {
			throw request.errorHandler.error('notFound', { info: 'marker' });
		}
		const authorized = await this.authorizeStream(
			marker.get('streamId'),
			request
		);
		return authorized ? marker : false;
	}

	// authorize the user to "access" a user model, based on ID
	async authorizeUser (id, request) {
		// user can always access their own me-object
		if (
			id === request.user.id ||
			id.toLowerCase() === 'me'
		) {
			return request.user;
		}
		// users are authorized to access only other users on their teams
		const otherUser = await request.data.users.getById(id);
		if (!otherUser) {
			throw request.errorHandler.error('notFound', { info: 'user' });
		}
		// the current user and the user they are trying to access must have
		// at least one team in common
		const authorized = ArrayUtilities.hasCommonElement(
			request.user.get('teamIds') || [],
			otherUser.get('teamIds') || []
		);
		return authorized ? otherUser : false;
	}

	// authorize the current user for access to a team, as given by IDs in the request
	async authorizeFromTeamId (input, request, options = {}) {
		if (!input.teamId) {
			throw request.errorHandler.error('parameterRequired', { info: 'teamId' });
		}
		const teamId = decodeURIComponent(input.teamId).toLowerCase();
		const authorized = await this.authorizeTeam(teamId, request);
		if (!authorized) {
			throw request.errorHandler.error(options.error || 'readAuth');
		}
	}

	// authorize the current user for access to a stream owned by a team, as given
	// by IDs in a request
	async authorizeFromTeamIdAndStreamId (input, request, options = {}) {
		let info = {};
		// team ID and stream ID are required, and the user must have access to the stream
		if (!input.teamId) {
			throw request.errorHandler.error('parameterRequired', { info: 'teamId' });
		}
		else if (typeof input.teamId !== 'string') {
			throw request.errorHandler.error('invalidParameter', { info: 'teamId' });
		}
		info.teamId = input.teamId.toLowerCase();
		if (!input.streamId) {
			throw request.errorHandler.error('parameterRequired', { info: 'streamId' });
		}
		else if (typeof input.streamId !== 'string') {
			throw request.errorHandler.error('invalidParameter', { info: 'streamId' });
		}
		info.streamId = input.streamId.toLowerCase();
		const stream = await this.authorizeStream(info.streamId, request);
		if (!stream || (options.mustBeFileStream && stream.get('type') !== 'file')) {
			throw request.errorHandler.error(options.error || 'readAuth', { reason: 'not a file stream' });
		}
		if (stream.get('teamId') !== info.teamId) {
			// stream must be owned by the given team, this anticipates sharding where this query
			// may not return a valid stream even if it exists but is not owned by the same team
			throw request.errorHandler.error('notFound', { info: 'stream' });
		}
		info.stream = stream;
		return info;
	}

	// get the me-only attributes present in this user's attributes ... me-only attributes
	// are attributes only the user those attributes belongs to can see ... other users
	// can never see them
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

	// determine if this user wants an email notification for a post in the given
	// stream, which may depend on whether they are mentioned in the post
	wantsEmail (stream, mentioned) {
		// first, look for a general email preference of 'off'
		if (this.noEmailNotificationsByPreference(mentioned)) {
			return false;
		}

		// now - for file-type streams - look for individual stream treatments for the repo,
		// paths can be muted
		const wantEmail = this.wantEmailNotificationsByTreatment(stream);
		if (typeof wantEmail === 'boolean') {
			return wantEmail;
		}

		// for non-file streams, look for individual muted setting
		return this.wantEmailNotificationsByMuted(stream);
	}

	// determine if the user has email notifications turned off by preference
	noEmailNotificationsByPreference (mentioned) {
		const preferences = this.get('preferences') || {};
		if (
			preferences &&
			(
				preferences.emailNotifications === 'off' ||
				(
					preferences.emailNotifications === 'mentions' &&
					!mentioned
				)
			)
		) {
			return true;
		}
	}

	// determine if the user has a preference for email notifications according to 
	// specific stream treatment (for file streams, to be deprecated)
	wantEmailNotificationsByTreatment (stream) {
		if (stream.get('type') !== 'file') {
			return;	// only applicable for file streams
		}
		const preferences = this.get('preferences') || {};
		const streamTreatments = typeof preferences.streamTreatments === 'object' &&
			preferences.streamTreatments[stream.get('repoId')];
		if (!streamTreatments) {
			return true;
		}

		let n = 0;	// failsafe to prevent infinite loop
		// walk up the path tree looking for any muted directories
		let path = stream.get('file');
		do {
			const starryPath = path.replace(/\./g, '*');
			if (streamTreatments[starryPath] === 'mute') {
				return false;
			}
			path = (path === '/' || path === '.') ? null : Path.dirname(path);
			n++;
		} while (path && n < 100);	// god help them if they have paths with 100 levels

		// no muted directories that are parents to this file, we are free to
		// send a notification!
		return true;
	}

	// determine if the user has a preference for email notifications according to
	// whether a stream is muted, this is for non-file streams only
	wantEmailNotificationsByMuted (stream) {
		const preferences = this.get('preferences') || {};
		const mutedStreams = preferences.mutedStreams || {};
		return !mutedStreams[stream.id];
	}

	// get a sanitized me-object ... we normally "sanitize" server-only attributes
	// out of an object, but for the user's own me-object, there are attributes that
	// they are allowed to see, but no others
	getSanitizedObjectForMe () {
		const meOnlyAttributes = this.getMeOnlyAttributes();
		const sanitizedAttributes = this.getSanitizedObject();
		return Object.assign(sanitizedAttributes, meOnlyAttributes);
	}

	// get a user's access token info by type
	getTokenInfoByType (type) {
		if (typeof this.get('accessTokens') === 'object') {
			return this.get('accessTokens')[type];
		}
	}

	// determine if this user has a token with a min issuance, and if so, return it
	getMinTokenIssuanceByType (type) {
		const tokenInfo = this.getTokenInfoByType(type);
		if (
			tokenInfo &&
			typeof tokenInfo === 'object'
		) {
			return tokenInfo.minIssuance;
		}
	}

	// validate token payload for this user
	validateTokenPayload (payload) {
		// if the payload has a type, then we expect a new-style token, with minimum issuance,
		// if this token was issued before the minimum issuance, the token is no longer valid
		// (this happens when the user changes their password, for instance)
		if (payload.type) {
			const tokenInfo = this.getTokenInfoByType(payload.type);
			if (!tokenInfo) {
				return;
			}
			if (tokenInfo.invalidated) {
				return 'token has been invalidated';
			}
			const minIssuance = tokenInfo.minIssuance;
			if (minIssuance && minIssuance > (payload.iat * 1000)) {
				return 'token has been deprecated by a more recent issuance';
			}
		}
	}

	// get the access token for a particular user by type
	getAccessToken (type = 'web') {
		if (
			typeof this.get('accessTokens') === 'object' &&
			this.get('accessTokens')[type]
		) {
			return this.get('accessTokens')[type].token;
		}
		else if (this.get('accessToken')) {
			return this.get('accessToken');
		}
	}
}

module.exports = User;
