// handles collecting stats for phone-home for on-prem installations, and dumping them to 
// mongo for later transmission

'use strict';

const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities');

class PhoneHomeStatsCollector {

	constructor (options) {
		Object.assign(this, options);
	}

	// collect stats relevant to the day beginning at midnight passed in
	async collectAndDumpStats (intervalBegin, interval) {
		this.intervalBegin = intervalBegin;
		this.interval = interval;

		await this.getCompanies();

		// don't phone home if customer has turned it off, which is only allowed for paid customers
		if (this.api.config.api.disablePhoneHome && this.customerIsPaid) {
			this.api.log('Will not phone home, customer has disabled phone-home and is a paying customer');
			return;
		}

		await this.collectStats();
		await this.dumpStats();
	}

	// get all the companies ... this should, in theory, be limited to 1 for on-prem customers
	async getCompanies () {
		this.companies = await this.api.data.companies.getByQuery({}, { overrideHintRequired: true });
		this.customerIsPaid = this.companies.find(company => this.companyIsPaid(company));
	}

	// is this company on a paid plan?
	companyIsPaid (company) {
		const plan = company.plan || '30DAYTRIAL';
		return plan !== 'FREEPLAN' && plan !== '30DAYTRIAL';
	}

	// collect all the stats for the given companies
	async collectStats () {
		const date = this.intervalBegin;
		const onPremVersion = this.api.serverOptions.onprem && this.api.serverOptions.onprem.onPremVersion;
		this.stats = {
			date: date,
			installationId: this.api.config.api.installationId || 'N/A',
			installationVersion: onPremVersion || 'N/A',
			companies: [],
			teams: [],
			users: [],
			reviews: []
		};

		await this.addCompanies();
		await this.addTeams();
		await this.getPosts();
		await this.getCodemarks();
		await this.getReviews();
		await this.getCountsByUser();
		await this.addUsers();
		await this.addReviews();
		await this.collectInstanceStats();
	}

	// collect stats related to the customer's on-prem instance
	async collectInstanceStats () {
		const integrations = await this.collectIntegrations();
		this.stats.instance = {
			outboundEmailEnabled: !this.api.config.email.suppressEmails,
			slackInteractiveComponentsEnabled: this.api.config.slack.interactiveComponentsEnabled,
			integrations
		};
	}

	// collect the integrations in use, based on users that have credentials
	async collectIntegrations () {
		let integrations = [];
		await Promise.all(this.users.map(async user => {
			const userIntegrations = await this.getIntegrationsForUser(user);
			integrations = ArrayUtilities.union(integrations, userIntegrations);
		}));
		return integrations;
	}

	// collect the integerations used by a particular user (ones they have an access token for)
	async getIntegrationsForUser (user) {
		const userIntegrations = [];
		const providerInfo = user.providerInfo || {};
		Object.keys(providerInfo).forEach(teamId => {
			Object.keys(providerInfo[teamId]).forEach(integrationName => {
				if (providerInfo[teamId][integrationName].accessToken) {
					userIntegrations.push(integrationName);
				}
			});
		});
		return userIntegrations;
	}

	// add all companies to the stats
	async addCompanies () {
		this.companies.forEach(company => {
			this.stats.companies.push({
				id: company.id,
				name: company.name,
				deactivated: company.deactivated,
				createdAt: company.createdAt,
				creatorId: company.creatorId,
				plan: company.plan
			});
		});
	}

	// add all teams to the stats
	async addTeams () {
		this.teams = await this.api.data.teams.getByQuery({}, { overrideHintRequired: true });
		this.teams.forEach(team => {
			const settings = team.settings || {};
			this.stats.teams.push({
				id: team.id,
				name: team.name,
				deactivated: team.deactivated,
				companyId: team.companyId,
				createdAt: team.createdAt,
				creatorId: team.creatorId,
				liveView: settings.xray || 'on',
				codeReviewApproval: settings.reviewApproval || 'user',
				codeReviewAssignment: settings.reviewAssignment || 'authorship2'
			});
		});
	}

	// add all users to the stats
	async addUsers () {
		this.users = await this.api.data.users.getByQuery({}, { overrideHintRequired: true });
		this.users.forEach(user => {
			const isAdmin = this.userIsAdmin(user); // user is admin if they are an admin on any of their teams
			this.userCounts[user.id] = this.userCounts[user.id] || {
				reviews: 0,
				codemarks: 0,
				codemarksInReviews: 0,
				replies: 0
			};
			const userCount = this.userCounts[user.id];
			const userData = {
				id: user.id,
				isRegistered: user.isRegistered || false,
				isFaux: user.externalUserId ? true : false,
				isDeactivated: user.deactivated,
				registeredAt: user.registeredAt ? user.registeredAt : '',
				joinMethod: user.joinMethod || '',
				lastLogin: user.lastLogin ? user.lastLogin : '',
				lastOrigin: user.lastOrigin || '',
				lastOriginDetail: user.lastOriginDetail || '',
				isAdmin,
				reviews: userCount.reviews,
				codemarksInReviews: userCount.codemarksInReviews,
				codemarks: userCount.codemarks,
				replies: userCount.replies
			};
			if (!this.customerIsPaid) {
				userData.email = user.email;
			}
			this.stats.users.push(userData);
		});
	}

