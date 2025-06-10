"use client";

import { useState } from "react";
import { Car, Users, BarChart3, Clock } from "lucide-react";
import CadastroTab from "@/app/components/CadastroTab";
import RegistroTab from "@/app/components/RegistroTab";
import RelatoriosTab from "@/app/components/RelatoriosTab";

export default function Home() {
  const [activeTab, setActiveTab] = useState("registro");

  const tabs = [
    { id: "registro", label: "Registro de Acesso", icon: Clock },
    { id: "cadastro", label: "Cadastros", icon: Users },
    { id: "relatorios", label: "Relatórios", icon: BarChart3 },
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-4 md:p-6 mb-6 md:mb-8 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold text-white">CAV</h1>
              <p className="text-teal-100">Controle de Acesso Veicular</p>
            </div>
          </div>
          <div>
            <span className="text-white font-medium">Administrador</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 md:mb-8 bg-gray-100 p-2 rounded-2xl overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 md:px-6 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-teal-600 text-white shadow-lg"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl p-4 md:p-8 shadow-xl min-h-[600px]">
        {activeTab === "registro" && <RegistroTab />}
        {activeTab === "cadastro" && <CadastroTab />}
        {activeTab === "relatorios" && <RelatoriosTab />}
      </div>
    </div>
  );
}
