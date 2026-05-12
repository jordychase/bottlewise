/**
 * Canonical legal text mirrored from docs/PRIVACY_POLICY.md and
 * docs/TERMS_OF_SERVICE.md. Kept here as plain strings so the app can
 * render them without needing a markdown parser bundled. When the
 * canonical docs change, mirror the change here in the same commit.
 *
 * The rendering layer is intentionally simple — bold headings, plain
 * paragraphs, no inline links. The full canonical version lives on the
 * public site for users who want the markdown-rendered original.
 */

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDocument {
  title: string;
  effectiveDate: string;
  intro: string;
  sections: LegalSection[];
  contact: string;
}

export const PRIVACY_POLICY: LegalDocument = {
  title: "Privacy Policy",
  effectiveDate: "2026-05-11",
  intro:
    "Bottlewise is an information and decision-support tool for parents of formula-fed babies. This Privacy Policy explains what we collect, why we collect it, where it lives, and what you can do with it. If something is unclear, email privacy@bottlewise.app.",
  sections: [
    {
      heading: "What Bottlewise is",
      paragraphs: [
        "Bottlewise is a decision-support tool. It is not medical advice. It is not a medical device. It does not diagnose, treat, or claim to cure any condition.",
        "Every recommendation surface includes 'talk to your pediatrician' framing. Safety triggers — recall events, allergic-reaction reports, severe-symptom language — route to a pediatrician-consult interstitial before any formula content is shown.",
      ],
    },
    {
      heading: "What we collect",
      paragraphs: [
        "About your baby: first name (optional), date of birth, sex (optional), birth weight (optional), gestational age (optional), family allergy history (cow milk protein, soy, peanut, eczema, asthma), current feeding status, current formulas, observed feeding issues, and bottle preparation method.",
        "About you: email address (when sign-in is enabled), ZIP code (optional, for stock localization), monthly budget (optional, for cost-weighted recommendations).",
        "About trials and outcomes: which formulas you've tried, start and end dates, tolerance (going well / mixed / not great / severe reaction), issues observed, and an optional free-text note you wrote.",
        "What we DO NOT collect: SSN or tax ID, precise GPS location, advertising identifiers, photos of your baby, payment information, or any third-party social-network logins. No microphone, camera, contacts, or calendar access.",
      ],
    },
    {
      heading: "Why we collect it",
      paragraphs: [
        "Matching — baby profile fields drive the recommendation engine.",
        "Safety — age, allergy history, and observed issues feed the safety-trigger classifier.",
        "Stock localization — ZIP code lets us tell you which formulas are in stock at retailers near you.",
        "Cost transparency — budget lets us rank affordability.",
        "Feedback loop — trial outcomes feed an anonymized public dataset (when you consent) that helps other parents.",
        "We never use this data to sell advertising or build a marketing profile of you.",
      ],
    },
    {
      heading: "Community contribution consent",
      paragraphs: [
        "Every trial outcome you log carries a consent level you set:",
        "Private — Only you see it. Never shared with the community.",
        "Anonymous — Published without any identifier. Your first name, baby name, location, and account details are never attached.",
        "First name — Same as anonymous, plus your first name is attached. No last name, no location, no account details.",
        "The default is Anonymous. You can change the visibility of any past trial outcome at any time.",
      ],
    },
    {
      heading: "Where the data lives",
      paragraphs: [
        "Today: your baby profile and trial outcomes are stored in your browser's local storage on this device only. Nothing leaves your device unless you submit a community-shared trial outcome.",
        "When sign-in is enabled (planned): your data will be mirrored to a Supabase Postgres database hosted in the US East region with row-level security so only your account can read your rows.",
        "Aggregated public dataset: trial outcomes with consent level Anonymous or First name are exposed via a security-definer view that strips your user ID, your baby's identifiers, and (in the Anonymous case) any identifying text. The free-text note is excluded entirely from the public dataset.",
      ],
    },
    {
      heading: "Who we share data with",
      paragraphs: [
        "No one, except service providers acting on Bottlewise's behalf: Supabase for hosting, Cloudflare for the narration worker, Anthropic for the Claude API.",
        "When narration is enabled, the Claude API receives: the deterministic ingredient-score breakdown, your baby's first name + age + family allergy flags, and the formula name. It does not receive your account, last name, address, trial outcomes, or community notes. Anthropic does not train models on inputs; we have additionally requested zero data retention.",
        "No advertisers. No data brokers. No aggregated sale of your personal data.",
      ],
    },
    {
      heading: "Children's information",
      paragraphs: [
        "Bottlewise is for parents and guardians. Our service is not directed to children under 13. We collect information about infants and toddlers from their parents — not from children directly.",
        "If you believe a child has provided information to us directly, email privacy@bottlewise.app and we will delete it.",
      ],
    },
    {
      heading: "Your rights",
      paragraphs: [
        "Access — see everything we have stored about you and your baby.",
        "Correct — change any field at any time through the app.",
        "Delete — remove your account and all data through Settings → Delete my account.",
        "Export — request a JSON copy of your data at privacy@bottlewise.app; we respond within 30 days.",
        "Withdraw consent — change any past trial outcome's visibility to Private at any time.",
        "Object to processing — stop using Bottlewise and delete your account.",
        "If you are a resident of California, the EU, or the UK, the rights above apply to you with the protections of your local law. We do not sell personal information.",
      ],
    },
    {
      heading: "Account deletion",
      paragraphs: [
        "In-app: Settings → Delete my account. The deletion is immediate.",
        "All baby profile data is wiped from your device. All trial outcomes you logged are wiped from your device. All recommendations you saw are wiped from your device.",
        "Once sign-in is enabled, all rows under your user ID in our database are deleted within 24 hours.",
        "Community contributions submitted with Anonymous or First name consent remain in the public dataset because they have no identifier tied back to you. To remove a specific submission, email privacy@bottlewise.app with the submission ID.",
      ],
    },
    {
      heading: "Security and retention",
      paragraphs: [
        "Communication uses TLS 1.2+. Supabase row-level security restricts read/write to your own rows. The Anthropic API key is stored server-side and never enters your device.",
        "Your baby profile is retained until you delete your account or stop using Bottlewise for 24 months. Trial outcomes are retained until you delete. Recommendation snapshots are retained for 18 months then anonymized. Server logs are retained for 90 days.",
        "We will notify you within 72 hours of any breach that affects your data.",
      ],
    },
  ],
  contact:
    "Privacy questions and data export / deletion requests: privacy@bottlewise.app",
};

