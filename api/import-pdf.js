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

    if (!pdfBase64) {
      return res.status(400).json({ error: 'PDF não recebido' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Chave de API não configurada' });
    }

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
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: pdfBase64,
                },
              },
              {
                type: 'text',
                text: 'Analise este PDF de treino e extraia os treinos presentes. Responda APENAS com um array JSON valido, sem texto adicional, sem markdown, sem blocos de codigo. Formato: [{"name":"Treino A","description":"descricao breve","exercises":[{"name":"nome do exercicio","plannedSets":3,"plannedReps":"8-10","plannedLoad":"","cues":"dica tecnica"}]}]. plannedSets deve ser numero inteiro.',
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
    console.log('Resposta da IA:', text.slice(0, 200));

    let parsed;
    try {
      parsed = JSON.parse(text.trim());
    } catch {
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) {
        return res.status(500).json({ error: 'JSON inválido na resposta', raw: text.slice(0, 500) });
      }
      parsed = JSON.parse(match[0]);
    }

    return res.status(200).json({ treinos: parsed });
  } catch (e) {
    console.error('Erro geral:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
