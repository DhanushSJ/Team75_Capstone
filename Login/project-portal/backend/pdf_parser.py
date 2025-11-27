#!/usr/bin/env python3
"""
PDF Parser Script - Based on demo_parser.ipynb
Accepts dynamic headings and font size from admin-configured report layouts
Includes image extraction and CLIP similarity calculation
"""

import sys
import json
import fitz  # PyMuPDF
import re
import os
import io
import tempfile
import shutil
import subprocess
import time
from PIL import Image
try:
    import imagehash
    imagehash_available = True
except ImportError:
    imagehash_available = False
    print("Warning: imagehash not available, duplicate image detection disabled", file=sys.stderr)

try:
    import clip
    import torch
    clip_available = True
except ImportError:
    clip_available = False
    print("Warning: CLIP not available, image-text similarity will be 0", file=sys.stderr)

try:
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    import numpy as np
    transformers_available = True
except ImportError:
    transformers_available = False
    print("Warning: transformers not available, novelty scoring will be 0", file=sys.stderr)

try:
    import nltk
    from nltk.tokenize import sent_tokenize, word_tokenize
    from nltk import pos_tag
    # Download NLTK data if not already downloaded
    try:
        nltk.data.find('tokenizers/punkt_tab')
    except LookupError:
        nltk.download('punkt_tab', quiet=True)
    try:
        nltk.data.find('taggers/averaged_perceptron_tagger_eng')
    except LookupError:
        nltk.download('averaged_perceptron_tagger_eng', quiet=True)
    try:
        nltk.data.find('corpora/stopwords')
    except LookupError:
        nltk.download('stopwords', quiet=True)
    nltk_available = True
except ImportError:
    nltk_available = False
    print("Warning: NLTK not available, quality metrics will be 0", file=sys.stderr)

def normalize(s):
    """Normalize string for matching"""
    return ' '.join(s.strip().split()).lower()

def extract_headings_by_fontsize(pdf_path, min_fontsize=14):
    """Extract text with font size >= min_fontsize"""
    doc = fitz.open(pdf_path)
    headings = set()
    
    for page in doc:
        page_dict = page.get_text("dict")
        for block in page_dict["blocks"]:
            if block["type"] == 0:  # Text block
                for line in block["lines"]:
                    for span in line["spans"]:
                        if span["size"] >= min_fontsize:
                            text = span["text"].strip()
                            if text:
                                headings.add(text.lower())
    
    doc.close()
    return headings

def validate_headings(pdf_path, expected_sections, min_fontsize=14):
    """
    Check if expected sections are present in the PDF
    
    Args:
        pdf_path: Path to PDF file
        expected_sections: List of lists, where each inner list contains synonyms for a section
        min_fontsize: Minimum font size to consider as a heading
    
    Returns:
        found: List of found section names
        missing: List of missing section names
        total: Total number of expected sections
    """
    
    extracted_headings = extract_headings_by_fontsize(pdf_path, min_fontsize)
    
    found = []
    missing = []
    
    for group in expected_sections:
        # Check if any synonym matches (handle compound headings with AND or /)
        is_found = False
        
        for syn in group:
            syn_lower = syn.lower()
            
            # Direct substring match
            if any(syn_lower in heading for heading in extracted_headings):
                is_found = True
                break
            
            # Handle compound headings: "ABSTRACT AND SCOPE" or "RESEARCH / TECHNOLOGY GAP"
            # Split by AND or / and check if ANY component matches
            if ' and ' in syn_lower or '/' in syn:
                components = re.split(r'\s+and\s+|/', syn_lower)
                components = [c.strip() for c in components if c.strip()]
                
                # Check if any component is found
                if any(comp in heading for comp in components for heading in extracted_headings):
                    is_found = True
                    break
        
        if is_found:
            found.append(group[0])
        else:
            missing.append(group[0])
    
    return found, missing, len(expected_sections)

def find_content_start_page(pdf_path):
    """
    Find the page where main content starts (after List of Figures/Tables).
    Looks for "INTRODUCTION" or "ABSTRACT" as starting point.
    """
    doc = fitz.open(pdf_path)
    
    for page_num, page in enumerate(doc):
        text = page.get_text("text").upper()
        
        # Look for introduction or abstract section
        if re.search(r'\b(INTRODUCTION|ABSTRACT AND SCOPE|CHAPTER\s+I)\b', text):
            doc.close()
            return page_num
        
        # Also check if we're past "LIST OF FIGURES"
        if "LIST OF FIGURES" in text:
            # Content likely starts on next page or soon after
            doc.close()
            return page_num + 1
    
    # If not found, start from page 5 (conservative default)
    doc.close()
    return 4

