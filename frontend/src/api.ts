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

    if (endpoint.match(/\/couriers\/[^\/]+/)) {
      let bodyData: any = {};
      try {
        if (options.body && typeof options.body === 'string') {
          bodyData = JSON.parse(options.body);
        }
      } catch (e) {}

      return {
        id: 'courier-1',
        courier_id: 'DELHIVERY',
        courier_name: bodyData.courier_name || 'Delhivery Express',
        contact_person: bodyData.contact_person || 'Delhivery Support',
        phone: bodyData.phone || '+91 124 6719500',
        email: bodyData.email || 'support@delhivery.com',
        account_number: bodyData.account_number || 'DELH-882190',
        status: bodyData.status || 'ACTIVE',
        api_credentials: bodyData.api_credentials || JSON.stringify({ mode: 'staging' }),
        _count: { shipments: 86 }
      };
    }

    if (endpoint === '/couriers' || endpoint.startsWith('/couriers?')) {
      return [
        {
          id: 'courier-1',
          courier_id: 'DELHIVERY',
          courier_name: 'Delhivery Express',
          contact_person: 'Delhivery Support',
          phone: '+91 124 6719500',
          email: 'support@delhivery.com',
          account_number: 'DELH-882190',
          status: 'ACTIVE',
          api_credentials: JSON.stringify({ api_key: 'live_delhivery_tok_demo99', api_secret: 'sec_delh_8892', client_id: 'DELH_MUMB_001', webhook_url: 'https://sunilgajra.github.io/LOGIFLOW/api/webhooks/delhivery' }),
          _count: { shipments: 86 }
        },
        {
          id: 'courier-2',
          courier_id: 'BLUEDART',
          courier_name: 'Blue Dart',
          contact_person: 'BlueDart Support',
          phone: '+91 1860 233 1234',
          email: 'customersupport@bluedart.com',
          account_number: 'BD-991204',
          status: 'ACTIVE',
          api_credentials: JSON.stringify({ api_key: 'bd_license_key_sandbox_99', api_secret: 'bd_pass_3321', client_id: 'BOM_BD_1001', webhook_url: 'https://sunilgajra.github.io/LOGIFLOW/api/webhooks/bluedart' }),
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
      let bodyData: any = {};
      try {
        if (options.body && typeof options.body === 'string') {
          bodyData = JSON.parse(options.body);
        }
      } catch (e) {}

      const fullMockMatrix = JSON.stringify({
        N1: { N1: 30, N2: 35, E: 55, NE: 75, W1: 45, W2: 50, S1: 65, S2: 70, C: 40 },
        N2: { N1: 35, N2: 30, E: 50, NE: 70, W1: 40, W2: 45, S1: 60, S2: 65, C: 35 },
        E:  { N1: 55, N2: 50, E: 25, NE: 40, W1: 50, W2: 55, S1: 55, S2: 60, C: 45 },
        NE: { N1: 75, N2: 70, E: 40, NE: 30, W1: 70, W2: 75, S1: 75, S2: 80, C: 65 },
        W1: { N1: 45, N2: 40, E: 50, NE: 70, W1: 25, W2: 30, S1: 45, S2: 50, C: 35 },
        W2: { N1: 50, N2: 45, E: 55, NE: 75, W1: 30, W2: 25, S1: 50, S2: 55, C: 40 },
        S1: { N1: 65, N2: 60, E: 55, NE: 75, W1: 45, W2: 50, S1: 25, S2: 30, C: 45 },
        S2: { N1: 70, N2: 65, E: 60, NE: 80, W1: 50, W2: 55, S1: 30, S2: 25, C: 50 },
        C:  { N1: 40, N2: 35, E: 45, NE: 65, W1: 35, W2: 40, S1: 45, S2: 50, C: 25 }
      });

      if (options.method === 'POST' || options.method === 'PUT') {
        return {
          id: 'rc-' + Date.now(),
          name: bodyData.name || 'New Rate Card',
          type: bodyData.type || 'COURIER',
          courier_id: bodyData.courier_id || 'courier-1',
          client_id: bodyData.client_id || null,
          min_weight_kg: parseFloat(bodyData.min_weight_kg || '0.5'),
          docket_charge: parseFloat(bodyData.docket_charge || '50'),
          min_booking_amount: parseFloat(bodyData.min_booking_amount || '100'),
          volumetric_divisor: parseFloat(bodyData.volumetric_divisor || '5000'),
          fsc_percentage: parseFloat(bodyData.fsc_percentage || '10'),
          idc_percentage: parseFloat(bodyData.idc_percentage || '2'),
          oda_charge: parseFloat(bodyData.oda_charge || '150'),
          green_tax_rate: parseFloat(bodyData.green_tax_rate || '15'),
          rates_matrix: bodyData.rates_matrix || fullMockMatrix
        };
      }

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
          rates_matrix: fullMockMatrix
        },
        {
          id: 'rate-2',
          name: 'Delhivery Surface Rate Card 2024',
          type: 'COURIER',
          courier_id: 'courier-1',
          min_weight_kg: 0.5,
          docket_charge: 40,
          min_booking_amount: 80,
          volumetric_divisor: 5000,
          fov_percentage: 0.2,
          fov_minimum: 20,
          fsc_percentage: 8,
          idc_percentage: 2,
          oda_charge: 120,
          green_tax_rate: 15,
          rates_matrix: fullMockMatrix
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

    if (endpoint.includes('/invoices')) {
      let bodyData: any = {};
      try {
        if (options.body && typeof options.body === 'string') {
          bodyData = JSON.parse(options.body);
        }
      } catch (e) {}

      const subtotal = 28500;
      const total_fsc = 2850;
      const total_idc = 570;
      const total_oda = 0;
      const total_green_tax = 180;
      const off_loading_charges = Number(bodyData.off_loading_charges) || 0;
      const vehicle_charges = Number(bodyData.vehicle_charges) || 0;
      const insurance_charges = Number(bodyData.insurance_charges) || 0;
      const rto_charges = Number(bodyData.rto_charges) || 0;

      const taxable_amount = subtotal + off_loading_charges + vehicle_charges + insurance_charges + rto_charges;

      let cgst_amount = 0;
      let sgst_amount = 0;
      let igst_amount = 0;

      if (bodyData.tax_mode === 'INTER_STATE') {
        igst_amount = Math.round(taxable_amount * 0.18 * 100) / 100;
      } else {
        cgst_amount = Math.round(taxable_amount * 0.09 * 100) / 100;
        sgst_amount = Math.round(taxable_amount * 0.09 * 100) / 100;
      }

      const rawTotal = taxable_amount + cgst_amount + sgst_amount + igst_amount;
      const total_amount = Math.round(rawTotal);
      const round_off = Math.round((total_amount - rawTotal) * 100) / 100;

      return {
        id: 'inv-' + Date.now(),
        invoice_number: 'INV-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000),
        invoice_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 15 * 86400000).toISOString(),
        shipment_count: 12,
        subtotal,
        total_fsc,
        total_idc,
        total_oda,
        total_green_tax,
        off_loading_charges,
        vehicle_charges,
        insurance_charges,
        rto_charges,
        taxable_amount,
        cgst_amount,
        sgst_amount,
        igst_amount,
        round_off,
        total_amount,
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
          },
          {
            id: 'demo-2',
            awb_number: 'BLUED99102451',
            booking_date: new Date().toISOString(),
            origin: 'Bengaluru',
            city: 'Bengaluru',
            state: 'Karnataka',
            client_reference_no: 'REF-1003',
            number_of_pieces: 1,
            actual_weight: 1.0,
            volumetric_weight: 0.8,
            green_tax_amount: 15,
            oda_amount: 0,
            client_charge: 195
          }
        ]
      };
    }

    if (endpoint.includes('/imports/preview')) {
      return {
        fileId: 'demo-import-' + Date.now() + '.json',
        headers: [
          'AWB_NUMBER', 'STATUS', 'RECEIVER_NAME', 'CITY', 'STATE', 
          'PINCODE', 'ACTUAL_WEIGHT', 'CLIENT_REF'
        ],
        mapping: {
          awb_number: 'AWB_NUMBER',
          internal_status: 'STATUS',
          receiver_name: 'RECEIVER_NAME',
          city: 'CITY',
          state: 'STATE',
          pincode: 'PINCODE',
          actual_weight: 'ACTUAL_WEIGHT',
          client_reference_no: 'CLIENT_REF'
        },
        sampleData: [
          {
            AWB_NUMBER: 'DELH88291034',
            STATUS: 'Delivered',
            RECEIVER_NAME: 'Rahul Sharma',
            CITY: 'Mumbai',
            STATE: 'Maharashtra',
            PINCODE: '400069',
            ACTUAL_WEIGHT: '2.5',
            CLIENT_REF: 'REF-1002'
          },
          {
            AWB_NUMBER: 'BLUED99102451',
            STATUS: 'Out for Delivery',
            RECEIVER_NAME: 'Priya Verma',
            CITY: 'Bengaluru',
            STATE: 'Karnataka',
            PINCODE: '560001',
            ACTUAL_WEIGHT: '1.0',
            CLIENT_REF: 'REF-1003'
          }
        ]
      };
    }

    if (endpoint.includes('/imports/process')) {
      return {
        message: 'Import complete',
        imported: 10,
        failed: 0,
        total: 10
      };
    }

    if (endpoint.includes('/deliver')) {
      let bodyData: any = {};
      try {
        if (options.body && typeof options.body === 'string') {
          bodyData = JSON.parse(options.body);
        }
      } catch (e) {}

      return {
        id: 'delivered-' + Date.now(),
        internal_status: 'DELIVERED',
        courier_status: 'Delivered',
        podSignature: bodyData.podSignature || null,
        podImageUrl: bodyData.podImageUrl || null,
        receiver_name: bodyData.receivedBy || 'Recipient',
        deliveredAt: new Date().toISOString()
      };
    }

    return null;
  }
};
