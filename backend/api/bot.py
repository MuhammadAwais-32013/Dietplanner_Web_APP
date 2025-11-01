import os
import uuid
import json
import asyncio
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import sys
import tempfile
import shutil
import re

# Add the ChatBot directory to the path so we can import its modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ChatBot'))

# Import ChatBot modules (these are the existing functions we'll wrap)
from ocr_parser import extract_and_parse, extract_text_only
from retriever import KnowledgeBaseRetriever
from gemini_llm import generate_diet_plan_with_gemini
from knowledge_base import process_pdf_to_faiss
from batch_ingest import batch_ingest

def extract_response_constraints(message: str) -> Dict[str, Any]:
    """Extract response length constraints from the message."""
    constraints = {}
    
    # Check for line count specifications - handle more variations
    line_patterns = [
        r'(?:in|within|use|give|write|just)?\s*(\d+)(?:\s*(?:to|-)\s*(\d+))?\s*(?:line|lines?)',
        r'(\d+)(?:\s*(?:to|-)\s*(\d+))?\s*(?:line|lines?)\s*(?:answer|response|max)?',
        r'(?:plan|diet plan|response)\s*(?:in|within)\s*(\d+)(?:\s*(?:to|-)\s*(\d+))?\s*(?:line|lines?)'
    ]
    
    for pattern in line_patterns:
        line_match = re.search(pattern, message.lower())
        if line_match:
            min_lines = int(line_match.group(1))
            max_lines = int(line_match.group(2)) if line_match.group(2) else min_lines
            constraints['min_lines'] = min_lines
            constraints['max_lines'] = max_lines
            break
    
    # Check if this is a diet plan request
    diet_plan_keywords = ['diet plan', 'meal plan', 'day plan', 'week plan', 'food plan']
    constraints['is_diet_plan'] = any(keyword in message.lower() for keyword in diet_plan_keywords)
    
    return constraints

def is_diet_related_question(message: str) -> bool:
    """Check if the question is related to diet, diabetes, or blood pressure."""
    # Common diet and health keywords
    keywords = [
        'diet', 'food', 'meal', 'eat', 'nutrition', 'sugar', 'glucose', 'carb', 'protein',
        'diabetes', 'diabetic', 'blood sugar', 'insulin', 'a1c', 'glycemic',
        'blood pressure', 'hypertension', 'sodium', 'salt', 'dash diet',
        'breakfast', 'lunch', 'dinner', 'snack', 'portion', 'weight', 'bmi',
        'cholesterol', 'fat', 'calorie', 'exercise', 'lifestyle', 'management',
        'plan', 'diet plan', 'days', 'week', 'month',
        'health', 'guidance', 'tips', 'advice', 'suggest', 'recommend',
        # Adding weight loss and fat reduction related terms
        'weight loss', 'lose weight', 'reduce fat', 'burn fat', 'slim', 
        'obesity', 'overweight', 'belly fat', 'body fat', 'metabolism',
        'diet tips', 'weight management', 'healthy weight', 'reduces fat'
    ]
    
    # Process message for better matching
    message = message.lower().strip()
    
    # Check individual words and phrases
    words = set(message.split())
    for keyword in keywords:
        # Check both exact phrases and word combinations
        if keyword in message or (
            len(keyword.split()) > 1 and 
            all(word in words for word in keyword.split())
        ):
            return True
            
    return False

router = APIRouter(prefix="/api/chat", tags=["chatbot"])

# Configuration
MAX_UPLOAD_SIZE_MB = 25
ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
CHATBOT_DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'ChatBot', 'data')

# Ensure required directories exist
os.makedirs(os.path.join(CHATBOT_DATA_DIR, 'uploads'), exist_ok=True)
os.makedirs(os.path.join(CHATBOT_DATA_DIR, 'sessions'), exist_ok=True)

# Pydantic models
class PatientInfo(BaseModel):
    condition: str  # "diabetes" or "hypertension" or "both"
    diabetes_type: Optional[str] = None  # "type1" or "type2" or None
    diabetes_level: Optional[str] = None  # "controlled", "uncontrolled", None
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None

class ChatMessage(BaseModel):
    message: str
    chat_history: Optional[List[Dict[str, Any]]] = []
    patient_info: Optional[PatientInfo] = None
    settings: Optional[Dict[str, Any]] = {}

class DietPlanRequest(BaseModel):
    duration: str  # "1_week", "10_days", "14_days", "21_days", "1_month"
    preferences: Optional[Dict[str, Any]] = {}

class ChatResponse(BaseModel):
    message_id: str
    response: str
    sources: List[Dict[str, Any]]
    meta: Dict[str, Any]

class IngestStatus(BaseModel):
    session_id: str
    status: str  # queued, in_progress, completed, failed
    detail: Optional[str] = None
    percent: Optional[int] = None

# Session management
sessions: Dict[str, Dict[str, Any]] = {}
ingest_tasks: Dict[str, Dict[str, Any]] = {}

# Session cleanup configuration
SESSION_TIMEOUT_HOURS = 24  # Sessions expire after 24 hours
import time
from datetime import datetime, timedelta

