
'use strict';

const hjson = require('hjson');
const path = require('path');
const util = require('util');
const Fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const StructuredConfigBase = require('./structured_config_base');

const mongoConnections = {};  // mongo connection cache by 'mongoUrl:collectionName'

// a promise to wait
function waitABit() {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, 1000);
		console.debug('structured_config_mongo:waitABit(): timeout set');
	});
}

class StructuredConfigMongo extends StructuredConfigBase {
	constructor(options = {}) {
		// the configType MUST match structured_config_base.ConfigTypes.mongo
		super({ ...options, configType: 'mongo' });
		this.configCollection = options.mongoCfgCollection || 'structuredConfiguration'; // collection containing configs
		this.selectedCollection = `${this.configCollection}Selected`; // contains one document which points to the selected config
		this.customSchemaMigrationMatrix = options.customSchemaMigrationMatrix || null;
		this.loadDefaultCfgFrom = options.loadDefaultCfgFrom || null;
		this.loadDefaultCfgInstallationFunc = options.loadDefaultCfgInstallationFunc || null;
	}

	// In schema version sequential order (lowest @ curVer), we iterate through the
	// entries of the migrationMatrix, converting the native config until we reach
	// the targetVer.
	//
	// nativeCfg will be modified by this process
	migrateNativeConfig(nativeCfg, curVer, targetVer) {
		let migrationVer = curVer;
		let newConfig = Object.assign({}, nativeCfg);
		console.log(`migration from ${curVer} to ${targetVer}`);
		this.customSchemaMigrationMatrix.forEach(([from, to, migrationFunc]) => {
			if (migrationVer < targetVer && migrationVer === from) {
				this.logger.log(`migrating config from schema ${from} to schema ${to}`);
				newConfig = migrationFunc(newConfig, from, to, this.logger) || newConfig;
				migrationVer = to;
			} else {
				migrationVer++;
			}
		});
		return newConfig;
	}

	performMigrationUsing(migrationMatrix) {
		this.customSchemaMigrationMatrix = migrationMatrix;
	}

	loadDefaultConfigIfNoneFrom(defaultCfgFile, installationFunc) {
		this.loadDefaultCfgFrom = defaultCfgFile;  // json file containing default config
		this.loadDefaultCfgInstallationFunc = installationFunc;  // func to process default config before saving
	}

	// true if there are no configs (empty db)
	async _noConfigs() {
		return await this.db.collection(this.configCollection).countDocuments() === 0
	}

	async _saveDefaultConfig(defaultCfg, schemaVersion) {
		const configDoc = await this.addNewConfigToMongo(defaultCfg, {
			schemaVersion,
			desc: `default config loaded from ${path.basename(this.loadDefaultCfgFrom)}`,
		});
		if (!configDoc) {
			this.logger.error('failed to write default config');
		} else {
			this.logger.log(
				util.inspect(
					{
						schemaVersion: configDoc.schemaVersion,
						serialNumber: configDoc.serialNumber,
						revision: configDoc.revision,
						timeStamp: configDoc.timeStamp,
						UTC: new Date(configDoc.timeStamp).toUTCString(),
					},
					false,
					null,
					true /* enable colors */
				)
			);
		}
		return configDoc;
	}

	// find most recent config whose schema is <= schemaVersion
	async _loadMostRecentConfigDocForSchema(schemaVer) {
		const results = await this.db
			.collection(this.configCollection)
			.aggregate([
				{
					$match: {
						schemaVersion: { $lte: schemaVer }	// all docs whose schema is on or before this one
					}
				},
				{
					$sort: {	// sort by schemaver+rev, highest (most recent) first
						schemaVersion: -1,
						revision: -1
					}
				},
				{
					$group: {
						_id: null, // the group is the entire set of docs
						configDoc: { $first: "$$ROOT" }	// discard all but the first doc in the sorted list
					}
				}
			])
			.toArray();
		return results.length ? results[0].configDoc : null;
	}

