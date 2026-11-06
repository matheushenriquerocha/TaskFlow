/* =====================================================
   TASKFLOW - JAVASCRIPT COMPLETO
   Login, tarefas, calendário e estatísticas
===================================================== */

/* 1. ELEMENTOS E VARIÁVEIS */

const $ = (id) => document.getElementById(id);

const STORAGE_USERS = "taskflow_usuarios";
const STORAGE_SESSION = "taskflow_usuario_atual";

let usuarios = [];
let usuarioAtual = null;
let perfilRevelado = false;

let tarefas = [];
let notificacoes = [];

let configuracoes = {
    darkMode: false,
    notificacoes: true
};

let secaoAtual = "dashboard";

let mesAtual = new Date().getMonth();
let anoAtual = new Date().getFullYear();


/* 2. ARMAZENAMENTO */

function lerJSON(chave, padrao) {
    try {
        const valor = localStorage.getItem(chave);
        return valor === null ? padrao : JSON.parse(valor);
    } catch (erro) {
        console.error("Erro ao ler:", chave, erro);
        return padrao;
    }
}

function salvarJSON(chave, valor) {
    try {
        localStorage.setItem(chave, JSON.stringify(valor));
        return true;
    } catch (erro) {
        console.error("Erro ao salvar:", erro);
        mostrarToast("Não foi possível salvar os dados.", "error");
        return false;
    }
}

function obterChave(base, email = usuarioAtual?.email) {
    if (!email) return null;
    return `${base}_${encodeURIComponent(email.toLowerCase().trim())}`;
}

function salvarUsuarios() {
    salvarJSON(STORAGE_USERS, usuarios);
}

function salvarDadosUsuario() {
    if (!usuarioAtual) return;

    salvarJSON(obterChave("taskflow_tarefas"), tarefas);
    salvarJSON(obterChave("taskflow_notificacoes"), notificacoes);
    salvarJSON(obterChave("taskflow_configuracoes"), configuracoes);
}


/* 3. TAREFAS DE EXEMPLO */

function criarTarefasExemplo() {
    function dataRelativa(dias) {
        const data = new Date();
        data.setDate(data.getDate() + dias);

        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const dia = String(data.getDate()).padStart(2, "0");

        return `${ano}-${mes}-${dia}`;
    }

    const agora = new Date().toISOString();

    return [
        {
            id: Date.now() + 1,
            titulo: "Finalizar trabalho de Engenharia de Software",
            descricao: "Revisar o conteúdo, organizar os tópicos e preparar a versão final.",
            data: dataRelativa(2),
            prioridade: "high",
            concluida: false,
            criadaEm: agora
        },
        {
            id: Date.now() + 2,
            titulo: "Estudar para a avaliação de Banco de Dados",
            descricao: "Revisar SQL, relacionamentos, chaves estrangeiras e transações.",
            data: dataRelativa(1),
            prioridade: "high",
            concluida: false,
            criadaEm: agora
        },
        {
            id: Date.now() + 3,
            titulo: "Organizar os arquivos do projeto TaskFlow",
            descricao: "Revisar HTML, CSS e JavaScript e verificar as funcionalidades.",
            data: dataRelativa(4),
            prioridade: "medium",
            concluida: false,
            criadaEm: agora
        },
        {
            id: Date.now() + 4,
            titulo: "Entregar atividade de programação",
            descricao: "Conferir o código, realizar os testes e enviar a atividade.",
            data: dataRelativa(-1),
            prioridade: "high",
            concluida: false,
            criadaEm: agora
        },
        {
            id: Date.now() + 5,
            titulo: "Preparar apresentação do projeto",
            descricao: "Organizar os slides e revisar os pontos da demonstração.",
            data: dataRelativa(5),
            prioridade: "medium",
            concluida: false,
            criadaEm: agora
        },
        {
            id: Date.now() + 6,
            titulo: "Revisar conteúdo da última aula",
            descricao: "Ler as anotações e organizar os assuntos estudados.",
            data: dataRelativa(-2),
            prioridade: "low",
            concluida: true,
            criadaEm: agora,
            concluidaEm: agora
        }
    ];
}


/* 4. CARREGAR DADOS DO USUÁRIO */

function carregarDadosUsuario() {
    if (!usuarioAtual) return;

    const chaveTarefas = obterChave("taskflow_tarefas");
    const chaveNotificacoes = obterChave("taskflow_notificacoes");
    const chaveConfiguracoes = obterChave("taskflow_configuracoes");

    const tarefasExistem = localStorage.getItem(chaveTarefas) !== null;
    const notificacoesExistem = localStorage.getItem(chaveNotificacoes) !== null;
    const configuracoesExistem = localStorage.getItem(chaveConfiguracoes) !== null;

    if (tarefasExistem) {
        tarefas = lerJSON(chaveTarefas, []);
    } else {
        const antigas = localStorage.getItem("taskflow_tarefas");
        tarefas = antigas ? lerJSON("taskflow_tarefas", []) : [];
        salvarJSON(chaveTarefas, tarefas);
    }

    if (notificacoesExistem) {
        notificacoes = lerJSON(chaveNotificacoes, []);
    } else {
        const antigas = localStorage.getItem("taskflow_notificacoes");

        notificacoes = antigas
            ? lerJSON("taskflow_notificacoes", [])
            : [];

        salvarJSON(chaveNotificacoes, notificacoes);
    }

    if (configuracoesExistem) {
        const salvas = lerJSON(chaveConfiguracoes, {});

        configuracoes = {
            darkMode: salvas.temaInicializado === true
                ? salvas.darkMode === true
                : true,
            notificacoes: salvas.notificacoes !== false,
            temaInicializado: true
        };

        salvarJSON(chaveConfiguracoes, configuracoes);
    } else {
        const antigas = lerJSON("taskflow_configuracoes", {});

        configuracoes = {
            darkMode: true,
            notificacoes: antigas.notificacoes !== false,
            temaInicializado: true
        };

        salvarJSON(chaveConfiguracoes, configuracoes);
    }

    if (!Array.isArray(tarefas)) tarefas = [];
    if (!Array.isArray(notificacoes)) notificacoes = [];

    const chaveExemplos = obterChave("taskflow_exemplos");
    const exemplosAdicionados = localStorage.getItem(chaveExemplos);

    if (tarefas.length === 0 && exemplosAdicionados !== "true") {
        tarefas = criarTarefasExemplo();

        salvarJSON(chaveTarefas, tarefas);
        localStorage.setItem(chaveExemplos, "true");
    }
}