def extract_images_with_text(pdf_path, output_folder):
    """Extract unique images and nearby text (only from main content pages)"""
    doc = fitz.open(pdf_path)
    seen_hashes = set()
    image_data = []
    
    # Find where main content starts
    start_page = find_content_start_page(pdf_path)
    
    # Create output folder if it doesn't exist
    os.makedirs(output_folder, exist_ok=True)
    
    for page_num, page in enumerate(doc):
        # Skip pages before content starts
        if page_num < start_page:
            continue
        
        images = page.get_images(full=True)
        page_dict = page.get_text("dict")
        
        for img_index, img in enumerate(images):
            xref = img[0]
            try:
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                
                # Check if unique (if imagehash is available)
                if imagehash_available:
                    pil_image = Image.open(io.BytesIO(image_bytes))
                    normalized = pil_image.convert("RGB").resize((256, 256))
                    img_hash = imagehash.phash(normalized)
                    
                    if img_hash in seen_hashes:
                        continue
                    seen_hashes.add(img_hash)
                
                # Save image to temp directory
                filename = f"image_p{page_num+1}_i{img_index+1}.{image_ext}"
                filepath = os.path.join(output_folder, filename)
                with open(filepath, "wb") as f:
                    f.write(image_bytes)
                
                # Extract nearby text
                img_rect = None
                for block in page_dict["blocks"]:
                    if block["type"] == 1:  # Image block
                        img_blocks = [b for b in page_dict["blocks"] if b["type"] == 1]
                        if img_index < len(img_blocks):
                            img_rect = fitz.Rect(img_blocks[img_index]["bbox"])
                            break
                
                nearby_text = ""
                if img_rect:
                    # Get text blocks from area around image
                    expanded_rect = fitz.Rect(
                        max(0, img_rect.x0 - 200),
                        max(0, img_rect.y0 - 200),
                        min(page.rect.width, img_rect.x1 + 200),
                        min(page.rect.height, img_rect.y1 + 200)
                    )
                    
                    raw_text = page.get_text("text", clip=expanded_rect)
                    
                    # Split into paragraphs
                    paragraphs = []
                    current_para = []
                    
                    for line in raw_text.split('\n'):
                        line_stripped = line.strip()
                        
                        # Skip obvious headers/footers
                        if line_stripped.lower() in ['dept. of cse', 'department of cse']:
                            continue
                        if re.match(r'^(aug|jan|feb|mar|apr|may|jun|jul|sep|oct|nov|dec)[-\s]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec),?\s*\d{4}$', line_stripped, re.IGNORECASE):
                            continue
                        if line_stripped.lower() == 'capstone tracker with an integrated evaluation system':
                            continue
                        if re.match(r'^\d+$', line_stripped) and len(line_stripped) <= 3:
                            continue
                        if re.match(r'^[_\-]+$', line_stripped):
                            continue
                        
                        if not line_stripped:
                            if current_para:
                                paragraphs.append(' '.join(current_para))
                                current_para = []
                        else:
                            current_para.append(line_stripped)
                    
                    if current_para:
                        paragraphs.append(' '.join(current_para))
                    
                    # Filter complete paragraphs
                    good_paragraphs = []
                    for para in paragraphs:
                        if len(para) < 30:
                            continue
                        if para and para[0].islower():
                            continue
                        if para and para[-1] not in '.!?':
                            if not re.search(r'\b(Figure|Fig\.|Table|Chapter|Section)\s*\d+', para, re.IGNORECASE):
                                continue
                        
                        if re.search(r'\b(Figure|Fig\.|Table)\s*\d+', para, re.IGNORECASE):
                            good_paragraphs.insert(0, para)
                        else:
                            good_paragraphs.append(para)
                    
                    # Take up to 2-3 complete paragraphs
                    selected_paras = []
                    total_length = 0
                    max_chars = 1000
                    
                    for para in good_paragraphs[:5]:
                        if total_length + len(para) < max_chars:
                            selected_paras.append(para)
                            total_length += len(para)
                        elif total_length == 0:
                            selected_paras.append(para[:max_chars])
                            break
                        else:
                            break
                    
                    if selected_paras:
                        nearby_text = '\n\n'.join(selected_paras)
                    else:
                        all_text = ' '.join(paragraphs)
                        sentences = re.split(r'(?<=[.!?])\s+', all_text)
                        complete_sentences = [s for s in sentences if s and s[0].isupper() and len(s) > 20]
                        if complete_sentences:
                            nearby_text = ' '.join(complete_sentences[:3])
                        else:
                            nearby_text = all_text[:500] if all_text else ""
                
                # Store image data
                image_data.append({
                    'path': filepath,
                    'text': nearby_text.strip(),
                    'page': page_num + 1
                })
            except Exception as e:
                # Skip images that can't be extracted
                continue
    
    doc.close()
    return image_data

def calculate_clip_similarity(image_path, text, model, preprocess, device):
    """Calculate cosine similarity between image and text using CLIP"""
    if not clip_available or not text.strip():
        return 0.0
    
    try:
        # Encode image
        image = preprocess(Image.open(image_path)).unsqueeze(0).to(device)
        image_features = model.encode_image(image)
        
        # Encode text (truncate if too long)
        text_truncated = text[:200]
        text_tokens = clip.tokenize([text_truncated], truncate=True).to(device)
        text_features = model.encode_text(text_tokens)
        
        # Calculate cosine similarity
        image_features = image_features / image_features.norm(dim=-1, keepdim=True)
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)
        similarity = (image_features @ text_features.T).item()
        
        return similarity
    except Exception as e:
        print(f"  Error processing {image_path}: {str(e)}", file=sys.stderr)
        return 0.0

