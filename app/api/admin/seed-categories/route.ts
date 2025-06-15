import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb'; // Corrected path based on root lib
// import { ObjectId } from 'mongodb'; // Not strictly needed if using string _id

const CONFIG_COLLECTION_NAME = 'app_config';
const CATEGORIES_DOCUMENT_ID = 'ad_categories';

interface AppConfigCategoriesDoc {
  _id: string;
  categories: string[];
  lastUpdatedAt: Date;
  createdAt?: Date;
}

const sharedAdCategoriesAndExpertise = [
  "Content Review", "Brand Safety", "Ad Policy", "Technical Ads", "Creative Quality",
  "Legal Compliance", "User Experience (UX)", "Accessibility (A11y)",
  "Regional Specialization - Americas", "Regional Specialization - EMEA", "Regional Specialization - APAC",
  "Industry - Finance & Insurance", "Industry - Healthcare & Pharmaceutical", "Industry - E-commerce & Retail",
  "Industry - Gaming & Entertainment", "Industry - Technology & Software", "Industry - Education",
  "Industry - Food & Beverage", "Industry - Travel & Hospitality", "Industry - Automotive",
  "Industry - Real Estate", "Industry - Non-profit & Social Causes",
  "Platform - Social Media (Facebook, Instagram, X)", "Platform - Search Engine (Google, Bing)",
  "Platform - Programmatic & Display", "Platform - Video Ads (YouTube, TikTok, Streaming)",
  "Platform - Mobile App Install Ads",
  "Content Type - Influencer Marketing", "Content Type - User-Generated Content",
  "Content Type - Interactive & Playable Ads", "Content Type - Affiliate Marketing", "Content Type - Native Advertising",
  "Regulatory - Data Privacy (GDPR, CCPA)", "Regulatory - Political Advertising", "Regulatory - Alcohol & Gambling Ads",
  "Creative - Ad Copywriting & Messaging", "Creative - Visual Design & Aesthetics",
  "Technical - Landing Page Experience", "Technical - Ad Performance & Analytics",
];

export async function GET(request: Request) {
  // IMPORTANT: In a production environment, this endpoint should be protected
  // (e.g., check for admin role, IP whitelist, or a secret token).
  console.log('[API /admin/seed-categories] GET request received. Attempting to seed categories.');

  let mongoClient;
  try {
    mongoClient = await clientPromise();
    const db = mongoClient.db();
    const configCollection = db.collection<AppConfigCategoriesDoc>(CONFIG_COLLECTION_NAME);

    const result = await configCollection.updateOne(
      { _id: CATEGORIES_DOCUMENT_ID },
      {
        $set: {
          categories: sharedAdCategoriesAndExpertise,
          lastUpdatedAt: new Date(),
        },
        $setOnInsert: {
          _id: CATEGORIES_DOCUMENT_ID,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    let message = '';
    if (result.upsertedCount > 0) {
      message = `Successfully inserted new ad categories document with _id: ${CATEGORIES_DOCUMENT_ID}.`;
      console.log(`[API /admin/seed-categories] ${message}`);
    } else if (result.modifiedCount > 0) {
      message = `Successfully updated ad categories in document with _id: ${CATEGORIES_DOCUMENT_ID}.`;
      console.log(`[API /admin/seed-categories] ${message}`);
    } else if (result.matchedCount > 0) {
      message = `Ad categories document with _id: ${CATEGORIES_DOCUMENT_ID} already up-to-date.`;
      console.log(`[API /admin/seed-categories] ${message}`);
    } else {
      message = 'No document was upserted or modified. This might indicate an issue if the document did not exist and upsert failed.';
      console.warn(`[API /admin/seed-categories] ${message}`);
    }

    return NextResponse.json({ success: true, message: message, details: result }, { status: 200 });

  } catch (error: any) {
    console.error('[API /admin/seed-categories] Error during seeding process:', error);
    return NextResponse.json({ success: false, message: 'Error during seeding process.', error: error.message }, { status: 500 });
  }
  // MongoDB connection management is typically handled by the driver/wrapper in serverless environments.
}
