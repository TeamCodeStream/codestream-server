'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');
const CodemarkLinkIndexes = require(process.env.CS_API_TOP + '/modules/codemarks/codemark_link_indexes');
const MomentTimezone = require('moment-timezone');
const MD5 = require('md5');
const Identify = require('./identify');

const PROVIDER_DISPLAY_NAMES = {
	'github': 'GitHub',
	'bitbucket': 'Bitbucket',
	'gitlab': 'GitLab',
	'trello': 'Trello',
	'jira': 'Jira',
	'asana': 'Asana',
	'slack': 'Slack',
	'azure-devops': 'Azure DevOps',
	'vsts': 'Visual Studio Team Services'
};

class LinkCodemarkRequest extends APIRequest {

	async authorize () {
		// we'll handle authorization in the process phase,
		// but ascertain whether this is a public link
		this.isPublic = this.request.path.startsWith('/p/');
	}

	async process () {
		this.teamId = this.decodeLinkId(this.request.params.teamId);
		await this.checkAuthentication() &&
		await this.getCodemarkLink() &&
		await this.getCodemark() &&
		await this.getIdentifyingInfo() && 
		await this.showCodemark();
	}

	async checkAuthentication () {
		// if no identity, redirect to the login page
		if (!this.isPublic && !this.user) {
			this.log('User requesting codemark link but has no identity, redirecting to login');
			let redirect = `/web/login?url=${encodeURIComponent(this.request.path)}&teamId=${this.teamId}`;
			if (this.request.query.error) {
				redirect += `&error=${this.request.query.error}`;
			}
			if (this.request.query.errorData) {
				redirect += `&errorData=${this.request.query.errorData}`;
			}
			this.response.redirect(redirect);
			this.responseHandled = true;
			return false;
		}
		return true;
	}

	decodeLinkId (linkId, pad) {
		linkId = linkId
			.replace(/-/g, '+')
			.replace(/_/g, '/');
		const padding = '='.repeat(pad);
		linkId = `${linkId}${padding}`;
		return Buffer.from(linkId, 'base64').toString('hex');
	}

	async getCodemarkLink () {
		// check if the user is on the indicated team
		if (!this.isPublic && !this.user.hasTeam(this.teamId)) {
			this.warn('User requesting codemark link is not on the team that owns the codemark');
			return this.redirect404();
		}
		// get the link to the codemark
		const linkId = this.decodeLinkId(this.request.params.id, 2);
		const codemarkLinks = await this.data.codemarkLinks.getByQuery(
			{ teamId: this.teamId, _id: linkId },
			{ hint: CodemarkLinkIndexes.byTeamId }
		);
		if (codemarkLinks.length === 0) {
			this.warn('User requested a codemark link that was not found');
			return this.redirect404();
		}
		this.codemarkLink = codemarkLinks[0];
		return true;
	}

	async getCodemark () {
		// get the codemark
		const codemarkId = this.codemarkLink.get('codemarkId');
		this.codemark = await this.data.codemarks.getById(codemarkId);
		if (!this.codemark) {
			this.warn('User requested to link to a codemark but the codemark was not found');
			return this.redirect404();
		}
		if (this.isPublic && !this.codemark.get('hasPublicPermalink')) {
			this.warn('Public link to codemark with no public permalink will not be honored');
			return this.redirect404();
		}
		return true;
	}

	async getIdentifyingInfo () {
		if (this.request.query.identify) {
			this.team = await this.data.teams.getById(this.teamId);
			if (this.team) {
				this.company = await this.data.companies.getById(this.team.get('companyId'));
			}
		}
		return true;
	}

	async showCodemark () {
		this.creator = await this.data.users.getById(this.codemark.get('creatorId'));
		const { marker, file } = await this.getMarkerInfo();

		const username = this.creator && this.creator.get('username');		
		const activity = this.getActivity(this.codemark.get('type'));
		const showComment = username && !this.codemark.get('invisible');
		
		let email;
		let emailHash;
		if (showComment) {
			email = this.creator.get('email');
			emailHash = email && MD5(email.trim().toLowerCase());
		}
		const createdAt = this.formatTime(this.codemark.get('createdAt'));
		const title = this.codemark.get('title');
		const text = this.codemark.get('text');
		let code = marker.get('code') || '';

		if (code) {
			code = this.whiteSpaceToHtml(code);
		}

		const remoteCodeUrl = this.codemark.get('remoteCodeUrl') || {};
		const codeProvider = PROVIDER_DISPLAY_NAMES[remoteCodeUrl.name] || remoteCodeUrl.name;
		const codeProviderUrl = remoteCodeUrl.url;

		const threadUrl = this.codemark.get('threadUrl') || {};
		const threadProvider = PROVIDER_DISPLAY_NAMES[threadUrl.name] || threadUrl.name;
		const threadProviderUrl = threadUrl.url;

		const hasProviderButtons = codeProvider || threadProvider;

		const segmentKey = this.api.config.segment.webToken;

		const templateProps = {
			showComment,
			username,
			emailHash,
			activity,
			createdAt,
			title,
			text,
			file,
			code,
			hasProviderButtons,
			codeProvider,
			codeProviderUrl,
			threadProvider,
			threadProviderUrl,
			segmentKey,
			version: this.module.versionInfo()
		};
		if (this.request.query.identify) {
			this.addIdentifyScript(templateProps);
		}
		this.module.evalTemplate(this, 'codemark', templateProps);
	}

	async getMarkerInfo () {
		let marker, file;
		const markerId = this.codemark.get('markerIds')[0];
		if (markerId) {
			marker = await this.data.markers.getById(markerId);
			const fileStream = marker && marker.get('fileStreamId') &&
				await this.data.streams.getById(marker.get('fileStreamId'));
			file = (fileStream && fileStream.get('file')) || (marker && marker.get('file'));
		}
		return { marker, file };
	}

	addIdentifyScript (props) {
		const identifyOptions = {
			provider: this.request.query.provider,
			user: this.user,
			team: this.team,
			company: this.company,
			module: this.module
		};
		props.identifyScript = Identify(identifyOptions);
	}

	formatTime (timeStamp) {
		const formatWithoutTimezone = 'ddd, MMM D h:mm a';
		const formatWithTimezone = formatWithoutTimezone + ' z';
		let timeZone = this.user && this.user.get('timeZone');
		let format = formatWithoutTimezone;
		if (!timeZone) {
			format = formatWithTimezone;
			timeZone = this.creator && this.creator.get('timeZone');
			if (!timeZone) {
				timeZone = 'Etc/GMT';
			}
		}
		return MomentTimezone.tz(timeStamp, timeZone).format(format);
	}

	getActivity (type) {
		switch (type) {
		case 'question': 
			return 'has a question';
		case 'issue': 
			return 'posted an issue';
		case 'bookmark': 
			return 'set a bookmark';
		case 'trap':
			return 'created a code trap';
		default:
			return 'commented on code';	// shouldn't happen, just a failsafe
		}
	}

	whiteSpaceToHtml (text) {
		return text
			.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
			.replace(/^ +/gm, match => { return match.replace(/ /g, '&nbsp;'); })
			.replace(/\n/g, '<br/>');
	}

	redirect404 () {
		this.response.redirect('/web/404');
		this.responseHandled = true;
	}
}

module.exports = LinkCodemarkRequest;
