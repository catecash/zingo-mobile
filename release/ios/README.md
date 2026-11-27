# Catecash iOS release assets

The iOS target uses `ios/Zingo/Images.xcassets/AppIcon-Catecash.appiconset`. Its 1024 × 1024 source is `assets/catecash/app-icon.png`. The icon is an opaque RGB PNG and the asset catalog contains the required iPhone and iPad sizes.

The `screenshots/iphone-17-pro/en-US` images are direct captures of the iOS 26.3 simulator at 1206 × 2622 pixels. The `screenshots/ipad-pro-13/en-US` image is a direct capture at 2064 × 2752 pixels. They show fresh Devnet wallets with zero test CATE. Use the Receive screenshot first, followed by Home, Your addresses, and Server. A funded test wallet would show the send and history features better. Capture those screens from the final release build before submission. Keep seed phrases and viewing keys out of screenshots.

The text in `metadata/en-US` describes the Mainnet wallet and is saved in App Store Connect. `app-store-connect.md` records the remaining fields and checks. The wallet privacy policy is live at `https://catecash.com/privacy/`.

The production Xcode target uses `com.catecash.wallet`, version 1.0, build 329, and supports iPhone and iPad. The separate Beta configuration keeps `org.catecash.devnet.beta`.

The icon has a centered green shield for build 329. The screenshots here still show Devnet. Capture Mainnet screens from the final release build before submission.

References: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications and https://developer.apple.com/app-store/review/guidelines/
