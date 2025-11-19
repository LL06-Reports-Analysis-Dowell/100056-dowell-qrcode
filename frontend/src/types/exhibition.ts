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
  exhibitionName: string;
  phoneNumber?: string;
  domainName?: string;
  startDate: string;
	endDate: string;
	isActive: boolean;
}

export interface ExhibitorResults extends Exhibitor {
  url: string;
  id: number;
  exhibitorId?: string;
  _id?: string;
}


export interface ExhibitorResponse {
  success: boolean,
  data: ExhibitorResults[],
  message: string
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
  qrId: string;
  scannerId: string;
  data: string;
  latitude: number;
  longitude: number;
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