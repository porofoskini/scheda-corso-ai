/* Le domande della scheda d'ingresso e d'uscita (stesse della scheda cartacea). Versione dello schema: 1. */
window.SCHEMA = {
  versione: "1",
  domande: [
    { id: "q1", tipo: "multi", testo: "Insegno in", opzioni: ["Infanzia", "Primaria", "Secondaria di primo grado", "Secondaria di secondo grado", "Anche sostegno"] },
    { id: "q2", tipo: "radio", testo: "Uso strumenti di IA (chatbot, immagini, voce…)", opzioni: ["Mai", "Qualche prova", "Ogni settimana", "Ogni giorno"] },
    { id: "q3", tipo: "multi", testo: "Quali strumenti uso", opzioni: ["ChatGPT", "Gemini", "Copilot", "Claude", "Altro", "Nessuno"], altro: "Altro" },
    { id: "q4", tipo: "multi", testo: "Per che cosa la uso", opzioni: ["Scrivere o riscrivere testi", "Preparare lezioni e verifiche", "Cercare informazioni", "Semplificare o tradurre", "Immagini o audio", "Altro"], altro: "Altro" },
    { id: "q5", tipo: "radio", testo: "Quando ricevo una risposta", opzioni: ["La uso così", "La leggo e la correggo", "La controllo su una fonte"] },
    { id: "q6", tipo: "radio", testo: "Con gli alunni", opzioni: ["Non la uso", "Io, per preparare", "La usano gli alunni", "Entrambi"] },
    { id: "q7", tipo: "radio", testo: "Ho inserito dati di alunni in un servizio di IA?", opzioni: ["No", "Non so", "Sì"] },
    { id: "q8", tipo: "radio", testo: "So spiegare la differenza tra chatbot e agente", opzioni: ["No", "Vagamente", "Sì"] },
    { id: "q9a", tipo: "scala", testo: "Quanto mi fido dell'IA (1 poco, 5 molto)", opzioni: ["1", "2", "3", "4", "5"] },
    { id: "q9b", tipo: "scala", testo: "Quanto mi preoccupa (1 poco, 5 molto)", opzioni: ["1", "2", "3", "4", "5"] },
    { id: "q10", tipo: "testo", testo: "Mi aspetto dal corso" },
    { id: "q11", tipo: "testo", testo: "Mi preoccupa" },
    { id: "q12", tipo: "testo", testo: "Per seguire meglio mi serve (testo più grande, pause, altro; facoltativa)" },
    { id: "q13", tipo: "testo", testo: "Che cosa è cambiato per me", solo: "uscita" },
    { id: "q14", tipo: "testo", testo: "Una cosa che proverò nei prossimi giorni", solo: "uscita" },
    { id: "q15", tipo: "testo", testo: "Una domanda che mi porto a casa", solo: "uscita" }
  ]
};