def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage"""
    import re
    # Remove or replace unsafe characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Limit length
    if len(filename) > 100:
        name, ext = os.path.splitext(filename)
        filename = name[:100-len(ext)] + ext
    return filename

def validate_file(file: UploadFile) -> bool:
    """Validate uploaded file"""
    if file.content_type not in ALLOWED_MIME_TYPES:
        return False
    if file.size and file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        return False
    return True

def cleanup_session_data(session_id: str):
    """Clean up all data associated with a session"""
    try:
        # Remove session from memory
        if session_id in sessions:
            del sessions[session_id]
        
        if session_id in ingest_tasks:
            del ingest_tasks[session_id]
        
        # Remove session directory
        session_dir = os.path.join(CHATBOT_DATA_DIR, 'uploads', session_id)
        if os.path.exists(session_dir):
            shutil.rmtree(session_dir)
        
        # Remove session metadata file
        session_file = os.path.join(CHATBOT_DATA_DIR, 'sessions', f"{session_id}.json")
        if os.path.exists(session_file):
            os.remove(session_file)
            
        print(f"Cleaned up session: {session_id}")
    except Exception as e:
        print(f"Error cleaning up session {session_id}: {e}")

def cleanup_expired_sessions():
    """Clean up sessions that have expired"""
    try:
        current_time = datetime.now()
        expired_sessions = []
        
        # Check session files for expiration
        sessions_dir = os.path.join(CHATBOT_DATA_DIR, 'sessions')
        if os.path.exists(sessions_dir):
            for filename in os.listdir(sessions_dir):
                if filename.endswith('.json'):
                    session_id = filename.replace('.json', '')
                    session_file = os.path.join(sessions_dir, filename)
                    
                    try:
                        with open(session_file, 'r') as f:
                            session_data = json.load(f)
                        
                        # Check if session has creation time
                        if 'created_at' in session_data:
                            created_time = datetime.fromisoformat(session_data['created_at'].replace('Z', '+00:00'))
                            if current_time - created_time > timedelta(hours=SESSION_TIMEOUT_HOURS):
                                expired_sessions.append(session_id)
                    except Exception as e:
                        print(f"Error reading session file {filename}: {e}")
                        # If we can't read the file, consider it expired
                        expired_sessions.append(session_id)
        
        # Clean up expired sessions
        for session_id in expired_sessions:
            cleanup_session_data(session_id)
            
        if expired_sessions:
            print(f"Cleaned up {len(expired_sessions)} expired sessions")
            
    except Exception as e:
        print(f"Error during session cleanup: {e}")



def extract_medical_data_from_files(session_id: str) -> Dict[str, Any]:
    """Extract comprehensive medical data from uploaded files using OCR parser"""
    medical_data = {
        "diabetes_info": {
            "diagnosis": "No",
            "glucose_levels": "No",
            "hba1c": "No",
            "diabetes_type": "No",
            "diabetes_control": "No",
            "insulin_use": "No",
            "diabetes_complications": "No"
        },
        "blood_pressure_info": {
            "readings": "No",
            "systolic": "No",
            "diastolic": "No",
            "hypertension_stage": "No",
            "hypertension_medication": "No"
        },
        "lab_results": {
            "has_lab_data": "No",
            "cholesterol_total": "No",
            "cholesterol_hdl": "No",
            "cholesterol_ldl": "No",
            "triglycerides": "No",
            "kidney_function": "No",
            "creatinine": "No",
            "egfr": "No",
            "liver_function": "No",
            "alt": "No",
            "ast": "No",
            "complete_blood_count": "No",
            "hemoglobin": "No",
            "white_blood_cells": "No",
            "thyroid_function": "No",
            "tsh": "No",
            "t3": "No",
            "t4": "No",
            "vitamin_d": "No",
            "b12": "No",
            "iron": "No",
            "ferritin": "No",
            "urine_analysis": "No",
            "microalbumin": "No"
        },
        "medical_history": {
            "chronic_conditions": [],
            "previous_diagnoses": [],
            "family_history": [],
            "surgical_history": [],
            "hospitalizations": [],
            "current_symptoms": [],
            "past_illnesses": [],
            "cardiovascular_history": [],
            "kidney_disease": "No",
            "eye_complications": "No",
            "neuropathy": "No"
        },
        "vital_signs": {
            "heart_rate": "No",
            "temperature": "No",
            "weight": "No",
            "height": "No",
            "bmi": "No",
            "oxygen_saturation": "No",
            "respiratory_rate": "No",
            "waist_circumference": "No"
        },
        "medications": [],
        "allergies": [],
        "extracted_text": "",
        "summary": {
            "primary_conditions": [],
            "risk_factors": [],
            "key_lab_values": [],
            "recommendations": []
        }
    }
    
    session_dir = os.path.join(CHATBOT_DATA_DIR, 'uploads', session_id)
    if not os.path.exists(session_dir):
        return medical_data
    
    try:
        # Process each file in the session directory
        for filename in os.listdir(session_dir):
            if filename.endswith(('.pdf', '.jpg', '.jpeg', '.png')):
                file_path = os.path.join(session_dir, filename)
                
                # Extract text using OCR parser
                try:
                    # Use extract_text_only for raw text extraction
                    extracted_text = extract_text_only(file_path)
                    medical_data["extracted_text"] += f"\n--- {filename} ---\n{extracted_text}"

                    # Use extract_and_parse for structured medical data
                    ocr_data = extract_and_parse(file_path)

                    # Look for specific medical information from parsed values first
                    if ocr_data:
                        # Glucose
                        glucose_vals = ocr_data.get('glucose')
                        if glucose_vals:
                            medical_data["diabetes_info"]["glucose_levels"] = f"Yes - {', '.join(str(g) for g in glucose_vals)} mg/dL"
                            medical_data["diabetes_info"]["diagnosis"] = medical_data["diabetes_info"].get("diagnosis") or "Yes - Diabetes indicators detected"

                        # HbA1c
                        hba1c_vals = ocr_data.get('hba1c')
                        if hba1c_vals:
                            medical_data["diabetes_info"]["hba1c"] = f"Yes - {', '.join(str(v) for v in hba1c_vals)}%"
                            medical_data["diabetes_info"]["diagnosis"] = medical_data["diabetes_info"].get("diagnosis") or "Yes - Diabetes indicators detected"

                        # Blood Pressure
                        bp_vals = ocr_data.get('bp')
                        if bp_vals:
                            medical_data["blood_pressure_info"]["readings"] = f"Yes - {', '.join(bp_vals)} mmHg"
                            try:
                                first_s, first_d = bp_vals[0].split('/')
                                medical_data["blood_pressure_info"]["systolic"] = f"Yes - {first_s} mmHg"
                                medical_data["blood_pressure_info"]["diastolic"] = f"Yes - {first_d} mmHg"
                            except Exception:
                                pass

                        # Cholesterol
                        chol_vals = ocr_data.get('cholesterol')
                        if chol_vals:
                            medical_data["lab_results"]["cholesterol"] = "Yes - Cholesterol data detected"
                            medical_data["lab_results"]["has_lab_data"] = "Yes - Lab data detected"

                    # Enhanced keyword-based extraction on raw text
                    text_lower = extracted_text.lower()

                    # Diabetes-related comprehensive extraction
                    if any(keyword in text_lower for keyword in ['diabetes', 'diabetic', 'type 1', 'type 2', 't1dm', 't2dm']):
                        medical_data["diabetes_info"]["diagnosis"] = "Yes - Diabetes detected"
                        
                        # Diabetes type detection
                        if any(keyword in text_lower for keyword in ['type 1', 't1dm', 'insulin dependent']):
                            medical_data["diabetes_info"]["diabetes_type"] = "Type 1"
                        elif any(keyword in text_lower for keyword in ['type 2', 't2dm', 'non-insulin dependent']):
                            medical_data["diabetes_info"]["diabetes_type"] = "Type 2"
                    
                    if medical_data["diabetes_info"].get("glucose_levels", "No") == "No":
                        glucose_matches = re.findall(r'(?:glucose|blood\s*sugar|fbs|rbs)[:\s]*(\d+(?:\.\d+)?)', text_lower)
                        if glucose_matches:
                            medical_data["diabetes_info"]["glucose_levels"] = f"Yes - {', '.join(glucose_matches)} mg/dL"
                    
                    if medical_data["diabetes_info"].get("hba1c", "No") == "No":
                        hba1c_matches = re.findall(r'(?:hba1c|a1c|hemoglobin\s*a1c)[:\s]*(\d+(?:\.\d+)?)', text_lower)
                        if hba1c_matches:
                            medical_data["diabetes_info"]["hba1c"] = f"Yes - {', '.join(hba1c_matches)}%"
                    
                    # Insulin use detection
                    if any(keyword in text_lower for keyword in ['insulin', 'injection', 'pump']):
                        medical_data["diabetes_info"]["insulin_use"] = "Yes - Insulin use detected"

                    # Blood pressure comprehensive extraction
                    if medical_data["blood_pressure_info"].get("readings", "No") == "No":
                        bp_matches = re.findall(r'(\d{2,3})\s*/\s*(\d{2,3})', text_lower)
                        if bp_matches:
                            bp_readings = [f"{systolic}/{diastolic}" for systolic, diastolic in bp_matches]
                            medical_data["blood_pressure_info"]["readings"] = f"Yes - {', '.join(bp_readings)} mmHg"
                            medical_data["blood_pressure_info"]["systolic"] = f"Yes - {bp_matches[0][0]} mmHg"
                            medical_data["blood_pressure_info"]["diastolic"] = f"Yes - {bp_matches[0][1]} mmHg"

                    # Comprehensive lab results extraction
                    if any(keyword in text_lower for keyword in ['lab', 'test', 'result', 'report', 'laboratory']):
                        medical_data["lab_results"]["has_lab_data"] = "Yes - Lab data detected"

                    # Cholesterol comprehensive extraction
                    if any(keyword in text_lower for keyword in ['cholesterol', 'hdl', 'ldl', 'triglycerides', 'lipid']):
                        medical_data["lab_results"]["cholesterol_total"] = "Yes - Cholesterol data detected"
                        
                        # Specific cholesterol values
                        total_chol = re.findall(r'(?:total\s*cholesterol|cholesterol)[:\s]*(\d+(?:\.\d+)?)', text_lower)
                        if total_chol:
                            medical_data["lab_results"]["cholesterol_total"] = f"Yes - {', '.join(total_chol)} mg/dL"
                        
                        hdl_chol = re.findall(r'(?:hdl|high\s*density)[:\s]*(\d+(?:\.\d+)?)', text_lower)
                        if hdl_chol:
                            medical_data["lab_results"]["cholesterol_hdl"] = f"Yes - {', '.join(hdl_chol)} mg/dL"
                        
                        ldl_chol = re.findall(r'(?:ldl|low\s*density)[:\s]*(\d+(?:\.\d+)?)', text_lower)
                        if ldl_chol:
                            medical_data["lab_results"]["cholesterol_ldl"] = f"Yes - {', '.join(ldl_chol)} mg/dL"
                        
                        trig = re.findall(r'(?:triglycerides|trig)[:\s]*(\d+(?:\.\d+)?)', text_lower)
                        if trig:
                            medical_data["lab_results"]["triglycerides"] = f"Yes - {', '.join(trig)} mg/dL"

                    # Kidney function comprehensive extraction
                    if any(keyword in text_lower for keyword in ['creatinine', 'egfr', 'kidney', 'renal', 'bun', 'urea']):
                        medical_data["lab_results"]["kidney_function"] = "Yes - Kidney function data detected"
                        
                        creatinine_vals = re.findall(r'(?:creatinine|creat)[:\s]*(\d+(?:\.\d+)?)', text_lower)
                        if creatinine_vals:
                            medical_data["lab_results"]["creatinine"] = f"Yes - {', '.join(creatinine_vals)} mg/dL"
                        
                        egfr_vals = re.findall(r'(?:egfr|gfr)[:\s]*(\d+(?:\.\d+)?)', text_lower)
                        if egfr_vals:
                            medical_data["lab_results"]["egfr"] = f"Yes - {', '.join(egfr_vals)} mL/min/1.73m²"

                    # Liver function tests
                    if any(keyword in text_lower for keyword in ['alt', 'ast', 'liver', 'hepatic', 'bilirubin']):
                        medical_data["lab_results"]["liver_function"] = "Yes - Liver function data detected"
                        
                        alt_vals = re.findall(r'(?:alt|alanine)[:\s]*(\d+(?:\.\d+)?)', text_lower)
                        if alt_vals:
                            medical_data["lab_results"]["alt"] = f"Yes - {', '.join(alt_vals)} U/L"
                        
                        ast_vals = re.findall(r'(?:ast|aspartate)[:\s]*(\d+(?:\.\d+)?)', text_lower)
                        if ast_vals:
                            medical_data["lab_results"]["ast"] = f"Yes - {', '.join(ast_vals)} U/L"

                    # Complete Blood Count
                    if any(keyword in text_lower for keyword in ['cbc', 'hemoglobin', 'hgb', 'hematocrit', 'hct', 'wbc', 'rbc', 'platelet']):
                        medical_data["lab_results"]["complete_blood_count"] = "Yes - CBC data detected"
                        
                        hgb_vals = re.findall(r'(?:hemoglobin|hgb)[:\s]*(\d+(?:\.\d+)?)', text_lower)
                        if hgb_vals:
                            medical_data["lab_results"]["hemoglobin"] = f"Yes - {', '.join(hgb_vals)} g/dL"
                        
                        wbc_vals = re.findall(r'(?:wbc|white\s*blood\s*cell)[:\s]*(\d+(?:\.\d+)?)', text_lower)
                        if wbc_vals:
                            medical_data["lab_results"]["white_blood_cells"] = f"Yes - {', '.join(wbc_vals)} K/μL"

                    # Thyroid function
                    if any(keyword in text_lower for keyword in ['tsh', 'thyroid', 't3', 't4', 'thyroxine']):
                        medical_data["lab_results"]["thyroid_function"] = "Yes - Thyroid function data detected"
                        
                        tsh_vals = re.findall(r'(?:tsh|thyroid\s*stimulating)[:\s]*(\d+(?:\.\d+)?)', text_lower)
                        if tsh_vals:
                            medical_data["lab_results"]["tsh"] = f"Yes - {', '.join(tsh_vals)} mIU/L"

                    # Medical history extraction
                    chronic_conditions = []
                    if any(keyword in text_lower for keyword in ['hypertension', 'high blood pressure']):
                        chronic_conditions.append("Hypertension")
                    if any(keyword in text_lower for keyword in ['heart disease', 'cardiac', 'coronary', 'mi', 'myocardial']):
                        chronic_conditions.append("Heart Disease")
                        medical_data["medical_history"]["cardiovascular_history"].append("Heart disease mentioned")
                    if any(keyword in text_lower for keyword in ['stroke', 'cva', 'cerebrovascular']):
                        chronic_conditions.append("Stroke")
                        medical_data["medical_history"]["cardiovascular_history"].append("Stroke mentioned")
                    if any(keyword in text_lower for keyword in ['kidney disease', 'renal failure', 'ckd', 'chronic kidney']):
                        chronic_conditions.append("Kidney Disease")
                        medical_data["medical_history"]["kidney_disease"] = "Yes - Kidney disease detected"
                    if any(keyword in text_lower for keyword in ['retinopathy', 'eye problem', 'vision']):
                        chronic_conditions.append("Eye Complications")
                        medical_data["medical_history"]["eye_complications"] = "Yes - Eye complications detected"
                    if any(keyword in text_lower for keyword in ['neuropathy', 'nerve damage', 'numbness']):
                        chronic_conditions.append("Neuropathy")
                        medical_data["medical_history"]["neuropathy"] = "Yes - Neuropathy detected"
                    
                    medical_data["medical_history"]["chronic_conditions"] = chronic_conditions

                    # Vital signs extraction
                    weight_matches = re.findall(r'(?:weight|wt)[:\s]*(\d+(?:\.\d+)?)\s*(?:kg|pounds?|lbs?)', text_lower)
                    if weight_matches:
                        medical_data["vital_signs"]["weight"] = f"Yes - {', '.join(weight_matches)} kg"
                    
                    height_matches = re.findall(r'(?:height|ht)[:\s]*(\d+(?:\.\d+)?)\s*(?:cm|inches?|in)', text_lower)
                    if height_matches:
                        medical_data["vital_signs"]["height"] = f"Yes - {', '.join(height_matches)} cm"
                    
                    bmi_matches = re.findall(r'(?:bmi|body\s*mass\s*index)[:\s]*(\d+(?:\.\d+)?)', text_lower)
                    if bmi_matches:
                        medical_data["vital_signs"]["bmi"] = f"Yes - {', '.join(bmi_matches)} kg/m²"

                    # Medications (excluding as requested)
                    # Note: Skipping medication extraction as per user request

                    # Allergies
                    if any(keyword in text_lower for keyword in ['allergy', 'allergic', 'intolerance', 'adverse reaction']):
                        medical_data["allergies"].append(f"Allergy mentioned in {filename}")

                    # Generate summary
                    summary = medical_data["summary"]
                    if medical_data["diabetes_info"]["diagnosis"] != "No":
                        summary["primary_conditions"].append("Diabetes")
                    if medical_data["blood_pressure_info"]["readings"] != "No":
                        summary["primary_conditions"].append("Hypertension")
                    if chronic_conditions:
                        summary["primary_conditions"].extend(chronic_conditions)
                    
                    # Risk factors
                    if medical_data["lab_results"]["cholesterol_total"] != "No":
                        summary["risk_factors"].append("High Cholesterol")
                    if medical_data["medical_history"]["kidney_disease"] != "No":
                        summary["risk_factors"].append("Kidney Disease")
                    if medical_data["medical_history"]["cardiovascular_history"]:
                        summary["risk_factors"].append("Cardiovascular History")

                except Exception as e:
                    print(f"Error processing file {filename}: {e}")
                    continue
                    
    except Exception as e:
        print(f"Error extracting medical data: {e}")
    
    return medical_data

async def ingest_files_background(session_id: str, file_paths: List[str], user_data: Dict[str, Any]):
    """Background task for file ingestion using RAG functions"""
    try:
        ingest_tasks[session_id] = {"status": "in_progress", "detail": "Starting ingestion..."}
        
        session_dir = os.path.join(CHATBOT_DATA_DIR, 'uploads', session_id)
        faiss_dir = os.path.join(session_dir, 'faiss')
        os.makedirs(faiss_dir, exist_ok=True)
        
        # Process each uploaded file
        for i, file_path in enumerate(file_paths):
            ingest_tasks[session_id]["detail"] = f"Processing file {i+1}/{len(file_paths)}"
            ingest_tasks[session_id]["percent"] = int((i / len(file_paths)) * 100)
            
            file_ext = os.path.splitext(file_path)[1].lower()
            base_name = os.path.splitext(os.path.basename(file_path))[0]
            
            if file_ext == '.pdf':
                # Process PDF using existing knowledge_base functions
                faiss_index_path = os.path.join(faiss_dir, f"{base_name}.index")
                chunk_path = os.path.join(faiss_dir, f"{base_name}_chunks.txt")
                process_pdf_to_faiss(file_path, faiss_index_path, chunk_path)
            else:
                # For images, extract text using OCR and create FAISS index
                try:
                    # Extract text from image
                    extracted_text = extract_text_only(file_path)
                    
                    # Create FAISS index for image text (same as PDF processing)
                    from knowledge_base import chunk_text, embed_chunks, store_embeddings
                    
                    chunks = chunk_text(extracted_text)
                    embeddings = embed_chunks(chunks)
                    
                    faiss_index_path = os.path.join(faiss_dir, f"{base_name}.index")
                    chunk_path = os.path.join(faiss_dir, f"{base_name}_chunks.txt")
                    
                    store_embeddings(embeddings, faiss_index_path)
                    
                    # Save chunks for retrieval
                    with open(chunk_path, 'w', encoding='utf-8') as f:
                        for chunk in chunks:
                            f.write(chunk + '\n---\n')
                    
                    print(f"Processed image {base_name} with {len(chunks)} chunks")
                    
                except Exception as e:
                    print(f"Error processing image {file_path}: {e}")
                    # Fallback: just store OCR data
                    ocr_data = extract_and_parse(file_path)
                    ocr_file = os.path.join(session_dir, f"{base_name}_ocr.json")
                    with open(ocr_file, 'w') as f:
                        json.dump(ocr_data, f)
        
        ingest_tasks[session_id] = {
            "status": "completed", 
            "detail": f"Successfully processed {len(file_paths)} files",
            "percent": 100
        }
        
        # Save session metadata
        session_meta = {
            "session_id": session_id,
            "user_data": user_data,
            "files": [os.path.basename(f) for f in file_paths],
            "faiss_dir": faiss_dir,
            "created_at": datetime.now().isoformat()
        }
        
        session_file = os.path.join(CHATBOT_DATA_DIR, 'sessions', f"{session_id}.json")
        with open(session_file, 'w') as f:
            json.dump(session_meta, f, indent=2)
            
    except Exception as e:
        ingest_tasks[session_id] = {
            "status": "failed", 
            "detail": f"Ingestion failed: {str(e)}",
            "percent": 0
        }

def format_concise_response(raw_text: str, constraints: Dict[str, Any]) -> str:
    """Format response to exactly match requested line count."""
    if not raw_text or not constraints:
        return raw_text
    
    # Split into main response and sections (if any)
    parts = raw_text.split("Lifestyle Recommendations", 1)
    main_response = parts[0].strip()
    
    # Count sentences in main response
    sentences = [s.strip() for s in re.split(r'[.!?]+', main_response) if s.strip()]
    
    if len(sentences) > constraints['max_lines']:
        # Truncate to max requested lines
        main_response = '. '.join(sentences[:constraints['max_lines']]) + '.'
    elif len(sentences) < constraints['min_lines']:
        # Response too short - return as is with note about brevity
        return main_response
    
    return main_response

def format_diet_plan_with_constraints(raw_text: str, max_lines: int) -> str:
    """
    Format a diet plan to fit within the specified line limit.
    For length-constrained responses, ONLY includes the diet plan days and meals,
    removing all other sections like lifestyle recommendations and notes.
    
    Args:
        raw_text: Raw diet plan text
        max_lines: Maximum number of lines allowed
    
    Returns:
        Formatted diet plan text within line limit
    """
    # Extract only the diet plan content (everything before any additional sections)
    sections_to_split = [
        'Lifestyle Recommendations',
        'Important Notes',
        'Lifestyle Recommendation',
        'Important Note',
        'Profile Data',
        'Exercise Plan',
        'Physical Activity',
        'Exercise Recommendations',
        'Note:',
        'Notes:'
    ]
    
    # Split at the first occurrence of any section header
    content = raw_text
    for section in sections_to_split:
        if section in content:
            content = content.split(section)[0]
    
    # Split the remaining content into lines and clean them
    lines = [line.strip() for line in content.strip().split('\n') if line.strip()]
    
    # Only keep lines that start with "Day"
    diet_plan_lines = [line for line in lines if line.startswith('Day ')]
    
    # Ensure we don't exceed max_lines
    return '\n'.join(diet_plan_lines[:max_lines]).strip()
    
    # Ensure we don't exceed max_lines
    return '\n'.join(diet_plan_lines[:max_lines]).strip()

def format_response(raw_text: str, is_diet_plan: bool = False, constraints: Optional[Dict[str, Any]] = None) -> str:
    """
    Create clean, professional responses like ChatGPT with minimal formatting.
    
    Args:
        raw_text: Raw text from the LLM
        is_diet_plan: Whether this is a diet plan response
        constraints: Dict with min_lines and max_lines if length constraint requested
    
    Returns:
        Clean, professional text with minimal formatting
    """
    if not raw_text or not raw_text.strip():
        return raw_text
    
    # For diet plans with length constraints, always use special handling
    if is_diet_plan and constraints and constraints.get('max_lines'):
        return format_diet_plan_with_constraints(raw_text, constraints['max_lines'])
    
    # For other cases with length constraints
    if constraints and (constraints.get('min_lines') is not None or constraints.get('max_lines') is not None):
        lines = raw_text.strip().split('\n')
        actual_lines = [line for line in lines if line.strip()]
      
        if constraints.get('max_lines') and len(actual_lines) > constraints['max_lines']:
            return '\n'.join(actual_lines[:constraints['max_lines']])
        
        if constraints.get('min_lines') and len(actual_lines) < constraints['min_lines']:
            return raw_text
    
    # Regular formatting for unconstrained responses
    # Step 1: Basic cleanup
    text = raw_text.strip()
    
    # Step 2: Remove excessive markdown and formatting
    text = re.sub(r'\*\*\*([^*]+)\*\*\*', r'**\1**', text)  # Fix triple asterisks
    text = re.sub(r'#{4,}', '###', text)  # Limit heading levels to ###
    
    # Step 3: Clean up excessive line breaks
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    
    # Step 4: Standardize list formatting
    lines = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            lines.append('')
            continue
        
        # Convert various bullet points to simple dashes
        if re.match(r'^[•*·]\s+', line):
            line = re.sub(r'^[•*·]\s+', '- ', line)
        elif re.match(r'^-\s+', line):
            line = line  # Already correct
        elif re.match(r'^\d+\.\s+', line):
            line = line  # Keep numbered lists
        
        lines.append(line)
    
    # Step 5: Join lines and clean up
    text = '\n'.join(lines)
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)  # Final cleanup
    
    # Step 6: Ensure required sections are present for diet plans and health guidance
    if is_diet_plan or any(keyword in text.lower() for keyword in ['diet', 'nutrition', 'health', 'lifestyle']):
        # Check if Lifestyle Recommendations section exists
        if 'lifestyle recommendations' not in text.lower():
            text += '\n\nLifestyle Recommendations:\n- Exercise: 150 minutes of moderate activity per week\n- Stress Management: Practice yoga, meditation, or deep breathing\n- Sleep: Aim for 7-9 hours of quality sleep\n- Hydration: Drink at least 8 glasses of water daily\n- Regular Monitoring: Check blood sugar and blood pressure as advised'
        
        # Check if Important Notes section exists
        if 'important notes' not in text.lower():
            text += '\n\nImportant Notes:\n- This is for educational purposes only\n- Always consult your healthcare provider before making significant changes\n- Monitor your health indicators regularly\n- Individual needs may vary\n- Seek medical attention for any concerning symptoms'
    
    return text

def contains_inappropriate_content(text: str) -> bool:
    """Check if the text contains inappropriate or harmful content."""
    inappropriate_terms = {
        'human', 'poison', 'toxic', 'kill', 'deadly', 'harmful', 'illegal',
        'dangerous', 'explosive', 'weapon', 'suicide', 'murder', 'cannibalism'
    }
    
    text_lower = text.lower()
    return any(term in text_lower for term in inappropriate_terms)

def format_general_response() -> str:
    """Short, polite response for questions outside scope."""
    return (
        "Sorry, I can only help with diet planning and nutrition for diabetes and blood pressure. "
        "Ask about diet, meals, or generate a plan (7, 10, 14, 21, or 30 days)."
    )


def map_duration_to_days(duration: str) -> Optional[int]:
    """Map supported duration keys to exact day counts."""
    mapping = {
        "7_days": 7,
        "10_days": 10,
        "14_days": 14,
        "21_days": 21,
        "30_days": 30,
        # Also support the old format for backward compatibility
        "1_week": 7,
        "1_month": 30,
    }
    return mapping.get(duration)


def parse_days_from_text(message: str) -> Optional[int]:
    """Extract requested number of days from free text like 'plan for 30 days' or '2 weeks' or '1 month'."""
    msg = message.lower()
    # Explicit days, e.g., 10 days / 14 day
    m = re.search(r"(\d+)\s*day(s)?", msg)
    if m:
        try:
            return int(m.group(1))
        except Exception:
            pass
    # Weeks, e.g., 1 week / 2 weeks
    m = re.search(r"(\d+)\s*week(s)?", msg)
    if m:
        try:
            return int(m.group(1)) * 7
        except Exception:
            pass
    # Month (~30 days)
    if re.search(r"\b1\s*month\b", msg):
        return 30
    if re.search(r"\b30\s*day(s)?\b", msg):
        return 30
    return None


def unsupported_duration_response() -> str:
    """Polite guidance for unsupported duration requests."""
    return (
        "I can generate diet plans for these durations: 7 days (1 week), 10 days, 14 days, 21 days, or 30 days (1 month). "
        "Please choose one of these options."
    )

@router.post("/session")
async def create_chat_session(
    background_tasks: BackgroundTasks,
    medical_condition: str = Form(...),
    files: List[UploadFile] = File([])
):
    """Create a new chat session and upload initial files"""
    try:
        # Parse medical condition
        medical_data = json.loads(medical_condition)
        
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Create session directory
        session_dir = os.path.join(CHATBOT_DATA_DIR, 'uploads', session_id)
        os.makedirs(session_dir, exist_ok=True)
        
        # Save uploaded files
        file_paths = []
        for file in files:
            if validate_file(file):
                filename = sanitize_filename(file.filename)
                file_path = os.path.join(session_dir, filename)
                
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                file_paths.append(file_path)
        
        # Store session data
        sessions[session_id] = {
            "user_data": medical_data,
            "files": file_paths,
            "chat_history": [],
            "created_at": datetime.now().isoformat()
        }
        
        # Start background ingestion if files were uploaded
        if file_paths:
            background_tasks.add_task(
                ingest_files_background, 
                session_id, 
                file_paths, 
                medical_data
            )
            ingest_tasks[session_id] = {"status": "queued", "detail": "Files queued for processing"}
        else:
            ingest_tasks[session_id] = {"status": "completed", "detail": "No files to process"}
        
        return {"session_id": session_id, "status": "created"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating session: {str(e)}")

@router.get("/session/{session_id}/ingest-status")
async def get_ingest_status(session_id: str):
    """Get the status of file ingestion for a session"""
    if session_id not in ingest_tasks:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return ingest_tasks[session_id]

@router.post("/{session_id}/message")
async def send_message(session_id: str, message_data: ChatMessage):
    """Send a message and get a response"""
    try:
        # Validate session
        if session_id not in sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = sessions[session_id]
        user_data = session["user_data"]
        
        # Basic message validation
        if not message_data or not message_data.message or not message_data.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
            
        # Check for inappropriate content
        if contains_inappropriate_content(message_data.message):
            return {
                "response": "I apologize, but I cannot assist with harmful or inappropriate content. I'm designed to provide healthy diet and nutrition advice only.",
                "sources": []
            }
        
        # Check if ingestion is complete
        if session_id in ingest_tasks and ingest_tasks[session_id]["status"] != "completed":
            raise HTTPException(status_code=400, detail="File ingestion not complete")
            
        message_lower = message_data.message.lower()
        
        # Initialize variables that may be used later
        constraints = {}
        retrieved_context = ""
        faiss_dir = os.path.join(CHATBOT_DATA_DIR, 'uploads', session_id, 'faiss')
        requested_days = None
        supported_days = {7, 10, 14, 21, 30}

        # Check if the question is diet-related
        if not is_diet_related_question(message_lower):
            response_text = format_general_response()
            sources = []
        else:
            # If user explicitly asks for a plan for N days/weeks/month
            requested_days = parse_days_from_text(message_lower)
            supported_days = {7, 10, 14, 21, 30}

            # Prepare context using RAG functions (used in both branches below)
            retrieved_context = ""
            faiss_dir = os.path.join(CHATBOT_DATA_DIR, 'uploads', session_id, 'faiss')
            if os.path.exists(faiss_dir) and any(f.endswith('.index') for f in os.listdir(faiss_dir)):
                try:
                    retriever = KnowledgeBaseRetriever(faiss_dir)
                    results = retriever.retrieve(message_data.message, top_k=3)
                    retrieved_context = "\n---\n".join([f"[Source: {r['source']}]\n{r['chunk']}" for r in results])
                except Exception as e:
                    print(f"Warning: Error retrieving context: {e}")

            # Get comprehensive medical data
            medical_data = extract_medical_data_from_files(session_id)
            
            # Get OCR data (fallback for backward compatibility)
            ocr_data = None
            session_dir = os.path.join(CHATBOT_DATA_DIR, 'uploads', session_id)
            for file in os.listdir(session_dir):
                if file.endswith('_ocr.json'):
                    with open(os.path.join(session_dir, file), 'r') as f:
                        ocr_data = json.load(f)
                    break

            if requested_days is not None:
                if requested_days in supported_days:
                    # Extract line constraints if any
                    constraints = extract_response_constraints(message_data.message)
                    line_limit_text = ""
                    format_instruction = "For each day include: Breakfast:, Mid-Morning Snack:, Lunch:, Afternoon Snack:, Dinner: with portions and simple timing."
                    
                    if constraints.get('min_lines') or constraints.get('max_lines'):
                        line_limit_text = "\nCRITICAL FORMATTING REQUIREMENTS:"
                        if constraints.get('min_lines') and constraints.get('max_lines'):
                            line_limit_text += f"\n- Total response MUST be between {constraints['min_lines']} and {constraints['max_lines']} lines"
                        elif constraints.get('max_lines'):
                            line_limit_text += f"\n- Total response MUST NOT exceed {constraints['max_lines']} lines"
                            
                        format_instruction = "For each day include essential meals (Breakfast, Lunch, Dinner) with portions. Use concise format."
                        line_limit_text += "\n- Use abbreviated format to meet line limit"
                        line_limit_text += "\n- Combine similar days if needed"
                        line_limit_text += "\n- Focus on essential information only"
                        line_limit_text += "\n- Skip optional sections if needed to meet line limit"

                    prompt = f"""
