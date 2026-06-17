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
    if (session.role === 'admin') {
        window.location.href = 'admin_panel.html';
        return;
    }

    // Fetch Orders for Customer
    const orders = JSON.parse(localStorage.getItem('htws_orders_v1') || '[]');
    window.allUserOrders = orders.filter(o => o.customerId === session.id || o.email === session.username);
    
    let activeOrderId = window.location.hash.replace('#project-', '');
    let activeOrder = window.allUserOrders.find(o => o.id === activeOrderId);
    if (!activeOrder && window.allUserOrders.length > 0) {
        activeOrder = window.allUserOrders[window.allUserOrders.length - 1]; // default to latest
    }
    const latestOrderForProfile = window.allUserOrders.length > 0 ? window.allUserOrders[window.allUserOrders.length - 1] : null;

    // Setup Editor Project Selector if > 1 order
    const selectorContainer = document.getElementById('editor-project-selector-container');
    const selector = document.getElementById('editor-project-selector');
    if (window.allUserOrders.length > 0) {
        if (selectorContainer) {
            selectorContainer.classList.remove('hidden');
            selectorContainer.classList.add('flex');
        }
        if (selector) {
            selector.innerHTML = window.allUserOrders.map(o => 
                `<option value="${o.id}" ${o.id === activeOrder?.id ? 'selected' : ''}>${o.templateName || 'Template'} - ${o.fullDomain}</option>`
            ).join('');
        }
    }

    if (!activeOrder) {
        // Fallback for user without orders
        currentProject = {
            id: 'proj_' + Math.random().toString(36).substr(2, 9),
            customerUsername: session.username,
            customerName: session.displayName || session.username,
            templateId: null,
            templateFamily: null,
            status: "setup",
            liveContent: {},
            pendingUpdate: null,
            updateHistory: []
        };
    } else {
        // Map active order to project
        currentProject = {
            id: activeOrder.id,
            customerUsername: session.username,
            customerName: activeOrder.customerName || session.displayName || session.username,
            templateId: activeOrder.templateId,
            templateName: activeOrder.templateName || 'Template Website',
            templateFamily: activeOrder.templateId === 'tpl_corptrust' ? 'company_profile' : 'export_catalog',
            status: activeOrder.status,
            fullDomain: activeOrder.fullDomain,
            liveContent: {},
            pendingUpdate: null,
            updateHistory: []
        };
    }

    // Status Check Routing
    const status = currentProject.status;
    if (status === 'payment_rejected' || status === 'cancelled') {
        showSuspendedScreen();
        return;
    } else if (status === 'grace_period') {
        showGracePeriodDashboardReadOnly();
    } else if (status === 'pending_payment' || status === 'payment_review') {
        showPendingPaymentScreen(activeOrder);
        return;
    }

    liveData = currentProject.liveContent;
    currentDraft = currentProject.pendingUpdate ? currentProject.pendingUpdate.content : JSON.parse(JSON.stringify(liveData));

    // Update UI elements based on new HTML structure
    document.getElementById('user-company').innerText = currentProject.customerName || 'Perusahaan';
    document.getElementById('user-initial').innerText = (currentProject.customerName || 'U').charAt(0).toUpperCase();
    
    const welcomeTitles = document.querySelectorAll('h2.text-2xl, h2.text-3xl');
    if(welcomeTitles.length > 0) welcomeTitles[0].innerHTML = `Halo, ${currentProject.customerName}! 👋`;

    const domainStr = currentProject.fullDomain || ((currentProject.customerUsername || 'user').toLowerCase().replace(/\s+/g, '') + '.hatitiga.site');
    const domainEl = document.getElementById('info-domain');
    if(domainEl) domainEl.innerText = domainStr;
    
    const previewUrlEl = document.getElementById('preview-url');
    if(previewUrlEl) previewUrlEl.innerText = `https://${domainStr}`;
    
    const infoTemplateEl = document.getElementById('info-template-name');
    if(infoTemplateEl) infoTemplateEl.innerText = currentProject.templateName;

    // Handle Setup User C View
    if (currentProject.status === 'setup' || !currentProject.templateId) {
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
    if (urlDisplay && currentProject.fullDomain) {
        urlDisplay.innerText = 'https://' + currentProject.fullDomain;
        urlDisplay.href = 'https://' + currentProject.fullDomain;
    }
    const pkgDisplay = document.getElementById('web-pkg-display');
    if (pkgDisplay) {
        pkgDisplay.innerText = currentProject.templateName;
    }

    renderStatusHistory();

    const iframe = document.getElementById('live-editor-iframe');
    if (iframe) {
        // Universal Visual Editor logic
        const templateMap = {
            'tpl_corptrust': 'corptrust_companyprofile.html',
            'tpl_globaltrade': 'globaltrade_export.html',
            'tpl_agriorganic': 'agriorganic_template.html',
            'tpl_lokalshop': 'lokalonlineshop.html',
            'tpl_brewhaven': 'brew_haven_coffee_template.html'
        };
        iframe.src = templateMap[currentProject.templateId] || 'corptrust_companyprofile.html';
        
        iframe.onload = () => {
            injectUniversalEditor(iframe);
        };
    }

    // Set up message listener for Activity Log and Export
    window.addEventListener('message', handleIframeMessage);
    
    // Render new tabs
    renderProfileTab(session, latestOrderForProfile);
    renderOrdersTab(window.allUserOrders);
}

