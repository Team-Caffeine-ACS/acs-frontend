
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, FileDown, Printer, Eye, Filter } from "lucide-react";

export default function SearchPage() {
  return (
    <div className="flex h-screen bg-[#f6f6f8] dark:bg-[#101622]">

      
      <main className="flex-1 flex flex-col overflow-hidden">


        {/* Breadcrumb-stiilis päis */}
        <div className="px-8 py-4 flex items-center gap-2 text-sm border-b bg-white dark:bg-slate-900">
          <span className="text-muted-foreground">Pääsla</span>
          <span className="text-slate-300">/</span>
          <span className="font-semibold">Külastajate täpsem otsing</span>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          
          {/* FILTRID */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Filter className="h-5 w-5 text-[#1152d4]" />
                Otsingu filtrid
              </h2>
              <Button variant="link" className="text-[#1152d4] font-semibold">
                Tühjenda kõik filtrid
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Külastaja nimi</label>
                <Input placeholder="Ees- ja perekonnanimi" className="bg-slate-50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Dokumendi nr</label>
                <Input placeholder="Pass või ID-kaart" className="bg-slate-50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Vastuvõtja</label>
                <Input placeholder="Töötaja nimi" className="bg-slate-50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Ajavahemik</label>
                <Input placeholder="01.01 - 31.01" className="bg-slate-50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Staatus</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm">
                  <option>Kõik staatused</option>
                  <option>Hoones</option>
                  <option>Lahkunud</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button className="bg-[#1152d4] hover:bg-[#0e43ad] px-8">
                <Search className="mr-2 h-4 w-4" /> Teosta otsing
              </Button>
            </div>
          </section>

          {/* TABEL */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-500">Leitud <span className="font-bold text-slate-900">128</span> tulemust</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="font-bold text-[10px]">
                  <FileDown className="mr-1 h-3 w-3" /> EXCEL
                </Button>
                <Button variant="outline" size="sm" className="font-bold text-[10px]">
                  <Printer className="mr-1 h-3 w-3" /> PRINDI
                </Button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold text-[10px] uppercase">Külastaja</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase">Dokument</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase">Vastuvõtja</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase text-center">Staatus</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div className="font-bold text-sm">Jüri Tamm</div>
                      <div className="text-[10px] text-slate-400">AS LOGISTIKA GRUPP</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">AA1234567</TableCell>
                    <TableCell>
                      <div className="text-sm">Andres Kuusk</div>
                      <div className="text-[10px] text-slate-400">IT osakond</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600 font-bold text-[10px]">LAHKUNUD</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-[#1152d4]">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {/* Siia saab lisada rohkem ridu... */}
                </TableBody>
              </Table>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}