You are a clinical dietitian specializing in diabetes and hypertension management. Create a personalized diet plan.

Duration: EXACTLY {requested_days} days. Output MUST be day-wise with headings 'Day 1:' through 'Day {requested_days}:'.{line_limit_text}
{format_instruction}

Context from uploaded documents:
{retrieved_context}

User Information:
- Diabetes: {user_data.get('hasDiabetes', False)}
- Diabetes Type: {user_data.get('diabetesType', 'N/A')}
- Diabetes Level: {user_data.get('diabetesLevel', 'N/A')}
- Blood Pressure: {user_data.get('hasHypertension', False)}
- BP Readings: {user_data.get('systolic', 'N/A')}/{user_data.get('diastolic', 'N/A')} mmHg
- Height: {user_data.get('height', 'N/A')} cm
- Weight: {user_data.get('weight', 'N/A')} kg

COMPREHENSIVE MEDICAL DATA FROM UPLOADED RECORDS:
- Diabetes Information: {medical_data['diabetes_info']}
- Blood Pressure Information: {medical_data['blood_pressure_info']}
- Lab Results: {medical_data['lab_results']}
- Medical History: {medical_data['medical_history']}
- Vital Signs: {medical_data['vital_signs']}
- Primary Conditions: {medical_data['summary']['primary_conditions']}
- Risk Factors: {medical_data['summary']['risk_factors']}

