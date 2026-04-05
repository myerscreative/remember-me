"use client";

import { ErrorFallback } from "@/components/error-fallback";
import { Activity } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { NeedsNurtureList } from "@/components/dashboard/NeedsNurtureList";
import { getDailyBriefing } from '@/app/actions/get-daily-briefing';
import LogGroupInteractionModal from "@/components/LogGroupInteractionModal";
import { getMilestones, type Milestone } from "@/lib/dashboard/dashboardUtils";
import {
  getDashboardStats,
  getContactsNeedingAttention,
  getTribeHealth,
  getRelationshipHealth,
  type DashboardStats,
  type TribeHealth,
  type RelationshipHealth,
} from "@/lib/dashboard/dashboardUtils";
import { createClient } from "@/lib/supabase/client";
import { getAllMapContacts } from "@/app/actions/dashboard-map";
import { getInitialsFromFullName } from "@/lib/utils/contact-helpers";
import { getLastSeenText } from "@/lib/utils/interaction-utils";
import Link from "next/link";

/* ─── helpers ─── */
function getGreetingPrefix(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** Map a contact to a health tier */
function getHealthTier(contact: any): {
  dot: string;
  label: string;
  textColor: string;
} {
  const now = Date.now();
  const lastDate = contact.last_interaction_date || contact.last_contact || contact.created_at;
  if (!lastDate) {
    return { dot: "var(--rm-health-brown)", label: "Drifting", textColor: "var(--rm-health-text-brown)" };
  }
  const daysAgo = Math.floor((now - new Date(lastDate).getTime()) / 86_400_000);
  let threshold = 30;
  if (contact.importance === "high") threshold = 14;
  else if (contact.importance === "low") threshold = 90;

  if (daysAgo < threshold) {
    return { dot: "var(--rm-health-green)", label: "Thriving", textColor: "var(--rm-health-green)" };
  }
  if (daysAgo < threshold + 30) {
    return { dot: "var(--rm-health-amber)", label: "Needs some love", textColor: "var(--rm-health-text-amber)" };
  }
  return { dot: "var(--rm-health-brown)", label: "Drifting", textColor: "var(--rm-health-text-brown)" };
}

function getContextLine(contact: any): string {
  const where = contact.where_met;
  const lastSeen = getLastSeenText(contact.last_interaction_date);

  if (where && !where.includes("@") && !where.toLowerCase().includes("hotmail") && !where.toLowerCase().includes("gmail") && !where.toLowerCase().includes("yahoo")) {
    return `${where} · ${lastSeen === "Never" ? "No contact yet" : lastSeen}`;
  }
  return `Added from contacts · ${lastSeen === "Never" ? "No contact yet" : lastSeen}`;
}

function getCTALabel(contact: any): string {
  const hasInteraction = contact.last_interaction_date || contact.last_contact;
  return hasInteraction ? "Check in →" : "Say hello →";
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [needingAttention, setNeedingAttention] = useState<any[]>([]);
  const [tribeHealth, setTribeHealth] = useState<TribeHealth[]>([]);
  const [relationshipHealth, setRelationshipHealth] = useState<RelationshipHealth | null>(null);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  const [user, setUser] = useState<any>(null);
  const [selectedTribe, setSelectedTribe] = useState<TribeHealth | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        statsResult,
        attentionResult,
        tribesResult,
        healthResult,
        briefingResult,
        mapResult,
        milestonesResult,
      ] = await Promise.all([
        getDashboardStats(),
        getContactsNeedingAttention(),
        getTribeHealth(),
        getRelationshipHealth(),
        getDailyBriefing(),
        getAllMapContacts(),
        getMilestones(),
      ]);

      if (mapResult.data) {
        setAllContacts(mapResult.data);
      }

      if (statsResult.error) throw statsResult.error;

      setStats(statsResult.data);
      setNeedingAttention((attentionResult.data || []).slice(0, 10));
      setTribeHealth(tribesResult.data || []);
      setRelationshipHealth(healthResult.data);
      setMilestones(milestonesResult.data || []);

      if (briefingResult) {
        // handled in briefing page
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError(error instanceof Error ? error : new Error("Failed to load dashboard data"));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  /* ─── loading ─── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--rm-bg-base)" }}>
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 animate-pulse" style={{ color: "var(--rm-accent)" }} />
          <span style={{ color: "var(--rm-text-secondary)", fontSize: 13 }}>Loading...</span>
        </div>
      </div>
    );
  }

  /* ─── error ─── */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "var(--rm-bg-base)" }}>
        <ErrorFallback
          error={error}
          reset={loadDashboardData}
          title="Dashboard unavailable"
          message="We couldn't load your dashboard data. Please check your connection and try again."
        />
      </div>
    );
  }

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.user_metadata?.name?.split(" ")[0] ||
    "Friend";

  const topThree = needingAttention.slice(0, 3);
  const hasMore = needingAttention.length > 3;

  /* Filter milestones to show non-empty slots */
  const upcomingBirthday = milestones.find((m) => m.type === "birthday");
  const upcomingAnniversary = milestones.find((m) => m.type === "anniversary");
  const upcomingFollowUp = milestones.find((m) => m.type !== "birthday" && m.type !== "anniversary");
  const comingUpItems = [upcomingBirthday, upcomingAnniversary, upcomingFollowUp].filter(Boolean) as Milestone[];

  return (
    <div className="flex flex-col min-h-screen pb-32 overflow-x-hidden" style={{ backgroundColor: "var(--rm-bg-base)" }}>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto w-full px-4 py-6 space-y-5">

          {/* ─── Greeting ─── */}
          <div style={{ padding: "0 2px" }}>
            <h1
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 21,
                lineHeight: 1.25,
                fontWeight: 400,
                color: "var(--rm-text-primary)",
              }}
            >
              {getGreetingPrefix()}, {firstName}.
            </h1>
            <p
              style={{
                fontSize: 12,
                color: "var(--rm-text-muted)",
                marginTop: 4,
              }}
            >
              {formatTodayDate()}
            </p>
          </div>

          {/* ─── "A few people to say hello to" ─── */}
          {topThree.length > 0 && (
            <section>
              <h2
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: "var(--rm-text-muted)",
                  marginBottom: 9,
                }}
              >
                A few people to say hello to
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {topThree.map((contact) => {
                  const health = getHealthTier(contact);
                  const initials = getInitialsFromFullName(contact.name || "?");
                  return (
                    <div
                      key={contact.id}
                      onClick={() => router.push(`/contacts/${contact.id}`)}
                      style={{
                        backgroundColor: "var(--rm-bg-card)",
                        border: "0.5px solid var(--rm-border)",
                        borderRadius: 13,
                        padding: "11px 13px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                      }}
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

                      {/* Name + context + health */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "var(--rm-text-primary)",
                            lineHeight: 1.3,
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
                          {getContextLine(contact)}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              backgroundColor: health.dot,
                              display: "inline-block",
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ fontSize: 10, color: health.textColor }}>
                            {health.label}
                          </span>
                        </div>
                      </div>

                      {/* CTA */}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: "var(--rm-accent)",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {getCTALabel(contact)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {hasMore && (
                <Link
                  href="/?filter=nurture"
                  style={{
                    display: "block",
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--rm-accent)",
                    marginTop: 10,
                  }}
                >
                  See all
                </Link>
              )}
            </section>
          )}

          {/* ─── Coming up ─── */}
          {comingUpItems.length > 0 && (
            <section>
              <h2
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: "var(--rm-text-muted)",
                  marginBottom: 9,
                }}
              >
                Coming up
              </h2>

              <div style={{ display: "flex", gap: 7, overflowX: "auto" }} className="scrollbar-hide">
                {comingUpItems.map((m, i) => {
                  const isOverdue = m.daysRemaining === 0;
                  const timingColor = isOverdue ? "var(--rm-health-text-amber)" : "var(--rm-accent)";
                  const timingText = isOverdue
                    ? "Today"
                    : m.daysRemaining === 1
                      ? "Tomorrow"
                      : `In ${m.daysRemaining} days`;
                  const typeLabel =
                    m.type === "birthday"
                      ? "Birthday"
                      : m.type === "anniversary"
                        ? "Anniversary"
                        : "Follow-up";

                  return (
                    <div
                      key={`${m.contactId}-${i}`}
                      style={{
                        backgroundColor: "var(--rm-bg-card-mini)",
                        border: "0.5px solid var(--rm-border)",
                        borderRadius: 10,
                        padding: "8px 9px",
                        minWidth: 130,
                        flex: "1 1 0",
                      }}
                    >
                      <div style={{ fontSize: 9, color: "var(--rm-text-muted)", marginBottom: 3 }}>
                        {typeLabel}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--rm-text-primary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {m.contactName}
                      </div>
                      <div style={{ fontSize: 10, color: timingColor, marginTop: 2 }}>
                        {timingText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ─── Full nurture list (below fold) ─── */}
          <NeedsNurtureList contacts={needingAttention} />
        </div>
      </div>

      <LogGroupInteractionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadDashboardData}
        tribeName={selectedTribe?.name || ""}
        contacts={selectedTribe?.contacts || []}
      />
    </div>
  );
}
