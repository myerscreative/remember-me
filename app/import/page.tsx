"use client";

import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ImportProgress } from "@/components/import-progress";
import {
  Upload,
  FileText,
  Users,
  ArrowLeft,
  Download,
  AlertCircle,
  CheckSquare,
  Square,
  Search,
  Image,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  parseVCF,
  parseCSV,
  deduplicateContacts,
  validateContact,
  batchContacts,
  type ImportedContact,
} from "@/lib/contacts/importUtils";
import { syncAvatarsFromVCF, previewAvatarSync, type AvatarSyncPreview } from "@/lib/contacts/avatarSyncUtils";

type ImportStage = 'idle' | 'parsing' | 'importing' | 'syncing' | 'preview' | 'complete' | 'error';
type ImportMode = 'full' | 'avatars';

export default function ImportContactsPage() {
  const [stage, setStage] = useState<ImportStage>('idle');
  const [importMode, setImportMode] = useState<ImportMode>('full');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedContacts, setParsedContacts] = useState<ImportedContact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [totalContacts, setTotalContacts] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [avatarsUpdated, setAvatarsUpdated] = useState(0);
  const [avatarsSkipped, setAvatarsSkipped] = useState(0);
  const [currentContact, setCurrentContact] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [dryRunPreview, setDryRunPreview] = useState<AvatarSyncPreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Filter contacts by search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return parsedContacts;
    const query = searchQuery.toLowerCase();
    return parsedContacts.filter((contact) => {
      const name = contact.name?.toLowerCase() || '';
      const email = contact.email?.toLowerCase() || '';
      const phone = contact.phone?.toLowerCase() || '';
      return name.includes(query) || email.includes(query) || phone.includes(query);
    });
  }, [parsedContacts, searchQuery]);

  // Toggle individual contact selection
  const toggleContact = (index: number) => {
    setSelectedContactIds(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Select all contacts (respecting current filter)
  const selectAll = () => {
    const indicesToSelect = filteredContacts.map((_, i) => 
      parsedContacts.indexOf(filteredContacts[i])
    );
    setSelectedContactIds(prev => {
      const next = new Set(prev);
      indicesToSelect.forEach(i => next.add(i));
      return next;
    });
  };

  // Deselect all contacts (respecting current filter)
  const deselectAll = () => {
    const indicesToDeselect = filteredContacts.map((_, i) => 
      parsedContacts.indexOf(filteredContacts[i])
    );
    setSelectedContactIds(prev => {
      const next = new Set(prev);
      indicesToDeselect.forEach(i => next.delete(i));
      return next;
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.vcf') && !fileName.endsWith('.csv')) {
      setErrorMessage('Please select a VCF or CSV file');
      setStage('error');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size must be less than 10MB');
      setStage('error');
      return;
    }

    setSelectedFile(file);
    setStage('idle');
    setErrorMessage('');
  };

  const handleParseFile = async () => {
    if (!selectedFile) return;

    setStage('parsing');
    setErrorMessage('');

    try {
      // Read file content
      const content = await selectedFile.text();

      // Parse based on file type
      let contacts: ImportedContact[];
      if (selectedFile.name.toLowerCase().endsWith('.vcf')) {
        contacts = parseVCF(content);
      } else {
        contacts = parseCSV(content);
      }

      // Deduplicate
      contacts = deduplicateContacts(contacts);

      // Validate
      contacts = contacts.filter(contact => {
        const validation = validateContact(contact);
        return validation.valid;
      });

      if (contacts.length === 0) {
        throw new Error('No valid contacts found in file');
      }

      setParsedContacts(contacts);
      // Select all contacts by default
      setSelectedContactIds(new Set(contacts.map((_, i) => i)));
      setTotalContacts(contacts.length);
      setStage('idle');

    } catch (error) {
      console.error('Error parsing file:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to parse file. Please check the file format.'
      );
      setStage('error');
    }
  };

  const handleStartImport = async () => {
    // Only import selected contacts
    const contactsToImport = parsedContacts.filter((_, i) => selectedContactIds.has(i));
    if (contactsToImport.length === 0) return;

    setStage('importing');
    setTotalContacts(contactsToImport.length);
    setImportedCount(0);
    setFailedCount(0);
    setErrorMessage('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Batch selected contacts for efficient insertion
      const batches = batchContacts(contactsToImport, 100);
      let totalImported = 0;
      let totalFailed = 0;

      for (const batch of batches) {
        // Prepare data for insertion
        const contactsToInsert = batch.map(contact => ({
          user_id: user.id,
          name: contact.name,
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          birthday: contact.birthday,
          notes: contact.notes,
          imported: true,
          has_context: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        // Update current contact display
        if (batch.length > 0) {
          setCurrentContact(batch[0].name);
        }

        // Insert batch
        const { data, error } = await (supabase as any)
          .from('persons')
          .insert(contactsToInsert)
          .select();

        if (error) {
          console.error('Batch insert error:', error);
          totalFailed += batch.length;
        } else {
          totalImported += data?.length || 0;
        }

        // Update progress
        setImportedCount(totalImported);
        setFailedCount(totalFailed);

        // Small delay to show progress (optional, can remove for production)
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setStage('complete');

    } catch (error) {
      console.error('Import error:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to import contacts'
      );
      setStage('error');
    }
  };

  // Handle avatar-only sync (Safe Re-import)
  const handleAvatarSync = async () => {
    if (parsedContacts.length === 0) return;

    setStage('syncing');
    setImportMode('avatars');
    setErrorMessage('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      setCurrentContact('Processing avatars...');

      const result = await syncAvatarsFromVCF(parsedContacts, user.id);

      setAvatarsUpdated(result.updated);
      setAvatarsSkipped(result.skipped);

      if (result.errors.length > 0) {
        setErrorMessage(result.errors.join(', '));
      }

      setStage('complete');

    } catch (error) {
      console.error('Avatar sync error:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to sync avatars'
      );
      setStage('error');
    }
  };

  // Handle Dry Run preview
  const handleDryRun = async () => {
    if (parsedContacts.length === 0) return;

    setStage('preview');
    setErrorMessage('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const preview = await previewAvatarSync(parsedContacts, user.id);
      setDryRunPreview(preview);

    } catch (error) {
      console.error('Dry run error:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to preview sync'
      );
      setStage('error');
    }
  };

  const handleReset = () => {
    setStage('idle');
    setImportMode('full');
    setSelectedFile(null);
    setParsedContacts([]);
    setSelectedContactIds(new Set());
    setSearchQuery('');
    setTotalContacts(0);
    setImportedCount(0);
    setFailedCount(0);
    setAvatarsUpdated(0);
    setAvatarsSkipped(0);
    setCurrentContact('');
    setErrorMessage('');
    setDryRunPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleViewContacts = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Import Contacts
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Import contacts from VCF or CSV files
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Instructions (shown before file selection) */}
          {stage === 'idle' && !selectedFile && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Upload Your Contacts
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Import contacts from your phone, email, or other sources
                  </p>
                </div>

                {/* Supported Formats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <p className="font-medium text-gray-900 dark:text-white text-sm">VCF Files</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Standard vCard format from iPhone, Android, Outlook
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <p className="font-medium text-gray-900 dark:text-white text-sm">CSV Files</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      From Google Contacts, Excel, or any spreadsheet
                    </p>
                  </div>
                </div>

                {/* File Input */}
                <div className="pt-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".vcf,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button
                      asChild
                      className="cursor-pointer bg-purple-600 hover:bg-purple-700"
                    >
                      <span>
                        <Upload className="mr-2 h-5 w-5" />
                        Choose File
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Maximum file size: 10MB
                  </p>
                </div>

                {/* How to Export Instructions */}
                <details className="pt-4 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
                    How do I export my contacts?
                  </summary>
                  <div className="mt-3 space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">iPhone:</p>
                      <p className="text-xs mt-1">
                        Settings → [Your Name] → iCloud → Contacts → Turn on. Then use iCloud.com → Contacts → Select All → Export vCard
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Android:</p>
                      <p className="text-xs mt-1">
                        Contacts app → Menu → Settings → Export → Export to .vcf file
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Google Contacts:</p>
                      <p className="text-xs mt-1">
                        contacts.google.com → Export → Google CSV or vCard format
                      </p>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          )}

          {/* File Selected - Preview */}
          {stage === 'idle' && selectedFile && parsedContacts.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={handleReset}>
                    Change File
                  </Button>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleParseFile}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Parse File
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Parsed - Select Contacts to Import */}
          {stage === 'idle' && parsedContacts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Select contacts to import
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedContactIds.size} of {parsedContacts.length} selected • From: {selectedFile?.name}
                    </p>
                  </div>
                </div>

                {/* Search and Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search contacts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAll}
                      className="whitespace-nowrap"
                    >
                      <CheckSquare className="h-4 w-4 mr-1" />
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deselectAll}
                      className="whitespace-nowrap"
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Deselect All
                    </Button>
                  </div>
                </div>

                {/* Contact List */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                  <div className="max-h-80 overflow-y-auto">
                    {filteredContacts.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                        No contacts match your search
                      </div>
                    ) : (
                      filteredContacts.map((contact) => {
                        const originalIndex = parsedContacts.indexOf(contact);
                        const isSelected = selectedContactIds.has(originalIndex);
                        return (
                          <label
                            key={originalIndex}
                            className={`flex items-center gap-3 p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                              isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleContact(originalIndex)}
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {contact.name}
                              </p>
                              {(contact.email || contact.phone) && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {contact.email || contact.phone}
                                </p>
                              )}
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Info Notice */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      <strong>Full Import:</strong> Creates new contacts. <strong>Sync Avatars:</strong> Updates only photos for existing contacts (preserves Story, Interests, Tags).
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleReset} className="flex-1">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleStartImport}
                      disabled={selectedContactIds.size === 0}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Import {selectedContactIds.size} Contact{selectedContactIds.size !== 1 ? 's' : ''}
                    </Button>
                  </div>
                  
                  {/* Avatar Sync Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleDryRun}
                      variant="outline"
                      className="flex-1 border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Preview Dry Run
                    </Button>
                    <Button
                      onClick={handleAvatarSync}
                      variant="outline"
                      className="flex-1 border-green-500 text-green-600 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Avatars
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dry Run Preview Panel */}
          {stage === 'preview' && dryRunPreview && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                🔍 Dry Run Preview
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Found {dryRunPreview.totalWithPhotos} contacts with photos. Here&apos;s what will happen:
              </p>

              <div className="space-y-4">
                {/* Will Update */}
                {dryRunPreview.willUpdate.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                      ✅ Will Update ({dryRunPreview.willUpdate.length})
                    </h4>
                    <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 max-h-32 overflow-y-auto">
                      {dryRunPreview.willUpdate.map((c, i) => (
                        <li key={i}>{c.name} {c.email && `(${c.email})`}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Will Skip */}
                {dryRunPreview.willSkip.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      ⏭️ Will Skip ({dryRunPreview.willSkip.length})
                    </h4>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 max-h-32 overflow-y-auto">
                      {dryRunPreview.willSkip.map((c, i) => (
                        <li key={i}>{c.name}: {c.reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* No Match */}
                {dryRunPreview.noMatch.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ❓ No Match ({dryRunPreview.noMatch.length})
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 max-h-32 overflow-y-auto">
                      {dryRunPreview.noMatch.map((c, i) => (
                        <li key={i}>{c.name} {c.email && `(${c.email})`}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleAvatarSync}
                  disabled={dryRunPreview.willUpdate.length === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Confirm Sync ({dryRunPreview.willUpdate.length})
                </Button>
              </div>
            </div>
          )}

          {/* Progress */}
          {(stage === 'parsing' || stage === 'importing' || stage === 'complete' || stage === 'error') && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <ImportProgress
                stage={stage}
                total={totalContacts}
                imported={importedCount}
                failed={failedCount}
                currentContact={currentContact}
                errorMessage={errorMessage}
              />

              {/* Actions after completion */}
              {stage === 'complete' && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                  {/* Avatar sync success message */}
                  {importMode === 'avatars' && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Image className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200">
                            Success! Updated avatars for {avatarsUpdated} contact{avatarsUpdated !== 1 ? 's' : ''}.
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            All existing Story notes, Interests, and Tags were preserved.
                          </p>
                          {avatarsSkipped > 0 && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              {avatarsSkipped} contact{avatarsSkipped !== 1 ? 's' : ''} skipped (no match or already has photo)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleReset} className="flex-1">
                      Import More
                    </Button>
                    <Button
                      onClick={handleViewContacts}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      <Users className="mr-2 h-5 w-5" />
                      View Contacts
                    </Button>
                  </div>
                </div>
              )}

              {/* Actions after error */}
              {stage === 'error' && (
                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button onClick={handleReset} className="flex-1">
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
