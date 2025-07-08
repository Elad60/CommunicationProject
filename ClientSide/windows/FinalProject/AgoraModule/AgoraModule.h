#pragma once
#include <winrt/Microsoft.ReactNative.h>
#include "NativeModules.h"
#include <string>
#include <functional>
#include <mutex>

// Include Agora SDK headers properly
#include "IAgoraRtcEngine.h"
#include "AgoraBase.h"
#include "AgoraMediaBase.h"

namespace winrt::FinalProject::implementation
{
    // Forward declarations
    using namespace agora::rtc;
    
    // Event handler for Agora callbacks
    class AgoraEventHandler : public IRtcEngineEventHandler
    {
    public:
        AgoraEventHandler() = default;
        virtual ~AgoraEventHandler() = default;

        // Override key event methods
        void onJoinChannelSuccess(const char* channel, uid_t uid, int elapsed) override;
        void onLeaveChannel(const RtcStats& stats) override;
        void onUserJoined(uid_t uid, int elapsed) override;
        void onUserOffline(uid_t uid, USER_OFFLINE_REASON_TYPE reason) override;
        void onError(int err, const char* msg) override;
    };

    // Global singleton class for Agora management
    class AgoraManager
    {
    private:
        static AgoraManager* instance;
        static std::mutex mutex_;
        
        IRtcEngine* m_rtcEngine = nullptr;
        std::unique_ptr<AgoraEventHandler> m_eventHandler;
        std::string m_appId;
        std::string m_currentChannel;
        bool m_isInitialized = false;
        bool m_isEchoTestRunning = false;
        
        // New state tracking variables
        bool m_isLocalAudioMuted = false;
        bool m_isLocalAudioEnabled = true;
        int m_recordingVolume = 100;
        bool m_isSpeakerphoneOn = false;

        AgoraManager() = default;

    public:
        static AgoraManager* GetInstance() {
            std::lock_guard<std::mutex> lock(mutex_);
            if (instance == nullptr) {
                instance = new AgoraManager();
            }
            return instance;
        }

        void InitializeEngine(const std::string& appId);
        void StartEchoTest();
        void StopEchoTest();
        void JoinChannel(const std::string& channelName);
        void LeaveChannel();
        void ReleaseEngine();
        std::string GetStatus();
        
        // New voice communication methods
        void MuteLocalAudio(bool mute);
        void EnableLocalAudio(bool enabled);
        void AdjustRecordingVolume(int volume);
        void SetClientRole(int role);
        
        // Audio quality methods
        void EnableNoiseSuppressionMode(bool enabled, int mode);
        void SetAudioScenario(int scenario);
        
        // New functions for private calls
        void SetSpeakerphoneOn(bool enable);
        bool IsLocalAudioMuted();
        bool IsSpeakerphoneOn();
        std::string GetCurrentChannel();
        int GetConnectionState();

        ~AgoraManager() {
            ReleaseEngine();
        }
    };

    REACT_MODULE(AgoraModule)
    struct AgoraModule
    {
        REACT_INIT(Initialize)
        void Initialize(winrt::Microsoft::ReactNative::ReactContext const& reactContext) noexcept
        {
            m_reactContext = reactContext;
        }

        REACT_METHOD(InitializeAgoraEngine)
        void InitializeAgoraEngine(std::string appId) noexcept
        {
            AgoraManager::GetInstance()->InitializeEngine(appId);
        }

        REACT_METHOD(StartEchoTest)
        void StartEchoTest() noexcept
        {
            AgoraManager::GetInstance()->StartEchoTest();
        }

        REACT_METHOD(StopEchoTest)
        void StopEchoTest() noexcept
        {
            AgoraManager::GetInstance()->StopEchoTest();
        }

        REACT_METHOD(JoinChannel)
        void JoinChannel(std::string channelName) noexcept
        {
            AgoraManager::GetInstance()->JoinChannel(channelName);
        }

        REACT_METHOD(LeaveChannel)
        void LeaveChannel() noexcept
        {
            AgoraManager::GetInstance()->LeaveChannel();
        }

        REACT_METHOD(ReleaseEngine)
        void ReleaseEngine() noexcept
        {
            AgoraManager::GetInstance()->ReleaseEngine();
        }

        REACT_METHOD(GetFunctionLoadingStatus)
        void GetFunctionLoadingStatus(std::function<void(std::string)> const& callback) noexcept
        {
            callback(AgoraManager::GetInstance()->GetStatus());
        }

        // New React Native voice communication methods
        REACT_METHOD(MuteLocalAudio)
        void MuteLocalAudio(bool mute) noexcept
        {
            AgoraManager::GetInstance()->MuteLocalAudio(mute);
        }

        REACT_METHOD(EnableLocalAudio)
        void EnableLocalAudio(bool enabled) noexcept
        {
            AgoraManager::GetInstance()->EnableLocalAudio(enabled);
        }

        REACT_METHOD(AdjustRecordingVolume)
        void AdjustRecordingVolume(int volume) noexcept
        {
            AgoraManager::GetInstance()->AdjustRecordingVolume(volume);
        }

        REACT_METHOD(SetClientRole)
        void SetClientRole(int role) noexcept
        {
            AgoraManager::GetInstance()->SetClientRole(role);
        }

        // Audio quality React Native methods
        REACT_METHOD(EnableNoiseSuppressionMode)
        void EnableNoiseSuppressionMode(bool enabled, int mode) noexcept
        {
            AgoraManager::GetInstance()->EnableNoiseSuppressionMode(enabled, mode);
        }

        REACT_METHOD(SetAudioScenario)
        void SetAudioScenario(int scenario) noexcept
        {
            AgoraManager::GetInstance()->SetAudioScenario(scenario);
        }

        REACT_METHOD(SetSpeakerphoneOn)
        void SetSpeakerphoneOn(bool enable) noexcept
        {
            AgoraManager::GetInstance()->SetSpeakerphoneOn(enable);
        }

        REACT_METHOD(IsLocalAudioMuted)
        void IsLocalAudioMuted(std::function<void(bool)> const& callback) noexcept
        {
            callback(AgoraManager::GetInstance()->IsLocalAudioMuted());
        }

        REACT_METHOD(IsSpeakerphoneOn)
        void IsSpeakerphoneOn(std::function<void(bool)> const& callback) noexcept
        {
            callback(AgoraManager::GetInstance()->IsSpeakerphoneOn());
        }

        REACT_METHOD(GetCurrentChannel)
        void GetCurrentChannel(std::function<void(std::string)> const& callback) noexcept
        {
            callback(AgoraManager::GetInstance()->GetCurrentChannel());
        }

        REACT_METHOD(GetConnectionState)
        void GetConnectionState(std::function<void(int)> const& callback) noexcept
        {
            callback(AgoraManager::GetInstance()->GetConnectionState());
        }

    private:
        winrt::Microsoft::ReactNative::ReactContext m_reactContext{ nullptr };
    };
}