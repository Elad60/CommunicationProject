# 📡 IronWave

A comprehensive, real-time communication platform built with React Native for Windows, featuring voice communication, radio channel management, private calling, and administrative controls. This project demonstrates full-stack development skills with native integration, real-time communication, and enterprise-grade features.

## 🎯 Project Overview

This is a sophisticated communication system designed for organizations requiring secure, real-time voice communication with role-based access control. The system combines radio channel management, private calling capabilities, and administrative tools in a modern, responsive interface.

**Key Highlights:**

- 🎤 **Real-time voice communication** powered by Agora SDK
- 📻 **Multi-channel radio system** with PIN protection
- 📞 **Private calling system** with invitation management
- 👥 **Role-based access control** (Admin, Technician, Operator)
- 📢 **Real-time announcements** with read/unread tracking
- 🛡️ **Secure authentication** with session management
- 🎨 **Modern UI/UX** with Fluent Design principles

## 🛠 Tech Stack

### Frontend (Client-Side)

- **React Native for Windows** 
- **Fluent UI** - Microsoft's design system
- **React Navigation** - Screen navigation and routing
- **Context API** - State management
- **Agora SDK** - Real-time voice communication
- **Axios** - HTTP client for API communication

### Backend (Server-Side)

- **ASP.NET Core 6.0** - Web API framework
- **SQL Server** - Database with stored procedures
- **Entity Framework** - Data access layer
- **Swagger/OpenAPI** - API documentation

### Native Integration

- **Custom Agora C++ module** for Windows
- **React Native bridge** for C++ to JavaScript communication
- **Real-time audio processing** with noise suppression
- **Native Windows audio integration**

### Security Features

- **PIN-based channel access** with cryptographic hashing
- **Session management** preventing multiple logins
- **Input validation** and sanitization
- **Role-based permissions** throughout the system

## 🚀 Features

### 📻 Radio Channel Management

- **Multi-channel support** with Public/Private modes
- **PIN-protected channels** with SHA256 encryption
- **Channel states**: Idle, ListenOnly, ListenAndTalk
- **Real-time participant tracking**
- **User-specific channel assignments**

### 🎤 Voice Communication

- **Agora-powered real-time voice** with native C++ integration
- **AI Noise Suppression** for crystal-clear audio
- **Microphone controls** (mute/unmute & voice adjustments)

### 📞 Private Calling System

- **One-to-one private calls** between users
- **Call invitation system** with acceptance/rejection
- **Real-time call status tracking**
- **Group-based user discovery**

### 👥 User Management & Authentication

- **Role-based access control** (Admin, Technician, Operator)
- **Group assignments**
- **User blocking capabilities**
- **Session management** with logout tracking
- **Secure password handling**

### 📢 Announcements System

- **Real-time announcements**
- **Role-based posting** (Technicians & Admins only)

### 🛠 Administrative Features

- **Comprehensive user management dashboard**
- **Role and permission management**
- **System-wide user blocking**
- **User deletion capabilities**
- **Group reassignment tools**

## 🎯 Use Cases

This communication system is ideal for:

- **Emergency services** and first responders
- **Security teams** and law enforcement
- **Industrial communication** systems
- **Corporate communication** platforms
- **Event management** and coordination
- **Any organization** requiring secure, real-time voice communication

## 📱 Screenshots

### Authentication & Main Interface

![Login Interface](Screenshots/a1.png)
![Registration](Screenshots/a2.png)
![Radios Main Panel](Screenshots/b1.jpg)

### Channel Management


![Create Channel Panel](Screenshots/b2.jpg)
![Add Room](Screenshots/b8.jpg)

### Direct Calling Management

![Team Page](Screenshots/b3.jpg)
![Incoming call](Screenshots/b4.jpg)
![Calling interface](Screenshots/b5.jpg)
![During Call interface](Screenshots/b6.jpg)


![Announcements](Screenshots/b7.jpg)
### Settings & Configuration

![Settings](Screenshots/a5.png)

---
