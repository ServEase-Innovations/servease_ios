import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import utilsInstance, { UTILS_BASE_URL } from "../services/utilsInstance";
import providerInstance from "../services/providerInstance";
import { AGENT_DASHBOARD, DASHBOARD } from "../Constants/pagesConstants";

type Auth0Profile = {
  sub?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  [key: string]: unknown;
};

function parseCreatedCustomerResponse(payload: unknown): {
  customerId: number;
  firstname?: string;
  lastname?: string;
  emailid?: string;
} | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;
  const rawId = data.customerId ?? data.customerid ?? data.id;
  const customerId = Number(rawId);
  if (!Number.isFinite(customerId) || customerId <= 0) return null;
  const emailRaw = data.emailId ?? data.emailid;
  return {
    customerId,
    firstname: typeof data.firstname === "string" ? data.firstname : undefined,
    lastname: typeof data.lastname === "string" ? data.lastname : undefined,
    emailid: typeof emailRaw === "string" ? emailRaw : undefined,
  };
}

async function createCustomerFromAuth0(user: Auth0Profile) {
  const userData = {
    firstname: user.given_name || user.name?.split(" ")[0] || "User",
    lastname: user.family_name || user.name?.split(" ")[1] || "",
    emailid: user.email,
  };

  const response = await providerInstance.post("/api/customer", userData);
  const created = parseCreatedCustomerResponse(response.data);
  if (!created) {
    throw new Error("Unexpected response while creating customer.");
  }

  const custName = [created.firstname, created.lastname].filter(Boolean).join(" ").trim();
  return {
    role: "CUSTOMER" as const,
    customerid: created.customerId,
    customerId: created.customerId,
    name: custName || user.name || "Customer",
    email: created.emailid ?? user.email ?? null,
  };
}

export type Auth0PostLoginResult = {
  appUser: Record<string, unknown>;
  navigateTo?: string;
};

/**
 * Mirror web Header post-login: resolve role via utils check-email, create customer if needed.
 */
export async function completeAuth0PostLogin(
  auth0User: Auth0Profile,
  accessToken?: string | null
): Promise<Auth0PostLoginResult> {
  const email = auth0User.email ?? "";
  if (!email) {
    throw new Error("Auth0 profile is missing email.");
  }

  if (accessToken) {
    await AsyncStorage.setItem("token", accessToken);
  }

  let response;
  try {
    response = await utilsInstance.get(
      `/customer/check-email?email=${encodeURIComponent(email)}`
    );
  } catch (error) {
    if (axios.isAxiosError(error) && !error.response) {
      throw new Error(
        `Cannot reach utils API at ${UTILS_BASE_URL}. Check your network or set DEV_LAN_HOST in devApi.local.ts for local testing.`
      );
    }
    throw error;
  }
  const data = response.data ?? {};

  const linkedSpIdRaw =
    data.service_provider_id != null ? Number(data.service_provider_id) : NaN;
  const linkedSpId =
    Number.isFinite(linkedSpIdRaw) && linkedSpIdRaw > 0 ? linkedSpIdRaw : undefined;

  if (!data.user_role) {
    const customer = await createCustomerFromAuth0(auth0User);
    return {
      appUser: {
        ...auth0User,
        ...customer,
        token: accessToken,
        accessToken,
      },
    };
  }

  if (data.user_role === "SERVICE_PROVIDER") {
    const spId = Number(data.service_provider_id ?? data.id);
    const resolvedSpId = Number.isFinite(spId) ? spId : Number(data.id);
    const spName = [data.firstname, data.lastname]
      .map((part: string | null | undefined) => String(part ?? "").trim())
      .filter(Boolean)
      .join(" ");

    return {
      navigateTo: DASHBOARD,
      appUser: {
        ...auth0User,
        sub: auth0User.sub,
        role: "SERVICE_PROVIDER",
        serviceProviderId: resolvedSpId,
        serviceproviderid: resolvedSpId,
        name: spName || auth0User.name,
        firstname: String(data.firstname ?? "").trim(),
        lastname: String(data.lastname ?? "").trim(),
        email: data.emailid ?? auth0User.email,
        mobileno: data.mobileno ?? undefined,
        token: accessToken,
        accessToken,
      },
    };
  }

  if (data.user_role === "CUSTOMER") {
    const custName = [data.firstname, data.lastname]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      appUser: {
        ...auth0User,
        role: "CUSTOMER",
        customerid: data.id,
        customerId: data.id,
        name: custName || auth0User.name,
        email: data.emailid ?? auth0User.email,
        mobileno: data.mobileno ?? undefined,
        token: accessToken,
        accessToken,
        ...(linkedSpId != null
          ? {
              serviceProviderId: linkedSpId,
              serviceproviderid: linkedSpId,
              dual_role: true,
            }
          : {}),
      },
    };
  }

  if (data.user_role === "VENDOR") {
    return {
      navigateTo: AGENT_DASHBOARD,
      appUser: {
        ...auth0User,
        role: "VENDOR",
        vendorId: data.id,
        token: accessToken,
        accessToken,
      },
    };
  }

  return {
    appUser: {
      ...auth0User,
      role: data.user_role,
      token: accessToken,
      accessToken,
    },
  };
}
