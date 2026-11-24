# Catecash iOS release assets

The iOS target uses `ios/Zingo/Images.xcassets/AppIcon-Catecash.appiconset`. Its 1024 × 1024 source is `assets/catecash/app-icon.png`. The icon is an opaque RGB PNG and the asset catalog contains the required iPhone and iPad sizes.

The `screenshots/iphone-17-pro/en-US` images are direct captures of the iOS 26.3 simulator at 1206 × 2622 pixels. The `screenshots/ipad-pro-13/en-US` image is a direct capture at 2064 × 2752 pixels. They show fresh Devnet wallets with zero test CATE. Use the Receive screenshot first, followed by Home, Your addresses, and Server. A funded test wallet would show the send and history features better. Capture those screens from the final release build before submission. Keep seed phrases and viewing keys out of screenshots.

The text in `metadata/en-US` now describes the intended mainnet wallet. It is a local draft for the later public release and does not describe the current Devnet build. `app-store-connect.md` records the remaining fields and checks. The existing `docs/privacy_policy.txt` describes Zcash, while the website's `/privacy/` page covers the website. Neither is the Catecash iOS wallet policy.

The Xcode target currently uses `org.catecash.devnet`, version 3.0.0, build 324, and supports iPhone and iPad. Keep the bundle ID aligned with the App Store Connect record before uploading a build.

Apple requires screenshots that reflect the app. The icon and screenshots here represent the current Devnet build. Replace the screenshots after mainnet is enabled and the final release build is available. Keep the current build out of the public store release.

References: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications and https://developer.apple.com/app-store/review/guidelines/
