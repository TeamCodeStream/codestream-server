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
		const { accountId, hexAccountId } = this.decodeAccountId(this.request.params.accountId);
		this.accountId = accountId;
		this.teamId = hexAccountId; // not really a team ID

	  	(await this.checkAuthentication()) &&
		(await this.getCodeErrorLink()) &&
		(await this.getCodeError()) && 
		(await this.checkFollowing()) &&
		(await this.render());
	}

	decodeAccountId (accountId) {
		accountId = accountId
			.replace(/-/g, '+')
			.replace(/_/g, '/');
		const hex = Buffer.from(accountId, 'base64').toString('hex');
		let decodedAccountId = '';
		for (let i = 0; i < hex.length; i += 2) {
			const c = hex.substring(i, i+2);
			decodedAccountId = decodedAccountId + String.fromCharCode(parseInt(c, 16));
		}
		return { accountId: decodedAccountId, hexAccountId: hex };
	}

	async checkAuthentication () {
		// if no identity, redirect to the login page
		if (!this.user) {
			this.log(
				'User requesting codeError link but has no identity, redirecting to login'
			);
			let redirect = `/web/login?url=${encodeURIComponent(
				this.request.path
			)}`;
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
		// get the link to the codemark
		const linkId = this.decodeLinkId(this.request.params.id, 2);
		const codemarkLinks = await this.data.codemarkLinks.getByQuery(
			{ teamId: this.teamId, _id: linkId },
			{ hint: CodemarkLinkIndexes.byTeamId }
		);
		if (codemarkLinks.length === 0) {
			this.warn('User requested a codeError link that was not found');
			return this.redirect404();
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
			return this.redirect404();
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
				title: (this.codeError.get('title') || "").trim(),
				stackTrace: (stackTrace || '').trim().replace(/\n/g,"<br />")
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


	redirect404 () {
		this.response.redirect('/web/404');
		this.responseHandled = true;
	}
}

module.exports = LinkCodeErrorRequest;
