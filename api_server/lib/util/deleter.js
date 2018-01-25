const MongoClient = require(process.env.CS_API_TOP + '/lib/util/mongo/mongo_client');
const MongoConfig = require(process.env.CS_API_TOP + '/config/mongo');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const ObjectID = require('mongodb').ObjectID;
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');
const RepoIndexes = require(process.env.CS_API_TOP + '/modules/repos/indexes');
const StreamIndexes = require(process.env.CS_API_TOP + '/modules/streams/indexes');

const COLLECTIONS = ['companies', 'teams', 'repos', 'users', 'streams', 'posts', 'markers', 'markerLocations'];


class Deleter {

	go (options, callback) {
		Object.assign(this, options);
		this.logger = this.logger || console;
		BoundAsync.series(this, [
			this.openMongoClient,
			this.getTargetObject,
			this.getUsers,
			this.getRepos,
			this.getStreams,
			this.deleteRepos,
			this.deleteTeam,
			this.deleteCompany,
			this.deleteUsers,
			this.deleteStreams,
			this.deletePosts,
			this.deleteMarkers,
			this.deleteMarkerLocations
		], callback);
	}

	openMongoClient (callback) {
		this.mongoClient = new MongoClient();
		let mongoConfig = Object.assign({}, MongoConfig, { collections: COLLECTIONS });
		delete mongoConfig.queryLogging;
		this.mongoClient.openMongoClient(
			mongoConfig,
			error => {
				if (error) { 
					return callback('unable to open mongo client: ' + JSON.stringify(error));
				}
				callback();
			}
		);
	}

	getTargetObject (callback) {
		if (this.teamIdOrName) {
			this.getTeam(callback);
		}
		else if (this.repoId) {
			this.getRepo(callback);
		}
		else if (this.userIdOrEmail) {
			this.getUser(callback);
		}
		else {
			return callback('must provide team, repo, or user');
		}
	}

	getTeam (callback) {
		if (!this.teamIdOrName) {
			return callback();
		}
		try {
			this.teamId = ObjectID(this.teamIdOrName).toString();
			return this.getTeamById(callback);
		}
		catch (error) {
			return this.getTeamByName(callback);
		}
	}

	getTeamById (callback) {
		this.mongoClient.mongoCollections.teams.getById(
			this.teamId,
			(error, team) => {
				if (error) {
					return callback('unable to fetch team: ' + JSON.stringify(error));
				}
				this.team = team;
				callback();
			},
			{
				fields: ['_id', 'companyId']
			}
		);
	}

	getTeamByName (callback) {
		this.mongoClient.mongoCollections.teams.getByQuery(
			{ name: this.teamIdOrName },
			(error, teams) => {
				if (error) {
					return callback('unable to fetch team: ' + JSON.stringify(error));
				}
				if (teams.length === 0) {
					return callback('team not found: ' + this.teamIdOrName);
				}
				this.team = teams[0];
				this.teamId = this.team._id;
				callback();
			},
			{
				fields: ['_id', 'companyId'],
				overrideHintRequired: true
			}
		);
	}

	getRepo (callback) {
		this.mongoClient.mongoCollections.repos.getById(
			this.repoId,
			(error, repo) => {
				if (error) { 
					return callback('unable to fetch repo: ' + JSON.stringify(error));
				}
				else if (!repo) {
					return callback('repo not found: ' + this.repoId);
				}
				this.repo = repo;
				callback();
			}
		);
	}

	getUser (callback) {
		try {
			this.userId = ObjectID(this.userIdOrEmail).toString();
		}
		catch (error) {
			return this.getUserByEmail(callback);
		}
		this.getUserById(callback);
	}

