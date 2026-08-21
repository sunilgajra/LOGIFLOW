export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// --- Local Demo State Persistence Helpers ---
const INITIAL_DEMO_CLIENTS = [
  {
    id: 'client-1',
    client_id: 'CLI-001',
    company_name: 'Apex Logistics',
    contact_person: 'Rahul Sharma',
    email: 'rahul@apex.com',
    phone: '+91 9876543210',
    status: 'ACTIVE',
    address: '102 Green Heights, Andheri East, Mumbai, MH 400069',
    gst_number: '27AAAAA0000A1Z5',
    pan_number: 'AAAAA0000A',
    _count: { shipments: 64 },
    users: [{ id: 'user-1', email: 'rahul@apex.com', created_at: new Date().toISOString() }]
  },
  {
    id: 'client-2',
    client_id: 'CLI-002',
    company_name: 'LogiFlow Merchant',
    contact_person: 'Priya Verma',
    email: 'priya@merchant.com',
    phone: '+91 9123456789',
    status: 'ACTIVE',
    address: 'Flat 4B, MG Road, Bengaluru, KA 560001',
    gst_number: '29BBBBB1111B2Z6',
    pan_number: 'BBBBB1111B',
    _count: { shipments: 38 },
    users: [{ id: 'user-2', email: 'priya@merchant.com', created_at: new Date().toISOString() }]
  }
];

