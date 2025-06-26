# Gunakan image Node.js resmi versi LTS
FROM node:20-alpine

# Set working directory di dalam container
WORKDIR /app

# Install git (karena alpine tidak menyertakan git secara default)
RUN apk add --no-cache git

# Copy file dependency dan install
COPY package*.json ./
RUN npm install

# Salin seluruh source code
COPY . .

# Clone repo dan pindahkan ke direktori src/utils
RUN git clone https://github.com/hitamcoklat/Jawa-Barat-Geo-JSON.git utils/Jawa-Barat-Geo-JSON

# Ubah port ke 5XXX untuk lingkungan development
EXPOSE 3000

# Jalankan aplikasi
CMD ["node", "app.js"]