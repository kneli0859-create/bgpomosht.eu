/* =============================================
   BG Помощ — JavaScript
   ============================================= */

'use strict';

/* ---- NAVBAR SCROLL ---- */
const navbar = document.getElementById('navbar');
const backToTop = document.getElementById('backToTop');

/* ---- UNIFIED SCROLL HANDLER ---- */
let _scrollTick = false;
const _scrollEl = document.querySelector('.hero-scroll');
const _orb1 = document.querySelector('.orb-1');
const _orb2 = document.querySelector('.orb-2');
const _orb3 = document.querySelector('.orb-3');
const _heroPhoto = document.querySelector('.hero-bg-photo');
const _prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const _heroSection = document.querySelector('.hero');
const _heroH = _heroSection ? _heroSection.offsetHeight : 800;

window.addEventListener('scroll', () => {
  if (_scrollTick) return;
  _scrollTick = true;
  requestAnimationFrame(() => {
    const y = window.scrollY;

    // Navbar
    if (navbar) navbar.classList.toggle('scrolled', y > 50);

    // Back to top
    if (backToTop) backToTop.classList.toggle('visible', y > 400);

    // Hero scroll indicator
    if (_scrollEl) _scrollEl.style.opacity = Math.max(0, 1 - y / 200);

    // Parallax orbs + hero photo (desktop only, skip when past hero)
    if (y < _heroH && window.innerWidth > 768 && !_prefersReduced) {
      if (_orb1) _orb1.style.transform = `translateY(${y * 0.15}px)`;
      if (_orb2) _orb2.style.transform = `translateY(${y * 0.08}px)`;
      if (_orb3) _orb3.style.transform = `translateY(${y * 0.12}px)`;

      if (_heroPhoto) {
        _heroPhoto.style.transform = `translateY(${y * 0.12}px) scale(1.05)`;
      }
    }

    _scrollTick = false;
  });
}, { passive: true });

/* ---- BACK TO TOP ---- */
if (backToTop) {
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ---- HAMBURGER MENU ---- */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });

  document.addEventListener('click', (e) => {
    if (navbar && !navbar.contains(e.target)) {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
    }
  });
}

/* ---- SMOOTH SCROLL FOR ANCHOR LINKS ---- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ---- INTERSECTION OBSERVER — SCROLL ANIMATIONS ---- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => revealObserver.observe(el));

document.querySelectorAll('.countries-grid .country-card').forEach((card, i) => {
  card.style.setProperty('--i', i);
  card.style.transitionDelay = `${i * 0.05}s`;
});

/* ---- ANIMATED COUNTERS ---- */
function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'));
  if (isNaN(target)) return;
  const duration = 1800;
  const start = performance.now();
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(easeOut(progress) * target);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number[data-target]').forEach(el => counterObserver.observe(el));

/* ---- ACTIVE NAV LINK ON SCROLL (index.html only) ---- */
const sections = document.querySelectorAll('section[id]');
const navLinkEls = document.querySelectorAll('.nav-links a');

if (sections.length && navLinkEls.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinkEls.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) link.classList.add('active');
        });
      }
    });
  }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });

  sections.forEach(s => sectionObserver.observe(s));
}

/* ---- PRICING CARD HOVER GLOW ---- */
document.querySelectorAll('.pricing-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--glow-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
    card.style.setProperty('--glow-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
  });
});

/* =============================================
   WIZARD MULTI-STEP FORM
   ============================================= */

const EUROPEAN_COUNTRIES = [
  'Германия','Австрия','Швейцария','Франция','Италия','Испания',
  'Нидерландия','Белгия','Дания','Великобритания','Швеция','Норвегия',
  'Финландия','Естония','Латвия','Литва','Полша','Чехия','Словакия',
  'Унгария','Румъния','България','Гърция','Португалия','Хърватия',
  'Словения','Ирландия','Люксембург','Малта','Кипър','Исландия',
  'Сърбия','Черна гора','Северна Македония','Молдова','Украйна','Друга'
];

function buildCountryOptions() {
  return EUROPEAN_COUNTRIES.map(c => `<option value="${c}">${c}</option>`).join('');
}

function countryDropdown(id, label) {
  return `<div class="form-group">
    <label for="${id}">${label}</label>
    <div class="input-wrap select-wrap">
      <i class="fa-solid fa-earth-europe"></i>
      <select id="${id}">
        <option value="">— Избери —</option>
        ${buildCountryOptions()}
      </select>
      <i class="fa-solid fa-chevron-down select-arrow"></i>
    </div>
  </div>`;
}

