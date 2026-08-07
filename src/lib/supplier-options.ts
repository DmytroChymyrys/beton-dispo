export const SUPPLIER_APPLICATION_STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'APPROVED',
  'REJECTED',
] as const;

export type SupplierApplicationStatus = (typeof SUPPLIER_APPLICATION_STATUSES)[number];

export const SUPPLIER_SERVICE_CODES = [
  'READY_MIX',
  'MOBILE_CONCRETE',
  'PUMPING',
  'FINISHING',
  'SLABS',
  'FOUNDATIONS',
  'FOOTINGS',
  'PATIOS',
  'COMMERCIAL',
  'OTHER',
] as const;

export type SupplierServiceCode = (typeof SUPPLIER_SERVICE_CODES)[number];

export const SUPPLIER_SERVICE_LABELS = {
  fr: {
    READY_MIX: 'Livraison de béton prêt à l’emploi',
    MOBILE_CONCRETE: 'Béton mobile',
    PUMPING: 'Pompage de béton',
    FINISHING: 'Finition de béton',
    SLABS: 'Dalles de béton',
    FOUNDATIONS: 'Fondations',
    FOOTINGS: 'Semelles',
    PATIOS: 'Terrasses / béton extérieur',
    COMMERCIAL: 'Béton commercial',
    OTHER: 'Autre',
  },
  en: {
    READY_MIX: 'Ready-mix concrete delivery',
    MOBILE_CONCRETE: 'Mobile concrete',
    PUMPING: 'Concrete pumping',
    FINISHING: 'Concrete finishing',
    SLABS: 'Concrete slabs',
    FOUNDATIONS: 'Foundations',
    FOOTINGS: 'Footings',
    PATIOS: 'Patios / exterior concrete',
    COMMERCIAL: 'Commercial concrete',
    OTHER: 'Other',
  },
} as const satisfies Record<'fr' | 'en', Record<SupplierServiceCode, string>>;

export const SUPPLIER_APPLICATION_STATUS_LABELS = {
  fr: {
    NEW: 'Nouvelle',
    CONTACTED: 'Contactée',
    QUALIFIED: 'Qualifiée',
    APPROVED: 'Approuvée',
    REJECTED: 'Refusée',
  },
  en: {
    NEW: 'New',
    CONTACTED: 'Contacted',
    QUALIFIED: 'Qualified',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  },
} as const satisfies Record<'fr' | 'en', Record<SupplierApplicationStatus, string>>;
