export namespace log {
    export var isVerbose = false;
    export function verbose(message: string) {
        if (!isVerbose) return;
        console.log(message);
    }
    export function debug(message: string) {
        console.log(message);
    }
    export function info(message: string) {
        console.log(message);
    }
    export function error(error: Error, message?: string) {
        console.error(error, message);
    }
}