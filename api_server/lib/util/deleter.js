const MongoClient = require(process.env.CS_API_TOP + '/server_utils/mongo/mongo_client');
const MongoConfig = require(process.env.CS_API_TOP + '/config/mongo');
const ObjectID = require('mongodb').ObjectID;
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');
const RepoIndexes = require(process.env.CS_API_TOP + '/modules/repos/indexes');

const COLLECTIONS = ['companies', 'teams', 'repos', 'users', 'streams', 'posts', 'codemarks', 'markers', 'markerLocations'];


class Deleter {

	async go (options) {
		Object.assign(this, options);
		this.logger = this.logger || console;
		await this.openMongoClient();
		await this.getTargetObject();
		await this.getUsers();
		await this.deleteRepos();
		await this.deleteTeam();
		await this.deleteCompany();
		await this.deleteUsers();
		await this.deleteStreams();
		await this.deletePosts();
		await this.deleteCodemarks();
		await this.deleteMarkers();
		await this.deleteMarkerLocations();
	}

	async openMongoClient () {
		this.mongoClient = new MongoClient();
		let mongoConfig = Object.assign({}, MongoConfig, { collections: COLLECTIONS });
		delete mongoConfig.queryLogging;
		try {
			await this.mongoClient.openMongoClient(mongoConfig);
		}
		catch (error) {
			throw `unable to open mongo client: ${JSON.stringify(error)}`;
		}
	}

	async getTargetObject () {
		if (this.teamIdOrName) {
			await this.getTeam();
		}
		else if (this.userIdOrEmail) {
			await this.getUser();
		}
		else {
			throw 'must provide team or user';
		}
	}

	async getTeam () {
		if (!this.teamIdOrName) {
			return;
		}
		try {
			this.teamId = ObjectID(this.teamIdOrName).toString();
			await this.getTeamById();
		}
		catch (error) {
			await this.getTeamByName();
		}
	}

	async getTeamById () {
		try {
			this.team = await this.mongoClient.mongoCollections.teams.getById(
				this.teamId,
				{ fields: ['id', 'companyId'] }
			);
		}
		catch (error) {
			throw `unable to fetch team: ${JSON.stringify(error)}`;
		}
	}

	async getTeamByName () {
		let teams;
		try {
			teams = await this.mongoClient.mongoCollections.teams.getByQuery(
				{
					name: this.teamIdOrName
				},
				{
					fields: ['id', 'companyId'],
					overrideHintRequired: true
				}
			);
		}
		catch (error) {
			throw `unable to fetch team: ${JSON.stringify(error)}`;
		}
		if (teams.length === 0) {
			throw `team not found: ${this.teamIdOrName}`;
		}
		this.team = teams[0];
		this.teamId = this.team.id;
	}

	async getUser () {
		try {
			this.userId = ObjectID(this.userIdOrEmail).toString();
			await this.getUserById();
		}
		catch (error) {
			await this.getUserByEmail();
		}
	}

	async getUserByEmail () {
		let users;
		try {
			users = await this.mongoClient.mongoCollections.users.getByQuery(
				{
					searchableEmail: this.userIdOrEmail.toLowerCase()
				},
				{
					fields: ['id'],
					hint: UserIndexes.bySearchableEmail
				}
			);
		}
		catch (error) {
			throw `unable to fetch user by email: ${JSON.stringify(error)}`;
		}
		if (users.length === 0) {
			throw `user not found: ${this.userIdOrEmail}`;
		}
		this.user = users[0];
	}

	async getUserById () {
		try {
			this.user = await this.mongoClient.mongoCollections.users.getById(this.userIdOrEmail);
		}
		catch (error) {
			throw `unable to fetch user: ${JSON.stringify(error)}`;
		}
		if (!this.user) {
			throw `user not found: ${this.userIdOrEmail}`;
		}
	}

	async getUsers () {
		if (!this.teamId) {
			return;
		}
		try {
			this.users = await this.mongoClient.mongoCollections.users.getByQuery(
				{
					teamIds: this.teamId
				},
				{
					fields: ['id', 'teamIds'],
					hint: UserIndexes.byTeamIds
				}
			);
		}
		catch (error) {
			throw `unable to fetch users by team: ${JSON.stringify(error)}`;
		}
	}

	async getRepos () {
		if (!this.teamId) {
			return;
		}
		let repos;
		try {
			repos = await this.mongoClient.mongoCollections.repos.getByQuery(
				{
					teamId: this.teamId
				},
				{
					fields: ['id'],
					hint: RepoIndexes.byTeamId
				}
			);
		}
		catch (error) {
			throw `unable to fetch repos by team: ${JSON.stringify(error)}`;
		}
		this.repoIds = repos.map(repo => repo.id);
	}

	async deleteRepos () {
		this.logger.log(`Deleting repos in team ${this.teamId}...`);
		try {
			await this.mongoClient.mongoCollections.repos.deleteByQuery(
				{ teamId: this.teamId },
				{ overrideHintRequired: true }
			);
		}
		catch (error) {
			throw `unable to delete repos: ${JSON.stringify(error)}`;
		}
	}