def detect_repeating_patterns(pdf_path, min_occurrences=3):
    """Detect repeating headers/footers (exact copy from notebook)"""
    doc = fitz.open(pdf_path)
    header_candidates = {}
    footer_candidates = {}
    
    for page in doc:
        rect = page.rect
        
        # Header area (top 100px)
        header_rect = fitz.Rect(rect.x0, rect.y0, rect.x1, rect.y0 + 100)
        header_lines = [l.strip() for l in page.get_text("text", clip=header_rect).split('\n') 
                       if l.strip() and len(l.strip()) > 2 and not l.strip().isdigit()]
        
        # Footer area (bottom 100px)
        footer_rect = fitz.Rect(rect.x0, rect.y1 - 100, rect.x1, rect.y1)
        footer_lines = [l.strip() for l in page.get_text("text", clip=footer_rect).split('\n') 
                       if l.strip() and len(l.strip()) > 2 and not l.strip().isdigit()]
        
        for line in header_lines:
            header_candidates[line] = header_candidates.get(line, 0) + 1
        for line in footer_lines:
            footer_candidates[line] = footer_candidates.get(line, 0) + 1
    
    headers = {line for line, count in header_candidates.items() if count >= min_occurrences}
    footers = {line for line, count in footer_candidates.items() if count >= min_occurrences}
    
    doc.close()
    return headers, footers

def extract_text_without_headers_footers(pdf_path):
    """Extract text with header/footer removal (exact copy from notebook)"""
    # Detect patterns
    headers, footers = detect_repeating_patterns(pdf_path)
    headers_norm = {normalize(h) for h in headers}
    footers_norm = {normalize(f) for f in footers}
    
    # Extract and filter
    doc = fitz.open(pdf_path)
    all_lines = []
    removed_count = 0
    
    for page in doc:
        page_text = page.get_text("text")
        for line in page_text.split('\n'):
            line_norm = normalize(line)
            
            # Skip empty
            if not line_norm:
                continue
            
            # Skip headers/footers
            if line_norm in headers_norm or line_norm in footers_norm:
                removed_count += 1
                continue
            
            # Skip page numbers
            if line.strip().isdigit():
                continue
            
            # Skip separator lines
            if re.match(r'^[_\s-]+$', line):
                continue
            
            all_lines.append(line)
    
    doc.close()
    full_text = '\n'.join(all_lines)
    
    return full_text

def clean_text(text):
    """Clean extracted text - remove TOC, references, appendix, etc. (exact copy from notebook)"""
    # 1. Extract from ABSTRACT onwards
    abstract_start_match = re.search(r'\s*ABSTRACT', text, re.IGNORECASE)
    if abstract_start_match:
        text_from_abstract_onwards = text[abstract_start_match.start():]
    else:
        print("  ⚠ Warning: ABSTRACT section not found.", file=sys.stderr)
        text_from_abstract_onwards = text

    # 2. Remove REFERENCES/BIBLIOGRAPHY and everything after
    references_match = re.search(r'(^\s*(References|REFERENCES):?\s*$)|(^\s*\[\d+\].*)', text_from_abstract_onwards, re.MULTILINE)
    if references_match:
        text_before_references = text_from_abstract_onwards[:references_match.start()].strip()
    else:
        print("  ⚠ Warning: References section not found.", file=sys.stderr)
        text_before_references = text_from_abstract_onwards

    # 3. Remove TOC, LIST OF FIGURES, LIST OF TABLES
    list_patterns = [
        r'^\s*TABLE OF CONTENTS.*?^\s*(INTRODUCTION|Chapter\s+I[:\s\.]|1\.\s+Introduction)', 
        r'^\s*LIST OF FIGURES.*?^\s*(INTRODUCTION|Chapter\s+I[:\s\.]|1\.\s+Introduction)', 
        r'^\s*LIST OF TABLES.*?^\s*(INTRODUCTION|Chapter\s+I[:\s\.]|1\.\s+Introduction)'
    ]
    
    cleaned_text = text_before_references
    found_introduction = False

    for pattern_str in list_patterns:
        pattern = re.compile(pattern_str, re.IGNORECASE | re.DOTALL | re.MULTILINE)
        match = pattern.search(cleaned_text)
        if match:
            stop_marker = match.group(1)
            if stop_marker:
                cleaned_text = pattern.sub(stop_marker, cleaned_text, count=1).strip()
                if re.match(r'INTRODUCTION|Chapter|1\.', stop_marker, re.IGNORECASE):
                    found_introduction = True
            else:
                cleaned_text = pattern.sub('', cleaned_text, count=1).strip()

    # Final trim
    cleaned_text = cleaned_text.strip()

    return cleaned_text