	getUserByEmail (callback) {
		this.mongoClient.mongoCollections.users.getByQuery(
			{ searchableEmail: this.userIdOrEmail.toLowerCase() },
			(error, users) => {
				if (error) {
					return callback('unable to fetch user by email: ' + JSON.stringify(error));
				}
				else if (users.length === 0) {
					return callback('user not found: ' + this.userIdOrEmail);
				}
				this.user = users[0];
				callback();
			},
			{
				fields: ['_id'],
				hint: UserIndexes.bySearchableEmail
			}
		);
	}

	getUserById (callback) {
		this.mongoClient.mongoCollections.users.getById(
			this.userIdOrEmail,
			(error, user) => {
				if (error) { 
					return callback('unable to fetch user: ' + JSON.stringify(error));
				}
				else if (!user) {
					return callback('user not found: ' + this.userIdOrEmail);
				}
				this.user = user;
				callback();
			}
		);
	}

	getUsers (callback) {
		if (!this.teamId) {
			return callback();
		}
		this.mongoClient.mongoCollections.users.getByQuery(
			{ teamIds: this.teamId },
			(error, users) => {
				if (error) {
					return callback('unable to fetch users by team: ' + JSON.stringify(error));
				}
				this.users = users;
				callback();
			},
			{
				fields: ['_id', 'teamIds'],
				hint: UserIndexes.byTeamIds
			}
		);
	}

	getRepos (callback) {
		if (!this.teamId) {
			return callback();
		}
		this.mongoClient.mongoCollections.repos.getByQuery(
			{ teamId: this.teamId },
			(error, repos) => {
				if (error) { 
					return callback('unable to fetch repos by team: ' + JSON.stringify(error));
				}
				this.repoIds = repos.map(repo => repo._id);
				callback();
			},
			{
				fields: ['_id'],
				hint: RepoIndexes.byTeamId
			}
		);
	}

	getStreams (callback) {
		let query, hint;
		if (this.teamId) {
			query = { teamId: this.teamId };
			hint = StreamIndexes.byName;
		}
		else {
			if (!this.repoIds && !this.repoId) {
				return callback();
			}
			this.repoIds = this.repoIds || [this.repoId];
			query = { repoId: { $in: this.repoIds } };
			hint = StreamIndexes.byFile;
		}
		this.mongoClient.mongoCollections.streams.getByQuery(
			query,
			(error, streams) => {
				if (error) { 
					return callback('unable to fetch streams by repo: ' + JSON.stringify(error));
				}
				this.streamIds = streams.map(stream => stream._id);
				callback();
			},
			{
				fields: ['_id'],
				hint: hint
			}
		);
	}

	deleteRepos (callback) {
		if (this.teamId) {
			this.deleteReposByTeamId(callback);
		}
		else if (this.repoId) {
			this.deleteRepoById(callback);
		}
		else {
			callback();
		}
	}

	deleteReposByTeamId (callback) {
		this.logger.log(`Deleting repos in team ${this.teamId}...`);
		this.mongoClient.mongoCollections.repos.deleteByQuery(
			{ teamId: this.teamId },
			error => {
				if (error) {
					return callback('unable to delete repo: ' + JSON.stringify(error));
				}
				callback();
			}
		);
	}

	deleteRepoById (callback) {
		let repoId = this.repoId.toLowerCase();
		this.logger.log(`Deleting repo ${repoId}...`);
		this.mongoClient.mongoCollections.repos.deleteById(
			this.repoId.toLowerCase(),
			error => {
				if (error) { 
					return callback('unable to delete repo: ' + JSON.stringify(error));
				}
				callback();
			}
		);
	}

	deleteTeam (callback) {
		if (!this.teamId) {
			return callback();
		}
		let teamId = this.teamId.toLowerCase();
		this.logger.log(`Deleting team ${teamId}...`);
		this.mongoClient.mongoCollections.teams.deleteById(
			this.teamId.toLowerCase(),
			error => {
				if (error) {
					return callback('unable to delete team: ' + JSON.stringify(error));
				}
				callback();
			}
		);
	}

