
        lucide.createIcons();
        // FUNCIONES DE LA BARRA DE NAVEGACION
        function switchTab(tabId) {
            document.querySelectorAll('.module-content').forEach(el => el.classList.add('hidden'));
            document.getElementById(`module-${tabId}`).classList.remove('hidden');

            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('text-cyan-400', 'bg-slate-800');
                btn.classList.add('text-slate-400');
            });
            
            const activeBtn = document.getElementById(`tab-${tabId}`);
            if (activeBtn) {
                activeBtn.classList.remove('text-slate-400');
                activeBtn.classList.add('text-cyan-400', 'bg-slate-800');
            }

            document.querySelectorAll('.tab-btn-m').forEach(btn => {
                btn.classList.remove('bg-cyan-600', 'text-white');
                btn.classList.add('text-slate-400');
            });
            const activeBtnM = document.getElementById(`tab-${tabId}-m`);
            if (activeBtnM) {
                activeBtnM.classList.add('bg-cyan-600', 'text-white');
            }
        }
            
        function switchConcSubTab(subId) {
            document.querySelectorAll('.conc-view').forEach(el => el.classList.add('hidden'));
            document.getElementById(`conc-view-${subId}`).classList.remove('hidden');

            document.querySelectorAll('.conc-sub-btn').forEach(btn => {
                btn.classList.remove('bg-indigo-600', 'text-white');
                btn.classList.add('text-slate-400');
            });
            document.getElementById(`conc-subtab-${subId}`).classList.add('bg-indigo-600', 'text-white');
        }

        function showOOMModal(message) {
            document.getElementById('oom-modal-msg').innerText = message;
            document.getElementById('oom-modal').classList.remove('hidden');
        }
        function closeOOMModal() {
            document.getElementById('oom-modal').classList.add('hidden');
        }

        // PARTE 1: Gestión y Planificación de Procesos
        let RAM_MAX = 100;
        let processes = [
            { id: 1, name: 'P1', arrival: 0, burst: 6, remaining: 6, ram: 25, status: 'LISTO', color: 'bg-cyan-500' },
            { id: 2, name: 'P2', arrival: 1, burst: 4, remaining: 4, ram: 30, status: 'LISTO', color: 'bg-indigo-500' },
            { id: 3, name: 'P3', arrival: 2, burst: 3, remaining: 3, ram: 20, status: 'LISTO', color: 'bg-emerald-500' }
        ];

        let procTimer = null;
        let currentTime = 0;
        let currentQuantumTime = 0;
        let isRunning = false;
        let ganttHistory = [];
        let readyQueue = [];

        function renderProcessTable() {
            const tbody = document.getElementById('process-table-body');
            tbody.innerHTML = '';
            processes.forEach((p, idx) => {
                tbody.innerHTML += `
                    <tr>
                        <td class="py-2 font-bold flex items-center gap-1.5">
                            <span class="w-2.5 h-2.5 rounded-full ${p.color}"></span> ${p.name} (PID ${p.id})
                        </td>
                        <td class="py-2">
                            <span class="px-2 py-0.5 text-[10px] font-bold rounded ${
                                p.status === 'EJECUCION' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                p.status === 'TERMINADO' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                                p.status === 'BLOQUEADO' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                'bg-slate-800 text-slate-300'
                            }">${p.status}</span>
                        </td>
                        <td class="py-2">${p.ram} MB</td>
                        <td class="py-2">${p.burst} / <strong class="text-cyan-400">${p.remaining}</strong></td>
                        <td class="py-2 text-right">
                            <button onclick="removeProcess(${idx})" class="text-rose-400 hover:text-rose-300">
                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            lucide.createIcons();
            renderMemoryMap();
        }

        function addProcessFromForm() {
            const arrival = parseInt(document.getElementById('new-proc-arrival').value) || 0;
            const burst = parseInt(document.getElementById('new-proc-burst').value) || 3;
            const ram = parseInt(document.getElementById('new-proc-ram').value) || 20;

            // Comprobar la asignación de memoria actual
            let currentUsedRAM = processes.reduce((acc, p) => acc + (p.status !== 'TERMINADO' ? p.ram : 0), 0);

            if (currentUsedRAM + ram > RAM_MAX) {
                showOOMModal(`Error de Desbordamiento: No se puede asignar ${ram} MB. RAM Usada: ${currentUsedRAM} MB / ${RAM_MAX} MB Max.`);
                return;
            }

            const colors = ['bg-pink-500', 'bg-purple-500', 'bg-amber-500', 'bg-teal-500'];
            const nextId = processes.length + 1;
            processes.push({
                id: nextId,
                name: `P${nextId}`,
                arrival: arrival,
                burst: burst,
                remaining: burst,
                ram: ram,
                status: 'LISTO',
                color: colors[processes.length % colors.length]
            });
            renderProcessTable();
            resetProcSim();
        }

        function removeProcess(index) {
            processes.splice(index, 1);
            renderProcessTable();
            resetProcSim();
        }

        function toggleProcSim() {
            if (isRunning) {
                clearInterval(procTimer);
                isRunning = false;
                document.getElementById('proc-play-btn').innerHTML = `<i data-lucide="play" class="w-4 h-4"></i> Reanudar`;
            } else {
                isRunning = true;
                document.getElementById('proc-play-btn').innerHTML = `<i data-lucide="pause" class="w-4 h-4"></i> Pausar`;
                procTimer = setInterval(stepProcSim, 1000);
            }
            lucide.createIcons();
        }

        function resetProcSim() {
            clearInterval(procTimer);
            isRunning = false;
            currentTime = 0;
            currentQuantumTime = 0;
            ganttHistory = [];
            readyQueue = [];
            processes.forEach(p => {
                p.remaining = p.burst;
                p.status = 'LISTO';
            });
            document.getElementById('proc-play-btn').innerHTML = `<i data-lucide="play" class="w-4 h-4"></i> Iniciar`;
            document.getElementById('current-clock-time').innerText = '0';
            document.getElementById('quantum-counter').innerText = document.getElementById('proc-quantum').value;
            document.getElementById('cpu-status-box').innerHTML = `
                <div class="w-14 h-14 mx-auto rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-lg mb-2 border border-slate-700">
                    IDLE
                </div>
                <span class="text-xs text-slate-500">Sin procesos ejecutandose</span>
            `;
            document.getElementById('ready-queue-container').innerHTML = `<span class="text-xs text-slate-600 italic">Cola vacia</span>`;
            document.getElementById('gantt-bars').innerHTML = '';
            document.getElementById('gantt-timeline').innerHTML = '';
            document.getElementById('metric-avg-wt').innerText = '0.00 u';
            document.getElementById('metric-avg-tat').innerText = '0.00 u';
            renderProcessTable();
            lucide.createIcons();
        }

        function stepProcSim() {
            const algo = document.getElementById('proc-algo').value;
            const quantum = parseInt(document.getElementById('proc-quantum').value) || 3;

            // Consultar llegadas
            processes.forEach(p => {
                if (p.arrival === currentTime && p.remaining > 0 && !readyQueue.includes(p)) {
                    readyQueue.push(p);
                }
            });

            let activeProc = null;

            if (algo === 'RR') {
                if (readyQueue.length > 0) {
                    activeProc = readyQueue[0];
                }
            } else if (algo === 'FCFS') {
                if (readyQueue.length > 0) activeProc = readyQueue[0];
            } else if (algo === 'SRTF') {
                let avail = processes.filter(p => p.arrival <= currentTime && p.remaining > 0);
                if (avail.length > 0) {
                    avail.sort((a, b) => a.remaining - b.remaining);
                    activeProc = avail[0];
                }
            }

            if (activeProc) {
                processes.forEach(p => { if (p.remaining > 0 && p !== activeProc) p.status = 'LISTO'; });
                activeProc.status = 'EJECUCION';
                ganttHistory.push({ time: currentTime, process: activeProc });
                activeProc.remaining--;
                currentQuantumTime++;

                document.getElementById('cpu-status-box').innerHTML = `
                    <div class="w-14 h-14 mx-auto rounded-xl ${activeProc.color} text-white flex items-center justify-center font-bold text-lg mb-2 shadow-lg animate-pulse">
                        ${activeProc.name}
                    </div>
                    <span class="text-xs text-cyan-400 font-bold">PID ${activeProc.id} | Restante: ${activeProc.remaining}</span>
                `;

                if (activeProc.remaining === 0) {
                    activeProc.status = 'TERMINADO';
                    readyQueue = readyQueue.filter(p => p.id !== activeProc.id);
                    currentQuantumTime = 0;
                } else if (algo === 'RR' && currentQuantumTime >= quantum) {
                    // CAMBIO DE CONTEXTO
                    activeProc.status = 'LISTO';
                    readyQueue.shift();
                    readyQueue.push(activeProc);
                    currentQuantumTime = 0;
                }
            } else {
                ganttHistory.push({ time: currentTime, process: null });
                document.getElementById('cpu-status-box').innerHTML = `
                    <div class="w-14 h-14 mx-auto rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-lg mb-2 border border-slate-700">
                        IDLE
                    </div>
                    <span class="text-xs text-slate-500 font-medium">Esperando procesos...</span>
                `;
            }

            // Ver cola de espera
            const readyView = document.getElementById('ready-queue-container');
            readyView.innerHTML = '';
            const queueDisplay = readyQueue.filter(p => p !== activeProc);
            if (queueDisplay.length === 0) {
                readyView.innerHTML = `<span class="text-xs text-slate-600 italic">Sin cola de esperas</span>`;
            } else {
                queueDisplay.forEach(p => {
                    readyView.innerHTML += `<span class="px-2.5 py-1 rounded-lg text-xs font-bold text-white ${p.color} shadow-sm">${p.name}</span>`;
                });
            }

            renderProcessTable();
            renderGantt();

            currentTime++;
            document.getElementById('current-clock-time').innerText = currentTime;
            document.getElementById('quantum-counter').innerText = Math.max(0, quantum - currentQuantumTime);

            if (processes.every(p => p.remaining === 0)) {
                clearInterval(procTimer);
                isRunning = false;
                document.getElementById('proc-play-btn').innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> Completado`;
                calculateMetrics();
                lucide.createIcons();
            }
        }

        function renderGantt() {
            const ganttBars = document.getElementById('gantt-bars');
            const ganttTimeline = document.getElementById('gantt-timeline');
            
            ganttBars.innerHTML = '';
            ganttTimeline.innerHTML = `<span class="w-6">0</span>`;

            ganttHistory.forEach((item, idx) => {
                const color = item.process ? item.process.color : 'bg-slate-800';
                const label = item.process ? item.process.name : '-';
                ganttBars.innerHTML += `<div class="flex-1 ${color} flex items-center justify-center text-[10px] font-bold text-white border-r border-slate-900">${label}</div>`;
                ganttTimeline.innerHTML += `<span class="flex-1 text-right">${idx + 1}</span>`;
            });
        }

        function calculateMetrics() {
            let totalWT = 0;
            let totalTAT = 0;

            processes.forEach(p => {
                let completionTime = 0;
                for (let i = ganttHistory.length - 1; i >= 0; i--) {
                    if (ganttHistory[i].process && ganttHistory[i].process.id === p.id) {
                        completionTime = i + 1;
                        break;
                    }
                }
                const tat = completionTime - p.arrival;
                const wt = tat - p.burst;

                totalWT += Math.max(0, wt);
                totalTAT += Math.max(0, tat);
            });

            const avgWT = (totalWT / processes.length).toFixed(2);
            const avgTAT = (totalTAT / processes.length).toFixed(2);

            document.getElementById('metric-avg-wt').innerText = `${avgWT} u`;
            document.getElementById('metric-avg-tat').innerText = `${avgTAT} u`;
        }

        // PARTE 2: Gestión de Memoria
        let memoryAllocations = [
            { id: 'P1', size: 25, color: 'bg-cyan-500' },
            { id: 'P2', size: 30, color: 'bg-indigo-500' },
            { id: 'P3', size: 20, color: 'bg-emerald-500' }
        ];

        function renderMemoryMap() {
            const container = document.getElementById('ram-map-container');
            const listContainer = document.getElementById('memory-blocks-list');
            if (!container || !listContainer) return;

            container.innerHTML = '';
            listContainer.innerHTML = '';

            let totalUsed = 0;

            // Importar la memoria utilizada de los procesos activos en la parte 1 o ingresarlos desde una lista manual
            const activeProcs = processes.filter(p => p.status !== 'TERMINADO');

            activeProcs.forEach(p => {
                totalUsed += p.ram;
                const widthPct = (p.ram / RAM_MAX) * 100;

                const blockEl = document.createElement('div');
                blockEl.style.width = `${widthPct}%`;
                blockEl.className = `h-full border-r border-slate-900 transition-all flex flex-col items-center justify-center p-1 text-center cursor-pointer ${p.color} text-white hover:opacity-90`;
                blockEl.onclick = () => freeRamBlock(p.id);
                blockEl.innerHTML = `
                    <span class="font-bold text-[10px] truncate">${p.name}</span>
                    <span class="text-[9px] opacity-90">${p.ram} MB</span>
                `;
                container.appendChild(blockEl);

                listContainer.innerHTML += `
                    <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                        <div>
                            <span class="font-bold text-slate-200">${p.name} (PID ${p.id})</span>
                            <div class="text-[10px] text-slate-400">Asignado: <strong class="text-emerald-400">${p.ram} MB RAM</strong></div>
                        </div>
                        <button onclick="freeRamBlock(${p.id})" class="px-2 py-1 bg-rose-500/20 text-rose-400 text-[10px] font-bold rounded hover:bg-rose-500/30">
                            Liberar
                        </button>
                    </div>
                `;
            });

            const freeRAM = RAM_MAX - totalUsed;
            if (freeRAM > 0) {
                const widthPct = (freeRAM / RAM_MAX) * 100;
                const emptyEl = document.createElement('div');
                emptyEl.style.width = `${widthPct}%`;
                emptyEl.className = `h-full bg-slate-800/40 text-slate-500 flex items-center justify-center text-[10px] italic`;
                emptyEl.innerText = `Libre ${freeRAM} MB`;
                container.appendChild(emptyEl);
            }

            document.getElementById('mem-used-text').innerText = `${totalUsed} MB (${totalUsed}%)`;
            document.getElementById('mem-free-text').innerText = `${freeRAM} MB`;
            document.getElementById('ram-progress-bar').style.width = `${totalUsed}%`;
        }

        function allocateMemoryManual() {
            const name = document.getElementById('mem-process-name').value.trim() || 'Proceso RAM';
            const size = parseInt(document.getElementById('mem-process-size').value) || 20;

            let currentUsedRAM = processes.filter(p => p.status !== 'TERMINADO').reduce((acc, p) => acc + p.ram, 0);

            if (currentUsedRAM + size > RAM_MAX) {
                showOOMModal(`[Desbordamiento de Memoria] Solicitado: ${size} MB. Disponible: ${RAM_MAX - currentUsedRAM} MB de 100 MB Max.`);
                return;
            }

            const colors = ['bg-pink-500', 'bg-amber-500', 'bg-teal-500'];
            const nextId = processes.length + 1;
            processes.push({
                id: nextId,
                name: name,
                arrival: currentTime,
                burst: 4,
                remaining: 4,
                ram: size,
                status: 'LISTO',
                color: colors[processes.length % colors.length]
            });

            renderProcessTable();
        }

        function freeRamBlock(pid) {
            const p = processes.find(proc => proc.id === pid);
            if (p) {
                p.status = 'TERMINADO';
                p.remaining = 0;
                renderProcessTable();
            }
        }

        function resetMemory() {
            processes.forEach(p => {
                p.status = 'TERMINADO';
                p.remaining = 0;
            });
            renderProcessTable();
        }

        // PARTE 3:  Concurrencia y Sincronización
        let raceControlMode = false;
        let raceVal = 100;

        function setRaceControl(enabled) {
            raceControlMode = enabled;
            document.getElementById('btn-race-off').className = enabled ? 
                'px-3 py-1 rounded-lg font-semibold transition-all text-slate-400 hover:text-white' :
                'px-3 py-1 rounded-lg font-semibold transition-all bg-rose-500/20 text-rose-400 border border-rose-500/30';

            document.getElementById('btn-race-on').className = enabled ? 
                'px-3 py-1 rounded-lg font-semibold transition-all bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                'px-3 py-1 rounded-lg font-semibold transition-all text-slate-400 hover:text-white';
        }

        function runRaceThreads() {
            const logBox = document.getElementById('race-log');
            logBox.innerHTML = '';
            raceVal = 100;

            if (!raceControlMode) {
                logBox.innerHTML += `<div class="text-rose-400">&gt; [Hilo 1] Lee Variable Global: 100</div>`;
                logBox.innerHTML += `<div class="text-rose-400">&gt; [Hilo 2] Lee Variable Global: 100 (Sin bloqueo Mutex)</div>`;
                logBox.innerHTML += `<div class="text-rose-400">&gt; [Hilo 1] Suma +50 -&gt; Escribe 150</div>`;
                logBox.innerHTML += `<div class="text-rose-400">&gt; [Hilo 2] Suma +50 -&gt; Sobrescribe con 150 (Perdió incremento de Hilo 1)</div>`;
                raceVal = 150;
            } else {
                logBox.innerHTML += `<div class="text-emerald-400">&gt; [Hilo 1] Adquiere Cerrojo Mutex (Lock).</div>`;
                logBox.innerHTML += `<div class="text-emerald-400">&gt; [Hilo 1] Lee 100 -&gt; Suma +50 -&gt; Escribe 150. Libera Mutex.</div>`;
                logBox.innerHTML += `<div class="text-indigo-400">&gt; [Hilo 2] Adquiere Cerrojo Mutex (Lock).</div>`;
                logBox.innerHTML += `<div class="text-indigo-400">&gt; [Hilo 2] Lee 150 -&gt; Suma +50 -&gt; Escribe 200. Libera Mutex.</div>`;
                raceVal = 200;
            }
            document.getElementById('race-counter-val').innerText = raceVal;
        }

        // LÓGICA BINARIA DEL SEMÁFOROS
        let binarySemFree = true;
        let procInCS = null;
        let semBlockedQueue = [];

        function renderBinarySemaphore() {
            const stateText = document.getElementById('sem-binary-state');
            const csBox = document.getElementById('critical-section-box');
            const queueBox = document.getElementById('sem-blocked-queue');

            if (binarySemFree) {
                stateText.innerText = "1 (LIBRE)";
                stateText.className = "text-lg font-extrabold text-emerald-400 font-mono";
                csBox.innerHTML = `<span class="text-xs text-slate-500 italic">Seccion Critica Vacia</span>`;
            } else {
                stateText.innerText = "0 (OCUPADO)";
                stateText.className = "text-lg font-extrabold text-rose-400 font-mono";
                csBox.innerHTML = `
                    <div class="flex items-center justify-center gap-2 text-cyan-400 font-bold text-xs">
                        <i data-lucide="lock" class="w-4 h-4"></i> PID ${procInCS} Ejecutandose en Seccion Critica
                    </div>
                `;
            }

            if (semBlockedQueue.length === 0) {
                queueBox.innerHTML = `<span>Ningun proceso bloqueado</span>`;
            } else {
                queueBox.innerHTML = '';
                semBlockedQueue.forEach(pid => {
                    queueBox.innerHTML += `<span class="px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg font-bold">PID ${pid}</span>`;
                });
            }
            lucide.createIcons();
        }

        function execWait() {
            const pid = parseInt(document.getElementById('sem-pid-input').value) || 1;
            if (binarySemFree) {
                binarySemFree = false;
                procInCS = pid;
            } else {
                if (procInCS !== pid && !semBlockedQueue.includes(pid)) {
                    semBlockedQueue.push(pid);
                }
            }
            renderBinarySemaphore();
        }

        function execSignal() {
            const pid = parseInt(document.getElementById('sem-pid-input').value) || 1;
            if (procInCS === pid) {
                if (semBlockedQueue.length > 0) {
                    procInCS = semBlockedQueue.shift();
                    binarySemFree = false;
                } else {
                    procInCS = null;
                    binarySemFree = true;
                }
            }
            renderBinarySemaphore();
        }

        // PARTE 4: 
        let deadlockState = {
            r1Owner: null,
            r2Owner: null,
            paWaitingFor: null,
            pbWaitingFor: null,
            isDeadlocked: false
        };

        function triggerDeadlockSim() {
            deadlockState.r1Owner = 'Proceso A ';
            deadlockState.r2Owner = 'Proceso B';
            deadlockState.paWaitingFor = 'Recurso 2';
            deadlockState.pbWaitingFor = 'Recurso 1';
            deadlockState.isDeadlocked = true;

            renderDeadlock();
        }

        function resetDeadlockSim() {
            deadlockState = {
                r1Owner: null,
                r2Owner: null,
                paWaitingFor: null,
                pbWaitingFor: null,
                isDeadlocked: false
            };
            renderDeadlock();
        }

        function abortProcessDeadlock(processKey) {
            if (processKey === 'A') {
                deadlockState.r1Owner = 'Proceso B';
                deadlockState.r2Owner = 'Proceso B';
                deadlockState.paWaitingFor = null;
                deadlockState.pbWaitingFor = null;
                deadlockState.isDeadlocked = false;
            } else {
                deadlockState.r1Owner = 'Proceso A ';
                deadlockState.r2Owner = 'Proceso A ';
                deadlockState.paWaitingFor = null;
                deadlockState.pbWaitingFor = null;
                deadlockState.isDeadlocked = false;
            }
            renderDeadlock();
        }

        function renderDeadlock() {
            const paStatus = document.getElementById('deadlock-pa-status');
            const pbStatus = document.getElementById('deadlock-pb-status');
            const r1Owner = document.getElementById('deadlock-r1-owner');
            const r2Owner = document.getElementById('deadlock-r2-owner');
            const desc = document.getElementById('deadlock-cycle-desc');
            const alertCard = document.getElementById('deadlock-alert-card');
            const resControls = document.getElementById('deadlock-resolution-controls');

            if (deadlockState.isDeadlocked) {
                paStatus.innerHTML = `<span class="text-rose-400 font-bold">Bloqueado (Pide R2)</span>`;
                pbStatus.innerHTML = `<span class="text-rose-400 font-bold">Bloqueado (Pide R1)</span>`;
                r1Owner.innerHTML = `<span class="text-cyan-400 font-bold">Asignado </span>`;
                r2Owner.innerHTML = `<span class="text-amber-400 font-bold">Asignado </span>`;

                desc.innerHTML = `
                    <div class="text-rose-400 font-bold">&gt; [ALERTA] ESPERA CIRCULAR DETECTADA (DEADLOCK):</div>
                    <div>- Proceso A retiene Recurso 1 y solicita Recurso 2.</div>
                    <div>- Proceso B retiene Recurso 2 y solicita Recurso 1.</div>
                    <div class="text-slate-300 mt-1">Accion requerida: Aborte forzosamente uno de los dos procesos.</div>
                `;

                alertCard.className = "bg-rose-950/40 border border-rose-500/50 p-4 rounded-xl text-center glow-rose";
                alertCard.innerHTML = `
                    <i data-lucide="alert-octagon" class="w-8 h-8 text-rose-500 mx-auto mb-2 animate-bounce"></i>
                    <span class="text-xs font-extrabold text-rose-400 block uppercase">DEADLOCK DETECTADO</span>
                    <p class="text-[10px] text-rose-300 mt-1">Interbloqueo sin salida.</p>
                `;
                resControls.classList.remove('hidden');
            } else {
                paStatus.innerHTML = `<span class="text-slate-500">Estado: Normal</span>`;
                pbStatus.innerHTML = `<span class="text-slate-500">Estado: Normal</span>`;
                r1Owner.innerText = deadlockState.r1Owner || 'Libre';
                r2Owner.innerText = deadlockState.r2Owner || 'Libre';

                desc.innerHTML = `&gt; Estado seguro. No hay interbloqueos presentes en el Kernel.`;

                alertCard.className = "bg-slate-950 p-4 rounded-xl border border-slate-800 text-center";
                alertCard.innerHTML = `
                    <i data-lucide="check-circle-2" class="w-8 h-8 text-emerald-400 mx-auto mb-2"></i>
                    <span class="text-xs font-bold text-slate-300 block">Sin Interbloqueo</span>
                    <p class="text-[10px] text-slate-500 mt-1">Los recursos se liberan correctamente.</p>
                `;
                resControls.classList.add('hidden');
            }
            lucide.createIcons();
        }

        // CARGA INICIAL
        window.onload = function() {
            switchTab('procesos');
            renderProcessTable();
            resetProcSim();
            renderBinarySemaphore();
            renderDeadlock();
        };