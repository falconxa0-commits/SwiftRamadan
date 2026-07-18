#!/bin/bash
# Generate production secrets for SwiftRamadan
echo "🔐 SwiftRamadan — Production Secrets Generator"
echo ""
echo "APP_SECRET=$(openssl rand -base64 48)"
echo ""
echo "Copy the above into your .env file."
echo ""
echo "Note: NEXTAUTH_SECRET is also accepted (legacy) but APP_SECRET is preferred."