REQUIRED SECTIONS (include these at the end):
1. Lifestyle Recommendations: Include exercise, stress management, sleep, and daily habits
2. Important Notes: Include medical disclaimers, monitoring tips, and when to consult healthcare providers

Formatting:
- Start each day with 'Day X:' on a new line
- Keep it concise and readable
- Always include the two required sections at the end
- Consider the comprehensive medical data when creating personalized recommendations
"""
                    response_text = generate_diet_plan_with_gemini(prompt)
                    # Save to session diet plans
                    if "diet_plans" not in session:
                        session["diet_plans"] = []
                    session["diet_plans"].append({
                        "duration": f"{requested_days}_days",
                        "plan": response_text,
                        "timestamp": asyncio.get_event_loop().time()
                    })
                else:
                    response_text = unsupported_duration_response()
            else:
                # General diet-related response (not an explicit multi-day plan request)
                # Check for response length constraints
                constraints = extract_response_constraints(message_data.message)
                length_guideline = ""
                
                if constraints:
                    response_type = "STRICT LENGTH-CONTROLLED RESPONSE"
                    length_instruction = f"CRITICAL: Your entire response must be EXACTLY {constraints['min_lines']} sentences."
                    if constraints['max_lines'] > constraints['min_lines']:
                        length_instruction = f"CRITICAL: Your entire response must be between {constraints['min_lines']} and {constraints['max_lines']} sentences."
                    
                    length_guideline = f"""
