window.addEventListener('load', function(){
  var h = new Date().getHours();
  var greet = h < 12 ? '☀️ Guten Morgen!' : h < 18 ? '🌤 Guten Mittag!' : '🌙 Guten Abend!';
  var toast = document.getElementById('greeting-toast');
  toast.textContent = greet;
  toast.style.opacity = '1';
  setTimeout(function(){
    toast.style.opacity = '0';
    setTimeout(function(){ toast.style.display = 'none'; }, 700);
  }, 3500);
});

/* ================================================
   STATE
================================================ */
var state = {
  age: 16,
  lohn: 3200,
  sparGuthaben: 2500,
  saldo3a: 0,
  monatlichesSparbudget: 320, // 10% von 3200
  goals: [],
  haxxDone: [],
  editGoalIdx: -1,
  selectedEmoji: '🎯',
  mode: null,
  // Gamification fields
  xp: 0,
  streak: 0,
  lastStreakDate: '',
  dailyChallengeDate: '',
  dailyChallengeXpClaimed: false,
  quizDate: '',
  quizCorrect: false,
  habitDone: [false, false, false, false, false],
  monthlyHabitDone: [false, false, false, false, false],
  monthlyHabitWeek: '',
  monthlyChallengeDone: false,
  monthlyChallengeMonth: '',
  storyDate: '',
  storyChoice: -1,
};

// Persist to localStorage
function save() {
  localStorage.setItem('blkb_v3', JSON.stringify({
    age: state.age,
    lohn: state.lohn,
    sparGuthaben: state.sparGuthaben,
    goals: state.goals,
    haxxDone: state.haxxDone,
    budgetPcts: budgetCats.map(function(c) { return c.pct; }),
    // Gamification
    xp: state.xp,
    streak: state.streak,
    lastStreakDate: state.lastStreakDate,
    dailyChallengeDate: state.dailyChallengeDate,
    dailyChallengeXpClaimed: state.dailyChallengeXpClaimed,
    quizDate: state.quizDate,
    quizCorrect: state.quizCorrect,
    habitDone: state.habitDone,
    monthlyHabitDone: state.monthlyHabitDone,
    monthlyHabitWeek: state.monthlyHabitWeek,
    monthlyChallengeDone: state.monthlyChallengeDone,
    monthlyChallengeMonth: state.monthlyChallengeMonth,
    storyDate: state.storyDate,
    storyChoice: state.storyChoice,
    learnChapterProgress: learnChapterProgress,
  }));
}

function load() {
  try {
    var d = JSON.parse(localStorage.getItem('blkb_v3') || 'null');
    if (d) {
      state.age = d.age || 16;
      state.lohn = d.lohn || 3200;
      state.sparGuthaben = d.sparGuthaben || 2500;
      var loadedGoals = d.goals || [];
      // Migration: alte pct-Ziele auf ziel-Format umstellen
      var needsMigration = loadedGoals.length > 0 && loadedGoals.every(function(g){ return g.ziel === undefined; });
      state.goals = needsMigration ? [] : loadedGoals;
      state.haxxDone = d.haxxDone || [];
      if (d.budgetPcts && d.budgetPcts.length === budgetCats.length) {
        d.budgetPcts.forEach(function(p, i) { budgetCats[i].pct = p; });
      }
      // Gamification
      state.xp = d.xp || 0;
      state.streak = d.streak || 0;
      state.lastStreakDate = d.lastStreakDate || '';
      state.dailyChallengeDate = d.dailyChallengeDate || '';
      state.dailyChallengeXpClaimed = d.dailyChallengeXpClaimed || false;
      state.quizDate = d.quizDate || '';
      state.quizCorrect = d.quizCorrect || false;
      state.habitDone = d.habitDone || [false, false, false, false, false];
      state.monthlyHabitDone = d.monthlyHabitDone || [false, false, false, false, false];
      state.monthlyHabitWeek = d.monthlyHabitWeek || '';
      state.monthlyChallengeDone = d.monthlyChallengeDone || false;
      state.monthlyChallengeMonth = d.monthlyChallengeMonth || '';
      state.storyDate = d.storyDate || '';
      state.storyChoice = d.storyChoice !== undefined ? d.storyChoice : -1;
      if (d.learnChapterProgress && d.learnChapterProgress.length === learnChapters.length) {
        learnChapterProgress = d.learnChapterProgress;
      }
    }
  } catch(e) {}
}

/* ================================================
   NAVIGATION
================================================ */
var currentView = 'home';

function switchView(name, idx) {
  // Views
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
  document.getElementById('view-' + name).classList.add('active');

  // Nav buttons
  document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById('nav' + idx).classList.add('active');

  // Youth nav sync
  document.querySelectorAll('#youth-nav .nav-btn').forEach(function(b){ b.classList.remove('active'); });
  var ynavMap = {home:0, goals:2, fun:3, haxx:4};
  if (ynavMap[name] !== undefined) {
    var yb = document.getElementById('ynav'+ynavMap[name]);
    if (yb) yb.classList.add('active');
  }

  currentView = name;

  // Scroll to top
  var sa = document.querySelector('#view-' + name + ' .scroll-area');
  if (sa) sa.scrollTop = 0;
}

/* ================================================
   TOAST
================================================ */
var toastTimer = null;

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { t.classList.remove('show'); }, 2500);
}

/* ================================================
   LEARN DATA (Youth Mode)
================================================ */
var learnData = [
  {
    emoji:'💡', title:'Was ist Geld?', subtitle:'Von Muscheln bis Twint',
    type:'steps',
    steps:[
      {icon:'🐚', q:'Früher gab es kein Geld', a:'Menschen tauschten direkt: 2 Fische gegen 1 Brot. Problem: Was wenn der andere keine Fische braucht? Das nennt man <b>Tauschhandel</b> — und er war kompliziert.'},
      {icon:'🪙', q:'Die erste Münze (600 v. Chr.)', a:'In Lydien (heute Türkei) wurden die ersten Münzen geprägt — aus Gold und Silber. Jeder wusste: Diese Münze hat einen bestimmten Wert. Damit konnte man mit jedem handeln.'},
      {icon:'📜', q:'Papiergeld aus China (7. Jh.)', a:'Die Chinesen erfanden das Papiergeld. Statt schwere Münzen zu tragen, hatten sie einen Zettel — ein Versprechen der Bank: "Dieser Zettel ist CHF 100 wert." Das Vertrauen in dieses Versprechen ist die Grundlage unseres Geldes.'},
      {icon:'💳', q:'Digitales Geld heute', a:'Heute sind 90% aller Franken digital — nur Zahlen auf einem Server. Vorteile: sicher, überall verfügbar, keine schweren Münzen. Dein BLKB-Konto ist ein digitales Versprechen: "Wir haben dein Geld sicher."'},
      {icon:'🚀', q:'Warum gibt es Geld?', a:'Geld löst das Tauschhandel-Problem. Es ist: <b>Tauschmittel</b> (du kannst alles kaufen), <b>Wertmesser</b> (1 Kaffee = CHF 4.50) und <b>Wertspeicher</b> (du kannst es aufbewahren). Ohne Geld würde die moderne Wirtschaft nicht funktionieren.'},
    ]
  },
  {
    emoji:'🌱', title:'Dein Geld wächst', subtitle:'Der Zinseszins-Effekt',
    type:'calculator',
    intro:'Wenn du Geld auf ein Sparkonto legst, passiert etwas Magisches. Die Bank zahlt dir Zinsen — und dann bekommst du Zinsen auf deine Zinsen. Das nennt man <b>Zinseszins</b>.',
    facts:[
      {icon:'🏦', text:'Die Bank leiht dein Geld an andere aus (für Kredite) und zahlt dir dafür Zinsen.'},
      {icon:'📈', text:'Zinseszins = Zinsen auf Zinsen. Einstein nannte es das "8. Weltwunder".'},
      {icon:'⏰', text:'Zeit ist dein bester Freund: Je früher du anfängst, desto mehr wächst dein Geld.'},
    ]
  },
  {
    emoji:'💰', title:'Umgang mit Geld', subtitle:'Die 50/30/20-Regel',
    type:'pots',
    evidence:'Empfehlung basiert auf: Pro Juventute, Budgetberatung Schweiz, PostFinance & internationaler Forschung (CFPB, Greenlight). Schweizer Jugendliche sparen laut Studien spontan 20–50% ihres Taschengeldes.',
    pots:[
      {label:'Ausgeben 🛍️', pct:50, color:'#fd000d', desc:'Für heute: Kaffee, Ausgang, Apps'},
      {label:'Sparen 🐷',    pct:30, color:'#2c5969', desc:'Für dein Ziel: Handy, Ferien, Konzert'},
      {label:'Teilen 🎁',    pct:20, color:'#7c8947', desc:'Geschenke, Freunde, Spenden'},
    ]
  },
  {
    emoji:'🏦', title:'Mein erstes Konto', subtitle:'Konto, IBAN & Zinsen',
    type:'quiz',
    questions:[
      {
        q:'Was ist eine IBAN?',
        options:['Dein Passwort für E-Banking','Deine internationale Kontonummer','Eine Kreditkarte der Bank','Ein Sparbuch'],
        correct:1,
        explain:'Die IBAN (International Bank Account Number) ist deine eindeutige Kontonummer — wie eine Adresse für dein Geld. Beispiel: CH56 0785 1234 5678 9000 0'
      },
      {
        q:'Was sind Zinsen?',
        options:['Gebühren die du der Bank zahlst','Geld das du der Bank schuldest','Geld das die Bank dir zahlt','Ein anderes Wort für Passworte'],
        correct:2,
        explain:'Zinsen sind Geld, das dir die Bank zahlt — dafür, dass sie dein Geld verwenden darf. Je mehr du sparst und je länger, desto mehr Zinsen bekommst du.'
      },
      {
        q:'Wie öffnest du ein Konto bei der BLKB?',
        options:['Gar nicht möglich unter 18','Nur mit Eltern ab 7 Jahren','Online ab 18 alleine','Mit Eltern ab Geburt möglich'],
        correct:3,
        explain:'Bei der BLKB kannst du schon als Kind mit deinen Eltern ein Jugendkonto eröffnen. Ab 18 Jahre kannst du selbständig Konten eröffnen.'
      },
    ]
  },
  {
    emoji:'📱', title:'Im Alltag bezahlen', subtitle:'Karte, Twint & Kontaktlos',
    type:'twint',
    items:[
      {name:'☕ Kaffee',    price:4.50},
      {name:'🍕 Pizza',    price:14.00},
      {name:'🎬 Kino',     price:18.00},
      {name:'🧃 Getränk',  price:3.20},
    ]
  },
  {
    emoji:'🛒', title:'Bedürfnis vs. Wunsch', subtitle:'Brauche ich das wirklich?',
    type:'swipe',
    cards:[
      {item:'🍞 Brot & Lebensmittel',  type:'need', explain:'Essen ist ein Grundbedürfnis — das brauchst du jeden Tag.'},
      {item:'👟 Neue Sneakers (3. Paar)', type:'want', explain:'Du hast bereits Schuhe. Ein 3. Paar ist ein Wunsch, kein Bedürfnis.'},
      {item:'💊 Medikamente', type:'need', explain:'Gesundheit ist ein Grundbedürfnis — Medikamente gehören dazu.'},
      {item:'🎮 Neues Game (hast schon 5)', type:'want', explain:'Spiele machen Spass, aber ein weiteres ist klar ein Wunsch.'},
      {item:'🧥 Winterjacke', type:'need', explain:'Kleidung zum Schutz vor Kälte ist ein Bedürfnis.'},
      {item:'📱 Neuestes iPhone (läuft noch)', type:'want', explain:'Dein Handy funktioniert noch — das Upgrade ist ein Wunsch.'},
      {item:'🚌 Busabo Schule', type:'need', explain:'Transport zur Schule ist ein Bedürfnis.'},
      {item:'☕ 5. Kaffee heute', type:'want', explain:'Du brauchst nicht jeden Tag 5 Kaffees — das ist ein Wunsch.'},
    ]
  },
  {
    emoji:'🔐', title:'Sicher online', subtitle:'Phishing erkennen',
    type:'phishing',
    emails:[
      {
        from:'support@blkb-sicherheit.com',
        subject:'⚠️ Konto gesperrt — sofort handeln!',
        body:'Ihr Konto wurde aus Sicherheitsgründen gesperrt. Klicken Sie JETZT auf den Link und geben Sie PIN und Passwort ein: www.blkb-login-sicher.com',
        isFake:true,
        explain:'Gefälscht! Die echte BLKB-Domain ist blkb.ch. Ausserdem fragt die Bank NIE per E-Mail nach PIN oder Passwort.'
      },
      {
        from:'info@blkb.ch',
        subject:'Deine Kontoübersicht März 2025',
        body:'Hallo, deine monatliche Kontoübersicht ist bereit. Du kannst sie in deinem E-Banking unter Dokumente einsehen. Keine Aktion nötig.',
        isFake:false,
        explain:'Echt! Diese E-Mail kommt von blkb.ch, enthält keine verdächtigen Links und fordert keine Passwörter. Trotzdem: Im Zweifel immer direkt im Browser blkb.ch eintippen.'
      },
      {
        from:'gewinn@lucky-swiss-bank.net',
        subject:'🎉 Du hast CHF 5\'000 gewonnen!',
        body:'Herzlichen Glückwunsch! Um deinen Gewinn zu erhalten, sende uns deine IBAN, Kontonummer und Geburtsdatum.',
        isFake:true,
        explain:'Gefälscht! Seriöse Banken verschicken keine Gewinnbenachrichtigungen. Und niemals sollst du IBAN + Geburtsdatum per E-Mail schicken.'
      },
    ]
  },
  {
    emoji:'💼', title:'Erster Job', subtitle:'Brutto, Netto & Abzüge',
    type:'lohn',
    baseStunden:160,
    stundenLohn:18.50,
  },
];
var learnProgress = [0,0,0,0,0,0,0,0];

/* ── Youth Learn Chapters (5 progressive chapters) ────────────── */
var learnChapters = [
  { id:0, emoji:'💰', title:'Was ist Geld?', subtitle:'4 Karten · ca. 3 Min', cards:[
    { emoji:'🔄', title:'Früher war alles anders', text:'Stell dir vor: Du willst Brot kaufen, hast aber nur Äpfel. Der Bäcker braucht keine Äpfel — Pech! Früher tauschten Menschen Dinge direkt. Das nennt sich Tauschhandel. Praktisch? Nicht wirklich.' },
    { emoji:'💵', title:'Dann kam das Geld', text:'Geld löste dieses Problem. Statt Äpfel zu tauschen, gibst du dem Bäcker Geld. Er akzeptiert es — weil alle anderen es auch akzeptieren. Geld ist ein gemeinsames «Tausch-Ticket», auf das sich alle geeinigt haben.' },
    { emoji:'🎁', title:'Woher kommt dein Geld?', text:'Als Jugendlicher kriegst du Geld von:\n👉 Taschengeld von deinen Eltern\n👉 Geschenken zu Geburtstag und Weihnachten\n👉 Später: Job, Babysitting, Lehrstelle\n\nDieses Geld gehört dir — und du entscheidest, was damit passiert!' },
    { emoji:'⚖️', title:'Die grösste Entscheidung', text:'Jedes Mal, wenn du Geld hast, triffst du eine Wahl:\n\n💸 Sofort ausgeben — für etwas, das du jetzt willst.\n🏦 Sparen — für etwas Grösseres später.\n\nBeide Optionen sind okay. Wichtig ist, dass du bewusst entscheidest.' }
  ]},
  { id:1, emoji:'🏦', title:'Mein Konto', subtitle:'5 Karten · ca. 4 Min', cards:[
    { emoji:'🏦', title:'Was ist eine Bank?', text:'Eine Bank ist wie ein super-sicherer Tresor für dein Geld. Du gibst ihr dein Geld zur Aufbewahrung — und kannst es jederzeit abheben. Anders als Bargeld unter der Matratze: Bankgeld ist bis CHF 100\'000 staatlich versichert.' },
    { emoji:'📬', title:'Deine IBAN — deine Geld-Adresse', text:'Deine IBAN ist wie deine Postadresse — aber für Geld. Wenn jemand dir Geld überweisen will (z.B. Lehrlohn), braucht er deine IBAN.\n\nSie sieht so aus:\nCH56 0785 1234 5678 9000 0\n\nJede IBAN ist weltweit einmalig — nur du hast genau diese.' },
    { emoji:'📄', title:'Kontoauszug lesen', text:'Der Kontoauszug zeigt alle Bewegungen auf deinem Konto:\n\n✅ + Zahlen = Geld kommt rein (z.B. Lohn, Geschenk)\n❌ − Zahlen = Geld geht raus (z.B. Einkauf, Abo)\n\nGanz unten siehst du deinen aktuellen Kontostand.' },
    { emoji:'📱', title:'E-Banking — immer im Blick', text:'Mit der BLKB App siehst du jederzeit:\n👀 Wie viel Geld du hast\n📋 Was du ausgegeben hast\n💸 Wer dir Geld geschickt hat\n\nDu kannst auch selbst Geld überweisen — das dauert meist nur Sekunden.' },
    { emoji:'🌱', title:'Zinsen: Geld fürs Daliegenlassen', text:'Beim Sparkonto bekommst du Zinsen — das ist Geld, das du einfach dafür bekommst, dass dein Geld dort liegt.\n\nBeispiel: 1% Zins auf CHF 1\'000 = CHF 10 pro Jahr.\n\nKlingt wenig? Je mehr du sparst und je länger, desto mehr wächst es!' }
  ]},
  { id:2, emoji:'📱', title:'Clever bezahlen', subtitle:'5 Karten · ca. 4 Min', cards:[
    { emoji:'💳', title:'Bargeld vs. Karte', text:'Bargeld: Du gibst Scheine und Münzen ab.\nDebitkarte: Die Bank zieht den Betrag automatisch ab.\n\nBeides funktioniert — aber mit der Karte siehst du immer genau, was du wann ausgegeben hast. Das hilft, den Überblick zu behalten.' },
    { emoji:'📲', title:'TWINT — bezahlen mit dem Handy', text:'TWINT ist eine Schweizer App zum Bezahlen. Du verknüpfst dein Konto und kannst dann:\n👉 Im Laden per QR-Code bezahlen\n👉 Freunden Geld schicken\n👉 Online einkaufen\n\nEinfach, schnell — und 100% schweizerisch.' },
    { emoji:'⚠️', title:'Die TWINT-Falle', text:'TWINT ist super praktisch — aber Vorsicht!\n\nKleine Beträge summieren sich:\n☕ CHF 2.50 Kaffee\n🍕 CHF 5.00 Snack\n🎮 CHF 3.00 App-Kauf\n= CHF 10.50 weg, ohne es zu merken!\n\nSchau mindestens einmal pro Woche in dein Konto.' },
    { emoji:'🔒', title:'Sicher online einkaufen', text:'Vor jedem Online-Kauf prüfen:\n\n✅ Schloss-Symbol in der Adresszeile?\n✅ Adresse beginnt mit https://?✅ Shop bekannt und seriös?\n\nWenn du dir nicht sicher bist: Lieber im Laden kaufen oder Eltern fragen.' },
    { emoji:'🎣', title:'Phishing — was ist das?', text:'Phishing = Betrüger schicken eine E-Mail, die aussieht wie von deiner Bank. Ziel: dein Passwort stehlen.\n\n🚨 Wichtigste Regel:\nEchte Banken fragen NIE per E-Mail oder SMS nach deinem Passwort!\n\nSolche Nachrichten immer sofort löschen.' }
  ]},
  { id:3, emoji:'💼', title:'Mein erster Lohn', subtitle:'5 Karten · ca. 4 Min', cards:[
    { emoji:'🎉', title:'Du verdienst jetzt Geld!', text:'Du hast eine Lehrstelle oder deinen ersten Job — herzlichen Glückwunsch! Ab jetzt kommt jeden Monat Geld auf dein Konto.\n\nDas ist ein riesiger Schritt. Aber mit Lohn kommen auch neue Fragen: Was sind das für Abzüge? Wie plane ich damit?' },
    { emoji:'💸', title:'Brutto vs. Netto', text:'Auf deinem Lohnzettel stehen zwei wichtige Zahlen:\n\n💰 Bruttolohn = Was dein Chef zahlt\n🏦 Nettolohn = Was auf deinem Konto ankommt\n\nDer Unterschied? Sozialabgaben wie AHV werden direkt abgezogen. Als Lehrling sind diese noch klein.' },
    { emoji:'🧓', title:'Was ist die AHV?', text:'AHV = Alters- und Hinterlassenenversicherung.\n\nEin kleiner Teil deines Lohns geht in einen gemeinsamen Topf. Wenn du später alt bist (Rentenalter: 65 Jahre), bekommst du daraus eine Rente.\n\nDu sorgst heute schon für dich — ohne es gross zu merken!' },
    { emoji:'📊', title:'Dein erstes Budget', text:'Budget = Einnahmen minus Ausgaben.\n\nBeispiel Lehrjahr 1 (ca. CHF 700 Netto):\n🏦 Sparen 10%: CHF 70\n📱 Handy-Abo: CHF 30\n🚌 ÖV-Abo: CHF 50\n🎉 Freizeit: CHF 100\n📦 Reserve: Rest\n\nWer früh budgetiert, hat immer genug.' },
    { emoji:'🏆', title:'Der 10%-Trick', text:'Die goldene Spar-Regel:\n\n👉 Spare 10% deines Lohns BEVOR du irgendwas kaufst.\n\nSo geht\'s: Richte einen Dauerauftrag ein. Am Zahltag wandern automatisch 10% aufs Sparkonto.\n\nNach 1 Lehrjahr = ca. CHF 840 gespart. Ohne nachzudenken!' }
  ]},
  { id:4, emoji:'🚀', title:'Grosse Ziele', subtitle:'4 Karten · ca. 3 Min', cards:[
    { emoji:'🎯', title:'Wofür sparst du?', text:'Grosse Ziele brauchen Zeit — und Planung. Überlege dir: Was willst du dir in 1-2 Jahren gönnen?\n\n🛵 Töff-Führerschein?\n✈️ Ferien mit Freunden?\n💻 Eigener Laptop?\n\nEin klares Ziel macht Sparen viel leichter. Du weisst, wofür!' },
    { emoji:'📈', title:'Zinseszins — Geld, das Geld verdient', text:'Stell dir vor: Du sparst CHF 50 pro Monat bei 2% Zins.\n\nNach 5 Jahren hast du:\n💰 Eingezahlt: CHF 3\'000\n🎁 Zins extra: CHF 150\n✨ Total: CHF 3\'150\n\nJe früher du anfängst, desto mehr wächst dein Geld. Zeit ist dein grösster Freund.' },
    { emoji:'🛡️', title:'Notfallreserve', text:'Manchmal passiert etwas Unerwartetes:\n📱 Handy kaputt\n🏥 Arztrechnung\n🚲 Velo braucht Reparatur\n\nWer 1-2 Monatslöhne als Reserve hat, kann solche Situationen ohne Stress meistern. Diese Reserve macht dich unabhängig.' },
    { emoji:'🌟', title:'Du bist bereit!', text:'Du hast alle 5 Kapitel durchgearbeitet — Respekt!\n\nDu weisst jetzt:\n✅ Was Geld ist und woher es kommt\n✅ Wie dein Konto funktioniert\n✅ Wie du sicher und clever bezahlst\n✅ Was dein Lohn bedeutet\n✅ Wie du grosse Ziele erreichst\n\nDas ist echtes Finanzwissen. Für\'s Leben! 🎓' }
  ]}
];
var learnChapterProgress = [0, 0, 0, 0, 0];
var currentChapterIdx = -1;
var currentCardIdx = 0;

function openLearnModule(n) {
  // Legacy: map old module index to nearest chapter
  openChapter(Math.min(n, learnChapters.length - 1));
}