def add_spacing_before_headings(text):
    """Add a blank line before section headings for better readability (exact copy from notebook)"""
    lines = text.split('\n')
    formatted_lines = []
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # Check if this line is a heading
        is_heading = False
        
        if stripped and len(stripped) < 100:
            # Pattern 1: All caps headings (e.g., "INTRODUCTION", "ABSTRACT AND SCOPE")
            if stripped.isupper() and len(stripped.split()) <= 8:
                is_heading = True
            
            # Pattern 2: Numbered sections (e.g., "6.1.1", "6.1 :", "1.")
            elif re.match(r'^\d+\.\d*\.?\d*\s*:?\s*$', stripped):
                is_heading = True
            
            # Pattern 3: Numbered sections with text (e.g., "6.1.1 Introduction:")
            elif re.match(r'^\d+\.\d*\.?\d*\s*[:\-]?\s*[A-Z]', stripped):
                is_heading = True
            
            # Pattern 4: Reference markers (e.g., "Reference [1]")
            elif re.match(r'^Reference\s*\[\d+\]', stripped, re.IGNORECASE):
                is_heading = True
            
            # Pattern 5: Title case headings at start of line (e.g., "Introduction", "Problem Statement")
            elif re.match(r'^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*$', stripped) and len(stripped.split()) <= 5:
                is_heading = True
            
            # Pattern 6: Single word capitalized (e.g., "Objectives", "Evaluation")
            elif re.match(r'^[A-Z][a-z]+:?\s*$', stripped) and len(stripped) > 3:
                # Make sure previous line is not part of a sentence
                if i > 0:
                    prev_line = lines[i-1].strip()
                    # If previous line ends with period, this could be a heading
                    if not prev_line or prev_line.endswith('.') or prev_line.endswith(':'):
                        is_heading = True
        
        # Add blank line before heading (if not first line and previous line isn't blank)
        if is_heading and i > 0:
            prev_line = lines[i - 1].strip() if i > 0 else ''
            if prev_line:  # Only add if previous line isn't already blank
                formatted_lines.append('')
        
        formatted_lines.append(line)
    
    return '\n'.join(formatted_lines)

def extract_and_clean_text(pdf_path):
    """Extract and clean text from PDF (EXACT copy of notebook logic - Cell 5)"""
    # Step 1: Extract text without headers/footers (exact notebook logic)
    full_text = extract_text_without_headers_footers(pdf_path)
    
    # Step 2: Handle List of Figures/Tables (exact notebook logic from Cell 5)
    # Strategy: Skip past List of Figures/Tables content and find first content section
    # Strategy: Find real content AFTER List of Figures table ends
    # The LOF heading is followed by the table content (Figure No., Title, Page No., entries)
    # Real content (Introduction, etc.) comes after this table
    lof_match = re.search(r'^\s*(List of Figures|List of Tables)\s*$', full_text, re.IGNORECASE | re.MULTILINE)
    
    if lof_match:
        # Skip past the LOF heading AND its table content
        # Look for real content starting at least 150 chars after LOF heading
        search_start = lof_match.end() + 150  # Skip past table content
        search_text = full_text[search_start:]
        
        # Look for first real section heading
        content_patterns = [
            r'(^\s*Introduction\s*$)',
            r'(^\s*INTRODUCTION\s*$)',
            r'(^\s*Problem Statement\s*$)',
            r'(^\s*PROBLEM STATEMENT\s*$)'
        ]
        
        content_start = None
        for pattern in content_patterns:
            match = re.search(pattern, search_text, re.MULTILINE)
            if match:
                # Verify it's real content (has paragraph text after it)
                text_after = search_text[match.end():match.end()+200]
                has_content = any(len(line.strip()) > 50 for line in text_after.split('\n'))
                
                if has_content:
                    content_start = search_start + match.start()
                    break
        
        if content_start:
            full_text = full_text[content_start:]
        else:
            # Fallback: just skip past LOF + 300 chars
            full_text = full_text[lof_match.end() + 300:]
    
    # Step 3: Remove references - look for References heading (exact notebook logic)
    ref_heading_match = re.search(r'^\s*(References|REFERENCES|References and Bibliography|REFERENCES/BIBLIOGRAPHY|Bibliography|BIBLIOGRAPHY):?\s*$', full_text, re.MULTILINE | re.IGNORECASE)
    
    if ref_heading_match:
        full_text = full_text[:ref_heading_match.start()]
    
    # Step 4: Apply spacing before headings (exact notebook logic)
    cleaned_text = full_text.strip()
    cleaned_text = add_spacing_before_headings(cleaned_text)
    
    print(f"Debug: Final cleaned text length: {len(cleaned_text)} characters", file=sys.stderr)
    
    return cleaned_text

def count_syllables(word):
    """Count syllables in a word"""
    word = word.lower()
    count = 0
    vowels = "aeiouy"
    previous_was_vowel = False
    
    for char in word:
        is_vowel = char in vowels
        if is_vowel and not previous_was_vowel:
            count += 1
        previous_was_vowel = is_vowel
    
    if word.endswith('e'):
        count -= 1
    if count == 0:
        count = 1
    
    return count

