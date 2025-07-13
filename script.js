// Global variables
let currentUser = null;
let currentRole = 'admin';
let currentEditId = null;
let saleItems = [];

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default for date inputs
    const today = new Date().toISOString().split('T')[0];
    const dateFromInput = document.getElementById('dateFrom');
    const dateToInput = document.getElementById('dateTo');
    
    if (dateFromInput) dateFromInput.value = today;
    if (dateToInput) dateToInput.value = today;
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Load initial data
    loadDashboardData();
});

// Initialize event listeners
function initializeEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Modal forms
    const addMedicineForm = document.getElementById('addMedicineForm');
    const addCustomerForm = document.getElementById('addCustomerForm');
    const addUserForm = document.getElementById('addUserForm');
    const saleForm = document.getElementById('saleForm');
    
    if (addMedicineForm) addMedicineForm.addEventListener('submit', handleAddMedicine);
    if (addCustomerForm) addCustomerForm.addEventListener('submit', handleAddCustomer);
    if (addUserForm) addUserForm.addEventListener('submit', handleAddUser);
    if (saleForm) saleForm.addEventListener('submit', handleSale);
    
    // Search functionality
    const inventorySearch = document.getElementById('inventorySearch');
    const customerSearch = document.getElementById('customerSearch');
    const userSearch = document.getElementById('userSearch');
    
    if (inventorySearch) inventorySearch.addEventListener('input', searchInventory);
    if (customerSearch) customerSearch.addEventListener('input', searchCustomers);
    if (userSearch) userSearch.addEventListener('input', searchUsers);
    
    // Medicine selection change for sales
    const medicineSelect = document.getElementById('medicineId');
    if (medicineSelect) {
        medicineSelect.addEventListener('change', updatePriceDisplay);
    }
    
    // Quantity change for sales
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        quantityInput.addEventListener('input', calculateTotal);
    }
    
    // Close modals when clicking outside
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });
    
    // Close modals when clicking close button
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
}

// Authentication functions
function selectRole(role) {
    currentRole = role;
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
    const selectedBtn = document.querySelector(`[onclick="selectRole('${role}')"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
}

function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Send login request to PHP
    fetch('api/login.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password,
            role: currentRole
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUser = data.user;
            showMainApp();
            updateUserInterface();
            loadDashboardData();
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('Login failed. Please try again.', 'error');
    });
}

function logout() {
    fetch('api/logout.php', {
        method: 'POST'
    })
    .then(() => {
        currentUser = null;
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('loginForm').reset();
    })
    .catch(error => {
        console.error('Logout error:', error);
        // Force logout even if request fails
        currentUser = null;
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('loginForm').reset();
    });
}

// UI functions
function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
}

function updateUserInterface() {
    const currentUserElement = document.getElementById('currentUser');
    if (currentUserElement) {
        currentUserElement.textContent = `Welcome, ${currentUser.full_name}`;
    }
    
    // Hide sections based on role
    if (currentUser.role !== 'admin') {
        const usersLink = document.getElementById('usersLink');
        const usersSection = document.getElementById('users');
        if (usersLink) usersLink.style.display = 'none';
        if (usersSection) usersSection.style.display = 'none';
    }
    
    if (currentUser.role === 'cashier') {
        const suppliersSection = document.getElementById('suppliers');
        const suppliersLink = document.querySelector('[onclick="showSection(\'suppliers\')"]');
        if (suppliersSection) suppliersSection.style.display = 'none';
        if (suppliersLink) suppliersLink.style.display = 'none';
    }
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const selectedLink = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (selectedLink) {
        selectedLink.classList.add('active');
    }
    
    // Load section data
    loadSectionData(sectionId);
}

function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'inventory':
            loadInventoryData();
            break;
        case 'sales':
            loadSalesData();
            break;
        case 'prescriptions':
            loadPrescriptionsData();
            break;
        case 'customers':
            loadCustomersData();
            break;
        case 'suppliers':
            loadSuppliersData();
            break;
        case 'users':
            loadUsersData();
            break;
    }
}

// Dashboard functions
function loadDashboardData() {
    fetch('api/dashboard.php')
        .then(response => response.json())
        .then(data => {
            const totalSalesElement = document.getElementById('totalSales');
            const totalProductsElement = document.getElementById('totalProducts');
            const lowStockItemsElement = document.getElementById('lowStockItems');
            const prescriptionsTodayElement = document.getElementById('prescriptionsToday');
            
            if (totalSalesElement) totalSalesElement.textContent = `$${data.totalSales || 0}`;
            if (totalProductsElement) totalProductsElement.textContent = data.totalProducts || 0;
            if (lowStockItemsElement) lowStockItemsElement.textContent = data.lowStockItems || 0;
            if (prescriptionsTodayElement) prescriptionsTodayElement.textContent = data.prescriptionsToday || 0;
            
            // Load recent activities
            if (data.recentActivities) {
                loadRecentActivities(data.recentActivities);
            }
        })
        .catch(error => console.error('Error loading dashboard:', error));
}

function loadRecentActivities(activities) {
    const tbody = document.getElementById('recentActivities');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    activities.forEach(activity => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${activity.time}</td>
            <td>${activity.activity}</td>
            <td>${activity.user}</td>
            <td><span class="status-${activity.status}">${activity.status}</span></td>
        `;
    });
}

