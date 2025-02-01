import { NextResponse } from "next/server";

/**
 * Checks if the given text contains Bengali characters.
 */
function isBengali(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text);
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json(
        { error: "No message provided" },
        { status: 400 }
      );
    }

    // Normalize the message for comparisons.
    const normalizedMsg = message.trim().toLowerCase();

    // Predefined responses for chamber details.
    const chamberDetailsEN =
      "The name of our chamber is 'Ataullah's Hospital'. We treat all types of patients, and we have 4 branches: Dhaka, Barisal, Khulna, and Rangpur. We open our chamber every day from 8 AM to 10 PM. Sazia Ansar.";
    const chamberDetailsBN =
      "আমাদের চেম্বারের নাম 'Ataullah's Hospital'. আমরা সব ধরনের রোগীর চিকিৎসা করি, এবং আমাদের ৪টি শাখা রয়েছে: ঢাকা, বরিশাল, খুলনা, এবং রংপুর। আমাদের চেম্বার প্রতিদিন সকাল ৮টা থেকে রাত ১০টা পর্যন্ত খোলা থাকে। সাযিয়া আনসার।";

    // Fixed response for chamber-related questions that are not the default ones.
    const defaultChamberReplyEN =
      "I don't know this subject, I'm not experienced. Please contact with Ataullah.";
    const defaultChamberReplyBN = "আমি এই বিষয়ে জানি না, আমি অভিজ্ঞ নই।";

    // Predefined response for "who made you" queries.
    const makerAnswerEN = "Developer Ataullah sir made me.";
    const makerAnswerBN = "ডেভেলপার আতাউল্লাহ স্যার আমাকে তৈরি করেছেন।";

    // --- 1. Handle greetings normally ---
    const greetings = ["hi", "hello", "how are you"];
    if (greetings.includes(normalizedMsg)) {
      // Forward greetings to OpenAI for a natural reply.
      return forwardToOpenAI(message);
    }

    // --- 2. Handle "who made you" questions ---
    if (
      normalizedMsg.includes("who made you") ||
      normalizedMsg.includes("কে তৈরি করেছে")
    ) {
      const makerAnswer = isBengali(message) ? makerAnswerBN : makerAnswerEN;
      return NextResponse.json({ message: makerAnswer });
    }

    // --- 3. Handle the three default chamber questions (exact matches) ---
    const defaultQuestionsEN = [
      "tell me something about your chamber.",
      "when did you open your chamber?",
      "where is your chamber?",
    ];
    const defaultQuestionsBN = [
      "আপনার চেম্বার সম্পর্কে কিছু বলুন",
      "আপনার চেম্বার কখন খোলা হয়?",
      "আপনার চেম্বার কোথায় আছে?",
    ];
    if (
      defaultQuestionsEN.includes(normalizedMsg) ||
      defaultQuestionsBN.includes(message.trim())
    ) {
      const chamberAnswer = isBengali(message)
        ? chamberDetailsBN
        : chamberDetailsEN;
      return NextResponse.json({ message: chamberAnswer });
    }

    // --- 4. For any other chamber-related question ---
    // (for example, questions that include keywords like "chamber" or "hospital")
    if (
      normalizedMsg.includes("chamber") ||
      normalizedMsg.includes("hospital")
    ) {
      const chamberReply = isBengali(message)
        ? defaultChamberReplyBN
        : defaultChamberReplyEN;
      return NextResponse.json({ message: chamberReply });
    }

    // --- 5. For any other question, forward to OpenAI ---
    return forwardToOpenAI(message);
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * Forwards a message to OpenAI and returns its response.
 */
async function forwardToOpenAI(userMessage: string) {
  // A generic system prompt instructing the assistant to answer naturally.
  const systemMessage =
    "You are a knowledgeable assistant. Answer questions naturally according to the context. If a question is not related to your expertise, you may say 'I don't know this subject, I'm not experienced.'";
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
  }

  const openAIResponse = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // or 'gpt-4' if available
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
      }),
    }
  );

  if (!openAIResponse.ok) {
    const errorData = await openAIResponse.json();
    console.error("OpenAI API error:", errorData);
    return NextResponse.json(
      { error: "Error from OpenAI API" },
      { status: 500 }
    );
  }

  const data = await openAIResponse.json();
  const aiMessage = data.choices[0]?.message?.content;
  return NextResponse.json({ message: aiMessage });
}