const INITIAL_DEMO_COURIERS = [
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

const INITIAL_DEMO_RATES = [
  {
    id: 'rate-1',
    name: 'Standard Client Express Rate',
    type: 'CLIENT',
    client_id: 'client-1',
    courier_id: null,
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
    rates_matrix: JSON.stringify({
      N1: { N1: 30, N2: 35, E: 55, NE: 75, W1: 45, W2: 50, S1: 65, S2: 70, C: 40 },
      W1: { N1: 45, N2: 40, E: 50, NE: 70, W1: 25, W2: 30, S1: 45, S2: 50, C: 35 }
    })
  },
  {
    id: 'rate-2',
    name: 'Delhivery Surface Rate Card 2024',
    type: 'COURIER',
    courier_id: 'courier-1',
    client_id: null,
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
    rates_matrix: JSON.stringify({
      N1: { N1: 25, N2: 30, E: 45, NE: 65, W1: 35, W2: 40, S1: 55, S2: 60, C: 30 },
      W1: { N1: 35, N2: 30, E: 40, NE: 60, W1: 20, W2: 25, S1: 35, S2: 40, C: 25 }
    })
  }
];

const INITIAL_DEMO_SHIPMENTS = [
  {
    id: 'demo-1',
    awb_number: 'DELH88291034',
    booking_date: new Date().toISOString(),
    receiver_name: 'Rahul Sharma',
    receiver_phone: '+91 9876543210',
    receiver_address: '102 Green Heights, Andheri East',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400069',
    origin: 'Delhi',
    destination: 'Mumbai',
    service_type: 'EXPRESS',
    package_type: 'PARCEL',
    number_of_pieces: 1,
    actual_weight: 2.5,
    volumetric_weight: 1.8,
    chargeable_weight: 2.5,
    client_charge: 285,
    internal_status: 'IN_TRANSIT',
    client_id: 'client-1',
    courier_id: 'courier-1',
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
    state: 'Karnataka',
    pincode: '560001',
    origin: 'Bengaluru',
    destination: 'Bengaluru',
    service_type: 'EXPRESS',
    package_type: 'PARCEL',
    number_of_pieces: 1,
    actual_weight: 1.0,
    volumetric_weight: 0.8,
    chargeable_weight: 1.0,
    client_charge: 195,
    internal_status: 'DELIVERED',
    client_id: 'client-2',
    courier_id: 'courier-2',
    client: { company_name: 'LogiFlow Merchant' },
    courier: { courier_name: 'Blue Dart' }
  }
];

const getDemoClients = () => {
  const stored = localStorage.getItem('demo_clients');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return INITIAL_DEMO_CLIENTS;
};
const saveDemoClients = (clients: any[]) => {
  localStorage.setItem('demo_clients', JSON.stringify(clients));
};

const getDemoCouriers = () => {
  const stored = localStorage.getItem('demo_couriers');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return INITIAL_DEMO_COURIERS;
};
const saveDemoCouriers = (couriers: any[]) => {
  localStorage.setItem('demo_couriers', JSON.stringify(couriers));
};

const getDemoRates = () => {
  const stored = localStorage.getItem('demo_rates');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return INITIAL_DEMO_RATES;
};
const saveDemoRates = (rates: any[]) => {
  localStorage.setItem('demo_rates', JSON.stringify(rates));
};

const getDemoShipments = () => {
  const stored = localStorage.getItem('demo_shipments');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return INITIAL_DEMO_SHIPMENTS;
};
const saveDemoShipments = (shipments: any[]) => {
  localStorage.setItem('demo_shipments', JSON.stringify(shipments));
};
const INITIAL_DEMO_INVOICES = [
  {
    id: 'inv-1',
    client_id: 'client-1',
    invoice_number: 'INV-20260818-0001',
    invoice_date: new Date().toISOString(),
    due_date: new Date(Date.now() + 15 * 86400000).toISOString(),
    shipment_count: 2,
    subtotal: 480,
    total_fsc: 48,
    total_idc: 9.6,
    total_oda: 0,
    total_green_tax: 30,
    off_loading_charges: 0,
    vehicle_charges: 0,
    insurance_charges: 0,
    rto_charges: 0,
    taxable_amount: 557.6,
    cgst_amount: 50.18,
    sgst_amount: 50.18,
    igst_amount: 0,
    round_off: 0.04,
    total_amount: 658,
    status: 'SENT',
    shipments: INITIAL_DEMO_SHIPMENTS
  }
];

const getDemoInvoices = () => {
  const stored = localStorage.getItem('demo_invoices');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return INITIAL_DEMO_INVOICES;
};
const saveDemoInvoices = (invoices: any[]) => {
  localStorage.setItem('demo_invoices', JSON.stringify(invoices));
};

const INITIAL_DEMO_COMPANY = {
  name: 'LogiFlow Logistics Pvt Ltd',
  address: '408, 4th Floor, The Ambience Park, Sector 19A, Navi Mumbai, MH 400705',
  gst_number: '27CCFPB3558P1Z7',
  pan_number: 'CCFPB3558P',
  invoice_prefix: 'INV-',
  branding_logo: '',
  bank_name: 'HDFC Bank Ltd',
  account_name: 'LogiFlow Logistics Private Limited',
  account_number: '50200088910245',
  ifsc_code: 'HDFC0000128',
  support_email: 'support@logiflow.in',
  support_phone: '+91 22 6192 8800'
};

const getDemoCompanySettings = () => {
  const stored = localStorage.getItem('demo_company_settings');
  if (stored) {
    try { return { ...INITIAL_DEMO_COMPANY, ...JSON.parse(stored) }; } catch (e) {}
  }
  return INITIAL_DEMO_COMPANY;
};
const saveDemoCompanySettings = (settings: any) => {
  localStorage.setItem('demo_company_settings', JSON.stringify(settings));
};

const INITIAL_DEMO_WAREHOUSES = [
  {
    id: 'wh-1',
    facility_name: '276001 - PROSTARM INFO',
    contact_person: 'Rahul Sharma',
    contact_phone: '9876543210',
    email: 'warehouse@prostarm.com',
    address_line: 'Plot 12, Industrial Area, Azamgarh',
    pincode: '276001',
    city: 'Azamgarh',
    state: 'Uttar Pradesh',
    default_pickup_slot: '10:00 AM - 01:00 PM',
    working_days: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString()
  },
  {
    id: 'wh-2',
    facility_name: 'VERTIVE ENERGY PVT LTD',
    contact_person: 'Amit Kumar',
    contact_phone: '9123456789',
    email: 'ops@vertive.com',
    address_line: 'Sector 19A, Vashi, Navi Mumbai',
    pincode: '400705',
    city: 'Navi mumbai',
    state: 'Maharashtra',
    default_pickup_slot: '10:00 AM - 01:00 PM',
    working_days: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 50 * 86400000).toISOString()
  },
  {
    id: 'wh-3',
    facility_name: 'G S OVERSEAS',
    contact_person: 'Sandeep Verma',
    contact_phone: '9811002233',
    email: 'delhi@gsoverseas.com',
    address_line: 'Okhla Phase 3, Industrial Area',
    pincode: '110020',
    city: 'Delhi',
    state: 'Delhi',
    default_pickup_slot: '02:00 PM - 05:00 PM',
    working_days: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 100 * 86400000).toISOString()
  },
  {
    id: 'wh-4',
    facility_name: 'Reliance Retail Warehouse',
    contact_person: 'Priya Patel',
    contact_phone: '9988776655',
    email: 'hub@relianceretail.com',
    address_line: 'GIDC Highway Hub, Nadiad',
    pincode: '387001',
    city: 'Nadiad',
    state: 'Gujarat',
    default_pickup_slot: '10:00 AM - 01:00 PM',
    working_days: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 120 * 86400000).toISOString()
  }
];

