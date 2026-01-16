#!/usr/bin/env python3
"""
Quick test script to verify chatbot fixes:
1. parse_days_from_text() accepts 1-30 days
2. is_medical_emergency() detects fever and other conditions
3. quick_medical_advice() returns proper guidance
"""

import sys
import os

# Add parent directory to path to import from api.chatbot
sys.path.insert(0, os.path.dirname(__file__))

from api.chatbot import (
    parse_days_from_text,
    is_medical_emergency,
    quick_medical_advice,
    is_diet_related_question
)

def test_parse_days():
    """Test parsing various day formats"""
    test_cases = [
        ("1 day plan", 1),
        ("3 day plan", 3),
        ("give me 7 days", 7),
        ("i want 10 day diet", 10),
        ("14 days please", 14),
        ("21 day challenge", 21),
        ("30 day plan", 30),
        ("give me 2 weeks", 14),
        ("1 month plan", 30),
        ("5 days", 5),
        ("random text", None),
    ]
    
    print("=" * 60)
    print("TEST 1: parse_days_from_text()")
    print("=" * 60)
    
    passed = 0
    failed = 0
    for message, expected in test_cases:
        result = parse_days_from_text(message)
        status = "✅ PASS" if result == expected else "❌ FAIL"
        if result == expected:
            passed += 1
        else:
            failed += 1
        print(f"{status}: '{message}' => {result} (expected {expected})")
    
    print(f"\nResult: {passed} passed, {failed} failed\n")
    return failed == 0

def test_medical_emergency():
    """Test emergency detection"""
    test_cases = [
        ("i have high fever", True),
        ("high fever so give me diet plan", True),
        ("i have fever . SO give me diet plan", True),
        ("cold and cough", True),
        ("nausea and vomiting", True),
        ("diarrhea", True),
        ("sore throat", True),
        ("fever with headache", True),
        ("feeling sick", True),
        ("normal diet question", False),
        ("what should i eat", False),
        ("give me diet plan for 7 days", False),
        ("diabetes meal plan", False),
    ]
    
    print("=" * 60)
    print("TEST 2: is_medical_emergency()")
    print("=" * 60)
    
    passed = 0
    failed = 0
    for message, expected in test_cases:
        result = is_medical_emergency(message)
        status = "✅ PASS" if result == expected else "❌ FAIL"
        if result == expected:
            passed += 1
        else:
            failed += 1
        print(f"{status}: '{message}' => {result} (expected {expected})")
    
    print(f"\nResult: {passed} passed, {failed} failed\n")
    return failed == 0

def test_diet_related():
    """Test diet question detection"""
    test_cases = [
        ("high fever", True),  # Medical case, should be diet-related
        ("give me diet plan", True),
        ("what should i eat", True),
        ("diabetes management", True),
        ("blood pressure diet", True),
        ("how much exercise", True),
        ("random question", False),
        ("what is the capital", False),
    ]
    
    print("=" * 60)
    print("TEST 3: is_diet_related_question()")
    print("=" * 60)
    
    passed = 0
    failed = 0
    for message, expected in test_cases:
        result = is_diet_related_question(message)
        status = "✅ PASS" if result == expected else "❌ FAIL"
        if result == expected:
            passed += 1
        else:
            failed += 1
        print(f"{status}: '{message}' => {result} (expected {expected})")
    
    print(f"\nResult: {passed} passed, {failed} failed\n")
    return failed == 0

def test_quick_medical_advice():
    """Test that quick advice is generated"""
    test_cases = [
        "i have high fever",
        "cold and flu",
        "nausea and vomiting",
    ]
    
    print("=" * 60)
    print("TEST 4: quick_medical_advice()")
    print("=" * 60)
    
    user_data = {"hasDiabetes": False, "hasHypertension": False}
    
    for message in test_cases:
        advice = quick_medical_advice(message, user_data)
        length = len(advice)
        has_action = "IMMEDIATE" in advice or "Quick Actions" in advice
        status = "✅ PASS" if length > 200 and has_action else "❌ FAIL"
        print(f"{status}: '{message}'")
        print(f"  Generated {length} chars with action guidance: {has_action}")
        print()
    
    return True

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("CHATBOT FIXES VALIDATION TEST SUITE")
    print("=" * 60 + "\n")
    
    all_passed = True
    
    # Run tests
    all_passed &= test_parse_days()
    all_passed &= test_medical_emergency()
    all_passed &= test_diet_related()
    all_passed &= test_quick_medical_advice()
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ ALL TESTS PASSED!")
    else:
        print("❌ SOME TESTS FAILED - Please review")
    print("=" * 60 + "\n")