RESPONSE TYPE: {response_type}
{length_instruction}

STRICT RULES:
1. Provide ONLY {constraints['min_lines']}-{constraints['max_lines']} complete sentences
2. Each sentence = one clear, factual statement ending with a period
3. NO bullet points, NO lists, NO extra sections
4. NO Lifestyle Recommendations section
5. NO Important Notes section
6. NO disclaimers or extra context
7. If the question is inappropriate/unsafe, respond with ONE sentence stating you cannot assist
8. Answer ONLY the specific question asked

Format Example for 2-line response:
"X is good for blood pressure because of Y. However, be mindful of Z when consuming it."

STOP after exact number of sentences. Any extra content = task failed.

EXAMPLE of correct 2-line response:
Lean proteins like chicken and fish are excellent choices for managing blood pressure. Complex carbohydrates such as whole grains and vegetables should form the foundation of your meals.

REMINDER: Break this format and you fail the task entirely."""

                prompt = f"""
You are a clinical dietitian specializing in diabetes and hypertension management. Provide a helpful, evidence-based response to the following question.

User Question: {message_data.message}

Context from uploaded documents:
{retrieved_context}

User Information:
- Diabetes: {user_data.get('hasDiabetes', False)}
- Diabetes Type: {user_data.get('diabetesType', 'N/A')}
- Diabetes Level: {user_data.get('diabetesLevel', 'N/A')}
- Blood Pressure: {user_data.get('hasHypertension', False)}
- BP Readings: {user_data.get('systolic', 'N/A')}/{user_data.get('diastolic', 'N/A')} mmHg
- Height: {user_data.get('height', 'N/A')} cm
- Weight: {user_data.get('weight', 'N/A')} kg
- Lab Results: {ocr_data if ocr_data else 'N/A'}

