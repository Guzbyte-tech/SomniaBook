# ⏳ ChronoVault

**ChronoVault** is a **fully on-chain, time-locked multisig vault** built on the **Somnia Network**.  
It allows users or DAOs to **securely lock tokens (native STT)** in a vault that can only be unlocked by an **M-of-N signature scheme** after a specific **time** (block height or timestamp).

---

## 🚀 Features

- **Vault Creation** – Deploy a new vault contract with:
  - Vault name
  - Signer addresses (N participants).
  - Signature threshold (M-of-N).
  - Unlock time (block timestamp or blocknumber).
  - Locked amount of **STT tokens**, **ERC20 Tokens** (coming soon).
- **Multi-Signature Approval** – Signers approve unlock requests **on-chain**.
- **Time-Lock Enforcement** – Funds cannot be withdrawn before the unlock timestamp.
- **Unlock Flow** – Once threshold + unlock time are met, anyone can trigger `unlock()`.
- **Fully On-Chain** – All state transitions are transparent and verifiable.

---

## 🧭 User Flow

1. **Landing Page (Dashboard)**  
   - Connect wallet via **AppKit**.  
   - View **My Vaults** or create a new vault.  

2. **Vault Creation**  
   - Configure signers & threshold.  
   - Choose amount of **STT** to lock.  
   - Set unlock time.  
   - Deploy Vault on **Somnia**.  

3. **Vault Detail Page**  
   - Shows locked amount, unlock time, signers, and signature status.  
   - Signers can approve unlock before time is reached.  

4. **Signing**  
   - Signers call `approveUnlock()` on-chain.  
   - Status updates from **Pending → Approved**.  

5. **Unlocking**  
   - Once unlock time is reached **and** threshold is met:  
     - Anyone can trigger `unlock()`.  
     - Funds are released to the creator’s address.  

---

## 🏗️ Architecture


## ⚙️ Tech Stack

### Frontend

* [Next.js](https://nextjs.org/) + [React](https://reactjs.org/)
* [AppKit](https://appkit.io/) for wallet connection
* [Ethers.js](https://docs.ethers.org/) for blockchain interaction

### Backend

* Node.js + Express
* MongoDB (off-chain metadata: vault names, UI labels)

### Smart Contracts

* Solidity (EVM-compatible)
* Somnia Network deployment

---

## 📦 Installation & Setup

### 1. Clone the Repository

```bash
git clone git@github.com:Guzbyte-tech/Somnia_Chrono_Vault.git
cd chronovault
```

### 2. Install Dependencies

#### Frontend

```bash
cd frontend
npm install
```

#### Backend

```bash
cd backend
npm install
```

### 3. Environment Variables

Create a `.env` file in both `frontend/` and `backend/`:

#### Frontend `.env`

```env
NEXT_PUBLIC_PROJECT_ID=
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_RPC_URL=
NEXT_BACKEND_URL=http://localhost:4000

```

#### Backend `.env`

```env
NODE_ENV=test
MONGODB_URI=
PORT=4000
RPC_URL=
PRIVATE_KEY=
CONTRACT_ADDRESS=
```

### 4. Run the Project

#### Backend

```bash
cd backend
npm run dev
```

#### Frontend

```bash
cd frontend
npm run dev
```

The app will be available at:
👉 [http://localhost:3000](http://localhost:3000)


---

## 📚 Roadmap

* ✅ MVP with **STT native token**.
* ⏳ Support for ERC20 tokens (USDC, USDT, bridged assets).
* ⏳ DAO-specific features (proposal-based unlocks).
* ⏳ Notifications for signers (off-chain).

---

## 🤝 Contributing

Pull requests are welcome! Please open an issue first to discuss any feature or bug.

---

## 📜 License

MIT License © 2025 ChronoVault
