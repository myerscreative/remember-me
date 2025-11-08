"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StoryCompletenessIndicatorProps {
  completeness: number;
  missingFields: string[];
  contactName: string;
}

const getFieldLabel = (field: string): string => {
  const labels: Record<string, string> = {
    where_met: "Where you met",
    when_met: "When you met",
    first_impression: "Your first impression",
    why_stay_in_contact: "Why this relationship matters",
    what_found_interesting: "What you found interesting",
    most_important_to_them: "What's important to them",
    memorable_moment: "What made it memorable",
    relationship_value: "Value of this relationship",
    interests: "Their interests",
    birthday: "Their birthday",
  };
  return labels[field] || field;
};

export function StoryCompletenessIndicator({
  completeness,
  missingFields,
  contactName,
}: StoryCompletenessIndicatorProps) {
  const [expanded, setExpanded] = useState(false);

  if (completeness >= 80) {
    return (
      <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                  Story {completeness}% Complete
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Great! You've captured the relationship context.
                </p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              Complete
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getColor = () => {
    if (completeness < 40) return {
      bg: "from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950",
      border: "border-red-200 dark:border-red-800",
      icon: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400",
      text: "text-red-900 dark:text-red-100",
      subtext: "text-red-700 dark:text-red-300",
      progress: "bg-red-600 dark:bg-red-500",
      badge: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    };
    if (completeness < 70) return {
      bg: "from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950",
      border: "border-yellow-200 dark:border-yellow-800",
      icon: "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400",
      text: "text-yellow-900 dark:text-yellow-100",
      subtext: "text-yellow-700 dark:text-yellow-300",
      progress: "bg-yellow-600 dark:bg-yellow-500",
      badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    };
    return {
      bg: "from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950",
      border: "border-blue-200 dark:border-blue-800",
      icon: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
      text: "text-blue-900 dark:text-blue-100",
      subtext: "text-blue-700 dark:text-blue-300",
      progress: "bg-blue-600 dark:bg-blue-500",
      badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    };
  };

  const colors = getColor();
  const getMessage = () => {
    if (completeness < 40) return "Your story is incomplete. Add context before memories fade!";
    if (completeness < 70) return "Almost there! A few more details will complete the story.";
    return "Just a few more details to capture the full context.";
  };

  return (
    <Card className={cn("border-2 bg-gradient-to-r", colors.border, colors.bg)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", colors.icon)}>
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className={cn("text-sm font-semibold", colors.text)}>
                    Story {completeness}% Complete
                  </p>
                  <Badge className={colors.badge}>
                    {missingFields.length} missing
                  </Badge>
                </div>
                <p className={cn("text-xs", colors.subtext)}>
                  {getMessage()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className={cn("h-8 w-8 p-0", colors.subtext)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-500", colors.progress)}
              style={{ width: `${completeness}%` }}
            />
          </div>

          {/* Missing Fields List */}
          {expanded && missingFields.length > 0 && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className={cn("text-xs font-medium mb-2", colors.subtext)}>
                Add these details:
              </p>
              <div className="space-y-1">
                {missingFields.map((field, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={cn("h-1.5 w-1.5 rounded-full", colors.progress)} />
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      {getFieldLabel(field)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
