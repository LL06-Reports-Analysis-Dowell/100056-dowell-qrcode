import { Exhibition, Exhibitor, ScanRecord, QRCodeData } from '@/types/exhibition';

// Mock API base URL - in production this would be your backend API
const API_BASE_URL = '/api';
// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const BACKEND_URL = 'http://localhost:5000';

type NewExhibitorData = Omit<Exhibitor, 'id' | 'secureToken' | 'scannerUrl' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate'> & {
  startDate: string;
  endDate: string;
};

// Mock data storage
const generateExhibitorStub = (data: NewExhibitorData): Exhibitor => {
  const id = generateId();
  const secureToken = generateSecureToken();
  const currentTime = new Date().toISOString();
  
  // NOTE: Assuming your application's scanner URL is structured like this.
  const scannerUrl = `${window.location.origin}/scanner/${id}?token=${secureToken}`;

  return {
    ...data,
    domainName: window.location.origin
  };
};
let exhibitions: Exhibition[] = [
  {
    id: 'expo-1',
    name: 'TechExpo 2025',
    description: 'The premier technology exhibition of the year',
    startDate: '2025-04-01',
    endDate: '2025-04-03',
    location: 'Convention Center, New York',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active'
  }
];

let exhibitors: Exhibitor[] = [
  {
	name: "HeenaKhan",
	company: "Programmer",
	email:"khanheena4997@gmail.com",
	phoneNumber:"1234567890",
	startDate: "24-10-2025",
	endDate: "25-10-2025",
	status: "active",
  domainName: window.location.origin
}
];

let scanRecords: ScanRecord[] = [];

// Utility function to generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Utility function to generate secure tokens
const generateSecureToken = () => `token-${Math.random().toString(36).substr(2, 32)}`;

// Exhibition API
export const exhibitionAPI = {
  getAll: async (): Promise<Exhibition[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...exhibitions];
  },

  getById: async (id: string): Promise<Exhibition | null> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return exhibitions.find(expo => expo.id === id) || null;
  },

  create: async (data: Omit<Exhibition, 'id' | 'createdAt' | 'updatedAt'>): Promise<Exhibition> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newExhibition: Exhibition = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    exhibitions.push(newExhibition);
    return newExhibition;
  },

  update: async (id: string, data: Partial<Exhibition>): Promise<Exhibition | null> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const index = exhibitions.findIndex(expo => expo.id === id);
    if (index === -1) return null;
    
    exhibitions[index] = {
      ...exhibitions[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    return exhibitions[index];
  },

  delete: async (id: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = exhibitions.findIndex(expo => expo.id === id);
    if (index === -1) return false;
    
    exhibitions.splice(index, 1);
    // Also remove associated exhibitors
    exhibitors = exhibitors.filter(exhibitor => exhibitor.name !== id);
    return true;
  }
};

// Exhibitor API
export const exhibitorAPI = {
  getByExhibition: async (exhibitionId: string): Promise<Exhibitor[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return exhibitors.filter(exhibitor => exhibitor.name === exhibitionId);
  },

  getById: async (id: string): Promise<Exhibitor | null> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return exhibitors.find(exhibitor => exhibitor.name === id) || null;
  },

  getByToken: async (token: string): Promise<Exhibitor | null> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return exhibitors.find(exhibitor => exhibitor.name === token) || null;
  },

//  create: async (data: Omit<Exhibitor, 'id' | 'secureToken' | 'scannerUrl' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate'>): Promise<Exhibitor> => {
//     await new Promise(resolve => setTimeout(resolve, 500));
//     const secureToken = generateSecureToken();
//     const id = generateId();
    
//     const newExhibitor: Exhibitor = {
//       ...data,
//       id,
//       // NOTE: Removed startDate and endDate from the Exhibitor type as per the Omit in the Dialog file.
//       // If the Exhibitor type does include these fields, they should be added back here.
//       startDate: data.startDate || new Date().toISOString().split('T')[0], // Use a default if not provided
//       endDate: data.endDate || new Date().toISOString().split('T')[0],   // Use a default if not provided
//       secureToken,
//       scannerUrl: `${window.location.origin}/scanner/${id}?token=${secureToken}`,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString()
//     };
//     exhibitors.push(newExhibitor);
//     return newExhibitor;
//   },
  // --- DATA TYPES (Assuming these are defined elsewhere, e.g., in '@/types/exhibition') ---


  create: async (data: NewExhibitorData): Promise<Exhibitor> => {
    const endpoint = `${BACKEND_URL}/api/v1/scans/exhibitor`; // Adjust the endpoint path if necessary

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include authorization headers (e.g., JWT token) here if required by your backend
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`, 
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Attempt to parse error message from response body
        const errorDetail = await response.text();
        throw new Error(`Failed to create exhibitor. Status: ${response.status}. Detail: ${errorDetail}`);
      }

      // The backend should return the fully created Exhibitor object
      // const newExhibitor: Exhibitor = await response.json();
      const res = await response.json();
      const newExhibitor = generateExhibitorStub(data)
      exhibitors.push(newExhibitor);
      
      return newExhibitor;

    } catch (error) {
      console.error("API Call Error in exhibitorAPI.create:", error);
      throw error; // Re-throw the error to be handled by the calling component (CreateExhibitorDialog)
    }
  },
  update: async (id: string, data: Partial<Exhibitor>): Promise<Exhibitor | null> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const index = exhibitors.findIndex(exhibitor => exhibitor.name === id);
    if (index === -1) return null;
    
    exhibitors[index] = {
      ...exhibitors[index],
      ...data,
    };
    return exhibitors[index];
  },

  delete: async (id: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = exhibitors.findIndex(exhibitor => exhibitor.name === id);
    if (index === -1) return false;
    
    exhibitors.splice(index, 1);
    return true;
  }
};

// Scan API
export const scanAPI = {
  recordScan: async (exhibitorId: string, qrData: QRCodeData): Promise<ScanRecord> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const exhibitor = exhibitors.find(e => e.name === exhibitorId);
    if (!exhibitor) {
      throw new Error('Exhibitor not found');
    }

    const scanRecord: ScanRecord = {
      id: generateId(),
      exhibitorId,
      exhibitionId: exhibitor.name,
      customer: {
        id: qrData.customerId,
        name: qrData.name,
        email: qrData.email,
        phoneNumber: qrData.phoneNumber,
        company: qrData.company,
        jobTitle: qrData.jobTitle
      },
      timestamp: new Date().toISOString()
    };

    scanRecords.push(scanRecord);
    return scanRecord;
  },

  getScansByExhibitor: async (exhibitorId: string): Promise<ScanRecord[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return scanRecords.filter(record => record.exhibitorId === exhibitorId);
  },

  getScansByExhibition: async (exhibitionId: string): Promise<ScanRecord[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return scanRecords.filter(record => record.exhibitionId === exhibitionId);
  }
};

// Export all APIs
export const api = {
  exhibitions: exhibitionAPI,
  exhibitors: exhibitorAPI,
  scans: scanAPI
};

export default api;