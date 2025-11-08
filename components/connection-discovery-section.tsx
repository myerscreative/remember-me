"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lightbulb, Users, MapPin, Heart, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ConnectionDiscovery {
  type: "shared_introducer" | "shared_location" | "shared_interest" | "same_company";
  persons: Array<{
    id: string;
    first_name: string;
    last_name: string | null;
    photo_url: string | null;
  }>;
  commonValue: string;
  count: number;
}

// Helper function to get initials
const getInitials = (firstName: string, lastName: string | null): string => {
  if (!firstName) return "";
  const firstInitial = firstName.trim()[0]?.toUpperCase() || "";
  const lastInitial = lastName?.trim()[0]?.toUpperCase() || "";
  return (firstInitial + lastInitial) || firstName.substring(0, 2).toUpperCase();
};

// Helper function to get gradient
const getGradient = (name: string): string => {
  const gradients = [
    "from-purple-500 to-blue-500",
    "from-green-500 to-blue-500",
    "from-orange-500 to-yellow-500",
    "from-cyan-500 to-green-500",
    "from-pink-500 to-red-500",
    "from-indigo-500 to-purple-500",
  ];
  let hash = 0;
  const fullName = name;
  for (let i = 0; i < fullName.length; i++) {
    hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

const getTypeInfo = (type: string) => {
  switch (type) {
    case "shared_introducer":
      return {
        icon: Users,
        label: "Introduced by",
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
        iconColor: "text-blue-600 dark:text-blue-400",
      };
    case "shared_location":
      return {
        icon: MapPin,
        label: "Met at",
        color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
        iconColor: "text-green-600 dark:text-green-400",
      };
    case "shared_interest":
      return {
        icon: Heart,
        label: "Interested in",
        color: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
        iconColor: "text-pink-600 dark:text-pink-400",
      };
    default:
      return {
        icon: Users,
        label: "Connection",
        color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
        iconColor: "text-purple-600 dark:text-purple-400",
      };
  }
};

export function ConnectionDiscoverySection() {
  const [discoveries, setDiscoveries] = useState<ConnectionDiscovery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDiscoveries() {
      try {
        const response = await fetch("/api/connection-discovery");
        if (response.ok) {
          const data = await response.json();
          setDiscoveries(data.discoveries || []);
        }
      } catch (error) {
        console.error("Error fetching connection discoveries:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDiscoveries();
  }, []);

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-800 p-6 rounded-xl border-none shadow-sm">
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading discoveries...</p>
        </div>
      </Card>
    );
  }

  if (discoveries.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 p-6 rounded-xl border-2 border-purple-200 dark:border-purple-800 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-xl font-semibold text-purple-900 dark:text-purple-100">
            Connection Discoveries
          </h2>
        </div>
        <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
          Hidden patterns in your network
        </p>
      </div>
      <div className="space-y-3">
        {discoveries.map((discovery, index) => {
          const typeInfo = getTypeInfo(discovery.type);
          const Icon = typeInfo.icon;

          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1">
                  <Icon className={cn("h-5 w-5 flex-shrink-0", typeInfo.iconColor)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {typeInfo.label} <span className="font-bold">{discovery.commonValue}</span>
                    </p>
                  </div>
                  <Badge className={cn("text-xs font-medium", typeInfo.color)}>
                    {discovery.count} contacts
                  </Badge>
                </div>
              </div>

              {/* Show avatars of connected contacts */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {discovery.persons.slice(0, 5).map((person) => {
                    const fullName = `${person.first_name} ${person.last_name || ""}`.trim();
                    return (
                      <Link key={person.id} href={`/contacts/${person.id}`}>
                        <Avatar className="h-8 w-8 border-2 border-white dark:border-gray-800 hover:z-10 hover:scale-110 transition-transform cursor-pointer">
                          <AvatarImage src={person.photo_url || undefined} />
                          <AvatarFallback
                            className={cn(
                              "bg-gradient-to-br text-white text-xs font-semibold",
                              getGradient(fullName)
                            )}
                          >
                            {getInitials(person.first_name, person.last_name)}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                    );
                  })}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {discovery.persons
                      .slice(0, 3)
                      .map((p) => `${p.first_name} ${p.last_name || ""}`.trim())
                      .join(", ")}
                    {discovery.persons.length > 3 && ` +${discovery.persons.length - 3} more`}
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
