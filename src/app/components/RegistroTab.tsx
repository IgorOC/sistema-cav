"use client";

import { useState, useEffect } from "react";
import { supabase, RegistroAcesso, Usuario, Veiculo } from "@/app/lib/supabase";
import { LogIn, LogOut, Car, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RegistroTab() {
  const [placa, setPlaca] = useState("");
  const [tipoMovimento, setTipoMovimento] = useState<"entrada" | "saida">(
    "entrada"
  );
  const [observacoes, setObservacoes] = useState("");
  const [registros, setRegistros] = useState<RegistroAcesso[]>([]);
  const [loading, setLoading] = useState(false);
  const [veiculoEncontrado, setVeiculoEncontrado] = useState<Veiculo | null>(
    null
  );
  const [usuarioEncontrado, setUsuarioEncontrado] = useState<Usuario | null>(
    null
  );

  useEffect(() => {
    carregarRegistros();
  }, []);

  const carregarRegistros = async () => {
    try {
      const { data, error } = await supabase
        .from("registros_acesso")
        .select(
          `
          *,
          usuarios (nome, cpf),
          veiculos (marca, modelo, cor)
        `
        )
        .order("data_hora", { ascending: false })
        .limit(10);

      if (error) throw error;
      setRegistros(data || []);
    } catch (error) {
      console.error("Erro ao carregar registros:", error);
    }
  };

  const buscarVeiculo = async (placaBusca: string) => {
    if (placaBusca.length < 3) {
      setVeiculoEncontrado(null);
      setUsuarioEncontrado(null);
      return;
    }

    try {
      // Buscar veículo
      const { data: veiculo } = await supabase
        .from("veiculos")
        .select("*")
        .eq("placa", placaBusca.toUpperCase())
        .single();

      setVeiculoEncontrado(veiculo);

      // Se encontrou veículo, buscar usuário associado
      if (veiculo) {
        const { data: associacao } = await supabase
          .from("usuario_veiculo")
          .select(
            `
            usuarios (*)
          `
          )
          .eq("veiculo_id", veiculo.id)
          .single();

        // Tratar o caso onde usuarios é um array
        if (associacao?.usuarios) {
          const usuariosArray = Array.isArray(associacao.usuarios)
            ? associacao.usuarios
            : [associacao.usuarios];
          setUsuarioEncontrado(
            usuariosArray.length > 0 ? usuariosArray[0] : null
          );
        } else {
          setUsuarioEncontrado(null);
        }
      } else {
        setUsuarioEncontrado(null);
      }
    } catch (error) {
      console.error("Erro ao buscar veículo:", error);
      setVeiculoEncontrado(null);
      setUsuarioEncontrado(null);
    }
  };

  const registrarAcesso = async () => {
    if (!placa.trim()) {
      alert("Por favor, informe a placa do veículo");
      return;
    }

    setLoading(true);
    try {
      const registro = {
        placa: placa.toUpperCase(),
        tipo_movimento: tipoMovimento,
        observacoes: observacoes.trim() || null,
        usuario_id: usuarioEncontrado?.id || null,
        veiculo_id: veiculoEncontrado?.id || null,
      };

      const { error } = await supabase
        .from("registros_acesso")
        .insert([registro]);

      if (error) throw error;

      alert(
        `${
          tipoMovimento === "entrada" ? "Entrada" : "Saída"
        } registrada com sucesso!`
      );

      // Limpar formulário
      setPlaca("");
      setObservacoes("");
      setVeiculoEncontrado(null);
      setUsuarioEncontrado(null);

      // Recarregar registros
      carregarRegistros();
    } catch (error) {
      console.error("Erro ao registrar acesso:", error);
      alert("Erro ao registrar acesso");
    } finally {
      setLoading(false);
    }
  };

  const handlePlacaChange = (value: string) => {
    const placaFormatada = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    setPlaca(placaFormatada);
    buscarVeiculo(placaFormatada);
  };

  return (
    <div className="px-2 md:px-0">
      <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">
        Registro de Acesso
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Formulário de Registro */}
        <div className="bg-gray-50 rounded-xl p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">Novo Registro</h3>

          {/* Placa */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Placa do Veículo
            </label>
            <div className="relative">
              <Car className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={placa}
                onChange={(e) => handlePlacaChange(e.target.value)}
                placeholder="ABC1234"
                maxLength={7}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-lg font-mono"
              />
            </div>
          </div>

          {/* Informações do Veículo/Motorista */}
          {veiculoEncontrado && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Car className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">
                  Veículo Cadastrado
                </span>
              </div>
              <p className="text-sm text-green-700">
                {veiculoEncontrado.marca} {veiculoEncontrado.modelo} -{" "}
                {veiculoEncontrado.cor}
              </p>
              {usuarioEncontrado && (
                <div className="mt-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    {usuarioEncontrado.nome}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tipo de Movimento */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Movimento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipoMovimento("entrada")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  tipoMovimento === "entrada"
                    ? "bg-green-50 border-green-500 text-green-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <LogIn className="w-5 h-5" />
                <span className="hidden sm:inline">Entrada</span>
                <span className="sm:hidden">↗️</span>
              </button>
              <button
                type="button"
                onClick={() => setTipoMovimento("saida")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  tipoMovimento === "saida"
                    ? "bg-red-50 border-red-500 text-red-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Saída</span>
                <span className="sm:hidden">↖️</span>
              </button>
            </div>
          </div>

          {/* Observações */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre o acesso..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Botão Registrar */}
          <button
            onClick={registrarAcesso}
            disabled={loading || !placa.trim()}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              tipoMovimento === "entrada"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              "Registrando..."
            ) : (
              <>
                {tipoMovimento === "entrada" ? (
                  <LogIn className="w-5 h-5" />
                ) : (
                  <LogOut className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">
                  Registrar {tipoMovimento === "entrada" ? "Entrada" : "Saída"}
                </span>
                <span className="sm:hidden">
                  {tipoMovimento === "entrada" ? "Entrada" : "Saída"}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Lista de Registros Recentes */}
        <div className="bg-gray-50 rounded-xl p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">Registros Recentes</h3>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {registros.map((registro) => (
              <div
                key={registro.id}
                className="bg-white p-3 md:p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base md:text-lg">
                      {registro.placa}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        registro.tipo_movimento === "entrada"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {registro.tipo_movimento === "entrada"
                        ? "ENTRADA"
                        : "SAÍDA"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <Clock className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {format(new Date(registro.data_hora), "dd/MM HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                    <span className="sm:hidden">
                      {format(new Date(registro.data_hora), "HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                </div>

                {registro.usuarios && (
                  <p className="text-sm text-gray-600 mb-1 truncate">
                    <User className="w-4 h-4 inline mr-1" />
                    {registro.usuarios.nome}
                  </p>
                )}

                {registro.veiculos && (
                  <p className="text-sm text-gray-600 mb-1 truncate">
                    <Car className="w-4 h-4 inline mr-1" />
                    {registro.veiculos.marca} {registro.veiculos.modelo} -{" "}
                    {registro.veiculos.cor}
                  </p>
                )}

                {registro.observacoes && (
                  <p className="text-sm text-gray-500 italic mt-2 line-clamp-2">
                    ´{registro.observacoes}´
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
