export interface LoginResult {
    accessToken: string;
    user: {
        id: string;
        username: string;
        email: string;
        preferences?: {
            notifications?: string
        }
    }
}
export interface PostResult {    
    post?: Post;
    review?: Codemark;
    codemark?: Review;
}

export interface Post {
    id: string;
}

export interface Codemark {
    id: string;
    title?: string;
    text?: string
}

export interface Review {
    id: string;
    title?: string;
    text?: string
}

export interface ReplyBase {
    text?: string;
}
export class Reply implements ReplyBase {
    constructor(public text: string) {
    }
}
export class CodemarkReply implements ReplyBase {
    constructor(public text: string, public markerCount: number = 1) {
    }
}