/* 5. USUÁRIOS E SESSÃO */

function carregarUsuarios() {
    const dados = lerJSON(STORAGE_USERS, []);
    usuarios = Array.isArray(dados) ? dados : [];
}

function salvarSessao() {
    if (!usuarioAtual) return;

    salvarJSON(STORAGE_SESSION, {
        email: usuarioAtual.email
    });
}

function recuperarSessao() {
    const sessao = lerJSON(STORAGE_SESSION, null);

    if (!sessao?.email) return false;

    const usuario = usuarios.find(
        item => item.email.toLowerCase() === sessao.email.toLowerCase()
    );

    if (!usuario) {
        localStorage.removeItem(STORAGE_SESSION);
        return false;
    }

    usuarioAtual = usuario;
    return true;
}

function iniciarSistema() {
    if (!usuarioAtual) return;

    perfilRevelado = false;
    carregarDadosUsuario();

    $("authScreen").classList.add("hidden");
    $("app").classList.remove("hidden");

    atualizarUsuarioNaTela();
    aplicarConfiguracoes();

    secaoAtual = "dashboard";
    mostrarSecao("dashboard");

    atualizarTudo();
}

function sairSistema() {
    salvarDadosUsuario();

    perfilRevelado = false;
    usuarioAtual = null;
    tarefas = [];
    notificacoes = [];

    localStorage.removeItem(STORAGE_SESSION);

    document.body.classList.add("dark-mode");

    $("app").classList.add("hidden");
    $("authScreen").classList.remove("hidden");

    $("loginBox").classList.remove("hidden");
    $("registerBox").classList.add("hidden");

    $("loginForm").reset();
    $("loginMessage").textContent = "";

    mostrarToast("Você saiu da sua conta.");
}


/* 6. LOGIN E CADASTRO */

$("showRegister").addEventListener("click", () => {
    $("loginBox").classList.add("hidden");
    $("registerBox").classList.remove("hidden");
    $("registerMessage").textContent = "";
});

$("showLogin").addEventListener("click", () => {
    $("registerBox").classList.add("hidden");
    $("loginBox").classList.remove("hidden");
    $("loginMessage").textContent = "";
});

$("registerForm").addEventListener("submit", event => {
    event.preventDefault();

    const nome = $("registerName").value.trim();
    const email = $("registerEmail").value.trim().toLowerCase();
    const senha = $("registerPassword").value;
    const confirmar = $("registerConfirmPassword").value;

    if (!nome || !email || !senha) {
        $("registerMessage").textContent = "Preencha todos os campos.";
        return;
    }

    if (!validarSenha(senha)) {
        $("registerMessage").textContent =
            "A senha deve ter pelo menos 8 caracteres e incluir letras e números.";
        return;
    }

    if (senha !== confirmar) {
        $("registerMessage").textContent = "As senhas não coincidem.";
        return;
    }

    const existe = usuarios.some(
        usuario => usuario.email.toLowerCase() === email
    );

    if (existe) {
        $("registerMessage").textContent =
            "Este e-mail já está cadastrado.";
        return;
    }

    const novoUsuario = {
        id: Date.now(),
        nome,
        email,
        senha
    };

    usuarios.push(novoUsuario);
    salvarUsuarios();

    usuarioAtual = novoUsuario;
    tarefas = [];
    notificacoes = [];

    configuracoes = {
        darkMode: true,
        notificacoes: true,
        temaInicializado: true
    };

    salvarDadosUsuario();
    salvarSessao();

    $("registerForm").reset();

    mostrarToast("Conta criada com sucesso!");
    iniciarSistema();
});

$("loginForm").addEventListener("submit", event => {
    event.preventDefault();

    const email = $("loginEmail").value.trim().toLowerCase();
    const senha = $("loginPassword").value;

    const usuario = usuarios.find(
        item => item.email.toLowerCase() === email
    );

    if (!usuario || usuario.senha !== senha) {
        $("loginMessage").textContent = "E-mail ou senha incorretos.";
        return;
    }

    usuarioAtual = usuario;

    salvarSessao();

    $("loginForm").reset();
    $("loginMessage").textContent = "";

    mostrarToast("Login realizado com sucesso!");
    iniciarSistema();
});

/* Mostrar e ocultar senha */