	// schema upgrades happen during initialization
	async initialize(initOptions = {}) {
		const schemaVersion = this._defaultSchemaVersion();
		await this._connectToMongo();
		if (await this._noConfigs() && this.loadDefaultCfgFrom) {
			// no config was found and a default to load was specified...
			this.logger.log(`creating new config from ${this.loadDefaultCfgFrom}`);
			let defaultCfg = hjson.parse(Fs.readFileSync(this.loadDefaultCfgFrom, 'utf8'));
			if (this.loadDefaultCfgInstallationFunc) {
				defaultCfg = this.loadDefaultCfgInstallationFunc(defaultCfg) || defaultCfg;
			}
			const configDoc = await this._saveDefaultConfig(defaultCfg, schemaVersion);
			await this.activateMongoConfig(configDoc.serialNumber);
		} else if (this.customSchemaMigrationMatrix) {
			// perhaps a migration...
			const mostRecentConfigDoc = await this._loadMostRecentConfigDocForSchema(schemaVersion);
			if (mostRecentConfigDoc && mostRecentConfigDoc.schemaVersion < schemaVersion) {
				// an existing config exists but it doesn't match the default
				// (current) schema version. Let's migrate!!
				this.logger.log(
					`migrating config from schema ${mostRecentConfigDoc.schemaVersion}.${mostRecentConfigDoc.revision} to ${schemaVersion}.0`
				);
				const updatedConfig = this.migrateNativeConfig(
					mostRecentConfigDoc.configData, // starting config
					mostRecentConfigDoc.schemaVersion, // from schema
					schemaVersion // to schema
				);
				const configDoc = await this._saveDefaultConfig(updatedConfig, schemaVersion);
				await this.activateMongoConfig(configDoc.serialNumber);
			} else if (!mostRecentConfigDoc || mostRecentConfigDoc.schemaVersion > schemaVersion) {
				// no config eligible for migration
				this.logger.error(
					`schema migration could not find any config with schemaVersion <= ${schemaVersion}`
				);
			} else {
				// no migration necessary
			}
		}
		super.initialize(initOptions);
	}

	// connect to mongo, syncronously - retry forever
	async _connectToMongo() {
		const collectionCacheKey = this._buildMongoCollectionCacheKey();
		if (this.mongoClient) {
			// we're already connected
			return;
		} else if (collectionCacheKey && mongoConnections[collectionCacheKey]) {
			this.logger.log('using cached mongo connection');
			this.mongoClient = mongoConnections[collectionCacheKey].mongoClient;
			this.db = mongoConnections[collectionCacheKey].db;
			return;
		}
		if (!this.options.quiet) {
			this.logger.log(`connecting to ${this.options.mongoUrl}`);
		}
		try {
			this.mongoClient = await MongoClient.connect(this.options.mongoUrl, {
				reconnectTries: 0,
				useNewUrlParser: true,
				useUnifiedTopology: true,
			});
			this.db = this.mongoClient.db();
			mongoConnections[collectionCacheKey] = {
				mongoClient: this.mongoClient,
				db: this.db,
			};
		} catch (error) {
			this.logger.warn(`mongo connect error '${error}'. Will retry...`);
			await waitABit();
			await this._connectToMongo(this.options.mongoUrl);
		}
	}

	getMongoClient() {
		return this.mongoClient;
	}