function buildStep2HTML(service) {
  switch (service) {

    case 'Търся работа':
      return `<div class="wizard-step-card">
        <h3 class="wizard-panel-title">Търся работа</h3>
        <p class="wizard-panel-subtitle">Изберете пакет — ние правим всичко вместо вас</p>

        <!-- ====== ПАКЕТ SELECTOR ====== -->
        <input type="hidden" id="s2SelectedPkg" value="Само CV — €29" />
        <div class="job-pkg-grid">
          <button type="button" class="job-pkg-card active" data-pkg="cv">
            <div class="job-pkg-icon"><i class="fa-solid fa-file-lines"></i></div>
            <div class="job-pkg-name">Само CV</div>
            <div class="job-pkg-price">€29</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Професионално CV</li>
              <li><i class="fa-solid fa-check"></i> На езика по ваш избор</li>
              <li><i class="fa-solid fa-check"></i> Готово до 24 часа</li>
            </ul>
          </button>
          <button type="button" class="job-pkg-card" data-pkg="cv-letter">
            <div class="job-pkg-badge">Популярно</div>
            <div class="job-pkg-icon"><i class="fa-solid fa-envelope-open-text"></i></div>
            <div class="job-pkg-name">CV + Мотивационно писмо</div>
            <div class="job-pkg-price">€49</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Всичко от "Само CV"</li>
              <li><i class="fa-solid fa-check"></i> Мотивационно писмо</li>
              <li><i class="fa-solid fa-check"></i> Адаптирано за позицията</li>
            </ul>
          </button>
          <button type="button" class="job-pkg-card" data-pkg="full">
            <div class="job-pkg-badge job-pkg-badge-gold">Пълна услуга</div>
            <div class="job-pkg-icon"><i class="fa-solid fa-rocket"></i></div>
            <div class="job-pkg-name">CV + Писмо + Кандидатстване</div>
            <div class="job-pkg-price">€79</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> CV + Мотивационно писмо</li>
              <li><i class="fa-solid fa-check"></i> Кандидатстваме вместо вас</li>
              <li><i class="fa-solid fa-check"></i> До 5 обяви включени</li>
            </ul>
          </button>
        </div>

        <!-- ====== ОБЩА ИНФОРМАЦИЯ ====== -->
        <div class="cv-section-divider" style="margin-top:20px"><i class="fa-solid fa-magnifying-glass"></i> За каква работа търсите?</div>
        <div class="wizard-form-row">
          <div class="form-group">
            <label for="s2Position">Желана позиция <span class="required">*</span></label>
            <div class="input-wrap"><i class="fa-solid fa-briefcase"></i>
              <input type="text" id="s2Position" placeholder="напр. Шофьор, Медицинска сестра, Готвач..." />
            </div>
          </div>
          <div class="form-group">
            <label for="s2Lang">Език на CV-то</label>
            <div class="input-wrap select-wrap"><i class="fa-solid fa-globe"></i>
              <select id="s2Lang">
                <option value="Немски">Немски</option>
                <option value="Английски">Английски</option>
                <option value="Френски">Френски</option>
                <option value="Испански">Испански</option>
                <option value="Италиански">Италиански</option>
                <option value="Български">Български</option>
              </select>
              <i class="fa-solid fa-chevron-down select-arrow"></i>
            </div>
          </div>
        </div>
        <div class="wizard-form-row">
          ${countryDropdown('s2Country', 'За коя държава?')}
          <div class="form-group">
            <label for="s2JobUrl">Линк към обява (по избор)</label>
            <div class="input-wrap"><i class="fa-solid fa-link"></i>
              <input type="url" id="s2JobUrl" placeholder="https://..." />
            </div>
          </div>
        </div>

        <!-- ====== CV PATH SELECTOR ====== -->
        <div class="cv-section-divider"><i class="fa-solid fa-file-user"></i> Вашето CV</div>
        <div class="cv-path-selector">
          <button type="button" class="cv-path-btn active" data-path="build">
            <i class="fa-solid fa-keyboard"></i>
            <div class="cv-path-btn-text">
              <strong>Нямам CV</strong>
              <span>Попълнете данните — правим CV за вас</span>
            </div>
          </button>
          <button type="button" class="cv-path-btn" data-path="upload">
            <i class="fa-solid fa-upload"></i>
            <div class="cv-path-btn-text">
              <strong>Имам CV</strong>
              <span>Качете файла — адаптираме го</span>
            </div>
          </button>
        </div>

        <!-- ====== PATH A: Build CV ====== -->
        <div id="cvPathBuild">
          <div class="cv-section-divider"><i class="fa-solid fa-user"></i> Лична информация</div>
          <div class="wizard-form-row">
            <div class="form-group">
              <label for="cvFirstName">Собствено име</label>
              <div class="input-wrap"><i class="fa-solid fa-user"></i>
                <input type="text" id="cvFirstName" placeholder="Иван" />
              </div>
            </div>
            <div class="form-group">
              <label for="cvLastName">Фамилия</label>
              <div class="input-wrap"><i class="fa-solid fa-user"></i>
                <input type="text" id="cvLastName" placeholder="Иванов" />
              </div>
            </div>
          </div>
          <div class="wizard-form-row">
            <div class="form-group">
              <label for="cvBirthDate">Дата на раждане</label>
              <div class="input-wrap"><i class="fa-solid fa-cake-candles"></i>
                <input type="date" id="cvBirthDate" />
              </div>
            </div>
            <div class="form-group">
              <label for="cvCity">Град на пребиваване</label>
              <div class="input-wrap"><i class="fa-solid fa-location-dot"></i>
                <input type="text" id="cvCity" placeholder="напр. Берлин, Виена..." />
              </div>
            </div>
          </div>
          <div class="wizard-form-row">
            <div class="form-group">
              <label for="cvMarital">Семейно положение</label>
              <div class="input-wrap select-wrap"><i class="fa-solid fa-heart"></i>
                <select id="cvMarital">
                  <option value="">— Избери —</option>
                  <option>Неженен / Неомъжена</option>
                  <option>Женен / Омъжена</option>
                  <option>Разведен / Разведена</option>
                </select>
                <i class="fa-solid fa-chevron-down select-arrow"></i>
              </div>
            </div>
            <div class="form-group">
              <label for="cvNationality">Националност</label>
              <div class="input-wrap"><i class="fa-solid fa-flag"></i>
                <input type="text" id="cvNationality" placeholder="Българска" />
              </div>
            </div>
          </div>

          <div class="cv-section-divider"><i class="fa-solid fa-graduation-cap"></i> Образование</div>
          <div class="wizard-form-row">
            <div class="form-group">
              <label for="cvEduLevel">Ниво</label>
              <div class="input-wrap select-wrap"><i class="fa-solid fa-graduation-cap"></i>
                <select id="cvEduLevel">
                  <option value="">— Избери —</option>
                  <option>Основно</option>
                  <option>Средно (гимназия)</option>
                  <option>Професионално (СПТУ)</option>
                  <option>Бакалавър</option>
                  <option>Магистър</option>
                  <option>Докторат</option>
                </select>
                <i class="fa-solid fa-chevron-down select-arrow"></i>
              </div>
            </div>
            <div class="form-group">
              <label for="cvEduYear">Година на завършване</label>
              <div class="input-wrap"><i class="fa-solid fa-calendar"></i>
                <input type="number" id="cvEduYear" placeholder="напр. 2019" min="1970" max="2030" />
              </div>
            </div>
          </div>
          <div class="wizard-form-row">
            <div class="form-group">
              <label for="cvEduSchool">Учебно заведение</label>
              <div class="input-wrap"><i class="fa-solid fa-school"></i>
                <input type="text" id="cvEduSchool" placeholder="Университет / Гимназия / СПТУ" />
              </div>
            </div>
            <div class="form-group">
              <label for="cvEduField">Специалност</label>
              <div class="input-wrap"><i class="fa-solid fa-book"></i>
                <input type="text" id="cvEduField" placeholder="напр. Икономика, Строителство..." />
              </div>
            </div>
          </div>

          <div class="cv-section-divider"><i class="fa-solid fa-briefcase"></i> Последна работа</div>
          <div class="wizard-form-row">
            <div class="form-group">
              <label for="cvJobCompany">Компания</label>
              <div class="input-wrap"><i class="fa-solid fa-building"></i>
                <input type="text" id="cvJobCompany" placeholder="напр. BMW, Lidl..." />
              </div>
            </div>
            <div class="form-group">
              <label for="cvJobTitle">Длъжност</label>
              <div class="input-wrap"><i class="fa-solid fa-id-badge"></i>
                <input type="text" id="cvJobTitle" placeholder="напр. Шофьор, Оператор..." />
              </div>
            </div>
          </div>
          <div class="wizard-form-row">
            <div class="form-group">
              <label for="cvJobFrom">От</label>
              <div class="input-wrap"><i class="fa-solid fa-calendar-days"></i>
                <input type="month" id="cvJobFrom" />
              </div>
            </div>
            <div class="form-group">
              <label for="cvJobTo">До</label>
              <div class="input-wrap"><i class="fa-solid fa-calendar-days"></i>
                <input type="month" id="cvJobTo" />
              </div>
              <label class="cv-still-working">
                <input type="checkbox" id="cvJobCurrent" /> В момента работя там
              </label>
            </div>
          </div>
          <div class="form-group">
            <label for="cvJobDesc">Основни задължения (накратко)</label>
            <div class="input-wrap textarea-wrap"><i class="fa-solid fa-list-check"></i>
              <textarea id="cvJobDesc" rows="2" placeholder="напр. Доставки с камион, работа с вилоловач..."></textarea>
            </div>
          </div>

          <div class="cv-section-divider"><i class="fa-solid fa-star"></i> Умения</div>
          <div class="wizard-form-row">
            <div class="form-group">
              <label for="cvLang1">Роден език</label>
              <div class="input-wrap"><i class="fa-solid fa-language"></i>
                <input type="text" id="cvLang1" value="Български — Майчин" />
              </div>
            </div>
            <div class="form-group">
              <label for="cvLang2">Чужд език + ниво</label>
              <div class="input-wrap"><i class="fa-solid fa-language"></i>
                <input type="text" id="cvLang2" placeholder="напр. Немски — B1" />
              </div>
            </div>
          </div>
          <div class="wizard-form-row">
            <div class="form-group">
              <label for="cvLang3">Чужд език 2 (по избор)</label>
              <div class="input-wrap"><i class="fa-solid fa-language"></i>
                <input type="text" id="cvLang3" placeholder="напр. Английски — A2" />
              </div>
            </div>
            <div class="form-group">
              <label for="cvComputer">Компютърни умения</label>
              <div class="input-wrap"><i class="fa-solid fa-laptop"></i>
                <input type="text" id="cvComputer" placeholder="напр. MS Office, Excel..." />
              </div>
            </div>
          </div>
          <div class="toggle-group">
            <div class="toggle-field">
              <span class="toggle-label">Шофьорска книжка</span>
              <label class="toggle-switch">
                <input type="checkbox" id="t_license" />
                <div class="toggle-track"></div>
                <span class="toggle-text">Не</span>
              </label>
            </div>
            <div class="toggle-reveal" id="tr_license">
              <div class="form-group" style="margin-top:10px">
                <label>Категории</label>
                <div class="glass-checkboxes">
                  ${['AM','A1','A2','A','B','BE','C1','C1E','C','CE','D1','D','DE','Т (трактор)'].map(c =>
                    `<label class="glass-checkbox-item"><input type="checkbox" name="cvLicense" value="${c}" /><span>${c}</span></label>`
                  ).join('')}
                </div>
              </div>
            </div>
          </div>
          <div class="form-group" style="margin-top:10px">
            <label for="cvOtherSkills">Сертификати / Допълнителни умения</label>
            <div class="input-wrap textarea-wrap"><i class="fa-solid fa-certificate"></i>
              <textarea id="cvOtherSkills" rows="2" placeholder="напр. Gabelstapler, Kranschein, Erste Hilfe..."></textarea>
            </div>
          </div>

          <div class="cv-section-divider"><i class="fa-solid fa-camera"></i> Снимка за CV</div>
          <div class="form-group">
            <div class="upload-zone">
              <input type="file" id="f_photo" accept="image/*" />
              <div class="upload-zone-icon"><i class="fa-solid fa-circle-user"></i></div>
              <div class="upload-zone-text">Портретна снимка (препоръчително)</div>
              <div class="upload-zone-sub">JPG, PNG · Добро осветление</div>
              <div class="upload-preview" id="fp_photo"></div>
            </div>
            <div class="upload-file-info"><i class="fa-solid fa-envelope"></i> Снимката се изпраща автоматично по <strong>имейл</strong> заедно със заявката.</div>
          </div>
        </div><!-- end cvPathBuild -->

        <!-- ====== PATH B: Upload existing CV ====== -->
        <div id="cvPathUpload" style="display:none">
          <div class="form-group">
            <label>Качете вашето CV <span class="required">*</span></label>
            <div class="upload-zone">
              <input type="file" id="f_cv" accept=".pdf,.doc,.docx,image/*" />
              <div class="upload-zone-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
              <div class="upload-zone-text">Качете CV файл</div>
              <div class="upload-zone-sub">PDF, Word или снимка · Drag &amp; Drop</div>
              <div class="upload-preview" id="fp_cv"></div>
            </div>
            <div class="upload-file-info"><i class="fa-solid fa-envelope"></i> CV файлът се изпраща автоматично по <strong>имейл</strong> заедно със заявката.</div>
          </div>
          <div class="form-group">
            <label>Снимка за CV (по избор)</label>
            <div class="upload-zone">
              <input type="file" id="f_photo2" accept="image/*" />
              <div class="upload-zone-icon"><i class="fa-solid fa-circle-user"></i></div>
              <div class="upload-zone-text">Портретна снимка</div>
              <div class="upload-zone-sub">JPG, PNG</div>
              <div class="upload-preview" id="fp_photo2"></div>
            </div>
            <div class="upload-file-info"><i class="fa-solid fa-envelope"></i> Снимката се изпраща автоматично по <strong>имейл</strong> заедно със заявката.</div>
          </div>
        </div><!-- end cvPathUpload -->

        <!-- ====== МОТИВАЦИОННО ПИСМО (само CV+Писмо и Пълна услуга) ====== -->
        <div id="jobLetterSection" style="display:none">
          <div class="cv-section-divider"><i class="fa-solid fa-envelope-open-text"></i> Мотивационно писмо</div>
          <div class="form-group">
            <label for="cvLetterWhy">Защо искате тази работа?</label>
            <div class="input-wrap textarea-wrap"><i class="fa-solid fa-comment-dots"></i>
              <textarea id="cvLetterWhy" rows="2" placeholder="напр. Имам 5г. опит в тази сфера, искам да се развивам в Германия..."></textarea>
            </div>
          </div>
          <div class="form-group">
            <label for="cvLetterStrength">Какво е вашето предимство пред другите кандидати?</label>
            <div class="input-wrap textarea-wrap"><i class="fa-solid fa-trophy"></i>
              <textarea id="cvLetterStrength" rows="2" placeholder="напр. Говоря немски, имам валидна книжка C, работил съм в Германия..."></textarea>
            </div>
          </div>
        </div>

        <!-- ====== КАНДИДАТСТВАНЕ (само Пълна услуга) ====== -->
        <div id="jobApplySection" style="display:none">
          <div class="cv-section-divider"><i class="fa-solid fa-rocket"></i> Кандидатстване вместо вас</div>
          <div class="wizard-form-row">
            <div class="form-group">
              <label for="cvApplyCount">Брой обяви за кандидатстване</label>
              <div class="input-wrap select-wrap"><i class="fa-solid fa-list-ol"></i>
                <select id="cvApplyCount">
                  <option value="до 5 обяви">До 5 обяви (включено в цената)</option>
                  <option value="до 10 обяви">До 10 обяви (+€20)</option>
                  <option value="до 20 обяви">До 20 обяви (+€35)</option>
                </select>
                <i class="fa-solid fa-chevron-down select-arrow"></i>
              </div>
            </div>
            <div class="form-group">
              <label for="cvApplyDeadline">Желан старт</label>
              <div class="input-wrap"><i class="fa-solid fa-calendar-days"></i>
                <input type="date" id="cvApplyDeadline" />
              </div>
            </div>
          </div>
          <div class="form-group">
            <label for="cvApplyNotes">Допълнителни изисквания (по избор)</label>
            <div class="input-wrap textarea-wrap"><i class="fa-solid fa-pen-clip"></i>
              <textarea id="cvApplyNotes" rows="2" placeholder="напр. Само пълен работен ден, само в Берлин, само с осигуровки..."></textarea>
            </div>
          </div>
        </div>

      </div>`;

    case 'Помощ с институция':
      return `<div class="wizard-step-card">
        <h3 class="wizard-panel-title">Помощ с институция</h3>
        <p class="wizard-panel-subtitle">Изберете какво ви трябва — ние свършваме работата</p>

        <input type="hidden" id="s2SelectedPkg" value="Превод + обяснение — €39" />
        <div class="job-pkg-grid">
          <button type="button" class="job-pkg-card active" data-pkg="inst-translate">
            <div class="job-pkg-icon"><i class="fa-solid fa-language"></i></div>
            <div class="job-pkg-name">Превод + обяснение на писмо</div>
            <div class="job-pkg-price">€39</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Превеждаме писмото</li>
              <li><i class="fa-solid fa-check"></i> Обясняваме какво се иска</li>
              <li><i class="fa-solid fa-check"></i> Съвет какво да направите</li>
            </ul>
          </button>
          <button type="button" class="job-pkg-card" data-pkg="inst-reply">
            <div class="job-pkg-badge">Популярно</div>
            <div class="job-pkg-icon"><i class="fa-solid fa-pen-to-square"></i></div>
            <div class="job-pkg-name">Писане на отговор / молба</div>
            <div class="job-pkg-price">€59</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Всичко от "Превод"</li>
              <li><i class="fa-solid fa-check"></i> Написване на официален отговор</li>
              <li><i class="fa-solid fa-check"></i> Widerspruch / жалба</li>
            </ul>
          </button>
          <button type="button" class="job-pkg-card" data-pkg="inst-full">
            <div class="job-pkg-badge job-pkg-badge-gold">Пълна услуга</div>
            <div class="job-pkg-icon"><i class="fa-solid fa-handshake"></i></div>
            <div class="job-pkg-name">Пълна комуникация с институция</div>
            <div class="job-pkg-price">от €89</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Водим кореспонденцията</li>
              <li><i class="fa-solid fa-check"></i> Обаждания от ваше лице</li>
              <li><i class="fa-solid fa-check"></i> До приключване на случая</li>
            </ul>
          </button>
        </div>

        ${countryDropdown('s2Country', 'В коя държава сте?')}
        <div class="form-group">
          <label>Коя институция?</label>
          <div class="glass-checkboxes" id="s2InstitutionList">
            ${(typeof getCountryData !== 'undefined' ? getCountryData('Германия').institutions : ['Jobcenter','Kindergeld','Elterngeld','Krankenkasse','Finanzamt','Rentenversicherung','Ausländerbehörde','Wohngeld','BAföG','Друга'])
              .map(i => `<label class="glass-checkbox-item"><input type="checkbox" name="s2institution" value="${i}" /><span>${i}</span></label>`)
              .join('')}
          </div>
        </div>
        <div class="form-group">
          <label>Имате ли писмо от институцията?</label>
          <div class="upload-zone">
            <input type="file" id="f_inst" accept="image/*,.pdf" multiple />
            <div class="upload-zone-icon"><i class="fa-solid fa-camera"></i></div>
            <div class="upload-zone-text">Снимайте писмото и го качете тук</div>
            <div class="upload-zone-sub">JPG, PNG, PDF</div>
            <div class="upload-preview" id="fp_inst"></div>
          </div>
          <div class="upload-file-info"><i class="fa-solid fa-envelope"></i> Документът се изпраща автоматично по <strong>имейл</strong> заедно със заявката.</div>
        </div>
        <div class="form-group">
          <label for="s2InstProblem">Какъв е проблемът накратко?</label>
          <div class="input-wrap textarea-wrap">
            <i class="fa-solid fa-comment-dots"></i>
            <textarea id="s2InstProblem" rows="3" placeholder="Опишете ситуацията накратко..."></textarea>
          </div>
        </div>
        <div class="form-group">
          <label for="s2Deadline">Имате ли краен срок?</label>
          <div class="input-wrap">
            <i class="fa-solid fa-calendar-days"></i>
            <input type="date" id="s2Deadline" />
          </div>
        </div>
      </div>`;

    case 'Тъкмо пристигнах':
      return `<div class="wizard-step-card">
        <h3 class="wizard-panel-title">Тъкмо пристигнах</h3>
        <p class="wizard-panel-subtitle">Изберете колко помощ ви трябва — ние правим останалото</p>

        <input type="hidden" id="s2SelectedPkg" value="Стандартен пакет — €79" />
        <div class="job-pkg-grid">
          <button type="button" class="job-pkg-card" data-pkg="new-basic">
            <div class="job-pkg-icon"><i class="fa-solid fa-compass"></i></div>
            <div class="job-pkg-name">Базова ориентация</div>
            <div class="job-pkg-price">€49</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Чек-лист какво да направите</li>
              <li><i class="fa-solid fa-check"></i> Насоки за всяка стъпка</li>
              <li><i class="fa-solid fa-check"></i> 30 мин. консултация</li>
            </ul>
          </button>
          <button type="button" class="job-pkg-card active" data-pkg="new-standard">
            <div class="job-pkg-badge">Популярно</div>
            <div class="job-pkg-icon"><i class="fa-solid fa-plane-arrival"></i></div>
            <div class="job-pkg-name">Стандартен пакет</div>
            <div class="job-pkg-price">€79</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Anmeldung, каса, банка, данъци</li>
              <li><i class="fa-solid fa-check"></i> Ние попълваме всички формуляри</li>
              <li><i class="fa-solid fa-check"></i> 7-дневна поддръжка</li>
            </ul>
          </button>
          <button type="button" class="job-pkg-card" data-pkg="new-premium">
            <div class="job-pkg-badge job-pkg-badge-gold">Всичко включено</div>
            <div class="job-pkg-icon"><i class="fa-solid fa-star"></i></div>
            <div class="job-pkg-name">Премиум пакет</div>
            <div class="job-pkg-price">€119</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Всичко от стандартния</li>
              <li><i class="fa-solid fa-check"></i> Търсене на жилище + договор</li>
              <li><i class="fa-solid fa-check"></i> 30-дневна поддръжка</li>
            </ul>
          </button>
        </div>

        ${countryDropdown('s2Country', 'В коя държава пристигнахте?')}
        <div class="form-group">
          <label for="s2WhenArrived">Кога пристигнахте?</label>
          <div class="input-wrap select-wrap">
            <i class="fa-solid fa-calendar"></i>
            <select id="s2WhenArrived">
              <option value="">— Избери —</option>
              <option>Още не съм пристигнал</option>
              <option>Тази седмица</option>
              <option>Този месец</option>
              <option>Преди 1-3 месеца</option>
              <option>Преди повече от 3 месеца</option>
            </select>
            <i class="fa-solid fa-chevron-down select-arrow"></i>
          </div>
        </div>
        <div class="form-group">
          <label>Какво ви трябва?</label>
          <div class="glass-checkboxes" id="s2NewcomerNeedsList">
            ${(typeof getCountryData !== 'undefined' ? getCountryData('Германия').newcomerNeeds : ['Регистрация по адрес','Здравна осигуровка','Банкова сметка','Данъчен номер','SIM карта и интернет','Ориентация и съвети','Търсене на жилище','Всичко от списъка'])
              .map(i => `<label class="glass-checkbox-item"><input type="checkbox" name="s2needs" value="${i}" /><span>${i}</span></label>`)
              .join('')}
          </div>
        </div>
        <div class="form-group">
          <label for="s2Language">Говорите ли езика на страната?</label>
          <div class="input-wrap select-wrap">
            <i class="fa-solid fa-language"></i>
            <select id="s2Language">
              <option value="">— Избери —</option>
              <option>Не</option><option>Малко</option><option>Средно</option><option>Добре</option>
            </select>
            <i class="fa-solid fa-chevron-down select-arrow"></i>
          </div>
        </div>
      </div>`;

    case 'Документ или превод':
      return `<div class="wizard-step-card">
        <h3 class="wizard-panel-title">Документ или превод</h3>
        <p class="wizard-panel-subtitle">Изберете какво ви трябва — цените са видими</p>

        <!-- ====== ЦЕНОВИ ПАКЕТИ ====== -->
        <input type="hidden" id="s2DocPkg" value="Превод до 1 стр. — €29" />
        <div class="job-pkg-grid" id="docPkgGrid">
          <button type="button" class="job-pkg-card active" data-pkg="translate1" data-doc-price="29">
            <div class="job-pkg-icon"><i class="fa-solid fa-file-lines"></i></div>
            <div class="job-pkg-name">Превод до 1 стр.</div>
            <div class="job-pkg-price">€29</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Превод на 1 страница</li>
              <li><i class="fa-solid fa-check"></i> Готово до 24 часа</li>
            </ul>
          </button>
          <button type="button" class="job-pkg-card" data-pkg="form" data-doc-price="39">
            <div class="job-pkg-icon"><i class="fa-solid fa-pen-to-square"></i></div>
            <div class="job-pkg-name">Официален формуляр</div>
            <div class="job-pkg-price">€39</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Попълване на формуляр</li>
              <li><i class="fa-solid fa-check"></i> Проверка и обяснение</li>
            </ul>
          </button>
          <button type="button" class="job-pkg-card" data-pkg="translate5" data-doc-price="49">
            <div class="job-pkg-badge">Популярно</div>
            <div class="job-pkg-icon"><i class="fa-solid fa-copy"></i></div>
            <div class="job-pkg-name">Превод до 5 стр.</div>
            <div class="job-pkg-price">€49</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> До 5 страници превод</li>
              <li><i class="fa-solid fa-check"></i> Готово до 24 часа</li>
            </ul>
          </button>
          <button type="button" class="job-pkg-card" data-pkg="power" data-doc-price="35">
            <div class="job-pkg-icon"><i class="fa-solid fa-stamp"></i></div>
            <div class="job-pkg-name">Пълномощно / Декларация</div>
            <div class="job-pkg-price">€35</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Изготвяне на документа</li>
              <li><i class="fa-solid fa-check"></i> Правно коректно</li>
            </ul>
          </button>
        </div>

        <!-- ====== ТИП + ЕЗИЦИ ====== -->
        <div class="cv-section-divider" style="margin-top:20px"><i class="fa-solid fa-language"></i> Детайли за документа</div>
        <div class="form-group">
          <label for="s2DocType">Уточнете вида документ</label>
          <div class="input-wrap select-wrap">
            <i class="fa-solid fa-file-lines"></i>
            <select id="s2DocType">
              <option value="">— Избери —</option>
              ${['Превод на документ','Попълване на формуляр','Официално писмо','Пълномощно',
                 'Декларация','Молба / Заявление','Жалба / Възражение (Widerspruch)','Друго']
                .map(o => `<option>${o}</option>`).join('')}
            </select>
            <i class="fa-solid fa-chevron-down select-arrow"></i>
          </div>
        </div>
        <div class="wizard-form-row">
          <div class="form-group">
            <label for="s2LangFrom">От какъв език?</label>
            <div class="input-wrap select-wrap">
              <i class="fa-solid fa-language"></i>
              <select id="s2LangFrom">
                <option value="">— Изходен —</option>
                ${['Български','Немски','Английски','Френски','Испански','Италиански','Румънски','Полски','Друг']
                  .map(l => `<option>${l}</option>`).join('')}
              </select>
              <i class="fa-solid fa-chevron-down select-arrow"></i>
            </div>
          </div>
          <div class="form-group">
            <label for="s2LangTo">На какъв език?</label>
            <div class="input-wrap select-wrap">
              <i class="fa-solid fa-language"></i>
              <select id="s2LangTo">
                <option value="">— Целеви —</option>
                ${['Немски','Английски','Български','Френски','Испански','Италиански','Румънски','Полски','Друг']
                  .map(l => `<option>${l}</option>`).join('')}
              </select>
              <i class="fa-solid fa-chevron-down select-arrow"></i>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label for="s2DocPages">Брой страници</label>
          <div class="input-wrap">
            <i class="fa-solid fa-file-lines"></i>
            <input type="number" id="s2DocPages" min="1" max="500" placeholder="напр. 3" />
          </div>
        </div>
        <div class="form-group">
          <label>Качете документа (ако имате)</label>
          <div class="upload-zone">
            <input type="file" id="f_doc" accept="image/*,.pdf,.doc,.docx" multiple />
            <div class="upload-zone-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
            <div class="upload-zone-text">Може да качите снимка или PDF</div>
            <div class="upload-zone-sub">JPG, PNG, PDF, Word &bull; Drag &amp; Drop</div>
            <div class="upload-preview" id="fp_doc"></div>
          </div>
          <div class="upload-file-info"><i class="fa-solid fa-envelope"></i> Файлът се изпраща автоматично по <strong>имейл</strong> заедно със заявката.</div>
        </div>
        <div class="wizard-form-row">
          <div class="form-group">
            <label for="s2DocDeadline">Има ли краен срок?</label>
            <div class="input-wrap">
              <i class="fa-solid fa-calendar-days"></i>
              <input type="date" id="s2DocDeadline" />
            </div>
          </div>
          <div class="form-group" style="display:flex;align-items:center;gap:12px;padding-top:28px">
            <label class="toggle-switch" style="margin:0">
              <input type="checkbox" id="t_express" />
              <div class="toggle-track"></div>
            </label>
            <span style="font-size:0.88rem;color:var(--text-secondary)">Спешна поръчка до 6 часа? (+50%)</span>
          </div>
        </div>
      </div>`;

    case 'Онлайн курс / Сертификат':
      return `<div class="wizard-step-card">
        <h3 class="wizard-panel-title">Онлайн курс и сертификат</h3>
        <p class="wizard-panel-subtitle">Изберете пакет — от консултация до гарантиран сертификат</p>

        <input type="hidden" id="s2SelectedPkg" value="Помощ стъпка по стъпка — €49" />
        <div class="job-pkg-grid">
          <button type="button" class="job-pkg-card" data-pkg="course-consult">
            <div class="job-pkg-icon"><i class="fa-solid fa-compass"></i></div>
            <div class="job-pkg-name">Консултация + Подбор</div>
            <div class="job-pkg-price">€29</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Подбор на курс за вас</li>
              <li><i class="fa-solid fa-check"></i> Помощ със записването</li>
              <li><i class="fa-solid fa-check"></i> Съвети за финансиране</li>
            </ul>
          </button>
          <button type="button" class="job-pkg-card active" data-pkg="guided">
            <div class="job-pkg-badge">Популярно</div>
            <div class="job-pkg-icon"><i class="fa-solid fa-hands-holding"></i></div>
            <div class="job-pkg-name">Помощ стъпка по стъпка</div>
            <div class="job-pkg-price">€49</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Всичко от "Консултация"</li>
              <li><i class="fa-solid fa-check"></i> Водене през материала</li>
              <li><i class="fa-solid fa-check"></i> Подготовка за изпита</li>
            </ul>
          </button>
          <button type="button" class="job-pkg-card" data-pkg="exam">
            <div class="job-pkg-badge job-pkg-badge-gold">Гарантиран резултат</div>
            <div class="job-pkg-icon"><i class="fa-solid fa-trophy"></i></div>
            <div class="job-pkg-name">Ние правим теста вместо вас</div>
            <div class="job-pkg-price">€99</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Ние полагаме изпита</li>
              <li><i class="fa-solid fa-check"></i> Сертификат гарантиран</li>
              <li><i class="fa-solid fa-check"></i> 100% дискретност</li>
            </ul>
          </button>
        </div>

        ${countryDropdown('s2Country', 'В коя държава сте?')}

        <div class="form-group">
          <label>Каква сфера ви интересува?</label>
          <div class="glass-checkboxes">
            ${['IT и програмиране','Здравеопазване и медицина','Логистика и шофьори','Строителство',
               'Търговия и продажби','Счетоводство и финанси','Немски / чужд език','Друго']
              .map(s => `<label class="glass-checkbox-item"><input type="checkbox" name="s2sphere" value="${s}" /><span>${s}</span></label>`)
              .join('')}
          </div>
        </div>

        <div class="form-group">
          <label for="s2CourseName">Конкретен курс или сертификат (ако знаете)?</label>
          <div class="input-wrap">
            <i class="fa-solid fa-graduation-cap"></i>
            <input type="text" id="s2CourseName" placeholder="напр. TELC B2, ECDL, IHK Kaufmann..." />
          </div>
        </div>

        <div class="form-group">
          <label for="s2CourseGoal">Каква е целта ви?</label>
          <div class="input-wrap select-wrap">
            <i class="fa-solid fa-bullseye"></i>
            <select id="s2CourseGoal">
              <option value="">— Избери —</option>
              <option>По-добра работа</option>
              <option>Нова професия</option>
              <option>Сертификат за текущата работа</option>
              <option data-bureau>Квалификация за Jobcenter / AMS</option>
              <option>Лично развитие</option>
              <option>Друго</option>
            </select>
            <i class="fa-solid fa-chevron-down select-arrow"></i>
          </div>
        </div>
      </div>`;

    case 'Пълно обслужване А до Я':
      return `<div class="wizard-step-card">
        <h3 class="wizard-panel-title">Пълно обслужване от А до Я</h3>
        <p class="wizard-panel-subtitle">Изберете ниво — ние се грижим за всичко</p>

        <input type="hidden" id="s2SelectedPkg" value="Старт пакет — €99" />
        <div class="job-pkg-grid">
          <button type="button" class="job-pkg-card active" data-pkg="full-start">
            <div class="job-pkg-icon"><i class="fa-solid fa-hand-holding-heart"></i></div>
            <div class="job-pkg-name">Старт пакет</div>
            <div class="job-pkg-price">€99</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> До 3 задачи включени</li>
              <li><i class="fa-solid fa-check"></i> Личен консултант</li>
              <li><i class="fa-solid fa-check"></i> Срок до 7 дни</li>
            </ul>
          </button>
          <button type="button" class="job-pkg-card" data-pkg="full-standard">
            <div class="job-pkg-badge">Популярно</div>
            <div class="job-pkg-icon"><i class="fa-solid fa-bell-concierge"></i></div>
            <div class="job-pkg-name">Стандартен</div>
            <div class="job-pkg-price">€129</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> До 6 задачи включени</li>
              <li><i class="fa-solid fa-check"></i> Приоритетна обработка</li>
              <li><i class="fa-solid fa-check"></i> 14-дневна поддръжка</li>
            </ul>
          </button>
          <button type="button" class="job-pkg-card" data-pkg="full-vip">
            <div class="job-pkg-badge job-pkg-badge-gold">Максимален</div>
            <div class="job-pkg-icon"><i class="fa-solid fa-gem"></i></div>
            <div class="job-pkg-name">Пълен пакет</div>
            <div class="job-pkg-price">€139</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Неограничени задачи</li>
              <li><i class="fa-solid fa-check"></i> Спешна обработка</li>
              <li><i class="fa-solid fa-check"></i> 30-дневна поддръжка</li>
            </ul>
          </button>
        </div>

        <div class="form-group">
          <label>Какво включва вашият случай?</label>
          <div class="glass-checkboxes">
            ${['CV и кандидатстване','Документи за институции','Регистрации (Anmeldung и др.)',
               'Преводи','Курсове и сертификати','Не съм сигурен — искам консултация']
              .map(s => `<label class="glass-checkbox-item"><input type="checkbox" name="s2fullservice" value="${s}" /><span>${s}</span></label>`)
              .join('')}
          </div>
        </div>
        ${countryDropdown('s2Country', 'В коя държава сте?')}
        <div class="form-group">
          <label for="s2FullDesc">Разкажете накратко ситуацията си</label>
          <div class="input-wrap textarea-wrap">
            <i class="fa-solid fa-comment-dots"></i>
            <textarea id="s2FullDesc" rows="4" placeholder="Напишете свободно какво ви трябва. Ние ще предложим най-доброто решение."></textarea>
          </div>
        </div>
      </div>`;

    case 'VIP Абонамент':
      return `<div class="wizard-step-card">
        <div class="vip-summary-card">
          <div class="vip-summary-card-title"><i class="fa-solid fa-crown"></i> VIP Абонамент — €149/мес</div>
          <ul>
            <li><i class="fa-solid fa-check"></i> Неограничени документи</li>
            <li><i class="fa-solid fa-check"></i> Приоритетна обработка</li>
            <li><i class="fa-solid fa-check"></i> Лична WhatsApp линия</li>
            <li><i class="fa-solid fa-check"></i> Спешни случаи 24/7</li>
          </ul>
        </div>
        ${countryDropdown('s2Country', 'В коя държава сте?')}
        <div class="form-group">
          <label for="s2VipDocs">Колко документа очаквате месечно?</label>
          <div class="input-wrap select-wrap">
            <i class="fa-solid fa-file-lines"></i>
            <select id="s2VipDocs">
              <option value="">— Избери —</option>
              <option>1-3</option><option>4-10</option><option>10+</option><option>Не знам</option>
            </select>
            <i class="fa-solid fa-chevron-down select-arrow"></i>
          </div>
        </div>
        <div class="form-group">
          <label>Какви услуги ще ползвате най-много?</label>
          <div class="glass-checkboxes">
            ${['CV и работа','Институции','Документи','Преводи','Курсове','Всичко']
              .map(s => `<label class="glass-checkbox-item"><input type="checkbox" name="s2vipservices" value="${s}" /><span>${s}</span></label>`)
              .join('')}
          </div>
        </div>
        <div class="form-group">
          <label for="s2VipDesc">Разкажете накратко ситуацията си (по избор)</label>
          <div class="input-wrap textarea-wrap"><i class="fa-solid fa-comment-dots"></i>
            <textarea id="s2VipDesc" rows="3" placeholder="Напр. пристигнах наскоро, трябват ми документи, CV, и помощ с институции..."></textarea>
          </div>
        </div>
      </div>`;

    case 'Данъчна декларация':
      return `<div class="wizard-step-card">
        <h3 class="wizard-panel-title">Данъчна декларация</h3>
        <p class="wizard-panel-subtitle">Изберете пакет — борим се за максимален възврат</p>

        <input type="hidden" id="s2SelectedPkg" value="Проста декларация — €59" />
        <div class="job-pkg-grid">
          <button type="button" class="job-pkg-card" data-pkg="tax-old">
            <div class="job-pkg-icon"><i class="fa-solid fa-clock-rotate-left"></i></div>
            <div class="job-pkg-name">Предходна година</div>
            <div class="job-pkg-price">€49</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Nachreichung</li>
              <li><i class="fa-solid fa-check"></i> 1 предходна година</li>
              <li><i class="fa-solid fa-check"></i> Базова оптимизация</li>
            </ul>
          </button>
          <button type="button" class="job-pkg-card active" data-pkg="tax-simple">
            <div class="job-pkg-badge">Популярно</div>
            <div class="job-pkg-icon"><i class="fa-solid fa-receipt"></i></div>
            <div class="job-pkg-name">Проста декларация</div>
            <div class="job-pkg-price">€59</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> 1 работодател</li>
              <li><i class="fa-solid fa-check"></i> Оптимизация за възврат</li>
              <li><i class="fa-solid fa-check"></i> Комуникация с Finanzamt</li>
            </ul>
          </button>
          <button type="button" class="job-pkg-card" data-pkg="tax-complex">
            <div class="job-pkg-badge job-pkg-badge-gold">Максимален възврат</div>
            <div class="job-pkg-icon"><i class="fa-solid fa-coins"></i></div>
            <div class="job-pkg-name">Сложна декларация</div>
            <div class="job-pkg-price">€89</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> 2+ работодатели / наем</li>
              <li><i class="fa-solid fa-check"></i> Разходи и приспадания</li>
              <li><i class="fa-solid fa-check"></i> Пълна оптимизация</li>
            </ul>
          </button>
        </div>

        <div class="wizard-form-row">
          <div class="form-group">
            <label for="s2TaxYear">За коя данъчна година?</label>
            <div class="input-wrap select-wrap"><i class="fa-solid fa-calendar"></i>
              <select id="s2TaxYear">
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="Повече от 1 година">Повече от 1 година</option>
              </select>
              <i class="fa-solid fa-chevron-down select-arrow"></i>
            </div>
          </div>
          <div class="form-group">
            <label for="s2TaxCountry">В коя държава работите?</label>
            <div class="input-wrap select-wrap"><i class="fa-solid fa-globe"></i>
              <select id="s2TaxCountry">
                <option value="Германия">Германия</option>
                <option value="Австрия">Австрия</option>
                <option value="Швейцария">Швейцария</option>
                <option value="Нидерландия">Нидерландия</option>
                <option value="Белгия">Белгия</option>
                <option value="Друга">Друга</option>
              </select>
              <i class="fa-solid fa-chevron-down select-arrow"></i>
            </div>
          </div>
        </div>
        <div class="wizard-form-row">
          <div class="form-group">
            <label for="s2TaxStatus">Семеен статус</label>
            <div class="input-wrap select-wrap"><i class="fa-solid fa-users"></i>
              <select id="s2TaxStatus">
                <option value="Неженен/а">Неженен/а</option>
                <option value="Женен/Омъжена">Женен/Омъжена</option>
                <option value="С деца">С деца</option>
              </select>
              <i class="fa-solid fa-chevron-down select-arrow"></i>
            </div>
          </div>
          <div class="form-group">
            <label for="s2TaxDoc">Имате ли Lohnsteuerbescheinigung?</label>
            <div class="input-wrap select-wrap"><i class="fa-solid fa-file-invoice"></i>
              <select id="s2TaxDoc">
                <option value="Да">Да — мога да го изпратя</option>
                <option value="Не">Не — ще го набавя</option>
                <option value="Не знам">Не знам</option>
              </select>
              <i class="fa-solid fa-chevron-down select-arrow"></i>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label for="s2TaxNote">Допълнителна информация (по избор)</label>
          <div class="input-wrap textarea-wrap"><i class="fa-solid fa-comment-dots"></i>
            <textarea id="s2TaxNote" rows="3" placeholder="Напр. работил съм на 2 места, имам deductibles..."></textarea>
          </div>
        </div>
      </div>`;

    case 'КЕП онлайн подпис':
      return `<div class="wizard-step-card">
        <h3 class="wizard-panel-title">КЕП — Квалифициран електронен подпис</h3>
        <p class="wizard-panel-subtitle">Изберете какво ви трябва — активираме от разстояние</p>

        <input type="hidden" id="s2SelectedPkg" value="Нов КЕП (Evrotrust) — €29" />
        <div class="job-pkg-grid">
          <button type="button" class="job-pkg-card" data-pkg="kep-renew">
            <div class="job-pkg-icon"><i class="fa-solid fa-rotate"></i></div>
            <div class="job-pkg-name">Подновяване</div>
            <div class="job-pkg-price">€19</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Подновяване на сертификат</li>
              <li><i class="fa-solid fa-check"></i> Бърза процедура</li>
            </ul>
          </button>
          <button type="button" class="job-pkg-card active" data-pkg="kep-new">
            <div class="job-pkg-badge">Популярно</div>
            <div class="job-pkg-icon"><i class="fa-solid fa-pen-nib"></i></div>
            <div class="job-pkg-name">Нов КЕП (Evrotrust)</div>
            <div class="job-pkg-price">€29</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Пълна регистрация</li>
              <li><i class="fa-solid fa-check"></i> Видео верификация</li>
              <li><i class="fa-solid fa-check"></i> Тест подпис</li>
            </ul>
          </button>
          <button type="button" class="job-pkg-card" data-pkg="kep-plus">
            <div class="job-pkg-badge job-pkg-badge-gold">КЕП + Услуга</div>
            <div class="job-pkg-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
            <div class="job-pkg-name">КЕП + помощ с 1 е-услуга</div>
            <div class="job-pkg-price">€49</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Всичко от "Нов КЕП"</li>
              <li><i class="fa-solid fa-check"></i> 1 е-услуга вместо вас</li>
              <li><i class="fa-solid fa-check"></i> НАП, НЗОК, e-gov.bg</li>
            </ul>
          </button>
        </div>

        <div class="wizard-form-row">
          <div class="form-group">
            <label for="s2KepPhone">Смартфон (iOS / Android)?</label>
            <div class="input-wrap select-wrap"><i class="fa-solid fa-mobile-screen"></i>
              <select id="s2KepPhone">
                <option value="Android">Android</option>
                <option value="iPhone (iOS)">iPhone (iOS)</option>
              </select>
              <i class="fa-solid fa-chevron-down select-arrow"></i>
            </div>
          </div>
          <div class="form-group">
            <label for="s2KepDoc">Имате ли валидна лична карта или паспорт?</label>
            <div class="input-wrap select-wrap"><i class="fa-solid fa-id-card"></i>
              <select id="s2KepDoc">
                <option value="Да — лична карта">Да — лична карта</option>
                <option value="Да — паспорт">Да — паспорт</option>
                <option value="Нито едното">Нито едното</option>
              </select>
              <i class="fa-solid fa-chevron-down select-arrow"></i>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label for="s2KepPurpose">За какво ще ползвате КЕП? (по избор)</label>
          <div class="input-wrap textarea-wrap"><i class="fa-solid fa-comment-dots"></i>
            <textarea id="s2KepPurpose" rows="3" placeholder="Напр. е-правителство, НАП, подписване на документи..."></textarea>
          </div>
        </div>
      </div>`;

    case 'е-Услуги от България':
      return `<div class="wizard-step-card">
        <h3 class="wizard-panel-title">е-Услуги от България</h3>
        <p class="wizard-panel-subtitle">Изберете пакет — заявяваме вместо вас от разстояние</p>

        <input type="hidden" id="s2SelectedPkg" value="Единична услуга — €39" />
        <div class="job-pkg-grid">
          <button type="button" class="job-pkg-card active" data-pkg="eserv-single">
            <div class="job-pkg-icon"><i class="fa-solid fa-file-circle-check"></i></div>
            <div class="job-pkg-name">Единична услуга</div>
            <div class="job-pkg-price">€39</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> 1 услуга от НАП / НЗОК / ГРАО</li>
              <li><i class="fa-solid fa-check"></i> Изпращане по имейл</li>
            </ul>
          </button>
          <button type="button" class="job-pkg-card" data-pkg="eserv-pack">
            <div class="job-pkg-badge">Популярно</div>
            <div class="job-pkg-icon"><i class="fa-solid fa-layer-group"></i></div>
            <div class="job-pkg-name">Пакет 3 услуги</div>
            <div class="job-pkg-price">€89</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> До 3 услуги наведнъж</li>
              <li><i class="fa-solid fa-check"></i> Приоритетна обработка</li>
              <li><i class="fa-solid fa-check"></i> Спестяваш €28</li>
            </ul>
          </button>
          <button type="button" class="job-pkg-card" data-pkg="eserv-courier">
            <div class="job-pkg-badge job-pkg-badge-gold">+ Куриер</div>
            <div class="job-pkg-icon"><i class="fa-solid fa-truck-fast"></i></div>
            <div class="job-pkg-name">С куриерска доставка</div>
            <div class="job-pkg-price">+€25</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Добавка към всеки пакет</li>
              <li><i class="fa-solid fa-check"></i> Оригинал по куриер до ЕС</li>
            </ul>
          </button>
        </div>

        <div class="form-group">
          <label>Каква услуга ви трябва?</label>
          <div class="glass-checkboxes">
            ${['Удостоверение от НАП (данъчна оценка)','Удостоверение за липса на задължения (НАП)','Справка от НЗОК (здравно осигуряване)','Услуга от ГРАО (акт за раждане, граждански статус)','Подаване на документи в МВР (паспорт/лична карта)','Услуга от портала e-gov.bg','Куриерска доставка до Германия','Друга услуга']
              .map(s => `<label class="glass-checkbox-item"><input type="checkbox" name="s2eservice" value="${s}" /><span>${s}</span></label>`)
              .join('')}
          </div>
        </div>
        <div class="form-group" style="margin-top:16px">
          <label for="s2EservNote">Опишете нуждата си по-подробно (по избор)</label>
          <div class="input-wrap textarea-wrap"><i class="fa-solid fa-comment-dots"></i>
            <textarea id="s2EservNote" rows="3" placeholder="Напр. нужен ми е нотариално заверен документ от..."></textarea>
          </div>
        </div>
      </div>`;

    case 'Търсене на жилище':
      return `<div class="wizard-step-card">
        <h3 class="wizard-panel-title">Търсене на жилище</h3>
        <p class="wizard-panel-subtitle">Изберете пакет — помагаме от търсенето до нанасянето</p>

        <input type="hidden" id="s2SelectedPkg" value="Консултация + Насоки — €39" />
        <div class="job-pkg-grid">
          <button type="button" class="job-pkg-card active" data-pkg="advice">
            <div class="job-pkg-icon"><i class="fa-solid fa-lightbulb"></i></div>
            <div class="job-pkg-name">Консултация + Насоки</div>
            <div class="job-pkg-price">€39</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Кои сайтове да ползвате</li>
              <li><i class="fa-solid fa-check"></i> Как да напишете запитване</li>
              <li><i class="fa-solid fa-check"></i> Съвети за SCHUFA и документи</li>
            </ul>
          </button>
          <button type="button" class="job-pkg-card" data-pkg="search">
            <div class="job-pkg-badge">Популярно</div>
            <div class="job-pkg-icon"><i class="fa-solid fa-magnifying-glass-location"></i></div>
            <div class="job-pkg-name">Търсим вместо вас</div>
            <div class="job-pkg-price">€69</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Активно търсене в реално време</li>
              <li><i class="fa-solid fa-check"></i> Писане на запитвания на немски</li>
              <li><i class="fa-solid fa-check"></i> До 10 обяви седмично</li>
            </ul>
          </button>
          <button type="button" class="job-pkg-card" data-pkg="full-housing">
            <div class="job-pkg-badge job-pkg-badge-gold">Пълен пакет</div>
            <div class="job-pkg-icon"><i class="fa-solid fa-key"></i></div>
            <div class="job-pkg-name">Търсене + Договор + Нанасяне</div>
            <div class="job-pkg-price">€119</div>
            <ul class="job-pkg-features">
              <li><i class="fa-solid fa-check"></i> Всичко от "Търсим вместо вас"</li>
              <li><i class="fa-solid fa-check"></i> Проверка на договора за наем</li>
              <li><i class="fa-solid fa-check"></i> Помощ с Anmeldung след нанасяне</li>
            </ul>
          </button>
        </div>

        ${countryDropdown('s2Country', 'В коя държава търсите жилище?')}
        <div class="wizard-form-row">
          <div class="form-group">
            <label for="s2HousingCity">Град / Регион <span class="required">*</span></label>
            <div class="input-wrap"><i class="fa-solid fa-location-dot"></i>
              <input type="text" id="s2HousingCity" placeholder="напр. Берлин, Мюнхен, Виена..." />
            </div>
          </div>
          <div class="form-group">
            <label for="s2HousingBudget">Месечен бюджет за наем</label>
            <div class="input-wrap select-wrap"><i class="fa-solid fa-euro-sign"></i>
              <select id="s2HousingBudget">
                <option value="">— Избери —</option>
                <option>до €400</option>
                <option>€400 — €600</option>
                <option>€600 — €800</option>
                <option>€800 — €1 000</option>
                <option>€1 000 — €1 500</option>
                <option>над €1 500</option>
              </select>
              <i class="fa-solid fa-chevron-down select-arrow"></i>
            </div>
          </div>
        </div>
        <div class="wizard-form-row">
          <div class="form-group">
            <label for="s2HousingType">Тип жилище</label>
            <div class="input-wrap select-wrap"><i class="fa-solid fa-house"></i>
              <select id="s2HousingType">
                <option value="">— Избери —</option>
                <option>Стая (WG / Zimmer)</option>
                <option>1-стаен апартамент</option>
                <option>2-стаен апартамент</option>
                <option>3+ стаен апартамент</option>
                <option>Къща</option>
              </select>
              <i class="fa-solid fa-chevron-down select-arrow"></i>
            </div>
          </div>
          <div class="form-group">
            <label for="s2HousingWhen">Кога искате да се нанесете?</label>
            <div class="input-wrap select-wrap"><i class="fa-solid fa-calendar"></i>
              <select id="s2HousingWhen">
                <option value="">— Избери —</option>
                <option>Веднага</option>
                <option>До 1 месец</option>
                <option>До 3 месеца</option>
                <option>Не бързам</option>
              </select>
              <i class="fa-solid fa-chevron-down select-arrow"></i>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label for="s2HousingNote">Допълнителни изисквания (по избор)</label>
          <div class="input-wrap textarea-wrap"><i class="fa-solid fa-comment-dots"></i>
            <textarea id="s2HousingNote" rows="3" placeholder="напр. Близо до метро, позволени домашни любимци, с балкон..."></textarea>
          </div>
        </div>
      </div>`;

    default: // Друго
      return `<div class="wizard-step-card">
        <h3 class="wizard-panel-title">Разкажете ни повече</h3>
        <p class="wizard-panel-subtitle">Опишете от какво имате нужда</p>
        <div class="form-group">
          <label for="s2OtherDesc">Опишете от какво имате нужда</label>
          <div class="input-wrap textarea-wrap">
            <i class="fa-solid fa-comment-dots"></i>
            <textarea id="s2OtherDesc" rows="5" placeholder="Разкажете ни вашата ситуация..."></textarea>
          </div>
        </div>
        ${countryDropdown('s2Country', 'В коя държава сте?')}
      </div>`;
  }
}