document.querySelectorAll(".show-password").forEach(botao => {
    botao.addEventListener("click", () => {
        const campo = $(botao.dataset.target);

        if (!campo) return;

        campo.type =
            campo.type === "password" ? "text" : "password";
    });
});


/* 7. PERFIL DO USUÁRIO */

function mascararNome(nome) {
    return nome.split(" ").filter(Boolean).map(parte => {
        if (parte.length <= 2) return parte.charAt(0) + "*";
        return parte.slice(0, 2) + "*".repeat(Math.min(parte.length - 2, 5));
    }).join(" ");
}

function mascararEmail(email) {
    const [usuario, dominio] = email.split("@");
    if (!dominio) return "••••••";
    const inicio = usuario.slice(0, Math.min(3, usuario.length));
    return `${inicio}${"*".repeat(Math.max(3, usuario.length - inicio.length))}@${dominio}`;
}

function atualizarUsuarioNaTela() {
    if (!usuarioAtual) return;

    const primeiroNome = usuarioAtual.nome.split(" ")[0];

    $("sidebarUserName").textContent = primeiroNome;
    $("sidebarUserEmail").textContent = mascararEmail(usuarioAtual.email);
    $("dashboardUserName").textContent = primeiroNome;

    $("userAvatar").textContent =
        usuarioAtual.nome.charAt(0).toUpperCase();

    $("settingsName").value = perfilRevelado
        ? usuarioAtual.nome
        : mascararNome(usuarioAtual.nome);

    $("settingsEmail").value = perfilRevelado
        ? usuarioAtual.email
        : mascararEmail(usuarioAtual.email);

    if ($("profileReveal")) {
        $("profileReveal").classList.toggle("hidden", perfilRevelado);
        $("editProfile").classList.toggle("hidden", !perfilRevelado);
    }

    if ($("profileCurrentPassword")) {
        definirEdicaoPerfil(false);
    }
}

$("logoutButton").addEventListener("click", () => {
    const desejaSair = window.confirm("Tem certeza de que deseja sair da sua conta?");
    if (desejaSair) sairSistema();
});


/* 8. NAVEGAÇÃO */

const secoes = {
    dashboard: {
        elemento: "dashboardSection",
        titulo: "Dashboard",
        subtitulo: "Visão geral das suas tarefas"
    },
    tasks: {
        elemento: "tasksSection",
        titulo: "Minhas Tarefas",
        subtitulo: "Gerencie todas as suas atividades"
    },
    pending: {
        elemento: "tasksSection",
        titulo: "Pendentes",
        subtitulo: "Tarefas que ainda precisam ser concluídas"
    },
    completed: {
        elemento: "tasksSection",
        titulo: "Concluídas",
        subtitulo: "Tarefas finalizadas"
    },
    priorities: {
        elemento: "tasksSection",
        titulo: "Prioridades",
        subtitulo: "Organize suas tarefas por importância"
    },
    calendar: {
        elemento: "calendarSection",
        titulo: "Calendário",
        subtitulo: "Visualize suas tarefas por data"
    },
    statistics: {
        elemento: "statisticsSection",
        titulo: "Estatísticas",
        subtitulo: "Acompanhe seu desempenho"
    },
    notifications: {
        elemento: "notificationsSection",
        titulo: "Notificações",
        subtitulo: "Acompanhe as atualizações"
    },
    settings: {
        elemento: "settingsSection",
        titulo: "Configurações",
        subtitulo: "Personalize sua experiência"
    }
};

function mostrarSecao(nome) {
    if (!secoes[nome]) return;

    if (nome !== "settings") {
        if (perfilRevelado) {
            perfilRevelado = false;
            atualizarUsuarioNaTela();
        }

        if ($("profileRevealPassword")) {
            $("profileRevealPassword").value = "";
        }
    }

    secaoAtual = nome;

    const ids = [
        "dashboardSection",
        "tasksSection",
        "calendarSection",
        "statisticsSection",
        "notificationsSection",
        "settingsSection"
    ];

    ids.forEach(id => $(id).classList.add("hidden"));

    const dados = secoes[nome];
    const secao = $(dados.elemento);

    secao.classList.remove("hidden");

    $("pageTitle").textContent = dados.titulo;
    $("pageSubtitle").textContent = dados.subtitulo;

    document.querySelectorAll(".menu-item").forEach(botao => {
        botao.classList.toggle(
            "active",
            botao.dataset.section === nome
        );
    });

    secao.classList.remove("animate-in");
    void secao.offsetWidth;
    secao.classList.add("animate-in");

    if (["tasks", "pending", "completed", "priorities"].includes(nome)) {
        renderizarListaTarefas();
    }

    if (nome === "calendar") renderizarCalendario();
    if (nome === "statistics") atualizarEstatisticas();
    if (nome === "notifications") renderizarNotificacoes();
}

document.querySelectorAll(".menu-item").forEach(botao => {
    botao.addEventListener("click", () => {
        mostrarSecao(botao.dataset.section);
    });
});


/* 9. MENSAGENS E TOASTS */

