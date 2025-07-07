# בקשה למפתח ה-Backend: הוספת API Endpoints לשיחות פרטיות

## סיכום הבקשה:
אני הוספתי פיצ'ר של שיחות פרטיות ב-Frontend ואני צריך 6 endpoints חדשים בשרת.

## השרת הנוכחי:
```
https://proj.ruppin.ac.il/cgroup90/test2/tar1/api
```

## Endpoints שצריך להוסיף:

### 1. שליחת הזמנה לשיחה פרטית
```
POST /private-call/invite
```

### 2. בדיקת שיחות נכנסות למשתמש  
```
GET /private-call/incoming/{userId}
```

### 3. קבלת שיחה
```
POST /private-call/accept/{invitationId}
```

### 4. דחיית שיחה
```
POST /private-call/reject/{invitationId}
```

### 5. ביטול שיחה יוצאת
```
POST /private-call/cancel/{invitationId}
```

### 6. בדיקת סטטוס שיחה
```
GET /private-call/status/{invitationId}
```

## מה הפיצ'ר עושה:
1. משתמש A שולח הזמנה לשיחה פרטית למשתמש B
2. משתמש B מקבל התראה ויכול לקבל/לדחות
3. אם הוא מקבל - שניהם נכנסים לשיחה פרטית
4. יש טיימאאוט של 30 שניות

## קבצים מצורפים לפרטים טכניים:
- `BACKEND_ENDPOINTS_GUIDE.md` - מדריך מפורט עם דוגמאות קוד
- `PRIVATE_CALLS_GUIDE.md` - הסבר על הפיצ'ר המלא

## סטטוס נוכחי:
✅ Frontend מוכן לחלוטין  
⏳ צריך רק את ה-API endpoints  
🎯 ברגע שיוספו - הכל יעבוד מיד  

## מאיזה סטטוס לבדוק שזה עובד:
כשתוסיף את endpoints, ב-console של האפליקציה תראה:
```
✅ API: Success response: { invitationId: "call_123_456..." }
```
במקום:
```
❌ API: Error status: 404
```

תודה!
[השם שלך] 