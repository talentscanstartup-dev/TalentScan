// Serviço para integração com Google Sheets
const SHEET_ID = '1Ql5AEmhWWbIcrwTC0NYKqw5ncwb114l8IE5wQmDGN1Q'
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''

/**
 * Buscar dados do Google Sheets
 */
export const fetchSheetsData = async () => {
  try {
    if (!GOOGLE_API_KEY) {
      console.warn('Google API Key não configurada')
      return { data: [], error: 'API Key não configurada' }
    }

    const range = 'Sheet1!A:H' // Colunas A até H
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${GOOGLE_API_KEY}`

    const response = await fetch(url)
    if (!response.ok) throw new Error('Erro ao buscar dados do Sheet')

    const result = await response.json()
    const rows = result.values || []

    // Pular header (primeira linha)
    if (rows.length <= 1) {
      return { data: [], error: 'Nenhum dado encontrado' }
    }

    const headers = rows[0]
    const candidates = rows.slice(1).map((row, index) => ({
      id: `${Date.now()}-${index}`,
      nome: row[0] || '',
      email: row[1] || '',
      telefone: row[2] || '',
      vaga: row[3] || '',
      pontos: parseFloat(row[4]) || 0,
      habilidades: row[5] ? row[5].split(',').map(h => h.trim()) : [],
      status: row[6] || 'novo',
      dataEnvio: row[7] || new Date().toLocaleDateString('pt-BR'),
      rawData: row
    })).filter(c => c.nome) // Filtrar linhas vazias

    return { data: candidates, error: null }
  } catch (error) {
    console.error('Erro ao buscar dados do Sheets:', error)
    return { data: [], error: error.message }
  }
}

/**
 * Sincronizar dados do Sheets com banco local
 */
export const syncSheetsData = async (supabase) => {
  try {
    const { data: candidates, error: sheetsError } = await fetchSheetsData()
    
    if (sheetsError) return { success: false, error: sheetsError }

    // Salvar no Supabase (criar tabela se não existir)
    const { error: insertError } = await supabase
      .from('candidates_imported')
      .upsert(
        candidates.map(c => ({
          external_id: c.id,
          nome: c.nome,
          email: c.email,
          telefone: c.telefone,
          vaga: c.vaga,
          pontos: c.pontos,
          habilidades: c.habilidades,
          status: c.status,
          data_envio: c.dataEnvio,
          updated_at: new Date()
        })),
        { onConflict: 'external_id' }
      )

    if (insertError) throw insertError

    return { success: true, imported: candidates.length }
  } catch (error) {
    console.error('Erro ao sincronizar dados:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Carregar candidatos importados do banco
 */
export const loadImportedCandidates = async (supabase) => {
  try {
    const { data, error } = await supabase
      .from('candidates_imported')
      .select('*')
      .order('pontos', { ascending: false })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Erro ao carregar candidatos importados:', error)
    return { data: [], error: error.message }
  }
}
