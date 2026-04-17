"use client";

import { useEffect, useId, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import { adminUsersApi, type AdminUserResponse, type UserRole } from "@/lib/api/adminUsers";
import { ApiError } from "@/lib/apiClient";

const ROLES: UserRole[] = ["VISITOR", "RECEPTIONIST", "SECURITY_CHIEF", "ADMIN"];

const ROLE_LABELS: Record<UserRole, string> = {
  VISITOR: "Külastaja",
  RECEPTIONIST: "Administraator",
  SECURITY_CHIEF: "Turvaülem",
  ADMIN: "Süsteemiadmin",
};

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition";

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Parool peab olema vähemalt 8 tähemärki pikk.";
  if (!/[A-Z]/.test(password)) return "Parool peab sisaldama vähemalt ühte suurtähte.";
  if (!/[a-z]/.test(password)) return "Parool peab sisaldama vähemalt ühte väiketähte.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Parool peab sisaldama vähemalt ühte erimärki.";
  return null;
}

export function UserManager() {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState<UserRole>("VISITOR");
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const emailId = useId();
  const passwordId = useId();
  const roleId = useId();

  useEffect(() => {
    adminUsersApi
      .list()
      .then(setUsers)
      .catch((err) => {
        if (err instanceof ApiError) setLoadError(err.message);
      });
  }, []);

  const handleAdd = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAddError(null);
    const pwError = validatePassword(addPassword);
    if (pwError) { setAddError(pwError); return; }

    setIsAdding(true);
    try {
      const created = await adminUsersApi.create({ email: addEmail, password: addPassword, role: addRole });
      setUsers((prev) => [...prev, created]);
      setAddEmail("");
      setAddPassword("");
      setAddRole("VISITOR");
      setShowAddForm(false);
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : "Viga lisamisel.");
    } finally {
      setIsAdding(false);
    }
  };

  const startEdit = (user: AdminUserResponse) => {
    setEditId(user.id);
    setEditEmail(user.email);
    setEditPassword("");
    setEditError(null);
  };

  const cancelEdit = () => { setEditId(null); setEditError(null); };

  const handleSaveEdit = async (id: string) => {
    setEditError(null);
    if (!editEmail && !editPassword) {
      setEditError("Sisesta uus e-post ja/või parool.");
      return;
    }
    if (editPassword) {
      const pwError = validatePassword(editPassword);
      if (pwError) { setEditError(pwError); return; }
    }
    const body: { email?: string; password?: string } = {};
    if (editEmail) body.email = editEmail;
    if (editPassword) body.password = editPassword;

    setIsSavingEdit(true);
    try {
      const updated = await adminUsersApi.update(id, body);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      setEditId(null);
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "Viga salvestamisel.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await adminUsersApi.remove(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "Viga kustutamisel.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loadError) {
    return (
      <p className="text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
        {loadError}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add button / form */}
      {showAddForm ? (
        <form onSubmit={handleAdd} className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
          <p className="text-sm font-bold text-slate-800">Uus kasutaja</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor={emailId} className="block text-xs font-medium text-slate-600">E-post *</label>
              <input id={emailId} type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)}
                placeholder="kasutaja@näide.ee" maxLength={255} required className={inputCls} />
            </div>
            <div className="space-y-1">
              <label htmlFor={roleId} className="block text-xs font-medium text-slate-600">Roll</label>
              <select id={roleId} value={addRole} onChange={(e) => setAddRole(e.target.value as UserRole)} className={inputCls}>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor={passwordId} className="block text-xs font-medium text-slate-600">Parool *</label>
            <input id={passwordId} type="password" value={addPassword} onChange={(e) => setAddPassword(e.target.value)}
              placeholder="Vähemalt 8 tähemärki, suur- ja väiketäht, erimärk" required className={inputCls} />
          </div>

          {addError && (
            <p className="text-xs font-semibold text-rose-600">{addError}</p>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setShowAddForm(false); setAddError(null); }}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Tühista
            </button>
            <button type="submit" disabled={isAdding}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors">
              <AddIcon className="!text-base" /> Lisa kasutaja
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-lg transition-colors">
          <AddIcon className="!text-base" /> Lisa kasutaja
        </button>
      )}

      {editError && (
        <p className="text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          {editError}
        </p>
      )}

      {/* User list */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        {users.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400 text-center">Kasutajaid ei ole.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {users.map((user) => (
              <li key={user.id} className="bg-white hover:bg-slate-50 transition-colors">
                {editId === user.id ? (
                  <div className="px-4 py-3 space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Muuda kasutajat</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-600">Uus e-post</label>
                        <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                          maxLength={255} className={inputCls} />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-600">Uus parool</label>
                        <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)}
                          placeholder="Jäta tühjaks, kui ei muuda" className={inputCls} />
                      </div>
                    </div>
                    {editError && <p className="text-xs font-semibold text-rose-600">{editError}</p>}
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={cancelEdit}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                        <CloseIcon className="!text-base" /> Tühista
                      </button>
                      <button type="button" onClick={() => handleSaveEdit(user.id)} disabled={isSavingEdit}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors">
                        <CheckIcon className="!text-base" /> Salvesta
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="size-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                      <PersonIcon className="!text-base" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {user.person
                          ? `${user.person.givenName} ${user.person.surname}`
                          : user.email}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {user.person ? user.email + " · " : ""}{ROLE_LABELS[user.role]}
                      </p>
                    </div>
                    <button type="button" onClick={() => startEdit(user)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Muuda">
                      <EditIcon className="!text-base" />
                    </button>
                    <button type="button" onClick={() => handleDelete(user.id)} disabled={deletingId === user.id}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-50 transition-colors" title="Kustuta">
                      <DeleteIcon className="!text-base" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
