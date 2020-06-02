
'use strict';

const StructuredConfigBase = require('./structured_config_base');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

const mongoConnections = {};  // mongo connection cache by 'mongoUrl:collectionName'

// a promise to wait
function waitABit() {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, 1000);
		console.log('timeout set');
	});
}

class StructuredConfigMongo extends StructuredConfigBase {
	constructor (options = {}) {
		super(options);
		this.configCollection = options.mongoCfgCollection || 'structuredConfiguration';
	}

	async initialize(initOptions = {}) {
		await this._connectToMongo();
		super.initialize(initOptions);
	}

	// connect to mongo, syncronously - retry forever
	async _connectToMongo() {
		const collectionCacheKey = this._buildMongoCollectionCacheKey();
		if (this.mongoClient) {
			// we're already connected
			return;
		}
		else if (collectionCacheKey && mongoConnections[collectionCacheKey]) {
			console.log('using cached mongo connection');
			this.mongoClient = mongoConnections[collectionCacheKey].mongoClient;
			this.db = mongoConnections[collectionCacheKey].db;
			return;
		}
		console.log(`connecting to ${this.options.mongoUrl}`);
		try {
			this.mongoClient = await MongoClient.connect(this.options.mongoUrl, {
				reconnectTries: 0,
				useNewUrlParser: true,
				useUnifiedTopology: true
			});
			this.db = this.mongoClient.db();
			mongoConnections[collectionCacheKey] = {
				mongoClient: this.mongoClient,
				db: this.db
			};
		}
		catch (error) {
			console.warn(`mongo connect error '${error}'. Will retry...`);
			await waitABit();
			await this._connectToMongo(this.options.mongoUrl);
		}
	}

	// load configuration data from mongo
	async _loadConfig() {
		const searchBy = { schemaVersion: this.schemaVersion || this._defaultSchemaVersion() };
		// console.log(searchBy);
		try {
			// load the most recent config for this schema version
			const dataDoc = (await this.db.collection(this.configCollection).find(searchBy).sort({ timeStamp: -1 }).limit(1).toArray())[0];
			this.mongoConfigTime = dataDoc.timeStamp;
			return dataDoc.configData;
		}
		catch (error) {
			console.error(`_loadConfigDataFromMongo() failed: ${error}`);
			return;
		}
	}

	_buildMongoCollectionCacheKey() {
		return `${this.options.mongoUrl}:${this.configCollection}`;
	}

	/**
	 * @returns {boolean}  	 true if the configuration needs to be reloaded from the source
	 */
	async isDirty() {
		const searchBy = { schemaVersion: this.schemaVersion || this._defaultSchemaVersion() };
		try {
			// load the most recent config for this schema version
			const dataDocHeader = (await this.db.collection(this.configCollection).find(searchBy).sort({timeStamp: -1}).project({configData: -1}).limit(1).toArray())[0];
			return dataDocHeader.timeStamp > this.mongoConfigTime;
		}
		catch (error) {
			console.error(`_loadConfigDataFromMongo() failed: ${error}`);
			return false;
		}
	}

	/**
	 * Fetch a specific configuration without loading it into this object instance
	 * 
	 * @param {string} serialNumber    - serial number of config to fetch
	 */
	async getConfigBySerial(serialNumber) {
		const docId = {_id: new ObjectID(serialNumber)};
		try {
			const result = await this.db.collection(this.configCollection).findOne(docId);
			return result.configData;
		}
		catch (error) {
			console.error(`_getConfigBySerial() failed: ${error}`);
			return;
		}
	}

	/**
	 * @typedef {addConfigReturnObject}      - meta data from recent insertion
	 * @property {string}     serialNumber   - object Id as a string
	 * @property {number}     timeStamp      - date as milisecs (Date.now())
	 * @property {number}     schemaVersion  - schema version
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
			timeStamp: Date.now()
		};
		try {
			const result = await this.db.collection(this.configCollection).insertOne(configDoc);
			await this.db.collection(this.configCollection).createIndex({ schemaVersion: 1, timeStamp: -1 }, { name: 'bySchema' });
			return {
				serialNumber: result.insertedId,
				timeStamp: configDoc.timeStamp,
				schemaVersion: configDoc.schemaVersion
			};
		}
		catch (error) {
			console.error(`addNewConfigToMongo() failed: ${error}`);
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
		const docId = {_id: new ObjectID(serialNumber)};
		try {
			await this.db.collection(this.configCollection).deleteOne(docId);
			return true;
		}
		catch (error) {
			console.error(`deleteConfigFromMongo() failed: ${error}`);
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
		const searchBy = reportOptions.schemaVersion ? {schemaVersion: reportOptions.schemaVersion} : null;
		try {
			const results = await this.db.collection(this.configCollection).find(searchBy).project({_id: 1, schemaVersion: 1, timeStamp: 1}).toArray();
			results.forEach(doc => {
				doc.serialNumber = ObjectID(doc._id).toString();
			});
			return results;
		}
		catch (error) {
			console.error(`getConfigSummary() failed: ${error}`);
			return;
		}
	}
}

module.exports = StructuredConfigMongo;