	deleteCompany (callback) {
		if (!this.team) {
			return callback();
		}
		this.logger.log(`Deleting company ${this.team.companyId}...`);
		this.mongoClient.mongoCollections.companies.deleteById(
			this.team.companyId,
			error => {
				if (error) {
					return callback('unable to delete company: ' + JSON.stringify(error));
				}
				callback();
			}
		);
	}

	deleteUsers (callback) {
		if (this.teamId) {
			this.removeUsersFromTeam(error => {
				if (error) { return callback(error); }
				if (this.deleteTeamlessUsers) {
					this.deleteWouldBeTeamlessUsers(callback);
				}
				else {
					callback();
				}
			});
		}
		else if (this.userIdOrEmail) {
			this.deleteSingleUser(callback);
		}
		else {
			callback();
		}
	}

	deleteWouldBeTeamlessUsers (callback) {
		let userIdsToDelete = this.users
			.filter(user => {
				return (
					(user.teamIds || []).length === 1 && 
					user.teamIds[0] === this.teamId
				);
			})
			.map(user => user._id);


		if (userIdsToDelete.length === 0) {
			return callback();
		}
		this.logger.log(`Deleting ${userIdsToDelete.length} users...`);
		this.mongoClient.mongoCollections.users.deleteByIds(
			userIdsToDelete,
			error => {
				if (error) {
					return callback('unable to delete users: ' + JSON.stringify(error));
				}
				callback();
			}
		);
	}

	removeUsersFromTeam (callback) {
		this.logger.log('Removing users from team...');
		this.mongoClient.mongoCollections.users.updateDirect(
			{ teamIds: this.teamId },
			{ $pull: { teamIds: this.teamId } },
			error => {
				if (error) {
					return callback('unable to remove users from team: ' + JSON.stringify(error));
				}
				callback();
			}
		);
	}

	deleteSingleUser (callback) {
		this.logger.log(`Deleting user ${this.userIdOrEmail}...`);
		this.mongoClient.mongoCollections.users.deleteById(
			this.user._id,
			error => {
				if (error) {
					return callback('unable to delete user: ' + JSON.stringify(error));
				}
				callback();
			}
		);
	}

	deleteStreams (callback) {
		if (!this.streamIds || this.streamIds.length === 0) {
			return callback();
		}
		this.logger.log(`Deleting ${this.streamIds.length} streams...`);
		this.mongoClient.mongoCollections.streams.deleteByIds(
			this.streamIds,
			error => {
				if (error) { 
					return callback('unable to delete streams: ' + JSON.stringify(error));
				}
				callback();
			}
		);
	}

	deletePosts (callback) {
		if (!this.streamIds || this.streamIds.length === 0) {
			return callback();
		}
		this.logger.log(`Deleting posts in ${this.streamIds.length} streams...`);
		this.mongoClient.mongoCollections.posts.deleteByQuery(
			{ streamId: { $in: this.streamIds } },
			error => {
				if (error) {
					return callback('unable to delete posts: ' + JSON.stringify(error));
				}
				callback();
			}
		);
	}

	deleteMarkers (callback) {
		if (!this.streamIds || this.streamIds.length === 0) {
			return callback();
		}
		this.logger.log(`Deleting markers in ${this.streamIds.length} streams...`);
		this.mongoClient.mongoCollections.markers.deleteByQuery(
			{ streamId: { $in: this.streamIds } },
			error => {
				if (error) {
					return callback('unable to delete markers: ' + JSON.stringify(error));
				}
				callback();
			}
		);
	}

	deleteMarkerLocations (callback) {
		if (!this.streamIds || this.streamIds.length === 0) {
			return callback();
		}
		this.logger.log(`Deleting marker locations in ${this.streamIds.length} streams...`);
		this.mongoClient.mongoCollections.markerLocations.deleteByQuery(
			{ streamId: { $in: this.streamIds } },
			error => {
				if (error) {
					return callback('unable to delete marker locations: ' + JSON.stringify(error));
				}
				callback();
			}
		);
	}
}

module.exports = Deleter;

