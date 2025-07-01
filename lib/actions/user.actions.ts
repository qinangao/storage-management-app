"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "..";
import { appwriteConfig } from "../config";
import { parseStringify } from "../utils";
import { cookies } from "next/headers";
import { getInitials, handleError } from "../helper";
import { redirect } from "next/navigation";
import { avatarPlaceholderUrl } from "@/constants";

export async function getUserByEmail(email: string) {
  const { databases } = await createAdminClient();
  const result = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.equal("email", email)]
  );
  return result.total > 0 ? result.documents[0] : null;
}

export async function getRandomAvatarUrl(fullName: string) {
  try {
    // Construct the avatar URL directly
    const initials = getInitials(fullName); // or generate random initials
    const avatarUrl = `${appwriteConfig.endpointUrl}/avatars/initials?name=${initials}&width=100&height=100&background=FF5733`;

    return avatarUrl;
  } catch (error) {
    handleError(error, "Cannot generate avatar URL");
  }
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
  if (existingUser) {
    return parseStringify({
      accountId: null,
      error: "You've already signed up. Please use Sign In to continue.",
    });
  }

  const avatar = await getRandomAvatarUrl(fullName);
  if (!avatar) {
    return parseStringify({
      accountId: null,
      error: "Failed to generate avatar. Please try again.",
    });
  }

  const accountId = await sendEmailOTP({ email });

  if (!accountId) throw new Error("Fail to send an OTP");

  const { databases } = await createAdminClient();
  await databases.createDocument(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    ID.unique(),
    {
      fullName,
      email,
      avatar: avatar || avatarPlaceholderUrl,
      accountId,
    }
  );

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

  return parseStringify(user.documents[0]);
}

export async function signOutUser() {
  const { account } = await createSessionClient();
  try {
    await account.deleteSession("current");
    (await cookies()).delete("appwrite-session");
  } catch (error) {
    handleError(error, "Fail to sign out user");
  } finally {
    redirect("/sign-in");
  }
}

export async function signInUser({ email }: { email: string }) {
  try {
    const existingUser = await getUserByEmail(email);
    // User exists,send OTP
    if (existingUser) {
      await sendEmailOTP({ email });
      return parseStringify({ accountId: existingUser.accountId });
    }
    return parseStringify({
      accountId: null,
      error: "No account found. Please sign up to get started.",
    });
  } catch (error) {
    handleError(error, "Fail to sign in user");
  }
}
