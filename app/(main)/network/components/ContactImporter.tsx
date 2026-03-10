'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Check, Loader2, Phone, Mail, Smartphone, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { importVCard } from '@/app/actions/import-vcard';
import { toast } from 'sonner';

interface ParsedContact {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  selected: boolean;
}

export function ContactImporter({ onCloseAction }: { onCloseAction: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [contacts, setContacts] = useState<ParsedContact[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    
    try {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.csv')) {
        await parseCSV(file);
      } else if (fileName.endsWith('.vcf') || fileName.endsWith('.vcard')) {
        await parseVCF(file);
      } else {
        toast.error('Unsupported file format', { description: 'Please upload a .csv or .vcf file.' });
      }
    } catch (error) {
      console.error('File parsing error:', error);
      toast.error('Failed to parse file', { description: 'Please ensure it is a valid contacts file.' });
    } finally {
      setIsParsing(false);
    }
  };

  const parseCSV = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed: ParsedContact[] = [];
          results.data.forEach((row: any, index: number) => {
            // Attempt to find common headers for First Name, Last Name, Name, Email, Phone
            const fname = row['First Name'] || row['Given Name'] || '';
            const lname = row['Last Name'] || row['Family Name'] || '';
            const fullName = row['Name'] || `${fname} ${lname}`.trim();
            const phone = row['Phone 1 - Value'] || row['Phone'] || row['Mobile Phone'] || '';
            const email = row['E-mail 1 - Value'] || row['E-mail'] || row['Email'] || '';

            if (fullName) {
              parsed.push({
                id: `csv-${index}`,
                name: fullName,
                first_name: fname || undefined,
                last_name: lname || undefined,
                phone: phone || undefined,
                email: email || undefined,
                selected: true,
              });
            }
          });
          setContacts(parsed);
          setStep(3);
          resolve();
        },
        error: (error) => reject(error),
      });
    });
  };

  const parseVCF = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/);
    
    const parsed: ParsedContact[] = [];
    let currentContact: Partial<ParsedContact> = {};
    let isVcard = false;
    let contactId = 0;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Match unwrapping lines (vCard specific rule where long lines are folded)
        while(i + 1 < lines.length && (lines[i+1].startsWith(' ') || lines[i+1].startsWith('\t'))) {
            line += lines[i+1].substring(1);
            i++;
        }

      if (line.startsWith('BEGIN:VCARD')) {
        isVcard = true;
        currentContact = { selected: true, id: `vcf-${++contactId}` };
      } else if (line.startsWith('END:VCARD')) {
        if (isVcard && currentContact.name) {
          parsed.push(currentContact as ParsedContact);
        }
        isVcard = false;
      } else if (isVcard) {
        if (line.startsWith('FN:')) {
          currentContact.name = line.substring(3).trim();
        } else if (line.startsWith('N:')) {
            const parts = line.substring(2).split(';');
            if (parts.length >= 2) {
                currentContact.last_name = parts[0].trim() || undefined;
                currentContact.first_name = parts[1].trim() || undefined;
                if (!currentContact.name) {
                    currentContact.name = `${currentContact.first_name || ''} ${currentContact.last_name || ''}`.trim();
                }
            }
        } else if (line.startsWith('TEL')) {
            // Simplified TEL extraction
             const valMatch = line.match(/:(.*)$/);
             if (valMatch && !currentContact.phone) {
                 currentContact.phone = valMatch[1].trim();
             }
        } else if (line.startsWith('EMAIL')) {
            const valMatch = line.match(/:(.*)$/);
             if (valMatch && !currentContact.email) {
                 currentContact.email = valMatch[1].trim();
             }
        }
      }
    }
    setContacts(parsed);
    setStep(3);
  };

  const handleToggleSelect = (id: string) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  const handleToggleAll = () => {
    const allSelected = contacts.every(c => c.selected);
    setContacts(prev => prev.map(c => ({ ...c, selected: !allSelected })));
  };

  const handleSubmit = async () => {
    const selectedContacts = contacts.filter(c => c.selected);
    if (selectedContacts.length === 0) return;

    setIsSubmitting(true);
    try {
      // Map to expected format for importVCard action
      // Add '#imported' to notes automatically 
      const payload = selectedContacts.map(c => ({
        name: c.name,
        first_name: c.first_name,
        last_name: c.last_name,
        phone: c.phone,
        email: c.email,
        notes: '#imported'
      }));

      const result = await importVCard(payload);
      
      if (result.success) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#ec4899', '#f59e0b', '#10b981']
        });
        toast.success(`Planted ${result.created} new contacts!`, {
            description: result.updated ? `Also updated ${result.updated} existing contacts.` : ''
        });
        setTimeout(() => onCloseAction(), 2500);
      } else {
        toast.error('Import completed with errors', {
            description: result.error || `${result.failed} contacts failed.`
        });
      }
    } catch {
      toast.error('Failed to import contacts');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {[1, 2, 3].map((num) => (
        <div key={num} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${
            step >= num ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500'
          }`}>
            {num}
          </div>
          {num < 3 && (
            <div className={`w-10 h-0.5 mx-2 transition-colors duration-300 ${
              step > num ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-700'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-gray-50/90 dark:bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 p-6 md:p-8 overflow-hidden flex flex-col max-h-[90vh]">
        <button
          onClick={onCloseAction}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors bg-gray-50 dark:bg-slate-800 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6 mt-2"
        >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">iPhone Contact Porter</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">How to Plant Your Contacts</p>
        </motion.div>

        <StepIndicator />

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 min-h-[300px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-5 mb-6">
                 <ol className="space-y-4 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                        <p>Open the Contacts app on your iPhone.</p>
                    </li>
                    <li className="flex items-start">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                        <p>Tap <strong>Lists</strong> <span className="text-gray-500 text-sm">(top left)</span>, long-press <strong>All Contacts</strong>, and tap <strong>Export</strong>.</p>
                    </li>
                    <li className="flex items-start">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                        <p>Email the file to yourself or save to Files, then continue.</p>
                    </li>
                 </ol>
              </div>

               {/* Lead Architect Shortcut Notice */}
               <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-4 flex items-start">
                   <div className="shrink-0 mt-0.5 mr-3 p-1.5 bg-amber-100 dark:bg-amber-500/20 rounded-full text-amber-600 dark:text-amber-400">
                        <Smartphone className="w-4 h-4" />
                   </div>
                   <div className="text-sm text-amber-900 dark:text-amber-200">
                       <span className="font-semibold block mb-1">Shortcut for meeting new people:</span>
                       Create a personal &quot;ReMember Me&quot; contact card to share instantly when networking. Setup coming soon!
                   </div>
               </div>

              <div className="mt-8 flex justify-end">
                  <Button onClick={() => setStep(2)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 w-full sm:w-auto px-8 gap-2 group">
                      I have my exported file
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center justify-center h-full pt-4 space-y-6"
            >
              <div 
                className="w-full relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                  <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition-opacity"></div>
                  <div className="relative border-2 border-dashed border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-800/50 hover:bg-indigo-50/50 dark:hover:bg-slate-800 transition-colors">
                      <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-full mb-4 group-hover:scale-110 transition-transform">
                        {isParsing ? (
                             <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        ) : (
                             <Upload className="w-8 h-8 text-indigo-500" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Upload Contacts File</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Select your .vcf or .csv file</p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv,.vcf,.vcard"
                    className="hidden"
                  />
              </div>

               <p className="text-xs text-center text-gray-400 dark:text-gray-500 max-w-[80%] mx-auto">
                 🔒 Your contacts are processed locally. We only save the people you choose to &apos;Plant&apos;.
               </p>

            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full space-y-4"
            >
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Select Seeds to Plant</h3>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{contacts.filter(c => c.selected).length} selected</span>
                       <button onClick={handleToggleAll} className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                           {contacts.every(c => c.selected) ? 'Deselect All' : 'Select All'}
                       </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[40vh]">
                    {contacts.map((contact) => (
                        <div 
                            key={contact.id} 
                            onClick={() => handleToggleSelect(contact.id)}
                            className={`flex items-center p-3 rounded-xl border cursor-pointer transition-colors ${
                                contact.selected 
                                    ? 'bg-indigo-50/50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-700/50' 
                                    : 'bg-white border-gray-100 dark:bg-slate-800/50 dark:border-slate-700/50 hover:border-gray-300 dark:hover:border-slate-600'
                            }`}
                        >
                            <div className="mr-4 shrink-0">
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                                    contact.selected 
                                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                                        : 'border-gray-300 dark:border-gray-600'
                                }`}>
                                   {contact.selected && <Check className="w-3.5 h-3.5" />}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-semibold truncate ${contact.selected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {contact.name || 'Unknown'}
                                </h4>
                                {(contact.email || contact.phone) && (
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 truncate">
                                        {contact.phone && (
                                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {contact.phone}</span>
                                        )}
                                        {contact.email && (
                                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {contact.email}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                 <div className="pt-4 mt-auto border-t border-gray-100 dark:border-slate-800">
                    <Button 
                       onClick={handleSubmit} 
                       disabled={isSubmitting || contacts.filter(c => c.selected).length === 0} 
                       className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 gap-2 h-12"
                    >
                         {isSubmitting ? (
                             <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Planting...
                             </>
                         ) : (
                             <>
                                <Upload className="w-5 h-5" />
                                Plant {contacts.filter(c => c.selected).length} Contacts
                             </>
                         )}
                    </Button>
                 </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
