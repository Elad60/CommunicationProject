// AutolinkedNativeModules.g.cpp contents generated by "npx @react-native-community/cli autolink-windows"
// clang-format off
#include "pch.h"
#include "AutolinkedNativeModules.g.h"

// Includes from @react-native-async-storage/async-storage
#include <winrt/ReactNativeAsyncStorage.h>

// Includes from react-native-screens
#include <winrt/RNScreens.h>

namespace winrt::Microsoft::ReactNative
{

void RegisterAutolinkedNativeModulePackages(winrt::Windows::Foundation::Collections::IVector<winrt::Microsoft::ReactNative::IReactPackageProvider> const& packageProviders)
{ 
    // IReactPackageProviders from @react-native-async-storage/async-storage
    packageProviders.Append(winrt::ReactNativeAsyncStorage::ReactPackageProvider());
    // IReactPackageProviders from react-native-screens
    packageProviders.Append(winrt::RNScreens::ReactPackageProvider());
}

}
