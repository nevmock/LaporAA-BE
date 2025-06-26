# Gunakan image Node.js resmi versi LTS
FROM node:20-alpine

# Set working directory di dalam container
WORKDIR /app

# Copy file dependency dan install
COPY package*.json ./
RUN npm install

# Salin seluruh source code
COPY . .

# Buka port untuk akses
EXPOSE 3000

# Jalankan aplikasi
CMD ["node", "app.js"]
