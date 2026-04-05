"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getInitialsFromFullName } from "@/lib/utils/contact-helpers";
import { getLastSeenText } from "@/lib/utils/interaction-utils";
import { UnifiedActionHub } from "@/components/dashboard/UnifiedActionHub";
import { ReachOutPanel } from "@/components/contacts/ReachOutPanel";
import { NurtureDrawer } from "@/components/nurture/NurtureDrawer";

interface NeedsNurtureListProps {
  contacts: any[];
}

/* ─── health tier helper ─── */
function getHealthTier(contact: any): {
  dot: string;
  label: string;
  textColor: string;
} | null {
  const lastDate = contact.last_interaction_date || contact.last_contact;
  if (!lastDate) return null; // no interaction history → show "Reach out" CTA instead

  const daysAgo = Math.floor(
    (Date.now() - new Date(lastDate).getTime()) / 86_400_000
  );
  let threshold = 30;
  if (contact.importance === "high") threshold = 14;
  else if (contact.importance === "low") threshold = 90;

  if (daysAgo < threshold) {
    return {
      dot: "var(--rm-health-green)",
      label: "Thriving",
      textColor: "var(--rm-health-green)",
    };
  }
  if (daysAgo < threshold + 30) {
    return {
      dot: "var(--rm-health-amber)",
      label: "Needs some love",
      textColor: "var(--rm-health-text-amber)",
    };
  }
  return {
    dot: "var(--rm-health-brown)",
    label: "Drifting",
    textColor: "var(--rm-health-text-brown)",
  };
}

function getContextSub(contact: any): string {
  const where = contact.where_met;
  const lastSeen = getLastSeenText(contact.last_interaction_date);
  if (
    where &&
    !where.includes("@") &&
    !where.toLowerCase().includes("hotmail") &&
    !where.toLowerCase().includes("gmail") &&
    !where.toLowerCase().includes("yahoo")
  ) {
    return `${where} · ${lastSeen === "Never" ? "No contact yet" : lastSeen}`;
  }
  return `Added from contacts · ${lastSeen === "Never" ? "No contact yet" : lastSeen}`;
}

