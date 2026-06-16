const ORDER_STORAGE_KEY = 'htws_orders_v1';
const WEBSITE_STORAGE_KEY = 'htws_websites_v1';

// --- HTWS_Storage: Handles LocalStorage for MVP ---
const HTWS_Storage = {
    init: function() {
        if (!localStorage.getItem(ORDER_STORAGE_KEY)) localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify([]));
        if (!localStorage.getItem(WEBSITE_STORAGE_KEY)) localStorage.setItem(WEBSITE_STORAGE_KEY, JSON.stringify([]));
    },
    getOrders: function() {
        return JSON.parse(localStorage.getItem(ORDER_STORAGE_KEY) || '[]');
    },
    saveOrder: function(order) {
        const orders = this.getOrders();
        orders.push(order);
        localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
    },
    updateOrder: function(updatedOrder) {
        let orders = this.getOrders();
        const idx = orders.findIndex(o => o.id === updatedOrder.id);
        if (idx !== -1) {
            orders[idx] = updatedOrder;
            localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
        }
    },
    getWebsites: function() {
        return JSON.parse(localStorage.getItem(WEBSITE_STORAGE_KEY) || '[]');
    },
    saveWebsite: function(website) {
        const websites = this.getWebsites();
        websites.push(website);
        localStorage.setItem(WEBSITE_STORAGE_KEY, JSON.stringify(websites));
    },
    createCustomerIfNeeded: function(email, name, wa) {
        const sessionKey = 'webkilat_session_v1';
        let currentUser = null;
        try { currentUser = JSON.parse(localStorage.getItem(sessionKey)); } catch(e){}
        
        if (currentUser && currentUser.id && currentUser.role === 'customer') {
            return currentUser.id;
        }

        // Generate ID
        const newCustId = 'cust_' + Math.random().toString(36).substr(2, 6);
        const newCust = {
            id: newCustId,
            username: email,
            password: "customer123", // Dummy for MVP
            role: "customer",
            verifiedCustomer: true, // We assume valid since they're ordering
            customerStatus: "lead",
            displayName: name || email.split('@')[0],
            permissions: ["view_dashboard"]
        };

        // For MVP, auto-login the user immediately
        localStorage.setItem(sessionKey, JSON.stringify(newCust));
        
        // Also update appState user if it exists in global scope
        if (typeof appState !== 'undefined') {
            appState.user = newCust;
            if (typeof updateAuthUI === 'function') updateAuthUI();
        }
        
        return newCustId;
    }
};

// --- PricingEngine ---
const PricingEngine = {
    domainPrices: {
        '.com': 150000,
        '.id': 250000,
        '.co.id': 300000
    },
    base: {
        setupFee: 500000,
        hostingPerYear: 500000,
        templatePerYear: 300000,
        supportPerYear: 200000
    },
    discounts: {
        1: 0,
        2: 200000,  // Discount for 2 years
        3: 500000   // Discount for 3 years
    },
    calculateTotal: function(domainExt, years) {
        const ext = domainExt ? domainExt.toLowerCase() : '.com';
        const domainPrice = this.domainPrices[ext] || 150000;
        
        const recurringPerYear = domainPrice + this.base.hostingPerYear + this.base.templatePerYear + this.base.supportPerYear;
        const discount = this.discounts[years] || 0;
        
        const total = this.base.setupFee + (recurringPerYear * years) - discount;
        
        return {
            total: total,
            renewalTotal: recurringPerYear,
            breakdown: {
                setupFee: this.base.setupFee,
                domainPricePerYear: domainPrice,
                hostingPricePerYear: this.base.hostingPerYear,
                templatePricePerYear: this.base.templatePerYear,
                supportPricePerYear: this.base.supportPerYear,
                discount: discount
            }
        };
    },
    formatRp: function(num) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
    }
};

