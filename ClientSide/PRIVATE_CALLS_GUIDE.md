# מדריך שיחות פרטיות (Private Calls)

## מצב נוכחי 

השגיאה "Failed to send call invitation. Please try again." נובעת מכך שעדיין לא הוספנו את ה-API endpoints החדשים לשרת.

## כיצד לבדוק את הפיצ'ר עכשיו

### אפשרות 1: שיחה ישירה (מומלצ לבדיקה)
1. **עבור לעמוד Groups**
2. **לחץ לחיצה ארוכה** על משתמש
3. **בחר "Direct Call (Test)"**
4. **לחץ "Start Call"** - תעבור ישירות לשיחה פרטית

### אפשרות 2: מצב דמו (Demo Mode)
1. **עבור לעמוד Groups**  
2. **לחץ לחיצה ארוכה** על משתמש
3. **בחר "Private Call"**
4. **תראה הודעת "Demo Mode"** - זה מצפה למצב דמו
5. **המערכת תדמה המתנה** למשך 10 שניות

## מה עובד כרגע?

### ✅ עובד מצוין:
- **מסכי UI** - כל המסכים נראים טוב
- **ניווט** - מעבר בין מסכים עובד
- **אנימציות** - רטט, אנימציות וחוגים מתרחבים
- **בקרות שיחה** - מיוט, רמקול, סיום שיחה
- **Agora Integration** - החיבור לAgora SDK עובד

### ⚠️ צריך עבודה:
- **API Endpoints** - השרת צריך את הendpoints החדשים
- **התראות אמיתיות** - כרגע רק בודק כל 3 שניות

## API Endpoints שצריכים להיווצר בשרת:

```
POST /private-call/invite
GET  /private-call/incoming/{userId}
POST /private-call/accept/{invitationId}
POST /private-call/reject/{invitationId}
POST /private-call/cancel/{invitationId}
GET  /private-call/status/{invitationId}
```

## מבנה הזמנת שיחה:

```json
{
  "invitationId": "call_123_456_1234567890",
  "callerId": 123,
  "receiverId": 456,
  "callerName": "John Doe", 
  "callerEmail": "john@example.com",
  "callerRole": "User",
  "status": "pending|accepted|rejected|timeout",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## איך לבדוק שהשיחה הפרטית עובדת:

1. **שני מכשירים/דפדפנים** עם האפליקציה
2. **שני משתמשים** באותה קבוצה
3. **משתמש A**: לחיצה ארוכה → "Direct Call (Test)"
4. **משתמש B**: לחיצה ארוכה → "Direct Call (Test)" (על משתמש A)
5. **שניהם יכנסו לאותו ערוץ** ויוכלו לשמוע אחד את השני

## פתרון בעיות:

### אם אין קול:
1. בדוק שהמיקרופון עובד (TestAgora button)
2. בדוק שאותו App ID בשני המכשירים
3. בדוק שאותו שם ערוץ (private_123_456)

### אם השיחה לא מתחילה:
1. השתמש ב"Direct Call (Test)" במקום "Private Call"
2. בדוק שAgoraModule מותקן נכון
3. בדוק את הconsole logs לשגיאות

## זרימת עבודה עתידית (כשהשרת יהיה מוכן):

1. **משתמש A**: לחיצה ארוכה → "Private Call"
2. **משתמש A**: רואה מסך המתנה עם אנימציה
3. **משתמש B**: מקבל אוטומטית מסך שיחה נכנסת
4. **משתמש B**: לוחץ Accept/Reject
5. **אם Accept**: שניהם עוברים לשיחה פרטית
6. **אם Reject**: A מקבל הודעה "Call Rejected"

## קבצים חשובים:

- `src/screens/WaitingForCallScreen.js` - מסך המתנה
- `src/screens/IncomingCallScreen.js` - מסך שיחה נכנסת  
- `src/screens/PrivateCallScreen.js` - מסך השיחה הפרטית
- `src/screens/GroupsScreen.js` - מסך הקבוצות (נקודת התחלה)
- `src/utils/apiService.js` - ה-API calls
- `src/hooks/useIncomingCallListener.js` - האזנה לשיחות נכנסות

## סיכום:

הפיצ'ר מוכן מבחינת ה-Frontend! השתמש ב"Direct Call (Test)" כדי לבדוק שהשיחות הפרטיות עובדות. ברגע שהשרת יוכן עם ה-API endpoints החדשים, המערכת המלאה תעבוד בצורה מושלמת. 