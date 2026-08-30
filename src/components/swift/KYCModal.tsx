'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, FileText, Upload, CheckCircle, XCircle, Clock, X, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigation, useAppStore } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

interface KYCDocument {
  id: string;
  type: string;
  typeLabel: string;
  number: string;
  status: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  submittedAt: string;
}

const DOCUMENT_TYPES = [
  { value: 'national_id', label: 'National ID Card' },
  { value: 'voters_card', label: "Voter's Card" },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'international_passport', label: 'International Passport' },
  { value: 'nin', label: 'NIN' },
];

function maskDocumentNumber(num: string): string {
  if (num.length <= 4) return '****';
  return '****' + num.slice(-4);
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function KYCModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const userEmail = useAppStore(s => s.userEmail);
  const userRole = useAppStore(s => s.userRole);
  const { toast } = useToast();
  const isOpen = activeModal === 'kyc';

  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'submit'>('status');
  const [documentType, setDocumentType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentImage, setDocumentImage] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', userId: userEmail }),
      });
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
        setIsVerified(data.documents.some((d: KYCDocument) => d.status === 'verified'));
      }
    } catch {
      // Silently handle — use empty state
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen, fetchStatus]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum file size is 5MB' });
      return;
    }
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setDocumentImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!documentType) {
      toast({ title: 'Select document type', description: 'Please choose a document type' });
      return;
    }
    if (!documentNumber.trim()) {
      toast({ title: 'Enter document number', description: 'Please enter your document number' });
      return;
    }
    if (!documentImage) {
      toast({ title: 'Upload document image', description: 'Please upload a clear image of your document' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          userId: userEmail,
          documentType,
          documentNumber,
          documentImage,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast({ title: 'Document Submitted!', description: 'Your document is being reviewed. We\'ll notify you once verified.' });
        setDocumentType('');
        setDocumentNumber('');
        setDocumentImage('');
        setImageFileName('');
        setActiveTab('status');
        fetchStatus();
      } else {
        toast({ title: 'Submission Failed', description: data.error || 'Something went wrong. Please try again.' });
      }
    } catch {
      toast({ title: 'Network Error', description: 'Could not submit document. Please check your connection.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setActiveModal(null);
    setDocumentType('');
    setDocumentNumber('');
    setDocumentImage('');
    setImageFileName('');
    setActiveTab('status');
  };

  const getVerificationBanner = () => {
    if (isVerified) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 sm:gap-4 p-5 rounded-2xl bg-[var(--sr-customer)]/5 border border-[var(--sr-customer)]/20"
        >
          <div className="w-12 h-12 rounded-full bg-[var(--sr-customer)]/20 flex items-center justify-center border border-[var(--sr-customer)]/30 shrink-0">
            <CheckCircle className="w-6 h-6 text-[var(--sr-customer)]" />
          </div>
          <div>
            <h3 className="text-[var(--sr-customer)] font-bold text-sm">Identity Verified</h3>
            <p className="text-white/65 text-xs mt-0.5">Your identity has been successfully verified</p>
          </div>
        </motion.div>
      );
    }

    if (documents.length > 0 && documents.some(d => d.status === 'pending')) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 sm:gap-4 p-5 rounded-2xl bg-[var(--sr-vendor)]/5 border border-[var(--sr-vendor)]/20"
        >
          <div className="w-12 h-12 rounded-full bg-[var(--sr-vendor)]/20 flex items-center justify-center border border-[var(--sr-vendor)]/30 shrink-0">
            <Clock className="w-6 h-6 text-[var(--sr-vendor)]" />
          </div>
          <div>
            <h3 className="text-[var(--sr-vendor)] font-bold text-sm">Verification In Progress</h3>
            <p className="text-white/65 text-xs mt-0.5">Your documents are being reviewed. This usually takes 24-48 hours.</p>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 sm:gap-4 p-5 rounded-2xl bg-white/5 border border-white/10"
      >
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/10 shrink-0">
          <Shield className="w-6 h-6 text-white/65" />
        </div>
        <div>
          <h3 className="text-white/60 font-bold text-sm">No Documents Submitted</h3>
          <p className="text-white/60 text-xs mt-0.5">Submit a valid ID to verify your identity and unlock full features</p>
        </div>
      </motion.div>
    );
  };

  const getStatusBadge = (status: string, rejectionReason?: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[var(--sr-customer)]/10 text-[var(--sr-customer)] border border-[var(--sr-customer)]/20">
            <CheckCircle className="w-3 h-3" />
            Verified
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[var(--sr-vendor)]/10 text-[var(--sr-vendor)] border border-[var(--sr-vendor)]/20">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[90]"
            onClick={handleClose}
          />

          {/* Content */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-[#05070A] overflow-y-auto custom-scrollbar"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 glass-effect border-b border-white/5">
              <div className="flex items-center justify-between p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--sr-customer)]/20 flex items-center justify-center border border-[var(--sr-customer)]/30">
                    <Shield className="w-5 h-5 text-[var(--sr-customer)]" />
                  </div>
                  <div>
                    <h2 className="text-white text-lg font-bold">KYC Verification</h2>
                    <p className="text-white/60 text-[10px] uppercase tracking-widest">
                      {userRole === 'vendor' ? 'Vendor' : 'Rider'} Identity Check
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>

            <div className="px-4 pb-32">
              {/* Tab Switcher */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mt-4 flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5"
              >
                <button
                  onClick={() => setActiveTab('status')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'status'
                      ? 'bg-[var(--sr-customer)]/10 text-[var(--sr-customer)] border border-[var(--sr-customer)]/20'
                      : 'text-white/65 hover:text-white/60'
                  }`}
                >
                  Status
                </button>
                <button
                  onClick={() => setActiveTab('submit')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'submit'
                      ? 'bg-[var(--sr-customer)]/10 text-[var(--sr-customer)] border border-[var(--sr-customer)]/20'
                      : 'text-white/65 hover:text-white/60'
                  }`}
                >
                  Submit Document
                </button>
              </motion.div>

              {/* Status Tab */}
              {activeTab === 'status' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {/* Verification Banner */}
                  <div className="mt-4">
                    {loading ? (
                      <div className="flex items-center justify-center p-8 rounded-2xl bg-white/5 border border-white/5">
                        <Loader2 className="w-6 h-6 text-[var(--sr-customer)] animate-spin" />
                        <span className="text-white/65 text-sm ml-3">Loading verification status...</span>
                      </div>
                    ) : (
                      getVerificationBanner()
                    )}
                  </div>

                  {/* Document List */}
                  <div className="mt-6">
                    <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[var(--sr-customer)]" />
                      Submitted Documents
                    </h4>

                    {loading ? (
                      <div className="space-y-3">
                        {[1, 2].map(i => (
                          <div key={i} className="animate-pulse h-20 rounded-2xl bg-white/5 border border-white/5" />
                        ))}
                      </div>
                    ) : documents.length === 0 ? (
                      <div className="text-center py-10 rounded-2xl bg-white/[0.02] border border-white/5">
                        <FileText className="w-10 h-10 text-white/10 mx-auto mb-3" />
                        <p className="text-white/60 text-sm">No documents submitted yet</p>
                        <button
                          onClick={() => setActiveTab('submit')}
                          className="mt-3 text-[var(--sr-customer)] text-xs font-bold hover:underline"
                        >
                          Submit your first document →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                        {documents.map((doc, i) => (
                          <motion.div
                            key={doc.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + i * 0.05 }}
                            className="p-4 rounded-2xl bg-[#1A1D26]/40 border border-white/5"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                                  doc.status === 'verified'
                                    ? 'bg-[var(--sr-customer)]/10 border-[var(--sr-customer)]/20'
                                    : doc.status === 'pending'
                                    ? 'bg-[var(--sr-vendor)]/10 border-[var(--sr-vendor)]/20'
                                    : 'bg-red-500/10 border-red-500/20'
                                }`}>
                                  <FileText className={`w-5 h-5 ${
                                    doc.status === 'verified'
                                      ? 'text-[var(--sr-customer)]'
                                      : doc.status === 'pending'
                                      ? 'text-[var(--sr-vendor)]'
                                      : 'text-red-400'
                                  }`} />
                                </div>
                                <div>
                                  <p className="text-white font-bold text-sm">{doc.typeLabel}</p>
                                  <p className="text-white/60 text-xs mt-0.5">{maskDocumentNumber(doc.number)}</p>
                                </div>
                              </div>
                              {getStatusBadge(doc.status, doc.rejectionReason)}
                            </div>

                            {doc.status === 'rejected' && doc.rejectionReason && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-3 pt-3 border-t border-white/5 flex items-start gap-2"
                              >
                                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-red-400 text-xs font-bold">Rejection Reason</p>
                                  <p className="text-white/65 text-xs mt-0.5">{doc.rejectionReason}</p>
                                </div>
                              </motion.div>
                            )}

                            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                              <span className="text-white/20 text-[10px] uppercase tracking-widest">Submitted</span>
                              <span className="text-white/60 text-xs">{formatDate(doc.submittedAt)}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Submit Tab */}
              {activeTab === 'submit' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {/* Info Banner */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mt-4 flex items-start gap-3 p-3 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/5"
                  >
                    <AlertCircle className="w-5 h-5 text-[var(--sr-vendor)] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white/60 text-xs font-bold">Requirements</p>
                      <p className="text-white/60 text-xs mt-1 leading-relaxed">
                        Upload a clear photo of a valid government-issued ID. Make sure all details are visible and the image is not blurry.
                      </p>
                    </div>
                  </motion.div>

                  {/* Document Type Select */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-5"
                  >
                    <label htmlFor="kyc-document-type" className="text-white/65 text-xs font-bold uppercase tracking-widest block mb-2">
                      Document Type
                    </label>
                    <div className="relative">
                      <select
                        id="kyc-document-type"
                        value={documentType}
                        onChange={e => setDocumentType(e.target.value)}
                        className="w-full bg-[#0F1117] text-white text-sm rounded-xl border border-white/5 focus:border-[var(--sr-customer)]/30 transition-all px-4 py-3.5 appearance-none focus:outline-none"
                      >
                        <option value="" disabled className="bg-[#0F1117]">
                          Select document type
                        </option>
                        {DOCUMENT_TYPES.map(dt => (
                          <option key={dt.value} value={dt.value} className="bg-[#0F1117]">
                            {dt.label}
                          </option>
                        ))}
                      </select>
                      <FileText className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                    </div>
                  </motion.div>

                  {/* Document Number Input */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="mt-4"
                  >
                    <label htmlFor="kyc-document-number" className="text-white/65 text-xs font-bold uppercase tracking-widest block mb-2">
                      Document Number
                    </label>
                    <input
                      id="kyc-document-number"
                      type="text"
                      value={documentNumber}
                      onChange={e => setDocumentNumber(e.target.value)}
                      placeholder="Enter your document number"
                      className="w-full bg-[#0F1117] text-white text-sm rounded-xl border border-white/5 focus:border-[var(--sr-customer)]/30 transition-all px-4 py-3.5 focus:outline-none placeholder:text-white/20"
                    />
                  </motion.div>

                  {/* Image Upload */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-4"
                  >
                    <label htmlFor="kyc-document-upload" className="text-white/65 text-xs font-bold uppercase tracking-widest block mb-2">
                      Document Image
                    </label>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="kyc-document-upload"
                    />

                    {documentImage ? (
                      <div className="relative p-3 sm:p-4 rounded-2xl bg-[#1A1D26] border border-[var(--sr-customer)]/20">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--sr-customer)]/10 flex items-center justify-center border border-[var(--sr-customer)]/20 shrink-0">
                            <CheckCircle className="w-5 h-5 text-[var(--sr-customer)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-sm truncate">{imageFileName}</p>
                            <p className="text-[var(--sr-customer)] text-xs mt-0.5">File selected</p>
                          </div>
                          <button
                            onClick={() => {
                              setDocumentImage('');
                              setImageFileName('');
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 transition-colors shrink-0"
                          >
                            <X className="w-4 h-4 text-white/65" />
                          </button>
                        </div>
                        {/* Preview */}
                        <div className="mt-3 rounded-xl overflow-hidden border border-white/5">
                          <img
                            src={documentImage}
                            alt="Document preview"
                            className="w-full h-40 object-cover"
                          />
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="kyc-document-upload"
                        className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl bg-[#1A1D26]/40 border-2 border-dashed border-white/10 hover:border-[var(--sr-customer)]/30 transition-all cursor-pointer"
                      >
                        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                          <Upload className="w-6 h-6 text-white/60" />
                        </div>
                        <div className="text-center">
                          <p className="text-white/60 text-sm font-bold">Upload Document Image</p>
                          <p className="text-white/60 text-xs mt-1">Click to select a file</p>
                        </div>
                        <span className="text-white/20 text-[10px]">Maximum file size: 5MB</span>
                      </label>
                    )}
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="mt-6 mb-4"
                  >
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className={`w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                        submitting
                          ? 'bg-[var(--sr-customer)]/20 text-[var(--sr-customer)] border border-[var(--sr-customer)]/20 cursor-wait'
                          : 'bg-[var(--sr-customer)] text-[#05070A] hover:bg-[var(--sr-customer)]/90'
                      }`}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5" />
                          Submit for Verification
                        </>
                      )}
                    </button>
                    <p className="text-white/20 text-[10px] text-center mt-2">
                      Your data is encrypted and securely stored. Verification typically takes 24-48 hours.
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
