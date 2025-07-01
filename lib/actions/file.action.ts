"use server";

import { UploadFileProps } from "@/types";
import { createAdminClient } from "..";
import { handleError } from "../helper";
import { InputFile } from "node-appwrite/file";
import { appwriteConfig } from "../config";
import { ID } from "node-appwrite";
import { constructFileUrl, getFileType, parseStringify } from "../utils";
import { revalidatePath } from "next/cache";

export async function uploadFile({
  file,
  ownerId,
  accountId,
  path,
}: UploadFileProps) {
  const { storage, databases } = await createAdminClient();
  try {
    const inputFile = InputFile.fromBuffer(file, file.name);

    // to store the file
    const bucketFile = await storage.createFile(
      appwriteConfig.bucketId,
      ID.unique(),
      inputFile
    );

    // Store file metadata
    const fileDocument = {
      type: getFileType(bucketFile.name).type,
      name: bucketFile.name,
      url: constructFileUrl(bucketFile.$id),
      extension: getFileType(bucketFile.name).extension,
      size: bucketFile.sizeOriginal,
      owner: ownerId,
      accountId,
      users: [],
      bucketFileId: bucketFile.$id,
    };

    const newFile = await databases
      .createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.filesCollectionId,
        ID.unique(),
        fileDocument
      )
      .catch(async (error: unknown) => {
        await storage.deleteFile(appwriteConfig.bucketId, bucketFile.$id);
        handleError(error, "Failed to create file document");
      });
    revalidatePath(path);

    return parseStringify(newFile);
  } catch (error) {
    handleError(error, "Failed to upload file");
  }
}
