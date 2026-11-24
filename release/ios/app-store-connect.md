# Catecash iOS App Store Connect fields

This is the mainnet listing draft. Keep it off App Store Connect until the mainnet app and review build are ready. The copy in `metadata/en-US/` describes a working mainnet wallet. Check every feature against the final build before submission.

| Field | Prepared value |
| --- | --- |
| App name | Catecash |
| Primary language | English (U.S.) |
| Primary category | Finance |
| Subtitle, description, keywords, promotional text | `metadata/en-US/` |
| App Review notes | `metadata/en-US/review_notes.txt` |
| Copyright | © 2026 Athena Live LLC, subject to the final developer account owner |
| Support URL | `https://catecash.com/support/` once the prepared page is deployed and verified |
| Privacy policy URL | A Catecash wallet privacy policy is needed; the current `/privacy/` page covers the website |

The App Store Connect record must use the bundle ID of the final mainnet build. The current iOS target uses `org.catecash.devnet`, version 3.0.0 (324). The mainnet bundle ID and version remain to be set.

## Before submission

- Confirm the developer account is enrolled as an organization for a cryptocurrency wallet.
- Add the mainnet chain and public wallet gateway, then verify every listing statement on the final release build.
- Replace the Devnet screenshots with captures from that build. Include a funded wallet's send and history screens without exposing keys or recovery phrases.
- Deploy `website/dist/support/index.html` and verify its X contact route. Replace or remove the app's `support@zingolabs.org` mail action before release.
- Publish a wallet privacy policy and link it inside the app. Audit the final build, its third-party libraries, wallet server, diagnostics, and support flow before completing Apple's App Privacy answers.
- Complete the age rating questionnaire, content rights, export compliance, and regional availability in App Store Connect. Confirm the financial and cryptocurrency answers with the account owner.
- Supply App Review with a funded review wallet and transfer instructions through the secure review fields. Never put a live recovery phrase in this repository.
- Confirm the final bundle ID, signing team, version, build number, and review contact details in App Store Connect.

Apple's field limits are 30 characters for the name and subtitle, 170 for promotional text, 4,000 for the description, and 100 bytes for keywords. The local copy meets these limits. Apple's age rating comes from its current questionnaire. The privacy answers must reflect the final app and integrated partners.

References: https://developer.apple.com/help/app-store-connect/reference/app-information/app-and-compliance-information ; https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information ; https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/ ; https://developer.apple.com/app-store/review/guidelines/