// --- WizardState & Controller ---
const WizardState = {
    currentStep: 1,
    domain: {
        name: '',
        ext: '.com',
        fullDomain: '',
        available: false
    },
    template: null, // Will be populated when opening order page
    customer: {
        name: '',
        email: '',
        wa: '',
        businessName: '',
        businessCategory: '',
        businessAddress: '',
        notes: ''
    },
    durationYears: 2, // Default to recommended
    proofFileName: null,
    proofStatus: 'none', // none, uploaded
    proofUploadedAt: null
};

// Initialize Storage
HTWS_Storage.init();

function renderWizardStep() {
    const container = document.getElementById('wizard-steps-container');
    if (!container) return;

    let html = '';
    const step = WizardState.currentStep;

    if (step === 1) {
        // Step 1: Domain
        html = `
        <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 class="text-lg font-bold text-slate-900 mb-6 flex items-center">
                <div class="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mr-3 text-sm">1</div> 
                Pilih Domain Anda
            </h3>
            <div class="space-y-4">
                <label class="block text-sm font-bold text-slate-700 mb-2">Cari Nama Domain *</label>
                <div class="flex flex-col sm:flex-row gap-2">
                    <input type="text" id="wiz-domain-name" placeholder="contoh: bisnisku" class="flex-grow px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" value="${WizardState.domain.name}">
                    <select id="wiz-domain-ext" class="px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none">
                        <option value=".com" ${WizardState.domain.ext==='.com'?'selected':''}>.com (Rp 150rb)</option>
                        <option value=".id" ${WizardState.domain.ext==='.id'?'selected':''}>.id (Rp 250rb)</option>
                        <option value=".co.id" ${WizardState.domain.ext==='.co.id'?'selected':''}>.co.id (Rp 300rb)</option>
                    </select>
                    <button type="button" onclick="checkDomainAvailability()" class="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition">Cek</button>
                </div>
                <div id="wiz-domain-result" class="mt-4">
                    ${WizardState.domain.available ? `<div class="p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-bold"><i class="fa-solid fa-check-circle mr-2"></i> Domain ${WizardState.domain.fullDomain} tersedia!</div>` : ''}
                </div>
            </div>
            <div class="mt-8 flex justify-end">
                <button onclick="nextStep()" class="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition shadow-sm" ${!WizardState.domain.available ? 'disabled style="opacity: 0.5"' : ''} id="btn-next-1">Lanjut ke Template <i class="fa-solid fa-arrow-right ml-2"></i></button>
            </div>
        </div>`;
    } else if (step === 2) {
        // Step 2: Template
        html = `
        <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 class="text-lg font-bold text-slate-900 mb-6 flex items-center">
                <div class="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mr-3 text-sm">2</div> 
                Konfirmasi Template
            </h3>
            <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between mb-8">
                <div>
                    <p class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Template Terpilih</p>
                    <p class="font-black text-brand-700 text-lg">${WizardState.template.name}</p>
                </div>
                <button type="button" onclick="navigate('templates')" class="text-sm font-bold text-slate-600 hover:text-brand-600 underline">Ganti</button>
            </div>
            <div class="flex justify-between border-t border-slate-100 pt-6">
                <button onclick="WizardState.currentStep--; renderWizardStep()" class="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"><i class="fa-solid fa-arrow-left mr-2"></i> Kembali</button>
                <button onclick="nextStep()" class="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition shadow-sm">Lanjut ke Data Diri <i class="fa-solid fa-arrow-right ml-2"></i></button>
            </div>
        </div>`;
    } else if (step === 3) {
        // Step 3: Customer
        html = `
        <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 class="text-lg font-bold text-slate-900 mb-6 flex items-center">
                <div class="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mr-3 text-sm">3</div> 
                Data Pemesan & Bisnis
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">Nama Lengkap *</label>
                    <input type="text" id="wiz-cust-name" value="${WizardState.customer.name}" class="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" required onchange="WizardState.customer.name=this.value">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">Email *</label>
                    <input type="email" id="wiz-cust-email" value="${WizardState.customer.email}" class="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" required onchange="WizardState.customer.email=this.value">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">WhatsApp *</label>
                    <input type="tel" id="wiz-cust-wa" value="${WizardState.customer.wa}" class="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" required onchange="WizardState.customer.wa=this.value">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">Nama Bisnis *</label>
                    <input type="text" id="wiz-cust-biz" value="${WizardState.customer.businessName}" class="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" required onchange="WizardState.customer.businessName=this.value">
                </div>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-bold text-slate-700 mb-2">Kategori Bisnis</label>
                <input type="text" id="wiz-cust-cat" value="${WizardState.customer.businessCategory}" class="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" onchange="WizardState.customer.businessCategory=this.value">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-bold text-slate-700 mb-2">Alamat Bisnis</label>
                <textarea id="wiz-cust-addr" rows="2" class="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" onchange="WizardState.customer.businessAddress=this.value">${WizardState.customer.businessAddress}</textarea>
            </div>
            <div class="mb-8">
                <label class="block text-sm font-bold text-slate-700 mb-2">Catatan Tambahan (Opsional)</label>
                <textarea id="wiz-cust-note" rows="2" class="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" onchange="WizardState.customer.notes=this.value">${WizardState.customer.notes}</textarea>
            </div>

            <div class="flex justify-between border-t border-slate-100 pt-6">
                <button onclick="WizardState.currentStep--; renderWizardStep()" class="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"><i class="fa-solid fa-arrow-left mr-2"></i> Kembali</button>
                <button onclick="nextStep()" class="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition shadow-sm">Lanjut Pilih Paket <i class="fa-solid fa-arrow-right ml-2"></i></button>
            </div>
        </div>`;
    } else if (step === 4) {
        // Step 4: Packages
        html = `
        <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 class="text-lg font-bold text-slate-900 mb-6 flex items-center">
                <div class="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mr-3 text-sm">4</div> 
                Pilih Durasi Paket
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                ${[1,2,3].map(yr => {
                    const pricing = PricingEngine.calculateTotal(WizardState.domain.ext, yr);
                    const isSelected = WizardState.durationYears === yr;
                    return `
                    <div onclick="selectDuration(${yr})" class="cursor-pointer border-2 rounded-xl p-4 transition-all relative ${isSelected ? 'border-brand-500 bg-brand-50 shadow-md' : 'border-slate-200 hover:border-brand-300'}">
                        ${yr === 2 ? '<div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Rekomendasi</div>' : ''}
                        <h4 class="font-bold text-slate-800 text-center mb-2">Paket ${yr} Tahun</h4>
                        <p class="text-xl font-black text-brand-600 text-center mb-4">${PricingEngine.formatRp(pricing.total)}</p>
                        <ul class="text-[10px] text-slate-600 space-y-1">
                            <li><i class="fa-solid fa-check text-green-500 mr-1"></i> Domain Aktif ${yr} Thn</li>
                            <li><i class="fa-solid fa-check text-green-500 mr-1"></i> Hosting Aktif ${yr} Thn</li>
                            <li><i class="fa-solid fa-check text-green-500 mr-1"></i> Template & Setup</li>
                            <li><i class="fa-solid fa-check text-green-500 mr-1"></i> SSL & Support</li>
                        </ul>
                    </div>
                    `;
                }).join('')}
            </div>
            <div class="flex justify-between border-t border-slate-100 pt-6">
                <button onclick="WizardState.currentStep--; renderWizardStep()" class="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"><i class="fa-solid fa-arrow-left mr-2"></i> Kembali</button>
                <button onclick="nextStep()" class="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition shadow-sm">Lanjut Pembayaran <i class="fa-solid fa-arrow-right ml-2"></i></button>
            </div>
        </div>`;
    } else if (step === 5) {
        // Step 5: Payment
        const pricing = PricingEngine.calculateTotal(WizardState.domain.ext, WizardState.durationYears);
        html = `
        <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 class="text-lg font-bold text-slate-900 mb-6 flex items-center">
                <div class="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mr-3 text-sm">5</div> 
                Pembayaran
            </h3>
            
            <div class="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
                <p class="text-sm font-bold text-blue-900 mb-2">Transfer ke Rekening Berikut:</p>
                <div class="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-200">
                    <div>
                        <p class="text-xs text-slate-500">Bank BCA</p>
                        <p class="font-black text-lg text-slate-800 tracking-wider">123 456 7890</p>
                        <p class="text-xs font-bold text-slate-700">a.n PT HatiTiga Web Solution</p>
                    </div>
                    <i class="fa-solid fa-building-columns text-blue-300 text-3xl"></i>
                </div>
            </div>

            <div class="mb-8">
                <label class="block text-sm font-bold text-slate-700 mb-2">Upload Bukti Transfer *</label>
                <div class="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition cursor-pointer" onclick="document.getElementById('wiz-proof').click()">
                    <i class="fa-solid fa-cloud-arrow-up text-3xl text-brand-400 mb-2"></i>
                    <p class="text-sm text-slate-600 font-medium" id="wiz-proof-text">${WizardState.proofFileName || 'Klik untuk pilih file (JPG/PNG/PDF)'}</p>
                    <input type="file" id="wiz-proof" class="hidden" accept="image/*,.pdf" onchange="handleProofUpload(event)">
                </div>
            </div>

            <div class="flex justify-between border-t border-slate-100 pt-6">
                <button onclick="WizardState.currentStep--; renderWizardStep()" class="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"><i class="fa-solid fa-arrow-left mr-2"></i> Kembali</button>
                <button onclick="submitOrder()" class="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition shadow-lg" ${!WizardState.proofFileName ? 'disabled style="opacity:0.5"' : ''} id="btn-submit-order">Kirim Pesanan Sekarang</button>
            </div>
        </div>`;
    }

    container.innerHTML = html;
    updateStickySummary();
}

