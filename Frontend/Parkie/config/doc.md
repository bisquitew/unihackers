# Connecting via Expo Tunnel (ngrok)

To test the Parkie app on an external phone using **Expo Go** without being on the same Wi-Fi network, you can use Expo's tunneling feature powered by **ngrok**.

## Prerequisites
1. **Expo Go** app installed on your mobile device.
2. An **ngrok account**. Sign up for free at [ngrok.com](https://ngrok.com/).

## Steps to Set Up

### 1. Install Dependencies
Ensure you have the necessary ngrok package for Expo:
```bash
npm install -g ngrok
# Or within the project
npx expo install @expo/ngrok
```

### 2. Configure ngrok Authtoken
To use tunnels, you must authenticate with your ngrok account:
1. Log in to your [ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken).
2. Copy your **Your Authtoken**.
3. Run the following command in your terminal:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
   ```

### 3. Launch the App with Tunneling
Navigate to the `Frontend/Parkie` directory and start the server with the `--tunnel` flag:
```bash
npx expo start --tunnel
```

### 4. Connect with Expo Go
1. Wait for the terminal to display the **QR Code**.
2. Open the **Expo Go** app on your phone.
3. **Android:** Tap "Scan QR Code".
4. **iOS:** Open the default Camera app and scan the code.

## Troubleshooting
- **Persistence:** Tunnel URLs are temporary. If you restart `npx expo start --tunnel`, you will get a new URL and QR code.
- **Speed:** Tunneling may be slightly slower than a direct local connection (LAN).
- **Backend Connection:** Ensure your backend API is also reachable (e.g., hosted online or also tunneled) and update the `config/api.js` accordingly if necessary.
