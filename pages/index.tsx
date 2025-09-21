import { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import Webcam from "react-webcam";

export default function Home() {
  const [textInput, setTextInput] = useState("");
  const [target, setTarget] = useState("telugu");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const webcamRef = useRef<Webcam | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  ); // 📷 rear by default

  const onCropComplete = useCallback((_c: any, croppedAreaPx: any) => {
    setCroppedAreaPixels(croppedAreaPx);
  }, []);

  // Upload file
  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
  };

  // Capture from webcam
  const captureFromWebcam = () => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) {
      setImageUrl(screenshot);
      setCameraOpen(false);
    }
  };

  // Manual text transliteration
  const handleTransliterateText = async () => {
    if (!textInput.trim()) return alert("Enter text first");
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/transliterate-text`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textInput, target }),
        }
      );
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Error");
    }
    setLoading(false);
  };

  // Process image
  const handleProcessImage = async () => {
    if (!imageUrl) return alert("Upload or capture image first");
    setLoading(true);
    try {
      const resp = await fetch(imageUrl);
      const blob = await resp.blob();

      let x = null,
        y = null,
        width = null,
        height = null;
      if (croppedAreaPixels) {
        x = Math.round(croppedAreaPixels.x);
        y = Math.round(croppedAreaPixels.y);
        width = Math.round(croppedAreaPixels.width);
        height = Math.round(croppedAreaPixels.height);
      }

      const fd = new FormData();
      fd.append("image", blob, "upload.png");
      fd.append("target", target);
      if (x !== null) {
        fd.append("x", String(x));
        fd.append("y", String(y));
        fd.append("width", String(width));
        fd.append("height", String(height));
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/process-image`,
        {
          method: "POST",
          body: fd,
        }
      );
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Error processing image");
    }
    setLoading(false);
  };

  const handleSpeak = async () => {
    if (!result) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: result.transliterated_user, target }),
      });
      if (!res.ok) return alert("TTS error");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch (err) {
      console.error(err);
      alert("TTS failed");
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-6 bg-gradient-to-r from-blue-400 to-purple-500">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center">
        Bharatiya Transliteration Demo
      </h1>

      {/* Text input box */}
      <textarea
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        placeholder="✍️ Type or paste text here (any Indian script)"
        className="w-full max-w-2xl p-3 rounded border shadow mb-4 bg-gray-100 text-black"
        rows={3}
      />
      <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-wrap w-full max-w-2xl">
        <button
          onClick={handleTransliterateText}
          className="px-4 py-2 bg-blue-700 text-white rounded shadow hover:bg-blue-800"
        >
          Transliterate Text
        </button>

        <div className="border rounded p-2 bg-gray-100 flex items-center">
          <label className="font-semibold mr-2">Target Script:</label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="p-1 border rounded bg-white"
          >
            <option value="hindi">Hindi</option>
            <option value="english">English</option>
            <option value="telugu">Telugu</option>
            <option value="tamil">Tamil</option>
            <option value="kannada">Kannada</option>
            <option value="malayalam">Malayalam</option>
            <option value="gujarati">Gujarati</option>
            <option value="bengali">Bengali</option>
            <option value="oriya">Oriya</option>
            <option value="gurmukhi">Punjabi</option>
            <option value="iast">IAST</option>
          </select>
        </div>
      </div>

      {/* Upload */}
      <div className="mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0])}
          ref={inputRef}
          className="hidden"
        />
        <button
          className="px-4 py-2 bg-purple-700 text-white rounded shadow hover:bg-purple-800"
          onClick={() => inputRef.current?.click()}
        >
          📁 Upload Image
        </button>
      </div>

      {/* Camera toggle */}
      <div className="mb-4">
        {!cameraOpen ? (
          <button
            className="px-4 py-2 bg-indigo-700 text-white rounded shadow hover:bg-indigo-800"
            onClick={() => setCameraOpen(true)}
          >
            📷 Open Camera
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode }}
              className="rounded shadow"
            />
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded"
                onClick={captureFromWebcam}
              >
                Capture Photo
              </button>
              <button
                className="px-4 py-2 bg-yellow-600 text-white rounded"
                onClick={() =>
                  setFacingMode((prev) =>
                    prev === "user" ? "environment" : "user"
                  )
                }
              >
                🔄 Switch Camera
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={() => setCameraOpen(false)}
              >
                Close Camera
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cropper */}
      {imageUrl && (
        <div className="mb-4 w-full max-w-2xl">
          <div className="relative w-full h-64 bg-black rounded">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={4 / 1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="flex gap-3 mt-3 flex-wrap">
            <button
              className="px-4 py-2 bg-pink-600 text-white rounded shadow hover:bg-pink-700"
              onClick={handleProcessImage}
            >
              {loading ? "Processing..." : "Process Cropped Region"}
            </button>
            <button
              className="px-4 py-2 bg-gray-600 text-white rounded shadow hover:bg-gray-700"
              onClick={() => setImageUrl(null)}
            >
              Clear Image
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-6 bg-gray-100 text-black p-4 rounded shadow w-full max-w-2xl">
          <h2 className="font-bold mb-2">Result</h2>
          <p>
            <strong>Detected script:</strong> {result.detected_script}
          </p>
          <p>
            <strong>OCR text:</strong> {result.input}
          </p>
          <p>
            <strong>Transliterated ({target}):</strong>{" "}
            {result.transliterated_user}
          </p>
          <p>
            <strong>English (IAST):</strong> {result.transliterated_english}
          </p>
          <button
            className="mt-3 px-4 py-2 bg-green-700 text-white rounded shadow hover:bg-green-800"
            onClick={handleSpeak}
          >
            🔊 Speak
          </button>
        </div>
      )}
    </div>
  );
}
