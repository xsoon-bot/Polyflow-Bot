# Polyflow Auto Bot

Automatically generate and submit invoices to the Polyflow Scan2Earn platform to help maximize your airdrop potential.

## 🚀 Features

- ✅ Automatically generates realistic invoice images
- ✅ Handles token authentication
- ✅ Multi-token support (run multiple accounts)
- ✅ Proxy support for IP rotation
- ✅ Customizable scan count

## 📋 Prerequisites

- Node.js (v14+)
- NPM or Yarn

## ⚙️ Register
1. Go to the [Polyflow website](https://app.polyflow.tech/?refCode=26DF42F30F) and create an account.
2. Complete the KYC process to verify your identity.

## ⚙️ Installation

1. Clone the repository:
```bash
git clone https://github.com/xsoon-bot/Polyflow-Bot.git
```

2. Navigate to the project directory:
```bash
cd Polyflow-Bot
```

3. Install the dependencies:
```bash
npm install
```

## 📝 Configuration

1. Create a `acccount.txt` file in the project root and add your Polyflow authorization tokens (one per line):
```
your_private_wallet_address_1
your_private_wallet_address_2

```

2. (Optional) Create a `proxies.txt` file in the project root and add your proxies (one per line):
```
http://username:password@ip:port
http://ip:port
```

## 🏃‍♂️ Usage

Run the bot:
```bash
npm start
```

You will be prompted to enter the number of scans you want to perform. Each scan will generate and submit a unique invoice to the Polyflow platform.

## ⚠️ Disclaimer

This bot is for educational purposes only. Use at your own risk. We are not responsible for any account restrictions or penalties imposed by Polyflow for automated activity.

## 💡 Tips

- Don't run too many scans in a short period to avoid detection
- Rotate your IPs using proxies for better results
- Use multiple tokens to distribute activity

## 🤝 Buy Me a Coffee
If you find this project helpful and want to support its development, consider buying me a coffee:
- EVM: 0x87aCf7CfB8cB8A882b24F88f8B6869eE263dC61b
- SOL: 75dRTK9nUZJ2HCgRTJ1PZYJKNrdDfQEFdcBdHajev4Wm


## References
Thanks for the inspiration: [Airdrop Insiders](https://github.com/airdropinsiders)
