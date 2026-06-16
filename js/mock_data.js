const PRICING_MODEL = {
    baseTotal: 1020000,
    items: [
        { id: 'template', name: 'Lisensi Template Premium & Hosting 1 Thn', price: 1020000 }
    ],
    addon: {
        id: 'jasa',
        name: 'Add-on: Jasa Pengerjaan Data (Setup Konten)',
        price: 500000
    }
};

function formatRp(num) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
}

function checkDomainMock() {
    const domainInput = document.getElementById('input-domain-search').value;
    const resultDiv = document.getElementById('domain-search-result');
    const fDomain = document.getElementById('f-domain');
    
    if(!domainInput) return alert('Masukkan nama domain!');
    
    const isAvailable = Math.random() > 0.3; // 70% chance available
    
    if(isAvailable) {
        resultDiv.innerHTML = `<div class="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700 text-sm font-bold"><i class="fa-solid fa-circle-check mr-2 text-lg"></i> Domain ${domainInput} tersedia!</div>`;
        fDomain.value = domainInput;
    } else {
        resultDiv.innerHTML = `<div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700 text-sm font-bold"><i class="fa-solid fa-circle-xmark mr-2 text-lg"></i> Domain ${domainInput} sudah terdaftar. Coba nama lain.</div>`;
        fDomain.value = '';
    }
}

const DB = {
    categories: [
        "Semua",
        "UMKM Online Shop",
        "Food & Agriculture Export",
        "Company Profile",
        "Export Company"
    ],
    styles: ["Corporate", "Modern Clean", "Earthy", "Minimalist", "Bold Industrial", "Elegant"],

    templates: [
        {
            "id": "lokal-onlineshop", "name": "LokalAja UMKM Shop", "category": "UMKM Online Shop", "style": "Minimalist",
            "description": "Template untuk toko online UMKM. Mendukung keranjang belanja dengan pembayaran direct via WhatsApp yang praktis dan efisien.",
            "badges": ["Best for Store", "WA Checkout"], "features": ["Product Grid & Filter", "WhatsApp Cart System", "Mobile E-commerce Layout"],
            "fileUrl": "lokalonlineshop.html", "colorPalette": { "primary": "#ea580c" },
            "recommendedFor": ["Toko Online", "Boutique", "Penjual Makanan/Minuman"],
            "pagesIncluded": ["Beranda", "Semua Produk", "Kategori Spesifik", "Keranjang Belanja", "Checkout WhatsApp"], "ctaText": "Gunakan Toko Ini",
            "status": "published"
        },
        {
            "id": "agri-organic-supply", "name": "AgriOrganic Supply", "category": "Food & Agriculture Export", "style": "Earthy",
            "description": "Desain hijau segar yang menonjolkan aspek pertanian organik dan sustainability untuk ekspor hasil bumi. Dengan layout responsif lengkap.",
            "badges": ["Popular", "Mobile Friendly"], "features": ["Farm Tour Gallery", "Product Presentation", "Sustainability Report", "WhatsApp CTA"],
            "fileUrl": "agriorganic_template.html", "colorPalette": { "primary": "#166534" },
            "recommendedFor": ["Pertanian Organik", "Distributor Buah", "Agrikultur Ekspor"],
            "pagesIncluded": ["Beranda", "Tentang Kami", "Produk", "Layanan", "Sustainability", "Kontak"], "ctaText": "Pilih Template Ini",
            "status": "published"
        },
        {
            "id": "corptrust-profile", "name": "CorpTrust Profile", "category": "Company Profile", "style": "Modern Clean",
            "description": "Template profil perusahaan yang profesional dan modern dengan warna teal yang membangkitkan rasa kepercayaan. Sangat cocok untuk jasa B2B.",
            "badges": ["Premium Design", "Responsive"], "features": ["Visi Misi Interaktif", "Galeri Portofolio Proyek", "Profil Tim Manajemen", "Form Kontak"],
            "fileUrl": "corptrust_companyprofile.html", "colorPalette": { "primary": "#0f766e" },
            "recommendedFor": ["Agensi Digital", "Konsultan Bisnis", "Perusahaan Jasa", "Kontraktor"],
            "pagesIncluded": ["Beranda", "Tentang Perusahaan", "Layanan", "Portofolio", "Tim Kami", "Hubungi Kami"], "ctaText": "Mulai Bangun Profil",
            "status": "published"
        },
        {
            "id": "export-global-trade", "name": "GlobalTrade Pro", "category": "Export Company", "style": "Corporate",
            "description": "Template B2B profesional untuk eksportir. Menampilkan kapabilitas suplai global, sertifikasi pabrik, dan form inquiry standar pembeli internasional.",
            "badges": ["Best for Exporter", "B2B Ready"], "features": ["Sertifikasi & Legalitas Grid", "B2B Product Details", "Global Reach Network", "Inquiry Form"],
            "fileUrl": "globaltrade_export.html", "colorPalette": { "primary": "#1e3a8a" },
            "recommendedFor": ["Eksportir Umum", "Trading Company", "Distributor Global", "Manufaktur"],
            "pagesIncluded": ["Beranda", "Fasilitas Pabrik", "Katalog Komoditas", "Sertifikasi", "Kontak / Inquiry"], "ctaText": "Gunakan Desain Eksportir",
            "status": "published"
        }
    ],

    pricing: [
        {
            id: "pkg-basic",
            name: "Paket Basic",
            price: "999.000",
            totalEst: "1.499.000",
            target: "Cocok untuk UMKM Awal & Profil Sederhana",
            features: ["Template Profesional Siap Pakai", "Maksimal 5 Halaman Web", "Desain 100% Mobile Responsive", "Tombol Chat WhatsApp Langsung", "Basic SEO & Indexing Google"],
            hostingEst: "± Rp 500.000 / thn",
            revision: "2x Revisi Minor",
            time: "3-5 Hari Kerja",
            highlight: false
        },
        {
            id: "pkg-export",
            name: "Paket Export Ready",
            price: "2.499.000",
            totalEst: "3.499.000",
            target: "Khusus Eksportir, Pabrik & Trading B2B",
            features: ["Semua Fitur Basic", "Maksimal 10 Halaman", "Katalog Produk B2B (Maks 30)", "Dual Bahasa (ID & EN)", "Form Inquiry Buyer Global", "Halaman Sertifikasi Spesifik"],
            hostingEst: "± Rp 1.000.000 / thn",
            revision: "4x Revisi Detail",
            time: "7-10 Hari Kerja",
            highlight: true
        },
        {
            id: "pkg-pro",
            name: "Paket Business Pro",
            price: "3.499.000",
            totalEst: "4.999.000",
            target: "Perusahaan Besar & Toko Online Aktif",
            features: ["Semua Fitur Export Ready", "Katalog hingga 100 Produk", "Fitur Keranjang & Checkout (Opsional)", "Integrasi Google Analytics", "Advanced On-page SEO", "Bantuan Input Konten Penuh"],
            hostingEst: "± Rp 1.500.000 / thn",
            revision: "Unlimited Revisi Minor (Masa Dev)",
            time: "10-14 Hari Kerja",
            highlight: false
        }
    ]
};

