import { MongoClient, MongoClientOptions } from "mongodb";

const options: MongoClientOptions = {};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

// Removed MONGODB_URI_FROM_ENV as we will read process.env directly in the function.

function getMongoClientPromise(): Promise<MongoClient> {
  // Read the MONGODB_URI from process.env directly when the function is called.
  const currentMongoUri = process.env.MONGODB_URI;

  if (!currentMongoUri) {
    // Log the state of process.env.MONGODB_URI at the point of failure
    console.error("[MongoDBLib] MONGODB_URI is missing when getMongoClientPromise() is called.");
    console.error("[MongoDBLib] Current process.env.MONGODB_URI (at time of call):", process.env.MONGODB_URI);
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }

  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(currentMongoUri, options); // Use currentMongoUri
      globalWithMongo._mongoClientPromise = client.connect();
      console.log("[MongoDBLib-Dev] New MongoDB client promise created and cached globally.");
    } else {
      console.log("[MongoDBLib-Dev] Using cached global MongoDB client promise.");
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    // Create a new client and promise if one doesn't exist for this module instance.
    if (!clientPromise) {
      client = new MongoClient(currentMongoUri, options); // Use currentMongoUri
      clientPromise = client.connect();
      console.log("[MongoDBLib-Prod] New MongoDB client promise created.");
    } else {
      console.log("[MongoDBLib-Prod] Reusing existing MongoDB client promise for this module instance.");
    }
  }
  return clientPromise;
}

// Export the function that returns the promise.
export default getMongoClientPromise;
