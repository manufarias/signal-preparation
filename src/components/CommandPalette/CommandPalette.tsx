import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { CalendarDays, User, Plus, Calendar } from "lucide-react";
import usePatients from "../../hooks/usePatients";
import { useDebounce } from "../../hooks/useDebounce";
import { PatientDrawer } from "../PatientDrawer/PatientDrawer";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const debouncedSearch = useDebounce(search, 300);
  const { patients } = usePatients(debouncedSearch);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function go(path: string) {
    navigate(path);
    setOpen(false);
    setSearch("");
  }

  function openDrawer() {
    setOpen(false);
    setSearch("");
    setTimeout(() => setDrawerOpen(true), 150);
  }

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setSearch("");
        }}
      >
        <CommandInput
          autoFocus
          placeholder="Go to... or search patients"
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>

          {/* Schedule actions — siempre visibles */}
          {!search && (
            <>
              <CommandGroup heading="Schedule">
                <CommandItem
                  onSelect={() => {
                    go("/");
                  }}
                >
                  <CalendarDays
                    size={14}
                    className="mr-2 text-sp-primary-light"
                  />
                  Today's schedule
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    go("/?mode=week");
                  }}
                >
                  <Calendar size={14} className="mr-2 text-sp-primary-light" />
                  This week
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    go("/?mode=month");
                  }}
                >
                  <Calendar size={14} className="mr-2 text-sp-primary-light" />
                  This month
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading="Patients">
                <CommandItem onSelect={openDrawer}>
                  <Plus size={14} className="mr-2 text-sp-primary-light" />
                  New patient
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    go("/patients");
                    setSearch("");
                  }}
                >
                  <User size={14} className="mr-2 text-sp-primary-light" />
                  Browse all patients
                </CommandItem>
              </CommandGroup>
            </>
          )}

          {/* Resultados de búsqueda — solo cuando hay search */}
          {search && (
            <CommandGroup heading="Patients">
              {patients.map((p) => (
                <CommandItem key={p.id} onSelect={() => go(`/patient/${p.id}`)}>
                  <User size={14} className="mr-2 text-sp-primary-light" />
                  <span className="font-medium">
                    {p.name[0].given[0]} {p.name[0].family}
                  </span>
                  <span className="ml-2 text-[11px] text-sp-text-secondary">
                    {new Date().getFullYear() -
                      new Date(p.birthDate).getFullYear()}
                    y{" · "}
                    {p.gender === "male"
                      ? "M"
                      : p.gender === "female"
                        ? "F"
                        : p.gender}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>

      <PatientDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => setDrawerOpen(false)}
      />
    </>
  );
}