{length_guideline}

REQUIRED SECTIONS (include these at the end):
1. Lifestyle Recommendations: Include exercise, stress management, sleep, and daily habits
2. Important Notes: Include medical disclaimers, monitoring tips, and when to consult healthcare providers

Guidelines:
- Give clear, actionable advice with simple bullet points
- Keep formatting clean and professional
- If this is a health guidance request, provide practical tips based on the user's specific conditions
- Focus on lifestyle, diet, exercise, and management strategies
- Be encouraging and supportive while maintaining medical accuracy
- Always include the two required sections at the end
"""
                response_text = generate_diet_plan_with_gemini(prompt)
        
        # Format the response for consistent styling
        # Check if this is a diet plan response
        is_diet_plan_response = requested_days is not None and requested_days in supported_days
        response_text = format_response(
            response_text,
            is_diet_plan=is_diet_plan_response,
            constraints=constraints if constraints else None
        )
        
        # Extract sources from retrieved context
        sources = []
        if retrieved_context:
            try:
                retriever = KnowledgeBaseRetriever(faiss_dir)
                results = retriever.retrieve(message_data.message, top_k=3)
                sources = [
                    {
                        "source": r["source"],
                        "excerpt": r["chunk"][:200] + "..." if len(r["chunk"]) > 200 else r["chunk"],
                        "score": r["score"]
                    }
                    for r in results
                ]
            except Exception as e:
                print(f"Warning: Error extracting sources: {e}")
        
        # Save to chat history
        message_id = str(uuid.uuid4())
        chat_entry = {
            "message_id": message_id,
            "user_message": message_data.message,
            "assistant_response": response_text,
            "sources": sources,
            "timestamp": asyncio.get_event_loop().time()
        }
        session["chat_history"].append(chat_entry)
        
        return ChatResponse(
            message_id=message_id,
            response=response_text,
            sources=sources,
            meta={"session_id": session_id, "user_data": user_data}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")

@router.websocket("/ws/chat/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for streaming chat"""
    print(f"WebSocket connection attempt for session: {session_id}")
    print(f"Available sessions: {list(sessions.keys())}")
    
    await websocket.accept()
    print(f"WebSocket accepted for session: {session_id}")
    
    if session_id not in sessions:
        print(f"Session {session_id} not found in sessions dict")
        await websocket.close(code=4004, reason="Session not found")
        return
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            if data.get("type") == "message":
                message = data.get("message", "").strip()
                
                # Handle exit command
                if message.lower() in ["exit", "quit", "bye", "goodbye"]:
                    await websocket.send_json({
                        "type": "message",
                        "message": "Thank you for using our diet consultation service. Take care! 👋\n\nYou can close this chat window now."
                    })
                    await websocket.close()
                    return
                
                # Check if ingestion is complete
                if session_id in ingest_tasks and ingest_tasks[session_id]["status"] != "completed":
                    await websocket.send_json({
                        "type": "error",
                        "message": "File ingestion not complete. Please wait."
                    })
                    continue
                
                # Get patient info
                patient_info = data.get("patient_info", {})
                
                # Get session data
                session = sessions[session_id]
                user_data = session["user_data"]
                
                # Check if the question is diet-related
                if not is_diet_related_question(message):
                    response_text = format_general_response()
                else:
                    # Prepare context (same as non-streaming version)
                    retrieved_context = ""
                    faiss_dir = os.path.join(CHATBOT_DATA_DIR, 'uploads', session_id, 'faiss')
                    
                    if os.path.exists(faiss_dir) and any(f.endswith('.index') for f in os.listdir(faiss_dir)):
                        try:
                            retriever = KnowledgeBaseRetriever(faiss_dir)
                            results = retriever.retrieve(message, top_k=3)
                            retrieved_context = "\n---\n".join([f"[Source: {r['source']}]\n{r['chunk']}" for r in results])
                        except Exception as e:
                            print(f"Warning: Error retrieving context: {e}")
                    
                    # Get OCR data
                    ocr_data = None
                    session_dir = os.path.join(CHATBOT_DATA_DIR, 'uploads', session_id)
                    for file in os.listdir(session_dir):
                        if file.endswith('_ocr.json'):
                            with open(os.path.join(session_dir, file), 'r') as f:
                                ocr_data = json.load(f)
                            break
                    
                    # Determine if user requested explicit day-wise plan
                    requested_days = parse_days_from_text(message)
                    supported_days = {7, 10, 14, 21, 30}

                    if requested_days is not None:
                        if requested_days in supported_days:
                            prompt = f"""
You are a clinical dietitian specializing in diabetes and hypertension management. Create a personalized diet plan.

Duration: EXACTLY {requested_days} days. Output MUST be day-wise with headings 'Day 1:' through 'Day {requested_days}:'.
For each day include: Breakfast:, Mid-Morning Snack:, Lunch:, Afternoon Snack:, Dinner: with portions and simple timing. Do not group by week or repeat weekly cycles. Generate unique entries up to Day {requested_days}.

Context from uploaded documents:
{retrieved_context}

User Information:
- Diabetes: {user_data.get('hasDiabetes', False)}
- Diabetes Type: {user_data.get('diabetesType', 'N/A')}
- Diabetes Level: {user_data.get('diabetesLevel', 'N/A')}
- Blood Pressure: {user_data.get('hasHypertension', False)}
- BP Readings: {user_data.get('systolic', 'N/A')}/{user_data.get('diastolic', 'N/A')} mmHg
- Height: {user_data.get('height', 'N/A')} cm
- Weight: {user_data.get('weight', 'N/A')} kg
- Lab Results: {ocr_data if ocr_data else 'N/A'}

REQUIRED SECTIONS (include these at the end):
1. Lifestyle Recommendations: Include exercise, stress management, sleep, and daily habits
2. Important Notes: Include medical disclaimers, monitoring tips, and when to consult healthcare providers

Formatting:
- Start each day with 'Day X:' on a new line
- Keep it concise and readable
- Always include the two required sections at the end
"""
                            response_text = generate_diet_plan_with_gemini(prompt)
                        else:
                            response_text = unsupported_duration_response()
                    else:
                        prompt = f"""
You are a clinical dietitian specializing in diabetes and hypertension management. Provide a helpful, evidence-based response to the following question.

User Question: {message}

Context from uploaded documents:
{retrieved_context}

User Information:
- Diabetes: {user_data.get('hasDiabetes', False)}
- Diabetes Type: {user_data.get('diabetesType', 'N/A')}
- Diabetes Level: {user_data.get('diabetesLevel', 'N/A')}
- Blood Pressure: {user_data.get('hasHypertension', False)}
- BP Readings: {user_data.get('systolic', 'N/A')}/{user_data.get('diastolic', 'N/A')} mmHg
- Height: {user_data.get('height', 'N/A')} cm
- Weight: {user_data.get('weight', 'N/A')} kg
- Lab Results: {ocr_data if ocr_data else 'N/A'}

REQUIRED SECTIONS (include these at the end):
1. Lifestyle Recommendations: Include exercise, stress management, sleep, and daily habits
2. Important Notes: Include medical disclaimers, monitoring tips, and when to consult healthcare providers

Guidelines:
- Give clear, actionable advice with simple bullet points
- Keep formatting clean and professional
- If this is a health guidance request, provide practical tips based on the user's specific conditions
- Focus on lifestyle, diet, exercise, and management strategies
- Be encouraging and supportive while maintaining medical accuracy
- Always include the two required sections at the end
"""
                        response_text = generate_diet_plan_with_gemini(prompt)
                
                # Format the response for consistent styling
                # Check if this is a diet plan response
                is_diet_plan_response = requested_days is not None and requested_days in supported_days
                response_text = format_response(response_text, is_diet_plan=is_diet_plan_response)
                
                try:
                    # Stream response token by token (simplified - send in chunks)
                    words = response_text.split()
                    chunk_size = 5
                    for i in range(0, len(words), chunk_size):
                        chunk = " ".join(words[i:i+chunk_size])
                        await websocket.send_json({
                            "type": "token",
                            "content": chunk + (" " if i + chunk_size < len(words) else "")
                        })
                        await asyncio.sleep(0.1)  # Small delay for streaming effect
                    
                    # Extract sources
                    sources = []
                    if retrieved_context:
                        try:
                            retriever = KnowledgeBaseRetriever(faiss_dir)
                            results = retriever.retrieve(message, top_k=3)
                            sources = [
                                {
                                    "source": r["source"],
                                    "excerpt": r["chunk"][:200] + "..." if len(r["chunk"]) > 200 else r["chunk"],
                                    "score": r["score"]
                                }
                                for r in results
                            ]
                        except Exception as e:
                            print(f"Warning: Error extracting sources: {e}")
                    
                    # Send final message with sources
                    await websocket.send_json({
                        "type": "message",
                        "message": response_text,
                        "sources": sources
                    })
                    
                    # Save to chat history
                    message_id = str(uuid.uuid4())
                    chat_entry = {
                        "message_id": message_id,
                        "user_message": message,
                        "assistant_response": response_text,
                        "sources": sources,
                        "timestamp": asyncio.get_event_loop().time()
                    }
                    session["chat_history"].append(chat_entry)
                    
                except Exception as e:
                    print(f"Error in WebSocket response: {e}")
                    await websocket.send_json({
                        "type": "error",
                        "message": "Error generating response. Please try again."
                    })
                    
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for session: {session_id}")
    except Exception as e:
        print(f"WebSocket error for session {session_id}: {e}")
        try:
            await websocket.close(code=1011, reason="Internal error")
        except:
            pass