// Global function to switch projects
window.switchProject = function(orderId) {
    window.location.hash = '#project-' + orderId;
    window.location.reload();
}

// --- PROFILE LOGIC ---
function renderProfileTab(session, latestOrder) {
    const profiles = JSON.parse(localStorage.getItem('htws_customer_profiles_v1') || '{}');
    let profile = profiles[session.id];
    
    if (!profile) {
        profile = {
            fullName: session.displayName || latestOrder?.customerName || session.username,
            businessName: latestOrder?.businessName || '',
            whatsapp: latestOrder?.whatsapp || '',
            email: session.username
        };
        profiles[session.id] = profile;
        localStorage.setItem('htws_customer_profiles_v1', JSON.stringify(profiles));
    }

    document.getElementById('profile-avatar').innerText = (profile.fullName || 'U').charAt(0).toUpperCase();
    document.getElementById('profile-display-name').innerText = profile.fullName;
    document.getElementById('profile-display-email').innerText = profile.email;

    document.getElementById('f-profile-name').value = profile.fullName;
    document.getElementById('f-profile-email').value = profile.email;
    document.getElementById('f-profile-business').value = profile.businessName;
    document.getElementById('f-profile-wa').value = profile.whatsapp;

    document.getElementById('form-profile').addEventListener('submit', function(e) {
        e.preventDefault();
        profile.fullName = document.getElementById('f-profile-name').value;
        profile.businessName = document.getElementById('f-profile-business').value;
        profile.whatsapp = document.getElementById('f-profile-wa').value;
        
        profiles[session.id] = profile;
        localStorage.setItem('htws_customer_profiles_v1', JSON.stringify(profiles));
        
        alert("Profil berhasil diperbarui!");
        document.getElementById('profile-avatar').innerText = (profile.fullName || 'U').charAt(0).toUpperCase();
        document.getElementById('profile-display-name').innerText = profile.fullName;
        
        // Update top right header
        document.getElementById('user-company').innerText = profile.businessName || profile.fullName;
        document.getElementById('user-initial').innerText = (profile.businessName || profile.fullName || 'U').charAt(0).toUpperCase();
    });
}

