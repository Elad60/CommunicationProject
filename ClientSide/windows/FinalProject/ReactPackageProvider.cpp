#include "pch.h"
#include "ReactPackageProvider.h"
#include "NativeModules.h"
#include "AgoraModule/AgoraModule.h"

using namespace winrt::Microsoft::ReactNative;

namespace winrt::FinalProject::implementation
{

void ReactPackageProvider::CreatePackage(IReactPackageBuilder const &packageBuilder) noexcept
{
    AddAttributedModules(packageBuilder, true);
}

} // namespace winrt::FinalProject::implementation
