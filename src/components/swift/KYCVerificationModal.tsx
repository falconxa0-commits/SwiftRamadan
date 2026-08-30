'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Shield,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Loader2,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { useNavigation, useAppStore } from '@/lib/store-selectors';
import { useToast } from '@/hooks/use-toast';

interface KYCDocument {
  id: string;
  documentType: string;
  documentNumber: string;
  status: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string | null;
  createdAt: string;
  verifiedAt?: string | null;
}

const DOCUMENT_TYPES = [
  { value: 'nin', label: 'NIN (National ID)', icon: '🪪' },
  { value: 'drivers_license', label: "Driver's License", icon: '🚗' },
  { value: 'passport', label: 'Passport', icon: '🌐' },
  { value: 'voter_card', label: "Voter's Card", icon: '🗳️' },
  { value: 'business_cert', label: 'Business Certificate', icon: '📋' },
];

const STATUS_CONFIG = {
  none: {
    label: 'Not Started',
    color: '#9CA3AF',
    bgColor: 'rgba(156,163,175,0.12)',
    borderColor: 'rgba(156,163,175,0.25)',
    icon: AlertCircle,
  },
  pending: {
    label: 'Pending Review',
    color: '#F5C451',
    bgColor: 'rgba(245,196,81,0.12)',
    borderColor: 'rgba(245,196,81,0.25)',
    icon: Clock,
  },
  verified: {
    label: 'Verified',
    color: '#10E07A',
    bgColor: 'rgba(16,224,122,0.12)',
    borderColor: 'rgba(16,224,122,0.25)',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    color: '#EF4444',
    bgColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.25)',
    icon: XCircle,
  },
} as const;

type KycStatus = keyof typeof STATUS_CONFIG;

