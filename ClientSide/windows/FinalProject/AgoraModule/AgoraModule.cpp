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
                // Leave all active channels
                for (const auto& connection : m_activeConnections) {
                    m_rtcEngine->leaveChannelEx(connection.second);
                }
                m_activeConnections.clear();
                m_connectionStates.clear();
                m_channelMuteStates.clear();
                m_talkingChannel.clear();
                
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
            m_rtcEngine = static_cast<IRtcEngineEx*>(createAgoraRtcEngine());
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
            // No release() needed
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

            // For backward compatibility, use the legacy single-channel approach
            OutputDebugStringA("🔧 CONFIGURING CHANNEL OPTIONS FOR VOICE COMMUNICATION...\n");
            ChannelMediaOptions options;
            options.publishMicrophoneTrack = true;          // 🎤 PUBLISH YOUR VOICE (app can mute later)
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
                m_isLocalAudioMuted = false;  // Always start unmuted, app will mute if needed
                OutputDebugStringA(("🎉 SUCCESS! Initiated join to channel: " + channelName + "\n").c_str());
                OutputDebugStringA("🔓 Microphone starts UNMUTED (app will control mute for ListenOnly)\n");
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
            if (!m_rtcEngine) return;
            
            m_rtcEngine->leaveChannel();
            m_isLocalAudioMuted = false;  // Reset mute state when leaving channel
            OutputDebugStringA("✅ Left channel\n");
            OutputDebugStringA("🔄 Mute state reset to UNMUTED\n");
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
                m_isLocalAudioMuted = mute;  // Track the mute state internally
                OutputDebugStringA(("✅ Microphone " + std::string(mute ? "MUTED" : "UNMUTED") + " successfully\n").c_str());
                OutputDebugStringA(("📊 Internal mute state updated to: " + std::string(mute ? "MUTED" : "UNMUTED") + "\n").c_str());
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

    bool AgoraManager::IsLocalAudioMuted()
    {
        try {
            OutputDebugStringA(("🔍 IsLocalAudioMuted - Checking mute status: " + std::string(m_isLocalAudioMuted ? "MUTED" : "UNMUTED") + "\n").c_str());
            return m_isLocalAudioMuted;
        } catch (...) {
            OutputDebugStringA("❌ Exception in IsLocalAudioMuted\n");
            return false;
        }
    }

    void AgoraManager::ReleaseEngine()
    {
        try {
            if (m_rtcEngine) {
                // Leave all active channels
                for (const auto& connection : m_activeConnections) {
                    m_rtcEngine->leaveChannelEx(connection.second);
                }
                m_activeConnections.clear();
                m_connectionStates.clear();
                m_channelMuteStates.clear();
                m_talkingChannel.clear();
                
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

        if (!m_activeConnections.empty()) {
            status += "🔗 Connected Channels: " + std::to_string(m_activeConnections.size()) + "\n";
            for (const auto& connection : m_activeConnections) {
                status += "  - " + connection.first + "\n";
            }
        } else {
            status += "⭕ Connected Channels: NONE\n";
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

    // ==================== MULTI-CHANNEL METHODS ====================

    void AgoraManager::JoinChannelEx(const std::string& channelName)
    {
        try {
            OutputDebugStringA(("🚀 AgoraManager::JoinChannelEx - Joining channel: " + channelName + "\n").c_str());
            
            if (!m_isInitialized || !m_rtcEngine) {
                OutputDebugStringA("❌ Engine not initialized\n");
                return;
            }

            // Check if already connected to this channel
            if (m_connectionStates.find(channelName) != m_connectionStates.end() && m_connectionStates[channelName]) {
                OutputDebugStringA(("⚠️ Already connected to channel: " + channelName + "\n").c_str());
                return;
            }

            // Create unique UID for this channel connection
            static int uidCounter = 1000;
            uid_t uid = uidCounter++;

            // Create RtcConnection
            RtcConnection connection;
            connection.channelId = channelName.c_str();
            connection.localUid = uid;

            // Configure channel media options
            ChannelMediaOptions options;
            options.publishMicrophoneTrack = true;          // Can publish audio
            options.autoSubscribeAudio = true;             // Auto-subscribe to remote audio
            options.autoSubscribeVideo = false;            // No video
            options.enableAudioRecordingOrPlayout = true;  // Enable audio
            options.clientRoleType = CLIENT_ROLE_BROADCASTER; // Can talk

            OutputDebugStringA(("🔧 Joining channel with UID: " + std::to_string(uid) + "\n").c_str());
            
            // Join the channel using joinChannelEx
            int result = m_rtcEngine->joinChannelEx(nullptr, connection, options, m_eventHandler.get());
            
            if (result == 0) {
                // Store connection info
                m_activeConnections[channelName] = connection;
                m_connectionStates[channelName] = true;
                m_channelMuteStates[channelName] = false; // Start unmuted
                
                OutputDebugStringA(("✅ Successfully joined channel: " + channelName + "\n").c_str());
                OutputDebugStringA(("📊 Active connections: " + std::to_string(m_activeConnections.size()) + "\n").c_str());
            } else {
                OutputDebugStringA(("❌ Failed to join channel: " + channelName + ", error: " + std::to_string(result) + "\n").c_str());
            }

        } catch (const std::exception& e) {
            OutputDebugStringA(("❌ Exception in JoinChannelEx: " + std::string(e.what()) + "\n").c_str());
        } catch (...) {
            OutputDebugStringA("❌ Unknown exception in JoinChannelEx\n");
        }
    }

    void AgoraManager::LeaveChannelEx(const std::string& channelName)
    {
        try {
            OutputDebugStringA(("👋 AgoraManager::LeaveChannelEx - Leaving channel: " + channelName + "\n").c_str());
            
            if (!m_isInitialized || !m_rtcEngine) {
                OutputDebugStringA("❌ Engine not initialized\n");
                return;
            }

            // Check if connected to this channel
            auto connectionIt = m_activeConnections.find(channelName);
            if (connectionIt == m_activeConnections.end()) {
                OutputDebugStringA(("⚠️ Not connected to channel: " + channelName + "\n").c_str());
                return;
            }

            // Leave the channel
            int result = m_rtcEngine->leaveChannelEx(connectionIt->second);
            
            if (result == 0) {
                // Remove from tracking
                m_activeConnections.erase(channelName);
                m_connectionStates.erase(channelName);
                m_channelMuteStates.erase(channelName);
                
                // If this was the talking channel, clear talking state
                if (m_talkingChannel == channelName) {
                    m_talkingChannel.clear();
                }
                
                OutputDebugStringA(("✅ Successfully left channel: " + channelName + "\n").c_str());
                OutputDebugStringA(("📊 Active connections: " + std::to_string(m_activeConnections.size()) + "\n").c_str());
            } else {
                OutputDebugStringA(("❌ Failed to leave channel: " + channelName + ", error: " + std::to_string(result) + "\n").c_str());
            }

        } catch (const std::exception& e) {
            OutputDebugStringA(("❌ Exception in LeaveChannelEx: " + std::string(e.what()) + "\n").c_str());
        } catch (...) {
            OutputDebugStringA("❌ Unknown exception in LeaveChannelEx\n");
        }
    }

    void AgoraManager::MuteChannel(const std::string& channelName, bool mute)
    {
        try {
            OutputDebugStringA(("🎤 AgoraManager::MuteChannel - " + std::string(mute ? "MUTING" : "UNMUTING") + " channel: " + channelName + "\n").c_str());
            
            if (!m_isInitialized || !m_rtcEngine) {
                OutputDebugStringA("❌ Engine not initialized\n");
                return;
            }

            // Check if connected to this channel
            auto connectionIt = m_activeConnections.find(channelName);
            if (connectionIt == m_activeConnections.end()) {
                OutputDebugStringA(("⚠️ Not connected to channel: " + channelName + "\n").c_str());
                return;
            }

            // Update mute state
            m_channelMuteStates[channelName] = mute;
            
            // If this is the talking channel, update global mute state
            if (m_talkingChannel == channelName) {
                m_isLocalAudioMuted = mute;
            }
            
            OutputDebugStringA(("✅ Channel " + channelName + " " + std::string(mute ? "MUTED" : "UNMUTED") + "\n").c_str());

        } catch (const std::exception& e) {
            OutputDebugStringA(("❌ Exception in MuteChannel: " + std::string(e.what()) + "\n").c_str());
        } catch (...) {
            OutputDebugStringA("❌ Unknown exception in MuteChannel\n");
        }
    }

    void AgoraManager::SetTalkingChannel(const std::string& channelName)
    {
        try {
            OutputDebugStringA(("🎤 AgoraManager::SetTalkingChannel - Setting talking channel to: " + channelName + "\n").c_str());
            
            if (!m_isInitialized || !m_rtcEngine) {
                OutputDebugStringA("❌ Engine not initialized\n");
                return;
            }

            // Check if connected to this channel
            if (m_connectionStates.find(channelName) == m_connectionStates.end() || !m_connectionStates[channelName]) {
                OutputDebugStringA(("⚠️ Not connected to channel: " + channelName + "\n").c_str());
                return;
            }

            // Mute previous talking channel
            if (!m_talkingChannel.empty() && m_talkingChannel != channelName) {
                MuteChannel(m_talkingChannel, true);
            }

            // Set new talking channel
            m_talkingChannel = channelName;
            
            // Unmute the new talking channel
            MuteChannel(channelName, false);
            
            OutputDebugStringA(("✅ Talking channel set to: " + channelName + "\n").c_str());

        } catch (const std::exception& e) {
            OutputDebugStringA(("❌ Exception in SetTalkingChannel: " + std::string(e.what()) + "\n").c_str());
        } catch (...) {
            OutputDebugStringA("❌ Unknown exception in SetTalkingChannel\n");
        }
    }

    bool AgoraManager::IsChannelConnected(const std::string& channelName)
    {
        try {
            auto it = m_connectionStates.find(channelName);
            bool connected = (it != m_connectionStates.end() && it->second);
            OutputDebugStringA(("🔍 IsChannelConnected - Channel " + channelName + ": " + std::string(connected ? "CONNECTED" : "DISCONNECTED") + "\n").c_str());
            return connected;
        } catch (...) {
            OutputDebugStringA("❌ Exception in IsChannelConnected\n");
            return false;
        }
    }

    bool AgoraManager::IsChannelMuted(const std::string& channelName)
    {
        try {
            auto it = m_channelMuteStates.find(channelName);
            bool muted = (it != m_channelMuteStates.end() && it->second);
            OutputDebugStringA(("🔍 IsChannelMuted - Channel " + channelName + ": " + std::string(muted ? "MUTED" : "UNMUTED") + "\n").c_str());
            return muted;
        } catch (...) {
            OutputDebugStringA("❌ Exception in IsChannelMuted\n");
            return false;
        }
    }

    std::vector<std::string> AgoraManager::GetConnectedChannels()
    {
        std::vector<std::string> connectedChannels;
        for (const auto& pair : m_connectionStates) {
            if (pair.second) {
                connectedChannels.push_back(pair.first);
            }
        }
        OutputDebugStringA(("📊 GetConnectedChannels - Found " + std::to_string(connectedChannels.size()) + " connected channels\n").c_str());
        return connectedChannels;
    }
}