-- Inserir agências iniciais
INSERT INTO agencies (name, remax_code, is_active)
VALUES 
  ('Liberty Braga', 'LIB-BRA', true),
  ('Liberty Barcelos', 'LIB-BAR', true),
  ('Liberty Porto', 'LIB-POR', true),
  ('Liberty Guimarães', 'LIB-GUI', true)
ON CONFLICT DO NOTHING;