	// load configuration data from mongo
	async _loadConfig() {
		let activeConfig = await this.db.collection(this.selectedCollection).findOne();
		if (!activeConfig) {
			this.logger.warn(
				`no config appears to have been activated. could not find any document in ${this.selectedCollection}`
			);
		} else {
			this.logger.debug(`active config serial is ${activeConfig.serialNumber}`);
		}
		try {
			let configDoc;
			if (activeConfig) {
				this.logger.debug(
					`attempting to load active config with serialNumber = ${activeConfig.serialNumber}`
				);
				configDoc = await this.db
					.collection(this.configCollection)
					.findOne({ _id: new ObjectID(activeConfig.serialNumber) });
				if (!configDoc) {
					this.logger.error(`active config ${activeConfig.serialNumber} not found`);
					activeConfig = null;
				}
			}
			if (!configDoc) {
				const schemaVersion = this.schemaVersion || this._defaultSchemaVersion();
				this.logger.warn(`attempting to load latest config for schema ${schemaVersion}`);
				configDoc = (
					await this.db
						.collection(this.configCollection)
						.find({ schemaVersion })
						.sort({ timeStamp: -1 })
						.limit(1)
						.toArray()
				)[0];
				if (!configDoc) {
					this.logger.error('No configuration found and no migration func exists');
					return;
				}
			}
			this.logger.log(
				`config serial ${ObjectID(configDoc._id).toString()} (${new Date(
					configDoc.timeStamp
				).toUTCString()}) loaded`
			);
			this.mongoConfigDoc = {
				...configDoc,
				serialNumber: ObjectID(configDoc._id).toString(),
			};
			if (!activeConfig) {
				// activate config since no prior activation was found
				this.logger.warn(
					`activating config just loaded ${ObjectID(
						configDoc._id
					).toString()} to preserve integrtiry`
				);
				await this.activateMongoConfig(ObjectID(configDoc._id).toString());
			}
			return configDoc.configData;
		} catch (error) {
			this.logger.error(`_loadConfigDataFromMongo() failed: ${error}`);
			return;
		}
	}

	getConfigMetaDocument(options = {}) {
		if (options.excludeConfigData) {
			const meta = Object.assign({}, this.mongoConfigDoc);
			delete meta.configData;
			return meta;
		}
		return this.mongoConfigDoc;
	}

	_buildMongoCollectionCacheKey() {
		return `${this.options.mongoUrl}:${this.configCollection}`;
	}

	/**
	 * @returns {boolean}  	 true if the configuration needs to be reloaded from the source
	 */
	async isDirty() {
		const searchBy = {
			schemaVersion: this.schemaVersion || this._defaultSchemaVersion(),
		};
		try {
			// load the most recent config for this schema version
			const dataDocHeader = (
				await this.db
					.collection(this.configCollection)
					.find(searchBy)
					.sort({ timeStamp: -1 })
					.project({ configData: -1 })
					.limit(1)
					.toArray()
			)[0];
			return dataDocHeader.timeStamp > this.mongoConfigDoc.timestamp;
		} catch (error) {
			this.logger.error(`_loadConfigDataFromMongo() failed: ${error}`);
			return false;
		}
	}

	/**
	 * Fetch a specific configuration without loading it into this object instance
	 *
	 * @param {string} serialNumber    - serial number of config to fetch
	 */
	async getConfigBySerial(serialNumber, options = {}) {
		const docId = { _id: new ObjectID(serialNumber) };
		try {
			const result = await this.db.collection(this.configCollection).findOne(docId);
			if (!result) {
				this.logger.error(`getConfigBySerial() failed: serial ${serialNumber} not found`);
				return;
			}
			if (options.includeMetaData) {
				return result;
			}
			return result.configData;
		} catch (error) {
			this.logger.error(`getConfigBySerial() failed: ${error}`);
			return;
		}
	}

	/**
	 * @typedef {addConfigReturnObject}      - meta data from recent insertion
	 * @property {string}     serialNumber   - object Id as a string
	 * @property {number}     timeStamp      - date as milisecs (Date.now())
	 * @property {number}     schemaVersion  - schema version
	 * @property {string}     desc           - description
	 */

