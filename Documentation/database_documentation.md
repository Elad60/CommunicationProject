# 🗄️ IronWave System - Database Documentation

## 📋 Table of Contents
1. [Database Overview](#database-overview)
2. [Tables Structure](#tables-structure)
3. [Stored Procedures](#stored-procedures)
4. [API Endpoints](#api-endpoints)
5. [Security Features](#security-features)

---

## 🏗️ Database Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           IronWave Communication System                     │
│                              Database: myProjDB                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🔐 Authentication & Users  │  📻 Radio Channels  │  📢 Announcements     │
│  • User Management          │  • Channel Control   │  • Message System     │
│  • Role-based Access        │  • PIN Protection    │  • Read/Unread Status │
│  • Session Management       │  • State Management  │  • Real-time Updates  │
│                                                                             │
│  📞 Private Calls           │  🛡️ Security        │  📊 Analytics         │
│  • Call Invitations         │  • SHA256 Hashing    │  • Usage Statistics   │
│  • Accept/Reject Logic      │  • Input Validation  │  • Performance Metrics│
│  • Call Tracking            │  • SQL Injection     │  • User Activity      │
│                             │    Prevention        │                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Tables Structure

### 🔐 **1. Users Table**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                USERS TABLE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────────────────┐ │
│  │   Column    │    Type     │   Default   │        Description         │ │
│  ├─────────────┼─────────────┼─────────────┼─────────────────────────────┤ │
│  │     Id      │    INT      │ IDENTITY(1,1)│ Primary Key, Auto Increment│ │
│  │  Username   │ NVARCHAR(50)│     -       │ Unique, NOT NULL           │ │
│  │   Email     │NVARCHAR(100)│     -       │ Unique, NOT NULL           │ │
│  │  Password   │NVARCHAR(255)│     -       │ SHA256 Hashed              │ │
│  │    Role     │ NVARCHAR(20)│   'User'    │ Admin/Technician/Operator  │ │
│  │   Group     │    CHAR(1)  │    'A'      │ A, B, C, etc.             │ │
│  │ CreatedAt   │  DATETIME   │ GETDATE()   │ Account creation date      │ │
│  │ IsBlocked   │    BIT      │     0       │ User blocked status        │ │
│  │ IsActive    │    BIT      │     1       │ Account active status      │ │
│  │ LastLogin   │  DATETIME   │    NULL     │ Last login timestamp       │ │
│  └─────────────┴─────────────┴─────────────┴─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 📻 **2. RadioChannels Table**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            RADIO_CHANNELS TABLE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────────────────┐ │
│  │   Column    │    Type     │   Default   │        Description         │ │
│  ├─────────────┼─────────────┼─────────────┼─────────────────────────────┤ │
│  │     Id      │    INT      │ IDENTITY(1,1)│ Primary Key, Auto Increment│ │
│  │    Name     │ NVARCHAR(50)│     -       │ Channel display name       │ │
│  │ Frequency   │ NVARCHAR(20)│     -       │ Radio frequency            │ │
│  │   Status    │ NVARCHAR(20)│  'Active'   │ Active/Inactive            │ │
│  │    Mode     │ NVARCHAR(20)│  'Public'   │ Public/Private             │ │
│  │ChannelState │ NVARCHAR(20)│   'Idle'    │ Idle/ListenOnly/ListenAndTalk│ │
│  │PinCodeHash  │NVARCHAR(255)│    NULL     │ SHA256 hash for private    │ │
│  └─────────────┴─────────────┴─────────────┴─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 🔗 **3. UserChannels Table**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             USER_CHANNELS TABLE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────────────────┐ │
│  │   Column    │    Type     │   Default   │        Description         │ │
│  ├─────────────┼─────────────┼─────────────┼─────────────────────────────┤ │
│  │   UserId    │    INT      │     -       │ Foreign Key to Users.Id    │ │
│  │ ChannelId   │    INT      │     -       │ Foreign Key to RadioChannels.Id│ │
│  │ChannelState │ NVARCHAR(20)│   'Idle'    │ User's state in channel    │ │
│  │ JoinedAt    │  DATETIME   │ GETDATE()   │ When user joined channel   │ │
│  └─────────────┴─────────────┴─────────────┴─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 📢 **4. Announcements Table**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ANNOUNCEMENTS TABLE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────────────────┐ │
│  │   Column    │    Type     │   Default   │        Description         │ │
│  ├─────────────┼─────────────┼─────────────┼─────────────────────────────┤ │
│  │     Id      │    INT      │ IDENTITY(1,1)│ Primary Key, Auto Increment│ │
│  │   Title     │NVARCHAR(100)│     -       │ Announcement title         │ │
│  │  Content    │   TEXT      │     -       │ Announcement content       │ │
│  │  UserName   │ NVARCHAR(50)│     -       │ Creator's username         │ │
│  │ CreatedAt   │  DATETIME   │ GETDATE()   │ Creation timestamp         │ │
│  └─────────────┴─────────────┴─────────────┴─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 📞 **5. CallInvitations Table**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CALL_INVITATIONS TABLE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────────────────┐ │
│  │   Column    │    Type     │   Default   │        Description         │ │
│  ├─────────────┼─────────────┼─────────────┼─────────────────────────────┤ │
│  │     Id      │   UNIQUEID  │ NEWID()     │ Primary Key, Unique ID     │ │
│  │  CallerId   │    INT      │     -       │ Foreign Key to Users.Id    │ │
│  │ ReceiverId  │    INT      │     -       │ Foreign Key to Users.Id    │ │
│  │   Status    │ NVARCHAR(20)│ 'Pending'   │ Pending/Accepted/Rejected  │ │
│  │  Timestamp  │  DATETIME   │ GETDATE()   │ Invitation creation time   │ │
│  │  ExpiresAt  │  DATETIME   │     -       │ Expiration timestamp       │ │
│  │ UpdatedAt   │  DATETIME   │ GETDATE()   │ Last update timestamp      │ │
│  └─────────────┴─────────────┴─────────────┴─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Stored Procedures

### 🔐 **AUTHENTICATION & USER MANAGEMENT**

| **Procedure** | **Purpose** | **Parameters** | **Returns** |
|---------------|-------------|----------------|-------------|
| `sp_LoginUser` | User authentication and login | `@Username`, `@Password` | `Success`, `ErrorCode`, `Message`, `User data` |
| `sp_RegisterUser` | New user registration | `@Username`, `@Email`, `@Password`, `@Group` | `Success` |
| `sp_LogoutUser` | User logout and session cleanup | `@UserId` | `Success` |
| `sp_GetAllUsers` | Retrieve all system users | None | `List<User>` |
| `sp_DeleteUser` | Permanently delete user | `@UserId` | `Success` |
| `sp_SetUserBlockedStatus` | Block/unblock user | `@UserId`, `@IsBlocked` | `Success` |
| `sp_UpdateUserRole` | Change user role | `@UserId`, `@NewRole` | `Success` |
| `GetUsersByGroup` | Get users by group | `@GroupName` | `List<User>` |
| `ChangeUserGroup` | Change user's group | `@UserId`, `@NewGroup` | `Success` |

### 📻 **RADIO CHANNEL MANAGEMENT**

| **Procedure** | **Purpose** | **Parameters** | **Returns** |
|---------------|-------------|----------------|-------------|
| `sp_GetAllRadioChannels` | Get all available channels | None | `List<RadioChannel>` |
| `sp_GetUserRadioChannels` | Get user's assigned channels | `@UserId` | `List<RadioChannel>` |
| `sp_UpdateUserChannelState` | Update user's channel state | `@UserId`, `@ChannelId`, `@ChannelState` | `void` |
| `sp_AddRadioChannel` | Create new radio channel | `@Name`, `@Frequency`, `@Status`, `@Mode`, `@ChannelState`, `@PinCodeHash` | `void` |
| `sp_DeleteRadioChannel` | Delete radio channel | `@ChannelId` | `void` |
| `sp_AddUserChannel` | Grant channel access to user | `@UserId`, `@ChannelId` | `void` |
| `sp_RemoveUserChannel` | Revoke channel access from user | `@UserId`, `@ChannelId` | `void` |
| `sp_GetRadioChannelById` | Get channel by ID | `@ChannelId` | `RadioChannel` |
| `sp_GetChannelParticipants` | Get channel participants | `@ChannelId` | `List<User>` |

### 📢 **ANNOUNCEMENT SYSTEM**

| **Procedure** | **Purpose** | **Parameters** | **Returns** |
|---------------|-------------|----------------|-------------|
| `sp_AddAnnouncement` | Create new announcement | `@Title`, `@Content`, `@UserName` | `Success` |
| `sp_GetAllAnnouncements` | Get all announcements | None | `List<Announcement>` |
| `sp_GetAllAnnouncementsWithReadStatus` | Get announcements with read status | `@UserId` | `List<Announcement>` |
| `sp_MarkAllAnnouncementsAsRead` | Mark all as read for user | `@UserId` | `Success` |
| `sp_GetUnreadAnnouncementsCount` | Get unread count for user | `@UserId` | `int` |

### 📞 **PRIVATE CALL SYSTEM**

| **Procedure** | **Purpose** | **Parameters** | **Returns** |
|---------------|-------------|----------------|-------------|
| `SP_SendCallInvitation` | Send call invitation | `@CallerId`, `@ReceiverId` | `InvitationId`, `ChannelName`, `Success` |
| `SP_GetIncomingCalls` | Get incoming calls for user | `@UserId` | `List<IncomingCallInvitation>` |
| `SP_AcceptCallInvitation` | Accept call invitation | `@InvitationId`, `@UserId` | `Status`, `ChannelName`, `Success` |
| `SP_RejectCallInvitation` | Reject call invitation | `@InvitationId`, `@UserId` | `Status`, `Success` |
| `SP_CancelCallInvitation` | Cancel call invitation | `@InvitationId`, `@UserId` | `Status`, `Success` |
| `SP_GetCallStatus` | Get call status | `@InvitationId`, `@UserId` | `Status`, `ChannelName`, `Timestamp`, `Direction` |
| `SP_EndPrivateCall` | End private call | `@InvitationId`, `@EndReason` | `Status`, `Success` |
| `SP_GetUserCallStats` | Get user call statistics | `@UserId`, `@DaysBack` | `UserCallStats` |
| `SP_CleanupOldInvitations` | Clean up old invitations | `@DaysToKeep` | `DeletedInvitations`, `CutoffDate` |

---

## 🌐 API Endpoints

### 🔐 **Authentication Endpoints**
```
POST   /api/user/login                    - User authentication
POST   /api/user/register                 - User registration
POST   /api/user/logout/{userId}          - User logout
```

### 📻 **Radio Channel Endpoints**
```
GET    /api/radiochannels                 - Get all channels
GET    /api/radiochannels/user/{userId}   - Get user's channels
POST   /api/radiochannels                 - Create new channel
DELETE /api/radiochannels/{channelId}     - Delete channel
POST   /api/radiochannels/user/{userId}/add-channel/{channelId}      - Add channel to user
DELETE /api/radiochannels/user/{userId}/remove-channel/{channelId}   - Remove channel from user
POST   /api/radiochannels/user/{userId}/channel/{channelId}/state    - Update channel state
GET    /api/radiochannels/{channelId}/participants                   - Get channel participants
```

### 📢 **Announcement Endpoints**
```
GET    /api/announcements                 - Get all announcements
POST   /api/announcements                 - Create announcement
GET    /api/announcements/unread-count/{userId}                      - Get unread count
POST   /api/announcements/mark-read/{userId}                         - Mark all as read
```

### 👥 **User Management Endpoints**
```
GET    /api/user/all                      - Get all users
POST   /api/user/block/{userId}           - Block/unblock user
POST   /api/user/update-role              - Update user role
DELETE /api/user/{userId}                 - Delete user
GET    /api/user/group/{groupName}        - Get users by group
```

### 📞 **Private Call Endpoints**
```
POST   /api/privatecalls/send-invitation  - Send call invitation
GET    /api/privatecalls/incoming/{userId} - Get incoming calls
POST   /api/privatecalls/accept           - Accept call
POST   /api/privatecalls/reject           - Reject call
POST   /api/privatecalls/cancel           - Cancel call
GET    /api/privatecalls/status           - Get call status
POST   /api/privatecalls/end              - End call
GET    /api/privatecalls/stats/{userId}   - Get call statistics
```

---

## 🛡️ Security Features

### 🔒 **Authentication Security**
- **SHA256 Password Hashing** - Secure password storage
- **Session Management** - Prevent multiple logins
- **Input Validation** - Client and server-side validation
- **SQL Injection Prevention** - Parameterized queries

### 🔐 **Access Control**
- **Role-based Permissions** - Admin, Technician, Operator
- **Group-based Access** - Organizational structure
- **User Blocking** - Administrative control
- **PIN Protection** - SHA256 hashed channel access

### 📊 **Data Protection**
- **Connection Encryption** - HTTPS/TLS
- **Parameter Sanitization** - XSS prevention
- **Error Handling** - Secure error messages
- **Audit Logging** - Activity tracking

---

## 📈 **System Statistics**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SYSTEM OVERVIEW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📊 Database Tables:    5 tables                                            │
│  🔄 Stored Procedures:  25+ procedures                                      │
│  🌐 API Endpoints:      20+ endpoints                                       │
│  🔐 Security Features:  8+ security measures                                │
│  📱 Supported Platforms: React Native (Windows)                            │
│  🖥️ Backend:           .NET Core Web API                                   │
│  🗄️ Database:          SQL Server                                          │
│                                                                             │
│  🎯 Primary Features:                                                       │
│  • Real-time Communication                                                  │
│  • Multi-channel Radio System                                               │
│  • Private Calling System                                                   │
│  • Announcement Management                                                  │
│  • User Management & Authentication                                         │
│  • Role-based Access Control                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 **Technical Architecture**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TECHNICAL STACK                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🎨 Frontend (React Native Windows)                                        │
│  ├── UI Components                                                          │
│  ├── State Management (Context API)                                        │
│  ├── HTTP Client (Axios)                                                   │
│  └── Local Storage (AsyncStorage)                                          │
│                                                                             │
│  🖥️ Backend (.NET Core Web API)                                           │
│  ├── Controllers (REST API)                                                │
│  ├── Business Logic (Models)                                               │
│  ├── Data Access (DBServices)                                              │
│  └── Configuration (appsettings.json)                                      │
│                                                                             │
│  🗄️ Database (SQL Server)                                                 │
│  ├── Tables (5 main tables)                                                │
│  ├── Stored Procedures (25+ procedures)                                    │
│  ├── Indexes (Performance optimization)                                    │
│  └── Constraints (Data integrity)                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*Documentation generated for IronWave Communication System*
*Version: 1.0 | Last Updated: 2025* 