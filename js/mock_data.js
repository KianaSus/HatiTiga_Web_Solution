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
            price: "1.499.000",
            target: "Cocok untuk UMKM Awal & Profil Sederhana",
            features: ["Template Profesional Siap Pakai", "Maksimal 5 Halaman Web", "Desain 100% Mobile Responsive", "Tombol Chat WhatsApp Langsung", "Basic SEO & Indexing Google"],
            hosting: "Gratis Domain (.com/.id) & Hosting 1 Tahun",
            revision: "2x Revisi Minor",
            time: "3-5 Hari Kerja",
            highlight: false
        },
        {
            id: "pkg-export",
            name: "Paket Export Ready",
            price: "3.499.000",
            target: "Khusus Eksportir, Pabrik & Trading B2B",
            features: ["Semua Fitur Basic", "Maksimal 10 Halaman", "Katalog Produk B2B (Maks 30)", "Dual Bahasa (ID & EN)", "Form Inquiry Buyer Global", "Halaman Sertifikasi Spesifik"],
            hosting: "Gratis Domain (.com) & Cloud Hosting Premium",
            revision: "4x Revisi Detail",
            time: "7-10 Hari Kerja",
            highlight: true
        },
        {
            id: "pkg-pro",
            name: "Paket Business Pro",
            price: "4.999.000",
            target: "Perusahaan Besar & Toko Online Aktif",
            features: ["Semua Fitur Export Ready", "Katalog hingga 100 Produk", "Fitur Keranjang & Checkout (Opsional)", "Integrasi Google Analytics", "Advanced On-page SEO", "Bantuan Input Konten Penuh"],
            hosting: "Gratis Domain (.com) & Server High Performance",
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
        id: "cust_001",
        username: "UserC",
        password: "123456",
        role: "customer",
        verifiedCustomer: true,
        customerStatus: "live_active",
        displayName: "CV. Maju Jaya",
        projectId: "project_001",
        subscriptionEndsAt: "2026-12-31",
        permissions: [
            "view_dashboard",
            "edit_limited_content",
            "request_update",
            "upload_assets"
        ]
    },
    {
        id: "admin_001",
        username: "admin",
        password: "admin",
        role: "admin",
        verified: true,
        permissions: [
            "manage_templates",
            "manage_orders",
            "manage_customers",
            "edit_website"
        ]
    }
];
