'use strict';

const CodemarkLinkIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/codemarks/codemark_link_indexes');
const MomentTimezone = require('moment-timezone');
const Crypto = require('crypto');
const Identify = require('./identify');
const ProviderDisplayNames = require('./provider_display_names');
const WebRequestBase = require('./web_request_base');
const Markdowner = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/markdowner');
const { ides, tagMap} = require('./config');

class LinkReviewRequest extends WebRequestBase {
	async authorize () {
		// we'll do the check in checkAuthentication
	}

	async process () {
		this.teamId = this.decodeLinkId(this.request.params.teamId);
		(await this.checkAuthentication()) &&
			(await this.getReviewLink()) &&
			(await this.getReview()) &&
			(await this.getIdentifyingInfo()) &&
			(await this.showReview());
	}

	async checkAuthentication () {
		//if no identity, redirect to the login page
		if (!this.user) {
			this.log(
				'User requesting review link but has no identity, redirecting to login'
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
		if (!this.user.hasTeam(this.teamId)) {
			this.warn(
				'User requesting review link is not on the team that owns the codemark'
			);
			this.redirect404(this.teamId);
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

	async getReviewLink () {
		// get the link to the review
		const linkId = this.decodeLinkId(this.request.params.id, 2);
		// don't worry, review links are also stored in codemarkLinks collection
		const codemarkLinks = await this.data.codemarkLinks.getByQuery(
			{ teamId: this.teamId, _id: linkId },
			{ hint: CodemarkLinkIndexes.byTeamId }
		);
		if (codemarkLinks.length === 0) {
			this.warn('User requested a review link that was not found');
			return this.redirect404(this.teamId);
		}
		this.codemarkLink = codemarkLinks[0];
		return true;
	}

	async getReview () {
		// get the review
		const reviewId = this.codemarkLink.get('reviewId');
		this.review = await this.data.reviews.getById(reviewId);
		if (!this.review) {
			this.warn(
				'User requested to link to a review but the review was not found'
			);
			return this.redirect404(this.teamId);
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

	async getChangeSetInfo () {
		let repoId;
		let isLast = false;
		let i = 0;
		const repoResults = [];
		const fileResults = [];
		const reviewChangesets = this.review.get('reviewChangesets');
		if (!reviewChangesets || !reviewChangesets.length) {
			return {
				repos: repoResults,
				files: fileResults
			};
		}

		const repos = await this.data.repos.getByIds(reviewChangesets.map(_ => _.repoId));

		const repoHash = repos.reduce(function (map, obj) {
			map[obj.get('id')] = obj.attributes;
			return map;
		}, {});

		const reviewChangsetsLength = reviewChangesets.length;
		
		for (let reviewChangeset of reviewChangesets) {
			repoId = reviewChangeset.repoId;
			i++;
			if (i === reviewChangsetsLength) {
				isLast = true;
			}
			let repoName = '';
			if (repoHash) {
				let repo = repoHash[repoId];
				if (repo) {
					repoName = repo.name;
					repoResults.push({
						id: repoId,
						repoName: repoName,
						branchName: reviewChangeset.branch
					});
				}
			}
			fileResults.push({
				files: reviewChangeset.modifiedFiles,
				isLast: isLast,
				ides: ides
			});
		}

		return {
			repos: repoResults,
			files: fileResults
		};
	}

	async createReviewers () {
		let reviewers = [];
		const csReviewerIds = this.review.get('reviewers');
		if (csReviewerIds && csReviewerIds.length) {
			const csReviewers = await this.data.users.getByIds(csReviewerIds, {
				sortInOrder: true
			});
			if (csReviewers && csReviewers.length) {
				csReviewers.forEach(_ => {
					const fullName = _.get('fullName');
					const username = _.get('username');
					const email = _.get('email');
					const label = fullName || username || email;
					reviewers.push({
						initials: this.getAvatarForAssignee(fullName, username),
						label: label,
						tooltip: label
					});
				});
			} else {
				reviewers.push({
					label:
						csReviewerIds.length == 1
							? '1 User'
							: `${csReviewerIds.length} Users`,
					tooltip: csReviewerIds.join(', ')
				});
			}
		}	 

		return reviewers;
	}

	async showReview () {
		this.creator = await this.data.users.getById(
			this.review.get('creatorId')
		);

		const username = this.creator && this.creator.get('username');
		const { authorInitials, emailHash } = this.getAvatar(username);
		const createdAtRaw = this.review.get('createdAt');
		const createdAt = this.formatTime(createdAtRaw);
		const title = this.review.get('title');
		const text = this.review.get('text');

		let reviewers = await this.createReviewers();
		const tags = this.createTags(
			this.team.get('tags'),
			this.review.get('tags')
		);

		let descriptionAsHtml;
		try {
			const me = this.user.get('username').toLowerCase();
			descriptionAsHtml = new Markdowner({ logger: this.api.logger })
				.markdownify(text)
				.replace(/@(\w+)/g, (match, name) => {
					const nameNormalized = name.toLowerCase();
					return `<span class="at-mention${nameNormalized === me ? ' me' : ''}">${match}</span>`;
				});
		} catch (ex) {
			descriptionAsHtml = text;
			this.api.logger.warn(ex);
		}		 

		const status = this.review.get('status');
		const changes = await this.getChangeSetInfo();

		let uniqueRepoId;
		const repoIds = changes && changes.repos ? [...new Set(changes.repos.map(_ => _.id))] : undefined;		
		if (repoIds && repoIds.length === 1) {
			uniqueRepoId = repoIds[0];
		}

		const templateProps = {
			reviewId: this.review.get('id'),
			status: status ? status[0].toUpperCase() + status.slice(1) : '',
			teamName: this.team.get('name'),
			launchIde:
				this.request.query.ide === ''
					? 'default'
					: this.request.query.ide,
			repos: changes.repos,
			uniqueRepoId: uniqueRepoId,
			teamId: this.team.id,
			teamName: this.team.get('name'),
			changes: changes.files,
			queryString: {
				ide:
					this.request.query.ide === ''
						? 'default'
						: this.request.query.ide,
				debug: this.request.query.debug === 'true'
			},
			icons: {},
			ides: ides,
			reviewers: reviewers,			
			text: descriptionAsHtml,
			tags: tags,
			hasTagsOrReviewers:
				(reviewers && reviewers.length) || (tags && tags.length),
			partial_launcher_model: this.createLauncherModel(uniqueRepoId),
			partial_title_model: {
				v2: true,
				isReview: true,
				showComment: true,
				username: username,
				createdAt: createdAt,
				authorInitials: authorInitials,
				emailHash: emailHash,
				hasEmailHashOrAuthorInitials: emailHash || authorInitials,				
				title: title,
				createdAtIso: new Date(createdAtRaw).toISOString()				
			},
			segmentKey: this.api.config.telemetry.segment.webToken
		};

		if (this.request.query.identify) {
			this.addIdentifyScript(templateProps);
		}

		await super.render('review', templateProps);
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

module.exports = LinkReviewRequest;
