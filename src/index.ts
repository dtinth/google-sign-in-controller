import pMemoize from 'p-memoize'

/**
 * Loads the Google APIs client library and provides a simple interface to Google Sign-In.
 * @public
 */
export class GoogleSignInController {
  private currentUserChangedCallbacks = new Set<() => void>()

  /**
   * The current user.
   */
  public currentUser: gapi.auth2.GoogleUser | undefined

  /**
   * Initializes the GoogleSignInController.
   * @param clientId - The client ID of the application that is requesting authorization.
   */
  constructor(public clientId: string) {}

  private ensureGapiInitialized = pMemoize(async () => {
    // Load the Google API, if needed.
    if (!window.gapi) {
      const script = document.createElement('script')
      const loadPromise = new Promise((resolve, reject) => {
        script.onload = resolve
        script.onerror = reject
      })
      script.src = 'https://apis.google.com/js/platform.js'
      script.async = true
      document.body.appendChild(script)
      await loadPromise
    }

    // Load the auth2 library.
    await new Promise((resolve) => {
      window.gapi.load('auth2', resolve)
    })

    // Initialize the auth2 library.
    await gapi.auth2.init({ client_id: this.clientId }).then(
      () => true,
      (error) => {
        console.error('Unable to initialize gapi.auth2', error)
        return false
      },
    )

    const authInstance = gapi.auth2.getAuthInstance()
    authInstance.currentUser.listen((user) => {
      this.currentUser = user
      this.currentUserChangedCallbacks.forEach((callback) => callback())
    })
    this.currentUser = authInstance.currentUser.get()
    this.currentUserChangedCallbacks.forEach((callback) => callback())

    return gapi
  })

  /**
   * Registers a callback to be called when the current user changes.
   * @param callback - The callback to be called.
   * @returns A function that unregisters the callback.
   */
  onCurrentUserChanged(callback: () => void): () => void {
    this.ensureGapiInitialized()
    this.currentUserChangedCallbacks.add(callback)
    return () => {
      this.currentUserChangedCallbacks.delete(callback)
    }
  }

  /**
   * Sign in.
   */
  async signIn() {
    const gapi = await this.ensureGapiInitialized()
    const authInstance = gapi.auth2.getAuthInstance()
    return authInstance.signIn()
  }

  /**
   * Sign out.
   */
  async signOut() {
    const gapi = await this.ensureGapiInitialized()
    const authInstance = gapi.auth2.getAuthInstance()
    return authInstance.signOut()
  }

  /**
   * Returns a simplified version of the current user.
   * @returns - The current user information,
   *  or null if the user is not signed in,
   *  or undefined if the state is not known.
   */
  getUserInfo(): UserInfo | null | undefined {
    const { currentUser } = this
    if (!currentUser) {
      return undefined
    }
    if (!currentUser.isSignedIn()) {
      return null
    }
    return {
      name: currentUser.getBasicProfile().getName(),
      email: currentUser.getBasicProfile().getEmail(),
      idToken: currentUser.getAuthResponse().id_token,
    }
  }
}

/**
 * The user information.
 * @public
 */
export interface UserInfo {
  /**
   * Full name of the user.
   */
  name: string

  /**
   * Email address of the user.
   */
  email: string

  /**
   * The ID token of the user.
   */
  idToken: string
}
