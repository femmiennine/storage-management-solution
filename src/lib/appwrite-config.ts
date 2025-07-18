export const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  usersCollectionId: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
  filesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_FILES_COLLECTION_ID!,
  foldersCollectionId: process.env.NEXT_PUBLIC_APPWRITE_FOLDERS_COLLECTION_ID!,
  shareLinksCollectionId: process.env.NEXT_PUBLIC_APPWRITE_SHARE_LINKS_COLLECTION_ID!,
  activitiesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_ACTIVITIES_COLLECTION_ID!,
  userSharesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_USER_SHARES_COLLECTION_ID!,
  bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
};