export function NeedsNurtureList({ contacts = [] }: NeedsNurtureListProps) {
  const router = useRouter();
  const [activeTribe, setActiveTribe] = useState("All");
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [isNurtureDrawerOpen, setIsNurtureDrawerOpen] = useState(false);
  const [isSharedMemoryOpen, setIsSharedMemoryOpen] = useState(false);
  const [isReachOutOpen, setIsReachOutOpen] = useState(false);

  const tribes = useMemo(() => {
    const set = new Set<string>(["All"]);
    contacts.forEach((c) => {
      const tags = c.person_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [];
      tags.forEach((t: string) => set.add(t));
    });
    return Array.from(set).sort();
  }, [contacts]);

  const filtered = useMemo(() => {
    if (activeTribe === "All") return contacts;
    return contacts.filter((c) => {
      const tags = c.person_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [];
      return tags.includes(activeTribe);
    });
  }, [contacts, activeTribe]);

  const count = filtered.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* ─── Header ─── */}
      <div style={{ padding: "0 2px" }}>
        <h2
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 19,
            fontWeight: 400,
            color: "var(--rm-text-primary)",
            lineHeight: 1.3,
          }}
        >
          A little love goes a long way.
        </h2>
        <p style={{ fontSize: 12, color: "var(--rm-text-muted)", marginTop: 4 }}>
          {count} connection{count !== 1 ? "s" : ""} ready to hear from you.
        </p>
      </div>

      {/* ─── Tribe filter ─── */}
      {tribes.length > 1 && (
        <div
          className="scrollbar-hide"
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            paddingBottom: 2,
          }}
        >
          {tribes.map((tribe) => (
            <button
              key={tribe}
              onClick={() => setActiveTribe(tribe)}
              style={{
                flexShrink: 0,
                padding: "4px 12px",
                borderRadius: 9999,
                fontSize: 10,
                fontWeight: 500,
                border: activeTribe === tribe ? "none" : "0.5px solid var(--rm-border)",
                backgroundColor: activeTribe === tribe ? "var(--rm-accent)" : "transparent",
                color: activeTribe === tribe ? "#FFFFFF" : "var(--rm-text-muted)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tribe}
            </button>
          ))}
        </div>
      )}

      {/* ─── Grouped card list ─── */}
      {filtered.length > 0 ? (
        <div
          style={{
            backgroundColor: "var(--rm-bg-card)",
            border: "0.5px solid var(--rm-border)",
            borderRadius: 13,
            overflow: "hidden",
          }}
        >
          {filtered.map((contact, idx) => {
            const health = getHealthTier(contact);
            const initials = getInitialsFromFullName(contact.name || "?");
            const isFirst = idx === 0;
            const isLast = idx === filtered.length - 1;

            return (
              <div
                key={contact.id}
                onClick={() => {
                  setSelectedContact(contact);
                  setIsNurtureDrawerOpen(true);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 13px",
                  cursor: "pointer",
                  borderBottom: isLast ? "none" : "0.5px solid var(--rm-border)",
                  transition: "background 0.15s",
                }}
                className="hover:opacity-80"
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    backgroundColor: "var(--rm-avatar-bg)",
                    color: "var(--rm-avatar-text)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>

                {/* Name + context */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--rm-text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {contact.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--rm-text-secondary)",
                      marginTop: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {getContextSub(contact)}
                  </div>
                </div>

                {/* Right side: health dot OR "Reach out" CTA */}
                {health ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        backgroundColor: health.dot,
                        display: "inline-block",
                      }}
                    />
                  </div>
                ) : (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "var(--rm-accent)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedContact(contact);
                      setIsReachOutOpen(true);
                    }}
                  >
                    Reach out
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "var(--rm-bg-card)",
            border: "0.5px solid var(--rm-border)",
            borderRadius: 13,
            padding: "32px 16px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--rm-text-primary)" }}>
            Your garden is thriving!
          </p>
          <p style={{ fontSize: 11, color: "var(--rm-text-secondary)", marginTop: 4 }}>
            Everyone in {activeTribe} is up to date.
          </p>
        </div>
      )}

      {/* ─── Health legend ─── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 2px" }}>
        {[
          { color: "var(--rm-health-green)", label: "thriving" },
          { color: "var(--rm-health-amber)", label: "needs love" },
          { color: "var(--rm-health-brown)", label: "fading" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: item.color,
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 10, color: "var(--rm-text-muted)" }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* ─── Modals ─── */}
      {selectedContact && (
        <UnifiedActionHub
          isOpen={isSharedMemoryOpen}
          onClose={() => setIsSharedMemoryOpen(false)}
          person={selectedContact}
          onAction={(type) => {
            setIsSharedMemoryOpen(false);
            router.push(`/contacts/${selectedContact.id}?action=${type}`);
          }}
        />
      )}

      {selectedContact && (
        <NurtureDrawer
          isOpen={isNurtureDrawerOpen}
          onOpenChange={setIsNurtureDrawerOpen}
          data={{
            contactId: selectedContact.id,
            name: selectedContact.name || selectedContact.first_name,
            whyStayInContact:
              selectedContact.latest_next_goal ||
              "They are a valued connection in your network.",
            lastSharedMemory: {
              content: selectedContact.notes || "how you first met last year",
              date: selectedContact.last_interaction_date || new Date().toISOString(),
            },
            preferredChannel: "SMS",
            phoneNumber: selectedContact.phone,
            email: selectedContact.email,
          }}
        />
      )}

      {selectedContact && (
        <ReachOutPanel
          isOpen={isReachOutOpen}
          onClose={() => setIsReachOutOpen(false)}
          contact={selectedContact}
        />
      )}
    </div>
  );
}
