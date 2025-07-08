#include "pch.h"
#include "AgoraModule.h"
#include <windows.h>
#include <string>
#include <memory>
#include <mutex>

namespace winrt::FinalProject::implementation
{
    // Use Agora namespace for convenience
    using namespace agora::rtc;


    
    // Initialize singleton
    AgoraManager* AgoraManager::instance = nullptr;
    std::mutex AgoraManager::mutex_;
    

    
    // AgoraEventHandler implementation
    void AgoraEventHandler::onJoinChannelSuccess(const char* channel, uid_t uid, int elapsed)
    {
        std::string msg = "✅ Successfully joined channel: " + std::string(channel) + 
                         " with UID: " + std::to_string(uid) + 
                         " in " + std::to_string(elapsed) + "ms";
        OutputDebugStringA(("AgoraEventHandler::onJoinChannelSuccess - " + msg + "\n").c_str());
    }

    void AgoraEventHandler::onLeaveChannel(const RtcStats& stats)
    {
        std::string msg = "✅ Successfully left channel. Duration: " + std::to_string(stats.duration) + "s";
        OutputDebugStringA(("AgoraEventHandler::onLeaveChannel - " + msg + "\n").c_str());
    }

    void AgoraEventHandler::onUserJoined(uid_t uid, int elapsed)
    {
        std::string msg = "👤 User joined: " + std::to_string(uid) + " (elapsed: " + std::to_string(elapsed) + "ms)";
        OutputDebugStringA(("AgoraEventHandler::onUserJoined - " + msg + "\n").c_str());
    }

    void AgoraEventHandler::onUserOffline(uid_t uid, USER_OFFLINE_REASON_TYPE reason)
    {
        std::string reasonStr = (reason == USER_OFFLINE_QUIT) ? "QUIT" : 
                               (reason == USER_OFFLINE_DROPPED) ? "DROPPED" : "BECOME_AUDIENCE";
        std::string msg = "👤 User offline: " + std::to_string(uid) + " (reason: " + reasonStr + ")";
        OutputDebugStringA(("AgoraEventHandler::onUserOffline - " + msg + "\n").c_str());
    }

    void AgoraEventHandler::onError(int err, const char* msg)
    {
        std::string errorMsg = "❌ Agora Error " + std::to_string(err) + ": " + std::string(msg ? msg : "Unknown error");
        OutputDebugStringA(("AgoraEventHandler::onError - " + errorMsg + "\n").c_str());
    }

