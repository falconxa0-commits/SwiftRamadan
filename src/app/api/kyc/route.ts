import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const VALID_DOCUMENT_TYPES = ['national_id', 'voters_card', 'drivers_license', 'international_passport', 'nin'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'submit':
        return await handleSubmit(body);
      case 'status':
        return await handleStatus(body);
      case 'verify':
        return await handleVerify(body);
      case 'reject':
        return await handleReject(body);
      case 'list-all':
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
async function handleSubmit(body: {
  userId: string;
  documentType: string;
  documentNumber: string;
  documentImage: string;
}) {
  try {
    const { userId, documentType, documentNumber, documentImage } = body;

    if (!userId || !documentType || !documentNumber || !documentImage) {
      return NextResponse.json(
        { success: false, message: 'userId, documentType, documentNumber, and documentImage are required' },
        { status: 400 },
      );
    }

    if (!VALID_DOCUMENT_TYPES.includes(documentType)) {
      return NextResponse.json(
        { success: false, message: `documentType must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}` },
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

    let document;

    if (pendingDoc) {
      // Update existing pending document
      document = await db.kYCDocument.update({
        where: { id: pendingDoc.id },
        data: {
          documentNumber,
          documentImage,
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
          documentImage,
          status: 'pending',
        },
      });
    }

    return NextResponse.json({ success: true, document }, { status: pendingDoc ? 200 : 201 });
  } catch (error) {
    console.error('KYC submit error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit KYC document' },
      { status: 500 },
    );
  }
}

/** Get user's KYC status */
async function handleStatus(body: { userId: string }) {
  try {
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId is required' },
        { status: 400 },
      );
    }

    const documents = await db.kYCDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const isVerified = documents.some((doc) => doc.status === 'verified');

    return NextResponse.json({ success: true, documents, isVerified });
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

    return NextResponse.json({
      success: true,
      documents,
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
