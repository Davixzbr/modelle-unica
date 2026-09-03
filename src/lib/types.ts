export type Categorie = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  description: string;
  image_url: string | null;
  active: boolean;
};
export type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  banner_url: string | null;
  period_text: string;
  featured: boolean;
};
export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  fabric: string;
  size_chart: string;
  category_id: string | null;
  collection_id: string | null;
  price: number;
  promo_price: number | null;
  main_image: string | null;
  images: string[];
  sizes: string[];
  colors: string[];
  tags: string[];
  featured: boolean;
  is_new: boolean;
  status: "active" | "draft" | "inactive";
  views: number;
  favorites_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  categories?: { name: string; slug: string } | null;
  collections?: { name: string; slug: string; period_text?: string } | null;
  variant_stocks?: { total_stock: number }[];
};
export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  image_mobile_url: string | null;
  cta_text: string;
  link_url: string;
  sort_order: number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};
export type Variant = { id: string; product_id: string; size: string; color: string; stock: number };
export type ClickLog = {
  id: string;
  product_name: string | null;
  size: string | null;
  color: string | null;
  source_page: string;
  created_at: string;
};
export type ShopEvent = {
  id: string;
  type: "view" | "wa_click" | "favorite" | "share" | "search" | "filter";
  product_id: string | null;
  term: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

/** Select com join de categoria/coleção + estoque agregado. */
export const PRODUCT_SELECT = "*, categories(name, slug), collections(name, slug, period_text), variant_stocks(total_stock)" as const;
