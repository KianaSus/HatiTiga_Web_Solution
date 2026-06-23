# Menggunakan image Nginx versi ringan (alpine) sebagai base
FROM nginx:alpine

# Menyalin konfigurasi kustom Nginx (opsional, tapi disarankan untuk SPA)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Menyalin seluruh file project (HTML, CSS, JS, Asset) ke dalam direktori publik Nginx
COPY . /usr/share/nginx/html

# Mengekspos port 80 agar bisa diakses dari luar container
EXPOSE 80

# Menjalankan Nginx
CMD ["nginx", "-g", "daemon off;"]
