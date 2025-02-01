"use client";

import React, { useState, useRef, useEffect } from "react";
import { FaUser, FaRobot, FaArrowDown } from "react-icons/fa";

type Message = {
  sender: "user" | "ai";
  text: string;
};

export default function Home() {
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [defaultQuestionVisible, setDefaultQuestionVisible] = useState(true);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // Ref for the chat container
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Default questions to display on the UI
  const defaultQuestions = [
    "Tell me something about your chamber.",
    "When did you open your chamber?",
    "Where is your chamber?",
  ];

  // Function to scroll to the bottom of the chat container smoothly.
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // Scroll to bottom on chatHistory change if user is already near the bottom.
  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      const nearBottom = scrollTop + clientHeight >= scrollHeight - 50;
      if (nearBottom) {
        scrollToBottom();
      }
    }
  }, [chatHistory]);

  // Listen for scroll events to decide whether to show the down-arrow.
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      if (scrollTop + clientHeight < scrollHeight - 50) {
        setShowScrollDown(true);
      } else {
        setShowScrollDown(false);
      }
    }
  };

  const handleSubmit = async (
    e: React.FormEvent,
    questionFromButton?: string
  ) => {
    e.preventDefault();
    const question = questionFromButton || input;
    if (!question.trim()) return;

    const userMessage: Message = { sender: "user", text: question };
    setChatHistory((prev) => [...prev, userMessage]);
    if (!questionFromButton) setInput("");
    setLoading(true);

    // Hide default questions after the first question is asked
    if (defaultQuestionVisible) {
      setDefaultQuestionVisible(false);
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });
      const data = await res.json();
      if (data.error) {
        setChatHistory((prev) => [
          ...prev,
          { sender: "ai", text: "Error: " + data.error },
        ]);
      } else {
        const aiMessage: Message = { sender: "ai", text: data.message || "" };
        setChatHistory((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setChatHistory((prev) => [
        ...prev,
        { sender: "ai", text: "An unexpected error occurred." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-3 min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="w-full lg:min-w-96 lg:max-w-xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 pb-4">
          Medical Help
        </h1>

        {/* Chat Container */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="relative border border-gray-300 p-4 h-[450px] overflow-y-auto mb-4 bg-gray-50 rounded-md scrollbar-hide"
          style={{
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {/* Default Questions Container */}
          {defaultQuestionVisible && (
            <div className="mb-4 flex flex-col gap-2">
              {defaultQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={(e) => handleSubmit(e, q)}
                  className="w-full border border-blue-500 text-blue-500 rounded-md px-4 py-2 hover:bg-blue-50 transition shadow-md"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`mb-2 flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "user" ? (
                <FaUser className="text-blue-600 mr-2" />
              ) : (
                <FaRobot className="text-green-600 mr-2" />
              )}
              <div
                className={`p-2 rounded-lg ${
                  msg.sender === "user"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                } transition-all duration-300`}
              >
                <strong>{msg.sender === "user" ? "You" : "AI"}:</strong>{" "}
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-center italic text-gray-500">
              AI is typing...
            </div>
          )}
          {/* Down Arrow Icon */}
          {showScrollDown && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-2 right-2 bg-white p-1 rounded-full shadow-md hover:bg-gray-100 transition"
              title="Scroll to latest"
            >
              <FaArrowDown className="text-gray-600" />
            </button>
          )}
        </div>
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Ask your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 transition"
          >
            Send
          </button>
        </form>
      </div>
      {/* Additional CSS to hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
