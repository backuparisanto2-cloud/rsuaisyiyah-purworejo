import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { ForbiddenView } from "@/components/admin/AccessBanner";
import Editor from "@/components/page-editor/Editor";

export const Route = createFileRoute("/administrator/test-page-editor")({
  head: () => ({ meta: [{ title: "Test Page Editor · Admin" }] }),
  component: TestPageEditorPage,
});

function TestPageEditorPage() {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <ForbiddenView title="Test Page Editor khusus Administrator" />;
  return <Editor />;
}
