# iOS

> iOS builds require **macOS** with Xcode (and Xcode Command Line Tools) installed.
> They cannot be performed on Linux or Windows.

## Prerequisites

1. Yarn
2. NodeJS at the version pinned in `.nvmrc` (`nvm install` reads the file and installs it)
3. CocoaPods (`sudo gem install cocoapods`)

## Building

The Binding Layer comes from the iOS Prebuilt Bundle that `binding-layer.json`
pins: the `ZingoBindings` Swift package with one XCFramework (`Zingolib`, which
carries the wallet and the Nym proxy) and the Swift sources. The fetch extracts
it under `ios/binding-layer/ZingoBindings`, where the Xcode project references
it as a local package. The XCFramework contains both the device slice (arm64) and
the simulator slice (arm64 + x86_64), and Xcode picks the slice by the build
destination.

1. Clone the repository:
   `git clone https://github.com/zingolabs/zingo-mobile.git`.
2. Go to the cloned repo `cd zingo-mobile`.
3. From the root of the project, install JS deps: `yarn`
4. Fetch the Binding Layer: `yarn --silent fetch:binding-layer --platform ios`.
   The command needs network access to `ghcr.io` the first time. The
   `Zingo` and `Zingo Beta` schemes run the same fetch as a build
   pre-action, before Xcode plans the package build, and log it to
   `ios/build/fetch_binding_layer.log`. A failed pre-action leaves the
   build running, and the first build phase of the `Zingo` target then
   compares the extracted package with the pin and fails naming this
   command when they differ.
5. In the `ios` directory, run: `pod install`

## Launching the app

1. In a terminal, run: `yarn start`
2. In a separate terminal, run: `yarn ios`
   You can also open the `ios` directory in Xcode and run it there.

## Building the Catecash wallet

Keep the Catecash `zingolib` checkout beside this repository. This build uses
its local Swift package and XCFramework. Install the Rust targets once:

```sh
cd ../zingolib
rustup target add aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios
cargo run --manifest-path tools/workbench/Cargo.toml --bin build-binding-layer -- ios --target aarch64-apple-ios
cargo run --manifest-path tools/workbench/Cargo.toml --bin build-binding-layer -- ios --target aarch64-apple-ios-sim
cargo run --manifest-path tools/workbench/Cargo.toml --bin build-binding-layer -- ios --target x86_64-apple-ios
cargo run --manifest-path tools/workbench/Cargo.toml --bin build-binding-layer -- ios --assemble
cd ../zingo-mobile
cd ios
pod install
CATECASH_LOCAL_BINDINGS=1 xcodebuild -workspace Zingo.xcworkspace -scheme Zingo -configuration Release -destination 'generic/platform=iOS Simulator' -derivedDataPath build/catecash-ios CODE_SIGNING_ALLOWED=NO build
```

Use the Node version in `.nvmrc` and install JavaScript packages with `yarn`
before the build. The `Zingo` and `Zingo Beta` Xcode configurations set
`CATECASH_LOCAL_BINDINGS=1`. Their build pre-action stages the local Swift
package and selects it for the package build. The app name, icon, and bundle
identifiers are set in the Xcode project.

The Catecash build opens the active Catecash wallet at launch. New wallets
select Mainnet by default and can select Devnet or Testnet on the Server screen before creation. An existing
wallet keeps its original network. On an existing wallet's Server screen,
selecting another network opens a wallet on that network or starts the new
wallet flow with that network preselected. The public defaults are
`https://wallet.catecash.com:443`,
`https://wallet-devnet.catecash.com:443` and
`https://wallet-testnet.catecash.com:443`. The app verifies the network
reported by a custom server before saving it. Catecash wallets display
balances in **CATE**. Mainnet transaction links use
`https://scan.catecash.com`; Testnet links use `https://scan-testnet.catecash.com`.

The Catecash iOS build stages the sibling fork and checks the XCFramework and
Swift binding hashes in `binding-layer.json` before compilation. The upstream
pin in that file still serves the Zingo and Android builds. After changing
Catecash consensus or FFI code, rebuild all three slices, assemble them,
update the Catecash hashes in `binding-layer.json`, and rerun the Release build.
Keep each wallet tied to the network in its saved metadata.

Mainnet transaction testing needs spendable chain data. Private mining is
active on the hosted candidate, but its first coinbase reward matures at
height 241. On 2026-11-23, the operator confirmed on an iPhone that Devnet,
Testnet and Mainnet wallets retained their own network and server after
switching and reopening Catecash Beta. Record funded balance, send, receive,
restore and reorganization checks separately before distributing the wallet.