/* ---- WIZARD STATE ---- */
var wizardStep = 1;
var wizardService = '';
var wizardPackage = '';
var wizardContactMethod = 'WhatsApp';
var wizardStep2Data = {};

/* ---- PRICE TABLE ---- */
var _basePrices = {
  'Търся работа':             { price: 29,  display: 'от €29',  period: '', noExpress: false },
  'Помощ с институция':       { price: 39,  display: 'от €39',  period: '', noExpress: false },
  'Тъкмо пристигнах':         { price: 49,  display: 'от €49',  period: '', noExpress: false },
  'Документ или превод':      { price: 29,  display: 'от €29',  period: '', noExpress: false },
  'Онлайн курс / Сертификат': { price: 29,  display: 'от €29',  period: '', noExpress: false },
  'Пълно обслужване А до Я':  { price: 99, display: 'от €99', period: '', noExpress: false },
  'VIP Абонамент':            { price: 149, display: '€149',    period: '/мес', noExpress: true },
  'Данъчна декларация':       { price: 49,  display: 'от €49',  period: '', noExpress: false },
  'КЕП онлайн подпис':        { price: 19,  display: 'от €19',  period: '', noExpress: false },
  'е-Услуги от България':     { price: 39,  display: 'от €39',  period: '', noExpress: false },
  'Търсене на жилище':        { price: 39,  display: 'от €39',  period: '', noExpress: false }
};

