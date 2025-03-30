import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 📌 Definição das funções reais
const functions: {
  [key: string]: (args: any) => Promise<{ result: string }>;
} = {
  getWeather: async ({ city }: { city: string }) => {
    console.log('🔍 Buscando clima para:', city);
    try {
      const response = await fetch(`https://wttr.in/${city}?format=%C+%t`);
      const result = await response.text();
      return { result: `O clima em ${city} é ${result.trim()}.` };
    } catch (error) {
      return { result: `Não consegui obter o clima de ${city}. Tente novamente!` };
    }
  },

  getNextLaunchSpaceX: async () => {
    console.log('🔍 Buscando próximo lançamento da SpaceX');
    try {
      const response = await fetch("https://api.spacexdata.com/v4/launches/upcoming");
      const launches = await response.json();
      const nextLaunch = launches[0];
      return {
        result: `O próximo lançamento da SpaceX será ${nextLaunch.name} em ${new Date(nextLaunch.date_local).toLocaleString()}.`,
      };
    } catch (error) {
      return { result: "Não consegui informações sobre o próximo lançamento da SpaceX." };
    }
  },

  getCountryInfo: async ({ country }: { country: string }) => {
    console.log('🔍 Buscando informações sobre:', country);
    try {
      const response = await fetch(`https://restcountries.com/v3.1/name/${country}`);
      const data = await response.json();
      const countryData = data[0];
      return {
        result: `${country} tem como capital ${countryData.capital[0]} e uma população de aproximadamente ${countryData.population.toLocaleString()} habitantes.`,
      };
    } catch (error) {
      return { result: `Não encontrei informações sobre ${country}. Verifique o nome!` };
    }
  },
};

// 📌 Definição das ferramentas (tools) para o OpenAI com tipagem explícita
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "getWeather",
      description: "Obtém a previsão do tempo para uma cidade.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "Nome da cidade" },
        },
        required: ["city"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getNextLaunchSpaceX",
      description: "Obtém informações sobre o próximo lançamento da SpaceX.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "getCountryInfo",
      description: "Obtém informações sobre um país.",
      parameters: {
        type: "object",
        properties: {
          country: { type: "string", description: "Nome do país" },
        },
        required: ["country"],
      },
    },
  },
];

// 🔥 Função principal com Tools
async function chatWithTools(userMessage: string) {
  try {
    // Primeira chamada à API para verificar se uma ferramenta será usada
    const initialResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: userMessage }],
      tools: tools,
      tool_choice: "auto",
    });

    const message = initialResponse.choices[0].message;

    if (message.tool_calls) {
      const toolCall = message.tool_calls[0];
      const functionName = toolCall.function.name as keyof typeof functions;
      const args = JSON.parse(toolCall.function.arguments);
      console.log("🔹 Chamando ferramenta:", functionName, "com argumentos:", args);

      const functionResult = await functions[functionName](args);
      console.log("✅ Resultado bruto:", functionResult.result);

      const finalResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "user", content: userMessage },
          message,
          {
            role: "tool",
            content: JSON.stringify(functionResult),
            tool_call_id: toolCall.id,
          },
        ],
      });

      const finalMessage = finalResponse.choices[0].message.content;
      console.log("💬 Resposta final da IA:", finalMessage);
      return finalMessage;
    } else {
      console.log("💬 Resposta direta da IA:", message.content);
      return message.content;
    }
  } catch (error) {
    console.error("❌ Erro:", error);
    return "Ops, algo deu errado! Tente novamente.";
  }
}

// Teste
// chatWithTools("Qual é o tempo atual em Brasília?")
chatWithTools("Qual é o próximo lançamento da SpaceX?")
// chatWithTools("Me fale sobre o Brasil")