function updateStickySummary() {
    const summary = document.getElementById('sticky-summary-container');
    if (!summary) return;

    const pricing = PricingEngine.calculateTotal(WizardState.domain.ext, WizardState.durationYears);
    
    summary.innerHTML = `
    <div class="p-6 border-b border-slate-100">
        <h3 class="text-lg font-black text-slate-900"><i class="fa-solid fa-receipt text-brand-500 mr-2"></i> Ringkasan Pesanan</h3>
    </div>
    <div class="p-6 bg-slate-50/50 space-y-4">
        <div class="flex justify-between items-start text-sm">
            <span class="text-slate-500 font-bold">Domain:</span>
            <span class="font-medium text-slate-800 text-right">${WizardState.domain.fullDomain || '-'}</span>
        </div>
        <div class="dashed-divider"></div>
        <div class="flex justify-between items-start text-sm">
            <span class="text-slate-500 font-bold">Template:</span>
            <span class="font-medium text-slate-800 text-right">${WizardState.template ? WizardState.template.name : '-'}</span>
        </div>
        <div class="dashed-divider"></div>
        <div class="flex justify-between items-start text-sm">
            <span class="text-slate-500 font-bold">Durasi:</span>
            <span class="font-medium text-slate-800 text-right">${WizardState.durationYears} Tahun</span>
        </div>
        <div class="dashed-divider"></div>
        
        <div class="flex justify-between items-end pt-4">
            <div>
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Tagihan</p>
                <p class="text-[10px] text-slate-400">Pembaruan: ${PricingEngine.formatRp(pricing.renewalTotal)}/thn</p>
            </div>
            <div class="text-right">
                <p class="text-2xl font-black text-brand-600">${PricingEngine.formatRp(pricing.total)}</p>
            </div>
        </div>
    </div>
    <div class="p-6 pt-0 bg-slate-50/50">
        <div class="text-center text-xs text-slate-500 font-medium p-3 bg-slate-100 rounded-lg">
            Status: <span class="text-slate-800 font-bold">Draft / Mengisi Form</span>
        </div>
    </div>
    `;
}