function updatePriceIndicator(service, isExpress) {
  var el       = document.getElementById('priceIndicator');
  var piSvc    = document.getElementById('piService');
  var piPrice  = document.getElementById('piPrice');
  if (!el || !piSvc || !piPrice) return;

  var info = _basePrices[service];
  if (!info) { el.classList.remove('visible'); return; }

  piSvc.textContent = service;
  if (isExpress && !info.noExpress) {
    var exp = Math.round(info.price * 1.5);
    var fromPfx = info.display.indexOf('от') === 0 ? 'от ' : '';
    piPrice.textContent = fromPfx + '€' + exp + info.period + ' ⚡';
    el.classList.add('express');
  } else {
    piPrice.textContent = info.display + info.period;
    el.classList.remove('express');
  }
  el.classList.add('visible');
}

function wizardUpdateProgress(step) {
  document.querySelectorAll('.wizard-step-indicator').forEach((ind, i) => {
    const n = i + 1;
    ind.classList.remove('active', 'completed');
    const circle = ind.querySelector('.wsi-circle span');
    if (n < step) {
      ind.classList.add('completed');
      if (circle) circle.innerHTML = '<i class="fa-solid fa-check" style="font-size:11px"></i>';
    } else if (n === step) {
      ind.classList.add('active');
      if (circle) circle.textContent = n;
    } else {
      if (circle) circle.textContent = n;
    }
  });
  [1, 2, 3].forEach(i => {
    const line = document.getElementById('wsiLine' + i);
    if (line) line.classList.toggle('completed', i < step);
  });
}

