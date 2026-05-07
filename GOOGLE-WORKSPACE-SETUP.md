# Google Workspace Authentication Setup Guide

This guide explains how to set up Google Workspace (Gmail @sakww.com) authentication for the EZ-ERP system.

## Features

- Single Sign-On (SSO) with Google Workspace
- Domain restriction to `@sakww.com` emails only
- Seamless integration with existing email/password login
- Automatic user profile sync from Google

## Prerequisites

- Google Workspace account with admin access
- Supabase project
- Domain: `sakww.com`

## Step 1: Configure Google Cloud Console

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Name it "SAK Woodworks ERP" (or similar)

### 1.2 Enable Google+ API

1. In the left sidebar, go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click **Enable**

### 1.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **Internal** (for Google Workspace users only)
3. Fill in the application information:
   - **App name**: EZ-ERP
   - **User support email**: Your admin email
   - **App logo**: (Optional) Upload your company logo
   - **Authorized domains**: Add your domain (e.g., `sakww.com`)
   - **Developer contact email**: Your admin email
4. Click **Save and Continue**
5. Skip **Scopes** (default scopes are sufficient)
6. Click **Save and Continue**

### 1.4 Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application**
4. Configure:
   - **Name**: EZ-ERP Web Client
   - **Authorized JavaScript origins**: Add your domains
     ```
     http://localhost:3000
     https://your-production-domain.com
     ```
   - **Authorized redirect URIs**: Add Supabase callback URL
     ```
     https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
     ```
     Replace `YOUR_SUPABASE_PROJECT_REF` with your actual Supabase project reference ID
5. Click **Create**
6. **IMPORTANT**: Copy the **Client ID** and **Client Secret** - you'll need these for Supabase

## Step 2: Configure Supabase

### 2.1 Enable Google Provider

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list and enable it
5. Enter the credentials from Google Cloud Console:
   - **Client ID**: Paste from Step 1.4
   - **Client Secret**: Paste from Step 1.4
6. (Optional) Add authorized client IDs if you have mobile apps
7. Click **Save**

### 2.2 Configure Site URL

1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL** to your production domain:
   ```
   https://your-production-domain.com
   ```
3. Add **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   https://your-production-domain.com/auth/callback
   ```
4. Click **Save**

## Step 3: Test the Integration

### 3.1 Local Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/login`

3. Click **Sign in with Google Workspace**

4. You should be redirected to Google's login page

5. Sign in with your `@sakww.com` email

6. After successful authentication, you'll be redirected to `/customers`

### 3.2 Verify User in Supabase

1. Go to **Supabase Dashboard** > **Authentication** > **Users**
2. You should see the new user with:
   - Email from Google
   - Provider: `google`
   - User metadata including name and avatar

## Domain Restriction

The code includes a domain restriction (`hd: "sakww.com"`) which:

- Only allows users with `@sakww.com` email addresses
- Shows only your organization's Google Workspace accounts in the picker
- Prevents personal Gmail accounts from signing in

**Location**: `src/app/login/actions.ts:58`

```typescript
queryParams: {
  access_type: "offline",
  prompt: "consent",
  hd: "sakww.com", // Google Workspace domain restriction
},
```

## Security Best Practices

### 1. Restrict to Workspace Users Only

In Google Cloud Console OAuth consent screen:
- Always select **Internal** user type
- This ensures only `@sakww.com` users can authenticate

### 2. Enable Email Verification

In Supabase:
- Go to **Authentication** > **Providers** > **Email**
- Enable **Confirm email** if you want to require email verification for password-based signups

### 3. Set Up Row Level Security (RLS)

Ensure all database tables have RLS policies:
```sql
-- Example: Only allow authenticated users
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users" ON products
  FOR ALL
  TO authenticated
  USING (true);
```

### 4. Monitor Auth Logs

Regularly check Supabase logs:
- **Authentication** > **Logs**
- Look for failed login attempts
- Monitor for suspicious activity

## Troubleshooting

### Issue: "Access blocked: This app's request is invalid"

**Solution**:
1. Check that redirect URI in Google Cloud Console matches Supabase callback URL exactly
2. Ensure the Google+ API is enabled
3. Verify OAuth consent screen is configured

### Issue: "Redirect URI mismatch"

**Solution**:
1. Double-check the authorized redirect URIs in Google Cloud Console
2. Make sure you're using the correct Supabase project reference
3. Format: `https://PROJECT_REF.supabase.co/auth/v1/callback`

### Issue: Personal Gmail accounts can still sign in

**Solution**:
1. Verify OAuth consent screen is set to **Internal** (not External)
2. Check that `hd` parameter is set to `sakww.com` in the code
3. Clear browser cache and try again

### Issue: Users redirected to wrong page after login

**Solution**:
1. Check `src/app/auth/callback/route.ts`
2. Modify the redirect destination as needed:
```typescript
return NextResponse.redirect(`${origin}/customers`)
```

## User Management

### Adding New Users

1. Add user to Google Workspace (admin.google.com)
2. User can now sign in to ERP with their `@sakww.com` email
3. First login automatically creates their account in Supabase

### Removing Users

1. Remove from Google Workspace (they can no longer sign in)
2. Optionally delete from Supabase:
   - **Authentication** > **Users** > Select user > **Delete user**

### Assigning Roles

You can add custom roles in the user metadata:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'user@sakww.com';
```

## Production Deployment

### Checklist

- [ ] Update **Authorized JavaScript origins** with production domain
- [ ] Update **Authorized redirect URIs** with production callback URL
- [ ] Set correct **Site URL** in Supabase
- [ ] Add production domain to **Redirect URLs** in Supabase
- [ ] Test login flow on production
- [ ] Enable HTTPS (required for OAuth)
- [ ] Set up proper error handling and logging

## Support

For issues related to:
- **Google Workspace**: Contact your Google Workspace admin
- **Supabase**: Check [Supabase Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
- **Code issues**: Contact BK-SAK Woodworks development team

## References

- [Supabase Google OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Workspace Admin Help](https://support.google.com/a)
