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

    // Load Projects
    const projects = window.loadCustomerProjects ? window.loadCustomerProjects() : [];
    currentProject = projects.find(p => p.customerUsername === session.username);

    // Provide a default empty project for users who haven't bought yet (like User Demo)
    if (!currentProject) {
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

    renderStatusHistory();

    const iframe = document.getElementById('live-editor-iframe');
    if (iframe) {
        // Universal Visual Editor logic
        iframe.src = currentProject.templateFamily === 'company_profile' ? 'corptrust_companyprofile.html' : 'globaltrade_export.html';
        
        iframe.onload = () => {
            injectUniversalEditor(iframe);
        };
    }

    // Set up message listener for Activity Log and Export
    window.addEventListener('message', handleIframeMessage);
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

function dashToast(msg, type='success') {
    alert(msg); // Simplified for MVP
}

window.onload = initApp;