const getDemoWarehouses = () => {
  const stored = localStorage.getItem('demo_warehouses');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return INITIAL_DEMO_WAREHOUSES;
};
const saveDemoWarehouses = (list: any[]) => {
  localStorage.setItem('demo_warehouses', JSON.stringify(list));
};

const INITIAL_DEMO_PICKUPS = [
  {
    id: 'pk-1',
    pickup_id: '314936152',
    facility_name: 'Avenue Supermarts Ltd - Haryana',
    pickup_date: new Date(Date.now() + 86400000).toISOString(),
    pickup_slot: '10:00 AM - 02:00 PM',
    box_count: 69,
    status: 'Scheduled',
    escalated: false,
    otp_verified: false,
    created_at: new Date().toISOString()
  },
  {
    id: 'pk-2',
    pickup_id: '314891785',
    facility_name: '201305 - PROSTARM INFO SYSTEMS LTD',
    pickup_date: new Date().toISOString(),
    pickup_slot: '02:00 PM - 06:00 PM',
    box_count: 12,
    status: 'Picked',
    escalated: false,
    otp_verified: false,
    created_at: new Date().toISOString()
  },
  {
    id: 'pk-3',
    pickup_id: '314731633',
    facility_name: 'Prostam',
    pickup_date: new Date().toISOString(),
    pickup_slot: '02:00 PM - 06:00 PM',
    box_count: 5,
    status: 'Picked',
    escalated: false,
    otp_verified: false,
    created_at: new Date().toISOString()
  },
  {
    id: 'pk-4',
    pickup_id: '314697020',
    facility_name: '641602 - PROSTARM INFO',
    pickup_date: new Date().toISOString(),
    pickup_slot: '02:00 PM - 06:00 PM',
    box_count: 8,
    status: 'Out for Pickup',
    escalated: false,
    otp_verified: false,
    created_at: new Date().toISOString()
  },
  {
    id: 'pk-5',
    pickup_id: '314660291',
    facility_name: '522256 - PROSTARM INFO SYSTEMS LTD',
    pickup_date: new Date().toISOString(),
    pickup_slot: '02:00 PM - 06:00 PM',
    box_count: 15,
    status: 'Picked',
    escalated: true,
    otp_verified: false,
    created_at: new Date().toISOString()
  },
  {
    id: 'pk-6',
    pickup_id: '314643936',
    facility_name: '249402 - PROSTARM INFO',
    pickup_date: new Date().toISOString(),
    pickup_slot: '02:00 PM - 06:00 PM',
    box_count: 3,
    status: 'Not Picked',
    escalated: true,
    otp_verified: true,
    created_at: new Date().toISOString()
  }
];

const getDemoPickups = () => {
  const stored = localStorage.getItem('demo_pickups');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  return INITIAL_DEMO_PICKUPS;
};
const saveDemoPickups = (list: any[]) => {
  localStorage.setItem('demo_pickups', JSON.stringify(list));
};

