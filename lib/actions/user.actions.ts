"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "..";
import { appwriteConfig } from "../config";
import { parseStringify } from "../utils";
import { cookies } from "next/headers";
import { avatarPlaceholderUrl } from "../constants";
import { handleError } from "../helper";

export async function getUserByEmail(email: string) {
  const { databases } = await createAdminClient();
  const result = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.equal("email", email)]
  );
  return result.total > 0 ? result.documents[0] : null;
}

export async function sendEmailOTP({ email }: { email: string }) {
  const { account } = await createAdminClient();
  try {
    const session = await account.createEmailToken(ID.unique(), email);

    return session.userId;
  } catch (error) {
    handleError(error, "Fail to send email OTP");
  }
}

export async function createAccount({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) {
  const existingUser = await getUserByEmail(email);
  const accountId = await sendEmailOTP({ email });
  if (!accountId) throw new Error("Fail to dens an OTP");
  if (!existingUser) {
    const { databases } = await createAdminClient();
    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      ID.unique(),
      {
        fullName,
        email,
        avatar: avatarPlaceholderUrl,
        accountId,
      }
    );
  }
  return parseStringify({ accountId });
}

export async function verifySecret({
  accountId,
  password,
}: {
  accountId: string;
  password: string;
}) {
  try {
    const { account } = await createAdminClient();
    const session = await account.createSession(accountId, password);

    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return parseStringify({ sessionId: session.$id });
  } catch (error) {
    handleError(error, "Failed to verify OTP");
  }
}

export async function getCurrentUser() {
  const { databases, account } = await createSessionClient();

  const result = await account.get();
  const user = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.equal("accountId", result.$id)]
  );

  if (user.total <= 0) return null;
  console.log(user);
  return parseStringify(user.documents[0]);
}
