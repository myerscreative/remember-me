# Nurture Tracking Feature

## Overview

The Nurture Tracking feature helps you maintain relationships by reminding you when to reach out to contacts. This prevents relationships from going stale and helps you stay connected with important people in your network.

## Features

- **Next Contact Date**: Set a specific date to reach out to someone
- **Contact Reason**: Optional note about why you're reaching out or what to discuss
- **Visual Urgency Indicators**: Color-coded display based on how soon you need to contact someone
  - 🔴 **Overdue**: Contact date has passed
  - 🟠 **Today**: Contact is due today
  - 🟡 **Urgent**: Due within 3 days
  - 🔵 **Soon**: Due within 7 days
  - 🟢 **Upcoming**: More than 7 days away

- **Quick Actions**:
  - **Mark as Contacted**: Updates last contact date and suggests next contact date (60 days)
  - **Snooze**: Push the contact date forward by 1 week or 1 month
  - **Edit**: Change the date or reason

## Two UI Options

The feature includes two different UI implementations that you can toggle between:

### Option A: Inline Display (Simple)
- Shows the next contact date inline with email, phone, and birthday
- Minimal, compact display
- Best for users who want a clean, unobtrusive reminder
- Located in the contact header below birthday

### Option B: Prominent Card (Full-Featured)
- Dedicated "Nurture Schedule" section with its own card
- Shows more information including last contact date
- Includes all quick action buttons
- More visual urgency indicators
- Better for users who prioritize relationship nurturing
- Located between "Most Recent Interaction" and action buttons

**Toggle Button**: Click the 📋/📅 button in the header to switch between options

## Database Schema

### New Fields in `persons` table:
```sql
next_contact_date DATE          -- When to reach out next
next_contact_reason TEXT         -- Optional note about why/what to discuss
last_contacted_date DATE         -- Last date of meaningful contact
```

### Functions Available:
- `get_contacts_due_for_followup(user_id, days_ahead)` - Returns contacts needing attention
- `suggest_next_contact_date(last_contact, relationship_strength)` - AI-powered date suggestions

## Usage

### Setting a Next Contact Date

1. Enter **Edit Mode** by clicking the edit icon in the header
2. Click "Set Next Contact Date" (Option A) or "Schedule Next Contact" (Option B)
3. Choose a date and optionally add a reason
4. Click "Save"

### Marking as Contacted

1. When you contact someone, click "Mark as Contacted"
2. This automatically:
   - Sets today as the last contact date
   - Suggests a next contact date (60 days from now)
   - Updates the most recent interaction timestamp

### Snoozing a Contact

1. If you're not ready to reach out yet, use the snooze buttons
2. "+1 Week" or "+1 Month" will push the date forward
3. The urgency indicator will update accordingly

## Future Enhancements

- **Dashboard View**: Home page section showing all overdue/upcoming contacts
- **AI Suggestions**: Automatically suggest next contact dates based on:
  - Relationship strength
  - Past interaction frequency
  - Contact's role/importance
- **Reminders**: Email or push notifications for due contacts
- **Analytics**: Track how well you're nurturing your network
- **Bulk Actions**: Set nurture schedules for multiple contacts at once
- **Smart Scheduling**: Integrate with calendar to suggest optimal contact times

## Migration

To add this feature to your database:

```bash
# Run the migration
psql -U your_user -d your_database -f migrations/add_nurture_tracking.sql
```

Or in Supabase SQL Editor:
1. Open the SQL Editor
2. Paste the contents of `migrations/add_nurture_tracking.sql`
3. Click "Run"

## Design Philosophy

The nurture tracking feature is designed to:
- **Reduce friction**: Make it as easy as possible to set reminders
- **Be forgiving**: Snooze and reschedule without guilt
- **Provide context**: Show why and when to reach out
- **Build habits**: Encourage regular relationship maintenance
- **Stay flexible**: Work with different networking styles

## Recommendations

### For Most Users
- Start with **Option B (Card View)** for visibility
- Set next contact dates for your top 20-30 contacts
- Check the dashboard weekly
- Use 60-day default for professional contacts
- Use 30-day default for close relationships

### For Power Users
- Switch to **Option A (Inline View)** for a cleaner look once you're used to the system
- Customize contact intervals based on relationship value
- Use the reason field to prepare conversation topics
- Review overdue contacts monthly and decide to nurture or archive

## Best Practices

1. **Be realistic**: Don't over-commit to nurturing too many relationships
2. **Add context**: Use the reason field to make follow-ups more meaningful
3. **Review regularly**: Check your nurture dashboard weekly
4. **Quality over quantity**: Focus on meaningful connections, not just staying in touch
5. **Forgive yourself**: Overdue is okay - reach out when you can

