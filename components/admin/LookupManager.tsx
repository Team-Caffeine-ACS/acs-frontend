"use client";

import { useEffect, useId, useRef, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { type LookupRecord } from "@/lib/api/admin";
import { ApiError } from "@/lib/apiClient";

interface Api {
  list(): Promise<LookupRecord[]>;
  create(name: string): Promise<LookupRecord>;
  update(id: string, name: string): Promise<LookupRecord>;
  remove(id: string): Promise<void>;
}

interface Props {
  readonly api: Api;
}

export function LookupManager({ api }: Props) {
  const [records, setRecords] = useState<LookupRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Add form
  const [addName, setAddName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Inline edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const addInputRef = useRef<HTMLInputElement>(null);
  const addInputId = useId();

  useEffect(() => {
    api
      .list()
      .then(setRecords)
      .catch((err) => {
        if (err instanceof ApiError) setLoadError(err.message);
      });
  }, [api]);

  const handleAdd = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = addName.trim();
    if (!name) return;
    setAddError(null);
    setIsAdding(true);
    try {
      const created = await api.create(name);
      setRecords((prev) => [...prev, created]);
      setAddName("");
      addInputRef.current?.focus();
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : "Viga lisamisel.");
    } finally {
      setIsAdding(false);
    }
  };

  const startEdit = (record: LookupRecord) => {
    setEditId(record.id);
    setEditName(record.name);
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditError(null);
  };

  const handleSaveEdit = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    setEditError(null);
    setIsSavingEdit(true);
    try {
      const updated = await api.update(id, name);
      setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setEditId(null);
    } catch (err) {
      setEditError(
        err instanceof ApiError ? err.message : "Viga salvestamisel.",
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.remove(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      // Re-surface delete errors via edit error slot for visibility
      setEditError(
        err instanceof ApiError ? err.message : "Viga kustutamisel.",
      );
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
      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <div className="flex-1 space-y-1">
          <label htmlFor={addInputId} className="sr-only">
            Uue kirje nimi
          </label>
          <input
            id={addInputId}
            ref={addInputRef}
            type="text"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Uue kirje nimi…"
            maxLength={255}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
          />
          {addError && (
            <p className="text-xs font-semibold text-rose-600">{addError}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isAdding || !addName.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
        >
          <AddIcon className="!text-base" />
          Lisa
        </button>
      </form>

      {/* Records list */}
      {editError && (
        <p className="text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          {editError}
        </p>
      )}

      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        {records.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-400 text-center">
            Kirjeid ei ole.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {records.map((record) => (
              <li
                key={record.id}
                className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-colors"
              >
                {editId === record.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(record.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      autoFocus
                      maxLength={255}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-blue-400 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(record.id)}
                      disabled={isSavingEdit || !editName.trim()}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50 transition-colors"
                      title="Salvesta"
                    >
                      <CheckIcon className="!text-base" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Tühista"
                    >
                      <CloseIcon className="!text-base" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-slate-800">
                      {record.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(record)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Muuda"
                    >
                      <EditIcon className="!text-base" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(record.id)}
                      disabled={deletingId === record.id}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-50 transition-colors"
                      title="Kustuta"
                    >
                      <DeleteIcon className="!text-base" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
