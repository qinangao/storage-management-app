"use server";

import { ID } from "node-appwrite";
import { createAdminClient } from "..";
import { appwriteConfig } from "../config";
import { getUserByEmail, sendEmailOTP } from "../helper";
import { parseStringify } from "../utils";

// Create account flow
// 1. User enters fullname and email
// 2.Check if user already existusing the email
// 3. Send OTP to user email
// 4 This will send a secret key for creating a session
// 5. create user document if the user is new user
// 6.return the user accountID
// 7 Verrify OTP and authenticate to login

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
        avatar:
          "https://img.freepik.com/premium-vector/profile-picture-placeholder-avatar-silhouette-gray-tones-icon-colored-shapes-gradient_1076610-40164.jpg",
        accountId,
      }
    );
  }
  return parseStringify({ accountId });
}