// --- ORDERS LOGIC ---
function renderOrdersTab(userOrders) {
    const container = document.getElementById('orders-container');
    if (!userOrders || userOrders.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-slate-500">Belum ada pesanan.</div>`;
        return;
    }

    const tableHeader = `
        <div class="overflow-x-auto hidden md:block">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="border-b border-slate-200 bg-slate-50">
                        <th class="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID Order</th>
                        <th class="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Layanan</th>
                        <th class="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                        <th class="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th class="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                </thead>
                <tbody class="text-sm">
    `;
    
    let tableRows = '';
    let mobileCards = '<div class="md:hidden divide-y divide-slate-100">';

    userOrders.reverse().forEach(o => {
        let statusBadge = '';
        let actions = '';
        
        if (o.status === 'pending_payment') {
            statusBadge = `<span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">Menunggu Pembayaran</span>`;
            actions = `<button onclick="handlePayNow('${o.id}')" class="px-3 py-1.5 bg-brand-600 text-white rounded text-xs font-bold hover:bg-brand-700 transition shadow-sm mb-1 w-full md:w-auto">Bayar Sekarang</button>`;
        } else if (o.status === 'payment_review') {
            statusBadge = `<span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">Menunggu Verifikasi</span>`;
            actions = `<button class="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm w-full md:w-auto">Detail</button>`;
        } else if (o.status === 'paid') {
            statusBadge = `<span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">Pembayaran Diterima</span>`;
            actions = `<button class="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm w-full md:w-auto">Detail</button>`;
        } else if (o.status === 'in_progress') {
            statusBadge = `<span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">Sedang Diproses</span>`;
            actions = `<button onclick="switchTab('status', document.getElementById('menu-status'))" class="px-3 py-1.5 bg-brand-50 border border-brand-200 text-brand-700 rounded text-xs font-bold hover:bg-brand-100 transition shadow-sm w-full md:w-auto">Lihat Progress</button>`;
        } else if (o.status === 'live_active') {
            statusBadge = `<span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">Website Aktif</span>`;
            actions = `<button onclick="window.open('https://${o.fullDomain}', '_blank')" class="px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-bold hover:bg-purple-700 transition shadow-sm mb-1 w-full md:w-auto">Lihat Website</button>
                       <button onclick="openWhatsApp()" class="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm w-full md:w-auto">Perpanjang</button>`;
        } else {
            statusBadge = `<span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700">${o.status}</span>`;
            actions = `<button onclick="openWhatsApp()" class="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm w-full md:w-auto">Hubungi Admin</button>`;
        }

        const dateStr = new Date(o.createdAt).toLocaleDateString('id-ID');
        const priceStr = new Intl.NumberFormat('id-ID', {style:'currency',currency:'IDR',minimumFractionDigits:0}).format(o.total);

        // Table Row (Desktop)
        tableRows += `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
                <td class="p-4 font-bold text-slate-700">
                    ${o.id}<br><span class="text-[10px] font-normal text-slate-400">${dateStr}</span>
                </td>
                <td class="p-4 text-slate-600">
                    <span class="font-bold">${o.templateName || 'Template'}</span><br>
                    <span class="text-[10px]">${o.fullDomain}</span>
                </td>
                <td class="p-4 font-bold text-brand-600">${priceStr}</td>
                <td class="p-4">${statusBadge}</td>
                <td class="p-4 flex flex-col items-start gap-1">${actions}</td>
            </tr>
        `;

        // Card (Mobile)
        mobileCards += `
            <div class="p-4 space-y-3">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-xs font-bold text-slate-400 mb-1">${o.id} &bull; ${dateStr}</p>
                        <p class="font-bold text-slate-900">${o.templateName || 'Template'}</p>
                        <p class="text-xs text-brand-600">${o.fullDomain}</p>
                    </div>
                    ${statusBadge}
                </div>
                <div class="flex justify-between items-center pt-2">
                    <p class="font-black text-slate-800">${priceStr}</p>
                </div>
                <div class="pt-2 flex flex-col gap-2">
                    ${actions}
                </div>
            </div>
        `;
    });

    const tableFooter = `</tbody></table></div>`;
    mobileCards += `</div>`;

    container.innerHTML = tableHeader + tableRows + tableFooter + mobileCards;
}

