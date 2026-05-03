export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const pdfBase64 = body?.pdfBase64;

    if (!pdfBase64) return res.status(400).json({ error: 'PDF não recebido' });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Chave de API não configurada' });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
              },
              {
                type: 'text',
                text: `Analise este PDF de programação de treino e extraia TODOS os treinos presentes.

INSTRUÇÕES CRÍTICAS SOBRE DATAS:
- Identifique o período/semana mencionado no PDF (ex: "Semana 5", "27 de abril a 3 de maio", "dia 4 à dia 8")
- Cada treino do PDF corresponde a um dia da semana nesse período, NA ORDEM em que aparecem
- Treino A = primeiro dia do período, Treino B = segundo dia, e assim por diante
- Se o PDF mencionar datas específicas (ex: "Segunda 4/5", "Terça 5/5"), use essas datas diretamente
- Se mencionar apenas um intervalo (ex: "4 à 8 de maio de 2026"), distribua os treinos sequencialmente começando no primeiro dia
- O campo scheduled_date deve estar no formato YYYY-MM-DD
- Se não conseguir determinar a data de um treino, deixe scheduled_date como null

Responda APENAS com um array JSON válido, sem texto adicional, sem markdown, sem blocos de código. Formato exato:
[
  {
    "name": "Perna A — Segunda",
    "description": "Semana 5 · Metodologia X",
    "scheduled_date": "2026-05-04",
    "exercises": [
      {
        "name": "nome do exercicio",
        "plannedSets": 3,
        "plannedReps": "8-10",
        "plannedLoad": "",
        "cues": "dica tecnica se houver"
      }
    ]
  }
]

REGRAS:
- plannedSets deve ser número inteiro
- Se houver múltiplos treinos (A, B, C, D, E...), retorne TODOS no array
- Inclua TODOS os exercícios de cada treino, incluindo aquecimento e desafios
- O nome do treino deve incluir o dia da semana se mencionado (ex: "Perna A — Segunda")
- A descrição deve incluir a semana e metodologia (ex: "Semana 5 · Stato-Dynamic")`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic error:', JSON.stringify(data));
      return res.status(500).json({ error: 'Erro na API', detail: data });
    }

    const text = data?.content?.[0]?.text || '';
    console.log('Resposta IA (primeiros 300 chars):', text.slice(0, 300));

    let parsed;
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) return res.status(500).json({ error: 'JSON inválido na resposta', raw: text.slice(0, 500) });
      parsed = JSON.parse(match[0]);
    }

    return res.status(200).json({ treinos: parsed });
  } catch (e) {
    console.error('Erro geral:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
