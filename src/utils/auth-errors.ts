export const getFriendlyAuthError = (err: any): string => {
  const code = err?.code || err?.message || '';
  if (code.includes('auth/email-already-in-use')) {
    return "This email address is already registered with another profile.";
  }
  if (code.includes('auth/invalid-email')) {
    return "The email address format is invalid. Please check and try again.";
  }
  if (code.includes('auth/operation-not-allowed')) {
    return "Email & Password login is not enabled in Firebase Authentication. Please enable 'Email/Password' in your Firebase Console > Authentication > Sign-In Method.";
  }
  if (code.includes('auth/weak-password')) {
    return "The password is too weak. Please use at least 6 characters.";
  }
  if (code.includes('auth/user-disabled')) {
    return "This designer account has been disabled. Contact support.";
  }
  if (code.includes('auth/user-not-found')) {
    return "No profile exists with this email address. Please sign up.";
  }
  if (code.includes('auth/wrong-password') || code.includes('auth/invalid-credential')) {
    return "Incorrect email or password. Please try again.";
  }
  if (code.includes('popup-closed-by-user')) {
    return "The sign-in popup was closed before completing authentication.";
  }
  if (code.includes('cancelled-popup-request')) {
    return "Another sign-in request was started. Please try again.";
  }
  return err?.message || "Authentication failed. Please check your credentials.";
};
