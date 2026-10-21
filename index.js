import express from 'express';
import rateLimit from 'express-rate-limit';
import pool from './db.js';

const app = express();
app.use(express.json());

//  CORREÇÃO (6): Limitação de requisições por IP 
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
  message: { erro: 'Muitas requisições enviadas por este IP. Tente novamente mais tarde.' }
});

app.use(limiter);

// ---------------------------------------------------------------------------
// GET /tarefas — lista todas as tarefas
// ---------------------------------------------------------------------------
app.get('/tarefas', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM tarefas ORDER BY id');
    res.json(resultado.rows);
  } catch (error) {
    //  CORREÇÃO (2): Log gravado no servidor; resposta genérica ao cliente
    console.error('Erro interno:', error);
    res.status(500).json({ erro: 'Erro ao buscar tarefas' });
  }
});

// ---------------------------------------------------------------------------
// GET /tarefas/buscar?termo=... — busca tarefas pelo título
// ---------------------------------------------------------------------------
app.get('/tarefas/buscar', async (req, res) => {
  try {
    const { termo } = req.query;

    if (!termo || typeof termo !== 'string' || termo.trim().length === 0) {
      return res.status(400).json({ erro: 'O parâmetro "termo" é obrigatório e deve ser um texto.' });
    }

    //  CORREÇÃO (3): Uso de query parametrizada ($1) 
    const sql = 'SELECT * FROM tarefas WHERE titulo ILIKE $1 ORDER BY id';
    const resultado = await pool.query(sql, [`%${termo.trim()}%`]);

    res.json(resultado.rows);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ erro: 'Erro ao realizar busca' });
  }
});

// ---------------------------------------------------------------------------
// POST /tarefas — cria uma tarefa
// ---------------------------------------------------------------------------
app.post('/tarefas', async (req, res) => {
  try {
    const { titulo } = req.body;

    //  CORREÇÃO (4): Validação de tipo, presença e tamanho máximo
    if (!titulo || typeof titulo !== 'string' || titulo.trim().length === 0) {
      return res.status(400).json({ erro: 'O campo "titulo" é obrigatório e deve ser um texto válido.' });
    }

    if (titulo.length > 255) {
      return res.status(400).json({ erro: 'O título deve ter no máximo 255 caracteres.' });
    }

    //  CORREÇÃO (4): Query parametrizada ($1) 
    const sql = 'INSERT INTO tarefas (titulo, concluida) VALUES ($1, false) RETURNING *';
    const resultado = await pool.query(sql, [titulo.trim()]);

    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ erro: 'Erro ao criar tarefa' });
  }
});

// ---------------------------------------------------------------------------
// PUT /tarefas/:id — marca uma tarefa como concluída
// ---------------------------------------------------------------------------
app.put('/tarefas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      'UPDATE tarefas SET concluida = true WHERE id = $1 RETURNING *',
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Tarefa não encontrada' });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ erro: 'Erro ao atualizar tarefa' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /tarefas/:id — apaga uma tarefa
// ---------------------------------------------------------------------------
app.delete('/tarefas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    //  CORREÇÃO (5): Verificação do resultado da remoção no banco
    const resultado = await pool.query('DELETE FROM tarefas WHERE id = $1 RETURNING *', [id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Tarefa não encontrada' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ erro: 'Erro ao deletar tarefa' });
  }
});

// ---------------------------------------------------------------------------
// Sobe o servidor
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API de tarefas segura rodando em http://localhost:${PORT}`);
});