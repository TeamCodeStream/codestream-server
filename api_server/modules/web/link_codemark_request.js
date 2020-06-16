// handle the "GET /c" request to show a codemark

/*eslint complexity: ["error", 666]*/

'use strict';

const CodemarkLinkIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/codemarks/codemark_link_indexes');
const MomentTimezone = require('moment-timezone');
const Crypto = require('crypto');
const Identify = require('./identify');
const ProviderDisplayNames = require('./provider_display_names');
const WebRequestBase = require('./web_request_base');
const Markdowner = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/markdowner');
const Icons = require('./icons.json');
const { ides, tagMap} = require('./config');

class LinkCodemarkRequest extends WebRequestBase {
	async authorize () {
		// we'll handle authorization in the process phase,
		// but ascertain whether this is a public link
		this.isPublic = this.request.path.startsWith('/p/');
	}

	async process () {
		this.teamId = this.decodeLinkId(this.request.params.teamId);
		(await this.checkAuthentication()) &&
			(await this.getCodemarkLink()) &&
			(await this.getCodemark()) &&
			(await this.getIdentifyingInfo()) &&
			(await this.showCodemark());
	}

	async checkAuthentication () {
		// if no identity, redirect to the login page
		if (!this.isPublic && !this.user) {
			this.log(
				'User requesting codemark link but has no identity, redirecting to login'
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
			this.response.redirect(redirect);
			this.responseHandled = true;
			return false;
		}
		return true;
	}

	decodeLinkId (linkId, pad) {
		linkId = linkId.replace(/-/g, '+').replace(/_/g, '/');
		const padding = '='.repeat(pad);
		linkId = `${linkId}${padding}`;
		return Buffer.from(linkId, 'base64').toString('hex');
	}

	async getCodemarkLink () {
		// check if the user is on the indicated team
		if (!this.isPublic && !this.user.hasTeam(this.teamId)) {
			this.warn(
				'User requesting codemark link is not on the team that owns the codemark'
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
			this.warn('User requested a codemark link that was not found');
			return this.redirect404(this.teamId);
		}
		this.codemarkLink = codemarkLinks[0];
		return true;
	}

	async getCodemark () {
		// get the codemark
		const codemarkId = this.codemarkLink.get('codemarkId');
		this.codemark = await this.data.codemarks.getById(codemarkId);
		if (!this.codemark) {
			this.warn(
				'User requested to link to a codemark but the codemark was not found'
			);
			return this.redirect404(this.teamId);
		}
		if (this.isPublic && !this.codemark.get('hasPublicPermalink')) {
			this.warn(
				'Public link to codemark with no public permalink will not be honored'
			);
			return this.redirect404();
		}
		return true;
	}

	async getIdentifyingInfo () {
		this.team = await this.data.teams.getById(this.teamId);
		if (this.request.query.identify) {
			if (this.team) {
				this.company = await this.data.companies.getById(
					this.team.get('companyId')
				);
			}
		}
		return true;
	}

	getAvatar (showComment, username) {
		let authorInitials;
		let email;
		let emailHash;
		if (showComment && this.creator) {
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

	getAvatarForAssignee (fullName, username) {
		let authorInitials;
		if (fullName) {
			authorInitials = fullName
				.replace(/(\w)\w*/g, '$1')
				.replace(/\s/g, '');
			if (authorInitials.length > 2)
				authorInitials = authorInitials.substring(0, 2);
		}
		else if (username) {
			authorInitials = username.charAt(0);
		}
		return authorInitials;
	}

	createTags (teamTags, rawTags) {
		let tags = [];
		if (!teamTags) {
			return tags;
		}

		if (!rawTags || !rawTags.length) {
			return tags;
		}

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

		return tags;
	}

	async createAssignees () {
		let assignees = [];
		const csAssigneeIds = this.codemark.get('assignees');
		if (csAssigneeIds && csAssigneeIds.length) {
			const csAssignees = await this.data.users.getByIds(csAssigneeIds, {
				sortInOrder: true
			});
			if (csAssignees && csAssignees.length) {
				csAssignees.forEach(_ => {
					const fullName = _.get('fullName');
					const username = _.get('username');
					const email = _.get('email');
					const label = fullName || username || email;
					assignees.push({
						initials: this.getAvatarForAssignee(fullName, username),
						label: label,
						tooltip: label
					});
				});
			} else {
				assignees.push({
					label:
						csAssigneeIds.length == 1
							? '1 User'
							: `${csAssigneeIds.length} Users`,
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

	async createRelatedCodemarks () {
		const relatedCodemarkIds = this.codemark.get('relatedCodemarkIds');
		if (!relatedCodemarkIds || relatedCodemarkIds.length == 0)
			return undefined;

		let relatedCodemarks = [];
		const relatedCodemarksData = await this.data.codemarks.getByIds(
			relatedCodemarkIds,
			{ sortInOrder: true }
		);
		if (relatedCodemarksData) {
			// get an array of all the markers, using the first if necessary
			const markerIds = relatedCodemarksData.map(_ =>
				_.get('markerIds') && _.get('markerIds').length
					? _.get('markerIds')[0]
					: undefined
			);

			const fileInfoByMarkerId = await this.getFileInfosByMarkerIds(
				markerIds
			);
			for (let rcd of relatedCodemarksData) {
				const markerIds = rcd.get('markerIds');
				let file;
				if (markerIds && markerIds.length) {
					const fileInfo = fileInfoByMarkerId[markerIds[0]];
					if (fileInfo) {
						file = fileInfo.file;
					}
				}

				const type = rcd.get('type');
				const icon = type ? Icons[type] : null;
				relatedCodemarks.push({
					type: type,
					url: rcd.get('permalink'),
					file: file,
					icon: icon ? this.createIcon(icon) : undefined,
					title: type == 'issue' ? rcd.get('title') : rcd.get('text')
				});
			}
		}
		return relatedCodemarks;
	}


	async getMarkers (markerIds) {
		let markers = [];
		if (markerIds && markerIds.length) {
			markers = await this.data.markers.getByIds(markerIds, {
				sortInOrder: true
			});
		}

		return markers;
	}

	async getMarkersInfo (options) {
		let repoId;
		const markers = await this.getMarkers(this.codemark.get('markerIds'));
		let codeStartingLineNumber = 0;
		let whenCreated = null;
		let rawFileName;
		let results = [];
		if (!markers || !markers.length) return results;

		const markersLength = markers.length;
		let i = 0;
		let isLast;
		const fileStreamInfosByMarkerId = await this.getFileInfosByMarkers(
			markers
		);

		for (let marker of markers) {
			let commitHashWhenCreated = marker.get('commitHashWhenCreated');
			rawFileName = marker.get('file');
			whenCreated = {
				commitHashWhenCreated: commitHashWhenCreated
					? commitHashWhenCreated.substring(0, 7)
					: null,
				branchWhenCreated: marker.get('branchWhenCreated')
			};
			repoId = marker.get('repoId');
			const locationWhenCreated = marker.get('locationWhenCreated');
			if (locationWhenCreated && locationWhenCreated.length) {
				codeStartingLineNumber = locationWhenCreated[0];
			}
			else {
				const referenceLocations = marker.get('referenceLocations');
				if (referenceLocations && referenceLocations.length) {
					const location = referenceLocations[0].location;
					if (location) {
						codeStartingLineNumber = location[0];
					}
				}
			}

			const remoteCodeUrl = marker.get('remoteCodeUrl') || this.codemark.get('remoteCodeUrl') || {};
			const codeProvider =
				ProviderDisplayNames[remoteCodeUrl.name] || remoteCodeUrl.name;
			const codeProviderUrl = remoteCodeUrl.url;

			i++;
			if (i === markersLength) {
				isLast = true;
			}

			const fileInfo = fileStreamInfosByMarkerId[marker.get('id')];
			results.push({
				repoId,
				repoName: fileInfo && fileInfo.repo,
				codemarkId: this.codemark.get('id'),
				selectedMarker: options && options.selectedMarker,
				showComment: options && options.showComment,
				debug: options && options.debug,

				markerId: marker.get('id'),
				code: this.getCode(marker),
				file: fileInfo && fileInfo.file,
				isLast: isLast,

				codeStartingLineNumber,
				whenCreated,
				rawFileName,
				codeProvider: codeProvider,
				codeProviderUrl: codeProviderUrl,

				ides: ides
			});
		}

		return results;
	}

	getCode (marker) {
		let code = marker.get('code') || '';
		if (code) {
			code = code.replace(/>/g, '&gt;').replace(/</g, '&lt;');
			code = this.whiteSpaceToHtml(code);
		}
		return code;
	}

	async showCodemark () {
		this.creator = await this.data.users.getById(
			this.codemark.get('creatorId')
		);

		const username = this.creator && this.creator.get('username');
		const showComment = username && !this.codemark.get('invisible');
		const { authorInitials, emailHash } = this.getAvatar(
			showComment,
			username
		);
		const createdAtRaw = this.codemark.get('createdAt');
		const createdAt = this.formatTime(createdAtRaw);
		const title = this.codemark.get('title') || '';
		const text = this.codemark.get('text') || '';

		const ep = this.codemark.get('externalProvider');
		const externalProvider = ProviderDisplayNames[ep] || ep;
		const externalProviderUrl = this.codemark.get('externalProviderUrl');
		const icon = ep ? Icons[ep] : null;

		const codemarkType = this.codemark.get('type');
		const assignees = await this.createAssignees();
		const tags = this.createTags(
			this.team.get('tags'),
			this.codemark.get('tags')
		);

		let descriptionAsHtml;
		try {
			const me = this.user && this.user.get('username').toLowerCase();
			descriptionAsHtml = new Markdowner({ logger: this.api.logger })
				.markdownify(text)
				.replace(/@(\w+)/g, (match, name) => {
					const nameNormalized = name.toLowerCase();
					return `<span class="at-mention${
						nameNormalized === me ? ' me' : ''
					}">${match}</span>`;
				});
		} catch (ex) {
			descriptionAsHtml = text;
			this.api.logger.warn(ex);
		}

		const selectedMarker = this.request.query.marker;
		const debug = this.request.query.debug === 'true';
		const markers = await this.getMarkersInfo({ selectedMarker, showComment, debug });
		let uniqueRepoId;
		let uniqueFileName;
		if (markers && markers.length) {
			// see if there's 1 unique repo
			const repoIds = [...new Set(markers.map(_ => _.repoId))];		
			if (repoIds && repoIds.length === 1) {
				uniqueRepoId = repoIds[0];
			}
			const fileNames = [...new Set(markers.map(_ => _.rawFileName))];		
			if (fileNames && fileNames.length === 1) {
				uniqueFileName = fileNames[0];
			}
		}
		const templateProps = {
			codemarkId: this.codemark.get('id'),
			teamName: this.team.get('name'),
			launchIde:
				this.request.query.ide === ''
					? 'default'
					: this.request.query.ide,
			markers: markers,
			queryString: {
				marker: selectedMarker,
				ide:
					this.request.query.ide === ''
						? 'default'
						: this.request.query.ide,
				debug: debug
			},
			showComment,
			icons: {},
			assignees: assignees,
			isIssue: codemarkType === 'issue',
			text: descriptionAsHtml,
			codemarkType: codemarkType === 'link' ? 'Permalink' : 'Codemark',
			relatedCodemarks: await this.createRelatedCodemarks(),
			tags: tags,
			uniqueRepoId: uniqueRepoId,
			uniqueFileName: encodeURI(uniqueFileName),
			hasTagsOrAssignees:
				(assignees && assignees.length) || (tags && tags.length),
			externalProviderIcon:
				icon && icon.path ? this.createIcon(icon) : undefined,
			externalProvider,
			externalProviderUrl,
			partial_launcher_model: this.createLauncherModel(uniqueRepoId),
			partial_title_model: {					
				v2: codemarkType === 'issue',
				showComment: showComment,
				username: username,
				createdAt: createdAt,
				authorInitials: authorInitials,
				emailHash: emailHash,
				text: descriptionAsHtml,
				hasEmailHashOrAuthorInitials: emailHash || authorInitials,		
				isIssue: codemarkType === 'issue',
				title: title,
				createdAtRaw: createdAtRaw,	
				createdAtIso: new Date(createdAtRaw).toISOString()				
			},
			segmentKey: this.api.config.segment.webToken
		};

		if (this.request.query.identify) {
			this.addIdentifyScript(templateProps);
		}

		await super.render('codemark', templateProps);
	}

	async getMarkerInfoByMarkerId (markerId) {
		let marker, file;

		if (markerId) {
			marker = await this.data.markers.getById(markerId);
			const fileStream =
				marker &&
				marker.get('fileStreamId') &&
				(await this.data.streams.getById(marker.get('fileStreamId')));
			file =
				(fileStream && fileStream.get('file')) ||
				(marker && marker.get('file'));
			if (file.startsWith('/')) {
				file = file.slice(1);
			}
			let repo = (marker && marker.get('repo')) || '';
			repo = this.bareRepo(repo);
			file = `${repo}/${file}`;
		}
		return { marker, file };
	}

	async getFileInfosByMarkerIds (markerIds) {
		return await this.getFileInfosByMarkers(
			await this.data.markers.getByIds(markerIds, { sortInOrder: true })
		);
	}

	async getFileInfosByMarkers (markers) {
		const fileStreamIds = markers.map(_ => _.get('fileStreamId'));
		let marker, file;
		let result = {};

		if (fileStreamIds && fileStreamIds.length) {
			const fileStreamData = await this.data.streams.getByIds(
				fileStreamIds,
				{ sortInOrder: true }
			);
			if (!fileStreamData || !fileStreamData.length) return result;

			const fileStreamsByFileStreamId = fileStreamData.reduce(function (
				map,
				fileStream
			) {
				map[fileStream.get('id')] = fileStream;
				return map;
			}, {});

			for (marker of markers) {
				const fileStream =
					marker.get('fileStreamId') &&
					fileStreamsByFileStreamId[marker.get('fileStreamId')];
				file =
					(fileStream && fileStream.get('file')) ||
					marker.get('file');
				if (file.startsWith('/')) {
					file = file.slice(1);
				}

				let repo = marker.get('repo') || '';
				repo = this.bareRepo(repo);
				file = `${file}`;

				result[marker.get('id')] = {
					repo: repo,
					file: file
				};
			}
		}
		return result;
	}

	createIcon (icon) {
		const viewBox = icon.viewBox || '0 0 ' + icon.width + ' ' + icon.height;
		return `<span class="icon">
		<svg version="1.1" width="16" height="16" class="octicon octicon-${icon.name}" aria-hidden="true" viewBox="${viewBox}">
		${icon.path}</svg></span>`;
	}

	bareRepo (repo) {
		if (repo.match(/^(bitbucket\.org|github\.com)\/(.+)\//)) {
			repo = repo
				.split('/')
				.splice(2)
				.join('/');
		} else if (repo.indexOf('/') !== -1) {
			repo = repo
				.split('/')
				.splice(1)
				.join('/');
		}
		return repo;
	}

	addIdentifyScript (props) {
		const identifyOptions = {
			provider:
				ProviderDisplayNames[this.request.query.provider] ||
				this.request.query.provider,
			user: this.user,
			team: this.team,
			company: this.company,
			module: this.module
		};
		props.identifyScript = Identify(identifyOptions);
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

	whiteSpaceToHtml (text) {
		return text
			.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
			.replace(/^ +/gm, match => {
				return match.replace(/ /g, '&nbsp;');
			})
			.replace(/\n/g, '<br/>');
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

module.exports = LinkCodemarkRequest;
