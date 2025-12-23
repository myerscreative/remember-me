import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Contact } from '../mockContacts';
import ContactCard from './ContactCard';
import { calculateMatchScore, MatchLevel } from '../utils/matchUtils';

interface ContactsGridProps {
  contacts: Contact[];
  selectedContact?: Contact;
  viewMode: 'compact' | 'standard' | 'detailed';
  onSelectContact: (contact: Contact) => void;
  onPreviewContact: (contact: Contact) => void;
}

export default function ContactsGrid({ contacts, selectedContact, viewMode, onSelectContact, onPreviewContact }: ContactsGridProps) {
  // Determine match level for each contact relative to selectedContact
  const getMatchInfo = React.useCallback((contact: Contact) => {
    if (selectedContact) {
      if (contact.id === selectedContact.id) {
        return { level: 'selected' as MatchLevel, sharedInterests: [], count: 0 };
      }
      return calculateMatchScore(selectedContact, contact);
    }
    return { level: 'none' as MatchLevel, sharedInterests: [], count: 0 };
  }, [selectedContact]);

  // Sort contacts: Selected -> Strong/Medium Matches (by count) -> No Matches -> Alphabetical
  const sortedContacts = useMemo(() => {
    // If no selection, just sort alphabetically
    if (!selectedContact) {
      return [...contacts].sort((a, b) => a.name.localeCompare(b.name));
    }

    // Map to include match info for sorting
    const withMatchInfo = contacts.map(contact => {
       const info = getMatchInfo(contact);
       return { contact, ...info };
    });

    return withMatchInfo.sort((a, b) => {
      // 1. Selected person first
      if (a.level === 'selected') return -1;
      if (b.level === 'selected') return 1;

      // 2. Sort by match level group (Strong/Medium -> None)
      // Custom precedence: Strong (score 2), Medium (score 1), None (score 0)
      const getScore = (level: MatchLevel) => {
        if (level === 'strong') return 2;
        if (level === 'medium') return 1;
        return 0;
      };
      const scoreA = getScore(a.level);
      const scoreB = getScore(b.level);
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Descending score
      }

      // 3. Within same level, sort by match count (descending)
      if (a.count !== b.count) {
        return b.count - a.count;
      }

      // 4. Finally, alphabetical
      return a.contact.name.localeCompare(b.contact.name);
    }).map(item => item.contact);
    
  }, [contacts, selectedContact, getMatchInfo]);

  // Responsive grid: adjust min width based on viewMode
  const minWidth = viewMode === 'compact' ? 120 : viewMode === 'standard' ? 150 : 200; // px

  return (
    <motion.div
      layout
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
      }}
    >
      <AnimatePresence>
        {sortedContacts.map((contact) => {
          const { level, sharedInterests, count } = getMatchInfo(contact);
          return (
            <motion.div
              layout
              key={contact.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }, // Customized ease
                opacity: { duration: 0.3 }
              }}
            >
              <ContactCard
                contact={contact}
                matchLevel={level}
                sharedInterests={sharedInterests}
                matchCount={count}
                viewMode={viewMode}
                hasSelection={!!selectedContact}
                onSelect={onSelectContact}
                onPreview={onPreviewContact}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
