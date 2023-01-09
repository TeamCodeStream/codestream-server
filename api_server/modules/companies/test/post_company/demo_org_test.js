'use strict';

const PostCompanyTest = require('./post_company_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client.js');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const fs = require('fs');
const path = require('path');

var CodeStreamApiConfig;
var ReusableMongoClient;

class DemoOrgTest extends PostCompanyTest {

    constructor (options) {
        super(options);
        this.oneUserPerOrg = true;
    }

    before (callback) {
        BoundAsync.series(this, [
            super.before,
            this.setupMongo
        ], callback);
    }

    async after (callback) {
        if (this.mongoClient) {
            this.mongoClient.close().then(callback);
        } else {
            callback();
        }
    }

    setupMongo (callback) {
        if (!CodeStreamApiConfig) {
            ApiConfig.loadPreferredConfig().then((CodeStreamApiConfig) => {
                this.apiConfig = CodeStreamApiConfig;

                // set up the mongo client, and open it against a test collection
                if (!ReusableMongoClient) {
                    this.mongoClientFactory = new MongoClient({
                        collections: ['codemarks', 'demoTemplates'],
                        // mockMode: this.mockMode
                    });
                    this.mongoClientFactory.openMongoClient(this.apiConfig.storage.mongo).then(ReusableMongoClient => {
                        this.mongoClient = ReusableMongoClient;
                        callback();
                    });
                }

            });
        }
    }

    get description () {
        return 'should create codemarks and reviews when demo query param passed in';
    }

    run (callback) {
        BoundAsync.series(this, [
            super.run,
            this.populateTestData,
            this.doCreateCompanyWithDemo,
            this.validateMongoData
        ], callback);
    }

    populateTestData (callback) {
        const demoTemplates = this.mongoClient.mongoCollections.demoTemplates;
        const testData = JSON.parse(fs.readFileSync(path.join(__dirname, './testDemoTemplates.json')).toString())[0];
        demoTemplates.deleteByQuery({name: 'Demo1'}).then(() => {
            demoTemplates.create(testData, {noVersion: true});
            callback();
        });
    }

    validateMongoData (callback) {
        // Latest data not there without the timeout
        // TODO see if performing demo org operations in process instead of postProcess fixes this
        // setTimeout(() => {
        this.mongoClient.mongoCollections.codemarks
            .getByQuery({_forTesting: true}, {sort: {createdAt: -1}, limit: 1})
            .then(result => {
                // console.log(`*** query result ${JSON.stringify(result[0])}`);
                const diff = Date.now() - result[0].createdAt;
                // console.log(`*** diff ${diff} for codemark id: ${result[0]._id}`);
                Assert(diff < 1000, 'result is recent');
                Assert(result[0].text === 'is this good?', `codemark id: ${result[0]._id} text: ${result[0].text}`);
                callback();
            });
        // }, 200);

    }

    doCreateCompanyWithDemo (callback) {
        this.doApiRequest(
            {
                method: 'post',
                path: '/companies?demo=1',
                data: this.data,
                token: this.token,
            },
            callback
        );
    }

    validateResponse (data) {
        // console.log(`*** validateResponse`);
        // console.log(JSON.stringify(data));
        // console.log(`*** this`, this);
        Assert(data.accessToken !== undefined, 'accessToken was defined in the fetched user');
        Assert(data.userId !== undefined, 'userId was defined in the fetched user');
        Assert(data.teamId !== undefined, 'teamId was defined in the fetched user');
    }
}

module.exports = DemoOrgTest;