def calculate_quality_metrics(pdf_path):
    """Calculate quality metrics from PDF text"""
    if not nltk_available:
        print("Warning: NLTK not available for quality metrics", file=sys.stderr)
        return {
            "gunningFogIndex": 0,
            "automatedReadabilityIndex": 0,
            "lexicalDensity": 0,
            "indecisiveWordIndex": 0,
            "score": 0
        }
    
    try:
        # Extract and clean text
        cleaned_text = extract_and_clean_text(pdf_path)
        
        # Debug: Print text length
        text_length = len(cleaned_text) if cleaned_text else 0
        print(f"Debug: Extracted text length: {text_length} characters", file=sys.stderr)
        
        # Lower the threshold - even short texts can give meaningful metrics
        if not cleaned_text or len(cleaned_text) < 50:
            print(f"Warning: Text too short ({text_length} chars) for quality metrics. Minimum: 50 chars", file=sys.stderr)
            return {
                "gunningFogIndex": 0,
                "automatedReadabilityIndex": 0,
                "lexicalDensity": 0,
                "indecisiveWordIndex": 0,
                "score": 0
            }
        
        # Continue with any text that's at least 50 characters
        if text_length < 200:
            print(f"Info: Using shorter text ({text_length} chars) for quality metrics", file=sys.stderr)
        
        # Gunning Fog Index
        def gunning_fog_index(text):
            sentences = sent_tokenize(text)
            words = word_tokenize(text)
            words = [w for w in words if w.isalpha()]
            
            if not sentences or not words:
                return 0
            
            complex_words = [w for w in words if count_syllables(w) >= 3]
            avg_sentence_length = len(words) / len(sentences)
            percent_complex = (len(complex_words) / len(words)) * 100
            
            return 0.4 * (avg_sentence_length + percent_complex)
        
        # Automated Readability Index
        def automated_readability_index(text):
            sentences = sent_tokenize(text)
            words = word_tokenize(text)
            words = [w for w in words if w.isalpha()]
            
            if not sentences or not words:
                return 0
            
            # Count ALL alphanumeric characters in the original text (not just in filtered words)
            # This is the correct ARI formula: characters include letters and numbers
            chars = sum(1 for c in text if c.isalnum())
            
            return 4.71 * (chars / len(words)) + 0.5 * (len(words) / len(sentences)) - 21.43
        
        # Lexical Density
        def calculate_lexical_density(text):
            words = word_tokenize(text.lower())
            words = [w for w in words if w.isalpha()]
            
            if not words:
                return 0
            
            pos_tags = pos_tag(words)
            content_tags = {'NN', 'NNS', 'NNP', 'NNPS', 'VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ', 'JJ', 'JJR', 'JJS', 'RB', 'RBR', 'RBS'}
            content_words = [w for w, tag in pos_tags if tag in content_tags]
            
            return len(content_words) / len(words)
        
        # Indecisive Word Index (Uncertainty Index)
        def indecisive_word_index(text):
            words = word_tokenize(text.lower())
            hedging_words = {'possibly', 'perhaps', 'might', 'could', 'may', 'seems', 'appears', 'suggests', 'indicates', 'likely'}
            assertive_words = {'definitely', 'certainly', 'clearly', 'obviously', 'undoubtedly', 'proves', 'demonstrates', 'shows'}
            booster_words = {'very', 'extremely', 'highly', 'strongly', 'significantly'}
            
            if not words:
                return 0
            
            num_words = len(words)
            first_20_percent = int(num_words * 0.2)
            last_20_percent = int(num_words * 0.2)
            
            score = 0
            for i, word in enumerate(words):
                # Position weighting: first/last word get 2.0x, first/last 20% get 1.5x
                if i == 0 or i == num_words - 1:
                    position_weight = 2.0
                elif i < first_20_percent or i >= (num_words - last_20_percent):
                    position_weight = 1.5
                else:
                    position_weight = 1.0
                
                if word in hedging_words:
                    score += 1 * position_weight
                elif word in assertive_words:
                    score -= 1 * position_weight
                elif word in booster_words:
                    score -= 0.5 * position_weight
            
            result = score / num_words
            return result
        
        # Calculate raw metrics
        fog = gunning_fog_index(cleaned_text)
        ari = automated_readability_index(cleaned_text)
        lex_density = calculate_lexical_density(cleaned_text)
        indecisive_idx = indecisive_word_index(cleaned_text)
        
        # Clarity Score Formula (based on iclr_22_readability.json)
        # Normalize Gunning Fog and ARI to 0-1 using reasonable ranges
        # Academic papers typically have higher scores: GF 0-30, ARI -5 to 25
        # Expanded ranges to better accommodate academic writing
        fog_min, fog_max = 0.0, 30.0  # Expanded for academic papers (typically 15-25)
        ari_min, ari_max = -5.0, 25.0  # Expanded for academic papers (typically 10-20)
        
        # Min-max normalize GF and ARI to 0-1
        normalized_gf = max(0.0, min(1.0, (fog - fog_min) / (fog_max - fog_min) if (fog_max - fog_min) > 0 else 0.0))
        normalized_ari = max(0.0, min(1.0, (ari - ari_min) / (ari_max - ari_min) if (ari_max - ari_min) > 0 else 0.0))
        
        # Normalize indecisive index to 0-1
        # Indecisive index can be negative, so we need to handle that
        # Use a reasonable range based on typical values (e.g., -0.1 to 0.1)
        und_min, und_max = -0.1, 0.1
        und_range = und_max - und_min
        if und_range > 0:
            normalized_und = max(0.0, min(1.0, (indecisive_idx - und_min) / und_range))
        else:
            normalized_und = 0.5  # Default to middle if range is invalid
        
        # Invert all metrics (higher = clearer)
        inverted_gf = 1.0 - normalized_gf
        inverted_ari = 1.0 - normalized_ari
        inverted_ld = 1.0 - lex_density  # Lexical density is already 0-1
        inverted_und = 1.0 - normalized_und
        
        # Weighted combination
        clarity_score = (inverted_gf * 0.15) + (inverted_ari * 0.20) + (inverted_ld * 0.30) + (inverted_und * 0.35)
        
        # Scale to 0-10, then apply scaling factor to shift college-level reports (typically 3-6) closer to 10
        # Use a scaling that maps typical range (0.3-0.6) to a better range (5-8)
        # Formula: scale from [0.3, 0.6] to [5, 8], then clamp to [0, 10]
        base_score = clarity_score * 10.0
        
        # Apply scaling: if score is in typical college range (3-6), scale it upward
        # Map [3, 6] to approximately [6, 9] for better reflection
        if base_score >= 3.0 and base_score <= 6.0:
            # Linear scaling: (score - 3) / (6 - 3) maps to (new_score - 6) / (9 - 6)
            # new_score = 6 + (score - 3) * (9 - 6) / (6 - 3) = 6 + (score - 3) * 1
            quality_score = 6.0 + (base_score - 3.0) * 1.0  # Maps 3→6, 6→9
        elif base_score < 3.0:
            # Scale lower scores proportionally: [0, 3] → [0, 6]
            quality_score = base_score * 2.0
        else:
            # Scores above 6 stay as-is (already good)
            quality_score = base_score
        
        # Clamp to 0-10 range
        quality_score = max(0.0, min(10.0, quality_score))
        
        # Handle negative indecisive index for display (show 0 if negative)
        indecisive_display = 0 if indecisive_idx < 0 else indecisive_idx
        
        result = {
            "gunningFogIndex": round(fog, 2),
            "automatedReadabilityIndex": round(ari, 2),
            "lexicalDensity": round(lex_density, 4),
            "indecisiveWordIndex": round(indecisive_display, 4),
            "score": round(quality_score, 2)  # Score is now 0-10 (clarity score scaled)
        }
        
        print(f"Debug: Quality metrics calculated successfully:", file=sys.stderr)
        print(f"  - Gunning Fog Index: {result['gunningFogIndex']}", file=sys.stderr)
        print(f"  - Automated Readability Index: {result['automatedReadabilityIndex']}", file=sys.stderr)
        print(f"  - Lexical Density: {result['lexicalDensity']}", file=sys.stderr)
        print(f"  - Indecisive Word Index: {result['indecisiveWordIndex']}", file=sys.stderr)
        print(f"  - Quality Score: {result['score']}", file=sys.stderr)
        
        return result
    except Exception as e:
        import traceback
        print(f"Error: Quality metrics calculation failed: {str(e)}", file=sys.stderr)
        print(f"Traceback: {traceback.format_exc()}", file=sys.stderr)
        return {
            "gunningFogIndex": 0,
            "automatedReadabilityIndex": 0,
            "lexicalDensity": 0,
            "indecisiveWordIndex": 0,
            "score": 0
        }

