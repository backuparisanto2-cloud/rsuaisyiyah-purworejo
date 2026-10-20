DROP POLICY IF EXISTS chatbot_questions_delete_auth ON public.chatbot_questions;
DROP POLICY IF EXISTS chatbot_questions_select_auth ON public.chatbot_questions;
CREATE POLICY chatbot_questions_select_admin ON public.chatbot_questions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY chatbot_questions_delete_admin ON public.chatbot_questions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
REVOKE INSERT, UPDATE ON public.chatbot_questions FROM authenticated, anon;