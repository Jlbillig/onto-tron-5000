FROM node:18-alpine AS frontend-builder

WORKDIR /app
COPY csvui/package*.json ./csvui/
COPY package.json ./
COPY vite.config.js ./
WORKDIR /app/csvui
RUN npm install
COPY csvui/ ./
WORKDIR /app
RUN cd csvui && npm run build

FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY app.py .
COPY bfo-core.ttl .
COPY CommonCoreOntologiesMerged.ttl .

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/static/dist ./static/dist

EXPOSE 5055

CMD ["python", "app.py"]
