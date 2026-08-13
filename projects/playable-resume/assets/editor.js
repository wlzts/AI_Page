(function () {
  'use strict';

  const STORAGE_KEY = 'cao-jixian-playable-resume-v6-data';
  const D = window.ResumeData;
  if (!D) return;

  const clone = (v) => JSON.parse(JSON.stringify(v));
  const DEFAULT_DATA = clone(D);

  // 在 app.js / game.js 初始化前，优先载入界面编辑器保存的数据。
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.profile && Array.isArray(parsed.projects)) {
        Object.keys(D).forEach((k) => delete D[k]);
        Object.assign(D, parsed);
      }
    }
  } catch (err) {
    console.warn('本地资料读取失败，将使用 resume-data.js 默认资料。', err);
  }

  const $ = (id) => document.getElementById(id);
  let draft = clone(D);
  let activeTab = 'profile';
  let dirty = false;

  const labels = {
    profile: '个人资料',
    experience: '工作经历',
    education: '教育经历',
    projects: '项目经历',
    skills: '技能',
    achievements: '证书 / 成就'
  };

  function setDirty(value = true) {
    dirty = value;
    const dot = $('editorDirtyDot');
    if (dot) dot.hidden = !dirty;
  }

  function textField(label, value, onChange, options = {}) {
    const wrap = document.createElement('label');
    wrap.className = `editor-field${options.wide ? ' wide' : ''}`;
    const title = document.createElement('span');
    title.textContent = label;
    const input = options.multiline ? document.createElement('textarea') : document.createElement('input');
    if (!options.multiline) input.type = options.type || 'text';
    input.value = value == null ? '' : String(value);
    if (options.multiline) input.rows = options.rows || 4;
    if (options.placeholder) input.placeholder = options.placeholder;
    input.addEventListener('input', () => {
      onChange(input.value);
      setDirty();
    });
    wrap.append(title, input);
    if (options.hint) {
      const hint = document.createElement('small');
      hint.textContent = options.hint;
      wrap.append(hint);
    }
    return wrap;
  }

  function linesField(label, arr, onChange, options = {}) {
    return textField(label, (arr || []).join('\n'), (v) => {
      onChange(v.split(/\n/).map((x) => x.trim()).filter(Boolean));
    }, { multiline: true, rows: options.rows || 5, wide: options.wide !== false, hint: options.hint || '每行填写一项' });
  }

  function sectionTitle(title, subtitle) {
    const box = document.createElement('div');
    box.className = 'editor-section-title';
    box.innerHTML = `<div><h3>${title}</h3>${subtitle ? `<p>${subtitle}</p>` : ''}</div>`;
    return box;
  }

  function card(title, subtitle) {
    const el = document.createElement('section');
    el.className = 'editor-card';
    const head = document.createElement('div');
    head.className = 'editor-card-head';
    const copy = document.createElement('div');
    const h = document.createElement('h4'); h.textContent = title;
    const p = document.createElement('p'); p.textContent = subtitle || '';
    copy.append(h, p); head.append(copy); el.append(head);
    return { el, head };
  }

  function dangerButton(text, onClick) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'editor-mini-btn danger'; b.textContent = text;
    b.addEventListener('click', onClick);
    return b;
  }

  function addButton(text, onClick) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'editor-add-btn'; b.textContent = `＋ ${text}`;
    b.addEventListener('click', onClick);
    return b;
  }

  function renderProfile(panel) {
    panel.append(sectionTitle('个人资料', '首页、关于我的小屋、联系车站都会读取这里。'));
    const grid = document.createElement('div'); grid.className = 'editor-grid';
    const p = draft.profile;
    grid.append(
      textField('中文姓名', p.name, v => p.name = v),
      textField('英文名', p.englishName, v => p.englishName = v),
      textField('职业定位', p.role, v => p.role = v),
      textField('详细职位', p.roleDetail, v => p.roleDetail = v),
      textField('英文职位', p.englishRole, v => p.englishRole = v),
      textField('所在地', p.location, v => p.location = v),
      textField('首页一句话', p.motto, v => p.motto = v, { wide: true }),
      textField('首页短简介', p.shortBio, v => p.shortBio = v, { multiline: true, rows: 4, wide: true }),
      textField('完整 About Me', p.about, v => p.about = v, { multiline: true, rows: 9, wide: true }),
      textField('职业方向', p.careerDirection, v => p.careerDirection = v, { multiline: true, rows: 4, wide: true }),
      textField('Email', p.email, v => p.email = v, { type: 'email' }),
      textField('手机号', p.phone, v => p.phone = v),
      textField('GitHub', p.github, v => p.github = v, { placeholder: 'https://github.com/...' }),
      textField('LinkedIn', p.linkedin, v => p.linkedin = v),
      textField('Twitter / X', p.twitter, v => p.twitter = v),
      textField('个人网站', p.website, v => p.website = v),
      textField('简历 PDF 路径', p.resume, v => p.resume = v, { placeholder: '例如 resume.pdf', hint: '留空则不显示下载按钮' }),
      linesField('核心价值观', p.values, v => p.values = v),
      linesField('兴趣爱好', p.interests, v => p.interests = v),
      linesField('招聘者最先记住的特点', p.recruiterHighlights, v => p.recruiterHighlights = v)
    );
    panel.append(grid);
  }

  function renderExperience(panel) {
    panel.append(sectionTitle('工作经历', '职业高塔与普通简历同步读取。'));
    draft.experience.forEach((e, index) => {
      const c = card(`工作经历 ${index + 1} · ${e.company || '未命名公司'}`, e.role || '职位未填写');
      c.head.append(dangerButton('删除', () => {
        if (!confirm('确定删除这段工作经历吗？')) return;
        draft.experience.splice(index, 1); setDirty(); renderEditor();
      }));
      const grid = document.createElement('div'); grid.className = 'editor-grid';
      grid.append(
        textField('公司名称', e.company, v => e.company = v),
        textField('职位', e.role, v => e.role = v),
        textField('英文职位', e.englishRole, v => e.englishRole = v),
        textField('时间', e.period, v => e.period = v, { placeholder: '例如 2024.06 - 至今' }),
        textField('地点', e.location, v => e.location = v),
        textField('行业', e.industry, v => e.industry = v),
        textField('工作概述', e.description, v => e.description = v, { multiline: true, rows: 4, wide: true }),
        linesField('主要职责', e.responsibilities, v => e.responsibilities = v),
        linesField('核心工作与成果', e.achievements, v => e.achievements = v),
        linesField('技术栈', e.technologies, v => e.technologies = v, { hint: '每行一个技术，例如 Java' }),
        linesField('工具', e.tools, v => e.tools = v),
        linesField('参与项目', e.projectNames, v => e.projectNames = v),
        textField('希望招聘者记住什么', e.recruiterTakeaway, v => e.recruiterTakeaway = v, { multiline: true, rows: 4, wide: true })
      );
      c.el.append(grid); panel.append(c.el);
    });
    panel.append(addButton('新增工作经历', () => {
      draft.experience.push({ company:'新公司', role:'后端研发工程师', englishRole:'Backend Development Engineer', period:'', location:'', industry:'', description:'', responsibilities:[], achievements:[], technologies:[], tools:[], projectNames:[], recruiterTakeaway:'' });
      setDirty(); renderEditor();
    }));
  }

  function renderEducation(panel) {
    panel.append(sectionTitle('教育经历', '大学与学院中的课程、实训和证书也会同步更新。'));
    draft.education.forEach((e, index) => {
      const c = card(`教育经历 ${index + 1} · ${e.school || '学校未填写'}`, `${e.degree || ''} ${e.major || ''}`.trim());
      c.head.append(dangerButton('删除', () => {
        if (!confirm('确定删除这段教育经历吗？')) return;
        draft.education.splice(index, 1); setDirty(); renderEditor();
      }));
      const grid = document.createElement('div'); grid.className = 'editor-grid';
      grid.append(
        textField('学校名称', e.school, v => e.school = v),
        textField('学历', e.degree, v => e.degree = v),
        textField('专业', e.major, v => e.major = v),
        textField('时间', e.period, v => e.period = v),
        textField('所在地', e.location, v => e.location = v),
        linesField('重要课程', e.courses, v => e.courses = v),
        linesField('项目 / 实训', e.trainingProjects, v => e.trainingProjects = v),
        linesField('奖项 / 荣誉', e.honors, v => e.honors = v),
        linesField('证书', e.certificates, v => e.certificates = v),
        textField('在校期间重点经历', e.highlight, v => e.highlight = v, { multiline: true, rows: 5, wide: true }),
        textField('希望招聘者看到什么', e.recruiterTakeaway, v => e.recruiterTakeaway = v, { multiline: true, rows: 4, wide: true })
      );
      c.el.append(grid); panel.append(c.el);
    });
    panel.append(addButton('新增教育经历', () => {
      draft.education.push({ school:'新学校', degree:'本科', major:'', period:'', location:'', courses:[], trainingProjects:[], honors:[], certificates:[], highlight:'', recruiterTakeaway:'' });
      setDirty(); renderEditor();
    }));
  }

  function renderProjects(panel) {
    panel.append(sectionTitle('项目经历', '项目实验室会自动使用这里的项目资料。建议保留 2–6 个重点项目。'));
    draft.projects.forEach((p, index) => {
      const c = card(`项目 ${index + 1} · ${p.title || '未命名项目'}`, p.type || '项目实践');
      c.head.append(dangerButton('删除', () => {
        if (!confirm('确定删除这个项目吗？')) return;
        draft.projects.splice(index, 1); setDirty(); renderEditor();
      }));
      const grid = document.createElement('div'); grid.className = 'editor-grid';
      grid.append(
        textField('项目名称', p.title, v => p.title = v),
        textField('项目时间', p.period, v => p.period = v),
        textField('项目类型', p.type, v => p.type = v),
        textField('你的角色', p.role, v => p.role = v),
        textField('项目背景', p.background, v => p.background = v, { multiline: true, rows: 5, wide: true }),
        textField('项目简介', p.description, v => p.description = v, { multiline: true, rows: 4, wide: true }),
        linesField('具体负责', p.responsibilities, v => p.responsibilities = v),
        linesField('核心功能', p.features, v => p.features = v),
        linesField('技术难点', p.challenges, v => p.challenges = v),
        linesField('解决方案', p.solutions, v => p.solutions = v),
        linesField('使用技术', p.technologies, v => p.technologies = v),
        linesField('项目成果', p.results, v => p.results = v),
        textField('招聘者看到的能力', p.recruiterTakeaway, v => p.recruiterTakeaway = v, { multiline: true, rows: 4, wide: true }),
        textField('Demo 链接', p.demoUrl, v => p.demoUrl = v),
        textField('GitHub 链接', p.githubUrl, v => p.githubUrl = v),
        textField('Case Study 链接', p.caseStudyUrl, v => p.caseStudyUrl = v)
      );
      c.el.append(grid); panel.append(c.el);
    });
    panel.append(addButton('新增项目', () => {
      draft.projects.push({ title:'新项目', period:'', type:'', role:'', background:'', description:'', responsibilities:[], features:[], challenges:[], solutions:[], technologies:[], results:[], recruiterTakeaway:'', image:'', demoUrl:'', githubUrl:'', caseStudyUrl:'' });
      setDirty(); renderEditor();
    }));
  }

  function renderSkills(panel) {
    panel.append(sectionTitle('技能', '使用 Lv.1–Lv.5，不使用没有意义的百分比。'));
    draft.skills.forEach((g, groupIndex) => {
      const c = card(`技能组 ${groupIndex + 1} · ${g.group || '未命名'}`, g.description || '');
      c.head.append(dangerButton('删除技能组', () => {
        if (!confirm('确定删除这个技能组吗？')) return;
        draft.skills.splice(groupIndex, 1); setDirty(); renderEditor();
      }));
      const headerGrid = document.createElement('div'); headerGrid.className = 'editor-grid';
      headerGrid.append(
        textField('技能组名称', g.group, v => g.group = v),
        textField('技能组说明', g.description, v => g.description = v, { wide: true })
      );
      c.el.append(headerGrid);
      const list = document.createElement('div'); list.className = 'editor-skill-list';
      (g.items || []).forEach((s, itemIndex) => {
        const row = document.createElement('div'); row.className = 'editor-skill-item';
        const name = document.createElement('input'); name.value = s.name || ''; name.placeholder = '技能名称';
        name.addEventListener('input', () => { s.name = name.value; setDirty(); });
        const level = document.createElement('select');
        for (let n = 1; n <= 5; n++) { const o = document.createElement('option'); o.value = n; o.textContent = `Lv.${n}`; if (Number(s.level) === n) o.selected = true; level.append(o); }
        level.addEventListener('change', () => { s.level = Number(level.value); setDirty(); });
        row.append(name, level, dangerButton('删除', () => { g.items.splice(itemIndex, 1); setDirty(); renderEditor(); }));
        list.append(row);
      });
      c.el.append(list, addButton('新增技能', () => { (g.items ||= []).push({name:'新技能',level:3}); setDirty(); renderEditor(); }));
      panel.append(c.el);
    });
    panel.append(addButton('新增技能组', () => { draft.skills.push({group:'新技能组',description:'',items:[{name:'新技能',level:3}]}); setDirty(); renderEditor(); }));
  }

  function renderAchievements(panel) {
    panel.append(sectionTitle('证书 / 成就', '成就博物馆会展示这里的条目。'));
    draft.achievements.forEach((a, index) => {
      const c = card(`条目 ${index + 1} · ${a.title || '未命名'}`, a.type || '成就');
      c.head.append(dangerButton('删除', () => {
        if (!confirm('确定删除这个条目吗？')) return;
        draft.achievements.splice(index, 1); setDirty(); renderEditor();
      }));
      const grid = document.createElement('div'); grid.className = 'editor-grid';
      grid.append(
        textField('名称', a.title, v => a.title = v),
        textField('类型', a.type, v => a.type = v),
        textField('年份 / 时间', a.year, v => a.year = v),
        textField('机构 / 来源', a.issuer, v => a.issuer = v),
        textField('介绍', a.description, v => a.description = v, { multiline: true, rows: 4, wide: true })
      );
      c.el.append(grid); panel.append(c.el);
    });
    panel.append(addButton('新增证书 / 成就', () => { draft.achievements.push({title:'新成就',year:'',issuer:'',type:'成就',description:''}); setDirty(); renderEditor(); }));
  }

  function renderEditor() {
    const nav = $('editorTabs');
    const body = $('editorBody');
    if (!nav || !body) return;
    nav.innerHTML = '';
    body.innerHTML = '';
    Object.entries(labels).forEach(([key, label]) => {
      const btn = document.createElement('button'); btn.type = 'button'; btn.textContent = label; btn.dataset.tab = key;
      if (key === activeTab) btn.classList.add('active');
      btn.addEventListener('click', () => { activeTab = key; renderEditor(); });
      nav.append(btn);
    });
    const panel = document.createElement('div'); panel.className = 'editor-panel'; panel.dataset.panel = activeTab;
    if (activeTab === 'profile') renderProfile(panel);
    if (activeTab === 'experience') renderExperience(panel);
    if (activeTab === 'education') renderEducation(panel);
    if (activeTab === 'projects') renderProjects(panel);
    if (activeTab === 'skills') renderSkills(panel);
    if (activeTab === 'achievements') renderAchievements(panel);
    body.append(panel);
    setDirty(dirty);
  }

  function openEditor() {
    draft = clone(window.ResumeData);
    dirty = false;
    activeTab = 'profile';
    renderEditor();
    $('editorModal').hidden = false;
    document.body.classList.add('editor-open');
    setTimeout(() => $('editorModal')?.querySelector('input,textarea,button')?.focus(), 0);
  }

  function closeEditor(force = false) {
    if (!force && dirty && !confirm('还有未保存的修改，确定退出编辑模式吗？')) return;
    $('editorModal').hidden = true;
    document.body.classList.remove('editor-open');
    dirty = false;
  }

  function saveEditor() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      const status = $('editorStatus');
      if (status) status.textContent = '✓ 已保存，正在应用到网页与游戏…';
      dirty = false;
      setTimeout(() => location.reload(), 450);
    } catch (err) {
      console.error(err);
      const status = $('editorStatus');
      if (status) status.textContent = '浏览器阻止了本地保存。请使用“导出备份”保存资料。';
      alert('当前浏览器阻止本地存储。你可以点击“导出备份”，资料不会丢失。');
    }
  }

  function downloadFile(name, content, type) {
    const blob = new Blob([content], {type});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportBackup() {
    downloadFile('曹继贤-可玩简历-资料备份.json', JSON.stringify(draft, null, 2), 'application/json;charset=utf-8');
    const status = $('editorStatus'); if (status) status.textContent = '✓ 已导出 JSON 资料备份';
  }

  function exportDataJs() {
    const content = `/* 由可视化编辑模式导出 */\nwindow.ResumeData = ${JSON.stringify(draft, null, 2)};\n`;
    downloadFile('resume-data.js', content, 'text/javascript;charset=utf-8');
    const status = $('editorStatus'); if (status) status.textContent = '✓ 已导出 resume-data.js';
  }

  function importBackup(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''));
        if (!parsed.profile || !Array.isArray(parsed.projects) || !Array.isArray(parsed.skills)) throw new Error('格式不正确');
        draft = parsed; setDirty(); renderEditor();
        const status = $('editorStatus'); if (status) status.textContent = '✓ 已导入备份，点击“保存并应用”生效';
      } catch (err) {
        alert('导入失败：请选择由本编辑器导出的 JSON 备份文件。');
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  function resetDefault() {
    if (!confirm('确定恢复为项目自带的默认资料吗？当前浏览器保存的修改将被覆盖。')) return;
    draft = clone(DEFAULT_DATA); setDirty(); renderEditor();
    const status = $('editorStatus'); if (status) status.textContent = '已载入默认资料，点击“保存并应用”后正式恢复';
  }

  function init() {
    $('editModeBtn')?.addEventListener('click', openEditor);
    $('editorClose')?.addEventListener('click', () => closeEditor(false));
    $('editorCancel')?.addEventListener('click', () => closeEditor(false));
    $('editorSave')?.addEventListener('click', saveEditor);
    $('editorExport')?.addEventListener('click', exportBackup);
    $('editorExportJs')?.addEventListener('click', exportDataJs);
    $('editorReset')?.addEventListener('click', resetDefault);
    $('editorImportBtn')?.addEventListener('click', () => $('editorImportFile')?.click());
    $('editorImportFile')?.addEventListener('change', (e) => { importBackup(e.target.files?.[0]); e.target.value = ''; });
    $('editorModal')?.addEventListener('click', (e) => { if (e.target === $('editorModal')) closeEditor(false); });
    document.addEventListener('keydown', (e) => {
      if (!$('editorModal') || $('editorModal').hidden) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveEditor(); }
      if (e.key === 'Escape') { e.preventDefault(); closeEditor(false); }
    });
  }

  init();
})();