function wizardShowPanel(step, direction) {
  document.querySelectorAll('.wizard-panel').forEach(p => {
    p.classList.remove('active');
    p.style.animation = '';
  });
  const panel = document.getElementById('wizardPanel' + step);
  if (panel) {
    panel.classList.add('active');
    void panel.offsetHeight;
    panel.style.animation = (direction === 'back')
      ? 'slideInBack 0.35s cubic-bezier(0.4,0,0.2,1)'
      : 'slideIn 0.35s cubic-bezier(0.4,0,0.2,1)';
  }
  const backBtn = document.getElementById('wizardBackBtn');
  const nextBtn = document.getElementById('wizardNextBtn');
  if (backBtn) backBtn.style.visibility = step > 1 ? 'visible' : 'hidden';
  if (nextBtn) {
    if (step === 4) {
      nextBtn.style.display = 'none';
    } else {
      nextBtn.style.display = '';
      nextBtn.innerHTML = step === 3
        ? 'Преглед <i class="fa-solid fa-eye"></i>'
        : 'Напред <i class="fa-solid fa-arrow-right"></i>';
    }
  }
}

function goToStep(step, direction) {
  wizardStep = step;
  wizardShowPanel(step, direction || 'forward');
  wizardUpdateProgress(step);
  const contact = document.getElementById('contact');
  if (contact) {
    window.scrollTo({ top: contact.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
  }
}

function initUploadZone(inputId, previewId, isImage) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const zone = input.closest('.upload-zone');
  const preview = document.getElementById(previewId);
  if (!zone) return;
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    if (preview) showFilePreviews(e.dataTransfer.files, preview, isImage);
  });
  input.addEventListener('change', () => {
    if (preview) showFilePreviews(input.files, preview, isImage);
  });
}

function showFilePreviews(files, preview, isImage) {
  preview.innerHTML = '';
  Array.from(files).forEach(file => {
    if (isImage && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        const wrap = document.createElement('div');
        wrap.className = 'image-preview-wrap';
        const img = document.createElement('img');
        img.src = e.target.result;
        wrap.appendChild(img);
        preview.appendChild(wrap);
      };
      reader.readAsDataURL(file);
    } else {
      const item = document.createElement('div');
      item.className = 'upload-preview-item';
      item.innerHTML = '<i class="fa-solid fa-file-check"></i> ' + file.name;
      preview.appendChild(item);
    }
  });
}

function initStep2Interactions() {
  // Universal package tracker — update hidden input when any package card is clicked
  var allPkgCards = document.querySelectorAll('.job-pkg-card');
  var pkgHidden = document.getElementById('s2SelectedPkg');
  if (allPkgCards.length && pkgHidden) {
    allPkgCards.forEach(function(card) {
      card.addEventListener('click', function() {
        var nameEl = card.querySelector('.job-pkg-name');
        var priceEl = card.querySelector('.job-pkg-price');
        if (nameEl && priceEl) {
          pkgHidden.value = nameEl.textContent.trim() + ' — ' + priceEl.textContent.trim();
        }
      });
    });
  }

  // Job package selector
  var jobPkgCards    = document.querySelectorAll('.job-pkg-card');
  var jobLetterSec   = document.getElementById('jobLetterSection');
  var jobApplySec    = document.getElementById('jobApplySection');
  if (jobPkgCards.length) {
    function applyJobPkg(pkg) {
      if (jobLetterSec) jobLetterSec.style.display = (pkg === 'cv-letter' || pkg === 'full') ? '' : 'none';
      if (jobApplySec)  jobApplySec.style.display  = (pkg === 'full') ? '' : 'none';
    }
    jobPkgCards.forEach(function(card) {
      card.addEventListener('click', function() {
        jobPkgCards.forEach(function(c) { c.classList.remove('active'); });
        card.classList.add('active');
        applyJobPkg(card.dataset.pkg);
      });
    });
    applyJobPkg('cv'); // default
  }

  // CV Path switcher (Нямам CV / Имам CV)
  var cvPathBtns   = document.querySelectorAll('.cv-path-btn');
  var cvPathBuild  = document.getElementById('cvPathBuild');
  var cvPathUpload = document.getElementById('cvPathUpload');
  if (cvPathBtns.length && cvPathBuild && cvPathUpload) {
    cvPathBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        cvPathBtns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var path = btn.dataset.path;
        cvPathBuild.style.display  = (path === 'build')  ? '' : 'none';
        cvPathUpload.style.display = (path === 'upload') ? '' : 'none';
      });
    });
  }

  // License toggle
  var licCb = document.getElementById('t_license');
  var licRev = document.getElementById('tr_license');
  if (licCb && licRev) {
    var licText = licCb.parentElement && licCb.parentElement.querySelector('.toggle-text');
    licCb.addEventListener('change', function() {
      licRev.classList.toggle('visible', licCb.checked);
      if (licText) licText.textContent = licCb.checked ? 'Да' : 'Не';
    });
  }

  // "В момента работя там" → disable cvJobTo
  var currentJobCb = document.getElementById('cvJobCurrent');
  var jobToInput   = document.getElementById('cvJobTo');
  if (currentJobCb && jobToInput) {
    currentJobCb.addEventListener('change', function() {
      jobToInput.disabled = currentJobCb.checked;
      var wrap = jobToInput.closest('.input-wrap');
      if (wrap) wrap.style.opacity = currentJobCb.checked ? '0.35' : '';
      if (currentJobCb.checked) jobToInput.value = '';
    });
  }

  // Upload zones
  initUploadZone('f_cv',     'fp_cv',     false);
  initUploadZone('f_photo',  'fp_photo',  true);
  initUploadZone('f_photo2', 'fp_photo2', true);
  initUploadZone('f_inst',   'fp_inst',   false);
  initUploadZone('f_doc',    'fp_doc',    false);

  // Express toggle → update price indicator
  var expressToggle = document.getElementById('t_express');
  if (expressToggle) {
    expressToggle.addEventListener('change', function() {
      updatePriceIndicator(wizardService, this.checked);
    });
  }

  // Document package selector → update price indicator
  var docPkgGrid = document.getElementById('docPkgGrid');
  if (docPkgGrid) {
    var docPkgCards = docPkgGrid.querySelectorAll('.job-pkg-card');
    var _docPkgPrices = {
      'translate1': { price: 29, display: '€29', name: 'Превод до 1 стр.' },
      'form':       { price: 39, display: '€39', name: 'Официален формуляр' },
      'translate5': { price: 49, display: '€49', name: 'Превод до 5 стр.' },
      'power':      { price: 35, display: '€35', name: 'Пълномощно / Декларация' }
    };
    function updateDocPrice(pkg) {
      var info = _docPkgPrices[pkg];
      if (!info) return;
      var el      = document.getElementById('priceIndicator');
      var piSvc   = document.getElementById('piService');
      var piPrice = document.getElementById('piPrice');
      if (!el || !piSvc || !piPrice) return;
      piSvc.textContent = info.name;
      var isExpress = expressToggle && expressToggle.checked;
      if (isExpress) {
        piPrice.textContent = '€' + Math.round(info.price * 1.5) + ' ⚡';
        el.classList.add('express');
      } else {
        piPrice.textContent = info.display;
        el.classList.remove('express');
      }
      el.classList.add('visible');
    }
    docPkgCards.forEach(function(card) {
      card.addEventListener('click', function() {
        docPkgCards.forEach(function(c) { c.classList.remove('active'); });
        card.classList.add('active');
        updateDocPrice(card.dataset.pkg);
        var info = _docPkgPrices[card.dataset.pkg];
        var hidden = document.getElementById('s2DocPkg');
        if (hidden && info) hidden.value = info.name + ' — ' + info.display;
      });
    });
    // Set initial price from default active card
    updateDocPrice('translate1');

    // Also update doc price when express toggle changes
    if (expressToggle) {
      expressToggle.addEventListener('change', function() {
        var activeCard = docPkgGrid.querySelector('.job-pkg-card.active');
        if (activeCard) updateDocPrice(activeCard.dataset.pkg);
      });
    }
  }

  // Dynamic country change — update institution checkboxes, newcomer needs, CV language
  var s2CountryEl = document.getElementById('s2Country');
  if (s2CountryEl && typeof getCountryData !== 'undefined') {
    s2CountryEl.addEventListener('change', function () {
      var country = this.value || 'Германия';
      var d = getCountryData(country);

      // Institutions list
      var instList = document.getElementById('s2InstitutionList');
      if (instList) {
        instList.innerHTML = d.institutions
          .map(function(i) { return '<label class="glass-checkbox-item"><input type="checkbox" name="s2institution" value="' + i + '" /><span>' + i + '</span></label>'; })
          .join('');
      }

      // Newcomer needs list
      var newList = document.getElementById('s2NewcomerNeedsList');
      if (newList) {
        newList.innerHTML = d.newcomerNeeds
          .map(function(i) { return '<label class="glass-checkbox-item"><input type="checkbox" name="s2needs" value="' + i + '" /><span>' + i + '</span></label>'; })
          .join('');
      }

      // CV language auto-suggest based on country
      var langMap = {
        'Германия': 'Немски', 'Австрия': 'Немски', 'Швейцария': 'Немски',
        'Франция': 'Френски', 'Испания': 'Испански', 'Италия': 'Италиански',
        'Великобритания': 'Английски', 'Ирландия': 'Английски',
        'Нидерландия': 'Английски', 'Белгия': 'Немски',
        'Дания': 'Английски', 'Швеция': 'Английски', 'Норвегия': 'Английски',
        'България': 'Български'
      };
      var s2LangEl = document.getElementById('s2Lang');
      if (s2LangEl && langMap[country]) {
        s2LangEl.value = langMap[country];
      }

      // Course goal — replace bureau name dynamically
      var goalEl = document.getElementById('s2CourseGoal');
      if (goalEl && d.bureauName) {
        var bureauOpt = goalEl.querySelector('option[data-bureau]');
        if (bureauOpt) bureauOpt.textContent = 'Квалификация за ' + d.bureauName;
      }
    });
  }
}

function collectStep2Data() {
  const data = {};
  const panel = document.getElementById('wizardPanel2');
  if (!panel) return data;
  const skipIds = ['t_license', 'cvJobCurrent', 't_express'];
  panel.querySelectorAll('input, select, textarea').forEach(el => {
    if (el.type === 'file') return;
    if (skipIds.indexOf(el.id) !== -1) return;
    // Skip inputs inside a hidden CV path div
    const pathParent = el.closest('#cvPathBuild, #cvPathUpload');
    if (pathParent && pathParent.style.display === 'none') return;
    // Skip inputs inside collapsed toggle-reveal
    const tr = el.closest('.toggle-reveal');
    if (tr && !tr.classList.contains('visible')) return;
    if (el.type === 'checkbox') {
      if (el.name && el.checked) {
        data[el.name] = data[el.name] ? data[el.name] + ', ' + el.value : el.value;
      }
    } else {
      const key = el.id || el.name;
      if (!key) return;
      const val = el.value.trim();
      if (val) data[key] = val;
    }
  });
  const express = panel.querySelector('#t_express');
  if (express && express.checked) data.express = 'Да (+50%)';
  return data;
}

const STEP2_LABELS = {
  s2SelectedPkg:  '💰 Избран пакет',
  s2Country:      '🌍 Държава',
  s2Position:     '💼 Позиция',
  s2Lang:         '🗣️ Език на CV',
  s2JobUrl:       '🔗 Линк обява',
  s2InstProblem:  '📝 Проблем',
  s2Deadline:     '⏰ Краен срок',
  s2DocDeadline:  '⏰ Краен срок',
  s2DocPkg:       '💰 Пакет документ',
  s2DocPages:     '📄 Брой страници',
  s2DocType:      '📄 Тип документ',
  s2LangFrom:     '🌐 От език',
  s2LangTo:       '🌐 На език',
  s2WhenArrived:  '📅 Пристигане',
  s2Language:     '🗣️ Ниво на език',
  s2CourseName:   '📚 Курс/Сертификат',
  s2CourseGoal:   '🎯 Цел',
  s2Education:    '🎓 Образование',
  s2FullDesc:     '📝 Описание',
  s2OtherDesc:    '📝 Описание',
  s2VipDocs:      '📊 Документи/мес',
  s2VipDesc:      '📝 VIP описание',
  s2institution:  '🏛️ Институции',
  s2needs:        '📋 Нужди',
  s2sphere:       '🔭 Сфера',
  s2fullservice:  '🛎️ Услуги',
  s2vipservices:  '👑 VIP услуги',
  s2HousingCity:  '📍 Град / Регион',
  s2HousingBudget:'💶 Бюджет за наем',
  s2HousingType:  '🏠 Тип жилище',
  s2HousingWhen:  '📅 Кога',
  s2HousingNote:  '📝 Допълнително',
  s2TaxYear:      '📅 Данъчна година',
  s2TaxCountry:   '🌍 Държава (работа)',
  s2TaxStatus:    '💑 Семеен статус',
  s2TaxDoc:       '📄 Lohnsteuerbescheinigung',
  s2TaxNote:      '📝 Допълнително',
  s2KepPhone:     '📱 Смартфон',
  s2KepDoc:       '🪪 Документ за самоличност',
  s2KepPurpose:   '🎯 Цел на КЕП',
  s2eservice:     '📋 Е-услуги',
  s2EservNote:    '📝 Допълнително',
  express:        '⚡ Спешна поръчка',
  // CV builder fields
  cvFirstName:    '👤 Собствено Иme',
  cvLastName:     '👤 Фамилия',
  cvBirthDate:    '🎂 Дата на раждане',
  cvNationality:  '🌍 Националност',
  cvCity:         '📍 Град',
  cvMarital:      '💑 Семейно положение',
  cvEduLevel:     '🎓 Ниво образование',
  cvEduYear:      '📅 Год. завършване',
  cvEduSchool:    '🏫 Учебно заведение',
  cvEduField:     '📚 Специалност',
  cvJobCompany:   '🏢 Компания',
  cvJobTitle:     '👔 Длъжност',
  cvJobFrom:      '📅 Работа от',
  cvJobTo:        '📅 Работа до',
  cvJobDesc:      '📋 Задължения',
  cvLang1:        '🗣️ Роден език',
  cvLang2:        '🗣️ Чужд език 1',
  cvLang3:        '🗣️ Чужд език 2',
  cvComputer:     '💻 Компютърни умения',
  cvLicense:      '🚗 Шофьорска книжка — категории',
  cvOtherSkills:    '⭐ Допълнителни умения',
  cvLetterWhy:      '✍️ Защо тази работа',
  cvLetterStrength: '🏆 Предимство',
  cvApplyCount:     '📋 Брой обяви',
  cvApplyDeadline:  '📅 Желан старт',
  cvApplyNotes:     '📝 Изисквания',
};

