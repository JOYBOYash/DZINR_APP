import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import nodemailer from "nodemailer";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Firebase Admin SDK
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim().replace(/^"|"$/g, '');
  const clientEmail = process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL?.trim().replace(/^"|"$/g, '');
  const privateKey = process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY?.trim()
    .replace(/^"|"$/g, '')
    .replace(/\\n/g, '\n');

  let isFirebaseAdminInitialized = false;

  if (projectId && clientEmail && privateKey && !clientEmail.includes('...') && !privateKey.includes('...')) {
    try {
      if (!getApps().length) {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      }
      isFirebaseAdminInitialized = true;
      console.log("Firebase Admin successfully initialized.");
    } catch (err) {
      console.error("Failed to initialize Firebase Admin SDK:", err);
    }
  } else {
    console.warn("Firebase Admin credentials are not fully configured or contain placeholders. Verification mail generation will run in mock/error state.");
  }

  // Initialize Nodemailer transporter
  const smtpUser = process.env.NEXT_PUBLIC_SMTP_USER?.trim().replace(/^"|"$/g, '');
  const smtpPass = process.env.NEXT_PUBLIC_SMTP_PASS?.trim().replace(/^"|"$/g, '');

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  async function sendVerificationEmail(email: string, link: string) {
    let logoSvg = "";
    try {
      const svgPath = path.join(process.cwd(), "public", "wordmark-logo.svg");
      if (fs.existsSync(svgPath)) {
        logoSvg = fs.readFileSync(svgPath, "utf8");
        // Remove XML declaration and comments
        logoSvg = logoSvg.replace(/<\?xml[^>]*\?>/g, "");
        logoSvg = logoSvg.replace(/<!--[^>]*-->/g, "");
        // Replace white fill with theme primary color (#ff2d51)
        logoSvg = logoSvg.replace(/fill:#ffffff/gi, "fill:#ff2d51");
        logoSvg = logoSvg.replace(/fill:#fff/gi, "fill:#ff2d51");
        // Replace red fill with theme primary color (#ff2d51)
        logoSvg = logoSvg.replace(/fill:#ff002c/gi, "fill:#ff2d51");
        logoSvg = logoSvg.replace(/fill:#ff002d/gi, "fill:#ff2d51");
      }
    } catch (err) {
      console.error("Failed to load/customize logo SVG for verification email:", err);
    }

    const fromUser = smtpUser || "dzinrapp@gmail.com";
    const mailOptions = {
      from: `"DZINR" <${fromUser}>`,
      to: email,
      subject: "Verify your email address for DZINR",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your email for DZINR</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700&display=swap');
              body {
                margin: 0;
                padding: 0;
                background-color: #f3f4f6;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                color: #111827;
                -webkit-font-smoothing: antialiased;
              }
              .container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                overflow: hidden;
              }
              .banner-img {
                width: 100%;
                display: block;
              }
              .content-box {
                padding: 48px 40px;
                text-align: center;
              }
              .header-logo {
                height: 40px;
                display: block;
                margin: 0 auto 16px auto;
              }
              .sub-header {
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: #6b7280;
                margin: 0 0 32px 0;
                font-weight: 600;
              }
              h2 {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 28px;
                font-weight: 700;
                color: #111827;
                margin: 0 0 16px 0;
                line-height: 1.2;
                letter-spacing: -0.5px;
              }
              p {
                font-size: 15px;
                line-height: 1.6;
                color: #4b5563;
                margin: 0 0 24px 0;
                text-align: left;
              }
              .btn-container {
                margin: 40px 0;
                text-align: center;
              }
              .verify-btn {
                display: inline-block;
                background-color: #ff2d51;
                color: #ffffff !important;
                text-decoration: none;
                padding: 16px 36px;
                font-family: 'Space Grotesk', sans-serif;
                font-size: 16px;
                font-weight: 700;
                border-radius: 8px;
                text-align: center;
              }
              .verify-btn:hover {
                background-color: #e62848;
              }
              .link-box {
                background-color: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 16px;
                margin-top: 32px;
                text-align: left;
              }
              .link-title {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #4b5563;
                margin-bottom: 8px;
              }
              .link-text {
                font-family: monospace;
                font-size: 12px;
                word-break: break-all;
                color: #3b82f6;
                margin: 0;
              }
              .footer-text {
                text-align: center;
                font-size: 12px;
                color: #9ca3af;
                margin-top: 24px;
                margin-bottom: 40px;
                line-height: 1.6;
              }
              .footer-text p {
                text-align: center;
                font-size: 11px;
                color: #9ca3af;
                margin: 0 0 8px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <img src="https://www.dropbox.com/scl/fi/nmpnlwfueuheglqud6hjg/Banner.png?rlkey=uxltosyeq7dcexnnwjhlm5fbn&st=j1hm8lds&raw=1" alt="DZINR Banner" class="banner-img">
              <div class="content-box">
                ${logoSvg ? `
                  <div style="height: 40px; margin: 0 auto 16px auto; display: inline-block;">
                    ${logoSvg.replace(/<svg/i, '<svg style="height: 40px; width: auto; display: block; margin: 0 auto;"')}
                  </div>
                ` : `
                  <img src="https://www.dropbox.com/scl/fi/mfwn8nmnfo2kywgw0qls2/wordmark-logo.svg?rlkey=paf3xduz9nlrhmdphmrsnhoss&st=0hjkecao&raw=1" alt="DZINR" class="header-logo">
                `}
                <div class="sub-header">Rapid Design Feedback Platform</div>
                
                <h2>Verify your email address</h2>
                <p>Welcome to DZINR! You've taken the first step toward rapid, community-driven design feedback. To secure your account and start uploading designs, please confirm your email address by clicking the button below.</p>
                
                <div class="btn-container">
                  <a href="${link}" class="verify-btn">VERIFY EMAIL ADDRESS</a>
                </div>
                
                <p>Please note: This link is valid for 3 days (72 hours grace period) and can only be used once.</p>
                
                <div class="link-box">
                  <div class="link-title">If the button didn't work, copy this link:</div>
                  <p class="link-text">${link}</p>
                </div>
              </div>
            </div>
            <div class="footer-text">
              <p>You have received this mail because your e-mail ID is registered with DZINR. This is a system-generated e-mail, please don't reply to this message.</p>
              <p style="margin-top: 12px; font-size: 10px; color: #6b7280;">
                &copy; ${new Date().getFullYear()} DZINR. All rights reserved.<br>
                123 Design Avenue, Suite 404, San Francisco, CA 94107
              </p>
            </div>
          </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
  }

  // API route to generate and send custom verification email
  app.post("/api/auth/send-verification-email", async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required." });
    }

    try {
      if (!isFirebaseAdminInitialized) {
        return res.status(500).json({
          error: "Firebase Admin is not fully initialized. Please ensure NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL and NEXT_PUBLIC_FIREBASE_PRIVATE_KEY are correct and complete in your settings/secrets."
        });
      }

      // Dynamically detect the running host (handles development, shared previews, custom domains, and PWA context)
      const host = req.get("host") || "localhost:3000";
      const protocol = req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
      const redirectUri = `${protocol}://${host}/`;

      const actionCodeSettings = {
        url: redirectUri,
        handleCodeInApp: true,
      };

      const link = await getAuth().generateEmailVerificationLink(email, actionCodeSettings);

      await sendVerificationEmail(email, link);

      res.json({ success: true, message: "Custom email verification link generated and sent successfully." });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to generate or send email verification link." });
    }
  });

  // API route to delete Firebase Auth user
  app.post("/api/auth/delete-user", async (req, res) => {
    const { uid } = req.body;
    if (!uid || typeof uid !== "string") {
      return res.status(400).json({ error: "User ID (uid) is required." });
    }

    try {
      if (!isFirebaseAdminInitialized) {
        return res.status(500).json({
          error: "Firebase Admin is not fully initialized."
        });
      }

      await getAuth().deleteUser(uid);
      res.json({ success: true, message: "User deleted from Firebase Auth." });
    } catch (err: any) {
      console.error("Failed to delete user from Firebase Auth:", err);
      res.status(500).json({ error: err.message || "Failed to delete user." });
    }
  });

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
  app.get("/api/url-metadata", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: "URL is required" });
    }

    let debugInfo: any = {};

    try {
      let imageUrls: string[] = [];

      if (url.includes('pinterest.com/pin/')) {
        const oembedUrl = `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(url)}`;
        const response = await fetch(oembedUrl);
        if (response.ok) {
            const data = await response.json();
            if (data.thumbnail_url) {
              imageUrls.push(data.thumbnail_url.replace(/\/\d+x\//, '/originals/'));
            }
        }
      } 
      else if (url.includes('behance.net/')) {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Pinterestbot/1.0; +http://www.pinterest.com/bot.html' }
        });
        
        if (response.ok) {
            const html = await response.text();
            
            const behanceImages = html.match(/https:\\?\/\\?\/mir-s3-cdn-cf\.behance\.net[^"'\s]+/g) || [];
            const adobeImages = html.match(/https:\\?\/\\?\/pps\.services\.adobe\.com[^"'\s]+/g) || [];
            const allBehance = [...adobeImages, ...behanceImages];
            debugInfo.allBehance = allBehance;
            
            if (allBehance.length > 0) {
                imageUrls.push(...allBehance.map(u => u.replace(/\\/g, '').replace(/\/50$/, '/276')));
            } else {
                // If it's just a profile or something else
                const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/) || 
                                     html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/);
                if (ogImageMatch) imageUrls.push(ogImageMatch[1]);
            }
        }
      }
      else if (url.includes('artstation.com') && !url.match(/\.(jpeg|jpg|gif|png|webp)/i)) {
        return res.status(403).json({
          error: "artstation_blocked",
          message: "Artstation uses high Cloudflare protection that blocks automated page imports. To import your Artstation design, please right-click the image on Artstation, select 'Copy image address', and paste that direct link here!"
        });
      }
      else {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Pinterestbot/1.0; +http://www.pinterest.com/bot.html' }
        });
        const html = await response.text();
        
        const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/) || 
                             html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/);
        const twitterImageMatch = html.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/) || 
                                  html.match(/<meta[^>]*content="([^"]+)"[^>]*name="twitter:image"/);
        
        if (ogImageMatch) imageUrls.push(ogImageMatch[1]);
        if (twitterImageMatch) imageUrls.push(twitterImageMatch[1]);
        
        const imgMatch = html.match(/<img[^>]*src=["'](https:\/\/[^"']*\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi);
        if (imgMatch) {
            imageUrls.push(...imgMatch.map(m => {
                const src = m.match(/src=["'](https:\/\/[^"']*\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);
                return src ? src[1] : '';
            }).filter(Boolean));
        }

        // Behance specific fallback (if oembed fails and we are using Pinterestbot)
        if (url.includes('behance.net/')) {
           const behanceImages = html.match(/https:\\?\/\\?\/mir-s3-cdn-cf\.behance\.net[^"'\s]+/g) || [];
           const adobeImages = html.match(/https:\\?\/\\?\/pps\.services\.adobe\.com[^"'\s]+/g) || [];
           const allBehance = [...adobeImages, ...behanceImages];
           if (allBehance.length > 0) {
               imageUrls.push(...allBehance.map(u => u.replace(/\\/g, '').replace(/\/50$/, '/276')));
           }
        }
      }

      // Post-process the collected imageUrls to remove duplicates and upgrade to the highest resolution
      let processedUrls = imageUrls.map(i => i.replace(/&amp;/g, '&').replace(/\\/g, ''));

      // Upgrade Adobe and Behance URLs to their maximum quality versions
      processedUrls = processedUrls.map(u => {
        if (u.includes('pps.services.adobe.com')) {
          // Replace trailing size with high resolution /276
          return u.replace(/\/\d+$/, '/276');
        }
        if (u.includes('mir-s3-cdn-cf.behance.net')) {
          // Upgrade project modules to 'source' (the original quality master uploaded by the designer)
          if (u.includes('/project_modules/')) {
            return u.replace(/\/project_modules\/[^/]+\//, '/project_modules/source/');
          }
          // Upgrade projects/covers to 'original' (uncompressed cover image format)
          if (u.includes('/projects/')) {
            return u.replace(/\/projects\/[^/]+\//, '/projects/original/');
          }
        }
        return u;
      });

      // Filter out invalid or base CDN URLs
      processedUrls = processedUrls.filter(u => {
        if (!u || u.length <= 10) return false;
        if (u === 'https://mir-s3-cdn-cf.behance.net/' || u === 'https://mir-s3-cdn-cf.behance.net') return false;
        return true;
      });

      // Group by unique image key to completely avoid importing duplicates of the same slide
      const uniqueMap = new Map<string, string>();
      for (const u of processedUrls) {
        let key = u;
        if (u.includes('pps.services.adobe.com')) {
          const match = u.match(/\/image\/([^\/]+)/);
          if (match) {
            key = 'adobe_' + match[1];
          }
        } else if (u.includes('mir-s3-cdn-cf.behance.net')) {
          try {
            const parsed = new URL(u);
            const segments = parsed.pathname.split('/');
            const filename = segments[segments.length - 1];
            if (filename) {
              const baseName = filename.split('.')[0];
              if (baseName && baseName.length > 3) {
                key = 'behance_' + baseName;
              }
            }
          } catch (e) {
            // keep key as full URL if parsing fails
          }
        }
        
        // Save first occurrence (since we already upgraded all to source/original, any redundant sizes of the same image are cleanly unified)
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, u);
        }
      }

      const finalUrls = Array.from(uniqueMap.values());

      res.json({ imageUrl: finalUrls[0] || url, imageUrls: finalUrls.length > 0 ? finalUrls : [url], debug: debugInfo });
    } catch (e: any) {
       console.error("Failed to fetch URL metadata", e);
       res.json({ imageUrl: url, imageUrls: [url], debug: { error: e.message } });
    }
  });

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

  app.delete("/api/cloudinary/delete", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });
    
    const apiKey = process.env.NEXT_PUBLIC_CLOUD_API_KEY?.trim().replace(/^"|"$/g, '');
    const apiSecret = process.env.NEXT_PUBLIC_CLOUD_SECRET?.trim().replace(/^"|"$/g, '');
    const cloudName = process.env.NEXT_PUBLIC_CLOUD_NAME?.trim().replace(/^"|"$/g, '');

    if (!apiKey || !apiSecret || !cloudName) {
      console.warn("Cloudinary deletion skipped: missing API credentials");
      return res.json({ success: true, message: "Skipped" });
    }

    try {
      // Extract public ID from URL
      const matches = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
      if (!matches) {
        return res.json({ success: true, message: "Could not extract public ID" });
      }
      const publicId = matches[1];

      const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({ public_id: publicId })
      });

      const data = await response.json();
      res.json({ success: true, data });
    } catch (e: any) {
      console.error("Cloudinary delete failed:", e);
      res.json({ success: false, error: e.message });
    }
  });

  // Route to dynamically serve behance-profile.html and inject AWS access key from environment variable
  app.get("/behance-profile.html", (req, res) => {
    const filePath = path.join(process.cwd(), "behance-profile.html");
    if (fs.existsSync(filePath)) {
      try {
        let content = fs.readFileSync(filePath, "utf8");
        const awsKey = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "";
        content = content.replace(/PLACEHOLDER_AWS_ACCESS_KEY_ID/g, awsKey);
        res.setHeader("Content-Type", "text/html");
        res.send(content);
      } catch (err: any) {
        console.error("Failed to read behance-profile.html", err);
        res.status(500).send("Error reading file");
      }
    } else {
      res.status(404).send("File not found");
    }
  });

  // Catch-all for API routes to prevent Vite from returning HTML
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
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

  // Generic error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith("/api/")) {
      res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
    } else {
      res.status(err.status || 500).send("Internal Server Error");
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    // Server started silently
  });
}

startServer();
