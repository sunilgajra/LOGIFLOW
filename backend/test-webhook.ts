import http from 'http';

const testPayload = JSON.stringify({
  ScanDetail: {
    Waybill: "DELH88291034",
    ScanDateTime: new Date().toISOString(),
    ScanType: "UD",
    Scan: "Out for Delivery",
    Status: {
      Status: "Out For Delivery",
      Instructions: "Shipment loaded in delivery van for morning delivery"
    },
    ScannedLocation: "Mumbai_Andheri_Hub"
  }
});

console.log("Sending Webhook payload to localhost:5000/api/webhooks/delhivery...");

const req = http.request('http://localhost:5000/api/webhooks/delhivery', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testPayload)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Response Status:", res.statusCode);
    console.log("Response Body:", data);
  });
});

req.on('error', (err) => {
  console.error("HTTP Request Error:", err.message);
});

req.write(testPayload);
req.end();
