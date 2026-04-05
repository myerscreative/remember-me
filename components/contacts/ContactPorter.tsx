'use client';

import { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Sprout, Search, CheckSquare, Square, Users, Check, X } from 'lucide-react';
import { parseVCF, deduplicateContacts, validateContact, type ImportedContact } from '@/lib/contacts/importUtils';
import { plantContacts } from '@/app/actions/plant-contacts';
import { toast } from 'sonner';

type PorterStage = 'upload' | 'selection' | 'planting';

export default function ContactPorter() {
  const [stage, setStage] = useState<PorterStage>('upload');
  const [parsedContacts, setParsedContacts] = useState<ImportedContact[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Handle file selection and parsing
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.vcf') && !fileName.endsWith('.vcf.zip')) {
        setErrorMessage('Please select a .vcf or .vcf.zip file.');
        return;
    }

    setErrorMessage('');
    
    try {
      const content = await file.text();
      let contacts = parseVCF(content);
      
      // Deduplicate and filter out invalid
      contacts = deduplicateContacts(contacts);
      contacts = contacts.filter(contact => validateContact(contact).valid);

      if (contacts.length === 0) {
        setErrorMessage('No valid contacts found in file.');
        return;
      }

      setParsedContacts(contacts);
      // Select all by default
      setSelectedIndices(new Set(contacts.map((_, i) => i)));
      setStage('selection');

    } catch (err: any) {
      console.error('Failed to parse VCF:', err);
      setErrorMessage(err.message || 'Failed to parse file.');
    }
  };

  // Filter contacts by search
  const filteredIndices = useMemo(() => {
    if (!searchQuery.trim()) return parsedContacts.map((_, i) => i);
    const query = searchQuery.toLowerCase();
    return parsedContacts
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => {
        const name = c.name?.toLowerCase() || '';
        const email = c.email?.toLowerCase() || '';
        const phone = c.phone?.toLowerCase() || '';
        return name.includes(query) || email.includes(query) || phone.includes(query);
      })
      .map(({ i }) => i);
  }, [parsedContacts, searchQuery]);

  const allFilteredSelected = filteredIndices.length > 0 && filteredIndices.every(i => selectedIndices.has(i));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      // deselect all filtered
      const next = new Set(selectedIndices);
      filteredIndices.forEach(i => next.delete(i));
      setSelectedIndices(next);
    } else {
      // select all filtered
      const next = new Set(selectedIndices);
      filteredIndices.forEach(i => next.add(i));
      setSelectedIndices(next);
    }
  };

  const toggleContact = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIndices(next);
  };

  const selectedCount = selectedIndices.size;

  const handlePlant = async () => {
    if (selectedCount === 0) return;

    setStage('planting');
    const contactsToPlant = parsedContacts.filter((_, i) => selectedIndices.has(i));

    try {
      const result = await plantContacts(contactsToPlant);
      
      if (result.success) {
        toast.success(`Successfully planted ${result.created} new seeds!`, {
          description: result.updated ? `Additionally updated ${result.updated} existing seeds.` : undefined,
          icon: <Sprout className="w-5 h-5 text-green-500" />
        });
        
        if (result.errors && result.errors.length > 0) {
            toast.warning(`Some seeds could not be planted: ${result.errors.length} failed.`, {
                description: result.errors[0]
            });
        }
        
        router.push('/garden');
      } else {
        toast.error('Failed to plant seeds', {
            description: result.error
        });
        setStage('selection');
      }
    } catch (err: any) {
      console.error('Failed to call plantContacts:', err);
      toast.error('An unexpected error occurred.');
      setStage('selection');
    }
  };

  if (stage === 'upload') {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border-strong rounded-xl bg-surface">
        <div className="bg-primary/10 p-4 rounded-full mb-6">
          <Upload className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-center text-text-primary">Contact Porter</h2>
        <p className="text-text-tertiary text-center mb-8 max-w-md">
          Upload your iPhone contacts (.vcf) to begin planting new seeds in your garden. We will automatically tag them as "Imported".
        </p>

        <input
          type="file"
          accept=".vcf,.vcf.zip"
          onChange={handleFileSelect}
          className="hidden"
          ref={fileInputRef}
        />

        <Button 
          size="lg" 
          onClick={() => fileInputRef.current?.click()}
          className="w-full sm:w-auto"
        >
          Select Contacts File
        </Button>

        {errorMessage && (
          <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
            {errorMessage}
          </div>
        )}
      </div>
    );
  }

  // selection or planting stage
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col h-[calc(100vh-120px)] relative">
      <div className="flex-none p-4 pb-2 border-b border-border-default bg-surface sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
           <div>
               <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                 <Users className="w-5 h-5 text-primary" />
                 Ready to Plant
               </h2>
               <p className="text-sm text-text-tertiary mt-1">
                   {selectedCount} of {parsedContacts.length} selected
               </p>
           </div>
           <Button variant="outline" size="sm" onClick={() => {
               setParsedContacts([]);
               setSelectedIndices(new Set());
               setStage('upload');
           }}>
             Cancel
           </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <Input 
              autoFocus
              placeholder="Search by name, email, or phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-surface border-border-default"
            />
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleSelectAll}
            className="flex items-center gap-2 whitespace-nowrap text-text-secondary"
          >
            {allFilteredSelected ? (
              <><CheckSquare className="w-4 h-4" /> Deselect All</>
            ) : (
              <><Square className="w-4 h-4" /> Select All</>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-32">
        {filteredIndices.length === 0 ? (
          <div className="text-center py-12 text-text-tertiary">
            No contacts match your search.
          </div>
        ) : (
          filteredIndices.map((originalIndex) => {
            const contact = parsedContacts[originalIndex];
            const isSelected = selectedIndices.has(originalIndex);
            
            return (
              <div 
                key={originalIndex}
                onClick={() => toggleContact(originalIndex)}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border-default bg-surface hover:border-primary/30'
                }`}
              >
                <div className={`flex-none flex items-center justify-center w-6 h-6 rounded border ${
                    isSelected ? 'bg-primary border-primary text-white' : 'border-border-strong bg-transparent'
                }`}>
                    {isSelected && <Check className="w-4 h-4" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-text-primary truncate">
                    {contact.name || 'Unnamed Contact'}
                  </h4>
                  <div className="flex items-center gap-3 text-sm text-text-tertiary mt-0.5 truncate">
                    {contact.email && <span className="truncate">{contact.email}</span>}
                    {contact.email && contact.phone && <span>•</span>}
                    {contact.phone && <span>{contact.phone}</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-canvas via-canvas to-transparent z-20 pointer-events-none">
          <div className="max-w-xl mx-auto pointer-events-auto shadow-2xl rounded-full overflow-hidden">
            <Button 
                onClick={handlePlant}
                disabled={selectedCount === 0 || stage === 'planting'}
                className="w-full h-14 text-lg font-semibold rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2 shadow-xl"
            >
                <Sprout className={`w-6 h-6 ${stage === 'planting' ? 'animate-bounce' : ''}`} />
                {stage === 'planting' ? 'Planting Seeds...' : `Plant ${selectedCount} Seeds`}
            </Button>
          </div>
      </div>
      
    </div>
  );
}