export const TERMS_OF_SERVICE: LegalDocument = {
  title: "Terms of Service",
  effectiveDate: "2026-05-11",
  intro:
    "These terms govern your use of Bottlewise. They are written to be readable. If something is unclear, email legal@bottlewise.app.",
  sections: [
    {
      heading: "Acceptance",
      paragraphs: [
        "By creating a Bottlewise account, installing the Bottlewise app, or using the Bottlewise web product, you agree to these Terms and the Privacy Policy.",
      ],
    },
    {
      heading: "Who can use Bottlewise",
      paragraphs: [
        "You must be at least 18 years old and the parent or legal guardian of any baby whose profile you create.",
      ],
    },
    {
      heading: "What Bottlewise is — and is not",
      paragraphs: [
        "Bottlewise is an information and decision-support tool. Bottlewise surfaces personalized formula recommendations, ingredient analysis with cited sources, cost transparency, stock signals, next-closest substitution, restock monitoring, calibration settings, and a community feedback loop.",
        "Bottlewise is NOT medical advice. Bottlewise is NOT a medical device. Bottlewise does NOT diagnose, treat, prevent, or cure any condition. Bottlewise is NOT a substitute for your pediatrician.",
        "Always consult your pediatrician before changing formulas — especially when an allergy diagnosis, hypoallergenic or amino-acid formula, or any safety concern is involved.",
      ],
    },
    {
      heading: "Your content",
      paragraphs: [
        "Bottlewise lets you share your experience with a formula (Community Experiences) at three consent levels: Private, Anonymous, or First name. You retain ownership of what you write.",
        "By submitting with Anonymous or First name consent, you grant Bottlewise a perpetual, worldwide, royalty-free license to display, distribute, store, and aggregate your content for the purposes of showing it to other Bottlewise parents and improving the recommendation engine.",
        "You may change the visibility of any past Community Experience at any time.",
      ],
    },
    {
      heading: "Content rules",
      paragraphs: [
        "When you submit content to Bottlewise, you agree NOT to:",
        "Make medical claims about formulas ('treats reflux,' 'cures CMPA') — describe what happened, not what a formula did to your baby.",
        "Include personally identifying information about yourself, your baby, or anyone else (last names, addresses, phone numbers, photos, social media handles).",
        "Promote a brand, retailer, or competing service.",
        "Defame, harass, threaten, or attack any person or company.",
        "Misrepresent affiliations — do not claim to be a healthcare professional unless you are one and disclose that.",
        "Submit content that is illegal in your jurisdiction or ours.",
      ],
    },
    {
      heading: "Reporting and moderation",
      paragraphs: [
        "Every Community Experience has a Report button. Reports go to a moderation queue and are reviewed within 72 hours.",
        "Bottlewise reserves the right to remove content that violates these Terms, without prior notice to the submitter. Repeated violations may result in account suspension or termination.",
      ],
    },
    {
      heading: "Brand-engagement disclosure",
      paragraphs: [
        "Bottlewise is engaged by formula brands and manufacturers for partnerships. Brand engagement does NOT influence recommendation ranking.",
        "Every formula is ranked against the parent's baby profile using the same deterministic algorithm. A brand cannot pay for placement, pay to be ranked higher, or pay to be excluded from a competitor's substitution surface.",
        "If a brand has engaged Bottlewise, the engagement is disclosed in the formula's detail page. The recommendation algorithm is open-source and auditable.",
      ],
    },
    {
      heading: "Disclaimers",
      paragraphs: [
        "Bottlewise is provided 'as is' and 'as available,' without warranties of any kind, express or implied.",
        "Bottlewise does not guarantee that a recommended formula is right for your baby, that stock signals are real-time accurate, that cost signals are real-time accurate, that an ingredient analysis is complete, or that Bottlewise will be available at any given time.",
        "You assume all risk of using any information Bottlewise surfaces. Always consult your pediatrician before changing your baby's formula.",
      ],
    },
    {
      heading: "Limitation of liability",
      paragraphs: [
        "Bottlewise's total liability to you for any claim arising from your use is limited to the amount you paid Bottlewise in the 12 months before the claim (currently zero; Bottlewise is free at this stage).",
        "Bottlewise is not liable for indirect, incidental, special, consequential, or punitive damages.",
        "Bottlewise is not liable for any harm arising from a formula you chose to use based on a Bottlewise recommendation. Recommendations are decision-support — the decision is yours and your pediatrician's.",
      ],
    },
    {
      heading: "Governing law and dispute resolution",
      paragraphs: [
        "These Terms are governed by the laws of the State of California.",
        "Any dispute will be resolved through binding individual arbitration under the rules of the American Arbitration Association. You waive the right to a jury trial and the right to participate in a class action.",
        "Small-claims court actions in San Francisco County are an exception. You may opt out of the arbitration agreement by emailing legal@bottlewise.app within 30 days of first agreeing.",
      ],
    },
  ],
  contact:
    "Legal questions: legal@bottlewise.app · Privacy questions: privacy@bottlewise.app · Content reports: use the in-app Report button.",
};
