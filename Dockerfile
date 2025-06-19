# Gunakan image Node.js resmi versi LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Salin file dependency terlebih dahulu untuk cache layer
COPY package*.json ./

# Install dependencies
RUN npm install --production
# Jika untuk development, gunakan: RUN npm install

# Salin seluruh source code ke dalam container
COPY . .

# Buka port (ubah jika aplikasimu menggunakan port lain)
EXPOSE 3000

# Perintah untuk menjalankan server Express
CMD ["node", "app.js"]