    // AgoraManager implementation
    void AgoraManager::InitializeEngine(const std::string& appId)
    {
        try {
            OutputDebugStringA("🚀 AgoraManager::InitializeEngine - Starting\n");
            OutputDebugStringA(("📱 App ID: " + appId + "\n").c_str());

            // Clean up existing engine
            if (m_rtcEngine) {
                OutputDebugStringA("🧹 Cleaning up existing engine\n");
                m_rtcEngine->leaveChannel();
                m_rtcEngine->release();
                m_rtcEngine = nullptr;
                OutputDebugStringA("✅ Existing engine cleaned\n");
            }

            m_appId = appId;
            OutputDebugStringA("✅ App ID stored\n");

            // Create event handler
            OutputDebugStringA("🔧 Creating event handler...\n");
            m_eventHandler = std::make_unique<AgoraEventHandler>();
            if (!m_eventHandler) {
                OutputDebugStringA("❌ Failed to create event handler\n");
                return;
            }
            OutputDebugStringA("✅ Event handler created\n");

            // Create engine
            OutputDebugStringA("🔧 Creating RTC engine...\n");
            m_rtcEngine = createAgoraRtcEngine();
            if (!m_rtcEngine) {
                OutputDebugStringA("❌ Failed to create RTC engine\n");
                return;
            }
            OutputDebugStringA("✅ RTC engine created successfully\n");

            // Initialize
            OutputDebugStringA("🔧 Initializing engine with context...\n");
            RtcEngineContext context;
            context.appId = m_appId.c_str();
            context.eventHandler = m_eventHandler.get();
            context.channelProfile = agora::CHANNEL_PROFILE_COMMUNICATION;
            context.audioScenario = AUDIO_SCENARIO_DEFAULT;

            int result = m_rtcEngine->initialize(context);
            OutputDebugStringA(("🔍 Initialize result: " + std::to_string(result) + "\n").c_str());
            
            if (result != 0) {
                OutputDebugStringA(("❌ Failed to initialize, error: " + std::to_string(result) + "\n").c_str());
                m_rtcEngine->release();
                m_rtcEngine = nullptr;
                m_isInitialized = false;
                return;
            }
            OutputDebugStringA("✅ Engine initialized successfully\n");

            // Enable audio
            OutputDebugStringA("🔧 Enabling audio...\n");
            result = m_rtcEngine->enableAudio();
            OutputDebugStringA(("🔍 EnableAudio result: " + std::to_string(result) + "\n").c_str());

            // Set client role
            OutputDebugStringA("🔧 Setting client role...\n");
            result = m_rtcEngine->setClientRole(CLIENT_ROLE_BROADCASTER);
            OutputDebugStringA(("🔍 SetClientRole result: " + std::to_string(result) + "\n").c_str());

            // Mark as initialized
            m_isInitialized = true;
            OutputDebugStringA("✅ AgoraManager::InitializeEngine - COMPLETED SUCCESSFULLY!\n");
            OutputDebugStringA(("✅ m_isInitialized = " + std::string(m_isInitialized ? "true" : "false") + "\n").c_str());

        } catch (const std::exception& e) {
            OutputDebugStringA(("❌ Exception in InitializeEngine: " + std::string(e.what()) + "\n").c_str());
            m_isInitialized = false;
        } catch (...) {
            OutputDebugStringA("❌ Unknown exception in InitializeEngine\n");
            m_isInitialized = false;
        }
    }

    void AgoraManager::StartEchoTest()
    {
        try {
            OutputDebugStringA("🎤 AgoraManager::StartEchoTest - Starting Audio Device Loopback Test\n");
            OutputDebugStringA(("🔍 m_isInitialized = " + std::string(m_isInitialized ? "true" : "false") + "\n").c_str());
            OutputDebugStringA(("🔍 m_rtcEngine = " + std::string(m_rtcEngine ? "NOT NULL" : "NULL") + "\n").c_str());
            
            if (!m_isInitialized || !m_rtcEngine) {
                OutputDebugStringA("❌ Engine not initialized - CANNOT START ECHO TEST\n");
                return;
            }

            if (m_isEchoTestRunning) {
                OutputDebugStringA("⚠️ Echo test already running\n");
                return;
            }

            // Use AAudioDeviceManager class for Windows SDK
            OutputDebugStringA("🔧 Creating AAudioDeviceManager...\n");
            agora::rtc::AAudioDeviceManager audioDeviceManager(m_rtcEngine);
            if (!audioDeviceManager) {
                OutputDebugStringA("❌ Failed to create audio device manager\n");
                return;
            }

            // Start audio device loopback test (perfect for Windows!)
            OutputDebugStringA("🔧 Starting audio device loopback test...\n");
            int result = audioDeviceManager->startAudioDeviceLoopbackTest(1000); // 1 second interval
            
            if (result == 0) {
                m_isEchoTestRunning = true;
                OutputDebugStringA("✅ Audio device loopback test started successfully!\n");
                OutputDebugStringA("🔊 You should hear yourself through the loopback test!\n");
                OutputDebugStringA("🎧 This is a direct device-level audio loopback!\n");
            } else {
                OutputDebugStringA(("❌ Failed to start audio device loopback test, error: " + std::to_string(result) + "\n").c_str());
            }

        } catch (const std::exception& e) {
            OutputDebugStringA(("❌ Exception in StartEchoTest: " + std::string(e.what()) + "\n").c_str());
        } catch (...) {
            OutputDebugStringA("❌ Unknown exception in StartEchoTest\n");
        }
    }