	// is this user an admin on any team?
	userIsAdmin (user) {
		const teamIds = user.teamIds || [];
		return !!teamIds.find(teamId => {
			const team = this.teams.find(team => team.id === teamId);
			return team && (team.adminIds || []).includes(user.id);
		});
	}

	// get the posts created within the 24-hour period of the day
	async getPosts () {
		this.posts = await this.api.data.posts.getByQuery({
			$and: [
				{ createdAt: { $gte: this.intervalBegin } },
				{ createdAt: { $lt: this.intervalBegin + this.interval } }
			]
		}, { overrideHintRequired: true });
	}

	// get the codemarks created according to the posts
	async getCodemarks () {
		const codemarkIds = this.posts.reduce((codemarkIds, post) => {
			if (post.codemarkId) {
				codemarkIds.push(post.codemarkId);
			}
			return codemarkIds;
		}, []);
		if (codemarkIds.length === 0) {
			this.codemarks = [];
			return;
		}
		this.codemarks = await this.api.data.codemarks.getByIds(codemarkIds);
	}

	// get the codemarks created according to the posts
	async getReviews () {
		const reviewIds = this.posts.reduce((reviewIds, post) => {
			if (post.reviewId) {
				reviewIds.push(post.reviewId);
			}
			return reviewIds;
		}, []);
		if (reviewIds.length === 0) {
			this.reviews = [];
			return;
		}
		this.reviews = await this.api.data.reviews.getByIds(reviewIds);
	}
	
	// get count of posts, codemarks, reviews authored by each user
	async getCountsByUser () {
		this.userCounts = {};
		await Promise.all(this.posts.map(async post => {
			await this.countPost(post);
		}));
	}

	// count this post toward user count for reviews, codemarks, and/or replies
	async countPost (post) {
		const creatorId = post.creatorId;
		this.userCounts[creatorId] = this.userCounts[creatorId] || {
			reviews: 0,
			codemarksInReviews: 0,
			codemarks: 0,
			replies: 0
		};
		if (post.reviewId) {
			this.userCounts[creatorId].reviews++;
		}
		else if (post.codemarkId) {
			let codemark = this.codemarks.find(codemark => codemark.id === post.codemarkId);
			if (!codemark) {
				codemark = await this.api.data.codemarks.getById(post.codemarkId);
			}
			if (codemark) {
				if (codemark.reviewId) {
					this.userCounts[creatorId].codemarksInReviews++;
				}
				else {
					this.userCounts[creatorId].codemarks++;
				}
			}
		}
		else {
			this.userCounts[creatorId].replies++;
		}
	}

	// add reviews updated within the day to the stats
	async addReviews () {
		this.approvedReviews = await this.api.data.reviews.getByQuery({
			$and: [
				{ approvedAt: { $gte: this.intervalBegin } },
				{ approvedAt: { $lt: this.intervalBegin + this.interval } }
			]
		}, { overrideHintRequired: true });

		const allReviews = [...this.reviews, ...this.approvedReviews];
		allReviews.forEach(review => {
			const reviewData = {
				id: review.id,
				teamId: review.teamId,
				createdAt: review.createdAt
			};
			if (review.approvedAt) {
				reviewData.approvedAt = review.approvedAt;
			}
			this.stats.reviews.push(reviewData);
		});
	}

	// dump the stats we collected into mongo
	async dumpStats () {
		// just to make sure we don't send multiple stats, we'll check to see if stats were already 
		// created for this day ... this should NEVER happen if our contention checking is working
		const existingStats = this.api.data.phoneHomeStats.getByQuery({
			date: this.intervalBegin
		}, { overrideHintRequired: true });
		if (existingStats.length > 0) {
			this.api.warn(`Found stats for ${this.midnightDay}, deleting...`);
			this.api.data.phoneHomeStats.deleteByIds(existingStats.map(s => s.id));
		}
		
		await this.api.data.phoneHomeStats.create({
			date: this.intervalBegin,
			stats: this.stats
		}, { noVersion: true });
	}
}

module.exports = PhoneHomeStatsCollector;