function mostrarToast(mensagem, tipo = "success") {
    let container = document.querySelector(".toast-container");

    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${tipo}`;
    toast.textContent = mensagem;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(20px)";

        setTimeout(() => toast.remove(), 250);
    }, 2800);
}

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}


/* 10. NOTIFICAÇÕES */

function criarNotificacao(titulo, mensagem) {
    if (!configuracoes.notificacoes) return;

    notificacoes.unshift({
        id: Date.now() + Math.random(),
        titulo,
        mensagem,
        data: new Date().toISOString(),
        lida: false
    });

    salvarDadosUsuario();
    atualizarBadgeNotificacoes();
}

function verificarAlertasDePrazo() {
    if (!usuarioAtual || !configuracoes.notificacoes) return;

    const hoje = new Date(`${dataLocalISO()}T00:00:00`);
    let adicionouAlerta = false;

    tarefas.forEach(tarefa => {
        if (tarefaConcluida(tarefa) || !tarefa.data) return;

        const vencimento = new Date(`${tarefa.data}T00:00:00`);
        if (Number.isNaN(vencimento.getTime())) return;

        const diferencaDias = Math.round((vencimento - hoje) / 86400000);
        let tipoAlerta = null;
        let titulo = "";
        let mensagem = "";

        if (diferencaDias < 0) {
            tipoAlerta = "atrasada";
            titulo = "Tarefa atrasada";
            mensagem = `A tarefa "${tarefa.titulo}" está atrasada. Verifique o prazo.`;
        } else if (diferencaDias <= 2) {
            tipoAlerta = "proxima";
            titulo = "Prazo se aproximando";
            mensagem = diferencaDias === 0
                ? `A tarefa "${tarefa.titulo}" vence hoje.`
                : `A tarefa "${tarefa.titulo}" vence em ${diferencaDias} dia(s).`;
        }

        if (!tipoAlerta) return;

        const jaExiste = notificacoes.some(item =>
            String(item.tarefaId) === String(tarefa.id) &&
            item.tipoAlerta === tipoAlerta &&
            item.dataPrazo === tarefa.data
        );

        if (jaExiste) return;

        notificacoes.unshift({
            id: `prazo-${tarefa.id}-${tipoAlerta}-${tarefa.data}`,
            tarefaId: tarefa.id,
            tipoAlerta,
            dataPrazo: tarefa.data,
            titulo,
            mensagem,
            data: new Date().toISOString(),
            lida: false
        });

        adicionouAlerta = true;
    });

    if (adicionouAlerta) {
        salvarDadosUsuario();
        atualizarBadgeNotificacoes();
    }
}

function atualizarBadgeNotificacoes() {
    const badge = $("notificationBadge");

    const quantidade = notificacoes.filter(
        item => !item.lida
    ).length;

    badge.textContent = quantidade;
    badge.classList.toggle("hidden", quantidade === 0);
}

function formatarDataHora(data) {
    const valor = new Date(data);

    if (Number.isNaN(valor.getTime())) return "";

    return valor.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

function renderizarNotificacoes() {
    const lista = $("notificationList");

    if (!notificacoes.length) {
        lista.innerHTML = `
            <div class="task-empty">
                <strong>Nenhuma notificação</strong>
                Você ainda não possui atualizações.
            </div>
        `;

        atualizarBadgeNotificacoes();
        return;
    }

    lista.innerHTML = notificacoes.map(item => `
        <div class="notification-item ${item.lida ? "" : "unread"}">
            <div class="notification-icon">🔔</div>

            <div class="notification-content">
                <strong>${escaparHTML(item.titulo)}</strong>
                <p>${escaparHTML(item.mensagem)}</p>
                <small>${formatarDataHora(item.data)}</small>
            </div>

            ${
                item.lida
                    ? `<span class="task-status status-completed">Lida</span>`
                    : `<button
                        class="notification-read"
                        data-notification-id="${escaparHTML(item.id)}"
                    >Marcar como lida</button>`
            }
        </div>
    `).join("");

    atualizarBadgeNotificacoes();
}

$("notificationList").addEventListener("click", event => {
    const botao = event.target.closest("[data-notification-id]");

    if (!botao) return;

    const item = notificacoes.find(
        n => String(n.id) === botao.dataset.notificationId
    );

    if (!item) return;

    item.lida = true;

    salvarDadosUsuario();
    renderizarNotificacoes();
});

$("markAllRead").addEventListener("click", () => {
    notificacoes.forEach(item => {
        item.lida = true;
    });

    salvarDadosUsuario();
    renderizarNotificacoes();

    mostrarToast("Todas as notificações foram marcadas como lidas.");
});


/* 11. DATAS E STATUS */

function dataLocalISO() {
    const data = new Date();

    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function formatarData(data) {
    if (!data) return "Sem data";

    const partes = String(data).split("-");

    if (partes.length !== 3) return data;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function tarefaConcluida(tarefa) {
    return tarefa.concluida === true ||
        tarefa.status === "concluida" ||
        tarefa.status === "completed";
}

function tarefaAtrasada(tarefa) {
    return !tarefaConcluida(tarefa) &&
        tarefa.data &&
        tarefa.data < dataLocalISO();
}

function normalizarPrioridade(prioridade) {
    const valor = String(prioridade || "medium").toLowerCase();

    if (["high", "alta"].includes(valor)) return "high";
    if (["low", "baixa"].includes(valor)) return "low";

    return "medium";
}

function textoPrioridade(prioridade) {
    const nomes = {
        high: "Alta",
        medium: "Média",
        low: "Baixa"
    };

    return nomes[normalizarPrioridade(prioridade)];
}

function normalizarCategoria(categoria) {
    const permitidas = ["Estudos", "Trabalho", "Pessoal", "Projetos", "Outros"];
    return permitidas.includes(categoria) ? categoria : "Sem categoria";
}


/* 12. MODAL DE TAREFAS */

function abrirModal(tarefa = null) {
    $("taskForm").reset();
    $("taskId").value = "";

    $("modalTitle").textContent =
        tarefa ? "Editar tarefa" : "Nova tarefa";

    $("taskDate").value = dataLocalISO();

    if (tarefa) {
        $("taskId").value = tarefa.id;
        $("taskTitle").value = tarefa.titulo || "";
        $("taskDescription").value = tarefa.descricao || "";
        $("taskDate").value = tarefa.data || dataLocalISO();
        $("taskPriority").value = normalizarPrioridade(tarefa.prioridade);
        $("taskCategory").value = normalizarCategoria(tarefa.categoria);
    } else {
        $("taskCategory").value = "Estudos";
    }

    $("taskModal").classList.remove("hidden");
    $("taskTitle").focus();
}

function fecharModal() {
    $("taskModal").classList.add("hidden");
    $("taskForm").reset();
}

$("newTaskButtonTasks").addEventListener("click", () => abrirModal());

$("dashboardNewTaskButton").addEventListener("click", () => abrirModal());

$("openFullReport").addEventListener("click", () => mostrarSecao("statistics"));

$("closeModal").addEventListener("click", fecharModal);

$("cancelModal").addEventListener("click", fecharModal);

$("taskModal").addEventListener("click", event => {
    if (event.target === $("taskModal")) fecharModal();
});

document.addEventListener("keydown", event => {
    if (
        event.key === "Escape" &&
        !$("taskModal").classList.contains("hidden")
    ) {
        fecharModal();
    }
});


/* 13. CRIAR E EDITAR TAREFAS */

$("taskForm").addEventListener("submit", event => {
    event.preventDefault();

    if (!usuarioAtual) {
        mostrarToast("Faça login para salvar tarefas.", "error");
        return;
    }

    const id = $("taskId").value;
    const titulo = $("taskTitle").value.trim();
    const descricao = $("taskDescription").value.trim();
    const data = $("taskDate").value;
    const prioridade = $("taskPriority").value;
    const categoria = normalizarCategoria($("taskCategory").value);

    if (!titulo || !data) {
        mostrarToast("Preencha o título e a data.", "error");
        return;
    }

    if (id) {
        const tarefa = tarefas.find(
            item => String(item.id) === String(id)
        );

        if (!tarefa) return;

        tarefa.titulo = titulo;
        tarefa.descricao = descricao;
        tarefa.data = data;
        tarefa.prioridade = prioridade;
        tarefa.categoria = categoria;
        tarefa.atualizadaEm = new Date().toISOString();

        criarNotificacao(
            "Tarefa atualizada",
            `A tarefa "${titulo}" foi atualizada.`
        );

        mostrarToast("Tarefa atualizada com sucesso!");
    } else {
        tarefas.unshift({
            id: Date.now(),
            titulo,
            descricao,
            data,
            prioridade,
            categoria,
            concluida: false,
            criadaEm: new Date().toISOString()
        });

        criarNotificacao(
            "Nova tarefa criada",
            `A tarefa "${titulo}" foi adicionada.`
        );

        mostrarToast("Tarefa criada com sucesso!");
    }

    salvarDadosUsuario();
    fecharModal();
    atualizarTudo();
});


/* 14. EXIBIÇÃO DAS TAREFAS */

function obterTarefasDaSecao() {
    if (secaoAtual === "pending") {
        return tarefas.filter(item => !tarefaConcluida(item));
    }

    if (secaoAtual === "completed") {
        return tarefas.filter(tarefaConcluida);
    }

    if (secaoAtual === "priorities") {
        const ordem = { high: 0, medium: 1, low: 2 };

        return tarefas
            .filter(item => !tarefaConcluida(item))
            .sort((a, b) =>
                ordem[normalizarPrioridade(a.prioridade)] -
                ordem[normalizarPrioridade(b.prioridade)]
            );
    }

    return tarefas;
}

function renderizarTarefa(tarefa) {
    const concluida = tarefaConcluida(tarefa);
    const atrasada = tarefaAtrasada(tarefa);
    const prioridade = normalizarPrioridade(tarefa.prioridade);

    let status;

    if (concluida) {
        status = `<span class="task-status status-completed">Concluída</span>`;
    } else if (atrasada) {
        status = `<span class="task-status status-overdue">Atrasada</span>`;
    } else {
        status = `<span class="task-status status-pending">Pendente</span>`;
    }

    return `
        <article class="task-card ${concluida ? "completed" : ""}"
            data-task-card="${escaparHTML(tarefa.id)}">

            <div class="task-info">
                <div class="task-title">
                    ${escaparHTML(tarefa.titulo)}
                </div>

                ${
                    tarefa.descricao
                        ? `<div class="task-description">
                            ${escaparHTML(tarefa.descricao)}
                        </div>`
                        : ""
                }

                <div class="task-meta">
                    <span>📅 ${formatarData(tarefa.data)}</span>

                    <span class="task-category">${escaparHTML(normalizarCategoria(tarefa.categoria))}</span>

                    <span class="task-priority priority-${prioridade}">
                        Prioridade ${textoPrioridade(prioridade)}
                    </span>

                    ${status}
                </div>
            </div>

            <div class="task-actions">
                ${
                    !concluida
                        ? `<button class="task-action complete-action"
                            data-action="complete"
                            data-id="${escaparHTML(tarefa.id)}"
                            title="Concluir tarefa">✓</button>`
                        : `<button class="task-action"
                            data-action="undo"
                            data-id="${escaparHTML(tarefa.id)}"
                            title="Reabrir tarefa">↶</button>`
                }

                <button class="task-action"
                    data-action="edit"
                    data-id="${escaparHTML(tarefa.id)}"
                    title="Editar tarefa">✎</button>

                <button class="task-action delete-action"
                    data-action="delete"
                    data-id="${escaparHTML(tarefa.id)}"
                    title="Excluir tarefa">🗑</button>
            </div>
        </article>
    `;
}

function renderizarListaTarefas() {
    const lista = $("allTasksList");
    let resultado = obterTarefasDaSecao();
    const filtroCategoria = $("categoryFilter")?.value || "all";

    if (filtroCategoria !== "all") {
        resultado = resultado.filter(tarefa =>
            normalizarCategoria(tarefa.categoria) === filtroCategoria
        );
    }

    if (!resultado.length) {
        lista.innerHTML = `
            <div class="task-empty">
                <strong>Nenhuma tarefa encontrada</strong>
                Não existem tarefas nesta categoria.
            </div>
        `;
        return;
    }

    lista.innerHTML = resultado.map(renderizarTarefa).join("");
}

$("categoryFilter").addEventListener("change", renderizarListaTarefas);

function renderizarDashboard() {
    // O Dashboard apresenta indicadores e produtividade.
    // A lista completa fica exclusivamente em "Minhas Tarefas".
}


/* 15. AÇÕES DAS TAREFAS */

document.addEventListener("click", event => {
    const botao = event.target.closest("[data-action]");

    if (!botao) return;

    const acao = botao.dataset.action;
    const id = botao.dataset.id;

    const tarefa = tarefas.find(
        item => String(item.id) === String(id)
    );

    if (!tarefa) return;

    if (acao === "complete") {
        const card = botao.closest(".task-card");

        if (card) {
            card.classList.add("completing");
        }

        tarefa.concluida = true;
        tarefa.concluidaEm = new Date().toISOString();

        salvarDadosUsuario();

        criarNotificacao(
            "Tarefa concluída",
            `Você concluiu a tarefa "${tarefa.titulo}".`
        );

        mostrarToast("Parabéns! Tarefa concluída.");

        setTimeout(() => {
            atualizarTudo();
        }, 400);

        return;
    }

    if (acao === "undo") {
        tarefa.concluida = false;
        delete tarefa.concluidaEm;

        salvarDadosUsuario();

        criarNotificacao(
            "Tarefa reaberta",
            `A tarefa "${tarefa.titulo}" voltou para pendentes.`
        );

        mostrarToast("Tarefa reaberta.");
        atualizarTudo();
        return;
    }

    if (acao === "edit") {
        abrirModal(tarefa);
        return;
    }

    if (acao === "delete") {
        const confirmar = confirm(
            `Deseja realmente excluir a tarefa "${tarefa.titulo}"?`
        );

        if (!confirmar) return;

        tarefas = tarefas.filter(
            item => String(item.id) !== String(id)
        );

        salvarDadosUsuario();

        criarNotificacao(
            "Tarefa excluída",
            `A tarefa "${tarefa.titulo}" foi removida.`
        );

        mostrarToast("Tarefa excluída.");
        atualizarTudo();
    }
});


/* 16. DASHBOARD */

function atualizarDashboard() {
    const total = tarefas.length;

    const concluidas = tarefas.filter(tarefaConcluida).length;

    const pendentes = tarefas.filter(
        item => !tarefaConcluida(item)
    ).length;

    const atrasadas = tarefas.filter(tarefaAtrasada).length;

    $("totalTasks").textContent = total;
    $("pendingTasks").textContent = pendentes;
    $("completedTasks").textContent = concluidas;
    $("overdueTasks").textContent = atrasadas;

    const percentual = total
        ? Math.round((concluidas / total) * 100)
        : 0;

    const limiteSemana = new Date();
    limiteSemana.setHours(0, 0, 0, 0);
    limiteSemana.setDate(limiteSemana.getDate() - 6);

    const concluidasNaSemana = tarefas.filter(item => {
        if (!tarefaConcluida(item) || !item.concluidaEm) return false;
        const dataConclusao = new Date(item.concluidaEm);
        return !Number.isNaN(dataConclusao.getTime()) && dataConclusao >= limiteSemana;
    }).length;

    $("dashboardCompletionPercentage").textContent = `${percentual}%`;
    $("dashboardProgressFill").style.width = `${percentual}%`;
    $("dashboardWeeklyCompleted").textContent = concluidasNaSemana;
    $("dashboardInProgress").textContent = pendentes;

    $("dashboardProgressMessage").textContent = total === 0
        ? "Cadastre sua primeira tarefa para começar a acompanhar sua produtividade."
        : `${concluidas} de ${total} tarefa(s) concluída(s). Continue acompanhando seu progresso!`;

    renderizarDashboard();
}


/* 17. ESTATÍSTICAS */

function atualizarEstatisticas() {
    const total = tarefas.length;

    const concluidas = tarefas.filter(tarefaConcluida).length;

    const pendentes = tarefas.filter(
        item => !tarefaConcluida(item)
    ).length;

    const atrasadas = tarefas.filter(tarefaAtrasada).length;

    const percentual = total
        ? Math.round((concluidas / total) * 100)
        : 0;

    $("statisticsTotal").textContent = total;
    $("statisticsCompleted").textContent = concluidas;
    $("statisticsPending").textContent = pendentes;
    $("statisticsOverdue").textContent = atrasadas;

    $("completionPercentage").textContent = `${percentual}%`;
    $("progressFill").style.width = `${percentual}%`;

    const altas = tarefas.filter(
        item => normalizarPrioridade(item.prioridade) === "high"
    ).length;

    const medias = tarefas.filter(
        item => normalizarPrioridade(item.prioridade) === "medium"
    ).length;

    const baixas = tarefas.filter(
        item => normalizarPrioridade(item.prioridade) === "low"
    ).length;

    $("highPriorityCount").textContent = altas;
    $("mediumPriorityCount").textContent = medias;
    $("lowPriorityCount").textContent = baixas;

    $("highPriorityBar").style.width =
        `${total ? (altas / total) * 100 : 0}%`;

    $("mediumPriorityBar").style.width =
        `${total ? (medias / total) * 100 : 0}%`;

    $("lowPriorityBar").style.width =
        `${total ? (baixas / total) * 100 : 0}%`;
}


/* 18. CALENDÁRIO */

function renderizarCalendario() {
    const container = $("calendarDays");
    const titulo = $("calendarMonth");

    const nomesMeses = [
        "Janeiro", "Fevereiro", "Março",
        "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro",
        "Outubro", "Novembro", "Dezembro"
    ];

    titulo.textContent = `${nomesMeses[mesAtual]} ${anoAtual}`;

    const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();

    const ultimoDia = new Date(anoAtual, mesAtual + 1, 0).getDate();

    const ultimoDiaAnterior = new Date(anoAtual, mesAtual, 0).getDate();

    const hoje = dataLocalISO();

    let html = "";

    for (let i = 0; i < 42; i++) {
        let dia;
        let mes = mesAtual;
        let ano = anoAtual;
        let outroMes = false;

        if (i < primeiroDia) {
            dia = ultimoDiaAnterior - primeiroDia + i + 1;
            mes--;

            if (mes < 0) {
                mes = 11;
                ano--;
            }

            outroMes = true;
        } else if (i >= primeiroDia + ultimoDia) {
            dia = i - primeiroDia - ultimoDia + 1;
            mes++;

            if (mes > 11) {
                mes = 0;
                ano++;
            }

            outroMes = true;
        } else {
            dia = i - primeiroDia + 1;
        }

        const dataCompleta =
            `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

        const tarefasDoDia = tarefas.filter(
            item => item.data === dataCompleta
        );

        html += `
            <div class="calendar-day
                ${outroMes ? "other-month" : ""}
                ${dataCompleta === hoje ? "today" : ""}">

                <span class="calendar-day-number">${dia}</span>

                ${tarefasDoDia.slice(0, 2).map(item => `
                    <span class="calendar-task-indicator
                        ${tarefaConcluida(item) ? "done" : ""}"
                        title="${escaparHTML(item.titulo)}">
                        ${escaparHTML(item.titulo)}
                    </span>
                `).join("")}

                ${
                    tarefasDoDia.length > 2
                        ? `<span class="calendar-task-indicator">
                            +${tarefasDoDia.length - 2} tarefa(s)
                        </span>`
                        : ""
                }
            </div>
        `;
    }

    container.innerHTML = html;
}

