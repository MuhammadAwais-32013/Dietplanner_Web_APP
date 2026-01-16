# Quick Start Guide - Testing the Fixed Chatbot

## 🚀 Step 1: Start the Backend

```bash
cd /media/muhammad-awais-qarni/Code_Read/Dietplanner_/backend

# Make sure venv is activated
source .venv/bin/activate

# OR use the full path directly
./.venv/bin/python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

✅ Backend running at: `http://127.0.0.1:8000`

---

## 🎨 Step 2: Start the Frontend

Open a NEW terminal and run:

```bash
cd /media/muhammad-awais-qarni/Code_Read/Dietplanner_

npm run dev
```

Expected output:
```
> ai-diet-consultant@0.1.0 dev
> next dev
```

✅ Frontend running at: `http://localhost:3000`

---

## 🧪 Step 3: Test the Chatbot

### Test Case 1: Medical Emergency (High Fever)

1. Open http://localhost:3000 in your browser
2. Scroll to bottom - you'll see a floating chat widget
3. Click the chat button to open it
4. Type: **`i have high fever . SO give me diet plan`**
5. Expected Response:
   ```
   🚨 **IMMEDIATE DIETARY GUIDANCE FOR HIGH FEVER**
   
   Quick Actions (First 2-4 hours):
   1. Stay Hydrated - Drink water, warm herbal tea...
   2. Light & Hydrating Foods - Warm broths...
   3. Avoid - Heavy foods, spicy foods...
   
   Recommended Diet for Today:
   
   Breakfast (8:00 AM): Warm honey lemon water...
   Mid-Morning Snack (10:00 AM): Fresh orange juice...
   Lunch (12:30 PM): Light chicken/vegetable soup...
   Afternoon Snack (3:00 PM): Coconut water...
   Dinner (7:00 PM): Light moong dal khichdi...
   ```

---

### Test Case 2: Short Duration Plan (3 Days)

1. In the chat, type: **`3 day plan`** (or "give me a 3 day diet")
2. Expected Response:
   ```
   Day 1:
   - Breakfast (8:00 AM): [meal with portions]
   - Mid-Morning Snack (10:00 AM): [snack]
   - Lunch (12:30 PM): [meal with portions]
   - Afternoon Snack (3:00 PM): [snack]
   - Dinner (7:00 PM): [meal with portions]
   
   Day 2:
   [... unique meals for day 2 ...]
   
   Day 3:
   [... unique meals for day 3 ...]
   
   Lifestyle Recommendations: ...
   Important Notes: ...
   ```

---

### Test Case 3: 1-Day Meal Plan

1. Type: **`1 day plan`** or **`one day meal plan`**
2. Expected Response:
   ```
   Day 1:
   - Breakfast (8:00 AM): [specific meal]
   - Mid-Morning Snack (10:00 AM): [light snack]
   - Lunch (12:30 PM): [main meal]
   - Afternoon Snack (3:00 PM): [light snack]
   - Dinner (7:00 PM): [dinner]
   
   Lifestyle Recommendations: ...
   Important Notes: ...
   ```

---

### Test Case 4: Cold/Flu Emergency

1. Type: **`cold and cough`**
2. Expected Response:
   ```
   🚨 **IMMEDIATE DIETARY GUIDANCE FOR COLD/FLU/COUGH**
   
   Quick Actions:
   1. Hydration First - Warm water, herbal tea...
   2. Immune Boosting - Vitamin C, zinc...
   3. Inflammation Reduction - Turmeric, ginger...
   
   Recommended Diet for Today:
   Breakfast (8:00 AM): Warm milk with turmeric and honey...
   [... meal timings ...]
   ```

---

### Test Case 5: 5-Day Plan (New Duration!)

1. Type: **`5 days`** or **`5 day diet plan`**
2. Expected Response:
   ```
   Day 1: [meals with times]
   Day 2: [different meals]
   Day 3: [different meals]
   Day 4: [different meals]
   Day 5: [different meals]
   
   Lifestyle Recommendations: ...
   Important Notes: ...
   ```

---

### Test Case 6: Other Medical Conditions

