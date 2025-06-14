import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import crypto from 'crypto';
import querystring from 'querystring';

// Your OKX API credentials
const api_config:any = {
  api_key: process.env.API_KEY,
  secret_key: process.env.SECRET_KEY,
  passphrase: process.env.PASSPHRASE,
};

// Validate API credentials
if (!api_config.api_key || !api_config.secret_key || !api_config.passphrase) {
  console.error("Missing required OKX API credentials. Please check environment variables.");
}

function preHash(timestamp: string, method: string, request_path: string, query: string, body: string) {
  // For GET: query is "?..." and body is ""
  // For POST: query is "" and body is JSON string
  return timestamp + method + request_path + query + body;
}

function sign(message: string, secret_key: string) {
  const hmac = crypto.createHmac('sha256', secret_key);
  hmac.update(message);
  return hmac.digest('base64');
}

function createSignature(method: string, request_path: string, query: string, body: string) {
  const timestamp = new Date().toISOString();
  const message = preHash(timestamp, method, request_path, query, body);
  const signature = sign(message, api_config.secret_key);
  return { signature, timestamp };
}

function httpsRequest(options: any, body?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(`Failed to parse JSON: ${data}`);
        }
      });
    });
    req.on('error', (e) => reject(e));
    if (body) req.write(body);
    req.end();
  });
}

// Map each API path to its config: method, required params, and param location
const apiConfigMap:any = {
  // 1. Get Supported Chains (no params)
    "/api/v5/dex/market/price": {
    method: "POST",
    required: ["chainIndex", "tokenContractAddress"],
    paramLocation: "body"
  },
  "/api/v5/dex/market/trades": {
    method: "GET",
    required: ["chainIndex", "tokenContractAddress"],
    paramLocation: "query"
  },
    "/api/v5/dex/market/price-info": {
    method: "POST",
    required: ["chainIndex", "tokenContractAddress"],
    paramLocation: "body"
  },
  "/api/v5/dex/balance/supported/chain": {
    method: "GET",
    required: [],
    paramLocation: "query"
  },// get candle price 
    "/api/v5/dex/market/candles": {
    method: "GET",  
     required: ["chainIndex", "tokenContractAddress"],
    paramLocation: "query"
  },
  // get historicals candle price 
    "/api/v5/dex/market/historical-candles": {
    method: "GET",  
     required: ["chainIndex", "tokenContractAddress"],
    paramLocation: "query"
  },
  // 2. Get Token Index Price (POST, array body)
  "/api/dex/index/current-price": {
    method: "POST",
    required: ["chainIndex", "tokenContractAddress"],
    paramLocation: "body"
  },
  // 3. Get Historical Index Price (GET, query)
  "/api/v5/dex/index/historical-price": {
    method: "GET",
    required: ["chainIndex"],
    paramLocation: "query"
  },
  // 4. Get Total Value (GET, query)

  "/api/v5/dex/balance/total-value": {
    method: "GET",
    required: ["accountId"],
    paramLocation: "query"
  },
  // 5. Get Total Token Balances (GET, query)
  "/api/v5/dex/balance/all-token-balances-by-address": {
    method: "GET",
    required: ["address", "chains"],
    paramLocation: "query"
  },
  // 6. Get Specific Token Balance (POST, body)
  "/api/v5/dex/balance/token-balances-by-address": {
    method: "POST",
    required: ["address"],
    paramLocation: "body"
  },
  // 7. Get History by Address (GET, query)
  "/api/v5/dex/post-transaction/transactions-by-address": {
    method: "GET",
    required: ["address"],
    paramLocation: "query"
  },
  // 8. Get Specific Transaction (GET, query)
  "/api/v5/dex/post-transaction/transaction-detail-by-txhash": {
    method: "GET",
    required: ["chainIndex", "txHash"],
    paramLocation: "query"
  },
};

function validateParams(params: any, required: string[]): string | null {
  console.log("my params:::::::::::::::",params);
  console.log("my params:::::::::::::::",required);
  
  for (const key of required) {
    if (params[key] === undefined || params[key] === null || params[key] === "") {
      return key;
    }
  }
  return null;
}

// Main API handler
export async function POST(req: NextRequest) {
  try {
    const { method, path, data } = await req.json();

    // Route matching
    const apiConfig = apiConfigMap[path];
    console.log("api config is::::",apiConfig);
    
    if (!apiConfig) {
      return NextResponse.json({ error: 'Unsupported API path' }, { status: 400 });
    }
    if (method !== apiConfig.method) {
      return NextResponse.json({ error: `Invalid HTTP method for this endpoint. Use ${apiConfig.method}` }, { status: 400 });
    }

    // Parameter validation and formatting
    let params = Array.isArray(data) ? data[0] : (Array.isArray(data) ? data : (data || {}));
    if (apiConfig.paramLocation === "body" && Array.isArray(data)) params = data; // For POST array body
    console.log("EXecuting............................");
    

    let query = "";
    let body = "";
    let fullPath = path;
    if (apiConfig.method === "GET") {
      if (apiConfig.paramLocation === "query") {
        // For GET, flatten array to object if needed
        const queryParams = Array.isArray(params) ? params[0] : params;
        query = Object.keys(queryParams).length > 0 ? "?" + querystring.stringify(queryParams) : "";
        fullPath = path + query;
      }
    } else if (apiConfig.method === "POST") {
      if (apiConfig.paramLocation === "body") {
        body = Array.isArray(params) ? JSON.stringify(params) : JSON.stringify(params);
      }
    }
    console.log("my Body is:::::",body);
    console.log("my Query is:::::",query);
    

   
    // Signature
    const { signature, timestamp } = createSignature(
      apiConfig.method,
      path,
      apiConfig.method === "GET" ? query : "",
      apiConfig.method === "POST" ? body : ""
    );
    // Headers
    const headers = {
      'OK-ACCESS-KEY': api_config.api_key,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': api_config.passphrase,
      'Content-Type': 'application/json'
    };
    console.log("my headers are:::::::::::",headers);
    

    // HTTPS options
    const options = {
      hostname: 'web3.okx.com',
      path: fullPath,
      method: apiConfig.method,
      headers: headers
    };
    console.log("My options are::::::::::",options);
    
    // Send request
    const response = await httpsRequest(options, body);
    console.log("response is:");
    
    return NextResponse.json(response);

  } catch (error: any) {
    return NextResponse.json({ error: error?.toString() }, { status: 500 });
  }
}
