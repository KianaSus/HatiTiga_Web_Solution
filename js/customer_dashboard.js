// Customer Dashboard Logic

let currentProject = null;
let liveData = null;
let currentDraft = null;
let isReadOnly = false;

// UI Initialization
function initApp() {
    const sessionStr = localStorage.getItem('webkilat_session_v1');
    if (!sessionStr) {
        window.location.href = 'index.html';
        return;
    }

    const session = JSON.parse(sessionStr);
    
    // Auth Check
    if (session.role !== 'customer' || !session.verifiedCustomer) {
        showAccessDenied();
        return;
    }

    // Load Projects
    const projects = window.loadCustomerProjects ? window.loadCustomerProjects() : [];
    currentProject = projects.find(p => p.customerUsername === session.username);

    if (!currentProject) {
        showAccessDenied();
        return;
    }

    // Status Check
    const status = currentProject.status;
    if (status === 'suspended') {
        showSuspendedScreen();
        return;
    } else if (status === 'grace_period') {
        showGracePeriodDashboardReadOnly();
    } else if (status === 'pending_payment') {
        showPendingPaymentScreen();
        return;
    }

    liveData = currentProject.liveContent;
    currentDraft = currentProject.pendingUpdate ? currentProject.pendingUpdate.content : JSON.parse(JSON.stringify(liveData));

    // Update UI elements based on new HTML structure
    document.getElementById('user-company').innerText = currentProject.customerName || 'Perusahaan';
    document.getElementById('user-initial').innerText = (currentProject.customerName || 'U').charAt(0);
    
    const welcomeTitles = document.querySelectorAll('h2.text-2xl, h2.text-3xl');
    if(welcomeTitles.length > 0) welcomeTitles[0].innerHTML = `Halo, ${currentProject.customerName}! 👋`;

    const domainStr = (currentProject.customerUsername || 'user').toLowerCase().replace(/\s+/g, '') + '.hatitiga.site';
    const domainEl = document.getElementById('info-domain');
    if(domainEl) domainEl.innerText = domainStr;
    
    const previewUrlEl = document.getElementById('preview-url');
    if(previewUrlEl) previewUrlEl.innerText = `https://${domainStr}`;
    
    const infoTemplateEl = document.getElementById('info-template-name');
    if(infoTemplateEl) infoTemplateEl.innerText = currentProject.templateFamily === 'company_profile' ? 'Premium (Company Profile)' : (currentProject.templateFamily === 'export_catalog' ? 'Enterprise (Export Catalog)' : 'Belum Memilih Template');

    // Handle Setup User C View
    if (currentProject.status === 'setup' || !currentProject.templateFamily) {
        document.getElementById('menu-status').style.display = 'none';
        document.getElementById('menu-editor').style.display = 'none';
        document.getElementById('menu-updates').style.display = 'none';
        document.getElementById('menu-assets').style.display = 'none';
    }

    // Check if there is a pending review
    if (currentProject.pendingUpdate && currentProject.pendingUpdate.status === 'pending_review') {
        isReadOnly = true;
        document.getElementById('editor-waiting-review-banner').classList.remove('hidden');
        document.getElementById('btn-submit-approval').disabled = true;
        document.getElementById('btn-submit-approval').classList.add('opacity-50', 'cursor-not-allowed');
    }

    if (currentProject.pendingUpdate && currentProject.pendingUpdate.status === 'rejected') {
        document.getElementById('editor-rejected-banner').classList.remove('hidden');
        document.getElementById('rejection-reason-text').innerText = currentProject.pendingUpdate.rejectionReason || 'Ditolak oleh admin.';
    }

    // Inject URL and Package if Status Web card exists
    const urlDisplay = document.getElementById('web-url-display');
    if (urlDisplay && currentProject.customerUsername) {
        const domain = currentProject.customerUsername.toLowerCase().replace(/\s+/g, '') + '.hatitiga.site';
        urlDisplay.innerText = 'https://' + domain;
        urlDisplay.href = 'https://' + domain;
    }
    const pkgDisplay = document.getElementById('web-pkg-display');
    if (pkgDisplay) {
        pkgDisplay.innerText = currentProject.templateFamily === 'company_profile' ? 'Premium (Company Profile)' : 'Enterprise (Export Catalog)';
    }

    renderEditorForm();
    renderListItems();
    renderStatusHistory();
    updateLivePreview();
}

