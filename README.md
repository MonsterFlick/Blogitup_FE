
# BlogitUp FE 📰🔊

This is the frontend for **BlogitUp**, a web application that lets users paste blog content or enter a blog URL to generate AI-powered insights and listen to them using the browser's built-in Text-to-Speech engine.

## 🌟 Features

- 📥 **Input Options**: Paste raw blog text or fetch from a given URL.
- 🤖 **AI Insights**: Sends content to Gemini AI to generate meaningful summaries.
- 🗣️ **Browser TTS**: Reads the AI insights aloud using Web Speech API (play, pause, resume, stop).
- 🎛️ **Advanced TTS Controls**: Change voice, pitch, rate (optional dropdown).

---

## 🧩 Tech Stack

- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Google Gemini API (Flash 1.5)** for insights only
- **Browser SpeechSynthesis API** for TTS

---

## 🚀 Deployment URLs

- 🌐 **Frontend (Vercel)**:  
  [`https://blogitup-fe.vercel.app`](https://blogitup-fe.vercel.app)

- 🔧 **Backend (Render)**:  
  [`https://blogitup-be.onrender.com`](https://blogitup-be.onrender.com)

- 📦 **GitHub Repo (FE)**:  
  [`https://github.com/MonsterFlick/Blogitup_FE`](https://github.com/MonsterFlick/Blogitup_FE)

- 🔧 **GitHub Repo (BE)**:  
  [`https://github.com/MonsterFlick/blogitup_BE`](https://github.com/MonsterFlick/blogitup_BE)

---

## 🛠️ Local Setup

```bash
git clone https://github.com/MonsterFlick/Blogitup_FE.git
cd Blogitup_FE
npm install
npm run dev
````

> ✅ Make sure to set the environment variable:

```env
NEXT_PUBLIC_BACKEND_URL=https://blogitup-be.onrender.com
```

---

## 💡 Notes

* Gemini’s **TTS was removed** due to daily quota limits — replaced with browser’s native TTS for reliability and offline functionality.
* The backend runs on **port 4000** locally.
* If you encounter an **API limit error** related to Gemini, please contact the maintainer to rotate the API key.

---

## 📅  Requirements

This project was built for an assignment with the following goals:

* Accept blog input (text/URL)
* Generate Gemini insights
* Read aloud using TTS
* Provide a clean, interactive frontend

---

## ✨ Credits

Built by [Om Thakur](https://github.com/MonsterFlick) using Gemini + Vercel + Render + Bun + Next.js.

```


