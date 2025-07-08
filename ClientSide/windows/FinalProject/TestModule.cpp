#include "pch.h"
#include "TestModule.h"

namespace winrt::FinalProject::implementation
{
    void TestModule::TestMethod() noexcept
    {
        // Simple test method implementation
        OutputDebugStringA("TestModule::TestMethod called\n");
    }
} 