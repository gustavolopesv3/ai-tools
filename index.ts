import { OpenAI } from 'openai';
import * as fs from 'fs/promises';
import * as path from 'path';

// Configuração do OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Caminho do arquivo JSON
const AGENDA_FILE = path.join(process.cwd(), 'agenda.json');

// Interface para tipagem dos agendamentos
interface Agendamento {
  id: number;
  data_hora: string;
  descricao: string;
}

// Função auxiliar para ler o arquivo JSON
async function readAgenda(): Promise<Agendamento[]> {
  try {
    console.log('DIR AGENDA', AGENDA_FILE);
    const data = await fs.readFile(AGENDA_FILE, 'utf-8');
    return JSON.parse(data) as Agendamento[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// Função auxiliar para escrever no arquivo JSON
async function writeAgenda(agendamentos: Agendamento[]): Promise<void> {
 try {
  console.log('Write agenda');
  await fs.writeFile(AGENDA_FILE, JSON.stringify(agendamentos, null, 2), 'utf-8');
 } catch (error) {
  console.error('Erro ao agendar')
 }
}

// 📌 Definição das funções reais
export const functions: {
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
      const response = await fetch('https://api.spacexdata.com/v4/launches/upcoming');
      const launches = await response.json();
      const nextLaunch = launches[0];
      return {
        result: `O próximo lançamento da SpaceX será ${nextLaunch.name} em ${new Date(nextLaunch.date_local).toLocaleString()}.`,
      };
    } catch (error) {
      return { result: 'Não consegui informações sobre o próximo lançamento da SpaceX.' };
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

  verificarHorarioLivre: async ({ dataHora }: { dataHora: string }) => {
    console.log('🔍 Verificando horário:', dataHora);
    try {
      const date = new Date(dataHora);
      if (isNaN(date.getTime())) {
        return { result: 'Formato de data inválido. Use: AAAA-MM-DD HH:MM' };
      }
      const dataHoraStr = date.toISOString().replace('T', ' ').slice(0, 16);

      const agendamentos = await readAgenda();
      const isOccupied = agendamentos.some((agendamento) => agendamento.data_hora === dataHoraStr);

      console.log('Horário ocupado?', isOccupied);

      return {
        result: isOccupied
          ? `O horário ${dataHoraStr} já está ocupado.`
          : `O horário ${dataHoraStr} está livre.`,
      };
    } catch (error) {
      console.error('Erro ao verificar horário');
      return { result: 'Erro ao verificar horário: ' + (error as Error).message };
    }
  },

  agendarCompromisso: async ({ dataHora, descricao }: { dataHora: string; descricao: string }) => {
    console.log('🔍 Agendando compromisso:', dataHora, descricao);
    try {
      const date = new Date(dataHora);
      if (isNaN(date.getTime())) {
        return { result: 'Formato de data inválido. Use: AAAA-MM-DD HH:MM' };
      }
      const dataHoraStr = date.toISOString().replace('T', ' ').slice(0, 16);

      const agendamentos = await readAgenda();
      // const isOccupied = agendamentos.some((agendamento) => agendamento.data_hora === dataHoraStr);

      // if (isOccupied) {
      //   return { result: `Horário ${dataHoraStr} já ocupado!` };
      // }

      const newId = agendamentos.length > 0 ? Math.max(...agendamentos.map((a) => a.id)) + 1 : 1;
      const novoAgendamento: Agendamento = { id: newId, data_hora: dataHoraStr, descricao };
      agendamentos.push(novoAgendamento);
      await writeAgenda(agendamentos);

      return { result: `Compromisso '${descricao}' agendado com sucesso para ${dataHoraStr}.` };
    } catch (error) {
      return { result: 'Erro ao agendar: ' + (error as Error).message };
    }
  },
};

// 📌 Definição das ferramentas (tools) para o OpenAI
export const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'getWeather',
      description: 'Obtém a previsão do tempo para uma cidade.',
      parameters: {
        type: 'object',
        properties: { city: { type: 'string', description: 'Nome da cidade' } },
        required: ['city'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getNextLaunchSpaceX',
      description: 'Obtém informações sobre o próximo lançamento da SpaceX.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getCountryInfo',
      description: 'Obtém informações sobre um país.',
      parameters: {
        type: 'object',
        properties: { country: { type: 'string', description: 'Nome do país' } },
        required: ['country'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'verificarHorarioLivre',
      description: 'Verifica se um horário está livre na agenda.',
      parameters: {
        type: 'object',
        properties: { dataHora: { type: 'string', description: 'Data e hora (AAAA-MM-DD HH:MM)' } },
        required: ['dataHora'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'agendarCompromisso',
      description: 'Agenda um compromisso em um horário específico.',
      parameters: {
        type: 'object',
        properties: {
          dataHora: { type: 'string', description: 'Data e hora (AAAA-MM-DD HH:MM)' },
          descricao: { type: 'string', description: 'Descrição do compromisso' },
        },
        required: ['dataHora', 'descricao'],
      },
    },
  },
];

// 🔥 Função principal com Tools
export async function chatWithTools(userMessage: string): Promise<string> {
  try {
    const initialResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Você é um assistente de agendamento. Quando o usuário pedir para agendar algo, use diretamente a função agendarCompromisso.' },
        { role: 'user', content: userMessage },
      ],
      tools: tools,
      tool_choice: 'auto',
    });

    const message = initialResponse.choices[0].message;

    if (message.tool_calls) {
      const toolCall = message.tool_calls[0];
      const functionName = toolCall.function.name as keyof typeof functions;
      const args = JSON.parse(toolCall.function.arguments);
      console.log('🔹 Chamando ferramenta:', functionName, 'com argumentos:', args);

      const functionResult = await functions[functionName](args);
      console.log('✅ Resultado bruto:', functionResult.result);

      // Se for uma verificação de horário e o pedido original era para agendar
      if (functionName === 'verificarHorarioLivre' && userMessage.toLowerCase().includes('agende')) {
        if (functionResult.result.includes('está livre')) {
          const agendarArgs = {
            dataHora: args.dataHora,
            descricao: userMessage.match(/com descrição:? (.+)$/i)?.[1] || 'Reunião sem descrição',
          };
          console.log('🔄 Horário livre detectado, agendando diretamente com:', agendarArgs);
          const agendarResult = await functions['agendarCompromisso'](agendarArgs);

          // Enviar apenas o resultado do agendamento como resposta
          const finalResponse = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'user', content: userMessage },
              message,
              { role: 'tool', content: JSON.stringify(agendarResult), tool_call_id: toolCall.id }, // Usamos o mesmo tool_call_id
            ],
          });

          const finalMessage = finalResponse.choices[0].message.content;
          console.log('💬 Resposta final da IA:', finalMessage);
          return finalMessage ?? 'Resposta não disponível.';
        }
      }

      const finalResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {role: 'system', content: ` hoje é ${new Date().toLocaleDateString()}, você é uma secretaria virtual que faz agendamentos no horario de brasilia`},
          { role: 'user', content: userMessage },
          message,
          { role: 'tool', content: JSON.stringify(functionResult), tool_call_id: toolCall.id },
        ],
      });

      const finalMessage = finalResponse.choices[0].message.content;
      console.log('💬 Resposta final da IA:', finalMessage);
      return finalMessage ?? 'Resposta não disponível.';
    } else {
      console.log('💬 Resposta direta da IA:', message.content);
      return message.content ?? 'Resposta não disponível.';
    }
  } catch (error) {
    console.error('❌ Erro:', error);
    return 'Ops, algo deu errado! Tente novamente.';
  }
}

chatWithTools('Verifique se esta a agenda esta livre em 2025-04-04 15:00, se estive agende uma reunião com descrição: teste');