function buildSummaryHTML(step2Data) {
  const name    = (document.getElementById('wName')    || {}).value || '';
  const phone   = (document.getElementById('wPhone')   || {}).value || '';
  const email   = (document.getElementById('wEmail')   || {}).value || '';
  const pkg     = (document.getElementById('wPackage') || {}).value || '';
  const message = (document.getElementById('wMessage') || {}).value || '';

  // Collect all uploaded files across all upload inputs
  var uploadedFiles = [];
  var photoSrc = '';
  ['f_photo','f_photo2','f_cv','f_inst','f_doc'].forEach(function(id) {
    var inp = document.getElementById(id);
    if (inp && inp.files && inp.files.length > 0) {
      Array.from(inp.files).forEach(function(f) { uploadedFiles.push(f.name); });
      // grab photo preview src
      if ((id === 'f_photo' || id === 'f_photo2') && !photoSrc) {
        var previewId = (id === 'f_photo') ? 'fp_photo' : 'fp_photo2';
        var prev = document.getElementById(previewId);
        var img  = prev && prev.querySelector('img');
        if (img) photoSrc = img.src;
      }
    }
  });
  var hasFiles = uploadedFiles.length > 0;

  var photoReminderHTML = hasFiles
    ? '<div class="files-info-box">'
      + (photoSrc ? '<img src="' + photoSrc + '" class="photo-reminder-thumb" alt="Снимка" />' : '')
      + '<div class="photo-reminder-info">'
      + '<div class="files-info-title"><i class="fa-solid fa-envelope-circle-check"></i> Файловете се изпращат по имейл</div>'
      + '<p>Качените файлове ще бъдат прикачени автоматично към имейла.<br>'
      + 'Използвайте бутона <strong>"Изпрати по имейл"</strong> по-долу.</p>'
      + '<ul class="photo-reminder-files">' + uploadedFiles.map(function(n){ return '<li><i class="fa-solid fa-file"></i> ' + n + '</li>'; }).join('') + '</ul>'
      + '</div></div>'
    : '';

  const step2Rows = Object.keys(step2Data).map(k => {
    const label = STEP2_LABELS[k] || k;
    return '<div class="summary-row"><span class="summary-row-label">' + label + ':</span>'
      + '<span class="summary-row-value">' + step2Data[k] + '</span></div>';
  }).join('');

  return '<div class="wizard-summary">'
    + '<div class="summary-title"><i class="fa-solid fa-clipboard-check"></i> Преглед на заявката</div>'
    + photoReminderHTML
    + '<div class="summary-section">'
    + '<div class="summary-section-header">'
    + '<span class="summary-section-title"><i class="fa-solid fa-concierge-bell"></i> Услуга</span>'
    + '<button class="summary-edit-btn" onclick="goToStep(1,\'back\')"><i class="fa-solid fa-pen"></i> Промени</button>'
    + '</div>'
    + '<div class="summary-row"><span class="summary-row-label">📌 Тип:</span><span class="summary-row-value">' + wizardService + '</span></div>'
    + (pkg ? '<div class="summary-row"><span class="summary-row-label">💰 Пакет:</span><span class="summary-row-value">' + pkg + '</span></div>' : '')
    + '</div>'
    + (step2Rows ? '<div class="summary-section">'
      + '<div class="summary-section-header">'
      + '<span class="summary-section-title"><i class="fa-solid fa-list-check"></i> Детайли</span>'
      + '<button class="summary-edit-btn" onclick="goToStep(2,\'back\')"><i class="fa-solid fa-pen"></i> Промени</button>'
      + '</div>' + step2Rows + '</div>' : '')
    + '<div class="summary-section">'
    + '<div class="summary-section-header">'
    + '<span class="summary-section-title"><i class="fa-solid fa-user"></i> Вашите данни</span>'
    + '<button class="summary-edit-btn" onclick="goToStep(3,\'back\')"><i class="fa-solid fa-pen"></i> Промени</button>'
    + '</div>'
    + '<div class="summary-row"><span class="summary-row-label">👤 Име:</span><span class="summary-row-value">' + name.trim() + '</span></div>'
    + '<div class="summary-row"><span class="summary-row-label">📱 Телефон:</span><span class="summary-row-value">' + phone.trim() + '</span></div>'
    + (email.trim() ? '<div class="summary-row"><span class="summary-row-label">📧 Имейл:</span><span class="summary-row-value">' + email.trim() + '</span></div>' : '')
    + '<div class="summary-row"><span class="summary-row-label">💬 Контакт:</span><span class="summary-row-value">' + wizardContactMethod + '</span></div>'
    + (message.trim() ? '<div class="summary-row"><span class="summary-row-label">📝 Съобщение:</span><span class="summary-row-value">' + message.trim() + '</span></div>' : '')
    + '</div>'
    + '<div class="send-method-info">'
    + '<div class="send-method-row"><i class="fa-brands fa-whatsapp" style="color:#25D366"></i> <strong>WhatsApp</strong> — бърза връзка, само текст</div>'
    + '<div class="send-method-row"><i class="fa-solid fa-envelope" style="color:#d4a843"></i> <strong>Имейл</strong> — текст + всички качени файлове и снимки</div>'
    + '</div>'
    + '<div class="wizard-send-buttons">'
    + '<button class="btn btn-whatsapp btn-lg" id="sendWaBtn"><i class="fa-brands fa-whatsapp"></i> Изпрати в WhatsApp</button>'
    + '<button class="btn btn-primary btn-lg" id="sendEmailBtn"><i class="fa-solid fa-envelope"></i> Изпрати по имейл' + (hasFiles ? ' + файлове' : '') + '</button>'
    + '</div>'
    + (hasFiles ? '<div class="files-send-info"><i class="fa-solid fa-circle-info"></i> Имате качени файлове (' + uploadedFiles.length + ' бр.) — използвайте бутона <strong>"Изпрати по имейл"</strong> за да ги получиш с прикачени.</div>' : '')
    + '<p class="privacy-note"><i class="fa-solid fa-lock"></i> Данните ви са защитени. Използваме ги само за вашата заявка.</p>'
    + '</div>';
}

function buildWaMessage(step2Data) {
  const name    = ((document.getElementById('wName')    || {}).value || '').trim();
  const phone   = ((document.getElementById('wPhone')   || {}).value || '').trim();
  const email   = ((document.getElementById('wEmail')   || {}).value || '').trim();
  const pkg     = ((document.getElementById('wPackage') || {}).value || '').trim();
  const message = ((document.getElementById('wMessage') || {}).value || '').trim();

  const lines = ['📋 НОВА ЗАЯВКА — bgpomosht.eu', '', '📌 Услуга: ' + wizardService];
  if (pkg) lines.push('💰 Пакет: ' + pkg);
  lines.push('');
  Object.keys(step2Data).forEach(k => {
    lines.push((STEP2_LABELS[k] || k) + ': ' + step2Data[k]);
  });
  lines.push('', '👤 Име: ' + name, '📱 Телефон: ' + phone);
  if (email) lines.push('📧 Имейл: ' + email);
  lines.push('💬 Предпочитан контакт: ' + wizardContactMethod);
  if (message) lines.push('📝 Съобщение: ' + message);
  return lines.join('\n');
}

/* ---- SUBMIT FORM WITH FILES via backend ---- */
function submitFormWithFiles(step2Data, btn) {
  var name    = ((document.getElementById('wName')    || {}).value || '').trim();
  var phone   = ((document.getElementById('wPhone')   || {}).value || '').trim();
  var email   = ((document.getElementById('wEmail')   || {}).value || '').trim();
  var pkg     = ((document.getElementById('wPackage') || {}).value || '').trim();
  var message = ((document.getElementById('wMessage') || {}).value || '').trim();

  var formData = new FormData();

  // Текстови данни
  formData.append('wizardService', wizardService);
  if (pkg)     formData.append('Пакет', pkg);
  formData.append('Контакт', wizardContactMethod);
  formData.append('Име', name);
  formData.append('Телефон', phone);
  if (email)   formData.append('Имейл', email);
  if (message) formData.append('Съобщение', message);

  // Step2 данни
  Object.keys(step2Data).forEach(function(k) {
    formData.append(k, step2Data[k]);
  });

  // Файлове
  var fileInputIds = ['f_photo', 'f_photo2', 'f_cv', 'f_inst', 'f_doc'];
  fileInputIds.forEach(function(id) {
    var inp = document.getElementById(id);
    if (inp && inp.files && inp.files.length > 0) {
      Array.from(inp.files).forEach(function(f) {
        formData.append(id, f, f.name);
      });
    }
  });

  // UI — зареждане
  var origHTML = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Изпраща се...';
  btn.disabled = true;

  fetch('/api/submit', {
    method: 'POST',
    body: formData
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.ok) {
      // GA4 custom event
      if (typeof gtag === 'function') { gtag('event', 'form_submit', { event_category: 'conversion', event_label: wizardService }); }
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Изпратено!';
      btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      btn.style.borderColor = '#10b981';
      // Показваме съобщение за успех
      var note = document.querySelector('.photo-send-note');
      if (note) {
        note.style.background = 'rgba(16,185,129,0.1)';
        note.style.borderColor = 'rgba(16,185,129,0.4)';
        note.style.color = '#10b981';
        note.innerHTML = '<i class="fa-solid fa-check-circle"></i> Заявката и всички файлове са изпратени успешно на имейла!';
      } else {
        // Добавяме ново съобщение
        var msg = document.createElement('div');
        msg.className = 'photo-send-note';
        msg.style.cssText = 'background:rgba(16,185,129,0.1);border-color:rgba(16,185,129,0.4);color:#10b981;margin-top:12px;';
        msg.innerHTML = '<i class="fa-solid fa-check-circle"></i> Заявката и всички файлове са изпратени успешно!';
        btn.closest('.wizard-send-buttons') && btn.closest('.wizard-send-buttons').insertAdjacentElement('afterend', msg);
      }
    } else {
      btn.innerHTML = '<i class="fa-solid fa-xmark"></i> Грешка — опитайте отново';
      btn.style.background = 'rgba(239,68,68,0.15)';
      btn.style.borderColor = 'rgba(239,68,68,0.5)';
      btn.disabled = false;
      setTimeout(function() {
        btn.innerHTML = origHTML;
        btn.style.background = '';
        btn.style.borderColor = '';
      }, 4000);
      console.error('Submit error:', data.message);
    }
  })
  .catch(function(err) {
    // Fallback — отваря mailto ако сървърът не е достъпен
    var msg = buildWaMessage(step2Data);
    var subj = 'Нова заявка — ' + wizardService;
    window.open('mailto:simeonv38@gmail.com?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(msg));
    btn.innerHTML = origHTML;
    btn.disabled = false;
  });
}

/* ---- WIZARD INIT ---- */
(function initWizard() {
  var panel1 = document.getElementById('wizardPanel1');
  if (!panel1) return;

  // Auto-select service from URL ?service= parameter
  var _serviceMap = {
    'job':         'Търся работа',
    'institution': 'Помощ с институция',
    'newcomer':    'Тъкмо пристигнах',
    'documents':   'Документ или превод',
    'courses':     'Онлайн курс / Сертификат',
    'full':        'Пълно обслужване А до Я',
    'vip':         'VIP Абонамент',
    'taxes':       'Данъчна декларация',
    'kep':         'КЕП онлайн подпис',
    'eservices':   'е-Услуги от България',
    'housing':     'Търсене на жилище'
  };
  var _urlParam = new URLSearchParams(window.location.search).get('service');
  var _preselect = _urlParam ? _serviceMap[_urlParam] : null;

  // Service card click
  panel1.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', () => {
      panel1.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      wizardService = card.dataset.value;
      wizardPackage = card.dataset.package || '';
      updatePriceIndicator(wizardService, false);
    });
  });

  // Auto-click pre-selected service from URL param + auto-advance to step 2
  if (_preselect) {
    var targetCard = Array.from(panel1.querySelectorAll('.service-card'))
      .find(c => c.dataset.value === _preselect);
    if (targetCard) {
      targetCard.click();
      // Auto-advance to step 2
      setTimeout(function () {
        var container = document.getElementById('dynamicStep2Content');
        if (container && wizardService) {
          container.innerHTML = buildStep2HTML(wizardService);
          initStep2Interactions();
        }
        goToStep(2);
      }, 120);
    }
  }

  // Contact method
  var methodGroup = document.getElementById('contactMethodGroup');
  if (methodGroup) {
    methodGroup.addEventListener('click', e => {
      var btn = e.target.closest('.contact-method-btn');
      if (!btn) return;
      methodGroup.querySelectorAll('.contact-method-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      wizardContactMethod = btn.dataset.method;
    });
  }

  // Next button
  var nextBtn = document.getElementById('wizardNextBtn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (wizardStep === 1) {
        if (!wizardService) {
          var grid = document.querySelector('.service-cards-grid');
          if (grid) {
            grid.style.outline = '2px solid rgba(248,113,113,0.6)';
            grid.style.borderRadius = '16px';
            setTimeout(() => { grid.style.outline = ''; }, 2000);
          }
          return;
        }
        var container = document.getElementById('dynamicStep2Content');
        if (container) {
          container.innerHTML = buildStep2HTML(wizardService);
          initStep2Interactions();
        }
        goToStep(2);

      } else if (wizardStep === 2) {
        wizardStep2Data = collectStep2Data();
        var pkgSelect = document.getElementById('wPackage');
        if (pkgSelect && wizardPackage) {
          Array.from(pkgSelect.options).forEach(opt => {
            if (opt.value === wizardPackage) opt.selected = true;
          });
        }
        goToStep(3);

      } else if (wizardStep === 3) {
        var nameEl  = document.getElementById('wName');
        var phoneEl = document.getElementById('wPhone');
        var valid = true;
        if (!nameEl || nameEl.value.trim().length < 2) {
          var ne = document.getElementById('wNameError');
          if (ne) ne.classList.add('visible');
          valid = false;
        }
        if (!phoneEl || phoneEl.value.trim().length < 6) {
          var pe = document.getElementById('wPhoneError');
          if (pe) pe.classList.add('visible');
          valid = false;
        }
        if (!valid) return;

        var summaryContainer = document.getElementById('wizardSummaryContainer');
        if (summaryContainer) {
          summaryContainer.innerHTML = buildSummaryHTML(wizardStep2Data);

          var sendWaBtn = document.getElementById('sendWaBtn');
          if (sendWaBtn) {
            sendWaBtn.addEventListener('click', function() {
              var msg = buildWaMessage(wizardStep2Data);
              window.open('https://wa.me/4915129893854?text=' + encodeURIComponent(msg), '_blank', 'noopener,noreferrer');
              this.innerHTML = '<i class="fa-solid fa-check"></i> Отваря WhatsApp...';
              this.style.background = 'linear-gradient(135deg, #10b981, #059669)';
              this.disabled = true;
              var self = this;
              setTimeout(() => {
                self.innerHTML = '<i class="fa-brands fa-whatsapp"></i> Изпрати в WhatsApp';
                self.style.background = '';
                self.disabled = false;
              }, 3000);
            });
          }

          var sendEmailBtn = document.getElementById('sendEmailBtn');
          if (sendEmailBtn) {
            sendEmailBtn.addEventListener('click', function() {
              submitFormWithFiles(wizardStep2Data, this);
            });
          }
        }
        goToStep(4);
      }
    });
  }

  // Back button
  var backBtn = document.getElementById('wizardBackBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (wizardStep > 1) goToStep(wizardStep - 1, 'back');
    });
  }

  // Live validation
  var wName = document.getElementById('wName');
  if (wName) wName.addEventListener('input', () => {
    var e = document.getElementById('wNameError');
    if (e) e.classList.remove('visible');
  });
  var wPhone = document.getElementById('wPhone');
  if (wPhone) wPhone.addEventListener('input', () => {
    var e = document.getElementById('wPhoneError');
    if (e) e.classList.remove('visible');
  });
})();

/* ---- FAQ ACCORDION ---- */
document.querySelectorAll('.faq-item').forEach(item => {
  var question = item.querySelector('.faq-question');
  if (!question) return;
  question.addEventListener('click', () => {
    var isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

/* ---- INIT ---- */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
        el.classList.add('revealed');
      }
    });
  }, 100);
});

/* ============================================================
   PREMIUM INTERACTIONS — Sound, Cursor, Magnetic
   ============================================================ */