def calculate_novelty_score(text):
    """Calculate novelty score using fine-tuned model"""
    if not transformers_available:
        print("Warning: transformers not available for novelty scoring", file=sys.stderr)
        return {
            "score": 0.0
        }
    
    try:
        # Get the directory where this script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Try multiple possible paths to find the checkpoint
        possible_paths = [
            # From Login/project-portal/backend/ -> go up 3 levels to workspace root -> Evaluation/checkpoint-2200
            os.path.normpath(os.path.join(script_dir, "..", "..", "..", "Evaluation", "checkpoint-2200")),
            # Alternative: from backend/ -> go up 2 levels -> Evaluation/checkpoint-2200
            os.path.normpath(os.path.join(script_dir, "..", "..", "Evaluation", "checkpoint-2200")),
            # Absolute path fallback: try to find Evaluation folder from current directory
            os.path.normpath(os.path.join(os.getcwd(), "Evaluation", "checkpoint-2200")),
        ]
        
        checkpoint_path = None
        for path in possible_paths:
            if os.path.exists(path):
                checkpoint_path = path
                print(f"Debug: Found checkpoint at: {checkpoint_path}", file=sys.stderr)
                break
        
        if not checkpoint_path:
            print(f"Warning: Novelty model checkpoint not found. Tried paths:", file=sys.stderr)
            for path in possible_paths:
                print(f"  - {path} (exists: {os.path.exists(path)})", file=sys.stderr)
            return {
                "score": 0.0
            }
        
        # Load tokenizer and model (lazy loading - only when needed)
        # Note: This will be slow on first call, but subsequent calls will reuse the loaded model
        if not hasattr(calculate_novelty_score, '_model_loaded'):
            print(f"Loading novelty model from {checkpoint_path}...", file=sys.stderr)
            try:
                tokenizer = AutoTokenizer.from_pretrained(checkpoint_path, use_fast=True)
            except Exception:
                tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased", use_fast=True)
            
            model = AutoModelForSequenceClassification.from_pretrained(checkpoint_path)
            model.eval()
            
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            model.to(device)
            
            # Store in function attributes for reuse
            calculate_novelty_score._tokenizer = tokenizer
            calculate_novelty_score._model = model
            calculate_novelty_score._device = device
            calculate_novelty_score._model_loaded = True
            print("Novelty model loaded successfully", file=sys.stderr)
        
        tokenizer = calculate_novelty_score._tokenizer
        model = calculate_novelty_score._model
        device = calculate_novelty_score._device
        
        # Check if text is too short
        if not text or len(text.strip()) < 50:
            print("Warning: Text too short for novelty scoring", file=sys.stderr)
            return {
                "score": 0.0
            }
        
        # Tokenize and compute score
        inputs = tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=512,
        )
        inputs = {k: v.to(device) for k, v in inputs.items()}
        
        with torch.no_grad():
            logits = model(**inputs).logits
        
        # Extract score based on model output shape
        if logits.dim() == 2 and logits.size(-1) == 1:
            score = float(logits.squeeze(-1).item())
        elif logits.size(-1) == 2:
            score = float(logits[:, 1].item())
        else:
            score = float(logits.max(dim=-1).values.item())
        
        print(f"Debug: Novelty score calculated: {score:.4f}", file=sys.stderr)
        
        return {
            "score": round(score, 4)
        }
        
    except Exception as e:
        import traceback
        print(f"Error: Novelty scoring failed: {str(e)}", file=sys.stderr)
        print(f"Traceback: {traceback.format_exc()}", file=sys.stderr)
        return {
            "score": 0.0
        }

