import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb'; // Path from app/api/app-settings/categories

const CONFIG_COLLECTION_NAME = 'app_config';
const CATEGORIES_DOCUMENT_ID = 'ad_categories';

interface AppConfigCategoriesDoc {
  _id: string;
  categories: string[];
  lastUpdatedAt?: Date; // Optional as it might not always be present or needed by client
  createdAt?: Date;     // Optional
}

export async function GET(request: Request) {
  console.log('[API /app-settings/categories] GET request received.');
  let mongoClient;
  try {
    mongoClient = await clientPromise();
    const db = mongoClient.db();
    const configCollection = db.collection<AppConfigCategoriesDoc>(CONFIG_COLLECTION_NAME);

    const categoriesDoc = await configCollection.findOne({ _id: CATEGORIES_DOCUMENT_ID });

    if (!categoriesDoc || !categoriesDoc.categories || categoriesDoc.categories.length === 0) {
      console.warn(`[API /app-settings/categories] Categories document not found or empty in DB (_id: ${CATEGORIES_DOCUMENT_ID}).`);
      return NextResponse.json({ categories: [], message: 'No categories configured or found.' }, { status: 404 });
    }

    console.log(`[API /app-settings/categories] Successfully fetched ${categoriesDoc.categories.length} categories.`);
    return NextResponse.json({ categories: categoriesDoc.categories }, { status: 200 });

  } catch (error: any) {
    console.error('[API /app-settings/categories] Error fetching categories:', error);
    return NextResponse.json({ categories: [], message: 'Error fetching categories.', error: error.message }, { status: 500 });
  }
}
