"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ArrowRight,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Compass,
  Search,
} from "lucide-react";
import { Investigation } from "@/lib/types/investigation";
import { storageAdapter } from "../../lib/db/storage-adapter";

export default function FieldJournalIndexPage() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "completed" | "in_progress">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      const list = await storageAdapter.listInvestigations();
      setInvestigations(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (confirm("Are you sure you want to delete this investigation from your journal?")) {
      await storageAdapter.deleteInvestigation(id);
      loadData();
    }
  };

  const filtered = investigations
    .filter((inv) => (filter === "all" ? true : inv.status === filter))
    .filter(
      (inv) =>
        inv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.centralQuestion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-paper-300 pb-6 gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-stone-500">
            <span>The Field Desk</span>
            <span>&rarr;</span>
            <span className="text-forest font-bold">Field Journal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-forest">
            Field Journal & Archives
          </h1>
          <p className="text-sm text-stone-600 max-w-xl">
            A permanent log of empirical outdoor investigations, observed clues, evaluated hypotheses, and naturalist reflections.
          </p>
        </div>

        <Link
          href="/investigate/new"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded bg-forest text-paper-100 text-xs font-mono font-bold hover:bg-forest-600 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Compass className="w-4 h-4" />
          <span>New Investigation</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {(["all", "completed", "in_progress"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors capitalize ${
                filter === s
                  ? "bg-forest text-paper-100 font-bold"
                  : "bg-paper-200 text-stone-700 hover:bg-paper-300"
              }`}
            >
              {s.replace(/_/g, " ")} (
              {s === "all"
                ? investigations.length
                : investigations.filter((i) => i.status === s).length}
              )
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search inquiries, categories..."
            className="w-full pl-9 pr-3 py-2 rounded-md border border-paper-300 bg-white text-xs outline-none focus:border-forest"
          />
        </div>
      </div>

      {/* Inquiries Grid */}
      {loading ? (
        <div className="paper-card rounded-lg p-12 text-center text-stone-500 font-mono text-sm">
          Loading journal records...
        </div>
      ) : filtered.length === 0 ? (
        <div className="paper-card rounded-lg p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="font-serif font-bold text-lg text-charcoal-800">No journal entries found</h3>
          <p className="text-xs text-stone-600">
            {searchQuery
              ? "No inquiries matched your search term."
              : "You haven't conducted any investigations under this category yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((inv) => (
            <div
              key={inv.id}
              className="paper-card rounded-lg p-5 flex flex-col justify-between hover:border-forest-300 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-stone-500">
                  <span className="capitalize text-botanical-amber font-semibold">
                    {inv.category.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {inv.status === "completed" ? "Concluded" : "In Progress"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, inv.id)}
                      className="text-stone-400 hover:text-rose-600"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <Link href={`/journal/${inv.id}`} className="block group-hover:text-forest transition-colors">
                  <h3 className="font-serif font-bold text-lg text-charcoal-900 group-hover:text-forest">
                    {inv.title}
                  </h3>
                </Link>

                <p className="text-xs text-stone-600 italic line-clamp-2">
                  &ldquo;{inv.centralQuestion}&rdquo;
                </p>

                {inv.conclusion && (
                  <div className="p-2.5 rounded bg-forest-50/50 border border-forest-100 text-[11px] text-forest-900 line-clamp-2">
                    <strong>Finding:</strong> {inv.conclusion}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-paper-200 mt-4 flex items-center justify-between text-xs font-mono text-stone-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(inv.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {inv.observations.length} clue(s)
                </span>
                <Link
                  href={inv.status === "completed" ? `/journal/${inv.id}` : `/investigate/${inv.id}`}
                  className="font-bold text-forest hover:underline flex items-center gap-1"
                >
                  <span>{inv.status === "completed" ? "Read Dossier" : "Resume"}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
