import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

const schema = readFileSync('./prisma/schema.prisma', 'utf-8');

describe('Financial Audit Retention (H1)', () => {
  it('WalletTransaction has onDelete: Restrict', () => {
    expect(schema).toContain('onDelete: Restrict');
  });
  it('Payout has onDelete: Restrict', () => {
    // Check the Payout model section
    const payoutSection = schema.split('model Payout')[1]?.split('model')[0] || '';
    expect(payoutSection).toContain('onDelete: Restrict');
  });
  it('Refund has onDelete: Restrict', () => {
    const refundSection = schema.split('model Refund')[1]?.split('model')[0] || '';
    expect(refundSection).toContain('onDelete: Restrict');
  });
  it('KYCDocument has onDelete: Restrict', () => {
    const kycSection = schema.split('model KYCDocument')[1]?.split('model')[0] || '';
    expect(kycSection).toContain('onDelete: Restrict');
  });
  it('No financial model has onDelete: Cascade', () => {
    const financialModels = ['WalletTransaction', 'Payout', 'Refund', 'KYCDocument'];
    for (const model of financialModels) {
      const section = schema.split(`model ${model}`)[1]?.split('model')[0] || '';
      expect(section).not.toContain('onDelete: Cascade');
    }
  });
});
