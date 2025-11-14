"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImportProgress } from "@/components/import-progress";
import {
  Upload,
  FileText,
  Users,
  ArrowLeft,
  Download,
  AlertCircle,
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

type ImportStage = 'idle' | 'parsing' | 'importing' | 'complete' | 'error';

export default function ImportContactsPage() {
  const [stage, setStage] = useState<ImportStage>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedContacts, setParsedContacts] = useState<ImportedContact[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [currentContact, setCurrentContact] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
    if (parsedContacts.length === 0) return;

    setStage('importing');
    setImportedCount(0);
    setFailedCount(0);
    setErrorMessage('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Batch contacts for efficient insertion
      const batches = batchContacts(parsedContacts, 100);
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

  const handleReset = () => {
    setStage('idle');
    setSelectedFile(null);
    setParsedContacts([]);
    setTotalContacts(0);
    setImportedCount(0);
    setFailedCount(0);
    setCurrentContact('');
    setErrorMessage('');
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

          {/* Parsed - Ready to Import */}
          {stage === 'idle' && parsedContacts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Ready to import {parsedContacts.length} contact{parsedContacts.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      From: {selectedFile?.name}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-100">
                      <p className="font-medium">What happens next:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-blue-800 dark:text-blue-200 text-xs">
                        <li>All contacts will be marked as "imported"</li>
                        <li>You can add context to them later using voice memos</li>
                        <li>Duplicates have been removed automatically</li>
                        <li>Invalid contacts were filtered out</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleReset} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleStartImport}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Start Import
                  </Button>
                </div>
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
                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
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
