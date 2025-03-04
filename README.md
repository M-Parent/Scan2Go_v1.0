## Scan2go

- Frontend-React:  
  This project comprises the React-based frontend component of Scan2Go. It allows users to upload files, which are then accessible via generated QR code scans. Additionally, the application enables users to download files from the backend for local storage. This frontend facilitates user interaction with the Scan2Go file management system, providing both upload and download functionalities.

- Backend-Express:  
  This project provides the backend API for Scan2Go. It handles file uploads, generates corresponding QR codes, and stores data within a MySQL database. Key functions include processing file submissions, creating unique QR code identifiers, and managing data persistence. This API serves as the core data processing component for the Scan2Go application.

## Docker-compoase.yaml

```bash
services:
  frontend:
    image: mpmk/s2g_frontend:v1.0
    container_name: frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - scan2go_network
    restart: unless-stopped
  backend:
    image: mpmk/s2g_backend:v1.0
    container_name: backend
    environment:
      SERVER_IP_REACT: 10.0.10.36 # host ip / frontend ip
      MYSQL_HOST: db              # Login to db container_name of db
      MYSQL_USER: scan2go         # Login to db user
      MYSQL_PASSWORD: password    # Login to db password
      MYSQL_DATABASE: scan2go     # Login to db DataBase
    depends_on:
      db:
        condition: service_healthy
    networks:
      - scan2go_network
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped
  db:
    image: mysql:latest
    container_name: db
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_USER: scan2go
      MYSQL_PASSWORD: password
      MYSQL_DATABASE: scan2go
    volumes:
      - db_data:/var/lib/mysql
    networks:
      - scan2go_network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p", "password"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    restart: unless-stopped
volumes:
  db_data:
networks:
  scan2go_network:
```