/* ---- BUTTON CLICK SOUND (Web Audio API — no files needed) ---- */
(function () {
  var _audioCtx = null;

  function _getCtx() {
    if (!_audioCtx) {
      try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
    }
    // Resume if suspended (browser autoplay policy)
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    return _audioCtx;
  }

  function playClick(isGold) {
    var ctx = _getCtx();
    if (!ctx) return;

    var now = ctx.currentTime;
    var osc  = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (isGold) {
      // Gold button: bright, confident double-tone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.1);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else {
      // Outline/whatsapp: soft click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.08);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.btn');
    if (!btn) return;
    var isGold = btn.classList.contains('btn-gold');
    playClick(isGold);
  }, { passive: true });
})();

/* ---- CURSOR GLOW (desktop / non-touch only) ---- */
(function () {
  if (window.matchMedia('(hover: none)').matches) return;

  var glow = document.createElement('div');
  glow.id = 'cursorGlow';
  document.body.appendChild(glow);

  var cx = 0, cy = 0, tx = 0, ty = 0;
  var raf = null;

  document.addEventListener('mousemove', function (e) {
    tx = e.clientX;
    ty = e.clientY;
    glow.style.opacity = '1';
    if (!raf) {
      raf = requestAnimationFrame(function tick() {
        cx += (tx - cx) * 0.1;
        cy += (ty - cy) * 0.1;
        glow.style.left = cx + 'px';
        glow.style.top  = cy + 'px';
        if (Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5) {
          raf = requestAnimationFrame(tick);
        } else {
          raf = null;
        }
      });
    }
  }, { passive: true });

  document.addEventListener('mouseleave', function () {
    glow.style.opacity = '0';
  });
})();

/* ---- MAGNETIC BUTTONS (desktop only) ---- */
(function () {
  if (window.matchMedia('(hover: none)').matches) return;

  function initMagnetic(el) {
    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect();
      var x = e.clientX - r.left - r.width  / 2;
      var y = e.clientY - r.top  - r.height / 2;
      el.style.transform = 'translate(' + (x * 0.18) + 'px, ' + (y * 0.18 - 3) + 'px)';
    });
    el.addEventListener('mouseleave', function () {
      el.style.transform = '';
    });
  }

  document.querySelectorAll('.btn-gold, .btn-whatsapp').forEach(initMagnetic);

  // Also apply to dynamically added wizard buttons
  var wizNext = document.getElementById('wizardNextBtn');
  if (wizNext) initMagnetic(wizNext);
})();

/* =============================================
   REFERRAL PROGRAM
   ============================================= */

