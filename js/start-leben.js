/* ============================================
   ENTWURF – Pixelmotive, die unter der Maus wachsen

   Verteilt liegen wenige kleine Motive aus zwei Sorten Zellen:
   gefuellt und umrandet. Beide sind gleich gross - die Kontur
   liegt innen, nicht auf der Kante.

   Verteilt liegen kleine Saaten aus Pixeln und ruhen. Faehrt der
   Zeiger ueber eine, steigt aus ihr eine Ranke auf und waechst nach
   oben. Die Spitze schlaegt seitlich aus und wird zugleich immer
   wieder nach oben gezogen - daher das Schlingern. Manchmal teilt
   sich eine Ranke, manchmal blueht an ihrer Spitze ein Motiv auf.

   Die Mausbewegung bestimmt das Tempo: bei ruhender Maus wachsen
   die Ranken ganz langsam weiter, je mehr bewegt wird desto
   schneller. Nur die Richtung haengt nicht mehr an ihr.

   Gezeichnet wird in echten Geraetepixeln. Bei dieser Zellgroesse
   waere eine Kontur aus strokeRect nur noch grauer Matsch - die
   Linie laege zur Haelfte neben dem Bildpunkt.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // Zwei Ebenen, damit Ranken vor UND hinter der Schrift laufen koennen -
  // eine einzelne Leinwand kann nicht beides sein. Gibt es die getrennten
  // Felder nicht, landen beide im selben und liegen dann uebereinander.
  const feldH = document.getElementById('leben-hinten')
             || document.getElementById('leben-feld');
  const feldV = document.getElementById('leben-vorn') || feldH;
  if (!feldH) return;
  const flaeche = feldH;

  const ZELLE  = 5;        // Kantenlaenge einer Zelle in CSS-Pixeln
  const NAHE   = 8;        // so nah muss der Zeiger zum Wecken, in Zellen
  // Beim Tippen liegt der Punkt unter der Fingerkuppe und waere nicht zu
  // sehen. Der Stab wird deshalb darueber gesetzt - mitsamt Schweif und
  // Weckpunkt, damit alles zusammenbleibt.
  const FINGER_VERSATZ = 46;   // in CSS-Pixeln

  // Jede Ranke zieht ihr Tempo selbst aus diesem Bereich. Die Maus weckt
  // nur noch, sie treibt nicht mehr an.
  const RANKE_TAKT_MIN = 50;   // ms je Schritt
  const RANKE_TAKT_MAX = 100;

  const DICHTE     = 120000;  // eine Saat je so vielen Bildschirmpixeln beim Start
  const NACHSCHUB  = 2600;    // ms, bis eine neue Saat auftaucht
  const RUHEND_MAX = 9;       // so viele duerfen gleichzeitig unberuehrt warten

  const SAAT_UNTEN = 0.9;     // Saaten liegen nur im untersten Zehntel

  // Nach dieser Zeit geht eine Zelle wieder ein. Weil die aeltesten zuerst
  // gehen, zieht sich eine Pflanze von unten her zurueck, statt auf einmal
  // zu verschwinden.
  const ZELL_LEBEN = 45000;     // ms
  // Dazu eine Obergrenze an der Flaeche. Allein ueber die Zeit ginge es
  // nicht auf: 45 s ergeben rund 14000 Zellen, das sind auf dem Desktop
  // ein Drittel der Flaeche, auf einem Handyschirm aber mehr als hineinpasst.
  const ZELL_ANTEIL = 0.22;     // hoechstens so viel der Flaeche bleibt stehen

  const RANKE_MAX      = 16;    // so viele Ranken wachsen hoechstens gleichzeitig
  const RANKE_FREI     = 4;     // so viele Plaetze bleiben fuer Beruehrungen frei
  const RANKE_LAENGE   = 320;   // nach so vielen Schritten ist eine Ranke fertig
  const RANKE_WANDER   = 0.55;  // wie weit sie seitlich ausschlaegt, im Bogenmass
  const RANKE_AUFRECHT = 0.06;  // wie stark es sie zurueck nach oben zieht
  const RANKE_ZWEIG    = 0.03;  // Wahrscheinlichkeit je Schritt, dass sie sich teilt
  const BLUETE         = 0.012; // Wahrscheinlichkeit, dass ein Motiv aufblueht

  // Der Zeiger selbst. Gezeichnet statt als CSS-Cursor gesetzt: ein SVG als
  // Cursor nimmt Safari nicht an, das kann dort nur Rasterbilder.
  const STAB = '\u{1FA84}';
  // Die Groesse kommt aus --text-nav, damit der Stab genauso gross ist wie
  // die Zeichen in den Buttons. Der Token ist ein clamp() und laesst sich
  // nicht direkt lesen - deshalb traegt die Leinwand ihn als font-size und
  // wir fragen den aufgeloesten Wert ab. Bei 5vw aendert er sich mit der
  // Fensterbreite, also wird er in messen() neu geholt.
  // Gilt fuer Zauberstab und Schoten gleichermassen - beide sollen so gross
  // sein wie die Zeichen in den Buttons.
  let zeichenGroesse = 32;     // in CSS-Pixeln
  // Wo im Zeichen die Spitze sitzt, als Anteil seiner Groesse. Der Stab
  // laeuft diagonal, der Griff unten links, die Funken oben rechts - dort
  // soll der Mauspunkt liegen, damit der Schweif aus der Spitze kommt.
  const STAB_SPITZE_X = 0.59;
  const STAB_SPITZE_Y = 0.22;

  const SCHWEIF_LEBEN = 420;   // ms, bis eine Schweifzelle wieder verschwindet
  const SCHWEIF_BREITE = 1;    // Streuung um den Zeiger, in Zellen
  const SCHWEIF_ZELLEN = 1;    // so viele Zellen je Mausmeldung

  // Jede Zelle ist eine volle Flaeche in einer dieser Farben, zufaellig gezogen.
  const FARBEN = [
    'rgb(254, 118, 254)',   // 0  rosa,   --color-pink
    'rgb(255, 80, 0)',      // 1  orange, --color-orange
    'rgb(214, 243, 0)',     // 2  lime,   --color-lime
    'rgb(0, 223, 115)',     // 3  gruen,  --color-green
    'rgb(49, 75, 245)',     // 4  blau,   --color-blue
  ];

  const ROSA  = 0;   // die Farbe des Schweifs
  const GRUEN = 3;   // die Grundfarbe der Ranken
  // Die Ranken sind gruen. Nur vereinzelt sprenkelt eine andere Akzentfarbe
  // dazwischen - welche, sagt eine Zone an dieser Stelle. Dadurch haben
  // benachbarte Sprenkel dieselbe Farbe, statt wahllos zu flimmern.
  const FARBZONE = 450;     // Zellen je Zone - bestimmt, wie gross sie wird
  const SPRENKEL = 0.07;    // Anteil der Zellen, der nicht gruen ist

  let zonen = [];

  const zonenAnlegen = () => {
    const anzahl = Math.max(3, Math.round(spalten * zeilen / FARBZONE));
    zonen = [];
    for (let i = 0; i < anzahl; i++) {
      zonen.push({
        x: Math.random() * spalten,
        y: Math.random() * zeilen,
        farbe: Math.floor(Math.random() * FARBEN.length),
      });
    }
  };

  // Die Farbe der naechstgelegenen Zone
  const zoneAn = (x, y) => {
    if (!zonen.length) return GRUEN;
    let beste = zonen[0], kuerzeste = Infinity;
    for (const z of zonen) {
      const d = (z.x - x) * (z.x - x) + (z.y - y) * (z.y - y);
      if (d < kuerzeste) { kuerzeste = d; beste = z; }
    }
    return beste.farbe;
  };

  const farbeRanke = (x, y) => {
    if (Math.random() >= SPRENKEL) return GRUEN;
    const z = zoneAn(x, y);
    // Liegt hier eine gruene Zone, waere der Sprenkel unsichtbar -
    // dann eine der anderen nehmen.
    if (z !== GRUEN) return z;
    let andere = Math.floor(Math.random() * (FARBEN.length - 1));
    return andere >= GRUEN ? andere + 1 : andere;
  };

  // Ein grobes Rauschfeld legt fest, wo die Ranke dick wird und wo sie ein
  // duenner Faden bleibt. Daher die flaechigen und die luftigen Stellen.
  const RAUSCH = 14;           // Abstand der Stuetzpunkte, in Zellen

  // Motive als Bildchen. x und o setzen beide eine Zelle - welche Farbe
  // sie bekommt, wird bei jedem Aufbau neu gewuerfelt. - ist leer.
  const MOTIVE = [
    ['-o-',        // Kreuz mit gefuelltem Kern
     'oxo',
     '-o-'],
    ['-x-',        // Kreuz mit offenem Kern
     'xox',
     'xox',
     '-x-'],
    ['oxo',        // T
     '-o-',
     '---'],
    ['-xo',        // Treppe
     'xo-',
     '-xo'],
     ['-x-',        // Treppe
     'xox',
     'o-o'],
     ['-xx',        // Treppe
     'o-x',
     '-o-'],
  ];

  const neueLeinwand = (eltern, kennung) => {
    const c = document.createElement('canvas');
    c.id = kennung;
    c.className = 'leben-canvas';
    eltern.appendChild(c);
    return c;
  };

  // hinten liegt unter der Schrift, vorn darueber
  const leinwandH = neueLeinwand(feldH, 'leben-canvas');
  const leinwandV = feldV === feldH ? leinwandH : neueLeinwand(feldV, 'leben-canvas-vorn');
  const ctxH = leinwandH.getContext('2d');
  const ctxV = leinwandV.getContext('2d');

  // Schweif und Zauberstab gehoeren immer nach ganz vorn
  const leinwand = leinwandV;
  const ctx = ctxV;

  // Die gewachsenen Zellen stehen still und werden nur fortgeschrieben.
  // Der Schweif dagegen aendert sich jeden Frame. Beides zusammen jedes
  // Mal neu zu zeichnen hiesse, tausende Quadrate sechzigmal je Sekunde
  // zu setzen - deshalb liegen die stehenden auf einer eigenen Leinwand,
  // die nur blitweise darueberkopiert wird.
  const grundH = document.createElement('canvas');
  const grundV = document.createElement('canvas');
  const gctxH = grundH.getContext('2d');
  const gctxV = grundV.getContext('2d');
  const grundVon = (vorn) => (vorn ? gctxV : gctxH);

  let dpr = 1, Z = 5;               // in Geraetepixeln
  let spalten = 0, zeilen = 0;

  const arten   = new Map();        // "x,y" -> { f: Farbindex, v: liegt vorn, t: gesetzt }
  // Dieselben Schluessel in der Reihenfolge ihres Entstehens. Da alle Zellen
  // gleich lang leben, steht die naechste faellige immer vorn - das Aufraeumen
  // kostet dadurch nichts, egal wie viel gewachsen ist.
  const reihenfolge = [];
  let   erste = 0;                  // Zeiger auf die aelteste noch lebende
  // Der Schweif: "x,y" -> { farbe, geboren }. Getrennt von arten, weil er
  // wieder vergeht und dem Wachstum nicht im Weg stehen soll.
  const schweif = new Map();
  let   ranken  = [];               // { x, y, winkel } - die wachsenden Spitzen
  let   saaten  = [];               // { zellen } - was auf Beruehrung wartet
  const schluessel = (x, y) => x + ',' + y;

  // Ein Feld auf eine der beiden Leinwaende malen
  const feld = (c, x, y, farbe) => {
    c.fillStyle = FARBEN[farbe];
    c.fillRect(x * Z, y * Z, Z, Z);
  };


  // --- Rauschfeld ---
  // Zufallswerte auf einem groben Gitter, dazwischen weich verlaufend.
  // Mehr braucht es nicht: es soll nur sanft zwischen dicht und locker
  // wandern und so flaechige und luftige Stellen vorgeben.
  let rauschen = new Float32Array(0), rauschBreite = 0;

  const rauschAnlegen = () => {
    rauschBreite  = Math.ceil(spalten / RAUSCH) + 2;
    const hoehe   = Math.ceil(zeilen  / RAUSCH) + 2;
    rauschen = new Float32Array(rauschBreite * hoehe);
    for (let i = 0; i < rauschen.length; i++) rauschen[i] = Math.random();
  };

  // Weicher Verlauf statt gerader Rampe - sonst sieht man das Gitter
  const glatt = (t) => t * t * (3 - 2 * t);

  const dichteAn = (x, y) => {
    const gx = x / RAUSCH, gy = y / RAUSCH;
    const x0 = Math.floor(gx), y0 = Math.floor(gy);
    const tx = glatt(gx - x0), ty = glatt(gy - y0);
    const o = y0 * rauschBreite + x0;
    const a = rauschen[o], b = rauschen[o + 1];
    const c = rauschen[o + rauschBreite], d = rauschen[o + rauschBreite + 1];
    return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
  };

  // Eine einzelne Zelle setzen, wenn der Platz noch frei ist. Die Farbe
  // kommt aus der Zone, in der sie liegt.
  const zelleSetzen = (x, y, vorn) => {
    if (x < 0 || y < 0 || x >= spalten || y >= zeilen) return;
    const k = schluessel(x, y);
    if (arten.has(k)) return;
    const f = farbeRanke(x, y);
    arten.set(k, { f, v: vorn, t: performance.now() });
    reihenfolge.push(k);
    feld(grundVon(vorn), x, y, f);
  };

  // Abgelaufene Zellen wegwischen. Zellen ueberlagern sich nie, deshalb
  // laesst sich jede einzeln aus ihrer Ebene loeschen, ohne alles neu zu
  // zeichnen. Liefert true, wenn sich etwas geaendert hat.
  const eingehenLassen = (t) => {
    const grenze = Math.round(spalten * zeilen * ZELL_ANTEIL);
    let etwas = false;
    while (erste < reihenfolge.length) {
      const k = reihenfolge[erste];
      const zelle = arten.get(k);
      // Entweder zu alt, oder es steht schon zu viel - in beiden Faellen
      // geht die aelteste Zelle zuerst.
      if (zelle && t - zelle.t < ZELL_LEBEN && arten.size <= grenze) break;
      erste++;
      if (!zelle) continue;
      arten.delete(k);
      const i = k.indexOf(',');
      (zelle.v ? gctxV : gctxH).clearRect(+k.slice(0, i) * Z, +k.slice(i + 1) * Z, Z, Z);
      etwas = true;
    }
    // Den abgearbeiteten Anfang gelegentlich abschneiden, damit die Liste
    // nicht endlos mitwaechst
    if (erste > 2000) { reihenfolge.splice(0, erste); erste = 0; }
    return etwas;
  };

  // Ein Motiv aufbluehen lassen, mittig um die Spitze der Ranke
  const motivSetzen = (mx, my, vorn) => {
    const bild = MOTIVE[Math.floor(Math.random() * MOTIVE.length)];
    const ox = mx - (bild[0].length >> 1);
    const oy = my - (bild.length    >> 1);
    for (let y = 0; y < bild.length; y++) {
      for (let x = 0; x < bild[y].length; x++) {
        if (bild[y][x] !== '-') zelleSetzen(ox + x, oy + y, vorn);
      }
    }
  };

  // Eine neue Ranke. Ohne Angaben setzt sie unten am Rand an und waechst
  // nach oben; mit Angaben ist sie ein Zweig, der von einer anderen abgeht.
  // dringend = die Anfrage kommt von einer Beruehrung. Die soll immer
  // etwas ausloesen, deshalb macht dann die aelteste Ranke Platz - sie
  // hat am laengsten wachsen koennen. Zweige warten dagegen ab.
  const rankeSetzen = (x, y, winkel, dringend, vorn) => {
    if (ranken.length >= RANKE_MAX) {
      if (!dringend) return false;
      let aelteste = 0;
      for (let i = 1; i < ranken.length; i++) {
        if (ranken[i].schritte > ranken[aelteste].schritte) aelteste = i;
      }
      ranken.splice(aelteste, 1);
    }
    ranken.push({
      x: x === undefined ? Math.random() * spalten : x,
      y: y === undefined ? zeilen - 1 : y,
      // -PI/2 zeigt nach oben. Der Zufall am Anfang gibt jeder Ranke
      // eine eigene Neigung, damit nicht alle gleich loslaufen.
      winkel: winkel === undefined ? -Math.PI / 2 + (Math.random() - 0.5) * 0.7 : winkel,
      schritte: 0,
      decke: 0,   // 0 = steigt noch, sonst +1/-1 fuer die Laufrichtung oben
      // Jede Ranke hat ihr eigenes Tempo, unabhaengig von der Maus
      takt: RANKE_TAKT_MIN + Math.random() * (RANKE_TAKT_MAX - RANKE_TAKT_MIN),
      letzter: 0,
      vorn: vorn === undefined ? Math.random() < 0.5 : vorn,
    });
    return true;
  };

  // Ein Schritt. Liefert false, wenn die Ranke ausgewachsen ist.
  const rankeSchritt = (r) => {
    if (++r.schritte > RANKE_LAENGE) return false;

    // Wohin sie gezogen wird: nach oben, solange sie steigt - und waagerecht,
    // sobald sie oben angekommen ist. Fuer die linke Richtung -PI statt PI,
    // sonst muesste der Winkel ueber den Sprung bei PI hinweg wandern.
    const ziel = r.decke === 0 ? -Math.PI / 2 : (r.decke > 0 ? 0 : -Math.PI);

    // Seitlich ausschlagen, aber immer wieder zum Ziel gezogen werden.
    // Aus diesen beiden Kraeften entsteht das Schlingern.
    r.winkel += (Math.random() - 0.5) * RANKE_WANDER;
    r.winkel += (ziel - r.winkel) * RANKE_AUFRECHT;

    // Ein Schritt ist genau eine Zelle lang, dadurch haengen die Zellen
    // zusammen statt Luecken zu lassen.
    r.x += Math.cos(r.winkel);
    r.y += Math.sin(r.winkel);

    // An der Decke: nicht hinauswachsen, sondern oben entlanglaufen.
    // Die Laufrichtung wird einmal festgelegt und bleibt dann.
    if (r.y < 1) {
      r.y = 1;
      if (r.decke === 0) r.decke = Math.cos(r.winkel) >= 0 ? 1 : -1;
    } else if (r.y > zeilen - 2) {
      // Unten festhalten. Sonst liefe eine Ranke, die nach unten ausschlaegt,
      // unsichtbar unter dem Bildrand weiter und belegte dabei einen Platz.
      r.y = zeilen - 2;
    }
    // An den Seiten abprallen, statt aus dem Bild zu laufen
    if (r.x < 1) {
      r.x = 1;
      r.winkel = Math.PI - r.winkel;
      if (r.decke !== 0) r.decke = 1;
    } else if (r.x > spalten - 2) {
      r.x = spalten - 2;
      r.winkel = Math.PI - r.winkel;
      if (r.decke !== 0) r.decke = -1;
    }

    const x = Math.round(r.x), y = Math.round(r.y);
    zelleSetzen(x, y, r.vorn);

    // In dichten Zonen legt sie quer noch eine Zelle dazu und wird zum
    // Band, in luftigen bleibt sie ein einzelner Faden.
    if (Math.random() < dichteAn(x, y)) {
      const quer = r.winkel + Math.PI / 2;
      zelleSetzen(Math.round(r.x + Math.cos(quer)), Math.round(r.y + Math.sin(quer)), r.vorn);
    }

    // Zweige duerfen nicht alle Plaetze belegen, sonst liefe eine
    // Beruehrung ins Leere, obwohl es aussieht als waere noch Luft.
    if (ranken.length < RANKE_MAX - RANKE_FREI && Math.random() < RANKE_ZWEIG) {
      // Der Zweig bleibt auf der Ebene seiner Ranke
      rankeSetzen(r.x, r.y, r.winkel + (Math.random() < 0.5 ? 0.75 : -0.75), false, r.vorn);
    }
    if (Math.random() < BLUETE) motivSetzen(x, y, r.vorn);

    return true;
  };

  // Eine ruhende Saat an eine freie Stelle setzen. Liefert false, wenn nach
  // mehreren Versuchen kein Platz zu finden war - das Feld ist dann voll.
  const saatSetzen = () => {
    const bild = MOTIVE[Math.floor(Math.random() * MOTIVE.length)];
    // Einmal ausgewuerfelt und dann beibehalten: die Ranke, die spaeter aus
    // dieser Saat aufsteigt, erbt die Ebene. So laeuft eine Pflanze komplett
    // vor oder komplett hinter der Schrift, statt mittendrin zu wechseln.
    const vorn = Math.random() < 0.5;
    const b = bild[0].length, h = bild.length;

    for (let versuch = 0; versuch < 40; versuch++) {
      const ox = 1 + Math.floor(Math.random() * (spalten - b - 2));
      // Nur im unteren Teil der Seite - von dort ranken sie nach oben
      const oyAb     = Math.floor(zeilen * SAAT_UNTEN);
      const oySpanne = Math.max(1, zeilen - h - 1 - oyAb);
      const oy = oyAb + Math.floor(Math.random() * oySpanne);

      // Mit einer Zelle Rand ringsum pruefen, damit eine neue Saat nicht
      // an einer Ranke klebt und als deren Auslaeufer gelesen wird.
      let frei = true;
      for (let y = -1; y <= h && frei; y++) {
        for (let x = -1; x <= b; x++) {
          if (arten.has(schluessel(ox + x, oy + y))) { frei = false; break; }
        }
      }
      if (!frei) continue;

      const zellen = [];
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < bild[y].length; x++) {
          if (bild[y][x] === '-') continue;
          zelleSetzen(ox + x, oy + y, vorn);
          zellen.push([ox + x, oy + y]);
        }
      }
      saaten.push({ zellen, vorn, geboren: performance.now() });
      return true;
    }
    return false;
  };

  const setzen = () => {
    arten.clear();
    reihenfolge.length = 0;
    erste = 0;
    ranken = [];
    saaten = [];
    rauschAnlegen();
    zonenAnlegen();
    const anzahl = Math.max(4, Math.round(spalten * Z * zeilen * Z / (DICHTE * dpr * dpr)));
    for (let i = 0; i < anzahl; i++) saatSetzen();
  };

  const messen = () => {
    const kasten = flaeche.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    Z = Math.max(2, Math.round(ZELLE  * dpr));
    // Auf ganze Geraetepixel gerundet: ein halber Pixel laesst sich nicht
    // zeichnen, Canvas wuerde die Kante grau verwaschen. Nach oben begrenzt,
    // damit innen mindestens ein Pixel Papier bleibt - sonst verschluckte
    // die Kontur die ganze Zelle und aus umrandet wuerde gefuellt.
    const breite = Math.round(kasten.width  * dpr);
    const hoehe  = Math.round(kasten.height * dpr);
    for (const c of new Set([leinwandH, leinwandV, grundH, grundV])) {
      c.width = breite; c.height = hoehe;
      if (c.style) { c.style.width = kasten.width + 'px'; c.style.height = kasten.height + 'px'; }
    }
    // In Geraetepixeln rechnen
    for (const c of new Set([ctxH, ctxV, gctxH, gctxV])) c.setTransform(1, 0, 0, 1, 0, 0);
    spalten = Math.floor(leinwand.width  / Z);
    zeilen  = Math.floor(leinwand.height / Z);
    zeichenGroesse = parseFloat(getComputedStyle(leinwand).fontSize) || 32;
    setzen();
  };

  // --- Zeichnen ---
  // Alle stehenden Zellen neu auf die Grundleinwand. Nur noetig, wenn sich
  // das ganze Feld aendert - beim Aufbau und wenn das Fenster umspringt.
  const grundZeichnen = () => {
    gctxH.clearRect(0, 0, grundH.width, grundH.height);
    gctxV.clearRect(0, 0, grundV.width, grundV.height);

    // Je Ebene ein Korb pro Farbe, damit fillStyle selten wechselt
    const koerbe = [FARBEN.map(() => []), FARBEN.map(() => [])];
    arten.forEach((zelle, s) => { koerbe[zelle.v ? 1 : 0][zelle.f].push(s); });

    koerbe.forEach((satz, ebene) => {
      const c = ebene ? gctxV : gctxH;
      satz.forEach((korb, farbe) => {
        if (!korb.length) return;
        c.fillStyle = FARBEN[farbe];
        for (const s of korb) {
          const i = s.indexOf(',');
          c.fillRect(+s.slice(0, i) * Z, +s.slice(i + 1) * Z, Z, Z);
        }
      });
    });
  };

  // Was man sieht: die Grundleinwand, darauf der Schweif.
  const darstellen = () => {
    if (leinwandH !== leinwandV) {
      ctxH.clearRect(0, 0, leinwandH.width, leinwandH.height);
      ctxH.drawImage(grundH, 0, 0);
    }
    ctx.clearRect(0, 0, leinwand.width, leinwand.height);
    // Liegen beide Ebenen auf derselben Leinwand, kommt die hintere zuerst
    if (leinwandH === leinwandV) ctx.drawImage(grundH, 0, 0);
    ctx.drawImage(grundV, 0, 0);
    schweif.forEach((spur, s) => {
      const i = s.indexOf(',');
      feld(ctx, +s.slice(0, i), +s.slice(i + 1), spur.farbe);
    });

    if (zeigerDa) {
      const g = zeichenGroesse * dpr;
      ctx.font = g + 'px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(STAB, mausX - g * STAB_SPITZE_X, mausY - g * STAB_SPITZE_Y);
    }
  };

  // --- Maus ---
  // Sie bestimmt nicht mehr, wohin gewachsen wird - aber sie weckt die
  // Saaten und gibt mit ihrer Bewegung das Tempo vor.
  let mausX = 0, mausY = 0;      // Zeigerposition in Geraetepixeln
  let zeigerDa = false;          // liegt er ueber der Flaeche
  let bedarf = false;            // einmal neu zeichnen, auch ohne Schweif

  const zeigerMelden = (e) => {
    const kasten = leinwand.getBoundingClientRect();
    mausX = (e.clientX - kasten.left) * dpr;
    mausY = (e.clientY - kasten.top)  * dpr;
    // Beim Tippen ueber die Fingerkuppe heben
    if (e.pointerType !== 'mouse') mausY -= FINGER_VERSATZ * dpr;
    zeigerDa = true;
    bedarf = true;

    const zx = Math.floor(mausX / Z), zy = Math.floor(mausY / Z);

    // Beruehrung weckt eine Saat: aus ihrer obersten Zelle steigt eine
    // Ranke auf. Von da an waechst sie von allein weiter - nach oben,
    // nicht zum Zeiger.
    // Rueckwaerts gezaehlt, weil die geweckte Saat aus der Liste fliegt.
    // Sie wird danach nicht mehr gebraucht - ihre Zellen stehen laengst
    // in arten - und die Liste bliebe sonst endlos wachsen und wuerde bei
    // jeder Mausmeldung komplett durchsucht.
    for (let i = saaten.length - 1; i >= 0; i--) {
      const saat = saaten[i];
      if (!saat.zellen.some(([x, y]) =>
            Math.abs(x - zx) <= NAHE && Math.abs(y - zy) <= NAHE)) continue;
      let oben = saat.zellen[0];
      for (const z of saat.zellen) if (z[1] < oben[1]) oben = z;
      rankeSetzen(oben[0], oben[1], undefined, true, saat.vorn);
      saaten.splice(i, 1);
      bedarf = true;
    }

    // Der Schweif: ein paar Zellen um den Zeiger, leicht gestreut, damit
    // es ausfranst statt eine saubere Linie zu ziehen. Sie verschwinden
    // nach SCHWEIF_LEBEN von allein wieder, aelteste zuerst - dadurch
    // zieht der Schweif hinterher und wird nach hinten kuerzer.
    const jetzt = performance.now();
    for (let i = 0; i < SCHWEIF_ZELLEN; i++) {
      const sx = zx + Math.round((Math.random() * 2 - 1) * SCHWEIF_BREITE);
      const sy = zy + Math.round((Math.random() * 2 - 1) * SCHWEIF_BREITE);
      if (sx < 0 || sy < 0 || sx >= spalten || sy >= zeilen) continue;
      const k = schluessel(sx, sy);
      const da = schweif.get(k);
      // Schon belegt: nur die Uhr zuruecksetzen, damit die Farbe nicht flackert
      if (da) da.geboren = jetzt;
      else schweif.set(k, { farbe: ROSA, geboren: jetzt });
    }
  };

  // Am Fenster, nicht am Feld: auf der Startseite liegen Formen darueber,
  // und waehrend der Zeiger ueber einer von ihnen ist, bekaeme das Feld
  // keine Meldung mehr - der Zauberstab bliebe stehen.
  // pointerdown gehoert dazu: beim Tippen ohne Ziehen kommt sonst gar
  // keine Meldung und der Stab bliebe, wo er zuletzt war.
  window.addEventListener('pointermove', zeigerMelden);
  window.addEventListener('pointerdown', zeigerMelden);

  // Nur die Maus verlaesst die Seite wirklich. Beim Tippen endet der Zeiger
  // mit dem Abheben - da soll der Stab liegenbleiben statt zu verschwinden.
  document.addEventListener('pointerleave', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    zeigerDa = false;
    bedarf = true;
  });

  // --- Schleife ---
  let letzteSaat = 0;
  const schleife = (t) => {
    let neu = false;

    // Jede Ranke geht in ihrem eigenen Takt weiter. Rueckwaerts gezaehlt,
    // damit das Herausnehmen einer fertigen Ranke die Zaehlung nicht
    // verschiebt - und damit Zweige erst im naechsten Durchgang dran sind.
    for (let i = ranken.length - 1; i >= 0; i--) {
      const r = ranken[i];
      if (t - r.letzter < r.takt) continue;
      r.letzter = t;
      if (rankeSchritt(r)) neu = true;
      else ranken.splice(i, 1);
    }

    // Nachschub: solange nicht genug unberuehrte Saaten warten, taucht alle
    // NACHSCHUB ms eine neue auf. Gezaehlt werden nur die ruhenden - geweckte
    // zaehlen nicht mehr, sonst versiegt der Nachschub.
    if (t - letzteSaat >= NACHSCHUB) {
      letzteSaat = t;
      // In der Liste stehen nur noch ruhende - geweckte fliegen heraus.
      if (saaten.length < RUHEND_MAX && saatSetzen()) neu = true;
    }

    // Was zu alt ist, geht wieder ein
    let weg = eingehenLassen(t);

    // Ruhende Saaten, deren Zellen inzwischen vergangen sind, mitnehmen -
    // sonst bliebe ein Eintrag stehen, dessen Pflanze es nicht mehr gibt.
    for (let i = saaten.length - 1; i >= 0; i--) {
      if (t - saaten[i].geboren >= ZELL_LEBEN) saaten.splice(i, 1);
    }

    // Abgelaufene Schweifzellen raeumen
    schweif.forEach((spur, k) => {
      if (t - spur.geboren >= SCHWEIF_LEBEN) { schweif.delete(k); weg = true; }
    });

    if (neu || weg || schweif.size || bedarf) { darstellen(); bedarf = false; }
    requestAnimationFrame(schleife);
  };

  window.addEventListener('resize', () => { messen(); grundZeichnen(); darstellen(); });
  messen();
  grundZeichnen();
  darstellen();
  requestAnimationFrame(schleife);
});
