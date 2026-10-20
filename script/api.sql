CREATE TABLE tarefas_treino;



CREATE TABLE tarefas (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  concluida BOOLEAN DEFAULT FALSE,
  criada_em TIMESTAMP DEFAULT NOW()
);  