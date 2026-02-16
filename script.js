const app = {
    state: { user: null, records: {}, viewDate: new Date(), tempImg: null },

    init() {
        this.initTheme();
        const u = localStorage.getItem('shift_user_v2');
        const r = localStorage.getItem('shift_records_v2');
        if (r) this.state.records = JSON.parse(r);
        if (u) {
            this.state.user = JSON.parse(u);
            document.getElementById('navbar').style.display = 'flex';
            this.loadUI();
            this.showScreen('home');
            this.startLiveSalary();
            this.startTimer();
        } else {
            this.showScreen('login');
        }
        this.updateGreeting();
    },

    initTheme() {
        const t = localStorage.getItem('theme_pref') || 'light';
        document.documentElement.setAttribute('data-theme', t);
        this.updateThemeIcon(t);
    },
    toggleTheme() {
        const c = document.documentElement.getAttribute('data-theme');
        const n = c === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', n);
        localStorage.setItem('theme_pref', n);
        this.updateThemeIcon(n);
    },
    updateThemeIcon(t) {
        document.getElementById('themeIcon').innerText = t === 'dark' ? '☀️' : '🌙';
    },

    handleImage(input) {
        if(input.files?.[0]) {
            const r = new FileReader();
            r.onload = e => {
                document.getElementById('loginAvatar').style.backgroundImage = `url(${e.target.result})`;
                this.state.tempImg = e.target.result;
            };
            r.readAsDataURL(input.files[0]);
        }
    },
    register() {
        const name = document.getElementById('regName').value;
        const role = document.getElementById('regRole').value;
        const date = document.getElementById('regDate').value;
        const rate = parseFloat(document.getElementById('regRate').value);
        if(!name || !date || !rate) return alert('يرجى ملء جميع الحقول');
        this.state.user = { name, role, start: date, rate, photo: this.state.tempImg || 'https://img.icons8.com/fluency/96/user-male-circle--v1.png' };
        this.save(); location.reload();
    },
    save() {
        localStorage.setItem('shift_user_v2', JSON.stringify(this.state.user));
        localStorage.setItem('shift_records_v2', JSON.stringify(this.state.records));
    },

    loadUI() {
        if(!this.state.user) return;
        document.getElementById('headerAvatar').src = this.state.user.photo;
        document.getElementById('profileAvatar').src = this.state.user.photo;
        document.getElementById('homeName').innerText = `${this.state.user.role} ${this.state.user.name}`;
        document.getElementById('profileName').innerText = this.state.user.name;
        document.getElementById('profileRole').innerText = this.state.user.role;
    },
    updateGreeting() {
        const h = new Date().getHours();
        document.getElementById('greeting').innerText = h < 12 ? 'صباح الخير ☀️' : 'مساء الخير 🌙';
    },

    isWorkDay(dateStr) {
        const start = new Date(this.state.user.start); start.setHours(0,0,0,0);
        const curr = new Date(dateStr); curr.setHours(0,0,0,0);
        const diff = Math.floor((curr - start) / 86400000);
        return diff >= 0 && diff % 3 === 0;
    },

    quickAttend() {
        const today = new Date().toISOString().split('T')[0];
        if (this.state.records[today]?.status === 'work') return this.showToast('✅ مسجل مسبقاً');
        this.state.records[today] = { status: 'work', overtime: 0, deduction: 0, notes: '' };
        this.save(); this.showToast('تم تسجيل الحضور 🚀'); this.updateHomeStats();
    },
    showToast(msg) {
        const t = document.createElement('div'); t.className = 'toast'; t.innerText = msg;
        document.body.appendChild(t); setTimeout(() => t.remove(), 2000);
    },

    startTimer() {
        setInterval(() => {
            if(!this.state.user) return;
            const now = new Date(); const s = new Date(this.state.user.start); s.setHours(7,0,0,0);
            const ms = now - s; const h = ms / 36e5; let pos = h % 72; if(pos < 0) pos += 72;
            const hero = document.getElementById('heroCard'), timer = document.getElementById('heroTimer');
            const msg = document.getElementById('heroMsg'), badge = document.getElementById('heroBadge');
            const liveBox = document.getElementById('liveSalaryBox');
            let sec = 0;
            if(pos < 24) {
                hero.style.background = 'linear-gradient(135deg, #10b981, #047857)'; badge.innerText = 'أنت في الدوام';
                msg.innerText = 'ينتهي الشفت 7:00 ص'; sec = (24 - pos) * 3600; liveBox.style.display = 'block';
            } else {
                hero.style.background = 'linear-gradient(135deg, #1f2937, #111827)'; badge.innerText = 'استراحة';
                msg.innerText = 'موعد الدوام القادم 7:00 ص'; sec = (72 - pos) * 3600; liveBox.style.display = 'none';
            }
            const hh = Math.floor(sec / 3600), mm = Math.floor((sec % 3600) / 60), ss = Math.floor(sec % 60);
            timer.innerText = `${hh}:${mm.toString().padStart(2,'0')}:${ss.toString().padStart(2,'0')}`;
        }, 1000);
    },
    startLiveSalary() {
        setInterval(() => {
            if (!this.state.user) return;
            const now = new Date(); const s = new Date(this.state.user.start); s.setHours(7,0,0,0);
            const ms = now - s; const hours = ms / 36e5; let pos = hours % 72;
            if (pos >= 0 && pos < 24) {
                const earned = (this.state.user.rate / 24) * pos;
                document.getElementById('liveMoney').innerText = earned.toFixed(3);
            }
        }, 1000);
    },

    changeMonth(n) { this.state.viewDate.setMonth(this.state.viewDate.getMonth() + n); this.renderTimeline(); },
    renderTimeline() {
        const y = this.state.viewDate.getFullYear(), m = this.state.viewDate.getMonth();
        const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
        document.getElementById('scheduleTitle').innerText = `${months[m]} ${y}`;
        const list = document.getElementById('timelineList');
        list.innerHTML = '';
        const days = new Date(y, m+1, 0).getDate();
        for(let i=1; i<=days; i++) {
            const dStr = `${y}-${String(m+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            const dateObj = new Date(y, m, i);
            const dayName = dateObj.toLocaleDateString('ar-EG', { weekday: 'long' });
            const rec = this.state.records[dStr];
            const status = rec?.status || (this.isWorkDay(dStr) ? 'work' : 'rest');
            const div = document.createElement('div');
            div.className = `day-card status-${status}`;
            div.innerHTML = `
                <div class="date-col">
                    <div class="day-num">${i}</div>
                    <div class="day-name">${dayName}</div>
                </div>
                <div class="info-title" style="flex:1">${status==='work'?'دوام':'راحة'}</div>
                <div>${rec ? '✅' : ''}</div>
            `;
            list.appendChild(div);
        }
    },

    updateStats() {
        const now=new Date(), m=now.getMonth()+1, y=now.getFullYear();
        let base=0, ot=0, ded=0;
        for(let i=1; i<=31; i++) {
            const dStr = `${y}-${String(m).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            const rec = this.state.records[dStr];
            if(rec?.status==='work') {
                base += this.state.user.rate;
                ot += (rec.overtime||0)*(this.state.user.rate/8)*1.5;
                ded += (rec.deduction||0);
            }
        }
        document.getElementById('baseSalary').innerText = base.toFixed(0);
        document.getElementById('overtimeTotal').innerText = ot.toFixed(0);
        document.getElementById('deductionsTotal').innerText = ded.toFixed(0);
        const net = base + ot - ded;
        document.getElementById('netSalary').innerText = net.toFixed(0);
        document.getElementById('finalTotal').innerText = net.toFixed(0);
        document.getElementById('statsMonth').innerText = `شهر ${m}`;
    },
    updateHomeStats() {
        this.updateStats();
        document.getElementById('quickSalary').innerText = document.getElementById('netSalary').innerText;
        const now=new Date(), m=now.getMonth()+1, y=now.getFullYear();
        let c=0;
        for(let i=1; i<=31; i++) {
            const dStr = `${y}-${String(m).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            if(this.state.records[dStr]?.status==='work') c++;
        }
        document.getElementById('quickDays').innerText = c;
    },

    exportBackup() {
        const d = JSON.stringify({user:this.state.user, records:this.state.records});
        const a = document.createElement('a'); a.href='data:json;charset=utf-8,'+encodeURIComponent(d);
        a.download='backup.json'; a.click();
    },
    exportExcel() {
        let csv = "\uFEFFالتاريخ,الحالة\n";
        Object.keys(this.state.records).sort().forEach(k => csv += `${k},${this.state.records[k].status}\n`);
        const a = document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
        a.download='report.csv'; a.click();
    },
    importData() { document.getElementById('backupInput').click(); },
    processImport(i) {
        const f=i.files[0]; if(!f)return;
        const r=new FileReader(); r.onload=e=>{
            const d=JSON.parse(e.target.result);
            localStorage.setItem('shift_user_v2',JSON.stringify(d.user));
            localStorage.setItem('shift_records_v2',JSON.stringify(d.records));
            location.reload();
        }; r.readAsText(f);
    },

    nav(s, el) {
        document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
        document.getElementById('screen-'+s).classList.add('active');
        document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
        el.classList.add('active');
        if(s==='home') this.updateHomeStats();
        if(s==='schedule') this.renderTimeline();
        if(s==='stats') this.updateStats();
    },
    showScreen(id) { document.getElementById('screen-'+id).classList.add('active'); },
    logout() { if(confirm('مسح الكل؟')) { localStorage.clear(); location.reload(); } }
};

window.onload = () => app.init();