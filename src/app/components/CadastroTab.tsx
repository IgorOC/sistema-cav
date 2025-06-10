"use client";

import { useState, useEffect } from "react";
import {
  supabase,
  Usuario,
  Veiculo,
  UsuarioVeiculo,
  UsuarioVeiculoRaw,
} from "@/app/lib/supabase";
import { User, Car, Plus, Edit, Trash2, Link, Search } from "lucide-react";

export default function CadastroTab() {
  const [activeSubTab, setActiveSubTab] = useState("usuarios");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [showModalUsuario, setShowModalUsuario] = useState(false);
  const [showModalVeiculo, setShowModalVeiculo] = useState(false);
  const [showModalVinculo, setShowModalVinculo] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [editingVeiculo, setEditingVeiculo] = useState<Veiculo | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form states
  const [formUsuario, setFormUsuario] = useState({
    nome: "",
    cpf: "",
    data_nascimento: "",
    habilitacao: "",
  });

  const [formVeiculo, setFormVeiculo] = useState({
    placa: "",
    marca: "",
    modelo: "",
    cor: "",
    ano: "",
  });

  const [vinculos, setVinculos] = useState<UsuarioVeiculo[]>([]);
  const [selectedUsuario, setSelectedUsuario] = useState("");
  const [selectedVeiculo, setSelectedVeiculo] = useState("");

  useEffect(() => {
    carregarUsuarios();
    carregarVeiculos();
    carregarVinculos();
  }, []);

  const carregarUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
  };

  const carregarVeiculos = async () => {
    try {
      const { data, error } = await supabase
        .from("veiculos")
        .select("*")
        .eq("ativo", true)
        .order("placa");

      if (error) throw error;
      setVeiculos(data || []);
    } catch (error) {
      console.error("Erro ao carregar veículos:", error);
    }
  };

  const carregarVinculos = async () => {
    try {
      const { data, error } = await supabase.from("usuario_veiculo").select(`
        id,
        usuario_id,
        veiculo_id,
        created_at,
        usuarios (id, nome, cpf),
        veiculos (id, placa, marca, modelo)
      `);

      if (error) throw error;

      const vinculosFormatados: UsuarioVeiculo[] = (
        data as UsuarioVeiculoRaw[]
      ).map((item) => ({
        id: item.id,
        usuario_id: item.usuario_id,
        veiculo_id: item.veiculo_id,
        created_at: item.created_at,
        usuarios: Array.isArray(item.usuarios)
          ? item.usuarios[0]
          : item.usuarios,
        veiculos: Array.isArray(item.veiculos)
          ? item.veiculos[0]
          : item.veiculos,
      }));

      setVinculos(vinculosFormatados);
    } catch (error) {
      console.error("Erro ao carregar vínculos:", error);
    }
  };

  const salvarUsuario = async () => {
    try {
      if (editingUsuario) {
        const { error } = await supabase
          .from("usuarios")
          .update(formUsuario)
          .eq("id", editingUsuario.id);

        if (error) throw error;
        alert("Usuário atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("usuarios").insert([formUsuario]);

        if (error) throw error;
        alert("Usuário cadastrado com sucesso!");
      }

      setShowModalUsuario(false);
      setEditingUsuario(null);
      setFormUsuario({
        nome: "",
        cpf: "",
        data_nascimento: "",
        habilitacao: "",
      });
      carregarUsuarios();
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      if (error instanceof Error) {
        alert(`Erro ao salvar usuário: ${error.message}`);
      } else {
        alert("Erro ao salvar usuário");
      }
    }
  };

  const salvarVeiculo = async () => {
    try {
      const veiculo = {
        ...formVeiculo,
        placa: formVeiculo.placa.toUpperCase(),
        ano: formVeiculo.ano ? parseInt(formVeiculo.ano) : null,
      };

      if (editingVeiculo) {
        const { error } = await supabase
          .from("veiculos")
          .update(veiculo)
          .eq("id", editingVeiculo.id);

        if (error) throw error;
        alert("Veículo atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("veiculos").insert([veiculo]);

        if (error) throw error;
        alert("Veículo cadastrado com sucesso!");
      }

      setShowModalVeiculo(false);
      setEditingVeiculo(null);
      setFormVeiculo({ placa: "", marca: "", modelo: "", cor: "", ano: "" });
      carregarVeiculos();
    } catch (error) {
      console.error("Erro ao salvar veículo:", error);
      if (error instanceof Error) {
        alert(`Erro ao salvar veículo: ${error.message}`);
      } else {
        alert("Erro ao salvar veículo");
      }
    }
  };

  const criarVinculo = async () => {
    if (!selectedUsuario || !selectedVeiculo) {
      alert("Selecione um usuário e um veículo");
      return;
    }

    const jaExiste = vinculos.some(
      (v) =>
        v.usuario_id === selectedUsuario && v.veiculo_id === selectedVeiculo
    );

    if (jaExiste) {
      alert("Este vínculo já existe.");
      return;
    }

    try {
      const { error } = await supabase.from("usuario_veiculo").insert([
        {
          usuario_id: selectedUsuario,
          veiculo_id: selectedVeiculo,
        },
      ]);

      if (error) throw error;

      alert("Vínculo criado com sucesso!");
      setShowModalVinculo(false);
      setSelectedUsuario("");
      setSelectedVeiculo("");
      carregarVinculos();
    } catch (error) {
      console.error("Erro ao criar vínculo:", error);
      alert("Erro ao criar vínculo");
    }
  };

  const editarUsuario = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setFormUsuario({
      nome: usuario.nome,
      cpf: usuario.cpf,
      data_nascimento: usuario.data_nascimento || "",
      habilitacao: usuario.habilitacao || "",
    });
    setShowModalUsuario(true);
  };

  const editarVeiculo = (veiculo: Veiculo) => {
    setEditingVeiculo(veiculo);
    setFormVeiculo({
      placa: veiculo.placa,
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      cor: veiculo.cor,
      ano: veiculo.ano?.toString() || "",
    });
    setShowModalVeiculo(true);
  };

  const excluirUsuario = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      const { error } = await supabase
        .from("usuarios")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;
      alert("Usuário excluído com sucesso!");
      carregarUsuarios();
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      alert("Erro ao excluir usuário");
    }
  };

  const excluirVeiculo = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este veículo?")) return;

    try {
      const { error } = await supabase
        .from("veiculos")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;
      alert("Veículo excluído com sucesso!");
      carregarVeiculos();
    } catch (error) {
      console.error("Erro ao excluir veículo:", error);
      alert("Erro ao excluir veículo");
    }
  };

  const excluirVinculo = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este vínculo?")) return;

    try {
      const { error } = await supabase
        .from("usuario_veiculo")
        .delete()
        .eq("id", id);

      if (error) throw error;
      alert("Vínculo excluído com sucesso!");
      carregarVinculos();
    } catch (error) {
      console.error("Erro ao excluir vínculo:", error);
      alert("Erro ao excluir vínculo");
    }
  };

  const filteredUsuarios = usuarios.filter(
    (usuario) =>
      usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.cpf.includes(searchTerm)
  );

  const filteredVeiculos = veiculos.filter(
    (veiculo) =>
      veiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      veiculo.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      veiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Cadastros</h2>

      {/* Sub Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveSubTab("usuarios")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeSubTab === "usuarios"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <User className="w-4 h-4" />
          Usuários
        </button>
        <button
          onClick={() => setActiveSubTab("veiculos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeSubTab === "veiculos"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <Car className="w-4 h-4" />
          Veículos
        </button>
        <button
          onClick={() => setActiveSubTab("vinculos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeSubTab === "vinculos"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <Link className="w-4 h-4" />
          Vínculos
        </button>
      </div>

      {/* Search and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2">
          {activeSubTab === "usuarios" && (
            <button
              onClick={() => setShowModalUsuario(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Usuário
            </button>
          )}
          {activeSubTab === "veiculos" && (
            <button
              onClick={() => setShowModalVeiculo(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Veículo
            </button>
          )}
          {activeSubTab === "vinculos" && (
            <button
              onClick={() => setShowModalVinculo(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Link className="w-4 h-4" />
              Novo Vínculo
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {activeSubTab === "usuarios" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsuarios.map((usuario) => (
            <div
              key={usuario.id}
              className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-800">
                    {usuario.nome}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => editarUsuario(usuario)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => excluirUsuario(usuario.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">CPF: {usuario.cpf}</p>
              {usuario.habilitacao && (
                <p className="text-sm text-gray-600">
                  CNH: {usuario.habilitacao}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {activeSubTab === "veiculos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVeiculos.map((veiculo) => (
            <div
              key={veiculo.id}
              className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  <span className="font-mono font-bold text-gray-800">
                    {veiculo.placa}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => editarVeiculo(veiculo)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => excluirVeiculo(veiculo.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                {veiculo.marca} {veiculo.modelo}
              </p>
              <p className="text-sm text-gray-600">Cor: {veiculo.cor}</p>
              {veiculo.ano && (
                <p className="text-sm text-gray-600">Ano: {veiculo.ano}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {activeSubTab === "vinculos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vinculos.map((vinculo) => (
            <div
              key={vinculo.id}
              className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <Link className="w-5 h-5 text-blue-600" />
                <button
                  onClick={() => excluirVinculo(vinculo.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{vinculo.usuarios?.nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-mono">
                    {vinculo.veiculos?.placa}
                  </span>
                  <span className="text-sm text-gray-600">
                    - {vinculo.veiculos?.marca} {vinculo.veiculos?.modelo}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Usuário */}
      {showModalUsuario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingUsuario ? "Editar Usuário" : "Novo Usuário"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={formUsuario.nome}
                  onChange={(e) =>
                    setFormUsuario({ ...formUsuario, nome: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  value={formUsuario.cpf}
                  onChange={(e) =>
                    setFormUsuario({ ...formUsuario, cpf: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={formUsuario.data_nascimento}
                  onChange={(e) =>
                    setFormUsuario({
                      ...formUsuario,
                      data_nascimento: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Habilitação
                </label>
                <input
                  type="text"
                  value={formUsuario.habilitacao}
                  onChange={(e) =>
                    setFormUsuario({
                      ...formUsuario,
                      habilitacao: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowModalUsuario(false);
                  setEditingUsuario(null);
                  setFormUsuario({
                    nome: "",
                    cpf: "",
                    data_nascimento: "",
                    habilitacao: "",
                  });
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarUsuario}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Veículo */}
      {showModalVeiculo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingVeiculo ? "Editar Veículo" : "Novo Veículo"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placa
                </label>
                <input
                  type="text"
                  value={formVeiculo.placa}
                  onChange={(e) =>
                    setFormVeiculo({
                      ...formVeiculo,
                      placa: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  maxLength={7}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marca
                </label>
                <input
                  type="text"
                  value={formVeiculo.marca}
                  onChange={(e) =>
                    setFormVeiculo({ ...formVeiculo, marca: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modelo
                </label>
                <input
                  type="text"
                  value={formVeiculo.modelo}
                  onChange={(e) =>
                    setFormVeiculo({ ...formVeiculo, modelo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cor
                </label>
                <input
                  type="text"
                  value={formVeiculo.cor}
                  onChange={(e) =>
                    setFormVeiculo({ ...formVeiculo, cor: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ano
                </label>
                <input
                  type="number"
                  value={formVeiculo.ano}
                  onChange={(e) =>
                    setFormVeiculo({ ...formVeiculo, ano: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowModalVeiculo(false);
                  setEditingVeiculo(null);
                  setFormVeiculo({
                    placa: "",
                    marca: "",
                    modelo: "",
                    cor: "",
                    ano: "",
                  });
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarVeiculo}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Vínculo */}
      {showModalVinculo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Novo Vínculo</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuário
                </label>
                <select
                  value={selectedUsuario}
                  onChange={(e) => setSelectedUsuario(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione um usuário</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nome} - {usuario.cpf}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Veículo
                </label>
                <select
                  value={selectedVeiculo}
                  onChange={(e) => setSelectedVeiculo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione um veículo</option>
                  {veiculos.map((veiculo) => (
                    <option key={veiculo.id} value={veiculo.id}>
                      {veiculo.placa} - {veiculo.marca} {veiculo.modelo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowModalVinculo(false);
                  setSelectedUsuario("");
                  setSelectedVeiculo("");
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={criarVinculo}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar Vínculo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
