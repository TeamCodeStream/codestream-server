'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');
const CodemarkLinkIndexes = require(process.env.CS_API_TOP + '/modules/codemarks/codemark_link_indexes');
const MomentTimezone = require('moment-timezone');
const Crypto = require('crypto');
const Identify = require('./identify');
const ProviderDisplayNames = require('./provider_display_names');

const ides = [
	{ ideName: 'Atom', protocol: 'atom://codestream/', moniker: 'atom', downloadUrl: 'https://atom.io/packages/codestream' },
	{},
	{ ideName: 'Visual Studio', protocol: 'codestream-vs://codestream/', moniker: 'vs', downloadUrl: 'https://marketplace.visualstudio.com/items?itemName=CodeStream.codestream-vs' },
	{ ideName: 'Visual Studio Code', protocol: 'vscode://codestream.codestream/', moniker: 'vsc', downloadUrl: 'https://marketplace.visualstudio.com/items?itemName=CodeStream.codestream' },
	{},
	{ ideName: 'Android Studio', protocol: 'jetbrains://android/', moniker: 'jb-android-studio', downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream' },
	{ ideName: 'IntelliJ IDEA', protocol: 'jetbrains://idea/', moniker: 'jb-intellij', downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream' },
	{ ideName: 'PyCharm', protocol: 'jetbrains://pycharm/', moniker: 'jb-pycharm', downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream' },
	{ ideName: 'WebStorm', protocol: 'jetbrains://web-storm/', moniker: 'jb-webstorm', downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream' },
	{ ideName: 'PhpStorm', protocol: 'jetbrains://phpstorm/', moniker: 'jb-phpstorm', downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream' },
	{ ideName: 'Rider', protocol: 'jetbrains://rider/', moniker: 'jb-rider', downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream' },
	{ ideName: 'CLion', protocol: 'jetbrains://clion/', moniker: 'jb-clion', downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream' },
	{ ideName: 'DataGrip', protocol: 'jetbrains://datagrip/', moniker: 'jb-datagrip', downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream' },
	{ ideName: 'RubyMine', protocol: 'jetbrains://rubymine/', moniker: 'jb-rubymine', downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream' },
	{ ideName: 'GoLand', protocol: 'jetbrains://goland/', moniker: 'jb-goland', downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream' }
];

class LinkCodemarkRequest extends APIRequest {

	async authorize() {
		// we'll handle authorization in the process phase,
		// but ascertain whether this is a public link
		this.isPublic = this.request.path.startsWith('/p/');
	}

	async process() {
		this.teamId = this.decodeLinkId(this.request.params.teamId);
		await this.checkAuthentication() &&
			await this.getCodemarkLink() &&
			await this.getCodemark() &&
			await this.getIdentifyingInfo() &&
			await this.showCodemark();
	}

	async checkAuthentication() {
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

	decodeLinkId(linkId, pad) {
		linkId = linkId
			.replace(/-/g, '+')
			.replace(/_/g, '/');
		const padding = '='.repeat(pad);
		linkId = `${linkId}${padding}`;
		return Buffer.from(linkId, 'base64').toString('hex');
	}

	async getCodemarkLink() {
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

	async getCodemark() {
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

	async getIdentifyingInfo() {
		this.team = await this.data.teams.getById(this.teamId);
		if (this.request.query.identify) {
			if (this.team) {
				this.company = await this.data.companies.getById(this.team.get('companyId'));
			}
		}
		return true;
	}

	getAvatar(showComment, username) {
		let authorInitials;
		let email;
		let emailHash;
		if (showComment && this.creator) {
			email = this.creator.get('email');
			if (email) {
				emailHash = Crypto.createHash('md5').update(email.trim().toLowerCase()).digest('hex');
				authorInitials = (email && email.charAt(0)) || '';
			}
			let fullName = this.creator.get('fullName');

			if (fullName) {
				authorInitials = fullName.replace(/(\w)\w*/g, '$1').replace(/\s/g, '');
				if (authorInitials.length > 2) authorInitials = authorInitials.substring(0, 2);
			} else if (username) {
				authorInitials = username.charAt(0);
			}
		}
		return {
			authorInitials, emailHash
		};
	}

	async showCodemark() {
		this.creator = await this.data.users.getById(this.codemark.get('creatorId'));
		const { marker, file } = await this.getMarkerInfo();
		const activity = this.getActivity(this.codemark.get('type'));
		const username = this.creator && this.creator.get('username');
		const showComment = username && !this.codemark.get('invisible');
		const { authorInitials, emailHash } = this.getAvatar(showComment, username);		 
		const createdAt = this.formatTime(this.codemark.get('createdAt'));
		const title = this.codemark.get('title');
		const text = this.codemark.get('text');
		let code = marker.get('code') || '';

		if (code) {
			code = this.whiteSpaceToHtml(code);
		}

		const remoteCodeUrl = this.codemark.get('remoteCodeUrl') || {};
		const codeProvider = ProviderDisplayNames[remoteCodeUrl.name] || remoteCodeUrl.name;
		const codeProviderUrl = remoteCodeUrl.url;

		const ep = this.codemark.get('externalProvider');
		const externalProvider = ProviderDisplayNames[ep] || ep;
		const externalProviderUrl = this.codemark.get('externalProviderUrl');

		const hasProviderButtons = codeProvider || externalProvider;

		let repoId;
		const segmentKey = this.api.config.segment.webToken;
		const markers = this.codemark.get('markerIds');
		let codeStartingLineNumber = 0;
		if (markers && markers.length) {
			const marker = await this.data.markers.getById(markers[0]);
			if (marker) {
				repoId = marker.get('repoId');
				const locationWhenCreated = marker.get('locationWhenCreated');
				if (locationWhenCreated && locationWhenCreated.length > 0) {
					codeStartingLineNumber = locationWhenCreated[0];
				}
			}
		}
		const codemarkType = this.codemark.get('type');
		const templateProps = {
			codemarkId: this.codemark.get('id'),
			teamName: this.team.get('name'),
			showComment,
			codemarkType: codemarkType === 'link' ? 'Permalink' : 'Codemark',
			repoId,
			username,
			emailHash,
			activity,
			createdAt,
			authorInitials,
			hasEmailHashOrAuthorInitials: emailHash || authorInitials,
			title,
			text,
			file,
			code,
			hasProviderButtons,
			codeProvider,
			codeProviderUrl,
			externalProvider,
			externalProviderUrl,
			segmentKey,
			codeStartingLineNumber: codeStartingLineNumber,
			ides: ides,
			version: this.module.versionInfo()
		};
		if (this.request.query.identify) {
			this.addIdentifyScript(templateProps);
		}
		this.module.evalTemplate(this, 'codemark', templateProps);
	}

	async getMarkerInfo() {
		let marker, file;
		const markerId = this.codemark.get('markerIds')[0];
		if (markerId) {
			marker = await this.data.markers.getById(markerId);
			const fileStream = marker && marker.get('fileStreamId') &&
				await this.data.streams.getById(marker.get('fileStreamId'));
			file = (fileStream && fileStream.get('file')) || (marker && marker.get('file'));
			if (file.startsWith('/')) {
				file = file.slice(1);
			}
			let repo = (marker && marker.get('repo')) || '';
			repo = this.bareRepo(repo);
			file = `${repo}/${file}`;
		}
		return { marker, file };
	}

	bareRepo(repo) {
		if (repo.match(/^(bitbucket\.org|github\.com)\/(.+)\//)) {
			repo = repo.split('/').splice(2).join('/');
		}
		else if (repo.indexOf('/') !== -1) {
			repo = repo.split('/').splice(1).join('/');
		}
		return repo;
	}

	addIdentifyScript(props) {
		const identifyOptions = {
			provider: ProviderDisplayNames[this.request.query.provider] || this.request.query.provider,
			user: this.user,
			team: this.team,
			company: this.company,
			module: this.module
		};
		props.identifyScript = Identify(identifyOptions);
	}

	formatTime(timeStamp) {
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

	getActivity(type) {
		switch (type) {
		case 'question':
			return 'has a question';
		case 'issue':
			return 'posted an issue';
		case 'bookmark':
			return 'set a bookmark';
		case 'trap':
			return 'created a code trap';
		case 'comment':
		default: // shouldn't happen, just a failsafe
			return 'commented on code';
		}
	}

	whiteSpaceToHtml(text) {
		return text
			.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
			.replace(/^ +/gm, match => { return match.replace(/ /g, '&nbsp;'); })
			.replace(/\n/g, '<br/>');
	}

	redirect404() {
		this.response.redirect('/web/404');
		this.responseHandled = true;
	}
}

module.exports = LinkCodemarkRequest;