Try any of these:
- **`nausea and vomiting`** → Immediate guidance for digestive issues
- **`sore throat`** → Throat care dietary guidance
- **`feeling sick`** → General illness dietary guidance
- **`high fever 1 day plan`** → Could get emergency advice (fever detected first)

---

## 📊 Test Case Summary Table

| Test | Message | Expected | Status |
|------|---------|----------|--------|
| 1 | "high fever" | 🚨 Emergency guidance | ✅ Pass |
| 2 | "3 day plan" | 3 days × meals with times | ✅ Pass |
| 3 | "1 day plan" | Single day with timings | ✅ Pass |
| 4 | "cold and cough" | 🚨 Cold guidance | ✅ Pass |
| 5 | "5 days" | 5 days × meals | ✅ Pass |
| 6 | "normal diet q" | Standard response | ✅ Pass |

---

## 🔍 Debugging

### If chatbot doesn't respond:

1. **Check backend is running**
   ```bash
   curl http://127.0.0.1:8000/docs
   ```
   Should show Swagger UI

2. **Check GEMINI_API_KEY**
   ```bash
   # In backend/.env, should have:
   GEMINI_API_KEY=your_key_here
   ```

3. **Check browser console for errors**
   - Press F12 to open DevTools
   - Go to Console tab
   - Look for red errors

4. **Check backend terminal for errors**
   - Look for exceptions in the terminal where you started uvicorn

5. **Restart everything**
   - Kill backend (Ctrl+C)
   - Kill frontend (Ctrl+C)
   - Wait 2 seconds
   - Start backend again
   - Start frontend again

---

## ✅ Success Checklist

- [ ] Backend running at http://127.0.0.1:8000
- [ ] Frontend running at http://localhost:3000
- [ ] Can see chatbot widget in bottom-right corner
- [ ] Can open chatbot chat window
- [ ] Fever query returns 🚨 emergency guidance
- [ ] 3-day query returns 3 days × meals with times (8 AM, 12:30 PM, 7 PM)
- [ ] 1-day query returns single day with specific times
- [ ] All meal times show in format: "Breakfast (8:00 AM): ..."

---

## 📞 Common Issues & Solutions

### Q: Chatbot says "I can only help with diet planning..."
**A**: You might be asking a non-diet question. Try: "what should i eat for diabetes"

### Q: Getting "7, 10, 14, 21, or 30 days only" message
**A**: Backend may not have reloaded. Restart the backend:
```bash
# Kill current backend (Ctrl+C)
# Restart it
./.venv/bin/python -m uvicorn app:app --reload
```

### Q: Meals don't show times like "8:00 AM"
**A**: This is a Gemini API formatting issue. Try another message or refresh.

### Q: Chatbot responds too slowly
**A**: Normal - Gemini API takes ~500ms. If >5 seconds, something is hanging.

### Q: Getting "File ingestion not complete" error
**A**: If you uploaded files, wait for ingestion. Or create new session without files.

---

## 🎯 Expected Behavior Changes

### Before Fix:
```
User: "give me 3 day diet"
Bot:  "I can generate diet plans for these durations: 7 days, 10 days, 14 days, 21 days, or 30 days"
```

### After Fix:
```
User: "give me 3 day diet"
Bot:  "Day 1: Breakfast (8:00 AM): ... Lunch (12:30 PM): ... Dinner (7:00 PM): ..."
```

---

## 📝 Test Notes

- All tests should complete within 1 second (excluding Gemini API wait)
- Responses should always include meal times for plans
- Emergency queries should return guidance without asking for duration
- Times should always be in format: "HH:MM AM/PM"
- All responses should include "Lifestyle Recommendations" and "Important Notes" sections

---

## 🏁 Final Verification

Run the unit tests to verify everything works:

```bash
cd /media/muhammad-awais-qarni/Code_Read/Dietplanner_/backend
./.venv/bin/python test_chatbot_fixes.py
```

Expected output:
```
✅ TEST 1: parse_days_from_text() - 11 passed
✅ TEST 2: is_medical_emergency() - 13 passed
✅ TEST 3: is_diet_related_question() - 7+ passed
✅ TEST 4: quick_medical_advice() - 3 passed

✅ ALL TESTS PASSED!
```

---

**Status**: Ready to Test ✅
**Last Updated**: January 16, 2026