function renderEditorForm() {
    const form = document.getElementById('master-editor-form');
    
    // Base Fields for both templates
    let html = `
        <div class="space-y-5">
            <div>
                <label class="block text-sm font-bold text-slate-700 mb-1.5">Nama Bisnis</label>
                <input type="text" id="edit-businessName" value="${currentDraft.businessName || ''}" oninput="handleFormChange('businessName')" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition" ${isReadOnly ? 'disabled' : ''}>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-1.5">Judul Hero Utama</label>
                    <input type="text" id="edit-heroTitle" value="${currentDraft.heroTitle || ''}" oninput="handleFormChange('heroTitle')" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition" ${isReadOnly ? 'disabled' : ''}>
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-1.5">Subjudul Hero</label>
                    <input type="text" id="edit-heroSubtitle" value="${currentDraft.heroSubtitle || ''}" oninput="handleFormChange('heroSubtitle')" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition" ${isReadOnly ? 'disabled' : ''}>
                </div>
            </div>
            <div>
                <label class="block text-sm font-bold text-slate-700 mb-1.5">Gambar Hero Utama (Maks 1MB untuk Demo MVP)</label>
                <input type="file" accept="image/*" onchange="handleImageUpload(event, 'heroImage')" class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 transition" ${isReadOnly ? 'disabled' : ''}>
                ${currentDraft.heroImage ? '<img src="'+currentDraft.heroImage+'" class="mt-2 h-20 rounded border border-slate-200 object-cover">' : ''}
                <p class="text-xs text-amber-600 mt-1"><i class="fa-solid fa-triangle-exclamation"></i> Upload gambar dikonversi ke Base64, khusus untuk demo.</p>
            </div>
            <div>
                <label class="block text-sm font-bold text-slate-700 mb-1.5">Teks Deskripsi (About Us)</label>
                <textarea id="edit-aboutText" rows="3" oninput="handleFormChange('aboutText')" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition resize-none" ${isReadOnly ? 'disabled' : ''}>${currentDraft.aboutText || ''}</textarea>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-1.5">WhatsApp</label>
                    <input type="text" id="edit-whatsapp" value="${currentDraft.whatsapp || ''}" oninput="handleFormChange('whatsapp')" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition" ${isReadOnly ? 'disabled' : ''}>
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
                    <input type="email" id="edit-email" value="${currentDraft.email || ''}" oninput="handleFormChange('email')" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition" ${isReadOnly ? 'disabled' : ''}>
                </div>
            </div>
        </div>
    `;
    form.innerHTML = html;
}

function handleFormChange(field) {
    if (isReadOnly) return;
    const val = document.getElementById('edit-' + field).value;
    currentDraft[field] = val;
    updateLivePreview();
}

function handleImageUpload(event, targetField) {
    if (isReadOnly) return;
    const file = event.target.files[0];
    if (!file) return;

    // MVP Limitation warning
    if (file.size > 1024 * 1024 * 2) {
        alert("Ukuran gambar terlalu besar untuk versi demo. Mohon gunakan gambar di bawah 2MB.");
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        currentDraft[targetField] = e.target.result;
        updateLivePreview();
        renderEditorForm(); // Re-render to show image preview
    };
    reader.readAsDataURL(file);
}