$("previousMonth").addEventListener("click", () => {
    mesAtual--;

    if (mesAtual < 0) {
        mesAtual = 11;
        anoAtual--;
    }

    renderizarCalendario();
});

$("nextMonth").addEventListener("click", () => {
    mesAtual++;

    if (mesAtual > 11) {
        mesAtual = 0;
        anoAtual++;
    }

    renderizarCalendario();
});


/* 19. CONFIGURAÇÕES DO PERFIL */

function validarSenha(senha) {
    return senha.length >= 8 &&
        /[A-Za-zÀ-ÿ]/.test(senha) &&
        /[0-9]/.test(senha);
}

function definirEdicaoPerfil(permitirEdicao) {
    $("settingsName").readOnly = !permitirEdicao;
    $("settingsEmail").readOnly = !permitirEdicao;

    $("editProfile").classList.toggle("hidden", permitirEdicao);
    $("profileConfirmation").classList.toggle("hidden", !permitirEdicao);
    $("profileActions").classList.toggle("hidden", !permitirEdicao);

    if (permitirEdicao) {
        $("settingsName").focus();
    } else {
        $("profileCurrentPassword").value = "";
    }
}

$("revealProfile").addEventListener("click", () => {
    if (!usuarioAtual) return;

    const senha = $("profileRevealPassword").value;

    if (senha !== usuarioAtual.senha) {
        mostrarToast("A senha atual está incorreta.", "error");
        $("profileRevealPassword").focus();
        return;
    }

    perfilRevelado = true;
    $("profileRevealPassword").value = "";
    atualizarUsuarioNaTela();
    mostrarToast("Informações desbloqueadas.");
});

