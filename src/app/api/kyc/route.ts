import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { checkBodySize } from '@/lib/validation';
import {
  saveKYCDocument,
  isFilePath,
  readKYCDocumentAsBase64,
} from '@/lib/kyc-storage';

export const runtime = 'nodejs';

const VALID_DOCUMENT_TYPES = ['national_id', 'voters_card', 'drivers_license', 'international_passport', 'nin'];

// Maximum base64 payload size (10MB - larger than final processed image to allow for compression)
const MAX_BASE64_PAYLOAD_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.write);
  if (rateLimited) return rateLimited;

  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const bodyResult = await checkBodySize(request);
    if (bodyResult.tooLarge) return bodyResult.response;

    const body = JSON.parse(bodyResult.body);
    const { action } = body;

    switch (action) {
      case 'submit':
        return await handleSubmit(body, auth.userId);
      case 'status':
        return await handleStatus(auth.userId);
      case 'verify':
        if (auth.role !== 'admin') {
          return NextResponse.json(
            { success: false, message: 'Admin access required' },
            { status: 403 },
          );
        }
        return await handleVerify(body);
      case 'reject':
        if (auth.role !== 'admin') {
          return NextResponse.json(
            { success: false, message: 'Admin access required' },
            { status: 403 },
          );
        }
        return await handleReject(body);
      case 'list-all':
        if (auth.role !== 'admin') {
          return NextResponse.json(
            { success: false, message: 'Admin access required' },
            { status: 403 },
          );
        }
        return await handleListAll(body);
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action. Use: submit, status, verify, reject, list-all' },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('KYC API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 },
    );
  }
}

/** Submit a KYC document */
async function handleSubmit(
  body: {
    documentType: string;
    documentNumber: string;
    documentImage: string;
  },
  userId: string,
) {
  try {
    const { documentType, documentNumber, documentImage } = body;

    if (!documentType || !documentNumber || !documentImage) {
      return NextResponse.json(
        { success: false, message: 'documentType, documentNumber, and documentImage are required' },
        { status: 400 },
      );
    }

    if (!VALID_DOCUMENT_TYPES.includes(documentType)) {
      return NextResponse.json(
        { success: false, message: `documentType must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate base64 payload size before processing
    const base64DataLength = Buffer.byteLength(documentImage, 'utf-8');
    if (base64DataLength > MAX_BASE64_PAYLOAD_SIZE) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Image data too large. Maximum size is ${(MAX_BASE64_PAYLOAD_SIZE / (1024 * 1024)).toFixed(0)}MB` 
        },
        { status: 400 },
      );
    }

    // Check if user already has a verified KYC for this documentType
    const verifiedDoc = await db.kYCDocument.findFirst({
      where: {
        userId,
        documentType,
        status: 'verified',
      },
    });

    if (verifiedDoc) {
      return NextResponse.json(
        { success: false, message: 'Document already verified' },
        { status: 400 },
      );
    }

    // Check if user has a pending KYC for this documentType — update it instead
    const pendingDoc = await db.kYCDocument.findFirst({
      where: {
        userId,
        documentType,
        status: 'pending',
      },
    });

    // Save document to file storage (converts base64 to file)
    const saveResult = await saveKYCDocument(documentImage, userId, documentType);

    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, message: saveResult.error || 'Failed to process document image' },
        { status: 400 },
      );
    }

    // Store file path in database instead of base64
    const documentImagePath = saveResult.filePath!;

    let document;

    if (pendingDoc) {
      // Update existing pending document
      document = await db.kYCDocument.update({
        where: { id: pendingDoc.id },
        data: {
          documentNumber,
          documentImage: documentImagePath,
          status: 'pending',
          rejectionReason: '', // clear any previous rejection reason
        },
      });
    } else {
      // Create new document
      document = await db.kYCDocument.create({
        data: {
          userId,
          documentType,
          documentNumber,
          documentImage: documentImagePath,
          status: 'pending',
        },
      });
    }

    // Return response with URL for frontend use (backward compatible)
    return NextResponse.json({ 
      success: true, 
      document: {
        ...document,
        // Include URL for immediate access
        imageUrl: saveResult.url,
        storageInfo: {
          originalSize: saveResult.originalSize,
          processedSize: saveResult.processedSize,
          storedAsFile: true,
        },
      }, 
    }, { status: pendingDoc ? 200 : 201 });
  } catch (error) {
    console.error('KYC submit error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit KYC document' },
      { status: 500 },
    );
  }
}