window.handlePayNow = function(orderId) {
    const orders = JSON.parse(localStorage.getItem('htws_orders_v1') || '[]');
    const order = orders.find(o => o.id === orderId);
    if(order) {
        showPendingPaymentScreen(order);
    }
}

// Activity Log State
let activityLog = ['Menunggu aktivitas edit dari Anda...'];

function handleIframeMessage(event) {
    if (!event.data) return;
    
    if (event.data.type === 'LOG_ACTIVITY') {
        activityLog.unshift(event.data.msg);
        if(activityLog.length > 10) activityLog.pop();
        renderActivityLog();
        // Mark draft as modified visually if needed
    }
    
    if (event.data.type === 'EXPORT_RESULT') {
        processSubmission(event.data.html);
    }
}

function renderActivityLog() {
    const container = document.getElementById('activity-log-container');
    if(!container) return;
    
    container.innerHTML = activityLog.map((log, idx) => `
        <div class="flex items-start gap-3 text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-100 shadow-sm fade-in">
            <div class="w-2 h-2 mt-1.5 rounded-full bg-blue-400 shrink-0"></div>
            <span>${log}</span>
        </div>
    `).join('');
}

function setDeviceMode(mode) {
    const wrapper = document.getElementById('iframe-wrapper');
    const btnDesktop = document.getElementById('btn-desktop');
    const btnMobile = document.getElementById('btn-mobile');
    
    if (!wrapper) return;
    
    // Reset classes
    btnDesktop.className = "p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition";
    btnMobile.className = "p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition";
    
    if (mode === 'desktop') {
        wrapper.className = "w-full h-full bg-white shadow-2xl overflow-hidden transition-all duration-500 ease-in-out border border-slate-200 rounded-xl relative";
        btnDesktop.classList.add('bg-brand-100', 'text-brand-700', 'shadow-sm');
        btnDesktop.classList.remove('text-slate-500', 'hover:bg-slate-100');
    } else {
        wrapper.className = "w-[375px] h-[812px] min-h-[812px] bg-white shadow-2xl overflow-hidden transition-all duration-500 ease-in-out rounded-[3rem] ring-8 ring-slate-800 relative my-8";
        btnMobile.classList.add('bg-brand-100', 'text-brand-700', 'shadow-sm');
        btnMobile.classList.remove('text-slate-500', 'hover:bg-slate-100');
    }
}

function renderEditorForm() {
    // Disabled: Replaced by Universal Visual Editor
}

function handleFormChange(field) {
    // Disabled
}

function handleImageUpload(event, targetField) {
    // Disabled
}

function renderListItems() {
    // Disabled
}

function addNewListItem() {
    // Disabled
}

