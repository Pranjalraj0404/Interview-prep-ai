# Quick Start Guide

## 1. Check Available Gemini Models

Run this to see which models your API key can access:

```bash
node check-models.js
```

This will:
- Load your API key from `.env.local`
- Test all available Gemini models
- Show which ones work and which don't
- Recommend the best model to use

## 2. Start the Development Server

If the server isn't running, start it:

```bash
npm run dev
```

The app will be available at: http://localhost:3000

## 3. Troubleshooting

### Server Won't Start?
- Make sure port 3000 is free
- Check that all dependencies are installed: `npm install`
- Look for error messages in the terminal

### Models Not Available?
- Run `node check-models.js` to see which models work
- Verify your `GEMINI_API_KEY` in `.env.local` is correct
- Check your Google Cloud project has Gemini API enabled

### Still Getting 503 Errors?
- The code now automatically tries fallback models
- Check the server console for detailed error messages
- Verify your API key hasn't exceeded quota limits

## 4. Using curl to Check Models (Alternative)

If you prefer using curl directly:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"
```

Replace `YOUR_API_KEY` with your actual key from `.env.local`.

This will show a JSON list of all available models for your API key.

