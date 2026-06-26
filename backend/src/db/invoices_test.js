const API_URL = 'http://localhost:5000/api';

async function runInvoicesTest() {
  try {
    console.log('--- Starting Invoices API Integration Test ---');

    // 1. Login as Admin
    console.log('1. Logging in as Admin...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'password'
      })
    });
    const loginJson = await loginRes.json();
    if (!loginJson.success) throw new Error('Login failed: ' + JSON.stringify(loginJson));
    const token = loginJson.data.token;
    console.log('   Logged in successfully!');

    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    };

    // 2. Fetch current invoices
    console.log('2. Fetching current invoices list...');
    const listRes1 = await fetch(`${API_URL}/invoices`, { headers });
    const listJson1 = await listRes1.json();
    console.log('listJson1:', listJson1);
    console.log(`   Fetched ${listJson1.data?.length} invoices.`);
    console.log('   Initial Invoices:', listJson1.data.map(i => i.invoice_number));

    // 3. Create a new invoice
    const testInvoiceNum = 'INV-TEST-' + Date.now();
    console.log(`3. Creating a new invoice: ${testInvoiceNum}...`);
    const createRes = await fetch(`${API_URL}/invoices`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        invoice_number: testInvoiceNum,
        transporter_id: 1, // Highway Pioneers
        amount: 250000.00,
        paid_amount: 100000.00,
        payment_date: '2026-06-25',
        status: 'PARTIALLY_PAID',
        dispute_reason: null
      })
    });
    const createJson = await createRes.json();
    if (!createJson.success) throw new Error('Create failed: ' + JSON.stringify(createJson));
    const createdInvoice = createJson.data;
    console.log('   Invoice created successfully:', createdInvoice);

    // 4. Update the invoice to DISPUTED
    console.log(`4. Updating invoice ${testInvoiceNum} to DISPUTED status...`);
    const updateRes = await fetch(`${API_URL}/invoices/${createdInvoice.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        invoice_number: testInvoiceNum,
        transporter_id: 1,
        amount: 250000.00,
        paid_amount: 0.00,
        payment_date: null,
        status: 'DISPUTED',
        dispute_reason: 'Disputed fuel surcharge hike'
      })
    });
    const updateJson = await updateRes.json();
    if (!updateJson.success) throw new Error('Update failed: ' + JSON.stringify(updateJson));
    const updatedInvoice = updateJson.data;
    console.log('   Invoice updated successfully:', updatedInvoice);

    // 5. Fetch logs to verify logs exist
    console.log('5. Verifying audit logs for invoice actions...');
    const logsRes = await fetch(`${API_URL}/admin/logs`, { headers });
    const logsJson = await logsRes.json();
    const logs = logsJson.data;
    
    console.log('   Latest Audit Logs:');
    logs.slice(0, 5).forEach(log => {
      console.log(`   [${log.action_type}] (${log.username}): ${log.details}`);
    });

    // Check if INVOICE_CREATE and INVOICE_UPDATE are in the logs
    const hasCreateLog = logs.some(l => l.action_type === 'INVOICE_CREATE' && l.details.includes(testInvoiceNum));
    const hasUpdateLog = logs.some(l => l.action_type === 'INVOICE_UPDATE' && l.details.includes(testInvoiceNum));
    
    console.log('   Has INVOICE_CREATE log:', hasCreateLog);
    console.log('   Has INVOICE_UPDATE log:', hasUpdateLog);

    // 6. Delete invoice
    console.log(`6. Deleting test invoice ${testInvoiceNum}...`);
    const deleteRes = await fetch(`${API_URL}/invoices/${createdInvoice.id}`, {
      method: 'DELETE',
      headers
    });
    const deleteJson = await deleteRes.json();
    console.log('   Delete response:', deleteJson.message);

    // Check delete log
    const logsRes2 = await fetch(`${API_URL}/admin/logs`, { headers });
    const logsJson2 = await logsRes2.json();
    const hasDeleteLog = logsJson2.data.some(l => l.action_type === 'INVOICE_DELETE' && l.details.includes(testInvoiceNum));
    console.log('   Has INVOICE_DELETE log:', hasDeleteLog);

    console.log('--- Invoices API Integration Test Passed! ---');
  } catch (err) {
    console.error('Test failed with error:', err.message);
  }
}

runInvoicesTest();
