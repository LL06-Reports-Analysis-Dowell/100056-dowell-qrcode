export interface Exhibition {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'active' | 'completed';
}

export interface Exhibitor {
  name: string;
  company: string;
  email: string;
  phoneNumber?: string;
  domainName: string;
  startDate: string;
	endDate: string;
	status: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  company?: string;
  jobTitle?: string;
}

export interface ScanRecord {
  tokenId: string;
  data: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface ScanRecordStore {
  scans: ScanRecord[];
}

export interface QRCodeData {
  customerId: string;
  name: string;
  email: string;
  phoneNumber?: string;
  company?: string;
  jobTitle?: string;
}

export interface ScanResult {
  success: boolean;
  count: number;
  data?: string;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  isActive: boolean;
}