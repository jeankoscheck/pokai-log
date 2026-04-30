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
        'x-api-key': process.env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
            },
            {
              type: 'text',
              text: `Analise este PDF de treino e extraia os treinos presentes. Responda APENAS com um JSON válido, sem texto adicional, sem markdown, sem blocos de código. Formato exato:
[
  {
    "name": "Treino A",
    "description": "descrição breve",
    "exercises": [
      {
        "name": "nome do exercicio",
        "plannedSets": 3,
        "plannedReps": "8-10",
        "plannedLoad": "60kg",
        "cues": "dica técnica se houver"
      }
    ]
  }
]
Se houver múltiplos treinos (A, B, C...), retorne todos no array. plannedSets deve ser número inteiro.`,
            },
          ],
        }),
      }),
    });

    const data = await response.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    res.status(200).json({ treinos: parsed });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao processar PDF' });
  }
}
