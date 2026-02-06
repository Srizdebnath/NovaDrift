# NovaDrift

**NovaDrift** is a premium Stellar payment interface built with [Next.js](https://nextjs.org) and [Tailwind CSS](https://tailwindcss.com). It features a modern "Deep Space" glassmorphism aesthetic and integrates with the [Freighter Wallet](https://www.freighter.app/) to interact with the Stellar Testnet.

## Features

- **Wallet Connection**: Seamlessly connect via Freighter.
- **Real-time Balance**: View your current XLM balance.
- **Send Payments**: Send XLM to any Stellar Testnet address.
- **Transaction History**: View your recent incoming and outgoing payments.
- **Professional UI**: Fully responsive, dark-mode accessible interface with refined typography (Geist).

## Getting Started

### Prerequisites

- Node.js (v18+)
- [Freighter Wallet Extension](https://www.freighter.app/) installed in your browser.
- A Freighter account switched to **Testnet**.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/Srizdebnath/novadrift.git
    cd novadrift
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## Screenshots

### Wallet Connected State
*Shows the wallet connected with the account address and balance.*

![Wallet Connected](./public/screenshots/wallet-connected.png)


### Successful Transaction
*Shows the success feedback and transaction hash link.*

![Transaction Success](./public/screenshots/transaction-success.png)


### Recent Activity
*Displays the list of recent transactions.*

![Transaction History](./public/screenshots/transaction-history.png)


## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4, Glassmorphism
- **Blockchain**: Stellar SDK, @stellar/freighter-api
- **Fonts**: Geist Sans & Mono


