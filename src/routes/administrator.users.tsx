import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Trash2, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  listAdminUsers, createAdminUser, updateAdminUserRole,
  resetAdminUserPassword, deleteAdminUser,
} from "@/lib/admin-users.functions";

export const Route = createFileRoute("/administrator/users")({
  head: () => ({ meta: [{ title: "Pengguna · Admin CMS" }] }),
  component: UsersAdmin,
});

type AdminUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: "admin" | "editor" | "reader" | "user" | null;
  isProtected: boolean;
  createdAt: string;
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin", editor: "Editor", reader: "Reader", user: "—",
};

function UsersAdmin() {
  const { isAdmin, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const list = useServerFn(listAdminUsers);
  const create = useServerFn(createAdminUser);
  const updateRole = useServerFn(updateAdminUserRole);
  const resetPwd = useServerFn(resetAdminUserPassword);
  const del = useServerFn(deleteAdminUser);

  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // create dialog
  const [openNew, setOpenNew] = useState(false);
  const [nEmail, setNEmail] = useState("");
  const [nPwd, setNPwd] = useState("");
  const [nName, setNName] = useState("");
  const [nRole, setNRole] = useState<"admin" | "editor" | "reader">("editor");
  const [creating, setCreating] = useState(false);

  // password dialog
  const [pwdTarget, setPwdTarget] = useState<AdminUser | null>(null);
  const [pwdValue, setPwdValue] = useState("");

  // delete dialog
  const [delTarget, setDelTarget] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      navigate({ to: "/administrator" });
      return;
    }
    reload();
  }, [authLoading, isAdmin]);

  async function reload() {
    setLoading(true);
    try {
      const data = await list();
      setItems(data as AdminUser[]);
    } catch (e: any) {
      toast.error(e.message ?? "Gagal memuat pengguna");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!nEmail || !nPwd) return toast.error("Email & password wajib diisi");
    if (nPwd.length < 8) return toast.error("Password minimal 8 karakter");
    setCreating(true);
    try {
      await create({ data: { email: nEmail.trim(), password: nPwd, displayName: nName.trim() || undefined, role: nRole } });
      toast.success("Pengguna dibuat");
      setOpenNew(false);
      setNEmail(""); setNPwd(""); setNName(""); setNRole("editor");
      reload();
    } catch (e: any) {
      toast.error(e.message ?? "Gagal membuat pengguna");
    } finally {
      setCreating(false);
    }
  }

  async function handleRoleChange(u: AdminUser, role: "admin" | "editor" | "reader") {
    if (u.role === role) return;
    setSavingId(u.id);
    try {
      await updateRole({ data: { userId: u.id, role } });
      toast.success("Role diperbarui");
      setItems((prev) => prev.map((x) => (x.id === u.id ? { ...x, role } : x)));
    } catch (e: any) {
      toast.error(e.message ?? "Gagal memperbarui role");
    } finally {
      setSavingId(null);
    }
  }

  async function handleResetPwd() {
    if (!pwdTarget) return;
    if (pwdValue.length < 8) return toast.error("Password minimal 8 karakter");
    setSavingId(pwdTarget.id);
    try {
      await resetPwd({ data: { userId: pwdTarget.id, password: pwdValue } });
      toast.success("Password direset");
      setPwdTarget(null);
      setPwdValue("");
    } catch (e: any) {
      toast.error(e.message ?? "Gagal reset password");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete() {
    if (!delTarget) return;
    setSavingId(delTarget.id);
    try {
      await del({ data: { userId: delTarget.id } });
      toast.success("Pengguna dihapus");
      setItems((prev) => prev.filter((x) => x.id !== delTarget.id));
      setDelTarget(null);
    } catch (e: any) {
      toast.error(e.message ?? "Gagal menghapus");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Pengguna</h1>
          <p className="text-sm text-muted-foreground">Kelola akun admin, editor, dan reader.</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Tambah Pengguna</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah Pengguna</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={nEmail} onChange={(e) => setNEmail(e.target.value)} placeholder="nama@contoh.com" />
              </div>
              <div className="space-y-1">
                <Label>Nama Tampilan (opsional)</Label>
                <Input value={nName} onChange={(e) => setNName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Password Awal (≥ 8 karakter)</Label>
                <Input type="text" value={nPwd} onChange={(e) => setNPwd(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <Select value={nRole} onValueChange={(v) => setNRole(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin · semua akses</SelectItem>
                    <SelectItem value="editor">Editor · ubah konten</SelectItem>
                    <SelectItem value="reader">Reader · hanya lihat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenNew(false)}>Batal</Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Buat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3">Email</th>
                <th className="p-3">Nama</th>
                <th className="p-3">Role</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => {
                const isSelf = u.id === user?.id;
                const locked = u.isProtected;
                return (
                  <tr key={u.id} className="border-t">
                    <td className="p-3 align-middle">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{u.email}</span>
                        {locked && (
                          <span title="Akun admin pertama" className="text-primary">
                            <ShieldCheck className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 align-middle text-muted-foreground">{u.displayName ?? "—"}</td>
                    <td className="p-3 align-middle">
                      <Select
                        value={u.role && u.role !== "user" ? u.role : ""}
                        onValueChange={(v) => handleRoleChange(u, v as any)}
                        disabled={locked || savingId === u.id}
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue placeholder={u.role === "user" ? "—" : "Pilih"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="reader">Reader</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3 align-middle text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          size="sm" variant="outline"
                          onClick={() => { setPwdTarget(u); setPwdValue(""); }}
                          title="Reset password"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          onClick={() => setDelTarget(u)}
                          disabled={locked || isSelf}
                          title={locked ? "Admin pertama tidak dapat dihapus" : isSelf ? "Tidak dapat menghapus akun sendiri" : "Hapus"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Belum ada pengguna.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reset password dialog */}
      <Dialog open={!!pwdTarget} onOpenChange={(o) => !o && setPwdTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset Password</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{pwdTarget?.email}</p>
          <div className="space-y-1">
            <Label>Password Baru (≥ 8 karakter)</Label>
            <Input type="text" value={pwdValue} onChange={(e) => setPwdValue(e.target.value)} autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwdTarget(null)}>Batal</Button>
            <Button onClick={handleResetPwd} disabled={savingId === pwdTarget?.id}>
              {savingId === pwdTarget?.id && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={!!delTarget} onOpenChange={(o) => !o && setDelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pengguna ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun <b>{delTarget?.email}</b> beserta rolenya akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
