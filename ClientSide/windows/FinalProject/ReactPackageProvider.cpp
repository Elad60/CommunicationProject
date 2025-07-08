#include "pch.h"
#include "ReactPackageProvider.h"
#include "NativeModules.h"
#include "AgoraModule/AgoraModule.h"
#include "TestModule.h"

using namespace winrt::Microsoft::ReactNative;
using namespace winrt::FinalProject::implementation;

namespace winrt::FinalProject::implementation
{

void ReactPackageProvider::CreatePackage(IReactPackageBuilder const &packageBuilder) noexcept
{
    AddAttributedModules(packageBuilder);
}

} // namespace winrt::FinalProject::implementation