/** Get user's KYC status */
async function handleStatus(userId: string) {
  try {
    const documents = await db.kYCDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const isVerified = documents.some((doc) => doc.status === 'verified');

    // Transform documents to include image URLs and handle backward compatibility
    const transformedDocs = await Promise.all(
      documents.map(async (doc) => {
        const transformed: Record<string, unknown> = { ...doc };
        
        if (isFilePath(doc.documentImage)) {
          // New format: file path - provide URL for frontend
          transformed.imageUrl = `/${doc.documentImage}`;
          transformed.storedAsFile = true;
        } else if (doc.documentImage && doc.documentImage.trim() !== '') {
          // Old format: base64 - keep as is but flag it
          transformed.storedAsFile = false;
          // Note: For very old records with actual base64, we could migrate on-the-fly here
          // But that could be expensive, so we just flag it
        }
        
        return transformed;
      })
    );

    return NextResponse.json({ success: true, documents: transformedDocs, isVerified });
  } catch (error) {
    console.error('KYC status error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve KYC status' },
      { status: 500 },
    );
  }
}

/** Admin verifies a KYC document */
async function handleVerify(body: { documentId: string; verifiedBy: string }) {
  try {
    const { documentId, verifiedBy } = body;

    if (!documentId || !verifiedBy) {
      return NextResponse.json(
        { success: false, message: 'documentId and verifiedBy are required' },
        { status: 400 },
      );
    }

    const existing = await db.kYCDocument.findUnique({ where: { id: documentId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'KYC document not found' },
        { status: 404 },
      );
    }

    const document = await db.kYCDocument.update({
      where: { id: documentId },
      data: {
        status: 'verified',
        verifiedBy,
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error('KYC verify error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify KYC document' },
      { status: 500 },
    );
  }
}

/** Admin rejects a KYC document */
async function handleReject(body: { documentId: string; rejectionReason: string }) {
  try {
    const { documentId, rejectionReason } = body;

    if (!documentId || !rejectionReason) {
      return NextResponse.json(
        { success: false, message: 'documentId and rejectionReason are required' },
        { status: 400 },
      );
    }

    const existing = await db.kYCDocument.findUnique({ where: { id: documentId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'KYC document not found' },
        { status: 404 },
      );
    }

    const document = await db.kYCDocument.update({
      where: { id: documentId },
      data: {
        status: 'rejected',
        rejectionReason,
      },
    });

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error('KYC reject error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reject KYC document' },
      { status: 500 },
    );
  }
}

/** Admin lists all KYC submissions with pagination */
async function handleListAll(body: { status?: string; page?: number; limit?: number }) {
  try {
    const { status, page = 1, limit = 20 } = body;

    const where: { status?: string } = {};
    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [documents, total] = await Promise.all([
      db.kYCDocument.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      db.kYCDocument.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Transform documents to include image URLs
    const transformedDocs = documents.map((doc) => {
      const transformed: Record<string, unknown> = { ...doc };
      
      if (isFilePath(doc.documentImage)) {
        transformed.imageUrl = `/${doc.documentImage}`;
        transformed.storedAsFile = true;
      } else {
        transformed.storedAsFile = false;
        // Don't include full base64 in list responses to reduce payload size
        // Frontend can fetch the full image separately if needed
        delete transformed.documentImage;
        transformed.hasImage = Boolean(doc.documentImage && doc.documentImage.trim() !== '');
      }
      
      return transformed;
    });

    return NextResponse.json({
      success: true,
      documents: transformedDocs,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error('KYC list-all error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to list KYC documents' },
      { status: 500 },
    );
  }
}
