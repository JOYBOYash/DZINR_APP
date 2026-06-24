import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  const getRedirectUri = (req: express.Request) => {
    const host = req.headers['x-forwarded-host'] || req.get('host') || '';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const protocol = isLocal ? 'http' : 'https';
    return `${protocol}://${host}/api/auth/figma/callback`;
  };

  // Endpoint to return the Figma OAuth authorization URL
  app.get("/api/auth/figma/url", (req, res) => {
    const client_id = process.env.NEXT_PUBLIC_FIGMA_CLIENT_ID?.trim().replace(/^"|"$/g, '');
    if (!client_id) {
      return res.status(400).json({ 
        error: "Figma Client ID not configured. Please add NEXT_PUBLIC_FIGMA_CLIENT_ID and NEXT_PUBLIC_FIGMA_CLIENT_SECRET to your environment variables in AI Studio Settings." 
      });
    }

    const origin = req.query.origin as string;
    const redirect_uri = origin ? `${origin}/api/auth/figma/callback` : getRedirectUri(req);
    const stateObj = { origin: origin || '' };
    const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');
    
    // Construct official Figma OAuth authorization endpoint
    const figmaAuthUrl = `https://www.figma.com/oauth?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=file_content:read&state=${state}&response_type=code`;
    
    res.json({ url: figmaAuthUrl });
  });

  // Endpoint to handle Figma OAuth callback and exchange authorization code for access tokens safely
  app.get(["/api/auth/figma/callback", "/api/auth/figma/callback/"], async (req, res) => {
    const { code, state } = req.query;
    const client_id = process.env.NEXT_PUBLIC_FIGMA_CLIENT_ID?.trim().replace(/^"|"$/g, '');
    const client_secret = process.env.NEXT_PUBLIC_FIGMA_CLIENT_SECRET?.trim().replace(/^"|"$/g, '');

    if (!code) {
      return res.send(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #2b313f; color: #fff;">
            <h2>Authentication Failed</h2>
            <p>No authorization code was returned from Figma.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'FIGMA_AUTH_FAILURE', error: 'No authorization code returned' }, '*');
                setTimeout(() => window.close(), 3000);
              }
            </script>
          </body>
        </html>
      `);
    }

    let origin = '';
    try {
      if (state) {
        try {
          const stateObj = JSON.parse(Buffer.from(state as string, 'base64').toString('utf-8'));
          origin = stateObj.origin;
        } catch(e) {}
      }
      const redirect_uri = origin ? `${origin}/api/auth/figma/callback` : getRedirectUri(req);
      
      console.log('Exchanging authorization code for Figma Access Token...');
      const tokenResponse = await fetch('https://api.figma.com/v1/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: client_id || '',
          client_secret: client_secret || '',
          redirect_uri,
          code: code as string,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Figma token exchange returned status ${tokenResponse.status}: ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      
      // Fetch user profile from Figma API using the token
      let username = 'Figma Connected';
      try {
        const userResponse = await fetch('https://api.figma.com/v1/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          username = userData.handle || userData.email || 'Figma User';
        }
      } catch (meErr) {
        console.error('Failed to fetch Figma user details:', meErr);
      }

      // Send success message to parent window and close popup
      res.send(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #2b313f; color: #fff;">
            <h2 style="color: #ff2d51;">✓ Authentication Successful</h2>
            <p>Your Figma account (@${username}) is now securely connected to Dzinr.</p>
            <p>This popup window will close automatically.</p>
            <script>
              if (window.opener) {
                const targetOrigin = "${origin || '*'}";
                window.opener.postMessage({ 
                  type: 'FIGMA_AUTH_SUCCESS', 
                  accessToken: '${accessToken}',
                  username: '${username}'
                }, targetOrigin);
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error('Figma OAuth callback error:', err);
      res.send(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #2b313f; color: #fff;">
            <h2 style="color: #ff2d51;">Authentication Error</h2>
            <p>${err.message || 'Token exchange failed'}</p>
            <script>
              if (window.opener) {
                const targetOrigin = "${origin || '*'}";
                window.opener.postMessage({ 
                  type: 'FIGMA_AUTH_FAILURE', 
                  error: '${err.message || 'Token exchange failed'}' 
                }, targetOrigin);
              }
            </script>
          </body>
        </html>
      `);
    }
  });

  // Endpoint to fetch and parse Behance user feed securely
  app.get("/api/sync/behance", async (req, res) => {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: "Behance username is required." });
    }

    try {
      console.log(`Fetching Behance feed for user: ${username}...`);
      const directUrl = `https://www.behance.net/feeds/user?username=${username}`;
      const response = await fetch(directUrl);
      const items: any[] = [];

      if (response.ok) {
        const xml = await response.text();
        
        // XML Parser via simple substring & regex parsing
        const itemBlocks = xml.split("<item>");
        
        // Skip the first block as it's the feed header, process the rest
        for (let i = 1; i < itemBlocks.length; i++) {
          const block = itemBlocks[i].split("</item>")[0];
          
          // Extract Title
          const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
          const title = titleMatch ? titleMatch[1].trim() : "Behance Design Project";

          // Extract Link
          const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);
          const link = linkMatch ? linkMatch[1].trim() : "";

          // Extract Description / HTML content to parse the image
          const descMatch = block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
          const descriptionHtml = descMatch ? descMatch[1].trim() : "";

          // Find the first image URL in the description (src attribute)
          const imgSrcMatch = descriptionHtml.match(/src="([^"]+)"/) || descriptionHtml.match(/src='([^']+)'/);
          let imageUrl = "";
          if (imgSrcMatch) {
            imageUrl = imgSrcMatch[1];
          } else {
            imageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80";
          }

          // Clean HTML tags from description
          let cleanDesc = descriptionHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          if (cleanDesc.length > 180) {
            cleanDesc = cleanDesc.substring(0, 180) + "...";
          }
          if (!cleanDesc || cleanDesc.includes("src=")) {
            cleanDesc = "Creative portfolio design layout synchronized directly from active Behance feed.";
          }

          // Extract Categories
          const categories: string[] = [];
          const categoryMatches = block.matchAll(/<category[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/g);
          for (const catMatch of categoryMatches) {
            categories.push(catMatch[1].trim());
          }

          items.push({
            title,
            link,
            description: cleanDesc,
            imageUrl,
            categories: categories.length > 0 ? categories : ["Design Layout"]
          });
        }
      } else {
        console.warn(`Direct Behance feed returned status ${response.status}. Trying rss2json public proxy fallback...`);
        const rssUrl = encodeURIComponent(directUrl);
        const proxyRes = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
        if (!proxyRes.ok) {
          throw new Error(`Both direct Behance feed (status ${response.status}) and rss2json proxy failed.`);
        }
        
        const json = await proxyRes.json();
        if (json.status !== "ok" || !json.items || json.items.length === 0) {
          throw new Error(`Could not locate active projects in Behance RSS feed or proxy.`);
        }

        for (const item of json.items) {
          const title = item.title || "Behance Design Project";
          const link = item.link || "";
          const descriptionHtml = item.description || "";

          const imgSrcMatch = descriptionHtml.match(/src="([^"]+)"/) || descriptionHtml.match(/src='([^']+)'/);
          let imageUrl = "";
          if (imgSrcMatch) {
            imageUrl = imgSrcMatch[1];
          } else if (item.thumbnail) {
            imageUrl = item.thumbnail;
          } else {
            imageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80";
          }

          let cleanDesc = descriptionHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          if (cleanDesc.length > 180) {
            cleanDesc = cleanDesc.substring(0, 180) + "...";
          }
          if (!cleanDesc || cleanDesc.includes("src=")) {
            cleanDesc = "Creative portfolio design layout synchronized directly from active Behance feed.";
          }

          items.push({
            title,
            link,
            description: cleanDesc,
            imageUrl,
            categories: Array.isArray(item.categories) && item.categories.length > 0 ? item.categories : ["Design Layout"]
          });
        }
      }

      res.json({ success: true, username, items });
    } catch (err: any) {
      console.error("Failed to sync Behance feed:", err);
      res.status(500).json({ error: `Could not fetch or parse Behance RSS feed: ${err.message}` });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