function checkDomainAvailability() {
    const name = document.getElementById('wiz-domain-name').value;
    const ext = document.getElementById('wiz-domain-ext').value;
    
    if(!name) { alert('Masukkan nama domain!'); return; }
    
    WizardState.domain.name = name;
    WizardState.domain.ext = ext;
    WizardState.domain.fullDomain = name + ext;
    
    // Mock logic
    WizardState.domain.available = Math.random() > 0.2;
    renderWizardStep();
}

function selectDuration(years) {
    WizardState.durationYears = years;
    renderWizardStep();
}

function handleProofUpload(e) {
    if(e.target.files && e.target.files[0]) {
        WizardState.proofFileName = e.target.files[0].name;
        WizardState.proofUploadedAt = new Date().toISOString();
        WizardState.proofStatus = 'uploaded';
        renderWizardStep();
    }
}

function nextStep() {
    if (WizardState.currentStep === 1 && !WizardState.domain.available) return;
    if (WizardState.currentStep === 3) {
        // sync
        WizardState.customer.name = document.getElementById('wiz-cust-name').value;
        WizardState.customer.email = document.getElementById('wiz-cust-email').value;
        WizardState.customer.wa = document.getElementById('wiz-cust-wa').value;
        WizardState.customer.businessName = document.getElementById('wiz-cust-biz').value;
        if (!WizardState.customer.name || !WizardState.customer.email || !WizardState.customer.wa || !WizardState.customer.businessName) {
            alert('Mohon lengkapi field bertanda bintang (*)');
            return;
        }
    }
    WizardState.currentStep++;
    renderWizardStep();
}