// --- Main API Fetch Function with automatic offline demo persistence ---
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
    
    // --- 1. SHIPMENTS API FALLBACK ---
    if (endpoint === '/shipments' || endpoint.startsWith('/shipments?')) {
      if (options.method === 'POST') {
        let bodyData: any = {};
        try {
          if (options.body && typeof options.body === 'string') {
            bodyData = JSON.parse(options.body);
          }
        } catch (e) {}

        const list = getDemoShipments();
        const clientList = getDemoClients();
        const courierList = getDemoCouriers();

        const selectedClient = clientList.find((c: any) => c.id === bodyData.client_id) || { company_name: 'Apex Logistics' };
        const selectedCourier = courierList.find((c: any) => c.id === bodyData.courier_id) || { courier_name: 'Delhivery Express' };

        const newShipment = {
          id: 'shipment-' + Date.now(),
          awb_number: bodyData.awb_number || `AWB${Math.floor(Date.now() / 1000)}${Math.floor(Math.random() * 100)}`,
          booking_date: bodyData.booking_date || new Date().toISOString(),
          receiver_name: bodyData.receiver_name || 'Recipient',
          receiver_phone: bodyData.receiver_phone || '',
          receiver_address: bodyData.receiver_address || '',
          sender_name: bodyData.sender_name || 'Sender',
          sender_phone: bodyData.sender_phone || '',
          sender_address: bodyData.sender_address || '',
          city: bodyData.city || 'Mumbai',
          state: bodyData.state || 'Maharashtra',
          pincode: bodyData.pincode || '400001',
          origin: bodyData.origin || 'Delhi',
          destination: bodyData.destination || bodyData.city || 'Mumbai',
          service_type: bodyData.service_type || 'EXPRESS',
          package_type: bodyData.package_type || 'PARCEL',
          number_of_pieces: Number(bodyData.number_of_pieces) || 1,
          actual_weight: parseFloat(bodyData.actual_weight) || 1.0,
          volumetric_weight: parseFloat(bodyData.volumetric_weight) || 1.0,
          chargeable_weight: parseFloat(bodyData.chargeable_weight) || 1.0,
          client_charge: parseFloat(bodyData.client_charge) || 250,
          internal_status: 'BOOKED',
          client_id: bodyData.client_id || null,
          courier_id: bodyData.courier_id || null,
          client: { company_name: selectedClient.company_name },
          courier: { courier_name: selectedCourier.courier_name }
        };

        const updatedList = [newShipment, ...list];
        saveDemoShipments(updatedList);
        return { message: 'Shipment booked successfully', shipment: newShipment };
      }

      if (options.method === 'PUT') {
        let bodyData: any = {};
        try {
          if (options.body && typeof options.body === 'string') {
            bodyData = JSON.parse(options.body);
          }
        } catch (e) {}

        const parts = endpoint.split('/');
        const shipmentId = parts[parts.length - 1];
        const list = getDemoShipments();
        const idx = list.findIndex((s: any) => s.id === shipmentId);

        if (idx !== -1) {
          list[idx] = { ...list[idx], ...bodyData };
          saveDemoShipments(list);
          return { message: 'Shipment updated successfully', shipment: list[idx] };
        }
      }

      return {
        data: getDemoShipments(),
        pagination: { totalPages: 1, totalItems: getDemoShipments().length, page: 1 }
      };
    }

    // --- 2. CLIENTS API FALLBACK ---
    if (endpoint === '/clients' || endpoint.startsWith('/clients?')) {
      if (options.method === 'POST') {
        let bodyData: any = {};
        try {
          if (options.body && typeof options.body === 'string') {
            bodyData = JSON.parse(options.body);
          }
        } catch (e) {}

        const list = getDemoClients();
        const newClient = {
          id: 'client-' + Date.now(),
          client_id: bodyData.client_id || `CLI-00${list.length + 1}`,
          company_name: bodyData.company_name || 'New Merchant Client',
          contact_person: bodyData.contact_person || '',
          email: bodyData.email || '',
          phone: bodyData.phone || '',
          address: bodyData.address || '',
          gst_number: bodyData.gst_number || '',
          pan_number: bodyData.pan_number || '',
          status: bodyData.status || 'ACTIVE',
          _count: { shipments: 0 },
          users: []
        };
        const updatedList = [newClient, ...list];
        saveDemoClients(updatedList);
        return newClient;
      }

      return getDemoClients();
    }

    if (endpoint.match(/\/clients\/[^\/]+/)) {
      const parts = endpoint.split('/');
      const clientId = parts[2];

      let bodyData: any = {};
      try {
        if (options.body && typeof options.body === 'string') {
          bodyData = JSON.parse(options.body);
        }
      } catch (e) {}

      const list = getDemoClients();
      const clientIndex = list.findIndex((c: any) => c.id === clientId);

      if (options.method === 'PUT' && clientIndex !== -1) {
        list[clientIndex] = { ...list[clientIndex], ...bodyData };
        saveDemoClients(list);
        return { success: true, client: list[clientIndex] };
      }

      const client = clientIndex !== -1 ? list[clientIndex] : list[0];
      const shipments = getDemoShipments().filter((s: any) => s.client_id === client.id || s.client?.company_name === client.company_name);
      const invoices = getDemoInvoices().filter((inv: any) => inv.client_id === client.id || inv.client_id === 'client-1');

      return {
        client,
        company: getDemoCompanySettings(),
        stats: {
          totalShipments: shipments.length,
          delivered: shipments.filter((s: any) => s.internal_status === 'DELIVERED').length,
          inTransit: shipments.filter((s: any) => s.internal_status === 'IN_TRANSIT').length,
          totalBilling: shipments.reduce((sum: number, s: any) => sum + (s.client_charge || 0), 0)
        },
        recentShipments: shipments,
        invoices: invoices.length > 0 ? invoices : getDemoInvoices(),
        rateCards: getDemoRates().filter((r: any) => r.client_id === client.id)
      };
    }

    // --- 3. COURIERS API FALLBACK ---
    if (endpoint === '/couriers' || endpoint.startsWith('/couriers?')) {
      if (options.method === 'POST') {
        let bodyData: any = {};
        try {
          if (options.body && typeof options.body === 'string') {
            bodyData = JSON.parse(options.body);
          }
        } catch (e) {}

        const list = getDemoCouriers();
        const newCourier = {
          id: 'courier-' + Date.now(),
          courier_id: bodyData.courier_id || `CP-${Math.floor(100 + Math.random() * 900)}`,
          courier_name: bodyData.courier_name || 'New Delivery Partner',
          contact_person: bodyData.contact_person || '',
          phone: bodyData.phone || '',
          email: bodyData.email || '',
          account_number: bodyData.account_number || '',
          status: bodyData.status || 'ACTIVE',
          api_credentials: typeof bodyData.api_credentials === 'string' ? bodyData.api_credentials : JSON.stringify(bodyData.api_credentials || {}),
          _count: { shipments: 0 }
        };
        const updatedList = [newCourier, ...list];
        saveDemoCouriers(updatedList);
        return newCourier;
      }

      return getDemoCouriers();
    }

    if (endpoint.match(/\/couriers\/[^\/]+/)) {
      const parts = endpoint.split('/');
      const courierId = parts[2];

      let bodyData: any = {};
      try {
        if (options.body && typeof options.body === 'string') {
          bodyData = JSON.parse(options.body);
        }
      } catch (e) {}

      const list = getDemoCouriers();
      const idx = list.findIndex((c: any) => c.id === courierId);

      if (options.method === 'PUT' && idx !== -1) {
        list[idx] = { ...list[idx], ...bodyData };
        saveDemoCouriers(list);
        return list[idx];
      }

      return idx !== -1 ? list[idx] : list[0];
    }

    // --- 4. RATES API FALLBACK ---
    if (endpoint === '/rates' || endpoint.startsWith('/rates?')) {
      if (options.method === 'POST') {
        let bodyData: any = {};
        try {
          if (options.body && typeof options.body === 'string') {
            bodyData = JSON.parse(options.body);
          }
        } catch (e) {}

        const list = getDemoRates();
        const newRate = {
          id: 'rc-' + Date.now(),
          name: bodyData.name || 'New Rate Card',
          type: bodyData.type || 'CLIENT',
          courier_id: bodyData.courier_id || null,
          client_id: bodyData.client_id || null,
          min_weight_kg: parseFloat(bodyData.min_weight_kg || '0.5'),
          docket_charge: parseFloat(bodyData.docket_charge || '50'),
          min_booking_amount: parseFloat(bodyData.min_booking_amount || '100'),
          volumetric_divisor: parseFloat(bodyData.volumetric_divisor || '5000'),
          fov_percentage: parseFloat(bodyData.fov_percentage || '0'),
          fov_minimum: parseFloat(bodyData.fov_minimum || '0'),
          fsc_percentage: parseFloat(bodyData.fsc_percentage || '10'),
          idc_percentage: parseFloat(bodyData.idc_percentage || '2'),
          oda_charge: parseFloat(bodyData.oda_charge || '150'),
          green_tax_rate: parseFloat(bodyData.green_tax_rate || '15'),
          rates_matrix: typeof bodyData.rates_matrix === 'string' ? bodyData.rates_matrix : JSON.stringify(bodyData.rates_matrix || {})
        };

        const updatedList = [newRate, ...list];
        saveDemoRates(updatedList);
        return newRate;
      }

      return getDemoRates();
    }

    if (endpoint.match(/\/rates\/[^\/]+/)) {
      const parts = endpoint.split('/');
      const rateId = parts[2];

      let bodyData: any = {};
      try {
        if (options.body && typeof options.body === 'string') {
          bodyData = JSON.parse(options.body);
        }
      } catch (e) {}

      const list = getDemoRates();
      const idx = list.findIndex((r: any) => r.id === rateId);

      if (options.method === 'DELETE' && idx !== -1) {
        const filtered = list.filter((r: any) => r.id !== rateId);
        saveDemoRates(filtered);
        return { success: true };
      }

      if (options.method === 'PUT' && idx !== -1) {
        list[idx] = { ...list[idx], ...bodyData };
        saveDemoRates(list);
        return list[idx];
      }
    }

    if (endpoint.includes('/rates/calculate')) {
      let bodyData: any = {};
      try {
        if (options.body && typeof options.body === 'string') {
          bodyData = JSON.parse(options.body);
        }
      } catch (e) {}

      const actual_weight = Number(bodyData.actual_weight) || 2.5;
      const l = Number(bodyData.length) || 0;
      const w = Number(bodyData.width) || 0;
      const h = Number(bodyData.height) || 0;
      const volumetric_weight = l && w && h ? Math.round(((l * w * h) / 5000) * 100) / 100 : 1.8;
      const chargeable_weight = Math.max(actual_weight, volumetric_weight);

      const baseRate = 45;
      const freight_charge = Math.round(chargeable_weight * baseRate);
      const docket_charge = 50;
      const fsc_amount = Math.round(freight_charge * 0.10);
      const idc_amount = Math.round(freight_charge * 0.02);
      const green_tax_amount = 15;
      const oda_amount = bodyData.is_oda ? 150 : 0;

      const client_charge = Math.max(100, freight_charge + docket_charge + fsc_amount + idc_amount + green_tax_amount + oda_amount);
      const courier_cost = Math.round(client_charge * 0.68);
      const estimated_profit = client_charge - courier_cost;
      const profit_margin_pct = Math.round((estimated_profit / client_charge) * 1000) / 10;

      return {
        actual_weight,
        volumetric_weight,
        chargeable_weight,
        client_charge,
        courier_cost,
        estimated_profit,
        profit_margin_pct,
        breakdown: {
          freight_charge,
          docket_charge,
          fsc_amount,
          idc_amount,
          green_tax_amount,
          oda_amount
        }
      };
    }

    if (endpoint.includes('/settings/company')) {
      if (options.method === 'PUT') {
        let bodyData: any = {};
        try {
          if (options.body && typeof options.body === 'string') {
            bodyData = JSON.parse(options.body);
          }
        } catch (e) {}

        const updated = { ...getDemoCompanySettings(), ...bodyData };
        saveDemoCompanySettings(updated);
        return {
          success: true,
          message: 'Company settings updated successfully',
          ...updated
        };
      }

      return getDemoCompanySettings();
    }

    if (endpoint.includes('/users')) {
      if (options.method === 'POST') {
        let bodyData: any = {};
        try {
          if (options.body && typeof options.body === 'string') {
            bodyData = JSON.parse(options.body);
          }
        } catch (e) {}

        return {
          message: 'User created successfully',
          user: {
            id: 'usr-' + Date.now(),
            email: bodyData.email || 'newuser@logiflow.com',
            first_name: bodyData.first_name || 'Team',
            last_name: bodyData.last_name || 'Member',
            role: bodyData.role || 'OPERATIONS',
            client_id: bodyData.client_id || null,
            created_at: new Date().toISOString()
          }
        };
      }

      return [
        {
          id: 'usr-1',
          email: 'admin@logiflow.com',
          first_name: 'Super',
          last_name: 'Admin',
          role: 'SUPER_ADMIN',
          created_at: new Date().toISOString()
        },
        {
          id: 'usr-2',
          email: 'ops@logiflow.com',
          first_name: 'Operations',
          last_name: 'Manager',
          role: 'OPERATIONS',
          created_at: new Date().toISOString()
        },
        {
          id: 'usr-3',
          email: 'rahul@apex.com',
          first_name: 'Rahul',
          last_name: 'Sharma',
          role: 'CLIENT',
          client_id: 'client-1',
          client: { company_name: 'Apex Logistics', client_id: 'CLI-001' },
          created_at: new Date().toISOString()
        }
      ];
    }

    if (endpoint.includes('/analytics/monthly-report')) {
      return {
        period: {
          month: 8,
          year: 2026,
          monthName: 'August',
          startDate: new Date(2026, 7, 1).toISOString(),
          endDate: new Date(2026, 7, 31).toISOString()
        },
        metrics: {
          totalShipments: getDemoShipments().length,
          delivered: getDemoShipments().filter((s: any) => s.internal_status === 'DELIVERED').length,
          inTransit: getDemoShipments().filter((s: any) => s.internal_status === 'IN_TRANSIT').length,
          exceptions: 1,
          rto: 0,
          slaRate: '98.4%',
          totalFreightCharges: getDemoShipments().reduce((sum: number, s: any) => sum + (s.client_charge || 0), 0),
          totalCourierCost: 168980,
          totalProfit: 79520,
          totalActualWeight: 142.5,
          totalChargeableWeight: 168.0
        },
        statusBreakdown: [
          { status: 'DELIVERED', count: getDemoShipments().filter((s: any) => s.internal_status === 'DELIVERED').length },
          { status: 'IN_TRANSIT', count: getDemoShipments().filter((s: any) => s.internal_status === 'IN_TRANSIT').length },
          { status: 'BOOKED', count: getDemoShipments().filter((s: any) => s.internal_status === 'BOOKED').length }
        ],
        topDestinations: [
          { city: 'Mumbai', count: 42 },
          { city: 'Bengaluru', count: 28 },
          { city: 'Delhi', count: 24 }
        ],
        shipments: getDemoShipments()
      };
    }

    if (endpoint.includes('/analytics')) {
      const shipments = getDemoShipments();
      return {
        totalShipments: shipments.length,
        inTransit: shipments.filter((s: any) => s.internal_status === 'IN_TRANSIT').length,
        delivered: shipments.filter((s: any) => s.internal_status === 'DELIVERED').length,
        exceptions: shipments.filter((s: any) => s.internal_status === 'EXCEPTION' || s.internal_status === 'NDR').length,
        totalRevenue: shipments.reduce((sum: number, s: any) => sum + (s.client_charge || 0), 0),
        slaRate: 98.4,
        avgDeliveryDays: 2.1,
        chartData: [
          { name: 'Mon', shipments: 18, revenue: 32000 },
          { name: 'Tue', shipments: 24, revenue: 41000 },
          { name: 'Wed', shipments: 29, revenue: 52000 },
          { name: 'Thu', shipments: 22, revenue: 38000 },
          { name: 'Fri', shipments: 35, revenue: 61000 },
          { name: 'Sat', shipments: 19, revenue: 31000 },
          { name: 'Sun', shipments: 12, revenue: 19500 }
        ],
        courierBreakdown: getDemoCouriers().map((c: any) => ({
          name: c.courier_name,
          count: shipments.filter((s: any) => s.courier_id === c.id || s.courier?.courier_name === c.courier_name).length || 1,
          percent: 50,
          slaScore: '99.1%'
        })),
        recentActivity: shipments.slice(0, 5)
      };
    }

    if (endpoint.includes('/zones')) {
      if (options.method === 'POST') {
        let bodyData: any = {};
        try {
          if (options.body && typeof options.body === 'string') {
            bodyData = JSON.parse(options.body);
          }
        } catch (e) {}

        return {
          id: 'zone-' + Date.now(),
          state_name: bodyData.state_name || 'Delhi',
          zone_name: bodyData.zone_name || 'N1'
        };
      }

      return [
        { id: 'zone-1', state_name: 'Delhi', zone_name: 'N1' },
        { id: 'zone-2', state_name: 'Maharashtra', zone_name: 'W1' },
        { id: 'zone-3', state_name: 'Karnataka', zone_name: 'S1' },
        { id: 'zone-4', state_name: 'West Bengal', zone_name: 'E' },
        { id: 'zone-5', state_name: 'Assam', zone_name: 'NE' },
        { id: 'zone-6', state_name: 'Madhya Pradesh', zone_name: 'C' }
      ];
    }

    if (endpoint.includes('/ndr')) {
      if (options.method === 'POST') {
        let bodyData: any = {};
        try {
          if (options.body && typeof options.body === 'string') {
            bodyData = JSON.parse(options.body);
          }
        } catch (e) {}

        return {
          success: true,
          message: `NDR Action '${bodyData.action || 'REATTEMPT'}' recorded successfully`,
          shipment: {
            id: 'ndr-1',
            internal_status: bodyData.action === 'RTO' ? 'RTO' : 'IN_TRANSIT'
          }
        };
      }

      return [
        {
          id: 'ndr-1',
          awb_number: 'DELH88291034',
          internal_status: 'EXCEPTION',
          courier_status: 'Undelivered: Customer Premises Closed',
          remarks: 'Customer premises closed. Gate locked upon arrival.',
          delivery_attempt: 1,
          receiver_name: 'Rahul Sharma',
          receiver_phone: '+91 9876543210',
          receiver_address: '102 Green Heights, Andheri East',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400069',
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

      if (endpoint.includes('/generate')) {
        const shipments = getDemoShipments();
        const subtotal = shipments.reduce((sum: number, s: any) => sum + (s.client_charge || 0), 0) || 480;
        const total_fsc = Math.round(subtotal * 0.10);
        const total_idc = Math.round(subtotal * 0.02);
        const total_oda = 0;
        const total_green_tax = 30;
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

        const newInvoice = {
          id: 'inv-' + Date.now(),
          client_id: bodyData.clientId || 'client-1',
          invoice_number: 'INV-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000),
          invoice_date: new Date().toISOString(),
          due_date: new Date(Date.now() + 15 * 86400000).toISOString(),
          shipment_count: shipments.length,
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
          shipments: shipments
        };

        const list = getDemoInvoices();
        saveDemoInvoices([newInvoice, ...list]);
        return newInvoice;
      }

      if (endpoint.match(/\/invoices\/[^\/]+/)) {
        const parts = endpoint.split('/');
        const invId = parts[parts.length - 1];
        const list = getDemoInvoices();
        const found = list.find((i: any) => i.id === invId || i.invoice_number === invId);
        return found || list[0];
      }

      return getDemoInvoices();
    }

    if (endpoint.includes('/warehouses')) {
      if (options.method === 'POST') {
        let bodyData: any = {};
        try {
          if (options.body && typeof options.body === 'string') {
            bodyData = JSON.parse(options.body);
          }
        } catch (e) {}

        const list = getDemoWarehouses();
        const newWh = {
          id: 'wh-' + Date.now(),
          facility_name: bodyData.facility_name || 'New Pickup Location',
          contact_person: bodyData.contact_person || '',
          contact_phone: bodyData.contact_phone || '',
          email: bodyData.email || '',
          address_line: bodyData.address_line || '',
          pincode: bodyData.pincode || '',
          city: bodyData.city || 'Mumbai',
          state: bodyData.state || 'Maharashtra',
          default_pickup_slot: bodyData.default_pickup_slot || '10:00 AM - 01:00 PM',
          working_days: Array.isArray(bodyData.working_days) ? bodyData.working_days.join(',') : bodyData.working_days,
          status: 'ACTIVE',
          created_at: new Date().toISOString()
        };
        const updated = [newWh, ...list];
        saveDemoWarehouses(updated);
        return newWh;
      }

      if (options.method === 'PUT') {
        let bodyData: any = {};
        try {
          if (options.body && typeof options.body === 'string') {
            bodyData = JSON.parse(options.body);
          }
        } catch (e) {}

        const parts = endpoint.split('/');
        const whId = parts[parts.length - 1];
        const list = getDemoWarehouses();
        const idx = list.findIndex((w: any) => w.id === whId);

        if (idx !== -1) {
          list[idx] = { ...list[idx], ...bodyData };
          saveDemoWarehouses(list);
          return list[idx];
        }
      }

      return getDemoWarehouses();
    }

    if (endpoint.includes('/pickups')) {
      if (options.method === 'POST') {
        let bodyData: any = {};
        try {
          if (options.body && typeof options.body === 'string') {
            bodyData = JSON.parse(options.body);
          }
        } catch (e) {}

        const list = getDemoPickups();
        const newPk = {
          id: 'pk-' + Date.now(),
          pickup_id: String(314900000 + list.length + Math.floor(Math.random() * 900)),
          facility_name: bodyData.facility_name || '276001 - PROSTARM INFO',
          pickup_date: bodyData.pickup_date || new Date().toISOString(),
          pickup_slot: bodyData.pickup_slot || '14:00:00 - 18:00:00',
          box_count: Number(bodyData.box_count) || 1,
          status: 'Scheduled',
          escalated: false,
          otp_verified: false,
          created_at: new Date().toISOString()
        };
        const updated = [newPk, ...list];
        saveDemoPickups(updated);
        return newPk;
      }

      if (options.method === 'PUT') {
        let bodyData: any = {};
        try {
          if (options.body && typeof options.body === 'string') {
            bodyData = JSON.parse(options.body);
          }
        } catch (e) {}

        const parts = endpoint.split('/');
        const pkId = parts[2];
        const list = getDemoPickups();
        const idx = list.findIndex((p: any) => p.id === pkId || p.pickup_id === pkId);

        if (idx !== -1) {
          list[idx] = { ...list[idx], ...bodyData };
          saveDemoPickups(list);
          return list[idx];
        }
      }

      return getDemoPickups();
    }

    return null;
  }
};