// Inventory functions
function loadInventoryData() {
    fetch('api/inventory.php')
        .then(response => response.json())
        .then(data => {
            displayInventoryTable(data);
        })
        .catch(error => console.error('Error loading inventory:', error));
}

function displayInventoryTable(medicines) {
    const tbody = document.getElementById('inventoryTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    medicines.forEach(medicine => {
        const row = tbody.insertRow();
        const status = getStockStatus(medicine.quantity, medicine.min_stock);
        const expiryStatus = getExpiryStatus(medicine.expiry_date);
        
        row.innerHTML = `
            <td>${medicine.name}</td>
            <td>${medicine.batch_number}</td>
            <td>${medicine.quantity}</td>
            <td>$${medicine.price}</td>
            <td>${medicine.expiry_date}</td>
            <td><span class="status-${status}">${status}</span></td>
            <td>
                <button class="btn btn-secondary" onclick="editMedicine(${medicine.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteMedicine(${medicine.id})">Delete</button>
            </td>
        `;
    });
}

function getStockStatus(quantity, minStock) {
    if (quantity <= minStock) return 'low';
    return 'normal';
}

function getExpiryStatus(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'expiring';
    return 'normal';
}

function handleAddMedicine(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const medicineData = {
        name: formData.get('medicineName'),
        batch_number: formData.get('batchNumber'),
        quantity: formData.get('medicineQuantity'),
        price: formData.get('medicinePrice'),
        expiry_date: formData.get('expiryDate'),
        min_stock: formData.get('minStock') || 10
    };
    
    const url = currentEditId ? `api/update_medicine.php?id=${currentEditId}` : 'api/add_medicine.php';
    
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(medicineData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert(currentEditId ? 'Medicine updated successfully!' : 'Medicine added successfully!', 'success');
            closeModal('addMedicineModal');
            loadInventoryData();
            event.target.reset();
            currentEditId = null;
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('Failed to save medicine.', 'error');
    });
}

function editMedicine(id) {
    currentEditId = id;
    fetch(`api/get_medicine.php?id=${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const medicine = data.medicine;
                document.getElementById('medicineName').value = medicine.name;
                document.getElementById('batchNumber').value = medicine.batch_number;
                document.getElementById('medicineQuantity').value = medicine.quantity;
                document.getElementById('medicinePrice').value = medicine.price;
                document.getElementById('expiryDate').value = medicine.expiry_date;
                document.getElementById('minStock').value = medicine.min_stock || 10;
                
                openModal('addMedicineModal');
            } else {
                showAlert(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Failed to load medicine data.', 'error');
        });
}

function deleteMedicine(id) {
    if (confirm('Are you sure you want to delete this medicine?')) {
        fetch(`api/delete_medicine.php?id=${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('Medicine deleted successfully!', 'success');
                loadInventoryData();
            } else {
                showAlert(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Failed to delete medicine.', 'error');
        });
    }
}

