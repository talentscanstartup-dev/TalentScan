// utils/booleanParser.js
// Utilitário para converter busca booleana em tsquery do PostgreSQL

/**
 * Converte uma busca booleana (ex: ("React" OR "Vue") AND "Node.js")
 * em uma string de consulta compatível com tsquery do PostgreSQL (ex: (React | Vue) & Node.js).
 * 
 * @param {string} query - A busca textual booleana informada pelo usuário.
 * @returns {string} - String formatada para o PostgreSQL tsquery.
 */
export const parseBooleanQuery = (query) => {
  if (!query || typeof query !== 'string') return '';

  // 1. Limpeza inicial de espaços extras
  let parsed = query.trim();

  // 2. Substituir operadores lógicos (case-insensitive) pelos operadores do Postgres
  // AND -> &
  // OR  -> |
  // NOT -> !
  parsed = parsed
    .replace(/\bAND\b/gi, '&')
    .replace(/\bOR\b/gi, '|')
    .replace(/\bNOT\b/gi, '!');

  // 3. Processar termos com aspas duplas (frases exatas)
  // No tsquery, frases são representadas usando o operador de proximidade <-> (follow-by)
  // Exemplo: "React Native" -> 'React' <-> 'Native'
  parsed = parsed.replace(/"([^"]+)"/g, (match, phrase) => {
    const words = phrase
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 0)
      .map(w => `'${w}':*`);
    
    return words.length > 0 ? `(${words.join(' <-> ')})` : '';
  });

  // 4. Formatar termos simples que não possuem aspas e não são operadores
  // Adiciona o caractere de wildcard ':*' para prefix matching (ex: React -> 'React':*)
  // Identifica palavras normais excluindo operadores (&, |, !, parênteses)
  parsed = parsed.replace(/\b(?!&|\||!)[a-zA-Z0-9_\-+#.]+\b/g, (word) => {
    return `'${word}':*`;
  });

  // 5. Limpar espaços extras ao redor dos operadores
  parsed = parsed
    .replace(/\s*&\s*/g, ' & ')
    .replace(/\s*\|\s*/g, ' | ')
    .replace(/\s*!\s*/g, ' !')
    .replace(/\s*\(\s*/g, '(')
    .replace(/\s*\)\s*/g, ')');

  return parsed;
};
