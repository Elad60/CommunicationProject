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
        std::string msg = std::string("🎉 SUCCESSFULLY JOINED CHANNEL!") + 
                         std::string("\n  📺 Channel: ") + std::string(channel) + 
                         std::string("\n  👤 My UID: ") + std::to_string(uid) + 
                         std::string("\n  ⏱️ Time: ") + std::to_string(elapsed) + std::string("ms") +
                         std::string("\n  🎤 Ready to publish microphone!") +
                         std::string("\n  👂 Ready to receive remote audio!");
        OutputDebugStringA(("AgoraEventHandler::onJoinChannelSuccess - " + msg + "\n").c_str());
    }

    void AgoraEventHandler::onLeaveChannel(const RtcStats& stats)
    {
        std::string msg = std::string("👋 LEFT CHANNEL SUCCESSFULLY!") +
                         std::string("\n  ⏱️ Duration: ") + std::to_string(stats.duration) + std::string("s");
        OutputDebugStringA(("AgoraEventHandler::onLeaveChannel - " + msg + "\n").c_str());
    }

    void AgoraEventHandler::onUserJoined(uid_t uid, int elapsed)
    {
        std::string msg = std::string("🔥 REMOTE USER JOINED! THIS IS CRUCIAL!") +
                         std::string("\n  👤 Remote UID: ") + std::to_string(uid) + 
                         std::string("\n  ⏱️ Elapsed: ") + std::to_string(elapsed) + std::string("ms") +
                         std::string("\n  🎉 You should now be able to hear each other!") +
                         std::string("\n  🎤 Both devices can now communicate!");
        OutputDebugStringA(("AgoraEventHandler::onUserJoined - " + msg + "\n").c_str());
    }

    void AgoraEventHandler::onUserOffline(uid_t uid, USER_OFFLINE_REASON_TYPE reason)
    {
        std::string reasonStr = (reason == USER_OFFLINE_QUIT) ? "QUIT" : 
                               (reason == USER_OFFLINE_DROPPED) ? "DROPPED" : "BECOME_AUDIENCE";
        std::string msg = std::string("😢 REMOTE USER LEFT!") +
                         std::string("\n  👤 UID: ") + std::to_string(uid) + 
                         std::string("\n  📝 Reason: ") + reasonStr +
                         std::string("\n  ⚠️ Voice communication ended with this user");
        OutputDebugStringA(("AgoraEventHandler::onUserOffline - " + msg + "\n").c_str());
    }

    void AgoraEventHandler::onError(int err, const char* msg)
    {
        std::string errorMsg = std::string("💥 CRITICAL AGORA ERROR!") +
                              std::string("\n  🔢 Error Code: ") + std::to_string(err) + 
                              std::string("\n  📝 Message: ") + std::string(msg ? msg : "Unknown error") +
                              std::string("\n  ⚠️ This may prevent voice communication!");
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

            // Enable AI Noise Suppression for better audio quality
            OutputDebugStringA("🤖 Enabling AI Noise Suppression (Aggressive mode)...\n");
            result = m_rtcEngine->setAINSMode(true, agora::rtc::AINS_MODE_AGGRESSIVE);
            OutputDebugStringA(("🔍 AI Noise Suppression result: " + std::to_string(result) + "\n").c_str());

            // Set audio scenario for communication (optimizes for voice)
            OutputDebugStringA("🎤 Setting audio scenario for meeting/voice communication...\n");
            result = m_rtcEngine->setAudioScenario(agora::rtc::AUDIO_SCENARIO_MEETING);
            OutputDebugStringA(("🔍 Audio scenario result: " + std::to_string(result) + "\n").c_str());

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
            OutputDebugStringA(("🚀 ATTEMPTING TO JOIN CHANNEL: " + channelName + "\n").c_str());
            
            if (!m_isInitialized || !m_rtcEngine) {
                OutputDebugStringA("❌ Engine not initialized - CANNOT JOIN CHANNEL\n");
                return;
            }

            // Stop echo test if running (critical requirement)
            if (m_isEchoTestRunning) {
                OutputDebugStringA("⚠️ Stopping echo test before joining channel\n");
                StopEchoTest();
            }

            // Leave current channel if in one
            if (!m_currentChannel.empty()) {
                OutputDebugStringA("⚠️ Already in channel, leaving current channel first\n");
                m_rtcEngine->leaveChannel();
                m_currentChannel.clear();
            }

            OutputDebugStringA("🔧 CONFIGURING CHANNEL OPTIONS FOR VOICE COMMUNICATION...\n");
            ChannelMediaOptions options;
            options.publishMicrophoneTrack = true;          // 🎤 PUBLISH YOUR VOICE
            options.autoSubscribeAudio = true;             // 👂 HEAR OTHERS
            options.autoSubscribeVideo = false;            // ❌ NO VIDEO
            options.enableAudioRecordingOrPlayout = true;  // 🔊 ENABLE AUDIO
            options.clientRoleType = CLIENT_ROLE_BROADCASTER; // 📡 BROADCASTER ROLE

            OutputDebugStringA("✅ Channel options configured:\n");
            OutputDebugStringA("  🎤 Publishing microphone: YES\n");
            OutputDebugStringA("  👂 Auto-subscribe to remote audio: YES\n");
            OutputDebugStringA("  👤 Client role: BROADCASTER\n");

            // Optimize audio quality before joining channel
            OutputDebugStringA("🎵 Optimizing audio quality for voice communication...\n");
            
            // Set recording volume to optimal level (reduce background noise pickup)
            m_rtcEngine->adjustRecordingSignalVolume(80); // Slightly reduce from default 100
            OutputDebugStringA("🔊 Recording volume set to 80 (reduces background noise)\n");
            
            // Enable local voice effects for cleaner sound (reduce low frequency noise)
            m_rtcEngine->setLocalVoiceEqualization(agora::rtc::AUDIO_EQUALIZATION_BAND_125, -15);
            m_rtcEngine->setLocalVoiceEqualization(agora::rtc::AUDIO_EQUALIZATION_BAND_250, -10);
            OutputDebugStringA("🎚️ Voice equalization applied (reduced 125Hz & 250Hz for less noise)\n");

            OutputDebugStringA("🔗 CALLING joinChannel()...\n");
            // New project in testing mode - no token required
            OutputDebugStringA("🆓 Using testing mode (no token required) for new Agora project\n");
            int result = m_rtcEngine->joinChannel(nullptr, channelName.c_str(), 0, options);
            
            OutputDebugStringA(("🔍 joinChannel() result: " + std::to_string(result) + "\n").c_str());
            
            if (result == 0) {
                m_currentChannel = channelName;
                OutputDebugStringA(("🎉 SUCCESS! Initiated join to channel: " + channelName + "\n").c_str());
                OutputDebugStringA("⏳ Waiting for onJoinChannelSuccess callback...\n");
                OutputDebugStringA("👀 Watch for onUserJoined when other device connects!\n");
            } else {
                OutputDebugStringA(("💥 FAILED TO JOIN CHANNEL! Error: " + std::to_string(result) + "\n").c_str());
                
                switch (result) {
                    case -2:
                        OutputDebugStringA("❌ Invalid parameter - check channel name\n");
                        break;
                    case -7:
                        OutputDebugStringA("❌ SDK not initialized\n");
                        break;
                    case -8:
                        OutputDebugStringA("❌ Echo test still running - this prevents joining!\n");
                        break;
                    case -17:
                        OutputDebugStringA("❌ Request rejected - already in channel?\n");
                        break;
                    default:
                        OutputDebugStringA(("❌ Unknown error: " + std::to_string(result) + "\n").c_str());
                        break;
                }
            }
        } catch (...) {
            OutputDebugStringA("💥 EXCEPTION in JoinChannel!\n");
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

    void AgoraManager::MuteLocalAudio(bool mute)
    {
        try {
            OutputDebugStringA(("🎤 MuteLocalAudio - " + std::string(mute ? "MUTING" : "UNMUTING") + " microphone\n").c_str());
            
            if (!m_isInitialized || !m_rtcEngine) {
                OutputDebugStringA("❌ Engine not initialized\n");
                return;
            }

            int result = m_rtcEngine->muteLocalAudioStream(mute);
            if (result == 0) {
                m_isLocalAudioMuted = mute;
                OutputDebugStringA(("✅ Microphone " + std::string(mute ? "MUTED" : "UNMUTED") + " successfully\n").c_str());
            } else {
                OutputDebugStringA(("❌ Failed to mute/unmute, error: " + std::to_string(result) + "\n").c_str());
            }
        } catch (...) {
            OutputDebugStringA("❌ Exception in MuteLocalAudio\n");
        }
    }

    void AgoraManager::EnableLocalAudio(bool enabled)
    {
        try {
            OutputDebugStringA(("🎤 EnableLocalAudio - " + std::string(enabled ? "ENABLING" : "DISABLING") + " audio capture\n").c_str());
            
            if (!m_isInitialized || !m_rtcEngine) {
                OutputDebugStringA("❌ Engine not initialized\n");
                return;
            }

            int result = m_rtcEngine->enableLocalAudio(enabled);
            if (result == 0) {
                OutputDebugStringA(("✅ Audio capture " + std::string(enabled ? "ENABLED" : "DISABLED") + " successfully\n").c_str());
            } else {
                OutputDebugStringA(("❌ Failed to enable/disable audio, error: " + std::to_string(result) + "\n").c_str());
            }
        } catch (...) {
            OutputDebugStringA("❌ Exception in EnableLocalAudio\n");
        }
    }

    void AgoraManager::AdjustRecordingVolume(int volume)
    {
        try {
            OutputDebugStringA(("🔊 AdjustRecordingVolume - Setting to " + std::to_string(volume) + "\n").c_str());
            
            if (!m_isInitialized || !m_rtcEngine) {
                OutputDebugStringA("❌ Engine not initialized\n");
                return;
            }

            int clampedVolume = std::max(0, std::min(400, volume));
            int result = m_rtcEngine->adjustRecordingSignalVolume(clampedVolume);
            if (result == 0) {
                OutputDebugStringA(("✅ Recording volume set to " + std::to_string(clampedVolume) + "\n").c_str());
            } else {
                OutputDebugStringA(("❌ Failed to adjust volume, error: " + std::to_string(result) + "\n").c_str());
            }
        } catch (...) {
            OutputDebugStringA("❌ Exception in AdjustRecordingVolume\n");
        }
    }

    void AgoraManager::SetClientRole(int role)
    {
        try {
            OutputDebugStringA(("👤 SetClientRole - Setting to " + std::to_string(role) + "\n").c_str());
            
            if (!m_isInitialized || !m_rtcEngine) {
                OutputDebugStringA("❌ Engine not initialized\n");
                return;
            }

            CLIENT_ROLE_TYPE clientRole = static_cast<CLIENT_ROLE_TYPE>(role);
            int result = m_rtcEngine->setClientRole(clientRole);
            if (result == 0) {
                OutputDebugStringA("✅ Client role set successfully\n");
            } else {
                OutputDebugStringA(("❌ Failed to set client role, error: " + std::to_string(result) + "\n").c_str());
            }
        } catch (...) {
            OutputDebugStringA("❌ Exception in SetClientRole\n");
        }
    }

    void AgoraManager::EnableNoiseSuppressionMode(bool enabled, int mode)
    {
        try {
            OutputDebugStringA(("🤖 EnableNoiseSuppressionMode - " + std::string(enabled ? "ENABLING" : "DISABLING") + " mode: " + std::to_string(mode) + "\n").c_str());
            
            if (!m_isInitialized || !m_rtcEngine) {
                OutputDebugStringA("❌ Engine not initialized\n");
                return;
            }

            // Convert int to proper enum (0=Balanced, 1=Aggressive, 2=UltraLowLatency)
            agora::rtc::AUDIO_AINS_MODE ainsMode;
            switch (mode) {
                case 0: ainsMode = agora::rtc::AINS_MODE_BALANCED; break;
                case 1: ainsMode = agora::rtc::AINS_MODE_AGGRESSIVE; break;
                case 2: ainsMode = agora::rtc::AINS_MODE_ULTRALOWLATENCY; break;
                default: ainsMode = agora::rtc::AINS_MODE_BALANCED; break;
            }
            
            int result = m_rtcEngine->setAINSMode(enabled, ainsMode);
            if (result == 0) {
                OutputDebugStringA(("✅ Noise suppression " + std::string(enabled ? "ENABLED" : "DISABLED") + " successfully\n").c_str());
            } else {
                OutputDebugStringA(("❌ Failed to set noise suppression, error: " + std::to_string(result) + "\n").c_str());
            }
        } catch (...) {
            OutputDebugStringA("❌ Exception in EnableNoiseSuppressionMode\n");
        }
    }

    void AgoraManager::SetAudioScenario(int scenario)
    {
        try {
            OutputDebugStringA(("🎵 SetAudioScenario - Setting to " + std::to_string(scenario) + "\n").c_str());
            
            if (!m_isInitialized || !m_rtcEngine) {
                OutputDebugStringA("❌ Engine not initialized\n");
                return;
            }

            // Convert int to proper enum (0=Default, 3=Game_Streaming, 5=Chatroom, 8=Meeting)
            agora::rtc::AUDIO_SCENARIO_TYPE audioScenario;
            switch (scenario) {
                case 0: audioScenario = agora::rtc::AUDIO_SCENARIO_DEFAULT; break;
                case 3: audioScenario = agora::rtc::AUDIO_SCENARIO_GAME_STREAMING; break;
                case 5: audioScenario = agora::rtc::AUDIO_SCENARIO_CHATROOM; break;
                case 8: audioScenario = agora::rtc::AUDIO_SCENARIO_MEETING; break;
                default: audioScenario = agora::rtc::AUDIO_SCENARIO_MEETING; break;
            }
            
            int result = m_rtcEngine->setAudioScenario(audioScenario);
            if (result == 0) {
                OutputDebugStringA("✅ Audio scenario set successfully\n");
            } else {
                OutputDebugStringA(("❌ Failed to set audio scenario, error: " + std::to_string(result) + "\n").c_str());
            }
        } catch (...) {
            OutputDebugStringA("❌ Exception in SetAudioScenario\n");
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

    // New functions for private calls

    void AgoraManager::SetSpeakerphoneOn(bool enable)
    {
        try {
            if (!m_rtcEngine) {
                OutputDebugStringA("❌ Engine not initialized - cannot set speakerphone\n");
                return;
            }

            // Note: setEnableSpeakerphone is not available on Windows desktop
            // This is a mobile-only feature. On Windows, audio routing is handled by OS.
            m_isSpeakerphoneOn = enable;
            std::string msg = enable ? "✅ Speakerphone enabled (Windows: OS managed)\n" : "✅ Speakerphone disabled (Windows: OS managed)\n";
            OutputDebugStringA(msg.c_str());
            
        } catch (...) {
            OutputDebugStringA("❌ Exception in SetSpeakerphoneOn\n");
        }
    }

    bool AgoraManager::IsLocalAudioMuted()
    {
        return m_isLocalAudioMuted;
    }

    bool AgoraManager::IsSpeakerphoneOn()
    {
        return m_isSpeakerphoneOn;
    }

    std::string AgoraManager::GetCurrentChannel()
    {
        return m_currentChannel;
    }

    int AgoraManager::GetConnectionState()
    {
        try {
            if (!m_rtcEngine) {
                return -1; // Not initialized
            }

            CONNECTION_STATE_TYPE state = m_rtcEngine->getConnectionState();
            OutputDebugStringA(("🔍 Connection state: " + std::to_string(state) + "\n").c_str());
            return static_cast<int>(state);
        } catch (...) {
            OutputDebugStringA("❌ Exception in GetConnectionState\n");
            return -1;
        }
    }
}