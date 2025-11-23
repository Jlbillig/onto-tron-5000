FROM node:18-alpine AS frontend-builder

WORKDIR /app/csvui
COPY csvui/package*.json ./
RUN npm install
COPY csvui/ ./
RUN npm run build

FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY app.py .
COPY bfo-core.ttl .
COPY CommonCoreOntologiesMerged.ttl .
COPY package.json .
COPY vite.config.js .

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/static/dist ./static/dist

EXPOSE 5055

CMD ["python", "app.py"]
