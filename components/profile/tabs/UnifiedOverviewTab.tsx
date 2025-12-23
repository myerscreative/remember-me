'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Quote, MapPin, Heart, Star, Sparkles, Edit2, Plus, Save, X, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface ContactWithStory {
    id: string;
    aiSummary?: string;
    story?: {
        whereWeMet?: string;
        whyStayInContact?: string;
        whatsImportant?: string;
    };
    interests?: string[];
    familyMembers?: Array<{ name: string; relationship: string }>;
    [key: string]: any;
}

interface UnifiedOverviewTabProps {
    contact: ContactWithStory;
}

export function UnifiedOverviewTab({ contact }: UnifiedOverviewTabProps) {
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [localStory, setLocalStory] = useState({
      whereWeMet: contact.story?.whereWeMet || "",
      whyStayInContact: contact.story?.whyStayInContact || "",
      whatsImportant: contact.story?.whatsImportant || ""
  });

  const handleEdit = (field: string, currentValue: string) => {
      setEditingCard(field);
      setEditValue(currentValue);
  };

  const handleCancel = () => {
      setEditingCard(null);
      setEditValue("");
  };

  const handleSave = async (field: string) => {
      setIsSaving(true);
      try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Not authenticated");

          const updateData: any = {};
          
          if (field === 'whereWeMet') updateData.where_met = editValue;
          if (field === 'whyStayInContact') updateData.why_stay_in_contact = editValue;
          if (field === 'whatsImportant') updateData.most_important_to_them = editValue;

          const { error } = await (supabase as any)
            .from('persons')
            .update(updateData)
            .eq('id', contact.id)
            .eq('user_id', user.id);

           if (error) throw error;

           setLocalStory(prev => ({ ...prev, [field]: editValue }));
           setEditingCard(null);
           toast.success("Updated successfully");
      } catch (error) {
          console.error("Error saving story:", error);
          toast.error("Failed to save changes");
      } finally {
          setIsSaving(false);
      }
  };

  const renderEditableCard = (
      title: string, 
      icon: React.ReactNode, 
      field: 'whereWeMet' | 'whyStayInContact' | 'whatsImportant', 
      value: string,
      placeholder: string,
      fullWidth = false
  ) => {
      const isEditing = editingCard === field;
      const isEmpty = !value || value.trim() === "";

      return (
        <Card className={`group relative ${fullWidth ? 'md:col-span-2 bg-amber-50/50 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-800/30' : ''}`}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className={`text-sm font-medium flex items-center gap-2 ${fullWidth ? 'text-amber-700 dark:text-amber-500' : 'text-muted-foreground'}`}>
              {icon} {title}
            </CardTitle>
            {!isEditing && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleEdit(field, value)}
                >
                    <Edit2 className="h-3 w-3" />
                </Button>
            )}
          </CardHeader>
          <CardContent>
            {isEditing ? (
                <div className="space-y-2">
                    <Textarea 
                        value={editValue} 
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder={placeholder}
                        className="min-h-[100px] text-sm"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving}>Cancel</Button>
                        <Button size="sm" onClick={() => handleSave(field)} disabled={isSaving}>
                            {isSaving ? <span className="animate-spin mr-1">⏳</span> : <Save className="h-3 w-3 mr-1" />}
                            Save
                        </Button>
                    </div>
                </div>
            ) : (
                <div 
                    className={`text-sm whitespace-pre-wrap ${isEmpty ? 'text-muted-foreground/60 italic cursor-pointer hover:text-primary transition-colors' : ''}`}
                    onClick={() => handleEdit(field, value)}
                >
                    {isEmpty ? (
                        <span className="flex items-center gap-1">
                            <Plus className="h-3 w-3" /> {placeholder}
                        </span>
                    ) : value}
                </div>
            )}
          </CardContent>
        </Card>
      );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      
      {/* 1. The "Hook" - AI Summary */}
      <div className="bg-muted/30 p-4 rounded-xl border border-border/50 italic text-lg text-muted-foreground text-center relative">
        <Quote className="w-4 h-4 inline-block mr-2 -mt-2 opacity-50 absolute top-4 left-4" />
        <p className="px-6">{contact.aiSummary || "No interaction summary generated yet."}</p>
      </div>

      {/* 2. The Story Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderEditableCard(
            "Where We Met", 
            <MapPin className="w-4 h-4 text-blue-500" />, 
            'whereWeMet', 
            localStory.whereWeMet, 
            "Add where you met..."
        )}
        
        {renderEditableCard(
            "Why Stay in Contact", 
            <Heart className="w-4 h-4 text-rose-500" />, 
            'whyStayInContact', 
            localStory.whyStayInContact, 
            "Add why you want to stay in touch..."
        )}
        
        {renderEditableCard(
            "What Matters to Them", 
            <Star className="w-4 h-4" />, 
            'whatsImportant', 
            localStory.whatsImportant, 
            "Add what is most important to them...",
            true
        )}
      </div>

      {/* 3. Consolidated Details (Family & Interests) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
          
          {/* Family Members */}
          <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" /> Family
              </h3>
              {contact.familyMembers && contact.familyMembers.length > 0 ? (
                  <div className="grid gap-2">
                       {contact.familyMembers.map((member, idx) => (
                           <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 text-sm">
                               <span className="font-medium">{member.name}</span>
                               <span className="text-muted-foreground text-xs bg-muted px-2 py-1 rounded-full">{member.relationship}</span>
                           </div>
                       ))}
                  </div>
              ) : (
                  <p className="text-sm text-muted-foreground italic">No family members listed.</p>
              )}
          </div>

          {/* Interests */}
          <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  <Sparkles className="h-4 w-4" /> Interests & Hobbies
              </h3>
              {contact.interests && contact.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                      {contact.interests.map((interest, idx) => (
                          <Badge key={idx} variant="secondary" className="px-3 py-1 text-sm font-normal">
                              {interest}
                          </Badge>
                      ))}
                  </div>
              ) : (
                  <p className="text-sm text-muted-foreground italic">No interests listed.</p>
              )}
          </div>

      </div>
    </div>
  );
}
