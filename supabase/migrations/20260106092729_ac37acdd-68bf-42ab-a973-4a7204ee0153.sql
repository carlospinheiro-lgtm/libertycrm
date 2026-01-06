-- Atribuir role diretor_geral ao utilizador existente
INSERT INTO user_roles (user_id, role, agency_id)
VALUES (
  '465dd696-8277-4034-9a19-ebf7308c2dca', -- Carlos Pinheiro
  'diretor_geral',
  'fbeac105-6278-442a-8986-ad56fb4f89e4'  -- Liberty Braga
)
ON CONFLICT DO NOTHING;