"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [inputMode, setInputMode] = useState<"text" | "url">("text");
  const [textContent, setTextContent] = useState("");
  const [url, setUrl] = useState("");
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
  const [pitch, setPitch] = useState(1.3);
  const [rate, setRate] = useState(1.2);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const allVoices = speechSynthesis.getVoices();
      const englishVoices = allVoices.filter((v) => v.lang.startsWith("en"));
      setVoices(englishVoices);
      if (englishVoices.length > 0) {
        setSelectedVoiceURI(englishVoices[0].voiceURI);
      }
    };
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
  }, []);

  function isValidHttpUrl(string: string): boolean {
    try {
      const url = new URL(string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;
    }
  }

  async function fetchContentFromURL(url: string): Promise<string> {
    if (!isValidHttpUrl(url)) {
      throw new Error("❌ Invalid URL format");
    }
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/fetch-url?url=${encodeURIComponent(url)}`
    );
    const data = await res.json();
    if (!data.textContent) throw new Error("No blog content found");
    return data.textContent;
  }

  const handleSubmit = async () => {
    setLoading(true);
    setReplyText("");
    setError("");
    stopTTS();
    try {
      let content = "";
      if (inputMode === "url") {
        if (!url.trim().startsWith("http")) {
          throw new Error("Invalid URL. Please include http:// or https://");
        }
        content = await fetchContentFromURL(url);
      } else {
        if (!textContent.trim()) throw new Error("Please enter blog text.");
        content = textContent.trim();
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
      });
      const data = await res.json();
      if (!data.text) throw new Error("No Gemini response.");
      setReplyText(data.text);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const speak = () => {
    if (!replyText) return;
    stopTTS();
    const utterance = new SpeechSynthesisUtterance(replyText);
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.lang = "en-US";
    utterance.volume = 1;
    const voice = voices.find((v) => v.voiceURI === selectedVoiceURI);
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    speechSynthesis.speak(utterance);
    utteranceRef.current = utterance;
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseTTS = () => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeTTS = () => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stopTTS = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    utteranceRef.current = null;
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Gemini Blog Insights + Browser TTS
      </h1>

      {/* Toggle */}
      <div className="flex items-center justify-center mb-4 gap-4">
        <span className="font-medium">Paste Text</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={inputMode === "url"}
            onChange={() => setInputMode(inputMode === "text" ? "url" : "text")}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-600 transition-all" />
          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform peer-checked:translate-x-5" />
        </label>
        <span className="font-medium">From URL</span>
      </div>

      {/* Input */}
      <div className={loading ? "opacity-50 pointer-events-none" : ""}>
        {inputMode === "text" ? (
          <textarea
            className="w-full h-48 p-3 border rounded mb-4"
            placeholder="Paste your blog content here..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
          />
        ) : (
          <input
            className="w-full p-3 border rounded mb-4"
            placeholder="Enter blog URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || (!textContent && !url)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate"}
      </button>

      {loading && (
        <div className="flex items-center justify-center mt-4 gap-2 text-blue-600">
          <svg
            className="animate-spin h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
            />
          </svg>
          <span className="text-base font-medium">Generating insights…</span>
        </div>
      )}

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {replyText && (
        <div className="mt-6 border border-gray-300 bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2 text-black">Gemini Response</h2>
          <p className="whitespace-pre-wrap text-gray-800">{replyText}</p>

          {/* TTS Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={speak}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              disabled={isPlaying}
            >
              ▶️ Play
            </button>
            <button
              onClick={pauseTTS}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
              disabled={!isPlaying || isPaused}
            >
              ⏸️ Pause
            </button>
            <button
              onClick={resumeTTS}
              className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition"
              disabled={!isPaused}
            >
              🔁 Resume
            </button>
            <button
              onClick={stopTTS}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              disabled={!isPlaying && !isPaused}
            >
              ⏹️ Stop
            </button>
          </div>

          {/* Toggle Advanced Controls */}
          <button
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="mt-4 text-sm underline text-blue-600 hover:text-blue-800"
          >
            {showAdvanced ? "Hide Advanced TTS Controls" : "Show Advanced TTS Controls"}
          </button>

          {/* Advanced Controls */}
          {showAdvanced && (
            <div className="mt-4 text-black">
              <label className="block font-medium mb-1">Voice</label>
              <select
                value={selectedVoiceURI}
                onChange={(e) => setSelectedVoiceURI(e.target.value)}
                className="w-full border rounded p-2 mb-4 text-black"
              >
                {voices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>

              <label className="block font-medium mb-1">Pitch: {pitch.toFixed(1)}</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full mb-4"
              />

              <label className="block font-medium mb-1">Rate: {rate.toFixed(1)}</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>
      )}
    </main>
  );
}