// --- Dynamic List (Products/Services) ---
function renderListItems() {
    const container = document.getElementById('list-items-container');
    const items = currentProject.templateFamily === 'company_profile' ? (currentDraft.services || []) : (currentDraft.products || []);
    
    if (items.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">Belum ada item. Tambahkan yang pertama!</div>';
        return;
    }

    let html = '';
    items.forEach((item, index) => {
        const title = item.name || item.title || 'Item Baru';
        html += `
            <div class="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center group hover:shadow-sm transition">
                <div>
                    <h4 class="font-bold text-slate-800">${title}</h4>
                    <p class="text-sm text-slate-500 line-clamp-1">${item.description || ''}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="editListItem(${index})" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-brand-50 text-slate-600 hover:text-brand-600 flex items-center justify-center transition" ${isReadOnly ? 'disabled' : ''}><i class="fa-solid fa-pen"></i></button>
                    <button onclick="removeListItem(${index})" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 flex items-center justify-center transition" ${isReadOnly ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function addNewListItem() {
    if (isReadOnly) return;
    const isProfile = currentProject.templateFamily === 'company_profile';
    const title = prompt(`Masukkan nama ${isProfile ? 'layanan' : 'produk'} baru:`);
    if (!title) return;

    if (isProfile) {
        if (!currentDraft.services) currentDraft.services = [];
        currentDraft.services.push({ id: 'srv_' + Date.now(), title: title, description: 'Deskripsi layanan baru...' });
    } else {
        if (!currentDraft.products) currentDraft.products = [];
        currentDraft.products.push({ id: 'prod_' + Date.now(), name: title, description: 'Deskripsi produk baru...', image: '', moq: '-', packaging: '-' });
    }
    renderListItems();
    updateLivePreview();
}

function editListItem(index) {
    if (isReadOnly) return;
    const isProfile = currentProject.templateFamily === 'company_profile';
    const items = isProfile ? currentDraft.services : currentDraft.products;
    const item = items[index];

    const newTitle = prompt("Update Judul/Nama:", item.title || item.name);
    if (newTitle) {
        if (isProfile) item.title = newTitle;
        else item.name = newTitle;
    }

    const newDesc = prompt("Update Deskripsi:", item.description);
    if (newDesc) {
        item.description = newDesc;
    }
    
    renderListItems();
    updateLivePreview();
}

function removeListItem(index) {
    if (isReadOnly) return;
    if (!confirm("Hapus item ini?")) return;
    const isProfile = currentProject.templateFamily === 'company_profile';
    if (isProfile) currentDraft.services.splice(index, 1);
    else currentDraft.products.splice(index, 1);
    
    renderListItems();
    updateLivePreview();
}

// --- Live Preview Renderer ---
function updateLivePreview() {
    const iframe = document.getElementById('live-editor-iframe');
    if (!iframe) return;
    
    const isProfile = currentProject.templateFamily === 'company_profile';
    
    // Generate simple HTML mockup based on draft data
    const heroImageHtml = currentDraft.heroImage ? `background-image: url('${currentDraft.heroImage}'); background-size: cover; background-position: center;` : 'background-color: #f1f5f9;';
    
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        </head>
        <body class="font-sans bg-white">
            <!-- Header -->
            <header class="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-50">
                <div class="font-black text-xl text-brand-700">${currentDraft.businessName || 'Your Logo'}</div>
                <nav class="hidden md:flex gap-6 text-sm font-bold text-slate-600">
                    <span>Home</span>
                    <span>About</span>
                    <span>${isProfile ? 'Services' : 'Products'}</span>
                    <span>Contact</span>
                </nav>
            </header>
            
            <!-- Hero -->
            <div class="py-24 px-6 text-center text-slate-800 border-b border-slate-100 relative" style="${heroImageHtml}">
                <div class="absolute inset-0 bg-white/70 backdrop-blur-sm"></div>
                <div class="relative z-10 max-w-2xl mx-auto">
                    <h1 class="text-4xl md:text-5xl font-black mb-4">${currentDraft.heroTitle || 'Your Hero Title'}</h1>
                    <p class="text-lg text-slate-700 mb-8">${currentDraft.heroSubtitle || 'Your Hero Subtitle goes here.'}</p>
                    <a href="https://wa.me/${currentDraft.whatsapp}" target="_blank" class="bg-brand-600 text-white px-8 py-3 rounded-full font-bold shadow-lg">Contact Us</a>
                </div>
            </div>
            
            <!-- About -->
            <div class="py-16 px-6 max-w-4xl mx-auto text-center">
                <h2 class="text-2xl font-black mb-6">About Us</h2>
                <p class="text-slate-600 leading-relaxed">${currentDraft.aboutText || 'About your business...'}</p>
            </div>
            
            <!-- Dynamic List -->
            <div class="py-16 px-6 bg-slate-50">
                <div class="max-w-5xl mx-auto">
                    <h2 class="text-2xl font-black mb-10 text-center">${isProfile ? 'Our Services' : 'Our Products'}</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    `;

    const items = isProfile ? (currentDraft.services || []) : (currentDraft.products || []);
    items.forEach(item => {
        html += `
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 class="text-lg font-black text-slate-800 mb-2">${item.name || item.title || 'Item'}</h3>
                <p class="text-sm text-slate-600">${item.description || 'Description'}</p>
                ${!isProfile && item.moq ? '<p class="text-xs text-slate-500 mt-4 font-bold">MOQ: ' + item.moq + '</p>' : ''}
            </div>
        `;
    });

    html += `
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <footer class="bg-slate-900 text-slate-400 py-12 px-6 text-center text-sm">
                <div class="font-black text-white text-xl mb-4">${currentDraft.businessName || 'Business Name'}</div>
                <p>${currentDraft.address || 'Address goes here'}</p>
            </footer>
        </body>
        </html>
    `;

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
}

function submitForApproval() {
    if (isReadOnly) return;
    
    // Save draft to project data
    currentProject.pendingUpdate = {
        status: 'pending_review',
        submittedAt: new Date().toISOString(),
        submittedBy: JSON.parse(localStorage.getItem('webkilat_session_v1')).username,
        content: JSON.parse(JSON.stringify(currentDraft)),
        note: 'Customer submitted changes for review.'
    };

    const projects = window.loadCustomerProjects();
    const idx = projects.findIndex(p => p.id === currentProject.id);
    if (idx > -1) {
        projects[idx] = currentProject;
        window.saveCustomerProjects(projects);
    }

    alert('Perubahan Anda telah dikirim dan menunggu persetujuan Admin.');
    window.location.reload();
}

function renderStatusHistory() {
    const statusContainer = document.getElementById('current-update-status');
    const historyContainer = document.getElementById('update-history-list');
    
    if (currentProject.pendingUpdate) {
        let badge = '';
        if (currentProject.pendingUpdate.status === 'pending_review') {
            badge = '<span class="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">Menunggu Review Admin</span>';
        } else if (currentProject.pendingUpdate.status === 'rejected') {
            badge = '<span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">Ditolak</span>';
        }
        
        statusContainer.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <p class="text-sm text-slate-500 mb-1">Dikirim pada: ${new Date(currentProject.pendingUpdate.submittedAt).toLocaleString('id-ID')}</p>
                    <p class="font-bold text-slate-800">${currentProject.pendingUpdate.note}</p>
                    ${currentProject.pendingUpdate.rejectionReason ? '<p class="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">Alasan: ' + currentProject.pendingUpdate.rejectionReason + '</p>' : ''}
                </div>
                <div>${badge}</div>
            </div>
        `;
    } else {
        statusContainer.innerHTML = '<p class="text-slate-500 text-sm">Tidak ada pembaruan draf yang aktif saat ini.</p>';
    }

    if (currentProject.updateHistory && currentProject.updateHistory.length > 0) {
        historyContainer.innerHTML = currentProject.updateHistory.map(h => `
            <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                <div>
                    <p class="text-xs font-bold text-slate-500 mb-1">${new Date(h.approvedAt).toLocaleString('id-ID')} • Oleh: ${h.approvedBy}</p>
                    <p class="font-bold text-slate-800">Perubahan Disetujui (Live)</p>
                </div>
                <i class="fa-solid fa-check-circle text-green-500 text-xl"></i>
            </div>
        `).join('');
    } else {
        historyContainer.innerHTML = '<p class="text-slate-500 text-sm">Belum ada riwayat update yang disetujui.</p>';
    }
}

// Sidebar Navigation
function navDash(tabId) {
    document.querySelectorAll('.dash-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(tabId);
    if(target) target.classList.add('active');

    document.querySelectorAll('.dash-nav-link').forEach(el => {
        el.classList.remove('text-brand-600', 'bg-brand-50');
        el.classList.add('text-slate-600', 'hover:bg-slate-50', 'hover:text-slate-900');
        
        if(el.dataset.target === tabId) {
            el.classList.add('text-brand-600', 'bg-brand-50');
            el.classList.remove('text-slate-600', 'hover:bg-slate-50', 'hover:text-slate-900');
        }
    });

    if (window.innerWidth < 768) {
        document.getElementById('dash-sidebar').classList.add('-translate-x-full');
        document.getElementById('dash-mobile-overlay').classList.add('hidden');
    }

    // Toggle Desktop Right Panel
    if (tabId === 'dash-edit' || tabId === 'dash-products') {
        document.getElementById('left-content-area').classList.add('lg:w-1/2');
        document.getElementById('right-preview-panel').classList.remove('hidden');
        document.getElementById('right-preview-panel').classList.add('flex');
    } else {
        document.getElementById('left-content-area').classList.remove('lg:w-1/2');
        document.getElementById('right-preview-panel').classList.add('hidden');
        document.getElementById('right-preview-panel').classList.remove('flex');
    }
}

function toggleDashSidebar() {
    const sidebar = document.getElementById('dash-sidebar');
    const overlay = document.getElementById('dash-mobile-overlay');
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

// Fullscreen Access Denied handling
function showAccessDenied() {
    const overlay = document.getElementById('status-overlay');
    const content = document.getElementById('status-overlay-content');
    overlay.classList.remove('hidden');
    content.innerHTML = `
        <i class="fa-solid fa-lock text-6xl text-red-500 mb-5"></i>
        <h2 class="text-2xl font-black text-slate-900 mb-3">Akses Ditolak</h2>
        <p class="text-slate-600 mb-6">Dashboard hanya tersedia untuk customer aktif.</p>
        <button onclick="window.location.href='index.html'" class="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-colors">Kembali ke Beranda</button>
    `;
}

function dashToast(msg, type='success') {
    alert(msg); // Simplified for MVP
}

window.onload = initApp;