	async deleteTeam () {
		if (!this.teamId) {
			return ;
		}
		const teamId = this.teamId.toLowerCase();
		this.logger.log(`Deleting team ${teamId}...`);
		try {
			await this.mongoClient.mongoCollections.teams.deleteById(teamId, { overrideHintRequired: true });
		}
		catch (error) {
			throw `unable to delete team: ${JSON.stringify(error)}`;
		}
	}

	async deleteCompany () {
		if (!this.team) {
			return;
		}
		this.company = await this.mongoClient.mongoCollections.companies.getById(this.team.companyId);
		if (!this.company) { return; }
		
		if ((this.company.teamIds || []).length === 1 && this.company.teamIds[0] === this.team.id) {
			this.logger.log(`Deleting company ${this.team.companyId}...`);
			try {
				await this.mongoClient.mongoCollections.companies.deleteById(
					this.team.companyId,
					{ overrideHintRequired: true }
				);
			}
			catch (error) {
				throw `unable to delete company: ${JSON.stringify(error)}`;
			}
		} 
		else {
			try {
				this.logger.log(`Removing team from company ${this.team.companyId}...`);
				await this.mongoClient.mongoCollections.companies.updateDirect(
					{ id: this.mongoClient.mongoCollections.companies.objectIdSafe(this.team.companyId) },
					{ $pull: { teamIds: this.team.id } }
				);
			}
			catch (error) {
				throw `unable to remove team from company: ${JSON.stringify(error)}`;
			}
		}
	}

	async deleteUsers () {
		if (this.teamId) {
			await this.removeUsersFromTeam();
			if (this.deleteTeamlessUsers) {
				await this.deleteWouldBeTeamlessUsers();
			}
		}
		else if (this.userIdOrEmail) {
			await this.deleteSingleUser();
		}
	}

	async deleteWouldBeTeamlessUsers () {
		const userIdsToDelete = this.users
			.filter(user => {
				return (
					(user.teamIds || []).length === 1 &&
					user.teamIds[0] === this.teamId
				);
			})
			.map(user => user.id);

		if (userIdsToDelete.length === 0) {
			return;
		}
		this.logger.log(`Deleting ${userIdsToDelete.length} users...`);
		try {
			await this.mongoClient.mongoCollections.users.deleteByIds(userIdsToDelete, { overrideHintRequired: true });
		}
		catch (error) {
			throw `unable to delete users: ${JSON.stringify(error)}`;
		}
	}

	async removeUsersFromTeam () {
		this.logger.log('Removing users from team...');
		try {
			await this.mongoClient.mongoCollections.users.updateDirect(
				{ teamIds: this.teamId },
				{ $pull: { teamIds: this.teamId } },
			);
		}
		catch (error) {
			throw `unable to remove users from team: ${JSON.stringify(error)}`;
		}
	}

	async deleteSingleUser () {
		this.logger.log(`Deleting user ${this.userIdOrEmail}...`);
		try {
			await this.mongoClient.mongoCollections.users.deleteById(this.user.id, { overrideHintRequired: true });
		}
		catch (error) {
			throw `unable to delete user: ${JSON.stringify(error)}`;
		}
	}

	
	async deleteStreams () {
		this.logger.log(`Deleting streams in team ${this.teamId}...`);
		try {
			await this.mongoClient.mongoCollections.streams.deleteByQuery(
				{ teamId: this.teamId },
				{ overrideHintRequired: true }
			);
		}
		catch (error) {
			throw `unable to delete streams: ${JSON.stringify(error)}`;
		}
	}

	async deletePosts () {
		this.logger.log(`Deleting posts in team ${this.teamId}...`);
		try {
			await this.mongoClient.mongoCollections.posts.deleteByQuery(
				{ teamId: this.teamId },
				{ overrideHintRequired: true }
			);
		}
		catch (error) {
			throw `unable to delete posts: ${JSON.stringify(error)}`;
		}
	}

	async deleteCodemarks () {
		this.logger.log(`Deleting codemarks in team ${this.teamId}...`);
		try {
			await this.mongoClient.mongoCollections.codemarks.deleteByQuery(
				{ teamId: this.teamId },
				{ overrideHintRequired: true }
			);
		}
		catch (error) {
			throw `unable to delete codemarks: ${JSON.stringify(error)}`;
		}
	}

	async deleteMarkers () {
		this.logger.log(`Deleting markers in team ${this.teamId}...`);
		try {
			await this.mongoClient.mongoCollections.markers.deleteByQuery(
				{ teamId: this.teamId },
				{ overrideHintRequired: true }
			);
		}
		catch (error) {
			throw `unable to delete markers: ${JSON.stringify(error)}`;
		}
	}

	async deleteMarkerLocations () {
		this.logger.log(`Deleting marker locations in team ${this.teamId}...`);
		try {
			await this.mongoClient.mongoCollections.markerLocations.deleteByQuery(
				{ teamId: this.teamId },
				{ overrideHintRequired: true }
			);
		}
		catch (error) {
			throw `unable to delete marker locations: ${JSON.stringify(error)}`;
		}
	}
}

module.exports = Deleter;
