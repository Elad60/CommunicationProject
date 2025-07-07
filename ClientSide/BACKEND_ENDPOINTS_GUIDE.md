# מדריך הוספת API Endpoints לשיחות פרטיות

## רשימת Endpoints שצריך להוסיף לשרת:

### 1. שליחת הזמנה לשיחה
```
POST /private-call/invite
```
**Body:**
```json
{
  "callerId": 123,
  "receiverId": 456, 
  "timestamp": "2024-01-01T12:00:00Z",
  "status": "pending"
}
```
**Response:**
```json
{
  "success": true,
  "invitationId": "call_123_456_1234567890",
  "message": "Invitation sent successfully"
}
```

### 2. בדיקת שיחות נכנסות
```
GET /private-call/incoming/{userId}
```
**Response:**
```json
[
  {
    "id": "call_123_456_1234567890",
    "callerId": 123,
    "callerName": "John Doe",
    "callerEmail": "john@example.com", 
    "callerRole": "User",
    "timestamp": "2024-01-01T12:00:00Z",
    "status": "pending"
  }
]
```

### 3. קבלת שיחה
```
POST /private-call/accept/{invitationId}
```
**Body:**
```json
{
  "timestamp": "2024-01-01T12:00:30Z"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Call accepted",
  "channelName": "private_123_456"
}
```

### 4. דחיית שיחה
```
POST /private-call/reject/{invitationId}
```
**Body:**
```json
{
  "timestamp": "2024-01-01T12:00:30Z"
}
```

### 5. ביטול שיחה
```
POST /private-call/cancel/{invitationId}
```

### 6. בדיקת סטטוס שיחה
```
GET /private-call/status/{invitationId}
```
**Response:**
```json
{
  "invitationId": "call_123_456_1234567890",
  "status": "pending|accepted|rejected|timeout|cancelled",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## מבנה טבלת מסד נתונים:

### טבלה: private_call_invitations
```sql
CREATE TABLE private_call_invitations (
    id VARCHAR(50) PRIMARY KEY,
    caller_id INT NOT NULL,
    receiver_id INT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected', 'timeout', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (caller_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);
```

## לוגיקה עסקית:

### Auto-timeout:
- **כל הזמנה** צריכה timeout אחרי 30 שניות
- **רץ job** כל 10 שניות שמחליף status ל-"timeout"

### מניעת duplicate invitations:
- **בדוק** אם יש הזמנה pending בין שני המשתמשים
- **דחה** בקשה חדשה אם כבר יש אחת פעילה

### ניקוי הזמנות ישנות:
- **מחק הזמנות** שיותר ישנות מ-24 שעות
- **רץ job יומי** לניקוי

## דוגמאות קוד (לפי השפה):

### Node.js/Express:
```javascript
// POST /private-call/invite
app.post('/private-call/invite', async (req, res) => {
  const { callerId, receiverId } = req.body;
  
  // Check if users exist
  const caller = await getUserById(callerId);
  const receiver = await getUserById(receiverId);
  
  if (!caller || !receiver) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Check for existing pending invitation
  const existing = await getActivenInvitation(callerId, receiverId);
  if (existing) {
    return res.status(409).json({ error: 'Invitation already exists' });
  }
  
  // Create invitation
  const invitationId = `call_${Math.min(callerId, receiverId)}_${Math.max(callerId, receiverId)}_${Date.now()}`;
  
  await createInvitation({
    id: invitationId,
    callerId,
    receiverId,
    status: 'pending'
  });
  
  res.json({
    success: true,
    invitationId,
    message: 'Invitation sent successfully'
  });
});
```

### C#/.NET:
```csharp
[HttpPost("private-call/invite")]
public async Task<IActionResult> SendInvitation([FromBody] InvitationRequest request)
{
    var caller = await _userService.GetUserByIdAsync(request.CallerId);
    var receiver = await _userService.GetUserByIdAsync(request.ReceiverId);
    
    if (caller == null || receiver == null)
        return NotFound("User not found");
    
    var invitationId = $"call_{Math.Min(request.CallerId, request.ReceiverId)}_{Math.Max(request.CallerId, request.ReceiverId)}_{DateTimeOffset.Now.ToUnixTimeMilliseconds()}";
    
    var invitation = new PrivateCallInvitation
    {
        Id = invitationId,
        CallerId = request.CallerId,
        ReceiverId = request.ReceiverId,
        Status = "pending",
        CreatedAt = DateTime.UtcNow
    };
    
    await _callService.CreateInvitationAsync(invitation);
    
    return Ok(new { success = true, invitationId, message = "Invitation sent successfully" });
}
```

## בדיקת Endpoints:

### איך לבדוק שזה עובד:
1. **הוסף את endpoints לשרת**
2. **רץ את הפרונט-אנד**
3. **לחץ "Private Call"** במקום "Direct Call (Test)"
4. **צפוי לראות בלוגים**:
   ```
   ✅ API: Success response: { invitationId: "call_123_456..." }
   🔄 Starting real API polling...
   ```

זה הכל! אחרי שתוסיף את זה לשרת, הפיצ'ר יעבוד בצורה מלאה. 