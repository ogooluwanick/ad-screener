import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb'; 

const USD_TO_NGN_FALLBACK_RATE = 1500; 
const CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours
const CONFIG_COLLECTION_NAME = 'app_config';
const RATE_DOCUMENT_ID = 'usd_to_ngn_rate';

interface ExchangeRateDocument {
  _id: string;
  rate: number;
  source: 'api' | 'fallback' | 'cached_api' | 'cached_fallback';
  lastFetchedAt: Date;
  message?: string;
}

async function fetchRateFromExternalAPI(apiKey: string): Promise<{ rate: number; source: 'api' | 'fallback'; message?: string }> {
  console.log("Exchange Rate API: Attempting to fetch live rate from external API.");
  try {
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Exchange Rate API: External API error: ${response.status} - ${errorData}`);
      throw new Error(`Failed to fetch from external API, status: ${response.status}`);
    }

    const data = await response.json();
    if (data.result === 'error' || !data.conversion_rates?.NGN) {
      const errorMessage = data['error-type'] || 'NGN rate not found in external API response';
      console.error(`Exchange Rate API: External API returned an error: ${errorMessage}`);
      throw new Error(`External API error: ${errorMessage}`);
    }
    
    const rate = Number(data.conversion_rates.NGN);
    console.log(`Exchange Rate API: Successfully fetched live rate: ${rate} from external API.`);
    return { rate, source: 'api', message: 'Successfully fetched live rate.' };
  } catch (apiError: any) {
    console.warn(`Exchange Rate API: External API fetch failed: ${apiError.message}. Using fallback rate for this attempt.`);
    return { 
      rate: USD_TO_NGN_FALLBACK_RATE, 
      source: 'fallback', 
      message: `External API fetch failed: ${apiError.message}. Using fallback rate.` 
    };
  }
}

export async function GET() {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  let client;
  console.log("Exchange Rate API: Endpoint hit.");

  try {
    client = await clientPromise(); // Call the function
    const db = client.db();
    const configCollection = db.collection<ExchangeRateDocument>(CONFIG_COLLECTION_NAME);

    const cachedRateDoc = await configCollection.findOne({ _id: RATE_DOCUMENT_ID });

    if (cachedRateDoc && (new Date().getTime() - new Date(cachedRateDoc.lastFetchedAt).getTime() < CACHE_DURATION_MS)) {
      const responseSource = cachedRateDoc.source.startsWith('cached_') ? cachedRateDoc.source : `cached_${cachedRateDoc.source}`;
      console.log(`Exchange Rate API: Serving rate ${cachedRateDoc.rate} from valid cache. Source: ${responseSource}, Last fetched: ${cachedRateDoc.lastFetchedAt.toISOString()}`);
      return NextResponse.json({ 
        rate: cachedRateDoc.rate, 
        source: responseSource, 
        message: cachedRateDoc.message || 'Using cached rate.',
        lastFetchedAt: cachedRateDoc.lastFetchedAt 
      });
    }

    if (cachedRateDoc) {
      console.log(`Exchange Rate API: Cache found but stale (Last fetched: ${cachedRateDoc.lastFetchedAt.toISOString()}). Re-fetching.`);
    } else {
      console.log("Exchange Rate API: No cache found. Attempting to fetch new rate.");
    }
    
    let newRateData: { rate: number; source: 'api' | 'fallback'; message?: string };

    if (!apiKey) {
      console.warn('Exchange Rate API: EXCHANGE_RATE_API_KEY not found. Using fallback rate and attempting to cache.');
      newRateData = {
        rate: USD_TO_NGN_FALLBACK_RATE,
        source: 'fallback',
        message: 'API key not configured, using fallback rate.',
      };
    } else {
      newRateData = await fetchRateFromExternalAPI(apiKey);
    }
    
    const newRateDocument: ExchangeRateDocument = {
      _id: RATE_DOCUMENT_ID,
      rate: newRateData.rate,
      source: newRateData.source, 
      lastFetchedAt: new Date(),
      message: newRateData.message,
    };

    await configCollection.updateOne({ _id: RATE_DOCUMENT_ID }, { $set: newRateDocument }, { upsert: true });
    console.log(`Exchange Rate API: Cache updated. Serving new/updated rate: ${newRateDocument.rate} from source: ${newRateDocument.source}. Last updated: ${newRateDocument.lastFetchedAt.toISOString()}`);
    
    return NextResponse.json({ 
      rate: newRateDocument.rate, 
      source: newRateDocument.source, 
      message: newRateDocument.message,
      lastFetchedAt: newRateDocument.lastFetchedAt
    });

  } catch (error: any) {
    console.error(`Exchange Rate API: Critical error in GET handler: ${error.message}. Stack: ${error.stack}`);
    return NextResponse.json({ 
      rate: USD_TO_NGN_FALLBACK_RATE, 
      source: 'fallback', 
      message: `Critical error in exchange rate handler: ${error.message}. Using hardcoded fallback.` 
    });
  }
}