def main():
    """Main function to parse PDF with dynamic headings"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python pdf_parser.py <pdf_path> <headings_json_file> <font_size>"
        }))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    headings_file = sys.argv[2] if len(sys.argv) > 2 else None
    font_size = float(sys.argv[3]) if len(sys.argv) > 3 else 14.0
    
    try:
        # Read headings from file or use empty list
        if headings_file and os.path.exists(headings_file):
            with open(headings_file, 'r', encoding='utf-8') as f:
                headings_list = json.load(f)
        else:
            headings_list = []
        
        # Convert headings list to expected_sections format
        # Each heading becomes a group with itself as the primary and lowercase variant
        expected_sections = []
        for heading_obj in headings_list:
            if isinstance(heading_obj, dict) and "text" in heading_obj:
                heading_text = heading_obj["text"].strip()
                if heading_text:
                    # Create a group with the heading and its lowercase variant
                    expected_sections.append([heading_text, heading_text.lower()])
            elif isinstance(heading_obj, str) and heading_obj.strip():
                heading_text = heading_obj.strip()
                expected_sections.append([heading_text, heading_text.lower()])
        
        # If no headings provided, return empty result
        if not expected_sections:
            print(json.dumps({
                "success": True,
                "found": [],
                "missing": [],
                "total": 0,
                "message": "No headings provided in layout"
            }))
            return
        
        # Validate PDF exists
        if not os.path.exists(pdf_path):
            print(json.dumps({
                "success": False,
                "error": f"PDF file not found: {pdf_path}"
            }))
            sys.exit(1)
        
        # Validate headings
        found, missing, total = validate_headings(pdf_path, expected_sections, min_fontsize=font_size)
        
        # Calculate score (percentage of found headings)
        score = (len(found) / total * 100) if total > 0 else 0
        
        # Calculate quality metrics
        quality_metrics = calculate_quality_metrics(pdf_path)
        
        # Extract cleaned text for novelty scoring
        cleaned_text = ""
        try:
            cleaned_text = extract_and_clean_text(pdf_path)
        except Exception as e:
            print(f"Warning: Failed to extract text for novelty scoring: {str(e)}", file=sys.stderr)
        
        # Calculate novelty score
        novelty_metrics = calculate_novelty_score(cleaned_text) if cleaned_text else {"score": 0.0}
        
        # Calculate technical soundness (using Llama model via Ollama)
        technical_soundness_metrics = {"score": 0, "reasoning": "", "issues": []}
        if cleaned_text and len(cleaned_text.strip()) >= 50:
            try:
                # Import technical soundness evaluation function directly
                import importlib.util
                script_dir = os.path.dirname(os.path.abspath(__file__))
                tech_soundness_script = os.path.join(script_dir, "technical_soundness.py")
                
                if os.path.exists(tech_soundness_script):
                    spec = importlib.util.spec_from_file_location("technical_soundness", tech_soundness_script)
                    tech_module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(tech_module)
                    
                    print("Evaluating technical soundness with Llama model...", file=sys.stderr)
                    tech_result = tech_module.evaluate_technical_soundness(cleaned_text)
                    
                    technical_soundness_metrics = {
                        "score": tech_result.get("score", 0),
                        "reasoning": tech_result.get("reasoning", ""),
                        "issues": tech_result.get("issues", [])
                    }
                    print(f"Technical soundness score: {technical_soundness_metrics['score']}", file=sys.stderr)
                else:
                    print(f"Warning: Technical soundness script not found at {tech_soundness_script}", file=sys.stderr)
            except ImportError as e:
                print(f"Warning: Ollama not available for technical soundness: {str(e)}", file=sys.stderr)
            except Exception as e:
                print(f"Warning: Technical soundness evaluation failed: {str(e)}", file=sys.stderr)
                import traceback
                print(f"Traceback: {traceback.format_exc()}", file=sys.stderr)
        
        # Extract images and calculate CLIP similarity
        image_similarity_score = 0.0
        image_count = 0
        avg_similarity = 0.0
        
        try:
            # Create temporary directory for images
            temp_images_dir = tempfile.mkdtemp(prefix="pdf_images_")
            
            # Extract images and calculate similarity
            image_data = extract_images_with_text(pdf_path, temp_images_dir)
            image_count = len(image_data)
            
            if image_count > 0 and clip_available:
                # Load CLIP model
                device = "cuda" if torch.cuda.is_available() else "cpu"
                model, preprocess = clip.load("ViT-B/32", device=device)
                
                # Calculate similarities (skip images with empty text)
                similarities = []
                for img_info in image_data:
                    # Skip CLIP check if text is empty
                    if not img_info.get('text', '').strip():
                        print(f"  Skipping CLIP check for {img_info.get('path', 'unknown')}: empty text", file=sys.stderr)
                        continue
                    
                    sim = calculate_clip_similarity(img_info['path'], img_info['text'], model, preprocess, device)
                    similarities.append(sim)
                    img_info['similarity'] = sim
                
                if similarities:
                    avg_similarity = sum(similarities) / len(similarities)
                    # Convert similarity to score (0-100 scale, where 1.0 = 100)
                    # CLIP similarity ranges from -1 to 1, but typically 0 to 1 for related content
                    # Normalize to 0-100 scale
                    image_similarity_score = max(0, min(100, (avg_similarity + 1) * 50))  # Map [-1,1] to [0,100]
            
            # Clean up temp directory
            try:
                shutil.rmtree(temp_images_dir)
            except:
                pass
                
        except Exception as e:
            print(f"Warning: Image extraction/CLIP analysis failed: {str(e)}", file=sys.stderr)
            # Continue without image analysis
        
        # Return results as JSON
        try:
            result = {
                "success": True,
                "found": found,
                "missing": missing,
                "total": total,
                "foundCount": len(found),
                "missingCount": len(missing),
                "score": round(score, 2),
                "fontSize": font_size,
                "imageCheck": {
                    "imageCount": image_count,
                    "avgSimilarity": round(avg_similarity, 4),
                    "score": round(image_similarity_score, 2)
                },
                "qualityCheck": {
                    "gunningFogIndex": quality_metrics["gunningFogIndex"],
                    "automatedReadabilityIndex": quality_metrics["automatedReadabilityIndex"],
                    "lexicalDensity": quality_metrics["lexicalDensity"],
                    "indecisiveWordIndex": quality_metrics["indecisiveWordIndex"],
                    "score": quality_metrics["score"]
                },
                "noveltyCheck": {
                    "score": novelty_metrics["score"]
                },
                "technicalSoundness": {
                    "score": technical_soundness_metrics["score"],
                    "reasoning": technical_soundness_metrics["reasoning"],
                    "issues": technical_soundness_metrics["issues"]
                }
            }
            
            # Ensure all values are JSON serializable
            json_output = json.dumps(result)
            # CRITICAL: Only print JSON to stdout, nothing else
            # This ensures the backend can always find and parse the JSON
            sys.stdout.write(json_output)
            sys.stdout.write('\n')  # Add newline for clarity
            sys.stdout.flush()
            # Exit successfully after printing JSON
            sys.exit(0)
            
        except Exception as json_error:
            # If JSON serialization fails, return error
            import traceback
            print(f"Error creating result JSON: {str(json_error)}", file=sys.stderr)
            print(f"Traceback: {traceback.format_exc()}", file=sys.stderr)
            try:
                error_json = json.dumps({
                    "success": False,
                    "error": f"Failed to create result JSON: {str(json_error)}"
                })
                print(error_json)
                sys.stdout.flush()
            except:
                # If even error JSON fails, print minimal error
                print('{"success": false, "error": "Critical error in JSON serialization"}')
            sys.exit(0)
        
    except json.JSONDecodeError as e:
        print(json.dumps({
            "success": False,
            "error": f"Invalid JSON format for headings: {str(e)}"
        }))
        sys.exit(0)  # Exit with 0 since we output valid JSON
    except Exception as e:
        error_msg = f"Error parsing PDF: {str(e)}"
        print(json.dumps({
            "success": False,
            "error": error_msg
        }))
        # Print traceback to stderr for debugging
        import traceback
        print(f"Traceback: {traceback.format_exc()}", file=sys.stderr)
        sys.exit(0)  # Exit with 0 since we output valid JSON

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        # Handle Ctrl+C gracefully
        print(json.dumps({
            "success": False,
            "error": "Process interrupted by user"
        }))
        sys.exit(0)
    except Exception as e:
        # Catch any unhandled exceptions and output JSON
        import traceback
        error_msg = f"Unexpected error in main: {str(e)}"
        print(f"Critical error: {error_msg}", file=sys.stderr)
        print(f"Traceback: {traceback.format_exc()}", file=sys.stderr)
        try:
            print(json.dumps({
                "success": False,
                "error": error_msg
            }))
        except:
            # If even JSON output fails, print minimal error
            print('{"success": false, "error": "Critical error occurred"}')
        sys.exit(0)  # Always exit with 0 when we output JSON

