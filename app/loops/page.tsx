"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LoopGroupWithCount } from "@/types/database.types";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { LoopGroupModal } from "@/components/loop-group-modal";

// Type for icon component
type IconComponent = React.ComponentType<{ className?: string }>;

// Helper function to get icon component by name
const getIconComponent = (iconName: string): IconComponent => {
  const IconComp = (Icons as Record<string, IconComponent>)[iconName];
  return IconComp || Icons.Folder;
};

export default function LoopsPage() {
  const [loopGroups, setLoopGroups] = useState<LoopGroupWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch loop groups from Supabase
  const loadLoopGroups = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: groups, error } = await supabase
        .from("loop_groups_with_counts")
        .select("*")
        .eq("user_id", user.id)
        .order("position");

      if (error) {
        console.error("Error fetching loop groups:", error);
        setLoading(false);
        return;
      }

      setLoopGroups(groups || []);
    } catch (error) {
      console.error("Error loading loop groups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoopGroups();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      {/* Main Container - Centered on Desktop */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[950px] mx-auto w-full px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between pt-6 pb-4 md:pt-8 md:pb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Loop Groups</h1>
            <Link href="/settings">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-700/80"
              >
                <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Button>
            </Link>
          </div>

          {/* Empty State or Icon Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-gray-500 dark:text-gray-400">Loading loop groups...</p>
            </div>
          ) : loopGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 md:py-20 px-4">
              <div className="rounded-3xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 mb-6 shadow-lg">
                <Icons.Grid3x3 className="h-16 w-16 md:h-20 md:w-20 text-purple-400 dark:text-purple-500" />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
                Create Your First Loop Group
              </h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">
                Organize your contacts into groups like Family, Work, Friends, and more. Each group gets a custom icon!
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Loop Group
              </Button>
            </div>
          ) : (
            <>
              {/* iPhone-style Icon Grid */}
              <div className="grid grid-cols-4 gap-6 md:gap-8 lg:gap-10 py-8 max-w-2xl mx-auto">
                {loopGroups.map((group) => {
                  const IconComponent = getIconComponent(group.icon_name);
                  return (
                    <Link
                      key={group.id}
                      href={`/loops/${group.id}`}
                      className="flex flex-col items-center group"
                    >
                      {/* Icon Button */}
                      <div
                        className="relative w-full aspect-square rounded-2xl md:rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 mb-2 md:mb-3 overflow-hidden group-hover:scale-105"
                        style={{
                          backgroundColor: group.color,
                        }}
                      >
                        {/* Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <IconComponent className="h-8 w-8 md:h-12 md:w-12 text-white drop-shadow-sm" />
                        </div>

                        {/* Badge for count */}
                        {group.person_count > 0 && (
                          <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 h-5 w-5 md:h-6 md:w-6 rounded-full bg-red-500 border-2 border-white dark:border-gray-900 flex items-center justify-center shadow-md">
                            <span className="text-[10px] md:text-xs font-bold text-white">
                              {group.person_count > 99 ? '99+' : group.person_count}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Label */}
                      <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white text-center leading-tight max-w-full truncate px-1">
                        {group.name}
                      </span>
                    </Link>
                  );
                })}

                {/* Add New Loop Group Button */}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="relative w-full aspect-square rounded-2xl md:rounded-3xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 active:scale-95 mb-2 md:mb-3 overflow-hidden group-hover:scale-105 shadow-md hover:shadow-lg">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Plus className="h-8 w-8 md:h-12 md:w-12 text-gray-400 dark:text-gray-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" />
                    </div>
                  </div>
                  <span className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 text-center leading-tight">
                    Add Group
                  </span>
                </button>
              </div>

              {/* Hint text */}
              <p className="text-center text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-8 mb-12">
                Tap an icon to view and manage contacts in that group
              </p>
            </>
          )}
        </div>
      </div>

      {/* Loop Group Modal */}
      <LoopGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          loadLoopGroups(); // Reload the list
        }}
      />
    </div>
  );
}
