# Catecash iOS App Store Connect fields

The Mainnet product copy and review notes are saved in App Store Connect. The copy in `metadata/en-US/` is the local source. Check every feature against the final build before submission.

| Field | Prepared value |
| --- | --- |
| App name | Catecash |
| Primary language | English (U.S.) |
| Primary category | Finance |
| Subtitle, description, keywords, promotional text | `metadata/en-US/` |
| App Review notes | `metadata/en-US/review_notes.txt` |
| Copyright | © 2026 Athena Live LLC, subject to the final developer account owner |
| Support URL | `https://catecash.com/support/` |
| Privacy policy URL | `https://catecash.com/privacy/` |

App Store Connect uses `com.catecash.wallet` and version 1.0. The production iOS target matches those values and uses build 329.

## Before submission

- Confirm the developer account is enrolled as an organization for a cryptocurrency wallet.
- Add the mainnet chain and public wallet gateway, then verify every listing statement on the final release build.
- Replace the Devnet screenshots with captures from that build. Include a funded wallet's send and history screens without exposing keys or recovery phrases.
- Verify the live support page and `am@catecash.com` mail action in the final build.
- Audit the final build, its third-party libraries, wallet server, diagnostics, and support flow against the App Privacy answers.
- Complete the age rating questionnaire, content rights, export compliance, and regional availability in App Store Connect. Confirm the financial and cryptocurrency answers with the account owner.
- Apple requested a physical-device recording, not a funded review wallet. Supply funded wallet details through the secure review fields only if Apple requests a completed Send test. Never put a live recovery phrase in this repository.
- The account owner confirmed that the attached `catecash.mov` starts with app launch, was recorded on a physical device running the latest iOS release, and shows the typical wallet flow Apple requested.
- Athena Live LLC owns the Catecash intellectual property and the catecash.com, catecash.net, and catecash.org domains. Attach proof in App Store Connect if Apple requests it.
- App Store Connect shows the United States as the only available territory, with 174 territories unavailable.
- Confirm the final bundle ID, signing team, version, build number, and review contact details in App Store Connect.

Apple's field limits are 30 characters for the name and subtitle, 170 for promotional text, 4,000 for the description, and 100 bytes for keywords. The local copy meets these limits. Apple's age rating comes from its current questionnaire. The privacy answers must reflect the final app and integrated partners.

References: https://developer.apple.com/help/app-store-connect/reference/app-information/app-and-compliance-information ; https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information ; https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/ ; https://developer.apple.com/app-store/review/guidelines/
