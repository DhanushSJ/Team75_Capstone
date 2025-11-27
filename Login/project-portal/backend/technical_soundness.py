#!/usr/bin/env python3
"""
Technical Soundness Evaluation Script
Uses Llama 8B model to evaluate technical soundness of report text
"""

import sys
import json
import ollama
import re

def evaluate_technical_soundness(text):
    """
    Evaluate technical soundness of the provided text using Llama 8B model.
    Returns a score from 1-10 and detailed reasoning.
    """
    if not text or len(text.strip()) < 50:
        return {
            "score": 0,
            "reasoning": "Text is too short for technical soundness evaluation (minimum 50 characters required).",
            "issues": []
        }
    
    # Elaborate prompt to prevent hallucination and ensure detailed evaluation
    prompt = f"""You are an expert technical evaluator for computer science and engineering capstone project reports. Your task is to evaluate the TECHNICAL SOUNDNESS of the following report text.

CRITICAL INSTRUCTIONS:
1. You must evaluate ONLY the technical soundness aspects listed below. Do NOT evaluate novelty, writing quality, or formatting.
2. You must provide a score from 1-10 (where 10 is perfect technical soundness, 1 is severely flawed).
3. You must identify SPECIFIC technically unsound parts by quoting exact phrases or sentences from the text.
4. You must explain WHY each identified issue is technically unsound.
5. You must round UP to the higher number if the score is between integers (e.g., 7.3 → 8, 6.7 → 7).

TECHNICAL SOUNDNESS CRITERIA (evaluate each):

A. TECHNICAL ACCURACY (Weight: 30%)
   - Are technical concepts, algorithms, methodologies, and terminologies used correctly?
   - Are there any factual errors, incorrect technical statements, or misused technical terms?
   - Are mathematical formulas, equations, or technical specifications accurate?
   - Are programming concepts, data structures, algorithms correctly explained?

B. LOGICAL CONSISTENCY (Weight: 25%)
   - Is the technical logic sound and consistent throughout?
   - Are there contradictions in technical explanations?
   - Do the technical claims align with the proposed methodology?
   - Are cause-effect relationships in technical discussions logically valid?

C. METHODOLOGY RIGOR (Weight: 25%)
   - Is the technical approach/methodology well-defined and appropriate?
   - Are technical procedures, algorithms, or system designs clearly explained?
   - Is the technical implementation approach sound and feasible?
   - Are technical assumptions clearly stated and reasonable?

D. TECHNICAL DEPTH AND COMPLETENESS (Weight: 20%)
   - Are technical concepts explained with sufficient depth?
   - Are critical technical details included or missing?
   - Is the technical content complete enough to understand the approach?
   - Are technical justifications provided for design choices?

EVALUATION PROCESS:
1. Read the entire text carefully.
2. Identify ALL technically unsound elements based on the criteria above.
3. For each issue found, quote the exact text and explain why it's technically unsound.
4. Calculate a score using this method:
   - START with 10 points (perfect technical soundness)
   - For each issue found, deduct points:
     * Critical technical errors (factual mistakes, incorrect algorithms): -2 to -3 points each
     * Significant technical inconsistencies (contradictions, logical flaws): -1 to -2 points each
     * Minor technical issues (unclear explanations, minor gaps): -0.5 to -1 point each
     * Missing critical technical details (important info not provided): -0.5 to -1 point each
   - IMPORTANT: Positive aspects (good structure, clear objectives) do NOT add points - they simply mean NO deduction for those areas
   - If the text is technically sound overall with only minor concerns, the score should be 7-9
   - If there are significant issues but also good aspects, the score should be 4-6
   - If there are critical errors, the score should be 1-3
   - If no issues are found, the score should be 10
5. Round UP the final score to the nearest integer (e.g., 7.2 → 8, 6.8 → 7).

OUTPUT FORMAT (you MUST follow this exact format):
SCORE: [integer from 1-10]

CRITICAL: Do NOT default to 5. The score must reflect the actual technical soundness:
- If the text is technically excellent with no or minimal issues: Score 8-10
- If the text has some concerns but is mostly sound: Score 6-7
- If the text has significant technical problems: Score 4-5
- If the text has critical technical errors: Score 1-3
- Starting from 10, deduct points ONLY for actual technical issues found

ISSUES FOUND:
1. [Quote the exact problematic text in quotes]
   Reason: [Explain why this is technically unsound]
   
2. [Quote the exact problematic text in quotes]
   Reason: [Explain why this is technically unsound]
   
[Continue for all issues found...]

If no issues are found, write:
ISSUES FOUND: None - The text demonstrates strong technical soundness across all criteria.

REPORT TEXT TO EVALUATE:
{text}

Now evaluate the technical soundness and provide your response in the exact format specified above."""

    try:
        print("Calling Llama model for technical soundness evaluation...", file=sys.stderr)
        
        response = ollama.chat(
            model="llama3.1:8b-instruct-q4_0",
            messages=[
                {'role': 'user', 'content': prompt}
            ],
            options={
                'temperature': 0.2,  # Lower temperature for more consistent evaluation
                'num_predict': 2000  # Allow longer responses for detailed reasoning
            }
        )
        
        response_text = response['message']['content']
        print(f"Model response received (length: {len(response_text)} chars)", file=sys.stderr)
        
        # Parse the response
        score = 0
        reasoning = ""
        issues = []  # Initialize issues list early
        
        # Extract issues first (needed for score estimation fallback)
        issues_section = ""
        if "ISSUES FOUND:" in response_text.upper():
            issues_start = response_text.upper().find("ISSUES FOUND:")
            issues_section = response_text[issues_start:]
        else:
            issues_section = response_text
        
        # Extract individual issues - try multiple formats
        # Format 1: Numbered with quotes and "Reason:"
        issue_pattern = r'(\d+)\.\s*["\']([^"\']+)["\']\s*\n\s*Reason:\s*([^\n]+(?:\n(?!\d+\.)[^\n]+)*)'
        issue_matches = re.finditer(issue_pattern, issues_section, re.MULTILINE | re.IGNORECASE)
        
        for match in issue_matches:
            issue_text = match.group(2).strip()
            issue_reason = match.group(3).strip()
            # Filter out false positives - don't include evaluation headers or positive statements
            if issue_text and issue_reason:
                # Skip if it's clearly not an issue (e.g., "Technical Soundness Evaluation" as title)
                skip_phrases = ['technical soundness evaluation', 'evaluation', 'assessment', 'review']
                if not any(phrase in issue_text.lower() for phrase in skip_phrases):
                    # Check if reason contains concern indicators
                    concern_indicators = ['not', 'missing', 'lack', 'concern', 'issue', 'problem', 'insufficient', 'unclear', 'vague', 'incomplete', 'essential', 'crucial', 'would be beneficial', 'unclear', 'ensure']
                    positive_indicators = ['well-structured', 'clear', 'comprehensive', 'good', 'excellent', 'appears to be']
                    has_concern = any(indicator in issue_reason.lower() for indicator in concern_indicators)
                    has_positive = any(indicator in issue_reason.lower() for indicator in positive_indicators)
                    # Only add if it has concerns, or if it has both (mixed feedback)
                    if has_concern or (has_positive and has_concern):
                        issues.append({
                            "text": issue_text,
                            "reason": issue_reason
                        })
        
        # Format 2: Bold headings followed by description (e.g., **Dataset Collection**: description)
        if not issues:
            bold_pattern = r'\*\*([^*]+)\*\*[:\s]*([^\n]+(?:\n(?!\*\*)[^\n]+)*)'
            bold_matches = re.finditer(bold_pattern, issues_section, re.MULTILINE)
            for match in bold_matches:
                issue_title = match.group(1).strip()
                issue_desc = match.group(2).strip()
                # Skip evaluation headers
                skip_phrases = ['technical soundness evaluation', 'evaluation', 'assessment']
                if any(phrase in issue_title.lower() for phrase in skip_phrases):
                    continue
                # Check if this looks like a concern/issue (contains words like "not", "missing", "lack", "concern", etc.)
                concern_indicators = ['not', 'missing', 'lack', 'concern', 'issue', 'problem', 'insufficient', 'unclear', 'vague', 'incomplete', 'essential', 'crucial', 'would be beneficial', 'ensure']
                if any(indicator in issue_desc.lower() for indicator in concern_indicators):
                    issues.append({
                        "text": issue_title,
                        "reason": issue_desc
                    })
        
        # Format 3: Quoted text followed by "Reason:"
        if not issues:
            simple_pattern = r'["\']([^"\']+)["\']\s*\n\s*Reason:\s*([^\n]+)'
            simple_matches = re.finditer(simple_pattern, issues_section, re.MULTILINE | re.IGNORECASE)
            for match in simple_matches:
                issue_text = match.group(1).strip()
                issue_reason = match.group(2).strip()
                if issue_text and issue_reason:  # Only add if both are present
                    issues.append({
                        "text": issue_text,
                        "reason": issue_reason
                    })
        
        # Format 4: Look for "However" or "concerns" sections that list issues
        if not issues and ("however" in issues_section.lower() or "concern" in issues_section.lower()):
            # Try to extract bullet points or numbered items after "concerns" or "however"
            concerns_section = ""
            if "however" in issues_section.lower():
                however_idx = issues_section.lower().find("however")
                concerns_section = issues_section[however_idx:]
            elif "concern" in issues_section.lower():
                concern_idx = issues_section.lower().find("concern")
                concerns_section = issues_section[concern_idx:]
            
            # Look for patterns like "- **Title**: description" or "* **Title**: description"
            bullet_pattern = r'[-*]\s*\*\*([^*]+)\*\*[:\s]*([^\n]+(?:\n(?![-*])[^\n]+)*)'
            bullet_matches = re.finditer(bullet_pattern, concerns_section, re.MULTILINE)
            for match in bullet_matches:
                issue_title = match.group(1).strip()
                issue_desc = match.group(2).strip()
                if issue_title and issue_desc:
                    issues.append({
                        "text": issue_title,
                        "reason": issue_desc
                    })
        
        # Extract score - try multiple patterns, but avoid picking up list numbers
        score = 0
        score_patterns = [
            r'SCORE:\s*(\d+)',  # SCORE: 8 (most explicit)
            r'score[:\s]+(\d+)(?:\s|/|$)',  # score: 8 or score 8 (with word boundary)
            r'(\d+)/10\b',  # 8/10 (with word boundary to avoid "1. Issue")
            r'score\s+of\s+(\d+)',  # score of 8
            r'rating[:\s]+(\d+)(?:\s|/|$)',  # rating: 8
            r'evaluation[:\s]+(\d+)(?:\s|/|$)',  # evaluation: 8
        ]
        
        for pattern in score_patterns:
            score_match = re.search(pattern, response_text, re.IGNORECASE)
            if score_match:
                potential_score = int(score_match.group(1))
                # Make sure it's not just a list number (like "1." at start of line)
                if potential_score >= 1 and potential_score <= 10:
                    # Check if it's actually part of a score context, not a list
                    match_start = score_match.start()
                    context_before = response_text[max(0, match_start-20):match_start].lower()
                    # If it's preceded by list markers, skip it
                    if not re.search(r'^\s*[\d\*\-\•]', context_before[-5:]):
                        score = potential_score
                        score = max(1, min(10, score))  # Ensure score is between 1-10
                        print(f"Extracted score {score} using pattern: {pattern}", file=sys.stderr)
                        break
        
        if score == 0:
            # Try to find any number between 1-10 that appears near "score" or at the beginning
            # Look for patterns like "8" or "8/10" near score-related words
            context_pattern = r'(?:score|rating|evaluation|grade)[:\s]+(\d+)(?:/10)?\b'
            context_match = re.search(context_pattern, response_text[:500], re.IGNORECASE)
            if context_match:
                score = int(context_match.group(1))
                score = max(1, min(10, score))
                print(f"Extracted score {score} from context", file=sys.stderr)
            else:
                # Estimate based on issues found (more reliable than random number extraction)
                issue_count = len(issues) if issues else 0
                
                # Scoring based on issue count:
                # 0 issues → 10
                # 1 issue → 9
                # 2-3 issues → 8
                # 4-5 issues → 7
                # 6-7 issues → 6
                # 8-9 issues → 5
                # 10-11 issues → 4
                # 12-13 issues → 3
                # 14-15 issues → 2
                # 16+ issues → 1
                if issue_count == 0:
                    # Check if response explicitly says no issues
                    if "no issues" in response_text.lower() or "no technical issues" in response_text.lower() or "none" in issues_section.lower():
                        score = 10  # No issues = perfect score
                    else:
                        score = 9  # Unclear but no issues extracted = high score
                elif issue_count == 1:
                    score = 9
                elif issue_count <= 3:
                    score = 8
                elif issue_count <= 5:
                    score = 7
                elif issue_count <= 7:
                    score = 6
                elif issue_count <= 9:
                    score = 5
                elif issue_count <= 11:
                    score = 4
                elif issue_count <= 13:
                    score = 3
                elif issue_count <= 15:
                    score = 2
                else:
                    score = 1  # 16+ issues = very low score
                
                print(f"Warning: Could not extract score from response, estimated {score} based on issues found: {issue_count}", file=sys.stderr)
        
        # Validate score matches issue count - if extracted score doesn't match, use fallback
        issue_count = len(issues) if issues else 0
        if score > 0 and issue_count > 0:
            # Calculate expected score based on issue count
            if issue_count == 1:
                expected_score = 9
            elif issue_count <= 3:
                expected_score = 8
            elif issue_count <= 5:
                expected_score = 7
            elif issue_count <= 7:
                expected_score = 6
            elif issue_count <= 9:
                expected_score = 5
            elif issue_count <= 11:
                expected_score = 4
            elif issue_count <= 13:
                expected_score = 3
            elif issue_count <= 15:
                expected_score = 2
            else:
                expected_score = 1
            
            # If extracted score doesn't match expected (any difference), use expected
            # This ensures 2-3 issues always gives 8, not 7
            if score != expected_score:
                print(f"Warning: Extracted score {score} doesn't match issue count {issue_count} (expected {expected_score}), using expected score", file=sys.stderr)
                score = expected_score
        
        # If score was extracted but doesn't match issue count, use fallback logic instead
        # This ensures consistency between score and issue count
        issue_count = len(issues) if issues else 0
        if score > 0 and issue_count > 0:
            # Calculate expected score based on issue count
            if issue_count == 1:
                expected_score = 9
            elif issue_count <= 3:
                expected_score = 8
            elif issue_count <= 5:
                expected_score = 7
            elif issue_count <= 7:
                expected_score = 6
            elif issue_count <= 9:
                expected_score = 5
            elif issue_count <= 11:
                expected_score = 4
            elif issue_count <= 13:
                expected_score = 3
            elif issue_count <= 15:
                expected_score = 2
            else:
                expected_score = 1
            
            # If extracted score doesn't match expected (any difference), use expected
            # This ensures consistency between score and issue count
            if score != expected_score:
                print(f"Warning: Extracted score {score} doesn't match issue count {issue_count} (expected {expected_score}), using expected score", file=sys.stderr)
                score = expected_score
        
        # Build reasoning text - only show "No issues" if we're certain
        # Check for explicit "no issues" AND no concerns mentioned
        has_explicit_no_issues = ("none" in issues_section.lower() or "no issues" in issues_section.lower() or "no technical issues" in issues_section.lower())
        has_concerns = ("concern" in response_text.lower() or "however" in response_text.lower() or "issue" in response_text.lower() or "problem" in response_text.lower())
        
        if not issues and has_explicit_no_issues and not has_concerns:
            reasoning = "No technical issues found. The report demonstrates strong technical soundness."
        elif issues and len(issues) > 0:
            reasoning_parts = [f"Found {len(issues)} technical issue(s):"]
            for i, issue in enumerate(issues, 1):
                reasoning_parts.append(f"\n{i}. Issue: \"{issue['text']}\"")
                reasoning_parts.append(f"   Reason: {issue['reason']}")
            reasoning = "\n".join(reasoning_parts)
        else:
            # If no issues extracted but concerns are mentioned, use full response
            # This handles cases where the LLM provides evaluation but not in our expected format
            reasoning = response_text
        
        print(f"Parsed score: {score}, Issues found: {len(issues)}", file=sys.stderr)
        
        return {
            "score": score,
            "reasoning": reasoning,
            "issues": issues,
            "raw_response": response_text  # Include raw response for debugging
        }
        
    except Exception as e:
        import traceback
        error_msg = f"Error evaluating technical soundness: {str(e)}"
        print(error_msg, file=sys.stderr)
        print(f"Traceback: {traceback.format_exc()}", file=sys.stderr)
        return {
            "score": 0,
            "reasoning": f"Evaluation failed: {error_msg}",
            "issues": [],
            "error": str(e)
        }

def main():
    """Main function to evaluate technical soundness"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python technical_soundness.py <text_file_path>"
        }))
        sys.exit(1)
    
    text_file_path = sys.argv[1]
    
    try:
        # Read text from file
        with open(text_file_path, 'r', encoding='utf-8', errors='ignore') as f:
            text = f.read()
        
        if not text or len(text.strip()) < 50:
            result = {
                "success": True,
                "score": 0,
                "reasoning": "Text is too short for technical soundness evaluation.",
                "issues": []
            }
        else:
            # Evaluate technical soundness
            evaluation = evaluate_technical_soundness(text)
            result = {
                "success": True,
                "score": evaluation["score"],
                "reasoning": evaluation["reasoning"],
                "issues": evaluation["issues"]
            }
        
        print(json.dumps(result))
        
    except FileNotFoundError:
        print(json.dumps({
            "success": False,
            "error": f"Text file not found: {text_file_path}"
        }))
        sys.exit(1)
    except Exception as e:
        import traceback
        print(json.dumps({
            "success": False,
            "error": f"Error evaluating technical soundness: {str(e)}",
            "traceback": traceback.format_exc()
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()

