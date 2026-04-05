"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, MapPin, MessageCircle, Users, Archive, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RelationshipPattern {
  type: string;
  insight: string;
  metric: string;
  recommendation: string;
}

const getPatternIcon = (type: string) => {
  switch (type) {
    case "decay_pattern":
      return TrendingUp;
    case "location_pattern":
      return MapPin;
    case "interaction_preference":
      return MessageCircle;
    case "growth_rate":
      return Users;
    case "archive_pattern":
      return Archive;
    default:
      return BarChart3;
  }
};

const getPatternColor = (type: string) => {
  switch (type) {
    case "decay_pattern":
      return {
        bg: "bg-orange-100 dark:bg-orange-900/30",
        text: "text-orange-700 dark:text-orange-300",
        iconBg: "bg-orange-500",
        badge: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
      };
    case "location_pattern":
      return {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-300",
        iconBg: "bg-blue-500",
        badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      };
    case "interaction_preference":
      return {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        text: "text-purple-700 dark:text-purple-300",
        iconBg: "bg-purple-500",
        badge: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
      };
    case "growth_rate":
      return {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-700 dark:text-green-300",
        iconBg: "bg-green-500",
        badge: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      };
    case "archive_pattern":
      return {
        bg: "bg-subtle",
        text: "text-text-secondary",
        iconBg: "bg-gray-500",
        badge: "bg-subtle text-text-secondary",
      };
    default:
      return {
        bg: "bg-cyan-100 dark:bg-cyan-900/30",
        text: "text-cyan-700 dark:text-cyan-300",
        iconBg: "bg-cyan-500",
        badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
      };
  }
};

export function RelationshipPatternsSection() {
  const [patterns, setPatterns] = useState<RelationshipPattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatterns() {
      try {
        const response = await fetch("/api/relationship-patterns");
        if (response.ok) {
          const data = await response.json();
          setPatterns(data.patterns || []);
        }
      } catch (error) {
        console.error("Error fetching relationship patterns:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPatterns();
  }, []);

  if (loading) {
    return (
      <Card className="bg-surface p-6 rounded-xl border-none shadow-sm">
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-text-tertiary">Analyzing patterns...</p>
        </div>
      </Card>
    );
  }

  if (patterns.length === 0) {
    return (
      <Card className="bg-surface p-6 rounded-xl border-none shadow-sm">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-5 w-5 text-text-secondary" />
            <h2 className="text-xl font-semibold text-text-primary">Relationship Patterns</h2>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Not enough data yet - keep building your network!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-surface p-6 rounded-xl border-none shadow-sm">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          <h2 className="text-xl font-semibold text-text-primary">Your Relationship Patterns</h2>
        </div>
        <p className="text-sm text-text-secondary mt-1">
          Insights about how you build and maintain relationships
        </p>
      </div>
      <div className="space-y-3">
        {patterns.map((pattern, index) => {
          const Icon = getPatternIcon(pattern.type);
          const colors = getPatternColor(pattern.type);

          return (
            <div
              key={index}
              className={cn(
                "rounded-lg p-4 border-2 transition-all hover:shadow-md",
                colors.bg,
                "border-transparent"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", colors.iconBg)}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={cn("text-sm font-semibold", colors.text)}>{pattern.insight}</p>
                    <Badge className={cn("text-xs font-medium", colors.badge)}>{pattern.metric}</Badge>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    💡 {pattern.recommendation}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
