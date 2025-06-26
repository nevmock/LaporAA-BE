# Gunakan image Node.js resmi versi LTS
FROM node:20-alpine

# Set working directory di dalam container
WORKDIR /app

# # Install git dan git-lfs (untuk mengambil file GeoJSON asli, bukan pointer)
# RUN apk add --no-cache git git-lfs && git lfs install

# Copy file dependency dan install
COPY package*.json ./
RUN npm install

# Salin seluruh source code
COPY . .

# # Clone repo dan ambil file LFS ke direktori src/utils
# RUN git clone https://github.com/hitamcoklat/Jawa-Barat-Geo-JSON.git utils/Jawa-Barat-Geo-JSON && \
#     cd utils/Jawa-Barat-Geo-JSON && \
#     git lfs pull


# Buka port untuk akses
EXPOSE 3000

# Jalankan aplikasi
CMD ["node", "app.js"]