$("editProfile").addEventListener("click", () => {
    if (!usuarioAtual) return;
    atualizarUsuarioNaTela();
    definirEdicaoPerfil(true);
});

$("cancelProfile").addEventListener("click", () => {
    atualizarUsuarioNaTela();
    definirEdicaoPerfil(false);
    mostrarToast("Edição cancelada.");
});

$("saveProfile").addEventListener("click", () => {
    if (!usuarioAtual) return;

    const nome = $("settingsName").value.trim();
    const email = $("settingsEmail").value.trim().toLowerCase();
    const senhaAtual = $("profileCurrentPassword").value;

    if (!nome || !email) {
        mostrarToast("Preencha o nome e o e-mail.", "error");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        mostrarToast("Digite um endereço de e-mail válido.", "error");
        return;
    }

    if (senhaAtual !== usuarioAtual.senha) {
        mostrarToast("A senha atual está incorreta.", "error");
        $("profileCurrentPassword").focus();
        return;
    }

    const outroUsuario = usuarios.find(item =>
        item.email.toLowerCase() === email &&
        item.id !== usuarioAtual.id
    );

    if (outroUsuario) {
        mostrarToast("Este e-mail já pertence a outra conta.", "error");
        return;
    }

    const emailAnterior = usuarioAtual.email;

    const dadosAntigos = {
        tarefas: [...tarefas],
        notificacoes: [...notificacoes],
        configuracoes: { ...configuracoes }
    };

    usuarioAtual.nome = nome;
    usuarioAtual.email = email;

    const indice = usuarios.findIndex(item => item.id === usuarioAtual.id);
    if (indice !== -1) usuarios[indice] = usuarioAtual;

    salvarUsuarios();

    salvarJSON(obterChave("taskflow_tarefas"), dadosAntigos.tarefas);
    salvarJSON(obterChave("taskflow_notificacoes"), dadosAntigos.notificacoes);
    salvarJSON(obterChave("taskflow_configuracoes"), dadosAntigos.configuracoes);

    salvarSessao();
    perfilRevelado = false;
    atualizarUsuarioNaTela();
    definirEdicaoPerfil(false);

    mostrarToast(
        emailAnterior === email
            ? "Perfil atualizado com sucesso!"
            : "Perfil atualizado. Seus dados foram mantidos."
    );
});

