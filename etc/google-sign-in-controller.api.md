## API Report File for "@dtinth/google-sign-in-controller"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

/// <reference types="gapi.auth2" />

// @public
export class GoogleSignInController {
    constructor(clientId: string);
    // (undocumented)
    clientId: string;
    currentUser: gapi.auth2.GoogleUser | undefined;
    getUserInfo(): UserInfo | null | undefined;
    onCurrentUserChanged(callback: () => void): () => void;
    signIn(): Promise<gapi.auth2.GoogleUser>;
    signOut(): Promise<any>;
}

// @public
export interface UserInfo {
    email: string;
    idToken: string;
    name: string;
}

// (No @packageDocumentation comment for this package)

```
