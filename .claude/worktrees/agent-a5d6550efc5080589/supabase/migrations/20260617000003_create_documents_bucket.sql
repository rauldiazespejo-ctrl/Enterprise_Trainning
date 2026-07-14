-- Crear bucket 'documents' para PPTX, PDFs, imágenes de diapositivas
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública (para URLs de descarga)
DROP POLICY IF EXISTS "documents_public_read" ON storage.objects;
CREATE POLICY "documents_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Usuarios autenticados pueden subir
DROP POLICY IF EXISTS "documents_auth_insert" ON storage.objects;
CREATE POLICY "documents_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Usuarios autenticados pueden actualizar
DROP POLICY IF EXISTS "documents_auth_update" ON storage.objects;
CREATE POLICY "documents_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');

-- Usuarios autenticados pueden borrar
DROP POLICY IF EXISTS "documents_auth_delete" ON storage.objects;
CREATE POLICY "documents_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