$("savePassword").addEventListener("click", () => {
    if (!usuarioAtual) return;

    const senhaAtual = $("currentPassword").value;
    const novaSenha = $("newPassword").value;
    const confirmar = $("confirmPassword").value;

    if (!senhaAtual || !novaSenha || !confirmar) {
        mostrarToast("Preencha todos os campos de senha.", "error");
        return;
    }

    if (senhaAtual !== usuarioAtual.senha) {
        mostrarToast("A senha atual está incorreta.", "error");
        $("currentPassword").focus();
        return;
    }

    if (!validarSenha(novaSenha)) {
        mostrarToast(
            "A nova senha precisa ter 8 caracteres ou mais, com letras e números.",
            "error"
        );
        return;
    }

    if (novaSenha === senhaAtual) {
        mostrarToast("A nova senha deve ser diferente da senha atual.", "error");
        return;
    }

    if (novaSenha !== confirmar) {
        mostrarToast("A confirmação da nova senha não coincide.", "error");
        $("confirmPassword").focus();
        return;
    }

    usuarioAtual.senha = novaSenha;
    salvarUsuarios();

    $("currentPassword").value = "";
    $("newPassword").value = "";
    $("confirmPassword").value = "";

    mostrarToast("Senha alterada com sucesso!");
});


/* 20. PREFERÊNCIAS */

