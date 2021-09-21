import pMemoize from 'p-memoize'

/**
 * @public
 */
export class GoogleSignInController {
  private currentUserChangedCallbacks = new Set<() => void>()
  public currentUser: gapi.auth2.GoogleUser | undefined

  constructor(public clientId: string) {}

  ensureGapiInitialized = pMemoize(async () => {
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

    return gapi
  })

  onCurrentUserChanged(callback: () => void): () => void {
    this.ensureGapiInitialized()
    this.currentUserChangedCallbacks.add(callback)
    return () => {
      this.currentUserChangedCallbacks.delete(callback)
    }
  }

  async signIn() {
    const gapi = await this.ensureGapiInitialized()
    const authInstance = gapi.auth2.getAuthInstance()
    return authInstance.signIn()
  }

  async signOut() {
    const gapi = await this.ensureGapiInitialized()
    const authInstance = gapi.auth2.getAuthInstance()
    return authInstance.signOut()
  }

  getUserInfo() {
    const { currentUser } = this
    if (!currentUser || !currentUser.isSignedIn()) {
      return null
    }
    return {
      name: currentUser.getBasicProfile().getName(),
      email: currentUser.getBasicProfile().getEmail(),
      idToken: currentUser.getAuthResponse().id_token,
    }
  }
}
