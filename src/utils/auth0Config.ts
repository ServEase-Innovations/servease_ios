import { Platform } from "react-native";
import config from "../../auth0-configuration";

export const AUTH0_DOMAIN = config.domain;
export const AUTH0_CLIENT_ID = config.clientId;
export const AUTH0_SCOPE = "openid profile email offline_access";

/** Must match iOS PRODUCT_BUNDLE_IDENTIFIER and Auth0 Allowed Callback URLs. */
export const IOS_BUNDLE_ID = "in.serveaseinnovation.serveaso";

/** Must match Android applicationId and Auth0 Allowed Callback URLs. */
export const ANDROID_PACKAGE = "com.serveaso";

export function getAuth0RedirectUrl(): string {
  if (Platform.OS === "android") {
    return `${ANDROID_PACKAGE}.auth0://${AUTH0_DOMAIN}/android/${ANDROID_PACKAGE}/callback`;
  }
  return `${IOS_BUNDLE_ID}.auth0://${AUTH0_DOMAIN}/ios/${IOS_BUNDLE_ID}/callback`;
}

export function getAuth0AuthorizeOptions() {
  return {
    scope: AUTH0_SCOPE,
    redirectUrl: getAuth0RedirectUrl(),
  };
}
