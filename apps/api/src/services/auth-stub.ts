// Stub auth service for deployment
export function getAuthService() {
  return {
    signIn: () => Promise.resolve({ user: null, session: null }),
    signUp: () => Promise.resolve({ user: null, session: null }),
    signOut: () => Promise.resolve(),
    getUser: () => Promise.resolve(null),
  };
}