const config = {
  clientId: "pQ0mBu5DvJ5K2A7DSSh7RlXnrTUBjiby",
  domain: "dev-plavkbiy7v55pbg4.us.auth0.com",
  iosBundleId: "in.serveaseinnovation.serveaso",
  androidPackage: "com.serveaso",
};

/**
 * Register these in Auth0 → Application → Allowed Callback URLs & Allowed Logout URLs:
 *
 * Android (note ".auth0" in the scheme — required for react-native-auth0 v5):
 *   com.serveaso.auth0://dev-plavkbiy7v55pbg4.us.auth0.com/android/com.serveaso/callback
 *
 * iOS:
 *   in.serveaseinnovation.serveaso.auth0://dev-plavkbiy7v55pbg4.us.auth0.com/ios/in.serveaseinnovation.serveaso/callback
 *   com.serveaso.app.ios.auth0://dev-plavkbiy7v55pbg4.us.auth0.com/ios/com.serveaso.app.ios/callback
 *
 * Wrong (will cause "Callback URL mismatch"):
 *   com.serveaso://dev-plavkbiy7v55pbg4.us.auth0.com/android/com.serveaso/callback
 */

export default config;