function searchInventory() {
    const searchTerm = document.getElementById('inventorySearch').value.toLowerCase();
    const rows = document.querySelectorAll('#inventoryTable tr');
    
    rows.forEach(row => {
        const medicineName = row.cells[0].textContent.toLowerCase();
        const batchNumber = row.cells[1].textContent.toLowerCase();
        
        if (medicineName.includes(searchTerm) || batchNumber.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Sales functions
function loadSalesData() {
    fetch('api/sales.php')
        .then(response => response.json())
        .then(data => {
            displaySalesTable(data.sales);
            populateCustomerDropdown(data.customers);
            populateMedicineDropdown(data.medicines);
        })
        .catch(error => console.error('Error loading sales:', error));
}

function displaySalesTable(sales) {
    const tbody = document.getElementById('salesTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    sales.forEach(sale => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${sale.date}</td>
            <td>${sale.customer_name}</td>
            <td>${sale.medicine_name}</td>
            <td>${sale.quantity}</td>
            <td>$${sale.total}</td>
            <td>${sale.payment_method}</td>
            <td>
                <button class="btn btn-secondary" onclick="viewSale(${sale.id})">View</button>
                <button class="btn btn-secondary" onclick="printReceipt(${sale.id})">Print</button>
            </td>
        `;
    });
}

function populateCustomerDropdown(customers) {
    const select = document.getElementById('customerId');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Customer</option>';
    
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = customer.name;
        select.appendChild(option);
    });
}

function populateMedicineDropdown(medicines) {
    const select = document.getElementById('medicineId');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Medicine</option>';
    
    medicines.forEach(medicine => {
        const option = document.createElement('option');
        option.value = medicine.id;
        option.textContent = `${medicine.name} - $${medicine.price}`;
        option.dataset.price = medicine.price;
        option.dataset.stock = medicine.quantity;
        select.appendChild(option);
    });
}

function updatePriceDisplay() {
    const select = document.getElementById('medicineId');
    const priceDisplay = document.getElementById('priceDisplay');
    const quantityInput = document.getElementById('quantity');
    
    if (select && priceDisplay) {
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption.dataset.price) {
            priceDisplay.textContent = `$${selectedOption.dataset.price}`;
            priceDisplay.dataset.price = selectedOption.dataset.price;
            priceDisplay.dataset.stock = selectedOption.dataset.stock;
            
            // Update quantity max
            if (quantityInput) {
                quantityInput.max = selectedOption.dataset.stock;
            }
        } else {
            priceDisplay.textContent = '';
            priceDisplay.dataset.price = '';
            priceDisplay.dataset.stock = '';
        }
    }
    
    calculateTotal();
}

function calculateTotal() {
    const priceDisplay = document.getElementById('priceDisplay');
    const quantityInput = document.getElementById('quantity');
    const totalDisplay = document.getElementById('totalDisplay');
    
    if (priceDisplay && quantityInput && totalDisplay) {
        const price = parseFloat(priceDisplay.dataset.price) || 0;
        const quantity = parseInt(quantityInput.value) || 0;
        const total = price * quantity;
        
        totalDisplay.textContent = `$${total.toFixed(2)}`;
    }
}

function handleSale(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const saleData = {
        customer_id: formData.get('customerId'),
        medicine_id: formData.get('medicineId'),
        quantity: formData.get('quantity'),
        payment_method: formData.get('paymentMethod')
    };
    
    // Validate stock
    const medicineSelect = document.getElementById('medicineId');
    const selectedOption = medicineSelect.options[medicineSelect.selectedIndex];
    const availableStock = parseInt(selectedOption.dataset.stock) || 0;
    const requestedQuantity = parseInt(saleData.quantity) || 0;
    
    if (requestedQuantity > availableStock) {
        showAlert(`Insufficient stock. Available: ${availableStock}`, 'error');
        return;
    }
    
    fetch('api/process_sale.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Sale processed successfully!', 'success');
            updateSaleSummary(data.sale);
            loadSalesData();
            loadDashboardData();
            loadInventoryData(); // Refresh inventory to show updated stock
            event.target.reset();
            
            // Reset price display
            const priceDisplay = document.getElementById('priceDisplay');
            const totalDisplay = document.getElementById('totalDisplay');
            if (priceDisplay) priceDisplay.textContent = '';
            if (totalDisplay) totalDisplay.textContent = '';
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('Failed to process sale.', 'error');
    });
}

function updateSaleSummary(sale) {
    const subtotalElement = document.getElementById('subtotal');
    const taxElement = document.getElementById('tax');
    const totalElement = document.getElementById('total');
    
    if (subtotalElement) subtotalElement.textContent = `$${sale.subtotal}`;
    if (taxElement) taxElement.textContent = `$${sale.tax}`;
    if (totalElement) totalElement.textContent = `$${sale.total}`;
}

function viewSale(id) {
    fetch(`api/get_sale.php?id=${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const sale = data.sale;
                alert(`Sale Details:\nCustomer: ${sale.customer_name}\nMedicine: ${sale.medicine_name}\nQuantity: ${sale.quantity}\nTotal: $${sale.total}\nPayment: ${sale.payment_method}\nDate: ${sale.date}`);
            } else {
                showAlert(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Failed to load sale details.', 'error');
        });
}

function printReceipt(id) {
    fetch(`api/get_sale.php?id=${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const sale = data.sale;
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Receipt - Sale #${id}</title>
                            <style>
                                body { font-family: Arial, sans-serif; margin: 20px; }
                                .header { text-align: center; margin-bottom: 20px; }
                                .details { margin-bottom: 20px; }
                                .total { font-weight: bold; font-size: 18px; }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                <h2>Pharmacy Receipt</h2>
                                <p>Sale #${id}</p>
                            </div>
                            <div class="details">
                                <p><strong>Customer:</strong> ${sale.customer_name}</p>
                                <p><strong>Medicine:</strong> ${sale.medicine_name}</p>
                                <p><strong>Quantity:</strong> ${sale.quantity}</p>
                                <p><strong>Unit Price:</strong> $${sale.unit_price}</p>
                                <p><strong>Payment Method:</strong> ${sale.payment_method}</p>
                                <p><strong>Date:</strong> ${sale.date}</p>
                            </div>
                            <div class="total">
                                <p>Total: $${sale.total}</p>
                            </div>
                        </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.print();
            } else {
                showAlert(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Failed to load receipt.', 'error');
        });
}

// Prescriptions functions
function loadPrescriptionsData() {
    fetch('api/prescriptions.php')
        .then(response => response.json())
        .then(data => {
            displayPrescriptionsTable(data);
        })
        .catch(error => console.error('Error loading prescriptions:', error));
}

function displayPrescriptionsTable(prescriptions) {
    const tbody = document.getElementById('prescriptionsTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    prescriptions.forEach(prescription => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${prescription.date}</td>
            <td>${prescription.customer_name}</td>
            <td>${prescription.doctor_name}</td>
            <td>${prescription.medicine_name}</td>
            <td>${prescription.dosage}</td>
            <td><span class="status-${prescription.status}">${prescription.status}</span></td>
            <td>
                <button class="btn btn-secondary" onclick="viewPrescription(${prescription.id})">View</button>
                <button class="btn btn-success" onclick="fillPrescription(${prescription.id})">Fill</button>
            </td>
        `;
    });
}

function viewPrescription(id) {
    fetch(`api/get_prescription.php?id=${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const prescription = data.prescription;
                alert(`Prescription Details:\nCustomer: ${prescription.customer_name}\nDoctor: ${prescription.doctor_name}\nMedicine: ${prescription.medicine_name}\nDosage: ${prescription.dosage}\nInstructions: ${prescription.instructions}\nStatus: ${prescription.status}\nDate: ${prescription.date}`);
            } else {
                showAlert(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Failed to load prescription details.', 'error');
        });
}

function fillPrescription(id) {
    if (confirm('Are you sure you want to fill this prescription?')) {
        fetch(`api/fill_prescription.php?id=${id}`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('Prescription filled successfully!', 'success');
                loadPrescriptionsData();
                loadDashboardData();
            } else {
                showAlert(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Failed to fill prescription.', 'error');
        });
    }
}

// Customer functions
function loadCustomersData() {
    fetch('api/customers.php')
        .then(response => response.json())
        .then(data => {
            displayCustomersTable(data);
        })
        .catch(error => console.error('Error loading customers:', error));
}

function displayCustomersTable(customers) {
    const tbody = document.getElementById('customersTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    customers.forEach(customer => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${customer.name}</td>
            <td>${customer.phone}</td>
            <td>${customer.email || 'N/A'}</td>
            <td>${customer.address || 'N/A'}</td>
            <td>${customer.insurance_provider || 'N/A'}</td>
            <td>
                <button class="btn btn-secondary" onclick="editCustomer(${customer.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteCustomer(${customer.id})">Delete</button>
            </td>
        `;
    });
}

function handleAddCustomer(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const customerData = {
        name: formData.get('customerName'),
        phone: formData.get('customerPhone'),
        email: formData.get('customerEmail'),
        address: formData.get('customerAddress'),
        insurance_provider: formData.get('insuranceProvider')
    };
    
    const url = currentEditId ? `api/update_customer.php?id=${currentEditId}` : 'api/add_customer.php';
    
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert(currentEditId ? 'Customer updated successfully!' : 'Customer added successfully!', 'success');
            closeModal('addCustomerModal');
            loadCustomersData();
            event.target.reset();
            currentEditId = null;
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('Failed to save customer.', 'error');
    });
}

function editCustomer(id) {
    currentEditId = id;
    fetch(`api/get_customer.php?id=${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const customer = data.customer;
                document.getElementById('customerName').value = customer.name;
                document.getElementById('customerPhone').value = customer.phone;
                document.getElementById('customerEmail').value = customer.email || '';
                document.getElementById('customerAddress').value = customer.address || '';
                document.getElementById('insuranceProvider').value = customer.insurance_provider || '';
                
                openModal('addCustomerModal');
            } else {
                showAlert(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Failed to load customer data.', 'error');
        });
}

function deleteCustomer(id) {
    if (confirm('Are you sure you want to delete this customer?')) {
        fetch(`api/delete_customer.php?id=${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('Customer deleted successfully!', 'success');
                loadCustomersData();
            } else {
                showAlert(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Failed to delete customer.', 'error');
        });
    }
}

function searchCustomers() {
    const searchTerm = document.getElementById('customerSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#customersTable tr');
    
    rows.forEach(row => {
        const customerName = row.cells[0].textContent.toLowerCase();
        const customerPhone = row.cells[1].textContent.toLowerCase();
        
        if (customerName.includes(searchTerm) || customerPhone.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Suppliers functions
function loadSuppliersData() {
    fetch('api/suppliers.php')
        .then(response => response.json())
        .then(data => {
            displaySuppliersTable(data);
        })
        .catch(error => console.error('Error loading suppliers:', error));
}

function displaySuppliersTable(suppliers) {
    const tbody = document.getElementById('suppliersTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    suppliers.forEach(supplier => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${supplier.name}</td>
            <td>${supplier.contact_person}</td>
            <td>${supplier.phone}</td>
            <td>${supplier.email}</td>
            <td>${supplier.products}</td>
            <td>
                <button class="btn btn-secondary" onclick="editSupplier(${supplier.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteSupplier(${supplier.id})">Delete</button>
            </td>
        `;
    });
}

// Suppliers functions continuation
function displaySuppliersTable(suppliers) {
    const tbody = document.getElementById('suppliersTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    suppliers.forEach(supplier => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${supplier.name}</td>
            <td>${supplier.contact_person}</td>
            <td>${supplier.phone}</td>
            <td>${supplier.email || 'N/A'}</td>
            <td>${supplier.address || 'N/A'}</td>
            <td>
                <button class="btn btn-secondary" onclick="editSupplier(${supplier.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteSupplier(${supplier.id})">Delete</button>
            </td>
        `;
    });
}

function handleAddSupplier(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const supplierData = {
        name: formData.get('supplierName'),
        contact_person: formData.get('contactPerson'),
        phone: formData.get('supplierPhone'),
        email: formData.get('supplierEmail'),
        address: formData.get('supplierAddress')
    };
    
    const url = currentEditId ? `api/update_supplier.php?id=${currentEditId}` : 'api/add_supplier.php';
    
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert(currentEditId ? 'Supplier updated successfully!' : 'Supplier added successfully!', 'success');
            closeModal('addSupplierModal');
            loadSuppliersData();
            event.target.reset();
            currentEditId = null;
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('Failed to save supplier.', 'error');
    });
}

function editSupplier(id) {
    currentEditId = id;
    fetch(`api/get_supplier.php?id=${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const supplier = data.supplier;
                document.getElementById('supplierName').value = supplier.name;
                document.getElementById('contactPerson').value = supplier.contact_person;
                document.getElementById('supplierPhone').value = supplier.phone;
                document.getElementById('supplierEmail').value = supplier.email || '';
                document.getElementById('supplierAddress').value = supplier.address || '';
                
                openModal('addSupplierModal');
            } else {
                showAlert(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Failed to load supplier data.', 'error');
        });
}

function deleteSupplier(id) {
    if (confirm('Are you sure you want to delete this supplier?')) {
        fetch(`api/delete_supplier.php?id=${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('Supplier deleted successfully!', 'success');
                loadSuppliersData();
            } else {
                showAlert(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Failed to delete supplier.', 'error');
        });
    }
}

function searchSuppliers() {
    const searchTerm = document.getElementById('supplierSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#suppliersTable tr');
    
    rows.forEach(row => {
        const supplierName = row.cells[0].textContent.toLowerCase();
        const contactPerson = row.cells[1].textContent.toLowerCase();
        
        if (supplierName.includes(searchTerm) || contactPerson.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Users functions
function loadUsersData() {
    fetch('api/users.php')
        .then(response => response.json())
        .then(data => {
            displayUsersTable(data);
        })
        .catch(error => console.error('Error loading users:', error));
}

function displayUsersTable(users) {
    const tbody = document.getElementById('usersTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.full_name}</td>
            <td>${user.email}</td>
            <td><span class="role-${user.role}">${user.role}</span></td>
            <td><span class="status-${user.status}">${user.status}</span></td>
            <td>
                <button class="btn btn-secondary" onclick="editUser(${user.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteUser(${user.id})">Delete</button>
                <button class="btn btn-${user.status === 'active' ? 'warning' : 'success'}" 
                        onclick="toggleUserStatus(${user.id}, '${user.status}')">
                    ${user.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
            </td>
        `;
    });
}

function handleAddUser(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = {
        username: formData.get('username'),
        full_name: formData.get('fullName'),
        email: formData.get('email'),
        role: formData.get('role'),
        password: formData.get('password')
    };
    
    const url = currentEditId ? `api/update_user.php?id=${currentEditId}` : 'api/add_user.php';
    
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert(currentEditId ? 'User updated successfully!' : 'User added successfully!', 'success');
            closeModal('addUserModal');
            loadUsersData();
            event.target.reset();
            currentEditId = null;
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('Failed to save user.', 'error');
    });
}

function editUser(id) {
    currentEditId = id;
    fetch(`api/get_user.php?id=${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const user = data.user;
                document.getElementById('username').value = user.username;
                document.getElementById('fullName').value = user.full_name;
                document.getElementById('email').value = user.email;
                document.getElementById('role').value = user.role;
                
                // Hide password field for editing
                const passwordField = document.getElementById('password');
                if (passwordField) {
                    passwordField.style.display = 'none';
                    passwordField.required = false;
                }
                
                openModal('addUserModal');
            } else {
                showAlert(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Failed to load user data.', 'error');
        });
}

function deleteUser(id) {
    if (confirm('Are you sure you want to delete this user?')) {
        fetch(`api/delete_user.php?id=${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('User deleted successfully!', 'success');
                loadUsersData();
            } else {
                showAlert(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Failed to delete user.', 'error');
        });
    }
}

function toggleUserStatus(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    fetch(`api/toggle_user_status.php?id=${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`, 'success');
            loadUsersData();
        } else {
            showAlert(data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('Failed to update user status.', 'error');
    });
}

function searchUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#usersTable tr');
    
    rows.forEach(row => {
        const username = row.cells[0].textContent.toLowerCase();
        const fullName = row.cells[1].textContent.toLowerCase();
        const email = row.cells[2].textContent.toLowerCase();
        
        if (username.includes(searchTerm) || fullName.includes(searchTerm) || email.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Reports functions
function generateSalesReport() {
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
    
    if (!dateFrom || !dateTo) {
        showAlert('Please select both start and end dates.', 'error');
        return;
    }
    
    fetch(`api/reports/sales_report.php?dateFrom=${dateFrom}&dateTo=${dateTo}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displaySalesReport(data.report);
            } else {
                showAlert(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Failed to generate sales report.', 'error');
        });
}

function displaySalesReport(report) {
    const reportContainer = document.getElementById('reportContainer');
    if (!reportContainer) return;
    
    reportContainer.innerHTML = `
        <div class="report-header">
            <h3>Sales Report</h3>
            <p>Period: ${report.dateFrom} to ${report.dateTo}</p>
        </div>
        <div class="report-summary">
            <div class="summary-item">
                <h4>Total Sales</h4>
                <p>$${report.totalSales}</p>
            </div>
            <div class="summary-item">
                <h4>Total Transactions</h4>
                <p>${report.totalTransactions}</p>
            </div>
            <div class="summary-item">
                <h4>Average Sale</h4>
                <p>$${report.averageSale}</p>
            </div>
        </div>
        <div class="report-details">
            <h4>Top Selling Medicines</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Medicine</th>
                        <th>Quantity Sold</th>
                        <th>Total Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.topMedicines.map(medicine => `
                        <tr>
                            <td>${medicine.name}</td>
                            <td>${medicine.quantity}</td>
                            <td>$${medicine.revenue}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function generateInventoryReport() {
    fetch('api/reports/inventory_report.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayInventoryReport(data.report);
            } else {
                showAlert(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Failed to generate inventory report.', 'error');
        });
}

function displayInventoryReport(report) {
    const reportContainer = document.getElementById('reportContainer');
    if (!reportContainer) return;
    
    reportContainer.innerHTML = `
        <div class="report-header">
            <h3>Inventory Report</h3>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="report-summary">
            <div class="summary-item">
                <h4>Total Items</h4>
                <p>${report.totalItems}</p>
            </div>
            <div class="summary-item">
                <h4>Low Stock Items</h4>
                <p>${report.lowStockItems}</p>
            </div>
            <div class="summary-item">
                <h4>Expired Items</h4>
                <p>${report.expiredItems}</p>
            </div>
        </div>
        <div class="report-details">
            <h4>Items Requiring Attention</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Medicine</th>
                        <th>Current Stock</th>
                        <th>Min Stock</th>
                        <th>Expiry Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.attentionItems.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>${item.min_stock}</td>
                            <td>${item.expiry_date}</td>
                            <td><span class="status-${item.status}">${item.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function printReport() {
    const reportContainer = document.getElementById('reportContainer');
    if (!reportContainer || !reportContainer.innerHTML.trim()) {
        showAlert('No report to print. Please generate a report first.', 'error');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Pharmacy Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .report-header { text-align: center; margin-bottom: 30px; }
                    .report-summary { display: flex; justify-content: space-around; margin-bottom: 30px; }
                    .summary-item { text-align: center; }
                    .summary-item h4 { margin: 0; color: #333; }
                    .summary-item p { margin: 5px 0; font-size: 24px; font-weight: bold; }
                    .report-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    .report-table th, .report-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .report-table th { background-color: #f2f2f2; }
                    .status-low { color: #ff6b6b; }
                    .status-expired { color: #ff4757; }
                    .status-normal { color: #2ed573; }
                </style>
            </head>
            <body>
                ${reportContainer.innerHTML}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        
        // Reset password field visibility for user modal
        if (modalId === 'addUserModal' && !currentEditId) {
            const passwordField = document.getElementById('password');
            if (passwordField) {
                passwordField.style.display = 'block';
                passwordField.required = true;
            }
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        
        // Reset form
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
        
        // Reset edit state
        currentEditId = null;
        
        // Reset displays for sale form
        if (modalId === 'saleModal') {
            const priceDisplay = document.getElementById('priceDisplay');
            const totalDisplay = document.getElementById('totalDisplay');
            if (priceDisplay) priceDisplay.textContent = '';
            if (totalDisplay) totalDisplay.textContent = '';
        }
    }
}

// Utility functions
function showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // Style the alert
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.padding = '15px 20px';
    alert.style.borderRadius = '5px';
    alert.style.zIndex = '9999';
    alert.style.minWidth = '300px';
    alert.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    
    // Set colors based on type
    switch(type) {
        case 'success':
            alert.style.backgroundColor = '#d4edda';
            alert.style.color = '#155724';
            alert.style.border = '1px solid #c3e6cb';
            break;
        case 'error':
            alert.style.backgroundColor = '#f8d7da';
            alert.style.color = '#721c24';
            alert.style.border = '1px solid #f5c6cb';
            break;
        case 'warning':
            alert.style.backgroundColor = '#fff3cd';
            alert.style.color = '#856404';
            alert.style.border = '1px solid #ffeaa7';
            break;
        default:
            alert.style.backgroundColor = '#d1ecf1';
            alert.style.color = '#0c5460';
            alert.style.border = '1px solid #bee5eb';
    }
    
    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.float = 'right';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.marginLeft = '15px';
    closeBtn.onclick = () => alert.remove();
    
    alert.appendChild(closeBtn);
    document.body.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^\+?[\d\s\-\(\)]+$/;
    return re.test(phone) && phone.length >= 10;
}

// Export functions for external use
window.pharmacyApp = {
    selectRole,
    showSection,
    openModal,
    closeModal,
    editMedicine,
    deleteMedicine,
    editCustomer,
    deleteCustomer,
    editSupplier,
    deleteSupplier,
    editUser,
    deleteUser,
    toggleUserStatus,
    viewSale,
    printReceipt,
    viewPrescription,
    fillPrescription,
    generateSalesReport,
    generateInventoryReport,
    printReport,
    logout
};