#!/bin/bash
# Generate production secrets for SwiftRamadan
echo "🔐 SwiftRamadan — Production Secrets Generator"
echo ""
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "AUTH_JWT_SECRET=$(openssl rand -base64 32)"
echo ""
echo "Copy these into your .env file"
