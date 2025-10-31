import pytesseract
from PIL import Image
import fitz  # PyMuPDF for PDF processing
import re
from typing import Dict, List, Union
import os
import tempfile

def extract_text_from_image(image_path: str) -> str:
    image = Image.open(image_path)
    text = pytesseract.image_to_string(image)
    return text

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from a PDF file.

    Strategy:
    1) Try native text extraction via PyMuPDF (fast, accurate for digital PDFs).
    2) If a page has little/no text, render to image at higher DPI and OCR it.
    """
    doc = fitz.open(pdf_path)
    extracted_text_parts: List[str] = []

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)

        # First try native text extraction
        page_text = page.get_text("text") or ""
        normalized_page_text = page_text.strip()

        if len(normalized_page_text) >= 20:
            extracted_text_parts.append(normalized_page_text)
            continue

        # Fallback: render to image with higher resolution and OCR
        try:
            # Use matrix for ~300 DPI equivalent rendering
            zoom_x = 2.0
            zoom_y = 2.0
            mat = fitz.Matrix(zoom_x, zoom_y)
            pix = page.get_pixmap(matrix=mat, alpha=False)

            # Save to a secure temp file and OCR
            with tempfile.NamedTemporaryFile(prefix=f"ocr_page_{page_num}_", suffix=".png", delete=False) as tmp:
                tmp_path = tmp.name
                pix.save(tmp_path)
            try:
                ocr_text = extract_text_from_image(tmp_path)
                extracted_text_parts.append((ocr_text or "").strip())
            finally:
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass
        except Exception:
            # If rendering fails, at least include whatever native text existed
            if normalized_page_text:
                extracted_text_parts.append(normalized_page_text)

    return "\n".join([p for p in extracted_text_parts if p])

def extract_text_only(file_path: str) -> str:
    """Extract only text from file without parsing medical values"""
    ext = os.path.splitext(file_path)[-1].lower()
    if ext in ['.jpg', '.jpeg', '.png']:
        return extract_text_from_image(file_path)
    elif ext == '.pdf':
        return extract_text_from_pdf(file_path)
    else:
        raise ValueError('Unsupported file type')

def parse_medical_values(text: str) -> Dict[str, Union[str, float, List[float], Dict]]:
    """Parse comprehensive medical information from unstructured text.

    Extracts medical history, lab data, and other relevant medical information.
    """
    # Normalize whitespace for better matching
    normalized = re.sub(r"[\r\t]+", " ", text)
    
    # Initialize comprehensive medical data structure
    medical_data = {
        'basic_vitals': {},
        'lab_results': {},
        'medical_history': {},
        'diagnoses': [],
        'symptoms': [],
        'allergies': [],
        'family_history': [],
        'social_history': []
    }

    # Basic Vitals
    # Glucose (mg/dL) - capture common variants including FBS/RBS
    glucose = re.findall(r'(?:\b(?:glucose|blood\s*sugar|fbs|rbs)\b)[^\d]{0,10}(\d{2,3})', normalized, re.IGNORECASE)
    medical_data['basic_vitals']['glucose'] = [int(g) for g in glucose] if glucose else None

    # HbA1c (percentage)
    hba1c = re.findall(r'\b(?:hba1c|a1c)\b[^\d]{0,10}(\d{1,2}(?:\.\d)?)', normalized, re.IGNORECASE)
    medical_data['basic_vitals']['hba1c'] = [float(v) for v in hba1c] if hba1c else None

    # BP (e.g., 120/80)
    bp = re.findall(r'(\d{2,3})\s*/\s*(\d{2,3})', normalized)
    medical_data['basic_vitals']['bp'] = [f"{s}/{d}" for s, d in bp] if bp else None

    # Cholesterol (mg/dL)
    cholesterol = re.findall(r'(?:\bcholesterol\b)[^\d]{0,10}(\d{2,3})', normalized, re.IGNORECASE)
    medical_data['basic_vitals']['cholesterol'] = [int(c) for c in cholesterol] if cholesterol else None

    # Weight and Height
    weight = re.findall(r'(?:\b(?:weight|wt)\b)[^\d]{0,10}(\d{2,3}(?:\.\d)?)', normalized, re.IGNORECASE)
    medical_data['basic_vitals']['weight'] = [float(w) for w in weight] if weight else None

    height = re.findall(r'(?:\b(?:height|ht)\b)[^\d]{0,10}(\d{1,2}(?:\.\d)?)', normalized, re.IGNORECASE)
    medical_data['basic_vitals']['height'] = [float(h) for h in height] if height else None

    # Lab Results - Comprehensive extraction
    # Complete Blood Count (CBC)
    cbc_patterns = {
        'hemoglobin': r'(?:\b(?:hemoglobin|hgb|hb)\b)[^\d]{0,10}(\d{1,2}(?:\.\d)?)',
        'hematocrit': r'(?:\b(?:hematocrit|hct)\b)[^\d]{0,10}(\d{1,2}(?:\.\d)?)',
        'wbc': r'(?:\b(?:white\s*blood\s*cell|wbc|leukocyte)\b)[^\d]{0,10}(\d{1,2}(?:\.\d)?)',
        'rbc': r'(?:\b(?:red\s*blood\s*cell|rbc|erythrocyte)\b)[^\d]{0,10}(\d{1,2}(?:\.\d)?)',
        'platelets': r'(?:\b(?:platelet|plt)\b)[^\d]{0,10}(\d{2,4})'
    }
    
    for test, pattern in cbc_patterns.items():
        values = re.findall(pattern, normalized, re.IGNORECASE)
        if values:
            medical_data['lab_results'][test] = [float(v) for v in values]

    # Kidney Function Tests
    kidney_patterns = {
        'creatinine': r'(?:\b(?:creatinine|cr)\b)[^\d]{0,10}(\d{1,2}(?:\.\d)?)',
        'bun': r'(?:\b(?:bun|blood\s*urea\s*nitrogen)\b)[^\d]{0,10}(\d{1,2}(?:\.\d)?)',
        'egfr': r'(?:\b(?:egfr|gfr)\b)[^\d]{0,10}(\d{1,3}(?:\.\d)?)'
    }
    
    for test, pattern in kidney_patterns.items():
        values = re.findall(pattern, normalized, re.IGNORECASE)
        if values:
            medical_data['lab_results'][test] = [float(v) for v in values]

    # Liver Function Tests
    liver_patterns = {
        'alt': r'(?:\b(?:alt|alanine\s*aminotransferase)\b)[^\d]{0,10}(\d{1,3})',
        'ast': r'(?:\b(?:ast|aspartate\s*aminotransferase)\b)[^\d]{0,10}(\d{1,3})',
        'bilirubin': r'(?:\b(?:bilirubin|tbil)\b)[^\d]{0,10}(\d{1,2}(?:\.\d)?)',
        'alkaline_phosphatase': r'(?:\b(?:alkaline\s*phosphatase|alp)\b)[^\d]{0,10}(\d{1,3})'
    }
    
    for test, pattern in liver_patterns.items():
        values = re.findall(pattern, normalized, re.IGNORECASE)
        if values:
            medical_data['lab_results'][test] = [float(v) for v in values]

    # Lipid Panel
    lipid_patterns = {
        'total_cholesterol': r'(?:\b(?:total\s*cholesterol|tc)\b)[^\d]{0,10}(\d{2,3})',
        'ldl': r'(?:\b(?:ldl|low\s*density\s*lipoprotein)\b)[^\d]{0,10}(\d{2,3})',
        'hdl': r'(?:\b(?:hdl|high\s*density\s*lipoprotein)\b)[^\d]{0,10}(\d{2,3})',
        'triglycerides': r'(?:\b(?:triglyceride|tg)\b)[^\d]{0,10}(\d{2,3})'
    }
    
    for test, pattern in lipid_patterns.items():
        values = re.findall(pattern, normalized, re.IGNORECASE)
        if values:
            medical_data['lab_results'][test] = [float(v) for v in values]

    # Thyroid Function
    thyroid_patterns = {
        'tsh': r'(?:\b(?:tsh|thyroid\s*stimulating\s*hormone)\b)[^\d]{0,10}(\d{1,2}(?:\.\d)?)',
        't3': r'(?:\b(?:t3|triiodothyronine)\b)[^\d]{0,10}(\d{1,3}(?:\.\d)?)',
        't4': r'(?:\b(?:t4|thyroxine)\b)[^\d]{0,10}(\d{1,2}(?:\.\d)?)'
    }
    
    for test, pattern in thyroid_patterns.items():
        values = re.findall(pattern, normalized, re.IGNORECASE)
        if values:
            medical_data['lab_results'][test] = [float(v) for v in values]

    # Medical History and Diagnoses
    # Common chronic conditions
    chronic_conditions = [
        'diabetes', 'hypertension', 'heart disease', 'stroke', 'cancer', 'asthma', 'copd',
        'arthritis', 'depression', 'anxiety', 'thyroid', 'kidney disease', 'liver disease',
        'high cholesterol', 'obesity', 'osteoporosis', 'migraine', 'epilepsy'
    ]
    
    for condition in chronic_conditions:
        pattern = r'\b(?:' + condition.replace(' ', r'\s*') + r')\b'
        if re.search(pattern, normalized, re.IGNORECASE):
            medical_data['diagnoses'].append(condition.title())

    # Symptoms extraction
    symptoms = [
        'chest pain', 'shortness of breath', 'fatigue', 'headache', 'dizziness', 'nausea',
        'vomiting', 'diarrhea', 'constipation', 'abdominal pain', 'joint pain', 'muscle pain',
        'fever', 'cough', 'sore throat', 'runny nose', 'rash', 'swelling', 'weight loss',
        'weight gain', 'insomnia', 'anxiety', 'depression'
    ]
    
    for symptom in symptoms:
        pattern = r'\b(?:' + symptom.replace(' ', r'\s*') + r')\b'
        if re.search(pattern, normalized, re.IGNORECASE):
            medical_data['symptoms'].append(symptom.title())

    # Allergies
    allergy_pattern = r'(?:\b(?:allerg|allergic)\b)[^.]{0,50}(?:to|against)\s+([^.]+)'
    allergies = re.findall(allergy_pattern, normalized, re.IGNORECASE)
    if allergies:
        medical_data['allergies'] = [allergy.strip() for allergy in allergies]

    # Family History
    family_history_pattern = r'(?:\b(?:family\s*history|fh)\b)[^.]{0,100}([^.]+)'
    family_history = re.findall(family_history_pattern, normalized, re.IGNORECASE)
    if family_history:
        medical_data['family_history'] = [fh.strip() for fh in family_history]

    # Social History (smoking, alcohol, exercise)
    if re.search(r'\b(?:smok|tobacco|cigarette)\b', normalized, re.IGNORECASE):
        medical_data['social_history'].append('Smoking History')
    
    if re.search(r'\b(?:alcohol|drink|etoh)\b', normalized, re.IGNORECASE):
        medical_data['social_history'].append('Alcohol History')
    
    if re.search(r'\b(?:exercise|physical\s*activity|gym|workout)\b', normalized, re.IGNORECASE):
        medical_data['social_history'].append('Exercise History')

    # Clean up empty lists and None values
    def clean_data(data):
        if isinstance(data, dict):
            return {k: clean_data(v) for k, v in data.items() if v is not None and v != []}
        elif isinstance(data, list):
            return [item for item in data if item is not None and item != []]
        else:
            return data

    return clean_data(medical_data)

def format_medical_data_for_display(medical_data: Dict) -> str:
    """Format extracted medical data into a readable string for chatbot display."""
    if not medical_data:
        return "No medical data extracted."
    
    formatted_text = "📋 **Extracted Medical Information:**\n\n"
    
    # Basic Vitals
    if medical_data.get('basic_vitals'):
        formatted_text += "**🩺 Basic Vitals:**\n"
        vitals = medical_data['basic_vitals']
        for key, value in vitals.items():
            if value:
                if isinstance(value, list):
                    formatted_text += f"• {key.title()}: {', '.join(map(str, value))}\n"
                else:
                    formatted_text += f"• {key.title()}: {value}\n"
        formatted_text += "\n"
    
    # Lab Results
    if medical_data.get('lab_results'):
        formatted_text += "**🧪 Lab Results:**\n"
        labs = medical_data['lab_results']
        for key, value in labs.items():
            if value:
                if isinstance(value, list):
                    formatted_text += f"• {key.title()}: {', '.join(map(str, value))}\n"
                else:
                    formatted_text += f"• {key.title()}: {value}\n"
        formatted_text += "\n"
    
    # Diagnoses
    if medical_data.get('diagnoses'):
        formatted_text += "**🏥 Medical Diagnoses:**\n"
        for diagnosis in medical_data['diagnoses']:
            formatted_text += f"• {diagnosis}\n"
        formatted_text += "\n"
    
    # Symptoms
    if medical_data.get('symptoms'):
        formatted_text += "**😷 Current Symptoms:**\n"
        for symptom in medical_data['symptoms']:
            formatted_text += f"• {symptom}\n"
        formatted_text += "\n"
    
    # Allergies
    if medical_data.get('allergies'):
        formatted_text += "**⚠️ Allergies:**\n"
        for allergy in medical_data['allergies']:
            formatted_text += f"• {allergy}\n"
        formatted_text += "\n"
    
    # Family History
    if medical_data.get('family_history'):
        formatted_text += "**👨‍👩‍👧‍👦 Family History:**\n"
        for fh in medical_data['family_history']:
            formatted_text += f"• {fh}\n"
        formatted_text += "\n"
    
    # Social History
    if medical_data.get('social_history'):
        formatted_text += "**🚭 Social History:**\n"
        for sh in medical_data['social_history']:
            formatted_text += f"• {sh}\n"
        formatted_text += "\n"
    
    return formatted_text.strip()

def format_medical_data_for_llm_context(medical_data: Dict) -> str:
    """Format extracted medical data for LLM context (more concise)."""
    if not medical_data:
        return ""
    
    context = "Patient Medical Information:\n"
    
    # Basic Vitals
    if medical_data.get('basic_vitals'):
        vitals = medical_data['basic_vitals']
        context += "Vitals: "
        vital_parts = []
        for key, value in vitals.items():
            if value:
                if isinstance(value, list):
                    vital_parts.append(f"{key}: {', '.join(map(str, value))}")
                else:
                    vital_parts.append(f"{key}: {value}")
        context += "; ".join(vital_parts) + "\n"
    
    # Lab Results
    if medical_data.get('lab_results'):
        labs = medical_data['lab_results']
        context += "Lab Results: "
        lab_parts = []
        for key, value in labs.items():
            if value:
                if isinstance(value, list):
                    lab_parts.append(f"{key}: {', '.join(map(str, value))}")
                else:
                    lab_parts.append(f"{key}: {value}")
        context += "; ".join(lab_parts) + "\n"
    
    # Diagnoses
    if medical_data.get('diagnoses'):
        context += f"Diagnoses: {', '.join(medical_data['diagnoses'])}\n"
    
    # Symptoms
    if medical_data.get('symptoms'):
        context += f"Symptoms: {', '.join(medical_data['symptoms'])}\n"
    
    # Allergies
    if medical_data.get('allergies'):
        context += f"Allergies: {', '.join(medical_data['allergies'])}\n"
    
    # Family History
    if medical_data.get('family_history'):
        context += f"Family History: {', '.join(medical_data['family_history'])}\n"
    
    # Social History
    if medical_data.get('social_history'):
        context += f"Social History: {', '.join(medical_data['social_history'])}\n"
    
    return context.strip()

def extract_and_parse(file_path: str) -> Dict[str, Union[str, float, List[float], Dict]]:
    ext = os.path.splitext(file_path)[-1].lower()
    if ext in ['.jpg', '.jpeg', '.png']:
        text = extract_text_from_image(file_path)
    elif ext == '.pdf':
        text = extract_text_from_pdf(file_path)
    else:
        raise ValueError('Unsupported file type')
    return parse_medical_values(text)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Extract and parse medical values from image or PDF.")
    parser.add_argument('--file', required=True, help='Path to image or PDF file')
    args = parser.parse_args()
    results = extract_and_parse(args.file)
    print("Extracted values:", results) 