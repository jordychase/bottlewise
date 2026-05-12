import { LegalDocumentScreen } from "@/components/LegalDocument";
import { TERMS_OF_SERVICE } from "@/data/legal-text";

export default function TermsScreen() {
  return <LegalDocumentScreen document={TERMS_OF_SERVICE} />;
}
