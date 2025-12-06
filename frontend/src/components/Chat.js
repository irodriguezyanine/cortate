import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

// Aquí puedes remplazar la URL base por la de tu backend real
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

export default function Chat({ eventId, user, counterpart, onClose }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  // Cargar historial del chat del evento al iniciar
  useEffect(() => {
    async function fetchMessages() {
      setLoading(true);
      setError("");
      try {
        // Endpoint sugerido. Si no existe, deberás crear uno similar en backend.
        const res = await axios.get(
          `${BACKEND_URL}/api/events/${eventId}/chat`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } }
        );
        setMessages(res.data.messages || []);
      } catch (e) {
        setError("No se pudo cargar el chat. Intenta de nuevo.");
      }
      setLoading(false);
    }
    fetchMessages();

    // Polling menos optimo, pero funcional si no hay WebSockets. Cada 3 segundos.
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [eventId]);

  // Scroll al último mensaje
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError("");
    try {
      // Endpoint sugerido. Si no existe, deberás crear uno similar.
      const res = await axios.post(
        `${BACKEND_URL}/api/events/${eventId}/chat`,
        { text: message },
        { headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` } }
      );
      setMessages((prev) => [...prev, res.data.message]);
      setMessage("");
    } catch (e) {
      setError("No se pudo enviar el mensaje.");
    }
    setSending(false);
  };

  return (
    <div
      className="fixed bottom-4 right-4 max-w-md w-full bg-white shadow-2xl rounded-lg flex flex-col z-50"
      style={{ minHeight: 400, maxHeight: 550 }}>
      <div className="flex items-center justify-between bg-gradient-to-r from-amber-500 to-yellow-400 p-4 rounded-t-lg">
        <div className="flex-shrink-0 font-bold text-white text-lg">
          Chat con {counterpart?.name || "Usuario"}
        </div>
        <button onClick={onClose} className="p-1 text-white rounded hover:bg-amber-700">
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-100 flex flex-col gap-2">
        {loading ? (
          <div className="text-center text-gray-400">Cargando mensajes...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400">No hay mensajes aún</div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={
                "flex " + (msg.sender_id === user.id ? "justify-end" : "justify-start")
              }
            >
              <div
                className={
                  "max-w-xs px-4 py-2 rounded-2xl shadow " +
                  (msg.sender_id === user.id
                    ? "bg-amber-100 text-right"
                    : "bg-gray-300 text-left")
                }
                style={{
                  borderRadius:
                    msg.sender_id === user.id
                      ? "16px 16px 2px 16px"
                      : "16px 16px 16px 2px",
                }}
              >
                <div className="text-sm">{msg.text}</div>
                <div className="text-[10px] text-gray-500 mt-1 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form
        className="flex p-2 border-t bg-white"
        onSubmit={e => {
          e.preventDefault();
          sendMessage();
        }}>
        <input
          className="flex-1 px-3 py-2 border rounded-l-2xl focus:outline-none"
          type="text"
          autoComplete="off"
          placeholder="Escribe un mensaje"
          value={message}
          onChange={e => setMessage(e.target.value)}
          disabled={sending}
        />
        <button
          type="submit"
          className="px-5 py-2 bg-amber-500 text-white rounded-r-2xl font-bold hover:bg-amber-600 transition disabled:opacity-60"
          disabled={sending}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}