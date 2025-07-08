#pragma once
#include <winrt/Microsoft.ReactNative.h>
#include "NativeModules.h"

namespace winrt::FinalProject::implementation
{
    REACT_MODULE(TestModule)
    struct TestModule
    {
        REACT_INIT(Initialize)
        void Initialize(winrt::Microsoft::ReactNative::ReactContext const& reactContext) noexcept
        {
            m_reactContext = reactContext;
        }

        REACT_METHOD(TestMethod)
        void TestMethod() noexcept;

    private:
        winrt::Microsoft::ReactNative::ReactContext m_reactContext;
    };
} 