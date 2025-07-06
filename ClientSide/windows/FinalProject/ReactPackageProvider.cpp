#include "pch.h"
#include "ReactPackageProvider.h"
#include "NativeModules.h"
#include "AgoraModule/AgoraModule.h"  // Safe stub implementation
#include "TestModule.h"  // Simple test module

using namespace winrt::Microsoft::ReactNative;
using namespace winrt::FinalProject::implementation;

namespace winrt::FinalProject::implementation
{

void ReactPackageProvider::CreatePackage(IReactPackageBuilder const &packageBuilder) noexcept
{
    // Try manual registration first for TestModule
    packageBuilder.AddModule(L"TestModule", MakeModuleProvider<TestModule>());
    
    // Then try AddAttributedModules
    AddAttributedModules(packageBuilder, true);
    
    // Finally try AgoraModule
    packageBuilder.AddModule(L"AgoraModule", MakeModuleProvider<AgoraModule>());
}

} // namespace winrt::FinalProject::implementation
