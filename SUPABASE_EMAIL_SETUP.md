# 📧 Supabase Email Setup Guide

## Problem: Password Reset Emails Not Sending

If password reset emails aren't arriving, it's usually a Supabase email configuration issue.

---

## ✅ Quick Fix: Configure Custom SMTP

### Option 1: SendGrid (Recommended - Free 100 emails/day)

**Step 1: Create SendGrid Account**
1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up for free account
3. Verify your email

**Step 2: Create API Key**
1. In SendGrid dashboard, go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name: "Supabase ReMember Me"
4. Permissions: **Full Access** (or just Mail Send)
5. Click **Create & View**
6. **Copy the API key** (you'll only see it once!)

**Step 3: Configure in Supabase**
1. Go to your Supabase dashboard
2. **Project Settings** → **Auth**
3. Scroll to **SMTP Settings**
4. Toggle **Enable Custom SMTP**
5. Fill in:
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [Your SendGrid API Key]
   Sender email: your-email@yourdomain.com
   Sender name: ReMember Me
   ```
6. Click **Save**

**Step 4: Verify Sender Email**
1. SendGrid will send a verification email
2. Click the link to verify
3. Wait 5 minutes for verification to complete

**Step 5: Test**
1. Try password reset again
2. Email should arrive within seconds!

---

### Option 2: Gmail SMTP (Quick Testing)

**⚠️ Warning:** Gmail has strict sending limits (100-500/day). Good for testing, not production.

**Step 1: Enable 2-Step Verification**
1. Go to [Google Account Settings](https://myaccount.google.com)
2. **Security** → **2-Step Verification**
3. Enable it

**Step 2: Create App Password**
1. Still in **Security**
2. Scroll to **2-Step Verification** → **App passwords**
3. Select **Mail** and **Other (Custom name)**
4. Name: "Supabase ReMember Me"
5. Click **Generate**
6. **Copy the 16-character password**

**Step 3: Configure in Supabase**
```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: [16-character app password]
Sender email: your-email@gmail.com
Sender name: ReMember Me
```

---

### Option 3: Mailgun (Production - 5,000 free emails/month)

**Step 1: Create Account**
1. Go to [mailgun.com](https://mailgun.com)
2. Sign up for free
3. Verify email and phone

**Step 2: Add Domain**
1. Click **Sending** → **Domains**
2. Add your domain OR use Mailgun sandbox domain (testing)
3. Follow DNS verification steps

**Step 3: Get SMTP Credentials**
1. Click your domain
2. **SMTP credentials** section
3. Username and Password shown

**Step 4: Configure in Supabase**
```
Host: smtp.mailgun.org
Port: 587
Username: [From Mailgun dashboard]
Password: [From Mailgun dashboard]
Sender email: noreply@yourdomain.com
Sender name: ReMember Me
```

---

## 🔍 Troubleshooting

### Email Still Not Arriving?

**1. Check Supabase Email Logs**
- Go to **Authentication** → **Logs**
- Look for password reset attempts
- Check for errors

**2. Check Spam Folder**
- Password reset emails often go to spam initially
- Mark as "Not Spam" to train filters

**3. Verify Redirect URLs**
- **Authentication** → **URL Configuration**
- Add redirect URL: `http://localhost:3000/auth/callback*`
- Add redirect URL: `https://your-domain.com/auth/callback*` (production)

**4. Check Rate Limits**
- Supabase default: 4 emails/hour
- Custom SMTP: Much higher limits
- **Authentication** → **Rate Limits** to check

**5. Test Email Template**
- **Authentication** → **Email Templates**
- Click **Reset Password** template
- Click **Send Test Email**
- Enter your email and send

### Email Arrives but Link Doesn't Work?

**Check:**
1. Is `/reset-password` accessible? (We already fixed this in middleware)
2. Is the redirect URL correct in the template?
3. Try clicking the link in an incognito window

---

## 📋 Production Checklist

Before going live:

- [ ] Custom SMTP configured (not using Supabase default)
- [ ] Sender email verified
- [ ] Production redirect URLs added to Supabase
- [ ] Email templates customized (branding, copy)
- [ ] Test password reset flow end-to-end
- [ ] Check emails don't go to spam
- [ ] Set up email monitoring/alerts

---

## 🎨 Customize Email Templates

**In Supabase Dashboard:**
1. **Authentication** → **Email Templates**
2. Click **Reset Password**
3. Customize:
   - Subject line
   - Email body (supports HTML)
   - Button text
   - Footer

**Variables you can use:**
- `{{ .ConfirmationURL }}` - The reset link
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email

**Example Custom Template:**
```html
<h2>Reset Your Password</h2>
<p>Hi there,</p>
<p>We received a request to reset your password for ReMember Me.</p>
<p>Click the button below to set a new password:</p>
<a href="{{ .ConfirmationURL }}" style="background: #3B82F6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
  Reset Password
</a>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>This link expires in 1 hour.</p>
```

---

**Last Updated:** Password Reset Email Configuration Guide
**Status:** Ready to configure custom SMTP

