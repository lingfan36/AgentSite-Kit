export interface DocEntry {
  title: string;
  url: string;
  section: string;
  summary: string;
  tags: string[];
  updated_at: string;
}

export interface FaqEntry {
  question: string;
  answer: string;
  category: string;
  url: string;
  updated_at: string;
}

export interface ProductEntry {
  product_name: string;
  description: string;
  features: string[];
  pricing: string;
  url: string;
  updated_at: string;
}

export interface ArticleEntry {
  title: string;
  summary: string;
  published_at: string;
  updated_at: string;
  tags: string[];
  url: string;
}

export interface PricingEntry {
  plan_name: string;
  price: string;
  features: string[];
  url: string;
  updated_at: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
  url: string;
}
