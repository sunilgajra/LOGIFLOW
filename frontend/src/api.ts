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
    if (endpoint.includes('/settings/company')) {
      return {
        name: 'LogiFlow Logistics Pvt Ltd',
        address: '101 Trade Center, Connaught Place, New Delhi',
        gst_number: '07AAAAA0000A1Z5',
        pan_number: 'AAAAA0000A',
        invoice_prefix: 'INV-',
        branding_logo: ''
      };
    }

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

    if (endpoint.includes('/couriers')) {
      return [
        {
          id: 'courier-1',
          courier_name: 'Delhivery Express',
          contact_person: 'Delhivery Support',
          phone: '+91 124 6719500',
          email: 'support@delhivery.com',
          account_number: 'DELH-882190',
          status: 'ACTIVE',
          api_credentials: JSON.stringify({ mode: 'staging' }),
          _count: { shipments: 86 }
        },
        {
          id: 'courier-2',
          courier_name: 'Blue Dart',
          contact_person: 'BlueDart Support',
          phone: '+91 1860 233 1234',
          email: 'customersupport@bluedart.com',
          account_number: 'BD-991204',
          status: 'ACTIVE',
          api_credentials: JSON.stringify({ mode: 'sandbox' }),
          _count: { shipments: 42 }
        }
      ];
    }

    if (endpoint.match(/\/clients\/[^\/]+/)) {
      return {
        client: {
          id: 'client-1',
          client_id: 'CLI-001',
          company_name: 'Apex Logistics',
          contact_person: 'Rahul Sharma',
          email: 'rahul@apex.com',
          phone: '+91 9876543210',
          status: 'ACTIVE',
          address: '102 Green Heights, Andheri East, Mumbai, MH 400069',
          gst_number: '27AAAAA0000A1Z5',
          agreement_document: '',
          users: [{ id: 'user-1', email: 'rahul@apex.com', created_at: new Date().toISOString() }]
        },
        company: {
          name: 'LogiFlow Logistics Pvt Ltd',
          address: '408, 4th Floor, The Ambience Park, Sector 19A, Navi Mumbai 400705',
          gst_number: '27CCFPB3558P1Z7',
          pan_number: 'CCFPB3558P'
        },
        stats: {
          totalShipments: 64,
          delivered: 52,
          inTransit: 8,
          totalBilling: 28500
        },
        recentShipments: [
          {
            id: 'demo-1',
            awb_number: 'DELH88291034',
            booking_date: new Date().toISOString(),
            receiver_name: 'Rahul Sharma',
            city: 'Mumbai',
            state: 'Maharashtra',
            actual_weight: 2.5,
            volumetric_weight: 1.8,
            internal_status: 'IN_TRANSIT'
          },
          {
            id: 'demo-2',
            awb_number: 'BLUED99102451',
            booking_date: new Date().toISOString(),
            receiver_name: 'Priya Verma',
            city: 'Bengaluru',
            state: 'Karnataka',
            actual_weight: 1.0,
            volumetric_weight: 0.8,
            internal_status: 'DELIVERED'
          }
        ],
        invoices: [
          {
            id: 'inv-1',
            invoice_number: 'INV-20260818-0001',
            invoice_date: new Date().toISOString(),
            due_date: new Date(Date.now() + 15 * 86400000).toISOString(),
            shipment_count: 12,
            subtotal: 24000,
            total_fsc: 2400,
            total_idc: 480,
            total_oda: 0,
            total_green_tax: 180,
            off_loading_charges: 0,
            vehicle_charges: 0,
            insurance_charges: 0,
            rto_charges: 0,
            taxable_amount: 27060,
            cgst_amount: 2435.4,
            sgst_amount: 2435.4,
            igst_amount: 0,
            round_off: 0.2,
            total_amount: 31931,
            status: 'SENT',
            shipments: [
              {
                id: 'demo-1',
                awb_number: 'DELH88291034',
                booking_date: new Date().toISOString(),
                origin: 'Delhi',
                city: 'Mumbai',
                state: 'Maharashtra',
                client_reference_no: 'REF-1002',
                number_of_pieces: 1,
                actual_weight: 2.5,
                volumetric_weight: 1.8,
                green_tax_amount: 15,
                oda_amount: 0,
                client_charge: 285
              }
            ]
          }
        ],
        rateCards: [
          {
            id: 'rate-1',
            name: 'Standard Client Express Rate',
            min_weight_kg: 0.5,
            docket_charge: 50
          }
        ]
      };
    }

    if (endpoint === '/clients' || endpoint.startsWith('/clients?')) {
      return [
        {
          id: 'client-1',
          client_id: 'CLI-001',
          company_name: 'Apex Logistics',
          contact_person: 'Rahul Sharma',
          email: 'rahul@apex.com',
          phone: '+91 9876543210',
          status: 'ACTIVE',
          billing_address: '102 Green Heights, Andheri East, Mumbai',
          _count: { shipments: 64 }
        },
        {
          id: 'client-2',
          client_id: 'CLI-002',
          company_name: 'LogiFlow Merchant',
          contact_person: 'Priya Verma',
          email: 'priya@merchant.com',
          phone: '+91 9123456789',
          status: 'ACTIVE',
          billing_address: 'Flat 4B, MG Road, Bengaluru',
          _count: { shipments: 38 }
        }
      ];
    }

    if (endpoint.includes('/rates')) {
      return [
        {
          id: 'rate-1',
          name: 'Standard Client Express Rate',
          type: 'CLIENT',
          min_weight_kg: 0.5,
          docket_charge: 50,
          min_booking_amount: 100,
          volumetric_divisor: 5000,
          fov_percentage: 0.2,
          fov_minimum: 20,
          fsc_percentage: 10,
          idc_percentage: 2,
          oda_charge: 150,
          green_tax_rate: 15,
          rates_matrix: JSON.stringify({ N1: 45, S1: 65, W1: 55, E1: 75 })
        }
      ];
    }

    if (endpoint.includes('/zones')) {
      return [
        { id: 'zone-1', state_name: 'Delhi', zone_name: 'N1' },
        { id: 'zone-2', state_name: 'Maharashtra', zone_name: 'W1' },
        { id: 'zone-3', state_name: 'Karnataka', zone_name: 'S1' },
        { id: 'zone-4', state_name: 'West Bengal', zone_name: 'E1' }
      ];
    }

    if (endpoint.includes('/ndr')) {
      return [
        {
          id: 'ndr-1',
          awb_number: 'DELH88291034',
          internal_status: 'NDR',
          courier_status: 'Undelivered: Customer Premises Closed',
          delivery_attempt: 1,
          receiver_name: 'Rahul Sharma',
          receiver_phone: '+91 9876543210',
          receiver_address: '102 Green Heights, Andheri East, Mumbai',
          client: { company_name: 'Apex Logistics' },
          courier: { courier_name: 'Delhivery Express' },
          updated_at: new Date().toISOString()
        }
      ];
    }

    return null;
  }
};