    void AgoraManager::StopEchoTest()
    {
        try {
            if (!m_rtcEngine || !m_isEchoTestRunning) return;
            
            OutputDebugStringA("🔧 Stopping audio device loopback test...\n");
            
            // Use AAudioDeviceManager class for Windows SDK
            agora::rtc::AAudioDeviceManager audioDeviceManager(m_rtcEngine);
            if (!audioDeviceManager) {
                OutputDebugStringA("❌ Failed to create audio device manager\n");
                return;
            }
            
            // Stop the audio device loopback test
            int result = audioDeviceManager->stopAudioDeviceLoopbackTest();
            if (result == 0) {
                OutputDebugStringA("✅ Audio device loopback test stopped successfully\n");
            } else {
                OutputDebugStringA(("❌ Failed to stop audio device loopback test, error: " + std::to_string(result) + "\n").c_str());
            }
            
            m_isEchoTestRunning = false;
            OutputDebugStringA("✅ Echo test stopped\n");
        } catch (...) {
            OutputDebugStringA("❌ Exception in StopEchoTest\n");
        }
    }

    void AgoraManager::JoinChannel(const std::string& channelName)
    {
        try {
            if (!m_isInitialized || !m_rtcEngine) return;

            ChannelMediaOptions options;
            options.publishMicrophoneTrack = true;
            options.autoSubscribeAudio = true;
            options.autoSubscribeVideo = false;
            options.enableAudioRecordingOrPlayout = true;
            options.clientRoleType = CLIENT_ROLE_BROADCASTER;

            int result = m_rtcEngine->joinChannel(nullptr, channelName.c_str(), 0, options);
            if (result == 0) {
                m_currentChannel = channelName;
                OutputDebugStringA(("✅ Joined channel: " + channelName + "\n").c_str());
            }
        } catch (...) {
            OutputDebugStringA("❌ Exception in JoinChannel\n");
        }
    }

    void AgoraManager::LeaveChannel()
    {
        try {
            if (!m_rtcEngine || m_currentChannel.empty()) return;
            
            m_rtcEngine->leaveChannel();
            m_currentChannel.clear();
            OutputDebugStringA("✅ Left channel\n");
        } catch (...) {
            OutputDebugStringA("❌ Exception in LeaveChannel\n");
        }
    }

    void AgoraManager::ReleaseEngine()
    {
        try {
            if (m_rtcEngine) {
                if (!m_currentChannel.empty()) {
                    m_rtcEngine->leaveChannel();
                    m_currentChannel.clear();
                }
                m_rtcEngine->release();
                m_rtcEngine = nullptr;
            }
            m_eventHandler.reset();
            m_isInitialized = false;
            m_isEchoTestRunning = false;
            OutputDebugStringA("✅ Engine released\n");
        } catch (...) {
            OutputDebugStringA("❌ Exception in ReleaseEngine\n");
        }
    }

    std::string AgoraManager::GetStatus()
    {
        std::string status = "🔧 AGORA MANAGER STATUS:\n\n";
        
        if (m_rtcEngine) {
            status += "✅ RTC Engine: CREATED\n";
        } else {
            status += "❌ RTC Engine: NOT CREATED\n";
        }

        if (m_isInitialized) {
            status += "✅ Engine Status: INITIALIZED\n";
            status += "📱 App ID: " + m_appId + "\n";
        } else {
            status += "❌ Engine Status: NOT INITIALIZED\n";
        }

        if (!m_currentChannel.empty()) {
            status += "🔗 Current Channel: " + m_currentChannel + "\n";
        } else {
            status += "⭕ Current Channel: NONE\n";
        }

        if (m_isEchoTestRunning) {
            status += "🎤 Echo Test: RUNNING\n";
        } else {
            status += "⭕ Echo Test: STOPPED\n";
        }

        if (m_isInitialized && m_rtcEngine) {
            status += "\n🎉 STATUS: READY FOR VOICE COMMUNICATION!";
        } else {
            status += "\n⚠️ STATUS: NEEDS INITIALIZATION";
        }

        return status;
    }
}