@router.get("/{session_id}/history")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"chat_history": sessions[session_id]["chat_history"]}

@router.post("/{session_id}/upload")
async def upload_additional_files(
    session_id: str,
    files: List[UploadFile] = File(...)
):
    """Upload additional files to an existing session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        session_dir = os.path.join(CHATBOT_DATA_DIR, 'uploads', session_id)
        file_paths = []
        
        for file in files:
            if validate_file(file):
                filename = sanitize_filename(file.filename)
                file_path = os.path.join(session_dir, filename)
                
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                file_paths.append(file_path)
        
        # Add to existing files
        sessions[session_id]["files"].extend(file_paths)
        
        # Start background ingestion
        background_tasks = BackgroundTasks()
        background_tasks.add_task(
            ingest_files_background, 
            session_id, 
            file_paths, 
            sessions[session_id]["user_data"]
        )
        
        return {"message": f"Uploaded {len(file_paths)} files", "files": [os.path.basename(f) for f in file_paths]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading files: {str(e)}")

@router.post("/{session_id}/feedback")
async def submit_feedback(session_id: str, feedback: Dict[str, Any]):
    """Submit feedback for a chat session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Store feedback (you could save this to a database)
    if "feedback" not in sessions[session_id]:
        sessions[session_id]["feedback"] = []
    
    sessions[session_id]["feedback"].append({
        **feedback,
        "timestamp": asyncio.get_event_loop().time()
    })
    
    return {"message": "Feedback submitted successfully"}

