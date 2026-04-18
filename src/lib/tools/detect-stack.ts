export interface DetectedStack {
  analytics: string[];
  crm: string[];
  payment: string[];
  support: string[];
  other: string[];
}

type Category = keyof DetectedStack;

interface Pattern {
  name: string;
  category: Category;
  regex: RegExp;
}

const PATTERNS: Pattern[] = [
  { name: "Google Analytics", category: "analytics", regex: /gtag\(|googletagmanager\.com|google-analytics\.com|\bga\.js\b/i },
  { name: "Mixpanel", category: "analytics", regex: /mixpanel/i },
  { name: "Amplitude", category: "analytics", regex: /amplitude/i },
  { name: "Segment", category: "analytics", regex: /segment\.com|cdn\.segment|analytics\.js/i },
  { name: "Heap", category: "analytics", regex: /heap(?:analytics)?\.com|heapanalytics/i },
  { name: "Hotjar", category: "analytics", regex: /hotjar/i },

  { name: "HubSpot", category: "crm", regex: /hs-scripts|hsforms|hubspot/i },
  { name: "Salesforce", category: "crm", regex: /pardot|force\.com|salesforce/i },
  { name: "Intercom", category: "crm", regex: /intercom/i },
  { name: "Drift", category: "crm", regex: /drift\.com|driftt/i },

  { name: "Stripe", category: "payment", regex: /js\.stripe\.com|stripe\.com\/v3/i },
  { name: "PayPal", category: "payment", regex: /paypal/i },
  { name: "Shopify", category: "payment", regex: /shopify/i },

  { name: "Zendesk", category: "support", regex: /zendesk|zdassets/i },
  { name: "Intercom", category: "support", regex: /intercom/i },
  { name: "Freshdesk", category: "support", regex: /freshdesk|freshworks/i },
  { name: "Helpscout", category: "support", regex: /helpscout|help-scout/i },

  { name: "Notion", category: "other", regex: /notion\.so|notion\.site/i },
  { name: "Linear", category: "other", regex: /linear\.app/i },
  { name: "Webflow", category: "other", regex: /webflow/i },
  { name: "Framer", category: "other", regex: /framer\.com|framerusercontent/i },
];

export function detectStack(html: string): DetectedStack {
  const result: DetectedStack = {
    analytics: [],
    crm: [],
    payment: [],
    support: [],
    other: [],
  };

  const seen: Record<Category, Set<string>> = {
    analytics: new Set(),
    crm: new Set(),
    payment: new Set(),
    support: new Set(),
    other: new Set(),
  };

  for (const { name, category, regex } of PATTERNS) {
    if (regex.test(html) && !seen[category].has(name)) {
      seen[category].add(name);
      result[category].push(name);
    }
  }

  return result;
}