// Custom Categories Section Data
const categoryCards = [
    { name: "UMKM Online Shop", desc: "Toko digital siap jualan.", icon: "fa-store" },
    { name: "Food & Agriculture Export", desc: "Tampilkan kualitas komoditas.", icon: "fa-leaf" },
    { name: "Company Profile", desc: "Bangun kredibilitas bisnis.", icon: "fa-building" },
    { name: "Export Company", desc: "Standar B2B internasional.", icon: "fa-earth-americas" }
];

// Mock Data untuk MVP
const mockData = {
    orders: [
        { id: 'ORD-001', customer: 'PT Makmur Jaya', template: 'GlobalTrade Pro', status: 'In Progress', date: '12 Jun 2026', price: '3.499.000' },
        { id: 'ORD-002', customer: 'Budi Santoso', template: 'LokalAja UMKM Shop', status: 'Pending Payment', date: '13 Jun 2026', price: '1.499.000' },
        { id: 'ORD-003', customer: 'Agro Nusantara', template: 'AgriOrganic Supply', status: 'Revision', date: '10 Jun 2026', price: '4.999.000' }
    ],
    stats: {
        totalOrders: 24,
        activeProjects: 5,
        pendingRevisions: 2,
        revenue: 'Rp 45.500.000'
    }
};

// Load templates from localStorage or initialize if not present
const savedTemplates = localStorage.getItem('hatitiga_templates_db');
if (!savedTemplates) {
    localStorage.setItem('hatitiga_templates_db', JSON.stringify(DB.templates));
} else {
    // Override DB.templates with localStorage data
    DB.templates = JSON.parse(savedTemplates);
}