@router.post("/{session_id}/generate-diet-plan")
async def generate_diet_plan(session_id: str, request: DietPlanRequest):
    """Generate a personalized diet plan"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        print(f"DEBUG: Generating diet plan for session {session_id}")
        print(f"DEBUG: Request duration: {request.duration}")
        
        session = sessions[session_id]
        user_data = session["user_data"]
        
        # Check if ingestion is complete
        if session_id in ingest_tasks and ingest_tasks[session_id]["status"] != "completed":
            print(f"DEBUG: Ingestion not complete for session {session_id}")
            raise HTTPException(status_code=400, detail="File ingestion not complete")
        
        # Prepare context using RAG functions
        retrieved_context = ""
        faiss_dir = os.path.join(CHATBOT_DATA_DIR, 'uploads', session_id, 'faiss')
        
        if os.path.exists(faiss_dir) and any(f.endswith('.index') for f in os.listdir(faiss_dir)):
            try:
                retriever = KnowledgeBaseRetriever(faiss_dir)
                results = retriever.retrieve("diet plan diabetes blood pressure", top_k=5)
                retrieved_context = "\n---\n".join([f"[Source: {r['source']}]\n{r['chunk']}" for r in results])
            except Exception as e:
                print(f"Warning: Error retrieving context: {e}")
        
        # Normalize duration to exact day count
        days = map_duration_to_days(request.duration)
        print(f"DEBUG: Mapped duration '{request.duration}' to {days} days")
        if days is None:
            print(f"DEBUG: Unsupported duration: {request.duration}")
            return JSONResponse(status_code=400, content={"detail": unsupported_duration_response()})

        # Generate strict day-wise diet plan using Gemini LLM
        prompt = f"""
You are a clinical dietitian specializing in diabetes and hypertension management. Create a personalized diet plan.

Duration: EXACTLY {days} days. Output MUST be day-wise with headings 'Day 1:' through 'Day {days}:'.
For each day include: Breakfast:, Mid-Morning Snack:, Lunch:, Afternoon Snack:, Dinner: with portions and simple timing. Do not group by week or repeat weekly cycles. Generate unique entries up to Day {days}.

Context from uploaded documents:
{retrieved_context}

User Information:
- Diabetes: {user_data.get('hasDiabetes', False)}
- Diabetes Type: {user_data.get('diabetesType', 'N/A')}
- Diabetes Level: {user_data.get('diabetesLevel', 'N/A')}
- Blood Pressure: {user_data.get('hasHypertension', False)}
- BP Readings: {user_data.get('systolic', 'N/A')}/{user_data.get('diastolic', 'N/A')} mmHg
- Height: {user_data.get('height', 'N/A')} cm
- Weight: {user_data.get('weight', 'N/A')} kg

REQUIRED SECTIONS (include these at the end):
1. Lifestyle Recommendations: Include exercise, stress management, sleep, and daily habits
2. Important Notes: Include medical disclaimers, monitoring tips, and when to consult healthcare providers

Formatting:
- Start each day with 'Day X:' on a new line
- Keep it concise and readable
- Always include the two required sections at the end
"""

        try:
            print(f"DEBUG: Calling Gemini API with prompt length: {len(prompt)}")
            diet_plan = generate_diet_plan_with_gemini(prompt)
            print(f"DEBUG: Gemini API response received, length: {len(diet_plan) if diet_plan else 0}")
            diet_plan = format_response(diet_plan, is_diet_plan=True)
        except Exception as e:
            print(f"DEBUG: Error calling Gemini API: {e}")
            raise HTTPException(status_code=500, detail=f"Error generating diet plan with AI: {str(e)}")
        
        # Save to session
        if "diet_plans" not in session:
            session["diet_plans"] = []
        
        diet_plan_entry = {
            "duration": request.duration,
            "plan": diet_plan,
            "timestamp": asyncio.get_event_loop().time()
        }
        session["diet_plans"].append(diet_plan_entry)
        
        return {"diet_plan": diet_plan, "duration": request.duration}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating diet plan: {str(e)}")

@router.get("/{session_id}/medical-data")
async def get_medical_data(session_id: str):
    """Get extracted medical data from uploaded files"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        medical_data = extract_medical_data_from_files(session_id)
        return {"medical_data": medical_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting medical data: {str(e)}")

@router.get("/{session_id}/medical-summary")
async def get_medical_summary(session_id: str):
    """Get a formatted medical summary for display in the chatbot interface"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        medical_data = extract_medical_data_from_files(session_id)
        
        # Create a formatted summary for display
        summary = {
            "primary_conditions": medical_data["summary"]["primary_conditions"],
            "key_lab_values": [],
            "risk_factors": medical_data["summary"]["risk_factors"],
            "extracted_data": {
                "diabetes": {},
                "blood_pressure": {},
                "lab_results": {},
                "medical_history": {}
            }
        }
        
        # Format diabetes info
        if medical_data["diabetes_info"]["diagnosis"] != "No":
            summary["extracted_data"]["diabetes"] = {
                "diagnosis": medical_data["diabetes_info"]["diagnosis"],
                "type": medical_data["diabetes_info"]["diabetes_type"],
                "glucose": medical_data["diabetes_info"]["glucose_levels"],
                "hba1c": medical_data["diabetes_info"]["hba1c"],
                "insulin_use": medical_data["diabetes_info"]["insulin_use"]
            }
        
        # Format blood pressure info
        if medical_data["blood_pressure_info"]["readings"] != "No":
            summary["extracted_data"]["blood_pressure"] = {
                "readings": medical_data["blood_pressure_info"]["readings"],
                "systolic": medical_data["blood_pressure_info"]["systolic"],
                "diastolic": medical_data["blood_pressure_info"]["diastolic"]
            }
        
        # Format key lab values
        lab_data = medical_data["lab_results"]
        if lab_data["cholesterol_total"] != "No":
            summary["key_lab_values"].append(f"Cholesterol: {lab_data['cholesterol_total']}")
        if lab_data["creatinine"] != "No":
            summary["key_lab_values"].append(f"Creatinine: {lab_data['creatinine']}")
        if lab_data["egfr"] != "No":
            summary["key_lab_values"].append(f"eGFR: {lab_data['egfr']}")
        if lab_data["hemoglobin"] != "No":
            summary["key_lab_values"].append(f"Hemoglobin: {lab_data['hemoglobin']}")
        
        # Format medical history
        if medical_data["medical_history"]["chronic_conditions"]:
            summary["extracted_data"]["medical_history"]["chronic_conditions"] = medical_data["medical_history"]["chronic_conditions"]
        if medical_data["medical_history"]["cardiovascular_history"]:
            summary["extracted_data"]["medical_history"]["cardiovascular_history"] = medical_data["medical_history"]["cardiovascular_history"]
        
        return {"medical_summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating medical summary: {str(e)}")

@router.get("/{session_id}/diet-plans")
async def get_diet_plans(session_id: str):
    """Get generated diet plans for a session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"diet_plans": sessions[session_id].get("diet_plans", [])}

@router.post("/{session_id}/logout")
async def logout_session(session_id: str):
    """Logout and clean up session data"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        cleanup_session_data(session_id)
        return {"message": "Session logged out and cleaned up successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during logout: {str(e)}")