// handle the "GET /e/" request to jump from a CodeError into CodeStream

'use strict';
const CodemarkLinkIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/codemarks/codemark_link_indexes');
const Crypto = require('crypto');
const MomentTimezone = require('moment-timezone');
const WebRequestBase = require('./web_request_base');

class LinkCodeErrorRequest extends WebRequestBase {
	async authorize () {
	 // handled below
	}

	async process () {
		console.warn('DECODING ' + this.request.params.teamId);
		this.teamId = this.decodeLinkId(this.request.params.teamId);
		console.warn('this.teamId=' + this.teamId);
	  	(await this.checkAuthentication()) &&
		(await this.getCodeErrorLink()) &&
		(await this.getCodeError()) && 
		(await this.render());
	}

	async checkAuthentication () {
		// if no identity, redirect to the login page
		if (!this.user) {
			this.log(
				'User requesting codeError link but has no identity, redirecting to login'
			);
			let redirect = `/web/login?url=${encodeURIComponent(
				this.request.path
			)}&teamId=${this.teamId}`;			
			if (this.request.query.error) {
				redirect += `&error=${this.request.query.error}`;
			}
			if (this.request.query.errorData) {
				redirect += `&errorData=${this.request.query.errorData}`;
			}
			if (this.request.query.src) {
				redirect += `&src=${this.request.query.src}`;
			}
			this.response.redirect(redirect);
			this.responseHandled = true;
			return false;
		}
		return true;
	}

	async getCodeErrorLink () {
		// check if the user is on the indicated team
		if (!this.user.hasTeam(this.teamId)) {
			this.warn(
				'User requesting codeError link is not on the team that owns the codeError'
			);
			return this.redirect404(this.teamId);
		}
				 
		// get the link to the codemark
		const linkId = this.decodeLinkId(this.request.params.id, 2);
		const codemarkLinks = await this.data.codemarkLinks.getByQuery(
			{ teamId: this.teamId, _id: linkId },
			{ hint: CodemarkLinkIndexes.byTeamId }
		);
		if (codemarkLinks.length === 0) {
			this.warn('User requested a codeError link that was not found');
			return this.redirect404(this.teamId);
		}
		this.codemarkLink = codemarkLinks[0];
		return true;
	}

	async getCodeError () {
		// get the codemark
		const codeErrorId = this.codemarkLink.get('codeErrorId');
		this.codeError = await this.data.codeErrors.getById(codeErrorId);
		if (!this.codeError) {
			this.warn(
				'User requested to link to a codeError but the codeError was not found'
			);
			return this.redirect404(this.teamId);
		}
	 
		return true;
	} 

	async checkFollowing () {
		if (!(this.codeError.get('followerIds') || []).includes(this.user.id)) {
			this.warn(
				'User requesting code error link is not on a follower of the code error'
			);
			return this.redirect404();
		}
		return true;
	}

	getAvatar (username) {
		let authorInitials;
		let email;
		let emailHash;
		if (this.creator) {
			email = this.creator.get('email');
			if (email) {
				emailHash = Crypto.createHash('md5')
					.update(email.trim().toLowerCase())
					.digest('hex');
				authorInitials = (email && email.charAt(0)) || '';
			}
			let fullName = this.creator.get('fullName');

			if (fullName) {
				authorInitials = fullName
					.replace(/(\w)\w*/g, '$1')
					.replace(/\s/g, '');
				if (authorInitials.length > 2)
					authorInitials = authorInitials.substring(0, 2);
			} else if (username) {
				authorInitials = username.charAt(0);
			}
		}
		return {
			authorInitials,
			emailHash
		};
	}
 
	async render () {
		this.creator = await this.data.users.getById(
			this.codeError.get('creatorId')
		);
		const username = this.creator && this.creator.get('username');
		const { authorInitials, emailHash } = this.getAvatar(
			username
		);

		let stackTrace;
		const stackTraces = this.codeError.get('stackTraces') || [];
		if (stackTraces.length) {
			stackTrace = stackTraces[0].text || '';
		}

 		const templateProps = {			 
			launchIde: this.request.query.ide === ''
					? 'default'
					: this.request.query.ide,
			queryStringFull: JSON.stringify(this.request.query),	 
			queryString: {			 		 
				ide: this.request.query.ide === ''
						? 'default'
						: this.request.query.ide, 
			},			 
			icons: {},	
			// if we ever get a repoId pass it here		 
			partial_launcher_model: this.createLauncherModel(""),
			partial_title_model: { },
			segmentKey: this.api.config.telemetry.segment.webToken,
			teamId: this.teamId,
			creatorUserName: this.creator && this.creator.get('username'),
			createdAt: this.formatTime(this.codeError.get('createdAt')),
			hasEmailHashOrAuthorInitials: emailHash || authorInitials,
			emailHash,
			authorInitials,
			codeError: { 
				id: this.codeError.get('id'), 
				title: (this.codeError.get('title') || "").trimStart().trim(),
				text: (this.codeError.get('text') || "").trimStart().trim(), 
				hasStackTrace: stackTrace != null,
				hasParsedStack: stackTrace && stackTrace.lines && stackTrace.lines.length > 0,
				stackTraceText: stackTrace && stackTrace.text ? stackTrace.text.trim().replace(/\t/g,"") : "",
				stackTraceLines: stackTrace && stackTrace.lines ? stackTrace.lines : null  
			}
		};

		await super.render('codeerror', templateProps);		 
	} 

	
	formatTime (timeStamp) {
		const format = 'h:mm A MMM D';
		let timeZone = this.user && this.user.get('timeZone');
		if (!timeZone) {
			timeZone = this.creator && this.creator.get('timeZone');
			if (!timeZone) {
				timeZone = 'Etc/GMT';
			}
		}
		return MomentTimezone.tz(timeStamp, timeZone).format(format);
	}


	redirect404 (teamId) {
		let url = '/web/404';
		if (teamId) {
			url += `?teamId=${teamId}`;
		}
		this.response.redirect(url);
		this.responseHandled = true;
	}
}

module.exports = LinkCodeErrorRequest;
