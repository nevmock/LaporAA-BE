# Gunakan Node.js versi 22 berbasis Debian
FROM node:22

# Set working directory di dalam container
WORKDIR /app

# Copy file dependency dan install
COPY package*.json ./
RUN npm install

# Salin seluruh source code
COPY . .

# Build aplikasi
RUN npm run build

# Ubah port ke 5XXX untuk lingkungan development
EXPOSE 3000

# Jalankan aplikasi
CMD ["npm", "run", "start"]