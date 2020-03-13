import { LoginResult } from './models';
export class State {
    loginResult: LoginResult;
    options: {
        // the email of a user you'd like to annoy via email
        otherEmail: string;
    };
    repos: any[];
    stream: any;
    streamId: string;
    repo: any;
    repoId: string;
    otherUser: {
        id: string;
        username: string;
    };
    
    // function to replace text tokens
    buildText(text: string) {
        if (!text)
            return '';
        if (!this.loginResult || !this.loginResult.user || !this.loginResult.user.username) {
            throw new Error('username required');
        }
        text = text
            .replace(/{{atUser}}/g, `@${this.loginResult.user.username}`)
            .replace(/{{atOtherUser}}/g, this.otherUser ? `@${this.otherUser.username}` : '<NA>');
        return text;
    }
}
