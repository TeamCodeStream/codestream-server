import { SqsConsumer } from "./sqs_consumer";
import { Logger, SqsMessageListener } from "./types";
export type Options = {
    queueUrl: string;
    logger: Logger;
    sqsMessageListener: SqsMessageListener;
};
export declare function initializeQueue(options: Options): SqsConsumer;
//# sourceMappingURL=sqs_manager.d.ts.map