export default function KYCVerificationModal() {
  const { activeModal, setActiveModal } = useNavigation();
  const userEmail = useAppStore(s => s.userEmail);
  const userRole = useAppStore(s => s.userRole);
  const { toast } = useToast();
  const isOpen = activeModal === 'kyc';

  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [kycStatus, setKycStatus] = useState<KycStatus>('none');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [documentType, setDocumentType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentImage, setDocumentImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');

  const fetchKYCData = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/kyc?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
        setKycStatus(data.kycStatus);
      }
    } catch (err) {
      console.error('Fetch KYC error:', err);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    if (isOpen && userEmail) {
      fetchKYCData();
    }
  }, [isOpen, userEmail, fetchKYCData]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image under 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setDocumentImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!userEmail || !documentType || !documentNumber) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          documentType,
          documentNumber,
          documentImage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Document submitted',
          description: 'Your KYC document is now pending review.',
        });
        setDocumentType('');
        setDocumentNumber('');
        setDocumentImage(null);
        setFileName('');
        fetchKYCData();
      } else {
        toast({
          title: 'Submission failed',
          description: data.message || 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Network error',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => setActiveModal(null);

  const statusConfig = STATUS_CONFIG[kycStatus];
  const StatusIcon = statusConfig.icon;

  const getDocTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find(d => d.value === type)?.label || type;
  };

  const getDocStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as KycStatus] || STATUS_CONFIG.none;
    const Icon = config.icon;
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
        style={{
          color: config.color,
          backgroundColor: config.bgColor,
          border: `1px solid ${config.borderColor}`,
        }}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // Determine required docs based on role
  const requiredDocs = userRole === 'vendor'
    ? ['NIN or Business Certificate']
    : userRole === 'rider'
      ? ["NIN and Driver's License"]
      : ['NIN'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-3 sm:p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-md max-h-[85vh] glass-card rounded-3xl border border-white/10 overflow-hidden flex flex-col pointer-events-auto"
              style={{ background: 'linear-gradient(180deg, rgba(15,17,24,0.95), rgba(11,13,20,0.98))' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center icon-tile"
                    style={{
                      backgroundColor: 'rgba(16,224,122,0.10)',
                      border: '1px solid rgba(16,224,122,0.30)',
                    }}
                  >
                    <Shield className="w-5 h-5 text-[var(--sr-customer)] relative z-10" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-base tracking-tight">KYC Verification</h2>
                    <p className="text-white/65 text-[11px]">Identity verification for {userRole}s</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  aria-label="Close KYC modal"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                {/* Status Overview */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-[var(--sr-surface-raised)] border border-white/5 p-3 sm:p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/50 text-xs font-medium uppercase tracking-wider">Verification Status</span>
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      style={{
                        color: statusConfig.color,
                        backgroundColor: statusConfig.bgColor,
                        border: `1px solid ${statusConfig.borderColor}`,
                      }}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusConfig.label}
                    </span>
                  </div>

                  {kycStatus === 'verified' && (
                    <p className="text-[var(--sr-customer)]/70 text-xs mt-1">
                      Your identity has been verified. You can now operate as a {userRole}.
                    </p>
                  )}
                  {kycStatus === 'pending' && (
                    <p className="text-[var(--sr-vendor)]/70 text-xs mt-1">
                      Your documents are being reviewed. This usually takes 24-48 hours.
                    </p>
                  )}
                  {kycStatus === 'rejected' && (
                    <p className="text-[var(--sr-error)]/70 text-xs mt-1">
                      Some documents were rejected. Please re-submit with correct information.
                    </p>
                  )}
                  {kycStatus === 'none' && (
                    <p className="text-white/65 text-xs mt-1">
                      Submit your identity documents to get verified. Required: {requiredDocs.join(', ')}.
                    </p>
                  )}

                  {/* Progress indicator */}
                  <div className="mt-3 flex items-center gap-1">
                    {documents.length > 0 && documents.map((doc, i) => (
                      <div
                        key={doc.id}
                        className="h-1.5 flex-1 rounded-full"
                        style={{
                          backgroundColor:
                            doc.status === 'verified' ? '#10E07A' :
                            doc.status === 'rejected' ? '#EF4444' :
                            '#F5C451',
                          opacity: doc.status === 'pending' ? 0.5 : 1,
                        }}
                      />
                    ))}
                    {documents.length === 0 && (
                      <div className="h-1.5 flex-1 rounded-full bg-white/10" />
                    )}
                  </div>
                </motion.div>

                {/* Submit New Document Form */}
                {kycStatus !== 'verified' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="rounded-2xl bg-[var(--sr-surface-raised)] border border-white/5 p-3 sm:p-4 space-y-3"
                  >
                    <h3 className="text-white font-semibold text-sm">Submit Document</h3>

                    {/* Document Type */}
                    <div>
                      <label className="text-white/50 text-[11px] font-medium uppercase tracking-wider block mb-1.5">
                        Document Type
                      </label>
                      <div className="grid grid-cols-1 gap-1.5">
                        {DOCUMENT_TYPES.map((doc) => (
                          <button
                            key={doc.value}
                            onClick={() => setDocumentType(doc.value)}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all text-sm ${
                              documentType === doc.value
                                ? 'bg-[var(--sr-customer)]/10 border border-[var(--sr-customer)]/30 text-[var(--sr-customer)]'
                                : 'bg-white/[0.03] border border-white/5 text-white/70 hover:bg-white/[0.06] hover:border-white/10'
                            }`}
                          >
                            <span className="text-base">{doc.icon}</span>
                            <span className="font-medium">{doc.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Document Number */}
                    <div>
                      <label className="text-white/50 text-[11px] font-medium uppercase tracking-wider block mb-1.5">
                        Document Number
                      </label>
                      <input
                        type="text"
                        value={documentNumber}
                        onChange={(e) => setDocumentNumber(e.target.value)}
                        placeholder="e.g., 12345678901"
                        className="w-full bg-[var(--sr-surface-base)] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[var(--sr-customer)]/40 transition-colors"
                      />
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="text-white/50 text-[11px] font-medium uppercase tracking-wider block mb-1.5">
                        Document Image
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="kyc-doc-upload"
                        />
                        <label
                          htmlFor="kyc-doc-upload"
                          className="flex items-center gap-3 w-full bg-[var(--sr-surface-base)] border border-white/10 rounded-xl px-3.5 py-3 cursor-pointer hover:border-[var(--sr-customer)]/30 transition-colors"
                        >
                          {documentImage ? (
                            <>
                              <div className="w-10 h-10 rounded-lg bg-[var(--sr-customer)]/10 border border-[var(--sr-customer)]/20 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-5 h-5 text-[var(--sr-customer)]" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-white text-xs font-medium truncate">{fileName}</p>
                                <p className="text-[var(--sr-customer)]/60 text-[10px]">Uploaded</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                <Camera className="w-5 h-5 text-white/65" />
                              </div>
                              <div>
                                <p className="text-white/60 text-xs font-medium">Upload document photo</p>
                                <p className="text-white/60 text-[10px]">JPG, PNG — max 5MB</p>
                              </div>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || !documentType || !documentNumber}
                      className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: submitting
                          ? 'rgba(16,224,122,0.15)'
                          : 'linear-gradient(135deg, #10E07A, #0ABF66)',
                        color: '#04140C',
                        boxShadow: submitting ? 'none' : '0 4px 20px rgba(16,224,122,0.25)',
                      }}
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting…
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Upload className="w-4 h-4" />
                          Submit Document
                        </span>
                      )}
                    </button>
                  </motion.div>
                )}

                {/* Submitted Documents List */}
                {documents.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-2xl bg-[var(--sr-surface-raised)] border border-white/5 p-3 sm:p-4 space-y-2"
                  >
                    <h3 className="text-white font-semibold text-sm mb-2">Submitted Documents</h3>
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5"
                      >
                        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-white/65" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">
                            {getDocTypeLabel(doc.documentType)}
                          </p>
                          <p className="text-white/60 text-[10px] font-mono">
                            {doc.documentNumber.replace(/(.{4})(.*)(.{4})/, '$1••••$3')}
                          </p>
                          {doc.rejectionReason && doc.status === 'rejected' && (
                            <p className="text-[var(--sr-error)]/80 text-[10px] mt-0.5">
                              Reason: {doc.rejectionReason}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {getDocStatusBadge(doc.status)}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Loading state */}
                {loading && documents.length === 0 && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-white/60 animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