function editListItem(index) {
    // Disabled
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
function injectUniversalEditor(iframe) {
    if (isReadOnly) return;
    
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (!doc) return;

    const magicScript = `
      <style id="gemini-builder-style">
        [contenteditable="true"] {
           transition: all 0.2s ease;
           border-radius: 4px;
        }
        [contenteditable="true"]:hover {
           outline: 2px dashed #3b82f6 !important;
           background-color: rgba(59, 130, 246, 0.1) !important;
           cursor: text;
        }
        [contenteditable="true"]:focus {
           outline: 2px solid #3b82f6 !important;
           background-color: rgba(59, 130, 246, 0.05) !important;
        }
        img.gemini-img-editable {
           transition: all 0.2s ease;
        }
        img.gemini-img-editable:hover {
           outline: 4px dashed #10b981 !important;
           cursor: pointer;
           opacity: 0.85;
        }
      </style>
      <script id="gemini-builder-script">
        window.addEventListener('load', initEditor);
        // Fallback in case it's already loaded
        if(document.readyState === 'complete') initEditor();

        function initEditor() {
           const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, li, td, th, label');
           textElements.forEach(el => {
               if(el.children.length <= 1 || ['H1','H2','H3','P','A','BUTTON'].includes(el.tagName)) {
                   el.setAttribute('contenteditable', 'true');
                   if(el.tagName === 'A' || el.tagName === 'BUTTON') {
                       el.addEventListener('click', (e) => e.preventDefault());
                   }
                   el.addEventListener('input', () => {
                       window.parent.postMessage({ type: 'LOG_ACTIVITY', msg: 'Mengedit teks pada elemen ' + el.tagName.toLowerCase() }, '*');
                   });
               }
           });

           document.querySelectorAll('img').forEach(img => {
               img.classList.add('gemini-img-editable');
               img.addEventListener('click', (e) => {
                   e.preventDefault();
                   const newUrl = prompt('Ubah Gambar: Masukkan URL Gambar Baru\\n(Biarkan kosong jika tidak ingin mengubah)', img.src);
                   if(newUrl && newUrl.trim() !== '') {
                       img.src = newUrl;
                       window.parent.postMessage({ type: 'LOG_ACTIVITY', msg: 'URL Gambar berhasil diganti' }, '*');
                   }
               });
           });

           window.addEventListener('message', (event) => {
               if(event.data === 'REQUEST_EXPORT') {
                   const cloneDOM = document.documentElement.cloneNode(true);
                   cloneDOM.querySelectorAll('[contenteditable="true"]').forEach(el => el.removeAttribute('contenteditable'));
                   cloneDOM.querySelectorAll('.gemini-img-editable').forEach(el => {
                       el.classList.remove('gemini-img-editable');
                       if(el.classList.length === 0) el.removeAttribute('class');
                   });
                   const styleTag = cloneDOM.querySelector('#gemini-builder-style');
                   if(styleTag) styleTag.remove();
                   const scriptTag = cloneDOM.querySelector('#gemini-builder-script');
                   if(scriptTag) scriptTag.remove();
                   
                   const pureHTML = '<!DOCTYPE html>\\n<html lang="' + (cloneDOM.lang || 'en') + '">\\n' + cloneDOM.innerHTML + '\\n</html>';
                   window.parent.postMessage({ type: 'EXPORT_RESULT', html: pureHTML }, '*');
               }
           });
        }
      </script>
    `;

    // Write directly into the iframe if needed, or just append elements
    const styleEl = doc.createElement('div');
    styleEl.innerHTML = magicScript;
    doc.body.appendChild(styleEl);
    
    // To execute the script, we must inject a true script tag
    const scriptEl = doc.createElement('script');
    scriptEl.id = "gemini-builder-script";
    scriptEl.textContent = `
        const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, li, td, th, label');
        textElements.forEach(el => {
            if(el.children.length <= 1 || ['H1','H2','H3','P','A','BUTTON'].includes(el.tagName)) {
                el.setAttribute('contenteditable', 'true');
                if(el.tagName === 'A' || el.tagName === 'BUTTON') {
                    el.addEventListener('click', (e) => e.preventDefault());
                }
                el.addEventListener('input', () => {
                    window.parent.postMessage({ type: 'LOG_ACTIVITY', msg: 'Mengedit teks pada elemen ' + el.tagName.toLowerCase() }, '*');
                });
            }
        });

        document.querySelectorAll('img').forEach(img => {
            img.classList.add('gemini-img-editable');
            img.addEventListener('click', (e) => {
                e.preventDefault();
                const newUrl = prompt('Ubah Gambar: Masukkan URL Gambar Baru\\n(Biarkan kosong jika tidak ingin mengubah)', img.src);
                if(newUrl && newUrl.trim() !== '') {
                    img.src = newUrl;
                    window.parent.postMessage({ type: 'LOG_ACTIVITY', msg: 'URL Gambar berhasil diganti' }, '*');
                }
            });
        });

        window.addEventListener('message', (event) => {
            if(event.data === 'REQUEST_EXPORT') {
                const cloneDOM = document.documentElement.cloneNode(true);
                cloneDOM.querySelectorAll('[contenteditable="true"]').forEach(el => el.removeAttribute('contenteditable'));
                cloneDOM.querySelectorAll('.gemini-img-editable').forEach(el => {
                    el.classList.remove('gemini-img-editable');
                    if(el.classList.length === 0) el.removeAttribute('class');
                });
                const styleTag = cloneDOM.querySelector('#gemini-builder-style');
                if(styleTag) styleTag.remove();
                const scriptTag = cloneDOM.querySelector('#gemini-builder-script');
                if(scriptTag) scriptTag.remove();
                
                const pureHTML = '<!DOCTYPE html>\\n<html lang="' + (cloneDOM.lang || 'en') + '">\\n' + cloneDOM.innerHTML + '\\n</html>';
                window.parent.postMessage({ type: 'EXPORT_RESULT', html: pureHTML }, '*');
            }
        });
    `;
    doc.body.appendChild(scriptEl);
}

function submitForApproval() {
    if (isReadOnly) return;
    
    // Set loading state on button
    const btn = document.getElementById('btn-submit-approval');
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...';
        btn.disabled = true;
    }

    const iframe = document.getElementById('live-editor-iframe');
    if (iframe && iframe.contentWindow) {
        // Request exported pure HTML from iframe
        iframe.contentWindow.postMessage('REQUEST_EXPORT', '*');
    } else {
        processSubmission("HTML Error");
    }
}

