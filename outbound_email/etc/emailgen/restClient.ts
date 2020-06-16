import * as rm from 'typed-rest-client/RestClient';
import { sleep, defaultSleep } from './flows';

export class RestClient {
    constructor(private restClient: rm.RestClient) {
    }
    async get<T>(path: string, requestOptions?: any) {
        await sleep(defaultSleep);
        return await this.restClient.get<T>(path, requestOptions);
    }
    async post<T>(path: string, params: any, headers: any) {
        await sleep(defaultSleep);
        return await this.restClient.create<T>(path, params, headers);
    }
    async put<T>(path: string, params: any, headers?: any) {
        await sleep(defaultSleep);
        return await this.restClient.replace<T>(path, params, headers);
    }
}