function aplicarConfiguracoes() {
    document.body.classList.toggle(
        "dark-mode",
        configuracoes.darkMode
    );

    $("darkModeToggle").checked = configuracoes.darkMode;
    $("notificationsToggle").checked = configuracoes.notificacoes;
}

$("darkModeToggle").addEventListener("change", event => {
    configuracoes.darkMode = event.target.checked;

    salvarDadosUsuario();
    aplicarConfiguracoes();
});

$("notificationsToggle").addEventListener("change", event => {
    configuracoes.notificacoes = event.target.checked;

    salvarDadosUsuario();

    mostrarToast(
        event.target.checked
            ? "Notificações ativadas."
            : "Notificações desativadas."
    );
});

$("resetSettings").addEventListener("click", () => {
    const confirmar = confirm(
        "Deseja restaurar as preferências para os valores padrão?"
    );

    if (!confirmar) return;

    configuracoes = {
        darkMode: true,
        notificacoes: true,
        temaInicializado: true
    };

    salvarDadosUsuario();
    aplicarConfiguracoes();

    mostrarToast("Preferências restauradas.");
});


/* 21. ATUALIZAÇÃO GERAL */

function atualizarTudo() {
    verificarAlertasDePrazo();
    atualizarDashboard();
    atualizarEstatisticas();
    renderizarListaTarefas();
    renderizarCalendario();
    renderizarNotificacoes();
    atualizarBadgeNotificacoes();

    salvarDadosUsuario();
}


/* 22. INICIALIZAÇÃO */

function inicializarTaskFlow() {
    carregarUsuarios();

    document.body.classList.add("dark-mode");

    // A tela de abertura é exibida antes do login.
    // Os dados das contas, tarefas e configurações são preservados.
    usuarioAtual = null;
    localStorage.removeItem(STORAGE_SESSION);

    $("app").classList.add("hidden");
    $("authScreen").classList.add("hidden");
    $("splashScreen").classList.remove("hidden");

    $("loginBox").classList.remove("hidden");
    $("registerBox").classList.add("hidden");

    $("loginForm").reset();
    $("loginMessage").textContent = "";

    window.setTimeout(() => {
        $("splashScreen").classList.add("hidden");
        $("authScreen").classList.remove("hidden");
    }, 1900);
}

inicializarTaskFlow();