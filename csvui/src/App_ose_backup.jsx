import React, { useMemo, useRef, useState } from "react";
import Papa from "papaparse";

/** Heuristic column type inference */
function inferType(values) {
  let n=0,d=0,b=0,s=0;
  const bools = new Set(["true","false","yes","no","y","n","0","1"]);
  for (const v of values) {
    const x = (v ?? "").toString().trim();
    if (x === "") { s++; continue; }
    if (!Number.isNaN(Number(x))) { n++; continue; }
    if (!Number.isNaN(Date.parse(x))) { d++; continue; }
    if (bools.has(x.toLowerCase())) { b++; continue; }
    s++;
  }
  const total = values.length || 1;
  if (n/total > 0.6) return "number";
  if (d/total > 0.6) return "date";
  if (b/total > 0.6) return "boolean";
  return "string";
}

export default function App() {
  const [headers, setHeaders] = useState(null);
  const [rows, setRows] = useState([]);
  const [filename, setFilename] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [hidden, setHidden] = useState({});
  const inputRef = useRef(null);

  const parseFile = (file) => {
    setFilename(file.name);
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (res) => {
        const data = res.data;
        if (!data?.length) return;
        // Header row:
        const H = data[0].map((c, i) => (c ?? `col_${i+1}`).toString());
        // Body rows, force strings:
        let R = data.slice(1).map(r => H.map((_,i)=> (r?.[i] ?? "").toString()));
        setHeaders(H);
        setRows(R);
        setPage(1);
        setHidden({});
      }
    });
  };

  const filtered = useMemo(() => {
    if (!headers || !q.trim()) return rows;
    const needle = q.toLowerCase();
    return rows.filter(r => r.some(cell => cell?.toLowerCase().includes(needle)));
  }, [rows, headers, q]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered.length, pageSize]);

  const pageRows = useMemo(() => {
    const start = (page-1)*pageSize;
    return filtered.slice(start, start+pageSize);
  }, [filtered, page, pageSize]);

  const summaries = useMemo(() => {
    if (!headers) return [];
    const cols = headers.map((h,i)=> rows.map(r=> r[i]));
    return headers.map((h,i)=> ({
      name: h,
      type: inferType(cols[i]),
      empty: cols[i].filter(v => (v ?? "").toString().trim() === "").length
    }));
  }, [headers, rows]);

  const visibleIdx = useMemo(() =>
    new Set(headers?.map((h,i)=> hidden[h] ? -1 : i).filter(i=> i>=0) ?? []),
    [headers, hidden]
  );

  const downloadCSV = () => {
    if (!headers) return;
    const csv = Papa.unparse({
      fields: headers.filter(h=>!hidden[h]),
      data: rows.map(r => r.filter((_,i)=> visibleIdx.has(i)))
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename || "data.csv"; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 500);
  };

  return (
    <div style={{minHeight:"100vh", background:"#f8fafc", padding:"24px"}}>
      <div style={{maxWidth:"1152px", margin:"0 auto"}}>
        {/* Header */}
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <h1 style={{fontSize:"22px", fontWeight:600}}>CSV Viewer</h1>
          <div style={{display:"flex", gap:"8px"}}>
            <button onClick={()=>inputRef.current?.click()}>Upload CSV</button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              style={{display:"none"}}
              onChange={e=> e.target.files?.[0] && parseFile(e.target.files[0])}
            />
            <button disabled={!headers} onClick={downloadCSV}>Export</button>
            <button disabled={!headers} onClick={()=>{setHeaders(null); setRows([]); setQ(""); setHidden({}); setPage(1);}}>Reset</button>
          </div>
        </div>

        {/* Empty state */}
        {!headers && (
          <div style={{marginTop:"16px", padding:"24px", border:"1px dashed #cbd5e1", background:"#fff", borderRadius:"14px", textAlign:"center"}}>
            <p>Drag & drop your CSV here or click “Upload CSV”.</p>
            <div
              onDragOver={e=>e.preventDefault()}
              onDrop={e=>{e.preventDefault(); const f=e.dataTransfer.files?.[0]; if (f) parseFile(f);}}
              style={{marginTop:"16px", height:"140px", border:"2px dashed #e2e8f0", borderRadius:"12px", display:"flex", alignItems:"center", justifyContent:"center"}}
            >
              Drop file
            </div>
          </div>
        )}

        {/* Controls + column summary */}
        {headers && (
          <>
            <div style={{marginTop:"16px", padding:"16px", background:"#fff", borderRadius:"14px", border:"1px solid #e2e8f0"}}>
              <div style={{display:"flex", flexWrap:"wrap", gap:"8px", alignItems:"center"}}>
                <span style={{fontSize:"12px", color:"#334155"}}>File: <b>{filename}</b></span>
                <span style={{fontSize:"12px", color:"#334155"}}>Rows: <b>{rows.length}</b></span>
                <span style={{fontSize:"12px", color:"#334155"}}>Columns: <b>{headers.length}</b></span>
                <input
                  placeholder="Search…"
                  value={q}
                  onChange={e=>{setQ(e.target.value); setPage(1);}}
                  style={{marginLeft:"auto", padding:"8px", border:"1px solid #e2e8f0", borderRadius:"8px", width:"260px"}}
                />
                <input
                  type="number"
                  min={10}
                  max={1000}
                  value={pageSize}
                  onChange={e=>{
                    const v=parseInt(e.target.value||"50",10);
                    setPageSize(isNaN(v)?50:Math.max(10,Math.min(1000,v)));
                    setPage(1);
                  }}
                  style={{width:"100px", padding:"6px", border:"1px solid #e2e8f0", borderRadius:"8px"}}
                />
                <details style={{marginLeft:"8px"}}>
                  <summary>Columns</summary>
                  <div style={{maxHeight:"200px", overflow:"auto", padding:"8px", border:"1px solid #e2e8f0", borderRadius:"8px", background:"#f8fafc"}}>
                    {headers.map(h=>(
                      <label key={h} style={{display:"flex", alignItems:"center", gap:"6px", marginBottom:"6px"}}>
                        <input
                          type="checkbox"
                          checked={!hidden[h]}
                          onChange={e=> setHidden(prev=>({...prev, [h]: !e.target.checked}))}
                        />
                        <span>{h}</span>
                      </label>
                    ))}
                  </div>
                </details>
              </div>
            </div>

            <div style={{marginTop:"12px", padding:"16px", background:"#fff", borderRadius:"14px", border:"1px solid #e2e8f0"}}>
              <h3 style={{margin:"0 0 8px 0"}}>Column summary</h3>
              <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:"10px"}}>
                {summaries.map(s=>(
                  <div key={s.name} style={{border:"1px solid #e2e8f0", borderRadius:"12px", padding:"10px"}}>
                    <div style={{fontSize:"12px", color:"#475569"}}>{s.name}</div>
                    <div style={{fontWeight:600, marginTop:"4px", textTransform:"capitalize"}}>{s.type}</div>
                    <div style={{fontSize:"12px", color:"#64748b"}}>Empty values: {s.empty}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data table */}
            <div style={{marginTop:"12px", padding:"16px", background:"#fff", borderRadius:"14px", border:"1px solid #e2e8f0", overflow:"auto"}}>
              <div style={{marginBottom:"8px"}}>Rows {((page-1)*pageSize+1)}–{Math.min(page*pageSize, filtered.length)} of {filtered.length}</div>
              <table style={{minWidth:"100%", fontSize:"14px", borderCollapse:"collapse"}}>
                <thead>
                  <tr>
                    {headers.map((h,i)=> hidden[h] ? null : (
                      <th key={h} style={{position:"sticky", top:0, background:"#f1f5f9", borderBottom:"1px solid #e2e8f0", padding:"8px", textAlign:"left"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r,ri)=>(
                    <tr key={ri} style={{background: ri%2? "#f8fafc":"transparent"}}>
                      {r.map((cell,ci)=> visibleIdx.has(ci) ? (
                        <td key={ci} style={{borderBottom:"1px solid #eef2f7", padding:"8px", whiteSpace:"nowrap"}}>{cell}</td>
                      ) : null)}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"10px"}}>
                <span style={{fontSize:"12px", color:"#64748b"}}>Page {page} / {pageCount}</span>
                <div style={{display:"flex", gap:"8px"}}>
                  <button disabled={page<=1} onClick={()=> setPage(p=> Math.max(1,p-1))}>Prev</button>
                  <button disabled={page>=pageCount} onClick={()=> setPage(p=> Math.min(pageCount, p+1))}>Next</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
