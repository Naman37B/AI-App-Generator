"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { AppConfig } from "@/lib/schema";
import { motion } from "framer-motion";
import { UploadCloud, CheckCircle2 } from "lucide-react";

// --- BASE COMPONENTS ---

const DynamicText = ({ props }: { props: any }) => (
  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">{props.content || "Default text"}</p>
);

const DynamicMetric = ({ props }: { props: any }) => (
  <motion.div 
    whileHover={{ y: -4, scale: 1.01 }}
    transition={{ type: "spring", stiffness: 300 }}
    className="p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-100 dark:border-gray-800 text-center flex flex-col justify-center items-center gap-2"
  >
    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">{props.label || "Metric"}</h3>
    <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-500 dark:from-white dark:to-gray-400">
      {props.value || "0"}
    </p>
  </motion.div>
);

const DynamicForm = ({ props, appId }: { props: any, appId?: string }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const colorMap: Record<string, string> = {
    blue: "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-blue-500/25",
    red: "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-500/25",
    green: "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/25",
    indigo: "bg-gradient-to-r from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-400 shadow-indigo-500/25",
    black: "bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 shadow-gray-900/25 dark:from-gray-100 dark:to-white dark:text-gray-900 dark:hover:from-white dark:hover:to-gray-100"
  };

  const buttonColorClass = props.buttonColor && colorMap[props.buttonColor] ? colorMap[props.buttonColor] : colorMap.black;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId || !props.modelName) return;

    setStatus("loading");
    try {
      const res = await fetch(`/api/apps/${appId}/records/${props.modelName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Validation failed");
      
      setStatus("success");
      setFormData({}); 
      toast.custom((t) => (
        <div className="flex items-center gap-3 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl">
          <CheckCircle2 className="text-emerald-400 w-5 h-5" />
          <span className="font-medium">Record saved successfully</span>
        </div>
      ));
      
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("error");
      toast.error("Failed to save record.");
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... (Keep your exact existing handleCSVUpload logic here)
    const file = e.target.files?.[0];
    if (!file || !appId || !props.modelName) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      setStatus("loading");
      try {
        const csv = event.target?.result as string;
        const lines = csv.split("\n").filter(line => line.trim() !== "");
        const headers = lines[0].split(",").map(h => h.trim());

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map(v => v.trim());
          const payload: Record<string, string> = {};
          headers.forEach((header, idx) => { payload[header] = values[idx]; });

          await fetch(`/api/apps/${appId}/records/${props.modelName}`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
          });
        }
        
        setStatus("success");
        toast.success(`Imported ${lines.length - 1} records!`);
        setTimeout(() => setStatus("idle"), 2000);
      } catch (err) {
        setStatus("error");
        toast.error("CSV Import Failed.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <motion.form 
      layout
      onSubmit={handleSubmit} 
      className="p-8 rounded-3xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6"
    >
      <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{props.title || "Submit Form"}</h3>
      
      <div className="space-y-5">
        {props.fields?.map((field: any, idx: number) => (
          <div key={idx} className="flex flex-col gap-2 relative group">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{field.label}</label>
            <input 
              type={field.type === "number" ? "number" : "text"} 
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all duration-300 shadow-inner"
              placeholder={`Enter ${field.label.toLowerCase()}...`}
              value={formData[field.name] || ""}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, [field.name]: field.type === "number" ? (val === "" ? "" : Number(val)) : val });
              }}
              required={field.required}
            />
          </div>
        ))}
      </div>
      
      <motion.button 
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        type="submit" 
        disabled={status === "loading" || !appId}
        className={`w-full text-white px-6 py-4 rounded-xl font-bold tracking-wide shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${buttonColorClass}`}
      >
        {status === "loading" ? "Processing..." : status === "success" ? "Done!" : props.submitText || "Submit"}
      </motion.button>

      <div className="pt-6 mt-6 border-t border-gray-200/50 dark:border-gray-800/50 relative">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 bg-white dark:bg-gray-900 text-xs font-bold tracking-wider text-gray-400 uppercase">
          Or Bulk Import
        </div>
        <label className="flex items-center justify-center gap-3 w-full border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl p-6 cursor-pointer transition-colors group">
          <UploadCloud className="w-6 h-6 text-gray-400 group-hover:text-indigo-500 transition-colors" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-indigo-500">
            Upload CSV File
          </span>
          <input type="file" accept=".csv" onChange={handleCSVUpload} disabled={status === "loading" || !appId} className="hidden" />
        </label>
      </div>
    </motion.form>
  );
};

const componentMap: Record<string, React.FC<any>> = {
  text: DynamicText,
  metric: DynamicMetric,
  form: DynamicForm,
};

// --- MASTER RENDERER ---

export function Renderer({ config }: { config: AppConfig & { id?: string } }) {
  if (!config || !config.pages || config.pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 font-medium">
        No valid configuration found. Enter JSON to generate UI.
      </div>
    );
  }

  const activePage = config.pages[0];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 md:p-12 max-w-5xl mx-auto space-y-12"
    >
      <motion.h1 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-500 pb-2"
      >
        {activePage.title}
      </motion.h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {activePage.components?.map((component, idx) => {
          const RenderedComponent = componentMap[component.type];
          if (!RenderedComponent) return null; 

          return (
            <motion.div 
              key={component.id} 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1, type: "spring", stiffness: 200, damping: 20 }}
              className={component.type === 'form' ? 'md:col-span-2' : ''}
            >
              <RenderedComponent props={component.props} appId={config.id} />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}