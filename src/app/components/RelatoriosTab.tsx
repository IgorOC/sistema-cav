  "use client";

  import { useState, useEffect } from "react";
  import { supabase, RegistroAcesso } from "@/app/lib/supabase";
  import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
  } from "recharts";
  import {
    Calendar,
    Download,
    TrendingUp,
    Car,
    Users,
    Clock,
  } from "lucide-react";
  import { format, subDays, eachDayOfInterval } from "date-fns";
  import { ptBR } from "date-fns/locale";

  interface DashboardStats {
    totalRegistros: number;
    totalEntradas: number;
    totalSaidas: number;
    veiculosUnicos: number;
    usuariosAtivos: number;
  }

  interface DadosGrafico {
    data: string;
    entradas: number;
    saidas: number;
    total: number;
  }

  export default function RelatoriosTab() {
    const [dataInicio, setDataInicio] = useState(
      format(subDays(new Date(), 30), "yyyy-MM-dd")
    );
    const [dataFim, setDataFim] = useState(format(new Date(), "yyyy-MM-dd"));
    const [registros, setRegistros] = useState<RegistroAcesso[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
      totalRegistros: 0,
      totalEntradas: 0,
      totalSaidas: 0,
      veiculosUnicos: 0,
      usuariosAtivos: 0,
    });
    const [dadosGrafico, setDadosGrafico] = useState<DadosGrafico[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      carregarDados();
    }, [dataInicio, dataFim]);

    const carregarDados = async () => {
      setLoading(true);
      try {
        // Buscar registros no período
        const { data: registrosData, error } = await supabase
          .from("registros_acesso")
          .select(
            `
            *,
            usuarios (nome, cpf),
            veiculos (marca, modelo, cor)
          `
          )
          .gte("data_hora", `${dataInicio}T00:00:00`)
          .lte("data_hora", `${dataFim}T23:59:59`)
          .order("data_hora", { ascending: false });

        if (error) throw error;
        setRegistros(registrosData || []);

        // Calcular estatísticas
        const totalRegistros = registrosData?.length || 0;
        const totalEntradas =
          registrosData?.filter((r) => r.tipo_movimento === "entrada").length ||
          0;
        const totalSaidas =
          registrosData?.filter((r) => r.tipo_movimento === "saida").length || 0;
        const veiculosUnicos = new Set(registrosData?.map((r) => r.placa)).size;

        // Buscar total de usuários ativos
        const { data: usuariosData } = await supabase
          .from("usuarios")
          .select("id")
          .eq("ativo", true);

        setStats({
          totalRegistros,
          totalEntradas,
          totalSaidas,
          veiculosUnicos,
          usuariosAtivos: usuariosData?.length || 0,
        });

        // Preparar dados para gráfico
        const diasPeriodo = eachDayOfInterval({
          start: new Date(dataInicio),
          end: new Date(dataFim),
        });

        const dadosGraficoPorDia = diasPeriodo.map((dia) => {
          const diaFormatado = dia.toISOString().split("T")[0];

          const registrosDia =
            registrosData?.filter(
              (r) =>
                new Date(r.data_hora).toISOString().split("T")[0] === diaFormatado
            ) || [];

          const entradas = registrosDia.filter(
            (r) => r.tipo_movimento === "entrada"
          ).length;
          const saidas = registrosDia.filter(
            (r) => r.tipo_movimento === "saida"
          ).length;

          return {
            data: format(dia, "dd/MM", { locale: ptBR }),
            entradas,
            saidas,
            total: entradas + saidas,
          };
        });

        setDadosGrafico(dadosGraficoPorDia);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    const exportarRelatorio = () => {
      const csvContent = [
        ["Data/Hora", "Placa", "Tipo", "Motorista", "Veículo", "Observações"],
        ...registros.map((registro) => [
          format(new Date(registro.data_hora), "dd/MM/yyyy HH:mm", {
            locale: ptBR,
          }),
          registro.placa,
          registro.tipo_movimento === "entrada" ? "ENTRADA" : "SAÍDA",
          registro.usuarios?.nome || "N/A",
          registro.veiculos
            ? `${registro.veiculos.marca} ${registro.veiculos.modelo}`
            : "N/A",
          registro.observacoes || "",
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `relatorio_acessos_${dataInicio}_${dataFim}.csv`;
      link.click();
    };

    const dadosPizza = [
      { name: "Entradas", value: stats.totalEntradas, color: "#10B981" },
      { name: "Saídas", value: stats.totalSaidas, color: "#EF4444" },
    ];

    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Relatórios e Dashboard
        </h2>

        {/* Filtros */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Período:</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">De:</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Até:</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              onClick={exportarRelatorio}
              disabled={loading || registros.length === 0}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Carregando dados...</div>
          </div>
        ) : (
          <>
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Registros</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {stats.totalRegistros}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Entradas</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.totalEntradas}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Saídas</p>
                    <p className="text-2xl font-bold text-red-600">
                      {stats.totalSaidas}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-red-600 rotate-180" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Veículos Únicos</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.veiculosUnicos}
                    </p>
                  </div>
                  <Car className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Usuários Ativos</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {stats.usuariosAtivos}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Gráfico de Linha - Movimentação por Dia */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">
                  Movimentação por Dia
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="entradas"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Entradas"
                    />
                    <Line
                      type="monotone"
                      dataKey="saidas"
                      stroke="#EF4444"
                      strokeWidth={2}
                      name="Saídas"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico de Pizza - Proporção Entradas/Saídas */}
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">
                  Proporção Entradas vs Saídas
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dadosPizza}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosPizza.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de Barras - Total por Dia */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
              <h3 className="text-lg font-semibold mb-4">
                Total de Acessos por Dia
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="entradas" fill="#10B981" name="Entradas" />
                  <Bar dataKey="saidas" fill="#EF4444" name="Saídas" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tabela de Registros Detalhados */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Registros Detalhados</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data/Hora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Placa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Motorista
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Veículo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Observações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {registros.slice(0, 50).map((registro) => (
                      <tr key={registro.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(
                            new Date(registro.data_hora),
                            "dd/MM/yyyy HH:mm",
                            { locale: ptBR }
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-900">
                          {registro.placa}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              registro.tipo_movimento === "entrada"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {registro.tipo_movimento === "entrada"
                              ? "ENTRADA"
                              : "SAÍDA"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {registro.usuarios?.nome || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {registro.veiculos
                            ? `${registro.veiculos.marca} ${registro.veiculos.modelo}`
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {registro.observacoes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {registros.length > 50 && (
                <div className="p-4 text-center text-sm text-gray-500 border-t border-gray-200">
                  Mostrando 50 de {registros.length} registros. Use a exportação
                  para ver todos.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }
