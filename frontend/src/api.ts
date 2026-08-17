export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  let token = localStorage.getItem('token');

  const isFormData = options.body instanceof FormData;
  const headers: HeadersInit = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.warn(`[API Fallback] ${endpoint}:`, error.message);
    
    // Demo Mode Fallback for mobile / static GitHub Pages preview when backend API is offline
    if (endpoint.includes('/shipments')) {
      return {
        data: [
          {
            id: 'demo-1',
            awb_number: 'DELH88291034',
            booking_date: new Date().toISOString(),
            receiver_name: 'Rahul Sharma',
            receiver_phone: '+91 9876543210',
            receiver_address: '102 Green Heights, Andheri East',
            city: 'Mumbai',
            state: 'MH',
            pincode: '400069',
            internal_status: 'IN_TRANSIT',
            actual_weight: 2.5,
            client: { company_name: 'Apex Logistics' },
            courier: { courier_name: 'Delhivery Express' }
          },
          {
            id: 'demo-2',
            awb_number: 'BLUED99102451',
            booking_date: new Date().toISOString(),
            receiver_name: 'Priya Verma',
            receiver_phone: '+91 9123456789',
            receiver_address: 'Flat 4B, MG Road',
            city: 'Bengaluru',
            state: 'KA',
            pincode: '560001',
            internal_status: 'DELIVERED',
            actual_weight: 1.0,
            client: { company_name: 'LogiFlow Merchant' },
            courier: { courier_name: 'Blue Dart' }
          }
        ],
        pagination: { totalPages: 1, totalItems: 2, page: 1 }
      };
    }

    if (endpoint.includes('/analytics')) {
      return {
        totalShipments: 128,
        inTransit: 34,
        delivered: 89,
        exception: 5,
        totalRevenue: 245000,
        monthlyTrends: [
          { month: 'Jan', shipments: 45 },
          { month: 'Feb', shipments: 83 }
        ]
      };
    }

    if (endpoint.includes('/clients') || endpoint.includes('/couriers') || endpoint.includes('/rates') || endpoint.includes('/ndr') || endpoint.includes('/zones')) {
      return [];
    }

    return null;
  }
};
