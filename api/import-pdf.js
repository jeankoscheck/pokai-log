export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pdfBase64 } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
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
                text: 'Analise este PDF de treino e extraia os treinos presentes. Responda APENAS com um JSON valido, sem texto adicional, sem markdown, sem blocos de codigo. Formato exato: [{"name":"Treino A","description":"descricao breve","exercises":[{"name":"nome do exercicio","plannedSets":3,"plannedReps":"8-10","plannedLoad":"60kg","cues":"dica tecnica se houver"}]}]. Se houver multiplos treinos (A, B, C...), retorne todos no array. plannedSets deve ser numero inteiro.',
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic error:', data);
      return res.status(500).json({ error: 'Erro na API da Anthropic', detail: data });
    }

    const text = data.content && data.content[0] && data.content[0].text ? data.content[0].text : '';
    
    // Tenta extrair JSON do texto mesmo que tenha texto extra
    let parsed;
    try {
      // Primeiro tenta parse direto
      const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      // Se falhar, tenta encontrar o array JSON dentro do texto
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('Nenhum JSON encontrado na resposta');
      parsed = JSON.parse(match[0]);
    }

    return res.status(200).json({ treinos: parsed });
  } catch (e) {
    console.error('Handler error:', e);
    return res.status(500).json({ error: 'Erro ao processar PDF', detail: e.message });
  }
}
