# Goan AI

A guest chat app. Visitors see Goan Swift, Goan Pro, and Goan Reason. API keys stay on the server.

## Run

Copy `.env.example` to `.env.local` and add your keys, then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Each visitor can send 50 messages per day. The count resets at midnight IST. Change it with `DAILY_MESSAGE_LIMIT`.