	/**
	 * Insert a new configuration into mongo
	 *
	 * @param {object}      configData                    - new config data to be added
	 * @param {object}      [loadOptions]                 - load options
	 * @param {configData}  [loadOptions.schemaVersion]   - override schema version
	 *
	 * @returns {addConfigReturnObject}     meta data from newly inserted config
	 */
	async addNewConfigToMongo(configData, loadOptions = {}) {
		const configDoc = {
			configData,
			schemaVersion: loadOptions.schemaVersion || this._defaultSchemaVersion(),
			timeStamp: Date.now(),
			desc: loadOptions.desc,
		};

		try {
			// determine the new config's revision number
			let result = (
				await this.db
					.collection(this.configCollection)
					.aggregate([
						{ $match: { schemaVersion: configDoc.schemaVersion } },
						{
							$group: {
								_id: '$schemaVersion',
								maxRevision: { $max: '$revision' },
							},
						},
					])
					.toArray()
			)[0];
			configDoc.revision =
				!result || result.maxRevision == null
					? (await this.db
							.collection(this.configCollection)
							.countDocuments({ schemaVersion: configDoc.schemaVersion })) || 0
					: result.maxRevision + 1;

			// FIXME: we've got to do something better than reindex the collection with every write
			// write the new config and create an index
			result = await this.db.collection(this.configCollection).insertOne(configDoc);
			await this.db
				.collection(this.configCollection)
				.createIndex({ schemaVersion: 1, timeStamp: -1 }, { name: 'bySchema' });
			return {
				serialNumber: result.insertedId,
				revision: configDoc.revision,
				timeStamp: configDoc.timeStamp,
				schemaVersion: configDoc.schemaVersion,
				desc: configDoc.desc,
			};
		} catch (error) {
			this.logger.error(`addNewConfigToMongo() failed: ${error}`);
			return;
		}
	}

	/**
	 * Removes the specified configuration from mongo
	 *
	 * @param {number} serialNumber   - id of config to delete
	 *
	 * @returns {boolean}  true for success
	 */
	async deleteConfigFromMongo(serialNumber) {
		const docId = { _id: new ObjectID(serialNumber) };
		try {
			await this.db.collection(this.configCollection).deleteOne(docId);
			return true;
		} catch (error) {
			this.logger.error(`deleteConfigFromMongo() failed: ${error}`);
			return false;
		}
	}

	/**
	 * activate config for the given serial number. Does not load it!

	 * @param {*} reportOptions 
	 */
	async activateMongoConfig(serialNumber) {
		const newConfig = await this.db
			.collection(this.configCollection)
			.findOne({ _id: new ObjectID(serialNumber) });
		if (!newConfig) {
			this.logger.error(`activation of config ${serialNumber} failed. That config does not exist.`);
			return false;
		}
		const replacementDoc = { serialNumber: new ObjectID(serialNumber) };
		try {
			const activeConfig = await this.db.collection(this.selectedCollection).findOne();
			const filterDoc = activeConfig ? { serialNumber: activeConfig.serialNumber } : {};
			const results = await this.db
				.collection(this.selectedCollection)
				.replaceOne(filterDoc, replacementDoc, { upsert: true });
			if (results.modifiedCount === 1 || results.upsertedCount === 1) {
				this.logger.log(`activated config serial number ${serialNumber}`);
			} else {
				this.logger.error(
					`error activating config serial number n=${results.n} ${serialNumber}; ${results}`
				);
				return false;
			}
			return true;
		} catch (error) {
			this.logger.error(`activateMongoConfig() failed: ${error}`);
			return false;
		}
	}

	/**
	 * return a list of meta data objects about each config
	 *
	 * @param {object} [reportOptions]  - report options
	 * @param {number} [reportOptions.schemaVersion]  - limit meta data to configs for this schema version
	 */
	async getConfigSummary(reportOptions = {}) {
		const searchBy = reportOptions.schemaVersion
			? { schemaVersion: parseInt(reportOptions.schemaVersion, 10) }
			: null;
		// console.log('searchBy=', searchBy);
		try {
			const results = await this.db
				.collection(this.configCollection)
				.find(searchBy)
				.project({ configData: 0 })
				.sort({ schemaVersion: -1, revision: -1 })
				.toArray();
			results.forEach((doc) => {
				doc.serialNumber = ObjectID(doc._id).toString();
			});
			// console.log('getConfigSummary(): results', results);
			return results;
		} catch (error) {
			this.logger.error(`getConfigSummary() failed: ${error}`);
			return;
		}
	}
}

module.exports = StructuredConfigMongo;
