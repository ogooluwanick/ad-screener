import clientPromise from '../lib/mongodb'; // Adjust path as necessary
// ObjectId might not be needed if we consistently use string IDs for these config docs
// import { ObjectId } from 'mongodb'; 

const CONFIG_COLLECTION_NAME = 'app_config';
const CATEGORIES_DOCUMENT_ID = 'ad_categories'; // Using a string ID for simplicity

// Define an interface for the document we are creating/updating
interface AppConfigCategoriesDoc {
  _id: string;
  categories: string[];
  lastUpdatedAt: Date;
  createdAt?: Date;
}

const sharedAdCategoriesAndExpertise = [
  "Content Review",
  "Brand Safety",
  "Ad Policy",
  "Technical Ads",
  "Creative Quality",
  "Legal Compliance",
  "User Experience (UX)",
  "Accessibility (A11y)",
  "Regional Specialization - Americas",
  "Regional Specialization - EMEA",
  "Regional Specialization - APAC",
  "Industry - Finance & Insurance",
  "Industry - Healthcare & Pharmaceutical",
  "Industry - E-commerce & Retail",
  "Industry - Gaming & Entertainment",
  "Industry - Technology & Software",
  "Industry - Education",
  "Industry - Food & Beverage",
  "Industry - Travel & Hospitality",
  "Industry - Automotive",
  "Industry - Real Estate",
  "Industry - Non-profit & Social Causes",
  "Platform - Social Media (Facebook, Instagram, X)",
  "Platform - Search Engine (Google, Bing)",
  "Platform - Programmatic & Display",
  "Platform - Video Ads (YouTube, TikTok, Streaming)",
  "Platform - Mobile App Install Ads",
  "Content Type - Influencer Marketing",
  "Content Type - User-Generated Content",
  "Content Type - Interactive & Playable Ads",
  "Content Type - Affiliate Marketing",
  "Content Type - Native Advertising",
  "Regulatory - Data Privacy (GDPR, CCPA)",
  "Regulatory - Political Advertising",
  "Regulatory - Alcohol & Gambling Ads",
  "Creative - Ad Copywriting & Messaging",
  "Creative - Visual Design & Aesthetics",
  "Technical - Landing Page Experience",
  "Technical - Ad Performance & Analytics",
];

async function seedAdCategories() {
  let mongoClient;
  try {
    console.log('Attempting to connect to MongoDB...');
    mongoClient = await clientPromise();
    const db = mongoClient.db(); // Ensure your clientPromise resolves to a client with a db() method
    // Specify the document type for the collection
    const configCollection = db.collection<AppConfigCategoriesDoc>(CONFIG_COLLECTION_NAME);

    console.log(`Upserting categories into document with _id: ${CATEGORIES_DOCUMENT_ID}...`);

    const result = await configCollection.updateOne(
      { _id: CATEGORIES_DOCUMENT_ID },
      {
        $set: {
          categories: sharedAdCategoriesAndExpertise,
          lastUpdatedAt: new Date(),
        },
        $setOnInsert: { // Fields to set only if a new document is inserted
          _id: CATEGORIES_DOCUMENT_ID, // Explicitly set _id on insert
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      console.log(`Successfully inserted new ad categories document with _id: ${CATEGORIES_DOCUMENT_ID}.`);
    } else if (result.modifiedCount > 0) {
      console.log(`Successfully updated ad categories in document with _id: ${CATEGORIES_DOCUMENT_ID}.`);
    } else if (result.matchedCount > 0) {
      console.log(`Ad categories document with _id: ${CATEGORIES_DOCUMENT_ID} already up-to-date.`);
    } else {
      console.log('No document was upserted or modified. This might indicate an issue if the document did not exist.');
    }

    console.log('Seeding complete.');
  } catch (error) {
    console.error('Error during seeding process:', error);
  } finally {
    if (mongoClient) {
      // client.close() is not available on the promise wrapper.
      // The connection pooling is typically managed by the driver/wrapper.
      // If your `clientPromise` is a direct MongoClient instance, you might need to close it.
      // For now, assuming connection management is handled by the `lib/mongodb.ts` setup.
      console.log('MongoDB connection will be closed by the driver or on script exit.');
    }
  }
}

seedAdCategories();
