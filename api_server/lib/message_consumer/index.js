const { initializeQueue } = require('sqs-consumer');

class MessageConsumer {
    constructor (logger) {
        this.logger = logger;
    }

    consume() {
        const sqsConsumer = initializeQueue({
            // TODO pass from config parameter
            queueUrl: "https://sqs.us-east-1.amazonaws.com/597411941992/user-org-lifecycle-staging-queue",
            logger: this.logger,
            sqsMessageListener: this
        });
        sqsConsumer.start();
    }

    onOrganizationUpdate(message) {
        this.logger.info(`Received org update message ${message.type} ${message.data.target.name}`);
    }

    onOrganizationCreate(message) {
        this.logger.info(`Received org create message ${message.type} ${message.data.target.name}`);
    }

    onOrganizationDelete(message) {
        this.logger.info(`Received org update message ${message.type} ${message.data.target.name}`);
    }

    onUserCreate(message) {
        this.logger.info(`Received user create message ${message.type} ${message.data.target.email}`);
    }

    onUserUpdate(message) {
        this.logger.info(`Received user update message ${message.type} ${message.data.target.email}`);
    }

    onUserDelete(message) {
        this.logger.info(`Received user delete message ${message.type} ${message.data.target.email}`);
    }

    // onUserSelfTierChange(message) {
    //     this.logger.info(`Received user self tier change message ${message.type} ${message.data.target.email}`);
    // }
    //
    // onUserAddRoles(message) {
    //     this.logger.info(`Received user add roles message ${message.type} ${message.meta.summary}`);
    // }
    //
    // onUserPasswordChanged(message) {
    //     this.logger.info(`Received user password changed message ${message.type} ${message.data.target.user_id}`);
    // }
}

module.exports = MessageConsumer;
