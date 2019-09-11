'use strict';

const CodemarkLinkIndexes = require(process.env.CS_API_TOP + '/modules/codemarks/codemark_link_indexes');
const MomentTimezone = require('moment-timezone');
const Crypto = require('crypto');
const Identify = require('./identify');
const ProviderDisplayNames = require('./provider_display_names');
const WebRequestBase = require('./web_request_base');

const tagMap = {
	blue: '#3578ba',
	green: '#7aba5d',
	yellow: '#edd648',
	orange: '#f1a340',
	red: '#d9634f',
	purple: '#b87cda',
	aqua: '#5abfdc',
	gray: '#888888'
};

const ides = [
	{ ideName: 'Atom', protocol: 'atom://codestream/', moniker: 'atom', downloadUrl: 'https://atom.io/packages/codestream' },
	{},
	{ ideName: 'Visual Studio', protocol: 'codestream-vs://codestream/', moniker: 'vs', downloadUrl: 'https://marketplace.visualstudio.com/items?itemName=CodeStream.codestream-vs' },
	{ ideName: 'Visual Studio Code', protocol: 'vscode://codestream.codestream/', moniker: 'vsc', downloadUrl: 'https://marketplace.visualstudio.com/items?itemName=CodeStream.codestream' },
	{},
	{ ideName: 'Android Studio', protocol: 'jetbrains://android/codestream/', moniker: 'jb-android', downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream' },
	{ ideName: 'CLion', protocol: 'jetbrains://clion/codestream/', moniker: 'jb-clion', downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream' },
	{ ideName: 'DataGrip', protocol: 'jetbrains://datagrip/codestream/', moniker: 'jb-datagrip', downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream' },
	{ ideName: 'GoLand', protocol: 'jetbrains://goland/codestream/', moniker: 'jb-goland', downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream' },
	{ ideName: 'IntelliJ IDEA', protocol: 'jetbrains://idea/codestream/', moniker: 'jb-idea', downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream' },
	{ ideName: 'PhpStorm', protocol: 'jetbrains://phpstorm/codestream/', moniker: 'jb-phpstorm', downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream' },
	{ ideName: 'PyCharm', protocol: 'jetbrains://pycharm/codestream/', moniker: 'jb-pycharm', downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream' },
	{ ideName: 'Rider', protocol: 'jetbrains://rider/codestream/', moniker: 'jb-rider', downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream' },
	{ ideName: 'RubyMine', protocol: 'jetbrains://rubymine/codestream/', moniker: 'jb-rubymine', downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream' },
	{ ideName: 'WebStorm', protocol: 'jetbrains://web-storm/codestream/', moniker: 'jb-web-storm', downloadUrl: 'https://plugins.jetbrains.com/plugin/12206-codestream' },
];

class LinkCodemarkRequest extends WebRequestBase {

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
			return this.redirect404(this.teamId);
		}
		// get the link to the codemark
		const linkId = this.decodeLinkId(this.request.params.id, 2);
		const codemarkLinks = await this.data.codemarkLinks.getByQuery(
			{ teamId: this.teamId, _id: linkId },
			{ hint: CodemarkLinkIndexes.byTeamId }
		);
		if (codemarkLinks.length === 0) {
			this.warn('User requested a codemark link that was not found');
			return this.redirect404(this.teamId);
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
			return this.redirect404(this.teamId);
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

	getAvatarForAssignee(fullName) {
		let authorInitials;
		if (fullName) {
			authorInitials = fullName.replace(/(\w)\w*/g, '$1').replace(/\s/g, '');
			if (authorInitials.length > 2) authorInitials = authorInitials.substring(0, 2);
		}
		//  else if (username) {
		// 	authorInitials = username.charAt(0);
		// }
		return authorInitials;

	}

	createTags() {
		let tags = [];
		const teamTags = this.team.get('tags');
		if (teamTags) {
			let rawTags = this.codemark.get('tags');
			if (rawTags && rawTags.length) {
				for (let i = 0; i < rawTags.length; i++) {
					let t = rawTags[i];
					const teamTag = teamTags[t];
					if (teamTag) {
						let color = tagMap[teamTag.color];
						if (!color) {
							color = teamTag.color;
						}

						tags.push({
							color: color,
							label: teamTag.label
						});
					}
				}
			}
		}
		return tags;
	}

	async createAssignees() {
		let assignees = [];
		const csAssigneeIds = this.codemark.get('assignees');
		if (csAssigneeIds && csAssigneeIds.length) {
			const csAssignees = await this.data.users.getByIds(csAssigneeIds);
			if (csAssignees && csAssignees.length) {
				csAssignees.forEach(_ => {
					const fullName = _.get('fullName');
					assignees.push({
						initials: this.getAvatarForAssignee(fullName),
						label: fullName,
						tooltip: fullName
					});
				});
			}
			else {
				assignees.push({
					label: csAssigneeIds.length == 1 ? '1 User' : `${csAssigneeIds.length} Users`,
					tooltip: csAssigneeIds.join(', ')
				});
			}
		}
		const externalAssignees = this.codemark.get('externalAssignees');
		if (externalAssignees && externalAssignees.length) {
			externalAssignees.forEach(_ => {
				assignees.push({
					initials: this.getAvatarForAssignee(_.displayName),
					label: _.displayName,
					tooltip: _.displayName
				});
			});
		}

		return assignees;
	}

	async createRelatedCodemarks() {
		const relatedCodemarkIds = this.codemark.get('relatedCodemarkIds');
		if (!relatedCodemarkIds || relatedCodemarkIds.length == 0) return undefined;

		let relatedCodemarks = [];
		const relatedCodemarksData = await this.data.codemarks.getByIds(relatedCodemarkIds);
		if (relatedCodemarksData) {

			for (let i = 0; i < relatedCodemarksData.length; i++) {
				const _ = relatedCodemarksData[i];
				const markerIds = _.get('markerIds');
				const { file } = markerIds && markerIds.length ?
					await this.getMarkerInfoByMarkerId(markerIds[0]) : null;
				relatedCodemarks.push({
					type: _.get('type'),
					url: _.get('permalink'),
					file: file,
					title: _.get('title')
				});
			}
		}
		return relatedCodemarks;
	}

	async createAdditionalInfo() {
		let repoId;
		const markers = this.codemark.get('markerIds');
		let codeStartingLineNumber = 0;
		let whenCreated = null;
		if (markers && markers.length) {
			const marker = await this.data.markers.getById(markers[0]);
			if (marker) {
				let commitHashWhenCreated = marker.get('commitHashWhenCreated');
				whenCreated = {
					commitHashWhenCreated: commitHashWhenCreated ? commitHashWhenCreated.substring(0, 7) : null,
					branchWhenCreated: marker.get('branchWhenCreated')
				};
				repoId = marker.get('repoId');
				const locationWhenCreated = marker.get('locationWhenCreated');
				if (locationWhenCreated && locationWhenCreated.length > 0) {
					codeStartingLineNumber = locationWhenCreated[0];
				}
			}
		}
		return { repoId, codeStartingLineNumber, whenCreated };
	}
	async showCodemark() {
		this.creator = await this.data.users.getById(this.codemark.get('creatorId'));
		const { marker, file } = await this.getMarkerInfo();
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

		const segmentKey = this.api.config.segment.webToken;

		const { repoId, codeStartingLineNumber, whenCreated } = await this.createAdditionalInfo();
		const codemarkType = this.codemark.get('type');
		const assignees = await this.createAssignees();
		const tags = this.createTags();

		const templateProps = {
			codemarkId: this.codemark.get('id'),
			teamName: this.team.get('name'),
			launchIde: this.request.query.ide === '' ? 'default' : this.request.query.ide,
			showComment,
			whenCreated: whenCreated,
			assignees: assignees,
			codemarkType: codemarkType === 'link' ? 'Permalink' : 'Codemark',
			repoId,
			username,
			emailHash,
			createdAt,
			authorInitials,
			hasEmailHashOrAuthorInitials: emailHash || authorInitials,
			title,
			text,
			file,
			code,
			relatedCodemarks: await this.createRelatedCodemarks(),
			tags: tags,
			hasProviderButtons,
			hasTagsOrAssignees: (assignees && assignees.length) || (tags && tags.length),
			codeProvider,
			codeProviderUrl,
			externalProvider,
			externalProviderUrl,
			segmentKey,
			codeStartingLineNumber: codeStartingLineNumber,
			ides: ides,
		};

		if (this.request.query.identify) {
			this.addIdentifyScript(templateProps);
		}

		await super.render('codemark', templateProps);
	}

	async getMarkerInfo() {
		return this.getMarkerInfoByMarkerId(this.codemark.get('markerIds')[0]);
	}

	async getMarkerInfoByMarkerId(markerId) {
		let marker, file;

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

	whiteSpaceToHtml(text) {
		return text
			.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
			.replace(/^ +/gm, match => { return match.replace(/ /g, '&nbsp;'); })
			.replace(/\n/g, '<br/>');
	}

	redirect404(teamId) {
		let url = '/web/404';
		if (teamId) {
			url += `?teamId=${teamId}`;
		}
		this.response.redirect(url);
		this.responseHandled = true;
	}
}

module.exports = LinkCodemarkRequest;