(function () {
  const REF_KEY = 'bgpomosht_ref';

  /* --- Помощни функции --- */
  function cleanName(raw) {
    return raw.trim()
      .toUpperCase()
      .replace(/\s+/g, '-')
      .replace(/[^A-ZА-Я0-9\-]/gu, '')
      .slice(0, 20);
  }

  function randomSuffix() {
    return Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  function buildCode(name) {
    const clean = cleanName(name);
    if (!clean) return null;
    // Запазваме суфикса за да е стабилен при повторно въвеждане
    const cacheKey = 'ref_suffix_' + clean;
    let suffix = sessionStorage.getItem(cacheKey);
    if (!suffix) { suffix = randomSuffix(); sessionStorage.setItem(cacheKey, suffix); }
    return clean + '-' + suffix;
  }

  function buildLink(code) {
    return window.location.origin + '/?ref=' + encodeURIComponent(code);
  }

  /* --- Генератор на линк (само на index) --- */
  function initGenerator() {
    const input   = document.getElementById('refNameInput');
    const genBtn  = document.getElementById('refGenBtn');
    const result  = document.getElementById('refLinkResult');
    const display = document.getElementById('refLinkDisplay');
    const copyBtn = document.getElementById('refCopyBtn');
    const shareRow = document.getElementById('refShareRow');
    const shareWa  = document.getElementById('refShareWa');
    const shareFb  = document.getElementById('refShareFb');
    const shareViber = document.getElementById('refShareViber');

    if (!input || !genBtn) return;

    function generate() {
      const code = buildCode(input.value);
      if (!code) { input.focus(); return; }
      const link = buildLink(code);

      display.textContent = link;
      result.classList.add('ref-link-visible');
      shareRow.classList.add('ref-link-visible');

      const waText = encodeURIComponent('Здравей! 🎁 Ползвам BG Помощ за документи в Европа и те препоръчвам! Кликни тук и получи безплатна консултация: ' + link);
      shareWa.href  = 'https://wa.me/?text=' + waText;
      shareFb.href  = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(link);
      // GA4 referral share tracking
      if (typeof gtag === 'function') { gtag('event', 'referral_share', { event_category: 'referral', event_label: code }); }
      shareViber.dataset.viberText = decodeURIComponent(waText);
    }

    genBtn.addEventListener('click', generate);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') generate(); });

    // Viber — copy to clipboard + tooltip (viber:// scheme breaks Safari)
    shareViber.addEventListener('click', function (e) {
      e.preventDefault();
      const text = this.dataset.viberText || display.textContent;
      if (!text) return;
      navigator.clipboard.writeText(text).then(function () {
        shareViber.innerHTML = '<i class="fa-solid fa-check"></i> Копирано!';
        shareViber.style.background = 'rgba(125,211,252,0.15)';
        setTimeout(function () {
          shareViber.innerHTML = '<i class="fa-brands fa-viber"></i> Viber';
          shareViber.style.background = '';
        }, 2500);
      }).catch(function () {
        // fallback за стари браузъри
        window.prompt('Копирай линка и го изпрати в Viber:', text);
      });
    });

    copyBtn.addEventListener('click', function () {
      const link = display.textContent;
      if (!link) return;
      navigator.clipboard.writeText(link).then(function () {
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i><span>Копирано!</span>';
        copyBtn.classList.add('copied');
        setTimeout(function () {
          copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i><span>Копирай</span>';
          copyBtn.classList.remove('copied');
        }, 2200);
      });
    });
  }

  /* --- Welcome банер при посещение с ?ref= --- */
  function checkIncomingRef() {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (!ref) return;

    // Запазваме рефералния код
    localStorage.setItem(REF_KEY, ref);

    // Извличаме името (преди тирето)
    const namePart = ref.split('-')[0];
    const displayName = namePart.charAt(0) + namePart.slice(1).toLowerCase();

    // Банер
    const banner = document.createElement('div');
    banner.className = 'ref-welcome-banner';
    banner.id = 'refWelcomeBanner';
    banner.innerHTML = `
      <div class="ref-welcome-inner">
        <span class="ref-welcome-gift"><i class="fa-solid fa-gift"></i></span>
        <div class="ref-welcome-text">
          <strong>Поканен си от ${displayName}!</strong>
          Получаваш безплатна консултация на стойност €29 — автоматично приложена към заявката ти.
        </div>
        <a href="form.html" class="ref-welcome-cta">Заяви сега</a>
        <button class="ref-welcome-close" id="refWelcomeClose" aria-label="Затвори"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `;
    document.body.prepend(banner);
    requestAnimationFrame(() => requestAnimationFrame(() => banner.classList.add('ref-welcome-visible')));

    document.getElementById('refWelcomeClose').addEventListener('click', function () {
      banner.classList.remove('ref-welcome-visible');
      setTimeout(() => banner.remove(), 350);
    });

    // Чисти URL без да рефрешва страницата
    const cleanUrl = window.location.pathname;
    history.replaceState(null, '', cleanUrl);
  }

  /* --- Авто-попълване на формата --- */
  function initFormRef() {
    const refGroup = document.getElementById('refFormGroup');
    const refInput = document.getElementById('wRefCode');
    if (!refGroup || !refInput) return;

    const saved = localStorage.getItem(REF_KEY);
    if (!saved) return;

    refInput.value = saved;
    refGroup.style.display = 'block';
  }

  /* --- Инициализация --- */
  function init() {
    checkIncomingRef();
    initGenerator();
    initFormRef();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* =============================================
   COOKIE CONSENT (GDPR)
   ============================================= */

(function () {
  const STORAGE_KEY = 'bgpomosht_cookie_consent';

  /* --- Инжектира линк в footer-legal --- */
  function injectFooterLink() {
    const legal = document.querySelector('.footer-legal');
    if (!legal) return;
    if (legal.querySelector('.cookie-settings-link')) return;
    const link = document.createElement('a');
    link.href = '#';
    link.className = 'cookie-settings-link';
    link.textContent = 'Бисквитки';
    link.addEventListener('click', function (e) {
      e.preventDefault();
      showBanner(true);
    });
    legal.appendChild(link);
  }

  /* --- Създава HTML на банера --- */
  function createBanner() {
    // Overlay — блокира взаимодействие с фона
    var overlay = document.createElement('div');
    overlay.className = 'cookie-overlay';
    overlay.id = 'cookieOverlay';
    document.body.appendChild(overlay);

    const el = document.createElement('div');
    el.className = 'cookie-banner';
    el.id = 'cookieBanner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Настройки за бисквитки');
    el.innerHTML = `
      <div class="cookie-inner">
        <div class="cookie-top">
          <div class="cookie-icon-wrap">
            <i class="fa-solid fa-cookie-bite"></i>
          </div>
          <div class="cookie-text">
            <h4>Този сайт използва бисквитки</h4>
            <p>Използваме бисквитки за да подобрим вашето изживяване, да анализираме трафика и да ви показваме подходящо съдържание.</p>
          </div>
        </div>
        <div class="cookie-details cookie-details-hidden" id="cookieDetails">
          <div class="cookie-type">
            <div class="cookie-type-info">
              <strong><i class="fa-solid fa-shield-halved"></i> Необходими</strong>
              <span>Сесия, сигурност, основни функции</span>
            </div>
            <div class="cookie-toggle cookie-toggle-locked" title="Винаги активни">
              <i class="fa-solid fa-lock"></i>
            </div>
          </div>
          <div class="cookie-type">
            <div class="cookie-type-info">
              <strong><i class="fa-solid fa-chart-simple"></i> Аналитични</strong>
              <span>Анонимна статистика за посещенията</span>
            </div>
            <label class="cookie-toggle-wrap">
              <input type="checkbox" id="cookieAnalytics" checked />
              <span class="cookie-toggle-slider"></span>
            </label>
          </div>
          <div class="cookie-type">
            <div class="cookie-type-info">
              <strong><i class="fa-brands fa-facebook-f"></i> Маркетингови</strong>
              <span>Facebook Pixel, ремаркетинг реклами</span>
            </div>
            <label class="cookie-toggle-wrap">
              <input type="checkbox" id="cookieMarketing" checked />
              <span class="cookie-toggle-slider"></span>
            </label>
          </div>
        </div>
        <div class="cookie-actions">
          <button class="cookie-btn cookie-btn-accept" id="cookieBtnAll"><i class="fa-solid fa-check"></i> Приемам всички</button>
          <button class="cookie-btn cookie-btn-custom cookie-details-hidden" id="cookieBtnCustom">Запази избора</button>
        </div>
        <div class="cookie-secondary">
          <a href="#" class="cookie-link-settings" id="cookieBtnSettings"><i class="fa-solid fa-sliders"></i> Настройки</a>
          <span class="cookie-sep">|</span>
          <a href="#" class="cookie-link-essential" id="cookieBtnEssential">Само необходими</a>
        </div>
        <p class="cookie-legal-note"><a href="datenschutz.html">Политика за поверителност</a></p>
      </div>
    `;
    return el;
  }

  /* --- Показва банера --- */
  function showBanner(force) {
    let banner = document.getElementById('cookieBanner');
    if (banner) {
      banner.classList.add('cookie-visible');
      return;
    }
    banner = createBanner();
    document.body.appendChild(banner);

    // Зареди текущите настройки ако има
    if (!force) {
      const saved = getSaved();
      if (saved) {
        document.getElementById('cookieAnalytics').checked = saved.analytics !== false;
        document.getElementById('cookieMarketing').checked = saved.marketing !== false;
      }
    }

    requestAnimationFrame(() => requestAnimationFrame(() => {
      banner.classList.add('cookie-visible');
      var ov = document.getElementById('cookieOverlay');
      if (ov) ov.classList.add('cookie-overlay-visible');
      // Hide everything behind overlay
      var spt = document.getElementById('sptWrap');
      if (spt) spt.style.display = 'none';
      var pcb = document.getElementById('prechatBubble');
      if (pcb) pcb.style.display = 'none';
      document.querySelectorAll('.whatsapp-float, .facebook-float, .back-to-top, .prechat-bubble').forEach(function(el) { el.style.display = 'none'; });
    }));

    document.getElementById('cookieBtnAll').addEventListener('click', function () {
      save({ analytics: true, marketing: true, level: 'all' });
      hideBanner();
    });

    document.getElementById('cookieBtnEssential').addEventListener('click', function (e) {
      e.preventDefault();
      save({ analytics: false, marketing: false, level: 'essential' });
      hideBanner();
    });

    document.getElementById('cookieBtnCustom').addEventListener('click', function () {
      save({
        analytics: document.getElementById('cookieAnalytics').checked,
        marketing: document.getElementById('cookieMarketing').checked,
        level: 'custom'
      });
      hideBanner();
    });

    document.getElementById('cookieBtnSettings').addEventListener('click', function (e) {
      e.preventDefault();
      var details = document.getElementById('cookieDetails');
      var customBtn = document.getElementById('cookieBtnCustom');
      details.classList.toggle('cookie-details-hidden');
      customBtn.classList.toggle('cookie-details-hidden');
      this.innerHTML = details.classList.contains('cookie-details-hidden')
        ? '<i class="fa-solid fa-sliders"></i> Настройки'
        : '<i class="fa-solid fa-chevron-up"></i> Скрий';
    });
  }

  /* --- Скрива банера --- */
  function hideBanner() {
    const banner = document.getElementById('cookieBanner');
    const overlay = document.getElementById('cookieOverlay');
    if (!banner) return;
    banner.classList.remove('cookie-visible');
    if (overlay) overlay.classList.remove('cookie-overlay-visible');
    // Restore hidden elements
    var spt = document.getElementById('sptWrap');
    if (spt) spt.style.display = '';
    document.querySelectorAll('.whatsapp-float, .facebook-float, .back-to-top, .prechat-bubble').forEach(function(el) { el.style.display = ''; });
    // Show pre-chat bubble after cookie consent if not already shown
    var pcb = document.getElementById('prechatBubble');
    if (pcb) {
      pcb.style.display = '';
    } else {
      // Trigger pre-chat bubble to appear now (cookie was blocking it)
      setTimeout(function() {
        window.dispatchEvent(new CustomEvent('cookieConsentGiven'));
      }, 500);
    }
    setTimeout(function () {
      banner.remove();
      if (overlay) overlay.remove();
    }, 420);
  }

  /* --- Запазва избора --- */
  function save(prefs) {
    prefs.date = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }

  /* --- Чете запазения избор --- */
  function getSaved() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
  }

  /* --- Инициализация --- */
  function init() {
    injectFooterLink();
    const saved = getSaved();
    if (!saved) {
      setTimeout(() => showBanner(false), 1500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* =============================================
   TESTIMONIALS CAROUSEL DOTS (mobile)
   ============================================= */
(function () {
  var grid = document.querySelector('.testimonials-grid');
  var dotsWrap = document.getElementById('testimonialDots');
  if (!grid || !dotsWrap) return;

  var cards = grid.children;
  var count = cards.length;
  if (count < 2) return;

  // Create dots
  for (var i = 0; i < count; i++) {
    var dot = document.createElement('button');
    dot.className = 'testimonials-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Отзив ' + (i + 1));
    dot.dataset.index = i;
    dot.addEventListener('click', function () {
      var idx = parseInt(this.dataset.index);
      cards[idx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
    dotsWrap.appendChild(dot);
  }

  // Update active dot on scroll
  var dots = dotsWrap.querySelectorAll('.testimonials-dot');
  var ticking = false;
  grid.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var scrollLeft = grid.scrollLeft;
      var cardWidth = cards[0].offsetWidth + 16; // gap
      var active = Math.round(scrollLeft / cardWidth);
      if (active < 0) active = 0;
      if (active >= count) active = count - 1;
      for (var j = 0; j < dots.length; j++) {
        dots[j].classList.toggle('active', j === active);
      }
      ticking = false;
    });
  });
})();

/* =============================================
   SOCIAL PROOF TICKER
   ============================================= */

(function () {
  var _notifications = [
    { initials: 'МГ', color: '#7b1fa2', text: 'Мария от Мюнхен', action: 'поръча CV пакет', flag: '🇩🇪', time: '2 мин' },
    { initials: 'ГТ', color: '#1565c0', text: 'Георги от Виена',  action: 'получи помощ с Jobcenter', flag: '🇦🇹', time: '17 мин' },
    { initials: 'ПМ', color: '#2d8653', text: 'Петя от Берлин',   action: 'намери работа с нас', flag: '🇩🇪', time: '1 час' },
    { initials: 'СД', color: '#c62828', text: 'Стефан от Хамбург', action: 'поръча "Нов в страната"', flag: '🇩🇪', time: '3 часа' },
    { initials: 'НК', color: '#e65100', text: 'Николина от Цюрих', action: 'активира VIP абонамент', flag: '🇨🇭', time: '5 часа' },
    { initials: 'ИП', color: '#00695c', text: 'Иван от Лондон',    action: 'поръча CV за Великобритания', flag: '🇬🇧', time: '8 часа' },
    { initials: 'АС', color: '#4527a0', text: 'Анна от Амстердам', action: 'получи Kindergeld с наша помощ', flag: '🇳🇱', time: '12 часа' },
    { initials: 'ВД', color: '#1a5276', text: 'Виктор от Брюксел', action: 'поръча превод на документи', flag: '🇧🇪', time: '1 ден' },
    { initials: 'КР', color: '#6a1b9a', text: 'Калина от Париж',   action: 'получи помощ с институция', flag: '🇫🇷', time: '1 ден' },
    { initials: 'БН', color: '#0277bd', text: 'Борис от Копенхаген', action: 'завърши регистрация в Дания', flag: '🇩🇰', time: '2 дни' }
  ];

  var _idx = 0;
  var _ticker = null;
  var _shown = false;

  function createTicker() {
    var el = document.createElement('div');
    el.className = 'spt-wrap';
    el.id = 'sptWrap';
    el.innerHTML = '<div class="spt-card" id="sptCard"><div class="spt-avatar" id="sptAvatar"></div><div class="spt-body"><div class="spt-name" id="sptName"></div><div class="spt-action" id="sptAction"></div><div class="spt-time" id="sptTime"></div></div></div>';
    document.body.appendChild(el);
    _ticker = el;
  }

  function showNext() {
    var card   = document.getElementById('sptCard');
    if (!card) return;
    var n      = _notifications[_idx % _notifications.length];
    var avatar = document.getElementById('sptAvatar');
    var name   = document.getElementById('sptName');
    var action = document.getElementById('sptAction');
    var time   = document.getElementById('sptTime');

    card.classList.remove('spt-visible');
    setTimeout(function () {
      avatar.textContent      = n.initials;
      avatar.style.background = n.color;
      name.textContent        = n.flag + ' ' + n.text;
      action.textContent      = n.action;
      time.textContent        = 'Преди ' + n.time;
      card.classList.add('spt-visible');
      _idx++;
    }, 300);
  }

  function init() {
    createTicker();
    setTimeout(function () {
      showNext();
      setInterval(showNext, 25000);
    }, 12000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* =============================================
   PRE-CHAT WHATSAPP BUBBLE
   ============================================= */

(function () {
  var STORAGE_KEY = 'bgp_prechat_dismissed';
  var isForm = window.location.pathname.includes('form.html');
  if (isForm) return;

  var _options = [
    { icon: '📄', label: 'CV и работа',        text: 'Здравейте! Имам нужда от помощ с CV и търся работа.' },
    { icon: '🏛️', label: 'Институция',          text: 'Здравейте! Имам проблем с институция (Jobcenter, Kindergeld и др.).' },
    { icon: '📋', label: 'Документ / превод',   text: 'Здравейте! Имам нужда от превод или попълване на документ.' },
    { icon: '✈️', label: 'Тъкмо пристигнах',   text: 'Здравейте! Тъкмо пристигнах в нова страна и имам нужда от помощ.' },
    { icon: '💬', label: 'Друг въпрос',         text: 'Здравейте! Имам въпрос относно вашите услуги.' }
  ];

  function buildBubble() {
    var opts = _options.map(function (o) {
      var enc = encodeURIComponent(o.text);
      return '<a href="https://wa.me/4915129893854?text=' + enc + '" class="pcb-option" target="_blank" rel="noopener"><span class="pcb-option-icon">' + o.icon + '</span>' + o.label + '</a>';
    }).join('');

    var el = document.createElement('div');
    el.className = 'prechat-bubble';
    el.id = 'prechatBubble';
    el.innerHTML =
      '<button class="pcb-close" id="pcbClose" aria-label="Затвори"><i class="fa-solid fa-xmark"></i></button>' +
      '<div class="pcb-header">' +
        '<div class="pcb-avatar"><i class="fa-brands fa-whatsapp"></i><span class="pcb-online"></span></div>' +
        '<div class="pcb-info"><strong>BG Помощ</strong><span><i class="fa-solid fa-circle" style="color:#4fde87;font-size:7px"></i> Онлайн сега</span></div>' +
      '</div>' +
      '<div class="pcb-msg"><div class="pcb-bubble-msg">Здравей! 👋 С какво мога да помогна днес?</div></div>' +
      '<div class="pcb-options">' + opts + '</div>';
    document.body.appendChild(el);

    document.getElementById('pcbClose').addEventListener('click', function () {
      el.classList.remove('pcb-visible');
      localStorage.setItem(STORAGE_KEY, Date.now());
    });
  }

  function showPrechat() {
    var dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed && (Date.now() - parseInt(dismissed)) < 24 * 3600 * 1000) return;
    if (document.getElementById('cookieBanner')) return;
    if (!document.getElementById('prechatBubble')) buildBubble();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var b = document.getElementById('prechatBubble');
        if (b) b.classList.add('pcb-visible');
      });
    });
  }

  function init() {
    var dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed && (Date.now() - parseInt(dismissed)) < 24 * 3600 * 1000) return;

    setTimeout(function () {
      showPrechat();
    }, 10000);

    // Also listen for cookie consent — show after consent given
    window.addEventListener('cookieConsentGiven', function () {
      setTimeout(showPrechat, 2000);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* =============================================
   EXIT-INTENT POPUP
   ============================================= */

(function () {
  var SESSION_KEY = 'bgp_exit_shown';
  var isForm = window.location.pathname.includes('form.html');
  if (isForm) return;
  if (sessionStorage.getItem(SESSION_KEY)) return;

  var _pageTime = 0;
  var _timer = setInterval(function () { _pageTime++; }, 1000);

  function buildPopup() {
    var el = document.createElement('div');
    el.className = 'exit-overlay';
    el.id = 'exitOverlay';
    el.innerHTML =
      '<div class="exit-popup">' +
        '<button class="exit-close" id="exitClose" aria-label="Затвори"><i class="fa-solid fa-xmark"></i></button>' +
        '<div class="exit-emoji">🙋</div>' +
        '<h3>Почакай секунда!</h3>' +
        '<p>Имаш въпрос? Нашият екип отговаря <strong>до 30 минути</strong> — дори в почивните дни. Без ангажименти.</p>' +
        '<a href="https://wa.me/4915129893854?text=' + encodeURIComponent('Здравейте! Имам въпрос относно вашите услуги.') + '" class="btn btn-whatsapp btn-lg exit-wa-btn" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> Пиши ни в WhatsApp</a>' +
        '<a href="form.html" class="btn btn-gold btn-lg" style="margin-top:10px"><i class="fa-solid fa-paper-plane"></i> Изпрати заявка</a>' +
        '<button class="exit-skip" id="exitSkip">Не, благодаря</button>' +
      '</div>';
    document.body.appendChild(el);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add('exit-visible'); });
    });

    function close() {
      el.classList.remove('exit-visible');
      setTimeout(function () { el.remove(); }, 350);
    }
    document.getElementById('exitClose').addEventListener('click', close);
    document.getElementById('exitSkip').addEventListener('click', close);
    el.addEventListener('click', function (e) { if (e.target === el) close(); });
  }

  document.addEventListener('mouseleave', function (e) {
    if (e.clientY > 20) return;
    if (_pageTime < 15) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, '1');
    clearInterval(_timer);
    buildPopup();
  });
})();

/* =============================================
   PRICE CALCULATOR (floating)
   ============================================= */

(function () {
  var _prices = {
    'Документ или превод':      { base: 29,  label: 'от €29', period: '' },
    'Помощ с институция':      { base: 39,  label: 'от €39', period: '' },
    'Онлайн курс / Сертификат':{ base: 29,  label: 'от €29', period: '' },
    'Търся работа':            { base: 29,  label: 'от €29', period: '' },
    'Тъкмо пристигнах':        { base: 49,  label: 'от €49', period: '' },
    'Търсене на жилище':       { base: 39,  label: 'от €39', period: '' },
    'Пълно обслужване А до Я': { base: 99,  label: 'от €99', period: '' },
    'VIP Абонамент':           { base: 149, label: '€149',   period: '/мес' },
    'Данъчна декларация':      { base: 49,  label: 'от €49', period: '' },
    'КЕП онлайн подпис':       { base: 19,  label: 'от €19', period: '' },
    'е-Услуги от България':    { base: 39,  label: 'от €39', period: '' }
  };

  var serviceLinks = {
    'Документ или превод':      'form.html?service=documents',
    'Помощ с институция':      'form.html?service=institution',
    'Онлайн курс / Сертификат':'form.html?service=courses',
    'Търся работа':            'form.html?service=job',
    'Тъкмо пристигнах':        'form.html?service=newcomer',
    'Пълно обслужване А до Я': 'form.html?service=full',
    'VIP Абонамент':           'form.html?service=vip',
    'Данъчна декларация':      'form.html?service=taxes',
    'КЕП онлайн подпис':       'form.html?service=kep',
    'е-Услуги от България':    'form.html?service=eservices',
    'Търсене на жилище':       'form.html?service=housing'
  };

  var serviceOpts = Object.keys(_prices).map(function (k) {
    return '<option value="' + k + '">' + k + '</option>';
  }).join('');

  function build() {
    // Floating trigger button
    var trigger = document.createElement('button');
    trigger.className = 'calc-trigger';
    trigger.id = 'calcTrigger';
    trigger.setAttribute('aria-label', 'Калкулатор на цена');
    trigger.innerHTML = '<i class="fa-solid fa-calculator"></i><span class="calc-tooltip">Колко струва?</span>';
    document.body.appendChild(trigger);

    // Modal
    var modal = document.createElement('div');
    modal.className = 'calc-modal';
    modal.id = 'calcModal';
    modal.innerHTML =
      '<div class="calc-inner">' +
        '<button class="calc-modal-close" id="calcClose"><i class="fa-solid fa-xmark"></i></button>' +
        '<div class="calc-header"><i class="fa-solid fa-calculator"></i><h4>Калкулатор на цена</h4></div>' +
        '<div class="calc-field">' +
          '<label>Каква услуга ти трябва?</label>' +
          '<div class="input-wrap select-wrap calc-select-wrap"><i class="fa-solid fa-list-check"></i>' +
            '<select id="calcService"><option value="">— Избери услуга —</option>' + serviceOpts + '</select>' +
            '<i class="fa-solid fa-chevron-down select-arrow"></i>' +
          '</div>' +
        '</div>' +
        '<div class="calc-field">' +
          '<label>Колко спешно?</label>' +
          '<div class="calc-urgency-row">' +
            '<button class="calc-urgency-btn selected" data-mult="1" id="calcStd"><i class="fa-solid fa-clock"></i> Стандартно <span>до 24ч</span></button>' +
            '<button class="calc-urgency-btn" data-mult="1.5" id="calcExp"><i class="fa-solid fa-bolt"></i> Спешно <span>до 6ч +50%</span></button>' +
          '</div>' +
        '</div>' +
        '<div class="calc-result" id="calcResult">' +
          '<div class="calc-price-wrap"><span class="calc-price" id="calcPrice">—</span><span class="calc-period" id="calcPeriod"></span></div>' +
          '<p class="calc-note" id="calcNote">Избери услуга за да видиш цената</p>' +
        '</div>' +
        '<a href="form.html" class="btn btn-gold" id="calcCta" style="display:none;width:100%;justify-content:center;margin-top:14px"><i class="fa-solid fa-paper-plane"></i> Поръчай тази услуга</a>' +
      '</div>';
    document.body.appendChild(modal);

    var mult = 1;

    trigger.addEventListener('click', function () {
      modal.classList.toggle('calc-open');
    });
    document.getElementById('calcClose').addEventListener('click', function () {
      modal.classList.remove('calc-open');
    });
    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.classList.remove('calc-open');
    });

    modal.querySelectorAll('.calc-urgency-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        modal.querySelectorAll('.calc-urgency-btn').forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
        mult = parseFloat(btn.dataset.mult);
        updateCalc();
      });
    });

    document.getElementById('calcService').addEventListener('change', updateCalc);

    function updateCalc() {
      var svc = document.getElementById('calcService').value;
      var priceEl = document.getElementById('calcPrice');
      var periodEl = document.getElementById('calcPeriod');
      var noteEl = document.getElementById('calcNote');
      var ctaEl = document.getElementById('calcCta');

      if (!svc) {
        priceEl.textContent = '—';
        periodEl.textContent = '';
        noteEl.textContent = 'Избери услуга за да видиш цената';
        ctaEl.style.display = 'none';
        return;
      }
      var info = _prices[svc];
      var isVip = svc === 'VIP Абонамент';
      var finalPrice = Math.round(info.base * mult);
      var pfx = info.label.startsWith('от') ? 'от ' : '';
      priceEl.textContent = pfx + '€' + finalPrice;
      periodEl.textContent = info.period;
      noteEl.textContent = mult > 1 ? '⚡ Спешна услуга — до 6 часа' : '✓ Стандартна доставка до 24 часа. Безплатна ревизия включена.';
      ctaEl.href = serviceLinks[svc] || 'form.html';
      ctaEl.style.display = 'flex';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();

/* ---- GA4 CTA CLICK TRACKING ---- */
document.addEventListener('click', function (e) {
  var btn = e.target.closest('a.btn-gold, a.btn-whatsapp, a.nav-cta');
  if (!btn || typeof gtag !== 'function') return;
  var label = btn.textContent.trim().slice(0, 40) || btn.href;
  gtag('event', 'cta_click', { event_category: 'engagement', event_label: label });
});
