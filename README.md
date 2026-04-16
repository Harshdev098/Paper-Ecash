# Paper-Ecash
A Web-Based Physical Ecash Issuance System for Fedimint

## 🏛 About Fedimint

[Fedimint](https://github.com/fedimint/fedimint) is a *modular system* for building federated applications, designed to be:

- *🛡 Trust-minimized* – You control your funds with federation consensus.  
- *🚫 Censorship-resistant* – No single point of control.  
- *👤 Private* – Transactions can’t be linked back to you.

---

## Tech Stack

- ⚡ The project uses Vite + React + Typescript.
- 🎨 ShadCN + Tailwind is used for designing.
- 🏦 [Fedimint-sdk](https://github.com/fedimint/fedimint-sdk) is used for interacting with the fedimint.
- 📦 Redux is used as the primary state management library and Context API is mainly used for Fedimint sdk and NDK management.

## 🚀 Running the application

- Clone the repository
  
  ```
    git clone https://github.com/Harshdev098/haze-wallet.git
  ```
  
- Install the dependencies
  
  ```
    npm install
  ```
  
- Start the app in development mode
  
  ```
    npm run dev
  ```

## Adding a Paper Note Design

Read the [Designer Guide](./DesignerGuide.md) to get the detailed overview for adding the note designs and calculating the qr alignment dimenstions.