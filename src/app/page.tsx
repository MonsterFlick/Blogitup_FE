"use client";

import { useState } from "react";

export default function Home() {
  const [inputMode, setInputMode] = useState<"text" | "url">("text");
  const [textContent, setTextContent] = useState("");
  const [url, setUrl] = useState("");
  const [replyText, setReplyText] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

    try {
      const res = await fetch(`/api/fetch-url?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      console.log(" Data from /api/fetch-url:", data);
      if (!data.textContent) throw new Error("No blog content found");
      return data.textContent;
    } catch (err: any) {
      console.error(" Error in fetchContentFromURL:", err);
      throw new Error(err.message || "Failed to fetch content from URL");
    }
  }

  const handleSubmit = async () => {
    setLoading(true);
    setReplyText("");
    setAudioUrl("");
    setError("");

    try {
      let finalContent = "";

      if (inputMode === "url") {
        if (!url.trim().startsWith("http")) {
          throw new Error("Invalid URL. Please include http:// or https://");
        }

        const extracted = await fetchContentFromURL(url);
        console.log(" Extracted blog text from URL:", extracted);
        finalContent = extracted;
      } else {
        if (!textContent.trim()) {
          throw new Error("Please enter some blog text.");
        }

        finalContent = textContent.trim();
      }

      console.log(" Sending to TTS:", finalContent);

      const res = await fetch("http://localhost:4000/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: finalContent }),
      });

      if (res.status === 429) {
        const text = await res.text();
        console.warn(" TTS quota exceeded:", text);
        throw new Error(" TTS quota exceeded. Try again tomorrow or upgrade your Gemini plan.");
      }
      
      if (!res.ok) {
        const text = await res.text();
        console.error(" Backend error response:", text);
        throw new Error(`TTS Error: ${text}`);
      }

      let data;
      try {
        data = await res.json();
      } catch (err) {
        console.error(" Failed to parse JSON from TTS response:", err);
        throw new Error("TTS returned invalid JSON format.");
      }

      if (!data.audioBase64 || !data.text) {
        throw new Error("Incomplete data from TTS response.");
      }

      setReplyText(data.text);

      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0))],
        { type: "audio/wav" }
      );
      setAudioUrl(URL.createObjectURL(audioBlob));
    } catch (err: any) {
      console.error(" handleSubmit Error:", err);
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
         Gemini Blog insights and TTS
      </h1>

      {/*  Toggle Switch */}
      <div className="flex items-center justify-center mb-4 gap-4">
        <span className="font-medium">Paste Text</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={inputMode === "url"}
            onChange={() =>
              setInputMode((prev) => (prev === "text" ? "url" : "text"))
            }
            className="sr-only peer"
          />
          {/* Track */}
          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer-checked:bg-blue-600 transition-all duration-300" />
          {/* Dot */}
          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 transform peer-checked:translate-x-5" />
        </label>
        <span className="font-medium">From URL</span>
      </div>

      {/*  Dim + Disable Inputs During Loading */}
      <div className={loading ? "opacity-50 pointer-events-none" : ""}>
        {inputMode === "text" ? (
          <textarea
            className="w-full h-48 p-3 border rounded mb-4"
            placeholder="Paste your blog content here..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            disabled={loading}
          />
        ) : (
          <input
            className="w-full p-3 border rounded mb-4"
            placeholder="Enter blog URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
          />
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || (!textContent && !url)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate"}
      </button>

      {/* Spinner with Label */}
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
          <span className="text-base font-medium">Generating insights and audio…</span>
        </div>
      )}

      {/*  Error Display */}
      {error && <p className="text-red-500 mt-4">{error}</p>}

      {/* Gemini Response */}
      {replyText && (
        <div className="mt-6 border border-gray-300 bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2 text-black">
             Gemini Response
          </h2>
          <p className="whitespace-pre-wrap text-gray-800">{replyText}</p>
        </div>
      )}

      {/* Audio Output */}
      {audioUrl && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">🔊 Audio</h2>
          <audio controls src={audioUrl} autoPlay className="w-full" />
        </div>
      )}
    </main>
  );
}
