#!/usr/bin/env bash
# Generate the RSA keypair Walmart Affiliate API requires.
#
# Walmart accepts RSA 2048 (PKCS#1) PEM. They sign the canonical request
# string with your private key; they verify with the public key you
# upload to their developer dashboard.
#
# Usage:
#   scripts/gen-walmart-key.sh                    # writes to ./walmart-keys/
#   scripts/gen-walmart-key.sh /tmp/out           # writes to /tmp/out/
#
# After running:
#   1. Upload  walmart-keys/walmart_public.pem    to developer.walmart.com
#   2. Paste   walmart-keys/walmart_private.pem   into packages/db/.env
#      as WALMART_PRIVATE_KEY (single line, newlines escaped to \n)
#   3. Delete  the local files once they're in your secrets vault.

set -euo pipefail

OUT_DIR="${1:-./walmart-keys}"
mkdir -p "$OUT_DIR"

PRIV="$OUT_DIR/walmart_private.pem"
PUB="$OUT_DIR/walmart_public.pem"
ENV_LINE="$OUT_DIR/walmart_private_env_line.txt"

if [[ -e "$PRIV" || -e "$PUB" ]]; then
  echo "Refusing to overwrite existing keys at $OUT_DIR." >&2
  echo "Move or delete walmart_private.pem and walmart_public.pem first." >&2
  exit 1
fi

echo "Generating RSA 2048 keypair..."
openssl genrsa -out "$PRIV" 2048 2>/dev/null
openssl rsa -in "$PRIV" -pubout -out "$PUB" 2>/dev/null

# Produce the `.env`-ready single-line form of the private key.
# Walmart's signer wants the standard PEM newlines preserved; in env
# files we encode them as literal \n.
{
  printf 'WALMART_PRIVATE_KEY="'
  awk 'NR==1 { printf "%s", $0 } NR>1 { printf "\\n%s", $0 } END { print "" }' "$PRIV"
  printf '"\n'
} > "$ENV_LINE"

chmod 600 "$PRIV" "$ENV_LINE"

cat <<EOF

✓ Wrote keypair to $OUT_DIR:
    $PRIV       (private — KEEP SECRET; chmod 600)
    $PUB        (public  — upload to Walmart developer portal)
    $ENV_LINE   (private key as a single-line WALMART_PRIVATE_KEY="..." env)

Next:
  1. Walmart developer portal → Add a key → paste contents of:
       $PUB
  2. Copy the line in $ENV_LINE into packages/db/.env
  3. Run a verification call:
       pnpm seed:validate --brand=parents-choice
     With creds set, this should return at least 1 Walmart result.
EOF