function submitOrder() {
    if (!WizardState.proofFileName) return;

    const btn = document.getElementById('btn-submit-order');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Memproses...';
    btn.disabled = true;

    setTimeout(() => {
        const custId = HTWS_Storage.createCustomerIfNeeded(WizardState.customer.email, WizardState.customer.name, WizardState.customer.wa);
        const pricing = PricingEngine.calculateTotal(WizardState.domain.ext, WizardState.durationYears);
        
        const now = new Date();
        const yyyymmdd = now.toISOString().split('T')[0].replace(/-/g, '');
        const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase();
        const orderId = `HTWS-${yyyymmdd}-${randomStr}`;

        let deadline = new Date();
        deadline.setDate(deadline.getDate() + 2); // 2 days

        const order = {
            id: orderId,
            customerId: custId,
            customerName: WizardState.customer.name,
            email: WizardState.customer.email,
            whatsapp: WizardState.customer.wa,
            businessName: WizardState.customer.businessName,
            businessCategory: WizardState.customer.businessCategory,
            businessAddress: WizardState.customer.businessAddress,
            notes: WizardState.customer.notes,
            
            domainName: WizardState.domain.name,
            domainExtension: WizardState.domain.ext,
            fullDomain: WizardState.domain.fullDomain,
            
            templateId: WizardState.template.id,
            templateName: WizardState.template.name,
            
            durationYears: WizardState.durationYears,
            packageName: `Paket ${WizardState.durationYears} Tahun`,
            
            status: 'payment_review',
            paymentStatus: 'awaiting_verification',
            
            total: pricing.total,
            renewalTotal: pricing.renewalTotal,
            breakdown: pricing.breakdown,
            
            proofFileName: WizardState.proofFileName,
            proofUploadedAt: WizardState.proofUploadedAt,
            
            createdAt: now.toISOString(),
            paymentDeadline: deadline.toISOString(),
            paidAt: null,
            startedAt: null,
            liveAt: null,
            expiresAt: null
        };

        HTWS_Storage.saveOrder(order);

        alert(`Pesanan Berhasil Dibuat!\nOrder ID: ${orderId}\n\nTerima kasih, admin akan segera memverifikasi pembayaran Anda.`);
        window.location.href = 'customer_dashboard.html';

    }, 800);
}
