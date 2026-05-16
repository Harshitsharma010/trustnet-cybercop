TrustNet CyberCop

A cloud-ready ML-powered phishing detection platform that analyzes suspicious URLs using a trained RandomForest model and serves real-time predictions through a production-style Flask API.

Overview

TrustNet CyberCop is a cybersecurity-focused machine learning platform designed to detect potentially malicious and phishing URLs in real time.

The project combines:

Machine Learning inference

Flask backend APIs

React frontend dashboard

Docker containerization

Production Gunicorn server

Cloud-ready deployment architecture

AWS ECS compatibility

The system extracts URL-based security features, evaluates them using a trained RandomForestClassifier model, and returns phishing-risk predictions through a REST API.

Features

Real-time phishing URL detection

Machine learning-powered prediction engine

Flask REST API backend

React + Vite frontend dashboard

Dockerized backend service

Gunicorn production server

Health monitoring endpoint

Fast inference response times

Cloud deployment ready

AWS ECS/Fargate compatible architecture

Tech Stack

Backend

Python

Flask

Gunicorn

scikit-learn

NumPy

joblib

Frontend

React

Vite

JavaScript

ML & Data

RandomForestClassifier

Feature extraction pipeline

URL-based phishing dataset

DevOps & Cloud

Docker

AWS ECS (deployment-ready)

AWS ECR

CloudWatch-ready logging architecture

System Architecture

React Frontend
       ↓
Flask API Backend
       ↓
Feature Extraction Pipeline
       ↓
RandomForest ML Model
       ↓
Prediction Response

Future Cloud Deployment Architecture:

React Frontend
       ↓
AWS Load Balancer / API Gateway
       ↓
ECS Fargate Flask API
       ↓
ML Inference Engine
       ↓
CloudWatch Monitoring & Logs

API Endpoints

Health Check

GET /health

Example Response

{
  "model_loaded": true,
  "status": "healthy"
}

Predict URL

POST /predict

Request Body

{
  "url": "https://example.com"
}

Example Response

{
  "phishing_chance": 0.0,
  "prediction": 0,
  "response_time_ms": 158.8,
  "status": "Safe",
  "url": "https://example.com"
}

Local Development Setup

Clone Repository

git clone https://github.com/Harshitsharma010/trustnet-cybercop.git
cd trustnet-cybercop

Backend Setup

cd backend
python -m pip install -r requirements.txt
python api.py

Backend runs on:

http://127.0.0.1:5000

Frontend Setup

cd dashboard
npm install
npm run dev

Frontend runs on:

http://localhost:8080

Docker Setup

Build Docker Image

cd backend
docker build -t trustnet-api .

Run Docker Container

docker run -p 5000:5000 trustnet-api

Production Features

Gunicorn Production Server

The backend uses Gunicorn for production-grade API serving.

Health Monitoring

A dedicated /health endpoint allows:

Container health checks

ECS health monitoring

Load balancer verification

Service availability checks

Dockerized Backend

The backend is fully containerized and tested locally using Docker.

Cloud Deployment Roadmap

Planned deployment stack:

AWS ECR for container registry

AWS ECS Fargate for container orchestration

CloudWatch logs and monitoring

GitHub Actions CI/CD pipeline

Infrastructure automation

Security Focus

This project focuses on:

URL threat analysis

Phishing detection

Security-oriented feature engineering

API-based cyber threat assessment

Project Highlights

Built a cloud-ready ML inference platform

Dockerized a production-style Flask backend

Integrated ML prediction APIs with a React dashboard

Added health monitoring endpoints for deployment readiness

Implemented real-time phishing URL analysis

Designed deployment architecture compatible with AWS ECS

Future Improvements

CI/CD pipeline with GitHub Actions

AWS ECS Fargate deployment

CloudWatch observability integration

Authentication & API rate limiting

Threat history database

Advanced phishing confidence scoring

Terraform infrastructure provisioning

Screenshots

Add screenshots here:

Frontend dashboard

Prediction results

Docker container logs

AWS deployment architecture

CloudWatch dashboards

Author

Harshit Sharma

GitHub: https://github.com/Harshitsharma010

License

This project is intended for educational, research, and cybersecurity learning purposes.

