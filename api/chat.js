import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const GITHUB_RAW_URL =
  process.env.GITHUB_RAW_URL;

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Metodo non consentito"
    });
  }

  try {

    const { question } = req.body || {};

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: "Inserisci una domanda."
      });
    }


    /*
     * 1. Scarichiamo il documento
     *    direttamente da GitHub
     */

    const documentResponse =
      await fetch(GITHUB_RAW_URL);

    if (!documentResponse.ok) {
      throw new Error(
        "Impossibile leggere il documento GitHub."
      );
    }

    const document =
      await documentResponse.text();


    /*
     * 2. Limite di sicurezza
     */

    const MAX_CHARS = 100000;

    const documentText =
      document.length > MAX_CHARS
        ? document.substring(0, MAX_CHARS)
        : document;


    /*
     * 3. Prompt dell'agente
     */

    const prompt = `
Sei DocChat, un assistente specializzato
nell'analisi del documento fornito.

DEVI rispettare queste regole:

1. Rispondi esclusivamente usando le
   informazioni presenti nel documento.

2. NON utilizzare conoscenze esterne.

3. NON inventare informazioni.

4. Se la risposta non è contenuta nel documento,
   rispondi:

   "Non trovo questa informazione nel documento."

5. Rispondi in italiano.

6. Sii chiaro e diretto.

7. Quando possibile indica la sezione,
   il titolo o il passaggio rilevante
   del documento.

-----------------------------------

DOCUMENTO:

${documentText}

-----------------------------------

DOMANDA DELL'UTENTE:

${question}
`;


    /*
     * 4. Chiamata a Gemini
     */

    const response =
      await ai.models.generateContent({

        model: "gemini-2.5-flash-lite",

        contents: prompt

      });


    const answer =
      response.text ||
      "Non è stata trovata una risposta.";


    return res.status(200).json({
      answer
    });


  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error:
        "Si è verificato un errore durante la ricerca."
    });

  }
}
