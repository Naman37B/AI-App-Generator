"use client";

import { useState } from "react";
import { Renderer } from "@/components/Renderer";
import { AppConfigSchema } from "@/lib/schema";
import { motion } from "framer-motion";
import { Moon, Sun, Play } from "lucide-react";

// (Keep your exact same defaultJSON string here)
const defaultJSON = `{
  "appName": "Inventory Manager",
  "dataModels": [
    {
      "name": "products",
      "fields": [
        { "name": "productName", "type": "string", "required": true },
        { "name": "skuCode", "type": "string", "required": true },
        { "name": "stockQuantity", "type": "number", "required": true }
      ]
    }
  ],
  "pages": [
    {
      "path": "/",
      "title": "Warehouse Dashboard",
      "components": [
        {
          "id": "metric_1",
          "type": "metric",
          "props": { "label": "Total Unique Items", "value": "1,842" }
        },
        {
          "id": "metric_2",
          "type": "metric",
          "props": { "label": "Low Stock Alerts", "value": "12" }
        },
        {
          "id": "form_1",
          "type": "form",
          "props": {
            "title": "Receive New Inventory",
            "modelName": "products",
            "buttonColor": "indigo",
            "submitText": "Add to Warehouse",
            "fields": [
              { "label": "Product Name", "name": "productName", "type": "string", "required": true },
              { "label": "SKU (Barcode)", "name": "skuCode", "type": "string", "required": true },
              { "label": "Initial Stock Quantity", "name": "stockQuantity", "type": "number", "required": true }
            ]
          }
        }
      ]
    }
  ]
}`;

export default function Home() {
  const [jsonInput, setJsonInput] = useState(defaultJSON);
  const [parsedConfig, setParsedConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  const handleGenerate = async () => {
    let rawJson;
    try {
      rawJson = JSON.parse(jsonInput);
    } catch (e) {
      setError("Invalid JSON format. Please check your syntax.");
      return;
    }

    const result = AppConfigSchema.safeParse(rawJson);
    if (!result.success) {
      setError(`Schema Error: ${result.error.issues[0].message}`);
      return;
    }

    try {
      const response = await fetch("/api/apps", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(result.data),
      });

      if (!response.ok) throw new Error("Database failed to save the app config.");

      const dbData = await response.json();
      const finalConfig = { ...result.data, id: dbData.appId };

      setError(null);
      setParsedConfig(finalConfig);
    } catch (e: any) {
      setError(`API Error: ${e.message}`);
    }
  };

  return (
    <div className={`flex flex-col h-screen transition-colors duration-500 ${isDark ? "bg-[#0a0a0a] text-white dark" : "bg-gray-50 text-gray-900"}`}>
      
      {/* TOP NAVIGATION BAR */}
      <div className={`flex justify-between items-center px-8 py-4 border-b z-10 transition-colors duration-500 ${isDark ? "bg-black/50 border-white/10 backdrop-blur-md" : "bg-white/80 border-gray-200 backdrop-blur-md"}`}>
        <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center"><span className="text-white text-xs">AI</span></div>
          Config Engine
        </h1>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsDark(!isDark)}
            className={`p-2.5 rounded-full transition-all duration-300 ${isDark ? "bg-white/10 hover:bg-white/20 text-yellow-400" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGenerate}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 transition-colors"
          >
            <Play className="w-4 h-4 fill-current" />
            Render App
          </motion.button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT PANEL: JSON Editor */}
        <div className={`w-1/3 flex flex-col border-r relative transition-colors duration-500 ${isDark ? "bg-[#111] border-white/10" : "bg-gray-50 border-gray-200"}`}>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-4 left-4 right-4 z-20 p-4 bg-red-500/10 border border-red-500/50 backdrop-blur-md text-red-500 text-sm rounded-xl font-medium shadow-2xl">
              {error}
            </motion.div>
          )}
          <textarea
            className={`flex-1 p-6 text-sm font-mono focus:outline-none resize-none transition-colors duration-500 ${isDark ? "bg-transparent text-emerald-400" : "bg-transparent text-gray-800"}`}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* RIGHT PANEL: Canvas */}
        <div className={`w-2/3 overflow-y-auto relative transition-colors duration-500 ${isDark ? "bg-black" : "bg-gray-100"}`}>
          {/* Subtle Dot Grid Background */}
          <div className="absolute inset-0 opacity-[0.4] dark:opacity-[0.2]" style={{ backgroundImage: `radial-gradient(${isDark ? 'white' : 'black'} 1px, transparent 1px)`, backgroundSize: '24px 24px' }}></div>
          
          <div className="relative z-10 p-8 min-h-full">
            {parsedConfig ? (
              <Renderer config={parsedConfig} />
            ) : (
              <div className="flex items-center justify-center h-[80vh]">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Play className="w-8 h-8 text-indigo-500 ml-1" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-400 dark:text-gray-600 tracking-tight">Engine Ready</h2>
                  <p className="text-gray-400 dark:text-gray-600 font-medium">Click "Render App" to compile the JSON config.</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}