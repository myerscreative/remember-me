"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, ChevronRight, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { LoopGroup, Person } from "@/types/database.types";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { LoopGroupModal } from "@/components/loop-group-modal";
import { ContactPickerModal } from "@/components/contact-picker-modal";
import { CUSTOM_SVG_ICONS } from "@/components/custom-loop-icons";
import { isStaticIcon, getStaticIconPath } from "@/components/static-loop-icons";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Type for icon component
type IconComponent = React.ComponentType<{ className?: string }>;

// Helper function to get icon component by name
const getIconComponent = (iconName: string): IconComponent | null => {
  // First check if it's a custom SVG icon
  if (iconName in CUSTOM_SVG_ICONS) {
    return CUSTOM_SVG_ICONS[iconName];
  }
  
  // Check if it's a static icon (return null to handle as image)
  if (isStaticIcon(iconName)) {
    return null;
  }
  
  // Otherwise use Lucide icon
  const IconComp = (Icons as Record<string, IconComponent>)[iconName];
  return IconComp || Icons.Folder;
};

// Helper function to get initials from name
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Helper function to get gradient color based on name hash
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
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

// Sortable Contact Item Component
function SortableContact({ contact }: { contact: Person }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contact.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Link
        href={`/contacts/${contact.id}`}
        className="group flex items-start gap-3 md:gap-4 p-4 md:p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        {/* Avatar with gradient */}
        <Avatar className="h-12 w-12 md:h-14 md:w-14 shrink-0">
          <AvatarImage src={contact.photo_url || ""} />
          <AvatarFallback
            className={cn(
              "bg-gradient-to-br text-white font-semibold text-sm md:text-base",
              getGradient(contact.name)
            )}
          >
            {getInitials(contact.name)}
          </AvatarFallback>
        </Avatar>

        {/* Contact Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white text-base md:text-lg leading-tight mb-1">
            {contact.name}
          </h3>
          {contact.phone && (
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 leading-tight">
              {contact.phone}
            </p>
          )}
          {contact.email && (
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 leading-tight">
              {contact.email}
            </p>
          )}
        </div>

        {/* Chevron */}
        <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 shrink-0 mt-1 transition-all duration-200 group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

export default function LoopGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const loopGroupId = params.id as string;

  const [loopGroup, setLoopGroup] = useState<LoopGroup | null>(null);
  const [contacts, setContacts] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const loadData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch loop group
      const { data: group, error: groupError } = await supabase
        .from("loop_groups")
        .select("*")
        .eq("id", loopGroupId)
        .eq("user_id", user.id)
        .single();

      if (groupError || !group) {
        console.error("Error fetching loop group:", groupError);
        router.push("/loops");
        return;
      }

      setLoopGroup(group);

      // Fetch contacts in this loop group
      const { data: personLoopGroups, error: plgError } = await supabase
        .from("person_loop_groups")
        .select("person_id, position")
        .eq("loop_group_id", loopGroupId)
        .order("position");

      if (plgError) {
        console.error("Error fetching person loop groups:", plgError);
        setLoading(false);
        return;
      }

      if (!personLoopGroups || personLoopGroups.length === 0) {
        setContacts([]);
        setLoading(false);
        return;
      }

      // Fetch person details
      const personIds = personLoopGroups.map(plg => plg.person_id);
      const { data: persons, error: personsError } = await supabase
        .from("persons")
        .select("*")
        .in("id", personIds)
        .eq("user_id", user.id);

      if (personsError) {
        console.error("Error fetching persons:", personsError);
        setLoading(false);
        return;
      }

      // Sort persons by their position in the loop group
      const positionMap = new Map(personLoopGroups.map(plg => [plg.person_id, plg.position]));
      const sortedPersons = (persons || []).sort((a, b) => {
        const posA = positionMap.get(a.id) || 0;
        const posB = positionMap.get(b.id) || 0;
        return posA - posB;
      });

      setContacts(sortedPersons);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loopGroupId, router]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = contacts.findIndex((contact) => contact.id === active.id);
    const newIndex = contacts.findIndex((contact) => contact.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update UI
    const newContacts = arrayMove(contacts, oldIndex, newIndex);
    setContacts(newContacts);

    // Update positions in database
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Update all positions
      const updates = newContacts.map((contact, index) => ({
        person_id: contact.id,
        loop_group_id: loopGroupId,
        position: index,
      }));

      const { error } = await supabase
        .from("person_loop_groups")
        .upsert(updates, { onConflict: "person_id,loop_group_id" });

      if (error) {
        console.error("Error updating positions:", error);
        // Revert on error
        loadData();
      }
    } catch (error) {
      console.error("Error updating positions:", error);
      // Revert on error
      loadData();
    }
  };

  if (!loopGroup) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  const IconComponent = getIconComponent(loopGroup.icon_name);
  const hasCustomIcon = !!loopGroup.custom_icon_url;
  const staticIconPath = getStaticIconPath(loopGroup.icon_name);
  const isStatic = staticIconPath !== undefined;

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 overflow-hidden">
      {/* Main Container - Centered on Desktop */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[950px] mx-auto w-full px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between pt-6 pb-4 md:pt-8 md:pb-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/loops")}
                className="h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </Button>
              {/* Icon */}
              <div
                className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl shadow-md flex items-center justify-center overflow-hidden p-1.5"
                style={{ backgroundColor: loopGroup.color }}
              >
                {hasCustomIcon ? (
                  // Custom uploaded icon
                  <img
                    src={loopGroup.custom_icon_url}
                    alt={loopGroup.name}
                    className="h-full w-full object-contain"
                  />
                ) : isStatic ? (
                  // Static preset icon (PNG/JPG)
                  <img
                    src={staticIconPath}
                    alt={loopGroup.name}
                    className="h-full w-full object-contain"
                  />
                ) : IconComponent ? (
                  // SVG component icon (custom or Lucide)
                  <IconComponent className="h-6 w-6 md:h-7 md:w-7 text-white" />
                ) : (
                  // Fallback icon
                  <Icons.Folder className="h-6 w-6 md:h-7 md:w-7 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {loopGroup.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditModalOpen(true)}
              className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Edit className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </Button>
          </div>

          {/* Contact List */}
          <div className="pb-6 md:pb-8 lg:pb-12 pt-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-gray-500 dark:text-gray-400">Loading contacts...</p>
              </div>
            ) : contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 md:py-20 px-4">
                <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4">
                  <Users className="h-8 w-8 md:h-10 md:w-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No contacts in this group
                </h3>
                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                  Add contacts to organize them in this loop group.
                </p>
                <Button
                  onClick={() => setIsContactPickerOpen(true)}
                  className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contacts
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={contacts.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4 md:space-y-5">
                    {contacts.map((contact) => (
                      <SortableContact key={contact.id} contact={contact} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button - Add Contacts */}
      <div className="group relative">
        <Button
          size="icon"
          onClick={() => setIsContactPickerOpen(true)}
          className="fixed bottom-20 md:bottom-8 right-4 md:right-8 lg:right-auto lg:left-1/2 lg:translate-x-[calc(2rem+50%)] h-14 w-14 md:h-16 md:w-16 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] z-40 transition-all duration-200 hover:scale-105"
          style={{ backgroundColor: loopGroup.color }}
        >
          <Plus className="h-6 w-6 md:h-7 md:w-7 text-white" />
        </Button>
        {/* Tooltip */}
        <span className="fixed bottom-32 md:bottom-20 right-4 md:right-8 lg:right-auto lg:left-1/2 lg:translate-x-[calc(2rem+50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
          Add Contacts
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></span>
        </span>
      </div>

      {/* Edit Loop Group Modal */}
      <LoopGroupModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          loadData(); // Reload data to reflect changes
        }}
        loopGroup={loopGroup}
      />

      {/* Contact Picker Modal */}
      <ContactPickerModal
        isOpen={isContactPickerOpen}
        onClose={() => setIsContactPickerOpen(false)}
        loopGroupId={loopGroupId}
        loopGroupName={loopGroup?.name || ""}
        onSuccess={() => {
          setIsContactPickerOpen(false);
          loadData(); // Reload data to show new contacts
        }}
      />
    </div>
  );
}
