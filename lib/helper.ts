import { ID, Query } from "node-appwrite";
import { createAdminClient } from ".";
import { appwriteConfig } from "./config";

export async function getUserByEmail(email: string) {
  const { databases } = await createAdminClient();
  const result = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.equal("email", email)]
  );
  return result.total > 0 ? result.documents[0] : null;
}

function handleError(error: unknown, message: string) {
  console.log(error, message);
  throw error;
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