function processSubmission(exportedHtml) {
    // Save draft to project data, now including the raw exported HTML from the builder
    currentProject.pendingUpdate = {
        status: 'pending_review',
        submittedAt: new Date().toISOString(),
        submittedBy: JSON.parse(localStorage.getItem('webkilat_session_v1')).username,
        content: JSON.parse(JSON.stringify(currentDraft)),
        rawExportedHtml: exportedHtml, // The pure HTML string
        note: 'Customer submitted changes for review.'
    };

    const projects = window.loadCustomerProjects();
    const idx = projects.findIndex(p => p.id === currentProject.id);
    if (idx > -1) {
        projects[idx] = currentProject;
        window.saveCustomerProjects(projects);
    }

    alert('Perubahan visual Anda telah dikirim beserta Export HTML murni dan menunggu persetujuan Admin.');
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

function showPendingPaymentScreen(order) {
    const statusText = order && order.status === 'payment_review' 
        ? "Pembayaran Anda sedang kami tinjau." 
        : "Menunggu Upload Bukti Pembayaran.";
        
    const btnUpload = order && order.status === 'payment_review'
        ? ""
        : `<button onclick="window.location.href='index.html'" class="mt-4 px-6 py-2 bg-brand-600 text-white rounded-lg font-bold">Upload Bukti</button>`;

    document.getElementById('mobile-backdrop').style.display = 'none';
    document.querySelector('aside').style.display = 'none';
    document.querySelector('main').innerHTML = `
        <div class="h-screen flex items-center justify-center bg-slate-50 p-6">
            <div class="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center border border-slate-200 fade-in">
                <div class="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm">
                    <i class="fa-solid fa-clock"></i>
                </div>
                <h2 class="text-2xl font-black text-slate-900 mb-2">Menunggu Pembayaran</h2>
                <p class="text-slate-500 mb-6">${statusText}</p>
                <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left mb-6">
                    <p class="text-sm text-slate-600 mb-2">ID Order: <span class="font-bold text-slate-900">${order ? order.id : '-'}</span></p>
                    <p class="text-sm text-slate-600 mb-2">Total Tagihan: <span class="font-bold text-brand-600">${order ? new Intl.NumberFormat('id-ID', {style:'currency',currency:'IDR',minimumFractionDigits:0}).format(order.total) : '-'}</span></p>
                </div>
                ${btnUpload}
                <button onclick="handleLogout()" class="block w-full text-center mt-4 text-sm font-bold text-slate-500 hover:text-slate-800">Logout</button>
            </div>
        </div>
    `;
}

function dashToast(msg, type='success') {
    alert(msg); // Simplified for MVP
}

window.onload = initApp;
