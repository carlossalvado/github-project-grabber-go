-- Função para buscar fotos do agente
CREATE OR REPLACE FUNCTION public.get_agent_photos(p_agent_id uuid)
RETURNS TABLE (
  id uuid,
  photo_url text,
  thumbnail_url text,
  credit_cost integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.id,
    ap.photo_url,
    ap.thumbnail_url,
    ap.credit_cost
  FROM public.agent_photos ap
  WHERE ap.agent_id = p_agent_id
  ORDER BY ap.created_at ASC;
END;
$$;