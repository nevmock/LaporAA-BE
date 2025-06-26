# Gunakan image Node.js resmi versi LTS
FROM node:20-alpine

# Set working directory di dalam container
WORKDIR /app

# Install git (karena alpine tidak menyertakan git secara default)
RUN apk add --no-cache git

# Copy file dependency dan install
COPY package*.json ./
RUN npm install

# Clone repo dan pindahkan ke direktori src/utils
RUN git clone https://github.com/hitamcoklat/Jawa-Barat-Geo-JSON.git /tmp/jabar-geojson \
    && mkdir -p src/utils \
    && mv /tmp/jabar-geojson/* src/utils/ \
    && rm -rf /tmp/jabar-geojson

# Salin seluruh source code
COPY . .

# Ubah port ke 5XXX untuk lingkungan development
EXPOSE 3000

# Jalankan aplikasi
CMD ["node", "app.js"]