/* ── Chapter path renderer ──────────────────────────────────────── */
function renderLearnChapters() {
  var container = document.getElementById('learn-chapters-container');
  if (!container) return;
  var totalDone = 0;
  for (var i = 0; i < learnChapters.length; i++) {
    if ((learnChapterProgress[i] || 0) >= learnChapters[i].cards.length) totalDone++;
  }
  var bar = document.getElementById('learn-total-bar');
  var lbl = document.getElementById('learn-total-label');
  if (bar) bar.style.width = (totalDone / learnChapters.length * 100) + '%';
  if (lbl) lbl.textContent = totalDone + ' / ' + learnChapters.length + ' Kapitel';

  container.innerHTML = learnChapters.map(function(ch, i) {
    var prog     = learnChapterProgress[i] || 0;
    var total    = ch.cards.length;
    var isDone   = prog >= total;
    var isLocked = i > 0 && (learnChapterProgress[i-1] || 0) < learnChapters[i-1].cards.length;
    var isInProg = !isDone && !isLocked && prog > 0;

    var cls = isDone ? 'done' : (isLocked ? 'locked' : (isInProg ? 'inprog' : ''));
    var badgeText  = isDone ? 'Abgeschlossen' : (isLocked ? 'Gesperrt' : (isInProg ? 'In Bearbeitung' : 'Neu'));
    var pct  = isDone ? 100 : Math.round(prog / total * 100);
    var onclick = isLocked ? "showToast('Schliesse zuerst das vorherige Kapitel ab')" : 'openChapter(' + i + ')';

    // "Starten →" button only for unlocked, non-done cards
    var startBtn = '';
    if (!isLocked && !isDone) {
      startBtn = '<button onclick="event.stopPropagation();openChapter(' + i + ')" style="margin-top:8px;padding:6px 14px;background:#E30613;color:white;border:none;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">Starten \u2192</button>';
    }

    return (
      '<div class="chapter-card ' + cls + '" onclick="' + onclick + '">' +
        '<div class="chapter-inner">' +
          (function(){
            var cc = CHAPTER_COLORS[i] || { bg:'#F4F4F4', c:'#6B6B6B' };
            var bg = isLocked ? '#F4F4F4' : cc.bg;
            var extra = isLocked ? 'opacity:.4;' : '';
            return '<div class="chapter-icon-wrap" style="background:'+bg+';'+extra+'font-size:20px">'+ch.emoji+'</div>';
          })() +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:#6B6B6B;margin-bottom:2px">Kapitel ' + (i+1) + '</div>' +
            '<div style="font-size:14px;font-weight:600;color:#1A1A1A;letter-spacing:-.2px">' + ch.title + '</div>' +
            '<div class="chapter-progress-row">' +
              '<div class="chapter-bar-bg"><div class="chapter-bar-fill" style="width:' + pct + '%"></div></div>' +
              '<span class="chapter-bar-label">' + prog + ' / ' + total + '</span>' +
            '</div>' +
            startBtn +
          '</div>' +
          '<div class="chapter-tag">' + badgeText + '</div>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

function openChapter(idx) {
  currentChapterIdx = idx;
  currentCardIdx    = learnChapterProgress[idx] || 0;
  if (currentCardIdx >= learnChapters[idx].cards.length) currentCardIdx = 0;
  var panel = document.getElementById('lesson-panel');
  if (panel) panel.classList.add('open');
  showLessonCard();
}

function closeLesson() {
  var panel = document.getElementById('lesson-panel');
  if (panel) panel.classList.remove('open');
  renderLearnChapters();
  updateHomeLearnMission();
}

function showLessonCard() {
  var ch    = learnChapters[currentChapterIdx];
  var card  = ch.cards[currentCardIdx];
  var total = ch.cards.length;
  var isLast = (currentCardIdx === total - 1);

  var counter = document.getElementById('lesson-counter');
  if (counter) counter.textContent = ch.emoji + ' Karte ' + (currentCardIdx + 1) + ' von ' + total;

  var dotsEl = document.getElementById('lesson-pdots');
  if (dotsEl) {
    dotsEl.innerHTML = ch.cards.map(function(_, i) {
      var dc = i < currentCardIdx ? 'done' : (i === currentCardIdx ? 'active' : '');
      return '<div class="lesson-pdot ' + dc + '"></div>';
    }).join('');
  }

  var body = document.getElementById('lesson-body');
  if (body) {
    body.innerHTML =
      '<div class="lesson-emoji">' + card.emoji + '</div>' +
      '<div class="lesson-title">' + card.title + '</div>' +
      '<div class="lesson-text">' + card.text.replace(/\n/g, '<br>') + '</div>';
  }

  var btn = document.getElementById('lesson-btn');
  if (btn) {
    btn.textContent = isLast ? 'Kapitel abschliessen ✓' : 'Weiter →';
    btn.className   = isLast ? 'lesson-btn finish' : 'lesson-btn';
  }
}

function advanceLessonCard() {
  var ch    = learnChapters[currentChapterIdx];
  var total = ch.cards.length;
  var isLast = (currentCardIdx === total - 1);

  if (currentCardIdx + 1 > (learnChapterProgress[currentChapterIdx] || 0)) {
    learnChapterProgress[currentChapterIdx] = currentCardIdx + 1;
  }

  if (isLast) {
    learnChapterProgress[currentChapterIdx] = total;
    state.xp = (state.xp || 0) + 20;
    save();
    updateGamification();
    closeLesson();
    showToast('🎉 Kapitel abgeschlossen! +20 XP');
  } else {
    currentCardIdx++;
    learnChapterProgress[currentChapterIdx] = Math.max(learnChapterProgress[currentChapterIdx] || 0, currentCardIdx);
    var body = document.getElementById('lesson-body');
    if (body) {
      body.style.opacity = '0';
      body.style.transform = 'translateX(30px)';
    }
    setTimeout(function() {
      showLessonCard();
      if (body) { body.style.opacity = '1'; body.style.transform = 'translateX(0)'; }
    }, 120);
  }
}

function updateHomeLearnMission() {
  var mChapter = document.getElementById('home-mission-chapter');
  var mTitle   = document.getElementById('home-mission-title');
  var mSub     = document.getElementById('home-mission-sub');
  if (!mTitle) return;
  for (var i = 0; i < learnChapters.length; i++) {
    var prog = learnChapterProgress[i] || 0;
    if (prog < learnChapters[i].cards.length) {
      var ch = learnChapters[i];
      if (mChapter) mChapter.textContent = 'Kapitel ' + (i + 1) + (prog > 0 ? ' · weitermachen' : '');
      mTitle.textContent = ch.title;
      mSub.textContent   = ch.cards.length + ' Karten · ' + ch.subtitle.split('·')[1].trim();
      return;
    }
  }
  if (mChapter) mChapter.textContent = 'Abgeschlossen 🎓';
  mTitle.textContent = 'Alle Kapitel fertig!';
  mSub.textContent   = 'Du bist ein Finanz-Profi 🌟';
}

function goToNextLesson() {
  for (var i = 0; i < learnChapters.length; i++) {
    if ((learnChapterProgress[i] || 0) < learnChapters[i].cards.length) {
      switchYouthView('learn');
      var idx = i;
      setTimeout(function() { openChapter(idx); }, 120);
      return;
    }
  }
  switchYouthView('learn');
}

/* ── Steps renderer ───────────────────────────────────── */
function renderLearnSteps(body, mod, n) {
  mod.steps.forEach(function(step, i) {
    var done = learnProgress[n] > i;
    var div = document.createElement('div');
    div.style.cssText = 'background:'+(done?'#f0fdf4':'white')+';border:1.5px solid '+(done?'#16a34a':'#e2e8f0')+';border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer;';
    div.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">' +
        '<div style="width:40px;height:40px;background:#F4F4F4;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">' + (step.icon||'📖') + '</div>' +
        '<span style="font-size:13px;font-weight:700;color:'+(done?'#16a34a':'var(--red)')+'">Schritt '+(i+1)+' / '+mod.steps.length+'</span>' +
        (done ? '<span style="margin-left:auto;color:#16a34a;font-weight:700">✓</span>' : '') +
      '</div>' +
      '<div style="font-size:14px;font-weight:700;color:var(--dark);margin-bottom:6px">' + step.q + '</div>' +
      '<div style="font-size:13px;color:var(--slate);line-height:1.6">' + step.a + '</div>' +
      (!done ? '<div style="margin-top:10px;padding:8px 14px;background:var(--red);color:white;border-radius:8px;text-align:center;font-size:13px;font-weight:700">Verstanden ✓</div>' : '');
    if (!done) {
      div.onclick = function() {
        if (learnProgress[n] <= i) learnProgress[n] = i + 1;
        updateLearnProgress(n); openLearnModule(n); updateGamification();
      };
    }
    body.appendChild(div);
  });
}

/* ── Calculator renderer (Zinseszins) ─────────────────── */
function renderLearnCalculator(body, mod, n) {
  body.innerHTML =
    '<div style="font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:14px">' + mod.intro + '</div>' +
    mod.facts.map(function(f){
      return '<div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:10px;padding:10px 12px;background:white;border-radius:10px;border:1px solid var(--border)">' +
        '<span style="font-size:20px;flex-shrink:0">' + f.icon + '</span>' +
        '<span style="font-size:13px;color:var(--slate);line-height:1.5">' + f.text + '</span></div>';
    }).join('') +
    '<div style="background:white;border-radius:12px;border:1.5px solid var(--border);padding:16px;margin-top:6px">' +
      '<div style="font-size:13px;font-weight:700;color:var(--dark);margin-bottom:12px">🧮 Zinseszins-Rechner</div>' +
      '<label style="font-size:12px;color:var(--mid);font-weight:600">Startbetrag (CHF)</label>' +
      '<input id="lc-betrag" type="number" value="500" min="10" max="100000" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-size:15px;font-weight:700;margin:4px 0 12px;font-family:var(--font)">' +
      '<label style="font-size:12px;color:var(--mid);font-weight:600">Monatlich sparen (CHF)</label>' +
      '<input id="lc-monat" type="number" value="50" min="0" max="10000" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-size:15px;font-weight:700;margin:4px 0 12px;font-family:var(--font)">' +
      '<label style="font-size:12px;color:var(--mid);font-weight:600">Jahre: <span id="lc-jahre-label">10</span></label>' +
      '<input id="lc-jahre" type="range" min="1" max="40" value="10" style="width:100%;accent-color:var(--red);margin:4px 0 14px" oninput="calcZinseszins()">' +
      '<div id="lc-result" style="background:var(--bg);border-radius:10px;padding:12px;text-align:center"></div>' +
    '</div>' +
    '<button onclick="markLearnDone(' + n + ')" style="width:100%;margin-top:14px;padding:12px;background:var(--red);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font)">Verstanden — weiter ✓</button>';
  setTimeout(calcZinseszins, 50);
}

function calcZinseszins() {
  var b   = parseFloat(document.getElementById('lc-betrag').value)||0;
  var m   = parseFloat(document.getElementById('lc-monat').value)||0;
  var j   = parseInt(document.getElementById('lc-jahre').value)||1;
  var r   = document.getElementById('lc-result');
  var jl  = document.getElementById('lc-jahre-label');
  if (!r) return;
  if (jl) jl.textContent = j;
  var rate = 0.015 / 12; // 1.5% Jahresrendite (realistisch Sparkonto CH)
  var months = j * 12;
  var endwert = b * Math.pow(1 + rate, months) + m * ((Math.pow(1 + rate, months) - 1) / rate);
  var einbezahlt = b + m * months;
  var zinsen = endwert - einbezahlt;
  r.innerHTML =
    '<div style="font-size:11px;color:var(--mid);margin-bottom:8px">Nach <b>' + j + ' Jahren</b> bei 1.5% Zinsen p.a.</div>' +
    '<div style="display:flex;justify-content:space-around;margin-bottom:10px">' +
      '<div style="text-align:center"><div style="font-size:18px;font-weight:800;color:var(--ok)">CHF ' + Math.round(endwert).toLocaleString('de-CH') + '</div><div style="font-size:10px;color:var(--mid)">Endwert</div></div>' +
      '<div style="text-align:center"><div style="font-size:18px;font-weight:800;color:var(--petrol)">CHF ' + Math.round(zinsen).toLocaleString('de-CH') + '</div><div style="font-size:10px;color:var(--mid)">Zinsen 🎁</div></div>' +
    '</div>' +
    '<div style="height:10px;background:var(--border);border-radius:5px;overflow:hidden">' +
      '<div style="height:100%;background:linear-gradient(90deg,var(--petrol),var(--ok));border-radius:5px;width:' + Math.min(100,Math.round(zinsen/Math.max(endwert,1)*100)*3) + '%"></div>' +
    '</div>' +
    '<div style="font-size:11px;color:var(--mid);margin-top:5px">Davon ' + Math.round(zinsen/Math.max(endwert,1)*100) + '% Zinsen — gratis!</div>';
}

/* ── Pots renderer (Taschengeld) ──────────────────────── */
function renderLearnPots(body, mod, n) {
  body.innerHTML =
    '<div style="font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:12px">Gib dein <b>Taschengeld</b> ein und sieh wie es sich auf die 3 Töpfe verteilt:</div>' +
    '<input id="lp-betrag" type="number" value="100" min="1" max="10000" style="width:100%;padding:10px;border:1.5px solid var(--border);border-radius:8px;font-size:18px;font-weight:700;margin-bottom:14px;font-family:var(--font);text-align:center" oninput="renderPots()">' +
    '<div id="lp-pots"></div>' +
    '<div style="margin-top:10px;padding:10px 12px;background:var(--bg);border-radius:8px;font-size:11px;color:var(--mid);line-height:1.5">' +
      '📚 Quelle: Pro Juventute, Budgetberatung Schweiz, PostFinance & CFPB-Forschung. Schweizer Jugendliche sparen spontan 20–50% ihres Taschengeldes.' +
    '</div>' +
    '<button onclick="markLearnDone(' + n + ')" style="width:100%;margin-top:14px;padding:12px;background:var(--red);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font)">Verstanden — weiter ✓</button>';
  window._potsData = mod.pots;
  setTimeout(renderPots, 50);
}

function renderPots() {
  var betrag = parseFloat(document.getElementById('lp-betrag').value)||0;
  var container = document.getElementById('lp-pots');
  if (!container || !window._potsData) return;
  container.innerHTML = window._potsData.map(function(p){
    var chf = Math.round(betrag * p.pct / 100 * 10) / 10;
    return '<div style="margin-bottom:10px;padding:12px 14px;background:white;border-radius:10px;border:1.5px solid '+ p.color +';box-shadow:0 2px 8px rgba(0,0,0,.06)">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
        '<span style="font-size:14px;font-weight:700;color:var(--dark)">' + p.label + '</span>' +
        '<span style="font-size:16px;font-weight:800;color:' + p.color + '">CHF ' + chf.toLocaleString('de-CH') + '</span>' +
      '</div>' +
      '<div style="height:12px;background:var(--bg);border-radius:6px;overflow:hidden;margin-bottom:5px">' +
        '<div style="height:100%;background:' + p.color + ';border-radius:6px;width:' + p.pct + '%;transition:width .5s"></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between">' +
        '<span style="font-size:11px;color:var(--mid)">' + p.desc + '</span>' +
        '<span style="font-size:11px;font-weight:700;color:' + p.color + '">' + p.pct + '%</span>' +
      '</div>' +
    '</div>';
  }).join('');
}

/* ── Quiz renderer ────────────────────────────────────── */
function renderLearnQuiz(body, mod, n) {
  var state_quiz = { current:0, score:0, answered:[] };
  window._quizState = state_quiz;
  window._quizMod = mod;
  window._quizN = n;
  renderQuizQuestion(body, 0);
}

function renderQuizQuestion(body, qi) {
  var mod = window._quizMod;
  var q = mod.questions[qi];
  var total = mod.questions.length;
  body.innerHTML =
    '<div style="font-size:11px;font-weight:700;color:var(--mid);margin-bottom:12px">Frage ' + (qi+1) + ' von ' + total + '</div>' +
    '<div style="font-size:15px;font-weight:700;color:var(--dark);margin-bottom:14px;line-height:1.4">' + q.q + '</div>' +
    q.options.map(function(opt, i){
      return '<button onclick="answerQuiz(' + i + ')" style="width:100%;padding:12px 14px;margin-bottom:8px;background:white;border:1.5px solid var(--border);border-radius:10px;font-size:13px;font-weight:600;color:var(--dark);text-align:left;cursor:pointer;font-family:var(--font)">' +
        ['A','B','C','D'][i] + ') ' + opt + '</button>';
    }).join('');
}

function answerQuiz(chosen) {
  var mod = window._quizMod;
  var qi  = window._quizState.current;
  var q   = mod.questions[qi];
  var body = document.getElementById('learn-modal-body');
  var correct = chosen === q.correct;
  if (correct) window._quizState.score++;
  body.innerHTML =
    '<div style="padding:14px;background:' + (correct?'#f0fdf4':'#fff0f0') + ';border-radius:12px;margin-bottom:12px;border:1.5px solid ' + (correct?'#16a34a':'var(--red)') + '">' +
      '<div style="font-size:20px;margin-bottom:6px">' + (correct?'✅':'❌') + ' ' + (correct?'Richtig!':'Leider falsch.') + '</div>' +
      '<div style="font-size:13px;color:var(--slate);line-height:1.5">' + q.explain + '</div>' +
    '</div>' +
    '<button onclick="nextQuizQuestion()" style="width:100%;padding:12px;background:var(--red);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font)">' +
      (qi+1 < mod.questions.length ? 'Nächste Frage →' : 'Ergebnis sehen →') +
    '</button>';
}

function nextQuizQuestion() {
  var mod  = window._quizMod;
  var body = document.getElementById('learn-modal-body');
  window._quizState.current++;
  if (window._quizState.current < mod.questions.length) {
    renderQuizQuestion(body, window._quizState.current);
  } else {
    var score = window._quizState.score;
    var total = mod.questions.length;
    var perfect = score === total;
    body.innerHTML =
      '<div style="text-align:center;padding:20px 10px">' +
        '<div style="width:56px;height:56px;background:#F4F4F4;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 10px">' + (perfect?'🏆':(score>=1?'⭐':'💪')) + '</div>' +
        '<div style="font-size:20px;font-weight:800;color:var(--dark);margin-bottom:6px">' + score + ' / ' + total + ' richtig</div>' +
        '<div style="font-size:13px;color:var(--mid);margin-bottom:16px">' + (perfect?'Perfekt! Du hast alles verstanden.':'Gut versucht! Schau dir die Erklärungen nochmal an.') + '</div>' +
      '</div>' +
      '<button onclick="markLearnDone(' + window._quizN + ')" style="width:100%;padding:12px;background:var(--ok);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font)">Modul abschliessen ✓</button>';
  }
}

/* ── Twint renderer ───────────────────────────────────── */
function renderLearnTwint(body, mod, n) {
  window._twintBalance = 80;
  window._twintN = n;
  renderTwintScreen(body);
}

function renderTwintScreen(body) {
  if (!body) body = document.getElementById('learn-modal-body');
  var mod = learnData[window._twintN];
  body.innerHTML =
    '<div style="background:linear-gradient(135deg,#00a0e4,#0070b0);border-radius:14px;padding:16px;color:white;margin-bottom:14px;text-align:center">' +
      '<div style="font-size:12px;opacity:.8;margin-bottom:4px">Twint-Guthaben</div>' +
      '<div style="font-size:32px;font-weight:800">CHF ' + window._twintBalance.toFixed(2) + '</div>' +
    '</div>' +
    '<div style="font-size:13px;font-weight:700;color:var(--dark);margin-bottom:10px">Tippe auf einen Artikel zum Bezahlen:</div>' +
    mod.items.map(function(item, i){
      return '<button onclick="twintPay(' + i + ')" style="width:100%;display:flex;justify-content:space-between;align-items:center;padding:12px 14px;margin-bottom:8px;background:white;border:1.5px solid var(--border);border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:var(--font);color:var(--dark)">' +
        '<span>' + item.name + '</span><span style="color:var(--red)">CHF ' + item.price.toFixed(2) + ' zahlen</span></button>';
    }).join('') +
    '<button onclick="markLearnDone(' + window._twintN + ')" style="width:100%;margin-top:6px;padding:10px;background:var(--bg);color:var(--mid);border:1px solid var(--border);border-radius:10px;font-size:13px;cursor:pointer;font-family:var(--font)">Modul abschliessen ✓</button>';
}

function twintPay(i) {
  var mod = learnData[window._twintN];
  var item = mod.items[i];
  var body = document.getElementById('learn-modal-body');
  if (window._twintBalance < item.price) {
    body.innerHTML = '<div style="text-align:center;padding:20px"><div style="width:56px;height:56px;background:#F4F4F4;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 10px">😬</div><div style="font-size:16px;font-weight:700;color:var(--red);margin:10px 0">Nicht genug Guthaben!</div><div style="font-size:13px;color:var(--mid)">So fühlt es sich an, wenn das Konto leer ist. Darum ist sparen wichtig!</div></div>' +
      '<button onclick="renderTwintScreen()" style="width:100%;margin-top:12px;padding:12px;background:var(--red);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font)">Zurück ←</button>';
    return;
  }
  window._twintBalance -= item.price;
  body.innerHTML =
    '<div style="text-align:center;padding:20px">' +
      '<div style="width:56px;height:56px;background:#EAF3DE;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 10px">✅</div>' +
      '<div style="font-size:16px;font-weight:700;color:var(--ok);margin-bottom:6px">Zahlung erfolgreich!</div>' +
      '<div style="font-size:20px;font-weight:800;color:var(--dark);margin-bottom:4px">' + item.name + '</div>' +
      '<div style="font-size:14px;color:var(--red);margin-bottom:10px">- CHF ' + item.price.toFixed(2) + '</div>' +
      '<div style="font-size:13px;color:var(--mid)">Restguthaben: CHF ' + window._twintBalance.toFixed(2) + '</div>' +
    '</div>' +
    '<button onclick="renderTwintScreen()" style="width:100%;padding:12px;background:var(--red);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font)">Weiter zahlen →</button>';
}

/* ── Swipe renderer (Bedürfnis vs Wunsch) ─────────────── */
function renderLearnSwipe(body, mod, n) {
  window._swipeIdx   = 0;
  window._swipeScore = { need:0, want:0, wrong:0 };
  window._swipeN     = n;
  window._swipeMod   = mod;
  renderSwipeCard(body);
}

function renderSwipeCard(body) {
  if (!body) body = document.getElementById('learn-modal-body');
  var mod  = window._swipeMod;
  var idx  = window._swipeIdx;
  if (idx >= mod.cards.length) { renderSwipeResult(body); return; }
  var card = mod.cards[idx];
  body.innerHTML =
    '<div style="font-size:11px;font-weight:700;color:var(--mid);text-align:center;margin-bottom:10px">' + (idx+1) + ' / ' + mod.cards.length + '</div>' +
    '<div style="background:white;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.12);padding:30px 20px;text-align:center;margin-bottom:16px;min-height:120px;display:flex;align-items:center;justify-content:center">' +
      '<div style="font-size:20px;font-weight:700;color:var(--dark)">' + card.item + '</div>' +
    '</div>' +
    '<div style="display:flex;gap:10px">' +
      '<button onclick="swipeAnswer(\'want\')" style="flex:1;padding:14px;background:#fff0f0;border:2px solid var(--red);border-radius:12px;font-size:14px;font-weight:700;color:var(--red);cursor:pointer;font-family:var(--font)">❌ Wunsch</button>' +
      '<button onclick="swipeAnswer(\'need\')" style="flex:1;padding:14px;background:#f0fdf4;border:2px solid #16a34a;border-radius:12px;font-size:14px;font-weight:700;color:#16a34a;cursor:pointer;font-family:var(--font)">✅ Bedürfnis</button>' +
    '</div>';
}

function swipeAnswer(answer) {
  var mod  = window._swipeMod;
  var idx  = window._swipeIdx;
  var card = mod.cards[idx];
  var correct = answer === card.type;
  if (correct) window._swipeScore[card.type]++;
  else window._swipeScore.wrong++;
  var body = document.getElementById('learn-modal-body');
  body.innerHTML =
    '<div style="background:' + (correct?'#f0fdf4':'#fff0f0') + ';border-radius:12px;padding:16px;margin-bottom:12px;border:1.5px solid ' + (correct?'#16a34a':'var(--red)') + '">' +
      '<div style="font-size:20px;margin-bottom:6px">' + (correct?'✅ Richtig!':'❌ Falsch') + '</div>' +
      '<div style="font-size:13px;color:var(--slate);line-height:1.5">' + card.explain + '</div>' +
    '</div>' +
    '<button onclick="swipeNext()" style="width:100%;padding:12px;background:var(--red);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font)">Weiter →</button>';
}

function swipeNext() {
  window._swipeIdx++;
  renderSwipeCard(document.getElementById('learn-modal-body'));
}

function renderSwipeResult(body) {
  var total = window._swipeMod.cards.length;
  var correct = total - window._swipeScore.wrong;
  body.innerHTML =
    '<div style="text-align:center;padding:16px">' +
      '<div style="width:56px;height:56px;background:#F4F4F4;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto">' + (correct===total?'🏆':(correct>=total*0.7?'⭐':'💪')) + '</div>' +
      '<div style="font-size:20px;font-weight:800;color:var(--dark);margin:10px 0">' + correct + ' / ' + total + ' richtig</div>' +
      '<div style="font-size:13px;color:var(--mid)">Du erkennst Bedürfnisse und Wünsche!</div>' +
    '</div>' +
    '<button onclick="markLearnDone(' + window._swipeN + ')" style="width:100%;margin-top:10px;padding:12px;background:var(--ok);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font)">Abschliessen ✓</button>';
}

/* ── Phishing renderer ────────────────────────────────── */
function renderLearnPhishing(body, mod, n) {
  window._phishN   = n;
  window._phishMod = mod;
  window._phishIdx = 0;
  window._phishScore = 0;
  renderPhishingEmail(body);
}

function renderPhishingEmail(body) {
  if (!body) body = document.getElementById('learn-modal-body');
  var mod  = window._phishMod;
  var idx  = window._phishIdx;
  if (idx >= mod.emails.length) { renderPhishingResult(body); return; }
  var email = mod.emails[idx];
  body.innerHTML =
    '<div style="font-size:11px;font-weight:700;color:var(--mid);margin-bottom:10px">E-Mail ' + (idx+1) + ' von ' + mod.emails.length + ' — Echt oder Fake?</div>' +
    '<div style="background:white;border:1.5px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:14px">' +
      '<div style="padding:10px 12px;background:var(--bg);border-bottom:1px solid var(--border)">' +
        '<div style="font-size:11px;color:var(--mid)">Von: <b>' + email.from + '</b></div>' +
        '<div style="font-size:12px;font-weight:700;color:var(--dark);margin-top:2px">' + email.subject + '</div>' +
      '</div>' +
      '<div style="padding:12px;font-size:13px;color:var(--slate);line-height:1.6">' + email.body + '</div>' +
    '</div>' +
    '<div style="display:flex;gap:10px">' +
      '<button onclick="phishingAnswer(true)" style="flex:1;padding:14px;background:#fff0f0;border:2px solid var(--red);border-radius:12px;font-size:14px;font-weight:700;color:var(--red);cursor:pointer;font-family:var(--font)">⚠️ Fake!</button>' +
      '<button onclick="phishingAnswer(false)" style="flex:1;padding:14px;background:#f0fdf4;border:2px solid #16a34a;border-radius:12px;font-size:14px;font-weight:700;color:#16a34a;cursor:pointer;font-family:var(--font)">✅ Echt</button>' +
    '</div>';
}

function phishingAnswer(guessedFake) {
  var email = window._phishMod.emails[window._phishIdx];
  var correct = guessedFake === email.isFake;
  if (correct) window._phishScore++;
  var body = document.getElementById('learn-modal-body');
  body.innerHTML =
    '<div style="background:' + (correct?'#f0fdf4':'#fff0f0') + ';border-radius:12px;padding:16px;margin-bottom:12px;border:1.5px solid ' + (correct?'#16a34a':'var(--red)') + '">' +
      '<div style="font-size:20px;margin-bottom:6px">' + (correct?'✅ Richtig!':'❌ Vorsicht!') + ' Diese E-Mail ist <b>' + (email.isFake?'GEFÄLSCHT':'ECHT') + '</b>.</div>' +
      '<div style="font-size:13px;color:var(--slate);line-height:1.5">' + email.explain + '</div>' +
    '</div>' +
    '<button onclick="phishingNext()" style="width:100%;padding:12px;background:var(--red);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font)">Weiter →</button>';
}

function phishingNext() {
  window._phishIdx++;
  renderPhishingEmail(document.getElementById('learn-modal-body'));
}

function renderPhishingResult(body) {
  var total = window._phishMod.emails.length;
  body.innerHTML =
    '<div style="text-align:center;padding:16px">' +
      '<div style="width:56px;height:56px;background:#F4F4F4;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto">' + (window._phishScore===total?'🕵️':'🔍') + '</div>' +
      '<div style="font-size:20px;font-weight:800;color:var(--dark);margin:10px 0">' + window._phishScore + ' / ' + total + ' erkannt</div>' +
      '<div style="font-size:13px;color:var(--mid)">Du bist jetzt ein Phishing-Detektor!</div>' +
    '</div>' +
    '<button onclick="markLearnDone(' + window._phishN + ')" style="width:100%;margin-top:10px;padding:12px;background:var(--ok);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font)">Abschliessen ✓</button>';
}

/* ── Lohn renderer ────────────────────────────────────── */
function renderLearnLohn(body, mod, n) {
  window._lohnN = n;
  body.innerHTML =
    '<div style="font-size:13px;color:var(--slate);line-height:1.6;margin-bottom:12px">Stell dir vor du arbeitest als Lehrling. Passe die Stunden an und sieh was auf deinem Konto landet:</div>' +
    '<div style="background:white;border-radius:12px;border:1.5px solid var(--border);padding:16px">' +
      '<label style="font-size:12px;color:var(--mid);font-weight:600">Stundenlohn: CHF ' + mod.stundenLohn.toFixed(2) + '</label>' +
      '<br><label style="font-size:12px;color:var(--mid);font-weight:600;margin-top:10px;display:block">Stunden/Monat: <span id="ll-stunden-label">160</span></label>' +
      '<input id="ll-stunden" type="range" min="20" max="200" value="160" style="width:100%;accent-color:var(--red);margin:4px 0 14px" oninput="calcLohn(' + n + ')">' +
      '<div id="ll-result"></div>' +
    '</div>' +
    '<button onclick="markLearnDone(' + n + ')" style="width:100%;margin-top:14px;padding:12px;background:var(--red);color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font)">Verstanden — weiter ✓</button>';
  setTimeout(function(){ calcLohn(n); }, 50);
}

function calcLohn(n) {
  var mod     = learnData[n];
  var stunden = parseInt(document.getElementById('ll-stunden').value)||160;
  var lbl     = document.getElementById('ll-stunden-label');
  if (lbl) lbl.textContent = stunden;
  var brutto  = stunden * mod.stundenLohn;
  var ahv     = brutto * 0.053;  // AHV/IV/EO ~5.3%
  var alv     = brutto * 0.011;  // ALV 1.1%
  var netto   = brutto - ahv - alv;
  var r = document.getElementById('ll-result');
  if (!r) return;
  r.innerHTML =
    '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">' +
      '<span style="font-size:13px;color:var(--mid)">Bruttolohn</span>' +
      '<span style="font-size:14px;font-weight:700;color:var(--dark)">CHF ' + Math.round(brutto).toLocaleString('de-CH') + '</span>' +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">' +
      '<span style="font-size:13px;color:var(--mid)">- AHV/IV/EO (5.3%)</span>' +
      '<span style="font-size:13px;color:var(--red)">- CHF ' + Math.round(ahv).toLocaleString('de-CH') + '</span>' +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">' +
      '<span style="font-size:13px;color:var(--mid)">- ALV (1.1%)</span>' +
      '<span style="font-size:13px;color:var(--red)">- CHF ' + Math.round(alv).toLocaleString('de-CH') + '</span>' +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;padding:10px 0 0">' +
      '<span style="font-size:14px;font-weight:700;color:var(--dark)">💰 Nettolohn</span>' +
      '<span style="font-size:16px;font-weight:800;color:var(--ok)">CHF ' + Math.round(netto).toLocaleString('de-CH') + '</span>' +
    '</div>';
}

/* ── Shared: mark module done ─────────────────────────── */
function markLearnDone(n) {
  learnProgress[n] = learnData[n].steps ? learnData[n].steps.length : 1;
  updateLearnProgress(n);
  closeLearnModal();
  updateGamification();
  showToast('Modul abgeschlossen! 🎉');
}

function closeLearnModal() {
  var modal = document.getElementById('learn-modal');
  if (modal) modal.style.display = 'none';
}

function updateLearnProgress(n) {
  var bar   = document.getElementById('learn-mod-'+n+'-bar');
  var label = document.getElementById('learn-mod-'+n+'-label');
  if (!bar || !label) return;
  var total = learnData[n].steps ? learnData[n].steps.length : 1;
  var done  = Math.min(learnProgress[n], total);
  var pct   = Math.round(done / total * 100);
  bar.style.width = pct + '%';
  if (done === 0)    { label.textContent = 'Noch nicht gestartet'; bar.style.background = 'var(--red)'; }
  else if (pct >= 100){ label.textContent = '✓ Abgeschlossen 🎉'; bar.style.background = '#16a34a'; }
  else               { label.textContent = done + ' / ' + total + ' Schritte'; }
}

function switchYouthView(name) {
  // show learn view
  document.querySelectorAll('.view').forEach(function(v){ v.classList.remove('active'); });
  var v = document.getElementById('view-' + name);
  if (v) v.classList.add('active');
  document.querySelectorAll('#youth-nav .nav-btn').forEach(function(b){ b.classList.remove('active'); });
  var yn1 = document.getElementById('ynav1');
  if (yn1) yn1.classList.add('active');
  currentView = name;
  var sa = document.querySelector('#view-learn .scroll-area');
  if (sa) sa.scrollTop = 0;
}

function applyMode(mode) {
  var app = document.getElementById('app');
  var badge = document.getElementById('mode-badge'); // null after removal, safe
  if (mode === 'youth') {
    app.classList.add('mode-youth');
    app.classList.remove('mode-adult');
    if (badge) badge.textContent = 'Unter 18 🎮';
    // If currently on an adult-only view, go home
    var adultOnlyViews = ['haxx','budget','finlit','invest'];
    if (adultOnlyViews.indexOf(currentView) > -1) switchView('home', 0);
  } else {
    app.classList.add('mode-adult');
    app.classList.remove('mode-youth');
    if (badge) badge.textContent = '18+ 💼';
    if (currentView === 'learn') switchView('home', 0);
  }
  state.mode = mode;
  save();
}

/* ================================================
   AGE / LIFECYCLE
================================================ */
var lifecycleStages = [
  { min: 12, max: 15, tag: 'Schüler / Kind', tip: 'Lerne Geld zu zählen: Taschengeld sinnvoll einteilen — Sparen, Ausgeben, Verschenken.' },
  { min: 16, max: 19, tag: 'Lehrling / Schüler', tip: 'Lehrlingslohn clever aufteilen: 10% direkt aufs Sparkonto. Du merkst es kaum — dein Konto schon.' },
  { min: 20, max: 23, tag: 'Berufseinsteiger', tip: 'Erster richtiger Lohn? Jetzt Dauerauftrag einrichten und Steuern nicht vergessen.' },
  { min: 24, max: 27, tag: 'Berufstätig', tip: 'Miete max. 25% des Nettolohns. Und: Lohnerhöhung = 50% sparen, 50% geniessen.' },
  { min: 28, max: 30, tag: 'Karriere / Aufbau', tip: 'Fondssparplan starten. Regelmässig investieren, Zinseszins arbeiten lassen.' },
];

function getStage(age) {
  for (var i = 0; i < lifecycleStages.length; i++) {
    var s = lifecycleStages[i];
    if (age >= s.min && age <= s.max) return s;
  }
  return lifecycleStages[lifecycleStages.length - 1];
}

function setAge(age) {
  state.age = age;

  var pct = ((age - 12) / (30 - 12)) * 100;
  document.getElementById('home-lifecycle-fill').style.width = pct + '%';

  var stage = getStage(age);
  document.getElementById('home-age-label').textContent = age;
  var lifecycleTag = document.getElementById('home-lifecycle-tag');
  if (lifecycleTag) lifecycleTag.textContent = stage.tag;
  
  document.getElementById('home-tip-text').textContent = stage.tip;

  var ageFromEl = document.getElementById('inv-age-from');
  if (ageFromEl) ageFromEl.textContent = age;

  // Säule 3a: nur ab 18 anzeigen
  var btn3a = document.getElementById('inv-btn-3a');
  if (btn3a) {
    btn3a.style.display = age < 18 ? 'none' : '';
    // Wenn unter 18 und aktuell auf 3a, zu 'frei' wechseln
    if (age < 18 && invState.type === '3a') setInvType('frei');
  }

  calcInvest();
  updateFkPhase();
  save();
  var newMode = (age < 18) ? 'youth' : 'adult';
  if (!state.mode || state.mode !== newMode) {
    applyMode(newMode);
    if (newMode === 'youth') showToast('🎮 Jugend-Modus aktiviert!');
    else showToast('💼 Erwachsenen-Modus aktiviert!');
  }
}

/* ================================================
   GOALS
================================================ */
var defaultGoalEmojis = ['🎯','✈️','🚴','🚗','💻','🎸','📱','🏠','💰','🎓','🌍','🛴'];

function applyGoalPreset(emoji, name) {
  state.selectedEmoji = emoji;
  document.getElementById('goal-name-input').value = name;
  renderEmojiPicker();
  // Preset-Button highlighten
  document.querySelectorAll('.goal-preset-btn').forEach(function(b) {
    b.classList.toggle('sel', b.textContent.trim().startsWith(emoji));
  });
}

function quickAddGoal(emoji, name, ziel) {
  for (var i = 0; i < state.goals.length; i++) {
    if (state.goals[i].name === name) {
      showToast('Ziel «' + name + '» existiert bereits!'); return;
    }
  }
  state.goals.push({ id: Date.now(), emoji: emoji, name: name, ziel: ziel, pct: 0 });
  save();
  renderGoals();
  updateGamification();
  showToast(emoji + ' «' + name + '» als Ziel hinzugefügt!');
}

function openGoalModal(idx) {
  state.editGoalIdx = (idx !== undefined) ? idx : -1;

  var modal = document.getElementById('goal-modal');
  var title = document.getElementById('modal-title');

  // Preset-Buttons zurücksetzen
  document.querySelectorAll('.goal-preset-btn').forEach(function(b){ b.classList.remove('sel'); });

  if (state.editGoalIdx >= 0) {
    var g = state.goals[state.editGoalIdx];
    title.textContent = 'Ziel bearbeiten';
    document.getElementById('goal-name-input').value = g.name;
    document.getElementById('goal-ziel-input').value = g.ziel || '';
    state.selectedEmoji = g.emoji;
  } else {
    title.textContent = 'Neues Sparziel';
    document.getElementById('goal-name-input').value = '';
    document.getElementById('goal-ziel-input').value = '';
    state.selectedEmoji = '🎯';
  }

  renderEmojiPicker();
  modal.classList.add('open');
}

function closeGoalModal(e) {
  if (!e || e.target === document.getElementById('goal-modal')) {
    document.getElementById('goal-modal').classList.remove('open');
  }
}

function renderEmojiPicker() {
  var html = '';
  defaultGoalEmojis.forEach(function(em) {
    html += '<div class="emoji-opt' + (state.selectedEmoji === em ? ' sel' : '') +
            '" onclick="selectEmoji(\'' + em + '\')">' + em + '</div>';
  });
  document.getElementById('emoji-picker').innerHTML = html;
}

function selectEmoji(em) {
  state.selectedEmoji = em;
  renderEmojiPicker();
}

function saveGoal() {
  var name = document.getElementById('goal-name-input').value.trim();
  var ziel = Math.max(1, parseInt(document.getElementById('goal-ziel-input').value) || 0);

  if (!name) { showToast('Bitte einen Namen eingeben'); return; }
  if (!ziel) { showToast('Bitte einen Betrag in CHF eingeben'); return; }

  var goal = { emoji: state.selectedEmoji, name: name, ziel: ziel };

  if (state.editGoalIdx >= 0) {
    // Bestehende id erhalten
    goal.id = state.goals[state.editGoalIdx].id || Date.now();
    state.goals[state.editGoalIdx] = goal;
    showToast('Ziel aktualisiert ✓');
  } else {
    goal.id = Date.now();
    state.goals.push(goal);
    showToast('Ziel gespeichert! 🎯');
  }

  document.getElementById('goal-modal').classList.remove('open');
  save();
  renderGoals();
  updateHomeCounts();
}

function deleteGoal(idx) {
  state.goals.splice(idx, 1);
  save();
  renderGoals();
  updateHomeCounts();
  showToast('Ziel gelöscht');
}

function fmtChf(n) {
  return Math.round(n).toLocaleString('de-CH');
}

/* ── Invest-Boost Konstanten & Hilfsfunktion ───────────────────── */
var INVEST_RATE   = 0.05;
var INVEST_MONTHS = 120;
function fvCalc(monthly, months, rate) {
  var r = rate / 12;
  return r === 0 ? monthly * months : monthly * ((Math.pow(1 + r, months) - 1) / r);
}

function onSparChange(val) {
  var n = Math.max(0, parseInt(val) || 0);
  state.sparGuthaben = n;
  document.getElementById('goals-spar-display').textContent = n.toLocaleString('de-CH');
  renderGoals();
  // Invest-Box «Freies Vermögen» live nachführen
  if (invState.type === 'frei') setInvType('frei');
  save();
}

function renderGoals() {
  var list  = document.getElementById('goals-list');
  var spar  = state.sparGuthaben;

  var mSpar = state.monatlichesSparbudget;
  var totalZiel = state.goals.reduce(function(s,g){ return s+(g.ziel||0); }, 0);

  // Gesamtfortschritt-Bar
  var pctBar  = document.getElementById('goals-pct-bar');
  var pctTot  = document.getElementById('goals-pct-total');
  var pctHint = document.getElementById('goals-pct-hint');
  if (pctBar) {
    var gesamtPct = totalZiel > 0 ? Math.min(100, Math.round(spar / totalZiel * 100)) : 0;
    var gespart   = Math.min(spar, totalZiel);
    pctTot.textContent = 'CHF ' + fmtChf(gespart) + ' / ' + fmtChf(totalZiel);
    pctBar.style.width = gesamtPct + '%';
    if (gesamtPct >= 100) {
      pctBar.style.background = 'var(--ok)';
      pctHint.textContent = '🎉 Alle Sparziele erreicht!';
    } else {
      pctBar.style.background = 'var(--red)';
      var fehlt = totalZiel - Math.min(spar, totalZiel);
      pctHint.textContent = 'Noch CHF ' + fmtChf(fehlt) + ' bis alle Ziele erreicht';
    }
  }

  if (state.goals.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:32px 16px;color:var(--light);font-size:13px">Noch keine Sparziele. Füge dein erstes Ziel hinzu! 🎯</div>';
    return;
  }

  var html = '';
  var cumulative = 0; // laufende Summe der Zielbeträge aller vorangehenden Ziele

  state.goals.forEach(function(g, i) {
    var target    = g.ziel || 0;
    var cumulSum  = cumulative + target; // kumulierter Zielbetrag bis und mit diesem Ziel

    // Zugeteiltes Guthaben: wie viel des heutigen Sparkontos dieses Ziel abdeckt
    var available = Math.max(0, spar - cumulative);
    var allocated = Math.min(available, target);
    var pct       = target > 0 ? Math.min(100, Math.round(allocated / target * 100)) : 0;
    var missing   = Math.max(0, target - allocated);
    var reached   = pct >= 100;

    // ── Kumulative Zeitprognose ──────────────────────────────────────────
    // Ziel i ist erreicht, wenn die kumulierten Ersparnisse >= cumulSum sind.
    // Monate von heute = ceil((cumulSum - spar) / mSpar)
    var timeHtml = '';
    if (!reached && mSpar > 0) {
      var monthsTotal = Math.ceil((cumulSum - spar) / mSpar);
      var timeLabel;
      if (monthsTotal <= 1) {
        timeLabel = '< 1 Mt.';
      } else if (monthsTotal < 12) {
        timeLabel = '~' + monthsTotal + ' Mt.';
      } else {
        var yrs  = Math.floor(monthsTotal / 12);
        var mths = monthsTotal % 12;
        timeLabel = '~' + yrs + ' J.' + (mths > 0 ? ' ' + mths + ' Mt.' : '');
      }
      timeHtml = '<div style="font-size:11px;color:var(--mid);margin-top:3px">⏱ in ' + timeLabel + ' erreicht <span style="color:var(--light)">(bei CHF ' + fmtChf(mSpar) + '/Mt.)</span></div>';
    } else if (!reached && mSpar === 0 && missing > 0) {
      timeHtml = '<div style="font-size:11px;color:var(--amber);margin-top:3px">💡 Sparrate im <b>Budgetrechner</b> setzen</div>';
    }

    html +=
      '<div class="goal-item" data-goal-idx="' + i + '" onclick="openGoalModal(' + i + ')">' +
        '<div class="goal-item-header">' +
          // Drag handle (links)
          '<button class="goal-drag-handle" ' +
            'ontouchstart="goalDragStart(event,' + i + ')" ' +
            'onclick="event.stopPropagation()" ' +
            'title="Priorität verschieben">⠿</button>' +
          '<div class="goal-emoji" style="width:44px;height:44px;background:' + goalEmojiBg(g.emoji) + ';border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:22px">' + g.emoji + '</div>' +
          '<div class="goal-info">' +
            '<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px">' +
              '<span style="font-size:9px;font-weight:600;color:#6B6B6B;background:#F4F4F4;padding:2px 7px;border-radius:5px;margin-right:2px">P' + (i+1) + '</span>' +
              '<span class="goal-name">' + escHtml(g.name) + '</span>' +
            '</div>' +
            '<div style="font-size:12px;font-weight:700;color:#1A1A1A">CHF ' + fmtChf(allocated) + ' <span style="font-weight:400;color:#6B6B6B">/ ' + fmtChf(target) + '</span></div>' +
            (reached
              ? '<div style="font-size:11px;color:#27500A;font-weight:700;margin-top:2px">✓ Ziel erreicht!</div>'
              : '<div style="font-size:11px;color:#6B6B6B;margin-top:2px">Noch CHF ' + fmtChf(missing) + ' fehlend</div>') +
            timeHtml +
          '</div>' +
          '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">' +
            (reached
              ? '<span style="font-size:9px;font-weight:600;color:#27500A;background:#EAF3DE;padding:3px 8px;border-radius:6px">✓ Erreicht</span>'
              : '<div style="font-size:22px;font-weight:700;color:#E30613">' + pct + '%</div>') +
            '<button class="goal-del-btn" onclick="event.stopPropagation();deleteGoal(' + i + ')" style="font-size:14px;padding:2px">🗑</button>' +
          '</div>' +
        '</div>' +
        '<div class="goal-bar-wrap">' +
          '<div class="goal-bar-bg">' +
            '<div class="goal-bar-fill" style="width:' + pct + '%;background:' + (reached ? '#27500A' : '#E30613') + ';transition:width .5s"></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    cumulative = cumulSum;
  });

  // Hinweis wenn Sparrate fehlt
  if (mSpar === 0 && state.goals.some(function(g){ return (g.ziel||0) > 0; })) {
    html += '<div style="margin:4px 16px 8px;padding:12px 14px;background:#EAF3DE;border-radius:12px;border:0.5px solid #E8E8E8;font-size:12px;color:#27500A;line-height:1.5">' +
      '<strong>Tipp:</strong> Setze im ' +
      '<span onclick="switchView(\'budget\',3)" style="font-weight:700;text-decoration:underline;cursor:pointer">Budgetrechner</span>' +
      ' eine Sparquote, um zu sehen wann du deine Ziele erreichst.' +
      '</div>';
  }

  list.innerHTML = html;
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ================================================
   GOAL DRAG & DROP — Touch-basiertes Umordnen
   Finger auf ⠿-Handle → ziehen → loslassen
================================================ */
var _gd = {
  active:       false,
  fromIdx:      -1,
  toIdx:        -1,
  ghost:        null,
  ghostTopBase: 0,
  startY:       0
};

function goalDragStart(e, idx) {
  // Nur per Touch, kein Klick-Propagation auf die Karte
  e.stopPropagation();
  if (!e.touches || !e.touches[0]) return;

  var touch = e.touches[0];
  var cards = document.querySelectorAll('#goals-list .goal-item');
  var card  = cards[idx];
  if (!card) return;
  var rect  = card.getBoundingClientRect();

  _gd.active       = true;
  _gd.fromIdx      = idx;
  _gd.toIdx        = idx;
  _gd.startY       = touch.clientY;
  _gd.ghostTopBase = rect.top;

  // Ghost-Kopie
  var ghost = card.cloneNode(true);
  ghost.style.cssText =
    'position:fixed;left:' + rect.left + 'px;top:' + rect.top + 'px;' +
    'width:' + rect.width + 'px;z-index:9999;pointer-events:none;' +
    'opacity:.93;box-shadow:0 16px 48px rgba(0,0,0,.22);' +
    'border-radius:10px;background:white;transition:none;' +
    'transform:scale(1.03);';
  document.body.appendChild(ghost);
  _gd.ghost = ghost;

  // Original abdunkeln
  card.classList.add('goal-dragging');
}

function _goalDragMove(e) {
  if (!_gd.active) return;
  e.preventDefault(); // Scroll verhindern

  var touch = e.touches[0];
  var dy    = touch.clientY - _gd.startY;

  // Ghost bewegen
  _gd.ghost.style.top = (_gd.ghostTopBase + dy) + 'px';

  // Ziel-Index bestimmen (welcher Slot wird überfahren?)
  var cards    = document.querySelectorAll('#goals-list .goal-item');
  var ghostMid = touch.clientY;
  var newIdx   = _gd.fromIdx;

  for (var i = 0; i < cards.length; i++) {
    if (i === _gd.fromIdx) continue;
    var r   = cards[i].getBoundingClientRect();
    var mid = r.top + r.height / 2;
    if (i < _gd.fromIdx && ghostMid < mid) { newIdx = i; break; }
    if (i > _gd.fromIdx && ghostMid > mid) { newIdx = i; }
  }

  if (newIdx !== _gd.toIdx) {
    _gd.toIdx = newIdx;
    // Cards visuell verschieben um Platz zu zeigen
    var fromCard = cards[_gd.fromIdx];
    var h = (fromCard ? fromCard.offsetHeight + 10 : 60) + 'px';
    for (var j = 0; j < cards.length; j++) {
      if (j === _gd.fromIdx) continue;
      var shift = '';
      if (_gd.fromIdx < _gd.toIdx) {
        if (j > _gd.fromIdx && j <= _gd.toIdx) shift = 'translateY(-' + h + ')';
      } else {
        if (j >= _gd.toIdx && j < _gd.fromIdx) shift = 'translateY(' + h + ')';
      }
      cards[j].style.transform = shift;
    }
  }
}

function _goalDragEnd() {
  if (!_gd.active) return;
  _gd.active = false;

  // Ghost entfernen
  if (_gd.ghost) { _gd.ghost.remove(); _gd.ghost = null; }

  // Transforms & Stile zurücksetzen
  document.querySelectorAll('#goals-list .goal-item').forEach(function(c) {
    c.style.transform = '';
    c.classList.remove('goal-dragging');
  });

  // Reihenfolge anpassen
  if (_gd.fromIdx !== _gd.toIdx) {
    var moved = state.goals.splice(_gd.fromIdx, 1)[0];
    state.goals.splice(_gd.toIdx, 0, moved);
    save();
    showToast('✅ Priorität ' + (_gd.toIdx + 1) + ' gesetzt');
    renderGoals();
  }

  _gd.fromIdx = -1;
  _gd.toIdx   = -1;
}

// Document-level Listener — muss non-passive sein für preventDefault()
document.addEventListener('touchmove', function(e) {
  if (_gd.active) _goalDragMove(e);
}, { passive: false });

document.addEventListener('touchend',    function(e) { if (_gd.active) _goalDragEnd(e); }, { passive: true });
document.addEventListener('touchcancel', function(e) { if (_gd.active) _goalDragEnd(e); }, { passive: true });

/* ================================================
   HAXX
================================================ */
var haxxData = [
  {
    slug: 'easy-10',
    num: '1',
    emoji: '💸',
    category: 'Sparen',
    title: 'Easy-10 Hack',
    sub: 'Zahle dich zuerst — jeden Monat',
    text: 'Spare zuerst und gib dann aus, was übrig bleibt. Die meisten Leute sparen, was am Schluss vom Monat übrig bleibt. Unser Hack macht genau das Gegenteil.\n\nEs kommt nicht auf den Betrag an, den du monatlich sparst — wichtiger ist die Einstellung und die neue Gewohnheit. Gehe jetzt in dein E-Banking und richte einen Dauerauftrag mit 5–20% deines Monatslohns auf dein Sparkonto ein, am Tag, an dem dein Lohn reinkommt. Du zahlst dich somit selber zuerst.',
    steps: null,
    url: 'https://www.moneyhaxx.ch/hacks/easy-10',
  },
  {
    slug: 'null-schulden',
    num: '2',
    emoji: '📋',
    category: 'Steuern',
    title: 'Null-Schulden Hack',
    sub: 'Keine Steuerüberraschungen mehr',
    text: 'Viele Menschen in der Schweiz haben Steuerschulden. Unser Hack hilft dir, nie wieder in diese Falle zu tappen.',
    steps: [
      'Öffne Google und suche den Steuerrechner deiner Gemeinde.',
      'Rechne deine Steuern aus, damit du weisst, wie viel das im Jahr ist.',
      'Teile diesen Betrag durch 12 — so weisst du, was du monatlich zurücklegen musst.',
      'Rufe deine Gemeinde an und bestelle einen Einzahlungsschein für deine Steuern.',
      'Richte im E-Banking einen monatlichen Dauerauftrag ein und zahle Steuern im Voraus.',
      'Das Schönste: Du hast deinen 13. Monatslohn voll für dich — geilstes Gefühl ever! 🎉',
    ],
    url: 'https://www.moneyhaxx.ch/hacks/null-schulden',
  },
  {
    slug: 'dini-mieti',
    num: '3',
    emoji: '🏠',
    category: 'Budget',
    title: 'Dini-Mieti Hack',
    sub: 'Miete max. 25% des Nettolohns',
    text: 'Die Miete ist die grösste Ausgabe in unserem Budget. Je tiefer die Miete, umso mehr Geld bleibt für dein Leben, zum Sparen und Investieren.\n\nCheck gleich: Beträgt deine Miete weniger als 25% deines Nettolohns? Falls nicht, überlege dir:',
    steps: [
      'Eine neue, günstigere Wohnung suchen.',
      'Mit jemandem zusammenziehen und die Miete teilen.',
      'Wege finden, um mehr zu verdienen.',
    ],
    url: 'https://www.moneyhaxx.ch/hacks/dini-mieti',
  },
  {
    slug: 'fifty-fifty',
    num: '4',
    emoji: '⚖️',
    category: 'Mindset',
    title: 'Fifty-Fifty Hack',
    sub: 'Lohnerhöhung clever aufteilen',
    text: 'Die meisten Menschen geben aus, was sie verdienen. Bei einer Lohnerhöhung oder einem Bonus geht dieses Geld direkt in Konsum — Ferien, Auto, Kleider.\n\nMit dem Fifty-Fifty Hack kannst du mehr konsumieren und gleichzeitig sparen. Beispiel: +200 CHF Lohn → 100 CHF aufs Sparkonto, 100 CHF für dich. Und: Passe deinen Dauerauftrag sofort an wenn du mehr verdienst.',
    steps: null,
    url: 'https://www.moneyhaxx.ch/hacks/fifty-fifty',
  },
  {
    slug: 'ego',
    num: '5',
    emoji: '🎯',
    category: 'Karriere',
    title: 'Ego-Hack',
    sub: 'Investiere in dich selbst',
    text: 'Investiere in dich selber — das bringt am meisten Rendite. Vorteile:\n\nDu bist attraktiver auf dem Arbeitsmarkt · Du lernst neue Fähigkeiten · Mehr Selbstvertrauen · Spannendere Aufgaben · Neue Leute kennenlernen · Mehr Lohn!\n\nWelche Stärken und Talente hast du? Wie kannst du diese weiter stärken? Wer sich weiterentwickelt, erhöht die Chancen auf eine Lohnerhöhung. Mehr Lohn = mehr sparen = mehr investieren = weniger Stress.',
    steps: null,
    url: 'https://www.moneyhaxx.ch/hacks/ego',
  },
  {
    slug: 'get-rich',
    num: '6',
    emoji: '📈',
    category: 'Investieren',
    title: 'Get-Rich Hack',
    sub: 'So wächst dein Geld während du schläfst',
    text: 'Investieren schreckt viele ab. Häufige Fragen: Wie geht das? Ist das riskant? Wo soll ich anfangen?\n\nWichtig: Erst investieren, wenn du mindestens 1–3 Monatslöhne als Notfalltopf gespart hast. Geld das du investierst, soll langfristig für dich arbeiten — so reduziert sich automatisch das Risiko. Auf und Ab gibt es immer. Am einfachsten: Regelmässig einen fixen Betrag investieren (z.B. BLKB Fondssparplan).',
    steps: null,
    url: 'https://www.moneyhaxx.ch/hacks/get-rich',
  },
];

/* =============================================
   DUOTONE ICON SYSTEM
============================================= */
var DT_THEMES = {
  red:    { ic:'#E30613', bg:'#FFF0F0' },
  blue:   { ic:'#185FA5', bg:'#E6F1FB' },
  green:  { ic:'#3B6D11', bg:'#EAF3DE' },
  purple: { ic:'#534AB7', bg:'#EEEDFE' },
  amber:  { ic:'#854F0B', bg:'#FFF3CD' },
  teal:   { ic:'#085041', bg:'#E1F5EE' },
  gray:   { ic:'#444441', bg:'#F1EFE8' },
  neutral:{ ic:'#999999', bg:'#F4F4F4' }
};

var GOAL_EMOJI_BG = {
  '✈️':'#E6F1FB','🌍':'#E6F1FB','🏖️':'#E6F1FB','🗺️':'#E6F1FB','🎓':'#E6F1FB',
  '🏠':'#E6F1FB','🎮':'#E6F1FB',
  '🚴':'#EAF3DE','🚲':'#EAF3DE','⚽':'#EAF3DE','🏀':'#EAF3DE','🏃':'#EAF3DE',
  '💪':'#EAF3DE','🛴':'#EAF3DE','👟':'#EAF3DE','🏕️':'#EAF3DE','👨‍👩‍👧':'#EAF3DE',
  '📱':'#EEEDFE','🎸':'#EEEDFE','🎧':'#EEEDFE',
  '💻':'#F1EFE8',
  '🛡️':'#FFF3CD','🎯':'#FFF3CD','💰':'#FFF3CD','🚗':'#FFF3CD','🐷':'#FFF3CD',
  '🛵':'#FFF3CD','💼':'#FFF3CD'
};
function goalEmojiBg(e){ return GOAL_EMOJI_BG[e]||'#F4F4F4'; }

var DT_PATHS = {
  coin:    function(c){return '<circle cx="12" cy="12" r="9" fill="'+c+'" opacity=".2"/><circle cx="12" cy="12" r="9" fill="none" stroke="'+c+'" stroke-width="1.5"/><path d="M12 8v.5m0 7v.5m-2-4.5a2 2 0 0 1 2-2h.5a1.5 1.5 0 0 1 0 3h-1a1.5 1.5 0 0 0 0 3H14" stroke="'+c+'" stroke-width="1.5" stroke-linecap="round" fill="none"/>'; },
  bank:    function(c){return '<path d="M3 10l9-7 9 7H3z" fill="'+c+'" opacity=".2"/><rect x="3" y="10" width="18" height="11" rx="1" fill="'+c+'" opacity=".1"/><path d="M3 10l9-7 9 7H3z" stroke="'+c+'" stroke-width="1.5" stroke-linejoin="round" fill="none"/><rect x="3" y="10" width="18" height="11" rx="1" stroke="'+c+'" stroke-width="1.5" fill="none"/><line x1="7" y1="21" x2="7" y2="14" stroke="'+c+'" stroke-width="1.5"/><line x1="12" y1="21" x2="12" y2="14" stroke="'+c+'" stroke-width="1.5"/><line x1="17" y1="21" x2="17" y2="14" stroke="'+c+'" stroke-width="1.5"/>'; },
  card:    function(c){return '<rect x="2" y="5" width="20" height="14" rx="3" fill="'+c+'" opacity=".2"/><rect x="2" y="5" width="20" height="14" rx="3" stroke="'+c+'" stroke-width="1.5" fill="none"/><line x1="2" y1="10" x2="22" y2="10" stroke="'+c+'" stroke-width="1.5"/><line x1="6" y1="15" x2="10" y2="15" stroke="'+c+'" stroke-width="1.5" stroke-linecap="round"/>'; },
  bag:     function(c){return '<rect x="2" y="7" width="20" height="14" rx="2" fill="'+c+'" opacity=".2"/><rect x="2" y="7" width="20" height="14" rx="2" stroke="'+c+'" stroke-width="1.5" fill="none"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="'+c+'" stroke-width="1.5" fill="none"/><line x1="2" y1="13" x2="22" y2="13" stroke="'+c+'" stroke-width="1.5"/>'; },
  target:  function(c){return '<circle cx="12" cy="12" r="9" fill="'+c+'" opacity=".15"/><circle cx="12" cy="12" r="9" stroke="'+c+'" stroke-width="1.5" fill="none"/><circle cx="12" cy="12" r="5" stroke="'+c+'" stroke-width="1.5" fill="none"/><circle cx="12" cy="12" r="1.5" fill="'+c+'"/>'; },
  piggy:   function(c){return '<ellipse cx="12" cy="12" rx="7" ry="5.5" fill="'+c+'" opacity=".2"/><path d="M5 12a7 5.5 0 1 0 14 0 7 5.5 0 0 0-14 0z" stroke="'+c+'" stroke-width="1.5" fill="none"/><circle cx="17" cy="10.5" r="1" fill="'+c+'"/><path d="M19 9.5c1.5 0 3 1 3 2.5" stroke="'+c+'" stroke-width="1.5" stroke-linecap="round"/>'; },
  doc:     function(c){return '<path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="'+c+'" opacity=".2"/><path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="'+c+'" stroke-width="1.5" fill="none" stroke-linejoin="round"/><line x1="9" y1="13" x2="15" y2="13" stroke="'+c+'" stroke-width="1.5" stroke-linecap="round"/><line x1="9" y1="16" x2="13" y2="16" stroke="'+c+'" stroke-width="1.5" stroke-linecap="round"/><path d="M14 2v4h4" stroke="'+c+'" stroke-width="1.5" fill="none"/>'; },
  chart:   function(c){return '<rect x="3" y="12" width="5" height="9" rx="1" fill="'+c+'" opacity=".2"/><rect x="9.5" y="7" width="5" height="14" rx="1" fill="'+c+'" opacity=".2"/><rect x="16" y="4" width="5" height="17" rx="1" fill="'+c+'" opacity=".2"/><rect x="3" y="12" width="5" height="9" rx="1" stroke="'+c+'" stroke-width="1.5" fill="none"/><rect x="9.5" y="7" width="5" height="14" rx="1" stroke="'+c+'" stroke-width="1.5" fill="none"/><rect x="16" y="4" width="5" height="17" rx="1" stroke="'+c+'" stroke-width="1.5" fill="none"/>'; },
  bulb:    function(c){return '<path d="M9 21h6m-3-18a6 6 0 0 1 6 6c0 2.5-1.5 4.5-3 6H9c-1.5-1.5-3-3.5-3-6a6 6 0 0 1 6-6z" fill="'+c+'" opacity=".2"/><path d="M9 21h6m-3-18a6 6 0 0 1 6 6c0 2.5-1.5 4.5-3 6H9c-1.5-1.5-3-3.5-3-6a6 6 0 0 1 6-6z" stroke="'+c+'" stroke-width="1.5" fill="none" stroke-linejoin="round"/><line x1="10" y1="17" x2="14" y2="17" stroke="'+c+'" stroke-width="1.5" stroke-linecap="round"/>'; },
  trend:   function(c){return '<polyline points="3,17 9,11 13,15 21,7" fill="none" stroke="'+c+'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><polyline points="16,7 21,7 21,12" fill="none" stroke="'+c+'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 17L9 11l4 4 8-8" fill="'+c+'" opacity=".12"/>'; },
  plant:   function(c){return '<path d="M12 22V11M12 11C12 6 7 3 3 4S2 11 7 11h5z" fill="'+c+'" opacity=".2"/><path d="M12 15c0-5 5-8 9-7s1 7-4 7h-5z" fill="'+c+'" opacity=".2"/><path d="M12 22V11M12 11C12 6 7 3 3 4S2 11 7 11h5z" stroke="'+c+'" stroke-width="1.5" fill="none" stroke-linejoin="round"/><path d="M12 15c0-5 5-8 9-7s1 7-4 7h-5z" stroke="'+c+'" stroke-width="1.5" fill="none" stroke-linejoin="round"/>'; },
  shield:  function(c){return '<path d="M12 3L4 7v5c0 4.5 3.5 8.5 8 10 4.5-1.5 8-5.5 8-10V7L12 3z" fill="'+c+'" opacity=".2"/><path d="M12 3L4 7v5c0 4.5 3.5 8.5 8 10 4.5-1.5 8-5.5 8-10V7L12 3z" stroke="'+c+'" stroke-width="1.5" fill="none" stroke-linejoin="round"/><polyline points="9,12 11,14 15,10" stroke="'+c+'" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'; },
  star:    function(c){return '<polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" fill="'+c+'" opacity=".2"/><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" stroke="'+c+'" stroke-width="1.5" fill="none" stroke-linejoin="round"/>'; },
  diploma: function(c){return '<rect x="2" y="5" width="20" height="14" rx="2" fill="'+c+'" opacity=".2"/><rect x="2" y="5" width="20" height="14" rx="2" stroke="'+c+'" stroke-width="1.5" fill="none"/><circle cx="10" cy="12" r="3" fill="'+c+'" opacity=".3"/><circle cx="10" cy="12" r="3" stroke="'+c+'" stroke-width="1.5" fill="none"/><line x1="15" y1="9" x2="19" y2="9" stroke="'+c+'" stroke-width="1.5" stroke-linecap="round"/><line x1="15" y1="12" x2="19" y2="12" stroke="'+c+'" stroke-width="1.5" stroke-linecap="round"/>'; },
  heart:   function(c){return '<path d="M12 21l-9-9a5 5 0 0 1 7.07-7.07L12 6.93l1.93-1.93A5 5 0 0 1 21 12l-9 9z" fill="'+c+'" opacity=".2"/><path d="M12 21l-9-9a5 5 0 0 1 7.07-7.07L12 6.93l1.93-1.93A5 5 0 0 1 21 12l-9 9z" stroke="'+c+'" stroke-width="1.5" fill="none" stroke-linejoin="round"/>'; },
  trophy:  function(c){return '<path d="M6 2h12v8a6 6 0 0 1-12 0V2z" fill="'+c+'" opacity=".2"/><path d="M6 2h12v8a6 6 0 0 1-12 0V2z" stroke="'+c+'" stroke-width="1.5" fill="none"/><path d="M6 4H2a2 2 0 0 0 2 4h2m10-4h4a2 2 0 0 1-2 4h-2" stroke="'+c+'" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="16" x2="12" y2="20" stroke="'+c+'" stroke-width="1.5"/><line x1="8" y1="20" x2="16" y2="20" stroke="'+c+'" stroke-width="1.5" stroke-linecap="round"/>'; },
  sparkle: function(c){return '<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" fill="'+c+'" opacity=".2"/><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" stroke="'+c+'" stroke-width="1.5" fill="none" stroke-linejoin="round"/><circle cx="19" cy="4" r="1" fill="'+c+'"/><circle cx="5" cy="18" r="1" fill="'+c+'"/>'; },
  rocket:  function(c){return '<path d="M12 2c0 0-5 4-5 10l5 5 5-5c0-6-5-10-5-10z" fill="'+c+'" opacity=".2"/><path d="M12 2c0 0-5 4-5 10l5 5 5-5c0-6-5-10-5-10z" stroke="'+c+'" stroke-width="1.5" fill="none" stroke-linejoin="round"/><path d="M7 12l-3 3 2 2 3-2m7-3l3 3-2 2-3-2" stroke="'+c+'" stroke-width="1.5" stroke-linecap="round" fill="none"/><circle cx="12" cy="9" r="1.5" fill="'+c+'"/>'; },
  lightning:function(c){return '<polygon points="13,2 4,14 12,14 11,22 20,10 12,10" fill="'+c+'" opacity=".2"/><polygon points="13,2 4,14 12,14 11,22 20,10 12,10" stroke="'+c+'" stroke-width="1.5" fill="none" stroke-linejoin="round"/>'; },
  growth:  function(c){return '<polyline points="4,20 9,14 13,17 20,8" fill="none" stroke="'+c+'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 20L9 14l4 3 7-9" fill="'+c+'" opacity=".15"/>'; },
  dice:    function(c){return '<rect x="3" y="3" width="18" height="18" rx="4" fill="'+c+'" opacity=".2"/><rect x="3" y="3" width="18" height="18" rx="4" stroke="'+c+'" stroke-width="1.5" fill="none"/><circle cx="8.5" cy="8.5" r="1.5" fill="'+c+'"/><circle cx="15.5" cy="8.5" r="1.5" fill="'+c+'"/><circle cx="12" cy="12" r="1.5" fill="'+c+'"/><circle cx="8.5" cy="15.5" r="1.5" fill="'+c+'"/><circle cx="15.5" cy="15.5" r="1.5" fill="'+c+'"/>'; },
  lock:    function(c){return '<rect x="5" y="11" width="14" height="10" rx="2" fill="'+c+'" opacity=".2"/><rect x="5" y="11" width="14" height="10" rx="2" stroke="'+c+'" stroke-width="1.5" fill="none"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="'+c+'" stroke-width="1.5" fill="none"/>'; }
};

function dtIcon(theme, shape) {
  var t = DT_THEMES[theme] || DT_THEMES.neutral;
  var fn = DT_PATHS[shape] || DT_PATHS.coin;
  return '<div style="width:40px;height:40px;background:'+t.bg+';border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="22" height="22" viewBox="0 0 24 24">'+fn(t.ic)+'</svg></div>';
}

// Learn chapter color mapping (index 0-4)
var CHAPTER_COLORS = [
  { bg:'#FFF0F0', c:'#E30613' },
  { bg:'#E6F1FB', c:'#185FA5' },
  { bg:'#EAF3DE', c:'#3B6D11' },
  { bg:'#EEEDFE', c:'#534AB7' },
  { bg:'#FFF3CD', c:'#854F0B' },
];
var CHAPTER_ICONS = [
  { shape:'coin',   theme:'red'    },
  { shape:'bank',   theme:'blue'   },
  { shape:'card',   theme:'green'  },
  { shape:'bag',    theme:'purple' },
  { shape:'target', theme:'amber'  }
];

// Haxx category icon mapping
var HAXX_ICONS = {
  'Sparen':      { shape:'piggy', theme:'amber'  },
  'Budget':      { shape:'chart', theme:'blue'   },
  'Mindset':     { shape:'bulb',  theme:'purple' },
  'Steuern':     { shape:'doc',   theme:'gray'   },
  'Karriere':    { shape:'trend', theme:'teal'   },
  'Investieren': { shape:'plant', theme:'green'  }
};

// Badge icon mapping
var BADGE_ICONS = {
  'first_goal':   { shape:'target',     theme:'amber'  },
  'goal_reached': { shape:'trophy',     theme:'amber'  },
  'three_goals':  { shape:'sparkle',    theme:'purple' },
  'big_dream':    { shape:'rocket',     theme:'teal'   },
  'haxx_master':  { shape:'lightning',  theme:'red'    },
  'budget_pro':   { shape:'chart',      theme:'blue'   },
  'invest_start': { shape:'growth',     theme:'green'  },
  'story_hero':   { shape:'dice',       theme:'purple' }
};

// Icon + category badge colors for Moneyhaxx
var HAXX_CAT_COLORS = {
  'Sparen':     { bg: '#FFF3CD', ic: '#854F0B', text: '#854F0B' },
  'Budget':     { bg: '#E6F1FB', ic: '#185FA5', text: '#185FA5' },
  'Mindset':    { bg: '#EEEDFE', ic: '#534AB7', text: '#534AB7' },
  'Karriere':   { bg: '#E1F5EE', ic: '#085041', text: '#085041' },
  'Investieren':{ bg: '#EAF3DE', ic: '#3B6D11', text: '#3B6D11' },
  'Steuern':    { bg: '#F1EFE8', ic: '#444441', text: '#444441' },
};

function renderHaxx() {
  var list = document.getElementById('haxx-list');
  var doneCount = state.haxxDone.length;
  var pct = (doneCount / 6) * 100;

  document.getElementById('haxx-count-label').textContent = doneCount + ' von 6 verstanden';
  document.getElementById('haxx-fill').style.width = pct + '%';

  var html = '';
  haxxData.forEach(function(h, i) {
    var done = state.haxxDone.indexOf(h.slug) >= 0;
    var bodyHtml = '<p class="haxx-body-text">' + escHtml(h.text).replace(/\n/g, '<br>') + '</p>';

    if (h.steps) {
      bodyHtml += '<ul class="haxx-body-steps">';
      h.steps.forEach(function(s, si) {
        bodyHtml += '<li data-n="' + (si+1) + '.">' + escHtml(s) + '</li>';
      });
      bodyHtml += '</ul>';
    }

    var catColor = HAXX_CAT_COLORS[h.category] || { bg: '#F4F4F4', ic: '#6B6B6B', text: '#6B6B6B' };
    var catStyle = 'background:' + catColor.bg + ';color:' + catColor.text + ';font-size:9px;font-weight:700;padding:2px 7px;border-radius:6px;text-transform:uppercase;letter-spacing:.4px;';
    var haxxIcoHtml = '<div style="width:40px;height:40px;background:' + catColor.bg + ';border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">' + h.emoji + '</div>';

    html += '<div class="haxx-item' + (done ? ' done' : '') + '" id="haxx-' + i + '">' +
      '<div class="haxx-header" onclick="toggleHaxx(' + i + ')">' +
        haxxIcoHtml +
        '<div class="haxx-header-text">' +
          '<div class="haxx-h-title">' +
            escHtml(h.title) +
            '<span style="' + catStyle + '">' + escHtml(h.category || '') + '</span>' +
          '</div>' +
          '<div class="haxx-h-sub">' + escHtml(h.sub) + '</div>' +
        '</div>' +
        (done ? '<div class="haxx-done-check">✓</div>' : '') +
        '<div class="haxx-chevron">▼</div>' +
      '</div>' +
      '<div class="haxx-body">' +
        bodyHtml +
        '<div class="haxx-footer">' +
          '<a href="' + h.url + '" target="_blank" class="haxx-video-btn">▶ Zum Video</a>' +
          '<button class="haxx-check-btn' + (done ? ' done' : '') + '" onclick="toggleHaxxDone(' + i + ')">' +
            (done ? '✓ Kapiert!' : 'Kapiert! ✓') +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  });

  list.innerHTML = html;
}

function toggleHaxx(i) {
  var el = document.getElementById('haxx-' + i);
  el.classList.toggle('open');
}

function toggleHaxxDone(i) {
  var slug = haxxData[i].slug;
  var idx = state.haxxDone.indexOf(slug);
  if (idx >= 0) {
    state.haxxDone.splice(idx, 1);
    showToast('Hack als offen markiert');
  } else {
    state.haxxDone.push(slug);
    showToast('Super! Hack ' + haxxData[i].num + ' verstanden ⚡');
  }
  save();
  renderHaxx();
  updateHomeCounts();
}

/* ================================================
   BUDGET
================================================ */
var BUD_CAT_THEME = {
  'fill-ok':     { bg:'#EAF3DE', ic:'#3B6D11' },
  'fill-red':    { bg:'#FFF0F0', ic:'#E30613' },
  'fill-petrol': { bg:'#E1F5EE', ic:'#085041' },
  'fill-amber':  { bg:'#FFF3CD', ic:'#854F0B' },
  'fill-slate':  { bg:'#F4F4F4', ic:'#6B6B6B' },
  'fill-olive':  { bg:'#F4F4F4', ic:'#444441' },
};
var BUDGET_VERSION = '3';
var budgetDefaults = [
  // ── MoneyHaxx Standard ──────────────────────────────────────────
  { icon: '🐷', name: 'Sparen (Easy-10)',    hint: 'Zuerst sparen! Mindestens 10% vom Lohn', pct: 10, color: 'fill-ok'     },
  { icon: '<i class="ti ti-home"></i>',       name: 'Wohnen',              hint: 'Max. 25% (Dini-Mieti Hack)',             pct: 25, color: 'fill-red'    },
  { icon: '<i class="ti ti-shopping-cart"></i>', name: 'Essen & Haushalt', hint: 'Lebensmittel, Restaurants',              pct: 15, color: 'fill-petrol' },
  { icon: '<i class="ti ti-bus"></i>',        name: 'Mobilität',           hint: 'ÖV, Auto, Velo',                        pct: 10, color: 'fill-amber'  },
  { icon: '<i class="ti ti-device-mobile"></i>', name: 'Kommunikation',    hint: 'Handy, Internet, Abo',                   pct:  5, color: 'fill-slate'  },
  { icon: '<i class="ti ti-confetti"></i>',   name: 'Freizeit & Fun',      hint: 'Ausgang, Sport, Hobby',                  pct: 13, color: 'fill-olive'  },
  { icon: '<i class="ti ti-heart-rate-monitor"></i>', name: 'Krankenkasse',hint: 'Prämie + Franchise',                     pct: 10, color: 'fill-red'    },
  { icon: '<i class="ti ti-package"></i>',    name: 'Diverses/Reserve',    hint: 'Kleider, Unvorhergesehenes',             pct: 12, color: 'fill-slate'  },
  // ── Optional · Deine Lebenssituation ────────────────────────────
  { icon: '<i class="ti ti-school"></i>',     name: 'Bildung / Ausbildung',hint: 'Kurse, Studium, Weiterbildung · Ego-Hack', pct: 0, color: 'fill-petrol', optional: true },
  { icon: '<i class="ti ti-briefcase"></i>',  name: 'Selbstständigkeit',   hint: 'Rücklagen für eigenes Business',         pct:  0, color: 'fill-amber',  optional: true },
  { icon: '<i class="ti ti-users"></i>',      name: 'Familienplanung',     hint: 'Reserve für Familie & Zukunft',          pct:  0, color: 'fill-olive',  optional: true },
];

// working copy (user-editable pcts)
var budgetCats = budgetDefaults.map(function(c) { return Object.assign({}, c); });

function onLohnChange(val) {
  state.lohn = parseInt(val);
  document.getElementById('bud-lohn-input').value = val;
  document.getElementById('bud-lohn-display').textContent = parseInt(val).toLocaleString('de-CH');
  calcBudget();
  save();
}

function onLohnInputChange(val) {
  var n = parseInt(val) || 0;
  if (n < 500) n = 500;
  if (n > 8000) n = 8000;
  state.lohn = n;
  document.getElementById('bud-slider').value = n;
  document.getElementById('bud-lohn-display').textContent = n.toLocaleString('de-CH');
  calcBudget();
  save();
}

function calcBudget() {
  var lohn = state.lohn;

  // Investment box: 10% monthly, 5% annual return, 10 years
  var monthly = lohn * 0.1;
  var months = 120;
  var rate = 0.05 / 12;
  var fv = monthly * ((Math.pow(1 + rate, months) - 1) / rate);
  var einbezahlt = monthly * months;
  var rendite = fv - einbezahlt;

  document.getElementById('invest-total').textContent = fmtChf(fv);
  document.getElementById('invest-einbezahlt').textContent = fmtChf(einbezahlt);
  document.getElementById('invest-rendite').textContent = fmtChf(rendite);

  // Sparanteil aus Budget → Sparziele
  var sparCat = budgetCats.find(function(cat){ return cat.name.indexOf('Sparen') >= 0; });
  if (sparCat) {
    var monatSpar = Math.round(lohn * (sparCat.pct || 0) / 100);
    state.monatlichesSparbudget = monatSpar;
    // Anzeige im Sparziele-Screen aktualisieren
    var msEl = document.getElementById('goals-monthly-budget');
    if (msEl) msEl.textContent = fmtChf(monatSpar);
    // Invest-Screen synchron halten: Betrag immer gleich Sparwert
    invState.amount = monatSpar;
    var invAmtEl = document.getElementById('inv-amount');
    if (invAmtEl) invAmtEl.value = monatSpar;
  }

  // Sum check
  var total = budgetCats.reduce(function(s, c) { return s + (c.pct || 0); }, 0);
  var sumEl    = document.getElementById('bud-sum-total');
  var hintEl   = document.getElementById('bud-sum-hint');
  var fillEl   = document.getElementById('bud-sum-fill');

  sumEl.textContent = total + '%';
  var fillW = Math.min(100, total);
  fillEl.style.width = fillW + '%';

  if (total === 100) {
    sumEl.className = 'budget-sum-total budget-sum-ok';
    fillEl.style.background = 'var(--ok)';
    hintEl.innerHTML = '✓ Perfekt — alle 100% sind verteilt &nbsp;<button onclick="switchView(\'goals\',1)" style="font-size:10px;font-weight:700;color:var(--ok);background:transparent;border:none;cursor:pointer;text-decoration:underline;font-family:var(--font)">Sparziele ansehen →</button>';
  } else if (total < 100) {
    sumEl.className = 'budget-sum-total budget-sum-warn';
    fillEl.style.background = 'var(--amber)';
    hintEl.textContent = '⚠ Noch ' + (100 - total) + '% zu verteilen';
  } else {
    sumEl.className = 'budget-sum-total budget-sum-warn';
    fillEl.style.background = 'var(--red)';
    hintEl.textContent = '✕ ' + (total - 100) + '% zu viel — bitte reduzieren';
  }

  // Budget category rows
  var html = '';
  budgetCats.forEach(function(c, i) {
    var chf = Math.round(lohn * (c.pct || 0) / 100);
    var barW = Math.min(100, (c.pct || 0) * 2);
    html += '<div class="budget-cat">' +
      '<div class="budget-cat-row">' +
        (function(){ var bt=BUD_CAT_THEME[c.color]||{bg:'#F4F4F4',ic:'#6B6B6B'}; return '<div style="width:36px;height:36px;background:'+bt.bg+';border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:'+bt.ic+';font-size:17px">'+c.icon+'</div>'; })() +
        '<div class="budget-cat-info">' +
          '<div class="budget-cat-name">' + c.name + '</div>' +
          '<div class="budget-cat-hint">' + c.hint + '</div>' +
        '</div>' +
        '<div class="budget-cat-inputs">' +
          '<div class="budget-field chf-field">' +
            '<span class="budget-field-lbl">CHF</span>' +
            '<input type="number" min="0" max="' + lohn + '" value="' + chf + '"' +
            ' data-idx="' + i + '" data-type="chf"' +
            ' oninput="onBudgetInput(this)" onfocus="this.select()">' +
          '</div>' +
          '<span class="budget-divider">|</span>' +
          '<div class="budget-field">' +
            '<input type="number" min="0" max="100" value="' + (c.pct || 0) + '"' +
            ' data-idx="' + i + '" data-type="pct"' +
            ' oninput="onBudgetInput(this)" onfocus="this.select()">' +
            '<span class="budget-field-lbl">%</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="budget-cat-bar">' +
        '<div class="budget-cat-fill ' + c.color + '" style="width:' + barW + '%"></div>' +
      '</div>' +
    '</div>';
  });

  document.getElementById('bud-cats').innerHTML = html;
  save();
}

function onBudgetInput(input) {
  var i = parseInt(input.dataset.idx);
  var type = input.dataset.type;
  var lohn = state.lohn || 3200;
  if (type === 'pct') {
    var pct = Math.max(0, Math.min(100, parseInt(input.value) || 0));
    budgetCats[i].pct = pct;
  } else {
    var chf = Math.max(0, Math.min(lohn, parseInt(input.value) || 0));
    budgetCats[i].pct = lohn > 0 ? Math.round(chf / lohn * 100) : 0;
  }
  calcBudget();
}

function resetBudgetDefaults() {
  budgetCats = budgetDefaults.map(function(c) { return Object.assign({}, c); });
  calcBudget();
  showToast('Standardwerte wiederhergestellt ↺');
}

/* ================================================
   FINANZKOMPETENZ
================================================ */
var fkData = [
  {
    icon: '🃏', iconClass: 'red-bg',
    title: 'ProfitCard',
    sub: 'Kostenlose Vergünstigungen',
    text: 'Kostenlos in den Basler Zolli oder mit der Luftseilbahn auf die Wasserfallen? Mit der ProfitCard erhalten Kinder und Jugendliche viele Vorteile: Gratiseintritte, vergünstigte Theater- und Freizeitangebote und vieles mehr.',
    cta: { label: 'Mehr erfahren', url: 'https://www.blkb.ch/privatpersonen/konten/jugend.html' },
  },
  {
    icon: '🏦', iconClass: 'petrol-bg',
    title: 'Jugendkonten',
    sub: 'TWINT, E-Banking, Vorzugszins',
    text: 'BLKB Jugendkonten eröffnen jungen Menschen den Weg zu TWINT, E-Banking und Mobile Banking — mit zahlreichen Vorteilen und attraktiven Vergünstigungen. Das Sparkonto Jugend mit Vorzugszins ist ideal, um kurz- und mittelfristige Sparziele clever zu erreichen.',
    cta: { label: 'Konto eröffnen', url: 'https://www.blkb.ch/privatpersonen/konten/jugend.html' },
  },
  {
    icon: '💳', iconClass: 'ok-bg',
    title: 'Visa Debit Stu',
    sub: 'Gratis bis 30 — weltweit',
    text: 'Für Jugendliche, junge Erwachsene und Studierende: keine Jahresgebühr (bis 25 bzw. 30 Jahre) und weltweit kontaktlos bezahlen, Bargeld beziehen und online einkaufen. Mit der Stu App zusätzlich von Cashback und Partnervergünstigungen profitieren.',
    cta: { label: 'Mehr zur Karte', url: 'https://www.blkb.ch/privatpersonen/konten/jugend.html' },
  },
  {
    icon: '📲', iconClass: 'amber-bg',
    title: 'BLKB TWINT',
    sub: 'Die sichere Bezahl-App',
    text: 'BLKB TWINT bietet in einer App alles, was man braucht, um sich durch den Tag zu bewegen. Digitales Bezahlen wird nahezu überall möglich — einrichten und los geht\'s.',
    cta: { label: 'TWINT aktivieren', url: 'https://www.blkb.ch/privatpersonen/konten/jugend.html' },
  },
  {
    icon: '<i class="ti ti-trending-up"></i>', iconClass: 'olive-bg',
    title: 'Fondssparplan',
    sub: 'Vermögen aufbauen ab kleinen Beträgen',
    text: 'Mit dem BLKB Fondssparplan lässt sich Schritt für Schritt Vermögen aufbauen — auch mit kleinen Beträgen. Regelmässig investieren, keine Kontoführungsgebühren, und das angelegte Kapital bleibt jederzeit flexibel verfügbar.\n\nPerfekt in Kombination mit dem Get-Rich Hack von MoneyHaxx! Für unter 18-Jährige erfolgt die Eröffnung durch die Eltern.',
    cta: { label: 'Fondssparplan starten', url: 'https://www.blkb.ch/privatpersonen/konten/jugend.html' },
  },
  {
    icon: '<i class="ti ti-school"></i>', iconClass: 'petrol-bg',
    title: 'Finanzkompetenz',
    sub: 'Wissen für ein starkes Fundament',
    text: 'Wer sich in Finanzdingen gut auskennt, geht erfolgreicher durchs Leben und gerät weniger schnell in eine finanzielle Schieflage. Budgetieren, Ausgaben priorisieren und Sparen müssen aber zuerst gelernt sein.\n\nDie BLKB bietet Jugendlichen Unterstützung — in der Filiale, online, und mit Partnern wie MoneyHaxx.',
    cta: { label: 'Zu blkb.ch', url: 'https://www.blkb.ch/privatpersonen/konten/jugend.html' },
  },
];

function renderFinlit() {
  // Lebensphase basierend auf Alter hervorheben
  updateFkPhase();
}

function updateFkPhase() {
  var age = state.age;
  var phase1 = document.getElementById('fk-phase-1');
  var phase2 = document.getElementById('fk-phase-2');
  if (!phase1) return;

  if (age < 18) {
    phase1.style.display = '';
    if (phase2) phase2.style.display = 'none';
  } else {
    phase1.style.display = 'none';
    if (phase2) phase2.style.display = '';
  }
}

/* ================================================
   HOME COUNTS
================================================ */
function updateHomeCounts() {
  var gc = document.getElementById('home-goals-count');
  var hc = document.getElementById('home-haxx-count');
  if (gc) gc.textContent = state.goals.length;
  if (hc) hc.textContent = state.haxxDone.length + '/6';
}

/* ================================================
   DEFAULT GOALS (first time)
================================================ */
// goals: { emoji, name, pct }  — pct = % des Sparkonto-Guthabens
var defaultGoals = [
  { emoji: '🛡️', name: 'Notfallreserve',   ziel: 1000 },
  { emoji: '✈️', name: 'Reisefonds',        ziel: 1500 },
  { emoji: '🚴', name: 'E-Bike',            ziel: 2500 },
  { emoji: '🎓', name: 'Ausbildung',         ziel: 5000 },
  { emoji: '💼', name: 'Selbstständigkeit',  ziel: 10000 },
];

/* ================================================
   INIT
================================================ */


/* ================================================
   INVEST SIMULATION
   ------------------------------------------------
   API-Stub: api_getFondssparplan() (siehe API-Layer)
   Live: GET /investments/me/savingsplan
   ================================================ */

var invState = {
  type:    'frei',     // 'frei' | '3a'
  rhythm:  'monthly',  // 'monthly' | 'yearly'
  amount:  200,
  rate:    5,
  ageTo:   30,
  gender:  'm',        // 'm' | 'f'
  modus:   'betrag',   // 'betrag' | 'ziel'
};

var invGoalState = {
  goal:   100000,
  years:  20,
  rate:   5
};

var MAX_3A_YEAR_2026  = 7258;   // CHF — Angestellte mit PK, 2026
var MAX_3A_MONTH_2026 = Math.round(MAX_3A_YEAR_2026 / 12 * 100) / 100; // 604.83

function setInvType(type) {
  invState.type = type;
  document.getElementById('inv-btn-frei').classList.toggle('active', type === 'frei');
  document.getElementById('inv-btn-3a').classList.toggle('active', type === '3a');
  document.getElementById('inv-3a-info').style.display = type === '3a' ? 'block' : 'none';
  // Saldo-Box: bei freiem Vermögen → Sparkonto, bei 3a → 3a-Guthaben
  var saldoBox = document.getElementById('inv-3a-saldo-box');
  if (saldoBox) {
    if (type === '3a') {
      render3aInvest(state.saldo3a, state.saldo3a > 0);
    } else {
      // Freies Vermögen: Sparkonto-Guthaben aus «Meine Ziele» anzeigen
      var sparBal = (state.sparGuthaben || 0)
        .toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      saldoBox.innerHTML =
        '<div style="font-size:11px;font-weight:700;color:#185FA5;text-transform:uppercase;' +
        'letter-spacing:.4px;margin-bottom:6px">Dein bisheriges angespartes Kapital · BLKB</div>' +
        '<div style="font-size:22px;font-weight:700;color:var(--dark)">CHF ' + sparBal + '</div>';
      saldoBox.style.display = 'block';
    }
  }

  if (type === '3a') {
    var maxAmt = invState.rhythm === 'monthly' ? MAX_3A_MONTH_2026 : MAX_3A_YEAR_2026;
    if (invState.amount > maxAmt) {
      invState.amount = maxAmt;
      document.getElementById('inv-amount').value = maxAmt;
    }
  }
  calcInvest();
}

function setInvRhythm(rhythm) {
  invState.rhythm = rhythm;
  document.getElementById('inv-btn-monthly').classList.toggle('active', rhythm === 'monthly');
  document.getElementById('inv-btn-yearly').classList.toggle('active', rhythm === 'yearly');
  document.getElementById('inv-amount-label').textContent = rhythm === 'monthly' ? '(CHF/Monat)' : '(CHF/Jahr)';
  calcInvest();
}

function setInvGender(gender) {
  invState.gender = gender;
  document.getElementById('inv-btn-male').classList.toggle('active', gender === 'm');
  document.getElementById('inv-btn-female').classList.toggle('active', gender === 'f');
  var maxAge = gender === 'f' ? 64 : 65;
  // Update the field max attribute immediately
  var ageToEl = document.getElementById('inv-age-to');
  ageToEl.max = maxAge;
  // If current value exceeds new max, clamp it
  if (parseInt(ageToEl.value) > maxAge) ageToEl.value = maxAge;
  calcInvest();
}

function setInvRate(rate) {
  invState.rate = rate;
  document.querySelectorAll('.inv-rate-btn').forEach(function(b) {
    b.classList.toggle('active', parseInt(b.dataset.rate) === rate);
  });
  var manual = document.getElementById('inv-rate-manual');
  if (manual && parseFloat(manual.value) !== rate) manual.value = rate;
  calcInvest();
}

function onRateManual(val) {
  var r = Math.max(0.1, Math.min(30, parseFloat(val) || 0));
  invState.rate = r;
  // Deselect preset buttons unless exact match
  document.querySelectorAll('.inv-rate-btn').forEach(function(b) {
    b.classList.toggle('active', parseInt(b.dataset.rate) === r);
  });
  calcInvest();
}

function calcInvest() {
  state.investUsed = true;
  var ageFrom  = parseInt(document.getElementById('inv-age-from').textContent) || state.age;
  var ageTo    = parseInt(document.getElementById('inv-age-to').value) || 30;
  var amount   = parseFloat(document.getElementById('inv-amount').value) || 0;
  var maxAgeTo = invState.gender === 'f' ? 64 : 65;

  // Clamp ageTo: must be > ageFrom and ≤ retirement age
  if (ageTo <= ageFrom) ageTo = ageFrom + 1;
  if (ageTo > maxAgeTo) ageTo = maxAgeTo;
  document.getElementById('inv-age-to').value = ageTo;
  document.getElementById('inv-age-to').max    = maxAgeTo;

  invState.amount = amount;
  invState.ageTo  = ageTo;

  // 3a: Max prüfen und warnen
  var hint3a = document.getElementById('inv-3a-maxhint');
  if (invState.type === '3a') {
    var maxAmt = invState.rhythm === 'monthly' ? MAX_3A_MONTH_2026 : MAX_3A_YEAR_2026;
    if (amount > maxAmt) {
      hint3a.style.display = 'block';
      hint3a.textContent = '⚠ Max. ' + (invState.rhythm === 'monthly' ? 'CHF 604.83/Mt.' : 'CHF 7\u2019258/Jahr') + ' (2026)';
      amount = maxAmt;
    } else {
      hint3a.style.display = 'none';
    }
  } else {
    hint3a.style.display = 'none';
  }

  var years       = ageTo - ageFrom;
  var rate        = invState.rate / 100;
  var monthlyAmt  = invState.rhythm === 'monthly' ? amount : amount / 12;
  var months      = years * 12;
  var monthRate   = rate / 12;

  // Future value of regular payments (annuity)
  // Startkapital: bei 3a = 3a-Guthaben (ACP), bei frei = Sparkonto-Guthaben
  var startKapital = invState.type === '3a'
    ? (state.saldo3a || 0)
    : (state.sparGuthaben || 0);

  var fv, einbezahlt;
  if (monthRate === 0) {
    fv = startKapital + monthlyAmt * months;
  } else {
    // FV der laufenden Einzahlungen + Zinseszins auf Startkapital
    fv = startKapital * Math.pow(1 + monthRate, months) +
         monthlyAmt * ((Math.pow(1 + monthRate, months) - 1) / monthRate);
  }
  einbezahlt = startKapital + monthlyAmt * months;
  var rendite = fv - einbezahlt;

  // Render result
  document.getElementById('inv-result-label').textContent = 'Endwert nach ' + years + ' Jahren (Alter ' + ageTo + ')';
  document.getElementById('inv-endwert').textContent = fmtChf(fv);
  document.getElementById('inv-einbezahlt').textContent = fmtChf(einbezahlt);
  document.getElementById('inv-rendite').textContent = fmtChf(rendite);

  var investPct = fv > 0 ? Math.round((einbezahlt / fv) * 100) : 100;
  var returnPct = 100 - investPct;
  document.getElementById('inv-bar-invested').style.width = investPct + '%';
  document.getElementById('inv-bar-return').style.width   = returnPct + '%';
  document.getElementById('inv-rendite-pct').textContent  = 'Rendite ' + returnPct + '%';

  // Jahrestabelle
  var tableHtml = '';
  var balance = 0;
  for (var y = 1; y <= years; y++) {
    var yMonths  = 12;
    var yDeposit = monthlyAmt * yMonths;
    // FV for this year's balance
    var prevBal  = balance;
    balance = prevBal * Math.pow(1 + monthRate, yMonths) +
              monthlyAmt * ((Math.pow(1 + monthRate, yMonths) - 1) / (monthRate || 1));
    var yRendite = balance - (einbezahlt * (y / years));
    var rowAge   = ageFrom + y;
    var isLast   = y === years;
    var rowBg = isLast ? '#EAF3DE' : (y % 2 === 0 ? '#FAFAFA' : 'white');
    tableHtml += '<div style="display:flex;align-items:center;padding:8px 14px;border-bottom:1px solid #E8E8E8;background:' + rowBg + ';' +
      (isLast ? 'font-weight:700' : '') + '">' +
      '<div style="width:36px;font-size:11px;color:#6B6B6B">Ø ' + rowAge + '</div>' +
      '<div style="flex:1;font-size:12px;color:#1A1A1A">+CHF ' + fmtChf(yDeposit) + '</div>' +
      '<div style="font-size:13px;font-weight:700;color:#27500A">CHF ' + fmtChf(balance) + '</div>' +
    '</div>';
  }
  if (!years || years < 1) {
    tableHtml = '<div style="padding:16px;text-align:center;color:var(--light);font-size:12px">Ziel-Alter muss grösser sein als aktuelles Alter</div>';
  }
  document.getElementById('inv-table').innerHTML = tableHtml;

  // ── Vergleich Sparkonto 0.5% p.a. ──────────────────────────────────────
  var SPAR_RATE   = 0.005; // BLKB Sparkonto Jugend, Stand 2026
  var sparBalance = 0;
  var sparMonthRate = SPAR_RATE / 12;
  if (sparMonthRate === 0) {
    sparBalance = monthlyAmt * months;
  } else {
    sparBalance = monthlyAmt * ((Math.pow(1 + sparMonthRate, months) - 1) / sparMonthRate);
  }
  var mehrertrag = fv - sparBalance;

  document.getElementById('inv-spar-endwert').textContent  = fmtChf(sparBalance);
  document.getElementById('inv-invest-vs').textContent     = fmtChf(fv);
  document.getElementById('inv-invest-vs-label').textContent = invState.rate + '% Rendite';
  document.getElementById('inv-mehrertrag').textContent    = fmtChf(Math.max(0, mehrertrag));
  document.getElementById('inv-mehrertrag-label').textContent =
    'durch ' + invState.rate + '% Rendite statt 0.5% Sparkonto über ' + years + ' Jahre';

  // Jahrestabelle nur im Betrag-Modus zeigen
  var tblWrap = document.getElementById('inv-table');
  if (tblWrap) {
    var wrap = tblWrap.closest('div[style*="border-radius:12px"]') || tblWrap.parentElement;
    if (wrap) wrap.style.display = (invState.modus === 'ziel') ? 'none' : '';
  }
}


/* ── Invest-Modus: Ich zahle ein / Ich will erreichen ─────────── */
function setInvModus(modus) {
  invState.modus = modus;

  // Toggle-Buttons
  var btnB = document.getElementById('inv-tog-betrag');
  var btnZ = document.getElementById('inv-tog-ziel');
  if (btnB) {
    btnB.style.background = modus === 'betrag' ? 'white' : 'transparent';
    btnB.style.color      = modus === 'betrag' ? '#1A1A1A' : '#6B6B6B';
    btnB.style.fontWeight = modus === 'betrag' ? '600' : '500';
  }
  if (btnZ) {
    btnZ.style.background = modus === 'ziel' ? 'white' : 'transparent';
    btnZ.style.color      = modus === 'ziel' ? '#1A1A1A' : '#6B6B6B';
    btnZ.style.fontWeight = modus === 'ziel' ? '600' : '500';
  }

  // Panels ein-/ausblenden
  var pB = document.getElementById('inv-panel-betrag');
  var pZ = document.getElementById('inv-panel-ziel');
  var sc = document.getElementById('inv-goal-scenarios');
  if (pB) pB.style.display = modus === 'betrag' ? '' : 'none';
  if (pZ) pZ.style.display = modus === 'ziel'   ? '' : 'none';
  if (sc) sc.style.display = modus === 'ziel'   ? '' : 'none';

  if (modus === 'ziel') calcInvGoal();
  else calcInvest();
}

function setInvGoalRate(rate) {
  invGoalState.rate = rate;
  document.querySelectorAll('#inv-panel-ziel .inv-rate-btn').forEach(function(b) {
    b.classList.toggle('active', +b.dataset.rate === rate);
  });
  calcInvGoal();
}

function calcInvGoal() {
  var goal  = +document.getElementById('inv-goal-slider').value;
  var years = +document.getElementById('inv-goal-yrs').value;
  var rate  = invGoalState.rate || 5;

  // Anzeige aktualisieren
  document.getElementById('inv-goal-display').textContent =
    Math.round(goal).toLocaleString('de-CH');
  document.getElementById('inv-goal-yrs-display').textContent = years;

  invGoalState.goal  = goal;
  invGoalState.years = years;

  var months    = years * 12;
  var monthRate = rate / 12 / 100;

  // PMT: monatliche Rate für Zielbetrag
  var monthly = monthRate === 0
    ? goal / months
    : goal * monthRate / (Math.pow(1 + monthRate, months) - 1);

  var einbezahlt = monthly * months;
  var rendite    = goal - einbezahlt;
  var renditePct = Math.max(0, Math.round(rendite / goal * 100));
  var kapitalPct = 100 - renditePct;

  // Ergebnis-Box befüllen
  var rl = document.getElementById('inv-result-label');
  if (rl) rl.textContent =
    'Monatliche Rate · Ziel CHF ' +
    Math.round(goal).toLocaleString('de-CH') + ' in ' + years + ' J.';

  var ew = document.getElementById('inv-endwert');
  if (ew) ew.textContent = Math.round(monthly).toLocaleString('de-CH');

  var eb = document.getElementById('inv-einbezahlt');
  if (eb) eb.textContent = Math.round(Math.max(0, einbezahlt)).toLocaleString('de-CH');

  var rd = document.getElementById('inv-rendite');
  if (rd) rd.textContent = Math.round(Math.max(0, rendite)).toLocaleString('de-CH');

  var rp = document.getElementById('inv-rendite-pct');
  if (rp) rp.textContent = 'Rendite ' + renditePct + '%';

  var bk = document.getElementById('inv-bar-invested');
  var br = document.getElementById('inv-bar-return');
  if (bk) bk.style.width = kapitalPct + '%';
  if (br) br.style.width = renditePct + '%';

  // Szenarien-Vergleich 3% / 5% / 7%
  [3, 5, 7].forEach(function(r) {
    var mr = r / 12 / 100;
    var m  = mr === 0 ? goal / months
           : goal * mr / (Math.pow(1 + mr, months) - 1);
    var el = document.getElementById('inv-sc' + r);
    if (el) el.textContent = Math.round(m).toLocaleString('de-CH');
  });

  // Jahrestabelle im Ziel-Modus ausblenden
  var tbl = document.getElementById('inv-table');
  if (tbl) {
    var wrap = tbl.closest('div[style*="border-radius:12px"]') || tbl.parentElement;
    if (wrap) wrap.style.display = 'none';
  }
}

/* ── Gewohnheits-Booster Toggle (Jugend Fun) ───────────────────── */
function toggleHabitBoost(el) {
  var chk    = el.querySelector('.habit-chk');
  var active = el.getAttribute('data-active') === '1';
  if (active) {
    el.setAttribute('data-active', '0');
    el.style.background  = '#F4F4F4';
    el.style.border      = '.5px solid #E8E8E8';
    chk.style.background  = 'transparent';
    chk.style.borderColor = '#E8E8E8';
    chk.innerHTML = '';
  } else {
    el.setAttribute('data-active', '1');
    el.style.background  = '#EAF3DE';
    el.style.border      = '.5px solid #C0DD97';
    chk.style.background  = '#27500A';
    chk.style.borderColor = '#27500A';
    chk.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12">' +
      '<polyline points="2,6 5,9 10,3" stroke="white" stroke-width="1.8" ' +
      'fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  var total = 0;
  document.querySelectorAll('.habit-boost-item').forEach(function(h) {
    if (h.getAttribute('data-active') === '1') total += +h.getAttribute('data-val');
  });
  var eExtra = document.getElementById('habit-extra');
  var e10j   = document.getElementById('habit-10j');
  var eBar   = document.getElementById('habit-bar');
  if (eExtra) eExtra.textContent = fmtChf(total);
  if (e10j)   e10j.textContent   = fmtChf(fvCalc(total, INVEST_MONTHS, INVEST_RATE));
  if (eBar)   eBar.style.width   = Math.min(100, Math.round(total / 400 * 100)) + '%';
}

/* ── Invest-Boost Slider (Erwachsene Invest-Screen) ────────────── */
function calcInvBoost() {
  var s1 = document.getElementById('inv-boost-s1');
  var s2 = document.getElementById('inv-boost-s2');
  var s3 = document.getElementById('inv-boost-s3');
  if (!s1) return;
  var v1 = +s1.value, v2 = +s2.value, v3 = +s3.value;
  document.getElementById('inv-boost-v1').textContent = v1;
  document.getElementById('inv-boost-v2').textContent = v2;
  document.getElementById('inv-boost-v3').textContent = v3;
  var extra     = v1 + v2 + v3;
  var base      = invState.amount || 200;   // spiegelt aktuellen Betrag im Invest-Screen
  var total     = base + extra;
  var fv10base  = fvCalc(base,  INVEST_MONTHS, INVEST_RATE);
  var fv10total = fvCalc(total, INVEST_MONTHS, INVEST_RATE);
  document.getElementById('inv-boost-extra').textContent = fmtChf(extra);
  document.getElementById('inv-boost-total').textContent = fmtChf(fv10total);
  document.getElementById('inv-boost-diff').textContent  = fmtChf(fv10total - fv10base);
  var maxFv = fvCalc(base + 600, INVEST_MONTHS, INVEST_RATE);
  var pct   = Math.min(100, Math.round((fv10total / maxFv) * 100));
  document.getElementById('inv-boost-bar').style.width = pct + '%';
}

/* ================================================================
   GAMIFICATION — Badges, Level, Challenges, Games
   ================================================================ */

var xpHintDismissed = localStorage.getItem('xpHintDismissed') === '1';

// ── Badge-Definitionen ───────────────────────────────────────────
var BADGES = [
  { id: 'first_goal',    icon: '🎯', title: 'Erster Sparschritt',   desc: 'Erstes Sparziel erstellt',            check: function(){ return state.goals.length >= 1; } },
  { id: 'goal_reached',  icon: '🏆', title: 'Ziel erreicht!',       desc: 'Ein Sparziel vollständig erfüllt',    check: function(){ var cum=0; return state.goals.some(function(g){ var alloc=Math.min(Math.max(0,state.sparGuthaben-cum),(g.ziel||0)); cum+=(g.ziel||0); return (g.ziel||0)>0 && alloc>=(g.ziel||0); }); } },
  { id: 'three_goals',   icon: '💫', title: 'Visionär',             desc: 'Drei Sparziele gleichzeitig aktiv',   check: function(){ return state.goals.length >= 3; } },
  { id: 'big_dream',     icon: '🚀', title: 'Gross-Denker',         desc: 'Ziel über CHF 1\'000 angelegt',       check: function(){ return state.goals.some(function(g){ return (g.ziel||0) >= 1000; }); } },
  { id: 'haxx_master',   icon: '⚡', title: 'MoneyHaxx Master',     desc: 'Alle 6 Hacks verstanden',             check: function(){ return state.haxxDone.length >= 6; } },
  { id: 'budget_pro',    icon: '📊', title: 'Budget-Profi',         desc: 'Budget vollständig ausgefüllt',       check: function(){ var t=budgetCats.reduce(function(s,c){return s+c.pct;},0); return t===100; } },
  { id: 'invest_start',  icon: '📈', title: 'Investor',             desc: 'Geld-vermehren-Simulation gestartet', check: function(){ return state.investUsed || false; } },
  { id: 'story_hero',    icon: '🎲', title: 'Entscheider',          desc: 'Erste tägliche Entscheidung getroffen',check: function(){ return !!state.storyDate; } },
];

// ── Level-Definitionen ───────────────────────────────────────────
var LEVELS = [
  { min: 0,  max: 1,  badge: '🌱', title: 'Finanz-Einsteiger' },
  { min: 2,  max: 3,  badge: '🌿', title: 'Sparanfänger'      },
  { min: 4,  max: 5,  badge: '🌳', title: 'Budget-Profi'      },
  { min: 6,  max: 6,  badge: '💎', title: 'MoneyHaxx-Experte' },
  { min: 7,  max: 99, badge: '🏆', title: 'Finanz-Champion'   },
];

// ── Challenges ───────────────────────────────────────────────────
var CHALLENGES = [
  { id: 'ch_spar30',    icon: '<i class="ti ti-piggy-bank"></i>', title: '30-Tage Spar-Challenge',
    desc: 'Lege 30 Tage lang täglich einen kleinen Betrag zur Seite.',
    action: 'Jetzt starten', progress: 0, total: 30 },
  { id: 'ch_nullschulden', icon: '<i class="ti ti-file-text"></i>', title: 'Null-Schulden Challenge',
    desc: 'Richte einen monatlichen Dauerauftrag für Steuern ein.',
    action: 'Hack ansehen', progress: 0, total: 1 },
  { id: 'ch_budget',    icon: '📊', title: 'Budget ausgefüllt',
    desc: 'Verteile deinen Lohn vollständig im Budgetrechner.',
    action: 'Zum Budget', progress: 0, total: 1 },
];

function getEarnedBadges() {
  return BADGES.filter(function(b){ return b.check(); });
}

function getLevel(earnedCount) {
  for (var i = LEVELS.length - 1; i >= 0; i--) {
    if (earnedCount >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

/* ─── XP Youth Levels ───────────────────────────────────────── */
var YOUTH_LEVELS = [
  { min: 0,   max: 49,   badge: '🌱', title: 'Geld-Neuling',   next: 50   },
  { min: 50,  max: 149,  badge: '⭐', title: 'Spar-Starter',   next: 150  },
  { min: 150, max: 299,  badge: '🔥', title: 'Money-Macher',   next: 300  },
  { min: 300, max: 599,  badge: '💎', title: 'Finanz-Profi',   next: 600  },
  { min: 600, max: 999,  badge: '🏆', title: 'Money Hero',     next: 1000 },
  { min: 1000,max: 9999, badge: '👑', title: 'BLKB Legend',    next: null },
];

var DAILY_CHALLENGES = [
  { icon: '💰', title: 'Ausgaben notieren',       desc: 'Notiere heute alle deine Ausgaben.',       xp: 10 },
  { icon: '🐷', title: 'Ziel-Check',              desc: 'Überprüfe deinen Fortschritt bei einem Sparziel.', xp: 10 },
  { icon: '📚', title: 'Modul abschliessen',      desc: 'Schliesse ein Lernmodul in der Finanz-Schule ab.', xp: 20 },
  { icon: '⚡', title: 'Hack lesen',              desc: 'Lies einen MoneyHaxx-Tipp durch.',          xp: 10 },
  { icon: '🎯', title: 'Sparziel setzen',          desc: 'Setze dir heute ein neues Sparziel.',       xp: 15 },
  { icon: '💡', title: 'Frage beantworten',        desc: 'Beantworte die Frage des Tages richtig.',   xp: 15 },
  { icon: '📊', title: 'Budget prüfen',            desc: 'Schau dir dein Budget an und passe es an.', xp: 10 },
];

/* ─── Tägliche Story-Szenarien (Youth) ─────────────────────── */
var YOUTH_STORIES = [
  {
    situation: function(g) {
      var fehlend = g ? Math.max(0, (g.ziel||0) - state.sparGuthaben) : 0;
      return 'Du bekommst CHF 100 Geburtstagsgeld.' +
        (g ? ' Für dein Ziel «' + g.name + '» fehlen noch CHF ' + fehlend + '.' : '');
    },
    question: 'Was machst du mit dem Geld?',
    choices: [
      { text: '🎉 Alles für den Ausgang ausgeben', result: 'Spass gehabt! Aber dein Ziel verzögert sich um Wochen.', xp: 5 },
      { text: '⚖️ CHF 50 sparen, CHF 50 geniessen', result: 'Guter Kompromiss! Ziel bleibt auf Kurs.', xp: 15, best: true },
      { text: '🐷 Alles direkt zum Sparziel legen', result: 'Top! Dein Ziel rückt deutlich näher.', xp: 20 },
    ]
  },
  {
    situation: function(g) {
      return 'Freunde wollen ins Restaurant — Kosten CHF 35.' +
        (g ? ' Dein Ziel «' + g.name + '» ist fast in Reichweite.' : '');
    },
    question: 'Was entscheidest du?',
    choices: [
      { text: '🍽️ Mitgehen und CHF 35 ausgeben', result: 'Schöner Abend! Ziel etwas weiter weg.', xp: 5 },
      { text: '🥗 Mitgehen, aber günstiger essen (CHF 12)', result: 'Clever! Spass UND gespart.', xp: 20, best: true },
      { text: '🏠 Absagen, CHF 35 sparen', result: 'Diszipliniert — aber Balance ist auch wichtig.', xp: 10 },
    ]
  },
  {
    situation: function(g) {
      var fehlend = g ? Math.max(0, (g.ziel||0) - state.sparGuthaben) : 0;
      return 'Dein Ferienjob bringt CHF 650.' +
        (g ? ' Noch CHF ' + fehlend + ' bis zum Ziel «' + g.name + '».' : '');
    },
    question: 'Wie verwaltest du deinen ersten Lohn?',
    choices: [
      { text: '🛍️ Alles auf der Stelle ausgeben', result: 'Gönnen ist ok — aber in 2 Wochen ist alles weg.', xp: 5 },
      { text: '💡 Easy-10: CHF 65 sparen, Rest geniessen', result: 'Easy-10 Hack aktiv! Automatisch reicher werden.', xp: 15, best: true },
      { text: '⚖️ Hälfte sparen, Hälfte geniessen', result: 'Fifty-Fifty Hack! Starke Balance.', xp: 20 },
    ]
  },
  {
    situation: function(g) {
      return 'Du hast 3 Abos: Streaming, Musik, Gaming. Zusammen CHF 48/Mt.' +
        (g ? ' Das sind CHF 576/Jahr — fast dein ganzes Ziel «' + g.name + '».' : '');
    },
    question: 'Was machst du mit den Abonnements?',
    choices: [
      { text: '📺 Alle behalten', result: 'CHF 576/Jahr für Abos. Nutzt du wirklich alle?', xp: 5 },
      { text: '✂️ Eines kündigen (–CHF 16/Mt.)', result: 'Gespart: CHF 192/Jahr! Kleiner Schritt, grosse Wirkung.', xp: 15, best: true },
      { text: '✂️✂️ Zwei kündigen (–CHF 32/Mt.)', result: 'Gespart: CHF 384/Jahr! Direkter Zielboost.', xp: 20 },
    ]
  },
  {
    situation: function(g) {
      return 'Dein Freund hat das neue iPhone (CHF 1\'200). Dein Handy funktioniert noch gut.' +
        (g ? ' Du sparst gerade für «' + g.name + '».' : '');
    },
    question: 'Was tust du?',
    choices: [
      { text: '📱 Sofort kaufen — auf Kredit', result: 'Achtung: Kredite kosten extra. Nie eine gute Idee!', xp: 5 },
      { text: '⏳ Warten und monatlich sparen', result: 'In wenigen Monaten kannst du es dir leisten — ohne Schulden!', xp: 15, best: true },
      { text: '🔧 Altes Handy reparieren lassen (CHF 40)', result: 'Super smart! CHF 1\'160 gespart für wichtigere Ziele.', xp: 20 },
    ]
  },
];

var DAILY_QUIZ = [
  {
    q: 'Was ist Zinseszins?',
    opts: ['Zinsen auf Zinsen', 'Ein Kredit-Typ', 'Eine Steuerart', 'Eine Sparform'],
    correct: 0
  },
  {
    q: 'Was ist eine IBAN?',
    opts: ['Eine Kreditkarte', 'Internationale Bankkontonummer', 'Ein Finanzamt', 'Eine Versicherung'],
    correct: 1
  },
  {
    q: 'Was sind Zinsen?',
    opts: ['Gebühren für Kontoführung', 'Kosten für Bargeld', 'Entgelt für geliehenes Geld', 'Steuern auf Ersparnisse'],
    correct: 2
  },
  {
    q: 'Was ist Inflation?',
    opts: ['Steigende Löhne', 'Allgemeiner Preisanstieg', 'Sinkende Zinsen', 'Höhere Steuern'],
    correct: 1
  },
  {
    q: 'Was ist die Säule 3a?',
    opts: ['Eine Krankenversicherung', 'Obligatorische AHV', 'Gebundene Altersvorsorge', 'Ein Bankprodukt für Jugendliche'],
    correct: 2
  },
];

var ADULT_HABITS = [
  '✅ Budget gecheckt',
  '💸 Unnötige Ausgaben vermieden',
  '🎯 Sparziele überprüft',
  '📲 E-Banking gecheckt',
  '💰 Gespart wie geplant',
];

var ADULT_MONTHLY_CHALLENGES = [
  { text: '«Spare CHF 100 extra diesen Monat»',           cta: 'Zum Sparrechner',  view: 'goals' },
  { text: '«Kein Impulskauf für 2 Wochen»',              cta: 'Budget öffnen',    view: 'budget' },
  { text: '«Richte einen neuen Dauerauftrag ein»',       cta: 'Zur Übersicht',    view: 'home' },
  { text: '«Prüfe und aktualisiere dein Budget»',        cta: 'Budget öffnen',    view: 'budget' },
];

/* ─── Date helpers ──────────────────────────────────────────── */
function todayStr() {
  var d = new Date();
  return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
}
function thisWeekStr() {
  var d = new Date();
  // ISO week number
  var jan1 = new Date(d.getFullYear(), 0, 1);
  var week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return d.getFullYear() + '-W' + week;
}
function thisMonthStr() {
  var d = new Date();
  return d.getFullYear() + '-' + (d.getMonth()+1);
}
function dayOfYear() {
  var now = new Date();
  var start = new Date(now.getFullYear(), 0, 0);
  var diff = now - start;
  return Math.floor(diff / 86400000);
}

/* ─── XP & Streak ───────────────────────────────────────────── */
function addXP(amount) {
  state.xp = (state.xp || 0) + amount;
  save();
  updateGamification();
  showToast('+' + amount + ' XP! ⭐');
}

function getYouthLevel(xp) {
  for (var i = YOUTH_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= YOUTH_LEVELS[i].min) return YOUTH_LEVELS[i];
  }
  return YOUTH_LEVELS[0];
}

function checkStreak() {
  var today = todayStr();
  if (!state.lastStreakDate) {
    state.lastStreakDate = today;
    state.streak = 1;
    save();
    return;
  }
  if (state.lastStreakDate === today) return; // already counted today
  // Check if yesterday
  var last = new Date(state.lastStreakDate);
  var now = new Date(today);
  var diff = Math.round((now - last) / 86400000);
  if (diff === 1) {
    state.streak = (state.streak || 0) + 1;
  } else if (diff > 1) {
    state.streak = 1; // reset
  }
  state.lastStreakDate = today;
  save();
}

/* ─── Daily Challenge ───────────────────────────────────────── */
function claimDailyChallenge() {
  var today = todayStr();
  if (state.dailyChallengeDate === today && state.dailyChallengeXpClaimed) return;
  var idx = dayOfYear() % DAILY_CHALLENGES.length;
  var ch = DAILY_CHALLENGES[idx];
  state.dailyChallengeDate = today;
  state.dailyChallengeXpClaimed = true;
  state.xp = (state.xp || 0) + ch.xp;
  save();
  updateGamification();
  showToast('+' + ch.xp + ' XP! Challenge abgehakt ✓');
}

/* ─── Daily Quiz ────────────────────────────────────────────── */
function answerDailyQuiz(optIdx) {
  var today = todayStr();
  if (state.quizDate === today) return; // already answered
  var idx = dayOfYear() % DAILY_QUIZ.length;
  var q = DAILY_QUIZ[idx];
  var correct = optIdx === q.correct;
  state.quizDate = today;
  state.quizCorrect = correct;
  if (correct) {
    state.xp = (state.xp || 0) + 15;
  }
  save();
  renderYouthGamification();
  if (correct) {
    showToast('+15 XP! Richtig! 🎉');
  } else {
    showToast('Leider falsch. Morgen nächste Chance!');
  }
}

/* ─── Adult Habit Tracker ───────────────────────────────────── */
function toggleHabit(i) {
  // Check if week reset needed
  var week = thisWeekStr();
  if (state.monthlyHabitWeek !== week) {
    state.monthlyHabitDone = [false, false, false, false, false];
    state.monthlyHabitWeek = week;
  }
  state.monthlyHabitDone[i] = !state.monthlyHabitDone[i];
  save();
  renderAdultGamification();
}

/* ─── Adult Monthly Challenge ───────────────────────────────── */
function acceptMonthlyChallenge() {
  var month = thisMonthStr();
  state.monthlyChallengeDone = true;
  state.monthlyChallengeMonth = month;
  save();
  renderAdultGamification();
  showToast('Challenge angenommen! 💪');
}

/* ─── Youth Score ───────────────────────────────────────────── */
function calcYouthScore() {
  var score = 0;
  var tips = [];
  // +25 Sparziel gesetzt
  if (state.goals && state.goals.length > 0) {
    score += 25;
  } else {
    tips.push('Setze ein Sparziel (+25 Pkt.)');
  }
  // +25 Lektion abgeschlossen (check learnProgress)
  var learnDone = false;
  if (typeof learnProgress !== 'undefined') {
    for (var k in learnProgress) {
      if (learnProgress[k] > 0) { learnDone = true; break; }
    }
  }
  if (learnDone) {
    score += 25;
  } else {
    tips.push('Schliesse eine Lektion ab (+25 Pkt.)');
  }
  // +25 Budget ausgefüllt
  if (typeof budgetCats !== 'undefined') {
    var total = budgetCats.reduce(function(s, c) { return s + (c.pct || 0); }, 0);
    if (total === 100) {
      score += 25;
    } else {
      tips.push('Fülle dein Budget aus (+25 Pkt.)');
    }
  }
  // +25 App-Streak >= 3
  if ((state.streak || 0) >= 3) {
    score += 25;
  } else {
    tips.push('Halte 3 Tage Streak (+25 Pkt.)');
  }
  return { score: score, tips: tips };
}

/* ─── Adult Health Score ─────────────────────────────────────── */
function calcAdultHealthScore() {
  var pillars = [];

  // 1. Sparquote >= 10%
  var sparRate = state.lohn > 0 ? (state.monatlichesSparbudget / state.lohn) * 100 : 0;
  var p1 = sparRate >= 10;
  pillars.push({ label: 'Sparquote ≥ 10%', ok: p1, hint: p1 ? 'Sparquote: ' + Math.round(sparRate) + '%' : 'Aktuell: ' + Math.round(sparRate) + '%' });

  // 2. Notfallreserve gesetzt (ziel >= 1000)
  var hasReserve = state.goals && state.goals.some(function(g){ return (g.ziel || 0) >= 1000; });
  pillars.push({ label: 'Notfallreserve gesetzt', ok: hasReserve, hint: hasReserve ? 'Sparziel ≥ CHF 1\'000 vorhanden' : 'Kein Ziel ≥ CHF 1\'000' });

  // 3. Budget vollständig (budgetCats sum = 100)
  var budgetFull = false;
  if (typeof budgetCats !== 'undefined') {
    var bSum = budgetCats.reduce(function(s,c){return s+(c.pct||0);},0);
    budgetFull = bSum === 100;
  }
  pillars.push({ label: 'Budget vollständig', ok: budgetFull, hint: budgetFull ? 'Budget zu 100% verteilt' : 'Budget noch nicht vollständig' });

  // 4. Mind. 1 Sparziel aktiv
  var hasGoal = state.goals && state.goals.length > 0;
  pillars.push({ label: 'Mind. 1 Sparziel aktiv', ok: hasGoal, hint: hasGoal ? state.goals.length + ' Ziel(e) aktiv' : 'Noch kein Sparziel' });

  // 5. Invest/3a Simulation gestartet
  var investUsed = state.investUsed || false;
  pillars.push({ label: 'Invest/3a Simulation gestartet', ok: investUsed, hint: investUsed ? 'Simulation genutzt' : 'Simulation noch nicht genutzt' });

  var score = pillars.filter(function(p){ return p.ok; }).length * 20;
  return { score: score, pillars: pillars };
}

/* ─── Render: Youth ─────────────────────────────────────────── */
function renderYouthGamification() {
  var xp = state.xp || 0;
  var lvl = getYouthLevel(xp);
  var nextXp = lvl.next;
  var pct = nextXp ? Math.round(((xp - lvl.min) / (nextXp - lvl.min)) * 100) : 100;

  // Streak badge
  var sBadge = document.getElementById('youth-streak-badge');
  var sDays = document.getElementById('streak-days');
  if (sDays) sDays.textContent = (state.streak || 0);

  // Level / XP bar
  var fBdg = document.getElementById('fun-level-badge');
  var fLbl = document.getElementById('fun-level-title');
  var fSub = document.getElementById('fun-level-sub');
  var fBar = document.getElementById('fun-level-bar');
  var fNext = document.getElementById('youth-xp-next');
  if (fBdg) fBdg.textContent = lvl.badge;
  if (fLbl) fLbl.textContent = lvl.title;
  if (fSub) fSub.textContent = xp + ' XP · Level ' + (YOUTH_LEVELS.indexOf(lvl) + 1);
  if (fBar) fBar.style.width = pct + '%';
  if (fNext) fNext.textContent = nextXp ? (nextXp - xp) + ' XP bis zum nächsten Level' : '🏆 Maximales Level erreicht!';

  // Home screen badges/level (keep backward compat with badge-based system too)
  var earned = getEarnedBadges();
  var count = earned.length;
  var level = getLevel(count);
  var nextLvl = LEVELS.find(function(l){ return l.min > count; });
  var hPct = nextLvl ? Math.round((count - getLevel(count).min) / (nextLvl.min - getLevel(count).min) * 100) : 100;
  var lblEl = document.getElementById('home-level-title');
  var subEl = document.getElementById('home-level-sub');
  var barEl = document.getElementById('home-level-bar');
  var bdgEl = document.getElementById('home-level-badge');
  if (lblEl) lblEl.textContent = lvl.title;
  if (subEl) subEl.textContent = xp + ' XP · ' + count + ' Abzeichen';
  if (barEl) barEl.style.width = pct + '%';
  if (bdgEl) bdgEl.textContent = lvl.badge;

  // Dashboard Badges-Row + XP label
  var rowEl = document.getElementById('home-badges-row');
  var xpLblEl = document.getElementById('home-level-xp-label');
  if (xpLblEl) {
    var lvlNum = YOUTH_LEVELS.indexOf(lvl) + 1;
    xpLblEl.textContent = 'Level ' + lvlNum + ' · ' + xp + ' / ' + (nextXp || xp) + ' XP';
  }
  if (rowEl) {
    if (earned.length === 0) {
      rowEl.innerHTML = '<span style="font-size:11px;color:#94a3b8">Noch keine Abzeichen — leg los!</span>';
    } else {
      rowEl.innerHTML = earned.slice(0,4).map(function(b){
        return '<div title="' + b.title + '" style="width:28px;height:28px;background:#F4F4F4;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;font-size:14px;cursor:default">' + b.icon + '</div>';
      }).join('');
    }
  }

  // ── XP-Hint · Level-Roadmap · Daily Dashboard ───────────────
  var newCardsEl = document.getElementById('youth-new-cards');
  if (newCardsEl) {
    var todayN         = todayStr();
    var todayQuizDone  = state.quizDate === todayN;
    var todayChallenge = (state.dailyChallengeDate === todayN && state.dailyChallengeXpClaimed);
    var todayStory     = state.storyDate === todayN;

    // XP-Erklärung
    var xpHintHTML = xpHintDismissed ? '' :
      '<div id="xp-hint" style="margin:0 0 8px;background:#FFF3CD;' +
      'border-radius:10px;padding:9px 11px;border:.5px solid #FAC775">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
          '<div style="display:flex;gap:7px;align-items:flex-start;flex:1">' +
            '<div style="width:28px;height:28px;background:#FFF3CD;border-radius:7px;' +
              'display:flex;align-items:center;justify-content:center;' +
              'font-size:14px;flex-shrink:0">💡</div>' +
            '<div>' +
              '<div style="font-size:11px;font-weight:700;color:#633806;margin-bottom:3px">' +
                'Was sind XP?' +
              '</div>' +
              '<div style="font-size:10px;color:#854F0B;line-height:1.5">' +
                'XP = Experience Points. Du sammelst sie für jede Aktion in der App — ' +
                'Quiz lösen, Challenges abhaken, Lernmodule abschliessen. ' +
                'Je mehr XP, desto höher dein Level.' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div onclick="dismissXpHint()" ' +
            'style="width:18px;height:18px;border-radius:4px;background:rgba(133,79,11,.12);' +
            'display:flex;align-items:center;justify-content:center;flex-shrink:0;' +
            'margin-left:8px;cursor:pointer">' +
            '<svg width="8" height="8" viewBox="0 0 10 10" fill="none" ' +
              'stroke="#854F0B" stroke-width="2" stroke-linecap="round">' +
              '<line x1="2" y1="2" x2="8" y2="8"/>' +
              '<line x1="8" y1="2" x2="2" y2="8"/>' +
            '</svg>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Level-Roadmap
    var roadmapLevels = [
      { emoji:'🌱', title:'Geld-Neuling',  range:'0 – 49 XP',    min:0,    max:49   },
      { emoji:'⭐', title:'Spar-Starter',  range:'50 – 149 XP',  min:50,   max:149  },
      { emoji:'🔥', title:'Money-Macher',  range:'150 – 299 XP', min:150,  max:299  },
      { emoji:'💎', title:'Finanz-Profi',  range:'300 – 599 XP', min:300,  max:599  },
      { emoji:'🏆', title:'Money Hero',    range:'600 – 999 XP', min:600,  max:999  },
      { emoji:'👑', title:'BLKB Legend',   range:'ab 1000 XP',   min:1000, max:9999 },
    ];
    var currentXP  = xp;
    var currentLvl = 0;
    for (var rli = 0; rli < roadmapLevels.length; rli++) {
      if (currentXP >= roadmapLevels[rli].min) currentLvl = rli;
    }
    var roadmapNext = roadmapLevels[currentLvl + 1];
    var xpToNext    = roadmapNext ? (roadmapNext.min - currentXP) : 0;
    var nextAction  = !todayQuizDone  ? 'Tages-Quiz lösen (+15 XP)'   :
                      !todayChallenge ? 'Challenge abhaken (+20 XP)'   :
                      !todayStory     ? 'Story entscheiden (+20 XP)'   :
                                        'Morgen wieder vorbeischauen!';

    var roadmapHTML = '<div class="gam-card">' +
      '<div class="gam-section-label">Dein Weg zum Money Hero</div>' +
      roadmapLevels.map(function(rl, i) {
        var isActive = i === currentLvl;
        var isDone   = i <  currentLvl;
        var isNext   = i === currentLvl + 1;
        var isLast   = i === roadmapLevels.length - 1;
        var dotBg     = (isDone || isActive) ? '#EAF3DE' : '#F4F4F4';
        var dotBorder = isDone   ? '#3B6D11' : isActive ? '#E30613' : '#E8E8E8';
        var lineBg    = (isDone || isActive) ? '#E30613' : '#E8E8E8';
        var opacity   = (isDone || isActive) ? '1' : isNext ? '0.6' : '0.35';
        var badge = isActive ?
          '<span style="font-size:8px;font-weight:700;background:#EAF3DE;color:#27500A;padding:1px 6px;border-radius:4px">Aktiv</span>' :
          isDone ?
          '<span style="font-size:8px;font-weight:700;background:#EAF3DE;color:#27500A;padding:1px 6px;border-radius:4px">✓</span>' : '';
        var hint = (isNext && xpToNext > 0) ?
          '<div style="font-size:9px;color:#185FA5;margin-top:2px">→ ' + nextAction + '</div>' : '';
        var progBar = isActive ?
          '<div style="height:3px;background:#E8E8E8;border-radius:2px;margin-top:5px;overflow:hidden">' +
            '<div style="width:' +
              Math.round((currentXP - rl.min) / (rl.max - rl.min + 1) * 100) +
            '%;height:100%;background:#E30613;border-radius:2px"></div>' +
          '</div>' : '';
        return '<div style="display:flex;align-items:flex-start;gap:10px;' +
          'margin-bottom:' + (isLast ? '0' : '8px') + ';opacity:' + opacity + '">' +
          '<div style="display:flex;flex-direction:column;align-items:center">' +
            '<div style="width:28px;height:28px;border-radius:50%;background:' + dotBg + ';' +
              'border:2px solid ' + dotBorder + ';display:flex;align-items:center;' +
              'justify-content:center;font-size:13px;flex-shrink:0">' + rl.emoji + '</div>' +
            (!isLast ? '<div style="width:2px;height:16px;background:' + lineBg + ';' +
              'margin:2px 0;border-radius:1px"></div>' : '') +
          '</div>' +
          '<div style="flex:1;padding-top:3px">' +
            '<div style="display:flex;align-items:center;gap:5px;margin-bottom:1px">' +
              '<span style="font-size:11px;font-weight:600;color:#1A1A1A">' + rl.title + '</span>' + badge +
            '</div>' +
            '<div style="font-size:9px;color:#6B6B6B">' + rl.range + '</div>' +
            hint + progBar +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';

    // Daily Dashboard
    var todayMax    = 55;
    var todayEarned = (todayQuizDone ? 15 : 0) + (todayChallenge ? 20 : 0) + (todayStory ? 20 : 0);
    var todayLeft   = todayMax - todayEarned;
    var toNextLevel = roadmapNext ? (roadmapNext.min - currentXP) : 0;
    var canReach    = roadmapNext && todayLeft >= toNextLevel;

    var dailyHTML = '<div class="gam-card">' +
      '<div class="gam-section-label">Heute sammeln</div>' +
      '<div style="background:#F4F4F4;border-radius:9px;padding:8px 10px;margin-bottom:10px;' +
        'display:flex;justify-content:space-between;align-items:center">' +
        '<div>' +
          '<div style="font-size:10px;color:#6B6B6B">Heute verdient</div>' +
          '<div style="font-size:16px;font-weight:700;color:#1A1A1A">' + todayEarned + ' / ' + todayMax + ' XP</div>' +
        '</div>' +
        (canReach ?
          '<div style="font-size:9px;font-weight:700;color:#27500A;background:#EAF3DE;' +
            'padding:4px 8px;border-radius:6px;text-align:center">Heute Level<br>' +
            (currentLvl + 2) + ' möglich! 🎉</div>' :
          '<div style="font-size:9px;color:#6B6B6B;text-align:right">Noch ' + todayLeft + ' XP<br>heute möglich</div>') +
      '</div>' +
      [
        { emoji:'❓', label:'Tages-Quiz lösen',  xp:15, done:todayQuizDone,  bg:'#E6F1FB' },
        { emoji:'🎯', label:'Daily Challenge',    xp:20, done:todayChallenge, bg:'#FFF3CD' },
        { emoji:'🎲', label:'Story entscheiden',  xp:20, done:todayStory,     bg:'#EEEDFE' },
      ].map(function(a) {
        return '<div style="display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:.5px solid #F4F4F4">' +
          '<div style="width:32px;height:32px;background:' + a.bg + ';border-radius:8px;' +
            'display:flex;align-items:center;justify-content:center;font-size:15px;' +
            'flex-shrink:0' + (a.done ? ';opacity:.45' : '') + '">' + a.emoji + '</div>' +
          '<div style="flex:1"><div style="font-size:11px;font-weight:600;color:' +
            (a.done ? '#999' : '#1A1A1A') + ';' + (a.done ? 'text-decoration:line-through' : '') + '">' +
            a.label + '</div></div>' +
          (a.done ?
            '<span style="font-size:10px;font-weight:700;color:#27500A;background:#EAF3DE;' +
              'padding:2px 7px;border-radius:5px">✓ +' + a.xp + '</span>' :
            '<span style="font-size:10px;font-weight:700;color:#E30613">+' + a.xp + ' XP</span>') +
        '</div>';
      }).join('') +
      '<div style="padding-top:8px;font-size:9px;color:#6B6B6B;text-align:center">' +
        'Max. heute: ' + todayMax + ' XP · täglich neue Aufgaben' +
      '</div>' +
    '</div>';

    newCardsEl.innerHTML = xpHintHTML + roadmapHTML + dailyHTML;
  }

  // Daily Challenge
  var chEl = document.getElementById('youth-challenge-content');
  if (chEl) {
    var today = todayStr();
    var idx = dayOfYear() % DAILY_CHALLENGES.length;
    var ch = DAILY_CHALLENGES[idx];
    var done = (state.dailyChallengeDate === today && state.dailyChallengeXpClaimed);
    if (done) {
      chEl.innerHTML = '<div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--ok-l);border-radius:8px">' +
        '<div style="width:40px;height:40px;background:#FFF0F0;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">' + ch.icon + '</div>' +
        '<div><div style="font-size:14px;font-weight:700;color:var(--ok)">✓ ' + ch.title + '</div>' +
        '<div style="font-size:12px;color:var(--mid)">Heute abgehakt · +' + ch.xp + ' XP erhalten</div></div></div>';
    } else {
      chEl.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">' +
        '<div style="width:40px;height:40px;background:#FFF0F0;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">' + ch.icon + '</div>' +
        '<div style="flex:1"><div style="font-size:14px;font-weight:700;color:#1A1A1A">' + ch.title + '</div>' +
        '<div style="font-size:12px;color:#6B6B6B">' + ch.desc + '</div></div>' +
        '<button onclick="claimDailyChallenge()" style="padding:8px 14px;background:transparent;color:#E30613;border:1.5px solid #E30613;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0;font-family:inherit">+' + ch.xp + ' XP</button>' +
        '</div>';
    }
  }

  // Daily Quiz
  var quizEl = document.getElementById('youth-quiz-content');
  if (quizEl) {
    var today2 = todayStr();
    var qIdx = dayOfYear() % DAILY_QUIZ.length;
    var quiz = DAILY_QUIZ[qIdx];
    var answered = (state.quizDate === today2);
    if (answered) {
      var feedback = state.quizCorrect
        ? '<div style="padding:10px;background:var(--ok-l);border-radius:8px;color:var(--ok);font-size:13px;font-weight:700">✓ Richtig! +15 XP erhalten</div>'
        : '<div style="padding:10px;background:#fff0f0;border-radius:8px;color:var(--red);font-size:13px;font-weight:700">✗ Leider falsch. Richtig wäre: «' + quiz.opts[quiz.correct] + '»</div>';
      quizEl.innerHTML = '<div style="font-size:14px;font-weight:600;color:var(--dark);margin-bottom:10px">' + quiz.q + '</div>' + feedback +
        '<div style="font-size:11px;color:var(--light);margin-top:8px;text-align:center">Nächste Frage morgen!</div>';
    } else {
      var optsHtml = quiz.opts.map(function(opt, oi) {
        return '<button class="quiz-opt" onclick="answerDailyQuiz(' + oi + ')">' + opt + '</button>';
      }).join('');
      quizEl.innerHTML = '<div style="font-size:14px;font-weight:600;color:var(--dark);margin-bottom:10px">' + quiz.q + '</div>' + optsHtml +
        '<div style="font-size:11px;color:var(--light);margin-top:4px">Richtige Antwort = +15 XP</div>';
    }
  }

  // Youth Finanz-Score
  var sc = calcYouthScore();
  var scoreEl = document.getElementById('youth-score-num');
  var scoreBar = document.getElementById('youth-score-bar');
  var scoreDesc = document.getElementById('youth-score-desc');
  if (scoreEl) scoreEl.textContent = sc.score;
  if (scoreBar) {
    var col = sc.score >= 75 ? 'var(--ok)' : sc.score >= 50 ? 'var(--petrol)' : sc.score >= 25 ? 'var(--amber)' : 'var(--red)';
    scoreBar.style.width = sc.score + '%';
    scoreBar.style.background = col;
    scoreEl.style.color = col;
  }
  if (scoreDesc) {
    if (sc.tips.length === 0) {
      scoreDesc.textContent = '🏆 Perfekt! Alle Finanz-Ziele erfüllt!';
    } else {
      scoreDesc.textContent = sc.tips[0];
    }
  }

  // Badges Grid
  var grid = document.getElementById('fun-badges-grid');
  if (grid) {
    var html = '';
    BADGES.forEach(function(b) {
      var has = b.check();
      var ico = '<div style="width:36px;height:36px;background:' + (has?'#EAF3DE':'#F4F4F4') + ';border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">' + b.icon + '</div>';
      html += '<div style="display:flex;align-items:center;gap:8px;padding:10px;background:' + (has?'#EAF3DE':'#F4F4F4') + ';border-radius:10px;border:' + (has?'0.5px solid #C0DD97':'0.5px solid #E8E8E8') + ';' + (has?'':'opacity:0.5') + '">' +
        ico +
        '<div><div style="font-size:11px;font-weight:600;color:' + (has?'#27500A':'#6B6B6B') + '">' + b.title + '</div>' +
        '<div style="font-size:9px;color:' + (has?'#3B6D11':'#999') + '">' + b.desc + '</div></div>' +
      '</div>';
    });
    grid.innerHTML = html;
  }

  // Toast bei neuem Badge
  if (!state._lastBadgeCount) state._lastBadgeCount = 0;
  if (count > state._lastBadgeCount) {
    var newBadge = earned[count-1];
    showToast(newBadge.icon + ' Abzeichen verdient: ' + newBadge.title + '!');
    state._lastBadgeCount = count;
  }

  // Story-Szenario
  var stEl = document.getElementById('youth-story-content');
  if (stEl) renderYouthStoryScenario(stEl);

  // Ziele im Fokus (Youth)
  renderGoalsFocus('youth-goals-focus', false);

  // Gewohnheits-Booster (einmalig aufbauen — Toggle-State bleibt erhalten)
  var habitContainer = document.getElementById('youth-habit-booster');
  if (habitContainer && !habitContainer._built) {
    habitContainer._built = true;
    var habitData = [
      { emoji:'☕', bg:'#FFF3CD', label:'Kaffee to-go reduzieren',     sub:'CHF 5/Tag → spart CHF 150/Mt', val:150 },
      { emoji:'📺', bg:'#E6F1FB', label:'1 Streaming-Abo kündigen',     sub:'Spart CHF 80/Mt',              val:80  },
      { emoji:'🍔', bg:'#EEEDFE', label:'Weniger auswärts essen',        sub:'2× weniger/Woche → CHF 120/Mt',val:120 },
      { emoji:'🚗', bg:'#EAF3DE', label:'ÖV statt Auto/Taxi',           sub:'Spart CHF 50/Mt',              val:50  },
    ];
    habitContainer.innerHTML =
      '<div class="gam-card">' +
        '<div class="gam-section-label">Gewohnheits-Booster</div>' +
        '<div style="font-size:11px;color:#6B6B6B;margin-bottom:10px">' +
          'Wähle was du reduzieren möchtest — sieh sofort den Invest-Effekt.' +
        '</div>' +
        habitData.map(function(h) {
          return '<div class="habit-boost-item" data-val="' + h.val + '" ' +
            'onclick="toggleHabitBoost(this)" ' +
            'style="background:#F4F4F4;border-radius:10px;padding:10px 12px;' +
            'display:flex;align-items:center;gap:10px;cursor:pointer;' +
            'border:.5px solid #E8E8E8;margin-bottom:6px;transition:all .2s">' +
            '<div class="habit-chk" style="width:20px;height:20px;border-radius:5px;' +
              'border:2px solid #E8E8E8;display:flex;align-items:center;' +
              'justify-content:center;flex-shrink:0"></div>' +
            '<div style="width:32px;height:32px;background:' + h.bg + ';border-radius:8px;' +
              'display:flex;align-items:center;justify-content:center;' +
              'font-size:15px;flex-shrink:0">' + h.emoji + '</div>' +
            '<div style="flex:1">' +
              '<div style="font-size:12px;font-weight:600;color:#1A1A1A">' + h.label + '</div>' +
              '<div style="font-size:10px;color:#6B6B6B;margin-top:1px">' + h.sub + '</div>' +
            '</div>' +
            '<div style="font-size:12px;font-weight:700;color:#27500A">+' + h.val + '</div>' +
          '</div>';
        }).join('') +
        '<div style="display:flex;gap:8px;margin-top:10px">' +
          '<div style="flex:1;background:#F4F4F4;border-radius:10px;padding:10px;text-align:center">' +
            '<div style="font-size:10px;color:#6B6B6B;margin-bottom:3px">Zusätzlich/Mt</div>' +
            '<div style="font-size:18px;font-weight:700;color:#27500A">+CHF <span id="habit-extra">0</span></div>' +
          '</div>' +
          '<div style="flex:1;background:#1A1A2E;border-radius:10px;padding:10px;text-align:center">' +
            '<div style="font-size:10px;color:rgba(255,255,255,.5);margin-bottom:3px">Nach 10 J. mehr</div>' +
            '<div style="font-size:18px;font-weight:700;color:#6ee7b7">+CHF <span id="habit-10j">0</span></div>' +
          '</div>' +
        '</div>' +
        '<div style="height:6px;background:#E8E8E8;border-radius:3px;margin-top:8px;overflow:hidden">' +
          '<div id="habit-bar" style="height:100%;background:#3B6D11;border-radius:3px;transition:width .3s;width:0%"></div>' +
        '</div>' +
        '<div style="font-size:10px;color:#6B6B6B;text-align:center;margin-top:4px">' +
          'Max. Potenzial: CHF 400/Mt → CHF 62\'000 nach 10 Jahren' +
        '</div>' +
      '</div>';
  }
}

function dismissXpHint() {
  localStorage.setItem('xpHintDismissed', '1');
  xpHintDismissed = true;
  var el = document.getElementById('xp-hint');
  if (el) el.remove();
}

/* ─── Render: Adult ─────────────────────────────────────────── */
function renderAdultGamification() {
  // Health Score + Pillars
  var hs = calcAdultHealthScore();
  var numEl = document.getElementById('adult-health-num');
  var barEl = document.getElementById('adult-health-bar');
  var bdgEl = document.getElementById('adult-health-badge');
  var pillarsEl = document.getElementById('adult-pillars-list');

  var scoreColor = hs.score >= 90 ? 'var(--ok)' : hs.score >= 70 ? 'var(--petrol)' : hs.score >= 40 ? 'var(--amber)' : 'var(--red)';
  var scoreBg    = hs.score >= 90 ? 'var(--ok-l)' : hs.score >= 70 ? '#e8f4f8' : hs.score >= 40 ? 'var(--warn-l)' : '#fff0f0';
  var scoreLabel = hs.score >= 90 ? 'Ausgezeichnet' : hs.score >= 70 ? 'Gut' : hs.score >= 40 ? 'Ausbaufähig' : 'Handlungsbedarf';

  if (numEl) { numEl.textContent = hs.score; numEl.style.color = scoreColor; }
  if (barEl) { barEl.style.width = hs.score + '%'; barEl.style.background = scoreColor; }
  if (bdgEl) { bdgEl.textContent = scoreLabel; bdgEl.style.color = scoreColor; bdgEl.style.background = scoreBg; }
  if (pillarsEl) {
    pillarsEl.innerHTML = hs.pillars.map(function(p) {
      return '<div class="pillar-row">' +
        '<div><div style="font-size:13px;font-weight:600;color:var(--dark)">' + p.label + '</div>' +
        '<div style="font-size:11px;color:var(--mid)">' + p.hint + '</div></div>' +
        '<div style="display:flex;align-items:center;gap:6px">' +
        '<div style="width:28px;height:28px;background:' + (p.ok?'#EAF3DE':'#F4F4F4') + ';border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:14px">' + (p.ok?'✅':'❌') + '</div>' +
        '<span style="font-size:12px;font-weight:700;color:' + (p.ok?'var(--ok)':'var(--light)') + '">' + (p.ok?'+20':'0') + ' Pkt.</span>' +
        '</div></div>';
    }).join('');
  }

  // Habit Tracker — check week reset
  var week = thisWeekStr();
  if (state.monthlyHabitWeek !== week) {
    state.monthlyHabitDone = [false, false, false, false, false];
    state.monthlyHabitWeek = week;
    save();
  }
  var habitsEl = document.getElementById('adult-habits-list');
  var habitBar = document.getElementById('adult-habit-bar');
  var habitLabel = document.getElementById('adult-habit-progress-label');
  var habitDoneMsg = document.getElementById('adult-habit-done-msg');
  var doneCnt = state.monthlyHabitDone.filter(Boolean).length;
  if (habitsEl) {
    habitsEl.innerHTML = ADULT_HABITS.map(function(h, i) {
      var checked = state.monthlyHabitDone[i];
      return '<div class="habit-row' + (checked?' done':'') + '" onclick="toggleHabit(' + i + ')">' +
        '<div class="habit-check' + (checked?' checked':'') + '">' + (checked?'✓':'') + '</div>' +
        '<div class="habit-label">' + h + '</div></div>';
    }).join('');
  }
  if (habitBar) habitBar.style.width = (doneCnt / 5 * 100) + '%';
  if (habitLabel) habitLabel.textContent = doneCnt + '/5';
  if (habitDoneMsg) habitDoneMsg.style.display = doneCnt === 5 ? 'block' : 'none';

  // Monthly Challenge
  var monthCh = ADULT_MONTHLY_CHALLENGES[new Date().getMonth() % ADULT_MONTHLY_CHALLENGES.length];
  var curMonth = thisMonthStr();
  var chDone = state.monthlyChallengeDone && state.monthlyChallengeMonth === curMonth;
  var mchEl = document.getElementById('adult-monthly-challenge-content');
  if (mchEl) {
    if (chDone) {
      mchEl.innerHTML = '<div style="padding:10px;background:var(--ok-l);border-radius:8px;font-size:13px;font-weight:700;color:var(--ok)">✓ Challenge angenommen! Viel Erfolg diesen Monat!</div>';
    } else {
      mchEl.innerHTML = '<div style="font-size:15px;font-weight:600;color:#1A1A1A;margin-bottom:10px">' + monthCh.text + '</div>' +
        '<div style="display:flex;gap:8px">' +
        '<button onclick="acceptMonthlyChallenge()" style="flex:1;padding:10px;background:#E30613;color:white;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">Angenommen!</button>' +
        '<button onclick="switchView(\'' + monthCh.view + '\',0)" style="flex:1;padding:10px;background:transparent;color:#E30613;border:1.5px solid #E30613;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">' + monthCh.cta + '</button>' +
        '</div>';
    }
  }

  // Scenarios — dynamisch mit echten Nutzerdaten
  var scenEl = document.getElementById('adult-scenarios-list');
  if (scenEl) {
    var uLohn = state.lohn || 0;
    var uMSpar = state.monatlichesSparbudget || 0;
    var uAge   = state.age || 25;
    var topGoal = state.goals && state.goals.length > 0 ? state.goals[0] : null;

    // Szenario 1: +CHF 50/Mt. — Compound über 10 Jahre @ 5%
    var extra = 50;
    var val50 = Math.round(extra * 12 * (Math.pow(1.05, 10) - 1) / 0.05 * Math.pow(1.05, 0));
    // vereinfacht: FV annuity = PMT * ((1+r)^n - 1)/r, monatlich approximiert als jahresbetrag
    val50 = Math.round(extra * ((Math.pow(1 + 0.05/12, 120) - 1) / (0.05/12)));
    var goalImpact = '';
    if (topGoal && state.sparGuthaben < (topGoal.ziel||0)) {
      var f0 = Math.max(0, (topGoal.ziel||0) - state.sparGuthaben);
      var mn = uMSpar > 0 ? Math.ceil(f0 / uMSpar) : 0;
      var mp = (uMSpar + extra) > 0 ? Math.ceil(f0 / (uMSpar + extra)) : 0;
      if (mn - mp > 0) goalImpact = ' · «' + (topGoal.name||'Ziel') + '» ' + (mn-mp) + ' Mt. früher';
    }

    // Szenario 2: 1 Kaffee/Tag weniger
    var coffeeYear = 5 * 365;
    var coffeePct = uLohn > 0 ? Math.round(coffeeYear / (uLohn * 12) * 100) : 0;

    // Szenario 3: Säule 3a — bis Rentenalter @ 4%
    var retAge = 65;
    var yearsLeft = Math.max(1, retAge - uAge);
    var m3a = 200;
    var val3a = Math.round(m3a * ((Math.pow(1 + 0.04/12, yearsLeft*12) - 1) / (0.04/12)));

    var scenarios = [
      {
        icon: '💰',
        title: '+CHF ' + extra + '/Mt. mehr sparen',
        desc: 'In 10 Jahren bei 5% Rendite' + goalImpact + ':',
        value: 'CHF ' + val50.toLocaleString('de-CH'),
        cta: 'Investrechner', action: "switchView('invest',0)"
      },
      {
        icon: '☕',
        title: '1 Kaffee/Tag weniger',
        desc: 'CHF 5/Tag = CHF ' + coffeeYear.toLocaleString('de-CH') + '/Jahr' + (coffeePct > 0 ? ' (' + coffeePct + '% deines Jahreseinkommens)' : '') + ':',
        value: 'CHF ' + coffeeYear.toLocaleString('de-CH') + '/Jahr gespart',
        cta: 'Budget prüfen', action: "switchView('budget',0)"
      },
      {
        icon: '🏛️',
        title: 'Säule 3a CHF ' + m3a + '/Mt.',
        desc: yearsLeft + ' Jahre bis Rente (Ø 4% Rendite):',
        value: 'CHF ' + val3a.toLocaleString('de-CH'),
        cta: '3a-Simulation', action: "switchView('invest',0)"
      },
    ];
    scenEl.innerHTML = scenarios.map(function(s) {
      return '<div class="scenario-card">' +
        '<div style="display:flex;align-items:center;gap:8px">' +
        '<div style="width:40px;height:40px;background:#F4F4F4;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">' + s.icon + '</div>' +
        '<div style="font-size:14px;font-weight:600;color:#1A1A1A">' + s.title + '</div></div>' +
        '<div style="font-size:12px;color:#6B6B6B">' + s.desc + '</div>' +
        '<div class="scenario-value" style="color:#27500A">' + s.value + '</div>' +
        '<button onclick="' + s.action + '" style="padding:8px 14px;background:#E30613;color:white;border:none;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;align-self:flex-start;font-family:inherit">' + s.cta + '</button>' +
        '</div>';
    }).join('');
  }

  // Ziele im Fokus (Adult)
  renderGoalsFocus('adult-goals-focus', true);

  // CH-Benchmark
  var benchEl = document.getElementById('adult-benchmark-content');
  if (benchEl) {
    var userRate = state.lohn > 0 ? Math.round((state.monatlichesSparbudget / state.lohn) * 100) : 0;
    var chAvg = 12.4;
    var maxRate = Math.max(userRate, chAvg, 20);
    var userPct = Math.min(100, Math.round(userRate / maxRate * 100));
    var chPct   = Math.min(100, Math.round(chAvg / maxRate * 100));
    var isAbove = userRate >= chAvg;
    var msg = isAbove
      ? '🎉 Deine Sparquote liegt über dem Schweizer Durchschnitt!'
      : '💡 Der CH-Durchschnitt liegt bei 12.4%. Mit kleinen Anpassungen kannst du mehr sparen.';

    benchEl.innerHTML = '<div style="margin-bottom:8px">' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--mid);margin-bottom:4px">' +
      '<span>Du: <strong style="color:var(--dark)">' + userRate + '%</strong></span>' +
      '<span>CH-Durchschnitt: <strong style="color:var(--dark)">' + chAvg + '%</strong> <span style="font-size:10px">(BFS 2023)</span></span>' +
      '</div>' +
      '<div style="position:relative;height:12px;background:var(--border);border-radius:6px;overflow:visible">' +
      '<div style="position:absolute;left:0;top:0;height:100%;width:' + userPct + '%;background:' + (isAbove?'var(--ok)':'var(--amber)') + ';border-radius:6px;transition:width .5s"></div>' +
      '<div style="position:absolute;left:' + chPct + '%;top:-4px;width:2px;height:20px;background:var(--dark);border-radius:1px"></div>' +
      '<div style="position:absolute;left:' + chPct + '%;top:18px;font-size:10px;color:var(--mid);transform:translateX(-50%);white-space:nowrap">Ø CH 12.4%</div>' +
      '</div>' +
      '</div>' +
      '<div style="font-size:12px;color:var(--mid);margin-top:28px">' + msg + '</div>';
  }
}

/* ─── Main updateGamification (replaces old function) ───────── */
function updateGamification() {
  checkStreak();
  renderYouthGamification();
  renderAdultGamification();
  renderLearnChapters();
  updateHomeLearnMission();
}

/* ── Story-Szenario (Youth) ─────────────────────────────────────── */
function answerStoryScenario(choiceIdx) {
  var today = todayStr();
  if (state.storyDate === today) return;
  var sIdx = dayOfYear() % YOUTH_STORIES.length;
  var choice = YOUTH_STORIES[sIdx].choices[choiceIdx];
  state.storyDate = today;
  state.storyChoice = choiceIdx;
  state.xp = (state.xp || 0) + choice.xp;
  save();
  renderYouthGamification();
  showToast('+' + choice.xp + ' XP! ' + (choice.best ? '🏆 Beste Entscheidung!' : ''));
}

function renderYouthStoryScenario(el) {
  var today = todayStr();
  var sIdx = dayOfYear() % YOUTH_STORIES.length;
  var story = YOUTH_STORIES[sIdx];
  var g = state.goals && state.goals.length > 0 ? state.goals[0] : null;
  var answered = state.storyDate === today;
  if (answered) {
    var ch = story.choices[state.storyChoice];
    el.innerHTML =
      '<div style="font-size:13px;font-weight:600;color:var(--dark);margin-bottom:6px">' + story.situation(g) + '</div>' +
      '<div style="font-size:12px;color:var(--mid);margin-bottom:8px">' + story.question + '</div>' +
      '<div style="padding:10px;background:' + (ch.best ? 'var(--ok-l)' : 'var(--warn-l)') + ';border-radius:8px;margin-bottom:6px">' +
        '<div style="font-size:13px;font-weight:700;color:' + (ch.best ? 'var(--ok)' : 'var(--amber)') + '">' + ch.text + '</div>' +
        '<div style="font-size:12px;color:var(--mid);margin-top:4px">' + ch.result + '</div>' +
        '<div style="font-size:11px;font-weight:700;color:' + (ch.best ? 'var(--ok)' : 'var(--amber)') + ';margin-top:4px">+' + ch.xp + ' XP erhalten</div>' +
      '</div>' +
      '<div style="font-size:11px;color:var(--light);text-align:center">Nächste Entscheidung morgen!</div>';
  } else {
    var choicesHtml = story.choices.map(function(c, i) {
      return '<button onclick="answerStoryScenario(' + i + ')" style="display:block;width:100%;text-align:left;padding:10px 12px;margin-bottom:6px;border-radius:8px;border:1px solid var(--border);background:var(--bg);font-size:13px;color:var(--dark);cursor:pointer;-webkit-tap-highlight-color:transparent">' + c.text + '</button>';
    }).join('');
    el.innerHTML =
      '<div style="font-size:13px;font-weight:600;color:var(--dark);margin-bottom:6px">' + story.situation(g) + '</div>' +
      '<div style="font-size:12px;color:var(--mid);margin-bottom:10px">' + story.question + '</div>' +
      choicesHtml +
      '<div style="font-size:11px;color:var(--light);margin-top:2px">Jede Entscheidung bringt XP — beste Wahl = 20 XP!</div>';
  }
}

/* ── Ziele im Fokus (Youth + Adult) ─────────────────────────────── */
function renderGoalsFocus(elId, isAdult) {
  var el = document.getElementById(elId);
  if (!el) return;
  var goals = state.goals || [];
  var mSpar = state.monatlichesSparbudget || 0;

  if (goals.length === 0) {
    el.innerHTML =
      '<div style="text-align:center;padding:16px 0;color:var(--mid)">' +
      '<div style="width:40px;height:40px;background:#FFF3CD;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 8px">🎯</div>' +
      '<div style="font-size:13px">Noch keine Sparziele gesetzt.</div>' +
      '<button onclick="switchView(\'goals\',0)" style="margin-top:10px;padding:8px 16px;background:' + (isAdult?'var(--petrol)':'var(--red)') + ';color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">Erstes Ziel anlegen →</button>' +
      '</div>';
    return;
  }

  var colors = ['var(--red)', 'var(--amber)', 'var(--petrol)'];
  var html = '';
  var cumulative = 0;
  goals.slice(0, 3).forEach(function(g, i) {
    var target    = g.ziel || 0;
    var cumulSum  = cumulative + target;
    var available = Math.max(0, state.sparGuthaben - cumulative);
    var allocated = Math.min(available, target);
    var fehlend   = Math.max(0, cumulSum - state.sparGuthaben);
    var pct       = target > 0 ? Math.min(100, Math.round(allocated / target * 100)) : 0;
    var done      = pct >= 100 && target > 0;
    var months    = fehlend > 0 && mSpar > 0 ? Math.ceil(fehlend / mSpar) : 0;
    var timeStr   = done ? '✅ Erreicht!' : months === 0 ? '—' :
      months < 12 ? '~' + months + ' Mt.' :
      '~' + Math.floor(months/12) + ' J.' + (months%12 > 0 ? ' ' + months%12 + ' Mt.' : '');
    var col = colors[i] || 'var(--mid)';
    html +=
      '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">' +
      '<div style="width:26px;height:26px;border-radius:50%;background:' + col + ';color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0">P' + (i+1) + '</div>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-size:12px;font-weight:700;color:var(--dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (g.emoji||'🎯') + ' ' + (g.name||'Ziel') + '</div>' +
        '<div style="height:4px;background:var(--border);border-radius:2px;margin:3px 0;overflow:hidden">' +
          '<div style="height:100%;width:' + pct + '%;background:' + col + ';border-radius:2px;transition:width .4s"></div>' +
        '</div>' +
        '<div style="font-size:10px;color:var(--light)">CHF ' + allocated.toLocaleString('de-CH') + ' / ' + target.toLocaleString('de-CH') + '</div>' +
      '</div>' +
      '<div style="text-align:right;flex-shrink:0">' +
        '<div style="font-size:12px;font-weight:700;color:' + col + '">' + timeStr + '</div>' +
        (!done && fehlend > 0 ? '<div style="font-size:10px;color:var(--light)">CHF ' + fehlend.toLocaleString('de-CH') + ' fehlen</div>' : '') +
      '</div>' +
      '</div>';
    cumulative += target;
  });

  // «+CHF 50 Effekt» auf P1-Ziel
  if (mSpar > 0 && goals[0] && state.sparGuthaben < (goals[0].ziel||0)) {
    var g0 = goals[0];
    var f0 = Math.max(0, (g0.ziel||0) - state.sparGuthaben);
    var mnow  = Math.ceil(f0 / mSpar);
    var mplus = Math.ceil(f0 / (mSpar + 50));
    var saved = mnow - mplus;
    if (saved > 0) {
      html += '<div style="margin-top:10px;padding:10px;background:var(--ok-l);border-radius:8px;border:1px solid rgba(22,163,74,.15)">' +
        '<div style="font-size:12px;font-weight:700;color:var(--ok)">💡 Wenn du CHF 50/Mt. mehr sparst:</div>' +
        '<div style="font-size:12px;color:var(--ok);margin-top:2px">«' + (g0.name||'Ziel') + '» ' + saved + ' ' + (saved === 1 ? 'Monat' : 'Monate') + ' früher erreicht!</div>' +
        '</div>';
    }
  }

  // Adult: CHF-100k-Milestone
  if (isAdult && mSpar > 0) {
    var m100k = Math.ceil(100000 / mSpar);
    var y100k = Math.floor(m100k / 12);
    var r100k = m100k % 12;
    var p100k = y100k > 0 ? y100k + ' J.' + (r100k > 0 ? ' ' + r100k + ' Mt.' : '') : r100k + ' Mt.';
    html += '<div style="margin-top:10px;padding:10px;background:#e8f4f8;border-radius:8px">' +
      '<div style="font-size:12px;font-weight:700;color:var(--petrol)">🏦 Dein Weg zu CHF 100\'000</div>' +
      '<div style="font-size:13px;font-weight:800;color:var(--dark);margin-top:2px">Bei CHF ' + mSpar.toLocaleString('de-CH') + '/Mt.: ' + p100k + '</div>' +
      '<div style="font-size:11px;color:var(--mid);margin-top:2px">Mit ~5% Rendite im Investrechner deutlich schneller.</div>' +
      '<button onclick="switchView(\'invest\',0)" style="margin-top:8px;padding:7px 14px;background:var(--petrol);color:white;border:none;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer">Simulation öffnen →</button>' +
      '</div>';
  }

  var btnColor = isAdult ? 'var(--petrol)' : 'var(--red)';
  html += '<button onclick="switchView(\'goals\',0)" style="width:100%;margin-top:10px;padding:9px;background:transparent;color:' + btnColor + ';border:1px solid ' + btnColor + ';border-radius:8px;font-size:12px;font-weight:700;cursor:pointer">Alle Ziele verwalten →</button>';
  el.innerHTML = html;
}


/* ================================================================
   API ABSTRACTION LAYER — BLKB Avaloq / ACP Integration
   ----------------------------------------------------------------
   Alle Datenpunkte die später über REST/ACP bezogen werden sind
   hier zentralisiert. Jede Funktion ist ein Stub:
     • Im MOCK-Modus: gibt lokale Testdaten zurück (Promise)
     • Im LIVE-Modus: ersetzt durch echten fetch()-Aufruf
   
   Konfiguration:
     API_CONFIG.mock = true   → Stubdaten (aktuell aktiv)
     API_CONFIG.mock = false  → Echte Avaloq-Endpunkte
     API_CONFIG.baseUrl       → ACP Gateway URL
     API_CONFIG.token         → Bearer Token (z.B. OAuth2)
   ================================================================ */

var API_CONFIG = {
  mock:    true,
  baseUrl: 'https://api.blkb.ch/acp/v1',   // TODO: produktiver ACP-Endpunkt
  token:   null,                             // TODO: OAuth2 Bearer Token
};

// DEMO-Badge ausblenden wenn live
if (!API_CONFIG.mock) {
  document.addEventListener('DOMContentLoaded', function() {
    var badge = document.getElementById('dash-mock-badge');
    if (badge) badge.style.display = 'none';
  });
}

/* ----------------------------------------------------------------
   INTERN: HTTP-Helfer
   ---------------------------------------------------------------- */
function apiGet(path) {
  if (API_CONFIG.mock) {
    return Promise.reject(new Error('MOCK_MODE'));
  }
  return fetch(API_CONFIG.baseUrl + path, {
    headers: {
      'Authorization': 'Bearer ' + API_CONFIG.token,
      'Content-Type':  'application/json',
    }
  }).then(function(r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
}

/* ----------------------------------------------------------------
   1. ALLE BP-KONTEN (Business Partner / Avaloq)
   ----------------------------------------------------------------
   Avaloq-Endpoint (Beispiel):
     GET /customers/me/accounts
   Response:
     [{ "accountId": "...", "iban": "CH56...", "name": "...",
        "balance": 1247.50, "currency": "CHF",
        "type": "PRIVATE|SAVINGS|SAVINGS_3A|YOUTH" }]
   Logik:
     • Alle Konten → Dashboard
     • SAVINGS + YOUTH → Summe = Sparkonto-Guthaben (Sparziele)
     • SAVINGS_3A → Säule 3a Saldo (Geld vermehren)
   ---------------------------------------------------------------- */
function api_getBPAccounts() {
  return apiGet('/customers/me/accounts').catch(function() {
    // MOCK — typisches Jugend-BP-Portfolio
    return [
      { accountId: 'PRV-001', iban: 'CH56 0785 1234 5678 9000 0',
        name: 'Jugendkonto',      type: 'YOUTH',      balance: 1247.50, currency: 'CHF' },
      { accountId: 'SAV-001', iban: 'CH56 0785 1234 5678 9001 0',
        name: 'Sparkonto Jugend', type: 'SAVINGS',     balance: 2500.00, currency: 'CHF' },

    ];
  });
}


/* ----------------------------------------------------------------
   3. TRANSAKTIONEN (letzte N Buchungen)
   ----------------------------------------------------------------
   Avaloq-Endpoint (Beispiel):
     GET /accounts/{accountId}/transactions?limit=10
   Response:
     [{ "date": "2026-03-24", "amount": -45.20, "text": "Coop",
        "category": "FOOD", "balance": 1247.50 }]
   ---------------------------------------------------------------- */
function api_getTransaktionen(limit) {
  return apiGet('/accounts/me/transactions?limit=' + (limit || 5)).catch(function() {
    // MOCK — fiktive Buchungen
    return [
      { date: '2026-03-24', amount: -45.20,  text: 'Coop Pratteln',    category: 'FOOD'      },
      { date: '2026-03-23', amount: -12.50,  text: 'SBB Ticket',       category: 'TRANSPORT' },
      { date: '2026-03-22', amount: +3200.00, text: 'Lohn März 2026',   category: 'INCOME'    },
      { date: '2026-03-20', amount: -320.00, text: 'Krankenkasse',      category: 'INSURANCE' },
      { date: '2026-03-18', amount: -89.90,  text: 'Zalando',           category: 'SHOPPING'  },
    ];
  });
}

/* ----------------------------------------------------------------
   4. KUNDENPROFIL (Name, Alter, Produktstatus)
   ----------------------------------------------------------------
   Avaloq-Endpoint (Beispiel):
     GET /customers/me/profile
   Response:
     { "firstName": "Lara", "lastName": "Muster", "birthDate": "2008-04-12",
       "products": ["JUGENDKONTO", "PROFITCARD", "TWINT"],
       "segment": "JUGEND" }
   ---------------------------------------------------------------- */
function api_getKundenprofil() {
  return apiGet('/customers/me/profile').catch(function() {
    // MOCK — fiktives Profil
    return { firstName: 'Lara', lastName: 'Muster',
             birthDate: '2008-04-12', age: 17, gender: 'f',
             products: ['JUGENDKONTO', 'PROFITCARD', 'TWINT'],
             segment: 'JUGEND' };
  });
}

/* ----------------------------------------------------------------
   5. FONDSSPARPLAN (Get-Rich Hack)
   ----------------------------------------------------------------
   Avaloq-Endpoint (Beispiel):
     GET /investments/{customerId}/savingsplan
   Response:
     { "active": false, "monthlyAmount": 0, "fund": null,
       "performance": null }
   ---------------------------------------------------------------- */
function api_getFondssparplan() {
  return apiGet('/investments/me/savingsplan').catch(function() {
    // MOCK — kein Fondssparplan aktiv
    return { active: false, monthlyAmount: 0, fund: null };
  });
}

/* ================================================================
   API-INIT — Daten beim Start laden und in State schreiben
   Wird von init() aufgerufen. Bei Fehler: Stubwerte bleiben.
   ================================================================ */
function apiInit() {
  // Alle BP-Konten zentral laden
  api_getBPAccounts().then(function(accounts) {
    renderDashboardAccounts(accounts);

    // Sparkonten summieren → nur SAVINGS (kein Jugendkonto/YOUTH)
    var sparAccounts = accounts.filter(function(a){
      return a.type === 'SAVINGS';
    });
    var sparTotal = sparAccounts.reduce(function(s,a){ return s + a.balance; }, 0);
    state.sparGuthaben = sparTotal;
    var dispEl = document.getElementById('goals-spar-display');
    var inpEl  = document.getElementById('goals-spar-input');
    if (dispEl) dispEl.textContent = Math.round(sparTotal).toLocaleString('de-CH');
    if (inpEl)  inpEl.value = Math.round(sparTotal);
    renderGoals();

    // Säule 3a → Geld vermehren
    var acc3a = accounts.find(function(a){ return a.type === 'SAVINGS_3A'; });
    var bal3a = acc3a ? acc3a.balance : 0;
    state.saldo3a = bal3a;
    render3aInvest(bal3a, !!acc3a);
  });

  // Kundenprofil → Alter setzen
  api_getKundenprofil().then(function(data) {
    if (data.age && data.age >= 12 && data.age <= 30) {
      state.age = data.age;
      setAge(data.age);
    }
    if (data.gender === 'f' || data.gender === 'm') {
      invState.gender = data.gender;
      var maleBtn   = document.getElementById('inv-btn-male');
      var femaleBtn = document.getElementById('inv-btn-female');
      if (maleBtn)   maleBtn.classList.toggle('active',   data.gender === 'm');
      if (femaleBtn) femaleBtn.classList.toggle('active', data.gender === 'f');
    }
  });
}

/* ----------------------------------------------------------------
   Dashboard: alle Konten des BP rendern
   ---------------------------------------------------------------- */
function renderDashboardAccounts(accounts) {
  var container = document.getElementById('dash-accounts');
  if (!container) return;

  var typeLabel = { YOUTH: 'Jugendkonto', PRIVATE: 'Privatkonto',
                    SAVINGS: 'Sparkonto', SAVINGS_3A: 'Säule 3a' };
  function acctIcon(bg, stroke) {
    return '<div style="width:40px;height:40px;background:'+bg+';border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:10px">' +
      '<svg width="22" height="22" viewBox="0 0 32 32">' +
        '<rect x="2" y="8" width="24" height="17" rx="3" fill="'+stroke+'" opacity="0.2"/>' +
        '<rect x="2" y="8" width="24" height="17" rx="3" stroke="'+stroke+'" stroke-width="1.8" fill="none"/>' +
        '<line x1="2" y1="12" x2="26" y2="12" stroke="'+stroke+'" stroke-width="1.8"/>' +
        '<line x1="2" y1="16" x2="26" y2="16" stroke="'+stroke+'" stroke-width="1.8"/>' +
        '<rect x="18" y="3" width="12" height="8" rx="2" fill="'+stroke+'" opacity="0.5"/>' +
        '<rect x="18" y="3" width="12" height="8" rx="2" stroke="'+stroke+'" stroke-width="1.8" fill="none"/>' +
        '<line x1="20" y1="7" x2="28" y2="7" stroke="white" stroke-width="1.2" stroke-linecap="round"/>' +
      '</svg></div>';
  }
  var typeIconDT = {
    YOUTH:     acctIcon('#E6F1FB', '#185FA5'),
    PRIVATE:   acctIcon('#E6F1FB', '#185FA5'),
    SAVINGS:   acctIcon('#FFF3CD', '#854F0B'),
    SAVINGS_3A:acctIcon('#E1F5EE', '#085041')
  };

  var html = '';
  accounts.forEach(function(acc) {
    var lbl     = typeLabel[acc.type] || acc.name;
    var iconHtml = typeIconDT[acc.type] || dtIcon('neutral', 'card');
    var bal     = acc.balance.toLocaleString('de-CH', {minimumFractionDigits:2, maximumFractionDigits:2});

    html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #E8E8E8">' +
      iconHtml +
      '<div style="flex:1">' +
        '<div style="font-size:13px;font-weight:600;color:#1A1A1A">' + (acc.name || lbl) + '</div>' +
        '<div style="font-size:10px;color:#94a3b8;margin-top:1px">' + (acc.iban || lbl) + '</div>' +
      '</div>' +
      '<div style="text-align:right">' +
        '<div style="font-size:14px;font-weight:700;color:#1A1A1A">CHF ' + bal + '</div>' +
        '<div style="font-size:10px;color:#94a3b8;margin-top:1px">' + lbl + '</div>' +
      '</div>' +
    '</div>';
  });

  if (!html) html = '<div style="padding:16px;text-align:center;color:var(--light);font-size:12px">Keine Konten gefunden</div>';
  container.innerHTML = html;
}

/* ----------------------------------------------------------------
   Säule 3a in Geld-vermehren Screen integrieren
   ---------------------------------------------------------------- */
function render3aInvest(balance, hasAccount) {
  var box = document.getElementById('inv-3a-saldo-box');
  if (!box) return;

  var bal = balance.toLocaleString('de-CH', {minimumFractionDigits:2, maximumFractionDigits:2});

  if (hasAccount) {
    box.innerHTML =
      '<div style="font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px">Dein bisheriges Säule 3a Guthaben · BLKB</div>' +
      '<div style="font-size:22px;font-weight:700;color:var(--dark)">CHF ' + bal + '</div>' +
      '<div style="font-size:11px;color:#92400e;margin-top:3px">Dieses Guthaben wächst mit deinen weiteren Einzahlungen</div>';
    box.style.display = 'block';
  } else {
    box.innerHTML =
      '<div style="font-size:11px;font-weight:700;color:var(--mid);text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px">Dein bisheriges Säule 3a Guthaben</div>' +
      '<div style="font-size:22px;font-weight:700;color:var(--light)">CHF 0.00</div>' +
      '<div style="font-size:11px;color:var(--mid);margin-top:3px">Du hast noch keine Säule 3a — jetzt starten und Steuern sparen!</div>';
    box.style.display = 'block';
  }

  // aktuelles Guthaben in Simulation einrechnen wenn 3a aktiv
  state.saldo3a = balance;
}

function init() {
  load();

  // ── STEP 1: Apply mode IMMEDIATELY — nav is always visible, even if the rest fails ──
  applyMode(state.age < 18 ? 'youth' : 'adult');

  try {
    // Daten von ACP/Avaloq-Schnittstellen laden (Stubs im Mock-Modus)
    apiInit();

    // Default goals if first time
    if (state.goals.length === 0) {
      state.goals = defaultGoals.slice();
    }

    // Set age slider
    // Init spar input
    var sparIn = document.getElementById('goals-spar-input');
    var sparDsp = document.getElementById('goals-spar-display');
    if (sparIn) sparIn.value = state.sparGuthaben;
    if (sparDsp) sparDsp.textContent = state.sparGuthaben.toLocaleString('de-CH');

    // Init budget slider/input — null-checked so a missing element never aborts init
    var budSlider = document.getElementById('bud-slider');
    var budInput  = document.getElementById('bud-lohn-input');
    var budDisp   = document.getElementById('bud-lohn-display');
    if (budSlider) budSlider.value = state.lohn;
    if (budInput)  budInput.value  = state.lohn;
    if (budDisp)   budDisp.textContent = state.lohn.toLocaleString('de-CH');

    // Render all
    setAge(state.age);
    renderGoals();
    renderHaxx();
    calcBudget();
    renderFinlit();
    updateHomeCounts();

    // Invest-Screen init
    var ageFromEl = document.getElementById('inv-age-from');
    if (ageFromEl) ageFromEl.textContent = state.age;

    // Sparwert aus Budgetrechner als Invest-Defaultbetrag (bei jedem Start zurücksetzen)
    var invAmtEl = document.getElementById('inv-amount');
    invState.amount = state.monatlichesSparbudget || 200;
    if (invAmtEl) invAmtEl.value = invState.amount;

    // Invest-Typ-Box initial rendern (setzt Sparkonto-Guthaben-Box für 'frei')
    setInvType(invState.type);

    calcInvest();
    calcInvBoost();
    updateGamification();
  } catch (e) {
    console.warn('init() partial error (nav already applied):', e);
  }

  // ── STEP 2: Re-apply mode at end so any render side-effects are corrected ──
  applyMode(state.age < 18 ? 'youth' : 'adult');
}

init();

/* ================================================
   SWIPE NAVIGATION  (mode-aware)
================================================ */
var youthViewOrder = ['home', 'learn', 'goals', 'fun', 'haxx'];
var adultViewOrder = ['home', 'goals', 'haxx', 'budget', 'finlit', 'invest', 'fun'];

// Adult nav indices (used by switchView)
var adultNavIdx  = { home:0, goals:1, haxx:2, budget:3, finlit:4, invest:5, fun:6 };
// Youth switchView nav indices (adult-idx used for adult-nav highlight)
var youthNavIdx  = { home:0, goals:1, fun:6, haxx:2 };

function navigateToView(name) {
  if (name === 'learn') {
    switchYouthView('learn');
  } else if (state.mode === 'youth') {
    switchView(name, youthNavIdx[name] !== undefined ? youthNavIdx[name] : 0);
  } else {
    switchView(name, adultNavIdx[name] !== undefined ? adultNavIdx[name] : 0);
  }
}

var swipeStartX = 0;
var swipeStartY = 0;
var swipeLocked = false;

document.addEventListener('touchstart', function(e) {
  swipeStartX = e.touches[0].clientX;
  swipeStartY = e.touches[0].clientY;
  swipeLocked = false;
}, { passive: true });

document.addEventListener('touchmove', function(e) {
  if (swipeLocked) return;
  var dx = Math.abs(e.touches[0].clientX - swipeStartX);
  var dy = Math.abs(e.touches[0].clientY - swipeStartY);
  if (dy > dx) swipeLocked = true;
}, { passive: true });

document.addEventListener('touchend', function(e) {
  if (swipeLocked) return;
  var dx = e.changedTouches[0].clientX - swipeStartX;
  var dy = e.changedTouches[0].clientY - swipeStartY;
  if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.65) return;

  // Don't swipe when inside a horizontally scrolling container
  var t = e.target;
  while (t && t !== document.body) {
    if (t.scrollWidth > t.clientWidth + 4) return;
    t = t.parentElement;
  }

  // Don't swipe when inside the lesson panel
  if (document.getElementById('lesson-panel') &&
      document.getElementById('lesson-panel').classList.contains('open')) return;

  var order = (state.mode === 'youth') ? youthViewOrder : adultViewOrder;
  var idx   = order.indexOf(currentView);
  if (idx === -1) return;

  if (dx < 0 && idx < order.length - 1) {
    navigateToView(order[idx + 1]);
  } else if (dx > 0 && idx > 0) {
    navigateToView(order[idx - 1]);
  }
}, { passive: true });

/* ── Lesson-card swipe (inside lesson panel) ─────────────── */
var lessonSwipeStartX = 0;
var lessonSwipeLocked = false;

document.addEventListener('touchstart', function(e) {
  var panel = document.getElementById('lesson-panel');
  if (!panel || !panel.classList.contains('open')) return;
  lessonSwipeStartX = e.touches[0].clientX;
  lessonSwipeLocked = false;
}, { passive: true });

document.addEventListener('touchend', function(e) {
  var panel = document.getElementById('lesson-panel');
  if (!panel || !panel.classList.contains('open')) return;
  if (lessonSwipeLocked) return;
  var dx = e.changedTouches[0].clientX - lessonSwipeStartX;
  var dy = e.changedTouches[0].clientY - (swipeStartY || 0);
  if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx) * 0.8) return;
  if (dx < 0) {
    // Swipe left → next card
    advanceLessonCard();
  } else if (dx > 0 && currentCardIdx > 0) {
    // Swipe right → previous card (no progress loss)
    currentCardIdx--;
    showLessonCard();
  }
}, { passive: true });

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}