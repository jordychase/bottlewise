import { LegalDocumentScreen } from "@/components/LegalDocument";
import { PRIVACY_POLICY } from "@/data/legal-text";

export default function PrivacyScreen() {
  return <LegalDocumentScreen document={PRIVACY_POLICY} />;
}
