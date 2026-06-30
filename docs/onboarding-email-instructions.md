# Customizing your DZINR Welcome + Verification Email

You do **not** need to buy a custom domain or purchase a corporate email address to send a customized welcome and verification email. 

By default, Firebase prevents editing email templates to prevent spam, which is why you see the message: **"This template cannot be edited. For more information, contact Firebase Support"**.

However, you can unlock full template editing **completely for free** in 30 seconds by enabling your personal Gmail account (e.g., `joyboysskofficially@gmail.com`) as your SMTP server! This also guarantees that your verification emails land directly in the user's Inbox instead of their Spam folder.

---

## 🎨 How to Unlock Editing Using Your Free Gmail Account (No Custom Domain Required)

Follow these exact steps to connect your personal Gmail and unlock custom templates:

### Step 1: Generate a Free Google App Password
To allow Firebase to securely route emails through your Gmail account, you need to generate a secure App Password:
1. Go to your [Google Account Settings](https://myaccount.google.com/).
2. Navigate to the **Security** tab in the left sidebar.
3. Under *How you sign in to Google*, make sure **2-Step Verification** is turned on.
4. Click on **2-Step Verification**, scroll to the very bottom, and click on **App passwords**.
5. Type a name for the app (e.g., `Firebase DZINR Mailer`) and click **Create**.
6. Google will show you a **16-character code** (e.g., `abcd efgh ijkl mnop`). Copy this password immediately (without the spaces).

---

### Step 2: Configure SMTP in Firebase (Using your 2nd Screenshot as a Guide)
1. Go to your **Firebase Console** -> **Authentication** -> **Templates**.
2. Click on **SMTP settings** in the left sidebar (as shown in your 2nd screenshot).
3. Toggle the **Enable** slider at the top right to **ON** (so it turns blue).
4. Fill in the fields exactly as follows:
   - **Sender address**: `joyboysskofficially@gmail.com` *(or your Gmail address)*
   - **SMTP server host**: `smtp.gmail.com`
   - **SMTP server port**: `587`
   - **SMTP account username**: `joyboysskofficially@gmail.com` *(your full Gmail address)*
   - **SMTP account password**: *The 16-character App Password you generated in Step 1 (without spaces)*
   - **SMTP security mode**: Select **STARTTLS** from the dropdown.
5. Click **Save** at the bottom right.

---

### Step 3: Customize the Welcome & Verification Message (Using your 3rd Screenshot as a Guide)
1. Once SMTP is saved, click back on **Email address verification** in the left sidebar.
2. The red block warning **"This template cannot be edited" is now completely gone!** 🎉
3. Click the **Edit (pencil) icon** on the top right.
4. Customize your template:
   - **Sender name**: `DZINR Team`
   - **Subject**: `Welcome to DZINR — Please Verify Your Email, %DISPLAY_NAME%!`
   - **Message**: Copy and paste the HTML content from `/docs/email-onboarding-template.html` (which includes your custom banner, accent buttons, and responsive layout), or the clean plain-text layout from `/docs/email-onboarding-plain-text.txt`.
5. Click **Save**.

---

## 🏷️ Brand Assets Utilized:
* **Banner.png Header**: Pre-configured at the top of the HTML email to showcase the core loop interface.
* **Accent Color**: Elegant `#ff2d51` theme styling applied directly to buttons and branding.
* **Onboarding Content**: Teaches new signups how the community-driven design feedback loop works instantly.
* **Meta & Share Card**: OpenGraph tags configured on your web homepage correctly point to `/Banner.png` for slick preview cards on Slack, Discord, Twitter, and iMessage.