const MOCK_USERS = [
    {
        id: "user_demo",
        username: "user",
        password: "1234",
        role: "user",
        verifiedCustomer: false,
        customerStatus: "lead",
        displayName: "User Demo",
        permissions: []
    },
    {
        id: "cust_a",
        username: "User A",
        password: "123",
        role: "customer",
        verifiedCustomer: true,
        customerStatus: "live_active",
        displayName: "PT Global Rempah Nusantara",
        projectId: "project_a",
        subscriptionEndsAt: "2026-12-31",
        permissions: ["view_dashboard", "edit_limited_content", "request_update", "upload_assets"]
    },
    {
        id: "cust_b",
        username: "User B",
        password: "1234",
        role: "customer",
        verifiedCustomer: true,
        customerStatus: "live_active",
        displayName: "CV Maju Jaya Digital",
        projectId: "project_b",
        subscriptionEndsAt: "2026-12-31",
        permissions: ["view_dashboard", "edit_limited_content", "request_update", "upload_assets"]
    },
    {
        id: "admin_001",
        username: "admin",
        password: "admin",
        role: "admin",
        verified: true,
        permissions: ["manage_templates", "manage_orders", "manage_customers", "edit_website"]
    },
    {
        id: "cust_c",
        username: "User C",
        password: "123",
        role: "customer",
        verifiedCustomer: true,
        customerStatus: "setup",
        displayName: "User C Baru Beli",
        projectId: "project_c",
        subscriptionEndsAt: "2026-12-31",
        permissions: ["view_dashboard"]
    }
];

const INITIAL_MOCK_PROJECTS = [
    {
        id: "project_a",
        customerUsername: "User A",
        customerName: "PT Global Rempah Nusantara",
        templateId: "globaltrade-pro",
        templateFamily: "export_catalog",
        status: "live_active",
        liveContent: {
            businessName: "PT Global Rempah Nusantara",
            logoText: "Global Rempah",
            heroTitle: "Premium Indonesian Spices Exporter",
            heroSubtitle: "Supplying high-quality spices for global buyers.",
            heroImage: "",
            whatsapp: "6281200000001",
            email: "sales@globalrempah.com",
            address: "Balikpapan, Indonesia",
            aboutText: "We supply selected Indonesian spices for international markets. We pride ourselves on the finest quality.",
            featuredImage: "",
            products: [
                {
                    id: "prod_1",
                    name: "Nutmeg",
                    description: "High-quality Indonesian nutmeg for export.",
                    image: "",
                    moq: "500 kg",
                    packaging: "25 kg bag"
                }
            ]
        },
        pendingUpdate: null,
        updateHistory: []
    },
    {
        id: "project_b",
        customerUsername: "User B",
        customerName: "CV Maju Jaya Digital",
        templateId: "corptrust-profile",
        templateFamily: "company_profile",
        status: "live_active",
        liveContent: {
            businessName: "CV Maju Jaya Digital",
            logoText: "Maju Jaya",
            heroTitle: "Professional Business Solution Partner",
            heroSubtitle: "Helping local businesses grow with trusted services.",
            heroImage: "",
            whatsapp: "6281200000002",
            email: "hello@majujaya.com",
            address: "Jakarta, Indonesia",
            aboutText: "We are a local company providing reliable business services with a focus on digital transformation.",
            featuredImage: "",
            services: [
                {
                    id: "srv_1",
                    title: "Business Consulting",
                    description: "Practical consulting for growing businesses."
                }
            ]
        },
        pendingUpdate: null,
        updateHistory: []
    },
    {
        id: "project_c",
        customerUsername: "User C",
        customerName: "User C Baru Beli",
        templateId: "lokalaja-umkm",
        templateFamily: "company_profile",
        status: "live_active",
        liveContent: {
            businessName: "Toko Kelontong Modern User C",
            logoText: "Toko C",
            heroTitle: "Kebutuhan Harian Anda, Lebih Mudah",
            heroSubtitle: "Berbelanja kebutuhan pokok dan harian dengan harga bersahabat.",
            heroImage: "",
            whatsapp: "6281200000003",
            email: "kontak@tokoc.com",
            address: "Bandung, Indonesia",
            aboutText: "Kami adalah toko lokal yang menyediakan berbagai macam kebutuhan harian sejak tahun 2024.",
            featuredImage: "",
            services: [
                {
                    id: "srv_c1",
                    title: "Pesan Antar",
                    description: "Gratis ongkir untuk wilayah sekitar toko."
                }
            ]
        },
        pendingUpdate: null,
        updateHistory: []
    }
];

window.loadCustomerProjects = function() {
    const saved = localStorage.getItem('hatitiga_customer_projects_v2');
    if (saved) {
        return JSON.parse(saved);
    }
    localStorage.setItem('hatitiga_customer_projects_v2', JSON.stringify(INITIAL_MOCK_PROJECTS));
    return INITIAL_MOCK_PROJECTS;
};

window.saveCustomerProjects = function(projects) {
    localStorage.setItem('hatitiga_customer_projects_v2', JSON.stringify(projects));
};

window.resetDemoData = function() {
    localStorage.removeItem('hatitiga_customer_projects_v2');
    window.loadCustomerProjects();
    alert('Demo data for customer projects has been reset to defaults.');
    window.location.reload();
};
