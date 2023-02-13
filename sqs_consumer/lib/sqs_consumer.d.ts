import { SQS } from "aws-sdk";
import { Logger, SqsMessageListener } from "./types";
export declare class SqsConsumer {
    private queueUrl;
    private logger;
    private sqsMessageListener;
    private client;
    private done;
    constructor(queueUrl: string, logger: Logger, sqsMessageListener: SqsMessageListener, client: SQS);
    start(): void;
    stop(): void;
    consume(): Promise<void>;
    processMessage(receiveResponse: SQS.ReceiveMessageResult, toDelete: string[]): void;
}
//# sourceMappingURL=sqs_consumer.d.ts.map